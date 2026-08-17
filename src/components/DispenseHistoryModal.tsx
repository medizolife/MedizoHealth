'use client';
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  IconButton,
  Divider,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  AccessTime as TimeIcon,
  Medication as MedicationIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { Prescription, DispenseHistoryEvent } from '../types/prescription';
import { useThemeContext } from '../contexts/ThemeContext';

interface DispenseHistoryModalProps {
  open: boolean;
  onClose: () => void;
  prescription: Prescription | null;
}

export default function DispenseHistoryModal({ open, onClose, prescription }: DispenseHistoryModalProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  if (!prescription) return null;

  // Extract history events or build fallback from single legacy record
  let history: DispenseHistoryEvent[] = [];
  if (Array.isArray(prescription.dispenseHistory) && prescription.dispenseHistory.length > 0) {
    history = prescription.dispenseHistory;
  } else if (prescription.dispensedAt) {
    history = [{
      dispenseIndex: 1,
      dispensedAt: prescription.dispensedAt,
      dispenseNotes: prescription.dispenseNotes || 'Prescription items verified and dispensed.',
      itemsDispensed: prescription.medications ? prescription.medications.map(m => ({ name: m.name, status: 'given' })) : [],
      dispensedStatus: prescription.dispensedStatus || 'dispensed'
    }];
  }

  const dispenseCount = history.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: '24px', sm: '28px' },
          bgcolor: isDark ? '#0F172A' : '#FFFFFF',
          backgroundImage: isDark
            ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 18, 16, 0.98) 100%)'
            : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: isDark ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.8)' : '0 20px 50px rgba(13, 148, 136, 0.15)',
          overflow: 'hidden',
          m: { xs: 1.5, sm: 2 }
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: { xs: 2, sm: 2.5 },
          pb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
              border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#34D399' : '#059669'
            }}
          >
            <HistoryIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: "'Outfit', sans-serif", fontSize: { xs: '1.05rem', sm: '1.2rem' }, color: isDark ? '#FFFFFF' : '#0F172A', lineHeight: 1.2 }}>
              Dispensing History
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 700, fontSize: '0.75rem' }}>
              Rx ID: #{prescription.id ? prescription.id.slice(-8).toUpperCase() : 'N/A'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: isDark ? '#9CA3AF' : '#64748B' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, pt: '16px !important' }}>
        {/* Count Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 1.8,
            mb: 2.5,
            borderRadius: '20px',
            bgcolor: dispenseCount > 0
              ? (isDark ? 'rgba(13, 148, 136, 0.12)' : '#F0FDFA')
              : (isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC'),
            border: dispenseCount > 0
              ? (isDark ? '1px solid rgba(13, 148, 136, 0.3)' : '1px solid #99F6E4')
              : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <TimeIcon sx={{ color: isDark ? '#2DD4BF' : '#0D9488', fontSize: 24 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#134E4A', fontSize: '0.9rem' }}>
                {dispenseCount === 0 ? 'Not Yet Dispensed' : `Dispensed ${dispenseCount} Time${dispenseCount > 1 ? 's' : ''}`}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>
                {dispenseCount === 0 ? 'No pharmacy fulfillment logs recorded.' : 'Record of all verified dispensing events.'}
              </Typography>
            </Box>
          </Box>
          {dispenseCount > 0 && (
            <Chip
              label={`${dispenseCount} EVENT${dispenseCount > 1 ? 'S' : ''}`}
              size="small"
              sx={{
                fontWeight: 900,
                fontSize: '0.7rem',
                bgcolor: '#0D9488',
                color: '#FFFFFF',
                height: 24
              }}
            />
          )}
        </Paper>

        {/* Anonymous Privacy Note */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 2.5, px: 0.5 }}>
          <InfoIcon sx={{ fontSize: 16, color: isDark ? '#64748B' : '#94A3B8' }} />
          <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontWeight: 600, fontSize: '0.72rem' }}>
            Privacy Protected: Only timestamps and dispensed medicine statuses are recorded.
          </Typography>
        </Box>

        {/* Timeline of Dispense Events */}
        {history.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 700 }}>
              No dispensing history available for this prescription.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {history.map((event, idx) => {
              const eventDate = new Date(event.dispensedAt);
              const formattedDate = !isNaN(eventDate.getTime())
                ? eventDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Date Unknown';
              const formattedTime = !isNaN(eventDate.getTime())
                ? eventDate.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })
                : '';

              const items = Array.isArray(event.itemsDispensed) ? event.itemsDispensed : [];

              return (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 2.2 },
                    borderRadius: '20px',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                    boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  {/* Event Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`Dispense #${history.length - idx}`}
                        size="small"
                        sx={{
                          fontWeight: 900,
                          fontSize: '0.7rem',
                          bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                          color: isDark ? '#34D399' : '#059669',
                          border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #A7F3D0',
                          height: 24
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', fontSize: '0.85rem' }}>
                        {formattedDate}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#9CA3AF' : '#64748B', fontSize: '0.78rem' }}>
                      🕒 {formattedTime}
                    </Typography>
                  </Box>

                  {/* Dispensed Items List */}
                  {items.length > 0 && (
                    <Box sx={{ mb: 1.5, pl: 0.5 }}>
                      <Typography variant="caption" sx={{ color: isDark ? '#A7F3D0' : '#065F46', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', display: 'block', mb: 0.8 }}>
                        Medication Status at Dispense:
                      </Typography>
                      <Stack spacing={0.8}>
                        {items.map((item, mIdx) => {
                          const isGiven = item.status === 'given';
                          const isNotAvail = item.status === 'not_available';
                          return (
                            <Box
                              key={mIdx}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 1,
                                px: 1.2,
                                borderRadius: '12px',
                                bgcolor: isDark ? 'rgba(0,0,0,0.25)' : '#F8FAFC',
                                border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #F1F5F9'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <MedicationIcon sx={{ fontSize: 16, color: isDark ? '#2DD4BF' : '#0D9488' }} />
                                <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#F1F5F9' : '#1E293B', fontSize: '0.82rem' }}>
                                  {item.name}
                                </Typography>
                              </Box>
                              <Chip
                                icon={
                                  isGiven ? <CheckCircleIcon sx={{ fontSize: '13px !important' }} /> :
                                  isNotAvail ? <CancelIcon sx={{ fontSize: '13px !important' }} /> :
                                  <BlockIcon sx={{ fontSize: '13px !important' }} />
                                }
                                label={
                                  isGiven ? 'Given' :
                                  isNotAvail ? 'Not Available' :
                                  'Not Needed'
                                }
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  bgcolor: isGiven ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5') : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'),
                                  color: isGiven ? (isDark ? '#34D399' : '#059669') : (isDark ? '#F87171' : '#DC2626'),
                                  border: isGiven ? (isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #A7F3D0') : (isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA')
                                }}
                              />
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}

                  {/* Notes recorded */}
                  {event.dispenseNotes && (
                    <Box sx={{ p: 1.2, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F1F5F9' }}>
                      <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 600, fontSize: '0.75rem', fontStyle: 'italic' }}>
                        📝 &ldquo;{event.dispenseNotes}&rdquo;
                      </Typography>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Stack>
        )}
      </DialogContent>

      <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }} />

      <DialogActions sx={{ p: { xs: 1.8, sm: 2 } }}>
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            py: 1.2,
            borderRadius: '16px',
            bgcolor: '#0D9488',
            color: '#FFFFFF',
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            textTransform: 'none',
            fontSize: '0.9rem',
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
            '&:hover': { bgcolor: '#0F766E' }
          }}
        >
          Close History
        </Button>
      </DialogActions>
    </Dialog>
  );
}
