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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
import { getPrescriptions, lookupPrescriptionByCode } from '../services/prescriptions';
import { getCachedData } from '../services/apiCache';
import { digilockerAPI, usersAPI, authAPI } from '../services/api';
import { Prescription } from '../types/prescription';
import EnhancedPatientManagement from '../components/EnhancedPatientManagement';
import WallpaperCarouselHero from '../components/WallpaperCarouselHero';
import PharmacistDashboard from './PharmacistDashboard';
import QrScannerModal from '../components/QrScannerModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authState, needsDobVerification, markDobVerified } = useAuth();
  const { user } = authState;

  // DOB Gate Dialog State
  const [dobGateDialogOpen, setDobGateDialogOpen] = useState(false);
  const [dobGateInput, setDobGateInput] = useState('');
  const [dobGateLoading, setDobGateLoading] = useState(false);
  const [dobGateMsg, setDobGateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // QR Scanner state
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [scannedRxDialogOpen, setScannedRxDialogOpen] = useState(false);
  const [scannedRx, setScannedRx] = useState<any>(null);
  const [qrLinking, setQrLinking] = useState(false);

  // Touch swipe gesture state for native sliding tab animation
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 40;
    const totalTabs = user?.role === 'doctor' ? 3 : 2;

    if (distance > minSwipeDistance) {
      // Swiped left -> Go to next tab
      setTabValue(prev => Math.min(prev + 1, totalTabs - 1));
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> Go to previous tab
      setTabValue(prev => Math.max(prev - 1, 0));
    }
  };

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

    // 1. Instant Synchronous Cache Check (0 spinner delay on return visits)
    const cachedList = getCachedData<Prescription[]>('prescriptions_list');
    if (Array.isArray(cachedList)) {
      setPrescriptions(cachedList);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // 2. Background Revalidation (Stale-While-Revalidate)
    const fetchPrescriptions = async (isBackgroundRefresh = false) => {
      try {
        const data = await getPrescriptions(isBackgroundRefresh || Boolean(cachedList));
        setPrescriptions(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        if (!cachedList) setError('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions(Boolean(cachedList));
  }, [authState.isAuthenticated]);
  
  // Filter prescriptions based on search and status
  const matchesSearch = (p: any): boolean => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.medication && p.medication.toLowerCase().includes(q)) ||
      (p.patientName && p.patientName.toLowerCase().includes(q)) ||
      (p.provisionalDiagnosis && p.provisionalDiagnosis.some((d: string) => d.toLowerCase().includes(q))) ||
      (p.presentingComplaints && p.presentingComplaints.some((c: string) => c.toLowerCase().includes(q))) ||
      (p.clinicalFindings && p.clinicalFindings.some((f: string) => f.toLowerCase().includes(q))) ||
      (p.medications && p.medications.some((m: any) => m.name && m.name.toLowerCase().includes(q))) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  };

  const activePrescriptions = prescriptions.filter((p: any) => p.status !== 'completed' && matchesSearch(p));
  const completedPrescriptions = prescriptions.filter((p: any) => p.status === 'completed' && matchesSearch(p));

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

  // Handle QR scan success — lookup prescription and auto-link patient
  const handleDashboardQrScan = async (decodedText: string) => {
    setQrScannerOpen(false);
    try {
      const result = await lookupPrescriptionByCode(decodedText);
      if (result?.prescription) {
        setScannedRx(result.prescription);
        setScannedRxDialogOpen(true);

        // Auto-link the patient from this prescription to the current doctor
        if (result.prescription.patientId) {
          setQrLinking(true);
          try {
            await usersAPI.linkPatient(result.prescription.patientId);
            setSnackbar({ open: true, message: '✅ Patient linked to your records! You can now prescribe for them.', severity: 'success' });
          } catch (linkErr: any) {
            // Already linked is fine
            if (linkErr?.response?.status !== 400) {
              console.warn('Patient link error (may already be linked):', linkErr);
            }
          } finally {
            setQrLinking(false);
          }
        }
      } else {
        setSnackbar({ open: true, message: 'No prescription found for this QR code.', severity: 'warning' });
      }
    } catch (err: any) {
      console.error('QR lookup error:', err);
      setSnackbar({ open: true, message: err?.response?.data?.message || 'Failed to look up prescription.', severity: 'error' });
    }
  };

  if (needsDobVerification) {
    return (
      <>
        <Container maxWidth="sm" sx={{ pt: { xs: 4, md: 8 }, pb: 8, px: 2 }}>
          <Card
            className="glass-card-dark animate-scale-in"
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: '28px',
              textAlign: 'center',
              background: mode === 'dark'
                ? 'linear-gradient(145deg, rgba(25, 18, 36, 0.95) 0%, rgba(45, 20, 60, 0.9) 100%) !important'
                : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 240, 255, 0.98) 100%) !important',
              border: '2px solid rgba(171, 71, 188, 0.3)',
              boxShadow: '0 20px 60px rgba(123, 31, 162, 0.25)'
            }}
          >
            {/* Animated Lock Shield Icon */}
            <Box
              sx={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                bgcolor: 'rgba(123, 31, 162, 0.15)',
                color: '#ab47bc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                border: '2px solid rgba(171, 71, 188, 0.4)',
                boxShadow: '0 0 30px rgba(123, 31, 162, 0.3)',
                animation: 'pulse 2.5s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 30px rgba(123, 31, 162, 0.3)' },
                  '50%': { transform: 'scale(1.06)', boxShadow: '0 0 45px rgba(171, 71, 188, 0.5)' }
                }
              }}
            >
              <SecurityIcon sx={{ fontSize: 48 }} />
            </Box>

            <Chip
              label="Identity Verification Required"
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '0.75rem',
                bgcolor: 'rgba(123, 31, 162, 0.2)',
                color: mode === 'dark' ? '#ce93d8' : '#7b1fa2',
                border: '1px solid rgba(171, 71, 188, 0.3)',
                mb: 2.5,
                px: 1.5,
                py: 1.8
              }}
            />

            <Typography variant="h4" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', mb: 1.5, letterSpacing: '-0.02em' }}>
              Verify Date of Birth
            </Typography>

            <Typography variant="body1" sx={{ color: mode === 'dark' ? 'rgba(255, 255, 255, 0.75)' : '#475569', mb: 4, lineHeight: 1.6, maxWidth: 420, mx: 'auto' }}>
              To protect your medical privacy, please verify your Date of Birth before accessing your health records, prescriptions, and medical portal.
            </Typography>

            {/* ONE BIG BUTTON */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => { setDobGateDialogOpen(true); setDobGateMsg(null); setDobGateInput(''); }}
              startIcon={<SecurityIcon sx={{ fontSize: 26 }} />}
              sx={{
                py: 2,
                fontSize: '1.05rem',
                fontWeight: 800,
                borderRadius: '20px',
                bgcolor: '#7b1fa2',
                color: '#ffffff',
                boxShadow: '0 10px 30px rgba(123, 31, 162, 0.4)',
                textTransform: 'none',
                letterSpacing: 0.3,
                '&:hover': {
                  bgcolor: '#6a1b9a',
                  boxShadow: '0 14px 40px rgba(123, 31, 162, 0.5)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.25s ease'
              }}
            >
              🔐 Verify Date of Birth
            </Button>
          </Card>
        </Container>

        {/* DOB Verification Dialog Modal */}
        <Dialog
          open={dobGateDialogOpen}
          onClose={() => setDobGateDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '24px',
              p: 1,
              bgcolor: mode === 'dark' ? '#141416' : '#ffffff',
              border: '1px solid rgba(171, 71, 188, 0.3)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, textAlign: 'center', pt: 2, pb: 0.5, color: mode === 'dark' ? '#FAF2F5' : '#0f172a' }}>
            🔐 Enter Date of Birth
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#64748b' }}>
              Please enter your Date of Birth as registered on your account to unlock your medical records.
            </Typography>
            {dobGateMsg && (
              <Alert severity={dobGateMsg.type} sx={{ mb: 2, borderRadius: '14px', fontWeight: 600 }}>
                {dobGateMsg.text}
              </Alert>
            )}
            <TextField
              fullWidth
              margin="dense"
              label="Date of Birth"
              type="date"
              value={dobGateInput}
              onChange={(e) => setDobGateInput(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { borderRadius: '14px' } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setDobGateDialogOpen(false)} color="inherit" sx={{ fontWeight: 700, borderRadius: '12px' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={dobGateLoading || !dobGateInput.trim()}
              onClick={async () => {
                setDobGateLoading(true);
                setDobGateMsg(null);
                try {
                  const res = await authAPI.verifyDob(dobGateInput.trim());
                  if (res.verified) {
                    setDobGateMsg({ type: 'success', text: '✅ ' + (res.message || 'Identity verified!') });
                    markDobVerified();
                    setTimeout(() => setDobGateDialogOpen(false), 1200);
                  } else {
                    setDobGateMsg({ type: 'error', text: res.message || 'Verification failed. Date of birth does not match.' });
                  }
                } catch (err: any) {
                  setDobGateMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Verification failed.' });
                } finally {
                  setDobGateLoading(false);
                }
              }}
              sx={{
                bgcolor: '#7b1fa2',
                color: '#ffffff',
                fontWeight: 800,
                borderRadius: '14px',
                px: 3,
                py: 1,
                textTransform: 'none',
                '&:hover': { bgcolor: '#6a1b9a' }
              }}
            >
              {dobGateLoading ? <CircularProgress size={20} color="inherit" /> : 'Verify Identity'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <>
    <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 3 }, pb: 6, px: { xs: 2, sm: 3, md: 4 } }}>
      
      {/* ─── Responsive Desktop & Mobile Grid Layout ─── */}
      <Grid container spacing={3}>
        {/* ─── Left Main Column (Feed & Actions) ─── */}
        <Grid item xs={12} md={7} lg={8}>
          {/* ─── Wallpaper Carousel Hero Greeting Header ─── */}
          <WallpaperCarouselHero 
            searchQuery={searchQuery} 
            onSearchChange={setSearchQuery} 
            onQrScanClick={user?.role === 'doctor' ? () => setQrScannerOpen(true) : undefined}
          />

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
      <Paper 
        className="glass-panel animate-slide-up" 
        sx={{ 
          overflow: 'hidden',
          bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.94) !important',
          color: mode === 'dark' ? '#FAF2F5 !important' : '#1A312C !important'
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_e, v) => setTabValue(v)}
          variant="fullWidth"
          sx={{
            borderBottom: mode === 'dark' ? '1px solid rgba(102, 205, 170, 0.25)' : '1px solid rgba(137, 215, 183, 0.3)',
            bgcolor: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(26, 49, 44, 0.04)',
            '& .MuiTab-root': { 
              fontWeight: 800, 
              fontSize: '0.875rem',
              color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#428475',
              py: 2,
              transition: 'all 0.2s ease',
              '&.Mui-selected': { 
                color: mode === 'dark' ? '#66CDAA !important' : '#1A312C !important',
                bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.15)' : 'rgba(255, 255, 255, 0.9)'
              } 
            },
            '& .MuiTabs-indicator': {
              backgroundColor: mode === 'dark' ? '#66CDAA' : '#1A312C',
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
              icon={<PeopleIcon sx={{ fontSize: 18, color: tabValue === 2 ? (mode === 'dark' ? '#66CDAA' : '#1A312C') : (mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#428475') }} />} 
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
          <Box 
            sx={{ overflow: 'hidden', width: '100%', position: 'relative', touchAction: 'pan-y' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Horizontal sliding track across all 3 tabs */}
            <Box
              sx={{
                display: 'flex',
                width: user?.role === 'doctor' ? '300%' : '200%',
                transform: `translateX(-${(tabValue * 100) / (user?.role === 'doctor' ? 3 : 2)}%)`,
                transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
                willChange: 'transform'
              }}
            >
              {/* ─── Pane 0: Active Prescriptions ─── */}
              <Box sx={{ width: user?.role === 'doctor' ? '33.3333%' : '50%', p: { xs: 1.5, sm: 2 }, flexShrink: 0, boxSizing: 'border-box' }}>
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
                          onClick={() => navigate(`/prescriptions/${apt.id}`)}
                          className="touch-active"
                          sx={{
                            p: 1.8,
                            borderRadius: '16px',
                            bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
                            border: '1.5px solid rgba(2, 132, 199, 0.2)',
                            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.9)' : 'rgba(224, 242, 254, 0.6)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.12)'
                            }
                          }}
                        >
                          {/* Left Info Block */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0, mr: 1 }}>
                            <Avatar sx={{ bgcolor: apt.isToday ? '#ef4444' : '#0284c7', color: '#fff', width: 42, height: 42, flexShrink: 0 }}>
                              <CalendarIcon sx={{ fontSize: 22 }} />
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0f172a', fontSize: '0.88rem' }} noWrap>
                                {apt.patientName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 700, display: 'block', mt: 0.2 }} noWrap>
                                🩺 {apt.purpose}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Rightmost Date, Time & Chevron Block */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 'auto' }}>
                            <Box sx={{ textAlign: 'right' }}>
                              <Chip
                                label={apt.dateStr}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: '0.68rem',
                                  bgcolor: apt.isToday ? '#fee2e2' : '#e0f2fe',
                                  color: apt.isToday ? '#dc2626' : '#0369a1',
                                  border: apt.isToday ? '1px solid #ef4444' : '1px solid #0284c7',
                                  height: 22
                                }}
                              />
                              {apt.timeStr && (
                                <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 700, fontSize: '0.65rem', mt: 0.3 }}>
                                  ⏰ {apt.timeStr}
                                </Typography>
                              )}
                            </Box>
                            <ChevronRightIcon sx={{ color: '#0284c7', fontSize: 20 }} />
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
              </Box>

              {/* ─── Pane 1: Completed Prescriptions ─── */}
              <Box sx={{ width: user?.role === 'doctor' ? '33.3333%' : '50%', p: { xs: 1.5, sm: 2 }, flexShrink: 0, boxSizing: 'border-box' }}>
                {completedPrescriptions.length === 0 ? (
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
                )}
              </Box>

              {/* ─── Pane 2: Patients (Doctor Only) ─── */}
              {user?.role === 'doctor' && (
                <Box sx={{ width: '33.3333%', p: { xs: 1.5, sm: 2 }, flexShrink: 0, boxSizing: 'border-box' }}>
                  <EnhancedPatientManagement maxPatients={3} searchQuery={searchQuery} />
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Paper>

        </Grid>
        {/* End Left Main Column */}

        {/* ─── Right Sidebar Column (Desktop Widescreen Panel) ─── */}
        <Grid item xs={12} md={5} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: { md: 'sticky' }, top: { md: 84 } }}>
            
            {/* 📅 Sidebar Widget 1: Upcoming Appointments & Follow-ups */}
            {user?.role === 'doctor' && (
              <Card 
                className="glass-panel animate-slide-up" 
                sx={{ 
                  p: 2.5, 
                  borderRadius: '24px !important',
                  bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.94) !important',
                  border: '1px solid var(--glass-border) !important',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(2, 132, 199, 0.12)', display: 'flex' }}>
                      <CalendarIcon sx={{ color: '#0284c7', fontSize: 22 }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }}>
                      Upcoming Appointments
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${upcomingAppointments.length}`} 
                    size="small" 
                    sx={{ bgcolor: '#0284c7', color: '#ffffff', fontWeight: 800, fontSize: '0.7rem' }} 
                  />
                </Box>

                {upcomingAppointments.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center', bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '16px' }}>
                    <Typography variant="body2" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : '#64748b', fontWeight: 600 }}>
                      No follow-up appointments scheduled.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    {upcomingAppointments.map((apt) => (
                      <Card
                        key={apt.id}
                        onClick={() => navigate(`/prescriptions/${apt.id}`)}
                        className="touch-active"
                        sx={{
                          p: 1.5,
                          borderRadius: '16px',
                          bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
                          border: apt.isToday ? '1.5px solid #ef4444' : '1px solid rgba(2, 132, 199, 0.2)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            borderColor: '#0284c7'
                          }
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0f172a', fontSize: '0.85rem' }} noWrap>
                            {apt.patientName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 700, display: 'block' }} noWrap>
                            🩺 {apt.purpose}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                          <Chip
                            label={apt.dateStr}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              bgcolor: apt.isToday ? '#fee2e2' : '#e0f2fe',
                              color: apt.isToday ? '#dc2626' : '#0369a1',
                              height: 22
                            }}
                          />
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </Card>
            )}

            {/* 🛠️ Sidebar Widget 2: Quick Practice Actions & Clinical Tools */}
            <Card 
              className="glass-panel animate-slide-up" 
              sx={{ 
                p: 2.5, 
                borderRadius: '24px !important',
                bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.94) !important',
                border: '1px solid var(--glass-border) !important'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <StethoscopeIcon sx={{ color: 'var(--color-mint)' }} /> Clinical Quick Tools
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {user?.role === 'doctor' && (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/prescriptions/new')}
                    sx={{
                      py: 1.2,
                      borderRadius: '16px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      bgcolor: 'var(--color-forest)',
                      color: '#ffffff',
                      boxShadow: '0 6px 20px rgba(42, 107, 93, 0.3)',
                      '&:hover': { bgcolor: '#1d4b41' }
                    }}
                  >
                    + Issue Digital Prescription
                  </Button>
                )}

                {user?.role === 'doctor' && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<QrIcon />}
                    onClick={() => setQrScannerOpen(true)}
                    sx={{
                      py: 1.2,
                      borderRadius: '16px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      borderColor: 'var(--color-mint)',
                      color: mode === 'dark' ? '#FAF2F5' : '#123029',
                      '&:hover': { bgcolor: 'rgba(102, 205, 170, 0.12)' }
                    }}
                  >
                    Scan Patient Rx QR Code
                  </Button>
                )}

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<HospitalIcon />}
                  onClick={() => navigate('/prescriptions/all')}
                  sx={{
                    py: 1.2,
                    borderRadius: '16px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    borderColor: 'rgba(0, 0, 0, 0.15)',
                    color: mode === 'dark' ? '#FAF2F5' : '#123029',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.05)' }
                  }}
                >
                  Browse Medical Records
                </Button>
              </Box>
            </Card>

            {/* 📊 Sidebar Widget 3: Practice Insights & Summary Stats */}
            <Card 
              className="glass-panel animate-slide-up" 
              sx={{ 
                p: 2.5, 
                borderRadius: '24px !important',
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(30, 45, 40, 0.95) 0%, rgba(15, 25, 22, 0.98) 100%) !important'
                  : 'linear-gradient(135deg, rgba(242, 248, 246, 0.95) 0%, rgba(225, 240, 235, 0.98) 100%) !important',
                border: '1px solid var(--glass-border) !important'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--color-teal)', textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5, fontSize: '0.72rem' }}>
                Practice Insights Overview
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#123029' }}>
                    Active Prescriptions
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#428475' }}>
                    {activePrescriptions.length}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(102, 205, 170, 0.2)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#123029' }}>
                    Completed Records
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#2563eb' }}>
                    {completedPrescriptions.length}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(102, 205, 170, 0.2)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#123029' }}>
                    DigiLocker Status
                  </Typography>
                  <Chip
                    label={user?.role === 'doctor' ? (digilockerVerified ? 'VERIFIED ✓' : 'UNVERIFIED') : 'VERIFIED'}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      bgcolor: digilockerVerified ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                      color: digilockerVerified ? '#2e7d32' : '#e65100'
                    }}
                  />
                </Box>
              </Box>
            </Card>

          </Box>
        </Grid>
        {/* End Right Sidebar Column */}
      </Grid>
      {/* End Responsive Desktop & Mobile Grid Layout */}

      {/* Floating Action Button for Doctor */}
      {user?.role === 'doctor' && (
        <Fab 
          color="primary" 
          aria-label="add prescription"
          onClick={() => navigate('/prescriptions/new')}
          sx={{ 
            display: { xs: 'flex', md: 'none' },
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

      {/* QR Scanner Modal */}
      <QrScannerModal
        open={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScanSuccess={handleDashboardQrScan}
      />

      {/* Scanned Prescription Preview Dialog */}
      <Dialog
        open={scannedRxDialogOpen}
        onClose={() => setScannedRxDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', bgcolor: mode === 'dark' ? '#0F1D1A' : '#ffffff' } }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#0f172a' }}>
              📋 Scanned Prescription
            </Typography>
            <IconButton onClick={() => setScannedRxDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {scannedRx && (
            <Box>
              {/* Patient Info */}
              <Paper sx={{ p: 2, mb: 2, borderRadius: '16px', bgcolor: mode === 'dark' ? 'rgba(13, 148, 136, 0.08)' : 'rgba(19, 79, 77, 0.04)', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0D9488', mb: 0.5 }}>Patient</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0f172a' }}>
                  {scannedRx.patientName || 'Linked Patient'}
                </Typography>
                {scannedRx.patientEmail && (
                  <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : '#64748b' }}>
                    {scannedRx.patientEmail}
                  </Typography>
                )}
              </Paper>

              {/* Doctor Info */}
              {scannedRx.doctorName && (
                <Paper sx={{ p: 2, mb: 2, borderRadius: '16px', bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#428475', mb: 0.5 }}>Prescribed By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#0f172a' }}>
                    Dr. {scannedRx.doctorName} {scannedRx.doctorSpecialization ? `— ${scannedRx.doctorSpecialization}` : ''}
                  </Typography>
                </Paper>
              )}

              {/* Diagnosis */}
              {scannedRx.provisionalDiagnosis && scannedRx.provisionalDiagnosis.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: mode === 'dark' ? '#FAF2F5' : '#0f172a' }}>Diagnosis</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {scannedRx.provisionalDiagnosis.map((d: string, i: number) => (
                      <Chip key={i} label={d} size="small" sx={{ fontWeight: 700, bgcolor: mode === 'dark' ? 'rgba(13, 148, 136, 0.15)' : 'rgba(19, 79, 77, 0.08)', color: '#0D9488' }} />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Medications */}
              {scannedRx.medications && scannedRx.medications.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: mode === 'dark' ? '#FAF2F5' : '#0f172a' }}>Medications</Typography>
                  {scannedRx.medications.map((med: any, i: number) => (
                    <Paper key={i} sx={{ p: 1.5, mb: 1, borderRadius: '12px', bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0f172a' }}>
                        {i + 1}. {med.name} {med.type ? `(${med.type})` : ''}
                      </Typography>
                      <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#64748b' }}>
                        {med.dosage || ''} {med.frequency || ''} {med.durationDays ? `for ${med.durationDays} days` : ''}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* Linking Status */}
              {qrLinking && (
                <Alert severity="info" sx={{ borderRadius: '12px', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    Linking patient to your records...
                  </Box>
                </Alert>
              )}

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => {
                    setScannedRxDialogOpen(false);
                    navigate(`/prescriptions/${scannedRx.id || scannedRx._id}`);
                  }}
                  sx={{ borderRadius: '14px', fontWeight: 800, bgcolor: '#134F4D', '&:hover': { bgcolor: '#0e3b3a' } }}
                >
                  View Full Prescription
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setScannedRxDialogOpen(false);
                    if (scannedRx.patientId) {
                      navigate(`/prescriptions/new?patientId=${scannedRx.patientId}`);
                    } else {
                      navigate('/prescriptions/new');
                    }
                  }}
                  sx={{ borderRadius: '14px', fontWeight: 800, borderColor: '#134F4D', color: '#134F4D' }}
                >
                  New Rx for Patient
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Dialog>
    </>
  );
};

export default Dashboard;
