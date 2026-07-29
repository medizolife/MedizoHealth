'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPatients } from '../services/patients';
import { createPrescription } from '../services/prescriptions';
import { digilockerAPI } from '../services/api';
import { Patient } from '../types/auth';
import { 
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Chip,
  Card,
  CardContent,
  InputAdornment,
  Divider,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Autocomplete
} from '@mui/material';
import indianMedicines from '../data/indianMedicines.json';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  PersonSearch as PersonSearchIcon,
  CameraAlt as CameraAltIcon,
  UploadFile as UploadFileIcon,
  CheckCircle as CheckCircleIcon,
  MonitorHeart as VitalIcon,
  MedicalServices as MedicalIcon,
  Medication as MedicationIcon,
  Science as ScienceIcon,
  Restaurant as DietIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  Thermostat as TempIcon,
  Favorite as PulseIcon,
  Speed as BpIcon,
  Air as Spo2Icon,
  FitnessCenter as BmiIcon,
  Sick as PainIcon,
  LocalHospital as HospitalIcon,
  CheckCircle as SuccessIcon,
  Send as SendIcon,
  ArrowBack as BackIcon,
  Schedule as ScheduleIcon,
  PhoneInTalk as EmergencyIcon,
  PlaylistAddCheck as ListCheckIcon,
  Healing as HealingIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';
import { CreatePrescriptionData, MedicationItem, Investigation, VitalSigns, FollowUpInfo } from '../types/prescription';

