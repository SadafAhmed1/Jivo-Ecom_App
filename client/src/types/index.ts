export interface ApiError {
  message: string;
  errors?: any[];
}

export interface SearchableItem {
  id: number;
  name: string;
  code: string;
  category?: string;
  subcategory?: string;
  gstRate?: number;
}

export interface POSummary {
  totalItems: number;
  totalQuantity: number;
  totalValueWithoutTax: number;
  totalValueWithTax: number;
}
