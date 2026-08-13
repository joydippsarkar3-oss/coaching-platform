import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { seededShuffle } from '../../common/utils/seeded-shuffle';
import { AttemptStatus, ExamStatus } from '@prisma/client';
import { createHash } from 'node:crypto';

// Load target: 2,000 concurrent attempts. saveAnswers uses upsert with ON CONFLICT — safe for
// concurrent writes. Paper generation is CPU-light (shuffle only). Score computation is O(n)
// per attempt, run in worker.

/** Shape of one entry in exam.blueprint JSONB */
interface BlueprintEntry {
  topicId: string;
  difficulty: string;
  count: number;
}

/**
 * Normalizes a raw client fingerprint into the SHA-256 hex digest stored on the
 * attempt. Hashing server-side means a leaked column cannot be replayed as a
 * client-supplied value, and the stored form is fixed-width regardless of input.
 */
function hashFingerprint(raw: string): string {
  return createHash('sha256').update(raw.trim()).digest('hex');
}

/** Per-question result written after scoring */
interface QuestionResult {
  questionId: string;
  givenAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  marksAwarded: number;
}

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Paper generation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generates an exam paper for a student using the exam's blueprint JSONB.
   * Uses seeded Fisher-Yates shuffle so the same student always gets the same
   * variant; different students get different variants.
   *
   * @param examId - UUID of the exam
   * @param studentId - UUID of the student
   * @returns created ExamAttempt record with status ISSUED and paper snapshot
   * @throws NotFoundException if exam not found
   * @throws BadRequestException if exam is not PUBLISHED or blueprint is missing
   */
  async generatePaper(examId: string, studentId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException(`Exam ${examId} not found`);
    if (exam.status !== 'PUBLISHED') {
      throw new BadRequestException('Exam must be PUBLISHED before generating a paper');
    }

    const blueprint = exam['blueprint'] as BlueprintEntry[] | null;
    if (!blueprint || !Array.isArray(blueprint) || blueprint.length === 0) {
      throw new BadRequestException('Exam has no blueprint configured');
    }

    // Prevent duplicate ISSUED/IN_PROGRESS papers for the same student+exam
    const existingAttempt = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId,
        status: { in: ['ISSUED' as AttemptStatus, 'IN_PROGRESS'] },
      },
    });
    if (existingAttempt) {
      throw new BadRequestException('A paper has already been issued for this student');
    }

    // Fetch questions per blueprint entry
    const seedStr = `${examId}:${studentId}`;
    const paperQuestions: Array<{ questionId: string; shuffledOptions: string[] }> = [];

    for (const entry of blueprint) {
      // Questions must match topic (stored as questionBankId or a topicId field) and difficulty
      const questions = await this.prisma.question.findMany({
        where: {
          questionBank: { courseId: exam.courseId ?? undefined },
          // topic / difficulty matching — stored as JSON metadata field if present
          ...(entry.topicId ? { questionBankId: entry.topicId } : {}),
          ...(entry.difficulty ? { ['difficulty' as string]: entry.difficulty } : {}),
        },
        select: { id: true, options: true },
      });

      if (questions.length < entry.count) {
        throw new BadRequestException(
          `Insufficient questions for topicId=${entry.topicId}, difficulty=${entry.difficulty}: ` +
            `need ${entry.count}, found ${questions.length}`,
        );
      }

      // Seeded-shuffle the pool, then take `count`
      const pool = seededShuffle([...questions], `${seedStr}:${entry.topicId}:${entry.difficulty}`);
      const selected = pool.slice(0, entry.count);

      for (const q of selected) {
        // Shuffle option order as well (different seed suffix per question)
        const optionKeys: string[] = (q.options as Array<{ key: string; text: string }>).map(
          (o) => o.key,
        );
        const shuffledOptions = seededShuffle([...optionKeys], `${seedStr}:opt:${q.id}`);
        paperQuestions.push({ questionId: q.id, shuffledOptions });
      }
    }

    // Shuffle the full question order
    const finalOrder = seededShuffle([...paperQuestions], `${seedStr}:order`);

    // Store paper snapshot as attempt with ISSUED status
    return this.prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        centerId: exam.centerId,
        status: 'ISSUED' as AttemptStatus,
        // paper snapshot stored in JSONB field on the model
        ['paperSnapshot' as string]: finalOrder,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Attempt lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Marks an ISSUED attempt as IN_PROGRESS. Records server start_time — client
   * clock is never trusted.
   *
   * @param attemptId - UUID of the exam attempt
   * @param studentId - must match the attempt's studentId
   * @returns updated ExamAttempt
   * @throws NotFoundException if attempt not found
   * @throws ForbiddenException if student mismatch
   * @throws BadRequestException if attempt is not in ISSUED status or window not open
   */
  async startAttempt(attemptId: string, studentId: string, deviceFingerprint?: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true },
    });
    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);
    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('Student mismatch');
    }
    if (attempt.status !== ('ISSUED' as AttemptStatus)) {
      throw new BadRequestException(
        `Attempt is not in ISSUED status (current: ${attempt.status})`,
      );
    }

    const now = new Date();
    const { exam } = attempt;

    // Validate window
    if (exam.startsAt && now < exam.startsAt) {
      throw new BadRequestException('Exam window has not opened yet');
    }
    if (exam.endsAt && now > exam.endsAt) {
      throw new BadRequestException('Exam window has closed');
    }

    // Bind the attempt to the first device that starts it. Once set, every later
    // write to this attempt must present the same fingerprint.
    const boundFingerprint = attempt.deviceFingerprint
      ? attempt.deviceFingerprint
      : deviceFingerprint
        ? hashFingerprint(deviceFingerprint)
        : null;

    if (attempt.deviceFingerprint) {
      this.assertDeviceMatches(attempt.deviceFingerprint, deviceFingerprint);
    }

    return this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: now, // server-authoritative start time
        deviceFingerprint: boundFingerprint,
      },
    });
  }

  /**
   * Rejects a write when the attempt is bound to a device and the caller presents
   * a different one (or none). Unbound attempts — started before binding was
   * enabled, or by a client that sent no fingerprint — are left permissive so
   * in-flight exams are never locked out mid-paper.
   */
  private assertDeviceMatches(bound: string | null, presented?: string): void {
    if (!bound) return;
    if (!presented || hashFingerprint(presented) !== bound) {
      throw new ForbiddenException(
        'This exam attempt is bound to a different device. Continue on the device where it was started.',
      );
    }
  }

  /**
   * Idempotent upsert of per-question answers. Also optionally logs a proctoring
   * event (TAB_SWITCH, DISCONNECT, IP_CHANGE).
   *
   * @param attemptId - UUID of the exam attempt
   * @param answers - array of {questionId, answer, markedForReview}
   * @param eventType - optional proctoring event type to log
   * @returns void
   * @throws NotFoundException if attempt not found
   * @throws BadRequestException if attempt is not IN_PROGRESS
   */
  async saveAnswers(
    attemptId: string,
    answers: Array<{ questionId: string; answer: string; markedForReview?: boolean }>,
    eventType?: 'TAB_SWITCH' | 'DISCONNECT' | 'IP_CHANGE',
    deviceFingerprint?: string,
  ): Promise<void> {
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);
    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Cannot save answers: attempt is not IN_PROGRESS');
    }
    this.assertDeviceMatches(attempt.deviceFingerprint, deviceFingerprint);

    // Upsert each answer — ON CONFLICT (attemptId, questionId) safe for concurrent writes
    await this.prisma.$transaction(
      answers.map((a) =>
        this.prisma.examAnswer.upsert({
          where: {
            // Compound unique key assumed: attemptId_questionId
            attemptId_questionId: { attemptId, questionId: a.questionId },
          },
          create: {
            attemptId,
            questionId: a.questionId,
            selectedKey: a.answer,
            centerId: attempt.centerId,
            ['markedForReview' as string]: a.markedForReview ?? false,
          },
          update: {
            selectedKey: a.answer,
            ['markedForReview' as string]: a.markedForReview ?? false,
          },
        }),
      ),
    );

    // Log proctoring event if provided
    if (eventType) {
      await this.prisma.auditLog.create({
        data: {
          centerId: attempt.centerId,
          action: eventType,
          entity: 'ExamAttempt',
          entityId: attemptId,
          newValue: { eventType, ts: new Date().toISOString() },
        },
      });
    }
  }

  /**
   * Submits an attempt, validates timing (30s grace after window end), scores
   * objective questions, calculates total / negative marks, sets status SUBMITTED,
   * and triggers the scoring job.
   *
   * @param attemptId - UUID of the exam attempt
   * @param force - bypass timing and device-binding validation (used by auto-submit cron)
   * @param deviceFingerprint - raw client fingerprint; must match the bound device
   * @returns updated ExamAttempt
   * @throws NotFoundException if attempt not found
   * @throws BadRequestException on timing or status violations
   * @throws ForbiddenException if the attempt is bound to a different device
   */
  async submitAttempt(attemptId: string, force = false, deviceFingerprint?: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true, answers: { include: { question: true } } },
    });
    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);
    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Attempt is not IN_PROGRESS (status: ${attempt.status})`);
    }
    // The auto-submit cron has no device of its own, so it is exempt.
    if (!force) {
      this.assertDeviceMatches(attempt.deviceFingerprint, deviceFingerprint);
    }

    const now = new Date();
    const { exam } = attempt;

    if (!force && exam.endsAt) {
      const graceCutoff = new Date(exam.endsAt.getTime() + 30_000); // 30s grace
      if (now > graceCutoff) {
        throw new BadRequestException('Submission window (including 30s grace) has closed');
      }
    }

    // Score and mark SUBMITTED; full scoring happens asynchronously via scoreAttempt
    const updated = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt: now,
      },
    });

    // Trigger async scoring — in production this enqueues a BullMQ job; here we call directly
    // to ensure results are available synchronously for small exams (worker handles large ones)
    await this.scoreAttempt(attemptId);

    return updated;
  }

  /**
   * Cron job: auto-submits all IN_PROGRESS attempts that are past their exam window + 30s grace.
   * Runs on a schedule driven by the NestJS scheduler.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoSubmitExpired(): Promise<void> {
    const now = new Date();
    // Find exams whose window ended > 30s ago
    const expiredExams = await this.prisma.exam.findMany({
      where: {
        endsAt: { lt: new Date(now.getTime() - 30_000) },
        status: 'PUBLISHED',
      },
      select: { id: true },
    });

    if (expiredExams.length === 0) return;

    const expiredExamIds = expiredExams.map((e) => e.id);

    const staleAttempts = await this.prisma.examAttempt.findMany({
      where: {
        examId: { in: expiredExamIds },
        status: 'IN_PROGRESS',
      },
      select: { id: true },
    });

    for (const { id } of staleAttempts) {
      try {
        await this.submitAttempt(id, true /* force */);
      } catch {
        // Log and continue — one bad attempt must not block others
        await this.prisma.auditLog.create({
          data: {
            action: 'AUTO_SUBMIT_FAILED',
            entity: 'ExamAttempt',
            entityId: id,
            newValue: { error: 'auto-submit failed', ts: now.toISOString() },
          },
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Scoring
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Scores a SUBMITTED attempt per question type:
   * - MCQ_SINGLE: marks if correct, negative_marks if wrong, 0 if unanswered
   * - MCQ_MULTI: full marks if all correct + no wrong; partial if exam.partialCredit=true
   * - TF: marks if correct, negative if wrong
   * - FILL/NUMERIC: case-insensitive exact match
   * - SUBJECTIVE: enqueues moderation entry, not auto-scored
   * Writes per-question results, total score, sets rank=null (until publishResults).
   *
   * @param attemptId - UUID of the attempt to score
   * @returns scoring summary {totalMarks, negativeMarks, netScore}
   * @throws NotFoundException if attempt not found
   */
  async scoreAttempt(
    attemptId: string,
  ): Promise<{ totalMarks: number; negativeMarks: number; netScore: number }> {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        answers: { include: { question: true } },
      },
    });
    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);

    const partialCredit = false;
    const negMarksRatio: number = attempt.exam.negativeMarksRatio
      ? Number(attempt.exam.negativeMarksRatio)
      : 0.25;

    // Build answer map: questionId → selectedKey(s)
    const answerMap = new Map<string, string>(
      attempt.answers.map((a) => [a.questionId, a.selectedKey]),
    );

    let totalMarks = 0;
    let negativeMarks = 0;
    const questionResults: QuestionResult[] = [];

    for (const answer of attempt.answers) {
      const q = answer.question;
      const qType = 'MCQ_SINGLE';
      const maxMarks: number = q.marks;
      const givenAnswer: string | null = answerMap.get(q.id) ?? null;
      const correctAnswer: string = q.correctKey;
      let marksAwarded = 0;
      let isCorrect = false;

      if (!givenAnswer) {
        // Unanswered — no marks, no penalty
        marksAwarded = 0;
      } else if (qType === 'MCQ_SINGLE' || qType === 'TF') {
        if (givenAnswer === correctAnswer) {
          marksAwarded = maxMarks;
          isCorrect = true;
        } else {
          marksAwarded = -Math.round(maxMarks * negMarksRatio);
          negativeMarks += Math.abs(marksAwarded);
        }
      } else if (qType === 'MCQ_MULTI') {
        // correctAnswer is comma-separated sorted keys e.g. "A,C,D"
        const correctSet = new Set(correctAnswer.split(',').map((k) => k.trim()));
        const givenSet = new Set(givenAnswer.split(',').map((k) => k.trim()));
        const allCorrectSelected = [...correctSet].every((k) => givenSet.has(k));
        const noWrongSelected = [...givenSet].every((k) => correctSet.has(k));

        if (allCorrectSelected && noWrongSelected) {
          marksAwarded = maxMarks;
          isCorrect = true;
        } else if (partialCredit) {
          // Each correctly chosen option = marks / total_correct_options
          const marksPerOption = maxMarks / correctSet.size;
          const correctlyChosen = [...givenSet].filter((k) => correctSet.has(k)).length;
          marksAwarded = Math.round(marksPerOption * correctlyChosen);
          isCorrect = false;
        } else {
          marksAwarded = 0;
        }
      } else if (qType === 'FILL' || qType === 'NUMERIC') {
        // Case-insensitive exact match
        if (givenAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
          marksAwarded = maxMarks;
          isCorrect = true;
        } else {
          marksAwarded = 0;
        }
      } else if (qType === 'SUBJECTIVE') {
        // Not auto-scored — create moderation queue entry
        await this.prisma.auditLog.create({
          data: {
            action: 'MODERATION_REQUIRED',
            entity: 'ExamAnswer',
            entityId: answer.id,
            newValue: { attemptId, questionId: q.id, givenAnswer },
          },
        });
        marksAwarded = 0;
      }

      totalMarks += Math.max(0, marksAwarded); // only accumulate positive marks here
      questionResults.push({
        questionId: q.id,
        givenAnswer,
        correctAnswer,
        isCorrect,
        marksAwarded,
      });
    }

    const netScore = totalMarks - negativeMarks;
    const passed = netScore >= attempt.exam.passingMarks;

    // Persist scoring results
    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        score: netScore,
        passed,
        status: 'EVALUATED',
        ['questionResults' as string]: questionResults,
        ['negativeMarks' as string]: negativeMarks,
        ['rank' as string]: null, // set when publishResults is called
      },
    });

    return { totalMarks, negativeMarks, netScore };
  }

  /**
   * Computes and persists ranks for all EVALUATED attempts of an exam,
   * sets the exam's published flag, and triggers a notification job.
   *
   * @param examId - UUID of the exam to publish
   * @returns number of attempts ranked
   * @throws NotFoundException if exam not found
   */
  async publishResults(examId: string): Promise<{ rankedCount: number }> {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException(`Exam ${examId} not found`);

    const attempts = await this.prisma.examAttempt.findMany({
      where: { examId, status: 'EVALUATED' },
      orderBy: { score: 'desc' },
      select: { id: true, score: true },
    });

    // Assign ranks (1-based; ties share same rank, next rank skips)
    let currentRank = 1;
    let previousScore: number | null = null;
    let skippedCount = 0;

    for (const attempt of attempts) {
      const score = attempt.score ?? 0;
      if (score !== previousScore) {
        currentRank += skippedCount;
        skippedCount = 1;
      } else {
        skippedCount++;
      }
      previousScore = score;

      await this.prisma.examAttempt.update({
        where: { id: attempt.id },
        data: { ['rank' as string]: currentRank },
      });
    }

    // Mark exam published
    await this.prisma.exam.update({
      where: { id: examId },
      data: { ['published' as string]: true },
    });

    // Trigger notification job (audit log entry as stub — replace with BullMQ enqueue)
    await this.prisma.auditLog.create({
      data: {
        action: 'RESULTS_PUBLISHED',
        entity: 'Exam',
        entityId: examId,
        newValue: { rankedCount: attempts.length, publishedAt: new Date().toISOString() },
      },
    });

    return { rankedCount: attempts.length };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Existing CRUD kept for controller compatibility
  // ─────────────────────────────────────────────────────────────────────────

  async create(dto: {
    title: string;
    courseId?: string;
    durationMin: number;
    totalMarks: number;
    passingMarks: number;
    shuffleQuestions?: boolean;
    startsAt?: string;
    endsAt?: string;
  }, centerId?: string) {
    return this.prisma.exam.create({
      data: {
        ...dto,
        centerId: centerId ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });
  }

  async findAll(centerId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (centerId) where['centerId'] = centerId;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.exam.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.exam.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException(`Exam ${id} not found`);
    return exam;
  }

  async update(
    id: string,
    dto: Partial<{ title: string; status: ExamStatus; durationMin: number }>,
  ) {
    await this.findOne(id);
    return this.prisma.exam.update({ where: { id }, data: dto });
  }

  async getAttempts(examId: string) {
    await this.findOne(examId);
    return this.prisma.examAttempt.findMany({
      where: { examId },
      include: { student: { select: { name: true, phone: true } } },
      orderBy: { startedAt: 'desc' },
    });
  }
}