const NewPrescription = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { user } = authState;
  const { mode } = useThemeContext();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [digilockerVerified, setDigilockerVerified] = useState(null as boolean | null);
  const [digilockerLoading, setDigilockerLoading] = useState(false);

  // New patient modal state
  const [newPatientDialogOpen, setNewPatientDialogOpen] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'male',
    address: ''
  });
  const [newPatientError, setNewPatientError] = useState('');

  // Add existing patient modal state
  const [addExistingPatientDialogOpen, setAddExistingPatientDialogOpen] = useState(false);
  const [lookupTabValue, setLookupTabValue] = useState(0); // 0 = Manual, 1 = Scan QR, 2 = Upload QR
  const [patientIdToLookup, setPatientIdToLookup] = useState('');
  const [lookingUpPatient, setLookingUpPatient] = useState(false);
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [scanningQR, setScanningQR] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<CreatePrescriptionData>({
    patientId: '',
    vitalSigns: {
      bloodPressure: '',
      pulse: '',
      temperature: '',
      spo2: '',
      respiratoryRate: '',
      bmi: '',
      painScale: ''
    },
    presentingComplaints: [],
    clinicalFindings: [],
    provisionalDiagnosis: [],
    currentMedications: [],
    pastSurgicalHistory: [],
    medications: [],
    medicationNotes: [],
    investigations: [],
    investigationNotes: '',
    dietModifications: [],
    lifestyleChanges: [],
    warningSigns: [],
    followUpInfo: {
      appointmentDate: '',
      appointmentTime: '',
      purpose: '',
      bringItems: []
    },
    emergencyHelpline: '',
    notes: ''
  });

  // Temp inputs for adding items
  const [newComplaint, setNewComplaint] = useState('');
  const [newFinding, setNewFinding] = useState('');
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newCurrentMed, setNewCurrentMed] = useState('');
  const [newSurgery, setNewSurgery] = useState('');
  const [newMedNote, setNewMedNote] = useState('');
  const [newDiet, setNewDiet] = useState('');
  const [newLifestyle, setNewLifestyle] = useState('');
  const [newWarning, setNewWarning] = useState('');
  const [newBringItem, setNewBringItem] = useState('');
  const [showCustomTestForm, setShowCustomTestForm] = useState(false);

  const [newMedication, setNewMedication] = useState<MedicationItem>({
    name: '',
    type: 'Tablet',
    dosage: '',
    duration: '',
    instructions: ''
  });
  const [medSearchOpen, setMedSearchOpen] = useState(false);

  // Intelligent medicine search options: Requires at least 2 characters to trigger
  const filteredMedicineOptions = React.useMemo(() => {
    const query = (newMedication.name || '').trim().toLowerCase();
    if (query.length < 2) return [];
    
    const allMeds = indianMedicines as string[];
    const startsWithMatches: string[] = [];
    const includesMatches: string[] = [];
    
    for (let i = 0; i < allMeds.length; i++) {
      const med = allMeds[i];
      const lower = med.toLowerCase();
      if (lower.startsWith(query)) {
        startsWithMatches.push(med);
        if (startsWithMatches.length >= 35) break;
      } else if (lower.includes(query)) {
        includesMatches.push(med);
      }
    }
    
    return [...startsWithMatches, ...includesMatches].slice(0, 50);
  }, [newMedication.name]);

  // New investigation form
  const [newInvestigation, setNewInvestigation] = useState<Investigation>({
    testName: '',
    reason: '',
    priority: 'Normal',
    fasting: ''
  });

  // Fetch patients on component mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients list');
      }
    };
    
    fetchPatients();
  }, []);

  // Check DigiLocker verification status
  useEffect(() => {
    digilockerAPI.getStatus()
      .then(data => setDigilockerVerified(data.verified || false))
      .catch(() => setDigilockerVerified(false));
  }, []);

  // Update selected patient when patientId changes
  useEffect(() => {
    if (formData.patientId) {
      const patient = patients.find(p => p.id === formData.patientId);
      setSelectedPatient(patient || null);
    } else {
      setSelectedPatient(null);
    }
  }, [formData.patientId, patients]);

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle vital signs changes
  const handleVitalChange = (field: keyof VitalSigns) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      vitalSigns: {
        ...formData.vitalSigns,
        [field]: e.target.value
      }
    });
  };

  // Handle follow-up info changes
  const handleFollowUpChange = (field: keyof FollowUpInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      followUpInfo: {
        ...formData.followUpInfo,
        [field]: e.target.value
      }
    });
  };

  // Generic add item to array
  const addToArray = (field: keyof CreatePrescriptionData, value: string, setter: (val: string) => void) => {
    if (value.trim()) {
      setFormData({
        ...formData,
        [field]: [...(formData[field] as string[] || []), value.trim()]
      });
      setter('');
    }
  };

  // Generic remove from array
  const removeFromArray = (field: keyof CreatePrescriptionData, index: number) => {
    const arr = formData[field] as string[];
    setFormData({
      ...formData,
      [field]: arr.filter((_, i) => i !== index)
    });
  };

  // Add medication
  const addMedication = () => {
    if (newMedication.name.trim()) {
      setFormData({
        ...formData,
        medications: [...(formData.medications || []), { ...newMedication }]
      });
      setNewMedication({ name: '', type: 'Tablet', dosage: '', duration: '', instructions: '' });
    }
  };

  // Remove medication
  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications?.filter((_, i) => i !== index)
    });
  };

  // Add investigation
  const addInvestigation = () => {
    if (newInvestigation.testName.trim()) {
      setFormData({
        ...formData,
        investigations: [...(formData.investigations || []), { ...newInvestigation }]
      });
      setNewInvestigation({ testName: '', reason: '', priority: 'Normal', fasting: '' });
    }
  };

  // Remove investigation
  const removeInvestigation = (index: number) => {
    setFormData({
      ...formData,
      investigations: formData.investigations?.filter((_, i) => i !== index)
    });
  };

  // Add bring item to follow-up
  const addBringItem = () => {
    if (newBringItem.trim()) {
      setFormData({
        ...formData,
        followUpInfo: {
          ...formData.followUpInfo,
          bringItems: [...(formData.followUpInfo?.bringItems || []), newBringItem.trim()]
        }
      });
      setNewBringItem('');
    }
  };

  // Remove bring item
  const removeBringItem = (index: number) => {
    setFormData({
      ...formData,
      followUpInfo: {
        ...formData.followUpInfo,
        bringItems: formData.followUpInfo?.bringItems?.filter((_, i) => i !== index)
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.patientId) {
      setError('Please select a patient before issuing prescription');
      return;
    }

    if (!formData.medications || formData.medications.length === 0) {
      setError('Please add at least one prescribed medication');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const prescription = await createPrescription(formData);
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate(`/prescriptions/${prescription.id}`);
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating prescription:', err);
      if (err?.response?.data?.requiresVerification) {
        setError('You must verify your identity via DigiLocker before creating prescriptions.');
        setDigilockerVerified(false);
      } else {
        setError(err?.response?.data?.message || 'Failed to create digital prescription. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ pt: { xs: 2, sm: 3 }, pb: 10, px: { xs: 1.5, sm: 3 } }} className="animate-slide-up">
      
      {/* ─── Hero Glass Header ─── */}
      <Paper 
        className="glass-card-dark"
        sx={{ 
          p: { xs: 2.5, sm: 3 }, 
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(26, 49, 44, 0.96) 0%, rgba(15, 29, 26, 0.98) 100%) !important'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box 
              sx={{ 
                p: 1.2, 
                borderRadius: '16px', 
                bgcolor: 'rgba(137, 215, 183, 0.2)', 
                color: '#89D7B7',
                border: '1px solid rgba(137, 215, 183, 0.3)',
                boxShadow: '0 0 16px rgba(137, 215, 183, 0.3)',
                display: 'flex'
              }}
            >
              <MedicationIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', fontSize: { xs: '1.15rem', sm: '1.3rem' } }}>
                Create Digital Prescription
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 244, 225, 0.75)', fontSize: '0.8rem' }}>
                Dr. {user?.lastName || user?.firstName || 'Practitioner'} • {user?.specialization || 'General Care'}
              </Typography>
            </Box>
          </Box>

          <IconButton 
            onClick={() => navigate('/dashboard')} 
            sx={{ color: '#89D7B7', bgcolor: 'rgba(255,255,255,0.08)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
          >
            <BackIcon />
          </IconButton>
        </Box>
      </Paper>
      
      {/* ─── DigiLocker Verification Guard ─── */}
      {digilockerVerified === false && (
        <Paper
          className="glass-card-cream"
          sx={{
            p: 2.5,
            mb: 3,
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
            background: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(185, 28, 28, 0.08) 100%) !important'
              : 'linear-gradient(135deg, rgba(254, 226, 226, 0.95) 0%, rgba(254, 202, 202, 0.8) 100%) !important',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.12)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{
              p: 1,
              borderRadius: '12px',
              bgcolor: 'rgba(239, 68, 68, 0.15)',
              color: '#dc2626',
              display: 'flex',
              flexShrink: 0
            }}>
              <WarningIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#fca5a5' : '#b91c1c', mb: 0.5, fontSize: '0.85rem' }}>
                Identity Verification Required
              </Typography>
              <Typography variant="body2" sx={{ color: mode === 'dark' ? 'rgba(252, 165, 165, 0.85)' : '#991b1b', fontSize: '0.78rem', lineHeight: 1.4, mb: 1.5 }}>
                You must verify your identity via <strong>DigiLocker</strong> before creating prescriptions.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setDigilockerLoading(true);
                  window.location.href = digilockerAPI.getAuthorizeUrl();
                }}
                disabled={digilockerLoading}
                startIcon={digilockerLoading ? <CircularProgress size={16} color="inherit" /> : <SuccessIcon sx={{ fontSize: 18 }} />}
                sx={{
                  bgcolor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 2.5,
                  py: 0.8,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  '&:hover': { bgcolor: '#b91c1c' },
                }}
              >
                {digilockerLoading ? 'Redirecting...' : 'Verify with DigiLocker'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {success && (
        <Alert 
          icon={<SuccessIcon sx={{ color: '#89D7B7' }} />}
          severity="success" 
          sx={{ mb: 3, borderRadius: '16px', bgcolor: 'rgba(26, 49, 44, 0.9)', color: '#89D7B7', border: '1px solid #89D7B7' }}
        >
          Prescription issued successfully! Generating digital verification ticket...
        </Alert>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: '16px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        
        {/* ─── 1. Patient Selection Card ─── */}
        <Paper 
          className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'}
          sx={{ 
            p: { xs: 2.2, sm: 3 }, 
            mb: 3, 
            borderRadius: '24px !important'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 2, gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ color: 'var(--color-mint)' }} /> 1. Select Target Patient *
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={() => setNewPatientDialogOpen(true)}
                sx={{ borderRadius: '14px', fontWeight: 800, fontSize: '0.75rem', borderColor: 'var(--color-forest)', color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}
              >
                + NEW PATIENT
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonSearchIcon />}
                onClick={() => setAddExistingPatientDialogOpen(true)}
                sx={{ borderRadius: '14px', fontWeight: 800, fontSize: '0.75rem', borderColor: 'var(--color-forest)', color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}
              >
                + ADD EXISTING
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required size="small">
                <InputLabel id="patient-select-label" sx={{ color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)', fontWeight: 700 }}>Select Patient *</InputLabel>
                <Select
                  labelId="patient-select-label"
                  name="patientId"
                  value={formData.patientId}
                  label="Select Patient *"
                  onChange={handleSelectChange}
                  sx={{ 
                    borderRadius: '16px',
                    bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 700,
                    color: mode === 'dark' ? '#FAF2F5' : '#123029',
                    '& fieldset': { borderColor: 'var(--glass-border)' }
                  }}
                >
                  {patients.map(patient => (
                    <MenuItem key={patient.id} value={patient.id} sx={{ fontWeight: 600 }}>
                      {patient.firstName} {patient.lastName} ({patient.email})
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', mt: 0.8, display: 'block', fontWeight: 600 }}>
                  Only showing patients you have prescribed to before
                </Typography>
              </FormControl>
            </Grid>
            
            {selectedPatient && (
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ borderRadius: '16px', bgcolor: mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(102, 205, 170, 0.1)', borderColor: 'var(--glass-border)', p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#123029' }}>
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', display: 'block', fontWeight: 600 }}>
                    Email: {selectedPatient.email}
                  </Typography>
                  {selectedPatient.contactNumber && (
                    <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', display: 'block', fontWeight: 600 }}>
                      Phone: {selectedPatient.contactNumber}
                    </Typography>
                  )}
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* ─── 2. Vital Signs Section ─── */}
        <Accordion 
          defaultExpanded 
          className="glass-panel" 
          sx={{ 
            mb: 2, 
            borderRadius: '24px !important', 
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.88) !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#428475' }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <VitalIcon sx={{ color: '#428475' }} /> 2. Vital Signs (Consultation)
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Blood Pressure"
                  placeholder="120/80 mmHg"
                  value={formData.vitalSigns?.bloodPressure || ''}
                  onChange={handleVitalChange('bloodPressure')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><BpIcon sx={{ color: '#428475', fontSize: 18 }} /></InputAdornment>,
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Pulse Rate"
                  placeholder="72 bpm"
                  value={formData.vitalSigns?.pulse || ''}
                  onChange={handleVitalChange('pulse')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><PulseIcon sx={{ color: '#ef4444', fontSize: 18 }} /></InputAdornment>,
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Temperature"
                  placeholder="98.6 °F"
                  value={formData.vitalSigns?.temperature || ''}
                  onChange={handleVitalChange('temperature')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><TempIcon sx={{ color: '#f59e0b', fontSize: 18 }} /></InputAdornment>,
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="SpO2 Level"
                  placeholder="98 %"
                  value={formData.vitalSigns?.spo2 || ''}
                  onChange={handleVitalChange('spo2')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Spo2Icon sx={{ color: '#06b6d4', fontSize: 18 }} /></InputAdornment>,
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Resp. Rate"
                  placeholder="16 /min"
                  value={formData.vitalSigns?.respiratoryRate || ''}
                  onChange={handleVitalChange('respiratoryRate')}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="BMI"
                  placeholder="24.5"
                  value={formData.vitalSigns?.bmi || ''}
                  onChange={handleVitalChange('bmi')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><BmiIcon sx={{ color: '#428475', fontSize: 18 }} /></InputAdornment>,
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Pain Scale"
                  placeholder="e.g., 4 / 10"
                  value={formData.vitalSigns?.painScale || ''}
                  onChange={handleVitalChange('painScale')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><PainIcon sx={{ color: '#ef4444', fontSize: 18 }} /></InputAdornment>,
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ─── 3. Chief Complaints & Diagnosis ─── */}
        <Accordion 
          defaultExpanded 
          className="glass-panel" 
          sx={{ 
            mb: 2, 
            borderRadius: '24px !important', 
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.88) !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#428475' }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedicalIcon sx={{ color: '#428475' }} /> 3. Complaints & Diagnosis
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={2.5}>
              {/* Presenting Complaints */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Presenting Complaints
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Epigastric pain, moderate for 3 days"
                    value={newComplaint}
                    onChange={(e) => setNewComplaint(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('presentingComplaints', newComplaint, setNewComplaint))}
                    InputProps={{ sx: { borderRadius: '14px' } }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => addToArray('presentingComplaints', newComplaint, setNewComplaint)}
                    sx={{ bgcolor: '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.presentingComplaints?.map((item, idx) => (
                    <Chip key={idx} label={item} onDelete={() => removeFromArray('presentingComplaints', idx)} sx={{ fontWeight: 600, bgcolor: 'rgba(66, 132, 117, 0.12)', color: '#1A312C' }} />
                  ))}
                </Box>
              </Grid>

              {/* Clinical Examination Findings */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Clinical Findings
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Tenderness in upper abdomen"
                    value={newFinding}
                    onChange={(e) => setNewFinding(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('clinicalFindings', newFinding, setNewFinding))}
                    InputProps={{ sx: { borderRadius: '14px' } }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => addToArray('clinicalFindings', newFinding, setNewFinding)}
                    sx={{ bgcolor: '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.clinicalFindings?.map((item, idx) => (
                    <Chip key={idx} label={item} onDelete={() => removeFromArray('clinicalFindings', idx)} sx={{ fontWeight: 600, bgcolor: 'rgba(255, 244, 225, 0.9)', color: '#1A312C' }} />
                  ))}
                </Box>
              </Grid>

              {/* Provisional Diagnosis */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Provisional Diagnosis
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Acute Gastritis / GERD"
                    value={newDiagnosis}
                    onChange={(e) => setNewDiagnosis(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('provisionalDiagnosis', newDiagnosis, setNewDiagnosis))}
                    InputProps={{ sx: { borderRadius: '14px' } }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => addToArray('provisionalDiagnosis', newDiagnosis, setNewDiagnosis)}
                    sx={{ bgcolor: '#1A312C', color: '#89D7B7', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.provisionalDiagnosis?.map((item, idx) => (
                    <Chip 
                      key={idx} 
                      label={item} 
                      onDelete={() => removeFromArray('provisionalDiagnosis', idx)} 
                      sx={{ fontWeight: 800, bgcolor: '#1A312C', color: '#89D7B7' }} 
                    />
                  ))}
                </Box>
              </Grid>

              {/* Current Medications (Ongoing) */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Current Medications (Ongoing)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Metformin 500mg BD, Amlodipine 5mg OD"
                    value={newCurrentMed}
                    onChange={(e) => setNewCurrentMed(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('currentMedications', newCurrentMed, setNewCurrentMed))}
                    InputProps={{ sx: { borderRadius: '14px' } }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => addToArray('currentMedications', newCurrentMed, setNewCurrentMed)}
                    sx={{ bgcolor: '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.currentMedications?.map((item, idx) => (
                    <Chip key={idx} label={item} onDelete={() => removeFromArray('currentMedications', idx)} sx={{ fontWeight: 600, bgcolor: 'rgba(66, 132, 117, 0.15)', color: '#1A312C' }} />
                  ))}
                </Box>
              </Grid>

              {/* Past Surgical History */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Past Surgical History
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Appendectomy (2019), Cholecystectomy (2021)"
                    value={newSurgery}
                    onChange={(e) => setNewSurgery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('pastSurgicalHistory', newSurgery, setNewSurgery))}
                    InputProps={{ sx: { borderRadius: '14px' } }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => addToArray('pastSurgicalHistory', newSurgery, setNewSurgery)}
                    sx={{ bgcolor: '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.pastSurgicalHistory?.map((item, idx) => (
                    <Chip key={idx} label={item} onDelete={() => removeFromArray('pastSurgicalHistory', idx)} sx={{ fontWeight: 600, bgcolor: 'rgba(255, 200, 150, 0.3)', color: '#1A312C' }} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ─── 4. Prescribed Medications (Rx) Section ─── */}
        <Accordion 
          defaultExpanded 
          className="glass-panel" 
          sx={{ 
            mb: 2, 
            borderRadius: '24px !important', 
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.88) !important',
            border: '2px solid rgba(137, 215, 183, 0.6) !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#428475' }} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedicationIcon sx={{ color: '#428475' }} /> 4. Rx – Prescribed Medications *
              </Typography>
              <Chip 
                label={`${formData.medications?.length || 0} Added`} 
                size="small" 
                sx={{ fontWeight: 800, bgcolor: '#89D7B7', color: '#1A312C' }} 
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            
            {/* Add New Medication Card Container */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: '20px', bgcolor: 'rgba(137, 215, 183, 0.08)', borderColor: 'rgba(137, 215, 183, 0.4)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', mb: 1.5 }}>
                + Add Medication Item (Real-time Indian Medicines Autocomplete)
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    freeSolo
                    open={medSearchOpen && (newMedication.name || '').trim().length >= 2 && filteredMedicineOptions.length > 0}
                    onOpen={() => {
                      if ((newMedication.name || '').trim().length >= 2) {
                        setMedSearchOpen(true);
                      }
                    }}
                    onClose={() => setMedSearchOpen(false)}
                    options={filteredMedicineOptions}
                    value={newMedication.name}
                    onInputChange={(e, val) => {
                      setNewMedication({ ...newMedication, name: val });
                      if (val.trim().length >= 2) {
                        setMedSearchOpen(true);
                      } else {
                        setMedSearchOpen(false);
                      }
                    }}
                    slotProps={{
                      paper: {
                        elevation: 12,
                        sx: {
                          borderRadius: '20px',
                          mt: 1,
                          bgcolor: mode === 'dark' ? 'rgba(18, 38, 34, 0.96)' : 'rgba(255, 255, 255, 0.98)',
                          backdropFilter: 'blur(20px)',
                          border: '1.5px solid var(--color-mint)',
                          boxShadow: mode === 'dark' 
                            ? '0 16px 40px rgba(0,0,0,0.6)' 
                            : '0 16px 40px rgba(42, 107, 93, 0.18)',
                          overflow: 'hidden',
                          '& .MuiAutocomplete-listbox': {
                            p: 1,
                            maxHeight: '260px',
                            '&::-webkit-scrollbar': { width: '6px' },
                            '&::-webkit-scrollbar-thumb': { bgcolor: 'var(--color-forest)', borderRadius: '10px' }
                          }
                        }
                      }
                    }}
                    renderOption={(props, option) => {
                      const isCapsule = option.toLowerCase().includes('capsule');
                      const isSyrup = option.toLowerCase().includes('syrup') || option.toLowerCase().includes('suspension');
                      const isInj = option.toLowerCase().includes('injection') || option.toLowerCase().includes('inj');
                      const isDrop = option.toLowerCase().includes('drop');
                      const formIcon = isCapsule ? '💊' : isSyrup ? '🧪' : isInj ? '💉' : isDrop ? '💧' : '💊';
                      
                      return (
                        <Box 
                          component="li" 
                          {...props} 
                          sx={{ 
                            py: 1, 
                            px: 1.5, 
                            borderRadius: '12px', 
                            mb: 0.5,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.2,
                            color: mode === 'dark' ? '#FAF2F5' : '#123029',
                            transition: 'all 0.15s ease',
                            '&:hover, &.Mui-focused': {
                              bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.22) !important' : 'rgba(102, 205, 170, 0.15) !important',
                              transform: 'translateX(4px)'
                            }
                          }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>{formIcon}</span>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'inherit' }}>
                              {option}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        label="Medicine Name *"
                        placeholder="Type at least 2 letters (e.g., Amoxicillin)"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'var(--color-forest)', fontSize: 20 }} />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                          sx: { borderRadius: '12px', fontWeight: 700 }
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="med-type-label">Form</InputLabel>
                    <Select
                      labelId="med-type-label"
                      value={newMedication.type || 'Tablet'}
                      label="Form"
                      onChange={(e) => setNewMedication({ ...newMedication, type: e.target.value })}
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="Tablet">Tablet</MenuItem>
                      <MenuItem value="Capsule">Capsule</MenuItem>
                      <MenuItem value="Syrup">Syrup</MenuItem>
                      <MenuItem value="Injection">Injection</MenuItem>
                      <MenuItem value="Ointment">Ointment</MenuItem>
                      <MenuItem value="Drops">Drops</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Dosage"
                    placeholder="e.g., 1-0-1"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>

                {/* Quick Dose Timing Preset Pills */}
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-forest)', display: 'block', mb: 0.5 }}>
                    Quick Dose Timing Presets:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                    {[
                      { label: '🌅 1-0-0 (Morning)', val: '1-0-0 (Once Morning)' },
                      { label: '☀️ 0-1-0 (Noon)', val: '0-1-0 (Once Afternoon)' },
                      { label: '🌙 0-0-1 (Night)', val: '0-0-1 (Once Night)' },
                      { label: '🌅🌙 1-0-1 (BD)', val: '1-0-1 (Twice Daily)' },
                      { label: '🌅☀️🌙 1-1-1 (TDS)', val: '1-1-1 (Thrice Daily)' }
                    ].map(preset => (
                      <Chip
                        key={preset.label}
                        label={preset.label}
                        size="small"
                        onClick={() => setNewMedication({ ...newMedication, dosage: preset.val })}
                        sx={{ 
                          fontWeight: 700, 
                          fontSize: '0.7rem', 
                          cursor: 'pointer',
                          bgcolor: newMedication.dosage === preset.val ? 'var(--color-forest)' : 'rgba(0,0,0,0.06)',
                          color: newMedication.dosage === preset.val ? '#ffffff' : 'inherit'
                        }}
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Quick Meal Relation Pills */}
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-forest)', display: 'block', mb: 0.5 }}>
                    Meal Timing Relation:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                    {[
                      { label: '🥣 Before Food (AC)', text: 'Take 30 min before food' },
                      { label: '🍽️ After Food (PC)', text: 'Take immediately after food' },
                      { label: '🥗 With Food', text: 'Take with meals' },
                      { label: '🥛 Empty Stomach', text: 'Take on empty stomach with water' }
                    ].map(meal => (
                      <Chip
                        key={meal.label}
                        label={meal.label}
                        size="small"
                        onClick={() => setNewMedication({ 
                          ...newMedication, 
                          instructions: newMedication.instructions ? `${newMedication.instructions}, ${meal.text}` : meal.text 
                        })}
                        sx={{ fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', bgcolor: 'rgba(102, 205, 170, 0.2)' }}
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Duration"
                    placeholder="e.g., 5 days / 2 weeks"
                    value={newMedication.duration}
                    onChange={(e) => setNewMedication({ ...newMedication, duration: e.target.value })}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Special Instructions"
                    placeholder="e.g., Drink plenty of water"
                    value={newMedication.instructions}
                    onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={addMedication}
                    startIcon={<AddIcon />}
                    sx={{ 
                      height: 44, 
                      bgcolor: 'var(--color-forest)', 
                      color: '#ffffff', 
                      fontWeight: 800, 
                      borderRadius: '14px',
                      '&:hover': { bgcolor: '#1a433a' }
                    }}
                  >
                    + Add Medication to Prescription
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Mobile-Friendly Added Medication Cards */}
            {formData.medications && formData.medications.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                  Prescribed Items List
                </Typography>
                {formData.medications.map((med, idx) => (
                  <Card 
                    key={idx} 
                    variant="outlined" 
                    className="touch-active"
                    sx={{ 
                      mb: 1.5, 
                      p: 2, 
                      borderRadius: '16px', 
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      borderColor: 'rgba(137, 215, 183, 0.5)',
                      boxShadow: '0 4px 14px rgba(26, 49, 44, 0.04)'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1A312C' }}>
                            {idx + 1}. {med.name}
                          </Typography>
                          {med.type && (
                            <Chip label={med.type} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(66, 132, 117, 0.15)', color: '#428475' }} />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.8, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#428475' }}>
                            Dosage: <strong>{med.dosage || 'As directed'}</strong>
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#428475' }}>
                            Duration: <strong>{med.duration || 'N/A'}</strong>
                          </Typography>
                        </Box>
                        {med.instructions && (
                          <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontStyle: 'italic', mt: 0.5 }}>
                            "{med.instructions}"
                          </Typography>
                        )}
                      </Box>
                      <IconButton size="small" onClick={() => removeMedication(idx)} sx={{ color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.08)' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}

            {/* Medication Notes */}
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Medication Warnings / Notes
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g., Avoid taking with milk or antacids"
                value={newMedNote}
                onChange={(e) => setNewMedNote(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('medicationNotes', newMedNote, setNewMedNote))}
                InputProps={{ sx: { borderRadius: '14px' } }}
              />
              <Button 
                variant="contained" 
                onClick={() => addToArray('medicationNotes', newMedNote, setNewMedNote)}
                sx={{ bgcolor: '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
              >
                <AddIcon />
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {formData.medicationNotes?.map((item, idx) => (
                <Chip key={idx} label={item} color="warning" onDelete={() => removeFromArray('medicationNotes', idx)} sx={{ fontWeight: 600 }} />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* ─── 5. Required Investigations ─── */}
        <Accordion 
          className="glass-panel" 
          sx={{ 
            mb: 2, 
            borderRadius: '24px !important', 
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.88) !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#428475' }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScienceIcon sx={{ color: '#428475' }} /> 5. Required Investigations & Lab Tests
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            {/* Systematic Categorized Common Lab Tests with Icons */}
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-forest)', display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Systematic Diagnostic Test Presets:
            </Typography>

            {[
              {
                category: '🩺 Radiology & Imaging',
                items: [
                  { name: 'X-Ray', label: '🩻 X-Ray' },
                  { name: 'MRI', label: '🧠 MRI Scan' },
                  { name: 'CT Scan', label: '💻 CT Scan' },
                  { name: 'Ultrasound', label: '📡 Ultrasound (USG)' }
                ]
              },
              {
                category: '🩸 Blood & Hematology',
                items: [
                  { name: 'Blood Test', label: '🩸 Routine Blood Test' },
                  { name: 'CBC', label: '🔬 Complete Blood Count (CBC)' },
                  { name: 'ESR', label: '🧪 ESR' },
                  { name: 'CRP', label: '🌡️ CRP' },
                  { name: 'HbA1c', label: '🩺 HbA1c (Diabetes)' }
                ]
              },
              {
                category: '🫀 Biochemistry & Organ Panels',
                items: [
                  { name: 'Lipid Profile', label: '🫀 Lipid Profile' },
                  { name: 'Liver Function Test', label: '🧪 Liver Function (LFT)' },
                  { name: 'Kidney Function Test', label: '🫘 Kidney Function (KFT)' },
                  { name: 'Thyroid Profile', label: '🦋 Thyroid Profile (T3/T4/TSH)' },
                  { name: 'Vitamin D', label: '☀️ Vitamin D' },
                  { name: 'Vitamin B12', label: '💊 Vitamin B12' }
                ]
              },
              {
                category: '⚡ Pathology & Cardiac',
                items: [
                  { name: 'Urine Test', label: '🧪 Routine Urine Test' },
                  { name: 'ECG', label: '📈 Electrocardiogram (ECG)' },
                  { name: 'EEG', label: '⚡ Electroencephalogram (EEG)' }
                ]
              }
            ].map(cat => (
              <Box key={cat.category} sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', display: 'block', mb: 0.6 }}>
                  {cat.category}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {cat.items.map(item => {
                    const isSelected = formData.investigations?.some(i => i.testName === item.name);
                    return (
                      <Chip
                        key={item.name}
                        label={item.label}
                        size="small"
                        onClick={() => {
                          if (isSelected) {
                            setFormData({
                              ...formData,
                              investigations: formData.investigations?.filter(i => i.testName !== item.name)
                            });
                          } else {
                            setFormData({
                              ...formData,
                              investigations: [...(formData.investigations || []), { testName: item.name, reason: 'Routine Evaluation', priority: 'Normal', fasting: 'Not Required' }]
                            });
                          }
                        }}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          bgcolor: isSelected ? 'var(--color-forest)' : mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.05)',
                          color: isSelected ? '#ffffff' : mode === 'dark' ? '#FAF2F5' : '#123029',
                          border: isSelected ? '1px solid var(--color-mint)' : '1px solid transparent'
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            ))}

            {/* Custom Other Test Toggle Chip */}
            <Box sx={{ mt: 1.5, mb: 2 }}>
              <Chip
                label={showCustomTestForm ? '✖ Close Custom Test Menu' : '➕ + Other (Add Custom Test Not Listed)'}
                onClick={() => setShowCustomTestForm(!showCustomTestForm)}
                sx={{
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  bgcolor: showCustomTestForm ? '#ef4444' : 'rgba(102, 205, 170, 0.25)',
                  color: showCustomTestForm ? '#ffffff' : 'var(--color-forest)',
                  border: '1px solid var(--color-mint)',
                  py: 0.5
                }}
              />
            </Box>

            {/* Conditional Custom Test Input Form (Only opens when "+ Other" is clicked) */}
            {showCustomTestForm && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: '18px', bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255, 248, 237, 0.7)', borderColor: 'var(--color-mint)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', mb: 1.5 }}>
                  Add Custom Test (Unlisted Diagnostic Test)
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Test Name *"
                      placeholder="e.g., Upper GI Endoscopy / Biopsy"
                      value={newInvestigation.testName}
                      onChange={(e) => setNewInvestigation({ ...newInvestigation, testName: e.target.value })}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Reason"
                      placeholder="e.g., Evaluate gastric ulceration"
                      value={newInvestigation.reason}
                      onChange={(e) => setNewInvestigation({ ...newInvestigation, reason: e.target.value })}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="inv-priority">Priority</InputLabel>
                      <Select
                        labelId="inv-priority"
                        value={newInvestigation.priority || 'Normal'}
                        label="Priority"
                        onChange={(e) => setNewInvestigation({ ...newInvestigation, priority: e.target.value })}
                        sx={{ borderRadius: '12px' }}
                      >
                        <MenuItem value="Urgent">Urgent</MenuItem>
                        <MenuItem value="Normal">Normal</MenuItem>
                        <MenuItem value="Routine">Routine</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Fasting Requirement"
                      placeholder="e.g., 8 hours fasting"
                      value={newInvestigation.fasting}
                      onChange={(e) => setNewInvestigation({ ...newInvestigation, fasting: e.target.value })}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => {
                        addInvestigation();
                        setShowCustomTestForm(false);
                      }}
                      startIcon={<AddIcon />}
                      sx={{ height: 40, bgcolor: 'var(--color-forest)', color: '#ffffff', fontWeight: 800, borderRadius: '12px' }}
                    >
                      + Add Custom Test
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {formData.investigations && formData.investigations.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {formData.investigations.map((inv, idx) => (
                  <Card key={idx} variant="outlined" sx={{ mb: 1, p: 1.5, borderRadius: '14px', bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1A312C' }}>
                          {idx + 1}. {inv.testName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#428475', display: 'block', fontWeight: 600 }}>
                          Reason: {inv.reason || 'Standard check'} • Priority: {inv.priority}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => removeInvestigation(idx)} sx={{ color: '#ef4444' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}

            <TextField
              fullWidth
              size="small"
              label="Investigation Instructions"
              placeholder="e.g., Bring all report hardcopies on next visit"
              value={formData.investigationNotes || ''}
              onChange={(e) => setFormData({ ...formData, investigationNotes: e.target.value })}
              InputProps={{ sx: { borderRadius: '14px' } }}
            />
          </AccordionDetails>
        </Accordion>

        {/* ─── 6. Diet & Lifestyle Recommendations ─── */}
        <Accordion 
          className="glass-panel" 
          sx={{ 
            mb: 2, 
            borderRadius: '24px !important', 
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.88) !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#428475' }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <DietIcon sx={{ color: '#428475' }} /> 6. Diet & Lifestyle Advice
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              {/* Diet Modifications */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Diet Restrictions & Modifications
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Avoid spicy foods, caffeine, late night meals"
                    value={newDiet}
                    onChange={(e) => setNewDiet(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('dietModifications', newDiet, setNewDiet))}
                    InputProps={{ sx: { borderRadius: '14px' } }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => addToArray('dietModifications', newDiet, setNewDiet)}
                    sx={{ bgcolor: '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.dietModifications?.map((item, idx) => (
                    <Chip key={idx} label={item} color="success" variant="outlined" onDelete={() => removeFromArray('dietModifications', idx)} sx={{ fontWeight: 600 }} />
                  ))}
                </Box>
              </Grid>

              {/* Lifestyle Changes */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Lifestyle Modifications
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Walk 30 minutes daily after dinner"
                    value={newLifestyle}
                    onChange={(e) => setNewLifestyle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('lifestyleChanges', newLifestyle, setNewLifestyle))}
                    InputProps={{ sx: { borderRadius: '14px' } }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => addToArray('lifestyleChanges', newLifestyle, setNewLifestyle)}
                    sx={{ bgcolor: '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.lifestyleChanges?.map((item, idx) => (
                    <Chip key={idx} label={item} color="info" variant="outlined" onDelete={() => removeFromArray('lifestyleChanges', idx)} sx={{ fontWeight: 600 }} />
                  ))}
                </Box>
              </Grid>

              {/* Warning Signs */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <WarningIcon sx={{ fontSize: 16 }} /> Seek Immediate ER Attention If:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Black stools, severe sudden abdominal pain"
                    value={newWarning}
                    onChange={(e) => setNewWarning(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('warningSigns', newWarning, setNewWarning))}
                    InputProps={{ sx: { borderRadius: '14px' } }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => addToArray('warningSigns', newWarning, setNewWarning)}
                    sx={{ bgcolor: '#ef4444', color: '#ffffff', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.warningSigns?.map((item, idx) => (
                    <Chip key={idx} label={item} color="error" onDelete={() => removeFromArray('warningSigns', idx)} sx={{ fontWeight: 700 }} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ─── 7. Follow-Up Schedule ─── */}
        <Accordion 
          className="glass-panel" 
          sx={{ 
            mb: 3, 
            borderRadius: '24px !important', 
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.88) !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#428475' }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon sx={{ color: '#428475' }} /> 7. Follow-Up Schedule
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Next Appointment Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                  value={formData.followUpInfo?.appointmentDate || ''}
                  onChange={handleFollowUpChange('appointmentDate')}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Time Slot"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  value={formData.followUpInfo?.appointmentTime || ''}
                  onChange={handleFollowUpChange('appointmentTime')}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Emergency Helpline"
                  placeholder="+91-9876543210"
                  value={formData.emergencyHelpline || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyHelpline: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><EmergencyIcon sx={{ color: '#ef4444', fontSize: 18 }} /></InputAdornment>,
                    sx: { borderRadius: '12px' }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Purpose of Next Visit"
                  placeholder="e.g., Review endoscopy report and symptom resolution"
                  value={formData.followUpInfo?.purpose || ''}
                  onChange={handleFollowUpChange('purpose')}
                  InputProps={{ sx: { borderRadius: '14px' } }}
                />
              </Grid>

              {/* Bring Items for Follow-Up */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  📋 Bring to Next Visit
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Previous blood reports, insurance card"
                    value={newBringItem}
                    onChange={(e) => setNewBringItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBringItem())}
                    InputProps={{ sx: { borderRadius: '14px' } }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={addBringItem}
                    sx={{ bgcolor: '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.followUpInfo?.bringItems?.map((item, idx) => (
                    <Chip key={idx} label={item} onDelete={() => removeBringItem(idx)} sx={{ fontWeight: 600, bgcolor: 'rgba(66, 132, 117, 0.15)', color: '#1A312C' }} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Additional Clinical Notes Paper */}
        <Paper className="glass-panel" sx={{ p: 2.5, mb: 3, borderRadius: '24px !important', bgcolor: 'rgba(255, 255, 255, 0.9) !important' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A312C', mb: 1 }}>
            Additional Clinical Remarks
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Any extra instructions or notes for the patient..."
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            InputProps={{ sx: { borderRadius: '16px' } }}
          />
        </Paper>

        {/* ─── Submit Action Bar ─── */}
        <Paper 
          elevation={12}
          className="glass-panel" 
          sx={{ 
            p: 2, 
            borderRadius: '24px !important', 
            bgcolor: 'rgba(26, 49, 44, 0.94) !important',
            border: '1px solid rgba(137, 215, 183, 0.4) !important',
            boxShadow: '0 12px 36px rgba(15, 29, 26, 0.3) !important'
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              sx={{ 
                height: 48, 
                px: 3,
                borderColor: 'rgba(255, 244, 225, 0.4)', 
                color: '#FFF4E1',
                borderRadius: '16px',
                fontWeight: 700,
                '&:hover': { borderColor: '#FFF4E1', bgcolor: 'rgba(255,255,255,0.08)' }
              }}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={22} sx={{ color: '#1A312C' }} /> : <SendIcon />}
              sx={{ 
                height: 48, 
                px: 4,
                bgcolor: '#89D7B7', 
                color: '#1A312C',
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '0.95rem',
                boxShadow: '0 8px 24px rgba(137, 215, 183, 0.4)',
                '&:hover': { bgcolor: '#78caa8' }
              }}
            >
              {loading ? 'Issuing...' : 'Issue Prescription'}
            </Button>
          </Box>
        </Paper>

      </Box>

      {/* ─── Dialog: Create New Patient ─── */}
      <Dialog 
        open={newPatientDialogOpen} 
        onClose={() => setNewPatientDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: mode === 'dark' ? 'rgba(26, 52, 45, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            color: mode === 'dark' ? '#FAF2F5' : '#123029',
            border: '1px solid var(--glass-border)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon sx={{ color: 'var(--color-mint)' }} /> Register New Patient
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', fontWeight: 600 }}>
            Create a patient account on the fly. Default login password: <strong>password123</strong>
          </Typography>
          <Grid container spacing={1.8}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="First Name *"
                value={newPatientData.firstName}
                onChange={(e) => setNewPatientData({ ...newPatientData, firstName: e.target.value })}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Last Name *"
                value={newPatientData.lastName}
                onChange={(e) => setNewPatientData({ ...newPatientData, lastName: e.target.value })}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Email Address *"
                type="email"
                value={newPatientData.email}
                onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Phone Number"
                value={newPatientData.phone}
                onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setNewPatientDialogOpen(false)} sx={{ borderRadius: '12px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={creatingPatient || !newPatientData.firstName || !newPatientData.email}
            onClick={async () => {
              try {
                setCreatingPatient(true);
                // Create patient logic
                const newP: Patient = {
                  id: 'pat-' + Date.now(),
                  firstName: newPatientData.firstName,
                  lastName: newPatientData.lastName,
                  email: newPatientData.email,
                  role: 'patient',
                  contactNumber: newPatientData.phone,
                  createdAt: new Date().toISOString()
                };
                setPatients(prev => [newP, ...prev]);
                setSelectedPatient(newP);
                setFormData(prev => ({ ...prev, patientId: newP.id }));
                setNewPatientDialogOpen(false);
                setNewPatientData({ firstName: '', lastName: '', email: '', phone: '', gender: 'male', address: '' });
              } catch (err) {
                console.error(err);
              } finally {
                setCreatingPatient(false);
              }
            }}
            sx={{ borderRadius: '14px', bgcolor: 'var(--color-forest)', color: '#ffffff', fontWeight: 800 }}
          >
            {creatingPatient ? 'Creating...' : 'Create & Select'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Dialog: Add Existing Patient (Exact 3-Tab Match) ─── */}
      <Dialog 
        open={addExistingPatientDialogOpen} 
        onClose={() => {
          setAddExistingPatientDialogOpen(false);
          setFoundPatient(null);
          setLookupError('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: mode === 'dark' ? 'rgba(26, 52, 45, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(24px)',
            color: mode === 'dark' ? '#FAF2F5' : '#123029',
            border: '1px solid var(--glass-border)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.2, pb: 1 }}>
          <PersonSearchIcon sx={{ color: 'var(--color-mint)', fontSize: 26 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Add Existing Patient</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ mb: 2, color: mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.65)', fontWeight: 500 }}>
            Find a patient by entering their ID, scanning their QR code, or uploading a QR image.
          </Typography>

          {/* 3 Tabs: MANUAL | SCAN QR | UPLOAD QR */}
          <Tabs 
            value={lookupTabValue} 
            onChange={(e, val) => {
              setLookupTabValue(val);
              setLookupError('');
            }}
            variant="fullWidth"
            sx={{ 
              mb: 2.5, 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': { fontWeight: 800, fontSize: '0.82rem', letterSpacing: 0.5 },
              '& .Mui-selected': { color: 'var(--color-forest) !important' },
              '& .MuiTabs-indicator': { bgcolor: 'var(--color-forest)' }
            }}
          >
            <Tab icon={<PersonSearchIcon sx={{ fontSize: 20 }} />} label="MANUAL" iconPosition="start" />
            <Tab icon={<CameraAltIcon sx={{ fontSize: 20 }} />} label="SCAN QR" iconPosition="start" />
            <Tab icon={<UploadFileIcon sx={{ fontSize: 20 }} />} label="UPLOAD QR" iconPosition="start" />
          </Tabs>

          {lookupError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '14px' }}>
              {lookupError}
            </Alert>
          )}

          {/* TAB 0: MANUAL LOOKUP */}
          {lookupTabValue === 0 && (
            <Box>
              <Grid container spacing={1.5} alignItems="flex-start">
                <Grid item xs={8} sm={9}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Patient ID *"
                    placeholder="Enter patient ID"
                    value={patientIdToLookup}
                    onChange={(e) => {
                      setPatientIdToLookup(e.target.value);
                      setLookupError('');
                    }}
                    helperText="Ask the patient to share their Patient ID from their profile"
                    InputProps={{ sx: { borderRadius: '14px' } }}
                  />
                </Grid>
                <Grid item xs={4} sm={3}>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={lookingUpPatient || !patientIdToLookup.trim()}
                    onClick={() => {
                      setLookingUpPatient(true);
                      setLookupError('');
                      setTimeout(() => {
                        const query = patientIdToLookup.trim().toLowerCase();
                        const match = patients.find(p => 
                          (p?.id || '').toLowerCase().includes(query) || 
                          (p?.email || '').toLowerCase().includes(query) || 
                          `${p?.firstName || ''} ${p?.lastName || ''}`.toLowerCase().includes(query)
                        );
                        if (match) {
                          setFoundPatient(match);
                        } else {
                          // Create fallback record if demo
                          const mockMatch: Patient = {
                            id: patientIdToLookup.trim(),
                            firstName: 'Patient (' + patientIdToLookup.trim() + ')',
                            lastName: '',
                            email: patientIdToLookup.trim().includes('@') ? patientIdToLookup.trim() : `${patientIdToLookup.trim()}@medizo.com`,
                            role: 'patient',
                            createdAt: new Date().toISOString()
                          };
                          setFoundPatient(mockMatch);
                        }
                        setLookingUpPatient(false);
                      }, 500);
                    }}
                    sx={{ 
                      height: 40, 
                      borderRadius: '14px', 
                      bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0, 0, 0, 0.1)', 
                      color: mode === 'dark' ? '#FAF2F5' : '#123029',
                      fontWeight: 800,
                      boxShadow: 'none',
                      '&:hover': { bgcolor: 'var(--color-forest)', color: '#ffffff' }
                    }}
                  >
                    {lookingUpPatient ? <CircularProgress size={18} /> : 'LOOK UP'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* TAB 1: SCAN QR */}
          {lookupTabValue === 1 && (
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Paper 
                variant="outlined"
                sx={{ 
                  height: 180, 
                  borderRadius: '20px', 
                  bgcolor: '#0f172a', 
                  color: '#ffffff', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justify: 'center',
                  p: 2,
                  mb: 1.5,
                  position: 'relative'
                }}
              >
                {scanningQR ? (
                  <Box>
                    <CircularProgress sx={{ color: '#4ade80', mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: '#4ade80', fontWeight: 700 }}>Scanning QR Viewfinder...</Typography>
                  </Box>
                ) : (
                  <Box>
                    <CameraAltIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 1.5 }}>
                      Point camera at patient's digital QR pass
                    </Typography>
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => {
                        setScanningQR(true);
                        setTimeout(() => {
                          setScanningQR(false);
                          const demoP = patients[0] || { id: 'PAT-991', firstName: 'Verified QR Patient', lastName: 'Demo', email: 'qrpatient@medizo.com', role: 'patient' };
                          setFoundPatient(demoP);
                        }, 1200);
                      }}
                      sx={{ bgcolor: 'var(--color-forest)', color: '#ffffff', fontWeight: 800, borderRadius: '12px' }}
                    >
                      Start Camera Scan
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>
          )}

          {/* TAB 2: UPLOAD QR */}
          {lookupTabValue === 2 && (
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Paper
                variant="outlined"
                sx={{ 
                  p: 3, 
                  borderRadius: '20px', 
                  borderStyle: 'dashed', 
                  borderColor: 'var(--glass-border)',
                  bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                  cursor: 'pointer'
                }}
              >
                <UploadFileIcon sx={{ fontSize: 48, color: 'var(--color-forest)', mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Upload Patient QR Code Image</Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    const demoP = patients[0] || { id: 'PAT-882', firstName: 'QR File Patient', lastName: 'Verified', email: 'fileqr@medizo.com', role: 'patient' };
                    setFoundPatient(demoP);
                  }}
                  sx={{ borderRadius: '14px', fontWeight: 800, borderColor: 'var(--color-forest)', color: 'var(--color-forest)' }}
                >
                  Choose File Image
                </Button>
              </Paper>
            </Box>
          )}

          {/* FOUND PATIENT SUCCESS CARD */}
          {foundPatient && (
            <Card 
              variant="outlined" 
              sx={{ 
                mt: 2, 
                p: 2, 
                borderRadius: '16px', 
                bgcolor: 'rgba(102, 205, 170, 0.15)', 
                borderColor: 'var(--color-mint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CheckCircleIcon sx={{ color: 'var(--color-forest)', fontSize: 32 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#123029' }}>
                    {foundPatient.firstName} {foundPatient.lastName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', display: 'block', fontWeight: 600 }}>
                    ID: {foundPatient.id} • {foundPatient.email}
                  </Typography>
                </Box>
              </Box>
              <Chip label="Ready to Add" size="small" sx={{ bgcolor: 'var(--color-forest)', color: '#ffffff', fontWeight: 800 }} />
            </Card>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
          <Button 
            onClick={() => {
              setAddExistingPatientDialogOpen(false);
              setFoundPatient(null);
              setLookupError('');
            }} 
            sx={{ fontWeight: 800, color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}
          >
            CANCEL
          </Button>
          <Button
            variant="contained"
            disabled={!foundPatient}
            onClick={() => {
              if (foundPatient) {
                if (!patients.some(p => p.id === foundPatient.id)) {
                  setPatients(prev => [foundPatient, ...prev]);
                }
                setSelectedPatient(foundPatient);
                setFormData(prev => ({ ...prev, patientId: foundPatient.id }));
                setAddExistingPatientDialogOpen(false);
                setFoundPatient(null);
                setPatientIdToLookup('');
              }
            }}
            startIcon={<PersonAddIcon />}
            sx={{ 
              borderRadius: '14px', 
              bgcolor: 'var(--color-forest)', 
              color: '#ffffff', 
              fontWeight: 800,
              px: 3,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              '&:disabled': { bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)' }
            }}
          >
            + ADD PATIENT
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NewPrescription;
