import api from './api';
import { Patient } from '../types/auth';

// Patient service functions
export const getPatients = async (): Promise<Patient[]> => {
  const response = await api.get<{ patients: Patient[] }>('/users/patients');
  return response.data.patients;
};

export const getPatientById = async (id: string): Promise<Patient> => {
  const response = await api.get<Patient>(`/users/patients/${id}`);
  return response.data;
};

export const createPatient = async (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<Patient> => {
  const response = await api.post<Patient>('/auth/register', {
    ...data,
    role: 'patient'
  });
  return response.data;
};

export const updatePatient = async (id: string, data: Partial<Patient>): Promise<Patient> => {
  const response = await api.put<{ patient: Patient }>(`/users/patients/${id}`, data);
  return response.data.patient;
};

export const deletePatient = async (id: string): Promise<void> => {
  await api.delete(`/users/patients/${id}`);
};

export const updatePatientProfile = async (data: Partial<Patient>): Promise<Patient> => {
  const response = await api.put<Patient>('/patients/profile', data);
  return response.data;
};

// Enhanced patient management functions for doctors
export const getManagedPatients = async (): Promise<Patient[]> => {
  const response = await api.get<Patient[]>('/patients/doctor/managed');
  return response.data;
};

export const getPatientMedicalDetails = async (id: string): Promise<any> => {
  const response = await api.get(`/patients/${id}/medical-details`);
  return response.data;
};

export const updatePatientMedicalInfo = async (id: string, data: any): Promise<Patient> => {
  const response = await api.put<Patient>(`/patients/${id}/medical-info`, data);
  return response.data;
};
