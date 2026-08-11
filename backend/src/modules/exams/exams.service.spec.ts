import { NotFoundException } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { createPrismaMock } from '../../test/prisma.mock';

describe('ExamsService', () => {
  let service: ExamsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ExamsService(prisma as any);
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // scoreAttempt
  // ─────────────────────────────────────────────────────────────────────────

  describe('scoreAttempt', () => {
    const baseExam = {
      id: 'exam-1',
      passingMarks: 40,
      config: { negativeMarksRatio: 0.25 },
    };

    function makeAttempt(answers: any[]) {
      return {
        id: 'attempt-1',
        exam: baseExam,
        answers,
      };
    }

    function makeAnswer(overrides: {
      questionId?: string;
      selectedKey: string | null;
      question: {
        id?: string;
        type: string;
        marks: number;
        correctKey: string;
      };
    }) {
      return {
        id: `ans-${Math.random()}`,
        questionId: overrides.questionId ?? overrides.question.id ?? 'q-1',
        selectedKey: overrides.selectedKey,
        question: {
          id: overrides.questionId ?? overrides.question.id ?? 'q-1',
          marks: overrides.question.marks,
          correctKey: overrides.question.correctKey,
          type: overrides.question.type,
          ...overrides.question,
        },
      };
    }

    it('MCQ_SINGLE correct answer awards full marks', async () => {
      const answer = makeAnswer({
        questionId: 'q1',
        selectedKey: 'A',
        question: { id: 'q1', type: 'MCQ_SINGLE', marks: 4, correctKey: 'A' },
      });
      prisma.examAttempt.findUnique.mockResolvedValue(makeAttempt([answer]) as any);
      prisma.examAttempt.update.mockResolvedValue({} as any);

      const result = await service.scoreAttempt('attempt-1');

      expect(result.totalMarks).toBe(4);
      expect(result.negativeMarks).toBe(0);
      expect(result.netScore).toBe(4);
    });

    it('MCQ_SINGLE wrong answer deducts negative marks', async () => {
      const answer = makeAnswer({
        questionId: 'q1',
        selectedKey: 'B',
        question: { id: 'q1', type: 'MCQ_SINGLE', marks: 4, correctKey: 'A' },
      });
      prisma.examAttempt.findUnique.mockResolvedValue(makeAttempt([answer]) as any);
      prisma.examAttempt.update.mockResolvedValue({} as any);

      const result = await service.scoreAttempt('attempt-1');

      // negMarksRatio = 0.25, so penalty = round(4 * 0.25) = 1
      expect(result.negativeMarks).toBe(1);
      expect(result.totalMarks).toBe(0);
      expect(result.netScore).toBe(-1);
    });

    it('MCQ_SINGLE unanswered (null) scores 0 with no penalty', async () => {
      const answer = makeAnswer({
        questionId: 'q1',
        selectedKey: null as any,
        question: { id: 'q1', type: 'MCQ_SINGLE', marks: 4, correctKey: 'A' },
      });
      prisma.examAttempt.findUnique.mockResolvedValue(makeAttempt([answer]) as any);
      prisma.examAttempt.update.mockResolvedValue({} as any);

      const result = await service.scoreAttempt('attempt-1');

      expect(result.totalMarks).toBe(0);
      expect(result.negativeMarks).toBe(0);
      expect(result.netScore).toBe(0);
    });

    it('MCQ_MULTI awards full marks only when all correct and no wrong selected', async () => {
      const answer = makeAnswer({
        questionId: 'q1',
        selectedKey: 'A,C',
        question: { id: 'q1', type: 'MCQ_MULTI', marks: 4, correctKey: 'A,C' },
      });
      prisma.examAttempt.findUnique.mockResolvedValue(makeAttempt([answer]) as any);
      prisma.examAttempt.update.mockResolvedValue({} as any);

      const result = await service.scoreAttempt('attempt-1');

      expect(result.totalMarks).toBe(4);
      expect(result.negativeMarks).toBe(0);
    });

    it('MCQ_MULTI awards 0 when a wrong option is selected (no partial credit)', async () => {
      const answer = makeAnswer({
        questionId: 'q1',
        selectedKey: 'A,B', // B is wrong
        question: { id: 'q1', type: 'MCQ_MULTI', marks: 4, correctKey: 'A,C' },
      });
      // no partial credit — config.partial not set
      prisma.examAttempt.findUnique.mockResolvedValue(makeAttempt([answer]) as any);
      prisma.examAttempt.update.mockResolvedValue({} as any);

      const result = await service.scoreAttempt('attempt-1');

      expect(result.totalMarks).toBe(0);
    });

    it('MCQ_MULTI awards 0 when not all correct options are selected (no partial credit)', async () => {
      const answer = makeAnswer({
        questionId: 'q1',
        selectedKey: 'A', // missing C
        question: { id: 'q1', type: 'MCQ_MULTI', marks: 4, correctKey: 'A,C' },
      });
      prisma.examAttempt.findUnique.mockResolvedValue(makeAttempt([answer]) as any);
      prisma.examAttempt.update.mockResolvedValue({} as any);

      const result = await service.scoreAttempt('attempt-1');

      expect(result.totalMarks).toBe(0);
    });

    it('TF correct answer awards full marks', async () => {
      const answer = makeAnswer({
        questionId: 'q1',
        selectedKey: 'TRUE',
        question: { id: 'q1', type: 'TF', marks: 2, correctKey: 'TRUE' },
      });
      prisma.examAttempt.findUnique.mockResolvedValue(makeAttempt([answer]) as any);
      prisma.examAttempt.update.mockResolvedValue({} as any);

      const result = await service.scoreAttempt('attempt-1');

      expect(result.totalMarks).toBe(2);
      expect(result.negativeMarks).toBe(0);
    });

    it('TF wrong answer deducts negative marks', async () => {
      const answer = makeAnswer({
        questionId: 'q1',
        selectedKey: 'FALSE',
        question: { id: 'q1', type: 'TF', marks: 2, correctKey: 'TRUE' },
      });
      prisma.examAttempt.findUnique.mockResolvedValue(makeAttempt([answer]) as any);
      prisma.examAttempt.update.mockResolvedValue({} as any);

      const result = await service.scoreAttempt('attempt-1');

      expect(result.negativeMarks).toBeGreaterThan(0);
      expect(result.totalMarks).toBe(0);
    });

    it('total score is the sum across all questions', async () => {
      const answers = [
        makeAnswer({
          questionId: 'q1',
          selectedKey: 'A',
          question: { id: 'q1', type: 'MCQ_SINGLE', marks: 4, correctKey: 'A' },
        }),
        makeAnswer({
          questionId: 'q2',
          selectedKey: 'B',
          question: { id: 'q2', type: 'MCQ_SINGLE', marks: 4, correctKey: 'B' },
        }),
        makeAnswer({
          questionId: 'q3',
          selectedKey: 'C',
          question: { id: 'q3', type: 'MCQ_SINGLE', marks: 4, correctKey: 'A' }, // wrong
        }),
      ];
      prisma.examAttempt.findUnique.mockResolvedValue(makeAttempt(answers) as any);
      prisma.examAttempt.update.mockResolvedValue({} as any);

      const result = await service.scoreAttempt('attempt-1');

      expect(result.totalMarks).toBe(8); // 2 correct × 4
      expect(result.negativeMarks).toBe(1); // 1 wrong × round(4×0.25)
      expect(result.netScore).toBe(7);
    });

    it('negative netScore is reported as-is (raw negative, persisted as-is)', async () => {
      // Service computes netScore = totalMarks - negativeMarks; no clamping in scoreAttempt itself
      const answer = makeAnswer({
        questionId: 'q1',
        selectedKey: 'B',
        question: { id: 'q1', type: 'MCQ_SINGLE', marks: 4, correctKey: 'A' },
      });
      prisma.examAttempt.findUnique.mockResolvedValue(makeAttempt([answer]) as any);
      prisma.examAttempt.update.mockResolvedValue({} as any);

      const result = await service.scoreAttempt('attempt-1');

      // totalMarks=0, negativeMarks=1, netScore=-1
      expect(result.netScore).toBe(-1);
    });

    it('throws NotFoundException when attempt does not exist', async () => {
      prisma.examAttempt.findUnique.mockResolvedValue(null);

      await expect(service.scoreAttempt('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('persists scoring results via examAttempt.update', async () => {
      const answer = makeAnswer({
        questionId: 'q1',
        selectedKey: 'A',
        question: { id: 'q1', type: 'MCQ_SINGLE', marks: 4, correctKey: 'A' },
      });
      prisma.examAttempt.findUnique.mockResolvedValue(makeAttempt([answer]) as any);
      prisma.examAttempt.update.mockResolvedValue({} as any);

      await service.scoreAttempt('attempt-1');

      expect(prisma.examAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'attempt-1' },
          data: expect.objectContaining({ status: 'EVALUATED' }),
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // autoSubmitExpired
  // ─────────────────────────────────────────────────────────────────────────

  describe('autoSubmitExpired', () => {
    it('does nothing when no exams have expired', async () => {
      prisma.exam.findMany.mockResolvedValue([]);

      await service.autoSubmitExpired();

      expect(prisma.examAttempt.findMany).not.toHaveBeenCalled();
    });

    it('submits attempts that are past window + grace period', async () => {
      prisma.exam.findMany.mockResolvedValue([{ id: 'exam-expired' }] as any);
      prisma.examAttempt.findMany.mockResolvedValue([{ id: 'attempt-stale' }] as any);

      // submitAttempt → findUnique for the attempt
      const expiredAttempt = {
        id: 'attempt-stale',
        status: 'IN_PROGRESS',
        centerId: 'center-1',
        exam: {
          id: 'exam-expired',
          passingMarks: 40,
          endsAt: new Date(Date.now() - 60_000), // ended 60s ago
          config: {},
        },
        answers: [],
      };
      prisma.examAttempt.findUnique.mockResolvedValue(expiredAttempt as any);
      prisma.examAttempt.update.mockResolvedValue({
        ...expiredAttempt,
        status: 'SUBMITTED',
      } as any);

      await service.autoSubmitExpired();

      expect(prisma.examAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'attempt-stale' },
          data: expect.objectContaining({ status: 'SUBMITTED' }),
        }),
      );
    });

    it('leaves attempts that are still within the window alone', async () => {
      // No expired exams returned → no attempts touched
      prisma.exam.findMany.mockResolvedValue([]);

      await service.autoSubmitExpired();

      expect(prisma.examAttempt.update).not.toHaveBeenCalled();
    });

    it('logs an audit entry and continues when one submit fails', async () => {
      prisma.exam.findMany.mockResolvedValue([{ id: 'exam-expired' }] as any);
      prisma.examAttempt.findMany.mockResolvedValue([
        { id: 'attempt-bad' },
        { id: 'attempt-good' },
      ] as any);

      const goodAttempt = {
        id: 'attempt-good',
        status: 'IN_PROGRESS',
        centerId: 'center-1',
        exam: { id: 'exam-expired', passingMarks: 40, endsAt: new Date(Date.now() - 60_000), config: {} },
        answers: [],
      };

      prisma.examAttempt.findUnique
        .mockResolvedValueOnce(null) // attempt-bad → throws NotFoundException inside submitAttempt
        .mockResolvedValueOnce(goodAttempt as any);

      prisma.examAttempt.update.mockResolvedValue({ ...goodAttempt, status: 'SUBMITTED' } as any);
      prisma.auditLog.create.mockResolvedValue({} as any);

      await service.autoSubmitExpired();

      // Should have written an audit log for the failed attempt
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'AUTO_SUBMIT_FAILED' }),
        }),
      );
      // And still submitted the good attempt
      expect(prisma.examAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'attempt-good' } }),
      );
    });
  });
});
