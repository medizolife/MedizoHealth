'use client';

import React from 'react';
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
  Paper
} from '@mui/material';
import {
  QrCodeScanner,
  LocalHospital,
  Security,
  Devices,
  ArrowForward,
  CheckCircleOutline,
  Login,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { isAuthenticated, user } = authState;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAF9' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0D1B2A 0%, #1B263B 50%, #1E3A8A 100%)',
          color: 'white',
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                <Box>
                  <Chip
                    label="Medizo Life Healthcare System"
                    color="primary"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      color: '#60A5FA',
                      fontWeight: 600,
                      mb: 2,
                      border: '1px solid rgba(96, 165, 250, 0.3)'
                    }}
                  />
                  <Typography
                    variant="h2"
                    component="h1"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '2.2rem', sm: '3rem', md: '3.5rem' },
                      lineHeight: 1.15,
                      letterSpacing: '-0.02em',
                      color: '#FFFFFF'
                    }}
                  >
                    Simplified Healthcare Management & Digital Prescriptions
                  </Typography>
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    color: '#94A3B8',
                    fontWeight: 400,
                    lineHeight: 1.6,
                    fontSize: { xs: '1rem', md: '1.2rem' }
                  }}
                >
                  Medizo Life connects doctors, patients, and pharmacists on a single secure platform. 
                  Generate verified digital prescriptions with QR code authentication and track medical history effortlessly.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
                  {isAuthenticated ? (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<DashboardIcon />}
                      onClick={() => navigate('/dashboard')}
                      sx={{
                        backgroundColor: '#10B981',
                        '&:hover': { backgroundColor: '#059669' },
                        px: 4,
                        py: 1.5,
                        borderRadius: '10px',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        textTransform: 'none'
                      }}
                    >
                      Go to Dashboard ({user?.name || user?.role})
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/register')}
                        sx={{
                          backgroundColor: '#2563EB',
                          '&:hover': { backgroundColor: '#1D4ED8' },
                          px: 4,
                          py: 1.5,
                          borderRadius: '10px',
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          textTransform: 'none'
                        }}
                      >
                        Create Account
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<Login />}
                        onClick={() => navigate('/login')}
                        sx={{
                          color: '#FFFFFF',
                          borderColor: 'rgba(255, 255, 255, 0.4)',
                          '&:hover': {
                            borderColor: '#FFFFFF',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)'
                          },
                          px: 4,
                          py: 1.5,
                          borderRadius: '10px',
                          fontSize: '1.05rem',
                          fontWeight: 600,
                          textTransform: 'none'
                        }}
                      >
                        Sign In
                      </Button>
                    </>
                  )}
                </Stack>

                <Stack direction="row" spacing={3} sx={{ pt: 2, color: '#CBD5E1' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutline sx={{ color: '#10B981', fontSize: 20 }} />
                    <Typography variant="body2">QR Verification</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutline sx={{ color: '#10B981', fontSize: 20 }} />
                    <Typography variant="body2">Windows & Mobile</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutline sx={{ color: '#10B981', fontSize: 20 }} />
                    <Typography variant="body2">256-bit Encrypted</Typography>
                  </Box>
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                elevation={12}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'white'
                }}
              >
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <LocalHospital sx={{ fontSize: 60, color: '#38BDF8', mb: 1 }} />
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Digital Health Ecosystem
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>
                    Empowering healthcare providers and patients with instant digital prescription workflows.
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Chip label="Doctors" color="info" size="small" />
                    <Typography variant="body2" sx={{ color: '#E2E8F0' }}>
                      Issue digital prescriptions with precise dosage, instructions, and instant QR verification.
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Chip label="Patients" color="success" size="small" />
                    <Typography variant="body2" sx={{ color: '#E2E8F0' }}>
                      Access full medical prescription history on mobile and desktop anytime, anywhere.
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Chip label="Pharmacists" color="warning" size="small" />
                    <Typography variant="body2" sx={{ color: '#E2E8F0' }}>
                      Scan QR codes directly from patient devices to verify prescription authenticity.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Grid Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" component="h2" fontWeight={800} color="#0F172A" gutterBottom>
            Key Platform Capabilities
          </Typography>
          <Typography variant="body1" color="#64748B" maxWidth="650px" mx="auto">
            Medizo Life provides standard-compliant digital healthcare tools designed for simplicity, speed, and absolute security.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                p: 2,
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.06)'
                }
              }}
            >
              <CardContent>
                <QrCodeScanner sx={{ fontSize: 44, color: '#2563EB', mb: 2 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  QR Code Verification
                </Typography>
                <Typography variant="body2" color="#64748B">
                  Every prescription is backed by a cryptographic QR code for fraud prevention and instant authenticity checks.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                p: 2,
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.06)'
                }
              }}
            >
              <CardContent>
                <LocalHospital sx={{ fontSize: 44, color: '#10B981', mb: 2 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Doctor Management
                </Typography>
                <Typography variant="body2" color="#64748B">
                  Streamlined prescription creation, patient records management, and customizable treatment templates.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                p: 2,
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.06)'
                }
              }}
            >
              <CardContent>
                <Devices sx={{ fontSize: 44, color: '#8B5CF6', mb: 2 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Multi-Device Support
                </Typography>
                <Typography variant="body2" color="#64748B">
                  Fully supported on Windows 10 & 11 Desktop, Web browsers, and Android mobile devices.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                p: 2,
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.06)'
                }
              }}
            >
              <CardContent>
                <Security sx={{ fontSize: 44, color: '#F59E0B', mb: 2 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Privacy & Encryption
                </Typography>
                <Typography variant="body2" color="#64748B">
                  Patient record confidentiality built in compliance with privacy policies and data protection standards.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Footer / Info Section */}
      <Box sx={{ backgroundColor: '#0F172A', color: '#94A3B8', py: 6, borderTop: '1px solid #1E293B' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="space-between">
            <Grid item xs={12} md={5}>
              <Typography variant="h6" color="#FFFFFF" fontWeight={700} gutterBottom>
                Medizo Life
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Published by Develope Future. Providing healthcare management solutions and secure digital prescription workflows.
              </Typography>
              <Typography variant="body2">
                Contact Support: contact@medizo.life
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={3} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
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
                  to="/register"
                  variant="body2"
                  sx={{ color: '#CBD5E1', textDecoration: 'none', '&:hover': { color: '#38BDF8' } }}
                >
                  Register
                </Typography>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, borderColor: '#1E293B' }} />
          <Typography variant="body2" textAlign="center" color="#64748B">
            © {new Date().getFullYear()} Medizo Life (Develope Future). All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
