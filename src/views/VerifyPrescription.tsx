'use client';
import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { prescriptionsAPI, getApiBaseUrl } from '../services/api';
import { Prescription } from '../types/prescription';
import {
  Container,
  Paper,
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Stack,
  TextField
} from '@mui/material';
import {
  VerifiedUser as VerifiedIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  Medication as MedIcon,
  Science as ScienceIcon,
  RestaurantMenu as DietIcon,
  Download as DownloadIcon,
  Login as LoginIcon,
  Dashboard as DashboardIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  Fingerprint as FingerprintIcon,
  MedicalServices as MedicalServicesIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Autorenew as AutorenewIcon
} from '@mui/icons-material';

import { extractCleanPrescriptionId, verifyPrescriptionBirthYear } from '../services/prescriptions';

const VerifyPrescription = () => {
  const { id: routeId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { isAuthenticated, user } = authState;

  const [prescription, setPrescription] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Extract ID from query parameter (?rxId=..., ?id=..., ?code=...) or route params
  const extractId = () => {
    const searchParams = new URLSearchParams(location.search);
    let target = routeId || searchParams.get('rxId') || searchParams.get('id') || searchParams.get('code') || searchParams.get('scan') || searchParams.get('verify') || '';
    if (!target && location.pathname.includes('/verify-prescription/')) {
      target = location.pathname.split('/verify-prescription/')[1] || '';
    }
    return extractCleanPrescriptionId(target);
  };

  const prescriptionId = extractId();

  // If logged-in user is a Pharmacist, automatically route to Pharmacist Portal with pre-filled dispense modal
  useEffect(() => {
    if (isAuthenticated && user?.role === 'pharmacist' && prescriptionId) {
      navigate(`/dashboard?rxId=${encodeURIComponent(prescriptionId)}`, { replace: true });
    }
  }, [isAuthenticated, user?.role, prescriptionId, navigate]);

  useEffect(() => {
    if (!prescriptionId) {
      setError('No prescription ID provided for verification.');
      setLoading(false);
      return;
    }

    const fetchVerificationData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch public verification details
        const response = await fetch(`${getApiBaseUrl()}/prescriptions/public/${encodeURIComponent(prescriptionId)}`);
        if (!response.ok) {
          // Fallback to lookup route
          const lookupRes = await fetch(`${getApiBaseUrl()}/prescriptions/lookup/${encodeURIComponent(prescriptionId)}`);
          if (lookupRes.ok) {
            const lookupData = await lookupRes.json();
            setPrescription(lookupData.prescription || lookupData);
            setLoading(false);
            return;
          }
          throw new Error('Prescription not found or invalid QR code.');
        }

        const data = await response.json();
        setPrescription(data);
      } catch (err: any) {
        console.error('Error verifying prescription:', err);
        setError(err.message || 'Unable to verify prescription.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationData();
  }, [prescriptionId]);

  // Doctor Birth Year Verification State
  const [birthYearInput, setBirthYearInput] = useState('');
  const [verifyingBirthYear, setVerifyingBirthYear] = useState(false);
  const [verifyingAction, setVerifyingAction] = useState<'view' | 'continue_trail' | null>(null);
  const [birthYearError, setBirthYearError] = useState<string | null>(null);
  const [birthYearSuccess, setBirthYearSuccess] = useState<string | null>(null);

  const handleVerifyBirthYear = async (action: 'view' | 'continue_trail' = 'view', e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanYear = birthYearInput.trim();
    const yearNum = parseInt(cleanYear, 10);
    const currentYear = new Date().getFullYear();

    if (!cleanYear || isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      setBirthYearError(`Please enter a valid 4-digit birth year between 1900 and ${currentYear}.`);
      return;
    }

    try {
      setVerifyingBirthYear(true);
      setVerifyingAction(action);
      setBirthYearError(null);
      const res = await verifyPrescriptionBirthYear(prescription.id || prescriptionId, yearNum);
      if (res.success && res.prescription) {
        setPrescription({ ...res.prescription, isUnlocked: true });
        setBirthYearSuccess('✅ Verified! Full clinical record unlocked and patient linked to your practice.');
        if (action === 'continue_trail') {
          setTimeout(() => {
            navigate(`/prescriptions/new?trailRxId=${res.prescription.id || prescriptionId}&patientId=${res.prescription.patientId || prescription.patientId || ''}`);
          }, 600);
        }
      } else {
        setBirthYearError(res.message || 'Incorrect birth year. Verification failed.');
      }
    } catch (err: any) {
      console.error('Birth year verification error:', err);
      setBirthYearError(err.response?.data?.message || err.message || 'Incorrect birth year. Please confirm with the patient.');
    } finally {
      setVerifyingBirthYear(false);
      setVerifyingAction(null);
    }
  };

  const handleContinueTreatmentTrail = () => {
    navigate(`/prescriptions/new?trailRxId=${prescription.id || prescriptionId}&patientId=${prescription.patientId || ''}`);
  };

  const isDoctorGated = user?.role === 'doctor' && prescription.doctorId !== user.id && !prescription.isUnlocked;

  const handleDownloadPdf = async () => {
    if (!prescriptionId) return;
    try {
      setDownloading(true);
      const blob = await prescriptionsAPI.downloadPrescription(prescriptionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Prescription_${prescriptionId.substring(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      window.open(`${getApiBaseUrl()}/prescriptions/public/${prescriptionId}/download`, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const handleGoToDashboard = () => {
    if (user?.role === 'pharmacist') {
      navigate(`/dashboard?rxId=${prescriptionId}`);
    } else {
      navigate(`/dashboard?verify=${prescriptionId}`);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} sx={{ color: '#008080', mb: 3 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A365D', mb: 1 }}>
          Verifying Prescription Authenticity...
        </Typography>
        <Typography variant="body2" sx={{ color: '#718096' }}>
          Connecting to Medizo Life verified health records
        </Typography>
      </Container>
    );
  }

  if (error || !prescription) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, textAlign: 'center', border: '1px solid #E2E8F0' }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error || 'Prescription could not be verified.'}
          </Alert>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#2D3748' }}>
            Verification Unsuccessful
          </Typography>
          <Typography variant="body2" sx={{ color: '#718096', mb: 4, maxWidth: 500, mx: 'auto' }}>
            The prescription ID or QR code you scanned does not match an active record on Medizo Life. Please check the ID or contact your healthcare provider.
          </Typography>
          <Button
            variant="contained"
            component={RouterLink}
            to="/login"
            startIcon={<LoginIcon />}
            sx={{
              bgcolor: '#008080',
              '&:hover': { bgcolor: '#006666' },
              borderRadius: 2,
              px: 4,
              py: 1.2,
              fontWeight: 600
            }}
          >
            Go to Login / Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  const meds = Array.isArray(prescription.medications) ? prescription.medications : [];
  const invs = Array.isArray(prescription.investigations) ? prescription.investigations : [];
  const diet = Array.isArray(prescription.dietModifications) ? prescription.dietModifications : [];
  const lifestyle = Array.isArray(prescription.lifestyleChanges) ? prescription.lifestyleChanges : [];
  const warnings = Array.isArray(prescription.warningSigns) ? prescription.warningSigns : [];

  const hasAnyMedInstr = meds.some((m: any) => m.instructions && m.instructions !== '-' || m.timing || m.mealRelation);
  const hasAnyInvInstr = invs.some((i: any) => i.specialInstructions && i.specialInstructions !== '-' && i.specialInstructions.toLowerCase() !== 'none');

  return (
    <Container maxWidth="md" sx={{ py: 4, pb: 8 }}>
      {/* Verification Top Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #008080 0%, #0A2540 100%)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          boxShadow: '0 4px 20px rgba(0,128,128,0.2)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.3)',
              flexShrink: 0
            }}
          >
            <VerifiedIcon sx={{ fontSize: 32, color: '#38A169' }} />
          </Box>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Digitally Verified Prescription
              </Typography>
              <Chip
                label="AUTHENTIC"
                size="small"
                sx={{
                  bgcolor: '#38A169',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  height: 22
                }}
              />
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
              Prescription ID: <strong>{prescription.id || prescriptionId}</strong>
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}>
          {isAuthenticated && user?.role === 'doctor' && !isDoctorGated && (
            <Button
              variant="contained"
              onClick={handleContinueTreatmentTrail}
              startIcon={<AutorenewIcon />}
              sx={{
                background: 'linear-gradient(135deg, #00C896 0%, #009E77 100%)',
                color: '#0B1315',
                fontWeight: 900,
                fontSize: '0.85rem',
                borderRadius: 2,
                px: 2.5,
                py: 1,
                boxShadow: '0 4px 14px rgba(0, 200, 150, 0.4)',
                '&:hover': { background: 'linear-gradient(135deg, #00b084 0%, #008f6c 100%)' },
                flex: { xs: 1, sm: 'initial' }
              }}
            >
              Continue Treatment Trail
            </Button>
          )}

          <Button
            variant="contained"
            onClick={handleDownloadPdf}
            disabled={downloading}
            startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#008080',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderRadius: 2,
              px: 2.5,
              py: 1,
              '&:hover': { bgcolor: '#F0FDFA' },
              flex: { xs: 1, sm: 'initial' }
            }}
          >
            Download PDF
          </Button>

          {isAuthenticated ? (
            <Button
              variant="outlined"
              onClick={handleGoToDashboard}
              startIcon={<DashboardIcon />}
              sx={{
                color: '#FFFFFF',
                borderColor: 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                fontSize: '0.85rem',
                borderRadius: 2,
                px: 2.5,
                py: 1,
                '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' },
                flex: { xs: 1, sm: 'initial' }
              }}
            >
              Open in Dashboard
            </Button>
          ) : (
            <Button
              variant="outlined"
              component={RouterLink}
              to={`/login?redirect=${encodeURIComponent(`/verify-prescription?id=${prescriptionId}`)}`}
              startIcon={<LoginIcon />}
              sx={{
                color: '#FFFFFF',
                borderColor: 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                fontSize: '0.85rem',
                borderRadius: 2,
                px: 2.5,
                py: 1,
                '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' },
                flex: { xs: 1, sm: 'initial' }
              }}
            >
              Login to Save
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Main Prescription Card */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF'
        }}
      >
        {/* Doctor & Clinic Header */}
        <Box sx={{ p: { xs: 2.5, sm: 3.5 }, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0A2540', mb: 0.5 }}>
                {prescription.doctorName || 'Attending Physician'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#008080', fontWeight: 600, mb: 0.5 }}>
                {prescription.doctorSpecialization || 'General Physician'}
                {prescription.doctorLicenseNumber && ` • Reg: ${prescription.doctorLicenseNumber}`}
              </Typography>
              <Typography variant="body2" sx={{ color: '#718096' }}>
                {prescription.doctorClinicName || prescription.clinicName || 'Medizo Healthcare'}
                {prescription.doctorAddress && ` • ${prescription.doctorAddress}`}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="caption" sx={{ color: '#718096', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                Issued Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#2D3748' }}>
                {prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#718096' }}>
                {prescription.createdAt ? new Date(prescription.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Patient Details Card */}
        <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#008080', mb: 2, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" /> Patient Information
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Patient Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#2D3748' }}>{prescription.patientName || 'Patient'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Gender / Age</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                  {prescription.patientGender ? prescription.patientGender.toUpperCase() : 'N/A'}
                  {prescription.patientDOB && ` (${new Date().getFullYear() - new Date(prescription.patientDOB).getFullYear()} yrs)`}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Blood Type</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>{prescription.bloodType || 'O+'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600 }}>Status</Typography>
                <Box sx={{ mt: 0.2 }}>
                  <Chip
                    label={prescription.dispensedStatus === 'dispensed' ? 'Dispensed' : 'Active'}
                    size="small"
                    color={prescription.dispensedStatus === 'dispensed' ? 'success' : 'primary'}
                    sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Diagnosis (Only visible if not gated or already verified) */}
          {!isDoctorGated && (prescription.diagnosis || (prescription.provisionalDiagnosis && prescription.provisionalDiagnosis.length > 0)) ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#008080', mb: 1, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Diagnosis & Clinical Findings
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                  {prescription.diagnosis || (Array.isArray(prescription.provisionalDiagnosis) ? prescription.provisionalDiagnosis.join(', ') : prescription.provisionalDiagnosis)}
                </Typography>
              </Paper>
            </Box>
          ) : null}

          {/* Prescribed Medications (Names & Types always visible for pharmacy / safety check) */}
          {meds.length > 0 ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#008080', mb: 1.5, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedIcon fontSize="small" /> Prescribed Medications
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#E6F4F1' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: '#2D3748', width: 40 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#2D3748' }}>Medicine Name</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#2D3748', textAlign: 'center' }}>Dosage</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#2D3748', textAlign: 'center' }}>Duration</TableCell>
                      {hasAnyMedInstr && !isDoctorGated && <TableCell sx={{ fontWeight: 800, color: '#2D3748' }}>Instructions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {meds.map((m: any, idx: number) => {
                      const instrParts: string[] = [];
                      if (m.timing && m.timing !== '-') instrParts.push(m.timing);
                      if (m.mealRelation && m.mealRelation !== '-') instrParts.push(m.mealRelation);
                      if (m.instructions && m.instructions !== '-') instrParts.push(m.instructions);
                      const instrStr = instrParts.length > 0 ? instrParts.join(' • ') : 'As directed';

                      return (
                        <TableRow key={idx} sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                          <TableCell sx={{ fontWeight: 600, color: '#718096' }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#2D3748' }}>
                            {m.name || m.medicineName || 'Medication'}
                            {m.type && <Chip label={m.type} size="small" sx={{ ml: 1, height: 18, fontSize: '0.65rem', bgcolor: 'rgba(0,128,128,0.1)', color: '#008080', fontWeight: 700 }} />}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: '#2D3748' }}>{m.dosage || 'Standard'}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: '#2D3748' }}>{m.duration || '-'}</TableCell>
                          {hasAnyMedInstr && !isDoctorGated && <TableCell sx={{ color: '#4A5568' }}>{instrStr}</TableCell>}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}

          {/* Doctor Birth Year Verification Gate Card */}
          {isDoctorGated && (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                my: 3,
                borderRadius: 3,
                bgcolor: '#F0FDFA',
                borderColor: '#008080',
                borderWidth: 2,
                borderStyle: 'dashed',
                textAlign: 'center'
              }}
            >
              <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(0,128,128,0.12)', color: '#008080', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                <LockIcon sx={{ fontSize: 26 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0A2540', mb: 0.5 }}>
                Full Clinical Details & Diagnosis Locked
              </Typography>
              <Typography variant="body2" sx={{ color: '#4A5568', mb: 2.5, maxWidth: 500, mx: 'auto' }}>
                For patient confidentiality, full clinical diagnosis, lab investigations, and physician notes are protected. Enter the patient's <strong>Birth Year (YYYY)</strong> to unlock the complete medical record and link this patient to your practice.
              </Typography>

              <Box component="form" onSubmit={(e) => handleVerifyBirthYear('view', e)} sx={{ maxWidth: 360, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  placeholder="Birth Year (e.g. 1995)"
                  value={birthYearInput}
                  onChange={(e) => setBirthYearInput(e.target.value.slice(0, 4))}
                  inputProps={{ maxLength: 4, min: 1900, max: new Date().getFullYear() }}
                  InputProps={{
                    sx: { borderRadius: 2, bgcolor: '#FFFFFF', fontWeight: 800, fontSize: '1.1rem', textAlign: 'center', letterSpacing: '2px' }
                  }}
                  disabled={verifyingBirthYear}
                />
                {birthYearError && (
                  <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.85rem', fontWeight: 600 }}>
                    {birthYearError}
                  </Alert>
                )}
                {birthYearSuccess && (
                  <Alert severity="success" sx={{ borderRadius: 2, fontSize: '0.85rem', fontWeight: 600 }}>
                    {birthYearSuccess}
                  </Alert>
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    type="button"
                    onClick={(e) => handleVerifyBirthYear('view', e)}
                    disabled={verifyingBirthYear || birthYearInput.length !== 4}
                    startIcon={verifyingBirthYear && verifyingAction === 'view' ? <CircularProgress size={16} color="inherit" /> : <LockOpenIcon />}
                    sx={{
                      flex: 1,
                      borderColor: '#008080',
                      color: '#008080',
                      fontWeight: 800,
                      py: 1.1,
                      borderRadius: 2,
                      '&:hover': { bgcolor: 'rgba(0, 128, 128, 0.08)' }
                    }}
                  >
                    {verifyingBirthYear && verifyingAction === 'view' ? 'Verifying...' : 'Unlock & View'}
                  </Button>
                  <Button
                    variant="contained"
                    type="button"
                    onClick={(e) => handleVerifyBirthYear('continue_trail', e)}
                    disabled={verifyingBirthYear || birthYearInput.length !== 4}
                    startIcon={verifyingBirthYear && verifyingAction === 'continue_trail' ? <CircularProgress size={18} color="inherit" /> : <AutorenewIcon />}
                    sx={{
                      flex: 1.2,
                      background: 'linear-gradient(135deg, #00C896 0%, #009E77 100%)',
                      color: '#0B1315',
                      fontWeight: 900,
                      py: 1.1,
                      borderRadius: 2,
                      boxShadow: '0 4px 14px rgba(0, 200, 150, 0.3)',
                      '&:hover': { background: 'linear-gradient(135deg, #00b084 0%, #008f6c 100%)' }
                    }}
                  >
                    {verifyingBirthYear && verifyingAction === 'continue_trail' ? 'Verifying...' : 'Continue Trail'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Diagnostic Tests (Only if not gated) */}
          {!isDoctorGated && invs.length > 0 ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#008080', mb: 1.5, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScienceIcon fontSize="small" /> Required Investigations
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#E6F4F1' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: '#2D3748', width: 40 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#2D3748' }}>Test / Investigation</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#2D3748', textAlign: 'center' }}>Priority & Fasting</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#2D3748' }}>Clinical Reason</TableCell>
                      {hasAnyInvInstr && <TableCell sx={{ fontWeight: 800, color: '#2D3748' }}>Special Instructions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invs.map((inv: any, idx: number) => {
                      const testName = typeof inv === 'string' ? inv : (inv.testName || 'Test');
                      const condParts: string[] = [];
                      if (inv.priority) condParts.push(`Priority: ${String(inv.priority).toUpperCase()}`);
                      if (inv.fasting) condParts.push(`Fasting: ${inv.fasting}`);
                      const condStr = condParts.length > 0 ? condParts.join(' • ') : 'Routine';

                      return (
                        <TableRow key={idx} sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                          <TableCell sx={{ fontWeight: 600, color: '#718096' }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#2D3748' }}>{testName}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: inv.priority === 'urgent' ? '#C53030' : '#2D3748' }}>
                            {condStr}
                          </TableCell>
                          <TableCell sx={{ color: '#4A5568' }}>{inv.reason || '-'}</TableCell>
                          {hasAnyInvInstr && (
                            <TableCell sx={{ color: '#4A5568' }}>{inv.specialInstructions || '-'}</TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}

          {/* Recommendations & Lifestyle (Only if not gated) */}
          {!isDoctorGated && (diet.length > 0 || lifestyle.length > 0 || warnings.length > 0) ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#008080', mb: 1.5, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
                <DietIcon fontSize="small" /> Advice & Recommendations
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <Stack spacing={1.5}>
                  {diet.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#008080', textTransform: 'uppercase' }}>
                        Diet Modifications:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2D3748', mt: 0.2 }}>
                        {diet.join(', ')}
                      </Typography>
                    </Box>
                  )}
                  {lifestyle.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#008080', textTransform: 'uppercase' }}>
                        Lifestyle Guidance:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2D3748', mt: 0.2 }}>
                        {lifestyle.join(', ')}
                      </Typography>
                    </Box>
                  )}
                  {warnings.length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#C53030', textTransform: 'uppercase' }}>
                        Emergency Warning Signs:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#C53030', fontWeight: 600, mt: 0.2 }}>
                        {warnings.join(', ')}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Box>
          ) : null}

          {/* Digital Signature & Verification Seal Footer */}
          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FingerprintIcon sx={{ color: '#008080', fontSize: 32 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontWeight: 700 }}>
                  SECURE DIGITAL PRESCRIPTION
                </Typography>
                <Typography variant="caption" sx={{ color: '#008080', fontWeight: 600 }}>
                  Verified via Medizo Cloud Healthcare Network
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              {prescription.doctorSignature && (
                <Box
                  component="img"
                  src={prescription.doctorSignature}
                  alt="Doctor Signature"
                  sx={{ maxHeight: 44, maxWidth: 140, objectFit: 'contain', mb: 0.5 }}
                />
              )}
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#2D3748' }}>
                {prescription.doctorName || 'Attending Physician'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#718096' }}>
                Authorized Medical Signature
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default VerifyPrescription;
