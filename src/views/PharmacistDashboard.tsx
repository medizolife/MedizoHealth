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
  const [rxIdInput, setRxIdInput] = useState('');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [idLookupLoading, setIdLookupLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'success' | 'error' | 'info' | 'warning' });

  // Handle dedicated Prescription ID / URL validation (matching pharma medizo logic)
  const handleIdValidation = async (rawInput: string) => {
    let id = rawInput.trim();
    if (!id) return;

    // Handle JSON string format (e.g. {"id":"...", "qrCode":"..."})
    if (id.startsWith('{') && id.endsWith('}')) {
      try {
        const parsed = JSON.parse(id);
        id = parsed.id || parsed.prescriptionId || parsed._id || id;
      } catch (e) {}
    }

    // Handle query parameter or URL paths (e.g. https://medizo.life/prescriptions/detail?id=12345)
    if (id.includes('?id=')) {
      const match = id.match(/[?&]id=([^&]+)/);
      if (match && match[1]) {
        id = match[1];
      }
    } else if (id.includes('/')) {
      const parts = id.split('?')[0].split('/');
      const lastPart = parts.pop() || parts.pop();
      if (lastPart && lastPart !== 'detail' && lastPart !== 'prescriptions' && lastPart !== 'lookup') {
        id = lastPart;
      }
    }

    id = id.split('?')[0].trim();

    setIdLookupLoading(true);
    setSnackbar({ open: true, message: `🔍 Verifying prescription ID: ${id}...`, severity: 'info' });

    try {
      const result = await lookupPrescriptionByCode(id);
      if (result.success && result.prescription) {
        setSelectedRx(result.prescription as Prescription);
        setDispenseModalOpen(true);
        setSnackbar({ open: true, message: '✅ Prescription verified! Inspect digital signature and dispense.', severity: 'success' });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Prescription not found or invalid ID.';
      setSnackbar({ open: true, message: `❌ ${msg}`, severity: 'error' });
    } finally {
      setIdLookupLoading(false);
    }
  };

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

  const fulfilledToday = prescriptions.filter(p => {
    if (!p.dispensedAt) return false;
    const d = new Date(p.dispensedAt);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }).length;

  const totalDispensed = prescriptions.length;
  const uniquePatients = Array.from(new Set(prescriptions.map(p => p.patientId))).length;

  const filteredPrescriptions = prescriptions.filter(p => {
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
      setSnackbar({ open: true, message: 'No exact match found. Filtered local logs.', severity: 'warning' });
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
                  label="Pharmacist Account"
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
        <Grid item xs={4}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: '20px',
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#34D399' }}>
              {fulfilledToday}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>
              Fulfilled Today
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={4}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: '20px',
              bgcolor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#FBBF24' }}>
              {totalDispensed}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>
              Total Dispensed
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={4}>
          <Paper
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: '20px',
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#60A5FA' }}>
              {uniquePatients}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>
              Patients Served
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Hero Scanner & Rx ID Verification Station */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3.5,
          borderRadius: '24px',
          bgcolor: mode === 'dark' ? 'rgba(26, 44, 40, 0.85)' : '#ffffff',
          border: '2px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 8px 32px rgba(245, 158, 11, 0.15)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <PharmacyIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
            Pharmacy Dispense & Verification Station
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
          Verify digital signatures and dispense medications using live camera QR scanner or dedicated Rx ID entry.
        </Typography>

        {/* Verification Action Buttons Grid */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setScannerOpen(true)}
              startIcon={<CameraIcon />}
              endIcon={<QrIcon />}
              sx={{
                py: 1.8,
                borderRadius: '16px',
                fontWeight: 900,
                fontSize: '0.95rem',
                bgcolor: '#F59E0B',
                color: '#0B1315',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                '&:hover': { bgcolor: '#FBBF24', boxShadow: '0 6px 24px rgba(245, 158, 11, 0.5)' },
                textTransform: 'none'
              }}
            >
              📷 Live Camera QR Scanner
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              component="label"
              startIcon={<PasteIcon />}
              sx={{
                py: 1.8,
                borderRadius: '16px',
                fontWeight: 900,
                fontSize: '0.95rem',
                borderColor: '#F59E0B',
                color: '#FBBF24',
                bgcolor: 'rgba(245, 158, 11, 0.08)',
                '&:hover': { borderColor: '#FBBF24', bgcolor: 'rgba(245, 158, 11, 0.18)' },
                textTransform: 'none'
              }}
            >
              🖼️ Upload QR Image File
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const text = event.target?.result as string;
                      if (text) {
                        setSnackbar({ open: true, message: 'Processing uploaded QR image...', severity: 'info' });
                      }
                    };
                    reader.readAsDataURL(file);
                  } catch (err) {
                    setSnackbar({ open: true, message: 'Could not read image file', severity: 'error' });
                  }
                }}
              />
            </Button>
          </Grid>
        </Grid>

        {/* Dedicated Prescription ID Entry & Verification Section */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: '18px',
            bgcolor: mode === 'dark' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VerifiedIcon sx={{ color: '#FBBF24', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
                Verify Prescription by ID / URL (Copy-Paste)
              </Typography>
            </Box>
            <Chip label="Manual Verification" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24' }} />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <TextField
              fullWidth
              size="medium"
              placeholder="Paste Rx ID (e.g. 6a6b1f13477f4d601be568b9) or full URL..."
              value={rxIdInput}
              onChange={(e) => setRxIdInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleIdValidation(rxIdInput); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PasteIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {navigator.clipboard && (
                      <Button
                        size="small"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text) {
                              setRxIdInput(text);
                              setSnackbar({ open: true, message: 'Pasted from clipboard!', severity: 'info' });
                            }
                          } catch (e) {
                            setSnackbar({ open: true, message: 'Clipboard access denied', severity: 'warning' });
                          }
                        }}
                        sx={{ minWidth: 'auto', px: 1, py: 0.3, fontSize: '0.72rem', fontWeight: 800, color: '#FBBF24' }}
                      >
                        📋 Paste
                      </Button>
                    )}
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.4)' : '#ffffff',
                  color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)'
                }
              }}
            />

            <Button
              variant="contained"
              onClick={() => handleIdValidation(rxIdInput)}
              disabled={idLookupLoading || !rxIdInput.trim()}
              startIcon={idLookupLoading ? <CircularProgress size={18} color="inherit" /> : <VerifiedIcon />}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: '12px',
                fontWeight: 900,
                whiteSpace: 'nowrap',
                bgcolor: '#10B981',
                color: '#ffffff',
                '&:hover': { bgcolor: '#059669' },
                textTransform: 'none'
              }}
            >
              {idLookupLoading ? 'Verifying...' : 'Verify & Dispense'}
            </Button>
          </Box>
        </Paper>
      </Paper>

      {/* Prescriptions Feed Queue */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
          📜 Dispensed Prescriptions History
        </Typography>
        <Chip
          label={`${filteredPrescriptions.length} dispensed`}
          size="small"
          sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontWeight: 800 }}
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
            No dispensed prescriptions yet
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            Click 'Scan Prescription QR Code' above to verify and dispense a prescription.
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
          {filteredPrescriptions.map((rx) => (
            <Card
              key={rx.id}
              onClick={() => handleOpenDispense(rx)}
              sx={{
                borderRadius: '20px',
                bgcolor: mode === 'dark' ? 'rgba(26, 44, 40, 0.85)' : '#ffffff',
                border: '1px solid rgba(16, 185, 129, 0.3)',
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
                    label="✅ DISPENSED"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(16, 185, 129, 0.2)',
                      color: '#34D399',
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

                {/* Footer */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1, borderTop: '1px solid var(--glass-border)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VerifiedIcon sx={{ fontSize: 13, color: '#2e7d32' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Verified Prescriber
                    </Typography>
                  </Box>
                  {rx.dispensedAt && (
                    <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 700 }}>
                      Fulfilled: {new Date(rx.dispensedAt).toLocaleDateString()}
                    </Typography>
                  )}
                  <ChevronRightIcon sx={{ color: '#34D399' }} />
                </Box>
              </CardContent>
            </Card>
          ))}
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
