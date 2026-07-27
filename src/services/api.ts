import axios from 'axios';
import { LoginCredentials, RegisterData, User } from '../types/auth';

// Base API URL resolution from environment variables
const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
  if (envUrl) {
    const url = envUrl.replace(/\/$/, '');
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'https://medizoserver.vercel.app/api';
};
const API_URL = getApiUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Export function to get current server status
export const getServerStatus = () => ({
  activeServer: API_URL,
  isPrimary: true,
  isIIS: false,
  lastCheck: new Date().toISOString()
});

// Auth API
export const authAPI = {
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  googleLogin: async (credential: string, role = 'patient') => {
    const response = await api.post('/auth/google', { credential, role });
    return response.data;
  },
};

// Prescriptions API
export const prescriptionsAPI = {
  getMyPrescriptions: async () => {
    const response = await api.get('/prescriptions');
    return response.data;
  },
  createPrescription: async (prescriptionData: any) => {
    const response = await api.post('/prescriptions', prescriptionData);
    return response.data;
  },
  getPrescriptionById: async (id: string) => {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data;
  },
  updatePrescription: async (id: string, prescriptionData: any) => {
    const response = await api.put(`/prescriptions/${id}`, prescriptionData);
    return response.data;
  },
  deletePrescription: async (id: string) => {
    const response = await api.delete(`/prescriptions/${id}`);
    return response.data;
  },
  downloadPrescription: async (id: string) => {
    const response = await api.get(`/prescriptions/${id}/download`, { responseType: 'blob' });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getPatients: async () => {
    const response = await api.get('/users/patients');
    return response.data;
  },
  getMyPatients: async () => {
    const response = await api.get('/users/patients/my-patients');
    return response.data;
  },
  lookupPatientById: async (patientId: string) => {
    const response = await api.get(`/users/patients/lookup/${patientId}`);
    return response.data;
  },
  linkPatient: async (patientId: string) => {
    const response = await api.post(`/users/patients/link/${patientId}`);
    return response.data;
  },
  createPatient: async (patientData: any) => {
    const response = await api.post('/users/patients/create', patientData);
    return response.data;
  },
  getDoctors: async () => {
    const response = await api.get('/users/doctors');
    return response.data;
  },
  updateProfile: async (userData: any) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/users/password', { currentPassword, newPassword });
    return response.data;
  },
};

// Legacy Auth service functions
export const login = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  const response = await api.post<{ user: User; token: string }>('/auth/login', credentials);
  return response.data;
};

export const register = async (data: RegisterData): Promise<{ user: User }> => {
  const response = await api.post<{ user: User }>('/auth/register', data);
  return response.data;
};

export const googleLogin = async (credential: string, role: string = 'patient'): Promise<{ user: User; token: string }> => {
  const response = await api.post<{ user: User; token: string; isNewUser: boolean }>('/auth/google', { credential, role });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  if (typeof window === 'undefined') return {} as User;
  const role = JSON.parse(localStorage.getItem('user') || '{}')?.role;
  let endpoint = '';
  if (role === 'doctor') {
    endpoint = '/doctors/profile';
  } else if (role === 'patient') {
    endpoint = '/patients/profile';
  } else {
    throw new Error('Invalid user role');
  }
  const response = await api.get<User>(endpoint);
  return response.data;
};

export default api;
