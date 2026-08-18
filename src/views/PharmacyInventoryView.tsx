'use client';
import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Avatar,
  Chip,
  IconButton,
  Grid
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocalPharmacy as PharmacyIcon,
  AutoAwesome as SparklesIcon,
  NotificationsActive as AlertIcon,
  QrCodeScanner as QrIcon,
  Dataset as CatalogIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

export default function PharmacyInventoryView() {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { user } = authState;
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const upcomingFeatures = [
    {
      icon: <SpeedIcon sx={{ fontSize: 28, color: '#10B981' }} />,
      title: 'Auto-Deduct on Dispense',
      desc: 'Live stock deductions automatically update your inventory when prescriptions are dispensed to patients.'
    },
    {
      icon: <AlertIcon sx={{ fontSize: 28, color: '#F59E0B' }} />,
      title: 'Smart Expiry & Low Stock Alerts',
      desc: 'Proactive warnings when batch expiry dates approach or inventory levels drop below minimum safety buffers.'
    },
    {
      icon: <CatalogIcon sx={{ fontSize: 28, color: '#6366F1' }} />,
      title: '250,000+ Indian Medicine Catalog',
      desc: 'Instant 1-click import with pre-filled generic compositions, standard dosages, and therapeutic categories.'
    },
    {
      icon: <QrIcon sx={{ fontSize: 28, color: '#EC4899' }} />,
      title: 'Batch, Rack & Barcode Tracking',
      desc: 'Organize physical rack shelf locations, track manufacturer batch numbers, MRP, and GST tax codes.'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3.5, px: { xs: 2, sm: 3, md: 4 }, pb: 14, fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Breadcrumb / Action Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3.5,
          borderRadius: '24px',
          bgcolor: isDark ? 'rgba(17, 29, 26, 0.85)' : 'rgba(255, 255, 255, 0.95)',
          border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(18, 48, 41, 0.1)',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: isDark ? '0 16px 36px rgba(0, 0, 0, 0.4)' : '0 12px 32px rgba(18, 48, 41, 0.06)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate('/dashboard')}
              sx={{
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                color: isDark ? '#FFFFFF' : '#123029',
                borderRadius: '16px',
                p: 1.2,
                '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0', transform: 'translateX(-2px)' },
                transition: 'all 0.2s ease'
              }}
            >
              <BackIcon />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: { xs: 44, sm: 50 },
                  height: { xs: 44, sm: 50 },
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '1.3rem',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
                }}
              >
                📦
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#123029', fontFamily: "'Outfit', sans-serif", fontSize: { xs: '1.05rem', sm: '1.25rem' }, lineHeight: 1.2 }}>
                  Stock &amp; Inventory Management
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 800, display: 'block', mt: 0.2 }}>
                  {user?.pharmacyName || 'Medizo Care Pharmacy'} • Enterprise Module
                </Typography>
              </Box>
            </Box>
          </Box>

          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/dashboard')}
            startIcon={<PharmacyIcon sx={{ fontSize: '18px !important' }} />}
            sx={{
              borderRadius: '14px',
              fontWeight: 900,
              fontSize: '0.82rem',
              textTransform: 'none',
              px: 2,
              py: 0.9,
              fontFamily: "'Outfit', sans-serif",
              color: isDark ? '#34D399' : '#0D9488',
              borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : '#99F6E4',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDFA',
              '&:hover': {
                bgcolor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#CCFBF1',
                borderColor: '#10B981'
              }
            }}
          >
            ← Back to Rx Dispense Feed
          </Button>
        </Box>
      </Paper>

      {/* Main Coming Soon Hero Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3.5, sm: 5, md: 6 },
          borderRadius: '32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
          border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: isDark ? '0 24px 48px rgba(0, 0, 0, 0.5)' : '0 20px 44px rgba(16, 185, 129, 0.08)'
        }}
      >
        {/* Background glow orb */}
        <Box
          sx={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 70%)',
            pointerEvents: 'none',
            borderRadius: '50%'
          }}
        />

        {/* Status Pill */}
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Chip
            icon={<SparklesIcon sx={{ fontSize: 16, color: '#10B981 !important' }} />}
            label="IN ACTIVE DEVELOPMENT"
            sx={{
              fontWeight: 900,
              letterSpacing: 1.2,
              fontSize: '0.75rem',
              py: 2,
              px: 1,
              borderRadius: '14px',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
              color: isDark ? '#34D399' : '#047857',
              border: isDark ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #A7F3D0'
            }}
          />
        </Box>

        {/* Animated Icon Avatar */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
          <Avatar
            sx={{
              width: { xs: 80, sm: 96 },
              height: { xs: 80, sm: 96 },
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4)',
              fontSize: { xs: '2.5rem', sm: '3rem' }
            }}
          >
            📦
          </Avatar>
        </Box>

        {/* Hero Title */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 900,
            color: isDark ? '#F8FAFC' : '#0F172A',
            fontFamily: "'Outfit', sans-serif",
            fontSize: { xs: '1.8rem', sm: '2.4rem', md: '2.8rem' },
            letterSpacing: '-0.02em',
            mb: 1.5
          }}
        >
          Smart Pharmacy Stock &amp; Inventory
        </Typography>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Outfit', sans-serif",
            fontSize: { xs: '1.2rem', sm: '1.4rem' },
            mb: 2
          }}
        >
          Coming Soon
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          sx={{
            maxWidth: '680px',
            mx: 'auto',
            color: isDark ? '#94A3B8' : '#64748B',
            fontSize: { xs: '0.95rem', sm: '1.05rem' },
            lineHeight: 1.6,
            mb: 4.5
          }}
        >
          We are building an intelligent, real-time stock ledger integrated directly with digital prescription dispensing, automated expiry alerts, batch management, and a verified 250k+ Indian medicine database.
        </Typography>

        {/* Action Button */}
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/dashboard')}
          startIcon={<PharmacyIcon />}
          sx={{
            borderRadius: '16px',
            fontWeight: 900,
            fontSize: '0.95rem',
            px: 3.5,
            py: 1.4,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
              boxShadow: '0 12px 28px rgba(16, 185, 129, 0.5)'
            }
          }}
        >
          Go to Prescription Dispense Hub
        </Button>
      </Paper>

      {/* Upcoming Feature Highlights */}
      <Box sx={{ mt: 5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 900,
            color: isDark ? '#34D399' : '#059669',
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            fontSize: '0.75rem',
            display: 'block',
            textAlign: 'center',
            mb: 2.5
          }}
        >
          What's Coming in this Module
        </Typography>

        <Grid container spacing={2.5}>
          {upcomingFeatures.map((feat, idx) => (
            <Grid item xs={12} sm={6} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: '24px',
                  bgcolor: isDark ? 'rgba(15, 23, 42, 0.65)' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(16, 185, 129, 0.15)',
                  boxShadow: isDark ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : '#10B981',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: '16px',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {feat.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', mb: 0.5 }}>
                      {feat.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', lineHeight: 1.5, fontSize: '0.85rem' }}>
                      {feat.desc}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
