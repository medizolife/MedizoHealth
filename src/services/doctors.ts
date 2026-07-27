import api from './api';
import { Doctor } from '../types/auth';

// Doctor service functions
export const getDoctors = async (): Promise<Doctor[]> => {
  const response = await api.get<Doctor[]>('/doctors');
  return response.data;
};

export const updateDoctorProfile = async (data: Partial<Doctor>): Promise<Doctor> => {
  const response = await api.put<Doctor>('/doctors/profile', data);
  return response.data;
};

export const uploadProfileImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('profileImage', file);
  const response = await api.post<{ url: string }>('/doctors/upload-profile-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadClinicLogo = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('clinicLogo', file);
  const response = await api.post<{ url: string }>('/doctors/upload-clinic-logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadSignature = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('signature', file);
  const response = await api.post<{ url: string }>('/doctors/upload-signature', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
