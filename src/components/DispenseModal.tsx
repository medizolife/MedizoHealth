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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalPharmacy as PharmacyIcon,
  CheckCircle as CheckCircleIcon,
  VerifiedUser as VerifiedIcon,
  Person as PersonIcon,
  MedicalServices as StethoscopeIcon,
  QrCode2 as QrIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  HourglassEmpty as PendingIcon,
  Warning as WarningIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { Prescription } from '../types/prescription';
import { dispensePrescription } from '../services/prescriptions';

// Medicine status types matching pharma medizo
type MedStatus = 'pending' | 'given' | 'not_available' | 'not_needed';

interface MedicineStatusEntry {
  medicineName: string;
  status: MedStatus;
  updatedAt?: string;
}

const statusConfig: Record<MedStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    color: '#757575',
    bgColor: 'rgba(117, 117, 117, 0.1)',
    icon: <PendingIcon sx={{ fontSize: 16 }} />,
  },
  given: {
    label: 'Given',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
  },
  not_available: {
    label: 'Not Available',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    icon: <CancelIcon sx={{ fontSize: 16 }} />,
  },
  not_needed: {
    label: 'Not Needed',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    icon: <BlockIcon sx={{ fontSize: 16 }} />,
  },
};

interface DispenseModalProps {
  open: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  onDispensedSuccess?: () => void;
}

