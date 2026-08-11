// Core API response shapes

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    cursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, string[]>;
}

export interface CursorParams {
  cursor?: string;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
