'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface KeystrokeEvent {
  key: string;
  timestamp: number;
  isBackspace: boolean;
  isCorrect: boolean;
}

export interface TypingResult {
  typed: string;
  keystrokeLog: KeystrokeEvent[];
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  backspaceCount: number;
  errorCount: number;
  keyHeatmap: Record<string, number>;
  elapsedSeconds: number;
}

interface TypingPracticeProps {
  passage: string;
  durationSeconds: number;
  language: 'en' | 'hi';
  layout: string;
  onComplete: (result: TypingResult) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Character state
// ─────────────────────────────────────────────────────────────────────────────

type CharStatus = 'pending' | 'correct' | 'incorrect';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const KEYBOARD_ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

function computeStats(
  keystrokeLog: KeystrokeEvent[],
  durationSeconds: number,
  passage: string,
  typed: string,
): Omit<TypingResult, 'typed' | 'keystrokeLog' | 'elapsedSeconds'> {
  const nonBS = keystrokeLog.filter((k) => !k.isBackspace);
  const totalKeystrokes = nonBS.length;
  const correctKeystrokes = nonBS.filter((k) => k.isCorrect).length;
  const backspaceCount = keystrokeLog.filter((k) => k.isBackspace).length;

  const mins = durationSeconds / 60;
  const grossWpm = mins > 0 ? parseFloat(((totalKeystrokes / 5) / mins).toFixed(2)) : 0;
  const errors = totalKeystrokes - correctKeystrokes;
  const netWpm = mins > 0 ? parseFloat((Math.max(0, (totalKeystrokes - errors) / 5) / mins).toFixed(2)) : 0;
  const accuracy = totalKeystrokes > 0
    ? parseFloat(((correctKeystrokes / totalKeystrokes) * 100).toFixed(2))
    : 0;

  // Error count from diff
  const keyHeatmap: Record<string, number> = {};
  let errorCount = 0;
  const len = Math.min(passage.length, typed.length);
  for (let i = 0; i < len; i++) {
    if (passage[i] !== typed[i]) {
      errorCount++;
      const k = typed[i].toLowerCase();
      keyHeatmap[k] = (keyHeatmap[k] ?? 0) + 1;
    }
  }
  errorCount += Math.abs(passage.length - typed.length);

  return { grossWpm, netWpm, accuracy, totalKeystrokes, correctKeystrokes, backspaceCount, errorCount, keyHeatmap };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TypingPractice({
  passage,
  durationSeconds,
  language,
  layout,
  onComplete,
}: TypingPracticeProps) {
  const [typed, setTyped] = useState('');
  const [keystrokeLog, setKeystrokeLog] = useState<KeystrokeEvent[]>([]);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [liveStats, setLiveStats] = useState({ grossWpm: 0, accuracy: 100, backspaceCount: 0 });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const isHindi = language === 'hi';
  const fontClass = isHindi ? "font-['Noto_Sans_Devanagari',_sans-serif]" : 'font-mono';

  // ── Stable refs (avoid stale closures in timer / effects) ─────────────────

  const typedRef = useRef(typed);
  typedRef.current = typed;
  const logRef = useRef(keystrokeLog);
  logRef.current = keystrokeLog;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // ── Single completion effect — fires exactly once when finished becomes true ─

  const completionFiredRef = useRef(false);
  useEffect(() => {
    if (!finished) return;
    if (completionFiredRef.current) return;
    completionFiredRef.current = true;

    setShowResult(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsedSeconds = startTimeRef.current
      ? Math.min(
          Math.floor((Date.now() - startTimeRef.current) / 1000),
          durationSeconds,
        )
      : durationSeconds;

    const stats = computeStats(logRef.current, elapsedSeconds, passage, typedRef.current);
    onCompleteRef.current({
      typed: typedRef.current,
      keystrokeLog: logRef.current,
      elapsedSeconds,
      ...stats,
    });
  }, [finished, durationSeconds, passage]);

  // ── Timer ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!started || finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, finished]);

  // ── Keystroke handler ──────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (finished) { e.preventDefault(); return; }

      // Start timer on first keystroke
      if (!started) {
        setStarted(true);
        startTimeRef.current = Date.now();
      }

      const isBackspace = e.key === 'Backspace';

      if (isBackspace) {
        e.preventDefault();
        setTyped((prev) => {
          const next = prev.slice(0, -1);
          const event: KeystrokeEvent = {
            key: 'Backspace',
            timestamp: Date.now(),
            isBackspace: true,
            isCorrect: false,
          };
          setKeystrokeLog((log) => {
            const newLog = [...log, event];
            logRef.current = newLog;
            return newLog;
          });
          typedRef.current = next;
          return next;
        });
        return;
      }

      // Ignore non-printable keys
      if (e.key.length !== 1) return;

      e.preventDefault();

      setTyped((prev) => {
        const nextIndex = prev.length;
        const expectedChar = passage[nextIndex] ?? '';
        const isCorrect = e.key === expectedChar;
        const next = prev + e.key;

        const event: KeystrokeEvent = {
          key: e.key,
          timestamp: Date.now(),
          isBackspace: false,
          isCorrect,
        };

        setKeystrokeLog((log) => {
          const newLog = [...log, event];
          logRef.current = newLog;

          // Update live stats every keystroke
          const nonBS = newLog.filter((k) => !k.isBackspace);
          const total = nonBS.length;
          const correct = nonBS.filter((k) => k.isCorrect).length;
          const bs = newLog.filter((k) => k.isBackspace).length;
          const elapsedMins = startTimeRef.current
            ? (Date.now() - startTimeRef.current) / 60000
            : 0;
          const gWpm = elapsedMins > 0 ? parseFloat(((total / 5) / elapsedMins).toFixed(1)) : 0;
          const acc = total > 0 ? parseFloat(((correct / total) * 100).toFixed(1)) : 100;
          setLiveStats({ grossWpm: gWpm, accuracy: acc, backspaceCount: bs });

          return newLog;
        });

        typedRef.current = next;

        // Auto-complete when all passage chars typed
        if (next.length >= passage.length) {
          setFinished(true);
          setShowResult(true);
          if (timerRef.current) clearInterval(timerRef.current);
        }

        return next;
      });
    },
    [finished, started, passage],
  );

  // ── Prevent paste ──────────────────────────────────────────────────────────

  const preventPaste = (e: React.ClipboardEvent) => e.preventDefault();
  const preventContextMenu = (e: React.MouseEvent) => e.preventDefault();

  // ── Focus input on mount ───────────────────────────────────────────────────

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Character rendering ────────────────────────────────────────────────────

  const renderPassage = () => {
    return passage.split('').map((char, idx) => {
      let status: CharStatus = 'pending';
      if (idx < typed.length) {
        status = typed[idx] === char ? 'correct' : 'incorrect';
      }
      const isCursor = idx === typed.length;

      return (
        <span
          key={idx}
          className={cn(
            'relative',
            status === 'correct' && 'text-green-600',
            status === 'incorrect' && 'text-red-500 bg-red-50',
            status === 'pending' && 'text-gray-400',
            isCursor && [
              'after:absolute after:bottom-0 after:left-0 after:w-0.5 after:h-full',
              'after:bg-brand-600 after:animate-pulse',
            ],
          )}
        >
          {char === ' ' ? ' ' : char}
        </span>
      );
    });
  };

  // ── Key heatmap for result modal ───────────────────────────────────────────

  const buildHeatmap = () => {
    const stats = computeStats(logRef.current, durationSeconds, passage, typedRef.current);
    return stats.keyHeatmap;
  };

  // ── Time format ────────────────────────────────────────────────────────────

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = typed.length / passage.length;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 select-none" aria-label="Typing practice widget">
      {/* Stats bar */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm">
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Time</span>
          <span
            className={cn(
              'ml-1 font-mono text-lg font-semibold tabular-nums',
              timeLeft <= 30 && 'text-red-600 animate-pulse',
            )}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400">WPM</p>
            <p className="font-mono font-semibold text-brand-700">{liveStats.grossWpm}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Accuracy</p>
            <p className="font-mono font-semibold text-green-700">{liveStats.accuracy}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Backspace</p>
            <p className="font-mono font-semibold text-orange-600">{liveStats.backspaceCount}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-brand-500 transition-all duration-100"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>

      {/* Passage display */}
      <div
        className={cn(
          'rounded-xl border border-gray-200 bg-gray-50 p-4 text-lg leading-8 tracking-wide cursor-text',
          fontClass,
          isHindi && 'text-xl leading-10',
        )}
        onClick={() => inputRef.current?.focus()}
        aria-label="Passage text"
      >
        {renderPassage()}
      </div>

      {/* Hidden textarea captures keystrokes */}
      <textarea
        ref={inputRef}
        value=""
        onChange={() => {/* controlled via onKeyDown */}}
        onKeyDown={handleKeyDown}
        onPaste={preventPaste}
        onContextMenu={preventContextMenu}
        className="sr-only"
        aria-label="Typing input (use keyboard)"
        aria-hidden="false"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        autoComplete="off"
        rows={1}
      />

      {/* Keyboard focus hint */}
      {!started && (
        <p className="text-center text-sm text-gray-400 animate-pulse">
          Click on the passage above and start typing to begin the timer.
        </p>
      )}

      {/* Result modal */}
      {showResult && (
        <ResultModal
          passage={passage}
          typed={typedRef.current}
          keystrokeLog={logRef.current}
          durationSeconds={durationSeconds}
          elapsedSeconds={
            startTimeRef.current
              ? Math.floor((Date.now() - startTimeRef.current) / 1000)
              : durationSeconds
          }
          keyHeatmap={buildHeatmap()}
          onClose={() => setShowResult(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Result Modal (inline — shown when test ends)
// ─────────────────────────────────────────────────────────────────────────────

interface ResultModalProps {
  passage: string;
  typed: string;
  keystrokeLog: KeystrokeEvent[];
  durationSeconds: number;
  elapsedSeconds: number;
  keyHeatmap: Record<string, number>;
  onClose: () => void;
}

function ResultModal({
  passage,
  typed,
  keystrokeLog,
  durationSeconds,
  elapsedSeconds,
  keyHeatmap,
  onClose,
}: ResultModalProps) {
  const stats = computeStats(keystrokeLog, elapsedSeconds, passage, typed);

  const maxErr = Math.max(...Object.values(keyHeatmap), 1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Typing result"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 flex flex-col gap-5">
        <h2 className="text-xl font-bold text-gray-900">Your Result</h2>

        {/* Main stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Gross WPM', value: stats.grossWpm, color: 'text-brand-700' },
            { label: 'Net WPM', value: stats.netWpm, color: 'text-green-700' },
            { label: 'Accuracy', value: `${stats.accuracy}%`, color: 'text-blue-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
              <p className={cn('text-2xl font-bold font-mono', color)}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center">
            <p className="font-semibold text-gray-700">{stats.totalKeystrokes}</p>
            <p className="text-gray-400 text-xs">Keystrokes</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700">{stats.errorCount}</p>
            <p className="text-gray-400 text-xs">Errors</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700">{stats.backspaceCount}</p>
            <p className="text-gray-400 text-xs">Backspaces</p>
          </div>
        </div>

        {/* Key error heatmap */}
        {Object.keys(keyHeatmap).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Error Heatmap</p>
            <div className="flex flex-col gap-1">
              {KEYBOARD_ROWS.map((row, ri) => (
                <div key={ri} className="flex gap-1 justify-center">
                  {row.map((key) => {
                    const errCount = keyHeatmap[key] ?? 0;
                    const intensity = errCount / maxErr;
                    const bg =
                      errCount === 0
                        ? 'bg-gray-100 text-gray-400'
                        : intensity > 0.66
                        ? 'bg-red-500 text-white'
                        : intensity > 0.33
                        ? 'bg-orange-400 text-white'
                        : 'bg-yellow-300 text-gray-800';
                    return (
                      <div
                        key={key}
                        title={errCount > 0 ? `${key}: ${errCount} error${errCount > 1 ? 's' : ''}` : key}
                        className={cn(
                          'w-8 h-8 rounded flex items-center justify-center text-xs font-mono font-medium transition-colors',
                          bg,
                        )}
                      >
                        {key}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-2 w-full rounded-lg bg-brand-600 py-2 text-white font-medium hover:bg-brand-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Close
        </button>
      </div>
    </div>
  );
}
