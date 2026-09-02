'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Paper,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import MedicationIcon from '@mui/icons-material/Medication';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useThemeContext } from '../contexts/ThemeContext';
import { verifyPrescriptionBirthYear } from '../services/prescriptions';

interface PrescriptionBirthYearModalProps {
  open: boolean;
  onClose: () => void;
  prescriptionData: any;
  onVerified: (unlockedPrescription: any, action?: 'view' | 'continue_trail') => void;
}

export const PrescriptionBirthYearModal: React.FC<PrescriptionBirthYearModalProps> = ({
  open,
  onClose,
  prescriptionData,
  onVerified
}) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [birthYear, setBirthYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'view' | 'continue_trail' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setBirthYear('');
      setError(null);
      setLoading(false);
      setLoadingAction(null);
    }
  }, [open]);

  if (!prescriptionData) return null;

  // Extract medicine names list safely
  const medNames: string[] = Array.isArray(prescriptionData.medicationNames) && prescriptionData.medicationNames.length > 0
    ? prescriptionData.medicationNames
    : Array.isArray(prescriptionData.medications) && prescriptionData.medications.length > 0
    ? prescriptionData.medications.map((m: any) => typeof m === 'object' && m ? (m.name || m.medicationName || '') : String(m)).filter(Boolean)
    : (prescriptionData.medication ? [prescriptionData.medication] : ['Medication prescribed']);

  const patientName = prescriptionData.patientName || 'Patient';
  const doctorName = prescriptionData.doctorName ? (prescriptionData.doctorName.startsWith('Dr.') ? prescriptionData.doctorName : `Dr. ${prescriptionData.doctorName}`) : 'Prescribing Doctor';
  const rxId = prescriptionData.id || prescriptionData.prescriptionId || '';

  const handleVerify = async (action: 'view' | 'continue_trail' = 'continue_trail', e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanYear = birthYear.trim();
    const yearNum = parseInt(cleanYear, 10);
    const currentYear = new Date().getFullYear();

    if (!cleanYear || isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      setError(`Please enter a valid 4-digit birth year between 1900 and ${currentYear}.`);
      return;
    }

    try {
      setLoading(true);
      setLoadingAction(action);
      setError(null);
      const res = await verifyPrescriptionBirthYear(rxId, yearNum);
      if (res.success && res.prescription) {
        onVerified(res.prescription, action);
        onClose();
      } else {
        setError(res.message || 'Incorrect birth year. Verification failed.');
      }
    } catch (err: any) {
      console.error('Birth year verification error:', err);
      const msg = err.response?.data?.message || err.message || 'Incorrect birth year. Please confirm with the patient.';
      setError(msg);
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDark ? '#0F1A1C' : '#FFFFFF',
          border: isDark ? '1px solid rgba(0, 200, 150, 0.25)' : '1px solid rgba(42, 107, 93, 0.15)',
          boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.7)' : '0 20px 60px rgba(0,0,0,0.12)',
          backgroundImage: 'none',
          overflow: 'hidden'
        }
      }}
    >
      {/* Header Banner */}
      <DialogTitle sx={{ p: 2.5, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              bgcolor: isDark ? 'rgba(0, 200, 150, 0.15)' : 'rgba(42, 107, 93, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#00C896' : '#2A6B5D'
            }}
          >
            <LockIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#EBF5F3' : '#1A312C', fontSize: '1.1rem', lineHeight: 1.2 }}>
              Patient Record Verification
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94A8A3' : '#5A756F', fontWeight: 600 }}>
              Confidential Medical Data Protection
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} disabled={loading} size="small" sx={{ color: isDark ? '#94A8A3' : '#5A756F' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Redacted Preview Card: ONLY Patient Name & Medicine Names */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.2,
            mb: 3,
            borderRadius: '18px',
            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFB',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(42, 107, 93, 0.15)'
          }}
        >
          {/* Patient Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.8 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: isDark ? 'rgba(0, 200, 150, 0.2)' : 'rgba(42, 107, 93, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#00C896' : '#2A6B5D',
                fontWeight: 900,
                fontSize: '0.9rem'
              }}
            >
              <PersonIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: isDark ? '#94A8A3' : '#5A756F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Patient Name
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isDark ? '#EBF5F3' : '#1A312C', lineHeight: 1.2 }}>
                {patientName}
              </Typography>
            </Box>
            <Chip
              icon={<VerifiedUserIcon sx={{ fontSize: '14px !important' }} />}
              label="Scanned Rx"
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(0, 200, 150, 0.15)' : 'rgba(42, 107, 93, 0.12)',
                color: isDark ? '#00C896' : '#2A6B5D',
                fontWeight: 800,
                fontSize: '0.72rem'
              }}
            />
          </Box>

          {/* Prescribed Medicine Names Only */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94A8A3' : '#5A756F', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8 }}>
              <MedicationIcon sx={{ fontSize: 16 }} /> Prescribed Medicines ({medNames.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
              {medNames.map((name, idx) => (
                <Chip
                  key={idx}
                  label={name}
                  size="small"
                  sx={{
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(42, 107, 93, 0.15)',
                    color: isDark ? '#EBF5F3' : '#1A312C',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Prescribing Doctor & Date */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.2, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94A8A3' : '#5A756F', fontWeight: 600 }}>
              Prescribed by: <strong style={{ color: isDark ? '#EBF5F3' : '#1A312C' }}>{doctorName}</strong>
            </Typography>
            {prescriptionData.createdAt && (
              <Typography variant="caption" sx={{ color: isDark ? '#94A8A3' : '#5A756F', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <CalendarMonthIcon sx={{ fontSize: 13 }} />
                {new Date(prescriptionData.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Verification Instruction Banner */}
        <Alert
          severity="info"
          icon={<LockIcon fontSize="inherit" />}
          sx={{
            mb: 2.5,
            borderRadius: '16px',
            bgcolor: isDark ? 'rgba(0, 200, 150, 0.08)' : 'rgba(42, 107, 93, 0.08)',
            color: isDark ? '#EBF5F3' : '#1A312C',
            border: isDark ? '1px solid rgba(0, 200, 150, 0.2)' : '1px solid rgba(42, 107, 93, 0.15)',
            '& .MuiAlert-icon': { color: isDark ? '#00C896' : '#2A6B5D' }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
            To view full clinical diagnosis, investigation reports, and <strong>link this patient to your practice</strong>, please verify the patient's <strong>Birth Year</strong>.
          </Typography>
        </Alert>

        {/* Birth Year Input Form */}
        <form onSubmit={(e) => handleVerify('continue_trail', e)}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#94A8A3' : '#5A756F', display: 'block', mb: 0.8 }}>
              PATIENT BIRTH YEAR (YYYY)
            </Typography>
            <TextField
              fullWidth
              autoFocus
              type="number"
              placeholder="e.g. 1995"
              value={birthYear}
              onChange={(e) => {
                setBirthYear(e.target.value.slice(0, 4));
                if (error) setError(null);
              }}
              inputProps={{
                maxLength: 4,
                min: 1900,
                max: new Date().getFullYear(),
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }}
              InputProps={{
                sx: {
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  letterSpacing: '3px',
                  textAlign: 'center',
                  fontFamily: 'monospace'
                }
              }}
              disabled={loading}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 1.5, borderRadius: '12px', fontWeight: 600 }}>
              {error}
            </Alert>
          )}
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1, gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            borderRadius: '14px',
            color: isDark ? '#94A8A3' : '#5A756F',
            fontWeight: 700,
            px: 2
          }}
        >
          Cancel
        </Button>
        <Button
          variant="outlined"
          onClick={() => handleVerify('view')}
          disabled={loading || birthYear.length !== 4}
          startIcon={loading && loadingAction === 'view' ? <CircularProgress size={16} color="inherit" /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
          sx={{
            borderRadius: '14px',
            borderColor: isDark ? 'rgba(0, 200, 150, 0.4)' : 'rgba(42, 107, 93, 0.3)',
            color: isDark ? '#00C896' : '#2A6B5D',
            fontWeight: 800,
            px: 2.2,
            py: 1.1,
            '&:hover': { bgcolor: isDark ? 'rgba(0,200,150,0.08)' : 'rgba(42,107,93,0.08)' }
          }}
        >
          {loading && loadingAction === 'view' ? 'Verifying...' : 'View Rx'}
        </Button>
        <Button
          variant="contained"
          onClick={() => handleVerify('continue_trail')}
          disabled={loading || birthYear.length !== 4}
          startIcon={loading && loadingAction === 'continue_trail' ? <CircularProgress size={18} color="inherit" /> : <AutorenewIcon sx={{ fontSize: 19 }} />}
          sx={{
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #00C896 0%, #009E77 100%)',
            color: '#0B1315',
            fontWeight: 900,
            px: 2.8,
            py: 1.1,
            boxShadow: '0 4px 16px rgba(0,200,150,0.3)',
            '&:hover': { background: 'linear-gradient(135deg, #00b084 0%, #008f6c 100%)' }
          }}
        >
          {loading && loadingAction === 'continue_trail' ? 'Verifying...' : 'Continue Treatment Trail'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrescriptionBirthYearModal;
