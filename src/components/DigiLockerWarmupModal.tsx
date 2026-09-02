'use client';
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
  Avatar,
  Fade
} from '@mui/material';
import {
  Security as SecurityIcon,
  VerifiedUser as VerifiedIcon,
  LockOutlined as LockIcon,
  CloudQueue as CloudIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { digilockerAPI } from '../services/api';

interface DigiLockerWarmupModalProps {
  open: boolean;
  onClose?: () => void;
}

export const DigiLockerWarmupModal: React.FC<DigiLockerWarmupModalProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Waking up secure verification gateway...');

  useEffect(() => {
    if (!open) {
      setStep(1);
      setProgress(15);
      setStatusText('Waking up secure verification gateway...');
      return;
    }

    let isMounted = true;

    // Fire warmup ping to Vercel in parallel
    digilockerAPI.pingServer().catch(() => {});

    // Step 1: Initial warmup (0ms - 1000ms)
    setStep(1);
    setProgress(25);
    setStatusText('Waking up secure verification gateway...');

    const t1 = setTimeout(() => {
      if (!isMounted) return;
      setStep(2);
      setProgress(60);
      setStatusText('Establishing SSL handshake with DigiLocker...');
    }, 1000);

    // Step 2: Verification prep (1000ms - 2200ms)
    const t2 = setTimeout(() => {
      if (!isMounted) return;
      setStep(3);
      setProgress(88);
      setStatusText('Getting details & preparing MeriPehchaan portal...');
    }, 2200);

    // Step 3: Final redirect (3200ms)
    const t3 = setTimeout(() => {
      if (!isMounted) return;
      setProgress(100);
      setStatusText('Connecting to DigiLocker now...');
      setTimeout(async () => {
        try {
          const authUrl = await digilockerAPI.startAuth();
          if (authUrl) {
            window.location.href = authUrl;
            return;
          }
        } catch (e) {
          console.warn('Direct startAuth notice, falling back to standard redirect:', e);
        }
        window.location.href = digilockerAPI.getAuthorizeUrl();
      }, 400);
    }, 3200);

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      TransitionComponent={Fade}
      transitionDuration={400}
      PaperProps={{
        sx: {
          borderRadius: '28px',
          bgcolor: '#0E1719',
          backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(0, 200, 150, 0.15) 0%, rgba(14, 23, 25, 0.98) 80%)',
          border: '1.5px solid rgba(0, 200, 150, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 200, 150, 0.25)',
          maxWidth: 440,
          width: '92%',
          p: { xs: 2.5, sm: 4 },
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Animated Central Icon with Pulsing Halo */}
        <Box sx={{ position: 'relative', mb: 3, mt: 1 }}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 90,
              height: 90,
              borderRadius: '50%',
              bgcolor: 'rgba(0, 200, 150, 0.18)',
              animation: 'pulse 1.8s ease-in-out infinite',
              '@keyframes pulse': {
                '0%': { transform: 'translate(-50%, -50%) scale(0.9)', opacity: 0.5 },
                '50%': { transform: 'translate(-50%, -50%) scale(1.25)', opacity: 0.9 },
                '100%': { transform: 'translate(-50%, -50%) scale(0.9)', opacity: 0.5 }
              }
            }}
          />
          <Avatar
            sx={{
              width: 68,
              height: 68,
              bgcolor: '#00C896',
              color: '#0B1315',
              boxShadow: '0 0 25px rgba(0, 200, 150, 0.6)',
              position: 'relative',
              zIndex: 2
            }}
          >
            {step === 3 ? (
              <CheckCircleIcon sx={{ fontSize: 38 }} />
            ) : step === 2 ? (
              <SecurityIcon sx={{ fontSize: 36 }} />
            ) : (
              <CloudIcon sx={{ fontSize: 36 }} />
            )}
          </Avatar>
        </Box>

        {/* Title */}
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#EBF5F3', mb: 1, letterSpacing: '-0.3px' }}>
          Connecting to <span style={{ color: '#00C896' }}>DigiLocker</span>
        </Typography>

        {/* Dynamic Status message */}
        <Typography variant="body2" sx={{ color: '#94A8A3', mb: 3, minHeight: 40, px: 2, fontWeight: 500, fontSize: '0.9rem' }}>
          {statusText}
        </Typography>

        {/* Progress Bar */}
        <Box sx={{ width: '100%', mb: 2, px: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: '#00C896',
                backgroundImage: 'linear-gradient(90deg, #00C896 0%, #34D399 100%)',
                boxShadow: '0 0 10px rgba(0, 200, 150, 0.5)'
              }
            }}
          />
        </Box>

        {/* Trust Badges Footer */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <LockIcon sx={{ fontSize: 14, color: '#00C896' }} />
          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, fontSize: '0.72rem' }}>
            Official MeriPehchaan 256-bit Encrypted Portal
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DigiLockerWarmupModal;
