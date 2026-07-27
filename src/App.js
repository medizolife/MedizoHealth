'use client';
import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import QRCode from 'qrcode.react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Button, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  CardActions,
  Avatar,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Tab,
  Tabs,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  IconButton,
  TextField,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  useMediaQuery,
  useTheme,
  keyframes,
  Slide,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material';
import { 
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CameraAlt as CameraAltIcon,
  Menu as MenuIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  LocalHospital as LocalHospitalIcon,
  Medication as MedicationIcon,
  QrCode as QrCodeIcon,
  Business as BusinessIcon,
  Language as LanguageIcon,
  PhotoCamera as PhotoCameraIcon,
  ContactPhone as ContactPhoneIcon,
  Link as LinkIcon,
  Create as CreateIcon,
  Description as DescriptionIcon,
  QrCodeScanner as QrCodeScannerIcon,
  CloudDownload as CloudDownloadIcon,
  VerifiedUser as VerifiedUserIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  OpenInNew as OpenInNewIcon,
  Favorite as FavoriteIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import axios from 'axios';

// Import auth components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

// Import prescription components
import PrescriptionForm from './components/prescriptions/PrescriptionForm';
import PrescriptionList from './components/prescriptions/PrescriptionList';

// Import auth context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// API Base URL - use env variable if configured, otherwise fallback
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
const API_BASE_URL = configuredApiUrl 
  ? configuredApiUrl.replace(/\/api\/?$/, '') 
  : (process.env.NODE_ENV === 'production' ? 'https://medizoserver.vercel.app' : 'http://localhost:5000');

// Beating heart animation for logo
const beatAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.15);
  }
  40% {
    transform: scale(1);
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`;

// Beating Logo Component
const BeatingLogo = ({ size = 80 }) => (
  <Box
    component="img"
    src="/LOGO.png"
    alt="Medizo Logo"
    sx={{
      width: size,
      height: size,
      animation: `${beatAnimation} 1.2s ease-in-out infinite`,
      borderRadius: '8px'
    }}
  />
);

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#134F4D',
    },
    secondary: {
      main: '#134F4D',
    },
  },
});

const SlideTransition = React.forwardRef(function SlideTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Main app content component
const AppContent = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const hasActiveSession = isAuthenticated || (typeof window !== 'undefined' && Boolean(localStorage.getItem('token')));
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authTabValue, setAuthTabValue] = useState(0);
  const [defaultRole, setDefaultRole] = useState('patient');
  const [activeContent, setActiveContent] = useState('dashboard');
  
  // Mobile responsive state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  // Prescription management state
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, prescriptionId: null, action: null });
  const [viewPrescriptionDialog, setViewPrescriptionDialog] = useState({ open: false, prescription: null });
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [policyDialog, setPolicyDialog] = useState({ open: false, type: null });

  const policyContent = {
    'Privacy Policy': {
      lastUpdated: 'February 2026',
      sections: [
        { title: 'Information We Collect', body: 'We collect information you provide directly to us when you create an account, including your name, email address, role (doctor or patient), and professional details such as medical license number and specialization for doctors. We also collect health-related data you input into the platform, including prescriptions, diagnoses, medications, and medical history.' },
        { title: 'How We Use Your Information', body: 'Your information is used solely to provide the Medizo digital prescription platform services. This includes creating and managing prescriptions, enabling QR code verification, generating PDF documents, and facilitating secure communication between doctors and patients. We do not sell, rent, or share your personal data with third parties for marketing purposes.' },
        { title: 'Data Security', body: 'All data is encrypted in transit using TLS/HTTPS. Passwords are hashed using industry-standard bcrypt encryption. Access to patient records is strictly limited to the treating doctor and the patient themselves. JWT tokens are used for session authentication and expire automatically to prevent unauthorized access.' },
        { title: 'Data Retention', body: 'Prescription records are retained for a minimum of 7 years in compliance with standard medical record-keeping regulations. You may request deletion of your account and associated data at any time by contacting support@medizo.health, subject to legal obligations.' },
        { title: 'Your Rights', body: 'You have the right to access, correct, or delete your personal data at any time. You may also request a copy of all data we hold about you. To exercise these rights, contact us at info@medizo.health.' },
        { title: 'Contact', body: 'For any privacy-related concerns, email us at info@medizo.health or write to Medizo Health Technologies, India.' },
      ]
    },
    'Terms of Service': {
      lastUpdated: 'February 2026',
      sections: [
        { title: 'Acceptance of Terms', body: 'By accessing or using Medizo, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform. These terms apply to all users, including doctors, patients, and any other visitors.' },
        { title: 'Medical Disclaimer', body: 'Medizo is a digital prescription management platform and is not a substitute for professional medical advice, diagnosis, or treatment. Prescriptions generated through Medizo are issued solely by licensed medical professionals registered on the platform. Always consult your healthcare provider for medical decisions.' },
        { title: 'User Responsibilities', body: 'Doctors must hold a valid medical license and are solely responsible for the accuracy and appropriateness of prescriptions they create. Patients are responsible for using their prescriptions as directed by their doctor. All users must provide accurate information and maintain the confidentiality of their account credentials.' },
        { title: 'Prohibited Use', body: 'You may not use Medizo for any unlawful purpose, to create fraudulent prescriptions, to impersonate a medical professional, or to attempt to gain unauthorized access to other users\' data. Violations will result in immediate account termination and may be reported to relevant authorities.' },
        { title: 'Intellectual Property', body: 'All content, branding, and technology on Medizo, including the logo, design, and software, are the intellectual property of Medizo Health Technologies. You may not reproduce, distribute, or create derivative works without explicit written permission.' },
        { title: 'Limitation of Liability', body: 'Medizo is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Medizo Health Technologies shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.' },
      ]
    },
    'Cookie Policy': {
      lastUpdated: 'February 2026',
      sections: [
        { title: 'What Are Cookies', body: 'Cookies are small text files placed on your device when you visit a website. They help the website remember your preferences and improve your experience. Medizo uses cookies and similar technologies to keep you logged in and to understand how you interact with our platform.' },
        { title: 'Cookies We Use', body: 'Authentication Cookies: These are essential cookies used to maintain your login session securely. Without them, you would need to log in on every page. Session Cookies: Temporary cookies that expire when you close your browser, used to store temporary state such as your current view or form data.' },
        { title: 'Third-Party Cookies', body: 'We use Google OAuth for authentication. Google may set cookies as part of this process, governed by Google\'s own Privacy Policy. We do not use advertising or tracking cookies from third parties.' },
        { title: 'Managing Cookies', body: 'You can control cookies through your browser settings. Blocking essential cookies will prevent you from logging in to Medizo. Most browsers allow you to view, delete, and block cookies via their Settings or Preferences menu.' },
        { title: 'Updates to This Policy', body: 'We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated date. Continued use of Medizo after changes constitutes acceptance of the updated policy.' },
        { title: 'Contact', body: 'For any questions about our use of cookies, please contact support@medizo.health.' },
      ]
    }
  };

  // Security settings state
  const [securityForm, setSecurityForm] = useState({
    firstName: '',
    lastName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    // Doctor-specific fields
    specialization: '',
    licenseNumber: '',
    contactNumber: '',
    email: '',
    clinicAddress: '',
    experience: '',
    qualifications: '',
    // Profile and clinic images
    profileImage: '',
    clinicLogo: '',
    signature: '',
    // Extended contact information
    clinicName: '',
    alternateEmail: '',
    secondaryPhone: '',
    fax: '',
    whatsapp: '',
    website: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: ''
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingClinicLogo, setUploadingClinicLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  // Profile state
  const [profileTab, setProfileTab] = useState(0); // 0: Personal, 1: Allergies, 2: History, 3: Habits
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    bloodType: '',
    gender: '',
    allergies: {
      environmental: [],
      food: [],
      drugs: [],
      other: []
    },
    diseaseHistory: [],
    habits: {
      smoking: '',
      alcohol: '',
      exercise: '',
      diet: '',
      sleep: '',
      other: ''
    },
    emergencyContact: { name: '', relationship: '', phone: '' },
    profilePicture: null
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [allergyCategory, setAllergyCategory] = useState('environmental');
  const [newDiseaseHistory, setNewDiseaseHistory] = useState({ disease: '', diagnosedDate: '', notes: '' });
  const [latestPrescription, setLatestPrescription] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Fetch profile data when profile is active
  useEffect(() => {
    if (activeContent === 'profile' && user) {
      fetchProfileData();
      fetchLatestPrescription();
    }
  }, [activeContent, user]);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.user;
      
      // Handle allergies - convert from array to categorized object if needed
      let allergiesData = userData.allergies;
      if (Array.isArray(allergiesData)) {
        // Legacy format - convert to new categorized format
        allergiesData = {
          environmental: [],
          food: [],
          drugs: [],
          other: allergiesData
        };
      } else if (!allergiesData) {
        allergiesData = { environmental: [], food: [], drugs: [], other: [] };
      }
      
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || userData.contactNumber || '',
        address: userData.address || '',
        dateOfBirth: userData.dateOfBirth || '',
        bloodType: userData.bloodType || '',
        gender: userData.gender || '',
        allergies: allergiesData,
        diseaseHistory: userData.diseaseHistory || [],
        habits: userData.habits || { smoking: '', alcohol: '', exercise: '', diet: '', sleep: '', other: '' },
        emergencyContact: userData.emergencyContact || { name: '', relationship: '', phone: '' },
        profilePicture: userData.profilePicture || null
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({ open: true, message: 'Invalid file type. Only JPEG, PNG and GIF are allowed.', severity: 'error' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'File size must be less than 5MB', severity: 'error' });
      return;
    }

    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/users/profile/picture`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfileData(prev => ({ ...prev, profilePicture: response.data.profilePicture }));
      setSnackbar({ open: true, message: 'Profile picture updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setSnackbar({ open: true, message: 'Failed to upload profile picture', severity: 'error' });
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    setUploadingPicture(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/users/profile/picture`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfileData(prev => ({ ...prev, profilePicture: null }));
      setSnackbar({ open: true, message: 'Profile picture removed', severity: 'success' });
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      setSnackbar({ open: true, message: 'Failed to remove profile picture', severity: 'error' });
    } finally {
      setUploadingPicture(false);
    }
  };

  const fetchLatestPrescription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/prescriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const prescriptions = response.data;
      if (prescriptions && prescriptions.length > 0) {
        // Sort by date and get the latest
        const sorted = prescriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLatestPrescription(sorted[0]);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const handleAddAllergy = async (category) => {
    if (!newAllergy.trim()) return;
    
    const updatedAllergies = {
      ...profileData.allergies,
      [category]: [...(profileData.allergies[category] || []), newAllergy.trim()]
    };
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
        { allergies: updatedAllergies },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(prev => ({ ...prev, allergies: updatedAllergies }));
      setNewAllergy('');
      setSnackbar({ open: true, message: 'Allergy added successfully', severity: 'success' });
    } catch (error) {
      console.error('Error adding allergy:', error);
      setSnackbar({ open: true, message: 'Failed to add allergy', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRemoveAllergy = async (category, allergyToRemove) => {
    const updatedAllergies = {
      ...profileData.allergies,
      [category]: profileData.allergies[category].filter(a => a !== allergyToRemove)
    };
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
        { allergies: updatedAllergies },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(prev => ({ ...prev, allergies: updatedAllergies }));
      setSnackbar({ open: true, message: 'Allergy removed', severity: 'success' });
    } catch (error) {
      console.error('Error removing allergy:', error);
      setSnackbar({ open: true, message: 'Failed to remove allergy', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddDiseaseHistory = async () => {
    if (!newDiseaseHistory.disease.trim()) return;
    
    const updatedHistory = [...(profileData.diseaseHistory || []), {
      ...newDiseaseHistory,
      id: Date.now(),
      addedAt: new Date().toISOString()
    }];
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
        { diseaseHistory: updatedHistory },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(prev => ({ ...prev, diseaseHistory: updatedHistory }));
      setNewDiseaseHistory({ disease: '', diagnosedDate: '', notes: '' });
      setSnackbar({ open: true, message: 'Disease history added', severity: 'success' });
    } catch (error) {
      console.error('Error adding disease history:', error);
      setSnackbar({ open: true, message: 'Failed to add disease history', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRemoveDiseaseHistory = async (historyId) => {
    const updatedHistory = profileData.diseaseHistory.filter(h => h.id !== historyId);
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
        { diseaseHistory: updatedHistory },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileData(prev => ({ ...prev, diseaseHistory: updatedHistory }));
      setSnackbar({ open: true, message: 'Disease history removed', severity: 'success' });
    } catch (error) {
      console.error('Error removing disease history:', error);
      setSnackbar({ open: true, message: 'Failed to remove disease history', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateHabits = async () => {
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
        { habits: profileData.habits },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: 'Habits updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error updating habits:', error);
      setSnackbar({ open: true, message: 'Failed to update habits', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateContact = async () => {
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
        { 
          phone: profileData.phone,
          address: profileData.address,
          emergencyContact: profileData.emergencyContact
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: 'Contact information updated', severity: 'success' });
    } catch (error) {
      console.error('Error updating contact:', error);
      setSnackbar({ open: true, message: 'Failed to update contact information', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Initialize security form with user data
  useEffect(() => {
    if (user) {
      setSecurityForm(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        specialization: user.specialization || '',
        licenseNumber: user.licenseNumber || '',
        contactNumber: user.contactNumber || user.phone || '',
        email: user.email || '',
        clinicAddress: user.clinicAddress || user.address || '',
        experience: user.experience || '',
        qualifications: user.qualifications || '',
        // Profile and clinic images
        profileImage: user.profileImage || '',
        clinicLogo: user.clinicLogo || '',
        signature: user.signature || '',
        // Extended contact information
        clinicName: user.clinicName || '',
        alternateEmail: user.alternateEmail || '',
        secondaryPhone: user.secondaryPhone || '',
        fax: user.fax || '',
        whatsapp: user.whatsapp || '',
        website: user.website || '',
        linkedin: user.linkedin || '',
        twitter: user.twitter || '',
        facebook: user.facebook || '',
        instagram: user.instagram || ''
      }));
    }
  }, [user]);

  // Fetch prescriptions when manage patients is active
  useEffect(() => {
    if (activeContent === 'managePatients' && user?.role === 'doctor') {
      fetchPrescriptions();
    }
  }, [activeContent, user]);

  const fetchPrescriptions = async () => {
    setPrescriptionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/prescriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);

      setSnackbar({ open: true, message: 'Failed to load prescriptions', severity: 'error' });
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const handleUpdateStatus = async (prescriptionId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/prescriptions/${prescriptionId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: `Prescription ${newStatus === 'completed' ? 'terminated' : 'activated'} successfully`, severity: 'success' });
      fetchPrescriptions();
    } catch (error) {
      console.error('Error updating prescription:', error);
      setSnackbar({ open: true, message: 'Failed to update prescription', severity: 'error' });
    }
    setConfirmDialog({ open: false, prescriptionId: null, action: null });
  };

  const handleDeletePrescription = async (prescriptionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/prescriptions/${prescriptionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: 'Prescription deleted successfully', severity: 'success' });
      fetchPrescriptions();
    } catch (error) {
      console.error('Error deleting prescription:', error);
      setSnackbar({ open: true, message: 'Failed to delete prescription', severity: 'error' });
    }
    setConfirmDialog({ open: false, prescriptionId: null, action: null });
  };

  // Handle viewing prescription details
  const handleViewPrescription = (prescription) => {
    setViewPrescriptionDialog({ open: true, prescription });
  };

  // Handle downloading prescription PDF
  const handleDownloadPdf = async (prescription) => {
    // Handle both prescription object and prescription ID
    const prescriptionId = typeof prescription === 'object' ? (prescription.id || prescription._id) : prescription;
    
    setDownloadingPdf(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/prescriptions/${prescriptionId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription-${prescriptionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSnackbar({ open: true, message: 'PDF downloaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setSnackbar({ open: true, message: 'Failed to download PDF', severity: 'error' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleOpenAuthDialog = (tabValue = 0, role = 'patient') => {
    setAuthTabValue(tabValue);
    setDefaultRole(role);
    setAuthDialogOpen(true);
  };

  const handleCloseAuthDialog = () => {
    setAuthDialogOpen(false);
  };

  const handleChangeAuthTab = (event, newValue) => {
    setAuthTabValue(newValue);
  };

  // Security settings handlers
  const handleSecurityFormChange = (field) => (event) => {
    setSecurityForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Handle profile image upload for doctors
  const handleDoctorProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({ open: true, message: 'Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.', severity: 'error' });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'File size must be less than 20MB', severity: 'error' });
      return;
    }

    setUploadingProfileImage(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await axios.post(`${API_BASE_URL}/api/doctors/upload-profile-image`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSecurityForm(prev => ({ ...prev, profileImage: response.data.url }));
      setSnackbar({ open: true, message: 'Profile image uploaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setSnackbar({ open: true, message: 'Failed to upload profile image', severity: 'error' });
    } finally {
      setUploadingProfileImage(false);
    }
  };

  // Handle clinic logo upload for doctors
  const handleClinicLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({ open: true, message: 'Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.', severity: 'error' });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'File size must be less than 20MB', severity: 'error' });
      return;
    }

    setUploadingClinicLogo(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('clinicLogo', file);
      
      const response = await axios.post(`${API_BASE_URL}/api/doctors/upload-clinic-logo`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSecurityForm(prev => ({ ...prev, clinicLogo: response.data.url }));
      setSnackbar({ open: true, message: 'Clinic logo uploaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error uploading clinic logo:', error);
      setSnackbar({ open: true, message: 'Failed to upload clinic logo', severity: 'error' });
    } finally {
      setUploadingClinicLogo(false);
    }
  };

  // Handle signature upload for doctors
  const handleSignatureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({ open: true, message: 'Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.', severity: 'error' });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'File size must be less than 20MB', severity: 'error' });
      return;
    }

    setUploadingSignature(true);
    setSnackbar({ open: true, message: 'Removing background... (first time may take a moment to load AI model)', severity: 'info' });
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('signature', file);
      
      const response = await axios.post(`${API_BASE_URL}/api/doctors/upload-signature`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSecurityForm(prev => ({ ...prev, signature: response.data.url }));
      setSnackbar({ open: true, message: 'Signature uploaded successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error uploading signature:', error);
      setSnackbar({ open: true, message: 'Failed to upload signature', severity: 'error' });
    } finally {
      setUploadingSignature(false);
    }
  };

  // Helper to get full image URL
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  };

  const handleUpdateName = async () => {
    if (!securityForm.firstName.trim() || !securityForm.lastName.trim()) {
      setSnackbar({ open: true, message: 'First name and last name are required', severity: 'error' });
      return;
    }

    setSecurityLoading(true);
    try {
      const token = localStorage.getItem('token');
      const updateData = { 
        firstName: securityForm.firstName, 
        lastName: securityForm.lastName 
      };
      
      // Include doctor-specific fields if user is a doctor
      if (user?.role === 'doctor') {
        updateData.specialization = securityForm.specialization;
        updateData.licenseNumber = securityForm.licenseNumber;
        updateData.contactNumber = securityForm.contactNumber;
        updateData.clinicAddress = securityForm.clinicAddress;
        updateData.experience = securityForm.experience;
        updateData.qualifications = securityForm.qualifications;
        // Profile and clinic images
        updateData.profileImage = securityForm.profileImage;
        updateData.clinicLogo = securityForm.clinicLogo;
        updateData.signature = securityForm.signature;
        // Extended contact information
        updateData.clinicName = securityForm.clinicName;
        updateData.alternateEmail = securityForm.alternateEmail;
        updateData.secondaryPhone = securityForm.secondaryPhone;
        updateData.fax = securityForm.fax;
        updateData.whatsapp = securityForm.whatsapp;
        updateData.website = securityForm.website;
        updateData.linkedin = securityForm.linkedin;
        updateData.twitter = securityForm.twitter;
        updateData.facebook = securityForm.facebook;
        updateData.instagram = securityForm.instagram;
      }
      
      await axios.put(`${API_BASE_URL}/api/users/profile`, 
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
      setSnackbar({ open: true, message: 'All password fields are required', severity: 'error' });
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSnackbar({ open: true, message: 'New password and confirm password do not match', severity: 'error' });
      return;
    }

    if (securityForm.newPassword.length < 6) {
      setSnackbar({ open: true, message: 'New password must be at least 6 characters', severity: 'error' });
      return;
    }

    setSecurityLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/users/password`, 
        { currentPassword: securityForm.currentPassword, newPassword: securityForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: 'Password changed successfully', severity: 'success' });
      setSecurityForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setSecurityLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f5f5f5' }}>
        <BeatingLogo size={100} />
        <Typography variant="h6" sx={{ mt: 2, color: '#134F4D' }}>Loading...</Typography>
      </Box>
    );
  }

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <Box className="App" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Full-screen background image */}
      {!isAuthenticated && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            backgroundImage: 'url("https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1920&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.5,
          }}
        />
      )}
      {isAuthenticated && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            backgroundImage: 'url("https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.18,
          }}
        />
      )}
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left side - Logo and Title */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              minWidth: 0,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.85
              }
            }}
            onClick={() => setActiveContent('dashboard')}
          >
            <img 
              src="/LOGO.png" 
              alt="Medizo Logo" 
              style={{ 
                height: isMobile ? '28px' : '36px', 
                marginRight: '8px',
                borderRadius: '4px'
              }} 
            />
            <Typography 
              variant={isMobile ? 'subtitle1' : 'h6'} 
              component="div" 
              sx={{ 
                whiteSpace: 'nowrap',
                fontWeight: 'bold'
              }}
            >
              Medizo
            </Typography>
          </Box>

          {/* Center - Tagline (hidden on mobile) */}
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: '0.875rem',
              display: { xs: 'none', md: 'block' },
              textAlign: 'center',
              flex: 1,
              mx: 2
            }}
          >
            Health on your fingertips
          </Typography>

          {/* Right side - Auth buttons or user info */}
          {isMobile ? (
            // Mobile: Hamburger menu
            <IconButton
              color="inherit"
              aria-label="open menu"
              edge="end"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            // Desktop: Show buttons inline
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isAuthenticated ? (
                <>
                  <Typography variant="body1" sx={{ mr: 2, whiteSpace: 'nowrap' }}>
                    Welcome, {(() => {
                      if (!user) return 'User';
                      if (user.role === 'doctor') return `Dr. ${user.lastName}`;
                      return `${user.firstName} ${user.lastName}`;
                    })()}
                  </Typography>
                  <Button color="inherit" onClick={logout}>Logout</Button>
                </>
              ) : (
                <>
                  <Button color="inherit" onClick={() => handleOpenAuthDialog(0)}>Login</Button>
                  <Button color="inherit" onClick={() => handleOpenAuthDialog(1)}>Register</Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: 250 }
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: '#134F4D', 
            color: 'white',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: '#0f3d3b'
            }
          }}
          onClick={() => { setActiveContent('dashboard'); handleDrawerToggle(); }}
        >
          <Typography variant="h6">Medizo</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>Health on your fingertips</Typography>
        </Box>
        <List>
          {isAuthenticated ? (
            <>
              <ListItem>
                <ListItemText 
                  primary={`Welcome, ${(() => {
                    if (!user) return 'User';
                    if (user.role === 'doctor') return `Dr. ${user.lastName}`;
                    return `${user.firstName} ${user.lastName}`;
                  })()}`}
                  sx={{ color: '#134F4D' }}
                />
              </ListItem>
              <ListItemButton onClick={() => { logout(); handleDrawerToggle(); }}>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </>
          ) : (
            <>
              <ListItemButton onClick={() => { handleOpenAuthDialog(0); handleDrawerToggle(); }}>
                <ListItemText primary="Login" />
              </ListItemButton>
              <ListItemButton onClick={() => { handleOpenAuthDialog(1); handleDrawerToggle(); }}>
                <ListItemText primary="Register" />
              </ListItemButton>
            </>
          )}
        </List>
      </Drawer>

      {/* Authentication Dialog */}

      {/* Back Button — fixed top-left, shown when navigated away from dashboard */}
      {isAuthenticated && activeContent !== 'dashboard' && (
        <Box
          onClick={() => setActiveContent('dashboard')}
          sx={{
            position: 'fixed', top: 80, left: 24, zIndex: 999,
            width: 44, height: 44, borderRadius: '50%',
            bgcolor: '#134F4D', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            transition: 'background 0.2s, transform 0.2s',
            '&:hover': { bgcolor: '#0d3836', transform: 'translateX(-3px)' }
          }}
        >
          <ArrowForwardIcon sx={{ transform: 'rotate(180deg)' }} />
        </Box>
      )}
      <Dialog 
        open={authDialogOpen} 
        onClose={handleCloseAuthDialog}
        fullWidth
        maxWidth="sm"
        TransitionComponent={SlideTransition}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={authTabValue} 
              onChange={handleChangeAuthTab} 
              variant="fullWidth"
            >
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>
          </Box>
          <Box p={3}>
            {authTabValue === 0 ? (
              <LoginForm 
                onSwitchToRegister={() => setAuthTabValue(1)} 
                onClose={handleCloseAuthDialog}
                defaultRole={defaultRole}
              />
            ) : (
              <RegisterForm onClose={handleCloseAuthDialog} />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {(!isAuthenticated || (isAuthenticated && activeContent === 'dashboard')) && (
          <Box sx={{ my: { xs: 2.5, md: 4 }, textAlign: 'center', px: { xs: 1, sm: 2 } }}>
            <Chip 
              label="🌱 Digital Healthcare Platform" 
              size="small"
              sx={{ 
                bgcolor: 'rgba(19, 79, 77, 0.10)', 
                color: '#134F4D', 
                fontWeight: 700, 
                mb: 1.5,
                fontSize: { xs: '0.75rem', sm: '0.85rem' }
              }} 
            />
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 800, 
                color: '#0f172a',
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                lineHeight: 1.25,
                mb: 1
              }}
            >
              Digital Prescription Platform
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                maxWidth: 540, 
                mx: 'auto',
                fontSize: { xs: '0.95rem', sm: '1.1rem' }
              }}
            >
              Connecting doctors and patients seamlessly with QR verification
            </Typography>
          </Box>
        )}

        {!isAuthenticated && (
          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: 1, mb: 3 }}>
            {/* For Doctors Card */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: { xs: 2.5, sm: 3.5 }, 
                  borderRadius: '24px', 
                  bgcolor: '#ffffff',
                  border: '1.5px solid rgba(19, 79, 77, 0.20)',
                  boxShadow: '0 10px 30px rgba(19, 79, 77, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 36px rgba(19, 79, 77, 0.15)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#134F4D', color: '#fff', width: 44, height: 44 }}>
                    <LocalHospitalIcon />
                  </Avatar>
                  <Box>
                    <Chip label="For Doctors" size="small" sx={{ bgcolor: '#e6f4f1', color: '#134F4D', fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      Doctor Portal
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, flexGrow: 1, lineHeight: 1.6 }}>
                  Create digital prescriptions with embedded QR codes, manage patient records, and access complete medical history instantly.
                </Typography>

                <Button 
                  variant="contained" 
                  fullWidth
                  size="large"
                  onClick={() => handleOpenAuthDialog(0, 'doctor')}
                  startIcon={<PersonIcon />}
                  sx={{ 
                    height: 48, 
                    borderRadius: '14px',
                    bgcolor: '#134F4D',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#0d3836' }
                  }}
                >
                  Login as Doctor
                </Button>
              </Paper>
            </Grid>

            {/* For Patients Card */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: { xs: 2.5, sm: 3.5 }, 
                  borderRadius: '24px', 
                  bgcolor: '#ffffff',
                  border: '1.5px solid rgba(236, 72, 153, 0.20)',
                  boxShadow: '0 10px 30px rgba(236, 72, 153, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 36px rgba(236, 72, 153, 0.15)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#ec4899', color: '#fff', width: 44, height: 44 }}>
                    <MedicationIcon />
                  </Avatar>
                  <Box>
                    <Chip label="For Patients" size="small" sx={{ bgcolor: '#fce7f3', color: '#be185d', fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      Patient Portal
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, flexGrow: 1, lineHeight: 1.6 }}>
                  Access your prescriptions securely, verify digital signatures via QR code, and download PDF medical records anytime.
                </Typography>

                <Button 
                  variant="outlined" 
                  fullWidth
                  size="large"
                  onClick={() => handleOpenAuthDialog(0, 'patient')}
                  startIcon={<PersonIcon />}
                  sx={{ 
                    height: 48, 
                    borderRadius: '14px',
                    borderColor: '#be185d',
                    color: '#be185d',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    '&:hover': { borderColor: '#9d174d', bgcolor: '#fdf2f8' }
                  }}
                >
                  Login as Patient
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* ─── HOW IT WORKS & FEATURES (landing page only) ─── */}
        {!isAuthenticated && (
          <Box
            sx={{
              mt: 0,
              mb: { xs: 4, md: 6 },
              borderRadius: '0 0 16px 16px',
              background: 'rgba(255,255,255,0.70)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
              px: { xs: 2, sm: 4, md: 6 },
              py: { xs: 4, md: 6 },
            }}
          >
            {/* ── How It Works ── */}
            <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
              <Typography variant="h4" component="h2" fontWeight={700} gutterBottom>
                How It Works
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                A simple, secure 4-step workflow that connects doctors and patients digitally.
              </Typography>

              <Grid container spacing={0} alignItems="center" justifyContent="center">
                {[
                  { icon: <PersonIcon sx={{ fontSize: 40 }} />, title: 'Doctor Logs In', desc: 'The doctor signs in and selects or adds a patient.', color: '#1565c0' },
                  { icon: <DescriptionIcon sx={{ fontSize: 40 }} />, title: 'Creates Prescription', desc: 'Fills diagnosis, medications, tests & follow-up details.', color: '#00838f' },
                  { icon: <QrCodeScannerIcon sx={{ fontSize: 40 }} />, title: 'QR Code Generated', desc: 'A unique QR code is attached for tamper-proof verification.', color: '#6a1b9a' },
                  { icon: <CloudDownloadIcon sx={{ fontSize: 40 }} />, title: 'Patient Downloads', desc: 'The patient views and downloads the prescription as PDF.', color: '#2e7d32' }
                ].map((step, idx, arr) => (
                  <React.Fragment key={idx}>
                    <Grid item xs={12} sm={6} md={2.5}>
                      <Box
                        sx={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          p: { xs: 2, md: 2.5 },
                          borderRadius: 3,
                          border: `1.5px solid ${step.color}33`,
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${step.color}44` },
                          mx: { xs: 2, md: 0.5 },
                          my: { xs: 1, md: 0 },
                        }}
                      >
                        <Avatar sx={{
                          width: 72, height: 72, bgcolor: step.color, mb: 1.5,
                          boxShadow: `0 4px 20px ${step.color}55`
                        }}>
                          {step.icon}
                        </Avatar>
                        <Chip label={`Step ${idx + 1}`} size="small" sx={{ mb: 1, bgcolor: step.color, color: '#fff', fontWeight: 600 }} />
                        <Typography variant="subtitle1" fontWeight={700}>{step.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, mt: 0.5 }}>
                          {step.desc}
                        </Typography>
                      </Box>
                    </Grid>
                    {idx < arr.length - 1 && (
                      <Grid item xs={12} md={0.5} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <ArrowForwardIcon sx={{ fontSize: 28, color: 'grey.500', display: { xs: 'none', md: 'block' } }} />
                        <ArrowDownwardIcon sx={{ fontSize: 28, color: 'grey.500', display: { xs: 'block', md: 'none' } }} />
                      </Grid>
                    )}
                  </React.Fragment>
                ))}
              </Grid>
            </Box>

            {/* Divider between sections */}
            <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', mb: { xs: 5, md: 7 } }} />

            {/* ── Features ── */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" component="h2" fontWeight={700} gutterBottom>
                Features
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                Everything doctors and patients need — in one platform.
              </Typography>

              <Grid container spacing={3}>
                {/* Doctor features */}
                <Grid item xs={12}>
                  <Typography variant="overline" color="primary" fontWeight={700} sx={{ letterSpacing: 2 }}>
                    For Doctors
                  </Typography>
                </Grid>
                {[
                  { icon: <DescriptionIcon />, title: 'Digital Prescriptions', desc: 'Create comprehensive prescriptions with medications, tests, diet plans and more.' },
                  { icon: <QrCodeIcon />,       title: 'QR Verification',      desc: 'Every prescription gets a unique QR code for authentication and quick access.' },
                  { icon: <PersonIcon />,       title: 'Patient Management',   desc: 'Add, search and manage patients. View full prescription history at a glance.' },
                  { icon: <HistoryIcon />,      title: 'Prescription History',  desc: 'Access old prescriptions while creating new ones. Never lose track of treatment.' },
                  { icon: <NotificationsIcon />,title: 'Follow-up Tracking',   desc: 'Set follow-up dates, times and reminders. Track upcoming appointments.' },
                  { icon: <CloudDownloadIcon />,title: 'PDF Generation',       desc: 'Auto-generate professional PDF prescriptions for printing or digital sharing.' }
                ].map((f, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Paper elevation={0} sx={{
                      p: 3, height: '100%', borderRadius: 3,
                      background: 'rgba(255,255,255,0.55)',
                      border: '1px solid rgba(25,118,210,0.15)',
                      transition: 'box-shadow 0.25s, transform 0.25s',
                      '&:hover': { boxShadow: 6, transform: 'translateY(-4px)', background: 'rgba(255,255,255,0.80)' }
                    }}>
                      <Avatar sx={{ bgcolor: '#e8f4fd', color: '#64b5f6', mb: 1.5, mx: 'auto' }}>{f.icon}</Avatar>
                      <Typography variant="subtitle1" fontWeight={600}>{f.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{f.desc}</Typography>
                    </Paper>
                  </Grid>
                ))}

                {/* Patient features */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="overline" color="secondary" fontWeight={700} sx={{ letterSpacing: 2 }}>
                    For Patients
                  </Typography>
                </Grid>
                {[
                  { icon: <VerifiedUserIcon />,  title: 'Secure Access',        desc: 'Your health records are encrypted and accessible only to you and your doctor.' },
                  { icon: <CloudDownloadIcon />,  title: 'Download Anytime',     desc: 'Download prescriptions as PDFs whenever you need — from any device.' },
                  { icon: <QrCodeIcon />,         title: 'QR Scan & Verify',     desc: 'Scan the QR code on your prescription to instantly verify its authenticity.' },
                  { icon: <MedicationIcon />,     title: 'Medication Details',   desc: 'View dosage, timing, meal relation and duration in a clear, readable format.' },
                  { icon: <PersonIcon />,         title: 'Health Profile',       desc: 'Maintain allergies, disease history, habits and emergency contacts in one place.' },
                  { icon: <AssignmentIcon />,     title: 'Prescription Archive', desc: 'Never lose a prescription again. Your complete history is stored digitally.' }
                ].map((f, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Paper elevation={0} sx={{
                      p: 3, height: '100%', borderRadius: 3,
                      background: 'rgba(255,255,255,0.55)',
                      border: '1px solid rgba(156,39,176,0.15)',
                      transition: 'box-shadow 0.25s, transform 0.25s',
                      '&:hover': { boxShadow: 6, transform: 'translateY(-4px)', background: 'rgba(255,255,255,0.80)' }
                    }}>
                      <Avatar sx={{ bgcolor: '#f8f0fc', color: '#ce93d8', mb: 1.5, mx: 'auto' }}>{f.icon}</Avatar>
                      <Typography variant="subtitle1" fontWeight={600}>{f.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{f.desc}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        )}
        {isAuthenticated && activeContent === 'dashboard' && (
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mb: 2 }}>
                    <AssignmentIcon />
                  </Avatar>
                  <Typography variant="h5" component="div" gutterBottom>
                    {user?.role === 'doctor' ? 'Create Prescription' : 'View Prescriptions'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role === 'doctor' 
                      ? 'Create new digital prescriptions for your patients with QR code verification.' 
                      : 'Access your current and past prescriptions securely.'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => setActiveContent(user?.role === 'doctor' ? 'createPrescription' : 'viewPrescriptions')}
                  >
                    {user?.role === 'doctor' ? 'Create New' : 'View All'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mb: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="h5" component="div" gutterBottom>
                    {user?.role === 'doctor' ? 'Manage Patients' : 'My Profile'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role === 'doctor' 
                      ? 'View and manage your patient list. Check patient history and details.' 
                      : 'Update your personal information and contact details.'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => setActiveContent(user?.role === 'doctor' ? 'managePatients' : 'profile')}
                  >
                    {user?.role === 'doctor' ? 'View Patients' : 'Edit Profile'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Avatar sx={{ bgcolor: user?.role === 'doctor' ? 'primary.main' : 'error.main', mb: 2 }}>
                    {user?.role === 'doctor' ? <PersonIcon /> : <SecurityIcon />}
                  </Avatar>
                  <Typography variant="h5" component="div" gutterBottom>
                    {user?.role === 'doctor' ? 'My Profile' : 'Security Settings'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role === 'doctor' 
                      ? 'Update your professional information, specialization, contact details, and security settings.'
                      : 'Update your password and security preferences. Manage your account security.'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small"
                    onClick={() => setActiveContent('security')}
                  >
                    {user?.role === 'doctor' ? 'Edit Profile' : 'Manage Security'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Render active content based on state */}
        {isAuthenticated && activeContent !== 'dashboard' && (
          <Box sx={{ mt: 4 }}>
            {/* Back button */}
            <Button 
              variant="outlined" 
              sx={{ mb: 2 }}
              onClick={() => setActiveContent('dashboard')}
            >
              Back to Dashboard
            </Button>
            
            {/* Content components */}
            {activeContent === 'createPrescription' && user?.role === 'doctor' && (
              <PrescriptionForm onCreatePrescription={() => setActiveContent('dashboard')} />
            )}
            
            {activeContent === 'viewPrescriptions' && user?.role === 'patient' && (
              <PrescriptionList />
            )}
            
            {activeContent === 'managePatients' && user?.role === 'doctor' && (
              <Paper elevation={3} sx={{ p: { xs: 1.5, sm: 3 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
                  <Typography variant="h5" sx={{ fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
                    Patient Management - Prescriptions Overview
                  </Typography>
                  <IconButton onClick={fetchPrescriptions} disabled={prescriptionsLoading}>
                    <RefreshIcon />
                  </IconButton>
                </Box>

                {(() => {
                  if (prescriptionsLoading) {
                    return (
                      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" p={4}>
                        <BeatingLogo size={60} />
                        <Typography variant="body2" sx={{ mt: 1, color: '#134F4D' }}>Loading prescriptions...</Typography>
                      </Box>
                    );
                  }
                  if (prescriptions.length === 0) {
                    return (
                      <Alert severity="info">
                        No prescriptions found. Create a prescription to see it here.
                      </Alert>
                    );
                  }
                  return (
                  <>
                    {/* Today's Follow-up Appointments Section */}
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      const todayAppointments = prescriptions.filter(p => {
                        if (!p.followUpDate) return false;
                        const followUp = new Date(p.followUpDate);
                        followUp.setHours(0, 0, 0, 0);
                        return followUp.getTime() === today.getTime();
                      });
                      
                      const upcomingAppointments = prescriptions.filter(p => {
                        if (!p.followUpDate) return false;
                        const followUp = new Date(p.followUpDate);
                        followUp.setHours(0, 0, 0, 0);
                        const diffDays = Math.ceil((followUp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        return diffDays > 0 && diffDays <= 7;
                      });

                      return (
                        <>
                          {/* Today's Appointments */}
                          {todayAppointments.length > 0 && (
                            <Paper 
                              elevation={3} 
                              sx={{ 
                                p: 2, 
                                mb: 3, 
                                background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                                border: '2px solid #ff9800'
                              }}
                            >
                              <Typography variant="h6" sx={{ mb: 2, color: 'warning.dark', display: 'flex', alignItems: 'center' }}>
                                <Box component="span" sx={{ mr: 1, fontSize: '1.5rem' }}>📅</Box>
                                Today's Follow-up Appointments ({todayAppointments.length})
                              </Typography>
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: 'warning.light' }}>
                                      <TableCell><strong>Patient</strong></TableCell>
                                      <TableCell><strong>Diagnosis</strong></TableCell>
                                      {!isMobile && <TableCell><strong>Original Date</strong></TableCell>}
                                      <TableCell><strong>Follow-up</strong></TableCell>
                                      {!isMobile && <TableCell align="center"><strong>Actions</strong></TableCell>}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {todayAppointments.map((prescription) => (
                                      <TableRow key={prescription.id} hover sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', cursor: isMobile ? 'pointer' : 'default' }} onClick={() => isMobile && handleViewPrescription(prescription)}>
                                        <TableCell>
                                          <Box display="flex" alignItems="center">
                                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                                            <strong>{prescription.patientName || prescription.patientEmail}</strong>
                                          </Box>
                                        </TableCell>
                                        <TableCell>{prescription.diagnosis}</TableCell>
                                        {!isMobile && <TableCell>{new Date(prescription.createdAt).toLocaleDateString()}</TableCell>}
                                        <TableCell>
                                          <Chip label="TODAY" color="warning" size="small" sx={{ fontWeight: 'bold' }} />
                                        </TableCell>
                                        {!isMobile && (
                                        <TableCell align="center">
                                          <Button
                                            size="small"
                                            variant="contained"
                                            color="warning"
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => handleViewPrescription(prescription)}
                                          >
                                            View
                                          </Button>
                                        </TableCell>
                                        )}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Paper>
                          )}

                          {/* Upcoming Appointments (Next 7 Days) */}
                          {upcomingAppointments.length > 0 && (
                            <Paper 
                              elevation={2} 
                              sx={{ 
                                p: 2, 
                                mb: 3, 
                                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                                border: '1px solid #2196f3'
                              }}
                            >
                              <Typography variant="h6" sx={{ mb: 2, color: 'info.dark', display: 'flex', alignItems: 'center' }}>
                                <Box component="span" sx={{ mr: 1, fontSize: '1.5rem' }}>🔔</Box>
                                Upcoming Appointments - Next 7 Days ({upcomingAppointments.length})
                              </Typography>
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: 'info.light' }}>
                                      <TableCell><strong>Patient</strong></TableCell>
                                      <TableCell><strong>Diagnosis</strong></TableCell>
                                      <TableCell><strong>Follow-up Date</strong></TableCell>
                                      {!isMobile && <TableCell><strong>Days Until</strong></TableCell>}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {upcomingAppointments
                                      .sort((a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime())
                                      .map((prescription) => {
                                        const followUp = new Date(prescription.followUpDate);
                                        followUp.setHours(0, 0, 0, 0);
                                        const daysUntil = Math.ceil((followUp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                        return (
                                          <TableRow key={prescription.id} hover>
                                            <TableCell>
                                              <Box display="flex" alignItems="center">
                                                <PersonIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                                                {prescription.patientName || prescription.patientEmail}
                                              </Box>
                                            </TableCell>
                                            <TableCell>{prescription.diagnosis}</TableCell>
                                            <TableCell>
                                              {new Date(prescription.followUpDate).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                              })}
                                            </TableCell>
                                            {!isMobile && (
                                            <TableCell>
                                              <Chip 
                                                label={daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`} 
                                                color="info" 
                                                size="small" 
                                                variant="outlined"
                                              />
                                            </TableCell>
                                            )}
                                          </TableRow>
                                        );
                                      })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Paper>
                          )}
                        </>
                      );
                    })()}

                    {/* Active Prescriptions Section */}
                    <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                      <CheckCircleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Active Prescriptions ({prescriptions.filter(p => p.status === 'active').length})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'success.light' }}>
                            <TableCell><strong>Patient</strong></TableCell>
                            <TableCell><strong>Diagnosis</strong></TableCell>
                            {!isMobile && <TableCell><strong>Date</strong></TableCell>}
                            {!isMobile && <TableCell><strong>Status</strong></TableCell>}
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {prescriptions.filter(p => p.status === 'active').length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography color="text.secondary">No active prescriptions</Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            prescriptions.filter(p => p.status === 'active').map((prescription) => (
                              <TableRow key={prescription.id} hover>
                                <TableCell>
                                  <Box display="flex" alignItems="center">
                                    <PersonIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                    {prescription.patientName || prescription.patientEmail}
                                  </Box>
                                </TableCell>
                                <TableCell>{prescription.diagnosis}</TableCell>
                                {!isMobile && <TableCell>{new Date(prescription.createdAt).toLocaleDateString()}</TableCell>}
                                {!isMobile && (
                                <TableCell>
                                  <Chip label="Active" color="success" size="small" />
                                </TableCell>
                                )}
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 0.5, justifyContent: 'center' }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => handleViewPrescription(prescription)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    startIcon={!isMobile ? <CancelIcon /> : undefined}
                                    onClick={() => setConfirmDialog({ 
                                      open: true, 
                                      prescriptionId: prescription.id, 
                                      action: 'terminate' 
                                    })}
                                  >
                                    {isMobile ? 'End' : 'Terminate'}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={!isMobile ? <DeleteIcon /> : undefined}
                                    onClick={() => setConfirmDialog({ 
                                      open: true, 
                                      prescriptionId: prescription.id, 
                                      action: 'delete' 
                                    })}
                                  >
                                    Delete
                                  </Button>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Completed/Terminated Prescriptions Section */}
                    <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                      <CancelIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Completed/Terminated Prescriptions ({prescriptions.filter(p => p.status !== 'active').length})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.200' }}>
                            <TableCell><strong>Patient</strong></TableCell>
                            <TableCell><strong>Diagnosis</strong></TableCell>
                            {!isMobile && <TableCell><strong>Date</strong></TableCell>}
                            {!isMobile && <TableCell><strong>Status</strong></TableCell>}
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {prescriptions.filter(p => p.status !== 'active').length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography color="text.secondary">No completed prescriptions</Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            prescriptions.filter(p => p.status !== 'active').map((prescription) => (
                              <TableRow key={prescription.id} hover sx={{ opacity: 0.8 }}>
                                <TableCell>
                                  <Box display="flex" alignItems="center">
                                    <PersonIcon fontSize="small" sx={{ mr: 1, color: 'grey.500' }} />
                                    {prescription.patientName || prescription.patientEmail}
                                  </Box>
                                </TableCell>
                                <TableCell>{prescription.diagnosis}</TableCell>
                                {!isMobile && <TableCell>{new Date(prescription.createdAt).toLocaleDateString()}</TableCell>}
                                {!isMobile && (
                                <TableCell>
                                  <Chip label="Completed" color="default" size="small" />
                                </TableCell>
                                )}
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 0.5, justifyContent: 'center' }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => handleViewPrescription(prescription)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    startIcon={!isMobile ? <CheckCircleIcon /> : undefined}
                                    onClick={() => setConfirmDialog({ 
                                      open: true, 
                                      prescriptionId: prescription.id, 
                                      action: 'activate' 
                                    })}
                                  >
                                    {isMobile ? 'Reactivate' : 'Reactivate'}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={!isMobile ? <DeleteIcon /> : undefined}
                                    onClick={() => setConfirmDialog({ 
                                      open: true, 
                                      prescriptionId: prescription.id, 
                                      action: 'delete' 
                                    })}
                                  >
                                    Delete
                                  </Button>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                  );
                })()}

                {/* Confirmation Dialog */}
                <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, prescriptionId: null, action: null })} TransitionComponent={SlideTransition}>
                  <DialogTitle>
                    {(() => {
                      if (confirmDialog.action === 'delete') return 'Delete Prescription';
                      if (confirmDialog.action === 'terminate') return 'Terminate Prescription';
                      return 'Reactivate Prescription';
                    })()}
                  </DialogTitle>
                  <DialogContent>
                    <Typography>
                      {(() => {
                        if (confirmDialog.action === 'delete') return 'Are you sure you want to permanently delete this prescription? This action cannot be undone.';
                        if (confirmDialog.action === 'terminate') return 'Are you sure you want to terminate this prescription? The prescription will be marked as completed.';
                        return 'Are you sure you want to reactivate this prescription?';
                      })()}
                    </Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, prescriptionId: null, action: null })}>
                      Cancel
                    </Button>
                    <Button 
                      variant="contained"
                      color={(() => {
                        if (confirmDialog.action === 'delete') return 'error';
                        if (confirmDialog.action === 'terminate') return 'warning';
                        return 'success';
                      })()}
                      onClick={() => {
                        if (confirmDialog.action === 'delete') {
                          handleDeletePrescription(confirmDialog.prescriptionId);
                        } else {
                          handleUpdateStatus(confirmDialog.prescriptionId, confirmDialog.action === 'terminate' ? 'completed' : 'active');
                        }
                      }}
                    >
                      {(() => {
                        if (confirmDialog.action === 'delete') return 'Delete';
                        if (confirmDialog.action === 'terminate') return 'Terminate';
                        return 'Reactivate';
                      })()}
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar
                  open={snackbar.open}
                  autoHideDuration={4000}
                  onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                  <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                  </Alert>
                </Snackbar>

                {/* View Prescription Dialog */}
                <Dialog 
                  open={viewPrescriptionDialog.open} 
                  onClose={() => setViewPrescriptionDialog({ open: false, prescription: null })}
                  maxWidth="md"
                  fullWidth
                  TransitionComponent={SlideTransition}
                >
                  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
                    <Box display="flex" alignItems="center">
                      <MedicationIcon sx={{ mr: 1 }} />
                      Prescription Details
                    </Box>
                    <IconButton onClick={() => setViewPrescriptionDialog({ open: false, prescription: null })} sx={{ color: 'white' }}>
                      <CloseIcon />
                    </IconButton>
                  </DialogTitle>
                  <DialogContent sx={{ mt: 2 }}>
                    {viewPrescriptionDialog.prescription && (
                      <Box>
                        {/* Patient & Doctor Info */}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                          <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                Patient Information
                              </Typography>
                              <Typography variant="body1" fontWeight="bold">
                                {viewPrescriptionDialog.prescription.patientName || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {viewPrescriptionDialog.prescription.patientEmail}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                <LocalHospitalIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                Prescription Info
                              </Typography>
                              <Typography variant="body2">
                                <strong>Date:</strong> {new Date(viewPrescriptionDialog.prescription.createdAt).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Status:</strong>{' '}
                                <Chip 
                                  label={viewPrescriptionDialog.prescription.status} 
                                  color={viewPrescriptionDialog.prescription.status === 'active' ? 'success' : 'default'} 
                                  size="small" 
                                />
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>

                        {/* Diagnosis */}
                        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.light' }}>
                          <Typography variant="subtitle2" color="info.main" gutterBottom>
                            Diagnosis
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {viewPrescriptionDialog.prescription.diagnosis}
                          </Typography>
                        </Paper>

                        {/* Medications */}
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                          <MedicationIcon sx={{ mr: 1, color: 'primary.main' }} />
                          Medications
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'primary.light' }}>
                                <TableCell><strong>Medication</strong></TableCell>
                                <TableCell><strong>Dosage</strong></TableCell>
                                <TableCell><strong>Frequency</strong></TableCell>
                                <TableCell><strong>Duration</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {viewPrescriptionDialog.prescription.medications?.map((med, index) => (
                                <TableRow key={index} hover>
                                  <TableCell>{med.name}</TableCell>
                                  <TableCell>{med.dosage}</TableCell>
                                  <TableCell>{med.frequency}</TableCell>
                                  <TableCell>{med.duration}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        {/* Doctor Notes */}
                        {viewPrescriptionDialog.prescription.notes && (
                          <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.light' }}>
                            <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                              Doctor's Notes
                            </Typography>
                            <Typography variant="body2">
                              {viewPrescriptionDialog.prescription.notes}
                            </Typography>
                          </Paper>
                        )}

                        {/* QR Code */}
                        {viewPrescriptionDialog.prescription.id && (
                          <Box textAlign="center" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Prescription QR Code
                            </Typography>
                            <Box sx={{ p: 1, border: '1px solid', borderColor: 'grey.300', borderRadius: 1, display: 'inline-block' }}>
                              <QRCode value={viewPrescriptionDialog.prescription.id} size={150} />
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}
                  </DialogContent>
                  <DialogActions sx={{ p: 2, bgcolor: 'grey.100' }}>
                    <Button onClick={() => setViewPrescriptionDialog({ open: false, prescription: null })}>
                      Close
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={downloadingPdf ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                      onClick={() => handleDownloadPdf(viewPrescriptionDialog.prescription)}
                      disabled={downloadingPdf}
                    >
                      {downloadingPdf ? 'Downloading...' : 'Download PDF'}
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* QR Code Enlarge Dialog */}
                <Dialog 
                  open={qrCodeDialogOpen} 
                  onClose={() => setQrCodeDialogOpen(false)}
                  maxWidth="md"
                  fullWidth
                  TransitionComponent={SlideTransition}
                  PaperProps={{
                    sx: {
                      minHeight: '80vh',
                      maxHeight: '90vh'
                    }
                  }}
                >
                  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white', py: 2 }}>
                    <Box display="flex" alignItems="center">
                      <QrCodeIcon sx={{ mr: 1, fontSize: 28 }} />
                      <Typography variant="h6">Your Patient QR Code</Typography>
                    </Box>
                    <IconButton onClick={() => setQrCodeDialogOpen(false)} sx={{ color: 'white' }}>
                      <CloseIcon />
                    </IconButton>
                  </DialogTitle>
                  <DialogContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    py: 4,
                    bgcolor: 'grey.50',
                    flex: 1
                  }}>
                    <Typography variant="h5" color="primary" align="center" sx={{ mb: 2 }}>
                      Show this QR code to your doctor for easy scanning
                    </Typography>
                    <Box 
                      component="img"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(user?.id || user?._id || '')}`}
                      alt="Patient QR Code"
                      sx={{ 
                        width: { xs: '85vw', sm: '70vw', md: '50vw' }, 
                        height: { xs: '85vw', sm: '70vw', md: '50vw' }, 
                        maxWidth: '600px',
                        maxHeight: '600px',
                        border: '6px solid', 
                        borderColor: 'primary.main',
                        borderRadius: 3,
                        bgcolor: 'white',
                        p: 2,
                        mb: 2,
                        boxShadow: 6
                      }}
                    />
                    <Paper elevation={2} sx={{ p: 2, bgcolor: 'white', maxWidth: '100%' }}>
                      <Typography variant="caption" color="text.secondary" display="block" align="center" sx={{ mb: 0.5 }}>
                        Patient ID
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 'bold',
                          wordBreak: 'break-all',
                          textAlign: 'center'
                        }}
                      >
                        {user?.id || user?._id || 'Loading...'}
                      </Typography>
                    </Paper>
                  </DialogContent>
                  <DialogActions sx={{ justifyContent: 'center', pb: 3, pt: 2, gap: 2, bgcolor: 'grey.100' }}>
                    <Button 
                      variant="outlined"
                      size="large"
                      onClick={() => {
                        navigator.clipboard.writeText(user?.id || user?._id || '');
                        setSnackbar({ open: true, message: 'Patient ID copied to clipboard!', severity: 'success' });
                      }}
                    >
                      Copy ID
                    </Button>
                    <Button 
                      variant="contained"
                      size="large"
                      onClick={() => setQrCodeDialogOpen(false)}
                      startIcon={<CloseIcon />}
                    >
                      Go Back
                    </Button>
                  </DialogActions>
                </Dialog>
              </Paper>
            )}
            
            {activeContent === 'profile' && (
              <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 1 }}>
                  My Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Update your personal information and contact details.
                </Typography>

                {/* Profile Tabs */}
                <Paper elevation={2} sx={{ mb: 3 }}>
                  <Tabs 
                    value={profileTab} 
                    onChange={(e, newValue) => setProfileTab(newValue)}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Tab label="PERSONAL" />
                    <Tab label="ALLERGIES" />
                    <Tab label="HISTORY" />
                    <Tab label="HABITS" />
                  </Tabs>

                  <Box sx={{ p: 3 }}>
                    {/* PERSONAL Tab */}
                    {profileTab === 0 && (
                      <>
                        {/* Profile Picture and Basic Info */}
                        <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              <Box
                                sx={{
                                  position: 'relative',
                                  width: 150,
                                  height: 150,
                                  borderRadius: '50%',
                                  cursor: 'pointer',
                                  '&:hover .hover-overlay': { opacity: 1 },
                                }}
                              >
                                <input
                                  accept="image/jpeg,image/jpg,image/png,image/gif"
                                  style={{ display: 'none' }}
                                  id="profile-picture-upload"
                                  type="file"
                                  onChange={handleProfilePictureUpload}
                                />
                                <label htmlFor="profile-picture-upload" style={{ cursor: 'pointer' }}>
                                  <Avatar 
                                    sx={{ width: 150, height: 150, bgcolor: 'primary.main', fontSize: '3rem' }}
                                    src={profileData.profilePicture ? `${API_BASE_URL}${profileData.profilePicture}` : undefined}
                                  >
                                    {!profileData.profilePicture && `${profileData.firstName?.charAt(0) || ''}${profileData.lastName?.charAt(0) || ''}`}
                                  </Avatar>
                                  <Box
                                    className="hover-overlay"
                                    sx={{
                                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                      borderRadius: '50%', bgcolor: 'rgba(0, 0, 0, 0.6)',
                                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                      opacity: 0, transition: 'opacity 0.3s ease',
                                    }}
                                  >
                                    {uploadingPicture ? (
                                      <CircularProgress size={30} sx={{ color: 'white' }} />
                                    ) : (
                                      <>
                                        <CameraAltIcon sx={{ color: 'white', fontSize: 32 }} />
                                        <Typography variant="caption" sx={{ color: 'white', mt: 0.5 }}>
                                          {profileData.profilePicture ? 'Change Photo' : 'Upload Photo'}
                                        </Typography>
                                      </>
                                    )}
                                  </Box>
                                </label>
                              </Box>
                            </Box>
                            {profileData.profilePicture && (
                              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                <Button variant="text" color="error" size="small" onClick={handleDeleteProfilePicture} disabled={uploadingPicture}>
                                  Remove Photo
                                </Button>
                              </Box>
                            )}
                          </Grid>
                          <Grid item xs={12} md={8}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="h4" sx={{ fontWeight: 500 }}>
                                {profileData.firstName} {profileData.lastName}
                              </Typography>
                              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                                {profileData.email}
                              </Typography>
                              <Chip label={user?.role === 'doctor' ? 'Doctor' : 'Patient'} size="small" color="primary" sx={{ mt: 1 }} />
                            </Box>
                            
                            {/* Patient ID Section - Only for Patients */}
                            {user?.role === 'patient' && (
                              <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.light' }}>
                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                  Your Patient ID
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                  Share this ID or QR code with your doctor to add you as a patient
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography 
                                      variant="body1" 
                                      sx={{ 
                                        fontFamily: 'monospace', 
                                        bgcolor: 'white', 
                                        p: 1, 
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'grey.300',
                                        wordBreak: 'break-all'
                                      }}
                                    >
                                      {user?.id || user?._id || 'Loading...'}
                                    </Typography>
                                    <Button 
                                      size="small" 
                                      sx={{ mt: 1 }}
                                      onClick={() => {
                                        navigator.clipboard.writeText(user?.id || user?._id || '');
                                        setSnackbar({ open: true, message: 'Patient ID copied to clipboard!', severity: 'success' });
                                      }}
                                    >
                                      Copy ID
                                    </Button>
                                  </Box>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Box 
                                      component="img"
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(user?.id || user?._id || '')}`}
                                      alt="Patient QR Code"
                                      onClick={() => setQrCodeDialogOpen(true)}
                                      sx={{ 
                                        width: 100, 
                                        height: 100, 
                                        border: '1px solid', 
                                        borderColor: 'grey.300',
                                        borderRadius: 1,
                                        bgcolor: 'white',
                                        p: 0.5,
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                          transform: 'scale(1.05)',
                                          boxShadow: 2
                                        }
                                      }}
                                    />
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Scan to share
                                    </Typography>
                                    <Typography variant="caption" color="primary" display="block" sx={{ cursor: 'pointer' }} onClick={() => setQrCodeDialogOpen(true)}>
                                      Click to enlarge
                                    </Typography>
                                  </Box>
                                </Box>
                              </Paper>
                            )}
                            
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                                <Typography variant="body1">{profileData.dateOfBirth || 'Not set'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Gender</Typography>
                                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{profileData.gender || 'Not set'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Blood Type</Typography>
                                <Typography variant="body1">{profileData.bloodType || 'Not set'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">Phone</Typography>
                                <Typography variant="body1">{profileData.phone || 'Not set'}</Typography>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>

                        {/* Contact Information */}
                        <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
                          Contact Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Phone Number"
                              value={profileData.phone}
                              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                              fullWidth variant="outlined" size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Address"
                              value={profileData.address}
                              onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                              fullWidth variant="outlined" size="small"
                            />
                          </Grid>
                        </Grid>

                        <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 500 }}>
                          Emergency Contact
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Contact Name"
                              value={profileData.emergencyContact?.name || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, name: e.target.value } }))}
                              fullWidth variant="outlined" size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Relationship"
                              value={profileData.emergencyContact?.relationship || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, relationship: e.target.value } }))}
                              fullWidth variant="outlined" size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Contact Phone"
                              value={profileData.emergencyContact?.phone || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, phone: e.target.value } }))}
                              fullWidth variant="outlined" size="small"
                            />
                          </Grid>
                        </Grid>
                        <Button variant="contained" color="primary" onClick={handleUpdateContact} disabled={profileLoading} sx={{ mt: 2 }}>
                          {profileLoading ? 'Saving...' : 'Save Contact Information'}
                        </Button>

                        {/* Latest Diagnosis */}
                        <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 4 }}>
                          Latest Diagnosis
                        </Typography>
                        {latestPrescription ? (
                          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {latestPrescription.diagnosis || 'No diagnosis recorded'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Prescribed by: Dr. {latestPrescription.doctorName || 'Unknown'} | 
                              Date: {new Date(latestPrescription.createdAt).toLocaleDateString()}
                            </Typography>
                            {latestPrescription.medications && latestPrescription.medications.length > 0 && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Medications: {latestPrescription.medications.map(m => m.name).join(', ')}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No prescriptions found</Typography>
                        )}
                      </>
                    )}

                    {/* ALLERGIES Tab */}
                    {profileTab === 1 && (
                      <>
                        {/* Environmental Allergies */}
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" gutterBottom>Environmental</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Patient has any Environmental based allergy?
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {profileData.allergies?.environmental?.length > 0 ? (
                              profileData.allergies.environmental.map((allergy) => (
                                <Chip key={allergy} label={allergy} color="warning" variant="outlined"
                                  onDelete={() => handleRemoveAllergy('environmental', allergy)} deleteIcon={<CancelIcon />} />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No environmental allergies</Typography>
                            )}
                          </Box>
                          <Button variant="text" color="primary" onClick={() => { setAllergyCategory('environmental'); }}
                            sx={{ textTransform: 'none' }}>
                            + Add an Allergen
                          </Button>
                          {allergyCategory === 'environmental' && (
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                              <TextField label="Add Environmental Allergy" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)}
                                size="small" sx={{ flexGrow: 1, maxWidth: 300 }} onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy('environmental')} />
                              <Button variant="contained" color="warning" onClick={() => handleAddAllergy('environmental')}
                                disabled={profileLoading || !newAllergy.trim()} size="small">Add</Button>
                            </Box>
                          )}
                        </Box>

                        {/* Food Allergies */}
                        <Box sx={{ mb: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="h6" gutterBottom>Food</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Patient has any Food based allergy?
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {profileData.allergies?.food?.length > 0 ? (
                              profileData.allergies.food.map((allergy) => (
                                <Chip key={allergy} label={allergy} color="success" variant="outlined"
                                  onDelete={() => handleRemoveAllergy('food', allergy)} deleteIcon={<CancelIcon />} />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No food allergies</Typography>
                            )}
                          </Box>
                          <Button variant="text" color="primary" onClick={() => { setAllergyCategory('food'); }}
                            sx={{ textTransform: 'none' }}>
                            + Add an Allergen
                          </Button>
                          {allergyCategory === 'food' && (
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                              <TextField label="Add Food Allergy" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)}
                                size="small" sx={{ flexGrow: 1, maxWidth: 300 }} onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy('food')} />
                              <Button variant="contained" color="success" onClick={() => handleAddAllergy('food')}
                                disabled={profileLoading || !newAllergy.trim()} size="small">Add</Button>
                            </Box>
                          )}
                        </Box>

                        {/* Drug Allergies */}
                        <Box sx={{ mb: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="h6" gutterBottom>Drugs</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Patient has any Drugs based allergy?
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {profileData.allergies?.drugs?.length > 0 ? (
                              profileData.allergies.drugs.map((allergy) => (
                                <Chip key={allergy} label={allergy} color="error" variant="outlined"
                                  onDelete={() => handleRemoveAllergy('drugs', allergy)} deleteIcon={<CancelIcon />} />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No drug allergies</Typography>
                            )}
                          </Box>
                          <Button variant="text" color="primary" onClick={() => { setAllergyCategory('drugs'); }}
                            sx={{ textTransform: 'none' }}>
                            + Add an Allergen
                          </Button>
                          {allergyCategory === 'drugs' && (
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                              <TextField label="Add Drug Allergy" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)}
                                size="small" sx={{ flexGrow: 1, maxWidth: 300 }} onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy('drugs')} />
                              <Button variant="contained" color="error" onClick={() => handleAddAllergy('drugs')}
                                disabled={profileLoading || !newAllergy.trim()} size="small">Add</Button>
                            </Box>
                          )}
                        </Box>

                        {/* Other Allergies */}
                        <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                          <Typography variant="h6" gutterBottom>Other</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Patient has any Other based allergy?
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {profileData.allergies?.other?.length > 0 ? (
                              profileData.allergies.other.map((allergy) => (
                                <Chip key={allergy} label={allergy} color="info" variant="outlined"
                                  onDelete={() => handleRemoveAllergy('other', allergy)} deleteIcon={<CancelIcon />} />
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No other allergies</Typography>
                            )}
                          </Box>
                          <Button variant="text" color="primary" onClick={() => { setAllergyCategory('other'); }}
                            sx={{ textTransform: 'none' }}>
                            + Add an Allergen
                          </Button>
                          {allergyCategory === 'other' && (
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
                              <TextField label="Add Other Allergy" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)}
                                size="small" sx={{ flexGrow: 1, maxWidth: 300 }} onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy('other')} />
                              <Button variant="contained" color="info" onClick={() => handleAddAllergy('other')}
                                disabled={profileLoading || !newAllergy.trim()} size="small">Add</Button>
                            </Box>
                          )}
                        </Box>
                      </>
                    )}

                    {/* HISTORY Tab */}
                    {profileTab === 2 && (
                      <>
                        <Typography variant="h6" gutterBottom>Disease History</Typography>
                        {profileData.diseaseHistory?.length > 0 ? (
                          <Box sx={{ mb: 3 }}>
                            {profileData.diseaseHistory.map((history) => (
                              <Paper key={history.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{history.disease}</Typography>
                                    {history.diagnosedDate && (
                                      <Typography variant="body2" color="text.secondary">
                                        Diagnosed: {new Date(history.diagnosedDate).toLocaleDateString()}
                                      </Typography>
                                    )}
                                    {history.notes && (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Notes: {history.notes}
                                      </Typography>
                                    )}
                                  </Box>
                                  <IconButton size="small" color="error" onClick={() => handleRemoveDiseaseHistory(history.id)}>
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </Paper>
                            ))}
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                              You have not added any patient's disease history
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Add Disease History Form */}
                        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>Add Disease History</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <TextField
                                label="Disease/Condition"
                                value={newDiseaseHistory.disease}
                                onChange={(e) => setNewDiseaseHistory(prev => ({ ...prev, disease: e.target.value }))}
                                fullWidth size="small"
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                label="Diagnosed Date"
                                type="date"
                                value={newDiseaseHistory.diagnosedDate}
                                onChange={(e) => setNewDiseaseHistory(prev => ({ ...prev, diagnosedDate: e.target.value }))}
                                fullWidth size="small"
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <TextField
                                label="Notes"
                                value={newDiseaseHistory.notes}
                                onChange={(e) => setNewDiseaseHistory(prev => ({ ...prev, notes: e.target.value }))}
                                fullWidth size="small"
                              />
                            </Grid>
                          </Grid>
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleAddDiseaseHistory}
                            disabled={profileLoading || !newDiseaseHistory.disease.trim()}
                            sx={{ mt: 2 }}
                          >
                            ADD DISEASE HISTORY
                          </Button>
                        </Paper>
                      </>
                    )}

                    {/* HABITS Tab */}
                    {profileTab === 3 && (
                      <>
                        <Typography variant="h6" gutterBottom>Lifestyle & Habits</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Track your lifestyle habits for better health management
                        </Typography>
                        
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Smoking"
                              select
                              value={profileData.habits?.smoking || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, habits: { ...prev.habits, smoking: e.target.value } }))}
                              fullWidth
                              SelectProps={{ native: true }}
                              InputLabelProps={{ shrink: true }}
                            >
                              <option value="">Select...</option>
                              <option value="never">Never</option>
                              <option value="former">Former smoker</option>
                              <option value="occasional">Occasional</option>
                              <option value="regular">Regular</option>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Alcohol"
                              select
                              value={profileData.habits?.alcohol || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, habits: { ...prev.habits, alcohol: e.target.value } }))}
                              fullWidth
                              SelectProps={{ native: true }}
                              InputLabelProps={{ shrink: true }}
                            >
                              <option value="">Select...</option>
                              <option value="never">Never</option>
                              <option value="occasional">Occasional</option>
                              <option value="moderate">Moderate</option>
                              <option value="regular">Regular</option>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Exercise"
                              select
                              value={profileData.habits?.exercise || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, habits: { ...prev.habits, exercise: e.target.value } }))}
                              fullWidth
                              SelectProps={{ native: true }}
                              InputLabelProps={{ shrink: true }}
                            >
                              <option value="">Select...</option>
                              <option value="none">None</option>
                              <option value="light">Light (1-2 times/week)</option>
                              <option value="moderate">Moderate (3-4 times/week)</option>
                              <option value="active">Active (5+ times/week)</option>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Diet"
                              select
                              value={profileData.habits?.diet || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, habits: { ...prev.habits, diet: e.target.value } }))}
                              fullWidth
                              SelectProps={{ native: true }}
                              InputLabelProps={{ shrink: true }}
                            >
                              <option value="">Select...</option>
                              <option value="balanced">Balanced</option>
                              <option value="vegetarian">Vegetarian</option>
                              <option value="vegan">Vegan</option>
                              <option value="keto">Keto</option>
                              <option value="other">Other</option>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Sleep (hours/night)"
                              select
                              value={profileData.habits?.sleep || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, habits: { ...prev.habits, sleep: e.target.value } }))}
                              fullWidth
                              SelectProps={{ native: true }}
                              InputLabelProps={{ shrink: true }}
                            >
                              <option value="">Select...</option>
                              <option value="less5">Less than 5 hours</option>
                              <option value="5-6">5-6 hours</option>
                              <option value="7-8">7-8 hours</option>
                              <option value="more8">More than 8 hours</option>
                            </TextField>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Other Notes"
                              value={profileData.habits?.other || ''}
                              onChange={(e) => setProfileData(prev => ({ ...prev, habits: { ...prev.habits, other: e.target.value } }))}
                              fullWidth
                              multiline
                              rows={1}
                            />
                          </Grid>
                        </Grid>
                        
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleUpdateHabits}
                          disabled={profileLoading}
                          sx={{ mt: 3 }}
                        >
                          {profileLoading ? 'Saving...' : 'Save Habits'}
                        </Button>
                      </>
                    )}
                  </Box>
                </Paper>

                {/* Snackbar for profile notifications */}
                <Snackbar
                  open={snackbar.open}
                  autoHideDuration={4000}
                  onClose={() => setSnackbar({ ...snackbar, open: false })}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                  <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                  </Alert>
                </Snackbar>
              </Box>
            )}
            
            {activeContent === 'security' && (
              <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                  {user?.role === 'doctor' ? 'Doctor Profile' : 'Profile Settings'}
                </Typography>

                {/* Profile & Clinic Images Section - Doctor Only */}
                {user?.role === 'doctor' && (
                  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhotoCameraIcon /> Profile & Clinic Images
                    </Typography>
                    <Grid container spacing={4} sx={{ mt: 1 }}>
                      {/* Profile Image */}
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Profile Image
                          </Typography>
                          <Avatar
                            src={getImageUrl(securityForm.profileImage)}
                            sx={{ width: 120, height: 120, mb: 2, border: '3px solid #1976d2' }}
                          >
                            <PersonIcon sx={{ fontSize: 60 }} />
                          </Avatar>
                          <input
                            type="file"
                            accept="image/*"
                            id="profile-image-upload"
                            onChange={handleDoctorProfileImageUpload}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="profile-image-upload">
                            <Button
                              variant="outlined"
                              size="small"
                              component="span"
                              startIcon={uploadingProfileImage ? <CircularProgress size={16} /> : <PhotoCameraIcon />}
                              disabled={uploadingProfileImage}
                            >
                              {uploadingProfileImage ? 'Uploading...' : 'Upload Photo'}
                            </Button>
                          </label>
                        </Box>
                      </Grid>
                      
                      {/* Clinic Logo */}
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Clinic Logo
                          </Typography>
                          <Avatar
                            variant="rounded"
                            src={getImageUrl(securityForm.clinicLogo)}
                            sx={{ width: 120, height: 120, mb: 2, border: '3px solid #4caf50' }}
                          >
                            <BusinessIcon sx={{ fontSize: 60 }} />
                          </Avatar>
                          <input
                            type="file"
                            accept="image/*"
                            id="clinic-logo-upload"
                            onChange={handleClinicLogoUpload}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="clinic-logo-upload">
                            <Button
                              variant="outlined"
                              color="success"
                              size="small"
                              component="span"
                              startIcon={uploadingClinicLogo ? <CircularProgress size={16} /> : <BusinessIcon />}
                              disabled={uploadingClinicLogo}
                            >
                              {uploadingClinicLogo ? 'Uploading...' : 'Upload Logo'}
                            </Button>
                          </label>
                        </Box>
                      </Grid>

                      {/* Signature */}
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Signature
                          </Typography>
                          <Avatar
                            variant="rounded"
                            src={getImageUrl(securityForm.signature)}
                            sx={{ width: 150, height: 80, mb: 2, border: '3px solid #9c27b0', bgcolor: 'white' }}
                          >
                            <CreateIcon sx={{ fontSize: 40 }} />
                          </Avatar>
                          <input
                            type="file"
                            accept="image/*"
                            id="signature-upload"
                            onChange={handleSignatureUpload}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="signature-upload">
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              component="span"
                              startIcon={uploadingSignature ? <CircularProgress size={16} /> : <CreateIcon />}
                              disabled={uploadingSignature}
                            >
                              {uploadingSignature ? 'Uploading...' : 'Upload Signature'}
                            </Button>
                          </label>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Basic Information Section */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon /> Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="First Name"
                        value={securityForm.firstName}
                        onChange={handleSecurityFormChange('firstName')}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Last Name"
                        value={securityForm.lastName}
                        onChange={handleSecurityFormChange('lastName')}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Email"
                        value={securityForm.email}
                        fullWidth
                        variant="outlined"
                        disabled
                        helperText="Email cannot be changed"
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Doctor-specific Professional Information */}
                {user?.role === 'doctor' && (
                  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalHospitalIcon /> Professional Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Specialization"
                          value={securityForm.specialization}
                          onChange={handleSecurityFormChange('specialization')}
                          fullWidth
                          variant="outlined"
                          placeholder="e.g., Cardiologist, General Physician"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="License Number"
                          value={securityForm.licenseNumber}
                          onChange={handleSecurityFormChange('licenseNumber')}
                          fullWidth
                          variant="outlined"
                          placeholder="Medical license number"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Years of Experience"
                          value={securityForm.experience}
                          onChange={handleSecurityFormChange('experience')}
                          fullWidth
                          variant="outlined"
                          placeholder="e.g., 10 years"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Qualifications"
                          value={securityForm.qualifications}
                          onChange={handleSecurityFormChange('qualifications')}
                          fullWidth
                          variant="outlined"
                          placeholder="e.g., MBBS, MD, FRCP"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Clinic Information - for doctors */}
                {user?.role === 'doctor' && (
                  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon /> Clinic Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Clinic Name"
                          value={securityForm.clinicName}
                          onChange={handleSecurityFormChange('clinicName')}
                          fullWidth
                          variant="outlined"
                          placeholder="Your clinic or hospital name"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Website"
                          value={securityForm.website}
                          onChange={handleSecurityFormChange('website')}
                          fullWidth
                          variant="outlined"
                          placeholder="https://www.yourclinic.com"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Clinic/Hospital Address"
                          value={securityForm.clinicAddress}
                          onChange={handleSecurityFormChange('clinicAddress')}
                          fullWidth
                          variant="outlined"
                          multiline
                          rows={2}
                          placeholder="Your clinic or hospital address"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Contact Information - for doctors */}
                {user?.role === 'doctor' && (
                  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ContactPhoneIcon /> Contact Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Primary Phone"
                          value={securityForm.contactNumber}
                          onChange={handleSecurityFormChange('contactNumber')}
                          fullWidth
                          variant="outlined"
                          placeholder="Primary phone number"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Secondary Phone"
                          value={securityForm.secondaryPhone}
                          onChange={handleSecurityFormChange('secondaryPhone')}
                          fullWidth
                          variant="outlined"
                          placeholder="Alternative phone number"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Alternate Email"
                          value={securityForm.alternateEmail}
                          onChange={handleSecurityFormChange('alternateEmail')}
                          fullWidth
                          variant="outlined"
                          type="email"
                          placeholder="secondary@email.com"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Fax"
                          value={securityForm.fax}
                          onChange={handleSecurityFormChange('fax')}
                          fullWidth
                          variant="outlined"
                          placeholder="Fax number"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="WhatsApp"
                          value={securityForm.whatsapp}
                          onChange={handleSecurityFormChange('whatsapp')}
                          fullWidth
                          variant="outlined"
                          placeholder="+91 XXXXXXXXXX"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Social Media Links - for doctors */}
                {user?.role === 'doctor' && (
                  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinkIcon /> Social Media Links
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="LinkedIn"
                          value={securityForm.linkedin}
                          onChange={handleSecurityFormChange('linkedin')}
                          fullWidth
                          variant="outlined"
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Twitter / X"
                          value={securityForm.twitter}
                          onChange={handleSecurityFormChange('twitter')}
                          fullWidth
                          variant="outlined"
                          placeholder="https://twitter.com/yourhandle"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Facebook"
                          value={securityForm.facebook}
                          onChange={handleSecurityFormChange('facebook')}
                          fullWidth
                          variant="outlined"
                          placeholder="https://facebook.com/yourpage"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Instagram"
                          value={securityForm.instagram}
                          onChange={handleSecurityFormChange('instagram')}
                          fullWidth
                          variant="outlined"
                          placeholder="https://instagram.com/yourhandle"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Save Profile Button */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpdateName}
                    disabled={securityLoading}
                    fullWidth
                    size="large"
                  >
                    {securityLoading ? 'Saving...' : 'Save Profile'}
                  </Button>
                </Paper>

                {/* Change Password Section */}
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Change Password
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Current Password"
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={handleSecurityFormChange('currentPassword')}
                      fullWidth
                      variant="outlined"
                    />
                    <TextField
                      label="New Password"
                      type="password"
                      value={securityForm.newPassword}
                      onChange={handleSecurityFormChange('newPassword')}
                      fullWidth
                      variant="outlined"
                      helperText="Password must be at least 6 characters"
                    />
                    <TextField
                      label="Confirm New Password"
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={handleSecurityFormChange('confirmPassword')}
                      fullWidth
                      variant="outlined"
                      error={securityForm.confirmPassword !== '' && securityForm.newPassword !== securityForm.confirmPassword}
                      helperText={securityForm.confirmPassword !== '' && securityForm.newPassword !== securityForm.confirmPassword ? 'Passwords do not match' : ''}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleChangePassword}
                      disabled={securityLoading}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {securityLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </Box>
                </Paper>

                {/* Snackbar for security notifications */}
                <Snackbar
                  open={snackbar.open}
                  autoHideDuration={4000}
                  onClose={() => setSnackbar({ ...snackbar, open: false })}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                  <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                  </Alert>
                </Snackbar>
              </Box>
            )}
          </Box>
        )}
        
        <Box sx={{ mb: 10 }} />
      </Container>

      {/* ─── FOOTER — full screen width ─── */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#134F4D',
          color: '#fff',
          pt: { xs: 3, md: 4 },
          pb: 0,
          width: '100%',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={3}>

                {/* Brand column */}
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <img src="/LOGO.png" alt="Medizo" style={{ height: 36, marginRight: 10, borderRadius: 4 }} />
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>Medizo</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.8 }}>
                    Health on your fingertips.<br />
                    A digital prescription platform connecting doctors and patients — securely and seamlessly.
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.60)' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.60)' }}>India</Typography>
                  </Box>
                </Grid>

                {/* Quick Links - only show when not logged in */}
                {!hasActiveSession && (
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#fff', letterSpacing: 0.5 }}>Quick Links</Typography>
                  {[
                    { label: 'Home',         action: () => { setActiveContent('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
                    { label: 'Login',        action: () => handleOpenAuthDialog(0) },
                    { label: 'Register',     action: () => handleOpenAuthDialog(1) },
                  ].map((link) => (
                    <Box
                      key={link.label}
                      onClick={link.action}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        cursor: 'pointer', mb: 0.8,
                        color: 'rgba(255,255,255,0.72)',
                        fontSize: '0.875rem',
                        '&:hover': { color: '#fff', textDecoration: 'underline' },
                        transition: 'color 0.2s'
                      }}
                    >
                      <ArrowForwardIcon sx={{ fontSize: 13 }} />
                      {link.label}
                    </Box>
                  ))}
                </Grid>
                )}

                {/* Contact */}
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#fff', letterSpacing: 0.5 }}>Contact Us</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <EmailIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.60)' }} />
                    <Typography
                      component="a"
                      href="mailto:info@medizo.health"
                      variant="body2"
                      sx={{ color: 'rgba(255,255,255,0.80)', textDecoration: 'none', '&:hover': { color: '#fff' } }}
                    >
                      info@medizo.health
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <PhoneIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.60)' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.80)' }}>
                      +91-9800000000
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.60)' }} />
                    <Typography
                      component="a"
                      href="mailto:support@medizo.health"
                      variant="body2"
                      sx={{ color: 'rgba(255,255,255,0.80)', textDecoration: 'none', '&:hover': { color: '#fff' } }}
                    >
                      support@medizo.health
                    </Typography>
                  </Box>
                </Grid>

                {/* Social Media */}
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#fff', letterSpacing: 0.5 }}>Follow Us</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1.2 }}>
                    {[
                      {
                        label: 'LinkedIn',
                        href: 'https://linkedin.com/company/medizo',
                        icon: (
                          <Box component="svg" viewBox="0 0 24 24" sx={{ width: 20, height: 20, fill: '#fff' }}>
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </Box>
                        )
                      },
                      {
                        label: 'YouTube',
                        href: 'https://youtube.com/@medizo',
                        icon: (
                          <Box component="svg" viewBox="0 0 24 24" sx={{ width: 20, height: 20, fill: '#fff' }}>
                            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </Box>
                        )
                      },
                      {
                        label: 'Facebook',
                        href: 'https://facebook.com/medizo',
                        icon: (
                          <Box component="svg" viewBox="0 0 24 24" sx={{ width: 20, height: 20, fill: '#fff' }}>
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3H13v6.95C18.05 20.45 22 16.64 22 12z" />
                          </Box>
                        )
                      },
                      {
                        label: 'Instagram',
                        href: 'https://instagram.com/medizo',
                        icon: (
                          <Box component="svg" viewBox="0 0 24 24" sx={{ width: 20, height: 20, fill: '#fff' }}>
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </Box>
                        )
                      },
                      {
                        label: 'Twitter / X',
                        href: 'https://twitter.com/medizo',
                        icon: (
                          <Box component="svg" viewBox="0 0 24 24" sx={{ width: 20, height: 20, fill: '#fff' }}>
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </Box>
                        )
                      },
                    ].map((s) => (
                      <Box
                        key={s.label}
                        component="a"
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={s.label}
                        sx={{ textDecoration: 'none' }}
                      >
                        <Box
                          sx={{
                            width: 36, height: 36, borderRadius: '50%',
                            bgcolor: 'rgba(255,255,255,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s, transform 0.2s',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.28)', transform: 'scale(1.12)' },
                          }}
                        >
                          {s.icon}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>

              {/* Divider */}
              <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.15)', mt: 3, pt: 2, pb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    © {new Date().getFullYear()} Medizo. All rights reserved.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                      <Typography
                        key={item}
                        component="span"
                        variant="caption"
                        onClick={() => setPolicyDialog({ open: true, type: item })}
                        sx={{ color: 'rgba(255,255,255,0.50)', textDecoration: 'none', cursor: 'pointer', '&:hover': { color: '#fff' } }}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Container>
        </Box>

      {/* ─── Policy Dialogs ─── */}
      <Dialog
        open={policyDialog.open}
        onClose={() => setPolicyDialog({ open: false, type: null })}
        maxWidth="md"
        fullWidth
        scroll="paper"
        TransitionComponent={SlideTransition}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#134F4D', color: '#fff' }}>
          <Typography variant="h6" fontWeight={700}>{policyDialog.type}</Typography>
          <IconButton onClick={() => setPolicyDialog({ open: false, type: null })} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, md: 4 } }}>
          {policyDialog.type && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
                Last updated: {policyContent[policyDialog.type]?.lastUpdated}
              </Typography>
              {policyContent[policyDialog.type]?.sections.map((sec, i) => (
                <Box key={i} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} color="#134F4D" gutterBottom>
                    {i + 1}. {sec.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {sec.body}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPolicyDialog({ open: false, type: null })} variant="contained" sx={{ bgcolor: '#134F4D', '&:hover': { bgcolor: '#0d3836' } }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

        {/* Back to Top */}
        <Box
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{
            position: 'fixed', bottom: 76, right: 20, zIndex: 999,
            width: 44, height: 44, borderRadius: '50%',
            bgcolor: '#134F4D', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            transition: 'background 0.2s, transform 0.2s',
            '&:hover': { bgcolor: '#0d3836', transform: 'translateY(-3px)' }
          }}
        >
          <KeyboardArrowUpIcon />
        </Box>

        {/* ─── Mobile Native Bottom Navigation Bar ─── */}
        <Paper 
          elevation={12} 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1300,
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden',
            borderTop: '1px solid rgba(19, 79, 77, 0.15)',
            bgcolor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <BottomNavigation
            value={activeContent}
            onChange={(event, newValue) => {
              if (newValue === 'login') {
                handleOpenAuthDialog(0);
              } else if (newValue === 'register') {
                handleOpenAuthDialog(1);
              } else {
                setActiveContent(newValue);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            showLabels
            sx={{
              bgcolor: 'transparent',
              height: 64,
              '& .MuiBottomNavigationAction-root': {
                color: '#666',
                py: 0.5,
                minWidth: 'auto',
                '&.Mui-selected': {
                  color: '#134F4D',
                  fontWeight: 700
                }
              }
            }}
          >
            {hasActiveSession ? (
              user?.role === 'doctor' ? [
                <BottomNavigationAction key="dashboard" label="Dashboard" value="dashboard" icon={<LocalHospitalIcon />} />,
                <BottomNavigationAction key="prescriptions" label="Prescriptions" value="prescriptions" icon={<MedicationIcon />} />,
                <BottomNavigationAction key="new" label="New Rx" value="create-prescription" icon={<CreateIcon />} />,
                <BottomNavigationAction key="patients" label="Patients" value="patients" icon={<PersonIcon />} />,
                <BottomNavigationAction key="profile" label="Profile" value="profile" icon={<VerifiedUserIcon />} />
              ] : [
                <BottomNavigationAction key="dashboard" label="Dashboard" value="dashboard" icon={<LocalHospitalIcon />} />,
                <BottomNavigationAction key="prescriptions" label="Records" value="prescriptions" icon={<MedicationIcon />} />,
                <BottomNavigationAction key="profile" label="Profile" value="profile" icon={<PersonIcon />} />,
                <BottomNavigationAction key="security" label="Settings" value="security" icon={<SecurityIcon />} />
              ]
            ) : [
              <BottomNavigationAction key="home" label="Home" value="dashboard" icon={<LocalHospitalIcon />} />,
              <BottomNavigationAction key="login" label="Login" value="login" icon={<PersonIcon />} />,
              <BottomNavigationAction key="register" label="Register" value="register" icon={<CreateIcon />} />
            ]}
          </BottomNavigation>
        </Paper>
    </Box>
  );
};

// Google OAuth Client ID - Get from Google Cloud Console
// For production, we use the hardcoded value since GitHub Pages doesn't support env vars at runtime
// Client IDs are public (not secrets) - they are embedded in frontend code
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '427324625620-qbg0q3s9cgu8kd80a9upco0m9147jo1u.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export { AppContent };
export default App;
