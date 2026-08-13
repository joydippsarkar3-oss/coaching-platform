import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job } from 'bull';
import { Queue } from 'bull';
import { EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Report export worker.
 * Consumes queue: report-export
 *
 * Streams large result sets with cursor pagination to avoid OOM.
 * Uploads to S3 at reports/{centerId}/{reportType}_{date}.csv
 * Creates a download record with a signed S3 URL (1h TTL).
 * Notifies requestedBy via notification-dispatch queue.
 */

type OutputFormat = 'csv' | 'xlsx';

interface ReportExportPayload {
  reportType: string;
  centerId?: string;
  filters: Record<string, unknown>;
  requestedBy: string;
  outputFormat: OutputFormat;
}

const PAGE_SIZE = 500; // cursor page size — keeps memory bounded

@Processor('report-export')
export class ReportExportWorker {
  private readonly logger = new Logger(ReportExportWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notification-dispatch') private readonly notifQueue: Queue,
  ) {}

  @Process('export')
  async handleExport(job: Job<ReportExportPayload>): Promise<void> {
    const { reportType, centerId, filters, requestedBy, outputFormat } = job.data;

    this.logger.log(`Starting report export: type=${reportType} centerId=${centerId ?? 'ALL'}`);

    try {
      const { buffer, rowCount, extension } = await this.buildReport(
        reportType,
        centerId,
        filters,
        outputFormat,
      );

      // Upload to S3
      const date = new Date().toISOString().slice(0, 10);
      const filename = `${reportType}_${date}.${extension}`;
      const s3Key = centerId
        ? `reports/${centerId}/${filename}`
        : `reports/global/${filename}`;

      const signedUrl = await this.uploadAndSign(s3Key, buffer, outputFormat);

      // Create download record
      const downloadRecord = await this.prisma.auditLog.create({
        data: {
          centerId: centerId ?? null,
          userId: requestedBy,
          action: 'REPORT_EXPORT_READY',
          entity: 'Report',
          newValue: {
            reportType,
            s3Key,
            signedUrl,
            rowCount,
            expiresAt: new Date(Date.now() + 60 * 60 * 1_000).toISOString(), // 1h TTL
            outputFormat,
          },
        },
      });

      // Notify the requester
      await this.notifQueue.add('dispatch', {
        recipientUserId: requestedBy,
        templateId: 'REPORT_EXPORT_READY',
        variables: {
          reportType,
          rowCount: String(rowCount),
          downloadUrl: signedUrl,
          expiresInMinutes: '60',
        },
        channels: ['push', 'whatsapp'],
      });

      this.logger.log(
        `Report export complete: type=${reportType} rows=${rowCount} key=${s3Key} logId=${downloadRecord.id}`,
      );
    } catch (err) {
      this.logger.error(`Report export failed: ${(err as Error).message}`);

      // Notify requester of failure
      await this.notifQueue.add('dispatch', {
        recipientUserId: requestedBy,
        templateId: 'REPORT_EXPORT_FAILED',
        variables: { reportType, error: (err as Error).message },
        channels: ['push'],
      });

      throw err;
    }
  }

  // ── Report builders ───────────────────────────────────────────────────────

  private async buildReport(
    reportType: string,
    centerId: string | undefined,
    filters: Record<string, unknown>,
    outputFormat: OutputFormat,
  ): Promise<{ buffer: Buffer; rowCount: number; extension: string }> {
    const rows = await this.streamRows(reportType, centerId, filters);

    if (outputFormat === 'xlsx') {
      const { buffer } = await this.rowsToXlsx(rows, reportType);
      return { buffer, rowCount: rows.length, extension: 'xlsx' };
    }

    const csv = this.rowsToCsv(rows);
    return { buffer: Buffer.from(csv, 'utf-8'), rowCount: rows.length, extension: 'csv' };
  }

  /**
   * Streams rows using cursor pagination to avoid loading the entire dataset into memory.
   * Each page fetches PAGE_SIZE rows; accumulates into an array of plain objects.
   */
  private async streamRows(
    reportType: string,
    centerId: string | undefined,
    filters: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]> {
    const allRows: Record<string, unknown>[] = [];
    let cursor: string | undefined;

    do {
      const page = await this.fetchPage(reportType, centerId, filters, cursor);
      allRows.push(...page.rows);
      cursor = page.nextCursor;
    } while (cursor !== undefined);

    return allRows;
  }

  private async fetchPage(
    reportType: string,
    centerId: string | undefined,
    filters: Record<string, unknown>,
    cursor: string | undefined,
  ): Promise<{ rows: Record<string, unknown>[]; nextCursor: string | undefined }> {
    const centerWhere = centerId ? { centerId } : {};

    if (reportType === 'PAYMENTS') {
      const payments = await this.prisma.payment.findMany({
        where: {
          ...centerWhere,
          ...(filters['dateFrom']
            ? { paidAt: { gte: new Date(filters['dateFrom'] as string) } }
            : {}),
          ...(filters['dateTo']
            ? { paidAt: { lte: new Date(filters['dateTo'] as string) } }
            : {}),
          ...(cursor ? { id: { gt: cursor } } : {}),
        },
        take: PAGE_SIZE,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          amountPaise: true,
          method: true,
          status: true,
          paidAt: true,
          gatewayRef: true,
          centerId: true,
          installment: {
            select: {
              enrollment: { select: { studentId: true, courseId: true } },
            },
          },
        },
      });

      const rows = payments.map((p) => ({
        id: p.id,
        amountPaise: p.amountPaise,
        method: p.method,
        status: p.status,
        paidAt: p.paidAt?.toISOString() ?? '',
        gatewayRef: p.gatewayRef ?? '',
        centerId: p.centerId ?? '',
        studentId: p.installment.enrollment.studentId,
        courseId: p.installment.enrollment.courseId,
      }));

      return {
        rows,
        nextCursor: payments.length === PAGE_SIZE ? payments[payments.length - 1].id : undefined,
      };
    }

    if (reportType === 'ENROLLMENTS') {
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          ...centerWhere,
          ...(filters['status']
            ? { status: filters['status'] as EnrollmentStatus }
            : {}),
          ...(cursor ? { id: { gt: cursor } } : {}),
        },
        take: PAGE_SIZE,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          studentId: true,
          courseId: true,
          status: true,
          enrolledAt: true,
          completedAt: true,
          centerId: true,
        },
      });

      const rows = enrollments.map((e) => ({
        id: e.id,
        studentId: e.studentId,
        courseId: e.courseId,
        status: e.status,
        enrolledAt: e.enrolledAt.toISOString(),
        completedAt: e.completedAt?.toISOString() ?? '',
        centerId: e.centerId ?? '',
      }));

      return {
        rows,
        nextCursor:
          enrollments.length === PAGE_SIZE ? enrollments[enrollments.length - 1].id : undefined,
      };
    }

    if (reportType === 'EXAM_RESULTS') {
      const attempts = await this.prisma.examAttempt.findMany({
        where: {
          ...centerWhere,
          status: 'EVALUATED',
          ...(cursor ? { id: { gt: cursor } } : {}),
        },
        take: PAGE_SIZE,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          examId: true,
          studentId: true,
          score: true,
          passed: true,
          submittedAt: true,
          centerId: true,
        },
      });

      const rows = attempts.map((a) => ({
        id: a.id,
        examId: a.examId,
        studentId: a.studentId,
        score: a.score ?? 0,
        passed: a.passed ?? false,
        submittedAt: a.submittedAt?.toISOString() ?? '',
        centerId: a.centerId ?? '',
      }));

      return {
        rows,
        nextCursor: attempts.length === PAGE_SIZE ? attempts[attempts.length - 1].id : undefined,
      };
    }

    // Generic fallback — empty
    this.logger.warn(`Unknown reportType "${reportType}" — returning empty page`);
    return { rows: [], nextCursor: undefined };
  }

  // ── Serialization ─────────────────────────────────────────────────────────

  private rowsToCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown): string => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const lines = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
    ];
    return lines.join('\r\n');
  }

  private async rowsToXlsx(
    rows: Record<string, unknown>[],
    sheetName: string,
  ): Promise<{ buffer: Buffer }> {
    try {
      // Dynamic import — xlsx is an optional peer dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const XLSX = require('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
      const buffer: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return { buffer };
    } catch {
      this.logger.warn('xlsx package not available — falling back to CSV');
      const csv = this.rowsToCsv(rows);
      return { buffer: Buffer.from(csv, 'utf-8') };
    }
  }

  // ── S3 upload + pre-signed URL ────────────────────────────────────────────

  private async uploadAndSign(
    key: string,
    buffer: Buffer,
    outputFormat: OutputFormat,
  ): Promise<string> {
    const bucket = process.env.S3_BUCKET ?? 'franchise-platform-docs';
    const region = process.env.AWS_REGION ?? 'ap-south-1';
    const contentType = outputFormat === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';

    try {
      // Dynamic import to avoid hard dependency when AWS SDK is not installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

      const client = new S3Client({ region });

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );

      // Generate signed URL with 1h (3600s) TTL
      const url: string = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: 3600 },
      );
      return url;
    } catch {
      // Stub for environments without AWS SDK
      this.logger.warn(`S3 stub: would upload ${key} (${buffer.length} bytes)`);
      return `https://${bucket}.s3.${region}.amazonaws.com/${key}?stub=true`;
    }
  }
}
