import api from './api';
import { Patient } from '../types/auth';
import { getCachedData, setCachedData, findInCachedList, clearApiCache } from './apiCache';

// Patient service functions — gets ALL patients (admin use)
export const getPatients = async (forceRefresh = false): Promise<Patient[]> => {
  if (!forceRefresh) {
    const cached = getCachedData<Patient[]>('all_patients');
    if (cached) return cached;
  }
  const response = await api.get<{ patients: Patient[] }>('/users/patients');
  return setCachedData('all_patients', response.data.patients);
};

// Gets only patients linked to the current doctor (via linkedPatients or prescriptions)
export const getMyPatients = async (forceRefresh = false): Promise<Patient[]> => {
  if (!forceRefresh) {
    const cached = getCachedData<Patient[]>('my_patients');
    if (cached) return cached;
  }
  const response = await api.get<{ patients: Patient[] }>('/users/patients/my-patients');
  const result = response.data.patients || response.data as any;
  return setCachedData('my_patients', result);
};

export const getPatientById = async (id: string, forceRefresh = false): Promise<Patient> => {
  if (!forceRefresh) {
    const cached = getCachedData<Patient>(`patient_${id}`);
    if (cached) return cached;
    const fromMy = findInCachedList<Patient>('my_patients', id);
    if (fromMy) return fromMy;
    const fromAll = findInCachedList<Patient>('all_patients', id);
    if (fromAll) return fromAll;
    const fromManaged = findInCachedList<Patient>('managed_patients', id);
    if (fromManaged) return fromManaged;
  }
  const response = await api.get<Patient>(`/users/patients/${id}`);
  return setCachedData(`patient_${id}`, response.data);
};

export const createPatient = async (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<Patient> => {
  clearApiCache();
  const response = await api.post<Patient>('/auth/register', {
    ...data,
    role: 'patient'
  });
  return response.data;
};

export const updatePatient = async (id: string, data: Partial<Patient>): Promise<Patient> => {
  clearApiCache();
  const response = await api.put<{ patient: Patient }>(`/users/patients/${id}`, data);
  return response.data.patient;
};

export const deletePatient = async (id: string): Promise<void> => {
  clearApiCache();
  await api.delete(`/users/patients/${id}`);
};

export const updatePatientProfile = async (data: Partial<Patient>): Promise<Patient> => {
  clearApiCache();
  const response = await api.put<Patient>('/patients/profile', data);
  return response.data;
};

// Enhanced patient management functions for doctors
export const getManagedPatients = async (forceRefresh = false): Promise<Patient[]> => {
  if (!forceRefresh) {
    const cached = getCachedData<Patient[]>('managed_patients');
    if (cached) return cached;
  }
  const response = await api.get<Patient[]>('/patients/doctor/managed');
  return setCachedData('managed_patients', response.data);
};

export const getPatientMedicalDetails = async (id: string): Promise<any> => {
  const response = await api.get(`/patients/${id}/medical-details`);
  return response.data;
};

export const updatePatientMedicalInfo = async (id: string, data: any): Promise<Patient> => {
  clearApiCache();
  const response = await api.put<Patient>(`/patients/${id}/medical-info`, data);
  return response.data;
};
