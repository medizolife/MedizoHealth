'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  keyframes,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  QrCodeScanner,
  LocalHospital,
  Security,
  Devices,
  ArrowForward,
  CheckCircleOutline,
  Login,
  Dashboard as DashboardIcon,
  MedicalServices,
  Person,
  Storefront,
  VerifiedUser,
  Speed,
  AutoAwesome,
  ContentCopy,
  Check,
  QrCode2,
  Lock,
  HealthAndSafety,
  ExpandMore,
  Shield,
  Smartphone,
  AssignmentTurnedIn
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Keyframe Animations for Glass UI Effects
const scanAnimation = keyframes`
  0% { top: 5%; opacity: 0.2; }
  50% { top: 90%; opacity: 1; }
  100% { top: 5%; opacity: 0.2; }
`;

const pulseGlow = keyframes`
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.08); opacity: 0.9; }
  100% { transform: scale(1); opacity: 0.6; }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Auth state & direct workspace redirection
  const { authState } = useAuth();
  const isAuthenticated = authState?.isAuthenticated || (typeof window !== 'undefined' && Boolean(localStorage.getItem('token')));
  const user = authState?.user;

  // Active Role Tab in Ecosystem section
  const [activeRoleTab, setActiveRoleTab] = useState(0);

  // Demo QR Scan verification state
  const [scannedVerified, setScannedVerified] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // If user is already authenticated, directly navigate to workspace/dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSimulateScan = () => {
    setScannedVerified(true);
    setSnackbarOpen(true);
    setTimeout(() => setScannedVerified(false), 4000);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#070D18', color: '#F8FAFC', overflowX: 'hidden' }}>
      
      {/* Background Ambient Glass Glow Orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          left: '10%',
          width: { xs: 280, md: 500 },
          height: { xs: 280, md: 500 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          animation: `${pulseGlow} 8s ease-in-out infinite`
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '25%',
          right: '5%',
          width: { xs: 300, md: 600 },
          height: { xs: 300, md: 600 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(59, 130, 246, 0) 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          animation: `${pulseGlow} 10s ease-in-out infinite 2s`
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '5%',
          width: { xs: 250, md: 450 },
          height: { xs: 250, md: 450 },
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0) 70%)',
          filter: 'blur(85px)',
          pointerEvents: 'none'
        }}
      />

      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 5, sm: 8, md: 12 },
          pb: { xs: 8, sm: 10, md: 14 },
          position: 'relative',
          zIndex: 1
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            
            {/* Left Hero Details */}
            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                
                {/* Glass Tag */}
                <Box>
                  <Chip
                    icon={<AutoAwesome sx={{ color: '#34D399 !important', fontSize: '18px' }} />}
                    label="Medizo Life Healthcare Ecosystem v2.0"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      color: '#6EE7B7',
                      fontWeight: 700,
                      fontSize: { xs: '0.78rem', sm: '0.875rem' },
                      py: 2.2,
                      px: 1,
                      borderRadius: '30px',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)'
                    }}
                  />
                </Box>

                {/* Main Heading */}
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '2.1rem', sm: '3rem', md: '3.6rem' },
                    lineHeight: { xs: 1.2, md: 1.15 },
                    letterSpacing: '-0.02em',
                    color: '#FFFFFF'
                  }}
                >
                  Simplified Healthcare Management &{' '}
                  <Box
                    component="span"
                    sx={{
                      background: 'linear-gradient(90deg, #38BDF8 0%, #34D399 50%, #A7F3D0 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'inline'
                    }}
                  >
                    Verified Digital Prescriptions
                  </Box>
                </Typography>

                {/* Subtitle / Overview */}
                <Typography
                  variant="h6"
                  sx={{
                    color: '#94A3B8',
                    fontWeight: 400,
                    lineHeight: 1.65,
                    fontSize: { xs: '0.98rem', sm: '1.1rem', md: '1.2rem' }
                  }}
                >
                  Medizo Life connects doctors, patients, and pharmacists on a single secure platform. 
                  Generate verified digital prescriptions with cryptographic QR code authentication and access medical history effortlessly.
                </Typography>

                {/* Action Buttons */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1.5 }}>
                  {isAuthenticated ? (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<DashboardIcon />}
                      onClick={() => navigate('/dashboard')}
                      sx={{
                        backgroundColor: '#10B981',
                        '&:hover': { backgroundColor: '#059669', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)' },
                        px: 4,
                        py: 1.8,
                        borderRadius: '14px',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      Go to Workspace ({user?.firstName || 'Dashboard'})
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/dashboard')}
                        sx={{
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.45)',
                            transform: 'translateY(-2px)'
                          },
                          px: 4,
                          py: 1.8,
                          borderRadius: '14px',
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        Launch Workspace
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<Login />}
                        onClick={() => navigate('/login')}
                        sx={{
                          color: '#FFFFFF',
                          borderColor: 'rgba(255, 255, 255, 0.25)',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          '&:hover': {
                            borderColor: '#38BDF8',
                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                            transform: 'translateY(-2px)'
                          },
                          px: 4,
                          py: 1.8,
                          borderRadius: '14px',
                          fontSize: '1.05rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        Sign In to Workspace
                      </Button>
                    </>
                  )}
                </Stack>

                {/* Trust Highlights */}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1.5, sm: 3 }}
                  sx={{ pt: 2, color: '#CBD5E1' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutline sx={{ color: '#34D399', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={500}>Instant QR Verification</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutline sx={{ color: '#34D399', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={500}>Windows & Mobile Native</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutline sx={{ color: '#34D399', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={500}>256-bit Encrypted Vault</Typography>
                  </Box>
                </Stack>

              </Stack>
            </Grid>

            {/* Right Hero Frosted Glass Preview Widget */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: '24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `${floatAnimation} 6s ease-in-out infinite`
                }}
              >
                {/* Prescription Glass Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <MedicalServices sx={{ color: '#34D399', fontSize: 22 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} color="#FFFFFF">
                        Medizo Verified Rx
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        ID: #RX-2026-948102
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    icon={<VerifiedUser sx={{ color: '#34D399 !important', fontSize: '14px' }} />}
                    label={scannedVerified ? "Verified Active" : "Cryptographic Seal"}
                    color={scannedVerified ? "success" : "default"}
                    size="small"
                    sx={{
                      backgroundColor: scannedVerified ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      color: scannedVerified ? '#6EE7B7' : '#CBD5E1',
                      border: scannedVerified ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.15)',
                      fontWeight: 600
                    }}
                  />
                </Box>

                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />

                {/* Doctor & Patient Info Box */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '14px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    mb: 2.5
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="#94A3B8" display="block">
                        DOCTOR
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="#F1F5F9">
                        Dr. Ananya Sharma
                      </Typography>
                      <Typography variant="caption" color="#64748B">
                        Lic: DL-49201 MD
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="#94A3B8" display="block">
                        PATIENT
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="#F1F5F9">
                        Rajesh Kumar
                      </Typography>
                      <Typography variant="caption" color="#64748B">
                        Age: 38 (Male)
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Medications Table Mock */}
                <Stack spacing={1.2} sx={{ mb: 3 }}>
                  <Typography variant="caption" color="#94A3B8" fontWeight={700}>
                    PRESCRIBED MEDICATIONS
                  </Typography>

                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="#38BDF8">
                        Amoxicillin 500mg
                      </Typography>
                      <Typography variant="caption" color="#94A3B8">
                        1 Capsule (1-0-1) | After Meal | 5 Days
                      </Typography>
                    </Box>
                    <Chip label="Dispensed" size="small" sx={{ height: 20, fontSize: '0.65rem', backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34D399' }} />
                  </Box>

                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="#38BDF8">
                        Paracetamol 650mg
                      </Typography>
                      <Typography variant="caption" color="#94A3B8">
                        1 Tablet (SOS) | As Needed
                      </Typography>
                    </Box>
                    <Chip label="Ready" size="small" sx={{ height: 20, fontSize: '0.65rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8' }} />
                  </Box>
                </Stack>

                {/* Animated Interactive QR Code Authentication Box */}
                <Box
                  onClick={handleSimulateScan}
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                    border: '1px dashed rgba(52, 211, 153, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2.5,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      borderColor: '#34D399'
                    }
                  }}
                >
                  {/* Laser Scan Line Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: '#34D399',
                      boxShadow: '0 0 10px #34D399, 0 0 20px #34D399',
                      animation: `${scanAnimation} 3s ease-in-out infinite`
                    }}
                  />

                  <Box
                    sx={{
                      p: 1,
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <QrCode2 sx={{ fontSize: 50, color: '#0F172A' }} />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={700} color="#FFFFFF">
                      Cryptographic QR Code
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 0.5 }}>
                      Pharmacists scan this code to verify authenticity instantly.
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 600 }}>
                      ⚡ Click to simulate live QR scan
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* Section 2: Ecosystem Breakdown for Doctors, Patients, and Pharmacists */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
            <Chip
              label="Connected Healthcare Network"
              size="small"
              sx={{
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                color: '#38BDF8',
                fontWeight: 700,
                mb: 2,
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            />
            <Typography variant="h2" component="h2" fontWeight={800} color="#FFFFFF" gutterBottom sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '2.8rem' } }}>
              Designed for Every Healthcare Role
            </Typography>
            <Typography variant="body1" color="#94A3B8" maxWidth="700px" mx="auto" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
              Medizo Life seamlessly integrates doctor workflows, patient prescription access, and pharmacist verification into one cohesive digital ecosystem.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            
            {/* Card 1: Doctors */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: 'rgba(56, 189, 248, 0.5)',
                    backgroundColor: 'rgba(56, 189, 248, 0.06)',
                    boxShadow: '0 16px 35px rgba(56, 189, 248, 0.15)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '14px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3
                  }}
                >
                  <LocalHospital sx={{ fontSize: 32, color: '#38BDF8' }} />
                </Box>
                <Chip label="For Doctors" size="small" sx={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontWeight: 700, mb: 1.5 }} />
                <Typography variant="h5" fontWeight={800} color="#FFFFFF" gutterBottom>
                  Digital Prescription Studio
                </Typography>
                <Typography variant="body2" color="#94A3B8" sx={{ mb: 3, lineHeight: 1.7 }}>
                  Create error-free digital prescriptions in seconds. Search pre-loaded Indian & global medicine databases, customize dosage instructions, and auto-generate QR verification stamps.
                </Typography>

                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#38BDF8', fontSize: 18 }} />
                    <Typography variant="body2" color="#CBD5E1">Instant Medicine Search & Dosage Presets</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#38BDF8', fontSize: 18 }} />
                    <Typography variant="body2" color="#CBD5E1">PDF Generation & Official Digital Signature</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#38BDF8', fontSize: 18 }} />
                    <Typography variant="body2" color="#CBD5E1">Search Patients by Mobile Number or ID</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Card 2: Patients */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: 'rgba(52, 211, 153, 0.5)',
                    backgroundColor: 'rgba(52, 211, 153, 0.06)',
                    boxShadow: '0 16px 35px rgba(52, 211, 153, 0.15)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '14px',
                    backgroundColor: 'rgba(52, 211, 153, 0.15)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3
                  }}
                >
                  <Person sx={{ fontSize: 32, color: '#34D399' }} />
                </Box>
                <Chip label="For Patients" size="small" sx={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34D399', fontWeight: 700, mb: 1.5 }} />
                <Typography variant="h5" fontWeight={800} color="#FFFFFF" gutterBottom>
                  Lifetime Health Vault
                </Typography>
                <Typography variant="body2" color="#94A3B8" sx={{ mb: 3, lineHeight: 1.7 }}>
                  Never lose a prescription again. Access your entire medical history from any phone, desktop, or tablet anytime. Present your QR code at pharmacies with total peace of mind.
                </Typography>

                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#34D399', fontSize: 18 }} />
                    <Typography variant="body2" color="#CBD5E1">Complete Prescription History Cloud Storage</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#34D399', fontSize: 18 }} />
                    <Typography variant="body2" color="#CBD5E1">1-Tap PDF Download & WhatsApp Share</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#34D399', fontSize: 18 }} />
                    <Typography variant="body2" color="#CBD5E1">Secure Access via Mobile OTP or Password</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Card 3: Pharmacists */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: 'rgba(251, 191, 36, 0.5)',
                    backgroundColor: 'rgba(251, 191, 36, 0.06)',
                    boxShadow: '0 16px 35px rgba(251, 191, 36, 0.15)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '14px',
                    backgroundColor: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3
                  }}
                >
                  <Storefront sx={{ fontSize: 32, color: '#FBBF24' }} />
                </Box>
                <Chip label="For Pharmacists" size="small" sx={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', fontWeight: 700, mb: 1.5 }} />
                <Typography variant="h5" fontWeight={800} color="#FFFFFF" gutterBottom>
                  Instant QR Dispensing
                </Typography>
                <Typography variant="body2" color="#94A3B8" sx={{ mb: 3, lineHeight: 1.7 }}>
                  Prevent counterfeit prescriptions and dispensing errors. Scan patient QR codes using any camera or webcam to instantly verify doctor signature, authenticity, and dosage.
                </Typography>

                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#FBBF24', fontSize: 18 }} />
                    <Typography variant="body2" color="#CBD5E1">Sub-second QR Code Scanner & Hash Check</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#FBBF24', fontSize: 18 }} />
                    <Typography variant="body2" color="#CBD5E1">Zero Paperwork Fraud Prevention</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#FBBF24', fontSize: 18 }} />
                    <Typography variant="body2" color="#CBD5E1">One-click Dispensing Log Confirmation</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* Section 3: Visual 3-Step Workflow ("How Medizo Works") */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
          <Chip
            label="Simple 3-Step Workflow"
            size="small"
            sx={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#34D399',
              fontWeight: 700,
              mb: 2,
              border: '1px solid rgba(52, 211, 153, 0.3)'
            }}
          />
          <Typography variant="h2" component="h2" fontWeight={800} color="#FFFFFF" gutterBottom sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '2.8rem' } }}>
            How Medizo Simplifies Healthcare
          </Typography>
          <Typography variant="body1" color="#94A3B8" maxWidth="650px" mx="auto" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
            From clinical consultation to pharmacy fulfillment in three effortless steps.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          
          {/* Step 1 */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Typography variant="h1" sx={{ position: 'absolute', top: -15, right: 15, fontSize: '5rem', fontWeight: 900, color: 'rgba(255, 255, 255, 0.05)', userSelect: 'none' }}>
                01
              </Typography>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <MedicalServices sx={{ color: '#FFFFFF', fontSize: 24 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="#FFFFFF" gutterBottom>
                1. Doctor Issues Prescription
              </Typography>
              <Typography variant="body2" color="#94A3B8" sx={{ lineHeight: 1.6 }}>
                Doctor enters diagnosis, selects medicines from built-in directory, adds advice, and signs digitally.
              </Typography>
            </Paper>
          </Grid>

          {/* Step 2 */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Typography variant="h1" sx={{ position: 'absolute', top: -15, right: 15, fontSize: '5rem', fontWeight: 900, color: 'rgba(255, 255, 255, 0.05)', userSelect: 'none' }}>
                02
              </Typography>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <QrCodeScanner sx={{ color: '#FFFFFF', fontSize: 24 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="#FFFFFF" gutterBottom>
                2. Cryptographic QR Auth
              </Typography>
              <Typography variant="body2" color="#94A3B8" sx={{ lineHeight: 1.6 }}>
                System instantly generates a tamper-proof QR code & cryptographic token embedded directly in the prescription.
              </Typography>
            </Paper>
          </Grid>

          {/* Step 3 */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Typography variant="h1" sx={{ position: 'absolute', top: -15, right: 15, fontSize: '5rem', fontWeight: 900, color: 'rgba(255, 255, 255, 0.05)', userSelect: 'none' }}>
                03
              </Typography>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <AssignmentTurnedIn sx={{ color: '#FFFFFF', fontSize: 24 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="#FFFFFF" gutterBottom>
                3. Pharmacist Scans & Dispenses
              </Typography>
              <Typography variant="body2" color="#94A3B8" sx={{ lineHeight: 1.6 }}>
                Pharmacist scans the QR code from patient’s smartphone screen to verify authenticity in real-time.
              </Typography>
            </Paper>
          </Grid>

        </Grid>
      </Container>

      {/* Section 4: Key Platform Features Grid */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
            <Typography variant="h3" component="h2" fontWeight={800} color="#FFFFFF" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.2rem', md: '2.5rem' } }}>
              Key Platform Capabilities
            </Typography>
            <Typography variant="body1" color="#94A3B8" maxWidth="600px" mx="auto">
              Built for precision, high performance, and compliance across desktop and mobile devices.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            
            {/* Feature 1 */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  p: 2.5,
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.3)'
                  }
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <QrCodeScanner sx={{ fontSize: 40, color: '#38BDF8', mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} color="#FFFFFF" gutterBottom>
                    QR Verification
                  </Typography>
                  <Typography variant="body2" color="#94A3B8" sx={{ lineHeight: 1.6 }}>
                    Every prescription carries a cryptographic QR code for fraud prevention and sub-second authenticity checks.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Feature 2 */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  p: 2.5,
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'rgba(52, 211, 153, 0.4)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.3)'
                  }
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <LocalHospital sx={{ fontSize: 40, color: '#34D399', mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} color="#FFFFFF" gutterBottom>
                    Doctor Management
                  </Typography>
                  <Typography variant="body2" color="#94A3B8" sx={{ lineHeight: 1.6 }}>
                    Streamlined prescription generation, medical history search, and customized clinic header branding.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Feature 3 */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  p: 2.5,
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'rgba(167, 139, 250, 0.4)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.3)'
                  }
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <Devices sx={{ fontSize: 40, color: '#A78BFA', mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} color="#FFFFFF" gutterBottom>
                    Multi-Device Apps
                  </Typography>
                  <Typography variant="body2" color="#94A3B8" sx={{ lineHeight: 1.6 }}>
                    Native Windows Desktop app installer, Web Application, and mobile-friendly responsive experience.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Feature 4 */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  p: 2.5,
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'rgba(251, 191, 36, 0.4)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.3)'
                  }
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <Security sx={{ fontSize: 40, color: '#FBBF24', mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} color="#FFFFFF" gutterBottom>
                    Privacy & Vault
                  </Typography>
                  <Typography variant="body2" color="#94A3B8" sx={{ lineHeight: 1.6 }}>
                    256-bit encrypted data storage protecting patient records and doctor medical credentials.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* Sticky Mobile Floating Action Bar */}
      {isMobile && !isAuthenticated && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 1100,
            p: 1.5,
            borderRadius: '20px',
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            gap: 1.5
          }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              py: 1.2,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '0.95rem'
            }}
          >
            Launch Workspace
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/login')}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF',
              fontWeight: 600,
              py: 1.2,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '0.95rem'
            }}
          >
            Sign In
          </Button>
        </Box>
      )}

      {/* Snackbar Notification for Interactive Demo */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%', fontWeight: 700, backgroundColor: '#059669', color: '#FFFFFF' }}
        >
          ✅ Prescription Cryptographic QR Code Verified!
        </Alert>
      </Snackbar>

      {/* Footer Section */}
      <Box sx={{ backgroundColor: '#040812', color: '#94A3B8', py: 6, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="space-between">
            
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Box
                  component="img"
                  src="/LOGO.png"
                  alt="Medizo Logo"
                  sx={{ width: 36, height: 36, borderRadius: '8px' }}
                  onError={(e: any) => { e.target.style.display = 'none'; }}
                />
                <Typography variant="h6" color="#FFFFFF" fontWeight={800}>
                  Medizo Life
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ mb: 2, color: '#94A3B8', lineHeight: 1.6 }}>
                Published by Develope Future. Standardized digital healthcare platform for verified digital prescriptions and secure patient data management.
              </Typography>
              <Typography variant="body2" color="#64748B">
                Support: contact@medizo.life
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack
                direction="row"
                spacing={3}
                flexWrap="wrap"
                useFlexGap
                justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                sx={{ pt: 1 }}
              >
                <Typography
                  component={RouterLink}
                  to="/privacy-policy"
                  variant="body2"
                  sx={{ color: '#CBD5E1', textDecoration: 'none', '&:hover': { color: '#38BDF8' } }}
                >
                  Privacy Policy
                </Typography>
                <Typography
                  component={RouterLink}
                  to="/terms"
                  variant="body2"
                  sx={{ color: '#CBD5E1', textDecoration: 'none', '&:hover': { color: '#38BDF8' } }}
                >
                  Terms of Service
                </Typography>
                <Typography
                  component={RouterLink}
                  to="/login"
                  variant="body2"
                  sx={{ color: '#CBD5E1', textDecoration: 'none', '&:hover': { color: '#38BDF8' } }}
                >
                  Sign In
                </Typography>
                <Typography
                  component={RouterLink}
                  to="/dashboard"
                  variant="body2"
                  sx={{ color: '#CBD5E1', textDecoration: 'none', '&:hover': { color: '#38BDF8' } }}
                >
                  Workspace
                </Typography>
              </Stack>
            </Grid>

          </Grid>

          <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
          <Typography variant="body2" textAlign="center" color="#64748B">
            © {new Date().getFullYear()} Medizo Life (Develope Future). All rights reserved.
          </Typography>
        </Container>
      </Box>

    </Box>
  );
};

export default Home;
