import axios from 'axios';

// Server URLs resolved from environment variables
const resolveApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return 'https://medizoserver.vercel.app/api';
};
const PRIMARY_SERVER = resolveApiUrl();
const LOCAL_SERVER = 'http://localhost:5000/api';  // Local development

// Cache for active server URL
let activeServerUrl = null;
let serverCheckInProgress = false;
let lastServerCheck = 0;
const SERVER_CHECK_INTERVAL = 60000; // Re-check server every 60 seconds

// Function to check if a server is available
const checkServerHealth = async (serverUrl) => {
  try {
    const healthUrl = serverUrl.replace('/api', '/health');
    const response = await axios.get(healthUrl, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.log(`Server ${serverUrl} is not available:`, error.message);
    return false;
  }
};

// Function to determine the best available server
const getActiveServer = async () => {
  const now = Date.now();
  
  // Return cached server if recently checked
  if (activeServerUrl && (now - lastServerCheck) < SERVER_CHECK_INTERVAL) {
    return activeServerUrl;
  }
  
  // Prevent multiple simultaneous checks
  if (serverCheckInProgress) {
    // Wait for the check to complete
    while (serverCheckInProgress) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return activeServerUrl;
  }
  
  serverCheckInProgress = true;
  
  try {
    // In development mode, use primary server
    if (process.env.NODE_ENV !== 'production') {
      activeServerUrl = PRIMARY_SERVER;
      lastServerCheck = now;
      console.log('Development mode: Using primary server:', PRIMARY_SERVER);
      return activeServerUrl;
    }
    
    // In production, check backend server health
    console.log('Checking primary backend server...');
    if (await checkServerHealth(PRIMARY_SERVER)) {
      activeServerUrl = PRIMARY_SERVER;
      lastServerCheck = now;
      console.log('✅ Using PRIMARY server:', PRIMARY_SERVER);
      return activeServerUrl;
    }
    
    // If check fails, default to primary server anyway (may be cold starting)
    console.log('Server unreachable on initial check, defaulting to primary server (may be cold starting)');
    activeServerUrl = PRIMARY_SERVER;
    lastServerCheck = now;
    return activeServerUrl;
  } finally {
    serverCheckInProgress = false;
  }
};

// Initialize server check on load
getActiveServer();

// Create axios instance with dynamic baseURL
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to set baseURL dynamically and include auth token
api.interceptors.request.use(
  async (config) => {
    // Set the active server URL
    const serverUrl = await getActiveServer();
    config.baseURL = serverUrl;
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors and failover
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If request failed due to network error and we haven't retried yet
    if (!error.response && !originalRequest._retry && process.env.NODE_ENV === 'production') {
      originalRequest._retry = true;
      
      // Force server recheck
      activeServerUrl = null;
      lastServerCheck = 0;
      
      console.log('Request failed, attempting failover...');
      const newServerUrl = await getActiveServer();
      originalRequest.baseURL = newServerUrl;
      
      return api(originalRequest);
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Export function to get current server status
export const getServerStatus = () => ({
  activeServer: activeServerUrl,
  isPrimary: activeServerUrl === PRIMARY_SERVER,
  isIIS: activeServerUrl === IIS_SERVER,
  lastCheck: new Date(lastServerCheck).toISOString()
});

// Auth API
export const authAPI = {
  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Get current user
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user data' };
    }
  },

  // Google OAuth login
  googleLogin: async (credential, role = 'patient') => {
    try {
      const response = await api.post('/auth/google', { credential, role });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Google login failed' };
    }
  },
};

// Prescriptions API
export const prescriptionsAPI = {
  // Get all prescriptions for current user
  getMyPrescriptions: async () => {
    try {
      const response = await api.get('/prescriptions');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch prescriptions' };
    }
  },

  // Create new prescription (doctors only)
  createPrescription: async (prescriptionData) => {
    try {
      const response = await api.post('/prescriptions', prescriptionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create prescription' };
    }
  },

  // Get prescription by ID
  getPrescriptionById: async (id) => {
    try {
      const response = await api.get(`/prescriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch prescription' };
    }
  },

  // Update prescription (doctors only)
  updatePrescription: async (id, prescriptionData) => {
    try {
      const response = await api.put(`/prescriptions/${id}`, prescriptionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update prescription' };
    }
  },

  // Delete prescription (doctors only)
  deletePrescription: async (id) => {
    try {
      const response = await api.delete(`/prescriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete prescription' };
    }
  },

  // Download prescription as PDF
  downloadPrescription: async (id) => {
    try {
      const response = await api.get(`/prescriptions/${id}/download`, {
        responseType: 'blob', // Important for file downloads
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `prescription-${id}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Download started' };
    } catch (error) {
      throw error.response?.data || { message: 'Failed to download prescription' };
    }
  },
};

// Users API
export const usersAPI = {
  // Get all patients (doctors only) - DEPRECATED for security, use getMyPatients instead
  getPatients: async () => {
    try {
      const response = await api.get('/users/patients');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch patients' };
    }
  },

  // Get only patients that the doctor has prescribed to (secure)
  getMyPatients: async () => {
    try {
      const response = await api.get('/users/patients/my-patients');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch my patients' };
    }
  },

  // Look up a patient by their ID (for adding existing patients)
  lookupPatientById: async (patientId) => {
    try {
      const response = await api.get(`/users/patients/lookup/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to find patient' };
    }
  },

  // Link a patient to the doctor (persist the relationship)
  linkPatient: async (patientId) => {
    try {
      const response = await api.post(`/users/patients/link/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to link patient' };
    }
  },

  // Create new patient (doctors only)
  createPatient: async (patientData) => {
    try {
      const response = await api.post('/users/patients/create', patientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create patient' };
    }
  },

  // Get all doctors
  getDoctors: async () => {
    try {
      const response = await api.get('/users/doctors');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch doctors' };
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/users/password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },
};

export default api;
