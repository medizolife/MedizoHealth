import api from './api';
import { clearApiCache } from './apiCache';
import {
  InventoryItem,
  InventoryStats,
  InventoryFilter,
  CreateInventoryPayload
} from '../types/inventory';

/**
 * Get inventory list with filters
 */
export const getInventoryList = async (filters: InventoryFilter = {}): Promise<{
  success: boolean;
  items: InventoryItem[];
  total: number;
  limit: number;
  offset: number;
}> => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.dosageForm) params.append('dosageForm', filters.dosageForm);
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.offset) params.append('offset', String(filters.offset));
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get(`/inventory${queryStr}`);
  return response.data;
};

/**
 * Get inventory statistics
 */
export const getInventoryStats = async (): Promise<{ success: boolean; stats: InventoryStats }> => {
  const response = await api.get('/inventory/stats');
  return response.data;
};

/**
 * Get single inventory item
 */
export const getInventoryItem = async (id: string): Promise<{ success: boolean; item: InventoryItem }> => {
  const response = await api.get(`/inventory/${id}`);
  return response.data;
};

/**
 * Add a medicine to inventory
 */
export const createInventoryItem = async (
  payload: CreateInventoryPayload
): Promise<{ success: boolean; message: string; item: InventoryItem }> => {
  clearApiCache();
  const response = await api.post('/inventory', payload);
  return response.data;
};

/**
 * Bulk import medicines
 */
export const bulkImportInventory = async (
  medicines: CreateInventoryPayload[]
): Promise<{ success: boolean; message: string; count: number }> => {
  clearApiCache();
  const response = await api.post('/inventory/bulk-import', { medicines });
  return response.data;
};

/**
 * Update inventory medicine item
 */
export const updateInventoryItem = async (
  id: string,
  payload: Partial<CreateInventoryPayload>
): Promise<{ success: boolean; message: string; item: InventoryItem }> => {
  clearApiCache();
  const response = await api.put(`/inventory/${id}`, payload);
  return response.data;
};

/**
 * Quick +/- quantity adjustment
 */
export const adjustStockQuantity = async (
  id: string,
  delta: number
): Promise<{ success: boolean; message: string; item: InventoryItem }> => {
  clearApiCache();
  const response = await api.patch(`/inventory/${id}/stock`, { delta });
  return response.data;
};

/**
 * Delete medicine from stock
 */
export const deleteInventoryItem = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  clearApiCache();
  const response = await api.delete(`/inventory/${id}`);
  return response.data;
};

/**
 * Deduct stock for dispensed medicines
 */
export const batchDeductDispensedStock = async (
  medications: Array<{ name: string; quantity?: number; qty?: number }>
): Promise<{ success: boolean; message: string; updatedCount: number }> => {
  clearApiCache();
  const response = await api.post('/inventory/batch-dispense', { medications });
  return response.data;
};
