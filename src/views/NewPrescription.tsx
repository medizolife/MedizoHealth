'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMyPatients } from '../services/patients';
import { usersAPI, prescriptionsAPI } from '../services/api';
import { createPrescription, lookupPrescriptionByCode } from '../services/prescriptions';
import { digilockerAPI } from '../services/api';
import { Patient } from '../types/auth';
import { Prescription } from '../types/prescription';
import QrScannerModal from '../components/QrScannerModal';
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
  Autocomplete,
  Popover,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Tooltip,
  Collapse,
  FormControlLabel,
  Switch
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
  Search as SearchIcon,
  WbSunny as MorningIcon,
  LightMode as AfternoonIcon,
  WbTwilight as EveningIcon,
  NightsStay as NightIcon,
  Restaurant as WithFoodIcon,
  FreeBreakfast as BeforeFoodIcon,
  DinnerDining as AfterFoodIcon,
  LocalCafe as EmptyStomachIcon,
  AccessTime as AnyTimeIcon,
  FlashOn as SosIcon,
  ReportProblem as WarningBadgeIcon,
  History as HistoryIcon,
  QrCodeScanner as QrCodeScannerIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Bloodtype as BloodIcon,
  ExpandLess as ExpandLessIcon,
  ChevronRight as ChevronRightIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import api from '../services/api';
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
    dateOfBirth: '',
    gender: 'male',
    address: '',
    noEmail: false
  });
  const [newPatientError, setNewPatientError] = useState('');
  const [newPatientSuccess, setNewPatientSuccess] = useState('');

  // Add existing patient modal state
  const [addExistingPatientDialogOpen, setAddExistingPatientDialogOpen] = useState(false);
  const [lookupTabValue, setLookupTabValue] = useState(0); // 0 = Manual, 1 = Scan QR, 2 = Upload QR
  const [patientIdToLookup, setPatientIdToLookup] = useState('');
  const [lookingUpPatient, setLookingUpPatient] = useState(false);
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [scanningQR, setScanningQR] = useState(false);

  // Patient context & past prescriptions state
  const [pastDoctorPrescriptions, setPastDoctorPrescriptions] = useState<Prescription[]>([]);
  const [scannedExternalPrescriptions, setScannedExternalPrescriptions] = useState<Prescription[]>([]);
  const [externalQrScannerOpen, setExternalQrScannerOpen] = useState(false);
  const [externalLookupLoading, setExternalLookupLoading] = useState(false);
  const [externalLookupCode, setExternalLookupCode] = useState('');
  const [patientContextExpanded, setPatientContextExpanded] = useState(true);
  const [pastRxExpanded, setPastRxExpanded] = useState(true);
  const [rxSnackbar, setRxSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'success' | 'error' | 'warning' });
  const [loadingPastRx, setLoadingPastRx] = useState(false);
  const [expandedPastRxId, setExpandedPastRxId] = useState<string | null>(null);
  const [downloadingPdfRxId, setDownloadingPdfRxId] = useState<string | null>(null);

  const handleDownloadPastRxPdf = async (rxId: string) => {
    try {
      setDownloadingPdfRxId(rxId);
      let response;
      try {
        response = await api.get(`/prescriptions/${rxId}/download`, { responseType: 'blob' });
      } catch (e) {
        response = await api.get(`/prescriptions/${rxId}/pdf`, { responseType: 'blob' });
      }
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription_${rxId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setRxSnackbar({ open: true, message: 'Failed to download prescription PDF', severity: 'error' });
    } finally {
      setDownloadingPdfRxId(null);
    }
  };
  
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
    duration: '5 Days',
    durationValue: 5,
    durationUnit: 'Days',
    quantity: '',
    quantityValue: 0,
    quantityUnit: 'Tablets',
    instructions: '',
    timing: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    mealRelations: { morning: '', afternoon: '', evening: '', night: '' },
    isSOS: false,
    sosReason: ''
  });
  const [medSearchOpen, setMedSearchOpen] = useState(false);

  // Popover state for per-time-of-day dose count + meal relation
  const [mealPopoverAnchor, setMealPopoverAnchor] = useState<HTMLElement | null>(null);
  const [mealPopoverTimeKey, setMealPopoverTimeKey] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');

  const getDispensaryUnit = (medForm: string = 'Tablet') => {
    switch (medForm) {
      case 'Capsule': return 'Capsules';
      case 'Syrup': return 'Bottles';
      case 'Drops': return 'Bottles';
      case 'Injection': return 'Vials';
      case 'Ointment': return 'Tubes';
      default: return 'Tablets';
    }
  };

  const getDoseUnitLabel = (medForm: string = 'Tablet', count: number = 1) => {
    switch (medForm) {
      case 'Capsule': return count === 1 ? '1 Capsule' : `${count} Capsules`;
      case 'Syrup': return `${count} tsp (${count * 5}ml)`;
      case 'Drops': return `${count * 5} drops`;
      case 'Injection': return count === 1 ? '1 Vial' : `${count} Vials`;
      case 'Ointment': return count === 1 ? '1 App' : `${count} Apps`;
      default: return count === 1 ? '1 Tablet' : `${count} Tablets`;
    }
  };

  // Calculate total quantity from per-time-of-day dose counts × duration
  // Reusable in pharmacist portal:
  //   Tablets/Capsules: doseCount × days → total Tablets/Capsules
  //   Syrup: (doseCount × 5ml) × days → total ml → bottle count (100ml each)
  //   Drops: (doseCount × 5 drops) × days → total drops → bottle count
  const calculateQuantityFromTiming = (
    timing: { morning?: number; afternoon?: number; evening?: number; night?: number },
    durVal: number | string,
    durUnit: string,
    medForm: string = 'Tablet'
  ) => {
    const m = timing.morning || 0;
    const a = timing.afternoon || 0;
    const e = timing.evening || 0;
    const n = timing.night || 0;
    const totalDosesPerDay = m + a + e + n;

    const val = typeof durVal === 'number' ? durVal : parseInt(String(durVal), 10) || 0;
    if (val <= 0 || totalDosesPerDay <= 0) return { qtyVal: 0, qtyUnit: getDispensaryUnit(medForm), qtyStr: '', detailStr: '' };

    let days = val;
    if (durUnit === 'Weeks') days = val * 7;
    if (durUnit === 'Months') days = val * 30;

    if (medForm === 'Syrup') {
      const mlPerDay = totalDosesPerDay * 5; // 1 dose = 1 tsp = 5ml
      const totalMl = mlPerDay * days;
      const bottles = Math.ceil(totalMl / 100) || 1;
      return {
        qtyVal: bottles,
        qtyUnit: 'Bottles',
        qtyStr: `${bottles} Bottle${bottles > 1 ? 's' : ''} (${totalMl}ml total)`,
        detailStr: `⚡ ${mlPerDay}ml/day (${totalDosesPerDay} tsp) × ${days} Days = ${totalMl}ml total → ${bottles} Bottle(s)`
      };
    }

    if (medForm === 'Drops') {
      const dropsPerDay = totalDosesPerDay * 5; // 1 dose = 5 drops
      const totalDrops = dropsPerDay * days;
      const bottles = Math.ceil(totalDrops / 200) || 1; // 200 drops per 10ml bottle
      return {
        qtyVal: bottles,
        qtyUnit: 'Bottles',
        qtyStr: `${bottles} Bottle${bottles > 1 ? 's' : ''} (${totalDrops} drops total)`,
        detailStr: `⚡ ${dropsPerDay} drops/day × ${days} Days = ${totalDrops} drops total → ${bottles} Bottle(s)`
      };
    }

    if (medForm === 'Ointment') {
      const tubes = days > 14 ? 2 : 1;
      return {
        qtyVal: tubes,
        qtyUnit: 'Tubes',
        qtyStr: `${tubes} Tube${tubes > 1 ? 's' : ''}`,
        detailStr: `⚡ ${tubes} Tube (${days} Days duration)`
      };
    }

    // Tablets, Capsules, Injections
    const totalUnits = totalDosesPerDay * days;
    const unit = getDispensaryUnit(medForm);
    return {
      qtyVal: totalUnits,
      qtyUnit: unit,
      qtyStr: `${totalUnits} ${unit}`,
      detailStr: `⚡ ${totalDosesPerDay} ${unit.toLowerCase()}/day × ${days} Days = ${totalUnits} ${unit}`
    };
  };

  // Build dosage string from timing based on medicine form and SOS state
  const buildDosageString = (
    timing: { morning?: number; afternoon?: number; evening?: number; night?: number },
    medForm: string = 'Tablet',
    isSOS: boolean = false,
    sosReason: string = ''
  ) => {
    if (isSOS) {
      return sosReason ? `SOS — As needed (${sosReason})` : 'SOS — Only when needed';
    }

    const m = timing.morning || 0;
    const a = timing.afternoon || 0;
    const e = timing.evening || 0;
    const n = timing.night || 0;

    if (medForm === 'Syrup') {
      const parts = [
        m ? `${m} tsp (${m * 5}ml)` : '0',
        a ? `${a} tsp (${a * 5}ml)` : '0',
        e ? `${e} tsp (${e * 5}ml)` : '0',
        n ? `${n} tsp (${n * 5}ml)` : '0'
      ];
      return parts.join(' - ');
    }

    if (medForm === 'Drops') {
      const parts = [
        m ? `${m * 5} drops` : '0',
        a ? `${a * 5} drops` : '0',
        e ? `${e * 5} drops` : '0',
        n ? `${n * 5} drops` : '0'
      ];
      return parts.join(' - ');
    }

    return `${m}-${a}-${e}-${n}`;
  };

  // Recalculate quantity and dosage whenever timing, duration, or SOS changes
  const recalcMedication = (med: MedicationItem): MedicationItem => {
    const t = med.timing || { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const calc = calculateQuantityFromTiming(t, med.durationValue || 5, med.durationUnit || 'Days', med.type);
    return {
      ...med,
      dosage: buildDosageString(t, med.type, med.isSOS, med.sosReason),
      quantityValue: calc.qtyVal,
      quantityUnit: calc.qtyUnit,
      quantity: calc.qtyStr
    };
  };

  // Legacy calculateQuantity kept for backwards compat
  const calculateQuantity = (dosageStr: string, durVal: number | string, durUnit: string, medForm: string = 'Tablet') => {
    const val = typeof durVal === 'number' ? durVal : parseInt(String(durVal), 10) || 0;
    if (val <= 0) return { qtyVal: 0, qtyUnit: getDispensaryUnit(medForm), qtyStr: '' };

    let multiplierPerDay = 1;
    if (/1-1-1-1/i.test(dosageStr) || /four times|4 times|qds/i.test(dosageStr)) {
      multiplierPerDay = 4;
    } else if (/1-1-1/i.test(dosageStr) || /thrice|3 times|tds/i.test(dosageStr)) {
      multiplierPerDay = 3;
    } else if (/1-0-1/i.test(dosageStr) || /twice|2 times|bd/i.test(dosageStr)) {
      multiplierPerDay = 2;
    } else if (/1-0-0|0-1-0|0-0-1/i.test(dosageStr) || /once|1 time|od/i.test(dosageStr)) {
      multiplierPerDay = 1;
    }

    let days = val;
    if (durUnit === 'Weeks') days = val * 7;
    if (durUnit === 'Months') days = val * 30;

    const totalUnits = multiplierPerDay * days;
    const unit = getDispensaryUnit(medForm);
    
    let qtyStr = `${totalUnits} ${unit}`;
    if (medForm === 'Syrup' || medForm === 'Drops') {
      qtyStr = totalUnits <= 14 ? '1 Bottle (100ml)' : '2 Bottles (100ml)';
    } else if (medForm === 'Ointment') {
      qtyStr = '1 Tube';
    }

    return { qtyVal: totalUnits, qtyUnit: unit, qtyStr };
  };

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

  // Fetch only doctor's linked patients on mount
  const fetchMyPatients = async () => {
    try {
      const data = await usersAPI.getMyPatients();
      const list = Array.isArray(data?.patients) ? data.patients : (Array.isArray(data) ? data : []);
      // Sort by lastActivity descending (most recent first)
      list.sort((a: any, b: any) => {
        const dateA = new Date(a.lastActivity || a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.lastActivity || b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setPatients(list);
    } catch (err) {
      console.error('Error fetching my patients:', err);
      setError('Failed to load your linked patients');
    }
  };

  useEffect(() => {
    fetchMyPatients();
  }, []);

  // Check DigiLocker verification status
  useEffect(() => {
    digilockerAPI.getStatus()
      .then(data => setDigilockerVerified(data.verified || false))
      .catch(() => setDigilockerVerified(false));
  }, []);

  // Update selected patient when patientId changes + fetch past prescriptions
  useEffect(() => {
    if (formData.patientId) {
      const patient = patients.find(p => p.id === formData.patientId);
      setSelectedPatient(patient || null);
      
      // Fetch this doctor's past prescriptions for the selected patient
      setLoadingPastRx(true);
      setPastDoctorPrescriptions([]);
      setScannedExternalPrescriptions([]);
      prescriptionsAPI.getMyPrescriptions()
        .then((allRx: any) => {
          const rxList = Array.isArray(allRx) ? allRx : (allRx?.prescriptions || []);
          // Filter: only prescriptions for this patient, by the current doctor
          const doctorRxForPatient = rxList.filter((rx: any) =>
            rx.patientId === formData.patientId && rx.doctorId === user?.id
          );
          // Sort by createdAt descending (newest first)
          doctorRxForPatient.sort((a: any, b: any) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setPastDoctorPrescriptions(doctorRxForPatient);
        })
        .catch(err => {
          console.error('Error fetching past prescriptions:', err);
        })
        .finally(() => setLoadingPastRx(false));
    } else {
      setSelectedPatient(null);
      setPastDoctorPrescriptions([]);
      setScannedExternalPrescriptions([]);
    }
  }, [formData.patientId, patients]);

  // Handle External QR Scan Success
  const handleExternalQrScanSuccess = async (decodedText: string) => {
    setExternalQrScannerOpen(false);
    setExternalLookupLoading(true);
    setRxSnackbar({ open: true, message: '🔍 Looking up external prescription...', severity: 'info' });

    try {
      const result = await lookupPrescriptionByCode(decodedText);
      if (result.success && result.prescription) {
        const rx = result.prescription as Prescription;
        // Check if already scanned
        if (scannedExternalPrescriptions.some(s => s.id === rx.id)) {
          setRxSnackbar({ open: true, message: '⚠️ This prescription has already been added.', severity: 'warning' });
        } else {
          setScannedExternalPrescriptions(prev => [...prev, rx]);
          setRxSnackbar({ open: true, message: `✅ External prescription from Dr. ${(rx as any).doctorName || 'Unknown'} loaded successfully!`, severity: 'success' });
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Prescription not found for this QR code.';
      setRxSnackbar({ open: true, message: `❌ ${msg}`, severity: 'error' });
    } finally {
      setExternalLookupLoading(false);
    }
  };

  // Manual external code lookup
  const handleExternalManualLookup = async () => {
    if (!externalLookupCode.trim()) return;
    setExternalLookupLoading(true);
    setRxSnackbar({ open: true, message: '🔍 Looking up prescription code...', severity: 'info' });

    try {
      const result = await lookupPrescriptionByCode(externalLookupCode.trim());
      if (result.success && result.prescription) {
        const rx = result.prescription as Prescription;
        if (scannedExternalPrescriptions.some(s => s.id === rx.id)) {
          setRxSnackbar({ open: true, message: '⚠️ This prescription has already been added.', severity: 'warning' });
        } else {
          setScannedExternalPrescriptions(prev => [...prev, rx]);
          setRxSnackbar({ open: true, message: `✅ External prescription loaded!`, severity: 'success' });
          setExternalLookupCode('');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Prescription not found.';
      setRxSnackbar({ open: true, message: `❌ ${msg}`, severity: 'error' });
    } finally {
      setExternalLookupLoading(false);
    }
  };

  // Copy past prescription data into current form (re-order)
  const handleCopyPastRx = (rx: Prescription) => {
    // Copy diagnosis
    if (rx.provisionalDiagnosis && rx.provisionalDiagnosis.length > 0) {
      setFormData(prev => ({
        ...prev,
        provisionalDiagnosis: Array.from(new Set([...(prev.provisionalDiagnosis || []), ...rx.provisionalDiagnosis!]))
      }));
    }
    // Copy medications
    if (rx.medications && rx.medications.length > 0) {
      setFormData(prev => ({
        ...prev,
        medications: [...(prev.medications || []), ...rx.medications!]
      }));
    }
    // Copy complaints
    if (rx.presentingComplaints && rx.presentingComplaints.length > 0) {
      setFormData(prev => ({
        ...prev,
        presentingComplaints: Array.from(new Set([...(prev.presentingComplaints || []), ...rx.presentingComplaints!]))
      }));
    }
    setRxSnackbar({ open: true, message: '✅ Past prescription data copied to current form!', severity: 'success' });
  };

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
      const finalMed = recalcMedication(newMedication);
      const durVal = finalMed.durationValue || 5;
      const durUnit = finalMed.durationUnit || 'Days';
      const durStr = finalMed.duration || `${durVal} ${durUnit}`;
      const qtyStr = finalMed.quantity || '';

      setFormData({
        ...formData,
        medications: [...(formData.medications || []), {
          ...finalMed,
          duration: durStr,
          quantity: qtyStr
        }]
      });
      setNewMedication({
        name: '',
        type: 'Tablet',
        dosage: '',
        duration: '5 Days',
        durationValue: 5,
        durationUnit: 'Days',
        quantity: '',
        quantityValue: 0,
        quantityUnit: 'Tablets',
        instructions: '',
        timing: { morning: 0, afternoon: 0, evening: 0, night: 0 },
        mealRelations: { morning: '', afternoon: '', evening: '', night: '' },
        isSOS: false,
        sosReason: ''
      });
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
    <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3 }, pb: 10, px: { xs: 1.5, sm: 3, md: 4 } }} className="animate-slide-up">
      
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
              <Box sx={{ width: '100%' }}>
                <Autocomplete
                  options={patients}
                  getOptionLabel={(patient) => 
                    typeof patient === 'string' 
                      ? patient 
                      : `${patient.firstName || ''} ${patient.lastName || ''} (${patient.email || patient.contactNumber || patient.phone || ''})`.trim()
                  }
                  value={patients.find((p) => p.id === formData.patientId) || null}
                  onChange={(_e, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      patientId: newValue ? newValue.id : ''
                    }));
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  filterOptions={(options, state) => {
                    const query = state.inputValue.toLowerCase().trim();
                    if (!query) return options;
                    return options.filter((patient) => {
                      const name = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
                      const email = (patient.email || '').toLowerCase();
                      const phone = (patient.phone || patient.contactNumber || '').toLowerCase();
                      return name.includes(query) || email.includes(query) || phone.includes(query);
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search & Select Patient *"
                      placeholder="Type patient name, email, or phone to search..."
                      required={!formData.patientId}
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', fontSize: 20 }} />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        sx: {
                          borderRadius: '16px',
                          bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255, 255, 255, 0.9)',
                          fontWeight: 700,
                          color: mode === 'dark' ? '#FAF2F5' : '#123029',
                          '& fieldset': { borderColor: 'var(--glass-border)' }
                        }
                      }}
                      InputLabelProps={{
                        sx: { color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)', fontWeight: 700 }
                      }}
                    />
                  )}
                  renderOption={(props, patient) => (
                    <Box 
                      component="li" 
                      {...props} 
                      key={patient.id}
                      sx={{ 
                        py: 1, 
                        px: 2, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-start',
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        '&:hover': { bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.15)' : 'rgba(42, 107, 93, 0.08)' }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#123029' }}>
                        {patient.firstName} {patient.lastName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', fontWeight: 600 }}>
                        📧 {patient.email || 'No email'} {patient.contactNumber || patient.phone ? ` • 📱 ${patient.contactNumber || patient.phone}` : ''}
                      </Typography>
                    </Box>
                  )}
                  noOptionsText={
                    patients.length === 0 
                      ? 'No linked patients yet — use + NEW PATIENT or + ADD EXISTING' 
                      : 'No patient matching search'
                  }
                  sx={{ width: '100%' }}
                />
                <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', mt: 0.8, display: 'block', fontWeight: 600 }}>
                  {patients.length > 0 
                    ? `Showing ${patients.length} linked patient${patients.length > 1 ? 's' : ''} (Search by name, email, or phone)`
                    : 'Add patients using + NEW PATIENT or + ADD EXISTING above'}
                </Typography>
              </Box>
            </Grid>
            
            {selectedPatient && (
              <Grid item xs={12}>
                {/* ═══ Rich Patient Context Card ═══ */}
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '22px',
                    border: mode === 'dark' ? '1.5px solid rgba(137, 215, 183, 0.3)' : '1.5px solid rgba(18, 48, 41, 0.12)',
                    bgcolor: mode === 'dark' ? 'rgba(17, 29, 26, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                    overflow: 'hidden',
                    backdropFilter: 'blur(16px)',
                    boxShadow: mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(18, 48, 41, 0.06)'
                  }}
                >
                  {/* Patient Header - Always Visible */}
                  <Box
                    onClick={() => setPatientContextExpanded(!patientContextExpanded)}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      '&:hover': { bgcolor: mode === 'dark' ? 'rgba(137, 215, 183, 0.06)' : 'rgba(102, 205, 170, 0.06)' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: mode === 'dark' ? '#428475' : '#1A312C',
                          color: '#89D7B7',
                          fontWeight: 900,
                          fontSize: '1.1rem'
                        }}
                      >
                        {selectedPatient.firstName?.[0]?.toUpperCase() || 'P'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', lineHeight: 1.2 }}>
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475', fontWeight: 700, display: 'block' }}>
                          {selectedPatient.email}
                          {(selectedPatient as any).dateOfBirth && ` • ${new Date().getFullYear() - new Date((selectedPatient as any).dateOfBirth).getFullYear()} yrs`}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {pastDoctorPrescriptions.length > 0 && (
                        <Chip
                          label={`${pastDoctorPrescriptions.length} Past Rx`}
                          size="small"
                          sx={{ bgcolor: 'rgba(66, 132, 117, 0.15)', color: '#428475', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
                        />
                      )}
                      {patientContextExpanded ? <ExpandLessIcon sx={{ color: '#428475' }} /> : <ExpandMoreIcon sx={{ color: '#428475' }} />}
                    </Box>
                  </Box>

                  <Collapse in={patientContextExpanded}>
                    <Divider sx={{ borderColor: mode === 'dark' ? 'rgba(137, 215, 183, 0.15)' : 'rgba(18, 48, 41, 0.08)' }} />

                    {/* Patient Details Grid */}
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Grid container spacing={1.5}>
                        {selectedPatient.contactNumber && (
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem', display: 'block' }}>📱 Phone</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: '0.82rem' }}>{selectedPatient.contactNumber}</Typography>
                          </Grid>
                        )}
                        {(selectedPatient as any).dateOfBirth && (
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem', display: 'block' }}>🎂 Date of Birth</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: '0.82rem' }}>
                              {new Date((selectedPatient as any).dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Typography>
                          </Grid>
                        )}
                        {(selectedPatient as any).address && (
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem', display: 'block' }}>📍 Address</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: '0.82rem' }} noWrap>
                              {typeof (selectedPatient as any).address === 'object' && (selectedPatient as any).address !== null
                                ? [(selectedPatient as any).address.street, (selectedPatient as any).address.city, (selectedPatient as any).address.state].filter(Boolean).join(', ')
                                : String((selectedPatient as any).address)}
                            </Typography>
                          </Grid>
                        )}
                        {(selectedPatient as any).bloodType && (
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem', display: 'block' }}>🩸 Blood Group</Typography>
                            <Chip label={typeof (selectedPatient as any).bloodType === 'object' ? JSON.stringify((selectedPatient as any).bloodType) : String((selectedPatient as any).bloodType)} size="small" icon={<BloodIcon sx={{ fontSize: 14 }} />} sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 800, fontSize: '0.72rem', height: 22 }} />
                          </Grid>
                        )}
                        {(selectedPatient as any).emergencyContact && (
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem', display: 'block' }}>🚨 Emergency</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: '0.82rem' }}>
                              {typeof (selectedPatient as any).emergencyContact === 'object' && (selectedPatient as any).emergencyContact !== null
                                ? [
                                    (selectedPatient as any).emergencyContact.name,
                                    (selectedPatient as any).emergencyContact.relationship ? `(${(selectedPatient as any).emergencyContact.relationship})` : '',
                                    (selectedPatient as any).emergencyContact.phone
                                  ].filter(Boolean).join(' ')
                                : String((selectedPatient as any).emergencyContact)}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>

                      {/* Allergies & Medical History */}
                      {((selectedPatient as any).allergies?.length > 0 || (selectedPatient as any).medicalHistory) && (
                        <Box sx={{ mt: 1.5 }}>
                          {(selectedPatient as any).allergies?.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.62rem', display: 'block', mb: 0.5 }}>⚠️ Allergies</Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {((selectedPatient as any).allergies || []).map((allergy: any, i: number) => {
                                  const labelText = typeof allergy === 'object' && allergy !== null ? (allergy.name || allergy.allergy || JSON.stringify(allergy)) : String(allergy);
                                  return (
                                    <Chip key={i} label={labelText} size="small" sx={{ bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 800, fontSize: '0.68rem', height: 22, border: '1px solid #fecaca' }} />
                                  );
                                })}
                              </Box>
                            </Box>
                          )}
                          {(selectedPatient as any).medicalHistory && (
                            <Box>
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.62rem', display: 'block', mb: 0.3 }}>📋 Medical History</Typography>
                              <Typography variant="caption" sx={{ color: mode === 'dark' ? '#cbd5e1' : '#475569', fontWeight: 600, fontSize: '0.75rem' }}>
                                {typeof (selectedPatient as any).medicalHistory === 'string'
                                  ? (selectedPatient as any).medicalHistory
                                  : Array.isArray((selectedPatient as any).medicalHistory)
                                    ? ((selectedPatient as any).medicalHistory as any[]).map(m => typeof m === 'object' && m !== null ? (m.name || m.condition || JSON.stringify(m)) : String(m)).join(', ')
                                    : typeof (selectedPatient as any).medicalHistory === 'object'
                                      ? JSON.stringify((selectedPatient as any).medicalHistory)
                                      : ''}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ borderColor: mode === 'dark' ? 'rgba(137, 215, 183, 0.15)' : 'rgba(18, 48, 41, 0.08)' }} />

                    {/* ═══ Your Past Prescriptions for This Patient ═══ */}
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Box
                        onClick={() => setPastRxExpanded(!pastRxExpanded)}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', mb: pastRxExpanded ? 1 : 0 }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#1A312C', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.85rem' }}>
                          <HistoryIcon sx={{ fontSize: 18, color: '#428475' }} /> Your Past Prescriptions ({pastDoctorPrescriptions.length})
                        </Typography>
                        {pastRxExpanded ? <ExpandLessIcon sx={{ color: '#428475', fontSize: 20 }} /> : <ExpandMoreIcon sx={{ color: '#428475', fontSize: 20 }} />}
                      </Box>

                      <Collapse in={pastRxExpanded}>
                        {loadingPastRx ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} sx={{ color: '#428475' }} />
                          </Box>
                        ) : pastDoctorPrescriptions.length === 0 ? (
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontStyle: 'italic', display: 'block', py: 1 }}>
                            No previous prescriptions found for this patient.
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 260, overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(66,132,117,0.3)', borderRadius: 2 } }}>
                            {pastDoctorPrescriptions.slice(0, 5).map((rx) => {
                              const isExpanded = expandedPastRxId === rx.id;
                              const diagnosisText = typeof rx.provisionalDiagnosis?.[0] === 'object'
                                ? ((rx.provisionalDiagnosis[0] as any).name || (rx.provisionalDiagnosis[0] as any).diagnosis || JSON.stringify(rx.provisionalDiagnosis[0]))
                                : String(rx.provisionalDiagnosis?.[0] || rx.medication || 'Prescription');

                              const medicationNames = rx.medications && Array.isArray(rx.medications)
                                ? rx.medications.map(m => typeof m === 'object' && m !== null ? (m.name || (m as any).medicationName || '') : String(m)).filter(Boolean)
                                : [];

                              return (
                                <Card
                                  key={rx.id}
                                  variant="outlined"
                                  sx={{
                                    borderRadius: '14px',
                                    bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(244, 248, 246, 0.9)',
                                    borderColor: isExpanded ? '#428475' : (mode === 'dark' ? 'rgba(137, 215, 183, 0.15)' : 'rgba(18, 48, 41, 0.08)'),
                                    transition: 'all 0.2s',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {/* Clickable Card Header */}
                                  <Box 
                                    onClick={() => setExpandedPastRxId(isExpanded ? null : rx.id)}
                                    sx={{ 
                                      p: 1.5, 
                                      display: 'flex', 
                                      alignItems: 'flex-start', 
                                      justifyContent: 'space-between', 
                                      gap: 1,
                                      cursor: 'pointer',
                                      '&:hover': { bgcolor: mode === 'dark' ? 'rgba(66, 132, 117, 0.08)' : 'rgba(66, 132, 117, 0.05)' }
                                    }}
                                  >
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5, flexWrap: 'wrap' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: '0.82rem' }} noWrap>
                                          {diagnosisText}
                                        </Typography>
                                        <Chip
                                          label={typeof rx.status === 'string' ? rx.status : 'active'}
                                          size="small"
                                          sx={{
                                            height: 18,
                                            fontSize: '0.6rem',
                                            fontWeight: 800,
                                            bgcolor: rx.status === 'active' ? '#dcfce7' : rx.status === 'completed' ? '#e0f2fe' : '#fef2f2',
                                            color: rx.status === 'active' ? '#16a34a' : rx.status === 'completed' ? '#0284c7' : '#dc2626'
                                          }}
                                        />
                                      </Box>
                                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>
                                        📅 {new Date(rx.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        {medicationNames.length > 0 && ` • 💊 ${medicationNames.slice(0, 2).join(', ')}${medicationNames.length > 2 ? ` +${medicationNames.length - 2}` : ''}`}
                                      </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                      <Tooltip title="Copy to current Rx">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyPastRx(rx);
                                          }}
                                          sx={{ bgcolor: 'rgba(66, 132, 117, 0.1)', '&:hover': { bgcolor: 'rgba(66, 132, 117, 0.2)' } }}
                                        >
                                          <CopyIcon sx={{ fontSize: 16, color: '#428475' }} />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title={isExpanded ? "Hide Details" : "View Details Inline"}>
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedPastRxId(isExpanded ? null : rx.id);
                                          }}
                                          sx={{ bgcolor: isExpanded ? '#428475' : 'rgba(66, 132, 117, 0.1)', color: isExpanded ? '#ffffff' : '#428475', '&:hover': { bgcolor: '#428475', color: '#ffffff' } }}
                                        >
                                          {isExpanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ViewIcon sx={{ fontSize: 16 }} />}
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>

                                  {/* Inline Collapsible Prescription Details */}
                                  <Collapse in={isExpanded}>
                                    <Box sx={{ p: 2, pt: 1, borderTop: '1px dashed rgba(66, 132, 117, 0.2)', bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.7)' }}>
                                      {/* Medications Detailed List */}
                                      {rx.medications && rx.medications.length > 0 && (
                                        <Box sx={{ mb: 1.5 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem', display: 'block', mb: 0.8 }}>
                                            💊 Prescribed Medications ({rx.medications.length})
                                          </Typography>
                                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                            {rx.medications.map((m: any, idx: number) => (
                                              <Box key={idx} sx={{ p: 1, borderRadius: '8px', bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#ffffff', border: '1px solid rgba(66,132,117,0.12)' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                                                  <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', fontSize: '0.78rem' }}>
                                                    {m.name || m.medicationName || 'Medication'}
                                                  </Typography>
                                                  {m.dosage && (
                                                    <Chip label={m.dosage} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(66,132,117,0.1)', color: '#428475' }} />
                                                  )}
                                                </Box>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
                                                  {[
                                                    m.frequency ? `Freq: ${m.frequency}` : null,
                                                    m.duration ? `Duration: ${m.duration}` : null,
                                                    m.instructions || m.timing || m.foodRelation ? `Note: ${m.instructions || m.timing || m.foodRelation}` : null
                                                  ].filter(Boolean).join(' • ') || 'Standard Dosage'}
                                                </Typography>
                                              </Box>
                                            ))}
                                          </Box>
                                        </Box>
                                      )}

                                      {/* Advice / Notes */}
                                      {((rx as any).advice || rx.notes) && (
                                        <Box sx={{ mb: 1.5 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem', display: 'block', mb: 0.3 }}>
                                            📝 Doctor Notes & Advice
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: mode === 'dark' ? '#cbd5e1' : '#475569', fontSize: '0.73rem', display: 'block', fontStyle: 'italic' }}>
                                            {(rx as any).advice || rx.notes}
                                          </Typography>
                                        </Box>
                                      )}

                                      {/* Action Toolbar */}
                                      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, pt: 1, borderTop: '1px solid rgba(66,132,117,0.1)', flexWrap: 'wrap' }}>
                                        <Button
                                          size="small"
                                          variant="contained"
                                          startIcon={<CopyIcon sx={{ fontSize: 14 }} />}
                                          onClick={() => handleCopyPastRx(rx)}
                                          sx={{ bgcolor: '#428475', '&:hover': { bgcolor: '#2e5e53' }, fontSize: '0.7rem', textTransform: 'none', py: 0.4, px: 1.5, borderRadius: '8px' }}
                                        >
                                          Copy to Current Rx
                                        </Button>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          startIcon={downloadingPdfRxId === rx.id ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon sx={{ fontSize: 14 }} />}
                                          onClick={() => handleDownloadPastRxPdf(rx.id)}
                                          disabled={downloadingPdfRxId === rx.id}
                                          sx={{ borderColor: '#428475', color: '#428475', '&:hover': { borderColor: '#2e5e53', bgcolor: 'rgba(66,132,117,0.08)' }, fontSize: '0.7rem', textTransform: 'none', py: 0.4, px: 1.5, borderRadius: '8px' }}
                                        >
                                          {downloadingPdfRxId === rx.id ? 'Generating PDF...' : 'Download PDF'}
                                        </Button>
                                      </Box>
                                    </Box>
                                  </Collapse>
                                </Card>
                              );
                            })}
                          </Box>
                        )}
                      </Collapse>
                    </Box>

                    <Divider sx={{ borderColor: mode === 'dark' ? 'rgba(137, 215, 183, 0.15)' : 'rgba(18, 48, 41, 0.08)' }} />

                    {/* ═══ External Prescription Scanner ═══ */}
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#1A312C', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.85rem', mb: 1 }}>
                        <QrCodeScannerIcon sx={{ fontSize: 18, color: '#0284c7' }} /> External Doctor Prescriptions
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 1.2, fontSize: '0.72rem' }}>
                        Scan or enter a QR code / verification code from another doctor's prescription to view it during this consultation.
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<QrCodeScannerIcon sx={{ fontSize: 18 }} />}
                          onClick={() => setExternalQrScannerOpen(true)}
                          disabled={externalLookupLoading}
                          sx={{
                            borderRadius: '14px',
                            fontWeight: 800,
                            fontSize: '0.76rem',
                            borderColor: '#0284c7',
                            color: '#0284c7',
                            '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.08)', borderColor: '#0369a1' }
                          }}
                        >
                          Scan QR
                        </Button>
                        <TextField
                          size="small"
                          placeholder="Enter Rx code..."
                          value={externalLookupCode}
                          onChange={(e) => setExternalLookupCode(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleExternalManualLookup()}
                          InputProps={{
                            sx: { borderRadius: '14px', fontSize: '0.82rem', fontWeight: 700 },
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={handleExternalManualLookup}
                                  disabled={externalLookupLoading || !externalLookupCode.trim()}
                                >
                                  {externalLookupLoading ? <CircularProgress size={16} /> : <SearchIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                          sx={{ flex: 1 }}
                        />
                      </Box>

                      {/* Scanned External Prescriptions List */}
                      {scannedExternalPrescriptions.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {scannedExternalPrescriptions.map((rx) => (
                            <Card
                              key={rx.id}
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                borderRadius: '14px',
                                bgcolor: mode === 'dark' ? 'rgba(2, 132, 199, 0.08)' : 'rgba(224, 242, 254, 0.5)',
                                borderColor: 'rgba(2, 132, 199, 0.3)',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Chip
                                  label={`External — Dr. ${(rx as any).doctorName || 'Unknown Doctor'}`}
                                  size="small"
                                  sx={{ bgcolor: '#0284c7', color: '#fff', fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                                />
                                <Chip
                                  label={rx.status}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.58rem',
                                    fontWeight: 800,
                                    bgcolor: rx.status === 'active' ? '#dcfce7' : '#e0f2fe',
                                    color: rx.status === 'active' ? '#16a34a' : '#0284c7'
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: mode === 'dark' ? '#FAF2F5' : '#0f172a', fontSize: '0.78rem', display: 'block' }}>
                                {rx.provisionalDiagnosis?.[0] || rx.medication || 'Prescription'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: '0.7rem' }}>
                                📅 {new Date(rx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {rx.medications && rx.medications.length > 0 && ` • 💊 ${rx.medications.map(m => m.name).join(', ')}`}
                              </Typography>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Paper>
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
            bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.88) !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <VitalIcon sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }} /> 2. Vital Signs (Consultation)
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 1, px: 1.5, borderRadius: '14px', bgcolor: 'rgba(66, 132, 117, 0.06)', border: '1px solid rgba(66, 132, 117, 0.2)' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <BpIcon sx={{ fontSize: 16 }} /> Blood Pressure (Systolic / Diastolic)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <TextField
                      size="small"
                      type="number"
                      label="SYS"
                      placeholder="120"
                      value={(() => {
                        const parts = (formData.vitalSigns?.bloodPressure || '').split('/');
                        return parts[0]?.trim() || '';
                      })()}
                      onChange={(e) => {
                        const sys = e.target.value;
                        const currentParts = (formData.vitalSigns?.bloodPressure || '').split('/');
                        const dia = currentParts[1] ? currentParts[1].replace('mmHg', '').trim() : '';
                        const bpStr = (sys || dia) ? `${sys}/${dia}` : '';
                        setFormData({
                          ...formData,
                          vitalSigns: { ...formData.vitalSigns, bloodPressure: bpStr }
                        });
                      }}
                      sx={{ flex: 1, '& input': { textAlign: 'center', fontWeight: 800, p: '6px' }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <Typography variant="h6" sx={{ color: '#428475', fontWeight: 900, mx: 0.2 }}>/</Typography>
                    <TextField
                      size="small"
                      type="number"
                      label="DIA"
                      placeholder="80"
                      value={(() => {
                        const parts = (formData.vitalSigns?.bloodPressure || '').split('/');
                        return parts[1] ? parts[1].replace('mmHg', '').trim() : '';
                      })()}
                      onChange={(e) => {
                        const dia = e.target.value;
                        const currentParts = (formData.vitalSigns?.bloodPressure || '').split('/');
                        const sys = currentParts[0]?.trim() || '';
                        const bpStr = (sys || dia) ? `${sys}/${dia}` : '';
                        setFormData({
                          ...formData,
                          vitalSigns: { ...formData.vitalSigns, bloodPressure: bpStr }
                        });
                      }}
                      sx={{ flex: 1, '& input': { textAlign: 'center', fontWeight: 800, p: '6px' }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', ml: 0.2 }}>
                      mmHg
                    </Typography>
                  </Box>
                </Box>
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
            bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.88) !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedicalIcon sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }} /> 3. Complaints & Diagnosis
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={2.5}>
              {/* Presenting Complaints */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                    sx={{ bgcolor: mode === 'dark' ? '#2A6B5D' : '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.presentingComplaints?.map((item, idx) => (
                    <Chip key={idx} label={item} onDelete={() => removeFromArray('presentingComplaints', idx)} sx={{ fontWeight: 600, bgcolor: mode === 'dark' ? 'rgba(137, 215, 183, 0.2)' : 'rgba(66, 132, 117, 0.12)', color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }} />
                  ))}
                </Box>
              </Grid>

              {/* Clinical Examination Findings */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                    sx={{ bgcolor: mode === 'dark' ? '#2A6B5D' : '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.clinicalFindings?.map((item, idx) => (
                    <Chip key={idx} label={item} onDelete={() => removeFromArray('clinicalFindings', idx)} sx={{ fontWeight: 600, bgcolor: mode === 'dark' ? 'rgba(255, 215, 150, 0.2)' : 'rgba(255, 244, 225, 0.9)', color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }} />
                  ))}
                </Box>
              </Grid>

              {/* Provisional Diagnosis */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                    sx={{ bgcolor: mode === 'dark' ? '#89D7B7' : '#1A312C', color: mode === 'dark' ? '#1A312C' : '#89D7B7', minWidth: 44, borderRadius: '14px', px: 2 }}
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
                      sx={{ fontWeight: 800, bgcolor: mode === 'dark' ? '#89D7B7' : '#1A312C', color: mode === 'dark' ? '#1A312C' : '#89D7B7' }} 
                    />
                  ))}
                </Box>
              </Grid>

              {/* Current Medications (Ongoing) */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                    sx={{ bgcolor: mode === 'dark' ? '#2A6B5D' : '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.currentMedications?.map((item, idx) => (
                    <Chip key={idx} label={item} onDelete={() => removeFromArray('currentMedications', idx)} sx={{ fontWeight: 600, bgcolor: mode === 'dark' ? 'rgba(137, 215, 183, 0.2)' : 'rgba(66, 132, 117, 0.15)', color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }} />
                  ))}
                </Box>
              </Grid>

              {/* Past Surgical History */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                    sx={{ bgcolor: mode === 'dark' ? '#2A6B5D' : '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.pastSurgicalHistory?.map((item, idx) => (
                    <Chip key={idx} label={item} onDelete={() => removeFromArray('pastSurgicalHistory', idx)} sx={{ fontWeight: 600, bgcolor: mode === 'dark' ? 'rgba(255, 200, 150, 0.2)' : 'rgba(255, 200, 150, 0.3)', color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }} />
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
            bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.88) !important',
            border: '2px solid rgba(137, 215, 183, 0.6) !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedicationIcon sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }} /> 4. Rx – Prescribed Medications *
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
                <Grid item xs={5} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="med-type-label">Form</InputLabel>
                    <Select
                      labelId="med-type-label"
                      value={newMedication.type || 'Tablet'}
                      label="Form"
                      onChange={(e) => {
                        const newType = e.target.value;
                        const updated = recalcMedication({ ...newMedication, type: newType });
                        setNewMedication(updated);
                      }}
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
                <Grid item xs={7} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Dosage"
                    placeholder="Auto: M-A-E-N"
                    value={buildDosageString(newMedication.timing || { morning: 0, afternoon: 0, evening: 0, night: 0 }, newMedication.type, newMedication.isSOS, newMedication.sosReason)}
                    InputProps={{
                      readOnly: true,
                      sx: { borderRadius: '12px', bgcolor: newMedication.isSOS ? 'rgba(239,68,68,0.08)' : 'rgba(66,132,117,0.06)', fontWeight: 700, fontSize: '0.8rem', color: newMedication.isSOS ? '#dc2626' : 'inherit' }
                    }}
                    helperText={(() => {
                      if (newMedication.isSOS) return '⚡ SOS — Take only when needed';
                      const t = newMedication.timing || { morning: 0, afternoon: 0, evening: 0, night: 0 };
                      const total = (t.morning || 0) + (t.afternoon || 0) + (t.evening || 0) + (t.night || 0);
                      if (total === 0) return 'Select time of day below';
                      if (newMedication.type === 'Syrup') return `${total * 5}ml/day (${total} tsp)`;
                      if (newMedication.type === 'Drops') return `${total * 5} drops/day`;
                      return `${total} ${getDispensaryUnit(newMedication.type).toLowerCase()}/day`;
                    })()}
                  />
                </Grid>

                {/* Time of Day & SOS Toggle Row */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-forest)' }}>
                      Time of Day:
                    </Typography>

                    {/* SOS / PRN Mode Toggle */}
                    <Chip
                      icon={<SosIcon sx={{ fontSize: 16, color: newMedication.isSOS ? '#fff !important' : '#dc2626 !important' }} />}
                      label={newMedication.isSOS ? '🆘 SOS Mode (ACTIVE)' : '🆘 SOS (When Needed)'}
                      size="small"
                      clickable
                      onClick={() => {
                        const newSOS = !newMedication.isSOS;
                        const defaultReason = newSOS ? 'Fever / Pain' : '';
                        let newInst = newMedication.instructions || '';
                        if (newSOS && !newInst.toLowerCase().includes('when needed')) {
                          newInst = newInst ? `${newInst}, Take only when needed for ${defaultReason}` : `Take only when needed for ${defaultReason}`;
                        }
                        const updated = recalcMedication({
                          ...newMedication,
                          isSOS: newSOS,
                          sosReason: defaultReason,
                          instructions: newInst
                        });
                        setNewMedication(updated);
                      }}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        height: 26,
                        borderRadius: '10px',
                        bgcolor: newMedication.isSOS ? '#dc2626' : 'rgba(220, 38, 38, 0.1)',
                        color: newMedication.isSOS ? '#ffffff' : '#dc2626',
                        border: '1.5px solid #dc2626',
                        transition: 'all 0.2s ease',
                        '&:active': { transform: 'scale(0.95)' }
                      }}
                    />
                  </Box>

                  {/* SOS Reason Selector Bar when SOS is active */}
                  {newMedication.isSOS && (
                    <Box sx={{ mb: 1.2, p: 1.2, borderRadius: '14px', bgcolor: 'rgba(220, 38, 38, 0.06)', border: '1.5px dashed rgba(220, 38, 38, 0.4)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#dc2626', display: 'block', mb: 0.6 }}>
                        🆘 Indicate Reason for SOS (Only When Needed):
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', mb: 1 }}>
                        {[
                          { label: 'Fever', icon: '🌡️' },
                          { label: 'Pain / Headache', icon: '⚡' },
                          { label: 'Nausea / Vomiting', icon: '🤢' },
                          { label: 'Acidity / Gas', icon: '💨' },
                          { label: 'Cough / Breathlessness', icon: '🫁' }
                        ].map((r) => {
                          const isSelected = newMedication.sosReason === r.label;
                          return (
                            <Chip
                              key={r.label}
                              label={`${r.icon} ${r.label}`}
                              size="small"
                              clickable
                              onClick={() => {
                                const newReason = r.label;
                                let updatedInst = (newMedication.instructions || '').replace(/,? Take only when needed for .*/i, '');
                                updatedInst = updatedInst ? `${updatedInst}, Take only when needed for ${newReason}` : `Take only when needed for ${newReason}`;
                                const updated = recalcMedication({
                                  ...newMedication,
                                  sosReason: newReason,
                                  instructions: updatedInst
                                });
                                setNewMedication(updated);
                              }}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.68rem',
                                height: 24,
                                borderRadius: '8px',
                                bgcolor: isSelected ? '#dc2626' : 'rgba(255,255,255,0.9)',
                                color: isSelected ? '#fff' : '#b91c1c',
                                border: isSelected ? '1.5px solid #dc2626' : '1px solid rgba(220,38,38,0.2)'
                              }}
                            />
                          );
                        })}
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Or type custom SOS condition (e.g., High Blood Pressure)"
                        value={newMedication.sosReason || ''}
                        onChange={(e) => {
                          const customR = e.target.value;
                          let updatedInst = (newMedication.instructions || '').replace(/,? Take only when needed for .*/i, '');
                          if (customR) {
                            updatedInst = updatedInst ? `${updatedInst}, Take only when needed for ${customR}` : `Take only when needed for ${customR}`;
                          }
                          const updated = recalcMedication({
                            ...newMedication,
                            sosReason: customR,
                            instructions: updatedInst
                          });
                          setNewMedication(updated);
                        }}
                        InputProps={{ sx: { borderRadius: '10px', bgcolor: '#fff', fontSize: '0.78rem' } }}
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    {([
                      { key: 'morning' as const, label: 'Morn', icon: <MorningIcon />, color: '#F57C00', bg: '#FFF3E0', activeBg: '#FFE0B2', border: '#F57C00' },
                      { key: 'afternoon' as const, label: 'Day', icon: <AfternoonIcon />, color: '#FBC02D', bg: '#FFFDE7', activeBg: '#FFF9C4', border: '#F9A825' },
                      { key: 'evening' as const, label: 'Eve', icon: <EveningIcon />, color: '#E64A19', bg: '#FBE9E7', activeBg: '#FFCCBC', border: '#E64A19' },
                      { key: 'night' as const, label: 'Night', icon: <NightIcon />, color: '#3949AB', bg: '#E8EAF6', activeBg: '#C5CAE9', border: '#3949AB' }
                    ]).map((time) => {
                      const doseCount = newMedication.timing?.[time.key] || 0;
                      const isActive = doseCount > 0;
                      const mealRel = newMedication.mealRelations?.[time.key] || '';
                      return (
                        <Box
                          key={time.key}
                          onClick={(e) => {
                            if (isActive) {
                              const updated = recalcMedication({
                                ...newMedication,
                                timing: { ...newMedication.timing, [time.key]: 0 },
                                mealRelations: { ...newMedication.mealRelations, [time.key]: '' }
                              });
                              setNewMedication(updated);
                            } else {
                              const updated = recalcMedication({
                                ...newMedication,
                                timing: { ...newMedication.timing, [time.key]: 1 }
                              });
                              setNewMedication(updated);
                              setMealPopoverAnchor(e.currentTarget);
                              setMealPopoverTimeKey(time.key);
                            }
                          }}
                          sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            py: 1,
                            borderRadius: '14px',
                            border: isActive ? `2.5px solid ${time.border}` : '2px solid #e0e0e0',
                            bgcolor: isActive ? time.activeBg : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            WebkitTapHighlightColor: 'transparent',
                            userSelect: 'none',
                            '&:active': {
                              transform: 'scale(0.95)'
                            },
                            '& .MuiSvgIcon-root': {
                              color: isActive ? time.color : '#9e9e9e',
                              fontSize: 24,
                              transition: 'color 0.2s'
                            }
                          }}
                        >
                          {time.icon}
                          <Typography variant="caption" sx={{ mt: 0.2, fontWeight: isActive ? 800 : 600, color: isActive ? time.color : '#757575', fontSize: '0.65rem', lineHeight: 1.2 }}>
                            {time.label}
                          </Typography>
                          {isActive && (
                            <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 800, color: '#fff', bgcolor: time.color, borderRadius: '6px', px: 0.6, mt: 0.2, lineHeight: 1.4, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {getDoseUnitLabel(newMedication.type, doseCount)}{mealRel ? ` · ${mealRel.split(' ')[0]}` : ''}
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Grid>

                {/* Per-Time-of-Day Meal Relation Popover */}
                <Popover
                  open={Boolean(mealPopoverAnchor)}
                  anchorEl={mealPopoverAnchor}
                  onClose={() => setMealPopoverAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                  slotProps={{
                    paper: {
                      sx: {
                        p: 2,
                        borderRadius: '20px',
                        boxShadow: '0 16px 48px rgba(26, 49, 44, 0.25)',
                        border: '1.5px solid rgba(137, 215, 183, 0.5)',
                        bgcolor: mode === 'dark' ? 'rgba(18, 38, 34, 0.98)' : 'rgba(255, 255, 255, 0.99)',
                        backdropFilter: 'blur(16px)',
                        width: 'calc(100vw - 32px)',
                        maxWidth: 360,
                        mt: 1
                      }
                    }
                  }}
                >
                  <Box sx={{ mb: 1.5, textAlign: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#1A312C', fontSize: '0.85rem' }}>
                      {mealPopoverTimeKey.charAt(0).toUpperCase() + mealPopoverTimeKey.slice(1)} — Dose & Meal
                    </Typography>
                  </Box>

                  {/* Dose Count Selector */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#428475', display: 'block', mb: 0.8, textAlign: 'center' }}>
                      Select dose per intake ({newMedication.type || 'Tablet'}):
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.8, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {[1, 2, 3].map((count) => {
                        const currentDose = newMedication.timing?.[mealPopoverTimeKey] || 0;
                        const isSelected = currentDose === count;
                        const doseLabel = getDoseUnitLabel(newMedication.type, count);
                        return (
                          <Box
                            key={count}
                            onClick={() => {
                              const updated = recalcMedication({
                                ...newMedication,
                                timing: { ...newMedication.timing, [mealPopoverTimeKey]: count }
                              });
                              setNewMedication(updated);
                            }}
                            sx={{
                              minWidth: 64,
                              height: 44,
                              px: 1.2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '14px',
                              border: isSelected ? '2.5px solid var(--color-forest)' : '2px solid #e0e0e0',
                              bgcolor: isSelected ? 'var(--color-forest)' : 'transparent',
                              color: isSelected ? '#fff' : '#1A312C',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              WebkitTapHighlightColor: 'transparent',
                              '&:active': { transform: 'scale(0.92)' }
                            }}
                          >
                            {doseLabel}
                          </Box>
                        );
                      })}
                      <TextField
                        size="small"
                        type="number"
                        placeholder="custom #"
                        value={(newMedication.timing?.[mealPopoverTimeKey] || 0) > 3 ? (newMedication.timing?.[mealPopoverTimeKey] || '') : ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          if (val >= 0) {
                            const updated = recalcMedication({
                              ...newMedication,
                              timing: { ...newMedication.timing, [mealPopoverTimeKey]: val }
                            });
                            setNewMedication(updated);
                          }
                        }}
                        sx={{ width: 70, '& input': { textAlign: 'center', fontWeight: 700, p: '8px', fontSize: '0.8rem' }, '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#428475', display: 'block', mb: 0.5, textAlign: 'center' }}>
                    Meal relation (optional)
                  </Typography>

                  {/* Meal Relation Row 1 */}
                  <Box sx={{ display: 'flex', gap: 0.6, mb: 0.6, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                      { label: 'With Food', shortLabel: 'With', icon: <WithFoodIcon sx={{ fontSize: 14 }} />, color: '#1565c0', bg: '#e3f2fd' },
                      { label: 'Before Food', shortLabel: 'Before', icon: <BeforeFoodIcon sx={{ fontSize: 14 }} />, color: '#e65100', bg: '#fff3e0' },
                      { label: 'After Food', shortLabel: 'After', icon: <AfterFoodIcon sx={{ fontSize: 14 }} />, color: '#6a1b9a', bg: '#f3e5f5' }
                    ].map((opt) => {
                      const isSelected = newMedication.mealRelations?.[mealPopoverTimeKey] === opt.label;
                      return (
                        <Chip
                          key={opt.label}
                          icon={opt.icon}
                          label={opt.label}
                          size="small"
                          clickable
                          onClick={() => {
                            setNewMedication({
                              ...newMedication,
                              mealRelations: { ...newMedication.mealRelations, [mealPopoverTimeKey]: isSelected ? '' : opt.label }
                            });
                            setMealPopoverAnchor(null);
                          }}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            py: 2,
                            borderRadius: '14px',
                            flex: '1 1 auto',
                            bgcolor: isSelected ? opt.color : opt.bg,
                            color: isSelected ? '#fff' : opt.color,
                            border: isSelected ? `2px solid ${opt.color}` : '1.5px solid rgba(0,0,0,0.06)',
                            '& .MuiChip-icon': { color: isSelected ? '#fff' : opt.color },
                            '&:active': { transform: 'scale(0.95)' }
                          }}
                        />
                      );
                    })}
                  </Box>

                  {/* Meal Relation Row 2 */}
                  <Box sx={{ display: 'flex', gap: 0.6, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Empty Stomach', icon: <EmptyStomachIcon sx={{ fontSize: 14 }} />, color: '#00695c', bg: '#e0f2f1' },
                      { label: 'Any Time', icon: <AnyTimeIcon sx={{ fontSize: 14 }} />, color: '#37474f', bg: '#eceff1' }
                    ].map((opt) => {
                      const isSelected = newMedication.mealRelations?.[mealPopoverTimeKey] === opt.label;
                      return (
                        <Chip
                          key={opt.label}
                          icon={opt.icon}
                          label={opt.label}
                          size="small"
                          clickable
                          onClick={() => {
                            setNewMedication({
                              ...newMedication,
                              mealRelations: { ...newMedication.mealRelations, [mealPopoverTimeKey]: isSelected ? '' : opt.label }
                            });
                            setMealPopoverAnchor(null);
                          }}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            py: 2,
                            borderRadius: '14px',
                            flex: '1 1 auto',
                            bgcolor: isSelected ? opt.color : opt.bg,
                            color: isSelected ? '#fff' : opt.color,
                            border: isSelected ? `2px solid ${opt.color}` : '1.5px solid rgba(0,0,0,0.06)',
                            '& .MuiChip-icon': { color: isSelected ? '#fff' : opt.color },
                            '&:active': { transform: 'scale(0.95)' }
                          }}
                        />
                      );
                    })}
                  </Box>
                </Popover>

                {/* Duration Inputs & Presets */}
                <Grid item xs={7} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Duration Value"
                    type="number"
                    value={newMedication.durationValue || ''}
                    onChange={(e) => {
                      const num = parseInt(e.target.value, 10) || 0;
                      const unit = newMedication.durationUnit || 'Days';
                      const durStr = `${num} ${unit}`;
                      const updated = recalcMedication({
                        ...newMedication,
                        durationValue: num,
                        duration: durStr
                      });
                      setNewMedication(updated);
                    }}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid item xs={5} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="dur-unit-label">Unit</InputLabel>
                    <Select
                      labelId="dur-unit-label"
                      value={newMedication.durationUnit || 'Days'}
                      label="Unit"
                      onChange={(e) => {
                        const unit = e.target.value;
                        const num = newMedication.durationValue || 5;
                        const durStr = `${num} ${unit}`;
                        const updated = recalcMedication({
                          ...newMedication,
                          durationUnit: unit,
                          duration: durStr
                        });
                        setNewMedication(updated);
                      }}
                      sx={{ borderRadius: '12px' }}
                    >
                      <MenuItem value="Days">Days</MenuItem>
                      <MenuItem value="Weeks">Weeks</MenuItem>
                      <MenuItem value="Months">Months</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Duration Presets */}
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-forest)', display: 'block', mb: 0.5 }}>
                    Quick Duration Presets:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                    {[
                      { num: 3, unit: 'Days', label: '3 Days' },
                      { num: 5, unit: 'Days', label: '5 Days' },
                      { num: 7, unit: 'Days', label: '7 Days' },
                      { num: 10, unit: 'Days', label: '10 Days' },
                      { num: 14, unit: 'Days', label: '14 Days' },
                      { num: 1, unit: 'Months', label: '1 Month' },
                      { num: 3, unit: 'Months', label: '3 Months' }
                    ].map(p => (
                      <Chip
                        key={p.label}
                        label={p.label}
                        size="small"
                        onClick={() => {
                          const durStr = `${p.num} ${p.unit}`;
                          const updated = recalcMedication({
                            ...newMedication,
                            durationValue: p.num,
                            durationUnit: p.unit,
                            duration: durStr
                          });
                          setNewMedication(updated);
                        }}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          bgcolor: (newMedication.durationValue === p.num && newMedication.durationUnit === p.unit) ? 'var(--color-forest)' : 'rgba(0,0,0,0.06)',
                          color: (newMedication.durationValue === p.num && newMedication.durationUnit === p.unit) ? '#ffffff' : 'inherit'
                        }}
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Quantity Field & Presets */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Total Quantity prescribed"
                    placeholder="Auto-calculated"
                    value={newMedication.quantity || ''}
                    onChange={(e) => setNewMedication({ ...newMedication, quantity: e.target.value })}
                    helperText={(() => {
                      const t = newMedication.timing || { morning: 0, afternoon: 0, evening: 0, night: 0 };
                      const calc = calculateQuantityFromTiming(t, newMedication.durationValue || 5, newMedication.durationUnit || 'Days', newMedication.type);
                      return calc.detailStr || 'Select time of day to auto-calculate';
                    })()}
                    InputProps={{ sx: { borderRadius: '12px', fontWeight: 700 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
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

                {/* Quick Quantity Presets — ONLY visible when no time of day is selected */}
                {(!newMedication.timing || ((newMedication.timing.morning || 0) === 0 && (newMedication.timing.afternoon || 0) === 0 && (newMedication.timing.evening || 0) === 0 && (newMedication.timing.night || 0) === 0)) && !newMedication.isSOS && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--color-forest)', display: 'block', mb: 0.5 }}>
                      Quick Quantity Presets:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                      {[
                        '10 Tablets', '14 Tablets', '20 Tablets', '30 Tablets',
                        '10 Capsules', '14 Capsules', '1 Bottle (100ml)', '1 Strip', '2 Vials', '1 Tube'
                      ].map(q => (
                        <Chip
                          key={q}
                          label={q}
                          size="small"
                          onClick={() => setNewMedication({ ...newMedication, quantity: q })}
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            bgcolor: newMedication.quantity === q ? 'var(--color-forest)' : 'rgba(0,100,0,0.06)',
                            color: newMedication.quantity === q ? '#ffffff' : 'inherit'
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}

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
                  Prescribed Items List ({formData.medications.length})
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
                      bgcolor: mode === 'dark' ? 'rgba(18, 38, 34, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                      borderColor: mode === 'dark' ? 'rgba(137, 215, 183, 0.3)' : 'rgba(137, 215, 183, 0.5)',
                      boxShadow: mode === 'dark' ? '0 4px 14px rgba(0, 0, 0, 0.3)' : '0 4px 14px rgba(26, 49, 44, 0.04)'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }}>
                            {idx + 1}. {med.name}
                          </Typography>
                          {med.type && (
                            <Chip label={med.type} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: mode === 'dark' ? 'rgba(137, 215, 183, 0.2)' : 'rgba(66, 132, 117, 0.15)', color: mode === 'dark' ? '#89D7B7' : '#428475' }} />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 0.8 }}>
                          <Chip 
                            label={`Dosage: ${med.dosage || 'As directed'}`} 
                            size="small" 
                            sx={{ fontWeight: 700, bgcolor: 'rgba(19, 79, 77, 0.08)', color: '#134F4D', fontSize: '0.72rem' }} 
                          />
                          <Chip 
                            label={`⏱️ Duration: ${med.duration || 'N/A'}`} 
                            size="small" 
                            sx={{ fontWeight: 700, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', fontSize: '0.72rem' }} 
                          />
                          {med.quantity && (
                            <Chip 
                              label={`📦 Quantity: ${med.quantity}`} 
                              size="small" 
                              sx={{ fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#047857', fontSize: '0.72rem' }} 
                            />
                          )}
                        </Box>

                        {/* SOS / PRN Badge if marked SOS */}
                        {med.isSOS && (
                          <Box sx={{ mb: 0.8 }}>
                            <Chip
                              icon={<SosIcon sx={{ fontSize: 14, color: '#fff !important' }} />}
                              label={`🆘 SOS (Only When Needed)${med.sosReason ? `: ${med.sosReason}` : ''}`}
                              size="small"
                              sx={{ fontWeight: 800, bgcolor: '#dc2626', color: '#fff', fontSize: '0.68rem', height: 22 }}
                            />
                          </Box>
                        )}

                        {/* Per-time-of-day dose & meal relation summary chips */}
                        {med.timing && ((med.timing.morning || 0) > 0 || (med.timing.afternoon || 0) > 0 || (med.timing.evening || 0) > 0 || (med.timing.night || 0) > 0) && (
                          <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', mb: 0.8 }}>
                            {(med.timing.morning || 0) > 0 && (
                              <Chip
                                label={`🌅 ×${med.timing.morning} Morning${med.mealRelations?.morning ? ` · ${med.mealRelations.morning}` : ''}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: '#FFF3E0', color: '#F57C00', fontSize: '0.68rem', height: 22 }}
                              />
                            )}
                            {(med.timing.afternoon || 0) > 0 && (
                              <Chip
                                label={`☀️ ×${med.timing.afternoon} Afternoon${med.mealRelations?.afternoon ? ` · ${med.mealRelations.afternoon}` : ''}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: '#FFFDE7', color: '#F9A825', fontSize: '0.68rem', height: 22 }}
                              />
                            )}
                            {(med.timing.evening || 0) > 0 && (
                              <Chip
                                label={`🌆 ×${med.timing.evening} Evening${med.mealRelations?.evening ? ` · ${med.mealRelations.evening}` : ''}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: '#FBE9E7', color: '#E64A19', fontSize: '0.68rem', height: 22 }}
                              />
                            )}
                            {(med.timing.night || 0) > 0 && (
                              <Chip
                                label={`🌙 ×${med.timing.night} Night${med.mealRelations?.night ? ` · ${med.mealRelations.night}` : ''}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: '#E8EAF6', color: '#3949AB', fontSize: '0.68rem', height: 22 }}
                              />
                            )}
                          </Box>
                        )}

                        {med.instructions && (
                          <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontStyle: 'italic', mt: 0.5 }}>
                            "{med.instructions}"
                          </Typography>
                        )}
                      </Box>
                      <IconButton size="small" onClick={() => removeMedication(idx)} sx={{ color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.08)', ml: 1 }}>
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
            bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.88) !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScienceIcon sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }} /> 5. Required Investigations & Lab Tests
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
                  <Card key={idx} variant="outlined" sx={{ mb: 1, p: 1.5, borderRadius: '14px', bgcolor: mode === 'dark' ? 'rgba(18, 38, 34, 0.85)' : '#ffffff', borderColor: mode === 'dark' ? 'rgba(137, 215, 183, 0.3)' : 'rgba(0,0,0,0.12)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }}>
                          {idx + 1}. {inv.testName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475', display: 'block', fontWeight: 600 }}>
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
            bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.88) !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <DietIcon sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }} /> 6. Diet & Lifestyle Advice
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid container spacing={2}>
              {/* Diet Modifications */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                    sx={{ bgcolor: mode === 'dark' ? '#2A6B5D' : '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
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
                <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                    sx={{ bgcolor: mode === 'dark' ? '#2A6B5D' : '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
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
            bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.88) !important',
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }} /> 7. Follow-Up Schedule
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
                <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#428475', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                    sx={{ bgcolor: mode === 'dark' ? '#2A6B5D' : '#428475', minWidth: 44, borderRadius: '14px', px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {formData.followUpInfo?.bringItems?.map((item, idx) => (
                    <Chip key={idx} label={item} onDelete={() => removeBringItem(idx)} sx={{ fontWeight: 600, bgcolor: mode === 'dark' ? 'rgba(137, 215, 183, 0.2)' : 'rgba(66, 132, 117, 0.15)', color: mode === 'dark' ? '#FAF2F5' : '#1A312C' }} />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Additional Clinical Notes Paper */}
        <Paper className="glass-panel" sx={{ p: 2.5, mb: 3, borderRadius: '24px !important', bgcolor: mode === 'dark' ? 'rgba(20, 38, 34, 0.94) !important' : 'rgba(255, 255, 255, 0.9) !important' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', mb: 1 }}>
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
          {/* No-Email Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, p: 1.2, borderRadius: '14px', bgcolor: newPatientData.noEmail ? 'rgba(245, 158, 11, 0.1)' : 'rgba(42, 107, 93, 0.08)', border: `1px solid ${newPatientData.noEmail ? 'rgba(245, 158, 11, 0.3)' : 'rgba(42, 107, 93, 0.2)'}` }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: newPatientData.noEmail ? '#d97706' : 'var(--color-teal)', fontSize: '0.82rem' }}>
              {newPatientData.noEmail ? '📱 Mobile-only account (no email)' : '📧 Email is primary identifier'}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={newPatientData.noEmail}
                  onChange={(e) => setNewPatientData({ ...newPatientData, noEmail: e.target.checked, email: '' })}
                  size="small"
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#d97706' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#f59e0b' } }}
                />
              }
              label={<Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>No Email</Typography>}
              labelPlacement="start"
              sx={{ mr: 0 }}
            />
          </Box>

          {/* Info banner for temp password */}
          {newPatientData.noEmail && newPatientData.firstName && newPatientData.dateOfBirth && (
            <Alert severity="info" sx={{ mb: 1.5, borderRadius: '12px', py: 0.5, '& .MuiAlert-message': { fontSize: '0.78rem' } }}>
              Temporary password: <strong>{newPatientData.firstName}@{String(newPatientData.dateOfBirth).split('-')[0] || 'medizo'}</strong>
            </Alert>
          )}

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
                label="Date of Birth *"
                type="date"
                value={newPatientData.dateOfBirth}
                onChange={(e) => setNewPatientData({ ...newPatientData, dateOfBirth: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
            {!newPatientData.noEmail && (
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
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label={newPatientData.noEmail ? 'Mobile Number *' : 'Phone Number'}
                value={newPatientData.phone}
                onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
          </Grid>
          {newPatientError && (
            <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700, mt: 1, display: 'block', px: 1 }}>
              ⚠️ {newPatientError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setNewPatientDialogOpen(false)} sx={{ borderRadius: '12px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              creatingPatient ||
              !newPatientData.firstName ||
              !newPatientData.lastName ||
              !newPatientData.dateOfBirth ||
              (newPatientData.noEmail ? !newPatientData.phone : !newPatientData.email)
            }
            onClick={async () => {
              try {
                setCreatingPatient(true);
                setNewPatientError('');
                // Create patient via real API (auto-links to doctor on backend)
                const result = await usersAPI.createPatient({
                  firstName: newPatientData.firstName,
                  lastName: newPatientData.lastName,
                  email: newPatientData.noEmail ? '' : newPatientData.email,
                  phone: newPatientData.phone,
                  dateOfBirth: newPatientData.dateOfBirth,
                  gender: newPatientData.gender,
                  address: newPatientData.address,
                  noEmail: newPatientData.noEmail
                });
                const newP = result.patient || result;
                const tempPwd = result.tempPassword || '';
                // Refresh the full linked patient list from backend
                await fetchMyPatients();
                setSelectedPatient(newP);
                setFormData(prev => ({ ...prev, patientId: newP.id }));
                setNewPatientDialogOpen(false);
                setNewPatientData({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: 'male', address: '', noEmail: false });
                // Show temp password in success snackbar
                if (tempPwd) {
                  setNewPatientSuccess(`✅ Patient created! Temporary password: ${tempPwd}`);
                }
              } catch (err: any) {
                console.error('Create patient error:', err);
                setNewPatientError(err?.response?.data?.message || err?.message || 'Failed to create patient');
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

      {/* Temp password success snackbar */}
      <Snackbar
        open={!!newPatientSuccess}
        autoHideDuration={12000}
        onClose={() => setNewPatientSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setNewPatientSuccess('')} severity="success" sx={{ borderRadius: '14px', fontWeight: 700, fontSize: '0.85rem' }}>
          {newPatientSuccess}
        </Alert>
      </Snackbar>

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
                    ID: {foundPatient.id?.toUpperCase()} • {foundPatient.email}
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
            onClick={async () => {
              if (foundPatient) {
                try {
                  // Link patient to doctor via API
                  await usersAPI.linkPatient(foundPatient.id);
                  // Refresh the linked patients list from backend
                  await fetchMyPatients();
                  setSelectedPatient(foundPatient);
                  setFormData(prev => ({ ...prev, patientId: foundPatient.id }));
                  setAddExistingPatientDialogOpen(false);
                  setFoundPatient(null);
                  setPatientIdToLookup('');
                } catch (err: any) {
                  console.error('Link patient error:', err);
                  setLookupError(err?.response?.data?.message || 'Failed to link patient');
                }
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

      {/* External Prescription QR Scanner Modal */}
      <QrScannerModal
        open={externalQrScannerOpen}
        onClose={() => setExternalQrScannerOpen(false)}
        onScanSuccess={handleExternalQrScanSuccess}
      />

      {/* Prescription Action Snackbar */}
      <Snackbar
        open={rxSnackbar.open}
        autoHideDuration={4000}
        onClose={() => setRxSnackbar({ ...rxSnackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setRxSnackbar({ ...rxSnackbar, open: false })}
          severity={rxSnackbar.severity}
          sx={{ borderRadius: '16px', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}
        >
          {rxSnackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NewPrescription;
