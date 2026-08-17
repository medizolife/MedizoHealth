'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Paper,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
  Tooltip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalPharmacy as PharmacyIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  MedicalServices as StethoscopeIcon,
  QrCode2 as QrIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  HourglassEmpty as PendingIcon,
  Warning as WarningIcon,
  Send as SendIcon,
  Verified as VerifiedBadgeIcon,
  Medication as MedicationIcon,
  AssignmentTurnedIn as StampIcon,
  ContentCopy as CopyIcon,
  Inventory2 as InventoryIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { Prescription } from '../types/prescription';
import { dispensePrescription } from '../services/prescriptions';
import { batchDeductDispensedStock } from '../services/inventory';
import { useThemeContext } from '../contexts/ThemeContext';
import DispenseHistoryModal from './DispenseHistoryModal';

type MedStatus = 'pending' | 'given' | 'not_available' | 'not_needed';

interface MedicineStatusEntry {
  medicineName: string;
  status: MedStatus;
  updatedAt?: string;
}

interface DispenseModalProps {
  open: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  onDispensedSuccess?: () => void;
}

export default function DispenseModal({ open, onClose, prescription, onDispensedSuccess }: DispenseModalProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [dispenseNotes, setDispenseNotes] = useState('');
  const [medStatuses, setMedStatuses] = useState<MedicineStatusEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [autoDeductStock, setAutoDeductStock] = useState(true);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const statusConfig: Record<MedStatus, { label: string; color: string; activeBg: string; activeBorder: string; icon: React.ReactNode }> = {
    pending: {
      label: 'Pending',
      color: isDark ? '#9CA3AF' : '#64748B',
      activeBg: isDark ? 'rgba(156, 163, 175, 0.15)' : '#F1F5F9',
      activeBorder: isDark ? 'rgba(156, 163, 175, 0.4)' : '#CBD5E1',
      icon: <PendingIcon sx={{ fontSize: 15 }} />,
    },
    given: {
      label: 'Given',
      color: '#10B981',
      activeBg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
      activeBorder: '#10B981',
      icon: <CheckCircleIcon sx={{ fontSize: 15 }} />,
    },
    not_available: {
      label: 'Not Available',
      color: '#F59E0B',
      activeBg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB',
      activeBorder: '#F59E0B',
      icon: <CancelIcon sx={{ fontSize: 15 }} />,
    },
    not_needed: {
      label: 'Not Needed',
      color: '#EF4444',
      activeBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
      activeBorder: '#EF4444',
      icon: <BlockIcon sx={{ fontSize: 15 }} />,
    },
  };

  useEffect(() => {
    if (prescription?.medications && prescription.medications.length > 0) {
      setMedStatuses(
        prescription.medications.map(med => ({
          medicineName: med.name,
          status: 'pending' as MedStatus,
          updatedAt: new Date().toISOString(),
        }))
      );
    } else if (prescription?.medication) {
      setMedStatuses([{
        medicineName: prescription.medication,
        status: 'pending' as MedStatus,
        updatedAt: new Date().toISOString(),
      }]);
    } else {
      setMedStatuses([]);
    }
    setDispenseNotes('');
    setError('');
    setSuccess('');
    setCopied(false);
  }, [prescription]);

  if (!prescription) return null;

  const isAlreadyDispensed = prescription.dispensedStatus === 'dispensed';

  const historyList = Array.isArray(prescription.dispenseHistory) && prescription.dispenseHistory.length > 0
    ? prescription.dispenseHistory
    : (prescription.dispensedAt ? [{
        dispenseIndex: 1,
        dispensedAt: prescription.dispensedAt,
        dispenseNotes: prescription.dispenseNotes || 'Dispensed',
        itemsDispensed: prescription.medications ? prescription.medications.map(m => ({ name: m.name, status: 'given' })) : [],
        dispensedStatus: prescription.dispensedStatus || 'dispensed'
      }] : []);
  const dispenseHistoryCount = historyList.length;

  const handleStatusChange = (medicineName: string, newStatus: MedStatus) => {
    setMedStatuses(prev =>
      prev.map(ms =>
        ms.medicineName === medicineName
          ? { ...ms, status: newStatus, updatedAt: new Date().toISOString() }
          : ms
      )
    );
  };

  const getStatus = (medicineName: string): MedStatus => {
    return medStatuses.find(ms => ms.medicineName === medicineName)?.status || 'pending';
  };

  const allStatusesSet = medStatuses.length > 0 && medStatuses.every(ms => ms.status !== 'pending');

  const handleFulfill = async () => {
    if (!allStatusesSet) {
      setError('Please select a status (Given / Not Available / Not Needed) for ALL medicines before submitting.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const notes = [
        dispenseNotes,
        ...medStatuses
          .filter(ms => ms.status !== 'given')
          .map(ms => `${ms.medicineName}: ${ms.status.replace('_', ' ')}`)
      ].filter(Boolean).join('; ');

      const res = await dispensePrescription(
        prescription.id,
        notes || 'All prescribed items verified and dispensed.',
        medStatuses.map(ms => ({ medicineName: ms.medicineName, status: ms.status }))
      );
      if (res.success || res.prescription) {
        if (autoDeductStock) {
          const givenMeds = medStatuses
            .filter(ms => ms.status === 'given')
            .map(ms => ({ name: ms.medicineName, quantity: 1 }));
          if (givenMeds.length > 0) {
            batchDeductDispensedStock(givenMeds).catch(err => console.error('Inventory auto-deduct notice:', err));
          }
        }
        setSuccess('✅ Prescription fulfilled & marked as dispensed!');
        setTimeout(() => {
          if (onDispensedSuccess) onDispensedSuccess();
          onClose();
        }, 1400);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to dispense prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyRxId = () => {
    if (prescription?.id) {
      navigator.clipboard.writeText(prescription.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const medications = prescription.medications && prescription.medications.length > 0
    ? prescription.medications
    : prescription.medication
      ? [{ name: prescription.medication, dosage: prescription.dosage || '', duration: prescription.duration || '', instructions: prescription.instructions || '', type: '', quantity: 0 }]
      : [];

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: '24px', sm: '32px' },
          bgcolor: isDark ? '#0D1716' : '#FFFFFF',
          color: isDark ? '#F8FAFC' : '#0F172A',
          p: 0,
          border: isDark ? '1.5px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(18, 48, 41, 0.12)',
          boxShadow: isDark
            ? '0 24px 64px rgba(0, 0, 0, 0.85), 0 0 20px rgba(245, 158, 11, 0.15)'
            : '0 24px 48px rgba(18, 48, 41, 0.12)',
          maxHeight: '94vh',
          m: { xs: 1.5, sm: 2 },
          overflow: 'hidden',
          fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }
      }}
    >
      {/* Premium Header Banner */}
      <DialogTitle sx={{ p: { xs: 2, sm: 2.5 }, pb: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: { xs: 42, sm: 48 },
            height: { xs: 42, sm: 48 },
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0D9488 0%, #028090 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(13, 148, 136, 0.4)',
            color: '#FFFFFF'
          }}>
            <PharmacyIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: { xs: '1.1rem', sm: '1.25rem' }, fontFamily: "'Outfit', sans-serif", color: isDark ? '#F8FAFC' : '#123029', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              Verify & Dispense Rx
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#2DD4BF' : '#0F766E', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
              Medizo Care Pharmacy • Verification Station
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: isDark ? '#9CA3AF' : '#64748B',
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
            borderRadius: '12px',
            '&:hover': { color: isDark ? '#FFFFFF' : '#0F172A', bgcolor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', transform: 'scale(1.05)' },
            transition: 'all 0.2s ease'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, overflowY: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: '16px', bgcolor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEF2F2', color: isDark ? '#FCA5A5' : '#991B1B', border: '1px solid #EF4444', fontWeight: 700 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: '16px', bgcolor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5', color: isDark ? '#6EE7B7' : '#065F46', border: '1px solid #10B981', fontWeight: 800 }}>
            {success}
          </Alert>
        )}

        {/* Previous Dispensing Warning Banner with History Link */}
        {isAlreadyDispensed && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
              border: isDark ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              flexWrap: 'wrap'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <WarningIcon sx={{ color: '#F59E0B', fontSize: 24 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isDark ? '#FEF08A' : '#78350F', fontSize: '0.88rem' }}>
                  Prescription Already Dispensed ({dispenseHistoryCount}x)
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#E5E7EB' : '#451A03', fontWeight: 700, display: 'block', fontSize: '0.75rem' }}>
                  {prescription.dispensedAt ? `Last dispensed: ${new Date(prescription.dispensedAt).toLocaleDateString()} at ${new Date(prescription.dispensedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Fulfillment recorded in system'}
                </Typography>
              </Box>
            </Box>

            <Button
              size="small"
              variant="outlined"
              onClick={() => setHistoryModalOpen(true)}
              startIcon={<HistoryIcon sx={{ fontSize: '15px !important' }} />}
              sx={{
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.72rem',
                textTransform: 'none',
                color: isDark ? '#FBBF24' : '#B45309',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
                bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                '&:hover': { bgcolor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A' }
              }}
            >
              View History
            </Button>
          </Paper>
        )}

        {/* Prescription Header Status Card with Dispense History Button */}
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1.5,
            mb: 2.5,
            p: 2,
            borderRadius: '20px',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrIcon sx={{ color: isDark ? '#34D399' : '#059669', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 800, display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Prescription ID
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, fontFamily: 'monospace', color: isDark ? '#34D399' : '#047857', letterSpacing: '0.05em', fontSize: '1rem' }}>
                  #{String(prescription.id).slice(-8).toUpperCase()}
                </Typography>
                <Tooltip title={copied ? "Copied!" : "Copy Full ID"}>
                  <IconButton size="small" onClick={copyRxId} sx={{ p: 0.3, color: isDark ? '#9CA3AF' : '#64748B', '&:hover': { color: '#10B981' } }}>
                    <CopyIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
            {/* History of Dispense Button */}
            <Button
              size="small"
              variant="outlined"
              onClick={() => setHistoryModalOpen(true)}
              startIcon={<HistoryIcon sx={{ fontSize: '16px !important' }} />}
              sx={{
                borderRadius: '14px',
                fontWeight: 900,
                fontSize: '0.72rem',
                textTransform: 'none',
                py: 0.6,
                px: 1.2,
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
              {dispenseHistoryCount > 0 ? `History (${dispenseHistoryCount}x)` : 'Dispense History'}
            </Button>

            <Chip
              label={isAlreadyDispensed ? (dispenseHistoryCount > 1 ? `DISPENSED (${dispenseHistoryCount}x)` : 'ALREADY DISPENSED') : 'READY TO DISPENSE'}
              size="small"
              sx={{
                bgcolor: isAlreadyDispensed
                  ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5')
                  : (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB'),
                color: isAlreadyDispensed
                  ? (isDark ? '#34D399' : '#047857')
                  : (isDark ? '#FBBF24' : '#B45309'),
                fontWeight: 900,
                fontSize: '0.72rem',
                px: 0.5,
                height: 28,
                border: isAlreadyDispensed
                  ? (isDark ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #A7F3D0')
                  : (isDark ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #FDE68A')
              }}
            />
          </Box>
        </Paper>

        {/* Doctor & Patient Information Cards */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {/* Doctor Card */}
          <Grid item xs={12} sm={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '22px',
                bgcolor: isDark ? 'rgba(16, 185, 129, 0.06)' : '#ECFDF5',
                border: isDark ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #A7F3D0',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justify: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <StethoscopeIcon sx={{ color: isDark ? '#34D399' : '#059669', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#047857', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
                  Prescribing Doctor
                </Typography>
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#064E3B', mb: 0.3, lineHeight: 1.3, fontSize: '1rem' }}>
                {(() => {
                  const raw = (prescription as any).doctorName || 'Prescribing Doctor';
                  const cleaned = raw.trim().replace(/^(Dr\.?\s*)+/i, 'Dr. ');
                  return cleaned.startsWith('Dr. ') ? cleaned : `Dr. ${cleaned}`;
                })()}
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#A7F3D0' : '#047857', fontWeight: 700, fontSize: '0.82rem' }}>
                {(prescription as any).doctorSpecialization || 'General Physician'}
              </Typography>
            </Paper>
          </Grid>

          {/* Patient Card */}
          <Grid item xs={12} sm={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '22px',
                bgcolor: isDark ? 'rgba(59, 130, 246, 0.06)' : '#EFF6FF',
                border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #BFDBFE',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justify: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonIcon sx={{ color: isDark ? '#60A5FA' : '#1D4ED8', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: isDark ? '#60A5FA' : '#1D4ED8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
                  Patient Details
                </Typography>
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#1E3A8A', mb: 0.3, lineHeight: 1.3, fontSize: '1rem' }}>
                {(prescription as any).patientName || 'Patient'}
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#93C5FD' : '#1E40AF', fontWeight: 800, fontSize: '0.82rem' }}>
                ID: #{String(prescription.patientId).slice(-6).toUpperCase()}
              </Typography>
              {(prescription as any).patientEmail && (prescription as any).patientEmail !== 'N/A' && (
                <Typography variant="caption" sx={{ color: isDark ? '#BFDBFE' : '#2563EB', fontWeight: 700, display: 'block', mt: 0.3, fontSize: '0.75rem' }}>
                  📧 {(prescription as any).patientEmail}
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Provisional Diagnosis */}
        {prescription.provisionalDiagnosis && prescription.provisionalDiagnosis.length > 0 && (
          <Box sx={{
            mb: 2.5,
            p: 2,
            borderRadius: '20px',
            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFBEB',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #FDE68A'
          }}>
            <Typography variant="caption" sx={{ color: isDark ? '#FBBF24' : '#B45309', fontWeight: 900, textTransform: 'uppercase', display: 'block', mb: 0.5, fontSize: '0.68rem', letterSpacing: '0.05em' }}>
              Provisional Diagnosis
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#78350F' }}>
              {Array.isArray(prescription.provisionalDiagnosis) ? prescription.provisionalDiagnosis.join(', ') : prescription.provisionalDiagnosis}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />

        {/* Real-time Medicines Given Counter Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: '20px',
            bgcolor: isDark ? 'rgba(13, 148, 136, 0.15)' : '#E6FFFA',
            border: '1.5px solid #0D9488',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <CheckCircleIcon sx={{ color: isDark ? '#2DD4BF' : '#0D9488', fontSize: 26 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0F766E', fontSize: '0.95rem' }}>
                Medicines Given Counter: {medStatuses.filter(ms => ms.status === 'given').length} of {medications.length} Given
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#475569', fontWeight: 700, fontSize: '0.78rem' }}>
                {medStatuses.filter(ms => ms.status === 'given').length === medications.length
                  ? '✅ All prescribed medicines are marked GIVEN to the patient.'
                  : `⚠️ ${medications.length - medStatuses.filter(ms => ms.status === 'given').length} medicine(s) not marked as given.`}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={`${medStatuses.filter(ms => ms.status === 'given').length} / ${medications.length} GIVEN`}
            sx={{
              fontWeight: 900,
              fontSize: '0.82rem',
              bgcolor: '#0D9488',
              color: '#FFFFFF',
              px: 1,
              py: 0.5,
              height: 28,
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
            }}
          />
        </Paper>

        {/* Medicine Checklist Section */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: isDark ? '#34D399' : '#047857', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <MedicationIcon sx={{ fontSize: 18 }} /> Medicine Checklist & Quantity Tracker
            </Typography>
            <Chip
              label={`${medications.length} items`}
              size="small"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', color: isDark ? '#34D399' : '#047857' }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', display: 'block', mb: 2, fontWeight: 700, fontSize: '0.75rem' }}>
            Select dispensing status for each prescribed medicine below to record quantities given to patient:
          </Typography>

          {medications.length > 0 ? (
            medications.map((med, idx) => {
              const currentStatus = getStatus(med.name);
              const config = statusConfig[currentStatus];

              return (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 2.2,
                    mb: 2,
                    borderRadius: '22px',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                    boxShadow: isDark ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Medicine Info Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', letterSpacing: '0.02em', fontSize: '0.98rem' }}>
                        💊 {med.name.toUpperCase()}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.8 }}>
                        {med.dosage && (
                          <Chip 
                            label={`Dosage: ${med.dosage}`} 
                            size="small" 
                            sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0', color: isDark ? '#F3F4F6' : '#0F172A' }} 
                          />
                        )}
                        {med.duration && (
                          <Chip 
                            label={`⏱️ Duration: ${med.duration}`} 
                            size="small" 
                            sx={{ fontWeight: 800, fontSize: '0.72rem', bgcolor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE', color: isDark ? '#60A5FA' : '#1E40AF' }} 
                          />
                        )}
                        {med.quantity && (
                          <Chip 
                            label={`📦 Dispense Qty: ${med.quantity}`} 
                            size="small" 
                            sx={{ fontWeight: 900, fontSize: '0.72rem', bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5', color: isDark ? '#34D399' : '#047857', border: `1px solid ${isDark ? '#10B981' : '#6EE7B7'}` }} 
                          />
                        )}
                      </Box>
                      {med.instructions && (
                        <Typography variant="body2" sx={{ color: isDark ? '#FBBF24' : '#D97706', fontWeight: 800, mt: 0.8, display: 'block', fontSize: '0.82rem' }}>
                          Instructions: {med.instructions}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      icon={config.icon as React.ReactElement}
                      label={config.label}
                      size="small"
                      sx={{
                        bgcolor: config.activeBg,
                        color: config.color,
                        fontWeight: 900,
                        fontSize: '0.72rem',
                        border: `1px solid ${config.activeBorder}`,
                        px: 0.5,
                        '& .MuiChip-icon': { color: config.color }
                      }}
                    />
                  </Box>

                  {/* Modern Interactive Segmented Pill Selector (Replaces Generic Radios) */}
                  {!isAlreadyDispensed && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0' }}>
                      <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 800, display: 'block', mb: 1, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                        Set Item Status:
                      </Typography>
                      <Grid container spacing={1}>
                        {(['given', 'not_available', 'not_needed'] as MedStatus[]).map((statusOption) => {
                          const optionCfg = statusConfig[statusOption];
                          const isSelected = currentStatus === statusOption;

                          return (
                            <Grid item xs={4} key={statusOption}>
                              <Button
                                fullWidth
                                disabled={loading}
                                onClick={() => handleStatusChange(med.name, statusOption)}
                                sx={{
                                  py: 1,
                                  px: 1,
                                  borderRadius: '14px',
                                  fontSize: '0.75rem',
                                  fontWeight: isSelected ? 900 : 700,
                                  textTransform: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justify: 'center',
                                  gap: 0.6,
                                  bgcolor: isSelected
                                    ? optionCfg.activeBg
                                    : (isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF'),
                                  color: isSelected
                                    ? optionCfg.color
                                    : (isDark ? '#9CA3AF' : '#64748B'),
                                  border: `1.5px solid ${isSelected ? optionCfg.activeBorder : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0')}`,
                                  boxShadow: isSelected ? `0 4px 14px ${optionCfg.color}25` : 'none',
                                  transition: 'all 0.15s ease',
                                  '&:hover': {
                                    bgcolor: optionCfg.activeBg,
                                    color: optionCfg.color,
                                    borderColor: optionCfg.activeBorder,
                                    transform: 'translateY(-1px)'
                                  }
                                }}
                              >
                                {optionCfg.icon}
                                <span>{optionCfg.label}</span>
                              </Button>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  )}
                </Paper>
              );
            })
          ) : (
            <Paper sx={{ p: 2, borderRadius: '18px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                No medications listed in this prescription.
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Pharmacist Dispense Notes & Stock Auto-Deduct */}
        {!isAlreadyDispensed && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{
              p: 1.5,
              mb: 2,
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5',
              border: isDark ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #A7F3D0'
            }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={autoDeductStock}
                    onChange={(e) => setAutoDeductStock(e.target.checked)}
                    sx={{ color: '#10B981', '&.Mui-checked': { color: '#10B981' }, py: 0 }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: isDark ? '#A7F3D0' : '#047857' }}>
                    📦 Automatically deduct given medicines from My Pharmacy Stock
                  </Typography>
                }
              />
            </Box>

            <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 800, display: 'block', mb: 0.8, fontSize: '0.72rem', textTransform: 'uppercase' }}>
              Pharmacist Notes / Substitutions (Optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="e.g. All items verified, generic equivalent offered for Tab. Metformin..."
              value={dispenseNotes}
              onChange={(e) => setDispenseNotes(e.target.value)}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#F8FAFC',
                  borderRadius: '18px',
                  fontSize: '0.88rem',
                  '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0' },
                  '&:hover fieldset': { borderColor: '#0D9488' },
                  '&.Mui-focused fieldset': { borderColor: '#0D9488' }
                }
              }}
            />
          </Box>
        )}

        {/* Official Pharmacy Digital Authorization Stamp (If already fulfilled) */}
        {isAlreadyDispensed && prescription.dispensedBy && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mt: 2,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
              border: isDark ? '1.5px solid rgba(16, 185, 129, 0.35)' : '1.5px solid #86EFAC',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Stamp Watermark Icon */}
            <StampIcon sx={{
              position: 'absolute',
              right: -10,
              bottom: -10,
              fontSize: 110,
              color: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(22, 101, 52, 0.06)',
              pointerEvents: 'none'
            }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StampIcon sx={{ color: isDark ? '#34D399' : '#15803D', fontSize: 22 }} />
                <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#15803D', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
                  Fulfilled Pharmacy Digital Stamp
                </Typography>
              </Box>
              <Chip
                icon={<VerifiedBadgeIcon sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
                label="Digital Authorization Verified"
                size="small"
                sx={{ height: 22, fontSize: '0.62rem', fontWeight: 900, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid #10B981' }}
              />
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#14532D', mb: 0.5, fontSize: '1.08rem' }}>
              {prescription.dispensedBy.pharmacyName || 'Medizo Care Pharmacy'}
            </Typography>

            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: isDark ? '#A7F3D0' : '#166534', fontWeight: 700, fontSize: '0.82rem' }}>
                  Dispensed By: <span style={{ color: isDark ? '#FFFFFF' : '#064E3B', fontWeight: 900 }}>{prescription.dispensedBy.pharmacistName}</span>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: isDark ? '#A7F3D0' : '#166534', fontWeight: 700, fontSize: '0.82rem' }}>
                  License: <span style={{ color: isDark ? '#FFFFFF' : '#064E3B', fontWeight: 900 }}>{prescription.dispensedBy.licenseNumber}</span>
                </Typography>
              </Grid>
              {prescription.dispensedAt && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: isDark ? '#A7F3D0' : '#166534', fontWeight: 700, fontSize: '0.82rem' }}>
                    Timestamp: <span style={{ color: isDark ? '#FFFFFF' : '#064E3B', fontWeight: 900 }}>{new Date(prescription.dispensedAt).toLocaleString()}</span>
                  </Typography>
                </Grid>
              )}
              {prescription.dispenseNotes && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: isDark ? '#A7F3D0' : '#166534', fontWeight: 700, fontSize: '0.82rem', mt: 0.3 }}>
                    Audit Log: <span style={{ color: isDark ? '#FFFFFF' : '#064E3B', fontWeight: 800 }}>{prescription.dispenseNotes}</span>
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}
      </DialogContent>

      {/* Modern Dialog Footer */}
      <DialogActions sx={{ p: 2.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9', gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            px: 2.5,
            py: 1,
            borderRadius: '14px',
            color: isDark ? '#9CA3AF' : '#64748B',
            fontWeight: 800,
            fontSize: '0.88rem',
            '&:hover': { color: isDark ? '#FFFFFF' : '#0F172A', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }
          }}
        >
          Close
        </Button>
        {!isAlreadyDispensed && (
          <Button
            variant="contained"
            onClick={handleFulfill}
            disabled={loading || !allStatusesSet}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            sx={{
              px: 3.5,
              py: 1.2,
              borderRadius: '16px',
              fontWeight: 900,
              fontSize: '0.92rem',
              fontFamily: "'Outfit', sans-serif",
              bgcolor: allStatusesSet ? '#10B981' : (isDark ? '#374151' : '#E2E8F0'),
              color: allStatusesSet ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#94A3B8'),
              boxShadow: allStatusesSet ? '0 6px 20px rgba(16, 185, 129, 0.4)' : 'none',
              '&:hover': { bgcolor: allStatusesSet ? '#059669' : (isDark ? '#374151' : '#E2E8F0'), transform: 'translateY(-1px)' },
              '&.Mui-disabled': { bgcolor: isDark ? '#1F2937' : '#F1F5F9', color: isDark ? '#6B7280' : '#94A3B8' },
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Fulfilling...' : 'Confirm Dispensing'}
          </Button>
        )}
      </DialogActions>
    </Dialog>

    {/* Dispense History Modal */}
    <DispenseHistoryModal
      open={historyModalOpen}
      onClose={() => setHistoryModalOpen(false)}
      prescription={prescription}
    />
    </>
  );
}
