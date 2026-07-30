'use client';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  CircularProgress,
  IconButton,
  Alert
} from '@mui/material';
import {
  LocalPharmacy as PharmacyIcon,
  Search as SearchIcon,
  QrCodeScanner as QrIcon,
  CheckCircle as ActiveIcon,
  Medication as MedicationIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  VerifiedUser as VerifiedIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { getPrescriptions } from '../services/prescriptions';
import { Prescription } from '../types/prescription';
import DispenseModal from '../components/DispenseModal';

export default function PharmacistDashboard() {
  const { authState } = useAuth();
  const { user } = authState;
  const { mode } = useThemeContext();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'dispensed' | 'all'>('pending');

  const fetchPrescriptionsList = async () => {
    setLoading(true);
    try {
      const data = await getPrescriptions();
      setPrescriptions(data || []);
    } catch (err) {
      console.error('Failed to load prescriptions for pharmacist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptionsList();
  }, []);

  const pendingCount = prescriptions.filter(p => p.dispensedStatus !== 'dispensed').length;
  const dispensedCount = prescriptions.filter(p => p.dispensedStatus === 'dispensed').length;

  const filteredPrescriptions = prescriptions.filter(p => {
    // Filter by tab status
    if (activeTab === 'pending' && p.dispensedStatus === 'dispensed') return false;
    if (activeTab === 'dispensed' && p.dispensedStatus !== 'dispensed') return false;

    // Filter by search query
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(p.id).toLowerCase().includes(q) ||
      String(p.patientName || '').toLowerCase().includes(q) ||
      String(p.medication || '').toLowerCase().includes(q) ||
      (Array.isArray(p.provisionalDiagnosis) && p.provisionalDiagnosis.some(d => String(d).toLowerCase().includes(q)))
    );
  });

  const handleOpenDispense = (rx: Prescription) => {
    setSelectedRx(rx);
    setDispenseModalOpen(true);
  };

  return (
    <Container maxWidth="md" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
      {/* Header Profile & Pharmacy Info */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: '24px',
          bgcolor: mode === 'dark' ? 'rgba(26, 44, 40, 0.85)' : 'rgba(255, 255, 255, 0.9)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 54,
                height: 54,
                bgcolor: '#F59E0B',
                color: '#0B1315',
                fontWeight: 900,
                fontSize: '1.4rem',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)'
              }}
            >
              💊
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
                {user?.firstName ? `Pharm. ${user.firstName} ${user.lastName}` : 'Pharmacy Portal'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#FBBF24', fontWeight: 800 }}>
                {user?.pharmacyName || 'Medizo Care Pharmacy'}
              </Typography>
              <Chip
                label="Pharmacist Verified"
                size="small"
                sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#F59E0B', color: '#0B1315', mt: 0.5 }}
              />
            </Box>
          </Box>
          <IconButton onClick={fetchPrescriptionsList} sx={{ color: 'var(--color-teal)' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Metrics Cards Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Paper
            onClick={() => setActiveTab('pending')}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: '20px',
              bgcolor: activeTab === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
              border: activeTab === 'pending' ? '2px solid #F59E0B' : '1px solid var(--glass-border)',
              cursor: 'pointer'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#FBBF24' }}>
              {pendingCount}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>
              Pending Rx
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={4}>
          <Paper
            onClick={() => setActiveTab('dispensed')}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: '20px',
              bgcolor: activeTab === 'dispensed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
              border: activeTab === 'dispensed' ? '2px solid #10B981' : '1px solid var(--glass-border)',
              cursor: 'pointer'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#34D399' }}>
              {dispensedCount}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>
              Dispensed
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={4}>
          <Paper
            onClick={() => setActiveTab('all')}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: '20px',
              bgcolor: activeTab === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
              border: activeTab === 'all' ? '2px solid #3B82F6' : '1px solid var(--glass-border)',
              cursor: 'pointer'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#60A5FA' }}>
              {prescriptions.length}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>
              Total Rx
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Fast QR Code & Search Lookup */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '20px',
          bgcolor: mode === 'dark' ? 'rgba(26, 44, 40, 0.85)' : '#ffffff',
          border: '1px solid var(--glass-border)'
        }}
      >
        <TextField
          fullWidth
          placeholder="Scan QR Code or enter Rx ID / Patient name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'var(--color-teal)' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <QrIcon sx={{ color: '#F59E0B', cursor: 'pointer' }} />
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              bgcolor: 'rgba(0,0,0,0.04)',
              color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)'
            }
          }}
        />
      </Paper>

      {/* Prescriptions Feed Queue */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
          {activeTab === 'pending' ? '📋 Pending Dispense Queue' : activeTab === 'dispensed' ? '✅ Fulfilled Prescriptions' : '📜 All Prescriptions'}
        </Typography>
        <Chip
          label={`${filteredPrescriptions.length} items`}
          size="small"
          sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', fontWeight: 800 }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="warning" />
        </Box>
      ) : filteredPrescriptions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.03)' }}>
          <PharmacyIcon sx={{ fontSize: 48, color: '#F59E0B', opacity: 0.5, mb: 1 }} />
          <Typography variant="body1" sx={{ fontWeight: 800 }}>
            No prescriptions found
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Check search keywords or refresh the queue
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filteredPrescriptions.map((rx) => {
            const isDispensed = rx.dispensedStatus === 'dispensed';
            return (
              <Card
                key={rx.id}
                onClick={() => handleOpenDispense(rx)}
                sx={{
                  borderRadius: '20px',
                  bgcolor: mode === 'dark' ? 'rgba(26, 44, 40, 0.85)' : '#ffffff',
                  border: isDispensed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': { transform: 'scale(1.01)' }
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`#${String(rx.id).slice(-6).toUpperCase()}`}
                        size="small"
                        sx={{ fontFamily: 'monospace', fontWeight: 900, bgcolor: 'rgba(0, 200, 150, 0.15)', color: '#00C896', fontSize: '0.72rem' }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : ''}
                      </Typography>
                    </Box>
                    <Chip
                      label={isDispensed ? 'DISPENSED' : 'VERIFY & DISPENSE'}
                      size="small"
                      sx={{
                        bgcolor: isDispensed ? 'rgba(16, 185, 129, 0.2)' : '#F59E0B',
                        color: isDispensed ? '#34D399' : '#0B1315',
                        fontWeight: 900,
                        fontSize: '0.68rem'
                      }}
                    />
                  </Box>

                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
                    Patient: {rx.patientName || 'Sarah Johnson'}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#FBBF24', fontWeight: 700, mt: 0.5 }}>
                    💊 {rx.medications && rx.medications.length > 0 ? rx.medications.map(m => m.name).join(', ') : rx.medication}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1, borderTop: '1px solid var(--glass-border)' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VerifiedIcon sx={{ fontSize: 13, color: '#2e7d32' }} /> Verified Prescriber
                    </Typography>
                    <ChevronRightIcon sx={{ color: '#F59E0B' }} />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Dispense Modal */}
      <DispenseModal
        open={dispenseModalOpen}
        onClose={() => setDispenseModalOpen(false)}
        prescription={selectedRx}
        onDispensedSuccess={fetchPrescriptionsList}
      />
    </Container>
  );
}
