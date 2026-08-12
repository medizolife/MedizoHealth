'use client';
import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Security as SecurityIcon,
  VerifiedUser as VerifiedIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  AssignmentTurnedIn as ComplianceIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { digilockerAPI } from '../services/api';
import { useThemeContext } from '../contexts/ThemeContext';

interface DigiLockerGuardProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

export const DigiLockerGuard: React.FC<DigiLockerGuardProps> = ({
  title = "DigiLocker Verification Required",
  message = "In accordance with medical compliance and prescription safety regulations, doctors must verify their identity using DigiLocker before accessing prescription tools or creating patients.",
  showBackButton = true
}) => {
  const navigate = useNavigate();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const [loading, setLoading] = useState(false);

  const handleVerifyClick = () => {
    setLoading(true);
    window.location.href = digilockerAPI.getAuthorizeUrl();
  };

  return (
    <Container maxWidth="md" sx={{ pt: { xs: 3, sm: 6 }, pb: 8, px: { xs: 2, sm: 3 } }}>
      <Paper
        className={isDark ? "glass-card-dark" : "glass-card"}
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: '24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          border: isDark 
            ? '1.5px solid rgba(239, 68, 68, 0.3)' 
            : '1.5px solid rgba(220, 38, 38, 0.2)',
          background: isDark
            ? 'linear-gradient(135deg, rgba(26, 20, 20, 0.95) 0%, rgba(18, 14, 14, 0.98) 100%) !important'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(254, 242, 242, 0.95) 100%) !important',
          boxShadow: isDark
            ? '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)'
            : '0 16px 40px rgba(220, 38, 38, 0.12)'
        }}
      >
        {/* Lock Icon Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box
            sx={{
              position: 'relative',
              p: 2.5,
              borderRadius: '50%',
              bgcolor: 'rgba(239, 68, 68, 0.12)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              boxShadow: '0 0 24px rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LockIcon sx={{ fontSize: 52 }} />
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                bgcolor: '#dc2626',
                color: '#ffffff',
                borderRadius: '50%',
                p: 0.5,
                display: 'flex'
              }}
            >
              <SecurityIcon sx={{ fontSize: 18 }} />
            </Box>
          </Box>
        </Box>

        {/* Status Chip */}
        <Chip
          icon={<LockIcon sx={{ fontSize: '16px !important', color: '#ffffff !important' }} />}
          label="ACCESS LOCKED • DIGILOCKER UNVERIFIED"
          sx={{
            bgcolor: '#dc2626',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.72rem',
            letterSpacing: '0.05em',
            px: 1,
            py: 0.5,
            mb: 2.5,
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
          }}
        />

        {/* Title & Description */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 900,
            color: isDark ? '#ffffff' : '#111827',
            letterSpacing: '-0.02em',
            mb: 1.5,
            fontSize: { xs: '1.25rem', sm: '1.6rem' }
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: isDark ? 'rgba(255, 255, 255, 0.78)' : '#4b5563',
            maxWidth: '560px',
            mx: 'auto',
            mb: 4,
            fontSize: { xs: '0.875rem', sm: '0.975rem' },
            lineHeight: 1.6
          }}
        >
          {message}
        </Typography>

        {/* Info Box */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            maxWidth: '520px',
            mx: 'auto',
            borderRadius: '16px',
            bgcolor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(254, 226, 226, 0.6)',
            border: isDark ? '1px dashed rgba(239, 68, 68, 0.25)' : '1px dashed rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            textAlign: 'left'
          }}
        >
          <ComplianceIcon sx={{ color: '#dc2626', fontSize: 28, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#991b1b', fontSize: '0.8rem', lineHeight: 1.4, fontWeight: 500 }}>
            Verifying your account takes less than 60 seconds using government DigiLocker PKCE. Once verified, instant access to prescription creation & patient management is unlocked.
          </Typography>
        </Paper>

        {/* Buttons */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', gap: 2, maxWidth: '440px', mx: 'auto' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleVerifyClick}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VerifiedIcon />}
            sx={{
              flex: 1,
              bgcolor: '#dc2626',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.925rem',
              py: 1.4,
              borderRadius: '14px',
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(220, 38, 38, 0.4)',
              '&:hover': {
                bgcolor: '#b91c1c',
                boxShadow: '0 12px 28px rgba(220, 38, 38, 0.5)'
              }
            }}
          >
            {loading ? 'Redirecting to DigiLocker...' : 'Verify with DigiLocker'}
          </Button>

          {showBackButton && (
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/dashboard')}
              startIcon={<ArrowBackIcon />}
              sx={{
                flex: { sm: '0 0 auto' },
                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                color: isDark ? '#ffffff' : '#374151',
                fontWeight: 700,
                fontSize: '0.875rem',
                py: 1.4,
                px: 3,
                borderRadius: '14px',
                textTransform: 'none',
                '&:hover': {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              Dashboard
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default DigiLockerGuard;
