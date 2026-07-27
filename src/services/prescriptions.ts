import api from './api';
import { CreatePrescriptionData, Prescription, UpdatePrescriptionData } from '../types/prescription';

// Prescription service functions
export const getPrescriptions = async (): Promise<Prescription[]> => {
  const response = await api.get<Prescription[]>('/prescriptions');
  return response.data;
};

export const getPrescriptionById = async (id: string): Promise<Prescription> => {
  const response = await api.get<Prescription>(`/prescriptions/${id}`);
  return response.data;
};

export const createPrescription = async (data: CreatePrescriptionData): Promise<Prescription> => {
  const response = await api.post<Prescription>('/prescriptions', data);
  return response.data;
};

export const updatePrescription = async (id: string, data: UpdatePrescriptionData): Promise<Prescription> => {
  const response = await api.put<Prescription>(`/prescriptions/${id}`, data);
  return response.data;
};

export const deletePrescription = async (id: string): Promise<void> => {
  await api.delete(`/prescriptions/${id}`);
};
