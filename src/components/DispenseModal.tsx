'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  Paper,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalPharmacy as PharmacyIcon,
  CheckCircle as CheckCircleIcon,
  VerifiedUser as VerifiedIcon,
  Medication as MedicationIcon,
  Person as PersonIcon,
  MedicalServices as StethoscopeIcon,
  QrCode2 as QrIcon
} from '@mui/icons-material';
import { Prescription } from '../types/prescription';
import { dispensePrescription } from '../services/prescriptions';

interface DispenseModalProps {
  open: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  onDispensedSuccess?: () => void;
}

export default function DispenseModal({ open, onClose, prescription, onDispensedSuccess }: DispenseModalProps) {
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [checkedMeds, setCheckedMeds] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!prescription) return null;

  const isAlreadyDispensed = prescription.dispensedStatus === 'dispensed';

  const handleMedToggle = (idx: number) => {
    setCheckedMeds(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleFulfill = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await dispensePrescription(prescription.id, dispenseNotes);
      if (res.success || res.prescription) {
        setSuccess('Prescription fulfilled & marked as dispensed!');
        setTimeout(() => {
          if (onDispensedSuccess) onDispensedSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to dispense prescription');
    } finally {
      setLoading(false);
    }
  };

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
          border: '1px solid var(--glass-border)'
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

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '14px' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '14px' }}>
            {success}
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
            label={isAlreadyDispensed ? 'DISPENSED' : 'READY TO DISPENSE'}
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
                {prescription.doctorId ? `Dr. Prescriber` : 'Licensed Physician'}
              </Typography>
              <Chip
                icon={<VerifiedIcon sx={{ fontSize: '12px !important', color: '#ffffff !important' }} />}
                label="DigiLocker Verified"
                size="small"
                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#2e7d32', color: '#ffffff', mt: 0.5 }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 1.5, borderRadius: '16px', bgcolor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <Typography variant="caption" sx={{ color: '#60A5FA', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <PersonIcon sx={{ fontSize: 14 }} /> Patient Details
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {prescription.patientName || 'Sarah Johnson'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                ID: #{String(prescription.patientId).slice(-6)}
              </Typography>
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

        {/* Medication Checklist */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: 'var(--color-teal)', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 1 }}>
            Prescribed Medications Checklist
          </Typography>

          {prescription.medications && prescription.medications.length > 0 ? (
            prescription.medications.map((med, idx) => (
              <Paper
                key={idx}
                sx={{
                  p: 1.2,
                  mb: 1,
                  borderRadius: '14px',
                  bgcolor: checkedMeds[idx] ? 'rgba(0, 200, 150, 0.12)' : 'rgba(0,0,0,0.15)',
                  border: checkedMeds[idx] ? '1px solid #00C896' : '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FAF2F5' }}>
                    💊 {med.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Dosage: {med.dosage} | Duration: {med.duration}
                  </Typography>
                  {med.instructions && (
                    <Typography variant="caption" sx={{ color: '#FBBF24', display: 'block' }}>
                      Instructions: {med.instructions}
                    </Typography>
                  )}
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!checkedMeds[idx]}
                      onChange={() => handleMedToggle(idx)}
                      sx={{ color: '#F59E0B', '&.Mui-checked': { color: '#00C896' } }}
                    />
                  }
                  label=""
                />
              </Paper>
            ))
          ) : (
            <Paper sx={{ p: 1.5, borderRadius: '14px', bgcolor: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                💊 {prescription.medication || 'Prescribed Medication'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Dosage: {prescription.dosage} | Frequency: {prescription.frequency}
              </Typography>
              {prescription.instructions && (
                <Typography variant="caption" sx={{ color: '#FBBF24', display: 'block' }}>
                  Instructions: {prescription.instructions}
                </Typography>
              )}
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
            placeholder="e.g. All items verified, generic equivalent offered..."
            value={dispenseNotes}
            onChange={(e) => setDispenseNotes(e.target.value)}
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
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
            sx={{
              borderRadius: '14px',
              fontWeight: 800,
              bgcolor: '#F59E0B',
              color: '#0B1315',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
              '&:hover': { bgcolor: '#FBBF24' }
            }}
          >
            Fulfill & Dispense Rx
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
