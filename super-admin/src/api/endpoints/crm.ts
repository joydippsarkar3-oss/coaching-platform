import { api } from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'SITE_VISIT'
  | 'AGREEMENT_SENT'
  | 'ACTIVE'
  | 'CHURNED';

export interface StatusChange {
  id: string;
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface LeadNote {
  id: string;
  author: string;
  timestamp: string;
  text: string;
}

export interface FranchiseLead {
  id: string;
  name: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  notes: string;
  status: LeadStatus;
  assignedTo: string;
  lastContact: string;
  createdAt: string;
  history: StatusChange[];
  leadNotes: LeadNote[];
}

export interface CreateLeadPayload {
  name: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  notes?: string;
  assignedTo?: string;
}

export interface UpdateLeadPayload {
  status?: LeadStatus;
  assignedTo?: string;
  notes?: string;
  lastContact?: string;
}

export interface TerritoryCheckPayload {
  city: string;
  pinCode?: string;
}

export interface TerritoryCheckResult {
  city: string;
  pinCode?: string;
  available: boolean;
  existingCenter?: {
    id: string;
    name: string;
    city: string;
    distanceKm: number;
  };
  message: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const crmApi = {
  listLeads: (params?: { status?: LeadStatus; assignedTo?: string }) =>
    api.get<ApiResponse<FranchiseLead[]>>('/api/v1/franchise-leads', { params }),

  getLead: (id: string) =>
    api.get<ApiResponse<FranchiseLead>>(`/api/v1/franchise-leads/${id}`),

  createLead: (data: CreateLeadPayload) =>
    api.post<ApiResponse<FranchiseLead>>('/api/v1/franchise-leads', data),

  updateLead: (id: string, data: UpdateLeadPayload) =>
    api.patch<ApiResponse<FranchiseLead>>(`/api/v1/franchise-leads/${id}`, data),

  addNote: (id: string, text: string) =>
    api.post<ApiResponse<LeadNote>>(`/api/v1/franchise-leads/${id}/notes`, { text }),

  checkTerritory: (data: TerritoryCheckPayload) =>
    api.post<ApiResponse<TerritoryCheckResult>>('/api/v1/franchise-leads/territory-check', data),
};
