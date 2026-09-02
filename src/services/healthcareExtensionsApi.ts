import axios from 'axios';
import { getApiBaseUrl } from './api';
import { fetchWithSWR, clearApiCache } from './apiCache';

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
    clearApiCache('doctor_bills');
    clearApiCache('my_bills');
    const response = await api.post(`/billing/generate-from-prescription/${prescriptionId}`, options);
    return response.data;
  },
  createBill: async (billData: any) => {
    clearApiCache('doctor_bills');
    clearApiCache('my_bills');
    const response = await api.post('/billing', billData);
    return response.data;
  },
  getMyBills: async (forceRefresh = false) => {
    return fetchWithSWR('my_bills', async () => {
      const response = await api.get('/billing/my-bills');
      return response.data;
    }, { forceRefresh });
  },
  getDoctorBills: async (forceRefresh = false) => {
    return fetchWithSWR('doctor_bills', async () => {
      const response = await api.get('/billing/doctor');
      return response.data;
    }, { forceRefresh });
  },
  getBillById: async (id: string) => {
    return fetchWithSWR(`bill_${id}`, async () => {
      const response = await api.get(`/billing/${id}`);
      return response.data;
    });
  },
  updateBillStatus: async (id: string, status: string, paymentData?: any) => {
    clearApiCache('doctor_bills');
    clearApiCache('my_bills');
    clearApiCache(`bill_${id}`);
    const response = await api.put(`/billing/${id}/status`, { status, ...paymentData });
    return response.data;
  },
  recordBillPayment: async (id: string, paymentData: any) => {
    clearApiCache('doctor_bills');
    clearApiCache('my_bills');
    clearApiCache(`bill_${id}`);
    const response = await api.post(`/billing/${id}/payment`, paymentData);
    return response.data;
  },
  recordPartialPayment: async (id: string, paymentData: { amount: number; paymentMode: string; upiTransactionRef?: string; receiptNumber?: string; notes?: string }) => {
    clearApiCache('doctor_bills');
    clearApiCache('my_bills');
    clearApiCache(`bill_${id}`);
    const response = await api.post(`/billing/${id}/payments`, paymentData);
    return response.data;
  },
  checkFollowupEligibility: async (patientId: string) => {
    const response = await api.get(`/billing/check-followup/${patientId}`);
    return response.data;
  },
  getDoctorRateCard: async (forceRefresh = false) => {
    return fetchWithSWR('doctor_rate_card', async () => {
      const response = await api.get('/doctors/rate-card');
      return response.data;
    }, { forceRefresh });
  },
  updateDoctorRateCard: async (rateCard: any) => {
    clearApiCache('doctor_rate_card');
    const response = await api.put('/doctors/rate-card', rateCard);
    return response.data;
  },
  getDailyCollectionReport: async (date?: string) => {
    const response = await api.get('/billing/doctor/day-close', { params: { date } });
    return response.data;
  },
  getClinicServices: async (forceRefresh = false) => {
    return fetchWithSWR('clinic_services', async () => {
      const response = await api.get('/billing/services');
      return response.data;
    }, { forceRefresh });
  },
  createClinicService: async (serviceData: any) => {
    clearApiCache('clinic_services');
    const response = await api.post('/billing/services', serviceData);
    return response.data;
  },
  dispatchBill: async (id: string, channels?: string) => {
    const response = await api.post(`/billing/${id}/dispatch`, { channels: channels || 'whatsapp_sms' });
    return response.data;
  },
  cancelBill: async (id: string, reason: string) => {
    clearApiCache('doctor_bills');
    clearApiCache('my_bills');
    clearApiCache(`bill_${id}`);
    const response = await api.post(`/billing/${id}/cancel`, { reason });
    return response.data;
  },
  downloadBillPdf: async (id: string, billNumber?: string) => {
    const response = await api.get(`/billing/${id}/pdf`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${billNumber || 'Medical_Bill'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  // ─── DOCTOR NETWORK & REFERRALS APIs ───
  getDoctorNetwork: async (forceRefresh = false) => {
    return fetchWithSWR('doctor_network', async () => {
      const response = await api.get('/network');
      return response.data;
    }, { forceRefresh });
  },
  getMyDoctorCard: async (forceRefresh = false) => {
    return fetchWithSWR('my_doctor_card', async () => {
      const response = await api.get('/network/my-card');
      return response.data;
    }, { forceRefresh });
  },
  verifyDoctor: async (query: string, type?: string) => {
    const response = await api.post('/network/verify-doctor', { query, type });
    return response.data;
  },
  getDoctorDirectory: async (search?: string) => {
    const response = await api.get(search ? `/network/directory?search=${encodeURIComponent(search)}` : '/network/directory');
    return response.data;
  },
  connectDoctor: async (connectedDoctorId: string, notes?: string) => {
    clearApiCache('doctor_network');
    const response = await api.post('/network/connect', { connectedDoctorId, notes });
    return response.data;
  },
  removeDoctorFromNetwork: async (connectedDoctorId: string) => {
    clearApiCache('doctor_network');
    const response = await api.delete(`/network/${connectedDoctorId}`);
    return response.data;
  },
  createReferral: async (referralData: any) => {
    clearApiCache('referrals_');
    const response = await api.post('/referrals', referralData);
    return response.data;
  },
  getOutgoingReferrals: async (forceRefresh = false) => {
    return fetchWithSWR('referrals_outgoing', async () => {
      const response = await api.get('/referrals/outgoing');
      return response.data;
    }, { forceRefresh });
  },
  getIncomingReferrals: async (forceRefresh = false) => {
    return fetchWithSWR('referrals_incoming', async () => {
      const response = await api.get('/referrals/incoming');
      return response.data;
    }, { forceRefresh });
  },
  getPatientReferrals: async (patientId: string) => {
    return fetchWithSWR(`referrals_patient_${patientId}`, async () => {
      const response = await api.get(`/referrals/patient/${patientId}`);
      return response.data;
    });
  },
  updateReferralStatus: async (id: string, status: string, responseNotes?: string) => {
    clearApiCache('referrals_');
    const response = await api.put(`/referrals/${id}/status`, { status, responseNotes });
    return response.data;
  },
  getNearbyProfessionals: async (lat: number, lng: number, radius = 15, type = 'all') => {
    const response = await api.get(`/network/nearby?lat=${lat}&lng=${lng}&radius=${radius}&type=${encodeURIComponent(type)}`);
    return response.data;
  },

  // ─── HOME CARE & VISIT RECORDS APIs ───
  requestHomeCare: async (requestData: any) => {
    clearApiCache('home_care_requests');
    const response = await api.post('/home-care/request', requestData);
    return response.data;
  },
  getHomeCareRequests: async (forceRefresh = false) => {
    return fetchWithSWR('home_care_requests', async () => {
      const response = await api.get('/home-care/requests');
      return response.data;
    }, { forceRefresh });
  },
  assignNurseToRequest: async (requestId: string, nurseId: string) => {
    clearApiCache('home_care_requests');
    const response = await api.put(`/home-care/requests/${requestId}/assign`, { nurseId });
    return response.data;
  },
  updateHomeCareStatus: async (requestId: string, status: string, notes?: string) => {
    clearApiCache('home_care_requests');
    const response = await api.put(`/home-care/requests/${requestId}/status`, { status, notes });
    return response.data;
  },
  recordHomeCareVitals: async (requestId: string, vitalsData: any) => {
    clearApiCache('home_care_requests');
    const response = await api.post(`/home-care/requests/${requestId}/vitals`, vitalsData);
    return response.data;
  },
  createVisitRecord: async (recordData: any) => {
    const response = await api.post('/home-care/visit-records', recordData);
    return response.data;
  },
  getPatientVisitRecords: async (patientId: string) => {
    const response = await api.get(`/home-care/visit-records/patient/${patientId}`);
    return response.data;
  },

  // ─── FAMILY HEALTH PROFILES APIs ───
  getFamilyProfiles: async () => {
    return fetchWithSWR('family_profiles', async () => {
      const response = await api.get('/family-profiles');
      return response.data;
    });
  },
  createFamilyProfile: async (profileData: any) => {
    clearApiCache('family_profiles');
    const response = await api.post('/family-profiles', profileData);
    return response.data;
  },
  updateFamilyProfile: async (id: string, profileData: any) => {
    clearApiCache('family_profiles');
    const response = await api.put(`/family-profiles/${id}`, profileData);
    return response.data;
  },
  deleteFamilyProfile: async (id: string) => {
    clearApiCache('family_profiles');
    const response = await api.delete(`/family-profiles/${id}`);
    return response.data;
  },
  switchActiveProfile: async (id: string) => {
    clearApiCache('family_profiles');
    const response = await api.post(`/family-profiles/${id}/switch`);
    return response.data;
  },

  // ─── NURSE ASSIGNMENTS & HOME CARE SCHEDULES ───
  getDoctorAffiliatedNurses: async () => {
    const response = await api.get('/nurse-assignments/affiliations/my-nurses');
    return response.data;
  },
  getNurseAssignedPatients: async () => {
    const response = await api.get('/nurse-assignments/my-patients');
    return response.data;
  },
  getNurseSchedule: async () => {
    const response = await api.get('/nurse-schedules/my-schedule');
    return response.data;
  },
  updateScheduleStatus: async (scheduleId: string, status: string) => {
    const response = await api.put(`/nurse-schedules/${scheduleId}/status`, { status });
    return response.data;
  },
  recordVisitDetails: async (details: any) => {
    const response = await api.post('/home-care/visit-records', details);
    return response.data;
  }
};
