'use client';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  LocalPharmacy as PharmacyIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
  Person as PersonIcon,
  ChevronRight as ChevronRightIcon,
  MedicalServices as MedicalIcon,
  CalendarToday as CalendarIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getPrescriptions } from '../services/prescriptions';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Prescription } from '../types/prescription';
import DigiLockerGuard from '../components/DigiLockerGuard';
import DispenseHistoryModal from '../components/DispenseHistoryModal';

interface Stats {
  total: number;
  active: number;
  completed: number;
  uniquePatients: number;
}

export default function DoctorPrescriptions() {
  const navigate = useNavigate();
  const { mode } = useThemeContext();
  const { authState } = useAuth();
  const { user } = authState;
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<Stats | null>(null);
  const [historyModalPrescription, setHistoryModalPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchPrescriptions();
    const timer = setTimeout(() => fetchPrescriptions(true), 150);
    return () => clearTimeout(timer);
  }, [statusFilter]);

  const fetchPrescriptions = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) setLoading(true);
      setError(null);
      
      const data = await getPrescriptions(isBackgroundRefresh);
      let prescriptionList: Prescription[] = Array.isArray(data) ? data : [];
      
      if (statusFilter !== 'all') {
        prescriptionList = prescriptionList.filter(p => p.status === statusFilter);
      }
      
      setPrescriptions(prescriptionList);
      calculateStats(prescriptionList);
    } catch (err: any) {
      console.error('Error fetching prescriptions:', err);
      if (!isBackgroundRefresh) {
        setError(err.response?.data?.message || 'Failed to load prescriptions');
      }
    } finally {
      if (!isBackgroundRefresh) setLoading(false);
    }
  };

  const calculateStats = (data: Prescription[]) => {
    const total = data.length;
    const active = data.filter(p => p.status === 'active').length;
    const completed = data.filter(p => p.status === 'completed').length;
    const uniquePatients = new Set(data.map(p => p.patientId)).size;

    setStats({ total, active, completed, uniquePatients });
  };

  const handleDownloadPDF = async (prescriptionId: string) => {
    try {
      let response;
      try {
        response = await api.get(`/prescriptions/${prescriptionId}/download`, {
          responseType: 'blob'
        });
      } catch (e) {
        response = await api.get(`/prescriptions/${prescriptionId}/pdf`, {
          responseType: 'blob'
        });
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription_${prescriptionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please check server connection.');
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (!searchQuery || !searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const cleanDigits = query.replace(/[^\d]/g, '');

    const patientName = (p.patientName || '').toLowerCase();
    const patientEmail = ((p as any).patientEmail || '').toLowerCase();
    const patientMobile = String(p.patientMobile || (p as any).patientPhone || (p as any).contactNumber || (p as any).mobile || '').toLowerCase();
    const mobileDigits = patientMobile.replace(/[^\d]/g, '');
    const mobileMatch = patientMobile.includes(query) || (cleanDigits.length >= 3 && mobileDigits.includes(cleanDigits));

    const diagnosis = ((p as any).diagnosis || (Array.isArray(p.provisionalDiagnosis) ? p.provisionalDiagnosis.join(' ') : '')).toLowerCase();
    const notes = (p.notes || '').toLowerCase();
    const medMatch = Array.isArray(p.medications) && p.medications.some(m => (m?.name || '').toLowerCase().includes(query));
    
    return (
      patientName.includes(query) ||
      patientEmail.includes(query) ||
      mobileMatch ||
      diagnosis.includes(query) ||
      notes.includes(query) ||
      medMatch
    );
  });

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Chip
            icon={<HourglassIcon sx={{ fontSize: 14 }} />}
            label="Active Rx"
            size="small"
            sx={{ bgcolor: 'rgba(137, 215, 183, 0.2)', color: '#428475', fontWeight: 800, border: '1px solid #89D7B7' }}
          />
        );
      case 'completed':
        return (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
            label="Completed"
            size="small"
            sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', fontWeight: 800, border: '1px solid #60a5fa' }}
          />
        );
      default:
        return <Chip label={status} size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (user?.role === 'doctor' && !user?.digilockerVerified) {
    return <DigiLockerGuard title="Prescription Portal Locked" message="You must verify your identity via DigiLocker before opening the doctor prescription portal." />;
  }

  return (
    <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3 }, pb: 6, px: { xs: 2, sm: 3, md: 4 } }} className="animate-slide-up">
      
      {/* Hero Title & Create New Action Header */}
      <Paper 
        className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'}
        sx={{ 
          p: { xs: 2.5, sm: 3 }, 
          mb: 3,
          background: mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(23, 42, 38, 0.95) 0%, rgba(14, 28, 24, 0.98) 100%) !important' 
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(242, 248, 246, 0.96) 100%) !important',
          border: mode === 'dark' ? '1px solid rgba(102, 205, 170, 0.35)' : '1px solid rgba(102, 205, 170, 0.45)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#123029', letterSpacing: '-0.02em', mb: 0.5 }}>
            Prescription Management 💊
          </Typography>
          <Typography variant="caption" sx={{ color: mode === 'dark' ? '#80E5C2' : '#2A6B5D', fontWeight: 700, letterSpacing: 0.5 }}>
            Issued digital medical prescriptions & patient records
          </Typography>
        </Box>

        {user?.role === 'doctor' && (
          <Button
            variant="contained"
            onClick={() => navigate('/prescriptions/new')}
            startIcon={<PharmacyIcon />}
            sx={{
              borderRadius: '20px',
              fontWeight: 800,
              px: 3,
              py: 1,
              bgcolor: mode === 'dark' ? '#66CDAA' : '#2A6B5D',
              color: mode === 'dark' ? '#123029' : '#FFFFFF',
              boxShadow: '0 6px 20px rgba(42, 107, 93, 0.25)',
              '&:hover': { bgcolor: mode === 'dark' ? '#80E5C2' : '#1E4D43', transform: 'translateY(-2px)' },
              transition: 'all 0.2s ease'
            }}
          >
            Create New Prescription
          </Button>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }}>
          {error}
        </Alert>
      )}

      {/* Metrics & Statistics Cards */}
      {stats && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <Paper className="glass-card" sx={{ p: 2, borderRadius: '20px !important', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#428475', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                Total Prescriptions
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }}>
                {stats.total}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper className="glass-card" sx={{ p: 2, borderRadius: '20px !important', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#428475', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                Active Rx
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#428475' }}>
                {stats.active}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper className="glass-card" sx={{ p: 2, borderRadius: '20px !important', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#428475', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                Completed
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#2563eb' }}>
                {stats.completed}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper className="glass-card" sx={{ p: 2, borderRadius: '20px !important', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#428475', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                Unique Patients
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }}>
                {stats.uniquePatients}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Search & Filter Toolbar */}
      <Paper className="glass-panel" sx={{ p: 2, mb: 3, borderRadius: '20px !important' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={7}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search patient name, mobile number, diagnosis, or medication..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: mode === 'dark' ? '#66CDAA' : '#428475' }} />
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: '16px', 
                  bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.85)', 
                  fontWeight: 600,
                  '& .MuiInputBase-input': {
                    color: mode === 'dark' ? '#ffffff !important' : 'inherit',
                    WebkitTextFillColor: mode === 'dark' ? '#ffffff !important' : 'inherit',
                  },
                  '& input::placeholder': {
                    color: mode === 'dark' ? '#ffffff !important' : 'inherit',
                    opacity: mode === 'dark' ? '0.9 !important' : 0.7,
                    WebkitTextFillColor: mode === 'dark' ? '#ffffff !important' : 'inherit',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: mode === 'dark' ? '#ffffff !important' : 'inherit',
                    opacity: mode === 'dark' ? '0.9 !important' : 0.7,
                    WebkitTextFillColor: mode === 'dark' ? '#ffffff !important' : 'inherit',
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={5}>
            <Tabs
              value={statusFilter}
              onChange={(_, newValue) => setStatusFilter(newValue)}
              variant="fullWidth"
              sx={{
                minHeight: 40,
                bgcolor: 'rgba(26, 49, 44, 0.08)',
                borderRadius: '16px',
                p: 0.5,
                '& .MuiTabs-indicator': { bgcolor: '#89D7B7', height: '100%', borderRadius: '12px', zIndex: 0 },
                '& .MuiTab-root': { minHeight: 36, fontWeight: 800, fontSize: '0.75rem', zIndex: 1, textTransform: 'none', color: '#1A312C' },
                '& .Mui-selected': { color: '#1A312C !important' }
              }}
            >
              <Tab value="all" label="All" />
              <Tab value="active" label="Active" />
              <Tab value="completed" label="Completed" />
            </Tabs>
          </Grid>
        </Grid>
      </Paper>

      {/* Prescription Mobile Cards List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress sx={{ color: '#89D7B7' }} />
        </Box>
      ) : filteredPrescriptions.length === 0 ? (
        <Paper className="glass-panel" sx={{ p: 4, textAlign: 'center', borderRadius: '24px !important' }}>
          <MedicalIcon sx={{ fontSize: 48, color: '#428475', mb: 1, opacity: 0.6 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A312C' }}>
            No prescriptions found
          </Typography>
          <Typography variant="body2" sx={{ color: '#428475', mb: 2 }}>
            {user?.role === 'doctor' 
              ? 'Try searching for a different keyword or create a new prescription.' 
              : user?.role === 'pharmacist'
              ? 'No prescriptions match your search criteria. Incoming customer prescriptions will appear here.'
              : 'Your doctor will issue digital prescriptions here after your consultation.'}
          </Typography>
          {user?.role === 'doctor' && (
            <Button
              variant="contained"
              onClick={() => navigate('/prescriptions/new')}
              sx={{ borderRadius: '20px', fontWeight: 800, bgcolor: '#89D7B7', color: '#1A312C' }}
            >
              Create First Prescription
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filteredPrescriptions.map((prescription) => (
            <Grid item xs={12} sm={6} lg={4} key={prescription.id}>
              <Paper
                className="glass-card animate-slide-up"
                onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                sx={{
                  p: 2.5,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '22px !important',
                  cursor: 'pointer',
                  transition: 'all 0.25 ease-in-out',
                  border: '1px solid rgba(137, 215, 183, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 32px rgba(26, 49, 44, 0.15)',
                    borderColor: '#89D7B7'
                  }
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: 'rgba(137, 215, 183, 0.25)', color: '#428475', fontWeight: 800 }}>
                        {(prescription.patientName && prescription.patientName !== 'Unknown Patient' ? prescription.patientName : 'Patient')[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', lineHeight: 1.2 }}>
                          {prescription.patientName && prescription.patientName !== 'Unknown Patient' ? prescription.patientName : 'Patient'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#428475', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 13 }} /> {formatDate(prescription.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {(() => {
                        const historyCount = Array.isArray(prescription.dispenseHistory) && prescription.dispenseHistory.length > 0
                          ? prescription.dispenseHistory.length
                          : (prescription.dispensedAt ? 1 : 0);
                        if (historyCount === 0) return null;
                        return (
                          <Chip
                            icon={<HistoryIcon sx={{ fontSize: '13px !important', color: '#047857 !important' }} />}
                            label={`Dispensed ${historyCount}x`}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHistoryModalPrescription(prescription);
                            }}
                            sx={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              bgcolor: 'rgba(16, 185, 129, 0.15)',
                              color: '#047857',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.25)' }
                            }}
                          />
                        );
                      })()}
                      {getStatusChip(prescription.status)}
                    </Box>
                  </Box>

                  <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(26, 49, 44, 0.04)', mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                      Diagnosis / Condition
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }}>
                      {(prescription as any).diagnosis || (Array.isArray(prescription.provisionalDiagnosis) && prescription.provisionalDiagnosis.length > 0 ? prescription.provisionalDiagnosis.join(', ') : 'General Medical Consultation')}
                    </Typography>
                    
                    {prescription.medications && prescription.medications.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                        {prescription.medications.slice(0, 3).map((med: any, idx: number) => (
                          <Chip
                            key={idx}
                            label={`${med.name} — ${med.dosage}${med.duration ? ` (${med.duration})` : ''}${med.quantity ? ` | Qty: ${med.quantity}` : ''}`}
                            size="small"
                            sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(137, 215, 183, 0.18)', color: '#1A312C' }}
                          />
                        ))}
                        {prescription.medications.length > 3 && (
                          <Chip
                            label={`+${prescription.medications.length - 3} more`}
                            size="small"
                            sx={{ fontSize: '0.7rem', fontWeight: 800, bgcolor: 'rgba(0,0,0,0.06)' }}
                          />
                        )}
                      </Box>
                    )}

                    {Boolean((prescription.investigations && prescription.investigations.length > 0) || (prescription.testsRequired && prescription.testsRequired.length > 0)) && (
                      <Box sx={{ mt: 1.2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Chip
                          label={(prescription.testReports && prescription.testReports.length > 0) 
                            ? `🧪 Reports Uploaded (${prescription.testReports.length})` 
                            : '🧪 Tests Required (Pending)'}
                          size="small"
                          sx={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            bgcolor: (prescription.testReports && prescription.testReports.length > 0)
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                            color: (prescription.testReports && prescription.testReports.length > 0)
                              ? '#047857'
                              : '#b45309'
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.5 }}>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPDF(prescription.id);
                    }}
                    sx={{ color: '#428475', fontWeight: 800, fontSize: '0.75rem', '&:hover': { color: '#1A312C' } }}
                  >
                    Download PDF
                  </Button>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#428475', fontWeight: 800, fontSize: '0.75rem' }}>
                    View Details <ChevronRightIcon fontSize="small" />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dispense History Modal */}
      <DispenseHistoryModal
        open={Boolean(historyModalPrescription)}
        onClose={() => setHistoryModalPrescription(null)}
        prescription={historyModalPrescription}
      />
    </Container>
  );
}
