import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Avatar,
  Tab,
  Tabs,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  Divider,
  InputAdornment
} from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import StopIcon from '@mui/icons-material/Stop';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckIcon from '@mui/icons-material/Check';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CloseIcon from '@mui/icons-material/Close';
import NearMeIcon from '@mui/icons-material/NearMe';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import SpaIcon from '@mui/icons-material/Spa';
import ScienceIcon from '@mui/icons-material/Science';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PhoneIcon from '@mui/icons-material/Phone';

import QRCode from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';

import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { healthcareApi } from '../services/healthcareExtensionsApi';
import { getCachedData, subscribeToCache } from '../services/apiCache';
import api from '../services/api';

export default function DoctorNetworkPortal() {
  const { user } = useAuth();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  // ─── THEME TOKENS ───
  const themeColors = {
    primary: isDark ? '#00C896' : '#2A6B5D',
    primaryHover: isDark ? '#00A87E' : '#1E4D43',
    primaryContrast: isDark ? '#0B1315' : '#FFFFFF',
    primaryBgLight: isDark ? 'rgba(0,200,150,0.15)' : 'rgba(42,107,93,0.12)',
    primaryBorder: isDark ? 'rgba(0,200,150,0.3)' : 'rgba(42,107,93,0.25)',
    
    bgPaper: isDark ? '#131F22' : '#FFFFFF',
    bgInput: isDark ? '#0B1315' : '#F4F8F6',
    
    headerGradient: isDark 
      ? 'linear-gradient(135deg, #132724 0%, #0D1F1C 100%)' 
      : 'linear-gradient(135deg, #E6F7F2 0%, #D4EFE8 100%)',
    headerBorder: isDark ? '1px solid rgba(0,200,150,0.25)' : '1px solid rgba(42,107,93,0.25)',
    
    verifiedCardBg: isDark 
      ? 'linear-gradient(135deg, #132724 0%, #0F1C1B 100%)' 
      : 'linear-gradient(135deg, #F0FAF7 0%, #E6F5F0 100%)',
      
    textPrimary: isDark ? '#EBF5F3' : '#123029',
    textSecondary: isDark ? '#94A8A3' : '#4D756C',
    borderLight: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    
    qrBg: isDark ? '#0B1315' : '#FFFFFF',
    qrFg: isDark ? '#00C896' : '#2A6B5D',
  };

  const [tab, setTab] = useState(0);

  // ─── NEARBY PROFESSIONALS STATE ───
  const [nearbyProfessionals, setNearbyProfessionals] = useState<any[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState('');
  const [nearbyCategory, setNearbyCategory] = useState('all');
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [nearbyFetched, setNearbyFetched] = useState(false);

  // Instant SWR state initialization from memory cache
  const [network, setNetwork] = useState<any[]>(() => {
    const cached = getCachedData<any>('doctor_network');
    return cached?.network || (Array.isArray(cached) ? cached : []);
  });
  const [outgoingReferrals, setOutgoingReferrals] = useState<any[]>(() => {
    const cached = getCachedData<any>('referrals_outgoing');
    return cached?.referrals || (Array.isArray(cached) ? cached : []);
  });
  const [incomingReferrals, setIncomingReferrals] = useState<any[]>(() => {
    const cached = getCachedData<any>('referrals_incoming');
    return cached?.referrals || (Array.isArray(cached) ? cached : []);
  });
  const [myPatients, setMyPatients] = useState<any[]>(() => {
    const cached = getCachedData<any>('users_my_patients');
    return cached?.patients || (Array.isArray(cached) ? cached : []);
  });

  const hasCache = network.length > 0 || outgoingReferrals.length > 0 || incomingReferrals.length > 0;
  const [loading, setLoading] = useState(!hasCache);
  const [toast, setToast] = useState('');

  // ─── INVITE & VERIFICATION STATE ───
  const [inviteMethod, setInviteMethod] = useState<'email' | 'id' | 'qr'>('email');
  const [lookupQuery, setLookupQuery] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifiedDoctor, setVerifiedDoctor] = useState<any | null>(null);

  // QR Scanning State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ─── MY DOCTOR NETWORK CARD MODAL ───
  const [myCardDialogOpen, setMyCardDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ─── REFERRAL MODAL STATE ───
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [referralMode, setReferralMode] = useState<'network' | 'quick_lookup'>('network');
  const [referralQuickQuery, setReferralQuickQuery] = useState('');
  const [referralQuickVerified, setReferralQuickVerified] = useState<any | null>(null);
  const [referralQuickLoading, setReferralQuickLoading] = useState(false);
  const [referralQuickError, setReferralQuickError] = useState('');
  const [referralForm, setReferralForm] = useState({
    patientId: '',
    referredDoctorId: '',
    reason: '',
    clinicalSummary: '',
    priority: 'routine'
  });

  const fetchData = async (isBackground = false) => {
    if (!hasCache && !isBackground) {
      setLoading(true);
    }
    try {
      const [netRes, outRes, inRes, patRes] = await Promise.all([
        healthcareApi.getDoctorNetwork(),
        healthcareApi.getOutgoingReferrals(),
        healthcareApi.getIncomingReferrals(),
        api.get('/users/patients/my-patients').catch(() => ({ data: { patients: [] } }))
      ]);

      if (netRes.success) setNetwork(netRes.network || []);
      if (outRes.success) setOutgoingReferrals(outRes.referrals || []);
      if (inRes.success) setIncomingReferrals(inRes.referrals || []);
      if (patRes?.data?.patients) setMyPatients(patRes.data.patients || []);
    } catch (err) {
      console.error('Error fetching doctor network data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(hasCache);

    // Subscribe to real-time background cache revalidations
    const unsubNet = subscribeToCache('doctor_network', (data: any) => {
      if (data?.network) setNetwork(data.network);
    });
    const unsubOut = subscribeToCache('referrals_outgoing', (data: any) => {
      if (data?.referrals) setOutgoingReferrals(data.referrals);
    });
    const unsubIn = subscribeToCache('referrals_incoming', (data: any) => {
      if (data?.referrals) setIncomingReferrals(data.referrals);
    });

    return () => {
      unsubNet();
      unsubOut();
      unsubIn();
    };
  }, []);

  // Cleanup camera scanner on unmount or tab change
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [tab]);

  // ─── VERIFY DOCTOR ACTION ───
  const handleVerifyDoctor = async (overrideQuery?: string) => {
    const q = (overrideQuery || lookupQuery).trim();
    if (!q) {
      setVerifyError('Please enter an email ID or Doctor ID');
      return;
    }

    setVerifying(true);
    setVerifyError('');
    setVerifiedDoctor(null);

    try {
      const res = await healthcareApi.verifyDoctor(q, inviteMethod);
      if (res.success && res.doctor) {
        setVerifiedDoctor(res.doctor);
      } else {
        setVerifyError(res.message || 'Doctor not found. Please check the email or Doctor ID.');
      }
    } catch (err: any) {
      setVerifyError(err.response?.data?.message || 'No registered doctor found matching the entered details.');
    } finally {
      setVerifying(false);
    }
  };

  // ─── QR SCANNER FUNCTIONS ───
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setScanError('');
      setVerifyError('');
      
      // Allow DOM to render div
      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode('doctor-network-qr-reader');
          scannerRef.current = html5QrCode;
          await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText) => {
              handleQrDecoded(decodedText);
              stopCamera();
            },
            () => {
              // ignore frame errors
            }
          );
        } catch (err: any) {
          setScanError(err.message || 'Camera access denied or unavailable.');
          setIsCameraActive(false);
        }
      }, 200);
    } catch (err: any) {
      setScanError(err.message || 'Could not start camera');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.error('Error stopping scanner', e);
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setScanLoading(true);
      setScanError('');
      setVerifyError('');
      const html5QrCode = new Html5Qrcode('doctor-network-qr-file-reader');
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      handleQrDecoded(decodedText);
    } catch (err: any) {
      setScanError('Could not find a valid QR code in this image. Please upload a clear photo.');
    } finally {
      setScanLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleQrDecoded = (decodedText: string) => {
    setLookupQuery(decodedText);
    handleVerifyDoctor(decodedText);
  };

  // ─── CONNECT & DISCONNECT ACTIONS ───
  const handleConnect = async (targetDoctorId: string) => {
    try {
      const res = await healthcareApi.connectDoctor(targetDoctorId);
      if (res.success) {
        setToast('Colleague successfully added to your trusted doctor network!');
        if (verifiedDoctor && verifiedDoctor.id === targetDoctorId) {
          setVerifiedDoctor({ ...verifiedDoctor, isConnected: true });
        }
        fetchData(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to connect with doctor');
    }
  };

  const handleDisconnect = async (targetDoctorId: string, doctorName: string) => {
    if (!confirm(`Are you sure you want to remove ${doctorName} from your network?`)) return;
    try {
      const res = await healthcareApi.removeDoctorFromNetwork(targetDoctorId);
      if (res.success) {
        setToast(`${doctorName} removed from your network`);
        if (verifiedDoctor && verifiedDoctor.id === targetDoctorId) {
          setVerifiedDoctor({ ...verifiedDoctor, isConnected: false });
        }
        fetchData(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove doctor from network');
    }
  };

  // ─── COPY TO CLIPBOARD HELPER ───
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // ─── REFERRAL QUICK LOOKUP ───
  const handleReferralQuickLookup = async () => {
    if (!referralQuickQuery.trim()) return;
    setReferralQuickLoading(true);
    setReferralQuickError('');
    setReferralQuickVerified(null);
    try {
      const res = await healthcareApi.verifyDoctor(referralQuickQuery.trim());
      if (res.success && res.doctor) {
        setReferralQuickVerified(res.doctor);
        setReferralForm(prev => ({ ...prev, referredDoctorId: res.doctor.id }));
      } else {
        setReferralQuickError(res.message || 'Doctor not found.');
      }
    } catch (err: any) {
      setReferralQuickError(err.response?.data?.message || 'No registered doctor found with this email or ID.');
    } finally {
      setReferralQuickLoading(false);
    }
  };

  const handleSendReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralForm.patientId || !referralForm.referredDoctorId || !referralForm.reason) {
      alert('Please select patient, recipient doctor, and referral reason.');
      return;
    }

    try {
      const res = await healthcareApi.createReferral(referralForm);
      if (res.success) {
        setToast('Patient referred successfully! Colleague has been notified.');
        setReferralDialogOpen(false);
        setReferralForm({ patientId: '', referredDoctorId: '', reason: '', clinicalSummary: '', priority: 'routine' });
        setReferralQuickVerified(null);
        setReferralQuickQuery('');
        fetchData(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create referral');
    }
  };

  const handleUpdateReferralStatus = async (referralId: string, status: string) => {
    try {
      const res = await healthcareApi.updateReferralStatus(referralId, status);
      if (res.success) {
        setToast(`Referral status updated to "${status.toUpperCase()}"`);
        fetchData(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update referral status');
    }
  };

  const doctorQrPayload = JSON.stringify({
    type: 'medizo_doctor_network',
    doctorId: user?.id,
    email: user?.email,
    name: `Dr. ${user?.firstName} ${user?.lastName}`,
    specialization: user?.specialization || 'Medical Specialist'
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '85vh' }}>
      {/* Hidden container for file scanning */}
      <div id="doctor-network-qr-file-reader" style={{ display: 'none' }} />

      {/* Header Banner */}
      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 4,
          borderRadius: '20px',
          background: themeColors.headerGradient,
          border: themeColors.headerBorder,
          boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 6px 20px rgba(42,107,93,0.08)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: themeColors.primary,
                color: themeColors.primaryContrast,
                fontWeight: 900,
                fontSize: '1.6rem',
                boxShadow: isDark ? '0 0 20px rgba(0,200,150,0.45)' : '0 4px 16px rgba(42,107,93,0.3)'
              }}
            >
              <HubIcon sx={{ fontSize: '2.2rem' }} />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: themeColors.textPrimary }}>
                  Doctor Network & Referrals
                </Typography>
                <Chip
                  icon={<ShieldIcon sx={{ fontSize: '0.9rem !important', color: themeColors.primary }} />}
                  label="Privacy-First"
                  size="small"
                  sx={{
                    bgcolor: themeColors.primaryBgLight,
                    color: themeColors.primary,
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    border: `1px solid ${themeColors.primaryBorder}`
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: themeColors.primary, fontWeight: 700, mt: 0.3 }}>
                Dr. {user?.firstName} {user?.lastName} • {user?.specialization || 'Medical Specialist'}
              </Typography>
              <Typography variant="caption" sx={{ color: themeColors.textSecondary }}>
                {network.length} Trusted Colleagues • {outgoingReferrals.length} Outgoing • {incomingReferrals.length} Incoming Referrals
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => setMyCardDialogOpen(true)}
              startIcon={<QrCode2Icon />}
              sx={{
                color: themeColors.primary,
                borderColor: themeColors.primaryBorder,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: isDark ? 'rgba(0,200,150,0.06)' : 'rgba(42,107,93,0.06)',
                '&:hover': { bgcolor: isDark ? 'rgba(0,200,150,0.15)' : 'rgba(42,107,93,0.12)', borderColor: themeColors.primary }
              }}
            >
              My Network Card & QR
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setReferralDialogOpen(true);
                setReferralMode('network');
              }}
              startIcon={<SendIcon />}
              sx={{
                bgcolor: themeColors.primary,
                color: themeColors.primaryContrast,
                fontWeight: 800,
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: isDark ? '0 4px 14px rgba(0,200,150,0.3)' : '0 4px 14px rgba(42,107,93,0.25)',
                '&:hover': { bgcolor: themeColors.primaryHover }
              }}
            >
              Refer Patient
            </Button>
          </Box>
        </Box>
      </Paper>

      {toast && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: '14px',
            bgcolor: themeColors.primaryBgLight,
            color: themeColors.primary,
            border: `1px solid ${themeColors.primaryBorder}`,
            fontWeight: 600
          }}
          onClose={() => setToast('')}
        >
          {toast}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3, bgcolor: themeColors.bgPaper, borderRadius: '16px', border: `1px solid ${themeColors.borderLight}`, boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Tabs
          value={tab}
          onChange={(e, val) => {
            setTab(val);
            if (isCameraActive) stopCamera();
          }}
          textColor="inherit"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': { bgcolor: themeColors.primary, height: 3 },
            '& .MuiTab-root': {
              color: themeColors.textSecondary,
              fontWeight: 700,
              textTransform: 'none',
              py: 2,
              px: { xs: 2, md: 3 },
              '&.Mui-selected': { color: themeColors.primary }
            }
          }}
        >
          <Tab icon={<HubIcon sx={{ mr: 1 }} />} iconPosition="start" label={`My Network (${network.length})`} />
          <Tab icon={<PersonAddIcon sx={{ mr: 1 }} />} iconPosition="start" label="Invite & Connect Doctor" />
          <Tab icon={<SendIcon sx={{ mr: 1 }} />} iconPosition="start" label={`Outgoing Referrals (${outgoingReferrals.length})`} />
          <Tab icon={<SwapHorizIcon sx={{ mr: 1 }} />} iconPosition="start" label={`Incoming Referrals (${incomingReferrals.length})`} />
          <Tab icon={<NearMeIcon sx={{ mr: 1 }} />} iconPosition="start" label="Nearby" />
        </Tabs>
      </Paper>

      {loading && !hasCache ? (
        <Box sx={{ p: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: themeColors.primary }} />
        </Box>
      ) : (
        <Box>
          {/* ══════════════════════════════════════════════════════════════
             TAB 0: MY NETWORK
             ══════════════════════════════════════════════════════════════ */}
          <Box sx={{ display: tab === 0 ? 'block' : 'none' }} className={tab === 0 ? 'animate-slide-up' : ''}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: themeColors.textPrimary }}>
                Connected Doctors ({network.length})
              </Typography>
              <Button
                size="small"
                onClick={() => setTab(1)}
                startIcon={<PersonAddIcon />}
                sx={{ color: themeColors.primary, textTransform: 'none', fontWeight: 700 }}
              >
                + Invite Another Colleague
              </Button>
            </Box>

            <Grid container spacing={2.5}>
              {network.length === 0 ? (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 5,
                      textAlign: 'center',
                      bgcolor: themeColors.bgPaper,
                      borderRadius: '16px',
                      border: isDark ? '1px dashed rgba(255,255,255,0.15)' : '1px dashed rgba(42,107,93,0.25)',
                      boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)'
                    }}
                  >
                    <Avatar sx={{ width: 64, height: 64, bgcolor: themeColors.primaryBgLight, color: themeColors.primary, mx: 'auto', mb: 2 }}>
                      <HubIcon sx={{ fontSize: '2rem' }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ color: themeColors.textPrimary, fontWeight: 800, mb: 1 }}>
                      No Doctors in Your Network Yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeColors.textSecondary, maxWidth: 460, mx: 'auto', mb: 3 }}>
                      To protect doctor privacy, platform doctors are not publicly listed. Invite and connect with your colleagues using their <strong>Email ID</strong>, <strong>Doctor ID</strong>, or <strong>QR Code</strong>.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => setTab(1)}
                      startIcon={<PersonAddIcon />}
                      sx={{ bgcolor: themeColors.primary, color: themeColors.primaryContrast, fontWeight: 800, borderRadius: '12px', textTransform: 'none', '&:hover': { bgcolor: themeColors.primaryHover } }}
                    >
                      Invite Colleague Doctor
                    </Button>
                  </Paper>
                </Grid>
              ) : (
                network.map((doc) => (
                  <Grid item xs={12} md={6} key={doc.id || doc.connectedDoctorId}>
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: '16px',
                        bgcolor: themeColors.bgPaper,
                        border: `1px solid ${themeColors.borderLight}`,
                        boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.04)',
                        transition: 'transform 0.2s, border-color 0.2s',
                        '&:hover': { borderColor: themeColors.primaryBorder, transform: 'translateY(-2px)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={doc.profileImage || ''}
                            sx={{
                              bgcolor: themeColors.primary,
                              color: themeColors.primaryContrast,
                              fontWeight: 800,
                              width: 52,
                              height: 52,
                              fontSize: '1.2rem'
                            }}
                          >
                            {doc.firstName?.charAt(0) || 'D'}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: themeColors.textPrimary }}>
                              Dr. {doc.firstName} {doc.lastName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                              <Chip
                                label={doc.specialization || 'Physician'}
                                size="small"
                                sx={{
                                  bgcolor: themeColors.primaryBgLight,
                                  color: themeColors.primary,
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  height: 22
                                }}
                              />
                              {doc.email && (
                                <Typography variant="caption" sx={{ color: themeColors.textSecondary }}>
                                  {doc.email}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Box>

                      {doc.clinicName && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: themeColors.textSecondary, mb: 2, fontSize: '0.85rem' }}>
                          <LocationOnIcon sx={{ fontSize: '1rem', color: themeColors.primary }} />
                          <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                            {doc.clinicName} {doc.clinicAddress ? `• ${doc.clinicAddress}` : ''}
                          </Typography>
                        </Box>
                      )}

                      <Divider sx={{ borderColor: themeColors.borderLight, my: 2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setReferralForm(prev => ({ ...prev, referredDoctorId: doc.connectedDoctorId || doc.id }));
                            setReferralDialogOpen(true);
                            setReferralMode('network');
                          }}
                          startIcon={<SendIcon sx={{ fontSize: '1rem' }} />}
                          sx={{
                            bgcolor: themeColors.primary,
                            color: themeColors.primaryContrast,
                            fontWeight: 800,
                            borderRadius: '10px',
                            textTransform: 'none',
                            '&:hover': { bgcolor: themeColors.primaryHover }
                          }}
                        >
                          Refer Patient
                        </Button>

                        <Button
                          size="small"
                          variant="text"
                          color="error"
                          onClick={() => handleDisconnect(doc.connectedDoctorId || doc.id, `Dr. ${doc.firstName} ${doc.lastName}`)}
                          startIcon={<PersonRemoveIcon sx={{ fontSize: '1rem' }} />}
                          sx={{
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 700,
                            color: '#FF6B6B',
                            '&:hover': { bgcolor: 'rgba(255,107,107,0.1)' }
                          }}
                        >
                          Disconnect
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>

          {/* ══════════════════════════════════════════════════════════════
             TAB 1: INVITE & CONNECT DOCTOR (PRIVACY-FIRST TARGETED LOOKUP)
             ══════════════════════════════════════════════════════════════ */}
          <Box sx={{ display: tab === 1 ? 'block' : 'none' }} className={tab === 1 ? 'animate-slide-up' : ''}>
            <Box sx={{ maxWidth: 850, mx: 'auto' }}>
              <Paper
                sx={{
                  p: { xs: 2.5, md: 4 },
                  borderRadius: '20px',
                  bgcolor: themeColors.bgPaper,
                  border: `1px solid ${themeColors.borderLight}`,
                  boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.04)'
                }}
              >
                {/* Privacy notice header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: themeColors.primaryBgLight, color: themeColors.primary, width: 44, height: 44 }}>
                    <LockIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: themeColors.textPrimary }}>
                      Targeted Doctor Invite & Verification
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeColors.textSecondary }}>
                      Protecting doctor privacy: verify colleagues directly via registered email, Doctor ID, or QR code.
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: themeColors.borderLight, my: 2.5 }} />

                {/* Invite Mode Selector */}
                <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                  <Button
                    variant={inviteMethod === 'email' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setInviteMethod('email');
                      setVerifyError('');
                      if (isCameraActive) stopCamera();
                    }}
                    startIcon={<EmailIcon />}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: inviteMethod === 'email' ? themeColors.primary : 'transparent',
                      color: inviteMethod === 'email' ? themeColors.primaryContrast : themeColors.textSecondary,
                      borderColor: inviteMethod === 'email' ? themeColors.primary : themeColors.borderLight,
                      '&:hover': { bgcolor: inviteMethod === 'email' ? themeColors.primaryHover : themeColors.primaryBgLight }
                    }}
                  >
                    By Email Address
                  </Button>

                  <Button
                    variant={inviteMethod === 'id' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setInviteMethod('id');
                      setVerifyError('');
                      if (isCameraActive) stopCamera();
                    }}
                    startIcon={<BadgeIcon />}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: inviteMethod === 'id' ? themeColors.primary : 'transparent',
                      color: inviteMethod === 'id' ? themeColors.primaryContrast : themeColors.textSecondary,
                      borderColor: inviteMethod === 'id' ? themeColors.primary : themeColors.borderLight,
                      '&:hover': { bgcolor: inviteMethod === 'id' ? themeColors.primaryHover : themeColors.primaryBgLight }
                    }}
                  >
                    By Doctor ID
                  </Button>

                  <Button
                    variant={inviteMethod === 'qr' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setInviteMethod('qr');
                      setVerifyError('');
                    }}
                    startIcon={<QrCodeScannerIcon />}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: inviteMethod === 'qr' ? themeColors.primary : 'transparent',
                      color: inviteMethod === 'qr' ? themeColors.primaryContrast : themeColors.textSecondary,
                      borderColor: inviteMethod === 'qr' ? themeColors.primary : themeColors.borderLight,
                      '&:hover': { bgcolor: inviteMethod === 'qr' ? themeColors.primaryHover : themeColors.primaryBgLight }
                    }}
                  >
                    By QR Code Scan
                  </Button>
                </Box>

                {/* Verification Inputs */}
                {inviteMethod === 'email' && (
                  <Box>
                    <Typography variant="body2" sx={{ color: themeColors.textPrimary, fontWeight: 700, mb: 1 }}>
                      Enter Doctor's Registered Email ID:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <TextField
                        fullWidth
                        placeholder="e.g. dr.rajiv@hospital.com"
                        value={lookupQuery}
                        onChange={(e) => setLookupQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleVerifyDoctor();
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon sx={{ color: themeColors.primary }} />
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          flex: 1,
                          minWidth: 260,
                          '& .MuiInputBase-root': { bgcolor: themeColors.bgInput, color: themeColors.textPrimary, borderRadius: '12px' }
                        }}
                      />
                      <Button
                        variant="contained"
                        disabled={verifying || !lookupQuery.trim()}
                        onClick={() => handleVerifyDoctor()}
                        startIcon={verifying ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                        sx={{
                          bgcolor: themeColors.primary,
                          color: themeColors.primaryContrast,
                          fontWeight: 800,
                          borderRadius: '12px',
                          px: 3,
                          height: 56,
                          textTransform: 'none',
                          '&:hover': { bgcolor: themeColors.primaryHover }
                        }}
                      >
                        {verifying ? 'Verifying...' : 'Verify Doctor'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {inviteMethod === 'id' && (
                  <Box>
                    <Typography variant="body2" sx={{ color: themeColors.textPrimary, fontWeight: 700, mb: 1 }}>
                      Enter Unique Doctor ID / License ID:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <TextField
                        fullWidth
                        placeholder="Enter Doctor User ID or Registration Number"
                        value={lookupQuery}
                        onChange={(e) => setLookupQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleVerifyDoctor();
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeIcon sx={{ color: themeColors.primary }} />
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          flex: 1,
                          minWidth: 260,
                          '& .MuiInputBase-root': { bgcolor: themeColors.bgInput, color: themeColors.textPrimary, borderRadius: '12px' }
                        }}
                      />
                      <Button
                        variant="contained"
                        disabled={verifying || !lookupQuery.trim()}
                        onClick={() => handleVerifyDoctor()}
                        startIcon={verifying ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                        sx={{
                          bgcolor: themeColors.primary,
                          color: themeColors.primaryContrast,
                          fontWeight: 800,
                          borderRadius: '12px',
                          px: 3,
                          height: 56,
                          textTransform: 'none',
                          '&:hover': { bgcolor: themeColors.primaryHover }
                        }}
                      >
                        {verifying ? 'Verifying...' : 'Verify Doctor'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {inviteMethod === 'qr' && (
                  <Box sx={{ textAlign: 'center', py: 1 }}>
                    <Box
                      sx={{
                        maxWidth: 380,
                        mx: 'auto',
                        mb: 2.5,
                        minHeight: 250,
                        bgcolor: themeColors.bgInput,
                        borderRadius: '16px',
                        border: `1px dashed ${themeColors.primaryBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                        p: 2
                      }}
                    >
                      <div
                        id="doctor-network-qr-reader"
                        style={{
                          width: '100%',
                          height: '100%',
                          position: isCameraActive ? 'relative' : 'absolute'
                        }}
                      />
                      {!isCameraActive && (
                        <Box sx={{ p: 2 }}>
                          <Avatar sx={{ width: 54, height: 54, bgcolor: themeColors.primaryBgLight, color: themeColors.primary, mx: 'auto', mb: 1.5 }}>
                            <QrCodeScannerIcon sx={{ fontSize: '1.8rem' }} />
                          </Avatar>
                          <Typography variant="body2" sx={{ color: themeColors.textPrimary, fontWeight: 700 }}>
                            Scan Colleague's Doctor Card
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeColors.textSecondary, display: 'block', mt: 0.5 }}>
                            Ask your colleague to show their Medizo QR code from their portal
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                      {!isCameraActive ? (
                        <Button
                          variant="contained"
                          startIcon={<CameraAltIcon />}
                          onClick={startCamera}
                          sx={{ bgcolor: themeColors.primary, color: themeColors.primaryContrast, fontWeight: 800, borderRadius: '12px', textTransform: 'none', px: 3, '&:hover': { bgcolor: themeColors.primaryHover } }}
                        >
                          Start Camera Scanner
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<StopIcon />}
                          onClick={stopCamera}
                          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
                        >
                          Stop Camera
                        </Button>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />

                      <Button
                        variant="outlined"
                        startIcon={scanLoading ? <CircularProgress size={18} /> : <UploadFileIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={scanLoading}
                        sx={{ color: themeColors.primary, borderColor: themeColors.primaryBorder, borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
                      >
                        Upload QR Image
                      </Button>
                    </Box>

                    {scanError && (
                      <Alert severity="error" sx={{ mt: 2, borderRadius: '12px' }}>
                        {scanError}
                      </Alert>
                    )}
                  </Box>
                )}

                {/* Error Message */}
                {verifyError && (
                  <Alert
                    severity="warning"
                    sx={{
                      mt: 3,
                      borderRadius: '12px',
                      bgcolor: 'rgba(255,152,0,0.15)',
                      color: isDark ? '#FFA726' : '#C77700',
                      border: '1px solid rgba(255,152,0,0.3)'
                    }}
                  >
                    {verifyError}
                  </Alert>
                )}

                {/* VERIFIED DOCTOR CARD RESULT */}
                {verifiedDoctor && (
                  <Paper
                    sx={{
                      mt: 3.5,
                      p: 3,
                      borderRadius: '16px',
                      background: themeColors.verifiedCardBg,
                      border: `1.5px solid ${themeColors.primary}`,
                      boxShadow: isDark ? '0 8px 24px rgba(0,200,150,0.2)' : '0 6px 20px rgba(42,107,93,0.12)'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip
                        icon={<VerifiedUserIcon sx={{ color: `${themeColors.primaryContrast} !important` }} />}
                        label="Doctor Verified on Platform"
                        size="small"
                        sx={{ bgcolor: themeColors.primary, color: themeColors.primaryContrast, fontWeight: 900, px: 0.5 }}
                      />
                      <IconButton size="small" onClick={() => setVerifiedDoctor(null)} sx={{ color: themeColors.textSecondary }}>
                        <CloseIcon sx={{ fontSize: '1.1rem' }} />
                      </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2.5, flexWrap: 'wrap' }}>
                      <Avatar
                        src={verifiedDoctor.profileImage || ''}
                        sx={{
                          width: 68,
                          height: 68,
                          bgcolor: themeColors.primary,
                          color: themeColors.primaryContrast,
                          fontWeight: 900,
                          fontSize: '1.6rem'
                        }}
                      >
                        {verifiedDoctor.firstName?.charAt(0) || 'D'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: themeColors.textPrimary }}>
                          {verifiedDoctor.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.primary, fontWeight: 700 }}>
                          {verifiedDoctor.specialization} {verifiedDoctor.qualifications ? `• ${verifiedDoctor.qualifications}` : ''}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeColors.textSecondary, display: 'block', mt: 0.3 }}>
                          Email: {verifiedDoctor.email} {verifiedDoctor.licenseNumber ? `• License: ${verifiedDoctor.licenseNumber}` : ''}
                        </Typography>
                        {verifiedDoctor.clinicName && (
                          <Typography variant="caption" sx={{ color: themeColors.textSecondary, display: 'block' }}>
                            Clinic: {verifiedDoctor.clinicName} {verifiedDoctor.clinicAddress ? `(${verifiedDoctor.clinicAddress})` : ''}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ borderColor: themeColors.borderLight, my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      {verifiedDoctor.isConnected ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Chip
                            icon={<CheckCircleIcon sx={{ color: `${themeColors.primary} !important` }} />}
                            label="Already in Your Trusted Network"
                            sx={{ bgcolor: themeColors.primaryBgLight, color: themeColors.primary, fontWeight: 800 }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => {
                              setReferralForm(prev => ({ ...prev, referredDoctorId: verifiedDoctor.id }));
                              setReferralDialogOpen(true);
                              setReferralMode('network');
                            }}
                            startIcon={<SendIcon />}
                            sx={{ bgcolor: themeColors.primary, color: themeColors.primaryContrast, fontWeight: 800, borderRadius: '10px', textTransform: 'none', '&:hover': { bgcolor: themeColors.primaryHover } }}
                          >
                            Refer Patient Now
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={() => handleConnect(verifiedDoctor.id)}
                          startIcon={<PersonAddIcon />}
                          sx={{
                            bgcolor: themeColors.primary,
                            color: themeColors.primaryContrast,
                            fontWeight: 900,
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            py: 1.2,
                            px: 3,
                            textTransform: 'none',
                            boxShadow: isDark ? '0 4px 16px rgba(0,200,150,0.4)' : '0 4px 16px rgba(42,107,93,0.3)',
                            '&:hover': { bgcolor: themeColors.primaryHover }
                          }}
                        >
                          Send Network Invite / Add to Network
                        </Button>
                      )}

                      <Button
                        variant="text"
                        onClick={() => {
                          setVerifiedDoctor(null);
                          setLookupQuery('');
                        }}
                        sx={{ color: themeColors.textSecondary, textTransform: 'none' }}
                      >
                        Look Up Another Colleague
                      </Button>
                    </Box>
                  </Paper>
                )}
              </Paper>
            </Box>
          </Box>

          {/* ══════════════════════════════════════════════════════════════
             TAB 2: OUTGOING REFERRALS
             ══════════════════════════════════════════════════════════════ */}
          <Box sx={{ display: tab === 2 ? 'block' : 'none' }} className={tab === 2 ? 'animate-slide-up' : ''}>
            <Grid container spacing={2.5}>
              {outgoingReferrals.length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ p: 5, textAlign: 'center', bgcolor: themeColors.bgPaper, borderRadius: '16px', border: `1px solid ${themeColors.borderLight}`, boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)' }}>
                    <Typography sx={{ color: themeColors.textSecondary, mb: 2 }}>No outgoing patient referrals sent yet.</Typography>
                    <Button
                      variant="contained"
                      onClick={() => setReferralDialogOpen(true)}
                      startIcon={<SendIcon />}
                      sx={{ bgcolor: themeColors.primary, color: themeColors.primaryContrast, fontWeight: 800, borderRadius: '12px', textTransform: 'none', '&:hover': { bgcolor: themeColors.primaryHover } }}
                    >
                      Refer a Patient to Specialist
                    </Button>
                  </Paper>
                </Grid>
              ) : (
                outgoingReferrals.map((r) => (
                  <Grid item xs={12} md={6} key={r.id}>
                    <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: themeColors.bgPaper, border: `1px solid ${themeColors.borderLight}`, boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography sx={{ color: themeColors.primary, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 0.5 }}>
                          {r.referralNumber}
                        </Typography>
                        <Chip
                          label={(r.status || 'pending').toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: r.status === 'completed' ? 'rgba(76,175,80,0.15)' : r.status === 'accepted' ? 'rgba(33,150,243,0.15)' : 'rgba(255,152,0,0.15)',
                            color: r.status === 'completed' ? '#4CAF50' : r.status === 'accepted' ? '#2196F3' : '#FFA726',
                            fontWeight: 800
                          }}
                        />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: themeColors.textPrimary }}>
                        Referred to: Dr. {r.referredDoctorFirstName} {r.referredDoctorLastName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeColors.textSecondary, mb: 1 }}>
                        Patient: <strong>{r.patientFirstName} {r.patientLastName}</strong>
                      </Typography>
                      <Paper sx={{ p: 1.5, bgcolor: themeColors.bgInput, borderRadius: '10px', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: themeColors.primary, fontWeight: 700 }}>Clinical Reason:</Typography>
                        <Typography variant="body2" sx={{ color: themeColors.textPrimary }}>{r.reason}</Typography>
                      </Paper>
                      {r.clinicalSummary && (
                        <Typography variant="caption" sx={{ color: themeColors.textSecondary }}>
                          Summary: {r.clinicalSummary}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>

          {/* ══════════════════════════════════════════════════════════════
             TAB 3: INCOMING REFERRALS
             ══════════════════════════════════════════════════════════════ */}
          <Box sx={{ display: tab === 3 ? 'block' : 'none' }} className={tab === 3 ? 'animate-slide-up' : ''}>
            <Grid container spacing={2.5}>
              {incomingReferrals.length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ p: 5, textAlign: 'center', bgcolor: themeColors.bgPaper, borderRadius: '16px', border: `1px solid ${themeColors.borderLight}`, boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)' }}>
                    <Typography sx={{ color: themeColors.textSecondary }}>No incoming patient referrals received yet.</Typography>
                  </Paper>
                </Grid>
              ) : (
                incomingReferrals.map((r) => (
                  <Grid item xs={12} md={6} key={r.id}>
                    <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: themeColors.bgPaper, border: `1px solid ${themeColors.borderLight}`, boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography sx={{ color: themeColors.primary, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 0.5 }}>
                          {r.referralNumber}
                        </Typography>
                        <Chip
                          label={(r.status || 'pending').toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: r.status === 'completed' ? 'rgba(76,175,80,0.15)' : r.status === 'accepted' ? 'rgba(33,150,243,0.15)' : 'rgba(255,152,0,0.15)',
                            color: r.status === 'completed' ? '#4CAF50' : r.status === 'accepted' ? '#2196F3' : '#FFA726',
                            fontWeight: 800
                          }}
                        />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: themeColors.textPrimary }}>
                        Referred by: Dr. {r.referringDoctorFirstName} {r.referringDoctorLastName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeColors.textSecondary, mb: 1 }}>
                        Patient: <strong>{r.patientFirstName} {r.patientLastName}</strong> {r.patientPhone ? `(${r.patientPhone})` : ''}
                      </Typography>
                      <Paper sx={{ p: 1.5, bgcolor: themeColors.bgInput, borderRadius: '10px', mb: 2 }}>
                        <Typography variant="caption" sx={{ color: themeColors.primary, fontWeight: 700 }}>Clinical Reason:</Typography>
                        <Typography variant="body2" sx={{ color: themeColors.textPrimary }}>{r.reason}</Typography>
                      </Paper>
                      {r.status === 'pending' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleUpdateReferralStatus(r.id, 'accepted')}
                            sx={{ bgcolor: themeColors.primary, color: themeColors.primaryContrast, fontWeight: 800, borderRadius: '10px', textTransform: 'none', '&:hover': { bgcolor: themeColors.primaryHover } }}
                          >
                            Accept Referral
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleUpdateReferralStatus(r.id, 'rejected')}
                            sx={{ color: '#F44336', borderColor: 'rgba(244,67,54,0.4)', borderRadius: '10px', textTransform: 'none' }}
                          >
                            Decline
                          </Button>
                        </Box>
                      )}
                      {r.status === 'accepted' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleUpdateReferralStatus(r.id, 'completed')}
                          sx={{ bgcolor: '#2196F3', color: '#FFF', fontWeight: 800, borderRadius: '10px', textTransform: 'none' }}
                        >
                          Mark Consultation Complete
                        </Button>
                      )}
                    </Paper>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>

          {/* ══════════════════════════════════════════════════════════════
             TAB 4: NEARBY PROFESSIONALS
             ══════════════════════════════════════════════════════════════ */}
          <Box sx={{ display: tab === 4 ? 'block' : 'none' }} className={tab === 4 ? 'animate-slide-up' : ''}>
            {(() => {
              // Auto-trigger geolocation on tab visit
              if (tab === 4 && !nearbyFetched && !nearbyLoading && !locationDenied) {
                setTimeout(() => {
                  if (!userLocation && navigator.geolocation) {
                    setNearbyLoading(true);
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        setUserLocation(loc);
                        healthcareApi.getNearbyProfessionals(loc.lat, loc.lng, 15, 'all')
                          .then((res: any) => {
                            setNearbyProfessionals(res.nearby || []);
                            setNearbyFetched(true);
                          })
                          .catch(() => setNearbyError('Failed to load nearby professionals'))
                          .finally(() => setNearbyLoading(false));
                      },
                      (err) => {
                        setLocationDenied(true);
                        setNearbyLoading(false);
                        setNearbyError(err.code === 1 ? 'Location access denied. Please enable location in browser settings.' : 'Could not determine your location.');
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  } else if (userLocation && !nearbyFetched) {
                    setNearbyLoading(true);
                    healthcareApi.getNearbyProfessionals(userLocation.lat, userLocation.lng, 15, 'all')
                      .then((res: any) => {
                        setNearbyProfessionals(res.nearby || []);
                        setNearbyFetched(true);
                      })
                      .catch(() => setNearbyError('Failed to load nearby professionals'))
                      .finally(() => setNearbyLoading(false));
                  }
                }, 100);
              }
              return null;
            })()}

            {/* Own Practice Pin Notice */}
            {(!user?.clinicLatitude || !user?.clinicLongitude) && (
              <Paper
                sx={{
                  p: 2,
                  mb: 2.5,
                  borderRadius: '14px',
                  bgcolor: isDark ? 'rgba(255,152,0,0.12)' : 'rgba(255,152,0,0.08)',
                  border: '1px solid rgba(255,152,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LocationOnIcon sx={{ color: '#FF9800' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: themeColors.textPrimary }}>
                      Want nearby colleagues to discover your practice?
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeColors.textSecondary }}>
                      You haven't saved your practice GPS pin yet. Add it in your profile to become discoverable to doctors, nurses, and labs within 15 km.
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.location.href = '/profile'}
                  sx={{
                    color: '#FF9800',
                    borderColor: 'rgba(255,152,0,0.4)',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: '10px',
                    '&:hover': { borderColor: '#FF9800', bgcolor: 'rgba(255,152,0,0.08)' }
                  }}
                >
                  Update Profile Pin
                </Button>
              </Paper>
            )}

            {/* Category Filter Chips */}
            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'All', icon: <NearMeIcon sx={{ fontSize: '1rem' }} /> },
                { key: 'doctor', label: 'Doctors', icon: <MedicalServicesIcon sx={{ fontSize: '1rem' }} /> },
                { key: 'nurse', label: 'Nurses', icon: <LocalHospitalIcon sx={{ fontSize: '1rem' }} /> },
                { key: 'pharmacist', label: 'Pharmacists', icon: <LocalPharmacyIcon sx={{ fontSize: '1rem' }} /> },
                { key: 'lab', label: 'Labs & Diagnostics', icon: <ScienceIcon sx={{ fontSize: '1rem' }} /> },
                { key: 'physiotherapist', label: 'Physiotherapists', icon: <SpaIcon sx={{ fontSize: '1rem' }} /> },
                { key: 'dentist', label: 'Dentists', icon: <MedicalServicesIcon sx={{ fontSize: '1rem' }} /> },
                { key: 'dietitian', label: 'Dietitians', icon: <SpaIcon sx={{ fontSize: '1rem' }} /> },
                { key: 'alternative', label: 'Alternative Medicine', icon: <SpaIcon sx={{ fontSize: '1rem' }} /> },
              ].map(cat => (
                <Chip
                  key={cat.key}
                  icon={cat.icon}
                  label={cat.key === 'all' ? `${cat.label} (${nearbyProfessionals.length})` : `${cat.label} (${nearbyProfessionals.filter(p => p.category === cat.key).length})`}
                  onClick={() => setNearbyCategory(cat.key)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    borderRadius: '10px',
                    px: 0.5,
                    bgcolor: nearbyCategory === cat.key ? themeColors.primary : themeColors.primaryBgLight,
                    color: nearbyCategory === cat.key ? themeColors.primaryContrast : themeColors.primary,
                    border: `1px solid ${nearbyCategory === cat.key ? themeColors.primary : themeColors.primaryBorder}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: nearbyCategory === cat.key ? themeColors.primaryHover : themeColors.primaryBgLight, transform: 'translateY(-1px)' },
                    '& .MuiChip-icon': { color: nearbyCategory === cat.key ? themeColors.primaryContrast : themeColors.primary }
                  }}
                />
              ))}
            </Box>

            {/* Refresh Location Button */}
            {userLocation && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="body2" sx={{ color: themeColors.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MyLocationIcon sx={{ fontSize: '1rem', color: themeColors.primary }} />
                  Showing professionals within <strong style={{ color: themeColors.primary, margin: '0 4px' }}>15 km</strong> of your location
                </Typography>
                <Button
                  size="small"
                  onClick={() => {
                    setNearbyFetched(false);
                    setNearbyError('');
                    setNearbyLoading(true);
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        setUserLocation(loc);
                        healthcareApi.getNearbyProfessionals(loc.lat, loc.lng, 15, 'all')
                          .then((res: any) => {
                            setNearbyProfessionals(res.nearby || []);
                            setNearbyFetched(true);
                          })
                          .catch(() => setNearbyError('Failed to refresh'))
                          .finally(() => setNearbyLoading(false));
                      },
                      () => { setNearbyLoading(false); setNearbyError('Location unavailable'); },
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  }}
                  startIcon={<MyLocationIcon />}
                  sx={{ color: themeColors.primary, textTransform: 'none', fontWeight: 700 }}
                >
                  Refresh
                </Button>
              </Box>
            )}

            {/* Loading State */}
            {nearbyLoading && (
              <Grid container spacing={2.5}>
                {[1, 2, 3, 4].map(i => (
                  <Grid item xs={12} md={6} key={i}>
                    <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: themeColors.bgPaper, border: `1px solid ${themeColors.borderLight}` }}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: themeColors.primaryBgLight, animation: 'pulse 1.5s infinite' }} />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ width: '60%', height: 16, borderRadius: 4, bgcolor: themeColors.primaryBgLight, mb: 1, animation: 'pulse 1.5s infinite' }} />
                          <Box sx={{ width: '40%', height: 12, borderRadius: 4, bgcolor: themeColors.primaryBgLight, animation: 'pulse 1.5s infinite' }} />
                        </Box>
                      </Box>
                      <Box sx={{ width: '80%', height: 12, borderRadius: 4, bgcolor: themeColors.primaryBgLight, mb: 1, animation: 'pulse 1.5s infinite' }} />
                      <Box sx={{ width: '50%', height: 12, borderRadius: 4, bgcolor: themeColors.primaryBgLight, animation: 'pulse 1.5s infinite' }} />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Error / Location Denied State */}
            {nearbyError && !nearbyLoading && (
              <Paper
                sx={{
                  p: 5,
                  textAlign: 'center',
                  bgcolor: themeColors.bgPaper,
                  borderRadius: '16px',
                  border: isDark ? '1px dashed rgba(255,255,255,0.15)' : '1px dashed rgba(42,107,93,0.25)',
                  boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)'
                }}
              >
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(244,67,54,0.12)', color: '#F44336', mx: 'auto', mb: 2 }}>
                  <LocationOnIcon sx={{ fontSize: '2rem' }} />
                </Avatar>
                <Typography variant="h6" sx={{ color: themeColors.textPrimary, fontWeight: 800, mb: 1 }}>
                  {locationDenied ? 'Location Access Required' : 'Could Not Load'}
                </Typography>
                <Typography variant="body2" sx={{ color: themeColors.textSecondary, maxWidth: 460, mx: 'auto', mb: 3 }}>
                  {nearbyError}
                </Typography>
                {locationDenied && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setLocationDenied(false);
                      setNearbyError('');
                      setNearbyFetched(false);
                    }}
                    startIcon={<MyLocationIcon />}
                    sx={{ bgcolor: themeColors.primary, color: themeColors.primaryContrast, fontWeight: 800, borderRadius: '12px', textTransform: 'none', '&:hover': { bgcolor: themeColors.primaryHover } }}
                  >
                    Try Again
                  </Button>
                )}
              </Paper>
            )}

            {/* Results Grid */}
            {!nearbyLoading && !nearbyError && nearbyFetched && (
              <Grid container spacing={2.5}>
                {(() => {
                  const filtered = nearbyCategory === 'all'
                    ? nearbyProfessionals
                    : nearbyProfessionals.filter(p => p.category === nearbyCategory);
                  
                  if (filtered.length === 0) {
                    return (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 5, textAlign: 'center', bgcolor: themeColors.bgPaper, borderRadius: '16px', border: `1px dashed ${themeColors.primaryBorder}` }}>
                          <Avatar sx={{ width: 64, height: 64, bgcolor: themeColors.primaryBgLight, color: themeColors.primary, mx: 'auto', mb: 2 }}>
                            <NearMeIcon sx={{ fontSize: '2rem' }} />
                          </Avatar>
                          <Typography variant="h6" sx={{ color: themeColors.textPrimary, fontWeight: 800, mb: 1 }}>
                            No Professionals Found Nearby
                          </Typography>
                          <Typography variant="body2" sx={{ color: themeColors.textSecondary, maxWidth: 460, mx: 'auto' }}>
                            {nearbyCategory !== 'all'
                              ? `No ${nearbyCategory}s found within 15 km. Try selecting "All" to see other professionals nearby.`
                              : 'No healthcare professionals with clinic locations set within 15 km of your current location.'}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  }

                  return filtered.map((prof: any) => {
                    const categoryConfig: Record<string, { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
                      doctor: { color: '#2196F3', bgColor: 'rgba(33,150,243,0.12)', label: 'Doctor', icon: <MedicalServicesIcon sx={{ fontSize: '0.85rem' }} /> },
                      nurse: { color: '#E91E63', bgColor: 'rgba(233,30,99,0.12)', label: 'Nurse', icon: <LocalHospitalIcon sx={{ fontSize: '0.85rem' }} /> },
                      pharmacist: { color: '#FF9800', bgColor: 'rgba(255,152,0,0.12)', label: 'Pharmacist', icon: <LocalPharmacyIcon sx={{ fontSize: '0.85rem' }} /> },
                      lab: { color: '#9C27B0', bgColor: 'rgba(156,39,176,0.12)', label: 'Lab & Diagnostics', icon: <ScienceIcon sx={{ fontSize: '0.85rem' }} /> },
                      physiotherapist: { color: '#009688', bgColor: 'rgba(0,150,136,0.12)', label: 'Physiotherapist', icon: <SpaIcon sx={{ fontSize: '0.85rem' }} /> },
                      dentist: { color: '#00BCD4', bgColor: 'rgba(0,188,212,0.12)', label: 'Dentist', icon: <MedicalServicesIcon sx={{ fontSize: '0.85rem' }} /> },
                      dietitian: { color: '#8BC34A', bgColor: 'rgba(139,195,74,0.12)', label: 'Dietitian', icon: <SpaIcon sx={{ fontSize: '0.85rem' }} /> },
                      alternative: { color: '#795548', bgColor: 'rgba(121,85,72,0.12)', label: 'Alternative Medicine', icon: <SpaIcon sx={{ fontSize: '0.85rem' }} /> },
                    };
                    const catCfg = categoryConfig[prof.category] || categoryConfig.doctor;

                    return (
                      <Grid item xs={12} md={6} key={prof.id}>
                        <Paper
                          sx={{
                            p: 3,
                            borderRadius: '16px',
                            bgcolor: themeColors.bgPaper,
                            border: `1px solid ${themeColors.borderLight}`,
                            boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.04)',
                            transition: 'all 0.25s',
                            '&:hover': { borderColor: themeColors.primaryBorder, transform: 'translateY(-3px)', boxShadow: isDark ? '0 8px 24px rgba(0,200,150,0.15)' : '0 8px 24px rgba(42,107,93,0.12)' }
                          }}
                        >
                          {/* Top: Avatar + Name + Role + Distance */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                src={prof.profileImage || ''}
                                sx={{
                                  bgcolor: catCfg.bgColor,
                                  color: catCfg.color,
                                  fontWeight: 800,
                                  width: 56,
                                  height: 56,
                                  fontSize: '1.3rem',
                                  border: `2px solid ${catCfg.bgColor}`
                                }}
                              >
                                {prof.firstName?.charAt(0) || 'U'}
                              </Avatar>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: themeColors.textPrimary, fontSize: '1.05rem' }}>
                                  {prof.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3, flexWrap: 'wrap' }}>
                                  <Chip
                                    icon={catCfg.icon as React.ReactElement}
                                    label={catCfg.label}
                                    size="small"
                                    sx={{
                                      bgcolor: catCfg.bgColor,
                                      color: catCfg.color,
                                      fontWeight: 700,
                                      fontSize: '0.72rem',
                                      height: 22,
                                      '& .MuiChip-icon': { color: catCfg.color }
                                    }}
                                  />
                                  {prof.specialization && prof.category === 'doctor' && (
                                    <Chip
                                      label={prof.specialization}
                                      size="small"
                                      sx={{ bgcolor: themeColors.primaryBgLight, color: themeColors.primary, fontWeight: 700, fontSize: '0.72rem', height: 22 }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                            {/* Distance Badge */}
                            <Chip
                              icon={<NearMeIcon sx={{ fontSize: '0.85rem !important' }} />}
                              label={`${prof.distance} km`}
                              size="small"
                              sx={{
                                bgcolor: isDark ? 'rgba(0,200,150,0.12)' : 'rgba(42,107,93,0.08)',
                                color: themeColors.primary,
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                border: `1px solid ${themeColors.primaryBorder}`,
                                '& .MuiChip-icon': { color: themeColors.primary },
                                flexShrink: 0
                              }}
                            />
                          </Box>

                          {/* Clinic / Workplace Info */}
                          {(prof.clinicName || prof.clinicAddress) && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, mb: 1.5 }}>
                              <LocationOnIcon sx={{ fontSize: '1rem', color: themeColors.primary, mt: 0.3 }} />
                              <Typography variant="body2" sx={{ color: themeColors.textSecondary, lineHeight: 1.5 }}>
                                {prof.clinicName}{prof.clinicAddress ? ` • ${prof.clinicAddress}` : ''}
                              </Typography>
                            </Box>
                          )}

                          {/* Experience & Qualifications */}
                          {(prof.experience || prof.qualifications) && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                              {prof.experience && (
                                <Typography variant="caption" sx={{ color: themeColors.textSecondary, bgcolor: themeColors.bgInput, px: 1.2, py: 0.3, borderRadius: '6px', fontWeight: 600 }}>
                                  🎯 {prof.experience}
                                </Typography>
                              )}
                              {prof.qualifications && (
                                <Typography variant="caption" sx={{ color: themeColors.textSecondary, bgcolor: themeColors.bgInput, px: 1.2, py: 0.3, borderRadius: '6px', fontWeight: 600 }}>
                                  🎓 {prof.qualifications}
                                </Typography>
                              )}
                            </Box>
                          )}

                          {prof.isConnected && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                              <CheckCircleIcon sx={{ fontSize: '0.9rem', color: themeColors.primary }} />
                              <Typography variant="caption" sx={{ color: themeColors.primary, fontWeight: 700 }}>In Your Network</Typography>
                            </Box>
                          )}

                          <Divider sx={{ borderColor: themeColors.borderLight, my: 1.5 }} />

                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {!prof.isConnected && prof.role === 'doctor' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleConnect(prof.id)}
                                  startIcon={<PersonAddIcon sx={{ fontSize: '0.9rem' }} />}
                                  sx={{
                                    bgcolor: themeColors.primary,
                                    color: themeColors.primaryContrast,
                                    fontWeight: 800,
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontSize: '0.8rem',
                                    '&:hover': { bgcolor: themeColors.primaryHover }
                                  }}
                                >
                                  Connect
                                </Button>
                              )}
                              {prof.isConnected && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => {
                                    setReferralForm(prev => ({ ...prev, referredDoctorId: prof.id }));
                                    setReferralDialogOpen(true);
                                    setReferralMode('network');
                                  }}
                                  startIcon={<SendIcon sx={{ fontSize: '0.9rem' }} />}
                                  sx={{
                                    bgcolor: themeColors.primary,
                                    color: themeColors.primaryContrast,
                                    fontWeight: 800,
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontSize: '0.8rem',
                                    '&:hover': { bgcolor: themeColors.primaryHover }
                                  }}
                                >
                                  Refer Patient
                                </Button>
                              )}
                            </Box>
                            {prof.phone && (
                              <Tooltip title={`Call ${prof.phone}`}>
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(`tel:${prof.phone}`, '_self')}
                                  sx={{ color: themeColors.primary, bgcolor: themeColors.primaryBgLight, '&:hover': { bgcolor: themeColors.primaryBorder } }}
                                >
                                  <PhoneIcon sx={{ fontSize: '1.1rem' }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  });
                })()}
              </Grid>
            )}
          </Box>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MY DOCTOR NETWORK CARD & QR CODE DIALOG
          ══════════════════════════════════════════════════════════════ */}
      <Dialog
        open={myCardDialogOpen}
        onClose={() => setMyCardDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: themeColors.bgPaper,
            color: themeColors.textPrimary,
            borderRadius: '20px',
            border: `1px solid ${themeColors.primaryBorder}`,
            boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.6)' : '0 12px 40px rgba(42,107,93,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${themeColors.borderLight}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCode2Icon sx={{ color: themeColors.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              My Doctor Network Card
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setMyCardDialogOpen(false)} sx={{ color: themeColors.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {/* QR Code Container */}
          <Box
            sx={{
              p: 2,
              bgcolor: themeColors.qrBg,
              borderRadius: '16px',
              border: `2px solid ${themeColors.primaryBorder}`,
              display: 'inline-block',
              boxShadow: isDark ? '0 0 24px rgba(0,200,150,0.2)' : '0 4px 16px rgba(42,107,93,0.12)',
              mb: 2.5
            }}
          >
            <QRCode
              value={doctorQrPayload}
              size={180}
              bgColor={themeColors.qrBg}
              fgColor={themeColors.qrFg}
              level="H"
              includeMargin
            />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 900, color: themeColors.textPrimary }}>
            Dr. {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="body2" sx={{ color: themeColors.primary, fontWeight: 700, mb: 2 }}>
            {user?.specialization || 'Medical Specialist'} {user?.clinicName ? `• ${user.clinicName}` : ''}
          </Typography>

          {/* Shareable Fields */}
          <Paper sx={{ p: 1.5, bgcolor: themeColors.bgInput, borderRadius: '12px', mb: 1.5, textAlign: 'left', border: `1px solid ${themeColors.borderLight}` }}>
            <Typography variant="caption" sx={{ color: themeColors.textSecondary, display: 'block' }}>
              Doctor ID:
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: themeColors.textPrimary, fontWeight: 700, fontFamily: 'monospace' }}>
                {user?.id}
              </Typography>
              <Tooltip title={copiedField === 'id' ? 'Copied!' : 'Copy Doctor ID'}>
                <IconButton size="small" onClick={() => handleCopy(user?.id || '', 'id')} sx={{ color: copiedField === 'id' ? themeColors.primary : themeColors.textSecondary }}>
                  {copiedField === 'id' ? <CheckIcon sx={{ fontSize: '1rem' }} /> : <ContentCopyIcon sx={{ fontSize: '1rem' }} />}
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          <Paper sx={{ p: 1.5, bgcolor: themeColors.bgInput, borderRadius: '12px', mb: 2.5, textAlign: 'left', border: `1px solid ${themeColors.borderLight}` }}>
            <Typography variant="caption" sx={{ color: themeColors.textSecondary, display: 'block' }}>
              Registered Email ID:
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: themeColors.textPrimary, fontWeight: 700 }}>
                {user?.email}
              </Typography>
              <Tooltip title={copiedField === 'email' ? 'Copied!' : 'Copy Email'}>
                <IconButton size="small" onClick={() => handleCopy(user?.email || '', 'email')} sx={{ color: copiedField === 'email' ? themeColors.primary : themeColors.textSecondary }}>
                  {copiedField === 'email' ? <CheckIcon sx={{ fontSize: '1rem' }} /> : <ContentCopyIcon sx={{ fontSize: '1rem' }} />}
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          <Typography variant="caption" sx={{ color: themeColors.textSecondary, display: 'block', lineHeight: 1.4 }}>
            Show this QR code or share your Email/Doctor ID with fellow doctors so they can verify and add you to their trusted referral network.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${themeColors.borderLight}` }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setMyCardDialogOpen(false)}
            sx={{ bgcolor: themeColors.primary, color: themeColors.primaryContrast, fontWeight: 800, borderRadius: '10px', textTransform: 'none', '&:hover': { bgcolor: themeColors.primaryHover } }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════
          REFER PATIENT MODAL (TIED TO TRUSTED NETWORK & DIRECT LOOKUP)
          ══════════════════════════════════════════════════════════════ */}
      <Dialog
        open={referralDialogOpen}
        onClose={() => setReferralDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: themeColors.bgPaper,
            color: themeColors.textPrimary,
            borderRadius: '18px',
            border: `1px solid ${themeColors.borderLight}`,
            boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.6)' : '0 12px 40px rgba(42,107,93,0.15)'
          }
        }}
      >
        <form onSubmit={handleSendReferral}>
          <DialogTitle sx={{ fontWeight: 800, color: themeColors.textPrimary, borderBottom: `1px solid ${themeColors.borderLight}` }}>
            Refer Patient to Colleague Specialist
          </DialogTitle>
          <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth sx={{ bgcolor: themeColors.bgInput, borderRadius: '12px' }}>
              <InputLabel sx={{ color: themeColors.textSecondary }}>Select Patient *</InputLabel>
              <Select
                value={referralForm.patientId}
                label="Select Patient *"
                onChange={(e) => setReferralForm({ ...referralForm, patientId: e.target.value })}
                sx={{ color: themeColors.textPrimary }}
                required
              >
                {myPatients.length === 0 ? (
                  <MenuItem disabled value="">
                    No patients registered yet. Please add a patient first.
                  </MenuItem>
                ) : (
                  myPatients.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} {p.phone ? `(${p.phone})` : p.email ? `(${p.email})` : ''}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Recipient Doctor Selection Mode */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant={referralMode === 'network' ? 'contained' : 'outlined'}
                onClick={() => setReferralMode('network')}
                sx={{
                  flex: 1,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: referralMode === 'network' ? themeColors.primary : 'transparent',
                  color: referralMode === 'network' ? themeColors.primaryContrast : themeColors.textSecondary,
                  borderColor: referralMode === 'network' ? themeColors.primary : themeColors.borderLight,
                  '&:hover': { bgcolor: referralMode === 'network' ? themeColors.primaryHover : themeColors.primaryBgLight }
                }}
              >
                From My Network ({network.length})
              </Button>
              <Button
                size="small"
                variant={referralMode === 'quick_lookup' ? 'contained' : 'outlined'}
                onClick={() => setReferralMode('quick_lookup')}
                sx={{
                  flex: 1,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  bgcolor: referralMode === 'quick_lookup' ? themeColors.primary : 'transparent',
                  color: referralMode === 'quick_lookup' ? themeColors.primaryContrast : themeColors.textSecondary,
                  borderColor: referralMode === 'quick_lookup' ? themeColors.primary : themeColors.borderLight,
                  '&:hover': { bgcolor: referralMode === 'quick_lookup' ? themeColors.primaryHover : themeColors.primaryBgLight }
                }}
              >
                Verify & Refer by Email/ID
              </Button>
            </Box>

            {referralMode === 'network' ? (
              <FormControl fullWidth sx={{ bgcolor: themeColors.bgInput, borderRadius: '12px' }}>
                <InputLabel sx={{ color: themeColors.textSecondary }}>Referred Colleague Doctor *</InputLabel>
                <Select
                  value={referralForm.referredDoctorId}
                  label="Referred Colleague Doctor *"
                  onChange={(e) => setReferralForm({ ...referralForm, referredDoctorId: e.target.value })}
                  sx={{ color: themeColors.textPrimary }}
                  required
                >
                  {network.length === 0 ? (
                    <MenuItem disabled value="">
                      No doctors in your network yet. Switch to "Verify & Refer" tab above.
                    </MenuItem>
                  ) : (
                    network.map((doc) => (
                      <MenuItem key={doc.connectedDoctorId || doc.id} value={doc.connectedDoctorId || doc.id}>
                        Dr. {doc.firstName} {doc.lastName} ({doc.specialization || 'Physician'})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{ p: 2, bgcolor: themeColors.bgInput, borderRadius: '12px', border: `1px solid ${themeColors.borderLight}` }}>
                <Typography variant="caption" sx={{ color: themeColors.textSecondary, display: 'block', mb: 1 }}>
                  Look up doctor by Email ID or Doctor ID:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Doctor's email or ID"
                    value={referralQuickQuery}
                    onChange={(e) => setReferralQuickQuery(e.target.value)}
                    sx={{ '& .MuiInputBase-root': { bgcolor: themeColors.bgPaper, color: themeColors.textPrimary, borderRadius: '10px' } }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    disabled={referralQuickLoading || !referralQuickQuery.trim()}
                    onClick={handleReferralQuickLookup}
                    sx={{ bgcolor: themeColors.primary, color: themeColors.primaryContrast, fontWeight: 800, borderRadius: '10px', textTransform: 'none', '&:hover': { bgcolor: themeColors.primaryHover } }}
                  >
                    {referralQuickLoading ? <CircularProgress size={16} /> : 'Verify'}
                  </Button>
                </Box>
                {referralQuickError && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                    {referralQuickError}
                  </Typography>
                )}
                {referralQuickVerified && (
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: themeColors.primaryBgLight, borderRadius: '10px', border: `1px solid ${themeColors.primaryBorder}` }}>
                    <Typography variant="body2" sx={{ color: themeColors.primary, fontWeight: 800 }}>
                      ✓ Dr. {referralQuickVerified.name} ({referralQuickVerified.specialization})
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeColors.textSecondary }}>
                      {referralQuickVerified.clinicName || referralQuickVerified.email}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            <FormControl fullWidth sx={{ bgcolor: themeColors.bgInput, borderRadius: '12px' }}>
              <InputLabel sx={{ color: themeColors.textSecondary }}>Priority Level</InputLabel>
              <Select
                value={referralForm.priority}
                label="Priority Level"
                onChange={(e) => setReferralForm({ ...referralForm, priority: e.target.value })}
                sx={{ color: themeColors.textPrimary }}
              >
                <MenuItem value="routine">Routine</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Referral Reason (Required)"
              fullWidth
              required
              multiline
              rows={2}
              value={referralForm.reason}
              onChange={(e) => setReferralForm({ ...referralForm, reason: e.target.value })}
              sx={{ '& .MuiInputBase-root': { bgcolor: themeColors.bgInput, color: themeColors.textPrimary, borderRadius: '12px' } }}
            />

            <TextField
              label="Clinical Summary & Relevant History"
              fullWidth
              multiline
              rows={3}
              value={referralForm.clinicalSummary}
              onChange={(e) => setReferralForm({ ...referralForm, clinicalSummary: e.target.value })}
              sx={{ '& .MuiInputBase-root': { bgcolor: themeColors.bgInput, color: themeColors.textPrimary, borderRadius: '12px' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${themeColors.borderLight}` }}>
            <Button onClick={() => setReferralDialogOpen(false)} sx={{ color: themeColors.textSecondary }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!referralForm.referredDoctorId || !referralForm.patientId}
              sx={{ bgcolor: themeColors.primary, color: themeColors.primaryContrast, fontWeight: 800, borderRadius: '10px', '&:hover': { bgcolor: themeColors.primaryHover } }}
            >
              Send Referral
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}
