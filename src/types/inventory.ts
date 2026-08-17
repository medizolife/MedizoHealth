export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';

export type DosageForm = 
  | 'Tablet' 
  | 'Capsule' 
  | 'Syrup' 
  | 'Injection' 
  | 'Ointment' 
  | 'Drops' 
  | 'Inhaler' 
  | 'Powder' 
  | 'Suspension'
  | 'Cream'
  | 'Gel'
  | 'Solution'
  | 'Lotion'
  | 'Other';

export interface InventoryItem {
  id: string;
  pharmacistId: string;
  pharmacyName?: string;
  medicineName: string;
  genericName?: string;
  dosageForm: DosageForm | string;
  strength?: string;
  manufacturer?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  reorderLevel: number;
  rackLocation?: string;
  status: StockStatus;
  isCustom: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryStats {
  totalItems: number;
  totalUnits: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  totalValuation: number;
}

export interface InventoryFilter {
  search?: string;
  status?: string;
  dosageForm?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateInventoryPayload {
  medicineName: string;
  genericName?: string;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity?: number;
  unitPrice?: number;
  mrp?: number;
  reorderLevel?: number;
  rackLocation?: string;
  isCustom?: boolean;
  notes?: string;
  pharmacyName?: string;
}
