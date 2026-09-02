'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  Stack,
  Divider,
  Avatar,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  LocalPharmacy as PharmacyIcon,
  Bloodtype as BloodIcon,
  ContactEmergency as EmergencyIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Cake as CakeIcon,
  Visibility as VisibilityIcon,
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  PictureAsPdf as PdfIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  EditCalendar as EditCalendarIcon,
  Done as DoneIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  VerifiedUser as VerifiedUserIcon,
  Shield as ShieldIcon,
  Medication as MedicationIcon,
  MedicalServices as MedicalServicesIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  Add as AddIcon,
  InfoOutlined as InfoOutlinedIcon,
  Call as CallIcon,
  People as PeopleIcon,
  LocationOn as LocationOnIcon,
  ReceiptLong as ReceiptLongIcon
} from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { prescriptionsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../types/auth';
import {
  getManagedPatients,
  getPatientMedicalDetails,
  updatePatientMedicalInfo
} from '../services/patients';
import EditPatientProfileModal from './EditPatientProfileModal';interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  dateOfBirth: string;
  contactNumber: string;
  address: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string[];
  bloodType?: string;
  insurance?: string;
}

interface EnhancedPatient extends Omit<Patient, 'medicalHistory'> {
  age?: number | string;
  dob?: string;
  patientDOB?: string;
  gender?: string;
  prescriptionHistory?: any[];
  totalPrescriptions?: number;
  latestPrescription?: any;
  activePrescriptions?: number;
  completedPrescriptions?: number;
  allMedications?: any[];
  diagnoses?: string[];
  allergies?: string[];
  medicalHistory?: string[];
  lastVisit?: string;
  lastActivity?: string;
  emergencyContact?: any;
  bloodType?: string;
  insurance?: any;
}

interface FollowUpAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  diagnosis: string;
  followUpDate: string;
  daysUntil: number;
  isToday: boolean;
  isUpcoming: boolean;
}

interface EnhancedPatientManagementProps {
  maxPatients?: number;
  searchQuery?: string;
}

const EnhancedPatientManagement: React.FC<EnhancedPatientManagementProps> = ({ maxPatients, searchQuery = '' }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [patients, setPatients] = useState<EnhancedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<EnhancedPatient | null>(null);
  const [medicalDetailsOpen, setMedicalDetailsOpen] = useState(false);
  const [medicalDetails, setMedicalDetails] = useState<any>(null);
  const [medicalDetailsLoading, setMedicalDetailsLoading] = useState(false);
  const [editMedicalOpen, setEditMedicalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState<FollowUpAppointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<FollowUpAppointment[]>([]);
  
  // Search, Filter, Sort & Pagination states
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'other'>('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState<'all' | 'kids' | 'teens' | 'adults' | 'middle' | 'seniors'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active_rx' | 'has_rx' | 'no_rx'>('all');
  const [sortBy, setSortBy] = useState<string>('last_visit_desc');
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 6;

  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  const [medicalFormData, setMedicalFormData] = useState({
    allergies: [] as string[],
    medicalHistory: [] as string[],
    emergencyContact: { name: '', phone: '', relationship: '' },
    bloodType: '',
    insurance: { provider: '', policyNumber: '', groupNumber: '' }
  });

  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  // Prescription Date Change states
  const [rxDateModalOpen, setRxDateModalOpen] = useState(false);
  const [selectedRxForDateChange, setSelectedRxForDateChange] = useState<any>(null);
  const [targetRxNewDate, setTargetRxNewDate] = useState('');
  const [rxDateSaving, setRxDateSaving] = useState(false);
  const [rxDateError, setRxDateError] = useState<string | null>(null);
  const [rxDateSuccess, setRxDateSuccess] = useState<string | null>(null);

  const handleOpenDateModal = (e: React.MouseEvent, rx: any) => {
    e.stopPropagation();
    setSelectedRxForDateChange(rx);
    const currentDt = rx.createdAt ? new Date(rx.createdAt) : new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${currentDt.getFullYear()}-${pad(currentDt.getMonth() + 1)}-${pad(currentDt.getDate())}T${pad(currentDt.getHours())}:${pad(currentDt.getMinutes())}`;
    setTargetRxNewDate(formatted);
    setRxDateError(null);
    setRxDateSuccess(null);
    setRxDateModalOpen(true);
  };

  const handleSaveRxDate = async () => {
    if (!selectedRxForDateChange?.id || !targetRxNewDate) return;
    try {
      setRxDateSaving(true);
      setRxDateError(null);
      const isoDate = new Date(targetRxNewDate).toISOString();
      await prescriptionsAPI.updatePrescription(selectedRxForDateChange.id, {
        createdAt: isoDate,
        issuedDate: isoDate,
        prescriptionDate: isoDate
      });

      // Update in medicalDetails.prescriptionHistory immediately
      setMedicalDetails((prev: any) => {
        if (!prev || !prev.prescriptionHistory) return prev;
        return {
          ...prev,
          prescriptionHistory: prev.prescriptionHistory.map((item: any) => 
            (item.id === selectedRxForDateChange.id || item._id === selectedRxForDateChange.id)
              ? { ...item, createdAt: isoDate }
              : item
          )
        };
      });

      setRxDateSuccess('Prescription issued date updated successfully!');
      setTimeout(() => {
        setRxDateModalOpen(false);
        setRxDateSuccess(null);
        setSelectedRxForDateChange(null);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to update prescription date:', err);
      setRxDateError(err.response?.data?.message || err.message || 'Failed to update prescription date');
    } finally {
      setRxDateSaving(false);
    }
  };

  // Edit Patient Profile modal states
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [patientForProfileEdit, setPatientForProfileEdit] = useState<any>(null);

  const handleOpenEditProfile = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    setPatientForProfileEdit(p);
    setEditProfileModalOpen(true);
  };

  const handlePatientProfileUpdated = (updated: any) => {
    setPatients(prev => prev.map(p => (p.id === updated.id || (p as any)._id === updated.id) ? { ...p, ...updated } : p));
    if (selectedPatient && (selectedPatient.id === updated.id || (selectedPatient as any)._id === updated.id)) {
      setSelectedPatient(prev => prev ? ({ ...prev, ...updated }) : null);
    }
    if (medicalDetails && selectedPatient && (selectedPatient.id === updated.id || (selectedPatient as any)._id === updated.id)) {
      setMedicalDetails((prev: any) => prev ? ({
        ...prev,
        bloodType: updated.bloodType || prev.bloodType,
        emergencyContact: updated.emergencyContact || prev.emergencyContact,
        allergies: updated.allergies || prev.allergies,
        medicalHistory: updated.medicalHistory || prev.medicalHistory
      }) : prev);
    }
  };

  const handleDownloadPdf = async (e: React.MouseEvent, rxId: string) => {
    e.stopPropagation();
    if (!rxId) return;
    try {
      setDownloadingPdfId(rxId);
      const blob = await prescriptionsAPI.downloadPrescription(rxId);
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Prescription_${rxId.substring(0, 8).toUpperCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading prescription PDF:', err);
      window.open(`/api/prescriptions/${rxId}/download`, '_blank');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleViewPrescription = (e: React.MouseEvent, rxId: string) => {
    e.stopPropagation();
    if (!rxId) return;
    navigate(`/prescriptions/${rxId}`);
  };

  // Fetch from cache first, then background refresh
  useEffect(() => {
    fetchManagedPatients();
    // Background refresh after showing cached data
    const timer = setTimeout(() => fetchManagedPatients(true), 100);
    fetchFollowUpAppointments();
    return () => clearTimeout(timer);
  }, []);

  const fetchFollowUpAppointments = async () => {
    try {
      const prescriptions = await prescriptionsAPI.getMyPrescriptions();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const appointmentsWithFollowUp: FollowUpAppointment[] = [];
      
      prescriptions.forEach((rx: any) => {
        if (rx.followUpDate) {
          const followUp = new Date(rx.followUpDate);
          followUp.setHours(0, 0, 0, 0);
          
          const diffTime = followUp.getTime() - today.getTime();
          const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Include today and next 7 days
          if (daysUntil >= 0 && daysUntil <= 7) {
            appointmentsWithFollowUp.push({
              id: rx.id || rx._id,
              patientId: rx.patientId,
              patientName: rx.patientName || 'Unknown Patient',
              patientEmail: rx.patientEmail || '',
              diagnosis: rx.diagnosis,
              followUpDate: rx.followUpDate,
              daysUntil,
              isToday: daysUntil === 0,
              isUpcoming: daysUntil > 0 && daysUntil <= 7
            });
          }
        }
      });
      
      // Sort by date
      appointmentsWithFollowUp.sort((a, b) => a.daysUntil - b.daysUntil);
      
      setTodayAppointments(appointmentsWithFollowUp.filter(a => a.isToday));
      setUpcomingAppointments(appointmentsWithFollowUp.filter(a => a.isUpcoming));
    } catch (err) {
      console.error('Error fetching follow-up appointments:', err);
    }
  };

  const fetchManagedPatients = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) setLoading(true);
      const data = await getManagedPatients(isBackgroundRefresh);
      setPatients(data as EnhancedPatient[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching managed patients:', err);
      if (!isBackgroundRefresh) setError('Failed to load patients');
    } finally {
      if (!isBackgroundRefresh) setLoading(false);
    }
  };

  // Age calculation helper
  const getPatientAge = (p: EnhancedPatient): number | null => {
    if (p.age !== undefined && p.age !== null && p.age !== '' && !isNaN(Number(p.age))) {
      return Number(p.age);
    }
    const dobStr = p.dateOfBirth || (p as any).dob || (p as any).patientDOB;
    if (dobStr) {
      const birthDate = new Date(dobStr);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age >= 0 && age < 150 ? age : null;
      }
    }
    return null;
  };

  // Gender & age summary badge text
  const getPatientBio = (p: EnhancedPatient): string => {
    const rawGender = (p.gender || (p as any).sex || '').toLowerCase().trim();
    let genderLabel = '';
    if (rawGender === 'male' || rawGender === 'm') genderLabel = 'Male';
    else if (rawGender === 'female' || rawGender === 'f') genderLabel = 'Female';
    else if (rawGender === 'other' || rawGender === 'o') genderLabel = 'Other';
    else if (rawGender) genderLabel = p.gender || '';

    const age = getPatientAge(p);
    return [genderLabel, age !== null ? `${age} yrs` : ''].filter(Boolean).join(' • ');
  };

  // Filter and sort patients
  const filteredAndSortedPatients = React.useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const cleanDigits = q.replace(/[^\d]/g, '');

    const list = patients.filter(p => {
      // 1. Search Query Match
      if (q) {
        const pMobile = String(p.contactNumber || (p as any).phone || (p as any).mobile || '');
        const pMobileDigits = pMobile.replace(/[^\d]/g, '');
        const mobileMatch = (pMobile && pMobile.toLowerCase().includes(q)) || (cleanDigits.length >= 3 && pMobileDigits.includes(cleanDigits));
        const nameMatch = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(q);
        const emailMatch = (p.email || '').toLowerCase().includes(q);
        const diagnosisMatch = (p.diagnoses && p.diagnoses.some((d: string) => d.toLowerCase().includes(q))) ||
          (p.latestPrescription?.diagnosis && p.latestPrescription.diagnosis.toLowerCase().includes(q));
        const medMatch = (p.allMedications && p.allMedications.some((m: any) => (typeof m === 'string' ? m : (m.name || '')).toLowerCase().includes(q))) ||
          (p.latestPrescription?.medication && p.latestPrescription.medication.toLowerCase().includes(q));

        if (!nameMatch && !emailMatch && !mobileMatch && !diagnosisMatch && !medMatch) {
          return false;
        }
      }

      // 2. Gender Filter
      if (genderFilter !== 'all') {
        const pGender = (p.gender || (p as any).sex || '').toLowerCase().trim();
        if (genderFilter === 'male' && pGender !== 'male' && pGender !== 'm') return false;
        if (genderFilter === 'female' && pGender !== 'female' && pGender !== 'f') return false;
        if (genderFilter === 'other' && pGender !== 'other' && pGender !== 'o') return false;
      }

      // 3. Age Group Filter
      if (ageGroupFilter !== 'all') {
        const age = getPatientAge(p);
        if (age === null) return false;
        if (ageGroupFilter === 'kids' && (age < 0 || age > 12)) return false;
        if (ageGroupFilter === 'teens' && (age < 13 || age > 19)) return false;
        if (ageGroupFilter === 'adults' && (age < 20 || age > 39)) return false;
        if (ageGroupFilter === 'middle' && (age < 40 || age > 59)) return false;
        if (ageGroupFilter === 'seniors' && age < 60) return false;
      }

      // 4. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active_rx' && (!p.activePrescriptions || p.activePrescriptions === 0)) return false;
        if (statusFilter === 'has_rx' && (!p.totalPrescriptions || p.totalPrescriptions === 0)) return false;
        if (statusFilter === 'no_rx' && (p.totalPrescriptions && p.totalPrescriptions > 0)) return false;
      }

      return true;
    });

    // 5. Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'last_visit_desc': {
          const tA = a.lastVisit ? new Date(a.lastVisit).getTime() : (a.lastActivity ? new Date(a.lastActivity).getTime() : 0);
          const tB = b.lastVisit ? new Date(b.lastVisit).getTime() : (b.lastActivity ? new Date(b.lastActivity).getTime() : 0);
          return tB - tA;
        }
        case 'last_visit_asc': {
          const tA = a.lastVisit ? new Date(a.lastVisit).getTime() : (a.lastActivity ? new Date(a.lastActivity).getTime() : Infinity);
          const tB = b.lastVisit ? new Date(b.lastVisit).getTime() : (b.lastActivity ? new Date(b.lastActivity).getTime() : Infinity);
          return tA - tB;
        }
        case 'name_asc': {
          const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
          const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
          return nameA.localeCompare(nameB);
        }
        case 'name_desc': {
          const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
          const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
          return nameB.localeCompare(nameA);
        }
        case 'date_desc': {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        }
        case 'date_asc': {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tA - tB;
        }
        case 'age_desc': {
          return (getPatientAge(b) || 0) - (getPatientAge(a) || 0);
        }
        case 'age_asc': {
          return (getPatientAge(a) || 0) - (getPatientAge(b) || 0);
        }
        case 'rx_desc': {
          return (b.totalPrescriptions || 0) - (a.totalPrescriptions || 0);
        }
        default:
          return 0;
      }
    });

    return list;
  }, [patients, searchTerm, genderFilter, ageGroupFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedPatients.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, genderFilter, ageGroupFilter, statusFilter, sortBy]);

  const paginatedPatients = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAndSortedPatients.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedPatients, page, PAGE_SIZE]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    genderFilter !== 'all' ||
    ageGroupFilter !== 'all' ||
    statusFilter !== 'all' ||
    sortBy !== 'last_visit_desc'
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setGenderFilter('all');
    setAgeGroupFilter('all');
    setStatusFilter('all');
    setSortBy('last_visit_desc');
    setPage(1);
  };

  const handleViewMedicalDetails = async (patient: EnhancedPatient) => {
    try {
      setMedicalDetailsLoading(true);
      setSelectedPatient(patient);
      const details = await getPatientMedicalDetails(patient.id);
      setMedicalDetails(details);
      setMedicalDetailsOpen(true);
    } catch (err) {
      console.error('Error fetching medical details:', err);
      setError('Failed to load medical details');
    } finally {
      setMedicalDetailsLoading(false);
    }
  };

  const handleEditMedicalInfo = (patient: EnhancedPatient) => {
    setSelectedPatient(patient);
    setMedicalFormData({
      allergies: patient.allergies || [],
      medicalHistory: patient.medicalHistory || [],
      emergencyContact: patient.emergencyContact || { name: '', phone: '', relationship: '' },
      bloodType: patient.bloodType || '',
      insurance: patient.insurance || { provider: '', policyNumber: '', groupNumber: '' }
    });
    setEditMedicalOpen(true);
  };

  const handleSaveMedicalInfo = async () => {
    if (!selectedPatient) return;

    try {
      await updatePatientMedicalInfo(selectedPatient.id, medicalFormData);
      setEditMedicalOpen(false);
      fetchManagedPatients();
    } catch (err) {
      console.error('Error updating medical info:', err);
      setError('Failed to update medical information');
    }
  };

  const handleAddAllergy = () => {
    const newAllergy = prompt('Enter new allergy:');
    if (newAllergy?.trim()) {
      setMedicalFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setMedicalFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const handleAddMedicalHistory = () => {
    const newHistory = prompt('Enter medical history item:');
    if (newHistory?.trim()) {
      setMedicalFormData(prev => ({
        ...prev,
        medicalHistory: [...prev.medicalHistory, newHistory.trim()]
      }));
    }
  };

  const handleRemoveMedicalHistory = (index: number) => {
    setMedicalFormData(prev => ({
      ...prev,
      medicalHistory: prev.medicalHistory.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Today's Appointments Alert (Only in Main Patients view) */}
      {!maxPatients && todayAppointments.length > 0 && (
        <Alert 
          severity="warning" 
          icon={<TodayIcon />}
          sx={{ mb: 3 }}
          action={
            <Chip label={`${todayAppointments.length}`} color="warning" size="small" />
          }
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Today's Follow-up Appointments
          </Typography>
        </Alert>
      )}

      {/* Today's Appointments Section (Only in Main Patients view) */}
      {!maxPatients && todayAppointments.length > 0 && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            border: '2px solid #ff9800'
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <TodayIcon color="warning" fontSize="large" />
            <Typography variant="h5" color="warning.dark" fontWeight="bold">
              Today's Appointments ({todayAppointments.length})
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {todayAppointments.map((apt) => (
              <Grid item xs={12} sm={6} md={4} key={apt.id}>
                <Card sx={{ bgcolor: 'white', boxShadow: 2 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {apt.patientName}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {apt.patientEmail}
                    </Typography>
                    <Chip 
                      label={apt.diagnosis} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <ScheduleIcon fontSize="small" color="warning" />
                      <Typography variant="caption" color="warning.dark" fontWeight="bold">
                        Follow-up TODAY
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Upcoming Appointments Section (Next 7 Days) (Only in Main Patients view) */}
      {!maxPatients && upcomingAppointments.length > 0 && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4, 
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            border: '1px solid #2196f3'
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <NotificationsIcon color="info" fontSize="large" />
            <Typography variant="h6" color="info.dark" fontWeight="bold">
              Upcoming Appointments - Next 7 Days ({upcomingAppointments.length})
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {upcomingAppointments.map((apt) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={apt.id}>
                <Card sx={{ bgcolor: 'white', boxShadow: 1 }}>
                  <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="subtitle2" fontWeight="bold" noWrap>
                      {apt.patientName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                      {apt.diagnosis}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <ScheduleIcon fontSize="small" color="info" />
                      <Typography variant="caption" color="info.dark" fontWeight="bold">
                        {apt.daysUntil === 1 ? 'Tomorrow' : `In ${apt.daysUntil} days`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {formatDate(apt.followUpDate)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Header (Desktop only - mobile already has top Patient Management banner) */}
      {!maxPatients && (
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#1A312C' }} gutterBottom>
              My Patients Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b', fontWeight: 600 }}>
              {patients.length} {patients.length === 1 ? 'patient' : 'patients'} linked under your care
            </Typography>
          </Box>
        </Box>
      )}

      {/* 🔍 Search, Filter & Sort Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2.2 },
          mb: { xs: 2, sm: 2.5 },
          borderRadius: { xs: '16px', sm: '20px' },
          border: isDark ? '1px solid rgba(102, 205, 170, 0.25)' : '1px solid rgba(137, 215, 183, 0.4)',
          bgcolor: isDark ? 'rgba(20, 38, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.25)' : '0 8px 32px rgba(26, 49, 44, 0.04)',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Row 1: Search Input & Sort Dropdown */}
        <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email, mobile, diagnosis, medication..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: isDark ? '#66CDAA' : '#428475', fontSize: { xs: 18, sm: 20 } }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')} edge="end">
                      <ClearIcon fontSize="small" sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b' }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: {
                  borderRadius: '12px',
                  fontSize: { xs: '0.82rem', sm: '0.9rem' },
                  bgcolor: isDark ? 'rgba(10, 20, 18, 0.6)' : 'rgba(240, 253, 250, 0.8)',
                  color: isDark ? '#FAF2F5' : '#1A312C',
                  '& fieldset': {
                    borderColor: isDark ? 'rgba(102, 205, 170, 0.3)' : 'rgba(137, 215, 183, 0.5)'
                  },
                  '&:hover fieldset': {
                    borderColor: isDark ? '#66CDAA' : '#1A312C'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: isDark ? '#66CDAA' : '#1A312C'
                  }
                }
              }}
            />
          </Grid>

          {/* Sort Dropdown */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="patient-sort-label" sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b', fontSize: '0.8rem' }}>
                Sort Patients By
              </InputLabel>
              <Select
                labelId="patient-sort-label"
                value={sortBy}
                label="Sort Patients By"
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  borderRadius: '12px',
                  fontSize: { xs: '0.8rem', sm: '0.85rem' },
                  bgcolor: isDark ? 'rgba(10, 20, 18, 0.6)' : 'rgba(240, 253, 250, 0.8)',
                  color: isDark ? '#FAF2F5' : '#1A312C',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(102, 205, 170, 0.3)' : 'rgba(137, 215, 183, 0.5)'
                  }
                }}
              >
                <MenuItem value="last_visit_desc">🕒 Last Visit (Newest First)</MenuItem>
                <MenuItem value="last_visit_asc">🕒 Last Visit (Oldest First)</MenuItem>
                <MenuItem value="name_asc">🔤 Name (A → Z)</MenuItem>
                <MenuItem value="name_desc">🔤 Name (Z → A)</MenuItem>
                <MenuItem value="date_desc">📅 Registration (Newest First)</MenuItem>
                <MenuItem value="date_asc">📅 Registration (Oldest First)</MenuItem>
                <MenuItem value="age_desc">🎂 Age (Oldest First)</MenuItem>
                <MenuItem value="age_asc">🎂 Age (Youngest First)</MenuItem>
                <MenuItem value="rx_desc">💊 Prescriptions (Most First)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Counter & Reset Filters */}
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', justifyContent: { xs: 'space-between', md: 'flex-end' }, alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${filteredAndSortedPatients.length} of ${patients.length} patients`}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(102, 205, 170, 0.2)' : 'rgba(66, 132, 117, 0.12)',
                color: isDark ? '#66CDAA' : '#1A312C',
                fontWeight: 700,
                fontSize: '0.72rem',
                borderRadius: '8px',
                height: 26
              }}
            />
            {hasActiveFilters && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<ClearIcon sx={{ fontSize: 13 }} />}
                onClick={handleResetFilters}
                sx={{
                  borderRadius: '10px',
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                  color: isDark ? '#FAF2F5' : '#1A312C',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.72rem',
                  py: 0.3,
                  px: 1
                }}
              >
                Reset
              </Button>
            )}
          </Grid>
        </Grid>

        {/* Row 2: Filter Pills (Gender, Age Groups, Rx Status) with Mobile-Optimized Horizontal Scroll */}
        <Box
          sx={{
            mt: 1.5,
            pt: 1.5,
            borderTop: isDark ? '1px solid rgba(102, 205, 170, 0.15)' : '1px solid rgba(137, 215, 183, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          {/* Gender row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', py: 0.2, '&::-webkit-scrollbar': { display: 'none' } }}>
            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.66rem', flexShrink: 0, minWidth: 50 }}>
              Gender:
            </Typography>
            {[
              { key: 'all', label: 'All' },
              { key: 'male', label: '👨 Male' },
              { key: 'female', label: '👩 Female' },
              { key: 'other', label: '⚧ Other' }
            ].map((g) => (
              <Chip
                key={g.key}
                label={g.label}
                size="small"
                onClick={() => setGenderFilter(g.key as any)}
                variant={genderFilter === g.key ? 'filled' : 'outlined'}
                sx={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 26,
                  cursor: 'pointer',
                  flexShrink: 0,
                  bgcolor: genderFilter === g.key ? (isDark ? '#66CDAA' : '#1A312C') : 'transparent',
                  color: genderFilter === g.key ? (isDark ? '#123029' : '#89D7B7') : (isDark ? '#FAF2F5' : '#1A312C'),
                  borderColor: genderFilter === g.key ? 'transparent' : (isDark ? 'rgba(102, 205, 170, 0.3)' : 'rgba(137, 215, 183, 0.4)')
                }}
              />
            ))}
          </Box>

          {/* Age row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', py: 0.2, '&::-webkit-scrollbar': { display: 'none' } }}>
            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.66rem', flexShrink: 0, minWidth: 50 }}>
              Age:
            </Typography>
            {[
              { key: 'all', label: 'All Ages' },
              { key: 'kids', label: '👶 0-12' },
              { key: 'teens', label: '🧒 13-19' },
              { key: 'adults', label: '🧑 20-39' },
              { key: 'middle', label: '🧔 40-59' },
              { key: 'seniors', label: '👴 60+' }
            ].map((a) => (
              <Chip
                key={a.key}
                label={a.label}
                size="small"
                onClick={() => setAgeGroupFilter(a.key as any)}
                variant={ageGroupFilter === a.key ? 'filled' : 'outlined'}
                sx={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 26,
                  cursor: 'pointer',
                  flexShrink: 0,
                  bgcolor: ageGroupFilter === a.key ? (isDark ? '#66CDAA' : '#1A312C') : 'transparent',
                  color: ageGroupFilter === a.key ? (isDark ? '#123029' : '#89D7B7') : (isDark ? '#FAF2F5' : '#1A312C'),
                  borderColor: ageGroupFilter === a.key ? 'transparent' : (isDark ? 'rgba(102, 205, 170, 0.3)' : 'rgba(137, 215, 183, 0.4)')
                }}
              />
            ))}
          </Box>

          {/* Status row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', py: 0.2, '&::-webkit-scrollbar': { display: 'none' } }}>
            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.66rem', flexShrink: 0, minWidth: 50 }}>
              Status:
            </Typography>
            {[
              { key: 'all', label: 'All' },
              { key: 'active_rx', label: '🟢 Active Rx' },
              { key: 'has_rx', label: '📋 Has Rx' },
              { key: 'no_rx', label: '⚪ No Rx' }
            ].map((s) => (
              <Chip
                key={s.key}
                label={s.label}
                size="small"
                onClick={() => setStatusFilter(s.key as any)}
                variant={statusFilter === s.key ? 'filled' : 'outlined'}
                sx={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 26,
                  cursor: 'pointer',
                  flexShrink: 0,
                  bgcolor: statusFilter === s.key ? (isDark ? '#66CDAA' : '#1A312C') : 'transparent',
                  color: statusFilter === s.key ? (isDark ? '#123029' : '#89D7B7') : (isDark ? '#FAF2F5' : '#1A312C'),
                  borderColor: statusFilter === s.key ? 'transparent' : (isDark ? 'rgba(102, 205, 170, 0.3)' : 'rgba(137, 215, 183, 0.4)')
                }}
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {filteredAndSortedPatients.length === 0 ? (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: '18px', bgcolor: isDark ? 'rgba(20, 38, 34, 0.9)' : '#fff' }}>
          <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 1.5 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: isDark ? '#FAF2F5' : '#1A312C' }}>
            {patients.length === 0 ? 'No patients yet' : 'No patients matching your filters'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8rem' }}>
            {patients.length === 0
              ? 'Patients will appear here after they are linked or you create prescriptions for them.'
              : 'Try clearing search terms or resetting filters to view all patients.'}
          </Typography>
          {hasActiveFilters && (
            <Button
              variant="contained"
              size="small"
              onClick={handleResetFilters}
              sx={{ borderRadius: '10px', bgcolor: '#1A312C', color: '#89D7B7', fontWeight: 700, textTransform: 'none' }}
            >
              Clear All Filters
            </Button>
          )}
        </Paper>
      ) : isDesktop ? (
        /* 💻 Desktop Widescreen Modern List Layout (6 Patients Per Page) */
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: '20px', 
            overflow: 'hidden', 
            border: isDark ? '1px solid rgba(102, 205, 170, 0.3)' : '1px solid rgba(137, 215, 183, 0.4)', 
            bgcolor: isDark ? 'rgba(20, 38, 34, 0.94)' : 'rgba(255, 255, 255, 0.95)',
            color: isDark ? '#FAF2F5' : '#1A312C'
          }}
        >
          <List disablePadding>
            {paginatedPatients.map((patient, idx) => (
              <React.Fragment key={patient.id}>
                {idx > 0 && <Divider sx={{ borderColor: isDark ? 'rgba(102, 205, 170, 0.15)' : 'rgba(137, 215, 183, 0.2)' }} />}
                <ListItem
                  button
                  onClick={() => handleViewMedicalDetails(patient)}
                  sx={{
                    py: 2,
                    px: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: isDark ? 'rgba(102, 205, 170, 0.15)' : 'rgba(255, 244, 225, 0.7)' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 3 }}>
                    {/* Column 1: Patient Name, Email, Gender & Age */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '32%' }}>
                      <Avatar sx={{ bgcolor: isDark ? 'rgba(102, 205, 170, 0.25)' : '#1A312C', color: isDark ? '#66CDAA' : '#89D7B7', width: 44, height: 44, fontWeight: 800 }}>
                        {patient.firstName ? patient.firstName[0].toUpperCase() : 'P'}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#1A312C' }} noWrap>
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b', fontWeight: 600 }} noWrap display="block">
                          {patient.email}
                        </Typography>
                        {getPatientBio(patient) && (
                          <Typography variant="caption" sx={{ color: isDark ? '#66CDAA' : '#428475', fontWeight: 700, fontSize: '0.7rem' }} noWrap display="block">
                            {getPatientBio(patient)}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Column 2: Latest Treatment / Diagnosis */}
                    <Box sx={{ width: '30%' }}>
                      <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', mb: 0.3 }}>
                        Latest Treatment / Diagnosis
                      </Typography>
                      <Chip
                        label={patient.latestPrescription?.diagnosis || patient.latestPrescription?.provisionalDiagnosis?.[0] || (patient.latestPrescription?.medications && patient.latestPrescription.medications[0]?.name) || patient.latestPrescription?.medication || (patient.diagnoses && patient.diagnoses[0]) || 'General Checkup'}
                        size="small"
                        sx={{ bgcolor: isDark ? 'rgba(102, 205, 170, 0.2)' : 'rgba(66, 132, 117, 0.12)', color: isDark ? '#66CDAA' : '#428475', fontWeight: 800 }}
                      />
                    </Box>

                    {/* Column 3: Patient Since / First Visit */}
                    <Box sx={{ width: '22%' }}>
                      <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', mb: 0.3 }}>
                        {patient.lastVisit ? 'Last Visit' : 'Patient Since'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#FAF2F5' : '#1A312C' }}>
                        {patient.lastVisit 
                          ? new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : (patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 1, 2026')}
                      </Typography>
                      {patient.totalPrescriptions !== undefined && patient.totalPrescriptions > 0 && (
                        <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>
                          {patient.totalPrescriptions} {patient.totalPrescriptions === 1 ? 'Prescription' : 'Prescriptions'}
                        </Typography>
                      )}
                    </Box>

                    {/* Column 4: Action */}
                    <Box sx={{ width: '22%', textAlign: 'right', display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                        onClick={(e) => handleOpenEditProfile(e, patient)}
                        sx={{
                          borderRadius: '12px',
                          fontWeight: 800,
                          borderColor: isDark ? 'rgba(102, 205, 170, 0.4)' : 'rgba(26, 49, 44, 0.3)',
                          color: isDark ? '#66CDAA' : '#1A312C',
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          px: 1.2
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewMedicalDetails(patient);
                        }}
                        sx={{ borderRadius: '12px', fontWeight: 800, borderColor: isDark ? '#66CDAA' : '#1A312C', color: isDark ? '#66CDAA' : '#1A312C', textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        Details
                      </Button>
                    </Box>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        /* 📱 Mobile Compact Cards Mode (6 Patients Per Page) */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, width: '100%' }}>
          {paginatedPatients.map((patient) => (
            <Card
              key={patient.id}
              onClick={() => handleViewMedicalDetails(patient)}
              className="touch-active"
              sx={{
                p: { xs: 1.5, sm: 1.8 },
                borderRadius: { xs: '14px', sm: '18px' },
                bgcolor: isDark ? 'rgba(20, 38, 34, 0.94)' : 'rgba(255, 255, 255, 0.95)',
                border: isDark ? '1px solid rgba(102, 205, 170, 0.25)' : '1px solid rgba(137, 215, 183, 0.4)',
                boxShadow: isDark ? '0 3px 12px rgba(0, 0, 0, 0.2)' : '0 3px 12px rgba(26, 49, 44, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                boxSizing: 'border-box',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(102, 205, 170, 0.15)' : 'rgba(255, 244, 225, 0.95)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {/* Left Info Block */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flex: 1, minWidth: 0, mr: 1 }}>
                <Avatar sx={{ bgcolor: isDark ? 'rgba(102, 205, 170, 0.2)' : 'rgba(66, 132, 117, 0.12)', color: isDark ? '#66CDAA' : '#428475', width: 38, height: 38, fontWeight: 700, fontSize: '0.88rem', flexShrink: 0 }}>
                  {patient.firstName ? patient.firstName[0].toUpperCase() : <PersonIcon sx={{ fontSize: 18 }} />}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#FAF2F5' : '#1A312C', lineHeight: 1.2, fontSize: '0.92rem' }} noWrap>
                    {patient.firstName} {patient.lastName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? '#66CDAA' : '#428475', fontWeight: 600, display: 'block', mt: 0.2, fontSize: '0.72rem' }} noWrap>
                    🩺 {patient.latestPrescription?.diagnosis || patient.latestPrescription?.provisionalDiagnosis?.[0] || (patient.latestPrescription?.medications && patient.latestPrescription.medications[0]?.name) || patient.latestPrescription?.medication || (patient.diagnoses && patient.diagnoses[0]) || 'General Checkup'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b', fontWeight: 500, fontSize: '0.68rem', display: 'block', mt: 0.15 }} noWrap>
                    {getPatientBio(patient) ? `${getPatientBio(patient)} • ` : ''}
                    {patient.lastVisit ? `Last Visit: ${new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : `Since: ${patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '2026'}`}
                  </Typography>
                </Box>
              </Box>
              
              {/* Right Action Block */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                <Tooltip title="Edit Profile">
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenEditProfile(e, patient)}
                    sx={{
                      color: isDark ? '#66CDAA' : '#1A312C',
                      bgcolor: isDark ? 'rgba(102, 205, 170, 0.12)' : 'rgba(26, 49, 44, 0.08)',
                      p: 0.5,
                      borderRadius: '8px',
                      '&:hover': { bgcolor: isDark ? 'rgba(102, 205, 170, 0.25)' : 'rgba(26, 49, 44, 0.15)' }
                    }}
                  >
                    <EditIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
                <Chip 
                  label="Details" 
                  size="small" 
                  sx={{ bgcolor: isDark ? '#66CDAA' : '#1A312C', color: isDark ? '#123029' : '#89D7B7', fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer', height: 22, borderRadius: '6px' }} 
                />
                <ChevronRightIcon sx={{ color: isDark ? '#66CDAA' : '#428475', fontSize: 18 }} />
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* 📄 Pagination Controls (6 Patients Per Page) */}
      {filteredAndSortedPatients.length > PAGE_SIZE && (
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2,
            borderRadius: '18px',
            border: isDark ? '1px solid rgba(102, 205, 170, 0.25)' : '1px solid rgba(137, 215, 183, 0.4)',
            bgcolor: isDark ? 'rgba(20, 38, 34, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b' }}>
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredAndSortedPatients.length)}–{Math.min(page * PAGE_SIZE, filteredAndSortedPatients.length)} of {filteredAndSortedPatients.length} patients
            {filteredAndSortedPatients.length !== patients.length ? ` (filtered from ${patients.length})` : ''}
          </Typography>

          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => {
              setPage(val);
            }}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 800,
                borderRadius: '10px',
                color: isDark ? '#FAF2F5' : '#1A312C',
                '&.Mui-selected': {
                  bgcolor: isDark ? '#66CDAA' : '#1A312C',
                  color: isDark ? '#123029' : '#89D7B7',
                  '&:hover': {
                    bgcolor: isDark ? '#89D7B7' : '#2C4F47'
                  }
                }
              }
            }}
          />
        </Paper>
      )}

      {/* Medical Details Dialog */}
      <Dialog 
        open={medicalDetailsOpen} 
        onClose={() => setMedicalDetailsOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: '20px', sm: '28px' },
            bgcolor: isDark ? '#0e1f1c' : '#ffffff',
            backgroundImage: 'none',
            overflow: 'hidden',
            border: isDark ? '1px solid rgba(137, 215, 183, 0.2)' : '1px solid rgba(19, 79, 77, 0.1)',
            boxShadow: isDark 
              ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(137, 215, 183, 0.08)' 
              : '0 25px 60px -15px rgba(19, 79, 77, 0.2), 0 10px 30px rgba(19, 79, 77, 0.06)'
          }
        }}
      >
        {/* Patient Profile Header Banner */}
        <Box 
          sx={{ 
            p: { xs: 2.5, sm: 3 },
            pb: 1.5,
            background: isDark 
              ? 'linear-gradient(135deg, rgba(19, 79, 77, 0.4) 0%, rgba(14, 31, 28, 0.95) 100%)' 
              : 'linear-gradient(135deg, rgba(137, 215, 183, 0.22) 0%, rgba(248, 250, 252, 0.9) 100%)',
            borderBottom: isDark ? '1px solid rgba(137, 215, 183, 0.15)' : '1px solid rgba(19, 79, 77, 0.08)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: { xs: 52, sm: 60 },
                  height: { xs: 52, sm: 60 },
                  fontWeight: 900,
                  fontSize: { xs: '1.2rem', sm: '1.4rem' },
                  bgcolor: isDark ? '#89D7B7' : '#134F4D',
                  color: isDark ? '#0e1f1c' : '#ffffff',
                  boxShadow: isDark ? '0 4px 14px rgba(137, 215, 183, 0.3)' : '0 4px 14px rgba(19, 79, 77, 0.25)',
                  border: isDark ? '2px solid rgba(137, 215, 183, 0.5)' : '2px solid #ffffff'
                }}
              >
                {selectedPatient?.firstName?.[0] || 'P'}{selectedPatient?.lastName?.[0] || ''}
              </Avatar>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#FAF2F5' : '#0f172a', letterSpacing: '-0.02em' }}>
                    {selectedPatient?.firstName} {selectedPatient?.lastName}
                  </Typography>
                  {selectedPatient?.id && (
                    <Chip
                      label={`#${String(selectedPatient.id).substring(0, 6).toUpperCase()}`}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        height: 22,
                        bgcolor: isDark ? 'rgba(137, 215, 183, 0.12)' : 'rgba(19, 79, 77, 0.08)',
                        color: isDark ? '#89D7B7' : '#134F4D',
                        borderRadius: '6px'
                      }}
                    />
                  )}
                  {(medicalDetails?.bloodType || selectedPatient?.bloodType) && (
                    <Chip
                      icon={<BloodIcon sx={{ fontSize: '13px !important', color: isDark ? '#ff7b7b' : '#dc2626' }} />}
                      label={medicalDetails?.bloodType || selectedPatient?.bloodType}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        height: 22,
                        bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                        color: isDark ? '#ff9b9b' : '#dc2626',
                        borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                        borderRadius: '6px'
                      }}
                    />
                  )}
                </Box>

                {/* Patient Bio & Details row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', mt: 0.6 }}>
                  {selectedPatient && getPatientBio(selectedPatient) && (
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#89D7B7' : '#134F4D', fontSize: '0.82rem' }}>
                      {getPatientBio(selectedPatient)}
                    </Typography>
                  )}
                  {selectedPatient?.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: isDark ? '#94a3b8' : '#64748b' }}>
                      <EmailIcon sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{selectedPatient.email}</Typography>
                    </Box>
                  )}
                  {(selectedPatient?.contactNumber || (selectedPatient as any)?.phone) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: isDark ? '#94a3b8' : '#64748b' }}>
                      <PhoneIcon sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{selectedPatient?.contactNumber || (selectedPatient as any)?.phone}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Top Action Group */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                onClick={(e) => handleOpenEditProfile(e, selectedPatient)}
                sx={{
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  borderColor: isDark ? 'rgba(137, 215, 183, 0.4)' : 'rgba(19, 79, 77, 0.3)',
                  color: isDark ? '#89D7B7' : '#134F4D',
                  bgcolor: isDark ? 'rgba(137, 215, 183, 0.08)' : 'rgba(19, 79, 77, 0.04)',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(137, 215, 183, 0.16)' : 'rgba(19, 79, 77, 0.08)',
                    borderColor: isDark ? '#89D7B7' : '#134F4D'
                  }
                }}
              >
                Edit Profile
              </Button>
              <Tooltip title="Close">
                <IconButton 
                  onClick={() => setMedicalDetailsOpen(false)}
                  sx={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444'
                    }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Navigation Tabs */}
          <Box sx={{ mt: 2.5 }}>
            <Tabs 
              value={tabValue} 
              onChange={(_, value) => setTabValue(value)}
              sx={{
                minHeight: 42,
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  bgcolor: isDark ? '#89D7B7' : '#134F4D'
                },
                '& .MuiTab-root': {
                  minHeight: 42,
                  py: 1,
                  px: { xs: 1.5, sm: 2.5 },
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  color: isDark ? '#94a3b8' : '#64748b',
                  '&.Mui-selected': {
                    color: isDark ? '#89D7B7' : '#134F4D'
                  }
                }
              }}
            >
              <Tab 
                icon={<AssignmentIcon sx={{ fontSize: 18 }} />} 
                iconPosition="start" 
                label="Clinical Overview" 
              />
              <Tab 
                icon={<HistoryIcon sx={{ fontSize: 18 }} />} 
                iconPosition="start" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <span>Prescription History</span>
                    {medicalDetails?.prescriptionHistory && medicalDetails.prescriptionHistory.length > 0 && (
                      <Chip 
                        label={medicalDetails.prescriptionHistory.length} 
                        size="small" 
                        sx={{ 
                          height: 18, 
                          fontSize: '0.68rem', 
                          fontWeight: 800, 
                          bgcolor: tabValue === 1 ? (isDark ? '#89D7B7' : '#134F4D') : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'), 
                          color: tabValue === 1 ? (isDark ? '#0e1f1c' : '#ffffff') : 'inherit' 
                        }} 
                      />
                    )}
                  </Box>
                } 
              />
              <Tab 
                icon={<HealthAndSafetyIcon sx={{ fontSize: 18 }} />} 
                iconPosition="start" 
                label="Medical & Emergency Info" 
              />
            </Tabs>
          </Box>
        </Box>

        {/* Content Body */}
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: isDark ? '#0e1f1c' : '#f8fafc' }}>
          {medicalDetailsLoading ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} gap={2}>
              <CircularProgress size={40} sx={{ color: isDark ? '#89D7B7' : '#134F4D' }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#89D7B7' : '#134F4D' }}>
                Loading patient clinical details...
              </Typography>
            </Box>
          ) : medicalDetails && (
            <Box>
              {/* TAB 0: CLINICAL OVERVIEW */}
              {tabValue === 0 && (
                <Box>
                  {/* Top 4 KPI Summary Cards */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: '18px',
                          bgcolor: isDark ? 'rgba(20, 38, 34, 0.7)' : '#ffffff',
                          border: isDark ? '1px solid rgba(137, 215, 183, 0.18)' : '1px solid rgba(19, 79, 77, 0.1)',
                          boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(19, 79, 77, 0.08)',
                            color: isDark ? '#89D7B7' : '#134F4D'
                          }}
                        >
                          <AssignmentIcon />
                        </Box>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                            {medicalDetails.totalPrescriptions ?? (medicalDetails.prescriptionHistory?.length || 0)}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>
                            Total Prescriptions
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: '18px',
                          bgcolor: isDark ? 'rgba(20, 38, 34, 0.7)' : '#ffffff',
                          border: isDark ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.2)',
                          boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981'
                          }}
                        >
                          <PharmacyIcon />
                        </Box>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1, color: '#10b981' }}>
                            {medicalDetails.activePrescriptions ?? (medicalDetails.prescriptionHistory?.filter((p: any) => p.status === 'active')?.length || 0)}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>
                            Active Courses
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: '18px',
                          bgcolor: isDark ? 'rgba(20, 38, 34, 0.7)' : '#ffffff',
                          border: isDark ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid rgba(99, 102, 241, 0.15)',
                          boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                            color: isDark ? '#a5b4fc' : '#4f46e5'
                          }}
                        >
                          <DoneIcon />
                        </Box>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1, color: isDark ? '#a5b4fc' : '#4f46e5' }}>
                            {medicalDetails.completedPrescriptions ?? (medicalDetails.prescriptionHistory?.filter((p: any) => p.status === 'completed')?.length || 0)}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>
                            Completed
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: '18px',
                          bgcolor: isDark ? 'rgba(20, 38, 34, 0.7)' : '#ffffff',
                          border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(245, 158, 11, 0.2)',
                          boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5
                        }}
                      >
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                            color: isDark ? '#fbbf24' : '#d97706'
                          }}
                        >
                          <TodayIcon />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography noWrap variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.1, color: isDark ? '#fbbf24' : '#d97706' }}>
                            {medicalDetails.lastVisit ? new Date(medicalDetails.lastVisit).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'None'}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', display: 'block' }}>
                            Last Visit
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* 2 Column Main Detail Grid */}
                  <Grid container spacing={2.5}>
                    {/* Left: Clinical Summary & Medication Profile */}
                    <Grid item xs={12} md={7}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: '20px',
                          bgcolor: isDark ? 'rgba(20, 38, 34, 0.7)' : '#ffffff',
                          border: isDark ? '1px solid rgba(137, 215, 183, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)',
                          boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(0,0,0,0.04)',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(19, 79, 77, 0.08)', color: isDark ? '#89D7B7' : '#134F4D' }}>
                              <MedicalServicesIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                              Treatment & Diagnostic Profile
                            </Typography>
                          </Box>
                          {medicalDetails.prescriptionHistory && medicalDetails.prescriptionHistory.length > 0 && (
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => setTabValue(1)}
                              sx={{ fontWeight: 800, fontSize: '0.75rem', color: isDark ? '#89D7B7' : '#134F4D', textTransform: 'none' }}
                            >
                              View History ({medicalDetails.prescriptionHistory.length}) →
                            </Button>
                          )}
                        </Box>

                        {/* Diagnoses / Clinical Indications */}
                        <Box sx={{ mb: 2.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#89D7B7' : '#64748b', display: 'block', mb: 1 }}>
                            🩺 Clinical Diagnoses Recorded
                          </Typography>
                          {medicalDetails.diagnoses && medicalDetails.diagnoses.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                              {medicalDetails.diagnoses.map((d: string, idx: number) => (
                                <Chip
                                  key={`diag-${idx}`}
                                  label={d}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    bgcolor: isDark ? 'rgba(137, 215, 183, 0.12)' : 'rgba(19, 79, 77, 0.08)',
                                    color: isDark ? '#89D7B7' : '#134F4D',
                                    border: isDark ? '1px solid rgba(137, 215, 183, 0.25)' : '1px solid rgba(19, 79, 77, 0.15)',
                                    borderRadius: '8px'
                                  }}
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                              No specific diagnoses tagged in recent prescriptions.
                            </Typography>
                          )}
                        </Box>

                        <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

                        {/* Medications Prescribed */}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#89D7B7' : '#64748b', display: 'block', mb: 1 }}>
                            💊 Frequently Prescribed Medications
                          </Typography>
                          {medicalDetails.medicationFrequency && medicalDetails.medicationFrequency.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {medicalDetails.medicationFrequency.map((med: any, idx: number) => (
                                <Box
                                  key={`med-freq-${idx}`}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 1.5,
                                    py: 0.8,
                                    borderRadius: '10px',
                                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0'
                                  }}
                                >
                                  <MedicationIcon sx={{ fontSize: 16, color: isDark ? '#89D7B7' : '#134F4D' }} />
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a', textTransform: 'capitalize', fontSize: '0.82rem' }}>
                                    {med.name}
                                  </Typography>
                                  {med.count > 1 && (
                                    <Chip
                                      label={`${med.count}x`}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        bgcolor: isDark ? 'rgba(137, 215, 183, 0.2)' : 'rgba(19, 79, 77, 0.12)',
                                        color: isDark ? '#89D7B7' : '#134F4D'
                                      }}
                                    />
                                  )}
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                              No medications recorded in prescription logs.
                            </Typography>
                          )}
                        </Box>

                        {/* Consultation timeline footer inside card */}
                        {(medicalDetails.firstVisit || medicalDetails.lastVisit) && (
                          <Box sx={{ mt: 2.5, pt: 1.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            {medicalDetails.firstVisit && (
                              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                                First visit: <strong>{new Date(medicalDetails.firstVisit).toLocaleDateString()}</strong>
                              </Typography>
                            )}
                            {medicalDetails.lastVisit && (
                              <Typography variant="caption" sx={{ color: isDark ? '#89D7B7' : '#134F4D', fontWeight: 700 }}>
                                Last active: <strong>{new Date(medicalDetails.lastVisit).toLocaleDateString()}</strong>
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Paper>
                    </Grid>

                    {/* Right: Medical Alerts & Critical Health Profile */}
                    <Grid item xs={12} md={5}>
                      <Stack spacing={2.5}>
                        {/* Allergies / Medical Alerts Card */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: '20px',
                            bgcolor: isDark ? 'rgba(20, 38, 34, 0.7)' : '#ffffff',
                            border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(245, 158, 11, 0.25)',
                            boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(0,0,0,0.04)'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                <WarningIcon sx={{ fontSize: 20 }} />
                              </Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                                Medical Alerts & Allergies
                              </Typography>
                            </Box>
                          </Box>

                          {medicalDetails.allergies && medicalDetails.allergies.length > 0 ? (
                            <Box>
                              <Alert severity="warning" sx={{ mb: 1.5, borderRadius: '12px', fontWeight: 700, fontSize: '0.8rem', py: 0.5 }}>
                                Patient has recorded drug / food sensitivities!
                              </Alert>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                {medicalDetails.allergies.map((allergy: string, index: number) => (
                                  <Chip
                                    key={`allergy-view-${allergy}-${index}`}
                                    label={allergy}
                                    color="warning"
                                    size="small"
                                    sx={{ fontWeight: 800, borderRadius: '8px' }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: '14px',
                                bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)',
                                border: isDark ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(16, 185, 129, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5
                              }}
                            >
                              <Box sx={{ p: 1, borderRadius: '50%', bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex' }}>
                                <ShieldIcon sx={{ fontSize: 22 }} />
                              </Box>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#10b981', lineHeight: 1.2 }}>
                                  No Known Allergies (NKDA)
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                                  No adverse drug or environmental reactions recorded.
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Paper>

                        {/* Emergency & Health Info Card */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: '20px',
                            bgcolor: isDark ? 'rgba(20, 38, 34, 0.7)' : '#ffffff',
                            border: isDark ? '1px solid rgba(137, 215, 183, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)',
                            boxShadow: isDark ? 'none' : '0 4px 20px -2px rgba(0,0,0,0.04)'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
                                <EmergencyIcon sx={{ fontSize: 20 }} />
                              </Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                                Emergency & Health Info
                              </Typography>
                            </Box>
                          </Box>

                          <Stack spacing={1.5}>
                            {/* Blood Group */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.2, borderRadius: '10px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>
                                Blood Group:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                                {medicalDetails.bloodType || selectedPatient?.bloodType || 'Not specified'}
                              </Typography>
                            </Box>

                            {/* Emergency Contact */}
                            <Box sx={{ p: 1.2, borderRadius: '10px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#89D7B7' : '#134F4D', display: 'block', mb: 0.5 }}>
                                Emergency Contact:
                              </Typography>
                              {medicalDetails.emergencyContact && (medicalDetails.emergencyContact.name || medicalDetails.emergencyContact.phone) ? (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                                      {medicalDetails.emergencyContact.name || 'Contact Person'}
                                    </Typography>
                                    {medicalDetails.emergencyContact.relationship && (
                                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                                        Relationship: {medicalDetails.emergencyContact.relationship}
                                      </Typography>
                                    )}
                                  </Box>
                                  {medicalDetails.emergencyContact.phone && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<CallIcon sx={{ fontSize: 13 }} />}
                                      href={`tel:${medicalDetails.emergencyContact.phone}`}
                                      sx={{
                                        fontWeight: 800,
                                        fontSize: '0.72rem',
                                        borderRadius: '8px',
                                        borderColor: isDark ? '#89D7B7' : '#134F4D',
                                        color: isDark ? '#89D7B7' : '#134F4D',
                                        textTransform: 'none',
                                        py: 0.3
                                      }}
                                    >
                                      {medicalDetails.emergencyContact.phone}
                                    </Button>
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#94a3b8', fontStyle: 'italic' }}>
                                  No emergency contact registered yet.
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </Paper>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* TAB 1: PRESCRIPTION HISTORY */}
              {tabValue === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(19, 79, 77, 0.08)', color: isDark ? '#89D7B7' : '#134F4D' }}>
                        <HistoryIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                        Prescription History
                      </Typography>
                    </Box>
                    {medicalDetails.prescriptionHistory && medicalDetails.prescriptionHistory.length > 0 && (
                      <Chip 
                        label={`${medicalDetails.prescriptionHistory.length} Total Records`} 
                        size="small" 
                        sx={{ fontWeight: 800, bgcolor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(19, 79, 77, 0.08)', color: isDark ? '#89D7B7' : '#134F4D' }} 
                      />
                    )}
                  </Box>

                  {medicalDetails.prescriptionHistory && medicalDetails.prescriptionHistory.length > 0 ? (
                    medicalDetails.prescriptionHistory.map((prescription: any) => {
                      const rxId = prescription.id || prescription._id || '';
                      const rxTitle = prescription.diagnosis || (prescription.medications && prescription.medications[0]?.name) || prescription.medication || 'Prescription Document';
                      const formattedDate = formatDateTime ? formatDateTime(prescription.createdAt) : new Date(prescription.createdAt || Date.now()).toLocaleString();
                      const isDownloadingThis = downloadingPdfId === rxId;

                      return (
                        <Accordion 
                          key={rxId}
                          sx={{
                            mb: 1.5,
                            borderRadius: '16px !important',
                            overflow: 'hidden',
                            boxShadow: 'none',
                            bgcolor: isDark ? 'rgba(20, 38, 34, 0.7)' : '#ffffff',
                            border: isDark ? '1px solid rgba(137, 215, 183, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)',
                            '&:before': { display: 'none' }
                          }}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: isDark ? '#89D7B7' : '#134F4D' }} />}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, width: '100%', gap: 1, pr: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                                  {rxTitle}
                                </Typography>
                                {rxId && (
                                  <Chip 
                                    label={`#${rxId.substring(0, 6).toUpperCase()}`} 
                                    size="small" 
                                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }} 
                                  />
                                )}
                                <Chip 
                                  label={(prescription.status || 'active').toUpperCase()} 
                                  color={prescription.status === 'completed' ? 'success' : prescription.status === 'cancelled' ? 'error' : 'primary'}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                                />
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                                <Typography variant="caption" sx={{ color: isDark ? '#89D7B7' : '#64748b', fontWeight: 600 }}>
                                  {formattedDate}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="View Prescription">
                                    <IconButton size="small" onClick={(e) => handleViewPrescription(e, rxId)} sx={{ color: isDark ? '#89D7B7' : '#134F4D' }}>
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Change Issued Date">
                                    <IconButton size="small" onClick={(e) => handleOpenDateModal(e, prescription)} sx={{ color: isDark ? '#89D7B7' : '#134F4D' }}>
                                      <EditCalendarIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Download PDF">
                                    <IconButton size="small" onClick={(e) => handleDownloadPdf(e, rxId)} disabled={isDownloadingThis} sx={{ color: isDark ? '#89D7B7' : '#134F4D' }}>
                                      {isDownloadingThis ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon fontSize="small" />}
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Box>
                          </AccordionSummary>

                          <AccordionDetails sx={{ pt: 0, borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)' }}>
                            <Grid container spacing={2} sx={{ mt: 0.5 }}>
                              <Grid item xs={12} md={7}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#89D7B7' : '#134F4D', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  💊 Prescribed Medications
                                </Typography>

                                {prescription.medications && prescription.medications.length > 0 ? (
                                  <List dense disablePadding>
                                    {prescription.medications.map((med: any, medIndex: number) => {
                                      const parts: string[] = [];
                                      if (med.dosage && med.dosage !== 'undefined') parts.push(med.dosage);
                                      if (med.frequency && med.frequency !== 'undefined') parts.push(med.frequency);
                                      if (med.instructions && med.instructions !== 'undefined') parts.push(med.instructions);
                                      if (med.duration && med.duration !== 'undefined') parts.push(`for ${med.duration}`);
                                      const subText = parts.filter(Boolean).join(' • ');

                                      return (
                                        <ListItem 
                                          key={`${rxId}-med-${med.name || medIndex}-${medIndex}`}
                                          sx={{ 
                                            px: 1.5, 
                                            py: 0.8, 
                                            mb: 0.8, 
                                            borderRadius: '10px', 
                                            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                                            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e2e8f0' 
                                          }}
                                        >
                                          <ListItemText 
                                            primary={
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                                                  {med.name}
                                                </Typography>
                                                {med.type && (
                                                  <Chip label={med.type} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }} />
                                                )}
                                              </Box>
                                            }
                                            secondary={
                                              <Typography variant="caption" sx={{ color: isDark ? '#89D7B7' : '#475569', display: 'block', mt: 0.3, fontWeight: 600 }}>
                                                {subText || 'As directed by physician'}
                                              </Typography>
                                            }
                                          />
                                        </ListItem>
                                      );
                                    })}
                                  </List>
                                ) : (
                                  <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                                      {prescription.medication || 'Medication details recorded'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: isDark ? '#89D7B7' : '#475569', display: 'block', mt: 0.3, fontWeight: 600 }}>
                                      {[prescription.dosage, prescription.frequency, prescription.duration].filter(b => b && b !== 'undefined').join(' • ')}
                                    </Typography>
                                  </Box>
                                )}
                              </Grid>

                              <Grid item xs={12} md={5}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#89D7B7' : '#134F4D', mb: 1 }}>
                                  📝 Clinical Notes & Instructions
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#fffbeb', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(245, 158, 11, 0.3)', mb: 2 }}>
                                  <Typography variant="body2" sx={{ color: isDark ? '#FAF2F5' : '#78350f', fontSize: '0.85rem' }}>
                                    {(() => {
                                      const noteVal = prescription.notes || prescription.instructions;
                                      if (!noteVal) return 'No additional notes provided.';
                                      if (typeof noteVal === 'string' && noteVal.trim() && noteVal !== '[object Object]') return noteVal.trim();
                                      if (typeof noteVal === 'object') {
                                        const textStr = noteVal.text || noteVal.notes || noteVal.instructions || noteVal.advice || '';
                                        if (textStr && textStr !== '[object Object]') return textStr;
                                      }
                                      return 'No additional notes provided.';
                                    })()}
                                  </Typography>
                                </Paper>

                                {/* Action Buttons: View, Change Date & Download */}
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                                  <Button
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    startIcon={<VisibilityIcon />}
                                    onClick={(e) => handleViewPrescription(e, rxId)}
                                    sx={{
                                      borderRadius: '12px',
                                      fontWeight: 800,
                                      textTransform: 'none',
                                      borderColor: isDark ? '#89D7B7' : '#134F4D',
                                      color: isDark ? '#89D7B7' : '#134F4D'
                                    }}
                                  >
                                    View Prescription
                                  </Button>
                                  <Button
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    startIcon={<EditCalendarIcon />}
                                    onClick={(e) => handleOpenDateModal(e, prescription)}
                                    sx={{
                                      borderRadius: '12px',
                                      fontWeight: 800,
                                      textTransform: 'none',
                                      borderColor: isDark ? 'rgba(137, 215, 183, 0.4)' : 'rgba(19, 79, 77, 0.4)',
                                      color: isDark ? '#89D7B7' : '#134F4D',
                                      bgcolor: isDark ? 'rgba(137, 215, 183, 0.05)' : 'rgba(19, 79, 77, 0.04)',
                                      '&:hover': { bgcolor: isDark ? 'rgba(137, 215, 183, 0.12)' : 'rgba(19, 79, 77, 0.08)' }
                                    }}
                                  >
                                    Change Date
                                  </Button>
                                  <Button
                                    fullWidth
                                    variant="contained"
                                    size="small"
                                    startIcon={isDownloadingThis ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                                    onClick={(e) => handleDownloadPdf(e, rxId)}
                                    disabled={isDownloadingThis}
                                    sx={{
                                      borderRadius: '12px',
                                      fontWeight: 800,
                                      textTransform: 'none',
                                      bgcolor: isDark ? '#89D7B7' : '#134F4D',
                                      color: isDark ? '#0f1e1a' : '#ffffff',
                                      '&:hover': { bgcolor: isDark ? '#6ec7a3' : '#0e3b3a' }
                                    }}
                                  >
                                    {isDownloadingThis ? 'Downloading...' : 'Download PDF'}
                                  </Button>
                                </Stack>
                              </Grid>
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      );
                    })
                  ) : (
                    <Box sx={{ p: 5, textAlign: 'center', borderRadius: '20px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: isDark ? '1px dashed rgba(137, 215, 183, 0.2)' : '1px dashed #cbd5e1' }}>
                      <HistoryIcon sx={{ fontSize: 44, color: isDark ? '#89D7B7' : '#134F4D', mb: 1.5, opacity: 0.6 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a', mb: 0.5 }}>
                        No Prescription History Available
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        No prescriptions have been issued to this patient yet.
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PharmacyIcon />}
                        onClick={() => {
                          setMedicalDetailsOpen(false);
                          navigate(`/prescriptions/new?patientId=${selectedPatient?.id || ''}`);
                        }}
                        sx={{
                          borderRadius: '12px',
                          fontWeight: 800,
                          textTransform: 'none',
                          bgcolor: isDark ? '#89D7B7' : '#134F4D',
                          color: isDark ? '#0e1f1c' : '#ffffff'
                        }}
                      >
                        Create First Prescription
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* TAB 2: MEDICAL & EMERGENCY INFORMATION */}
              {tabValue === 2 && (
                <Grid container spacing={2.5}>
                  {/* General Medical Profile */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: '20px',
                        bgcolor: isDark ? 'rgba(20, 38, 34, 0.7)' : '#ffffff',
                        border: isDark ? '1px solid rgba(137, 215, 183, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)',
                        height: '100%'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(19, 79, 77, 0.08)', color: isDark ? '#89D7B7' : '#134F4D' }}>
                            <BloodIcon sx={{ fontSize: 20 }} />
                          </Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                            Medical & Vitals Profile
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>
                          Blood Type:
                        </Typography>
                        <Chip
                          label={medicalDetails.bloodType || selectedPatient?.bloodType || 'Not specified'}
                          size="small"
                          sx={{
                            fontWeight: 900,
                            bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                            color: isDark ? '#ff9b9b' : '#dc2626'
                          }}
                        />
                      </Box>

                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#89D7B7' : '#134F4D', mb: 1 }}>
                        Medical History:
                      </Typography>
                      {medicalDetails.medicalHistory && medicalDetails.medicalHistory.length > 0 ? (
                        <List dense disablePadding>
                          {medicalDetails.medicalHistory.map((history: string, index: number) => (
                            <ListItem 
                              key={`history-view-${history}-${index}`}
                              sx={{
                                px: 1.5,
                                py: 0.8,
                                mb: 0.8,
                                borderRadius: '10px',
                                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e2e8f0'
                              }}
                            >
                              <ListItemText 
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                                    • {history}
                                  </Typography>
                                } 
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                          No past medical history or pre-existing conditions recorded.
                        </Typography>
                      )}

                      {/* Insurance info if available */}
                      {medicalDetails.insurance && (
                        <Box sx={{ mt: 2.5, pt: 1.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#89D7B7' : '#134F4D', mb: 1 }}>
                            Insurance Details:
                          </Typography>
                          <Typography variant="body2" sx={{ color: isDark ? '#FAF2F5' : '#0f172a', fontWeight: 600 }}>
                            Provider: {medicalDetails.insurance.provider || 'Not specified'}
                          </Typography>
                          {medicalDetails.insurance.policyNumber && (
                            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block' }}>
                              Policy #: {medicalDetails.insurance.policyNumber}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Emergency Contact & Family */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: '20px',
                        bgcolor: isDark ? 'rgba(20, 38, 34, 0.7)' : '#ffffff',
                        border: isDark ? '1px solid rgba(137, 215, 183, 0.2)' : '1px solid rgba(0, 0, 0, 0.08)',
                        height: '100%'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
                            <EmergencyIcon sx={{ fontSize: 20 }} />
                          </Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                            Emergency Contact & Family
                          </Typography>
                        </Box>
                      </Box>

                      {medicalDetails.emergencyContact && (medicalDetails.emergencyContact.name || medicalDetails.emergencyContact.phone) ? (
                        <Box sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e2e8f0', mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a' }}>
                              {medicalDetails.emergencyContact.name || 'Emergency Contact'}
                            </Typography>
                            {medicalDetails.emergencyContact.relationship && (
                              <Chip 
                                label={medicalDetails.emergencyContact.relationship} 
                                size="small" 
                                sx={{ fontWeight: 800, fontSize: '0.68rem', bgcolor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(19, 79, 77, 0.08)', color: isDark ? '#89D7B7' : '#134F4D' }} 
                              />
                            )}
                          </Box>
                          {medicalDetails.emergencyContact.phone && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<CallIcon sx={{ fontSize: 14 }} />}
                              href={`tel:${medicalDetails.emergencyContact.phone}`}
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                borderRadius: '10px',
                                borderColor: isDark ? '#89D7B7' : '#134F4D',
                                color: isDark ? '#89D7B7' : '#134F4D',
                                textTransform: 'none'
                              }}
                            >
                              Call {medicalDetails.emergencyContact.phone}
                            </Button>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem', mb: 2 }}>
                          No emergency contact specified.
                        </Typography>
                      )}

                      {/* Family Profiles if linked */}
                      {medicalDetails.familyProfiles && medicalDetails.familyProfiles.length > 0 && (
                        <Box sx={{ mt: 2.5, pt: 1.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#89D7B7' : '#134F4D', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PeopleIcon sx={{ fontSize: 18 }} /> Linked Family Profiles ({medicalDetails.familyProfiles.length})
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                            {medicalDetails.familyProfiles.map((fam: any, idx: number) => (
                              <Chip
                                key={`fam-${idx}`}
                                label={`${fam.fullName || fam.name || 'Member'} (${fam.relationship || 'Family'})`}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                  color: isDark ? '#FAF2F5' : '#334155'
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>

        {/* Dialog Actions Footer */}
        <DialogActions 
          sx={{ 
            p: { xs: 2, sm: 2.5 }, 
            bgcolor: isDark ? '#0c1a18' : '#ffffff',
            borderTop: isDark ? '1px solid rgba(137, 215, 183, 0.15)' : '1px solid rgba(19, 79, 77, 0.08)',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Button
            variant="contained"
            size="small"
            startIcon={<PharmacyIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              setMedicalDetailsOpen(false);
              navigate(`/prescriptions/new?patientId=${selectedPatient?.id || ''}`);
            }}
            sx={{
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '0.82rem',
              textTransform: 'none',
              px: 2.2,
              py: 0.9,
              bgcolor: isDark ? '#89D7B7' : '#134F4D',
              color: isDark ? '#0e1f1c' : '#ffffff',
              boxShadow: isDark ? '0 4px 14px rgba(137, 215, 183, 0.3)' : '0 4px 14px rgba(19, 79, 77, 0.25)',
              '&:hover': {
                bgcolor: isDark ? '#6ec7a3' : '#0e3b3a'
              }
            }}
          >
            + Create New Prescription
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon sx={{ fontSize: 14 }} />}
              onClick={() => selectedPatient && handleEditMedicalInfo(selectedPatient)}
              sx={{
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.8rem',
                textTransform: 'none',
                borderColor: isDark ? 'rgba(137, 215, 183, 0.4)' : 'rgba(19, 79, 77, 0.3)',
                color: isDark ? '#89D7B7' : '#134F4D',
                bgcolor: isDark ? 'rgba(137, 215, 183, 0.06)' : 'rgba(19, 79, 77, 0.04)',
                '&:hover': {
                  borderColor: isDark ? '#89D7B7' : '#134F4D',
                  bgcolor: isDark ? 'rgba(137, 215, 183, 0.12)' : 'rgba(19, 79, 77, 0.08)'
                }
              }}
            >
              Edit Medical Info
            </Button>
            <Button 
              variant="contained"
              size="small"
              onClick={() => setMedicalDetailsOpen(false)} 
              sx={{ 
                borderRadius: '12px',
                fontWeight: 800, 
                fontSize: '0.8rem',
                textTransform: 'none',
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                color: isDark ? '#FAF2F5' : '#334155',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.14)' : '#e2e8f0'
                }
              }}
            >
              Close
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Edit Medical Information Dialog */}
      <Dialog 
        open={editMedicalOpen} 
        onClose={() => setEditMedicalOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDark ? '#0e1f1c' : '#ffffff',
            backgroundImage: 'none',
            border: isDark ? '1px solid rgba(137, 215, 183, 0.2)' : '1px solid rgba(19, 79, 77, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(19, 79, 77, 0.08)', color: isDark ? '#89D7B7' : '#134F4D' }}>
            <EditIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#0f172a' }}>
              Edit Medical Information
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#89D7B7' : '#64748b', fontWeight: 600 }}>
              {selectedPatient?.firstName} {selectedPatient?.lastName}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#89D7B7' : '#134F4D', mb: 1 }}>
                Allergies & Adverse Reactions:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                {medicalFormData.allergies.map((allergy, index) => (
                  <Chip
                    key={`form-allergy-${allergy}-${index}`}
                    label={allergy}
                    color="warning"
                    onDelete={() => handleRemoveAllergy(index)}
                    sx={{ fontWeight: 700 }}
                  />
                ))}
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  onClick={handleAddAllergy}
                  sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Add Allergy
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#89D7B7' : '#134F4D', mb: 1 }}>
                Medical History & Pre-existing Conditions:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                {medicalFormData.medicalHistory.map((history, index) => (
                  <Chip
                    key={`form-history-${history}-${index}`}
                    label={history}
                    onDelete={() => handleRemoveMedicalHistory(index)}
                    sx={{ fontWeight: 700 }}
                  />
                ))}
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  onClick={handleAddMedicalHistory}
                  sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Add Condition / History
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Blood Type (e.g. O+, A+, B-)"
                value={medicalFormData.bloodType}
                onChange={(e) => setMedicalFormData(prev => ({ ...prev, bloodType: e.target.value }))}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#89D7B7' : '#134F4D', mb: 1 }}>
                Emergency Contact Details:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Contact Name"
                value={medicalFormData.emergencyContact.name}
                onChange={(e) => setMedicalFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                }))}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Contact Phone"
                value={medicalFormData.emergencyContact.phone}
                onChange={(e) => setMedicalFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                }))}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Relationship (e.g. Spouse, Parent)"
                value={medicalFormData.emergencyContact.relationship}
                onChange={(e) => setMedicalFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                }))}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setEditMedicalOpen(false)} sx={{ fontWeight: 700, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveMedicalInfo} 
            variant="contained"
            sx={{
              borderRadius: '12px',
              fontWeight: 800,
              textTransform: 'none',
              bgcolor: isDark ? '#89D7B7' : '#134F4D',
              color: isDark ? '#0e1f1c' : '#ffffff',
              '&:hover': {
                bgcolor: isDark ? '#6ec7a3' : '#0e3b3a'
              }
            }}
          >
            Save Medical Information
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Prescription Issued Date Modal from History */}
      <Dialog
        open={rxDateModalOpen}
        onClose={() => !rxDateSaving && setRxDateModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ p: 1, borderRadius: '12px', bgcolor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(19, 79, 77, 0.1)', color: isDark ? '#89D7B7' : '#134F4D' }}>
              <EditCalendarIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#134F4D', lineHeight: 1.2 }}>
                Change Prescription Issued Date
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedRxForDateChange?.diagnosis || selectedRxForDateChange?.medications?.[0]?.name || 'Prescription'} • #{selectedRxForDateChange?.id?.substring(0, 6)?.toUpperCase()}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setRxDateModalOpen(false)} disabled={rxDateSaving} size="small">
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: '14px', fontSize: '0.8rem', bgcolor: isDark ? 'rgba(137, 215, 183, 0.08)' : 'rgba(19, 79, 77, 0.06)', color: isDark ? '#89D7B7' : '#134F4D' }}>
            Updating the issued date will modify the consultation timestamp, sorting position, and all downloaded PDF documents.
          </Alert>

          {rxDateError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
              {rxDateError}
            </Alert>
          )}

          {rxDateSuccess && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#047857' }}>
              {rxDateSuccess}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label="Now / Today"
              size="small"
              onClick={() => {
                const now = new Date();
                const pad = (n: number) => String(n).padStart(2, '0');
                setTargetRxNewDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
              }}
              clickable
              variant="outlined"
              sx={{ fontWeight: 700, borderRadius: '8px' }}
            />
            <Chip
              label="Yesterday"
              size="small"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                const pad = (n: number) => String(n).padStart(2, '0');
                setTargetRxNewDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
              }}
              clickable
              variant="outlined"
              sx={{ fontWeight: 700, borderRadius: '8px' }}
            />
          </Box>

          <TextField
            label="Prescription Issued Date & Time"
            type="datetime-local"
            value={targetRxNewDate}
            onChange={(e) => setTargetRxNewDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Set the official date & time for this prescription."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '14px',
                fontWeight: 700
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={() => setRxDateModalOpen(false)}
            disabled={rxDateSaving}
            variant="text"
            sx={{ fontWeight: 700, textTransform: 'none', color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveRxDate}
            disabled={rxDateSaving || !targetRxNewDate}
            variant="contained"
            startIcon={rxDateSaving ? <CircularProgress size={16} color="inherit" /> : <DoneIcon />}
            sx={{
              bgcolor: isDark ? '#89D7B7' : '#134F4D',
              color: isDark ? '#0f1e1a' : '#ffffff',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: '12px',
              px: 3,
              py: 0.9,
              boxShadow: '0 4px 14px rgba(19, 79, 77, 0.25)',
              '&:hover': { bgcolor: isDark ? '#6ec7a3' : '#0e3b3a' }
            }}
          >
            {rxDateSaving ? 'Saving Date...' : 'Update Date'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Edit Patient Profile Modal */}
      <EditPatientProfileModal
        open={editProfileModalOpen}
        onClose={() => {
          setEditProfileModalOpen(false);
          setPatientForProfileEdit(null);
        }}
        patient={patientForProfileEdit}
        onPatientUpdated={handlePatientProfileUpdated}
      />
    </Box>
  );
};

export default EnhancedPatientManagement;