import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto, KeystrokeEventDto } from './dto/submit-attempt.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Preset configurations — exact official scoring rules
// ─────────────────────────────────────────────────────────────────────────────

export interface PresetConfig {
  durationSeconds: number;
  passWpmNet: number | null;
  passAccuracy: number | null;
  language: string;
  layout: string;
  passKeydepressionsPerHour?: number;
}

const PRESETS: Record<string, PresetConfig> = {
  cpct_en: {
    durationSeconds: 900,
    passWpmNet: 30,
    passAccuracy: null,
    language: 'en',
    layout: 'qwerty',
  },
  cpct_hi: {
    durationSeconds: 900,
    passWpmNet: 20,
    passAccuracy: null,
    language: 'hi',
    layout: 'remington_gail',
  },
  ssc_chsl: {
    durationSeconds: 600,
    passWpmNet: 35,
    passAccuracy: null,
    language: 'en',
    layout: 'qwerty',
  },
  ssc_cgl: {
    durationSeconds: 600,
    passWpmNet: 30,
    passAccuracy: null,
    language: 'en',
    layout: 'qwerty',
  },
  dest: {
    durationSeconds: 600,
    passWpmNet: null,
    passAccuracy: null,
    language: 'en',
    layout: 'qwerty',
    passKeydepressionsPerHour: 8000,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Internal interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface ErrorBreakdown {
  substitution: number;
  omission: number;
  insertion: number;
}

export interface ScoredAttempt {
  id: string;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  backspaceCount: number;
  errorCount: number;
  errorBreakdown: ErrorBreakdown;
  keyHeatmap: Record<string, number>;
  passed: boolean;
  passThresholdWpm: number | null;
  passThresholdAccuracy: number | null;
  completedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  netWpm: number;
  accuracy: number;
  layout: string;
  date: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Diff utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classifies character-level errors between typed and passage strings.
 * Uses a simple linear scan: equal chars are correct; mismatches are
 * classified as substitution (same position, different char),
 * omission (passage char missing from typed), or insertion (extra typed char).
 */
function classifyErrors(
  passage: string,
  typed: string,
): { breakdown: ErrorBreakdown; keyHeatmap: Record<string, number> } {
  const breakdown: ErrorBreakdown = { substitution: 0, omission: 0, insertion: 0 };
  const keyHeatmap: Record<string, number> = {};

  const mark = (key: string) => {
    const k = key.toLowerCase();
    keyHeatmap[k] = (keyHeatmap[k] ?? 0) + 1;
  };

  let p = 0;
  let t = 0;

  while (p < passage.length || t < typed.length) {
    if (p >= passage.length) {
      // extra typed characters beyond passage length → insertion
      breakdown.insertion++;
      mark(typed[t]);
      t++;
    } else if (t >= typed.length) {
      // passage characters never reached → omission
      breakdown.omission++;
      p++;
    } else if (passage[p] === typed[t]) {
      p++;
      t++;
    } else {
      // Look-ahead: check if it's an insertion or omission by peeking one char
      if (t + 1 < typed.length && passage[p] === typed[t + 1]) {
        // typed an extra char
        breakdown.insertion++;
        mark(typed[t]);
        t++;
      } else if (p + 1 < passage.length && passage[p + 1] === typed[t]) {
        // skipped a passage char
        breakdown.omission++;
        p++;
      } else {
        // substitution: wrong char typed
        breakdown.substitution++;
        mark(typed[t]);
        p++;
        t++;
      }
    }
  }

  return { breakdown, keyHeatmap };
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class TypingService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Presets ────────────────────────────────────────────────────────────────

  getPresets(): Record<string, PresetConfig> {
    return PRESETS;
  }

  getPreset(preset: string): PresetConfig {
    const config = PRESETS[preset];
    if (!config) throw new NotFoundException(`Preset '${preset}' not found`);
    return config;
  }

  // ── Passages ───────────────────────────────────────────────────────────────

  async listPassages(language?: string, difficulty?: string) {
    const where: Record<string, unknown> = { status: 'active' };
    if (language) where['language'] = language;
    if (difficulty) where['difficulty'] = difficulty;
    return this.prisma.typingPassage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPassage(dto: {
    language: string;
    difficulty: string;
    text: string;
    source?: string;
  }) {
    const words = dto.text.trim().split(/\s+/).filter(Boolean);
    return this.prisma.typingPassage.create({
      data: {
        language: dto.language,
        difficulty: dto.difficulty,
        text: dto.text,
        wordCount: words.length,
        charCount: dto.text.length,
        source: dto.source ?? null,
      },
    });
  }

  // ── Attempts ───────────────────────────────────────────────────────────────

  /**
   * Creates a TypingAttempt record and selects a passage.
   * If no passageId is given, picks a random active passage matching language.
   * If a preset is given, its durationSeconds overrides the DTO value.
   */
  async startAttempt(dto: StartAttemptDto, studentId: string, centerId?: string) {
    // Resolve passage
    let passageId = dto.passageId;
    if (!passageId) {
      // Pick a random passage matching language; prefer medium difficulty
      const passages = await this.prisma.typingPassage.findMany({
        where: { language: dto.language, status: 'active' },
        select: { id: true },
      });
      if (passages.length === 0) {
        throw new BadRequestException(
          `No active passages found for language '${dto.language}'`,
        );
      }
      const idx = Math.floor(Math.random() * passages.length);
      passageId = passages[idx].id;
    }

    const passage = await this.prisma.typingPassage.findUnique({
      where: { id: passageId },
    });
    if (!passage) throw new NotFoundException(`Passage ${passageId} not found`);

    // Preset may override duration
    let durationSeconds = dto.durationSeconds;
    if (dto.preset && dto.preset !== 'custom') {
      const preset = PRESETS[dto.preset];
      if (preset) durationSeconds = preset.durationSeconds;
    }

    // Validate test if provided
    let test: { id: string; antiPaste: boolean; passWpmNet: number | null; passAccuracy: number | null } | null = null;
    if (dto.testId) {
      test = await this.prisma.typingTest.findUnique({
        where: { id: dto.testId },
        select: { id: true, antiPaste: true, passWpmNet: true, passAccuracy: true },
      });
      if (!test) throw new NotFoundException(`TypingTest ${dto.testId} not found`);
    }

    const attempt = await this.prisma.typingAttempt.create({
      data: {
        testId: dto.testId ?? null,
        passageId,
        studentId,
        centerId: centerId ?? null,
        layout: dto.layout,
        language: dto.language,
        durationSeconds,
        startedAt: new Date(),
        status: 'in_progress',
      },
    });

    return { attempt, passage };
  }

  /**
   * Scores a typing attempt using the official CPCT/SSC formula:
   *   grossWpm = (totalKeystrokes / 5) / (durationSeconds / 60)
   *   netWpm   = ((totalKeystrokes - errors) / 5) / (durationSeconds / 60)
   *   accuracy = correctKeystrokes / totalKeystrokes * 100
   *
   * Anti-paste check: keystrokeLog.length must be >= charCount * 0.8.
   * Throws BadRequestException if paste detected.
   */
  async submitAttempt(
    attemptId: string,
    dto: SubmitAttemptDto,
    studentId: string,
  ): Promise<ScoredAttempt> {
    const attempt = await this.prisma.typingAttempt.findUnique({
      where: { id: attemptId },
      include: {
        passage: true,
        test: true,
      },
    });

    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);
    if (attempt.studentId !== studentId) {
      throw new BadRequestException('Attempt does not belong to this student');
    }
    if (attempt.status !== 'in_progress') {
      throw new BadRequestException(
        `Attempt is already ${attempt.status}`,
      );
    }

    const { passage, test } = attempt;
    const passageText = passage.text;

    // ── Anti-paste detection ──────────────────────────────────────────────────
    const antiPasteEnabled = test?.antiPaste ?? true;
    if (antiPasteEnabled) {
      const minKeystrokes = Math.floor(passageText.length * 0.8);
      if (dto.keystrokeLog.length < minKeystrokes) {
        throw new BadRequestException(
          `Anti-paste check failed: received ${dto.keystrokeLog.length} keystrokes, ` +
            `expected at least ${minKeystrokes} for a passage of ${passageText.length} characters.`,
        );
      }
    }

    // ── Keystroke metrics from log ────────────────────────────────────────────
    const backspaceCount = dto.keystrokeLog.filter((k: KeystrokeEventDto) => k.isBackspace).length;
    const nonBackspaceKeystrokes = dto.keystrokeLog.filter((k: KeystrokeEventDto) => !k.isBackspace);
    const totalKeystrokes = nonBackspaceKeystrokes.length;
    const correctKeystrokes = nonBackspaceKeystrokes.filter((k: KeystrokeEventDto) => k.isCorrect).length;

    // ── Official CPCT/SSC WPM formulas ────────────────────────────────────────
    const minutesDuration = attempt.durationSeconds / 60;
    const grossWpm = parseFloat(((totalKeystrokes / 5) / minutesDuration).toFixed(2));

    const errors = totalKeystrokes - correctKeystrokes;
    const netWpm = parseFloat(
      (Math.max(0, (totalKeystrokes - errors) / 5) / minutesDuration).toFixed(2),
    );
    const accuracy =
      totalKeystrokes > 0
        ? parseFloat(((correctKeystrokes / totalKeystrokes) * 100).toFixed(2))
        : 0;

    // ── Character-level diff for error breakdown ──────────────────────────────
    const typedText = dto.typed;
    const { breakdown: errorBreakdown, keyHeatmap } = classifyErrors(passageText, typedText);
    const errorCount = errorBreakdown.substitution + errorBreakdown.omission + errorBreakdown.insertion;

    // ── Pass/fail determination ───────────────────────────────────────────────
    let passThresholdWpm: number | null = null;
    let passThresholdAccuracy: number | null = null;

    if (test) {
      passThresholdWpm = test.passWpmNet ?? null;
      passThresholdAccuracy = (test as { passAccuracy?: number | null }).passAccuracy ?? null;
    }

    const wpmPassed = passThresholdWpm === null ? true : netWpm >= passThresholdWpm;
    const accuracyPassed =
      passThresholdAccuracy === null ? true : accuracy >= passThresholdAccuracy;
    const passed = wpmPassed && accuracyPassed;

    const completedAt = new Date();

    // ── Persist ───────────────────────────────────────────────────────────────
    await this.prisma.typingAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt,
        status: 'completed',
        grossWpm,
        netWpm,
        accuracy,
        totalKeystrokes,
        correctKeystrokes,
        backspaceCount,
        errorCount,
        errorBreakdown: { ...errorBreakdown },
        keyHeatmap,
      },
    });

    return {
      id: attemptId,
      grossWpm,
      netWpm,
      accuracy,
      totalKeystrokes,
      correctKeystrokes,
      backspaceCount,
      errorCount,
      errorBreakdown,
      keyHeatmap,
      passed,
      passThresholdWpm,
      passThresholdAccuracy,
      completedAt,
    };
  }

  // ── History ────────────────────────────────────────────────────────────────

  /**
   * Returns the last `limit` completed attempts for a student,
   * ordered newest-first. The `trend` field exposes [{date, netWpm}] for
   * sparkline rendering on the frontend.
   */
  async getAttemptHistory(studentId: string, limit = 20) {
    const attempts = await this.prisma.typingAttempt.findMany({
      where: { studentId, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: limit,
      include: {
        passage: { select: { language: true, difficulty: true } },
        test: { select: { title: true, preset: true } },
      },
    });

    const trend = attempts
      .filter((a) => a.completedAt != null && a.netWpm != null)
      .map((a) => ({ date: a.completedAt as Date, netWpm: a.netWpm as number }))
      .reverse(); // chronological for sparkline

    return { attempts, trend };
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────

  /**
   * Top net WPM per student for the past 30 days.
   * Optionally filtered by centerId, language, and layout.
   */
  async getLeaderboard(
    centerId?: string,
    language?: string,
    layout?: string,
    limit = 10,
  ): Promise<LeaderboardEntry[]> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where: Record<string, unknown> = {
      status: 'completed',
      completedAt: { gte: since },
      netWpm: { not: null },
    };
    if (centerId) where['centerId'] = centerId;
    if (language) where['language'] = language;
    if (layout) where['layout'] = layout;

    // Fetch recent completed attempts and take best per student
    const attempts = await this.prisma.typingAttempt.findMany({
      where,
      orderBy: { netWpm: 'desc' },
      take: limit * 10, // over-fetch to deduplicate per student
      select: {
        studentId: true,
        netWpm: true,
        accuracy: true,
        layout: true,
        completedAt: true,
      },
    });

    // Deduplicate: keep highest netWpm per student
    const best = new Map<
      string,
      { netWpm: number; accuracy: number; layout: string; date: Date }
    >();
    for (const a of attempts) {
      const existing = best.get(a.studentId);
      if (!existing || (a.netWpm ?? 0) > existing.netWpm) {
        best.set(a.studentId, {
          netWpm: a.netWpm ?? 0,
          accuracy: a.accuracy ?? 0,
          layout: a.layout,
          date: a.completedAt ?? new Date(),
        });
      }
    }

    // Sort and rank
    const sorted = [...best.entries()]
      .sort(([, a], [, b]) => b.netWpm - a.netWpm)
      .slice(0, limit);

    // Fetch student names
    const studentIds = sorted.map(([id]) => id);
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(students.map((s) => [s.id, s.name]));

    return sorted.map(([studentId, data], idx) => ({
      rank: idx + 1,
      studentId,
      studentName: nameMap.get(studentId) ?? 'Unknown',
      netWpm: data.netWpm,
      accuracy: data.accuracy,
      layout: data.layout,
      date: data.date,
    }));
  }
}
