import { api } from '@/api/client';
import type {
  DashboardKpis,
  MonthlyAdmission,
  CenterRevenue,
  CenterLeaderboard,
  NetworkAlert,
} from '@/types/models';
import type { ApiResponse } from '@/types/api';

export const dashboardApi = {
  kpis: () =>
    api.get<ApiResponse<DashboardKpis>>('/api/v1/dashboard/kpis'),

  monthlyAdmissions: () =>
    api.get<ApiResponse<MonthlyAdmission[]>>('/api/v1/dashboard/monthly-admissions'),

  revenueByCenter: () =>
    api.get<ApiResponse<CenterRevenue[]>>('/api/v1/dashboard/revenue-by-center'),

  leaderboard: () =>
    api.get<ApiResponse<CenterLeaderboard[]>>('/api/v1/dashboard/leaderboard'),

  alerts: () =>
    api.get<ApiResponse<NetworkAlert[]>>('/api/v1/dashboard/alerts'),
};
