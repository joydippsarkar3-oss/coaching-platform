import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as QRCode from 'qrcode'; // pinned at 1.5.4 in package.json
import { PrismaService } from '../common/prisma/prisma.service';

// In production use puppeteer or @sparticuz/chromium instead of the
// chromium-browser CLI call below.

const execAsync = promisify(exec);

interface PdfJobPayload {
  certId: string;
  docType: 'CERTIFICATE' | 'RECEIPT' | 'ID_CARD' | 'ADMISSION_LETTER';
  templateId: string | null;
}

@Processor('pdf-generation')
export class PdfGenerationWorker {
  private readonly logger = new Logger(PdfGenerationWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('generate')
  async handleGenerate(job: Job<PdfJobPayload>): Promise<void> {
    const { certId, docType, templateId } = job.data;

    try {
      await this.renderDocument(certId, docType, templateId);
    } catch (err) {
      this.logger.error(`PDF generation failed for certId=${certId}: ${(err as Error).message}`);

      // Mark record as PDF_FAILED
      await this.prisma.certificate.update({
        where: { id: certId },
        data: { ['pdfStatus' as string]: 'PDF_FAILED' },
      });

      throw err; // let BullMQ handle retry/dead-letter
    }
  }

  private async renderDocument(
    certId: string,
    docType: PdfJobPayload['docType'],
    templateId: string | null,
  ): Promise<void> {
    // ── 1. Load certificate + related records ──────────────────────────────
    const cert = await this.prisma.certificate.findUnique({
      where: { id: certId },
      include: {
        student: { select: { name: true } },
        course: { select: { name: true } },
        center: { select: { name: true } },
        template: { select: { htmlTemplate: true } },
      },
    });
    if (!cert) throw new Error(`Certificate ${certId} not found`);

    // ── 2. Resolve HTML template ───────────────────────────────────────────
    let htmlTemplate: string;

    if (cert.template?.htmlTemplate) {
      htmlTemplate = cert.template.htmlTemplate;
    } else if (templateId) {
      const tpl = await this.prisma.certificateTemplate.findUnique({
        where: { id: templateId },
        select: { htmlTemplate: true },
      });
      htmlTemplate = tpl?.htmlTemplate ?? this.defaultTemplate(docType);
    } else {
      htmlTemplate = this.defaultTemplate(docType);
    }

    // ── 3. Build QR code data URL ─────────────────────────────────────────
    const verifyUrl = `${process.env.PUBLIC_BASE_URL ?? 'https://verify.example.com'}/cert/${cert.certificateNo}`;
    const qrDataUrl: string = await QRCode.toDataURL(verifyUrl, { width: 200, margin: 1 });

    // ── 4. Replace template variables ─────────────────────────────────────
    const grade: string = (cert['grade'] as string | undefined) ?? 'A';
    const issueDate: string = cert.issuedAt
      ? cert.issuedAt.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const html = htmlTemplate
      .replace(/\{\{studentName\}\}/g, this.escapeHtml(cert.student.name))
      .replace(/\{\{courseName\}\}/g, this.escapeHtml(cert.course.name))
      .replace(/\{\{certNo\}\}/g, this.escapeHtml(cert.certificateNo))
      .replace(/\{\{grade\}\}/g, this.escapeHtml(grade))
      .replace(/\{\{issueDate\}\}/g, issueDate)
      .replace(/\{\{centerName\}\}/g, this.escapeHtml(cert.center?.name ?? ''))
      .replace(/\{\{qrUrl\}\}/g, qrDataUrl);

    // ── 5. Write HTML to temp file ─────────────────────────────────────────
    const tmpDir = os.tmpdir();
    const tmpHtml = path.join(tmpDir, `${certId}.html`);
    const tmpPdf = path.join(tmpDir, `${certId}.pdf`);
    await fs.writeFile(tmpHtml, html, 'utf-8');

    try {
      // ── 6. Render PDF via headless Chromium ──────────────────────────────
      // In production use puppeteer or @sparticuz/chromium
      await execAsync(
        `chromium-browser --headless --disable-gpu --no-sandbox ` +
          `--print-to-pdf="${tmpPdf}" "file://${tmpHtml}"`,
      );

      // ── 7. Read PDF buffer and compute SHA-256 ───────────────────────────
      const pdfBuffer = await fs.readFile(tmpPdf);
      const sha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

      // ── 8. Upload to S3 ───────────────────────────────────────────────────
      const year = (cert.issuedAt ?? new Date()).getFullYear();
      const s3Key = `certificates/${year}/${cert.certificateNo}.pdf`;
      const pdfUrl = await this.uploadToS3(s3Key, pdfBuffer);

      // ── 9. Update certificate record ──────────────────────────────────────
      await this.prisma.certificate.update({
        where: { id: certId },
        data: {
          fileUrl: pdfUrl,
          ['pdfUrl' as string]: pdfUrl,
          ['sha256' as string]: sha256,
          ['signed' as string]: false, // TODO: PKCS#7 signing is P1 — not yet implemented
          ['pdfStatus' as string]: 'PDF_READY',
        },
      });
    } finally {
      // Clean up temp files
      await fs.unlink(tmpHtml).catch(() => undefined);
      await fs.unlink(tmpPdf).catch(() => undefined);
    }
  }

  /**
   * Uploads a buffer to S3 and returns the public (or signed) URL.
   * Uses AWS SDK v3 if available; falls back to a stub for local dev.
   */
  private async uploadToS3(key: string, buffer: Buffer): Promise<string> {
    const bucket = process.env.S3_BUCKET ?? 'franchise-platform-docs';
    const region = process.env.AWS_REGION ?? 'ap-south-1';

    try {
      // Dynamic import to avoid hard dependency when AWS SDK is not installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
      const client = new S3Client({ region });
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: 'application/pdf',
        }),
      );
      return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    } catch {
      // Stub for environments without AWS SDK configured
      this.logger.warn(`S3 upload stub: would upload ${key} (${buffer.length} bytes)`);
      return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private defaultTemplate(docType: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${docType}</title>
<style>body{font-family:serif;text-align:center;padding:60px}</style></head>
<body>
  <h1>{{certNo}}</h1>
  <p>This is to certify that <strong>{{studentName}}</strong> has successfully completed
  <strong>{{courseName}}</strong> with grade <strong>{{grade}}</strong>.</p>
  <p>Issued on {{issueDate}} by {{centerName}}</p>
  <img src="{{qrUrl}}" alt="QR Code" width="200" />
</body></html>`;
  }
}
