'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Tooltip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  PersonAdd as PersonAddIcon,
  PersonSearch as PersonSearchIcon,
  CameraAlt as CameraAltIcon,
  UploadFile as UploadFileIcon,
  Stop as StopIcon,
  WbSunny as MorningIcon,
  LightMode as AfternoonIcon,
  WbTwilight as EveningIcon,
  NightsStay as NightIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  Science as ScienceIcon,
  Restaurant as WithFoodIcon,
  FreeBreakfast as BeforeFoodIcon,
  DinnerDining as AfterFoodIcon,
  LocalCafe as EmptyStomachIcon,
  Schedule as AnyTimeIcon
} from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import { usersAPI, prescriptionsAPI } from '../../services/api';
import axios from 'axios';
import indianMedicines from '../../data/indianMedicines.json';

// Debounce function to limit API calls
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const PrescriptionForm = ({ onCreatePrescription }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [patientsList, setPatientsList] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  
  // New patient dialog state
  const [newPatientDialogOpen, setNewPatientDialogOpen] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: ''
  });
  const [newPatientError, setNewPatientError] = useState('');
  
  // Add Existing Patient dialog state
  const [addExistingPatientDialogOpen, setAddExistingPatientDialogOpen] = useState(false);
  const [lookingUpPatient, setLookingUpPatient] = useState(false);
  const [patientIdToLookup, setPatientIdToLookup] = useState('');
  const [foundPatient, setFoundPatient] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupTabValue, setLookupTabValue] = useState(0); // 0 = Manual, 1 = Camera, 2 = Upload
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Medication autocomplete state
  const [medicationSuggestions, setMedicationSuggestions] = useState({});
  const [loadingMedications, setLoadingMedications] = useState({});
  
  // Patient's old prescriptions
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [loadingPatientPrescriptions, setLoadingPatientPrescriptions] = useState(false);
  
  // Available tests
  const availableTests = [
    'X-Ray', 'MRI', 'CT Scan', 'Blood Test', 'Urine Test', 
    'ECG', 'EEG', 'Ultrasound', 'Thyroid Profile', 'Lipid Profile',
    'Liver Function Test', 'Kidney Function Test', 'HbA1c', 
    'Vitamin D', 'Vitamin B12', 'CBC', 'ESR', 'CRP'
  ];
  
  const [prescription, setPrescription] = useState({
    patientId: '',
    patientEmail: '',
    diagnosis: '',
    medications: [
      { name: '', dosage: '', frequency: '', timing: '', mealRelation: '', durationWeeks: '', durationDays: '' }
    ],
    testsRequired: [],
    instructions: '',
    followUpWeeks: '',
    followUpDays: '',
    followUpDate: '',
    // New comprehensive fields
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

  // Temp inputs for adding items to arrays
  const [newComplaint, setNewComplaint] = useState('');
  const [newFinding, setNewFinding] = useState('');
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newCurrentMed, setNewCurrentMed] = useState('');
  const [newSurgery, setNewSurgery] = useState('');
  const [newMedNote, setNewMedNote] = useState('');
  const [newInvestigation, setNewInvestigation] = useState({ testName: '', reason: '', priority: '', fasting: '' });
  const [newDiet, setNewDiet] = useState('');
  const [newLifestyle, setNewLifestyle] = useState('');
  const [newWarning, setNewWarning] = useState('');
  const [newBringItem, setNewBringItem] = useState('');
  const [newCustomTest, setNewCustomTest] = useState('');

  // Fetch patients when component mounts
  useEffect(() => {
    fetchPatients();
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          const state = html5QrCodeRef.current.getState();
          if (state === 2) { // SCANNING state
            html5QrCodeRef.current.stop().then(() => {
              html5QrCodeRef.current.clear();
            }).catch(() => {});
          } else {
            html5QrCodeRef.current.clear();
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      // Clean up temp file reader div
      const tempDiv = document.getElementById("qr-file-reader");
      if (tempDiv && tempDiv.parentNode === document.body) {
        document.body.removeChild(tempDiv);
      }
    };
  }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      setError(''); // Clear any previous errors
      console.log('Fetching my patients (security: only patients I have prescribed to)...');
      const response = await usersAPI.getMyPatients();
      console.log('My patients response:', response);
      console.log('Patients array:', response.patients);
      
      if (response.patients && response.patients.length > 0) {
        setPatientsList(response.patients);
        console.log('Successfully loaded', response.patients.length, 'patients');
      } else {
        console.log('No patients found - this doctor has not prescribed to any patients yet');
        setPatientsList([]);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Don't show error for empty list - just show empty state
      setPatientsList([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Fetch patient's old prescriptions when patient is selected
  const fetchPatientPrescriptions = async (patientId) => {
    if (!patientId) {
      setPatientPrescriptions([]);
      return;
    }
    
    try {
      setLoadingPatientPrescriptions(true);
      console.log('Fetching prescriptions for patient:', patientId);
      const prescriptions = await prescriptionsAPI.getMyPrescriptions();
      
      console.log('All prescriptions:', prescriptions);
      console.log('Looking for patientId:', patientId);
      
      // Filter prescriptions for this specific patient
      const patientRx = prescriptions.filter(rx => {
        console.log('Comparing rx.patientId:', rx.patientId, 'with:', patientId);
        return rx.patientId === patientId;
      });
      
      // Sort by date (newest first)
      patientRx.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('Found', patientRx.length, 'prescriptions for patient');
      setPatientPrescriptions(patientRx);
    } catch (error) {
      console.error('Failed to fetch patient prescriptions:', error);
      setPatientPrescriptions([]);
    } finally {
      setLoadingPatientPrescriptions(false);
    }
  };

  // Effect to fetch prescriptions when patient changes
  useEffect(() => {
    if (prescription.patientId) {
      fetchPatientPrescriptions(prescription.patientId);
    } else {
      setPatientPrescriptions([]);
    }
  }, [prescription.patientId]);

  // Handle Add Existing Patient dialog
  const handleOpenAddExistingPatientDialog = () => {
    setAddExistingPatientDialogOpen(true);
    setLookupError('');
    setPatientIdToLookup('');
    setFoundPatient(null);
    setLookupTabValue(0);
    setCameraError('');
  };

  const handleCloseAddExistingPatientDialog = async () => {
    // Stop camera if running - must be awaited
    await stopCameraAsync();
    setAddExistingPatientDialogOpen(false);
    setLookupError('');
    setPatientIdToLookup('');
    setFoundPatient(null);
    setLookupTabValue(0);
    setCameraError('');
  };

  // QR Code scanning functions
  const startCamera = async () => {
    setCameraError('');
    
    // Wait a bit for the DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const readerElement = document.getElementById("qr-reader");
    if (!readerElement) {
      setCameraError('Camera container not ready. Please try again.');
      return;
    }
    
    try {
      // Clear any existing content
      readerElement.innerHTML = '';
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // QR code scanned successfully
          console.log('QR Code scanned:', decodedText);
          setPatientIdToLookup(decodedText);
          // Stop camera first, then lookup
          stopCameraAsync().then(() => {
            handleLookupPatientById(decodedText);
          });
        },
        (errorMessage) => {
          // Scan error - ignore, just means no QR found yet
        }
      );
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please check permissions or try uploading a QR image.');
      setIsCameraActive(false);
    }
  };

  const stopCameraAsync = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) { // SCANNING state
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping camera:', err);
      } finally {
        html5QrCodeRef.current = null;
        setIsCameraActive(false);
      }
    }
  };

  const stopCamera = () => {
    stopCameraAsync();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCameraError('');
    setLookupError('');

    try {
      // Create a temporary div for file scanning
      let tempDiv = document.getElementById("qr-file-reader");
      if (!tempDiv) {
        tempDiv = document.createElement('div');
        tempDiv.id = 'qr-file-reader';
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
      }
      
      const html5QrCode = new Html5Qrcode("qr-file-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      console.log('QR Code from file:', decodedText);
      setPatientIdToLookup(decodedText);
      // Auto lookup the patient
      handleLookupPatientById(decodedText);
      
      // Cleanup
      html5QrCode.clear();
    } catch (err) {
      console.error('QR scan error:', err);
      setLookupError('Could not read QR code from image. Please try another image or enter the ID manually.');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLookupPatientById = async (patientId) => {
    if (!patientId || !patientId.trim()) {
      setLookupError('Please enter a Patient ID');
      return;
    }

    setLookingUpPatient(true);
    setLookupError('');
    setFoundPatient(null);

    try {
      const response = await usersAPI.lookupPatientById(patientId.trim());
      console.log('Patient found:', response.patient);
      setFoundPatient(response.patient);
    } catch (error) {
      console.error('Failed to lookup patient:', error);
      setLookupError(error.message || 'Patient not found. Please check the Patient ID.');
    } finally {
      setLookingUpPatient(false);
    }
  };

  const handleLookupPatient = async () => {
    await handleLookupPatientById(patientIdToLookup);
  };

  const handleAddFoundPatient = async () => {
    if (foundPatient) {
      const patientId = foundPatient.id || foundPatient._id;
      
      try {
        // Link patient to doctor on the server (persist the relationship)
        await usersAPI.linkPatient(patientId);
        console.log('Patient linked successfully:', patientId);
      } catch (error) {
        console.error('Failed to link patient:', error);
        // Continue anyway - patient will still be added locally
      }
      
      // Check if patient is already in the list
      const isAlreadyInList = patientsList.some(p => p.id === patientId || p._id === patientId);
      
      if (!isAlreadyInList) {
        // Add to local patients list
        setPatientsList(prev => [...prev, foundPatient]);
      }
      
      // Select this patient
      setPrescription({
        ...prescription,
        patientId: patientId,
        patientEmail: foundPatient.email
      });
      
      // Close dialog
      handleCloseAddExistingPatientDialog();
    }
  };

  // Search for medication names from local Indian medicines database
  const searchMedications = useCallback((query, index) => {
    if (!query || query.length < 1) {
      setMedicationSuggestions(prev => ({ ...prev, [index]: [] }));
      return;
    }
    
    const searchTerm = query.toLowerCase();
    const matches = indianMedicines.filter(medicine => 
      medicine.toLowerCase().includes(searchTerm)
    ).slice(0, 15); // Limit to 15 suggestions
    
    setMedicationSuggestions(prev => ({ ...prev, [index]: matches }));
  }, []);

  // Handle new patient dialog
  const handleOpenNewPatientDialog = () => {
    setNewPatientDialogOpen(true);
    setNewPatientError('');
    setNewPatientData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: ''
    });
  };

  const handleCloseNewPatientDialog = () => {
    setNewPatientDialogOpen(false);
    setNewPatientError('');
  };

  const handleNewPatientChange = (e) => {
    setNewPatientData({
      ...newPatientData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateNewPatient = async () => {
    // Validate required fields
    if (!newPatientData.firstName || !newPatientData.lastName || !newPatientData.email) {
      setNewPatientError('First name, last name, and email are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newPatientData.email)) {
      setNewPatientError('Please enter a valid email address');
      return;
    }

    setCreatingPatient(true);
    setNewPatientError('');

    try {
      const response = await usersAPI.createPatient(newPatientData);
      console.log('New patient created:', response);

      const createdPatient = response.patient;
      const createdPatientId = createdPatient.id || createdPatient._id;

      // Refresh patients list from server (patient is now auto-linked on the server)
      await fetchPatients();

      // Ensure the patient is in the local list (fallback in case server hasn't synced yet)
      setPatientsList(prev => {
        const alreadyExists = prev.some(p => (p.id === createdPatientId) || (p._id === createdPatientId));
        return alreadyExists ? prev : [...prev, createdPatient];
      });

      // Auto-select the new patient
      setPrescription({
        ...prescription,
        patientId: createdPatientId,
        patientEmail: createdPatient.email
      });

      // Close dialog and show success
      setNewPatientDialogOpen(false);
      setSuccess(false);
      setError('');
      
      // Show a temporary success message
      alert(`Patient "${createdPatient.firstName} ${createdPatient.lastName}" created successfully!\n\nDefault password: password123\n\nPlease inform the patient to change their password after first login.`);
    } catch (error) {
      console.error('Failed to create patient:', error);
      setNewPatientError(error.message || 'Failed to create patient');
    } finally {
      setCreatingPatient(false);
    }
  };
  
  const handleChange = (e) => {
    setPrescription({
      ...prescription,
      [e.target.name]: e.target.value
    });
  };

  // Handle vital signs changes
  const handleVitalChange = (field, value) => {
    setPrescription({
      ...prescription,
      vitalSigns: {
        ...prescription.vitalSigns,
        [field]: value
      }
    });
  };

  // Handle follow-up info changes
  const handleFollowUpInfoChange = (field, value) => {
    setPrescription({
      ...prescription,
      followUpInfo: {
        ...prescription.followUpInfo,
        [field]: value
      }
    });
  };

  // Generic add item to array
  const addToArray = (field, value, setter) => {
    if (value?.trim()) {
      setPrescription({
        ...prescription,
        [field]: [...(prescription[field] || []), value.trim()]
      });
      setter('');
    }
  };

  // Generic remove from array
  const removeFromArray = (field, index) => {
    const arr = prescription[field] || [];
    setPrescription({
      ...prescription,
      [field]: arr.filter((_, i) => i !== index)
    });
  };

  // Add investigation
  const addInvestigationItem = () => {
    if (newInvestigation.testName?.trim()) {
      setPrescription({
        ...prescription,
        investigations: [...(prescription.investigations || []), { ...newInvestigation }]
      });
      setNewInvestigation({ testName: '', reason: '', priority: '', fasting: '' });
    }
  };

  // Remove investigation
  const removeInvestigationItem = (index) => {
    setPrescription({
      ...prescription,
      investigations: (prescription.investigations || []).filter((_, i) => i !== index)
    });
  };

  // Add bring item to follow-up
  const addBringItem = () => {
    if (newBringItem?.trim()) {
      setPrescription({
        ...prescription,
        followUpInfo: {
          ...prescription.followUpInfo,
          bringItems: [...(prescription.followUpInfo?.bringItems || []), newBringItem.trim()]
        }
      });
      setNewBringItem('');
    }
  };

  // Remove bring item
  const removeBringItem = (index) => {
    setPrescription({
      ...prescription,
      followUpInfo: {
        ...prescription.followUpInfo,
        bringItems: (prescription.followUpInfo?.bringItems || []).filter((_, i) => i !== index)
      }
    });
  };
  
  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...prescription.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    
    setPrescription({
      ...prescription,
      medications: updatedMedications
    });
  };
  
  const addMedication = () => {
    setPrescription({
      ...prescription,
      medications: [
        ...prescription.medications,
        { name: '', dosage: '', frequency: '', timing: '', mealRelation: '', durationWeeks: '', durationDays: '' }
      ]
    });
  };
  
  const removeMedication = (index) => {
    if (prescription.medications.length === 1) {
      return; // Keep at least one medication field
    }
    
    const updatedMedications = prescription.medications.filter((_, i) => i !== index);
    setPrescription({
      ...prescription,
      medications: updatedMedications
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    // Validate form
  if (!(prescription.patientId || prescription.patientEmail) || !prescription.diagnosis || 
        prescription.medications.some(med => !med.name)) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    try {
      // Create prescription via API
      const response = await prescriptionsAPI.createPrescription(prescription);
      
      setLoading(false);
      setSuccess(true);
      
      // Scroll to top so user sees the success banner
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      if (onCreatePrescription) {
        onCreatePrescription(response.prescription);
      }
      
      // Reset form after successful submission
      setPrescription({
        patientId: '',
        patientEmail: '',
        diagnosis: '',
        medications: [
          { name: '', dosage: '', frequency: '', timing: '', durationWeeks: '', durationDays: '' }
        ],
        testsRequired: [],
        instructions: '',
        followUpWeeks: '',
        followUpDays: '',
        followUpDate: '',
        // Reset new comprehensive fields
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
    } catch (error) {
      setLoading(false);
      setError(error.message || 'Failed to create prescription');
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        Create New Prescription
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert 
          severity="success" 
          variant="filled"
          sx={{ 
            mb: 3, 
            fontSize: '1.1rem', 
            fontWeight: 'bold',
            '& .MuiAlert-icon': { fontSize: '1.5rem' },
            animation: 'fadeIn 0.5s ease-in',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(-10px)' },
              to: { opacity: 1, transform: 'translateY(0)' }
            }
          }}
          onClose={() => setSuccess(false)}
        >
          Prescription created successfully!
        </Alert>
      )}
      
      {loadingPatients && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading patients...</Typography>
        </Box>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Autocomplete
                sx={{ flexGrow: 1, minWidth: 250 }}
                options={patientsList}
                getOptionLabel={(option) => 
                  option ? `${option.firstName} ${option.lastName}` : ''
                }
                value={patientsList.find(p => (p.id === prescription.patientId) || (p._id === prescription.patientId)) || null}
                onChange={(event, newValue) => {
                  setPrescription({
                    ...prescription,
                    patientId: newValue?.id || newValue?._id || '',
                    patientEmail: newValue?.email || ''
                  });
                }}
                isOptionEqualToValue={(option, value) => (option.id === value?.id) || (option._id === value?._id)}
                noOptionsText={patientsList.length === 0 ? "No patients yet - Add a new or existing patient" : "No matching patients"}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Patient"
                    required
                    placeholder="Type to search your patients..."
                    helperText="Only showing patients you have prescribed to before"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id || option._id}>
                    <Box>
                      <Typography variant="body1">
                        {option.firstName} {option.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.email}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<PersonAddIcon />}
                  onClick={handleOpenNewPatientDialog}
                  sx={{ minWidth: 180, height: 40 }}
                  size="small"
                >
                  New Patient
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<PersonSearchIcon />}
                  onClick={handleOpenAddExistingPatientDialog}
                  sx={{ minWidth: 180, height: 40 }}
                  size="small"
                >
                  Add Existing
                </Button>
              </Box>
            </Box>
          </Grid>
          
          {/* Old Prescriptions Section - shows when patient is selected */}
          {prescription.patientId && (
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(25, 118, 210, 0.04)', 
                  border: '1px solid rgba(25, 118, 210, 0.2)',
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <HistoryIcon color="primary" />
                  <Typography variant="h6" color="primary">
                    Previous Prescriptions
                  </Typography>
                  {loadingPatientPrescriptions && <CircularProgress size={20} />}
                </Box>
                
                {patientPrescriptions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {loadingPatientPrescriptions ? 'Loading prescriptions...' : 'No previous prescriptions for this patient'}
                  </Typography>
                ) : (
                  <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    {patientPrescriptions.map((rx, index) => (
                      <Accordion 
                        key={rx._id || rx.id || index}
                        sx={{ 
                          mb: 1, 
                          '&:before': { display: 'none' },
                          boxShadow: 1
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {new Date(rx.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </Typography>
                            <Chip 
                              label={rx.diagnosis?.substring(0, 30) + (rx.diagnosis?.length > 30 ? '...' : '')} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Diagnosis:
                            </Typography>
                            <Typography variant="body2" paragraph>
                              {rx.diagnosis}
                            </Typography>
                            
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Medications:
                            </Typography>
                            {rx.medications?.map((med, medIndex) => (
                              <Box key={medIndex} sx={{ ml: 2, mb: 1 }}>
                                <Typography variant="body2">
                                  <strong>{med.name}</strong> - {med.dosage}
                                  {med.frequency && `, ${med.frequency}`}
                                  {med.timing && ` (${med.timing})`}
                                  {(med.durationWeeks || med.durationDays) && (
                                    <span>
                                      {' '}for {med.durationWeeks && `${med.durationWeeks} week(s)`}
                                      {med.durationDays && ` ${med.durationDays} day(s)`}
                                    </span>
                                  )}
                                </Typography>
                              </Box>
                            ))}
                            
                            {rx.testsRequired && rx.testsRequired.length > 0 && (
                              <>
                                <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 1 }}>
                                  Tests Required:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 2 }}>
                                  {rx.testsRequired.map((test, testIndex) => (
                                    <Chip key={testIndex} label={test} size="small" color="secondary" variant="outlined" />
                                  ))}
                                </Box>
                              </>
                            )}
                            
                            {rx.instructions && (
                              <>
                                <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 1 }}>
                                  Instructions:
                                </Typography>
                                <Typography variant="body2" sx={{ ml: 2 }}>
                                  {rx.instructions}
                                </Typography>
                              </>
                            )}
                            
                            {rx.followUpDate && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>Follow-up:</strong> {new Date(rx.followUpDate).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Diagnosis"
              name="diagnosis"
              multiline
              rows={2}
              value={prescription.diagnosis}
              onChange={handleChange}
            />
          </Grid>

          {/* Vital Signs Section */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  Vital Signs (Recorded at Consultation)
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
                      value={prescription.vitalSigns?.bloodPressure || ''}
                      onChange={(e) => handleVitalChange('bloodPressure', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Pulse"
                      placeholder="e.g., 72 bpm"
                      value={prescription.vitalSigns?.pulse || ''}
                      onChange={(e) => handleVitalChange('pulse', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Temperature"
                      placeholder="e.g., 98.6°F"
                      value={prescription.vitalSigns?.temperature || ''}
                      onChange={(e) => handleVitalChange('temperature', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="SPO2"
                      placeholder="e.g., 98%"
                      value={prescription.vitalSigns?.spo2 || ''}
                      onChange={(e) => handleVitalChange('spo2', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Respiratory Rate"
                      placeholder="e.g., 16/min"
                      value={prescription.vitalSigns?.respiratoryRate || ''}
                      onChange={(e) => handleVitalChange('respiratoryRate', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="BMI"
                      placeholder="e.g., 24.5"
                      value={prescription.vitalSigns?.bmi || ''}
                      onChange={(e) => handleVitalChange('bmi', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Pain Scale"
                      placeholder="e.g., 6/10"
                      value={prescription.vitalSigns?.painScale || ''}
                      onChange={(e) => handleVitalChange('painScale', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Clinical Notes Section */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  Chief Complaints & Clinical Notes
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
                      {(prescription.presentingComplaints || []).map((item, idx) => (
                        <Chip key={idx} label={item} onDelete={() => removeFromArray('presentingComplaints', idx)} />
                      ))}
                    </Box>
                  </Grid>

                  {/* Clinical Findings */}
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
                      {(prescription.clinicalFindings || []).map((item, idx) => (
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
                      {(prescription.provisionalDiagnosis || []).map((item, idx) => (
                        <Chip key={idx} label={item} color="primary" variant="outlined" onDelete={() => removeFromArray('provisionalDiagnosis', idx)} />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Medical History Section */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  Medical History
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
                      {(prescription.currentMedications || []).map((item, idx) => (
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
                      {(prescription.pastSurgicalHistory || []).map((item, idx) => (
                        <Chip key={idx} label={item} size="small" onDelete={() => removeFromArray('pastSurgicalHistory', idx)} />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Medications
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            {prescription.medications.map((medication, index) => (
              <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      freeSolo
                      options={medicationSuggestions[index] || []}
                      loading={loadingMedications[index] || false}
                      value={medication.name}
                      onInputChange={(event, newInputValue) => {
                        handleMedicationChange(index, 'name', newInputValue);
                        searchMedications(newInputValue, index);
                      }}
                      onChange={(event, newValue) => {
                        handleMedicationChange(index, 'name', newValue || '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          required
                          label="Medication Name"
                          placeholder="Start typing to search..."
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingMedications[index] ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Dosage"
                      placeholder="e.g., 500mg, 1-0-1, 5ml"
                      value={medication.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Frequency</InputLabel>
                      <Select
                        value={medication.frequency}
                        onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                        label="Frequency"
                      >
                        <MenuItem value="1">Once a day</MenuItem>
                        <MenuItem value="2">Twice a day</MenuItem>
                        <MenuItem value="3">Three times a day</MenuItem>
                        <MenuItem value="4">Four times a day</MenuItem>
                        <MenuItem value="SOS">As needed (SOS)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Meal Relation</Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      {[
                        { key: 'with_food',     label: 'With Food',     icon: <WithFoodIcon sx={{ fontSize: 18 }} />,     color: '#1565c0', bg: '#e3f2fd', hoverBg: '#bbdefb', border: '#1565c0' },
                        { key: 'before_food',   label: 'Before Food',   icon: <BeforeFoodIcon sx={{ fontSize: 18 }} />,   color: '#e65100', bg: '#fff3e0', hoverBg: '#ffe0b2', border: '#e65100' },
                        { key: 'after_food',    label: 'After Food',    icon: <AfterFoodIcon sx={{ fontSize: 18 }} />,    color: '#6a1b9a', bg: '#f3e5f5', hoverBg: '#e1bee7', border: '#6a1b9a' },
                        { key: 'empty_stomach', label: 'Empty Stomach', icon: <EmptyStomachIcon sx={{ fontSize: 18 }} />, color: '#00695c', bg: '#e0f2f1', hoverBg: '#b2dfdb', border: '#00695c' },
                        { key: 'any_time',      label: 'Any Time',      icon: <AnyTimeIcon sx={{ fontSize: 18 }} />,      color: '#37474f', bg: '#eceff1', hoverBg: '#cfd8dc', border: '#37474f' }
                      ].map((option) => {
                        const isSelected = medication.mealRelation === option.label;
                        return (
                          <Box
                            key={option.key}
                            onClick={() => handleMedicationChange(index, 'mealRelation', isSelected ? '' : option.label)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.75,
                              px: 2,
                              py: 0.75,
                              borderRadius: '20px',
                              border: isSelected ? `2px solid ${option.border}` : '2px solid #e0e0e0',
                              backgroundColor: isSelected ? option.bg : 'transparent',
                              color: isSelected ? option.color : 'text.secondary',
                              fontWeight: isSelected ? 600 : 400,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              userSelect: 'none',
                              '&:hover': {
                                backgroundColor: isSelected ? option.hoverBg : '#f5f5f5',
                                borderColor: option.border,
                                color: option.color
                              }
                            }}
                          >
                            {option.icon}
                            {option.label}
                          </Box>
                        );
                      })}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Time of Day</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {[
                        { key: 'morning', label: 'Morning', icon: <MorningIcon sx={{ color: '#FFA726' }} /> },
                        { key: 'afternoon', label: 'Afternoon', icon: <AfternoonIcon sx={{ color: '#FFD54F' }} /> },
                        { key: 'evening', label: 'Evening', icon: <EveningIcon sx={{ color: '#FF7043' }} /> },
                        { key: 'night', label: 'Night', icon: <NightIcon sx={{ color: '#5C6BC0' }} /> }
                      ].map((time) => {
                        const timings = medication.timing ? medication.timing.split(', ') : [];
                        const isSelected = timings.includes(time.label);
                        return (
                          <Tooltip key={time.key} title={time.label}>
                            <Box
                              onClick={() => {
                                let newTimings;
                                if (isSelected) {
                                  newTimings = timings.filter(t => t !== time.label);
                                } else {
                                  newTimings = [...timings, time.label];
                                }
                                handleMedicationChange(index, 'timing', newTimings.join(', '));
                              }}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: isSelected ? '2px solid #1976d2' : '2px solid #e0e0e0',
                                backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  backgroundColor: isSelected ? '#bbdefb' : '#f5f5f5',
                                  borderColor: '#1976d2'
                                }
                              }}
                            >
                              {time.icon}
                              <Typography variant="caption" sx={{ mt: 0.5 }}>{time.label}</Typography>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={5}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <FormControl sx={{ minWidth: 100 }}>
                        <InputLabel>Weeks</InputLabel>
                        <Select
                          value={medication.durationWeeks || ''}
                          onChange={(e) => handleMedicationChange(index, 'durationWeeks', e.target.value)}
                          label="Weeks"
                        >
                          <MenuItem value="">0</MenuItem>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <MenuItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'week' : 'weeks'}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl sx={{ minWidth: 100 }}>
                        <InputLabel>Days</InputLabel>
                        <Select
                          value={medication.durationDays || ''}
                          onChange={(e) => handleMedicationChange(index, 'durationDays', e.target.value)}
                          label="Days"
                        >
                          <MenuItem value="">0</MenuItem>
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <MenuItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'day' : 'days'}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={1}>
                    <IconButton 
                      color="error" 
                      onClick={() => removeMedication(index)}
                      aria-label="remove medication"
                      disabled={prescription.medications.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={addMedication}
              variant="outlined"
              sx={{ mt: 1 }}
            >
              Add Medication
            </Button>
          </Grid>
          
          {/* Tests Required Section */}
          <Grid item xs={12}>
            <Accordion 
              defaultExpanded={false}
              sx={{ 
                backgroundColor: 'rgba(156, 39, 176, 0.04)', 
                border: '1px solid rgba(156, 39, 176, 0.2)',
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                boxShadow: 'none'
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon color="secondary" />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScienceIcon color="secondary" />
                  <Typography variant="h6" color="secondary">
                    Tests Required
                  </Typography>
                  {prescription.testsRequired.length > 0 && (
                    <Chip 
                      label={prescription.testsRequired.length} 
                      color="secondary" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
              
              <FormGroup row sx={{ gap: 1 }}>
                {availableTests.map((test) => (
                  <FormControlLabel
                    key={test}
                    control={
                      <Checkbox
                        checked={prescription.testsRequired.includes(test)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPrescription(prev => ({
                              ...prev,
                              testsRequired: [...prev.testsRequired, test]
                            }));
                          } else {
                            setPrescription(prev => ({
                              ...prev,
                              testsRequired: prev.testsRequired.filter(t => t !== test)
                            }));
                          }
                        }}
                        size="small"
                      />
                    }
                    label={test}
                    sx={{ 
                      minWidth: 140,
                      '& .MuiFormControlLabel-label': { fontSize: '0.9rem' }
                    }}
                  />
                ))}
              </FormGroup>

              {/* Others – custom test input */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <TextField
                  size="small"
                  label="Other (specify test)"
                  placeholder="e.g., Serum Ferritin"
                  value={newCustomTest}
                  onChange={(e) => setNewCustomTest(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = newCustomTest.trim();
                      if (trimmed && !prescription.testsRequired.includes(trimmed)) {
                        setPrescription(prev => ({
                          ...prev,
                          testsRequired: [...prev.testsRequired, trimmed]
                        }));
                        setNewCustomTest('');
                      }
                    }
                  }}
                  sx={{ minWidth: 240 }}
                />
                <IconButton
                  color="secondary"
                  onClick={() => {
                    const trimmed = newCustomTest.trim();
                    if (trimmed && !prescription.testsRequired.includes(trimmed)) {
                      setPrescription(prev => ({
                        ...prev,
                        testsRequired: [...prev.testsRequired, trimmed]
                      }));
                      setNewCustomTest('');
                    }
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              {prescription.testsRequired.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', mr: 1 }}>
                    Selected:
                  </Typography>
                  {prescription.testsRequired.map((test, index) => (
                    <Chip 
                      key={index}
                      label={test}
                      onDelete={() => {
                        setPrescription(prev => ({
                          ...prev,
                          testsRequired: prev.testsRequired.filter(t => t !== test)
                        }));
                      }}
                      color="secondary"
                      size="small"
                    />
                  ))}
                </Box>
              )}

              </AccordionDetails>
            </Accordion>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Special Instructions"
              name="instructions"
              multiline
              rows={3}
              value={prescription.instructions}
              onChange={handleChange}
            />
          </Grid>
          


          {/* Medication Notes Section */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  Important Medication Notes
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
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
                  {(prescription.medicationNotes || []).map((item, idx) => (
                    <Chip key={idx} label={item} color="warning" variant="outlined" size="small" onDelete={() => removeFromArray('medicationNotes', idx)} />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Detailed Investigations Section */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  Detailed Investigations
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Add Investigation</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Test Name"
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
                      <Button variant="contained" fullWidth onClick={addInvestigationItem} sx={{ height: '40px' }}>
                        <AddIcon />
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
                {(prescription.investigations || []).length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    {prescription.investigations.map((inv, idx) => (
                      <Box key={idx} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2"><strong>{idx + 1}. {inv.testName}</strong> - {inv.reason}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            Priority: {inv.priority || 'N/A'} | Fasting: {inv.fasting || 'Not required'}
                          </Typography>
                        </Box>
                        <IconButton size="small" color="error" onClick={() => removeInvestigationItem(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
                <TextField
                  fullWidth
                  size="small"
                  label="Investigation Notes"
                  placeholder="e.g., Please bring all test reports to the follow-up appointment"
                  value={prescription.investigationNotes || ''}
                  onChange={(e) => setPrescription({ ...prescription, investigationNotes: e.target.value })}
                />
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Dietary & Lifestyle Recommendations */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  Dietary & Lifestyle Recommendations
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
                      {(prescription.dietModifications || []).map((item, idx) => (
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
                      {(prescription.lifestyleChanges || []).map((item, idx) => (
                        <Chip key={idx} label={item} color="info" variant="outlined" size="small" onDelete={() => removeFromArray('lifestyleChanges', idx)} />
                      ))}
                    </Box>
                  </Grid>

                  {/* Warning Signs */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'error.main' }}>
                      Warning Signs - Seek Immediate Medical Attention if:
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
                      {(prescription.warningSigns || []).map((item, idx) => (
                        <Chip key={idx} label={item} color="error" variant="outlined" size="small" onDelete={() => removeFromArray('warningSigns', idx)} />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Enhanced Follow-up Information */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  Follow-up Details
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Appointment Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: new Date().toISOString().split('T')[0] }}
                      value={prescription.followUpInfo?.appointmentDate || ''}
                      onChange={(e) => handleFollowUpInfoChange('appointmentDate', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ border: '1px solid rgba(0,0,0,0.23)', borderRadius: 1, px: 1.75, height: 40, position: 'relative', display: 'flex', alignItems: 'center', '&:hover': { borderColor: 'text.primary' } }}>
                      <Typography variant="caption" sx={{ position: 'absolute', top: -9, left: 10, bgcolor: 'background.paper', px: 0.5, color: 'text.secondary', lineHeight: 1, fontSize: '0.78rem' }}>
                        Appointment Time
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <FormControl variant="standard" sx={{ minWidth: 56 }}>
                          <Select
                            disableUnderline
                            displayEmpty
                            value={(() => {
                              const t = prescription.followUpInfo?.appointmentTime || '';
                              if (!t) return '';
                              const h = parseInt(t.split(':')[0]);
                              if (isNaN(h)) return '';
                              const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                              return String(h12);
                            })()}
                            onChange={(e) => {
                              const t = prescription.followUpInfo?.appointmentTime || '12:00 AM';
                              const colonIdx = t.indexOf(':');
                              const rest = colonIdx >= 0 ? t.slice(colonIdx + 1) : '00 AM';
                              const minStr = rest.slice(0, 2) || '00';
                              const ampm = t.toUpperCase().includes('PM') ? 'PM' : 'AM';
                              handleFollowUpInfoChange('appointmentTime', `${e.target.value}:${minStr} ${ampm}`);
                            }}
                            renderValue={(v) => v ? String(v).padStart(2, '0') : <span style={{ color: '#aaa' }}>HH</span>}
                            sx={{ fontSize: '1.1rem', fontWeight: 600, '& .MuiSelect-select': { py: 0, pr: '24px !important' } }}
                            MenuProps={{ PaperProps: { sx: { '& .MuiMenuItem-root': { fontSize: '1.05rem', minHeight: 44, justifyContent: 'center' } } } }}
                          >
                            {[...Array(12)].map((_, i) => (
                              <MenuItem key={i + 1} value={String(i + 1)}>{String(i + 1).padStart(2, '0')}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', lineHeight: 1 }}>:</Typography>
                        <FormControl variant="standard" sx={{ minWidth: 56 }}>
                          <Select
                            disableUnderline
                            displayEmpty
                            value={(() => {
                              const t = prescription.followUpInfo?.appointmentTime || '';
                              if (!t) return '';
                              const colonIdx = t.indexOf(':');
                              if (colonIdx < 0) return '';
                              const minStr = t.slice(colonIdx + 1, colonIdx + 3);
                              const minNum = parseInt(minStr);
                              if (isNaN(minNum)) return '';
                              return String(Math.round(minNum / 5) * 5 % 60).padStart(2, '0');
                            })()}
                            onChange={(e) => {
                              const t = prescription.followUpInfo?.appointmentTime || '12:00 AM';
                              const hr = t.split(':')[0] || '12';
                              const ampm = t.toUpperCase().includes('PM') ? 'PM' : 'AM';
                              handleFollowUpInfoChange('appointmentTime', `${hr}:${e.target.value} ${ampm}`);
                            }}
                            renderValue={(v) => v !== '' ? v : <span style={{ color: '#aaa' }}>MM</span>}
                            sx={{ fontSize: '1.1rem', fontWeight: 600, '& .MuiSelect-select': { py: 0, pr: '24px !important' } }}
                            MenuProps={{ PaperProps: { sx: { '& .MuiMenuItem-root': { fontSize: '1.05rem', minHeight: 44, justifyContent: 'center' } } } }}
                          >
                            {[...Array(12)].map((_, i) => {
                              const m = String(i * 5).padStart(2, '0');
                              return <MenuItem key={m} value={m}>{m}</MenuItem>;
                            })}
                          </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', ml: 1, borderRadius: 1.5, overflow: 'hidden', border: '1.5px solid', borderColor: 'primary.main' }}>
                          {['AM', 'PM'].map((period) => {
                            const current = (() => {
                              const t = (prescription.followUpInfo?.appointmentTime || '').toUpperCase();
                              return t.includes('PM') ? 'PM' : 'AM';
                            })();
                            const isActive = current === period;
                            return (
                              <Button
                                key={period}
                                onClick={() => {
                                  const t = prescription.followUpInfo?.appointmentTime || '12:00 AM';
                                  const parts = t.split(' ');
                                  handleFollowUpInfoChange('appointmentTime', `${parts[0]} ${period}`);
                                }}
                                sx={{
                                  px: 1.5, py: 0.4, minWidth: 48, minHeight: 30, borderRadius: 0,
                                  bgcolor: isActive ? 'primary.main' : 'transparent',
                                  color: isActive ? '#fff' : 'primary.main',
                                  fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.04em',
                                  '&:hover': { bgcolor: isActive ? 'primary.dark' : 'primary.50' },
                                  border: 'none', transition: 'background 0.15s'
                                }}
                              >
                                {period}
                              </Button>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Emergency Helpline"
                      placeholder="e.g., +91-9876543299"
                      value={prescription.emergencyHelpline || ''}
                      onChange={(e) => setPrescription({ ...prescription, emergencyHelpline: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Purpose of Follow-up"
                      placeholder="e.g., Review test results and assess treatment response"
                      value={prescription.followUpInfo?.purpose || ''}
                      onChange={(e) => handleFollowUpInfoChange('purpose', e.target.value)}
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
                      {(prescription.followUpInfo?.bringItems || []).map((item, idx) => (
                        <Chip key={idx} label={item} size="small" onDelete={() => removeBringItem(idx)} />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Additional Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Additional Notes"
              name="notes"
              multiline
              rows={2}
              placeholder="Any additional notes for this prescription..."
              value={prescription.notes || ''}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            startIcon={<QrCodeIcon />}
            disabled={loading || loadingPatients}
            sx={{ minWidth: 200 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Prescription'}
          </Button>
        </Box>
      </Box>

      {/* New Patient Dialog */}
      <Dialog open={newPatientDialogOpen} onClose={handleCloseNewPatientDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="primary" />
            Create New Patient
          </Box>
        </DialogTitle>
        <DialogContent>
          {newPatientError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {newPatientError}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            Create a new patient account. The patient will be able to login with the email provided and default password: <strong>password123</strong>
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="First Name"
                name="firstName"
                value={newPatientData.firstName}
                onChange={handleNewPatientChange}
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Last Name"
                name="lastName"
                value={newPatientData.lastName}
                onChange={handleNewPatientChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Email"
                name="email"
                type="email"
                value={newPatientData.email}
                onChange={handleNewPatientChange}
                helperText="Patient will use this email to login"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={newPatientData.phone}
                onChange={handleNewPatientChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={newPatientData.dateOfBirth}
                onChange={handleNewPatientChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={newPatientData.gender}
                  onChange={handleNewPatientChange}
                  label="Gender"
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={newPatientData.address}
                onChange={handleNewPatientChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseNewPatientDialog} disabled={creatingPatient}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateNewPatient}
            disabled={creatingPatient}
            startIcon={creatingPatient ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {creatingPatient ? 'Creating...' : 'Create Patient'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Existing Patient Dialog */}
      <Dialog open={addExistingPatientDialogOpen} onClose={handleCloseAddExistingPatientDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonSearchIcon color="secondary" />
          Add Existing Patient
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            Find a patient by entering their ID, scanning their QR code, or uploading a QR image.
          </Typography>
          
          {/* Tabs for different input methods */}
          <Tabs 
            value={lookupTabValue} 
            onChange={async (e, newValue) => {
              // Stop camera when switching tabs
              if (lookupTabValue === 1 && newValue !== 1) {
                await stopCameraAsync();
              }
              setLookupTabValue(newValue);
              setCameraError('');
            }}
            variant="fullWidth"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<PersonSearchIcon />} label="Manual" iconPosition="start" />
            <Tab icon={<CameraAltIcon />} label="Scan QR" iconPosition="start" />
            <Tab icon={<UploadFileIcon />} label="Upload QR" iconPosition="start" />
          </Tabs>

          {lookupError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {lookupError}
            </Alert>
          )}

          {cameraError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {cameraError}
            </Alert>
          )}

          {/* Manual Entry Tab */}
          {lookupTabValue === 0 && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                label="Patient ID"
                value={patientIdToLookup}
                onChange={(e) => setPatientIdToLookup(e.target.value)}
                placeholder="Enter patient ID"
                helperText="Ask the patient to share their Patient ID from their profile"
                disabled={lookingUpPatient}
              />
              <Button
                variant="contained"
                onClick={handleLookupPatient}
                disabled={lookingUpPatient || !patientIdToLookup.trim()}
                sx={{ height: 56, minWidth: 120 }}
              >
                {lookingUpPatient ? <CircularProgress size={24} /> : 'Look Up'}
              </Button>
            </Box>
          )}

          {/* Camera Scan Tab */}
          {lookupTabValue === 1 && (
            <Box sx={{ textAlign: 'center' }}>
              <Box 
                sx={{ 
                  width: '100%', 
                  maxWidth: 400, 
                  mx: 'auto', 
                  mb: 2,
                  minHeight: 300,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {/* This div is managed by html5-qrcode - keep it outside React's control */}
                <div 
                  id="qr-reader" 
                  style={{ 
                    width: '100%', 
                    height: '100%',
                    position: isCameraActive ? 'relative' : 'absolute'
                  }}
                />
                {!isCameraActive && (
                  <Typography color="text.secondary" sx={{ position: 'absolute' }}>
                    Click "Start Camera" to begin scanning
                  </Typography>
                )}
              </Box>
              
              {!isCameraActive ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CameraAltIcon />}
                  onClick={startCamera}
                  size="large"
                >
                  Start Camera
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={stopCamera}
                  size="large"
                >
                  Stop Camera
                </Button>
              )}
              
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2 }}>
                Point your camera at the patient's QR code
              </Typography>
            </Box>
          )}

          {/* File Upload Tab */}
          {lookupTabValue === 2 && (
            <Box sx={{ textAlign: 'center' }}>
              {/* Hidden div for html5-qrcode file scanning */}
              <div id="qr-file-reader" style={{ display: 'none' }}></div>
              
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="qr-file-input"
              />
              
              <Box 
                sx={{ 
                  border: '2px dashed',
                  borderColor: 'grey.400',
                  borderRadius: 2,
                  p: 4,
                  mb: 2,
                  bgcolor: 'grey.50',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadFileIcon sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  Click to upload a QR code image
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supports JPG, PNG, GIF
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                size="large"
              >
                Choose Image
              </Button>
            </Box>
          )}

          {/* Scanned ID display */}
          {patientIdToLookup && lookupTabValue !== 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.light' }}>
              <Typography variant="caption" color="info.main">Scanned Patient ID:</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {patientIdToLookup}
              </Typography>
            </Box>
          )}

          {foundPatient && (
            <Paper elevation={2} sx={{ mt: 3, p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main' }}>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                Patient Found!
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  <Typography variant="h6">
                    {foundPatient.firstName} {foundPatient.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {foundPatient.email}
                  </Typography>
                  {foundPatient.contactNumber && (
                    <Typography variant="body2" color="text.secondary">
                      Phone: {foundPatient.contactNumber}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAddExistingPatientDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddFoundPatient}
            disabled={!foundPatient}
            startIcon={<PersonAddIcon />}
          >
            Add Patient
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PrescriptionForm;
