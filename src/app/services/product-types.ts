// src/services/product-types.ts

export interface DataItem {
  id: number;
  name: string;
  isDeleted?: boolean;
}

export type EntityType = 'brands' | 'departments' | 'categories' | 'suppliers';

export interface BulkUpdateResponse {
  success: boolean;
  updatedCount?: number;
}
