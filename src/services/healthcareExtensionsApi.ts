import axios from 'axios';
import { getApiBaseUrl } from './api';

const API_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

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

export const healthcareApi = {
  // ─── BILLING APIs ───
  generateBillFromPrescription: async (prescriptionId: string, options: any) => {
    const response = await api.post(`/billing/generate-from-prescription/${prescriptionId}`, options);
    return response.data;
  },
  createBill: async (billData: any) => {
    const response = await api.post('/billing', billData);
    return response.data;
  },
  getMyBills: async () => {
    const response = await api.get('/billing/my-bills');
    return response.data;
  },
  getDoctorBills: async () => {
    const response = await api.get('/billing/doctor');
    return response.data;
  },
  getBillById: async (id: string) => {
    const response = await api.get(`/billing/${id}`);
    return response.data;
  },
  updateBillStatus: async (id: string, status: string, paymentData?: any) => {
    const response = await api.put(`/billing/${id}/status`, { status, ...paymentData });
    return response.data;
  },
  recordBillPayment: async (id: string, paymentData: any) => {
    const response = await api.post(`/billing/${id}/payment`, paymentData);
    return response.data;
  },

  // ─── DOCTOR NETWORK & REFERRALS APIs ───
  getDoctorNetwork: async () => {
    const response = await api.get('/network');
    return response.data;
  },
  getDoctorDirectory: async () => {
    const response = await api.get('/network/directory');
    return response.data;
  },
  connectDoctor: async (connectedDoctorId: string, notes?: string) => {
    const response = await api.post('/network/connect', { connectedDoctorId, notes });
    return response.data;
  },
  removeDoctorFromNetwork: async (connectedDoctorId: string) => {
    const response = await api.delete(`/network/${connectedDoctorId}`);
    return response.data;
  },
  createReferral: async (referralData: any) => {
    const response = await api.post('/referrals', referralData);
    return response.data;
  },
  getOutgoingReferrals: async () => {
    const response = await api.get('/referrals/outgoing');
    return response.data;
  },
  getIncomingReferrals: async () => {
    const response = await api.get('/referrals/incoming');
    return response.data;
  },
  getPatientReferrals: async (patientId: string) => {
    const response = await api.get(`/referrals/patient/${patientId}`);
    return response.data;
  },
  updateReferralStatus: async (id: string, status: string, responseNotes?: string) => {
    const response = await api.put(`/referrals/${id}/status`, { status, responseNotes });
    return response.data;
  },

  // ─── HOME CARE & VISIT RECORDS APIs ───
  requestHomeCare: async (requestData: any) => {
    const response = await api.post('/home-care/request', requestData);
    return response.data;
  },
  getHomeCareRequests: async () => {
    const response = await api.get('/home-care/requests');
    return response.data;
  },
  assignNurseToRequest: async (requestId: string, nurseId: string) => {
    const response = await api.put(`/home-care/requests/${requestId}/assign`, { nurseId });
    return response.data;
  },
  updateHomeCareStatus: async (requestId: string, status: string) => {
    const response = await api.put(`/home-care/requests/${requestId}/status`, { status });
    return response.data;
  },
  recordVisitDetails: async (visitData: any) => {
    const response = await api.post('/home-care/visit-records', visitData);
    return response.data;
  },
  getPatientVisitRecords: async (patientId: string) => {
    const response = await api.get(`/home-care/visit-records/patient/${patientId}`);
    return response.data;
  },
  getMyVisitRecords: async () => {
    const response = await api.get('/home-care/visit-records/my-visits');
    return response.data;
  },

  // ─── NURSE ASSIGNMENTS & SCHEDULING APIs ───
  getNurseAssignedPatients: async () => {
    const response = await api.get('/nurse-assignments/my-patients');
    return response.data;
  },
  getPatientAssignedNurses: async (patientId: string) => {
    const response = await api.get(`/nurse-assignments/patient/${patientId}`);
    return response.data;
  },
  assignNurseToPatient: async (assignmentData: any) => {
    const response = await api.post('/nurse-assignments', assignmentData);
    return response.data;
  },
  getDoctorAffiliatedNurses: async () => {
    const response = await api.get('/nurse-assignments/affiliations/my-nurses');
    return response.data;
  },
  getNurseSchedule: async (startDate?: string, endDate?: string) => {
    const response = await api.get('/nurse-schedules/my-schedule', { params: { startDate, endDate } });
    return response.data;
  },
  scheduleNurseVisit: async (scheduleData: any) => {
    const response = await api.post('/nurse-schedules', scheduleData);
    return response.data;
  },
  updateScheduleStatus: async (scheduleId: string, status: string, cancellationReason?: string) => {
    const response = await api.put(`/nurse-schedules/${scheduleId}/status`, { status, cancellationReason });
    return response.data;
  }
};
