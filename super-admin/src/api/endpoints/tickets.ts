import { api } from '@/api/client';
import type { ApiResponse, PaginatedResponse, CursorParams } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface TicketMessage {
  id: string;
  author: string;
  authorType: 'STAFF' | 'CENTER';
  text: string;
  sentAt: string;
}

export interface Ticket {
  id: string;
  ticketNo: string;
  centerId: string;
  centerName: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  messages: TicketMessage[];
}

export interface TicketListParams extends CursorParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  centerId?: string;
  search?: string;
}

export interface TicketUpdatePayload {
  status?: TicketStatus;
  assignedTo?: string;
  priority?: TicketPriority;
}

export interface CenterHealth {
  centerId: string;
  centerName: string;
  loginsLast30Days: number;
  admissionsTrend: 'POSITIVE' | 'FLAT' | 'DECLINING';
  duesRatioPct: number;
  openTickets: number;
  churnRisk: boolean;
}

// ─── Endpoint functions ───────────────────────────────────────────────────────

export const ticketsApi = {
  /** List all tickets (paginated), optionally filtered */
  list: (params?: TicketListParams) =>
    api.get<Ticket[]>('/api/v1/tickets', { params }),

  /** Get a single ticket with full message thread */
  get: (id: string) =>
    api.get<ApiResponse<Ticket>>(`/api/v1/tickets/${id}`),

  /** Update ticket status, assignee, or priority */
  update: (id: string, data: TicketUpdatePayload) =>
    api.patch<ApiResponse<Ticket>>(`/api/v1/tickets/${id}`, data),

  /** Post a reply message to a ticket thread */
  reply: (id: string, text: string) =>
    api.post<ApiResponse<TicketMessage>>(`/api/v1/tickets/${id}/messages`, { text }),

  /** Get health scores for all centers */
  centerHealth: () =>
    api.get<CenterHealth[]>('/api/v1/centers/health'),

  /** Get ticket stats summary (open/breached counts per priority) */
  stats: () =>
    api.get<ApiResponse<Record<TicketPriority, { open: number; breached: number }>>>(
      '/api/v1/tickets/stats'
    ),
};
