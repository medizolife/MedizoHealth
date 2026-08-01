'use client';
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Tab, 
  Tabs,
  List,
  ListItem,
  ListItemText,
  Divider,
  Fab,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  IconButton,
  Avatar,
  TextField,
  InputAdornment,
  Tooltip,
  Badge,
  Grid,
  Alert,
  AlertTitle,
  Snackbar,
  Button
} from '@mui/material';
import { 
  Add as AddIcon, 
  Medication as MedicationIcon, 
  CheckCircle as ActiveIcon, 
  History as HistoryIcon,
  ChevronRight as ChevronRightIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  NotificationsActive as NotificationsIcon,
  LocalHospital as HospitalIcon,
  VerifiedUser as VerifiedIcon,
  CalendarToday as CalendarIcon,
  MedicalServices as StethoscopeIcon,
  PersonAdd as PersonAddIcon,
  QrCodeScanner as QrIcon,
  FilterList as FilterIcon,
  Security as SecurityIcon,
  Close as CloseIcon,
  MedicalInformation as MedicalInfoIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { getPrescriptions } from '../services/prescriptions';
import { digilockerAPI } from '../services/api';
import { Prescription } from '../types/prescription';
import EnhancedPatientManagement from '../components/EnhancedPatientManagement';
import WallpaperCarouselHero from '../components/WallpaperCarouselHero';
import PharmacistDashboard from './PharmacistDashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authState } = useAuth();
  const { user } = authState;

  if (user?.role === 'pharmacist') {
    return <PharmacistDashboard />;
  }
  const { mode } = useThemeContext();
  
  const [tabValue, setTabValue] = useState(0);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Medical disclaimer banner state (dismissed once via localStorage)
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('medizo_disclaimer_dismissed') !== 'true';
    }
    return true;
  });
  
  const handleDismissDisclaimer = () => {
    setShowDisclaimer(false);
    localStorage.setItem('medizo_disclaimer_dismissed', 'true');
  };
  
  // DigiLocker state
  const [digilockerVerified, setDigilockerVerified] = useState(null as boolean | null);
  const [digilockerLoading, setDigilockerLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Handle DigiLocker callback query params
  useEffect(() => {
    const digilockerResult = searchParams.get('digilocker');
    const message = searchParams.get('message');
    
    if (digilockerResult === 'success') {
      setSnackbar({ open: true, message: 'DigiLocker verification successful! You can now create prescriptions.', severity: 'success' });
      setDigilockerVerified(true);
      searchParams.delete('digilocker');
      searchParams.delete('message');
      setSearchParams(searchParams, { replace: true });
    } else if (digilockerResult === 'error') {
      setSnackbar({ open: true, message: `DigiLocker verification failed: ${message || 'Unknown error'}`, severity: 'error' });
      searchParams.delete('digilocker');
      searchParams.delete('message');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch DigiLocker status for doctors
  useEffect(() => {
    if (user?.role === 'doctor') {
      digilockerAPI.getStatus()
        .then(data => setDigilockerVerified(data.verified || false))
        .catch(() => setDigilockerVerified(false));
    }
  }, [user]);

  useEffect(() => {
    if (!authState.isAuthenticated) {
      setLoading(false);
      return;
    }
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const data = await getPrescriptions();
        setPrescriptions(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, [authState.isAuthenticated]);
  
  // Filter prescriptions based on search and status
  const activePrescriptions = prescriptions.filter((p: any) => {
    const matchesSearch = !searchQuery || 
      (p.medication && p.medication.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.patientName && p.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.provisionalDiagnosis && p.provisionalDiagnosis.some((d: string) => d.toLowerCase().includes(searchQuery.toLowerCase())));
    return p.status !== 'completed' && matchesSearch;
  });

  const completedPrescriptions = prescriptions.filter((p: any) => {
    const matchesSearch = !searchQuery || 
      (p.medication && p.medication.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.patientName && p.patientName.toLowerCase().includes(searchQuery.toLowerCase()));
    return p.status === 'completed' && matchesSearch;
  });

  // Extract upcoming follow-up appointments from prescriptions
  const upcomingAppointments = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments: Array<{
      id: string;
      patientName: string;
      dateStr: string;
      timeStr: string;
      purpose: string;
      isToday: boolean;
      dateObj: Date;
    }> = [];

    prescriptions.forEach((p: any) => {
      const fDate = p.followUpInfo?.appointmentDate || p.followUpDate;
      if (!fDate) return;

      const aptDate = new Date(fDate);
      if (isNaN(aptDate.getTime())) return;
      aptDate.setHours(0, 0, 0, 0);

      if (aptDate >= today) {
        const isToday = aptDate.getTime() === today.getTime();
        const dateStr = isToday
          ? 'Today'
          : aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        appointments.push({
          id: p.id || Math.random().toString(),
          patientName: p.patientName || (p.patient ? `${p.patient.firstName} ${p.patient.lastName}` : 'Linked Patient'),
          dateStr,
          timeStr: p.followUpInfo?.appointmentTime || '',
          purpose: p.followUpInfo?.purpose || (p.provisionalDiagnosis && p.provisionalDiagnosis[0]) || 'Follow-up Consultation',
          isToday,
          dateObj: aptDate
        });
      }
    });

    // Sort closest date first
    appointments.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    return appointments;
  }, [prescriptions]);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <>
    <Container maxWidth="md" sx={{ pt: 2, pb: 6, px: { xs: 2, sm: 3 } }}>
      
      {/* ─── Wallpaper Carousel Hero Greeting Header ─── */}
      <WallpaperCarouselHero searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* ─── Medical Disclaimer Banner (One-time, dismissible) ─── */}
      {showDisclaimer && (
        <Alert
          severity="info"
          icon={<MedicalInfoIcon />}
          onClose={handleDismissDisclaimer}
          sx={{
            mb: 2.5,
            borderRadius: '16px',
            bgcolor: mode === 'dark' ? 'rgba(137, 215, 183, 0.08)' : 'rgba(26, 49, 44, 0.04)',
            border: `1px solid ${mode === 'dark' ? 'rgba(137, 215, 183, 0.2)' : 'rgba(26, 49, 44, 0.12)'}`,
            '& .MuiAlert-icon': { color: mode === 'dark' ? '#89D7B7' : '#1A312C' },
            '& .MuiAlert-message': { color: mode === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)' },
            '& .MuiAlert-action': { color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' },
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', mb: 0.3 }}>
            Medical Disclaimer
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
            Medizo is a healthcare management tool for organizing prescriptions and medical records.
            It does not provide medical diagnosis, treatment advice, or replace professional healthcare consultation.
          </Typography>
        </Alert>
      )}

      {/* ─── DigiLocker Verification Banner for Unverified Doctors ─── */}
      {user?.role === 'doctor' && digilockerVerified === false && (
        <Card 
          className="glass-card-cream"
          sx={{ 
            mb: 3, 
            p: 2.5,
            border: '1.5px solid rgba(255, 152, 0, 0.4)',
            background: mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.12) 0%, rgba(230, 81, 0, 0.08) 100%) !important'
              : 'linear-gradient(135deg, rgba(255, 243, 224, 0.95) 0%, rgba(255, 224, 178, 0.8) 100%) !important',
            boxShadow: '0 4px 20px rgba(255, 152, 0, 0.15)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{ 
              p: 1.2, 
              borderRadius: '14px', 
              bgcolor: 'rgba(230, 81, 0, 0.15)', 
              color: '#e65100',
              display: 'flex',
              flexShrink: 0
            }}>
              <SecurityIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FFB74D' : '#e65100', mb: 0.5, fontSize: '0.85rem' }}>
                Identity Verification Required
              </Typography>
              <Typography variant="body2" sx={{ color: mode === 'dark' ? 'rgba(255, 183, 77, 0.85)' : '#bf360c', fontSize: '0.78rem', lineHeight: 1.4, mb: 1.5 }}>
                Verify your identity with <strong>DigiLocker</strong> to create & update prescriptions. One-time process for patient safety.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setDigilockerLoading(true);
                  window.location.href = digilockerAPI.getAuthorizeUrl();
                }}
                disabled={digilockerLoading}
                startIcon={digilockerLoading ? <CircularProgress size={16} color="inherit" /> : <VerifiedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  bgcolor: '#e65100',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 2.5,
                  py: 0.8,
                  boxShadow: '0 4px 12px rgba(230, 81, 0, 0.3)',
                  '&:hover': { bgcolor: '#bf360c' },
                }}
              >
                {digilockerLoading ? 'Redirecting...' : 'Verify with DigiLocker'}
              </Button>
            </Box>
          </Box>
        </Card>
      )}

      {/* ─── Glass Metric Stat Cards ─── */}
      <Grid container spacing={2} sx={{ mb: 3 }} className="animate-slide-up">
        {/* Active Prescriptions Stat Card */}
        <Grid item xs={6} sm={user?.role === 'doctor' ? 3 : 4}>
          <Card 
            className="glass-card-teal touch-active shimmer-card"
            onClick={() => setTabValue(0)}
            sx={{ cursor: 'pointer', p: 2, height: '100%', position: 'relative', overflow: 'hidden' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.25)', display: 'flex' }}>
                <MedicationIcon sx={{ color: '#ffffff', fontSize: 22 }} />
              </Box>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#66CDAA' }} className="pulse-glowing" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff !important', letterSpacing: '-0.03em' }}>
              {activePrescriptions.length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.95) !important', fontWeight: 800, fontSize: '0.75rem' }}>
              Active Prescriptions
            </Typography>
          </Card>
        </Grid>

        {/* Doctor-only: Patient Counter Stat Card */}
        {user?.role === 'doctor' && (
          <Grid item xs={6} sm={3}>
            <Card 
              className="glass-card-cream touch-active shimmer-card"
              onClick={() => setTabValue(2)}
              sx={{ cursor: 'pointer', p: 2, height: '100%' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ p: 1, borderRadius: '12px', bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(42, 107, 93, 0.12)', display: 'flex' }}>
                  <PeopleIcon sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', fontSize: 22 }} />
                </Box>
                <Chip label="Live" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'var(--color-forest)', color: '#ffffff' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#123029', letterSpacing: '-0.03em' }}>
                {prescriptions.length > 0 ? Array.from(new Set(prescriptions.map((p: any) => p.patientId || p.patientName))).length : 0}
              </Typography>
              <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', fontWeight: 800, fontSize: '0.75rem' }}>
                Total Patients
              </Typography>
            </Card>
          </Grid>
        )}

        {/* Completed Records Card */}
        <Grid item xs={6} sm={user?.role === 'doctor' ? 3 : 4}>
          <Card 
            className="glass-card-cream touch-active shimmer-card"
            onClick={() => setTabValue(1)}
            sx={{ cursor: 'pointer', p: 2, height: '100%' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ p: 1, borderRadius: '12px', bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(42, 107, 93, 0.12)', display: 'flex' }}>
                <HistoryIcon sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', fontSize: 22 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#123029', letterSpacing: '-0.03em' }}>
              {completedPrescriptions.length}
            </Typography>
            <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', fontWeight: 800, fontSize: '0.75rem' }}>
              Completed Records
            </Typography>
          </Card>
        </Grid>

        {/* Doctor: Quick Action Button Panel | Patient: My Health Profile Card */}
        {user?.role === 'doctor' ? (
          <Grid item xs={6} sm={3}>
            <Card 
              className="glass-card-dark touch-active"
              onClick={() => navigate('/prescriptions/new')}
              sx={{ 
                cursor: 'pointer', 
                p: 2, 
                height: '100%', 
                bgcolor: 'var(--color-forest) !important',
                color: '#ffffff !important',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                border: '1px solid var(--color-mint) !important',
                boxShadow: '0 8px 24px rgba(42, 107, 93, 0.3)'
              }}
            >
              <Box sx={{ p: 1.2, borderRadius: '50%', bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', mb: 1, display: 'flex' }}>
                <AddIcon sx={{ fontSize: 24 }} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffffff !important', fontSize: '0.8rem' }}>
                + New Prescription
              </Typography>
            </Card>
          </Grid>
        ) : (
          <Grid item xs={12} sm={4}>
            <Card 
              className="glass-card-cream touch-active"
              onClick={() => navigate('/profile')}
              sx={{ 
                cursor: 'pointer', 
                p: 2, 
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Box sx={{ p: 1.2, borderRadius: '14px', bgcolor: 'rgba(66, 132, 117, 0.15)', color: '#428475', display: 'flex' }}>
                <VerifiedIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#123029' }}>
                  My Health Profile
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--color-forest)', fontWeight: 600 }}>
                  View & Edit Info
                </Typography>
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* ─── Glass Floating Action Control Bar ─── */}
      {user?.role === 'doctor' && (
        <Paper 
          className="glass-panel animate-slide-up"
          sx={{ 
            p: 1.2, 
            mb: 3, 
            display: 'flex', 
            gap: 1, 
            overflowX: 'auto',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.94) !important',
            border: '1px solid var(--glass-border) !important'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 0.5, px: 0.5, width: '100%' }}>
            <Chip 
              icon={<StethoscopeIcon sx={{ color: '#ffffff !important' }} />}
              label="Create Prescription"
              clickable
              onClick={() => navigate('/prescriptions/new')}
              sx={{ 
                bgcolor: 'var(--color-forest)', 
                color: '#ffffff', 
                fontWeight: 800, 
                px: 1,
                py: 2.2,
                borderRadius: '16px',
                boxShadow: '0 4px 14px rgba(42, 107, 93, 0.3)',
                '&:hover': { bgcolor: '#1d4b41' }
              }} 
            />

            <Chip 
              icon={<PersonAddIcon sx={{ color: mode === 'dark' ? '#FAF2F5 !important' : '#123029 !important' }} />}
              label="Manage Patients"
              clickable
              onClick={() => setTabValue(2)}
              sx={{ 
                bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.25)' : 'rgba(42, 107, 93, 0.12)', 
                color: mode === 'dark' ? '#FAF2F5' : '#123029', 
                fontWeight: 800, 
                px: 1,
                py: 2.2,
                borderRadius: '16px',
                border: '1px solid var(--color-mint)',
                '&:hover': { bgcolor: 'rgba(102, 205, 170, 0.3)' }
              }} 
            />

            <Chip 
              icon={<HospitalIcon sx={{ color: mode === 'dark' ? '#FAF2F5 !important' : '#123029 !important' }} />}
              label="All Records"
              clickable
              onClick={() => navigate('/prescriptions/all')}
              sx={{ 
                bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', 
                color: mode === 'dark' ? '#FAF2F5' : '#123029', 
                fontWeight: 800, 
                px: 1,
                py: 2.2,
                borderRadius: '16px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.08)' }
              }} 
            />
          </Box>
        </Paper>
      )}

      {/* ─── Segmented Glass Tabs & Content List ─── */}
      <Paper className="glass-panel animate-slide-up" sx={{ overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={(_e, v) => setTabValue(v)}
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid rgba(137, 215, 183, 0.3)',
            bgcolor: 'rgba(26, 49, 44, 0.04)',
            '& .MuiTab-root': { 
              fontWeight: 800, 
              fontSize: '0.875rem',
              color: '#428475',
              py: 2,
              transition: 'all 0.2s ease',
              '&.Mui-selected': { 
                color: '#1A312C',
                bgcolor: 'rgba(255, 255, 255, 0.9)'
              } 
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#1A312C',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab label={`Active (${activePrescriptions.length})`} />
          <Tab label={`Completed (${completedPrescriptions.length})`} />
          {user?.role === 'doctor' && (
            <Tab 
              label="Patients" 
              icon={<PeopleIcon sx={{ fontSize: 18, color: tabValue === 2 ? '#1A312C' : '#428475' }} />} 
              iconPosition="start" 
            />
          )}
        </Tabs>
        
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 6 }}>
            <CircularProgress size={36} sx={{ color: '#428475', mb: 2 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#428475' }}>
              Loading health records...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" variant="body2" sx={{ fontWeight: 600 }}>{error}</Typography>
          </Box>
        ) : (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            
            {/* Active Prescriptions Tab */}
            {tabValue === 0 && (
              <>
                {/* 📅 Top-most Upcoming Appointments Section in Active Tab */}
                {user?.role === 'doctor' && upcomingAppointments.length > 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: '20px',
                      bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(2, 132, 199, 0.06)',
                      border: '1.5px solid rgba(2, 132, 199, 0.3)',
                      boxShadow: '0 4px 20px rgba(2, 132, 199, 0.08)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 20, color: '#0284c7' }} /> Upcoming Appointments & Follow-ups
                      </Typography>
                      <Chip label={`${upcomingAppointments.length} Scheduled`} size="small" sx={{ bgcolor: '#0284c7', color: '#fff', fontWeight: 800, fontSize: '0.68rem' }} />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {upcomingAppointments.slice(0, 3).map((apt) => (
                        <Card
                          key={apt.id}
                          sx={{
                            p: 1.5,
                            borderRadius: '14px',
                            bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
                            border: '1px solid rgba(2, 132, 199, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: apt.isToday ? '#ef4444' : '#0284c7', width: 38, height: 38 }}>
                              <CalendarIcon sx={{ fontSize: 20 }} />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0f172a', fontSize: '0.85rem' }}>
                                {apt.patientName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block' }}>
                                {apt.purpose}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip
                              label={apt.dateStr}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                bgcolor: apt.isToday ? '#fee2e2' : '#e0f2fe',
                                color: apt.isToday ? '#dc2626' : '#0369a1',
                                border: apt.isToday ? '1px solid #ef4444' : '1px solid #0284c7'
                              }}
                            />
                            {apt.timeStr && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 700, fontSize: '0.65rem', mt: 0.2 }}>
                                ⏰ {apt.timeStr}
                              </Typography>
                            )}
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  </Paper>
                )}

                {activePrescriptions.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'rgba(137, 215, 183, 0.2)', width: 72, height: 72, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <MedicationIcon sx={{ fontSize: 36, color: '#428475' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A312C', mb: 0.5 }}>
                    No Active Prescriptions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto', mb: 2 }}>
                    {searchQuery ? 'No records match your search criteria.' : 'Create a new digital prescription to display active health records here.'}
                  </Typography>
                  {user?.role === 'doctor' && (
                    <Chip 
                      label="+ Issue First Prescription" 
                      onClick={() => navigate('/prescriptions/new')}
                      sx={{ bgcolor: '#1A312C', color: '#89D7B7', fontWeight: 800, cursor: 'pointer', px: 1, py: 2 }}
                    />
                  )}
                </Box>
              ) : (
                <>
                  <List disablePadding>
                    {activePrescriptions.slice(0, 3).map((prescription, idx) => (
                      <React.Fragment key={prescription.id || idx}>
                        <ListItem 
                          button 
                          onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                          className="touch-active"
                          sx={{ 
                            borderRadius: '16px', 
                            my: 1, 
                            p: 2,
                            bgcolor: 'rgba(255, 255, 255, 0.75)',
                            border: '1px solid rgba(137, 215, 183, 0.4)',
                            boxShadow: '0 4px 16px rgba(26, 49, 44, 0.04)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: 'rgba(255, 244, 225, 0.9)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 24px rgba(26, 49, 44, 0.08)'
                            }
                          }}
                        >
                          <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: 'rgba(66, 132, 117, 0.12)', mr: 2, display: 'flex', alignItems: 'center' }}>
                            <MedicationIcon sx={{ color: '#428475', fontSize: 26 }} />
                          </Box>
                          
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1A312C' }}>
                                  {prescription.medication || (prescription.provisionalDiagnosis && prescription.provisionalDiagnosis[0]) || 'Prescription Document'}
                                </Typography>
                                <Chip 
                                  label="Active" 
                                  size="small" 
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.65rem', 
                                    fontWeight: 800, 
                                    bgcolor: '#89D7B7', 
                                    color: '#1A312C'
                                  }} 
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: '#428475', fontWeight: 600, display: 'block' }}>
                                Patient: {(prescription as any).patientName || 'Linked Patient'} • Dosage: {prescription.dosage || 'As directed'}
                                <span style={{ display: 'block', color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>
                                  Issued: {new Date(prescription.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </Typography>
                            }
                          />
                          <ChevronRightIcon sx={{ color: '#428475' }} />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                  {activePrescriptions.length > 3 && (
                    <Box sx={{ mt: 1, p: 1.5, textAlign: 'center', bgcolor: 'rgba(137, 215, 183, 0.12)', borderRadius: '12px' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#1A312C' }}>
                        Showing latest 3 of {activePrescriptions.length} active prescriptions
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </>
          )}

            {/* Completed Prescriptions Tab */}
            {tabValue === 1 && (
              completedPrescriptions.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'rgba(26, 49, 44, 0.08)', width: 72, height: 72, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <HistoryIcon sx={{ fontSize: 36, color: '#1A312C' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A312C', mb: 0.5 }}>
                    No Completed Records
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed prescriptions and archived medical files will appear here.
                  </Typography>
                </Box>
              ) : (
                <>
                  <List disablePadding>
                    {completedPrescriptions.slice(0, 3).map((prescription, idx) => (
                      <React.Fragment key={prescription.id || idx}>
                        <ListItem 
                          button 
                          onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                          className="touch-active"
                          sx={{ 
                            borderRadius: '16px', 
                            my: 1, 
                            p: 2,
                            bgcolor: 'rgba(244, 248, 246, 0.8)',
                            border: '1px solid rgba(0,0,0,0.06)'
                          }}
                        >
                          <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: 'rgba(0,0,0,0.04)', mr: 2 }}>
                            <HistoryIcon sx={{ color: '#64748b', fontSize: 26 }} />
                          </Box>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#334155' }}>
                                {prescription.medication || (prescription.provisionalDiagnosis && prescription.provisionalDiagnosis[0]) || 'Prescription Record'}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                Completed: {new Date(prescription.createdAt || Date.now()).toLocaleDateString()}
                              </Typography>
                            }
                          />
                          <ChevronRightIcon sx={{ color: '#94a3b8' }} />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                  {completedPrescriptions.length > 3 && (
                    <Box sx={{ mt: 1, p: 1.5, textAlign: 'center', bgcolor: 'rgba(0, 0, 0, 0.04)', borderRadius: '12px' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>
                        Showing latest 3 of {completedPrescriptions.length} completed records
                      </Typography>
                    </Box>
                  )}
                </>
              )
            )}

            {/* Patients Tab */}
            {tabValue === 2 && user?.role === 'doctor' && (
              <Box sx={{ p: 0.5 }}>
                <EnhancedPatientManagement maxPatients={4} />
              </Box>
            )}

          </Box>
        )}
      </Paper>

      {/* Floating Action Button for Doctor */}
      {user?.role === 'doctor' && (
        <Fab 
          color="primary" 
          aria-label="add prescription"
          onClick={() => navigate('/prescriptions/new')}
          sx={{ 
            position: 'fixed', 
            bottom: 86, 
            right: 24, 
            bgcolor: '#1A312C', 
            color: '#89D7B7',
            '&:hover': { bgcolor: '#0F1D1A' },
            boxShadow: '0 10px 28px rgba(26, 49, 44, 0.4)',
            border: '1px solid #89D7B7'
          }}
          className="pulse-glowing"
        >
          <AddIcon sx={{ fontSize: 28 }} />
        </Fab>
      )}

    </Container>

      {/* Snackbar for DigiLocker callback notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity as 'success' | 'error' | 'info' | 'warning'}
          variant="filled"
          sx={{ width: '100%', borderRadius: '12px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Dashboard;
