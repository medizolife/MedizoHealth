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
  Sort as SortIcon
} from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { prescriptionsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../types/auth';
import {
  getManagedPatients,
  getPatientMedicalDetails,
  updatePatientMedicalInfo
} from '../services/patients';interface PatientFormData {
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

      {/* Header */}
      {!maxPatients && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
          p: 2.5,
          mb: 3,
          borderRadius: '20px',
          border: isDark ? '1px solid rgba(102, 205, 170, 0.25)' : '1px solid rgba(137, 215, 183, 0.4)',
          bgcolor: isDark ? 'rgba(20, 38, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.25)' : '0 8px 32px rgba(26, 49, 44, 0.04)'
        }}
      >
        {/* Row 1: Search Input & Sort Dropdown */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search patients by name, email, mobile, diagnosis, medication..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: isDark ? '#66CDAA' : '#428475' }} />
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
                  borderRadius: '14px',
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
              <InputLabel id="patient-sort-label" sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b', fontSize: '0.85rem' }}>
                Sort Patients By
              </InputLabel>
              <Select
                labelId="patient-sort-label"
                value={sortBy}
                label="Sort Patients By"
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  borderRadius: '14px',
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
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', gap: 1 }}>
            {hasActiveFilters && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleResetFilters}
                sx={{
                  borderRadius: '12px',
                  borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                  color: isDark ? '#FAF2F5' : '#1A312C',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '0.8rem'
                }}
              >
                Reset Filters
              </Button>
            )}
            <Chip
              label={`${filteredAndSortedPatients.length} of ${patients.length} patients`}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(102, 205, 170, 0.2)' : 'rgba(66, 132, 117, 0.12)',
                color: isDark ? '#66CDAA' : '#1A312C',
                fontWeight: 800,
                borderRadius: '10px'
              }}
            />
          </Grid>
        </Grid>

        {/* Row 2: Filter Pills (Gender, Age Groups, Rx Status) */}
        <Box sx={{ mt: 2, pt: 2, borderTop: isDark ? '1px solid rgba(102, 205, 170, 0.15)' : '1px solid rgba(137, 215, 183, 0.2)', display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          {/* Gender filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', fontWeight: 800, textTransform: 'uppercase', mr: 0.5 }}>
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
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  bgcolor: genderFilter === g.key ? (isDark ? '#66CDAA' : '#1A312C') : 'transparent',
                  color: genderFilter === g.key ? (isDark ? '#123029' : '#89D7B7') : (isDark ? '#FAF2F5' : '#1A312C'),
                  borderColor: genderFilter === g.key ? 'transparent' : (isDark ? 'rgba(102, 205, 170, 0.3)' : 'rgba(137, 215, 183, 0.4)')
                }}
              />
            ))}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: isDark ? 'rgba(102, 205, 170, 0.2)' : 'rgba(137, 215, 183, 0.3)' }} />

          {/* Age Group filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', fontWeight: 800, textTransform: 'uppercase', mr: 0.5 }}>
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
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  bgcolor: ageGroupFilter === a.key ? (isDark ? '#66CDAA' : '#1A312C') : 'transparent',
                  color: ageGroupFilter === a.key ? (isDark ? '#123029' : '#89D7B7') : (isDark ? '#FAF2F5' : '#1A312C'),
                  borderColor: ageGroupFilter === a.key ? 'transparent' : (isDark ? 'rgba(102, 205, 170, 0.3)' : 'rgba(137, 215, 183, 0.4)')
                }}
              />
            ))}
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: isDark ? 'rgba(102, 205, 170, 0.2)' : 'rgba(137, 215, 183, 0.3)' }} />

          {/* Prescriptions / Status filter */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', fontWeight: 800, textTransform: 'uppercase', mr: 0.5 }}>
              Status:
            </Typography>
            {[
              { key: 'all', label: 'All' },
              { key: 'active_rx', label: '🟢 Active Rx' },
              { key: 'has_rx', label: '📋 Has Rx' },
              { key: 'no_rx', label: '⚪ No Rx Yet' }
            ].map((s) => (
              <Chip
                key={s.key}
                label={s.label}
                size="small"
                onClick={() => setStatusFilter(s.key as any)}
                variant={statusFilter === s.key ? 'filled' : 'outlined'}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
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
        <Paper elevation={3} sx={{ p: 6, textAlign: 'center', borderRadius: '20px', bgcolor: isDark ? 'rgba(20, 38, 34, 0.9)' : '#fff' }}>
          <PersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#1A312C' }}>
            {patients.length === 0 ? 'No patients yet' : 'No patients matching your filters'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {patients.length === 0
              ? 'Patients will appear here after they are linked or you create prescriptions for them.'
              : 'Try clearing search terms or resetting filters to view all patients.'}
          </Typography>
          {hasActiveFilters && (
            <Button
              variant="contained"
              onClick={handleResetFilters}
              sx={{ borderRadius: '12px', bgcolor: '#1A312C', color: '#89D7B7', fontWeight: 800 }}
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
                    <Box sx={{ width: '16%', textAlign: 'right' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewMedicalDetails(patient);
                        }}
                        sx={{ borderRadius: '12px', fontWeight: 800, borderColor: isDark ? '#66CDAA' : '#1A312C', color: isDark ? '#66CDAA' : '#1A312C' }}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {paginatedPatients.map((patient) => (
            <Card
              key={patient.id}
              onClick={() => handleViewMedicalDetails(patient)}
              className="touch-active"
              sx={{
                p: 2,
                borderRadius: '18px',
                bgcolor: isDark ? 'rgba(20, 38, 34, 0.94)' : 'rgba(255, 255, 255, 0.9)',
                border: isDark ? '1px solid rgba(102, 205, 170, 0.3)' : '1px solid rgba(137, 215, 183, 0.4)',
                boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.3)' : '0 4px 16px rgba(26, 49, 44, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(102, 205, 170, 0.15)' : 'rgba(255, 244, 225, 0.95)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {/* Left Info Block */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0, mr: 1 }}>
                <Avatar sx={{ bgcolor: isDark ? 'rgba(102, 205, 170, 0.25)' : 'rgba(66, 132, 117, 0.15)', color: isDark ? '#66CDAA' : '#428475', width: 44, height: 44, fontWeight: 800, flexShrink: 0 }}>
                  {patient.firstName ? patient.firstName[0].toUpperCase() : <PersonIcon />}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FAF2F5' : '#1A312C', lineHeight: 1.2 }} noWrap>
                    {patient.firstName} {patient.lastName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? '#66CDAA' : '#428475', fontWeight: 700, display: 'block', mt: 0.3 }} noWrap>
                    🩺 {patient.latestPrescription?.diagnosis || patient.latestPrescription?.provisionalDiagnosis?.[0] || (patient.latestPrescription?.medications && patient.latestPrescription.medications[0]?.name) || patient.latestPrescription?.medication || (patient.diagnoses && patient.diagnoses[0]) || 'General Checkup'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748b', fontWeight: 600, fontSize: '0.7rem', display: 'block', mt: 0.2 }}>
                    {getPatientBio(patient) ? `${getPatientBio(patient)} • ` : ''}
                    📅 {patient.lastVisit ? `Last Visit: ${new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : `Since: ${patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 1, 2026'}`}
                  </Typography>
                </Box>
              </Box>
              
              {/* Right Action Block */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                <Chip 
                  label="View Details" 
                  size="small" 
                  sx={{ bgcolor: isDark ? '#66CDAA' : '#1A312C', color: isDark ? '#123029' : '#89D7B7', fontWeight: 800, fontSize: '0.68rem', cursor: 'pointer', height: 24 }} 
                />
                <ChevronRightIcon sx={{ color: isDark ? '#66CDAA' : '#428475', fontSize: 20 }} />
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
      >
        <DialogTitle>
          Medical Details - {selectedPatient?.firstName} {selectedPatient?.lastName}
        </DialogTitle>
        <DialogContent>
          {medicalDetailsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : medicalDetails && (
            <Box>
              <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Prescription History" />
                <Tab label="Medical Information" />
              </Tabs>

              {tabValue === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Treatment Summary
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Total Prescriptions: <strong>{medicalDetails.totalPrescriptions}</strong>
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Active Prescriptions: <strong>{medicalDetails.activePrescriptions}</strong>
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Completed: <strong>{medicalDetails.completedPrescriptions}</strong>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Medical Alerts
                        </Typography>
                        {medicalDetails.allergies && medicalDetails.allergies.length > 0 ? (
                          medicalDetails.allergies.map((allergy: string, index: number) => (
                            <Chip 
                              key={`allergy-view-${allergy}-${index}`} 
                              label={allergy} 
                              color="warning" 
                              size="small" 
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No known allergies
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {tabValue === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon sx={{ color: isDark ? '#89D7B7' : '#134F4D' }} />
                      Prescription History
                    </Typography>
                    {medicalDetails.prescriptionHistory && medicalDetails.prescriptionHistory.length > 0 && (
                      <Chip 
                        label={`${medicalDetails.prescriptionHistory.length} Total`} 
                        size="small" 
                        sx={{ fontWeight: 800, bgcolor: isDark ? 'rgba(137, 215, 183, 0.15)' : 'rgba(19, 79, 77, 0.08)', color: isDark ? '#89D7B7' : '#134F4D' }} 
                      />
                    )}
                  </Box>

                  {medicalDetails.prescriptionHistory && medicalDetails.prescriptionHistory.length > 0 ? (
                    medicalDetails.prescriptionHistory.map((prescription: any) => {
                      const rxId = prescription.id || '';
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
                            bgcolor: isDark ? 'rgba(20, 38, 34, 0.6)' : '#ffffff',
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
                                      // Clean formatting to prevent 'undefined' string outputs
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

                                {/* Action Buttons: View & Download */}
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
                    <Box sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: '1px dashed #cbd5e1' }}>
                      <HistoryIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                        No prescription history available for this patient.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {tabValue === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <BloodIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Medical Information
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Blood Type: <strong>{medicalDetails.bloodType || 'Not specified'}</strong>
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                          Medical History:
                        </Typography>
                        {medicalDetails.medicalHistory && medicalDetails.medicalHistory.length > 0 ? (
                          <List dense>
                            {medicalDetails.medicalHistory.map((history: string, index: number) => (
                              <ListItem key={`history-view-${history}-${index}`}>
                                <ListItemText primary={history} />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No medical history recorded
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <EmergencyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Emergency Contact
                        </Typography>
                        {medicalDetails.emergencyContact ? (
                          <Box>
                            <Typography variant="body2">
                              Name: <strong>{medicalDetails.emergencyContact.name}</strong>
                            </Typography>
                            <Typography variant="body2">
                              Phone: <strong>{medicalDetails.emergencyContact.phone}</strong>
                            </Typography>
                            <Typography variant="body2">
                              Relationship: <strong>{medicalDetails.emergencyContact.relationship}</strong>
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No emergency contact specified
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMedicalDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Medical Information Dialog */}
      <Dialog 
        open={editMedicalOpen} 
        onClose={() => setEditMedicalOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Edit Medical Information - {selectedPatient?.firstName} {selectedPatient?.lastName}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Allergies:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {medicalFormData.allergies.map((allergy, index) => (
                  <Chip
                    key={`form-allergy-${allergy}-${index}`}
                    label={allergy}
                    color="warning"
                    onDelete={() => handleRemoveAllergy(index)}
                  />
                ))}
                <Button size="small" onClick={handleAddAllergy}>
                  Add Allergy
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Medical History:
              </Typography>
              <Box display="flex" flexDirection="column" gap={1} mb={2}>
                {medicalFormData.medicalHistory.map((history, index) => (
                  <Chip
                    key={`form-history-${history}-${index}`}
                    label={history}
                    onDelete={() => handleRemoveMedicalHistory(index)}
                  />
                ))}
                <Button size="small" onClick={handleAddMedicalHistory}>
                  Add Medical History
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Blood Type"
                value={medicalFormData.bloodType}
                onChange={(e) => setMedicalFormData(prev => ({ ...prev, bloodType: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Emergency Contact:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Name"
                value={medicalFormData.emergencyContact.name}
                onChange={(e) => setMedicalFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Phone"
                value={medicalFormData.emergencyContact.phone}
                onChange={(e) => setMedicalFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Relationship"
                value={medicalFormData.emergencyContact.relationship}
                onChange={(e) => setMedicalFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMedicalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveMedicalInfo} variant="contained">
            Save Medical Information
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedPatientManagement;