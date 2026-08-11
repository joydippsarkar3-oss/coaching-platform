import apiClient from '../client'
import type { ApiResponse } from '@/types/api'

export interface WalletSummary {
  studentId: string
  studentName: string
  enrollmentNumber: string
  balancePaise: number
  expiryDate: string
  totalEarnedPaise: number
  totalRedeemedPaise: number
}

export interface WalletTransaction {
  id: string
  createdAt: string
  type: 'welcome' | 'referral' | 'refund' | 'fee_redemption' | 'manual_credit'
  direction: 'credit' | 'debit'
  amountPaise: number
  balanceAfterPaise: number
  description: string
}

export interface PromoCampaign {
  id: string
  name: string
  bonusType: 'welcome' | 'referral' | 'manual'
  bonusAmountPaise: number
  maxPerStudent: number
  validFrom: string
  validTo: string
  isActive: boolean
  redemptionCap: number
  redeemedCount: number
}

export interface CreateCampaignPayload {
  name: string
  bonusType: 'welcome' | 'referral' | 'manual'
  bonusAmountPaise: number
  maxPerStudent: number
  validFrom: string
  validTo: string
  redemptionCap: number
}

export interface ManualCreditPayload {
  studentId: string
  amountPaise: number
  reason: string
}

// ── Center wallet ──────────────────────────────────────────────────────────

export interface CenterWalletBalance {
  commissionEarnedPaise: number
  pendingSettlementPaise: number
  totalBalancePaise: number
  lastSettledAt: string | null
}

export interface CenterTransaction {
  id: string
  createdAt: string
  description: string
  type: 'credit' | 'debit'
  amountPaise: number
  balanceAfterPaise: number
}

export interface PromoCode {
  id: string
  code: string
  discountPercent: number
  validFrom: string
  validTo: string
  maxUses: number
  useCount: number
  isActive: boolean
}

export interface CreatePromoCodePayload {
  code: string
  discountPercent: number
  validFrom: string
  validTo: string
  maxUses: number
}

export const centerWalletApi = {
  getWalletBalance: () =>
    apiClient.get<ApiResponse<CenterWalletBalance>>('/center/wallet/balance'),

  getWalletTransactions: (page = 1, pageSize = 20) =>
    apiClient.get<ApiResponse<CenterTransaction[]>>('/center/wallet/transactions', {
      params: { page, pageSize },
    }),

  getPromoCodes: () =>
    apiClient.get<ApiResponse<PromoCode[]>>('/center/promo-codes'),

  createPromoCode: (payload: CreatePromoCodePayload) =>
    apiClient.post<ApiResponse<PromoCode>>('/center/promo-codes', payload),

  deletePromoCode: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/center/promo-codes/${id}`),
}

// ── Student wallet (legacy) ─────────────────────────────────────────────────

export const walletApi = {
  listWallets: (search?: string) =>
    apiClient.get<ApiResponse<WalletSummary[]>>('/wallet/list', {
      params: search ? { search } : undefined,
    }),

  getTransactions: (studentId: string) =>
    apiClient.get<ApiResponse<WalletTransaction[]>>(`/wallet/${studentId}/transactions`),

  manualCredit: (payload: ManualCreditPayload) =>
    apiClient.post<ApiResponse<WalletTransaction>>('/wallet/manual-credit', payload),

  exportWalletsCsv: () =>
    apiClient.get<Blob>('/wallet/export', { responseType: 'blob' }),

  listCampaigns: () =>
    apiClient.get<ApiResponse<PromoCampaign[]>>('/wallet/campaigns'),

  createCampaign: (payload: CreateCampaignPayload) =>
    apiClient.post<ApiResponse<PromoCampaign>>('/api/v1/wallet/campaigns', payload),

  toggleCampaign: (campaignId: string, isActive: boolean) =>
    apiClient.patch<ApiResponse<PromoCampaign>>(`/wallet/campaigns/${campaignId}`, { isActive }),
}
