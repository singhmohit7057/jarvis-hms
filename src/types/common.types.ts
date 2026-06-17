export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface SortingState {
  id: string;
  desc: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
