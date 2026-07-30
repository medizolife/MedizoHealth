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
  Alert,
  Snackbar,
  Fab,
  Tooltip
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
  ChevronRight as ChevronRightIcon,
  CameraAlt as CameraIcon,
  ContentPasteSearch as PasteIcon,
  LocalHospital as HospitalIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { getPrescriptions, lookupPrescriptionByCode } from '../services/prescriptions';
import { Prescription } from '../types/prescription';
import DispenseModal from '../components/DispenseModal';
import QrScannerModal from '../components/QrScannerModal';

export default function PharmacistDashboard() {
  const { authState } = useAuth();
  const { user } = authState;
  const { mode } = useThemeContext();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'dispensed' | 'all'>('pending');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'success' | 'error' | 'info' | 'warning' });

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

  // Listen for custom event from bottom nav "Dispense" tab
  useEffect(() => {
    const handleOpenScanner = () => setScannerOpen(true);
    window.addEventListener('open-qr-scanner', handleOpenScanner);
    return () => window.removeEventListener('open-qr-scanner', handleOpenScanner);
  }, []);

  const pendingCount = prescriptions.filter(p => p.dispensedStatus !== 'dispensed').length;
  const dispensedCount = prescriptions.filter(p => p.dispensedStatus === 'dispensed').length;
  const uniquePatients = Array.from(new Set(prescriptions.map(p => p.patientId))).length;

  const filteredPrescriptions = prescriptions.filter(p => {
    if (activeTab === 'pending' && p.dispensedStatus === 'dispensed') return false;
    if (activeTab === 'dispensed' && p.dispensedStatus !== 'dispensed') return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(p.id).toLowerCase().includes(q) ||
      String((p as any).patientName || '').toLowerCase().includes(q) ||
      String((p as any).doctorName || '').toLowerCase().includes(q) ||
      String(p.medication || '').toLowerCase().includes(q) ||
      String(p.qrCode || '').toLowerCase().includes(q) ||
      (Array.isArray(p.provisionalDiagnosis) && p.provisionalDiagnosis.some(d => String(d).toLowerCase().includes(q))) ||
      (Array.isArray(p.medications) && p.medications.some(m => m.name.toLowerCase().includes(q)))
    );
  });

  const handleOpenDispense = (rx: Prescription) => {
    setSelectedRx(rx);
    setDispenseModalOpen(true);
  };

  // Handle QR scan result - look up prescription by scanned code
  const handleScanSuccess = async (decodedText: string) => {
    setScannerOpen(false);
    setLookupLoading(true);
    setSnackbar({ open: true, message: `🔍 Looking up prescription: ${decodedText.substring(0, 30)}...`, severity: 'info' });
    
    try {
      const result = await lookupPrescriptionByCode(decodedText);
      if (result.success && result.prescription) {
        setSelectedRx(result.prescription as Prescription);
        setDispenseModalOpen(true);
        setSnackbar({ open: true, message: '✅ Prescription found! Verify and dispense.', severity: 'success' });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Prescription not found for this QR code.';
      setSnackbar({ open: true, message: `❌ ${msg}`, severity: 'error' });
      // Fall back to local search
      setSearch(decodedText);
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle search submit (enter key or button click)
  const handleSearchSubmit = async () => {
    if (!search.trim()) return;
    setLookupLoading(true);
    try {
      const result = await lookupPrescriptionByCode(search.trim());
      if (result.success && result.prescription) {
        setSelectedRx(result.prescription as Prescription);
        setDispenseModalOpen(true);
        setSnackbar({ open: true, message: '✅ Prescription found!', severity: 'success' });
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: 'No exact match found. Showing filtered results.', severity: 'warning' });
    } finally {
      setLookupLoading(false);
    }
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
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  label="Pharmacist Verified"
                  size="small"
                  sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#F59E0B', color: '#0B1315' }}
                />
                <Chip
                  label={`Lic#: ${user?.licenseNumber || 'PHARM-88219'}`}
                  size="small"
                  sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(245,158,11,0.15)', color: '#FBBF24' }}
                />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={fetchPrescriptionsList} sx={{ color: 'var(--color-teal)' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Metrics Cards Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={3}>
          <Paper
            onClick={() => setActiveTab('pending')}
            sx={{
              p: 1.5,
              textAlign: 'center',
              borderRadius: '20px',
              bgcolor: activeTab === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
              border: activeTab === 'pending' ? '2px solid #F59E0B' : '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#FBBF24', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              {pendingCount}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', fontSize: '0.6rem' }}>
              Pending
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={3}>
          <Paper
            onClick={() => setActiveTab('dispensed')}
            sx={{
              p: 1.5,
              textAlign: 'center',
              borderRadius: '20px',
              bgcolor: activeTab === 'dispensed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
              border: activeTab === 'dispensed' ? '2px solid #10B981' : '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#34D399', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              {dispensedCount}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', fontSize: '0.6rem' }}>
              Fulfilled
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={3}>
          <Paper
            onClick={() => setActiveTab('all')}
            sx={{
              p: 1.5,
              textAlign: 'center',
              borderRadius: '20px',
              bgcolor: activeTab === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
              border: activeTab === 'all' ? '2px solid #3B82F6' : '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#60A5FA', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              {prescriptions.length}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', fontSize: '0.6rem' }}>
              Total Rx
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={3}>
          <Paper
            sx={{
              p: 1.5,
              textAlign: 'center',
              borderRadius: '20px',
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#A78BFA', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              {uniquePatients}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', fontSize: '0.6rem' }}>
              Patients
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* QR Scan + Search Bar */}
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
        {/* Camera Scan Button - Full Width */}
        <Button
          fullWidth
          variant="contained"
          onClick={() => setScannerOpen(true)}
          startIcon={<CameraIcon />}
          endIcon={<QrIcon />}
          sx={{
            mb: 2,
            py: 1.8,
            borderRadius: '16px',
            fontWeight: 900,
            fontSize: '1rem',
            bgcolor: '#F59E0B',
            color: '#0B1315',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
            '&:hover': { bgcolor: '#FBBF24', boxShadow: '0 6px 24px rgba(245, 158, 11, 0.5)' },
            textTransform: 'none'
          }}
        >
          📷 Scan Prescription QR Code
        </Button>

        {/* Search Input */}
        <TextField
          fullWidth
          placeholder="Search by Rx ID, Patient name, medication, or QR code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'var(--color-teal)' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {lookupLoading && <CircularProgress size={20} sx={{ color: '#F59E0B' }} />}
                  <Tooltip title="Quick Lookup by ID">
                    <IconButton size="small" onClick={handleSearchSubmit} disabled={!search.trim()}>
                      <PasteIcon sx={{ color: search.trim() ? '#F59E0B' : 'rgba(255,255,255,0.3)', fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Open QR Scanner">
                    <IconButton size="small" onClick={() => setScannerOpen(true)}>
                      <QrIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '14px',
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
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Try scanning a QR code or adjusting your search
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CameraIcon />}
            onClick={() => setScannerOpen(true)}
            sx={{ borderRadius: '12px', fontWeight: 800, borderColor: '#F59E0B', color: '#F59E0B' }}
          >
            Scan QR Code
          </Button>
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
                  '&:hover': { transform: 'scale(1.01)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                      label={isDispensed ? '✅ DISPENSED' : '⚡ VERIFY & DISPENSE'}
                      size="small"
                      sx={{
                        bgcolor: isDispensed ? 'rgba(16, 185, 129, 0.2)' : '#F59E0B',
                        color: isDispensed ? '#34D399' : '#0B1315',
                        fontWeight: 900,
                        fontSize: '0.65rem'
                      }}
                    />
                  </Box>

                  {/* Patient & Doctor Names */}
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)', lineHeight: 1.3 }}>
                    👤 {(rx as any).patientName || 'Patient'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#60A5FA', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <HospitalIcon sx={{ fontSize: 12 }} /> {(rx as any).doctorName || 'Prescribing Doctor'}
                  </Typography>

                  {/* Medications Summary */}
                  <Typography variant="body2" sx={{ color: '#FBBF24', fontWeight: 700, mt: 0.5 }}>
                    💊 {rx.medications && rx.medications.length > 0
                      ? rx.medications.map(m => m.name).join(', ')
                      : rx.medication || 'No medication details'}
                  </Typography>

                  {/* Diagnosis if available */}
                  {rx.provisionalDiagnosis && rx.provisionalDiagnosis.length > 0 && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.3, display: 'block' }}>
                      Diagnosis: {rx.provisionalDiagnosis.join(', ')}
                    </Typography>
                  )}

                  {/* Footer */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1, borderTop: '1px solid var(--glass-border)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VerifiedIcon sx={{ fontSize: 13, color: '#2e7d32' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Verified Prescriber
                      </Typography>
                    </Box>
                    {isDispensed && rx.dispensedAt && (
                      <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 700 }}>
                        {new Date(rx.dispensedAt).toLocaleDateString()}
                      </Typography>
                    )}
                    <ChevronRightIcon sx={{ color: isDispensed ? '#34D399' : '#F59E0B' }} />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Floating QR Scan Button */}
      <Fab
        onClick={() => setScannerOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 90,
          right: 20,
          bgcolor: '#F59E0B',
          color: '#0B1315',
          boxShadow: '0 6px 24px rgba(245, 158, 11, 0.5)',
          '&:hover': { bgcolor: '#FBBF24' },
          zIndex: 1200
        }}
      >
        <QrIcon sx={{ fontSize: 28 }} />
      </Fab>

      {/* QR Scanner Modal */}
      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Dispense Modal */}
      <DispenseModal
        open={dispenseModalOpen}
        onClose={() => setDispenseModalOpen(false)}
        prescription={selectedRx}
        onDispensedSuccess={fetchPrescriptionsList}
      />

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: '14px', fontWeight: 700 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
