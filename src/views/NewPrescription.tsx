'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPatients } from '../services/patients';
import { createPrescription } from '../services/prescriptions';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  MonitorHeart as VitalIcon,
  MedicalServices as MedicalIcon,
  Medication as MedicationIcon,
  Science as ScienceIcon,
  Restaurant as DietIcon,
  Event as EventIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { CreatePrescriptionData, MedicationItem, Investigation, VitalSigns, FollowUpInfo } from '../types/prescription';

const NewPrescription = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { user } = authState;
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
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

  // New medication form
  const [newMedication, setNewMedication] = useState<MedicationItem>({
    name: '',
    type: '',
    dosage: '',
    duration: '',
    instructions: ''
  });

  // New investigation form
  const [newInvestigation, setNewInvestigation] = useState<Investigation>({
    testName: '',
    reason: '',
    priority: '',
    fasting: ''
  });

  // Fetch patients on component mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients list');
      }
    };
    
    fetchPatients();
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
      setNewMedication({ name: '', type: '', dosage: '', duration: '', instructions: '' });
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
      setNewInvestigation({ testName: '', reason: '', priority: '', fasting: '' });
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
      setError('Please select a patient');
      return;
    }

    if (!formData.medications || formData.medications.length === 0) {
      setError('Please add at least one medication');
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
      
    } catch (err) {
      console.error('Error creating prescription:', err);
      setError('Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MedicationIcon color="primary" /> Create New Prescription
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Prescription created successfully! Redirecting...
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        {/* Patient Selection */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
            <PersonIcon /> Patient Selection
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="patient-select-label">Select Patient</InputLabel>
                <Select
                  labelId="patient-select-label"
                  name="patientId"
                  value={formData.patientId}
                  label="Select Patient"
                  onChange={handleSelectChange}
                >
                  {patients.map(patient => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {selectedPatient && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Patient:</strong> {selectedPatient.firstName} {selectedPatient.lastName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Email:</strong> {selectedPatient.email}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Vital Signs */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <VitalIcon /> Vital Signs (Recorded at Consultation)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Blood Pressure"
                  placeholder="e.g., 120/80 mmHg"
                  value={formData.vitalSigns?.bloodPressure || ''}
                  onChange={handleVitalChange('bloodPressure')}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Pulse"
                  placeholder="e.g., 72 bpm"
                  value={formData.vitalSigns?.pulse || ''}
                  onChange={handleVitalChange('pulse')}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Temperature"
                  placeholder="e.g., 98.6°F"
                  value={formData.vitalSigns?.temperature || ''}
                  onChange={handleVitalChange('temperature')}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="SPO2"
                  placeholder="e.g., 98%"
                  value={formData.vitalSigns?.spo2 || ''}
                  onChange={handleVitalChange('spo2')}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Respiratory Rate"
                  placeholder="e.g., 16/min"
                  value={formData.vitalSigns?.respiratoryRate || ''}
                  onChange={handleVitalChange('respiratoryRate')}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="BMI"
                  placeholder="e.g., 24.5"
                  value={formData.vitalSigns?.bmi || ''}
                  onChange={handleVitalChange('bmi')}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Pain Scale"
                  placeholder="e.g., 6/10"
                  value={formData.vitalSigns?.painScale || ''}
                  onChange={handleVitalChange('painScale')}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Chief Complaints & Clinical Notes */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <MedicalIcon /> Chief Complaints & Clinical Notes
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Presenting Complaints */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Presenting Complaints</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add complaint (e.g., Epigastric pain - moderate, for 3 days)"
                    value={newComplaint}
                    onChange={(e) => setNewComplaint(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('presentingComplaints', newComplaint, setNewComplaint))}
                  />
                  <IconButton color="primary" onClick={() => addToArray('presentingComplaints', newComplaint, setNewComplaint)}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.presentingComplaints?.map((item, idx) => (
                    <Chip key={idx} label={item} onDelete={() => removeFromArray('presentingComplaints', idx)} />
                  ))}
                </Box>
              </Grid>

              {/* Clinical Examination Findings */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Clinical Examination Findings</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add finding (e.g., Tenderness in epigastric region)"
                    value={newFinding}
                    onChange={(e) => setNewFinding(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('clinicalFindings', newFinding, setNewFinding))}
                  />
                  <IconButton color="primary" onClick={() => addToArray('clinicalFindings', newFinding, setNewFinding)}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.clinicalFindings?.map((item, idx) => (
                    <Chip key={idx} label={item} onDelete={() => removeFromArray('clinicalFindings', idx)} />
                  ))}
                </Box>
              </Grid>

              {/* Provisional Diagnosis */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Provisional Diagnosis</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add diagnosis (e.g., Acute Gastritis)"
                    value={newDiagnosis}
                    onChange={(e) => setNewDiagnosis(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('provisionalDiagnosis', newDiagnosis, setNewDiagnosis))}
                  />
                  <IconButton color="primary" onClick={() => addToArray('provisionalDiagnosis', newDiagnosis, setNewDiagnosis)}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.provisionalDiagnosis?.map((item, idx) => (
                    <Chip key={idx} label={item} color="primary" variant="outlined" onDelete={() => removeFromArray('provisionalDiagnosis', idx)} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Medical History */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <MedicalIcon /> Medical History
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Current Medications */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Current Medications (Ongoing)</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Metformin 500mg - twice daily"
                    value={newCurrentMed}
                    onChange={(e) => setNewCurrentMed(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('currentMedications', newCurrentMed, setNewCurrentMed))}
                  />
                  <IconButton color="primary" onClick={() => addToArray('currentMedications', newCurrentMed, setNewCurrentMed)}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.currentMedications?.map((item, idx) => (
                    <Chip key={idx} label={item} size="small" onDelete={() => removeFromArray('currentMedications', idx)} />
                  ))}
                </Box>
              </Grid>

              {/* Past Surgical History */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Past Surgical History</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Appendectomy (2015)"
                    value={newSurgery}
                    onChange={(e) => setNewSurgery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('pastSurgicalHistory', newSurgery, setNewSurgery))}
                  />
                  <IconButton color="primary" onClick={() => addToArray('pastSurgicalHistory', newSurgery, setNewSurgery)}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.pastSurgicalHistory?.map((item, idx) => (
                    <Chip key={idx} label={item} size="small" onDelete={() => removeFromArray('pastSurgicalHistory', idx)} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Prescribed Medications */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <MedicationIcon /> Rx - Prescribed Medications *
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Add new medication form */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Add Medication</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Medicine Name *"
                    placeholder="e.g., Omeprazole 40mg"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Type"
                    placeholder="e.g., PPI"
                    value={newMedication.type}
                    onChange={(e) => setNewMedication({ ...newMedication, type: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Dosage"
                    placeholder="e.g., 1-0-1"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Duration"
                    placeholder="e.g., 14 days"
                    value={newMedication.duration}
                    onChange={(e) => setNewMedication({ ...newMedication, duration: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Button variant="contained" fullWidth onClick={addMedication} sx={{ height: '40px' }}>
                    <AddIcon />
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Instructions"
                    placeholder="e.g., Take 30 min before breakfast on empty stomach"
                    value={newMedication.instructions}
                    onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Medications table */}
            {formData.medications && formData.medications.length > 0 && (
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>No.</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Medicine Name</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Dosage</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Duration</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Instructions</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.medications.map((med, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <strong>{med.name}</strong>
                          {med.type && <Typography variant="caption" display="block" color="textSecondary">({med.type})</Typography>}
                        </TableCell>
                        <TableCell>{med.dosage}</TableCell>
                        <TableCell>{med.duration}</TableCell>
                        <TableCell>{med.instructions}</TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => removeMedication(idx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Medication Notes */}
            <Typography variant="subtitle2" gutterBottom>Important Medication Notes</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g., Do not take NSAIDs (aspirin, ibuprofen) - will worsen gastritis"
                value={newMedNote}
                onChange={(e) => setNewMedNote(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('medicationNotes', newMedNote, setNewMedNote))}
              />
              <IconButton color="primary" onClick={() => addToArray('medicationNotes', newMedNote, setNewMedNote)}>
                <AddIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.medicationNotes?.map((item, idx) => (
                <Chip key={idx} label={item} color="warning" variant="outlined" size="small" onDelete={() => removeFromArray('medicationNotes', idx)} />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Investigations Required */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <ScienceIcon /> Investigations Required
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Add Investigation</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Test Name *"
                    placeholder="e.g., Upper GI Endoscopy"
                    value={newInvestigation.testName}
                    onChange={(e) => setNewInvestigation({ ...newInvestigation, testName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Reason"
                    placeholder="e.g., Rule out peptic ulcer"
                    value={newInvestigation.reason}
                    onChange={(e) => setNewInvestigation({ ...newInvestigation, reason: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Priority"
                    placeholder="e.g., Within 1 week"
                    value={newInvestigation.priority}
                    onChange={(e) => setNewInvestigation({ ...newInvestigation, priority: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fasting"
                    placeholder="e.g., 8-10 hours"
                    value={newInvestigation.fasting}
                    onChange={(e) => setNewInvestigation({ ...newInvestigation, fasting: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <Button variant="contained" fullWidth onClick={addInvestigation} sx={{ height: '40px' }}>
                    <AddIcon />
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Investigations list */}
            {formData.investigations && formData.investigations.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {formData.investigations.map((inv, idx) => (
                  <Card key={idx} variant="outlined" sx={{ mb: 1, p: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2"><strong>{idx + 1}. {inv.testName}</strong> - {inv.reason}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Priority: {inv.priority || 'N/A'} | Fasting: {inv.fasting || 'Not required'}
                        </Typography>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => removeInvestigation(idx)}>
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
              label="Investigation Notes"
              placeholder="e.g., Please bring all test reports to the follow-up appointment"
              value={formData.investigationNotes || ''}
              onChange={(e) => setFormData({ ...formData, investigationNotes: e.target.value })}
            />
          </AccordionDetails>
        </Accordion>

        {/* Dietary & Lifestyle Recommendations */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <DietIcon /> Dietary & Lifestyle Recommendations
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Diet Modifications */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Diet Modifications</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Avoid spicy food, citrus fruits, coffee, alcohol"
                    value={newDiet}
                    onChange={(e) => setNewDiet(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('dietModifications', newDiet, setNewDiet))}
                  />
                  <IconButton color="primary" onClick={() => addToArray('dietModifications', newDiet, setNewDiet)}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.dietModifications?.map((item, idx) => (
                    <Chip key={idx} label={item} color="success" variant="outlined" size="small" onDelete={() => removeFromArray('dietModifications', idx)} />
                  ))}
                </Box>
              </Grid>

              {/* Lifestyle Changes */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Lifestyle Changes</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Elevate head of bed by 6-8 inches while sleeping"
                    value={newLifestyle}
                    onChange={(e) => setNewLifestyle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('lifestyleChanges', newLifestyle, setNewLifestyle))}
                  />
                  <IconButton color="primary" onClick={() => addToArray('lifestyleChanges', newLifestyle, setNewLifestyle)}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.lifestyleChanges?.map((item, idx) => (
                    <Chip key={idx} label={item} color="info" variant="outlined" size="small" onDelete={() => removeFromArray('lifestyleChanges', idx)} />
                  ))}
                </Box>
              </Grid>

              {/* Warning Signs */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="error" fontSize="small" /> Warning Signs - Seek Immediate Medical Attention if:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., Severe abdominal pain, vomiting blood"
                    value={newWarning}
                    onChange={(e) => setNewWarning(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('warningSigns', newWarning, setNewWarning))}
                  />
                  <IconButton color="primary" onClick={() => addToArray('warningSigns', newWarning, setNewWarning)}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.warningSigns?.map((item, idx) => (
                    <Chip key={idx} label={item} color="error" variant="outlined" size="small" onDelete={() => removeFromArray('warningSigns', idx)} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Follow-up Information */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
              <EventIcon /> Follow-up Information
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Next Appointment Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                  value={formData.followUpInfo?.appointmentDate || ''}
                  onChange={handleFollowUpChange('appointmentDate')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Appointment Time"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  value={formData.followUpInfo?.appointmentTime || ''}
                  onChange={handleFollowUpChange('appointmentTime')}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Emergency Helpline"
                  placeholder="e.g., +91-9876543299"
                  value={formData.emergencyHelpline || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyHelpline: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Purpose of Follow-up"
                  placeholder="e.g., Review test results and assess treatment response"
                  value={formData.followUpInfo?.purpose || ''}
                  onChange={handleFollowUpChange('purpose')}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Bring to Follow-up</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., All investigation reports, this prescription"
                    value={newBringItem}
                    onChange={(e) => setNewBringItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBringItem())}
                  />
                  <IconButton color="primary" onClick={addBringItem}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.followUpInfo?.bringItems?.map((item, idx) => (
                    <Chip key={idx} label={item} size="small" onDelete={() => removeBringItem(idx)} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Additional Notes */}
        <Paper elevation={3} sx={{ p: 3, mt: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">Additional Notes</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Any additional notes for this prescription..."
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </Paper>

        {/* Submit Buttons */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <MedicationIcon />}
            >
              {loading ? 'Creating...' : 'Create Prescription'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default NewPrescription;
