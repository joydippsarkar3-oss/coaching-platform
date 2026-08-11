import { api } from '@/api/client';
import type { ApiResponse, PaginatedResponse, CursorParams } from '@/types/api';
import type { HoCharge, LedgerEntry, Settlement } from '@/types/models';

export const financeApi = {
  // HO charges config
  listHoCharges: () =>
    api.get<ApiResponse<HoCharge[]>>('/api/v1/finance/ho-charges'),

  updateHoCharge: (courseId: string, data: Partial<HoCharge>) =>
    api.put<ApiResponse<HoCharge>>(`/api/v1/finance/ho-charges/${courseId}`, data),

  // Center ledger
  getLedger: (centerId: string, params?: CursorParams & { from?: string; to?: string }) =>
    api.get<PaginatedResponse<LedgerEntry>>(`/api/v1/finance/ledger/${centerId}`, { params }),

  // Settlements
  listSettlements: (params?: CursorParams) =>
    api.get<PaginatedResponse<Settlement>>('/api/v1/finance/settlements', { params }),

  // Invoices
  generateMonthlyInvoices: () =>
    api.post<ApiResponse<{ count: number; preview: unknown[] }>>('/api/v1/finance/invoices/generate'),

  sendInvoices: (invoiceIds: string[]) =>
    api.post('/api/v1/finance/invoices/send', { invoiceIds }),

  // Reports
  walletLiability: () =>
    api.get<ApiResponse<{ total: number; breakdown: unknown[] }>>('/api/v1/finance/wallet-liability'),

  collectionsChart: (months?: number) =>
    api.get('/api/v1/finance/collections-chart', { params: { months } }),
};
