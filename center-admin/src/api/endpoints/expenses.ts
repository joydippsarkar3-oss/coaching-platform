import apiClient, { getBlob } from '../client'
import type { ApiResponse } from '@/types/api'

export type ExpenseCategory =
  | 'rent'
  | 'salary'
  | 'utilities'
  | 'marketing'
  | 'supplies'
  | 'other'

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  description: string
  amountPaise: number
  recordedBy: string
  receiptUrl?: string
}

export interface CreateExpensePayload {
  date: string
  category: ExpenseCategory
  description: string
  amountPaise: number
  receiptBase64?: string
}

export interface InventoryItem {
  id: string
  name: string
  sku: string
  unit: string
  quantity: number
  costPerUnitPaise: number
  reorderAt: number
}

export interface CreateInventoryItemPayload {
  name: string
  sku: string
  unit: string
  openingStock: number
  costPerUnitPaise: number
  reorderAt: number
}

export interface ReceiveStockPayload {
  itemId: string
  quantity: number
  date: string
  note?: string
}

export interface IssueStockPayload {
  itemId: string
  studentId: string
  quantity: number
  note?: string
}

export const expensesApi = {
  listExpenses: (from: string, to: string) =>
    apiClient.get<ApiResponse<Expense[]>>('/expenses', { params: { from, to } }),

  createExpense: (payload: CreateExpensePayload) =>
    apiClient.post<ApiResponse<Expense>>('/expenses', payload),

  exportExpensesCsv: (from: string, to: string) =>
    getBlob('/expenses/export', { from, to }),

  listInventory: () =>
    apiClient.get<ApiResponse<InventoryItem[]>>('/inventory'),

  createInventoryItem: (payload: CreateInventoryItemPayload) =>
    apiClient.post<ApiResponse<InventoryItem>>('/inventory', payload),

  receiveStock: (payload: ReceiveStockPayload) =>
    apiClient.post<ApiResponse<InventoryItem>>('/inventory/receive', payload),

  issueStock: (payload: IssueStockPayload) =>
    apiClient.post<ApiResponse<InventoryItem>>('/inventory/issue', payload),
}
