import { api } from '@/api/client';
import type { ApiResponse } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FunnelStage {
  stage: 'Enquiry' | 'Lead' | 'Enrolled' | 'Active' | 'Completed';
  count: number;
}

export interface RevenueByMonth {
  month: string; // e.g. "2025-08"
  franchise: number;   // paise
  premium: number;     // paise
  standard: number;    // paise
  basic: number;       // paise
}

export interface CoursePerformance {
  courseId: string;
  courseName: string;
  enrollments: number;
  passRate: number;      // 0–100
  avgScore: number;      // 0–100
  avgWpm: number | null; // null for non-typing courses
}

export interface CenterLeaderboardRow {
  rank: number;
  centerId: string;
  centerName: string;
  city: string;
  state: string;
  revenue: number;      // paise
  enrollments: number;
  passRate: number;     // 0–100
  healthScore: number;  // 0–100 composite
}

export interface AnalyticsSummary {
  funnel: FunnelStage[];
  revenueByMonth: RevenueByMonth[];
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function dateParams(from: string, to: string) {
  return `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

export const analyticsApi = {
  getSummary: (from: string, to: string) =>
    api.get<ApiResponse<AnalyticsSummary>>(
      `/api/v1/analytics/summary?${dateParams(from, to)}`
    ),

  getCoursePerformance: (from: string, to: string) =>
    api.get<ApiResponse<CoursePerformance[]>>(
      `/api/v1/analytics/course-performance?${dateParams(from, to)}`
    ),

  getCenterLeaderboard: (from: string, to: string) =>
    api.get<ApiResponse<CenterLeaderboardRow[]>>(
      `/api/v1/analytics/center-leaderboard?${dateParams(from, to)}`
    ),
};

// ─── Convenience re-exports used by the page ──────────────────────────────────

export function getAnalyticsSummary(from: string, to: string) {
  return analyticsApi.getSummary(from, to);
}

export function getCoursePerformance(from: string, to: string) {
  return analyticsApi.getCoursePerformance(from, to);
}

export function getCenterLeaderboard(from: string, to: string) {
  return analyticsApi.getCenterLeaderboard(from, to);
}
