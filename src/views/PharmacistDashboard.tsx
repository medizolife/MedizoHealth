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
  ChevronRight as ChevronRightIcon,
  CameraAlt as CameraIcon,
  ContentPasteSearch as PasteIcon,
  LocalHospital as HospitalIcon,
  Verified as VerifiedIcon,
  ImageSearch as ImageSearchIcon
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
  const isDark = mode === 'dark';

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

  // Dedicated Prescription ID / URL validation
  const handleIdValidation = async (rawInput: string) => {
    let id = rawInput.trim();
    if (!id) return;

    if (id.startsWith('{') && id.endsWith('}')) {
      try {
        const parsed = JSON.parse(id);
        id = parsed.id || parsed.prescriptionId || parsed._id || id;
      } catch (e) {}
    }

    if (id.includes('?id=')) {
      const match = id.match(/[?&]id=([^&]+)/);
      if (match && match[1]) id = match[1];
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
    const q = search.toLowerCase().trim();
    const cleanDigits = q.replace(/[^\d]/g, '');

    const pMobile = String((p as any).patientMobile || (p as any).patientPhone || (p as any).contactNumber || (p as any).mobile || '');
    const pMobileDigits = pMobile.replace(/[^\d]/g, '');
    const mobileMatch = (pMobile && pMobile.toLowerCase().includes(q)) || (cleanDigits.length >= 3 && pMobileDigits.includes(cleanDigits));

    return (
      mobileMatch ||
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

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3, md: 4 }, pb: 14, fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
      {/* Header Profile Glass Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: '28px',
          bgcolor: isDark ? 'rgba(17, 29, 26, 0.85)' : 'rgba(255, 255, 255, 0.92)',
          border: isDark ? '1px solid rgba(102, 205, 170, 0.3)' : '1px solid rgba(18, 48, 41, 0.1)',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: isDark ? '0 16px 36px rgba(0, 0, 0, 0.4)' : '0 12px 32px rgba(18, 48, 41, 0.08)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 58,
                height: 58,
                background: 'linear-gradient(135deg, #0D9488 0%, #028090 100%)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '1.5rem',
                boxShadow: '0 6px 20px rgba(13, 148, 136, 0.4)'
              }}
            >
              💊
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#123029', fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', lineHeight: 1.2 }}>
                {user?.firstName ? `Pharm. ${user.firstName} ${user.lastName}` : 'Pharmacy Portal'}
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#2DD4BF' : '#0F766E', fontWeight: 800, mt: 0.2 }}>
                {user?.pharmacyName || 'Medizo Care Pharmacy'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.8, mt: 0.8, flexWrap: 'wrap' }}>
                <Chip
                  label="Pharmacist Account"
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 900, bgcolor: '#0D9488', color: '#ffffff' }}
                />
                <Chip
                  label={`Lic#: ${user?.licenseNumber || 'PHARM-88219'}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800, bgcolor: isDark ? 'rgba(13, 148, 136, 0.2)' : '#E6FFFA', color: isDark ? '#2DD4BF' : '#0F766E', border: '1px solid rgba(13, 148, 136, 0.35)' }}
                />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={fetchPrescriptionsList} sx={{ color: isDark ? '#34D399' : '#059669', bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', '&:hover': { bgcolor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#D1FAE5' } }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Metrics Cards Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
              border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #A7F3D0',
              boxShadow: isDark ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.08)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669', fontFamily: "'Outfit', sans-serif" }}>
              {fulfilledToday}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#A7F3D0' : '#047857', display: 'block', fontSize: '0.7rem', mt: 0.2 }}>
              Fulfilled Today
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(13, 148, 136, 0.15)' : '#E6FFFA',
              border: isDark ? '1px solid rgba(13, 148, 136, 0.35)' : '1px solid #99F6E4',
              boxShadow: isDark ? 'none' : '0 4px 14px rgba(13, 148, 136, 0.12)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0F766E', fontFamily: "'Outfit', sans-serif" }}>
              {totalDispensed}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#2DD4BF' : '#0F766E', display: 'block', fontSize: '0.7rem', mt: 0.2 }}>
              Total Dispensed
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              textAlign: 'center',
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(13, 148, 136, 0.12)' : '#E6FFFA',
              border: isDark ? '1px solid rgba(13, 148, 136, 0.3)' : '1px solid #99F6E4',
              boxShadow: isDark ? 'none' : '0 4px 14px rgba(13, 148, 136, 0.08)'
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0F766E', fontFamily: "'Outfit', sans-serif" }}>
              {uniquePatients}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#2DD4BF' : '#0F766E', display: 'block', fontSize: '0.7rem', mt: 0.2 }}>
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
          borderRadius: '28px',
          bgcolor: isDark ? 'rgba(17, 29, 26, 0.9)' : '#FFFFFF',
          border: '2px solid #0D9488',
          boxShadow: isDark
            ? '0 16px 40px rgba(0,0,0,0.5), 0 0 24px rgba(13, 148, 136, 0.25)'
            : '0 16px 36px rgba(13, 148, 136, 0.15)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{
            width: 42,
            height: 42,
            borderRadius: '14px',
            bgcolor: 'rgba(13, 148, 136, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center'
          }}>
            <PharmacyIcon sx={{ color: isDark ? '#2DD4BF' : '#0F766E', fontSize: 26 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#123029', fontFamily: "'Outfit', sans-serif" }}>
            Dispense & Verification Station
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: isDark ? '#9CA3AF' : '#64748B', display: 'block', mb: 3, fontWeight: 600 }}>
          Verify digital signatures and dispense medications using live camera QR scanner or dedicated Rx ID entry.
        </Typography>

        {/* Action Buttons Grid */}
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
                borderRadius: '18px',
                fontWeight: 900,
                fontSize: '0.95rem',
                fontFamily: "'Outfit', sans-serif",
                background: 'linear-gradient(135deg, #0D9488 0%, #028090 100%)',
                color: '#FFFFFF',
                boxShadow: '0 6px 20px rgba(13, 148, 136, 0.4)',
                '&:hover': { background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', transform: 'translateY(-1px)' },
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
                borderRadius: '18px',
                fontWeight: 900,
                fontSize: '0.95rem',
                fontFamily: "'Outfit', sans-serif",
                borderColor: '#0D9488',
                color: isDark ? '#2DD4BF' : '#0F766E',
                bgcolor: isDark ? 'rgba(13, 148, 136, 0.12)' : '#E6FFFA',
                '&:hover': { borderColor: '#14B8A6', bgcolor: isDark ? 'rgba(13, 148, 136, 0.22)' : '#CCFBF1' },
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
                  e.target.value = '';

                  setSnackbar({ open: true, message: '🔍 Decoding QR from uploaded image...', severity: 'info' });

                  try {
                    const imageBitmap = await createImageBitmap(file);
                    const canvas = document.createElement('canvas');
                    canvas.width = imageBitmap.width;
                    canvas.height = imageBitmap.height;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (!ctx) throw new Error('Canvas context unavailable');
                    ctx.drawImage(imageBitmap, 0, 0);

                    let decoded: string | null = null;

                    if ('BarcodeDetector' in window) {
                      try {
                        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
                        const barcodes = await detector.detect(canvas);
                        if (barcodes && barcodes.length > 0) {
                          decoded = barcodes[0].rawValue;
                        }
                      } catch (detErr) {}
                    }

                    if (!decoded) {
                      try {
                        const jsQRModule = await import('jsqr');
                        const jsQR = jsQRModule.default || jsQRModule;
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
                        if (code && code.data) {
                          decoded = code.data;
                        }
                      } catch (jsErr) {}
                    }

                    imageBitmap.close();

                    if (decoded) {
                      setSnackbar({ open: true, message: '✅ QR code decoded from image!', severity: 'success' });
                      handleScanSuccess(decoded);
                    } else {
                      setSnackbar({ open: true, message: '❌ No QR code found in image. Try a clearer photo.', severity: 'error' });
                    }
                  } catch (err) {
                    setSnackbar({ open: true, message: '❌ Could not decode QR from image file.', severity: 'error' });
                  }
                }}
              />
            </Button>
          </Grid>
        </Grid>

        {/* Prescription ID / URL Verification Box */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: '22px',
            bgcolor: isDark ? 'rgba(0, 0, 0, 0.3)' : '#F8FAFC',
            border: isDark ? '1px solid rgba(13, 148, 136, 0.35)' : '1px solid #E2E8F0'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VerifiedIcon sx={{ color: isDark ? '#2DD4BF' : '#0F766E', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#123029' }}>
                Verify Prescription by ID / URL
              </Typography>
            </Box>
            <Chip label="Manual Entry" size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 900, bgcolor: 'rgba(13, 148, 136, 0.18)', color: isDark ? '#2DD4BF' : '#0F766E' }} />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <TextField
              fullWidth
              size="medium"
              placeholder="Paste Rx ID, Mobile Number (e.g. 9876543210), or URL..."
              value={rxIdInput}
              onChange={(e) => setRxIdInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleIdValidation(rxIdInput); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PasteIcon sx={{ color: isDark ? '#2DD4BF' : '#0F766E', fontSize: 20 }} />
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
                        sx={{ minWidth: 'auto', px: 1, py: 0.4, fontSize: '0.72rem', fontWeight: 900, color: isDark ? '#2DD4BF' : '#0F766E' }}
                      >
                        📋 Paste
                      </Button>
                    )}
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(0,0,0,0.4)' : '#FFFFFF',
                  color: isDark ? '#FAF2F5' : '#123029',
                  '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1' }
                }
              }}
            />

            <Button
              variant="contained"
              onClick={() => handleIdValidation(rxIdInput)}
              disabled={idLookupLoading || !rxIdInput.trim()}
              startIcon={idLookupLoading ? <CircularProgress size={18} color="inherit" /> : <VerifiedIcon />}
              sx={{
                px: 3.5,
                py: 1.5,
                borderRadius: '16px',
                fontWeight: 900,
                whiteSpace: 'nowrap',
                fontFamily: "'Outfit', sans-serif",
                bgcolor: '#10B981',
                color: '#ffffff',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
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
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#123029', fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem' }}>
          📜 Dispensed Prescriptions Log
        </Typography>
        <Chip
          label={`${filteredPrescriptions.length} dispensed`}
          size="small"
          sx={{ bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5', color: isDark ? '#34D399' : '#059669', fontWeight: 900 }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#0D9488' }} />
        </Box>
      ) : filteredPrescriptions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '24px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0' }}>
          <PharmacyIcon sx={{ fontSize: 48, color: '#0D9488', opacity: 0.8, mb: 1 }} />
          <Typography variant="body1" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A' }}>
            No dispensed prescriptions yet
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', display: 'block', mb: 2, fontWeight: 700 }}>
            Click 'Live Camera QR Scanner' above to verify and dispense a prescription.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CameraIcon />}
            onClick={() => setScannerOpen(true)}
            sx={{ borderRadius: '16px', fontWeight: 900, borderColor: '#0D9488', color: isDark ? '#2DD4BF' : '#0F766E', bgcolor: isDark ? 'rgba(13, 148, 136, 0.12)' : '#E6FFFA' }}
          >
            Scan QR Code
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredPrescriptions.map((rx) => (
            <Card
              key={rx.id}
              onClick={() => handleOpenDispense(rx)}
              sx={{
                borderRadius: '24px',
                bgcolor: isDark ? 'rgba(17, 29, 26, 0.85)' : '#ffffff',
                border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.04)',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: isDark ? '0 8px 24px rgba(16, 185, 129, 0.2)' : '0 8px 24px rgba(0,0,0,0.08)' }
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={`#${String(rx.id).slice(-6).toUpperCase()}`}
                      size="small"
                      sx={{ fontFamily: 'monospace', fontWeight: 900, bgcolor: 'rgba(0, 200, 150, 0.15)', color: '#00C896', fontSize: '0.75rem' }}
                    />
                    <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 700 }}>
                      {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                    <Chip
                      label={`💊 ${rx.medications ? rx.medications.length : 1} Meds Given`}
                      size="small"
                      sx={{
                        bgcolor: isDark ? 'rgba(13, 148, 136, 0.2)' : '#E6FFFA',
                        color: isDark ? '#2DD4BF' : '#0F766E',
                        fontWeight: 900,
                        fontSize: '0.68rem',
                        border: '1px solid #0D9488'
                      }}
                    />
                    <Chip
                      label="✅ DISPENSED"
                      size="small"
                      sx={{
                        bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                        color: isDark ? '#34D399' : '#059669',
                        fontWeight: 900,
                        fontSize: '0.68rem',
                        border: '1px solid #10B981'
                      }}
                    />
                  </Box>
                </Box>

                {/* Patient & Doctor Names */}
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#123029', lineHeight: 1.3, fontSize: '1.05rem', fontFamily: "'Outfit', sans-serif" }}>
                  👤 {(rx as any).patientName || 'Patient'}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#2DD4BF' : '#0F766E', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                  <HospitalIcon sx={{ fontSize: 13 }} /> {(() => {
                    const raw = (rx as any).doctorName || 'Prescribing Doctor';
                    const cleaned = raw.trim().replace(/^(Dr\.?\s*)+/i, 'Dr. ');
                    return cleaned.startsWith('Dr. ') ? cleaned : `Dr. ${cleaned}`;
                  })()}
                </Typography>

                {/* Medications Summary */}
                <Typography variant="body2" sx={{ color: isDark ? '#2DD4BF' : '#0F766E', fontWeight: 800, mt: 0.8 }}>
                  💊 {rx.medications && rx.medications.length > 0
                    ? rx.medications.map(m => m.name).join(', ')
                    : rx.medication || 'No medication details'}
                </Typography>

                {/* Footer */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.2, borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VerifiedIcon sx={{ fontSize: 14, color: '#10B981' }} />
                    <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 700 }}>
                      Verified Prescriber
                    </Typography>
                  </Box>
                  {rx.dispensedAt && (
                    <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 800 }}>
                      Fulfilled: {new Date(rx.dispensedAt).toLocaleDateString()}
                    </Typography>
                  )}
                  <ChevronRightIcon sx={{ color: isDark ? '#34D399' : '#059669' }} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Floating QR Scan FAB Button */}
      <Fab
        onClick={() => setScannerOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 90,
          right: 20,
          background: 'linear-gradient(135deg, #0D9488 0%, #028090 100%)',
          color: '#FFFFFF',
          boxShadow: '0 8px 28px rgba(13, 148, 136, 0.45)',
          '&:hover': { background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', transform: 'scale(1.08)' },
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1200
        }}
      >
        <QrIcon sx={{ fontSize: 30 }} />
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
          sx={{ borderRadius: '16px', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
