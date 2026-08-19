import axios from 'axios';
import { LoginCredentials, RegisterData, User } from '../types/auth';

// Base API URL resolution from environment variables
export const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
  if (envUrl) {
    let cleanUrl = envUrl.trim().replace(/\/+$/, '');
    cleanUrl = cleanUrl.replace(/\/health(\/api)?$/, '');
    cleanUrl = cleanUrl.replace(/\/api$/, '');
    return `${cleanUrl}/api`;
  }
  return 'https://medizoserver.medizolife.workers.dev/api';
};
const API_URL = getApiBaseUrl();

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
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    const requestUrl = error.config?.url || '';
    if (error.response?.status === 401 && requestUrl.includes('/auth/me')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
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
  loginMobile: async (mobileNumber: string, dateOfBirth: string, password: string) => {
    const response = await api.post('/auth/login-mobile', { mobileNumber, dateOfBirth, password });
    return response.data;
  },
  sendLoginOtp: async (email: string) => {
    const response = await api.post('/auth/send-login-otp', { email });
    return response.data;
  },
  loginEmailOtp: async (email: string, otp: string) => {
    const response = await api.post('/auth/login-email-otp', { email, otp });
    return response.data;
  },
  forgotPassword: async (emailOrMobile: string) => {
    const response = await api.post('/auth/forgot-password', { emailOrMobile });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  googleLogin: async (credential: string, role?: string) => {
    const response = await api.post('/auth/google', { credential, role });
    return response.data;
  },
  updateEmail: async (email: string) => {
    const response = await api.post('/auth/update-email', { email });
    return response.data;
  },
  verifyDob: async (dateOfBirth: string) => {
    const response = await api.post('/auth/verify-dob', { dateOfBirth });
    return response.data;
  },
  updatePhone: async (phone: string) => {
    const response = await api.post('/auth/update-phone', { phone });
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
    try {
      const response = await api.get(`/prescriptions/${id}/download`, { responseType: 'blob' });
      return response.data;
    } catch (err) {
      const response = await api.get(`/prescriptions/public/${id}/download`, { responseType: 'blob' });
      return response.data;
    }
  },
  uploadExternalPrescription: async (formData: FormData) => {
    const response = await api.post('/prescriptions/upload-external', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  getExternalPrescriptions: async (patientId?: string) => {
    const url = patientId ? `/prescriptions/external?patientId=${patientId}` : '/prescriptions/external';
    const response = await api.get(url);
    return response.data;
  },
  deleteExternalPrescription: async (id: string) => {
    const response = await api.delete(`/prescriptions/external/${id}`);
    return response.data;
  },
  uploadTestReport: async (prescriptionId: string, formData: FormData) => {
    clearApiCache();
    const response = await api.post(`/prescriptions/${prescriptionId}/test-reports`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  deleteTestReport: async (prescriptionId: string, reportId: string) => {
    clearApiCache();
    const response = await api.delete(`/prescriptions/${prescriptionId}/test-reports/${reportId}`);
    return response.data;
  },
};

// Users API
import { getCachedData, setCachedData, clearApiCache } from './apiCache';

export const usersAPI = {
  getPatients: async () => {
    const response = await api.get('/users/patients');
    return response.data;
  },
  getMyPatients: async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCachedData<any>('users_my_patients');
      if (cached) return cached;
    }
    const response = await api.get('/users/patients/my-patients');
    return setCachedData('users_my_patients', response.data);
  },
  lookupPatientById: async (patientId: string) => {
    const response = await api.get(`/users/patients/lookup/${patientId}`);
    return response.data;
  },
  linkPatient: async (patientId: string) => {
    clearApiCache();
    const response = await api.post(`/users/patients/link/${patientId}`);
    return response.data;
  },
  createPatient: async (patientData: any) => {
    clearApiCache();
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
  deleteAccount: async () => {
    const response = await api.delete('/users/account');
    return response.data;
  },
};

// DigiLocker API
// Authorize runs on primary API server (Cloudflare Workers, 0ms cold start)
// Callback routes to Vercel (https://medizoserver.vercel.app/api/digilocker/callback) for DigiLocker domain whitelist
const DIGILOCKER_VERCEL_SERVER = process.env.NEXT_PUBLIC_DIGILOCKER_SERVER_URL || process.env.REACT_APP_DIGILOCKER_SERVER_URL || 'https://medizoserver.vercel.app/api';

export const digilockerAPI = {
  getStatus: async () => {
    const response = await api.get('/digilocker/status');
    return response.data;
  },
  pingServer: async () => {
    try {
      const pingUrl = DIGILOCKER_VERCEL_SERVER.replace(/\/api$/, '') + '/api/health';
      await fetch(pingUrl, { method: 'GET', mode: 'cors' });
      return true;
    } catch (e) {
      return false;
    }
  },
  getAuthorizeUrl: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://m.medizo.life';
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/digilocker/authorize?token=${encodeURIComponent(token)}&client_url=${encodeURIComponent(origin)}`;
  },
};

// Legacy Auth service functions
export const login = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  const response = await api.post<{ user: User; token: string }>('/auth/login', credentials);
  return response.data;
};

export const register = async (data: RegisterData): Promise<{ user: User; token: string }> => {
  const response = await api.post<{ user: User; token: string }>('/auth/register', data);
  return response.data;
};

export const googleLogin = async (credential: string, role?: string): Promise<{ user: User; token: string; isNewUser: boolean; requiresRoleSelection?: boolean; googleUserInfo?: any }> => {
  const response = await api.post<{ user: User; token: string; isNewUser: boolean; requiresRoleSelection?: boolean; googleUserInfo?: any }>('/auth/google', { credential, role });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  if (typeof window === 'undefined') return {} as User;
  let role = '';
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      role = JSON.parse(rawUser)?.role || '';
    }
  } catch (e) {
    role = '';
  }
  let endpoint = '/auth/me';
  if (role === 'doctor') {
    endpoint = '/doctors/profile';
  } else if (role === 'patient') {
    endpoint = '/patients/profile';
  }
  const response = await api.get<User>(endpoint);
  return response.data;
};

export default api;
