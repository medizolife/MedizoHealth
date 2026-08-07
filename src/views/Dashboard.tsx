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
  DialogActions,
  Stack
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
  MedicalInformation as MedicalInfoIcon,
  CloudUpload as UploadIcon,
  PictureAsPdf as PdfIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Description as FileIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { getPrescriptions, lookupPrescriptionByCode } from '../services/prescriptions';
import { getCachedData } from '../services/apiCache';
import { digilockerAPI, usersAPI, authAPI, prescriptionsAPI, getApiBaseUrl } from '../services/api';
import { Prescription } from '../types/prescription';
import EnhancedPatientManagement from '../components/EnhancedPatientManagement';
import WallpaperCarouselHero from '../components/WallpaperCarouselHero';
import PharmacistDashboard from './PharmacistDashboard';
import QrScannerModal from '../components/QrScannerModal';
import UploadPastPrescriptionModal from '../components/UploadPastPrescriptionModal';

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

  // External Records State
  const [uploadPastRxModalOpen, setUploadPastRxModalOpen] = useState(false);
  const [externalRecords, setExternalRecords] = useState<any[]>([]);
  const [loadingExternal, setLoadingExternal] = useState(false);

  const fetchExternalRecords = async () => {
    try {
      setLoadingExternal(true);
      const data = await prescriptionsAPI.getExternalPrescriptions();
      setExternalRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching external records:', err);
    } finally {
      setLoadingExternal(false);
    }
  };

  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchExternalRecords();
    }
  }, [authState.isAuthenticated]);

  const handleDeleteExternalRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this past prescription record?')) return;
    try {
      await prescriptionsAPI.deleteExternalPrescription(id);
      setSnackbar({ open: true, message: 'Record deleted successfully.', severity: 'success' });
      fetchExternalRecords();
    } catch (err: any) {
      setSnackbar({ open: true, message: 'Failed to delete record.', severity: 'error' });
    }
  };

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
    const totalTabs = 3;

    if (distance > minSwipeDistance) {
      setTabValue(prev => Math.min(prev + 1, totalTabs - 1));
    } else if (distance < -minSwipeDistance) {
      setTabValue(prev => Math.max(prev - 1, 0));
    }
  };

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

    const cachedList = getCachedData<Prescription[]>('prescriptions_list');
    if (Array.isArray(cachedList)) {
      setPrescriptions(cachedList);
      setLoading(false);
    } else {
      setLoading(true);
    }

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
  
  const matchesSearch = (p: any): boolean => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    const cleanDigits = q.replace(/[^\d]/g, '');

    const pMobile = String(p.patientMobile || p.patientPhone || p.contactNumber || p.mobile || p.phone || '');
    const pMobileDigits = pMobile.replace(/[^\d]/g, '');
    const mobileMatch = (pMobile && pMobile.toLowerCase().includes(q)) || 
      (cleanDigits.length >= 3 && pMobileDigits.includes(cleanDigits));

    return (
      mobileMatch ||
      (p.medication && p.medication.toLowerCase().includes(q)) ||
      (p.patientName && p.patientName.toLowerCase().includes(q)) ||
      (p.patientEmail && p.patientEmail.toLowerCase().includes(q)) ||
      (p.provisionalDiagnosis && p.provisionalDiagnosis.some((d: string) => d.toLowerCase().includes(q))) ||
      (p.presentingComplaints && p.presentingComplaints.some((c: string) => c.toLowerCase().includes(q))) ||
      (p.clinicalFindings && p.clinicalFindings.some((f: string) => f.toLowerCase().includes(q))) ||
      (p.medications && p.medications.some((m: any) => m.name && m.name.toLowerCase().includes(q))) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  };

  const activePrescriptions = prescriptions.filter((p: any) => p.status !== 'completed' && matchesSearch(p));
  const completedPrescriptions = prescriptions.filter((p: any) => p.status === 'completed' && matchesSearch(p));

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
          : aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });

        const timeStr = p.followUpInfo?.appointmentTime || '';
        const purpose = p.followUpInfo?.purpose || (p.provisionalDiagnosis && p.provisionalDiagnosis[0]) || 'Follow-up Consultation';

        appointments.push({
          id: p.id,
          patientName: p.patientName || 'Linked Patient',
          dateStr,
          timeStr,
          purpose,
          isToday,
          dateObj: aptDate
        });
      }
    });

    appointments.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    return appointments.slice(0, 5);
  }, [prescriptions]);

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
            <Box sx={{ width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(123, 31, 162, 0.15)', color: '#ab47bc', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <SecurityIcon sx={{ fontSize: 48 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: mode === 'dark' ? '#FAF2F5' : '#0f172a' }}>
              Identity Verification Required
            </Typography>

            <Typography variant="body2" sx={{ color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#64748b', mb: 3.5, lineHeight: 1.6 }}>
              For your privacy & health records protection, please verify your Date of Birth before accessing your medical dashboard.
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={() => {
                setDobGateInput('');
                setDobGateMsg(null);
                setDobGateDialogOpen(true);
              }}
              sx={{
                bgcolor: '#7b1fa2',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1rem',
                borderRadius: '16px',
                px: 4,
                py: 1.5,
                textTransform: 'none',
                boxShadow: '0 8px 25px rgba(123, 31, 162, 0.35)',
                '&:hover': { bgcolor: '#6a1b9a' }
              }}
            >
              Verify Date of Birth
            </Button>
          </Card>
        </Container>

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
      <Grid container spacing={3}>
        <Grid item xs={12} md={user?.role === 'doctor' ? 7 : 12} lg={user?.role === 'doctor' ? 8 : 12}>
          <WallpaperCarouselHero 
            searchQuery={searchQuery} 
            onSearchChange={setSearchQuery} 
            onQrScanClick={user?.role === 'doctor' ? () => setQrScannerOpen(true) : undefined}
          />

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
          <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
            Digital prescriptions created on this platform are generated by verified registered medical practitioners. Always consult your attending doctor before modifying any medication schedule.
          </Typography>
        </Alert>
      )}

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
            <Box sx={{ p: 1.2, borderRadius: '14px', bgcolor: 'rgba(230, 81, 0, 0.15)', color: '#e65100', display: 'flex', flexShrink: 0 }}>
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

      <Grid container spacing={2} sx={{ mb: 3 }} className="animate-slide-up">
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

        {user?.role === 'doctor' && (
          <Grid item xs={6} sm={3}>
            <Card 
              className="glass-card-cream touch-active shimmer-card"
              onClick={() => setTabValue(3)}
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

        <Grid item xs={6} sm={user?.role === 'doctor' ? 3 : 4}>
          {user?.role === 'doctor' ? (
            <Card 
              className="glass-card-cream touch-active shimmer-card"
              onClick={() => navigate('/prescriptions/new')}
              sx={{ cursor: 'pointer', p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 110 }}
            >
              <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(66, 132, 117, 0.15)', display: 'flex', mb: 1 }}>
                <AddIcon sx={{ color: '#428475', fontSize: 26 }} />
              </Box>
              <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', fontWeight: 800, fontSize: '0.78rem', textAlign: 'center' }}>
                + New Prescription
              </Typography>
            </Card>
          ) : (
            <Card 
              className="glass-card-cream touch-active shimmer-card"
              onClick={() => setTabValue(2)}
              sx={{ cursor: 'pointer', p: 2, height: '100%' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(19, 79, 77, 0.12)', color: '#134F4D', display: 'flex' }}>
                  <UploadIcon sx={{ fontSize: 22 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#123029', letterSpacing: '-0.03em' }}>
                {externalRecords.length}
              </Typography>
              <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', fontWeight: 800, fontSize: '0.75rem' }}>
                Past Records
              </Typography>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* ─── Control Action Bar ─── */}
      <Paper 
        className="glass-panel animate-slide-up"
        sx={{ 
          p: 1.2, 
          mb: 3, 
          display: 'flex', 
          gap: 1, 
          overflowX: 'auto',
          alignItems: 'center',
          justify: 'space-between',
          bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.94) !important',
          border: '1px solid var(--glass-border) !important'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 0.5, px: 0.5, width: '100%' }}>
          {user?.role === 'doctor' && (
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
          )}

          {user?.role !== 'doctor' && (
            <Chip 
              icon={<UploadIcon sx={{ color: '#ffffff !important' }} />}
              label="Upload Past Prescription"
              clickable
              onClick={() => setUploadPastRxModalOpen(true)}
              sx={{ 
                bgcolor: '#134F4D', 
                color: '#ffffff', 
                fontWeight: 800, 
                px: 1,
                py: 2.2,
                borderRadius: '16px',
                boxShadow: '0 4px 14px rgba(19, 79, 77, 0.3)',
                '&:hover': { bgcolor: '#0e3b3a' }
              }} 
            />
          )}

          {user?.role === 'doctor' && (
            <Chip 
              icon={<PersonAddIcon sx={{ color: mode === 'dark' ? '#FAF2F5 !important' : '#123029 !important' }} />}
              label="Manage Patients"
              clickable
              onClick={() => setTabValue(3)}
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
          )}
        </Box>
      </Paper>

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
          {user?.role === 'doctor' ? (
            <Tab 
              label="Patients" 
              icon={<PeopleIcon sx={{ fontSize: 18, color: tabValue === 2 ? (mode === 'dark' ? '#66CDAA' : '#1A312C') : (mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#428475') }} />} 
              iconPosition="start" 
            />
          ) : (
            <Tab 
              label={`Past Records (${externalRecords.length})`} 
              icon={<UploadIcon sx={{ fontSize: 18, color: tabValue === 2 ? (mode === 'dark' ? '#66CDAA' : '#1A312C') : (mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#428475') }} />} 
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
            <Box
              sx={{
                display: 'flex',
                width: '300%',
                transform: `translateX(-${(tabValue * 100) / 3}%)`,
                transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
                willChange: 'transform'
              }}
            >
              {/* Pane 0: Active Prescriptions */}
              <Box sx={{ width: '33.3333%', p: { xs: 1.5, sm: 2 }, flexShrink: 0, boxSizing: 'border-box' }}>
                {activePrescriptions.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'rgba(137, 215, 183, 0.2)', width: 72, height: 72, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <MedicationIcon sx={{ fontSize: 36, color: '#428475' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A312C', mb: 0.5 }}>
                      No Active Prescriptions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto', mb: 2.5 }}>
                      {searchQuery ? 'No records match your search criteria.' : 'Create a new digital prescription or upload a past prescription record.'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {user?.role === 'doctor' && (
                        <Chip 
                          label="+ Issue First Prescription" 
                          onClick={() => navigate('/prescriptions/new')}
                          sx={{ bgcolor: '#1A312C', color: '#89D7B7', fontWeight: 800, cursor: 'pointer', px: 1, py: 2 }}
                        />
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<UploadIcon />}
                        onClick={() => setUploadPastRxModalOpen(true)}
                        sx={{
                          borderRadius: '14px',
                          bgcolor: '#134F4D',
                          color: '#ffffff',
                          fontWeight: 800,
                          textTransform: 'none',
                          px: 2.5,
                          py: 1
                        }}
                      >
                        Upload Past Prescription
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <List disablePadding>
                    {activePrescriptions.slice(0, 5).map((prescription, idx) => (
                      <ListItem 
                        key={prescription.id || idx}
                        button 
                        onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                        className="touch-active"
                        sx={{ 
                          borderRadius: '16px', 
                          my: 1, 
                          p: 2,
                          bgcolor: 'rgba(255, 255, 255, 0.75)',
                          border: '1px solid rgba(137, 215, 183, 0.4)'
                        }}
                      >
                        <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: 'rgba(66, 132, 117, 0.12)', mr: 2, display: 'flex', alignItems: 'center' }}>
                          <MedicationIcon sx={{ color: '#428475', fontSize: 26 }} />
                        </Box>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1A312C' }}>
                              {prescription.medication || (prescription.provisionalDiagnosis && prescription.provisionalDiagnosis[0]) || 'Prescription Document'}
                            </Typography>
                          }
                          secondary={`Patient: ${(prescription as any).patientName || 'Linked Patient'}`}
                        />
                        <ChevronRightIcon sx={{ color: '#428475' }} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              {/* Pane 1: Completed Prescriptions */}
              <Box sx={{ width: '33.3333%', p: { xs: 1.5, sm: 2 }, flexShrink: 0, boxSizing: 'border-box' }}>
                {completedPrescriptions.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A312C', mb: 0.5 }}>
                      No Completed Records
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {completedPrescriptions.slice(0, 5).map((prescription, idx) => (
                      <ListItem key={prescription.id || idx} button onClick={() => navigate(`/prescriptions/${prescription.id}`)}>
                        <ListItemText primary={prescription.medication || 'Prescription'} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              {/* Pane 2: Past / Uploaded External Prescriptions & Reports (Patient Only) */}
              {user?.role !== 'doctor' && (
              <Box sx={{ width: '33.3333%', p: { xs: 1.5, sm: 2 }, flexShrink: 0, boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }}>
                      📜 Past / External Prescriptions & Reports
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Medical records from other clinics & past consultations
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<UploadIcon />}
                    onClick={() => setUploadPastRxModalOpen(true)}
                    sx={{
                      borderRadius: '12px',
                      bgcolor: '#134F4D',
                      color: '#ffffff',
                      fontWeight: 800,
                      px: 2,
                      py: 0.8,
                      fontSize: '0.78rem',
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#0e3b3a' }
                    }}
                  >
                    Upload Record
                  </Button>
                </Box>

                {loadingExternal ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}>
                    <CircularProgress size={32} sx={{ color: '#134F4D', mb: 1 }} />
                    <Typography variant="caption" display="block" color="text.secondary">
                      Loading past prescription records...
                    </Typography>
                  </Box>
                ) : externalRecords.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center', bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: '20px', p: 3 }}>
                    <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'rgba(19, 79, 77, 0.1)', width: 64, height: 64, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <UploadIcon sx={{ fontSize: 32, color: '#134F4D' }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', mb: 0.5 }}>
                      No Past Prescriptions Uploaded
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340, mx: 'auto', mb: 2.5, fontSize: '0.82rem' }}>
                      Upload photos or PDFs of old prescriptions from other clinics to keep your complete health history in one place.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => setUploadPastRxModalOpen(true)}
                      sx={{
                        borderRadius: '14px',
                        bgcolor: '#134F4D',
                        color: '#ffffff',
                        fontWeight: 800,
                        px: 3,
                        py: 1,
                        '&:hover': { bgcolor: '#0e3b3a' }
                      }}
                    >
                      Upload Past Prescription
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {externalRecords.map((record) => (
                      <Grid item xs={12} sm={6} key={record.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: '18px',
                            bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                            border: '1px solid rgba(19, 79, 77, 0.18)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justify: 'space-between',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
                          }}
                        >
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {record.fileType === 'pdf' ? (
                                  <PdfIcon sx={{ color: '#dc2626', fontSize: 26 }} />
                                ) : (
                                  <FileIcon sx={{ color: '#134F4D', fontSize: 26 }} />
                                )}
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0f172a' }}>
                                  {record.title}
                                </Typography>
                              </Box>
                              <Chip
                                label={record.fileType?.toUpperCase() || 'FILE'}
                                size="small"
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(19, 79, 77, 0.1)', color: '#134F4D' }}
                              />
                            </Box>

                            {record.doctorName && (
                              <Typography variant="caption" sx={{ color: '#134F4D', fontWeight: 700, display: 'block', mb: 0.5 }}>
                                Doctor / Clinic: {record.doctorName}
                              </Typography>
                            )}

                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                              Date: {record.recordDate || new Date(record.createdAt).toLocaleDateString()}
                            </Typography>

                            {record.notes && (
                              <Typography variant="body2" sx={{ fontSize: '0.78rem', color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#475569', fontStyle: 'italic', mb: 1.5 }}>
                                "{record.notes}"
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<ViewIcon />}
                              onClick={() => window.open(record.fileUrl?.startsWith('http') ? record.fileUrl : `${getApiBaseUrl()}${record.fileUrl}`, '_blank')}
                              sx={{
                                flex: 1,
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                borderColor: '#134F4D',
                                color: '#134F4D'
                              }}
                            >
                              View Document
                            </Button>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteExternalRecord(record.id)}
                              title="Delete record"
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
              )}

              {/* Pane 2: Patients (Doctor Only) */}
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

        {/* ═══ Desktop Right Sidebar (Doctors Only) ═══ */}
        {user?.role === 'doctor' && (
          <Grid item md={5} lg={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            {/* Upcoming Appointments */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '20px',
                mb: 3,
                border: mode === 'dark' ? '1.5px solid rgba(137, 215, 183, 0.15)' : '1.5px solid rgba(66, 132, 117, 0.15)',
                bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.85)' : 'rgba(255, 255, 255, 0.95)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(66, 132, 117, 0.12)', display: 'flex' }}>
                    <CalendarIcon sx={{ color: '#428475', fontSize: 22 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }}>
                    Upcoming Appointments
                  </Typography>
                </Box>
                <Badge
                  badgeContent={upcomingAppointments.length}
                  showZero
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#428475',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      minWidth: 24,
                      height: 24,
                      borderRadius: '50%'
                    }
                  }}
                >
                  <Box />
                </Badge>
              </Box>
              {upcomingAppointments.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 2, fontStyle: 'italic' }}>
                  No follow-up appointments scheduled.
                </Typography>
              ) : (
                <List disablePadding>
                  {upcomingAppointments.slice(0, 3).map((apt) => (
                    <ListItem
                      key={apt.id}
                      button
                      onClick={() => navigate(`/prescriptions/${apt.id}`)}
                      sx={{
                        borderRadius: '12px',
                        my: 0.5,
                        p: 1.5,
                        bgcolor: apt.isToday
                          ? (mode === 'dark' ? 'rgba(137, 215, 183, 0.1)' : 'rgba(66, 132, 117, 0.06)')
                          : 'transparent',
                      }}
                    >
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: '0.85rem' }}>{apt.patientName}</Typography>}
                        secondary={<Typography variant="caption" sx={{ color: '#64748b' }}>{apt.dateStr}{apt.timeStr ? ` • ${apt.timeStr}` : ''} — {apt.purpose}</Typography>}
                      />
                      <ChevronRightIcon sx={{ color: '#428475', fontSize: 18 }} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>

            {/* Clinical Quick Tools */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '20px',
                mb: 3,
                border: mode === 'dark' ? '1.5px solid rgba(137, 215, 183, 0.15)' : '1.5px solid rgba(66, 132, 117, 0.15)',
                bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.85)' : 'rgba(255, 255, 255, 0.95)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(66, 132, 117, 0.12)', display: 'flex' }}>
                  <StethoscopeIcon sx={{ color: '#428475', fontSize: 22 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }}>
                  Clinical Quick Tools
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/prescriptions/new')}
                  sx={{
                    bgcolor: '#1A312C',
                    color: '#89D7B7',
                    fontWeight: 800,
                    borderRadius: '14px',
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 14px rgba(26, 49, 44, 0.3)',
                    '&:hover': { bgcolor: '#0f2420' }
                  }}
                >
                  + Issue Digital Prescription
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<QrIcon />}
                  onClick={() => setQrScannerOpen(true)}
                  sx={{
                    borderColor: mode === 'dark' ? 'rgba(137, 215, 183, 0.3)' : 'rgba(66, 132, 117, 0.3)',
                    color: mode === 'dark' ? '#89D7B7' : '#1A312C',
                    fontWeight: 700,
                    borderRadius: '14px',
                    py: 1.2,
                    textTransform: 'none',
                    '&:hover': { borderColor: '#428475', bgcolor: 'rgba(66, 132, 117, 0.06)' }
                  }}
                >
                  Scan Patient Rx QR Code
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MedicationIcon />}
                  onClick={() => navigate('/prescriptions/all')}
                  sx={{
                    borderColor: mode === 'dark' ? 'rgba(137, 215, 183, 0.3)' : 'rgba(66, 132, 117, 0.3)',
                    color: mode === 'dark' ? '#89D7B7' : '#1A312C',
                    fontWeight: 700,
                    borderRadius: '14px',
                    py: 1.2,
                    textTransform: 'none',
                    '&:hover': { borderColor: '#428475', bgcolor: 'rgba(66, 132, 117, 0.06)' }
                  }}
                >
                  Browse Medical Records
                </Button>
              </Stack>
            </Paper>

            {/* Practice Insights Overview */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '20px',
                border: mode === 'dark' ? '1.5px solid rgba(137, 215, 183, 0.15)' : '1.5px solid rgba(66, 132, 117, 0.15)',
                bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.85)' : 'rgba(255, 255, 255, 0.95)',
              }}
            >
              <Typography variant="overline" sx={{ fontWeight: 800, color: '#428475', letterSpacing: '0.1em', display: 'block', mb: 2 }}>
                Practice Insights Overview
              </Typography>
              <Stack spacing={2} divider={<Divider sx={{ borderColor: mode === 'dark' ? 'rgba(137, 215, 183, 0.1)' : 'rgba(0,0,0,0.06)' }} />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: mode === 'dark' ? '#FAF2F5' : '#334155' }}>
                    Active Prescriptions
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#428475' }}>
                    {activePrescriptions.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: mode === 'dark' ? '#FAF2F5' : '#334155' }}>
                    Completed Records
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#428475' }}>
                    {completedPrescriptions.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: mode === 'dark' ? '#FAF2F5' : '#334155' }}>
                    DigiLocker Status
                  </Typography>
                  {digilockerVerified ? (
                    <Chip label="VERIFIED ✓" size="small" sx={{ bgcolor: 'rgba(66, 132, 117, 0.1)', color: '#428475', fontWeight: 800, fontSize: '0.7rem' }} />
                  ) : (
                    <Chip label="Not Verified" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 800, fontSize: '0.7rem' }} />
                  )}
                </Box>
              </Stack>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>

    <UploadPastPrescriptionModal
      open={uploadPastRxModalOpen}
      onClose={() => setUploadPastRxModalOpen(false)}
      onSuccess={fetchExternalRecords}
    />
    </>
  );
};

export default Dashboard;
