export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface SalesReport {
  date: string;
  totalSales: number;
  totalRevenue: number;
  totalGst: number;
  netRevenue: number;
}

export interface StockReport {
  medicineId: string;
  name: string;
  totalStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}

export interface ExpiryReport {
  medicineId: string;
  name: string;
  batchNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
  quantity: number;
}
