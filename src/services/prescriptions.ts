import api from './api';
import { CreatePrescriptionData, Prescription, UpdatePrescriptionData } from '../types/prescription';
import { getCachedData, setCachedData, clearApiCache, findInCachedList } from './apiCache';

// Prescription service functions with caching
export const getPrescriptions = async (forceRefresh = false): Promise<Prescription[]> => {
  if (!forceRefresh) {
    const cached = getCachedData<Prescription[]>('prescriptions_list');
    if (cached) return cached;
  }
  const response = await api.get<Prescription[]>('/prescriptions');
  return setCachedData('prescriptions_list', response.data);
};

export const getPrescriptionById = async (id: string, forceRefresh = false): Promise<Prescription> => {
  if (!forceRefresh) {
    const cached = getCachedData<Prescription>(`prescription_${id}`);
    if (cached) return cached;
    const fromList = findInCachedList<Prescription>('prescriptions_list', id);
    if (fromList) return fromList;
  }
  try {
    const response = await api.get<Prescription>(`/prescriptions/${id}`);
    return setCachedData(`prescription_${id}`, response.data);
  } catch (err) {
    const response = await api.get<Prescription>(`/prescriptions/public/${id}`);
    return setCachedData(`prescription_${id}`, response.data);
  }
};

export const createPrescription = async (data: CreatePrescriptionData): Promise<Prescription> => {
  clearApiCache();
  const response = await api.post<Prescription>('/prescriptions', data);
  return response.data;
};

export const updatePrescription = async (id: string, data: UpdatePrescriptionData): Promise<Prescription> => {
  clearApiCache();
  const response = await api.put<Prescription>(`/prescriptions/${id}`, data);
  return response.data;
};

export const deletePrescription = async (id: string): Promise<void> => {
  clearApiCache();
  await api.delete(`/prescriptions/${id}`);
};

export const dispensePrescription = async (
  id: string,
  dispenseNotes?: string,
  medStatuses?: Array<{ medicineName: string; status: string }>
): Promise<{ success: boolean; message: string; prescription: Prescription }> => {
  clearApiCache();
  const response = await api.put(`/prescriptions/${id}/dispense`, { dispenseNotes, medStatuses });
  return response.data;
};

export const extractCleanPrescriptionId = (input: string): string => {
  if (!input) return '';
  let clean = (input || '').trim();

  try {
    const paramMatch = clean.match(/[?&](?:rxId|id|code|rx|scan|verify)=([^&#]+)/i);
    if (paramMatch && paramMatch[1]) {
      return decodeURIComponent(paramMatch[1]).trim();
    }

    if (clean.includes('/')) {
      const urlWithoutQuery = clean.split('?')[0].split('#')[0];
      const segments = urlWithoutQuery.split('/').filter(Boolean);
      const last = segments.pop() || '';
      if (last && !['dashboard', 'verify-prescription', 'verify', 'view', 'prescriptions', 'public'].includes(last.toLowerCase())) {
        return decodeURIComponent(last).trim();
      }
    }
  } catch (e) {}

  return clean.split('?')[0].split('#')[0].trim();
};

export const lookupPrescriptionByCode = async (code: string): Promise<{ success: boolean; prescription: Prescription & { doctorName?: string; doctorSpecialization?: string; doctorVerified?: boolean; patientEmail?: string; medicationNames?: string[]; requiresBirthYearVerification?: boolean } }> => {
  const cleanCode = extractCleanPrescriptionId(code);
  if (!cleanCode) {
    throw new Error('Invalid prescription ID or QR code');
  }

  try {
    const response = await api.get(`/prescriptions/lookup/${encodeURIComponent(cleanCode)}`);
    return response.data;
  } catch (e) {
    const pubRes = await api.get(`/prescriptions/public/${encodeURIComponent(cleanCode)}`);
    return { success: true, prescription: pubRes.data };
  }
};

export const verifyPrescriptionBirthYear = async (
  prescriptionId: string,
  birthYear: number | string
): Promise<{ success: boolean; verified: boolean; linked: boolean; message: string; prescription: Prescription & { doctorName?: string; doctorSpecialization?: string; isUnlocked?: boolean } }> => {
  clearApiCache('doctor_patients');
  clearApiCache('users_my_patients');
  const response = await api.post(`/prescriptions/${encodeURIComponent(prescriptionId)}/verify-birth-year`, {
    birthYear: parseInt(String(birthYear), 10)
  });
  return response.data;
};

export const uploadPrescriptionTestReport = async (prescriptionId: string, formData: FormData): Promise<{ success: boolean; message: string; report: any; testReports: any[]; prescription: Prescription }> => {
  clearApiCache();
  const response = await api.post(`/prescriptions/${prescriptionId}/test-reports`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deletePrescriptionTestReport = async (prescriptionId: string, reportId: string): Promise<{ success: boolean; message: string; testReports: any[]; prescription: Prescription }> => {
  clearApiCache();
  const response = await api.delete(`/prescriptions/${prescriptionId}/test-reports/${reportId}`);
  return response.data;
};