export default function DispenseModal({ open, onClose, prescription, onDispensedSuccess }: DispenseModalProps) {
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [medStatuses, setMedStatuses] = useState<MedicineStatusEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize medicine statuses when prescription changes
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
  }, [prescription]);

  if (!prescription) return null;

  const isAlreadyDispensed = prescription.dispensedStatus === 'dispensed';

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

      const res = await dispensePrescription(prescription.id, notes || 'All prescribed items verified and dispensed.');
      if (res.success || res.prescription) {
        setSuccess('✅ Prescription fulfilled & marked as dispensed!');
        setTimeout(() => {
          if (onDispensedSuccess) onDispensedSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to dispense prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get medication list
  const medications = prescription.medications && prescription.medications.length > 0
    ? prescription.medications
    : prescription.medication
      ? [{ name: prescription.medication, dosage: prescription.dosage || '', duration: prescription.duration || '', instructions: prescription.instructions || '', type: '' }]
      : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '28px',
          bgcolor: 'var(--color-card-bg, #1A2C28)',
          color: '#FAF2F5',
          p: 1,
          border: '1px solid var(--glass-border)',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PharmacyIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
            Verify & Dispense Rx
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon sx={{ color: '#FAF2F5' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ overflowY: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '14px' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '14px' }}>
            {success}
          </Alert>
        )}

        {/* Previous Dispensing Warning */}
        {isAlreadyDispensed && prescription.dispensedBy && (
          <Alert
            severity="warning"
            icon={<WarningIcon />}
            sx={{ mb: 2, borderRadius: '14px' }}
          >
            This prescription was previously dispensed by{' '}
            <strong>{prescription.dispensedBy.pharmacistName}</strong> at{' '}
            <strong>{prescription.dispensedBy.pharmacyName}</strong>
            {prescription.dispensedAt && (
              <> on {new Date(prescription.dispensedAt).toLocaleString()}</>
            )}
          </Alert>
        )}

        {/* Prescription Header Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 1.5, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.04)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrIcon sx={{ color: '#00C896' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
              #{String(prescription.id).slice(-8).toUpperCase()}
            </Typography>
          </Box>
          <Chip
            label={isAlreadyDispensed ? 'ALREADY DISPENSED' : 'READY TO DISPENSE'}
            size="small"
            sx={{
              bgcolor: isAlreadyDispensed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: isAlreadyDispensed ? '#34D399' : '#FBBF24',
              fontWeight: 800,
              fontSize: '0.7rem'
            }}
          />
        </Box>

        {/* Doctor & Patient Information */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 1.5, borderRadius: '16px', bgcolor: 'rgba(0, 200, 150, 0.08)', border: '1px solid rgba(0, 200, 150, 0.2)' }}>
              <Typography variant="caption" sx={{ color: '#00C896', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <StethoscopeIcon sx={{ fontSize: 14 }} /> Prescribing Doctor
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {(prescription as any).doctorName || 'Dr. Prescriber'}
              </Typography>
              {(prescription as any).doctorSpecialization && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {(prescription as any).doctorSpecialization}
                </Typography>
              )}
              <Chip
                icon={<VerifiedIcon sx={{ fontSize: '12px !important', color: '#ffffff !important' }} />}
                label={(prescription as any).doctorVerified ? 'DigiLocker Verified' : 'Unverified'}
                size="small"
                sx={{
                  height: 18, fontSize: '0.6rem', fontWeight: 800,
                  bgcolor: (prescription as any).doctorVerified ? '#2e7d32' : '#d97706',
                  color: '#ffffff', mt: 0.5
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 1.5, borderRadius: '16px', bgcolor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <Typography variant="caption" sx={{ color: '#60A5FA', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <PersonIcon sx={{ fontSize: 14 }} /> Patient Details
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {(prescription as any).patientName || 'Patient'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                ID: #{String(prescription.patientId).slice(-6)}
              </Typography>
              {(prescription as any).patientEmail && (prescription as any).patientEmail !== 'N/A' && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  📧 {(prescription as any).patientEmail}
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Provisional Diagnosis */}
        {prescription.provisionalDiagnosis && prescription.provisionalDiagnosis.length > 0 && (
          <Box sx={{ mb: 2, p: 1.5, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.03)' }}>
            <Typography variant="caption" sx={{ color: '#FBBF24', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
              Provisional Diagnosis
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {Array.isArray(prescription.provisionalDiagnosis) ? prescription.provisionalDiagnosis.join(', ') : prescription.provisionalDiagnosis}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Medicine Checklist with Status Radio Buttons (from pharma medizo) */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: 'var(--color-teal)', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            Medicine Checklist
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
            Select a status for each medicine — Given ✅, Not Available ⚠️, or Not Needed ❌
          </Typography>

          {medications.length > 0 ? (
            medications.map((med, idx) => {
              const currentStatus = getStatus(med.name);
              const config = statusConfig[currentStatus];

              return (
                <Paper
                  key={idx}
                  sx={{
                    p: 1.5,
                    mb: 1.5,
                    borderRadius: '14px',
                    borderLeft: `4px solid ${config.color}`,
                    bgcolor: config.bgColor,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Medicine Info */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FAF2F5' }}>
                        💊 {med.name.toUpperCase()}
                      </Typography>
                      {med.dosage && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Dosage: {med.dosage} {med.duration ? `| Duration: ${med.duration}` : ''}
                        </Typography>
                      )}
                      {med.instructions && (
                        <Typography variant="caption" sx={{ color: '#FBBF24', display: 'block' }}>
                          Instructions: {med.instructions}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      icon={config.icon as React.ReactElement}
                      label={config.label}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.1)',
                        color: config.color,
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        border: `1px solid ${config.color}`,
                        '& .MuiChip-icon': { color: config.color },
                      }}
                    />
                  </Box>

                  {/* Status Radio Buttons */}
                  {!isAlreadyDispensed && (
                    <>
                      <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.08)' }} />
                      <FormControl component="fieldset" disabled={loading}>
                        <RadioGroup
                          row
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(med.name, e.target.value as MedStatus)}
                        >
                          <FormControlLabel
                            value="given"
                            control={<Radio sx={{ color: '#10B981', '&.Mui-checked': { color: '#10B981' }, p: 0.5 }} size="small" />}
                            label={
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <CheckCircleIcon sx={{ fontSize: 14, color: '#10B981' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>Given</Typography>
                              </Box>
                            }
                            sx={{ mr: 1.5 }}
                          />
                          <FormControlLabel
                            value="not_available"
                            control={<Radio sx={{ color: '#F59E0B', '&.Mui-checked': { color: '#F59E0B' }, p: 0.5 }} size="small" />}
                            label={
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <CancelIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>Not Available</Typography>
                              </Box>
                            }
                            sx={{ mr: 1.5 }}
                          />
                          <FormControlLabel
                            value="not_needed"
                            control={<Radio sx={{ color: '#EF4444', '&.Mui-checked': { color: '#EF4444' }, p: 0.5 }} size="small" />}
                            label={
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <BlockIcon sx={{ fontSize: 14, color: '#EF4444' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>Not Needed</Typography>
                              </Box>
                            }
                          />
                        </RadioGroup>
                      </FormControl>
                    </>
                  )}
                </Paper>
              );
            })
          ) : (
            <Paper sx={{ p: 1.5, borderRadius: '14px', bgcolor: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                No medications listed in this prescription.
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Pharmacist Dispense Notes */}
        {!isAlreadyDispensed && (
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Pharmacist Dispense Notes / Substitutions"
            placeholder="e.g. All items verified, generic equivalent offered for Tab. Metformin..."
            value={dispenseNotes}
            onChange={(e) => setDispenseNotes(e.target.value)}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#FAF2F5',
                bgcolor: 'rgba(0,0,0,0.2)',
                borderRadius: '16px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                '&:hover fieldset': { borderColor: '#F59E0B' }
              },
              '& .MuiInputLabel-root': { color: 'text.secondary' }
            }}
          />
        )}

        {/* Dispensed Metadata (if already fulfilled) */}
        {isAlreadyDispensed && prescription.dispensedBy && (
          <Paper sx={{ p: 1.5, mt: 2, borderRadius: '16px', bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
              Fulfilled Pharmacy Digital Stamp
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {prescription.dispensedBy.pharmacyName || 'Medizo Care Pharmacy'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Dispensed By: {prescription.dispensedBy.pharmacistName} (Lic #: {prescription.dispensedBy.licenseNumber})
            </Typography>
            {prescription.dispensedAt && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Date: {new Date(prescription.dispensedAt).toLocaleString()}
              </Typography>
            )}
            {prescription.dispenseNotes && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Notes: {prescription.dispenseNotes}
              </Typography>
            )}
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700 }}>
          Close
        </Button>
        {!isAlreadyDispensed && (
          <Button
            variant="contained"
            onClick={handleFulfill}
            disabled={loading || !allStatusesSet}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            sx={{
              borderRadius: '14px',
              fontWeight: 800,
              bgcolor: allStatusesSet ? '#10B981' : '#6B7280',
              color: '#ffffff',
              boxShadow: allStatusesSet ? '0 4px 16px rgba(16, 185, 129, 0.4)' : 'none',
              '&:hover': { bgcolor: allStatusesSet ? '#059669' : '#6B7280' },
              '&.Mui-disabled': { bgcolor: '#374151', color: '#9CA3AF' }
            }}
          >
            {loading ? 'Submitting...' : 'Confirm Dispensing'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
