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
  keyframes,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
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
  AutoAwesome,
  HealthAndSafety,
  Shield,
  Smartphone,
  AssignmentTurnedIn,
  CheckCircle,
  Lock,
  Speed,
  Analytics,
  Inventory,
  ReceiptLong,
  FactCheck,
  CloudDone
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Keyframe Animations for Crisp Vector UI
const pulseDot = keyframes`
  0% { opacity: 0.4; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.4; transform: scale(0.95); }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
`;

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Auth state & direct workspace redirection
  const { authState } = useAuth();
  const isAuthenticated = authState?.isAuthenticated || (typeof window !== 'undefined' && Boolean(localStorage.getItem('token')));
  const user = authState?.user;

  // If user is already authenticated, directly navigate to workspace/dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        backgroundColor: '#F8FAFC', 
        color: '#0F172A', 
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      
      {/* Light Happy Mood Ambient Background Gradients */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '750px',
          backgroundImage: `radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.08) 0%, transparent 60%), radial-gradient(circle at 85% 25%, rgba(56, 189, 248, 0.1) 0%, transparent 60%), url('/images/hero_light_bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.85,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 4, sm: 7, md: 10 },
          pb: { xs: 8, sm: 10, md: 12 },
          position: 'relative',
          zIndex: 1
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            
            {/* Left Hero Content */}
            <Grid item xs={12} md={6.5}>
              <Stack spacing={3}>
                
                {/* Cheerful Ecosystem Badge */}
                <Box>
                  <Chip
                    icon={<AutoAwesome sx={{ color: '#059669 !important', fontSize: '18px' }} />}
                    label="Medizo Life • Modern Healthcare Ecosystem"
                    sx={{
                      backgroundColor: '#ECFDF5',
                      color: '#047857',
                      fontWeight: 700,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      py: 2.2,
                      px: 1,
                      borderRadius: '30px',
                      border: '1px solid #A7F3D0',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.12)'
                    }}
                  />
                </Box>

                {/* Main Heading */}
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '2.2rem', sm: '3.1rem', md: '3.6rem' },
                    lineHeight: { xs: 1.2, md: 1.15 },
                    letterSpacing: '-0.02em',
                    color: '#0F172A'
                  }}
                >
                  Empowering Modern Healthcare with{' '}
                  <Box
                    component="span"
                    sx={{
                      background: 'linear-gradient(135deg, #059669 0%, #0284C7 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      display: 'inline'
                    }}
                  >
                    Trust & Simplicity
                  </Box>
                </Typography>

                {/* Clear & Understandable Subtitle */}
                <Typography
                  variant="h6"
                  sx={{
                    color: '#475569',
                    fontWeight: 400,
                    lineHeight: 1.65,
                    fontSize: { xs: '1rem', sm: '1.125rem', md: '1.2rem' }
                  }}
                >
                  Medizo Life connects doctors, patients, and pharmacies on one simple, secure, and encrypted digital network. 
                  Streamline consultations, access health history, and verify care effortlessly.
                </Typography>

                {/* Action Buttons */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
                  {isAuthenticated ? (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<DashboardIcon />}
                      onClick={() => navigate('/dashboard')}
                      sx={{
                        backgroundColor: '#10B981',
                        '&:hover': { backgroundColor: '#059669', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)' },
                        px: 4,
                        py: 1.8,
                        borderRadius: '14px',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)'
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
                          background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.35)',
                            transform: 'translateY(-2px)'
                          },
                          px: 4,
                          py: 1.8,
                          borderRadius: '14px',
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)',
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
                          color: '#0F172A',
                          borderColor: '#CBD5E1',
                          backgroundColor: '#FFFFFF',
                          '&:hover': {
                            borderColor: '#0284C7',
                            backgroundColor: '#F0F9FF',
                            transform: 'translateY(-2px)'
                          },
                          px: 4,
                          py: 1.8,
                          borderRadius: '14px',
                          fontSize: '1.05rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
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
                  sx={{ pt: 2, color: '#475569' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutline sx={{ color: '#059669', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={600}>Verified Healthcare Portal</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutline sx={{ color: '#059669', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={600}>Windows & Mobile Native</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutline sx={{ color: '#059669', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={600}>256-bit Encrypted Vault</Typography>
                  </Box>
                </Stack>

              </Stack>
            </Grid>

            {/* Right Hero Crisp 3D Animated UI Card */}
            <Grid item xs={12} md={5.5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '24px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `${floatAnimation} 6s ease-in-out infinite`
                }}
              >
                {/* Header Status Bar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '12px',
                        backgroundColor: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <HealthAndSafety sx={{ color: '#059669', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
                        Medizo Platform Suite
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Enterprise Digital Care Ecosystem
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        animation: `${pulseDot} 2s infinite ease-in-out`
                      }}
                    />
                    <Chip
                      icon={<VerifiedUser sx={{ color: '#059669 !important', fontSize: '15px' }} />}
                      label="Certified Secure"
                      size="small"
                      sx={{
                        backgroundColor: '#ECFDF5',
                        color: '#047857',
                        border: '1px solid #A7F3D0',
                        fontWeight: 700
                      }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ borderColor: '#F1F5F9', my: 2 }} />

                {/* Gorgeous 3D Animated Illustration */}
                <Box
                  sx={{
                    width: '100%',
                    height: { xs: 220, sm: 260 },
                    borderRadius: '16px',
                    overflow: 'hidden',
                    mb: 2.5,
                    border: '1px solid #F1F5F9',
                    backgroundColor: '#F8FAFC'
                  }}
                >
                  <Box
                    component="img"
                    src="/images/hero_medical_portal.png"
                    alt="Medizo Healthcare Suite"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>

                {/* Bottom Highlight Statistics */}
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      <Typography variant="caption" color="#059669" fontWeight={700} display="block">
                        AUTHENTICATION
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="#0F172A">
                        100% Tamper-Proof
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      <Typography variant="caption" color="#0284C7" fontWeight={700} display="block">
                        CROSS-PLATFORM
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="#0F172A">
                        Desktop & Mobile
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* Section 2: Professional Ecosystem Roles (With Clean 3D Animated Feature Graphics) */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          borderBottom: '1px solid #E2E8F0',
          position: 'relative'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
            <Chip
              label="Unified Healthcare Network"
              size="small"
              sx={{
                backgroundColor: '#F0F9FF',
                color: '#0284C7',
                fontWeight: 700,
                mb: 2,
                border: '1px solid #BAE6FD'
              }}
            />
            <Typography 
              variant="h2" 
              component="h2" 
              fontWeight={900} 
              color="#0F172A" 
              gutterBottom 
              sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '2.8rem' } }}
            >
              Built for Every Healthcare Role
            </Typography>
            <Typography variant="body1" color="#475569" maxWidth="700px" mx="auto" sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
              Medizo Life brings together medical consultations, patient history management, and pharmacy verification into one smooth and accessible platform.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            
            {/* Card 1: Doctor Studio Card */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  height: '100%',
                  borderRadius: '20px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: '#0284C7',
                    boxShadow: '0 20px 40px -15px rgba(2, 132, 199, 0.15)',
                    backgroundColor: '#FFFFFF'
                  }
                }}
              >
                {/* 3D Animated Illustration for Doctor Studio */}
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    mb: 3,
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F0F9FF'
                  }}
                >
                  <Box
                    component="img"
                    src="/images/doctor_care_feature.png"
                    alt="Doctor Studio Workspace"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>

                <Chip label="For Doctors" size="small" sx={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 700, mb: 1.5, alignSelf: 'flex-start' }} />
                
                <Typography variant="h5" fontWeight={800} color="#0F172A" gutterBottom>
                  Doctor Studio
                </Typography>
                <Typography variant="body2" color="#475569" sx={{ mb: 3, lineHeight: 1.7, flexGrow: 1 }}>
                  Create accurate digital records in seconds. Access pre-loaded medicine directories, customize treatment instructions, and manage patient care history seamlessly.
                </Typography>

                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#0284C7', fontSize: 18 }} />
                    <Typography variant="body2" color="#334155" fontWeight={500}>Fast Medicine Search & Presets</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#0284C7', fontSize: 18 }} />
                    <Typography variant="body2" color="#334155" fontWeight={500}>Digital Document Generation & Signature</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#0284C7', fontSize: 18 }} />
                    <Typography variant="body2" color="#334155" fontWeight={500}>Patient History Lookup by Mobile or ID</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Card 2: Patient Vault Card */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  height: '100%',
                  borderRadius: '20px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: '#059669',
                    boxShadow: '0 20px 40px -15px rgba(5, 150, 105, 0.15)',
                    backgroundColor: '#FFFFFF'
                  }
                }}
              >
                {/* 3D Animated Illustration for Patient Vault */}
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    mb: 3,
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#ECFDF5'
                  }}
                >
                  <Box
                    component="img"
                    src="/images/patient_wellness_feature.png"
                    alt="Personal Health Vault"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>

                <Chip label="For Patients" size="small" sx={{ backgroundColor: '#ECFDF5', color: '#047857', fontWeight: 700, mb: 1.5, alignSelf: 'flex-start' }} />
                
                <Typography variant="h5" fontWeight={800} color="#0F172A" gutterBottom>
                  Personal Health Vault
                </Typography>
                <Typography variant="body2" color="#475569" sx={{ mb: 3, lineHeight: 1.7, flexGrow: 1 }}>
                  Keep all your medical records safe and organized in one spot. Access your health history anytime from your smartphone, tablet, or PC with total security.
                </Typography>

                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#059669', fontSize: 18 }} />
                    <Typography variant="body2" color="#334155" fontWeight={500}>Lifetime Digital Record Access</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#059669', fontSize: 18 }} />
                    <Typography variant="body2" color="#334155" fontWeight={500}>1-Tap PDF Download & Sharing</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#059669', fontSize: 18 }} />
                    <Typography variant="body2" color="#334155" fontWeight={500}>Secure Mobile OTP & Password Login</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Card 3: Pharmacy Fulfillment Card */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  height: '100%',
                  borderRadius: '20px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: '#7C3AED',
                    boxShadow: '0 20px 40px -15px rgba(124, 58, 237, 0.15)',
                    backgroundColor: '#FFFFFF'
                  }
                }}
              >
                {/* 3D Animated Illustration for Pharmacy Fulfillment */}
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    mb: 3,
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F3E8FF'
                  }}
                >
                  <Box
                    component="img"
                    src="/images/pharmacy_verification_feature.png"
                    alt="Pharmacy Verification"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>

                <Chip label="For Pharmacies" size="small" sx={{ backgroundColor: '#F3E8FF', color: '#6B21A8', fontWeight: 700, mb: 1.5, alignSelf: 'flex-start' }} />
                
                <Typography variant="h5" fontWeight={800} color="#0F172A" gutterBottom>
                  Pharmacy Fulfillment
                </Typography>
                <Typography variant="body2" color="#475569" sx={{ mb: 3, lineHeight: 1.7, flexGrow: 1 }}>
                  Ensure accurate medicine fulfillment and prevent errors. Quickly check prescription authenticity and track fulfillment status with simple digital tools.
                </Typography>

                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#7C3AED', fontSize: 18 }} />
                    <Typography variant="body2" color="#334155" fontWeight={500}>Fast Digital Verification</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#7C3AED', fontSize: 18 }} />
                    <Typography variant="body2" color="#334155" fontWeight={500}>Clear Dosage & Instruction Checks</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutline sx={{ color: '#7C3AED', fontSize: 18 }} />
                    <Typography variant="body2" color="#334155" fontWeight={500}>One-Click Fulfillment Logging</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* Section 3: Simple 3-Step Workflow ("How Medizo Works") */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
          <Chip
            label="Simple 3-Step Workflow"
            size="small"
            sx={{
              backgroundColor: '#ECFDF5',
              color: '#047857',
              fontWeight: 700,
              mb: 2,
              border: '1px solid #A7F3D0'
            }}
          />
          <Typography variant="h2" component="h2" fontWeight={900} color="#0F172A" gutterBottom sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '2.8rem' } }}>
            How Medizo Simplifies Care
          </Typography>
          <Typography variant="body1" color="#475569" maxWidth="650px" mx="auto" sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
            From clinical consultation to medicine fulfillment in three clear, hassle-free steps.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          
          {/* Step 1 */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: '100%',
                borderRadius: '20px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                position: 'relative',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h1" sx={{ position: 'absolute', top: -10, right: 20, fontSize: '4.5rem', fontWeight: 900, color: '#F1F5F9', userSelect: 'none' }}>
                01
              </Typography>
              <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <MedicalServices sx={{ color: '#FFFFFF', fontSize: 26 }} />
              </Box>
              <Typography variant="h6" fontWeight={800} color="#0F172A" gutterBottom>
                1. Doctor Consultation
              </Typography>
              <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                The doctor completes the examination, selects prescribed items from the built-in database, adds advice, and creates a clean digital record.
              </Typography>
            </Paper>
          </Grid>

          {/* Step 2 */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: '100%',
                borderRadius: '20px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                position: 'relative',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h1" sx={{ position: 'absolute', top: -10, right: 20, fontSize: '4.5rem', fontWeight: 900, color: '#F1F5F9', userSelect: 'none' }}>
                02
              </Typography>
              <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <Lock sx={{ color: '#FFFFFF', fontSize: 26 }} />
              </Box>
              <Typography variant="h6" fontWeight={800} color="#0F172A" gutterBottom>
                2. Encrypted Vault Sync
              </Typography>
              <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                Records are instantly protected with 256-bit encryption and synced safely to the patient’s personal healthcare vault.
              </Typography>
            </Paper>
          </Grid>

          {/* Step 3 */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                height: '100%',
                borderRadius: '20px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                position: 'relative',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h1" sx={{ position: 'absolute', top: -10, right: 20, fontSize: '4.5rem', fontWeight: 900, color: '#F1F5F9', userSelect: 'none' }}>
                03
              </Typography>
              <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
                <AssignmentTurnedIn sx={{ color: '#FFFFFF', fontSize: 26 }} />
              </Box>
              <Typography variant="h6" fontWeight={800} color="#0F172A" gutterBottom>
                3. Seamless Care Delivery
              </Typography>
              <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                Patients can review details or share records with their chosen pharmacist for easy, accurate medicine dispensing.
              </Typography>
            </Paper>
          </Grid>

        </Grid>
      </Container>

      {/* Section 4: Key Platform Capabilities Grid */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
            <Typography variant="h3" component="h2" fontWeight={800} color="#0F172A" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.2rem', md: '2.5rem' } }}>
              Key Platform Capabilities
            </Typography>
            <Typography variant="body1" color="#475569" maxWidth="600px" mx="auto">
              Built for speed, accuracy, and maximum privacy across desktop and mobile devices.
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
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#0284C7',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.06)'
                  }
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <Shield sx={{ fontSize: 40, color: '#0284C7', mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} color="#0F172A" gutterBottom>
                    Verified Care
                  </Typography>
                  <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                    Guarantees medical record authenticity and prevents prescription errors across clinics.
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
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#059669',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.06)'
                  }
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <LocalHospital sx={{ fontSize: 40, color: '#059669', mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} color="#0F172A" gutterBottom>
                    Doctor Management
                  </Typography>
                  <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                    Fast record entry, patient directory lookup, and customized header branding for clinics.
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
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#7C3AED',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.06)'
                  }
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <Devices sx={{ fontSize: 40, color: '#7C3AED', mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} color="#0F172A" gutterBottom>
                    Multi-Device Access
                  </Typography>
                  <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                    Native Windows Desktop app, Web Application, and mobile-responsive layout for any device.
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
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#D97706',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.06)'
                  }
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <Security sx={{ fontSize: 40, color: '#D97706', mb: 2 }} />
                  <Typography variant="h6" fontWeight={700} color="#0F172A" gutterBottom>
                    Encrypted Privacy
                  </Typography>
                  <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
                    Industry-standard 256-bit encryption safeguards sensitive health records and credentials.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        </Container>
      </Box>



      {/* Footer Section */}
      <Box sx={{ backgroundColor: '#0F172A', color: '#94A3B8', pt: 6, pb: { xs: '100px', md: 6 } }}>
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
                Published by Develope Future. Standardized digital healthcare platform for verified digital care records and secure patient management.
              </Typography>
              <Typography variant="body2" color="#64748B">
                Support: info@medizo.life
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

          <Divider sx={{ my: 4, borderColor: '#334155' }} />
          <Typography variant="body2" textAlign="center" color="#64748B">
            © {new Date().getFullYear()} Medizo Life (Develope Future). All rights reserved.
          </Typography>
        </Container>
      </Box>

    </Box>
  );
};

export default Home;
