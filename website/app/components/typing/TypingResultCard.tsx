'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TypingResultCardProps {
  netWpm: number;
  grossWpm: number;
  accuracy: number;
  elapsedSeconds: number;
  layout: string;
  language: 'en' | 'hi';
  passThresholdWpm?: number | null;
  passThresholdAccuracy?: number | null;
  /** If provided, the share button will embed this URL */
  verifyUrl?: string;
  brandName?: string;
  /** Student name for the share text */
  studentName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const LAYOUT_LABELS: Record<string, string> = {
  qwerty: 'QWERTY',
  remington_gail: 'Remington Gail',
  inscript: 'InScript',
  krutidev010: 'KrutiDev 010',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TypingResultCard({
  netWpm,
  grossWpm,
  accuracy,
  elapsedSeconds,
  layout,
  language,
  passThresholdWpm,
  passThresholdAccuracy,
  verifyUrl,
  brandName = 'SkillBridge',
  studentName,
}: TypingResultCardProps) {
  const [copied, setCopied] = useState(false);

  // ── Pass / fail ─────────────────────────────────────────────────────────────

  const hasThreshold = passThresholdWpm != null || passThresholdAccuracy != null;
  let passed: boolean | null = null;
  if (hasThreshold) {
    const wpmOk = passThresholdWpm != null ? netWpm >= passThresholdWpm : true;
    const accOk = passThresholdAccuracy != null ? accuracy >= passThresholdAccuracy : true;
    passed = wpmOk && accOk;
  }

  // ── Share ────────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    const who = studentName ? `${studentName} typed` : 'I typed';
    const url = verifyUrl ?? (typeof window !== 'undefined' ? window.location.href : '');
    const text =
      `${who} ${netWpm} WPM with ${accuracy}% accuracy on ${brandName} Typing Test!` +
      (url ? ` Verify: ${url}` : '');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API unavailable — fall back to prompt
      window.prompt('Copy this result:', text);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <article
      aria-label="Typing test result"
      className="w-full rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden"
    >
      {/* Header stripe */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-4 flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Typing Test Result</h2>
        {hasThreshold && passed !== null && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold',
              passed
                ? 'bg-green-400 text-green-900'
                : 'bg-red-400 text-red-900',
            )}
            aria-label={passed ? 'Test passed' : 'Test failed'}
          >
            {passed ? (
              <>
                <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                PASS
              </>
            ) : (
              <>
                <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
                FAIL
              </>
            )}
          </span>
        )}
      </div>

      {/* Main stats */}
      <div className="p-6">
        {/* Net WPM — hero number */}
        <div className="flex flex-col items-center mb-6">
          <p
            className="text-6xl font-extrabold font-mono tabular-nums text-brand-700 leading-none"
            aria-label={`${netWpm} net words per minute`}
          >
            {netWpm}
          </p>
          <p className="text-sm text-gray-500 mt-1">Net WPM</p>
          {passThresholdWpm != null && (
            <p className="text-xs text-gray-400 mt-0.5">
              Required: {passThresholdWpm} WPM
            </p>
          )}
        </div>

        {/* Secondary stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
          <StatCell label="Gross WPM" value={grossWpm} unit="" color="text-gray-700" />
          <StatCell
            label="Accuracy"
            value={accuracy}
            unit="%"
            color={accuracy >= 90 ? 'text-green-700' : accuracy >= 75 ? 'text-yellow-700' : 'text-red-600'}
            threshold={passThresholdAccuracy != null ? `Req: ${passThresholdAccuracy}%` : undefined}
          />
          <StatCell label="Duration" value={formatTime(elapsedSeconds)} unit="" color="text-gray-700" />
          <StatCell
            label="Layout"
            value={LAYOUT_LABELS[layout] ?? layout}
            unit=""
            color="text-gray-700"
          />
        </div>

        {/* Language badge */}
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 uppercase tracking-wide">
            {language === 'hi' ? 'Hindi' : 'English'}
          </span>
          <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {LAYOUT_LABELS[layout] ?? layout}
          </span>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
            copied
              ? 'border-green-400 bg-green-50 text-green-700'
              : 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100',
          )}
          aria-live="polite"
        >
          {copied ? (
            <>
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Copied to clipboard!
            </>
          ) : (
            <>
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341L6.29 11.738a2.5 2.5 0 1 1 0-3.476l6.742-3.37A2.504 2.504 0 0 1 13 4.5Z" />
              </svg>
              Share Result
            </>
          )}
        </button>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component
// ─────────────────────────────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  unit,
  color,
  threshold,
}: {
  label: string;
  value: string | number;
  unit: string;
  color: string;
  threshold?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
      <p className={cn('font-mono font-bold text-xl tabular-nums', color)}>
        {value}
        {unit}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {threshold && <p className="text-xs text-gray-400">{threshold}</p>}
    </div>
  );
}
