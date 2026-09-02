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
  ExpandMore as ExpandMoreIcon,
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
  Description as FileIcon,
  Edit as EditIcon
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
import NursePortal from './NursePortal';
import QrScannerModal from '../components/QrScannerModal';
import UploadPastPrescriptionModal from '../components/UploadPastPrescriptionModal';
import DigiLockerWarmupModal from '../components/DigiLockerWarmupModal';
import PrescriptionBirthYearModal from '../components/PrescriptionBirthYearModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authState, needsDobVerification, markDobVerified, refreshUser } = useAuth();
  const { user } = authState;

  // DOB Gate Dialog State
  const [dobGateDialogOpen, setDobGateDialogOpen] = useState(false);
  const [dobGateInput, setDobGateInput] = useState('');
  const [dobGateLoading, setDobGateLoading] = useState(false);
  const [dobGateMsg, setDobGateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (user?.role === 'pharmacist') {
    return <PharmacistDashboard />;
  }
  if (user?.role === 'nurse') {
    return <NursePortal />;
  }
  const { mode } = useThemeContext();
  
  // Detect if running on mobile portal (m.medio.life) - hide sidebar features on mobile portal
  const isMobilePortal = typeof window !== 'undefined' && window.location.hostname === 'm.medio.life';
  
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
  
  // Pagination / Limit for active prescriptions (3 -> 5 -> Manage)
  const [activeLimit, setActiveLimit] = useState<number>(3);
  
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

  // Birth Year Verification Gate for Scanned Prescriptions
  const [birthYearModalOpen, setBirthYearModalOpen] = useState(false);
  const [scannedRxForVerification, setScannedRxForVerification] = useState<any>(null);

  const handleQrScanSuccess = async (scannedCode: string) => {
    setQrScannerOpen(false);
    try {
      setLoading(true);
      const res: any = await lookupPrescriptionByCode(scannedCode);
      const rx = res?.prescription || res;
      if (rx && rx.id) {
        // If logged-in user is a Doctor and not the author of this prescription, gate behind Birth Year verification
        if (user?.role === 'doctor' && rx.doctorId !== user.id && !rx.isUnlocked) {
          setScannedRxForVerification(rx);
          setBirthYearModalOpen(true);
        } else {
          setSnackbar({ open: true, message: 'Prescription found! Redirecting...', severity: 'success' });
          setTimeout(() => navigate(`/prescriptions/${rx.id}`), 500);
        }
      } else {
        setSnackbar({ open: true, message: 'Prescription not found with code: ' + scannedCode, severity: 'error' });
      }
    } catch (err: any) {
      console.error('Error looking up prescription by QR code:', err);
      setSnackbar({ open: true, message: err?.response?.data?.message || err.message || 'Prescription lookup failed.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBirthYearVerified = (unlockedRx: any, action?: 'view' | 'continue_trail') => {
    if (action === 'continue_trail') {
      setSnackbar({ open: true, message: '✅ Patient linked! Starting treatment trail in new prescription...', severity: 'success' });
      setTimeout(() => {
        navigate(`/prescriptions/new?trailRxId=${unlockedRx.id}&patientId=${unlockedRx.patientId || ''}`);
      }, 500);
    } else {
      setSnackbar({ open: true, message: '✅ Patient verified and linked! Opening prescription...', severity: 'success' });
      setTimeout(() => {
        navigate(`/prescriptions/${unlockedRx.id}`);
      }, 500);
    }
  };

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
      if (refreshUser) {
        refreshUser().catch(() => {});
      }
      digilockerAPI.getStatus().then(data => {
        if (data?.verified) setDigilockerVerified(true);
      }).catch(() => {});
      searchParams.delete('digilocker');
      searchParams.delete('message');
      setSearchParams(searchParams, { replace: true });
    } else if (digilockerResult === 'error') {
      setSnackbar({ open: true, message: `DigiLocker verification failed: ${message || 'Unknown error'}`, severity: 'error' });
      searchParams.delete('digilocker');
      searchParams.delete('message');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshUser]);

  useEffect(() => {
    const rxParam = searchParams.get('verify') || searchParams.get('id') || searchParams.get('rxId') || searchParams.get('scan');
    if (rxParam) {
      handleQrScanSuccess(rxParam);
      searchParams.delete('verify');
      searchParams.delete('id');
      searchParams.delete('rxId');
      searchParams.delete('scan');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (user?.role === 'doctor') {
      if (user?.digilockerVerified) {
        setDigilockerVerified(true);
      }
      digilockerAPI.getStatus()
        .then(data => {
          const isVer = Boolean(data.verified || user?.digilockerVerified);
          setDigilockerVerified(isVer);
          if (!isVer) {
            // Pre-warm Vercel server in the background for snappy verification
            digilockerAPI.pingServer().catch(() => {});
          }
        })
        .catch(() => {
          setDigilockerVerified(Boolean(user?.digilockerVerified));
          digilockerAPI.pingServer().catch(() => {});
        });
    }
  }, [user]);

  useEffect(() => {
    if (!authState.isAuthenticated) {
      setLoading(false);
      return;
    }

    const cachedList = getCachedData<Prescription[]>('prescriptions_list');
    if (Array.isArray(cachedList) && cachedList.length > 0) {
      setPrescriptions(cachedList);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const fetchPrescriptions = async (isBackgroundRefresh = false) => {
      try {
        const data = await getPrescriptions(true);
        setPrescriptions(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        if (!cachedList) setError('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions(Boolean(cachedList && cachedList.length > 0));
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
            ≡ƒöÉ Enter Date of Birth
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
                    setDobGateMsg({ type: 'success', text: 'Γ£à ' + (res.message || 'Identity verified!') });
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
    <Container maxWidth="xl" sx={{ pt: { xs: 1.5, md: 3 }, pb: { xs: 12, md: 6 }, px: { xs: 1.2, sm: 2.5, md: 4 } }}>
      <Grid container spacing={{ xs: 1.8, sm: 2.5, md: 3 }}>
        <Grid item xs={12} md={7} lg={8}>
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

          {(() => {
        const isDoctorVerified = Boolean(user?.digilockerVerified || digilockerVerified === true);
        return user?.role === 'doctor' && !isDoctorVerified && (
        <Card 
          className="glass-card-cream"
          sx={{ 
            mb: 3, 
            p: { xs: 2, sm: 2.5 },
            border: '1.5px solid rgba(255, 152, 0, 0.4)',
            background: mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.12) 0%, rgba(230, 81, 0, 0.08) 100%) !important'
              : 'linear-gradient(135deg, rgba(255, 243, 224, 0.95) 0%, rgba(255, 224, 178, 0.8) 100%) !important',
            boxShadow: '0 4px 20px rgba(255, 152, 0, 0.15)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box 
              sx={{ 
                p: 1.2, 
                borderRadius: '14px', 
                bgcolor: 'rgba(255, 152, 0, 0.2)', 
                color: '#e65100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <SecurityIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', mb: 0.5 }}>
                DigiLocker Identity Verification Required 🔒
              </Typography>
              <Typography variant="body2" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : '#4A5568', mb: 2, fontSize: '0.85rem', lineHeight: 1.5 }}>
                To create digital prescriptions and manage patients, please complete a 1-click identity verification via DigiLocker.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setDigilockerLoading(true);
                }}
                disabled={digilockerLoading}
                startIcon={<VerifiedIcon sx={{ fontSize: 18 }} />}
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
        );
      })()}

      {/* ═══ Stats Cards & Action Bar — collapse when searching ═══ */}
      <Box sx={{ 
        maxHeight: searchQuery.length >= 2 ? 0 : 600,
        opacity: searchQuery.length >= 2 ? 0 : 1,
        overflow: 'hidden',
        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
        willChange: 'max-height, opacity'
      }}>
      {/* ═══ Stats Cards ═══ */}
      <Grid container spacing={{ xs: 1.2, sm: 2 }} sx={{ mb: 3 }} className="animate-slide-up">
        {/* Card 1: Active Prescriptions */}
        <Grid item xs={6} sm={user?.role === 'doctor' ? 3 : 4}>
          <Card 
            className="glass-card-teal touch-active shimmer-card"
            onClick={() => setTabValue(0)}
            sx={{ cursor: 'pointer', p: { xs: 1.5, sm: 2 }, height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '18px' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
              <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: 'rgba(255, 255, 255, 0.25)', display: 'flex' }}>
                <MedicationIcon sx={{ color: '#ffffff', fontSize: { xs: 18, sm: 22 } }} />
              </Box>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#66CDAA' }} className="pulse-glowing" />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff !important', letterSpacing: '-0.03em', fontSize: { xs: '1.4rem', sm: '2rem' } }}>
              {activePrescriptions.length}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: 'rgba(255, 255, 255, 0.95) !important', fontWeight: 800, fontSize: { xs: '0.68rem', sm: '0.75rem' }, display: 'block' }}>
              Active Prescriptions
            </Typography>
          </Card>
        </Grid>

        {/* Card 2 (Doctor only): Total Patients */}
        {user?.role === 'doctor' && (
          <Grid item xs={6} sm={3}>
            <Card 
              className="glass-card-cream touch-active shimmer-card"
              onClick={() => setTabValue(2)}
              sx={{ cursor: 'pointer', p: { xs: 1.5, sm: 2 }, height: '100%', borderRadius: '18px' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(42, 107, 93, 0.12)', display: 'flex' }}>
                  <PeopleIcon sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', fontSize: { xs: 18, sm: 22 } }} />
                </Box>
                <Chip label="Live" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'var(--color-forest)', color: '#ffffff', px: 0.5 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#123029', letterSpacing: '-0.03em', fontSize: { xs: '1.4rem', sm: '2rem' } }}>
                {prescriptions.length > 0 ? Array.from(new Set(prescriptions.map((p: any) => p.patientId || p.patientName))).length : 0}
              </Typography>
              <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', fontWeight: 800, fontSize: { xs: '0.68rem', sm: '0.75rem' }, display: 'block' }}>
                Total Patients
              </Typography>
            </Card>
          </Grid>
        )}

        {/* Card 3: Completed Records */}
        <Grid item xs={6} sm={user?.role === 'doctor' ? 3 : 4}>
          <Card 
            className="glass-card-cream touch-active shimmer-card"
            onClick={() => setTabValue(1)}
            sx={{ cursor: 'pointer', p: { xs: 1.5, sm: 2 }, height: '100%', borderRadius: '18px' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
              <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(42, 107, 93, 0.12)', display: 'flex' }}>
                <HistoryIcon sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', fontSize: { xs: 18, sm: 22 } }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#123029', letterSpacing: '-0.03em', fontSize: { xs: '1.4rem', sm: '2rem' } }}>
              {completedPrescriptions.length}
            </Typography>
            <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', fontWeight: 800, fontSize: { xs: '0.68rem', sm: '0.75rem' }, display: 'block' }}>
              Completed Records
            </Typography>
          </Card>
        </Grid>

        {/* Card 4 (Patient only): Past Records */}
        {user?.role !== 'doctor' && (
          <Grid item xs={12} sm={4}>
            <Card 
              className="glass-card-cream touch-active shimmer-card"
              onClick={() => setTabValue(2)}
              sx={{ cursor: 'pointer', p: { xs: 1.5, sm: 2 }, height: '100%', borderRadius: '18px' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: 'rgba(19, 79, 77, 0.12)', color: '#134F4D', display: 'flex' }}>
                  <UploadIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#123029', letterSpacing: '-0.03em', fontSize: { xs: '1.4rem', sm: '2rem' } }}>
                {externalRecords.length}
              </Typography>
              <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', fontWeight: 800, fontSize: { xs: '0.68rem', sm: '0.75rem' }, display: 'block' }}>
                Past Records
              </Typography>
            </Card>
          </Grid>
        )}

        {/* Card 4 (Doctor only): + New Prescription */}
        {user?.role === 'doctor' && (
          <Grid item xs={6} sm={3}>
            <Card 
              className="glass-card-teal touch-active shimmer-card"
              onClick={() => navigate('/prescriptions/new')}
              sx={{ 
                cursor: 'pointer', 
                p: { xs: 1.5, sm: 2 }, 
                height: '100%',
                borderRadius: '18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(26, 49, 44, 0.9), rgba(42, 107, 93, 0.7)) !important'
                  : 'linear-gradient(135deg, rgba(137, 215, 183, 0.35), rgba(102, 205, 170, 0.25)) !important',
                border: `2px dashed ${mode === 'dark' ? 'rgba(102, 205, 170, 0.4)' : 'rgba(42, 107, 93, 0.3)'}`,
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(42, 107, 93, 0.2)',
                  borderColor: mode === 'dark' ? '#66CDAA' : '#1A312C'
                }
              }}
            >
              <Box sx={{ 
                p: 1, 
                borderRadius: '50%', 
                bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(42, 107, 93, 0.12)', 
                display: 'flex', 
                mb: 0.5 
              }}>
                <AddIcon sx={{ color: mode === 'dark' ? '#66CDAA' : '#1A312C', fontSize: { xs: 22, sm: 26 } }} />
              </Box>
              <Typography variant="caption" sx={{ 
                color: mode === 'dark' ? '#89D7B7' : '#1A312C', 
                fontWeight: 800, 
                fontSize: { xs: '0.68rem', sm: '0.75rem' },
                textAlign: 'center',
                lineHeight: 1.2
              }}>
                + New Prescription
              </Typography>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* ═══ Control Action Bar ═══ */}
      <Paper 
        className="glass-panel animate-slide-up"
        sx={{ 
          p: { xs: 1, sm: 1.5 }, 
          mb: 3, 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: { xs: 0.8, sm: 1 }, 
          alignItems: 'center',
          bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.94) !important',
          border: '1px solid var(--glass-border) !important',
          borderRadius: { xs: '18px', sm: '22px' }
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.8, sm: 1 }, py: 0.3, px: 0.3, width: '100%', alignItems: 'center' }}>
          {user?.role === 'doctor' ? (
            <>
              <Chip 
                icon={<PersonAddIcon sx={{ color: mode === 'dark' ? '#FAF2F5 !important' : '#123029 !important', fontSize: { xs: 16, sm: 18 } }} />}
                label="Manage Patients"
                clickable
                onClick={() => setTabValue(2)}
                sx={{ 
                  bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.25)' : 'rgba(42, 107, 93, 0.12)', 
                  color: mode === 'dark' ? '#FAF2F5' : '#123029', 
                  fontWeight: 800, 
                  fontSize: { xs: '0.76rem', sm: '0.84rem' },
                  px: { xs: 0.5, sm: 1 },
                  py: { xs: 1.8, sm: 2.2 },
                  borderRadius: '14px',
                  flex: '1 1 0',
                  border: '1px solid var(--color-mint)',
                  '&:hover': { bgcolor: 'rgba(102, 205, 170, 0.3)' }
                }} 
              />
              <Chip 
                icon={<EditIcon sx={{ color: mode === 'dark' ? '#FAF2F5 !important' : '#123029 !important', fontSize: { xs: 16, sm: 18 } }} />}
                label="Edit Your Profile"
                clickable
                onClick={() => navigate('/profile')}
                sx={{ 
                  bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.15)' : 'rgba(42, 107, 93, 0.08)', 
                  color: mode === 'dark' ? '#FAF2F5' : '#123029', 
                  fontWeight: 800, 
                  fontSize: { xs: '0.76rem', sm: '0.84rem' },
                  px: { xs: 0.5, sm: 1 },
                  py: { xs: 1.8, sm: 2.2 },
                  borderRadius: '14px',
                  flex: '1 1 0',
                  border: `1px solid ${mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(42, 107, 93, 0.15)'}`,
                  '&:hover': { bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.25)' : 'rgba(42, 107, 93, 0.12)' }
                }} 
              />
              <Chip 
                icon={<HospitalIcon sx={{ color: mode === 'dark' ? '#FAF2F5 !important' : '#123029 !important', fontSize: { xs: 16, sm: 18 } }} />}
                label="Referrals & Network"
                clickable
                onClick={() => navigate('/network')}
                sx={{ 
                  bgcolor: mode === 'dark' ? 'rgba(0, 200, 150, 0.2)' : 'rgba(0, 200, 150, 0.1)', 
                  color: mode === 'dark' ? '#FAF2F5' : '#123029', 
                  fontWeight: 800, 
                  fontSize: { xs: '0.76rem', sm: '0.84rem' },
                  px: { xs: 0.5, sm: 1 },
                  py: { xs: 1.8, sm: 2.2 },
                  borderRadius: '14px',
                  flex: '1 1 0',
                  border: '1px solid rgba(0, 200, 150, 0.4)',
                  '&:hover': { bgcolor: 'rgba(0, 200, 150, 0.3)' }
                }} 
              />
              <Chip 
                icon={<ActiveIcon sx={{ color: mode === 'dark' ? '#FAF2F5 !important' : '#123029 !important', fontSize: { xs: 16, sm: 18 } }} />}
                label="Billing & Invoices"
                clickable
                onClick={() => navigate('/billing')}
                sx={{ 
                  bgcolor: mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)', 
                  color: mode === 'dark' ? '#FAF2F5' : '#123029', 
                  fontWeight: 800, 
                  fontSize: { xs: '0.76rem', sm: '0.84rem' },
                  px: { xs: 0.5, sm: 1 },
                  py: { xs: 1.8, sm: 2.2 },
                  borderRadius: '14px',
                  flex: '1 1 0',
                  border: '1px solid rgba(33, 150, 243, 0.4)',
                  '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.3)' }
                }} 
              />
              <Chip 
                icon={<HospitalIcon sx={{ color: mode === 'dark' ? '#FAF2F5 !important' : '#123029 !important', fontSize: { xs: 16, sm: 18 } }} />}
                label="Home Care"
                clickable
                onClick={() => navigate('/home-care')}
                sx={{ 
                  bgcolor: mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)', 
                  color: mode === 'dark' ? '#FAF2F5' : '#123029', 
                  fontWeight: 800, 
                  fontSize: { xs: '0.76rem', sm: '0.84rem' },
                  px: { xs: 0.5, sm: 1 },
                  py: { xs: 1.8, sm: 2.2 },
                  borderRadius: '14px',
                  flex: '1 1 0',
                  border: '1px solid rgba(255, 152, 0, 0.4)',
                  '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.3)' }
                }} 
              />
            </>
          ) : (
            <>
              <Chip 
                icon={<UploadIcon sx={{ color: '#ffffff !important', fontSize: { xs: 16, sm: 18 } }} />}
                label="Upload Past Prescription"
                clickable
                onClick={() => setUploadPastRxModalOpen(true)}
                sx={{ 
                  bgcolor: '#134F4D', 
                  color: '#ffffff', 
                  fontWeight: 800, 
                  fontSize: { xs: '0.76rem', sm: '0.84rem' },
                  px: { xs: 0.5, sm: 1 },
                  py: { xs: 1.8, sm: 2.2 },
                  borderRadius: '14px',
                  flex: '1 1 0',
                  boxShadow: '0 4px 14px rgba(19, 79, 77, 0.3)',
                  '&:hover': { bgcolor: '#0e3b3a' }
                }} 
              />
              <Chip 
                icon={<ActiveIcon sx={{ color: mode === 'dark' ? '#FAF2F5 !important' : '#123029 !important', fontSize: { xs: 16, sm: 18 } }} />}
                label="My Invoices"
                clickable
                onClick={() => navigate('/billing')}
                sx={{ 
                  bgcolor: mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)', 
                  color: mode === 'dark' ? '#FAF2F5' : '#123029', 
                  fontWeight: 800, 
                  fontSize: { xs: '0.76rem', sm: '0.84rem' },
                  px: { xs: 0.5, sm: 1 },
                  py: { xs: 1.8, sm: 2.2 },
                  borderRadius: '14px',
                  flex: '1 1 0',
                  border: '1px solid rgba(33, 150, 243, 0.4)',
                  '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.3)' }
                }} 
              />
              <Chip 
                icon={<HospitalIcon sx={{ color: mode === 'dark' ? '#FAF2F5 !important' : '#123029 !important', fontSize: { xs: 16, sm: 18 } }} />}
                label="Home Care Visits"
                clickable
                onClick={() => navigate('/home-care')}
                sx={{ 
                  bgcolor: mode === 'dark' ? 'rgba(0, 200, 150, 0.2)' : 'rgba(0, 200, 150, 0.1)', 
                  color: mode === 'dark' ? '#FAF2F5' : '#123029', 
                  fontWeight: 800, 
                  fontSize: { xs: '0.76rem', sm: '0.84rem' },
                  px: { xs: 0.5, sm: 1 },
                  py: { xs: 1.8, sm: 2.2 },
                  borderRadius: '14px',
                  flex: '1 1 0',
                  border: '1px solid rgba(0, 200, 150, 0.4)',
                  '&:hover': { bgcolor: 'rgba(0, 200, 150, 0.3)' }
                }} 
              />
            </>
          )}
        </Box>
      </Paper>
      </Box>{/* end collapse wrapper */}

      {/* ═══ Segmented Glass Tabs & Content List ═══ */}
      <Paper 
        className="glass-panel animate-slide-up" 
        sx={{ 
          overflow: 'hidden',
          borderRadius: { xs: '20px', sm: '24px' },
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
              fontSize: { xs: '0.78rem', sm: '0.875rem' },
              color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#428475',
              py: { xs: 1.4, sm: 2 },
              px: { xs: 0.5, sm: 2 },
              minHeight: { xs: 46, sm: 54 },
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
          {user?.role !== 'doctor' && (
            <Tab 
              label={`Past Records (${externalRecords.length})`} 
              icon={<UploadIcon sx={{ fontSize: { xs: 15, sm: 18 }, color: tabValue === 2 ? (mode === 'dark' ? '#66CDAA' : '#1A312C') : (mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#428475') }} />} 
              iconPosition="start" 
            />
          )}
          {user?.role === 'doctor' && (
            <Tab 
              label="Patients" 
              icon={<PeopleIcon sx={{ fontSize: { xs: 15, sm: 18 }, color: tabValue === 2 ? (mode === 'dark' ? '#66CDAA' : '#1A312C') : (mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#428475') }} />} 
              iconPosition="start" 
            />
          )}
        </Tabs>
        
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: { xs: 4, sm: 6 } }}>
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
          <Box sx={{ width: '100%', p: { xs: 1.2, sm: 2 } }}>
            {/* Tab 0: Active Prescriptions */}
            {tabValue === 0 && (
              <Box className="animate-fade-in">
                {activePrescriptions.length === 0 ? (
                  <Box sx={{ py: { xs: 4, sm: 6 }, textAlign: 'center' }}>
                    <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'rgba(137, 215, 183, 0.2)', width: 64, height: 64, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <MedicationIcon sx={{ fontSize: 32, color: '#428475' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A312C', mb: 0.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      No Active Prescriptions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto', mb: 2.5, fontSize: '0.82rem' }}>
                      {searchQuery ? 'No records match your search criteria.' : 'Create a new digital prescription or view upcoming appointments.'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {user?.role === 'doctor' && (
                        <Chip 
                          label="+ Issue First Prescription" 
                          onClick={() => navigate('/prescriptions/new')}
                          sx={{ bgcolor: '#1A312C', color: '#89D7B7', fontWeight: 800, cursor: 'pointer', px: 1, py: 2 }}
                        />
                      )}
                      {user?.role !== 'doctor' && (
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
                      )}
                    </Box>
                  </Box>
                ) : (
                  <>
                    <List disablePadding>
                      {activePrescriptions.slice(0, activeLimit).map((prescription, idx) => (
                        <ListItem 
                          key={prescription.id || idx}
                          button 
                          onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                          className="touch-active"
                          sx={{ 
                            borderRadius: '16px', 
                            my: 1, 
                            p: { xs: 1.2, sm: 2 },
                            bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.6)' : 'rgba(255, 255, 255, 0.75)',
                            border: `1px solid ${mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(137, 215, 183, 0.4)'}`,
                            '&:hover': { bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.08)' : 'rgba(255, 255, 255, 0.95)' }
                          }}
                        >
                          <Box sx={{ p: { xs: 1, sm: 1.5 }, borderRadius: '14px', bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.12)' : 'rgba(66, 132, 117, 0.12)', mr: { xs: 1.2, sm: 2 }, display: 'flex', alignItems: 'center' }}>
                            <MedicationIcon sx={{ color: mode === 'dark' ? '#66CDAA' : '#428475', fontSize: { xs: 22, sm: 26 } }} />
                          </Box>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: { xs: '0.88rem', sm: '1rem' } }}>
                                  {prescription.medication || (prescription.provisionalDiagnosis && prescription.provisionalDiagnosis[0]) || 'Prescription Document'}
                                </Typography>
                                <Chip 
                                  label="Active" 
                                  size="small" 
                                  sx={{ 
                                    height: 18, 
                                    fontSize: '0.62rem', 
                                    fontWeight: 800,
                                    bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(42, 107, 93, 0.12)',
                                    color: mode === 'dark' ? '#66CDAA' : '#1A312C'
                                  }} 
                                />
                                {Boolean((prescription.investigations && prescription.investigations.length > 0) || (prescription.testsRequired && prescription.testsRequired.length > 0)) && (
                                  <Chip 
                                    label={(prescription.testReports && prescription.testReports.length > 0) ? `🧪 Reports (${prescription.testReports.length})` : '🧪 Tests Required'} 
                                    size="small" 
                                    sx={{ 
                                      height: 18, 
                                      fontSize: '0.62rem', 
                                      fontWeight: 800,
                                      bgcolor: (prescription.testReports && prescription.testReports.length > 0)
                                        ? (mode === 'dark' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                                        : (mode === 'dark' ? 'rgba(251, 191, 36, 0.22)' : 'rgba(217, 119, 6, 0.15)'),
                                      color: (prescription.testReports && prescription.testReports.length > 0)
                                        ? (mode === 'dark' ? '#34d399' : '#047857')
                                        : (mode === 'dark' ? '#fbbf24' : '#b45309'),
                                      border: `1px solid ${(prescription.testReports && prescription.testReports.length > 0)
                                        ? (mode === 'dark' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.3)')
                                        : (mode === 'dark' ? 'rgba(251, 191, 36, 0.4)' : 'rgba(217, 119, 6, 0.3)')}`
                                    }} 
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : '#64748b', fontSize: { xs: '0.72rem', sm: '0.78rem' }, display: 'block', mt: 0.3 }}>
                                Patient: {(prescription as any).patientName || 'Linked Patient'}
                                {(prescription as any).dosage ? ` • Dosage: ${(prescription as any).dosage}` : 
                                 (prescription as any).medications && (prescription as any).medications[0] ? ` • Dosage: ${(prescription as any).medications[0].dosage || 'As directed'}` : ' • Dosage: As directed'}
                                {'\n'}Issued: {prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                              </Typography>
                            }
                          />
                          <ChevronRightIcon sx={{ color: mode === 'dark' ? '#66CDAA' : '#428475', fontSize: { xs: 20, sm: 24 } }} />
                        </ListItem>
                      ))}
                    </List>

                    {/* Pagination / Expand Control */}
                    {activePrescriptions.length > 3 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
                        {activeLimit === 3 ? (
                          <Button
                            variant="outlined"
                            size="small"
                            endIcon={<ExpandMoreIcon />}
                            onClick={() => setActiveLimit(5)}
                            sx={{
                              borderRadius: '14px',
                              fontWeight: 800,
                              textTransform: 'none',
                              color: mode === 'dark' ? '#66CDAA' : '#134F4D',
                              borderColor: mode === 'dark' ? 'rgba(102, 205, 170, 0.4)' : 'rgba(19, 79, 77, 0.4)',
                              px: 3,
                              py: 0.9,
                              fontSize: '0.85rem',
                              '&:hover': {
                                borderColor: mode === 'dark' ? '#66CDAA' : '#134F4D',
                                bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.08)' : 'rgba(19, 79, 77, 0.08)'
                              }
                            }}
                          >
                            Expand (Show {Math.min(activePrescriptions.length, 5)})
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            endIcon={<ChevronRightIcon />}
                            onClick={() => navigate('/prescriptions')}
                            sx={{
                              borderRadius: '14px',
                              fontWeight: 800,
                              textTransform: 'none',
                              bgcolor: '#134F4D',
                              color: '#ffffff',
                              px: 3,
                              py: 0.9,
                              fontSize: '0.85rem',
                              '&:hover': { bgcolor: '#0e3b3a' }
                            }}
                          >
                            Manage Prescriptions
                          </Button>
                        )}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}

            {/* Tab 1: Completed Prescriptions */}
            {tabValue === 1 && (
              <Box className="animate-fade-in">
                {completedPrescriptions.length === 0 ? (
                  <Box sx={{ py: { xs: 4, sm: 6 }, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A312C', mb: 0.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      No Completed Records
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                      Completed prescription treatments will appear here.
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {completedPrescriptions.map((prescription, idx) => (
                      <ListItem 
                        key={prescription.id || idx} 
                        button 
                        onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                        sx={{ 
                          borderRadius: '16px', 
                          my: 1, 
                          p: { xs: 1.2, sm: 2 },
                          bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.6)' : 'rgba(255, 255, 255, 0.75)',
                          border: `1px solid ${mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(137, 215, 183, 0.4)'}`
                        }}
                      >
                        <ListItemText 
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: { xs: '0.88rem', sm: '1rem' } }}>
                              {prescription.medication || 'Prescription Document'}
                            </Typography>
                          }
                          secondary={`Patient: ${(prescription as any).patientName || 'Linked Patient'}`}
                        />
                        <ChevronRightIcon sx={{ color: mode === 'dark' ? '#66CDAA' : '#428475' }} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* Tab 2 (Patient): Past Records */}
            {tabValue === 2 && user?.role !== 'doctor' && (
              <Box className="animate-fade-in">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      Past / External Prescriptions & Reports
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.78rem' } }}>
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
                  <Box sx={{ py: { xs: 4, sm: 6 }, textAlign: 'center', bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: '20px', p: 3 }}>
                    <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'rgba(19, 79, 77, 0.1)', width: 56, height: 56, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <UploadIcon sx={{ fontSize: 28, color: '#134F4D' }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', mb: 0.5, fontSize: { xs: '0.92rem', sm: '1rem' } }}>
                      No Past Prescriptions Uploaded
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340, mx: 'auto', mb: 2.5, fontSize: '0.8rem' }}>
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
                        fontSize: '0.82rem',
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
                            justifyContent: 'space-between',
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

            {/* Tab 2 (Doctor): Patients Management */}
            {tabValue === 2 && user?.role === 'doctor' && (
              <Box className="animate-fade-in" sx={{ width: '100%' }}>
                <EnhancedPatientManagement maxPatients={5} searchQuery={searchQuery} />
              </Box>
            )}
          </Box>
        )}
      </Paper>
        </Grid>

        {/* ═══ Right Sidebar ═══ */}
        {!isMobilePortal && (
          <Grid item xs={12} md={5} lg={4}>
            {/* Upcoming Appointments */}
            <Card 
              className="glass-card-cream animate-slide-up"
              sx={{ 
                mb: 3, 
                borderRadius: '20px',
                border: `1.5px solid ${mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(137, 215, 183, 0.4)'}`,
                bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.85) !important' : 'rgba(255, 255, 255, 0.95) !important',
                boxShadow: '0 4px 24px rgba(42, 107, 93, 0.08)',
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      p: 1.2, 
                      borderRadius: '14px', 
                      bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.15)' : 'rgba(42, 107, 93, 0.1)', 
                      display: 'flex' 
                    }}>
                      <CalendarIcon sx={{ color: mode === 'dark' ? '#66CDAA' : '#1A312C', fontSize: 22 }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }}>
                      Upcoming Appointments
                    </Typography>
                  </Box>
                  <Badge 
                    badgeContent={upcomingAppointments.length} 
                    color="primary"
                    sx={{ 
                      '& .MuiBadge-badge': { 
                        bgcolor: '#1A312C', 
                        color: '#ffffff', 
                        fontWeight: 800, 
                        fontSize: '0.75rem',
                        minWidth: 24,
                        height: 24,
                        borderRadius: '12px'
                      } 
                    }}
                  />
                </Box>

                {upcomingAppointments.length === 0 ? (
                  <Box sx={{ 
                    py: 3, 
                    textAlign: 'center',
                    bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.05)' : 'rgba(137, 215, 183, 0.08)',
                    borderRadius: '14px',
                    border: `1px dashed ${mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(42, 107, 93, 0.15)'}`
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#428475', 
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}>
                      No follow-up appointments scheduled.
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding dense>
                    {upcomingAppointments.map((apt, idx) => (
                      <React.Fragment key={apt.id}>
                        <ListItem 
                          button 
                          onClick={() => navigate(`/prescriptions/${apt.id}`)}
                          sx={{ 
                            borderRadius: '12px', 
                            py: 1.2, 
                            px: 1.5,
                            mb: 0.5,
                            bgcolor: apt.isToday 
                              ? (mode === 'dark' ? 'rgba(102, 205, 170, 0.12)' : 'rgba(42, 107, 93, 0.06)')
                              : 'transparent',
                            '&:hover': { bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.1)' : 'rgba(42, 107, 93, 0.04)' }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: '0.85rem' }}>
                                  {apt.patientName}
                                </Typography>
                                <Chip 
                                  label={apt.dateStr} 
                                  size="small" 
                                  sx={{ 
                                    height: 22, 
                                    fontSize: '0.7rem', 
                                    fontWeight: 800,
                                    bgcolor: apt.isToday ? '#1A312C' : (mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(42, 107, 93, 0.1)'),
                                    color: apt.isToday ? '#89D7B7' : (mode === 'dark' ? '#89D7B7' : '#1A312C')
                                  }} 
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.55)' : '#64748b', fontSize: '0.75rem' }}>
                                {apt.purpose}{apt.timeStr ? ` • ${apt.timeStr}` : ''}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {idx < upcomingAppointments.length - 1 && <Divider sx={{ mx: 1 }} />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            {/* Clinical Quick Tools */}
            {user?.role === 'doctor' && (
              <Card 
                className="glass-card-cream animate-slide-up"
                sx={{ 
                  mb: 3, 
                  borderRadius: '20px',
                  border: `1.5px solid ${mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(137, 215, 183, 0.4)'}`,
                  bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.85) !important' : 'rgba(255, 255, 255, 0.95) !important',
                  boxShadow: '0 4px 24px rgba(42, 107, 93, 0.08)'
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ 
                      p: 1.2, 
                      borderRadius: '14px', 
                      bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.15)' : 'rgba(42, 107, 93, 0.1)', 
                      display: 'flex' 
                    }}>
                      <StethoscopeIcon sx={{ color: mode === 'dark' ? '#66CDAA' : '#1A312C', fontSize: 22 }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }}>
                      Clinical Quick Tools
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/prescriptions/new')}
                      sx={{
                        bgcolor: '#1A312C',
                        color: '#89D7B7',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        borderRadius: '16px',
                        py: 1.5,
                        textTransform: 'none',
                        boxShadow: '0 4px 16px rgba(26, 49, 44, 0.3)',
                        '&:hover': { bgcolor: '#142520', boxShadow: '0 6px 20px rgba(26, 49, 44, 0.4)' }
                      }}
                    >
                      + Issue Digital Prescription
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<QrIcon />}
                      onClick={() => setQrScannerOpen(true)}
                      sx={{
                        borderColor: mode === 'dark' ? 'rgba(102, 205, 170, 0.35)' : 'rgba(42, 107, 93, 0.25)',
                        color: mode === 'dark' ? '#89D7B7' : '#1A312C',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        borderRadius: '16px',
                        py: 1.3,
                        textTransform: 'none',
                        '&:hover': { 
                          borderColor: mode === 'dark' ? '#66CDAA' : '#1A312C',
                          bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.08)' : 'rgba(42, 107, 93, 0.04)'
                        }
                      }}
                    >
                      Scan Patient Rx QR Code
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<MedicalInfoIcon />}
                      onClick={() => navigate('/prescriptions/all')}
                      sx={{
                        borderColor: mode === 'dark' ? 'rgba(102, 205, 170, 0.35)' : 'rgba(42, 107, 93, 0.25)',
                        color: mode === 'dark' ? '#89D7B7' : '#1A312C',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        borderRadius: '16px',
                        py: 1.3,
                        textTransform: 'none',
                        '&:hover': { 
                          borderColor: mode === 'dark' ? '#66CDAA' : '#1A312C',
                          bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.08)' : 'rgba(42, 107, 93, 0.04)'
                        }
                      }}
                    >
                      Browse All Prescriptions
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Practice Insights Overview */}
            <Card 
              className="glass-card-cream animate-slide-up"
              sx={{ 
                borderRadius: '20px',
                border: `1.5px solid ${mode === 'dark' ? 'rgba(102, 205, 170, 0.2)' : 'rgba(137, 215, 183, 0.4)'}`,
                bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.85) !important' : 'rgba(255, 255, 255, 0.95) !important',
                boxShadow: '0 4px 24px rgba(42, 107, 93, 0.08)'
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: 2.5 } }}>
                <Typography 
                  variant="overline" 
                  sx={{ 
                    fontWeight: 900, 
                    color: mode === 'dark' ? '#66CDAA' : '#1A312C', 
                    letterSpacing: '0.1em',
                    fontSize: '0.72rem',
                    display: 'block',
                    mb: 2
                  }}
                >
                  PRACTICE INSIGHTS OVERVIEW
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    py: 1.8,
                    borderBottom: `1px solid ${mode === 'dark' ? 'rgba(102, 205, 170, 0.12)' : 'rgba(0,0,0,0.06)'}`
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: '0.88rem' }}>
                      Active Prescriptions
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#66CDAA' : '#1A312C', fontSize: '1.1rem' }}>
                      {activePrescriptions.length}
                    </Typography>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    py: 1.8,
                    borderBottom: `1px solid ${mode === 'dark' ? 'rgba(102, 205, 170, 0.12)' : 'rgba(0,0,0,0.06)'}`
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: '0.88rem' }}>
                      Completed Records
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#66CDAA' : '#428475', fontSize: '1.1rem' }}>
                      {completedPrescriptions.length}
                    </Typography>
                  </Box>

                  {user?.role === 'doctor' && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      py: 1.8
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: '0.88rem' }}>
                        DigiLocker Status
                      </Typography>
                      {Boolean(user?.digilockerVerified || digilockerVerified === true) ? (
                        <Chip 
                          label="VERIFIED ✓" 
                          size="small" 
                          sx={{ 
                            height: 26,
                            fontSize: '0.72rem', 
                            fontWeight: 900,
                            bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.15)' : 'rgba(46, 125, 50, 0.12)',
                            color: mode === 'dark' ? '#66CDAA' : '#2e7d32',
                            border: `1px solid ${mode === 'dark' ? 'rgba(102, 205, 170, 0.3)' : 'rgba(46, 125, 50, 0.3)'}`,
                            borderRadius: '8px'
                          }} 
                        />
                      ) : (
                        <Chip 
                          label="NOT VERIFIED" 
                          size="small" 
                          sx={{ 
                            height: 26,
                            fontSize: '0.72rem', 
                            fontWeight: 900,
                            bgcolor: 'rgba(255, 152, 0, 0.1)',
                            color: '#e65100',
                            border: '1px solid rgba(255, 152, 0, 0.3)',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setDigilockerLoading(true);
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>

    <DigiLockerWarmupModal
      open={digilockerLoading}
      onClose={() => setDigilockerLoading(false)}
    />

    <UploadPastPrescriptionModal
      open={uploadPastRxModalOpen}
      onClose={() => setUploadPastRxModalOpen(false)}
      onSuccess={fetchExternalRecords}
    />

    <QrScannerModal
      open={qrScannerOpen}
      onClose={() => setQrScannerOpen(false)}
      onScanSuccess={handleQrScanSuccess}
    />

    <PrescriptionBirthYearModal
      open={birthYearModalOpen}
      onClose={() => setBirthYearModalOpen(false)}
      prescriptionData={scannedRxForVerification}
      onVerified={handleBirthYearVerified}
    />

    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert severity={snackbar.severity as any} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} sx={{ borderRadius: '12px', fontWeight: 600 }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
    </>
  );
};

export default Dashboard;
