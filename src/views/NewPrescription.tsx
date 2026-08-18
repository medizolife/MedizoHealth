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
import InvestigationDetailDialog from '../components/InvestigationDetailDialog';
import { FamilyProfile, CreateFamilyProfileData, RELATIONSHIP_LABELS, RELATIONSHIP_ICONS } from '../types/familyProfile';
import { getProfilesByAccountId, createFamilyProfileForAccount } from '../services/familyProfiles';
import DigiLockerGuard from '../components/DigiLockerGuard';
import { healthcareApi } from '../services/healthcareExtensionsApi';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
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
  Switch,
  LinearProgress
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
  Edit as EditIcon,
  ReportProblem as WarningBadgeIcon,
  History as HistoryIcon,
  QrCodeScanner as QrCodeScannerIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Bloodtype as BloodIcon,
  ExpandLess as ExpandLessIcon,
  ChevronRight as ChevronRightIcon,
  Download as DownloadIcon,
  Autorenew as ContinueTrailIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useThemeContext } from '../contexts/ThemeContext';
import DigiLockerWarmupModal from '../components/DigiLockerWarmupModal';
import { CreatePrescriptionData, MedicationItem, Investigation, VitalSigns, FollowUpInfo } from '../types/prescription';

const NewPrescription = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { user } = authState;
  const { mode } = useThemeContext();

  // Stepper Card state (2 sections per step card flow)
  const [activeStep, setActiveStep] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'all'>('cards');

  const FORM_STEPS = [
    { label: 'Patient & Vitals', icon: '👤', subtitle: 'Select patient & record consultation vitals' },
    { label: 'Clinical & Diagnosis', icon: '🩺', subtitle: 'Complaints, findings & provisional diagnosis' },
    { label: 'Rx & Lab Tests', icon: '💊', subtitle: 'Prescribe medications & diagnostic tests' },
    { label: 'Advice & Follow-Up', icon: '🍏', subtitle: 'Diet advice, follow-up schedule & final remarks' },
  ];

  const handleNextStep = () => {
    if (activeStep === 0 && !selectedPatient) {
      setError('Please select a target patient before proceeding.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    setError(null);
    setActiveStep(prev => Math.min(FORM_STEPS.length - 1, prev + 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setError(null);
    setActiveStep(prev => Math.max(0, prev - 1));
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };
  
  // Redirect non-doctors away from prescription creation page
  useEffect(() => {
    if (user && user.role !== 'doctor') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

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

  // Guardian state (for minor patients under 15)
  const [guardianMode, setGuardianMode] = useState<'link' | 'create'>('link');
  const [guardianSearchQuery, setGuardianSearchQuery] = useState('');
  const [guardianSearching, setGuardianSearching] = useState(false);
  const [guardianFound, setGuardianFound] = useState<any>(null);
  const [guardianCreateData, setGuardianCreateData] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  // Helper: compute patient age from DOB
  const computePatientAge = (dob: string): number => {
    if (!dob) return 99;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };
  const isMinorPatient = computePatientAge(newPatientData.dateOfBirth) < 15;
  const isGuardianResolved = guardianFound !== null || (guardianMode === 'create' && guardianCreateData.firstName && guardianCreateData.lastName && (guardianCreateData.email || guardianCreateData.phone));

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
  const [activeTreatmentTrailRxId, setActiveTreatmentTrailRxId] = useState<string | null>(null);
  const [preTrailFormDataSnapshot, setPreTrailFormDataSnapshot] = useState<CreatePrescriptionData | null>(null);
  const [downloadingPdfRxId, setDownloadingPdfRxId] = useState<string | null>(null);

  // Family profile state for prescription targeting
  const [familyProfiles, setFamilyProfiles] = useState<FamilyProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<FamilyProfile | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Add family member under account modal state
  const [addFamilyMemberDialogOpen, setAddFamilyMemberDialogOpen] = useState(false);
  const [addingFamilyMember, setAddingFamilyMember] = useState(false);
  const [familyMemberForm, setFamilyMemberForm] = useState<CreateFamilyProfileData>({
    relationship: 'child',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    bloodType: '',
    medicalHistory: ''
  });
  const [familyMemberError, setFamilyMemberError] = useState('');

  const handleOpenAddFamilyMemberDialog = () => {
    setFamilyMemberForm({
      relationship: 'child',
      firstName: '',
      lastName: selectedPatient?.lastName || '',
      dateOfBirth: '',
      gender: 'male',
      phone: selectedPatient?.phone || '',
      bloodType: '',
      medicalHistory: ''
    });
    setFamilyMemberError('');
    setAddFamilyMemberDialogOpen(true);
  };

  const handleAddFamilyMemberSubmit = async () => {
    if (!formData.patientId) {
      setFamilyMemberError('Please select a target patient first');
      return;
    }
    if (!familyMemberForm.firstName.trim()) {
      setFamilyMemberError('First name is required');
      return;
    }
    if (!familyMemberForm.lastName.trim()) {
      setFamilyMemberError('Last name is required');
      return;
    }

    try {
      setAddingFamilyMember(true);
      setFamilyMemberError('');
      const newProf = await createFamilyProfileForAccount(formData.patientId, {
        ...familyMemberForm,
        firstName: familyMemberForm.firstName.trim(),
        lastName: familyMemberForm.lastName.trim(),
        phone: familyMemberForm.phone || selectedPatient?.phone || ''
      });

      // Update familyProfiles state
      setFamilyProfiles(prev => {
        const exists = prev.some(p => p.id === newProf.id);
        return exists ? prev : [...prev, newProf];
      });

      // Auto-select the newly added family member
      setSelectedProfile(newProf);
      setAddFamilyMemberDialogOpen(false);
      setRxSnackbar({
        open: true,
        message: `✅ Family member ${newProf.firstName} (${RELATIONSHIP_LABELS[newProf.relationship] || newProf.relationship}) linked and selected!`,
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Error adding family member:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to add family member';
      setFamilyMemberError(msg);
    } finally {
      setAddingFamilyMember(false);
    }
  };

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

  // ─── Indian Billing & Consultation Fee State ───
  const [generateBillEnabled, setGenerateBillEnabled] = useState(true);
  const [billingVisitType, setBillingVisitType] = useState<'standard' | 'follow_up' | 'custom'>('standard');
  const [billingConsultFee, setBillingConsultFee] = useState<number>(500);
  const [billingFollowUpFee, setBillingFollowUpFee] = useState<number>(0);
  const [billingFollowUpEligibility, setBillingFollowUpEligibility] = useState<any>(null);
  const [billingGstType, setBillingGstType] = useState<'exempt' | 'cgst_sgst' | 'igst'>('exempt');
  const [billingGstRate, setBillingGstRate] = useState<number>(18);
  const [billingDiscountType, setBillingDiscountType] = useState<'percent' | 'flat'>('percent');
  const [billingDiscountPercent, setBillingDiscountPercent] = useState<number>(0);
  const [billingDiscount, setBillingDiscount] = useState<number>(0);
  const [billingConcessionReason, setBillingConcessionReason] = useState<string>('');
  const [billingPaymentStatus, setBillingPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [billingPaymentMethod, setBillingPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [billingSendWhatsapp, setBillingSendWhatsapp] = useState<boolean>(true);
  const [billingSendEmail, setBillingSendEmail] = useState<boolean>(true);
  const [billingSendPatientApp, setBillingSendPatientApp] = useState<boolean>(true);
  const [billingSendToPatient, setBillingSendToPatient] = useState<boolean>(true);
  const [billingProcedures, setBillingProcedures] = useState<Array<{ description: string; unitPrice: number; quantity: number; hsnSacCode: string; itemType: string }>>([]);
  const [newProcName, setNewProcName] = useState('');
  const [newProcPrice, setNewProcPrice] = useState(150);

  useEffect(() => {
    // Load doctor rate card defaults
    healthcareApi.getDoctorRateCard().then((res: any) => {
      if (res?.success && res?.rateCard) {
        setBillingConsultFee(res.rateCard.consultationFee ?? 500);
        setBillingFollowUpFee(res.rateCard.followUpFee ?? 0);
        setBillingGstType(res.rateCard.defaultGstType || 'exempt');
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.patientId) {
      healthcareApi.checkFollowupEligibility(formData.patientId).then((res: any) => {
        if (res?.success && res?.isEligible) {
          setBillingFollowUpEligibility(res);
          setBillingVisitType('follow_up');
          setBillingConsultFee(res.followUpFee ?? 0);
        } else {
          setBillingFollowUpEligibility(null);
          setBillingVisitType('standard');
        }
      }).catch(() => {});
    }
  }, [formData.patientId]);

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

  // Investigation detail dialog state
  const [invDialogOpen, setInvDialogOpen] = useState(false);
  const [invDialogTest, setInvDialogTest] = useState<Investigation>({ testName: '', reason: '', priority: 'Normal', fasting: '' });
  const [invDialogIsCustom, setInvDialogIsCustom] = useState(false);
  const [invDialogEditIndex, setInvDialogEditIndex] = useState<number | null>(null);

  const [newMedication, setNewMedication] = useState<MedicationItem>({
    name: '',
    type: 'Tablet',
    dosage: '',
    frequency: 'Daily (Everyday)',
    intervalDays: 1,
    intervalType: 'daily',
    intervalLabel: 'Daily',
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

  // Custom interval input state — kept separate so typing multi-digit numbers (e.g. "36") doesn't get wiped
  const [customIntervalText, setCustomIntervalText] = useState('');

  // Popover state for per-time-of-day dose count + meal relation
  const [mealPopoverAnchor, setMealPopoverAnchor] = useState<HTMLElement | null>(null);
  const [mealPopoverTimeKey, setMealPopoverTimeKey] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');

  const openMealPopover = (e: React.MouseEvent<HTMLElement>, key: 'morning' | 'afternoon' | 'evening' | 'night') => {
    setMealPopoverAnchor(e.currentTarget);
    setMealPopoverTimeKey(key);
  };

  const handlePatientChange = (e: SelectChangeEvent<string>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, patientId: val }));
  };

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
    medForm: string = 'Tablet',
    intervalDays: number = 1
  ) => {
    const m = timing.morning || 0;
    const a = timing.afternoon || 0;
    const e = timing.evening || 0;
    const n = timing.night || 0;
    const totalDosesPerDay = m + a + e + n;

    const val = typeof durVal === 'number' ? durVal : parseInt(String(durVal), 10) || 0;
    if (val <= 0 || totalDosesPerDay <= 0) return { qtyVal: 0, qtyUnit: getDispensaryUnit(medForm), qtyStr: '', detailStr: '' };

    let totalCalendarDays = val;
    if (durUnit === 'Weeks') totalCalendarDays = val * 7;
    if (durUnit === 'Months') totalCalendarDays = val * 30;

    const interval = Math.max(1, intervalDays || 1);
    const activeDoseDays = Math.ceil(totalCalendarDays / interval);
    const intervalNote = interval === 1 
      ? 'Daily' 
      : interval === 2 
        ? 'Alternate Days (Every 2d)' 
        : `Every ${interval} Days`;

    if (medForm === 'Syrup') {
      const mlPerDoseDay = totalDosesPerDay * 5; // 1 dose = 1 tsp = 5ml
      const totalMl = mlPerDoseDay * activeDoseDays;
      const bottles = Math.ceil(totalMl / 100) || 1;
      return {
        qtyVal: bottles,
        qtyUnit: 'Bottles',
        qtyStr: `${bottles} Bottle${bottles > 1 ? 's' : ''} (${totalMl}ml total)`,
        detailStr: interval > 1
          ? `⚡ ${mlPerDoseDay}ml/dose-day × ${activeDoseDays} dose days (${intervalNote} over ${totalCalendarDays}d) = ${totalMl}ml total → ${bottles} Bottle(s)`
          : `⚡ ${mlPerDoseDay}ml/day (${totalDosesPerDay} tsp) × ${totalCalendarDays} Days = ${totalMl}ml total → ${bottles} Bottle(s)`
      };
    }

    if (medForm === 'Drops') {
      const dropsPerDoseDay = totalDosesPerDay * 5; // 1 dose = 5 drops
      const totalDrops = dropsPerDoseDay * activeDoseDays;
      const bottles = Math.ceil(totalDrops / 200) || 1; // 200 drops per 10ml bottle
      return {
        qtyVal: bottles,
        qtyUnit: 'Bottles',
        qtyStr: `${bottles} Bottle${bottles > 1 ? 's' : ''} (${totalDrops} drops total)`,
        detailStr: interval > 1
          ? `⚡ ${dropsPerDoseDay} drops/dose-day × ${activeDoseDays} dose days (${intervalNote} over ${totalCalendarDays}d) = ${totalDrops} drops total → ${bottles} Bottle(s)`
          : `⚡ ${dropsPerDoseDay} drops/day × ${totalCalendarDays} Days = ${totalDrops} drops total → ${bottles} Bottle(s)`
      };
    }

    if (medForm === 'Ointment') {
      const tubes = activeDoseDays > 14 ? 2 : 1;
      return {
        qtyVal: tubes,
        qtyUnit: 'Tubes',
        qtyStr: `${tubes} Tube${tubes > 1 ? 's' : ''}`,
        detailStr: `⚡ ${tubes} Tube (${activeDoseDays} application days, ${intervalNote})`
      };
    }

    // Tablets, Capsules, Injections
    const totalUnits = totalDosesPerDay * activeDoseDays;
    const unit = getDispensaryUnit(medForm);
    return {
      qtyVal: totalUnits,
      qtyUnit: unit,
      qtyStr: `${totalUnits} ${unit}`,
      detailStr: interval > 1
        ? `⚡ ${totalDosesPerDay} ${unit.toLowerCase()}/intake × ${activeDoseDays} dose days (${intervalNote} over ${totalCalendarDays}d) = ${totalUnits} ${unit}`
        : `⚡ ${totalDosesPerDay} ${unit.toLowerCase()}/day × ${totalCalendarDays} Days = ${totalUnits} ${unit}`
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

  // Recalculate quantity and dosage whenever timing, duration, SOS, or alteration interval changes
  const recalcMedication = (med: MedicationItem): MedicationItem => {
    const t = med.timing || { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const interval = Math.max(1, Number(med.intervalDays) || 1);
    const calc = calculateQuantityFromTiming(t, med.durationValue || 5, med.durationUnit || 'Days', med.type, interval);
    
    let freqStr = 'Daily (Everyday)';
    if (interval === 2) freqStr = 'Alternate Days (Every 2 Days)';
    else if (interval === 3) freqStr = 'Every 3 Days';
    else if (interval === 4) freqStr = 'Every 4 Days';
    else if (interval === 5) freqStr = 'Every 5 Days';
    else if (interval === 7) freqStr = 'Weekly (Every 7 Days)';
    else if (interval === 10) freqStr = 'Every 10 Days';
    else if (interval > 1) freqStr = `Every ${interval} Days`;

    return {
      ...med,
      intervalDays: interval,
      frequency: med.isSOS ? 'SOS — When Needed' : freqStr,
      intervalLabel: interval === 1 ? 'Daily' : interval === 2 ? 'Alternate Days' : `Every ${interval} Days`,
      dosage: buildDosageString(t, med.type, med.isSOS, med.sosReason),
      quantityValue: calc.qtyVal,
      quantityUnit: calc.qtyUnit,
      quantity: calc.qtyStr
    };
  };

  // Clean any existing SOS instructions or duplicate fragments from an instruction string
  const cleanSosInstructions = (inst: string = ''): string => {
    if (!inst) return '';
    return inst
      .replace(/(?:^|,\s*|\s+)(?:Take\s+only\s+when\s+needed(?:\s+for\s+[^,;\n]+)?|SOS(?:\s+—\s+[^,;\n]+)?)(?:,\s*|$)/gi, ' ')
      .replace(/\s*,\s*,+/g, ',')
      .replace(/^[\s,]+|[\s,]+$/g, '')
      .trim();
  };

  // Build standard SOS instruction phrase
  const buildSosInstruction = (reason?: string): string => {
    const r = (reason || '').trim();
    return r ? `Take only when needed for ${r}` : 'Take only when needed';
  };

  // Format full instructions with or without SOS clause cleanly
  const formatInstructionsWithSos = (currentInst: string = '', isSOS: boolean, reason?: string): string => {
    const base = cleanSosInstructions(currentInst);
    if (!isSOS) {
      return base;
    }
    const sosClause = buildSosInstruction(reason);
    return base ? `${base}, ${sosClause}` : sosClause;
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
    if (user?.digilockerVerified) {
      setDigilockerVerified(true);
    }
    digilockerAPI.getStatus()
      .then(data => {
        const isVer = Boolean(data.verified || user?.digilockerVerified);
        setDigilockerVerified(isVer);
        if (!isVer) {
          digilockerAPI.pingServer().catch(() => {});
        }
      })
      .catch(() => {
        setDigilockerVerified(Boolean(user?.digilockerVerified));
        digilockerAPI.pingServer().catch(() => {});
      });
  }, [user]);

  // Update selected patient when patientId changes + fetch past prescriptions
  useEffect(() => {
    if (formData.patientId) {
      const patient = patients.find(p => p.id === formData.patientId);
      setSelectedPatient(patient || null);

      // Fetch family profiles for this patient account
      setLoadingProfiles(true);
      setFamilyProfiles([]);
      setSelectedProfile(null);
      getProfilesByAccountId(formData.patientId)
        .then((profiles) => {
          setFamilyProfiles(profiles);
          // Auto-select if only one profile (self)
          if (profiles.length === 1) {
            setSelectedProfile(profiles[0]);
          }
        })
        .catch(err => {
          console.error('Error fetching family profiles:', err);
          // If profiles API fails, still allow prescription with just the account
        })
        .finally(() => setLoadingProfiles(false));
      
      // Fetch this doctor's past prescriptions for the selected patient
      setLoadingPastRx(true);
      setPastDoctorPrescriptions([]);
      setScannedExternalPrescriptions([]);
      setActiveTreatmentTrailRxId(null);
      setPreTrailFormDataSnapshot(null);
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
      setFamilyProfiles([]);
      setSelectedProfile(null);
      setPastDoctorPrescriptions([]);
      setScannedExternalPrescriptions([]);
      setActiveTreatmentTrailRxId(null);
      setPreTrailFormDataSnapshot(null);
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

  // Toggle continue treatment trail for a past prescription (mutually exclusive & reversible)
  const handleToggleTreatmentTrail = (rx: Prescription) => {
    // If the clicked prescription is currently active -> TOGGLE OFF (Revert)
    if (activeTreatmentTrailRxId === rx.id) {
      if (preTrailFormDataSnapshot) {
        setFormData(preTrailFormDataSnapshot);
      }
      setActiveTreatmentTrailRxId(null);
      setPreTrailFormDataSnapshot(null);
      setRxSnackbar({
        open: true,
        message: '↩️ Treatment trail removed — prescription form restored.',
        severity: 'info'
      });
      return;
    }

    // TOGGLE ON or SWITCH to this prescription
    const baseline = preTrailFormDataSnapshot || formData;
    if (!preTrailFormDataSnapshot) {
      setPreTrailFormDataSnapshot(formData);
    }

    // Smart merge: deduplicate string arrays
    const mergeUnique = (existing: string[] | undefined, incoming: string[] | undefined): string[] => {
      if (!incoming || incoming.length === 0) return existing || [];
      return Array.from(new Set([...(existing || []), ...incoming]));
    };

    // Smart merge medications: skip if same name already exists in baseline
    const existingMedNames = new Set((baseline.medications || []).map(m => (m.name || '').toLowerCase().trim()));
    const newMeds = (rx.medications || []).filter(m => {
      const name = (m.name || (m as any).medicationName || '').toLowerCase().trim();
      return name && !existingMedNames.has(name);
    });

    // Extract medication names from past Rx as "current medications" (patient is continuing them)
    const pastMedNames = (rx.medications || []).map(m => m.name || (m as any).medicationName || '').filter(Boolean);

    setFormData({
      ...baseline,
      // Diagnosis & complaints — merge without duplicates
      provisionalDiagnosis: mergeUnique(baseline.provisionalDiagnosis, rx.provisionalDiagnosis),
      presentingComplaints: mergeUnique(baseline.presentingComplaints, rx.presentingComplaints),
      clinicalFindings: mergeUnique(baseline.clinicalFindings, rx.clinicalFindings),
      // Medications — smart merge (skip duplicates by name)
      medications: [...(baseline.medications || []), ...newMeds],
      // Past prescribed meds become "current medications" (ongoing)
      currentMedications: mergeUnique(baseline.currentMedications, pastMedNames),
      // Medication notes
      medicationNotes: mergeUnique(baseline.medicationNotes, rx.medicationNotes),
      // Investigations — carry forward for follow-up monitoring
      investigations: [...(baseline.investigations || []), ...(rx.investigations || [])],
      // Dietary & lifestyle
      dietModifications: mergeUnique(baseline.dietModifications, rx.dietModifications),
      lifestyleChanges: mergeUnique(baseline.lifestyleChanges, rx.lifestyleChanges),
      warningSigns: mergeUnique(baseline.warningSigns, rx.warningSigns),
    });

    setActiveTreatmentTrailRxId(rx.id);
    const addedCount = (rx.medications || []).length;
    setRxSnackbar({
      open: true,
      message: `🔄 Treatment trail active — diagnosis, ${addedCount} medication(s) & care plan loaded.`,
      severity: 'success'
    });
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
      setCustomIntervalText('');
      setNewMedication({
        name: '',
        type: 'Tablet',
        dosage: '',
        frequency: 'Daily (Everyday)',
        intervalDays: 1,
        intervalType: 'daily',
        intervalLabel: 'Daily',
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



  // Remove investigation
  const removeInvestigation = (index: number) => {
    setFormData({
      ...formData,
      investigations: formData.investigations?.filter((_, i) => i !== index)
    });
  };

  // Open investigation dialog for a predefined test
  const openInvDialogForTest = (testName: string) => {
    setInvDialogTest({ testName, reason: 'Routine Evaluation', priority: 'Normal', fasting: 'Not Required' });
    setInvDialogIsCustom(false);
    setInvDialogEditIndex(null);
    setInvDialogOpen(true);
  };

  // Open investigation dialog for a custom test
  const openInvDialogCustom = () => {
    setInvDialogTest({ testName: '', reason: 'Routine Evaluation', priority: 'Normal', fasting: 'Not Required' });
    setInvDialogIsCustom(true);
    setInvDialogEditIndex(null);
    setInvDialogOpen(true);
  };

  // Open investigation dialog for editing an existing investigation
  const openInvDialogForEdit = (index: number) => {
    const inv = formData.investigations?.[index];
    if (inv) {
      setInvDialogTest({ ...inv });
      setInvDialogIsCustom(true); // editable test name
      setInvDialogEditIndex(index);
      setInvDialogOpen(true);
    }
  };

  // Handle investigation dialog confirm
  const handleInvDialogConfirm = (investigation: Investigation) => {
    if (invDialogEditIndex !== null) {
      // Editing existing investigation
      const updated = [...(formData.investigations || [])];
      updated[invDialogEditIndex] = investigation;
      setFormData({ ...formData, investigations: updated });
    } else {
      // Adding new investigation
      setFormData({
        ...formData,
        investigations: [...(formData.investigations || []), investigation]
      });
    }
    setInvDialogOpen(false);
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

    // In card mode, only allow submission when the doctor is on the final step (Step 4: Advice & Follow-Up)
    if (viewMode === 'cards' && activeStep < FORM_STEPS.length - 1) {
      handleNextStep();
      return;
    }
    
    if (!formData.patientId) {
      setError('Please select a patient before issuing prescription');
      setActiveStep(0);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    // If multiple profiles exist, require profile selection
    if (familyProfiles.length > 1 && !selectedProfile) {
      setError('Please select which family member this prescription is for');
      setActiveStep(0);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (!formData.medications || formData.medications.length === 0) {
      setError('Please add at least one prescribed medication');
      setActiveStep(2);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Build prescription data with profile info if available
      const prescriptionData: any = { ...formData };
      if (selectedProfile) {
        prescriptionData.familyProfileId = selectedProfile.id;
        prescriptionData.accountId = selectedProfile.accountId;
        prescriptionData.patientDisplayId = selectedProfile.patientDisplayId;
        prescriptionData.patientName = `${selectedProfile.firstName || ''} ${selectedProfile.lastName || ''}`.trim();
        prescriptionData.patientGender = selectedProfile.gender || '';
        prescriptionData.patientDOB = selectedProfile.dateOfBirth || '';
        if (selectedProfile.dateOfBirth) {
          const dobTime = new Date(selectedProfile.dateOfBirth).getTime();
          if (!isNaN(dobTime)) {
            const years = Math.floor((Date.now() - dobTime) / (365.25 * 86400000));
            if (years >= 0 && years < 150) prescriptionData.patientAge = String(years);
          }
        }
      } else if (selectedPatient) {
        prescriptionData.patientName = `${selectedPatient.firstName || ''} ${selectedPatient.lastName || ''}`.trim();
        prescriptionData.patientGender = selectedPatient.gender || '';
        prescriptionData.patientDOB = selectedPatient.dateOfBirth || (selectedPatient as any).dob || '';
        prescriptionData.patientEmail = selectedPatient.email || '';
        prescriptionData.patientPhone = selectedPatient.phone || selectedPatient.contactNumber || '';
        const dobVal = selectedPatient.dateOfBirth || (selectedPatient as any).dob;
        if (dobVal) {
          const dobTime = new Date(dobVal).getTime();
          if (!isNaN(dobTime)) {
            const years = Math.floor((Date.now() - dobTime) / (365.25 * 86400000));
            if (years >= 0 && years < 150) prescriptionData.patientAge = String(years);
          }
        }
      }
      
      const prescription = await createPrescription(prescriptionData);
      
      // Auto-generate Bill & Record Payment if enabled
      if (generateBillEnabled && prescription?.id) {
        try {
          const finalConsultFee = billingVisitType === 'follow_up' 
            ? billingFollowUpFee 
            : (billingVisitType === 'standard' ? billingConsultFee : Number(billingConsultFee));

          const activeChannels = [
            billingSendWhatsapp && 'whatsapp_sms',
            billingSendEmail && 'email',
            billingSendPatientApp && 'patient_app'
          ].filter(Boolean);

          await healthcareApi.generateBillFromPrescription(prescription.id, {
            consultationFee: Number(finalConsultFee),
            visitType: billingVisitType,
            customItems: billingProcedures,
            gstType: billingGstType,
            gstRate: billingGstType === 'exempt' ? 0 : Number(billingGstRate),
            applyGst: billingGstType !== 'exempt',
            discount: Number(billingDiscount),
            concessionReason: billingConcessionReason,
            markAsPaid: billingPaymentStatus === 'paid',
            paymentMethod: billingPaymentMethod,
            sendToPatient: activeChannels.length > 0,
            dispatchChannel: activeChannels.join(',') || 'none'
          });
        } catch (bErr) {
          console.error('Auto-bill generation notice:', bErr);
        }
      }

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

  const isDoctorVerified = Boolean(user?.digilockerVerified || digilockerVerified === true);

  if (user?.role === 'doctor' && !isDoctorVerified) {
    return <DigiLockerGuard title="Prescription Page Locked" message="You must verify your identity via DigiLocker before opening the prescription creation page." />;
  }
  
  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 2, sm: 3.5 }, pb: { xs: 24, sm: 10 }, px: { xs: 1.5, sm: 3, md: 4 }, maxWidth: '1260px', mx: 'auto' }} className="animate-slide-up">
      
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
                }}
                disabled={digilockerLoading}
                startIcon={<SuccessIcon sx={{ fontSize: 18 }} />}
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
                Verify with DigiLocker
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
      
      {/* ─── Modern Stepper Header & View Mode Switch ─── */}
      <Paper
        className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'}
        sx={{
          display: { xs: 'none', sm: 'block' },
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: '24px !important',
          border: mode === 'dark' ? '1px solid rgba(137, 215, 183, 0.25)' : '1px solid rgba(66, 132, 117, 0.2)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 2, gap: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.05rem' }}>
              {FORM_STEPS[activeStep].icon} {FORM_STEPS[activeStep].label}
            </Typography>
            <Typography variant="caption" sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475', fontWeight: 700 }}>
              Step {activeStep + 1} of 4 • {FORM_STEPS[activeStep].subtitle}
            </Typography>
          </Box>

          {/* View Mode Switcher */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5, bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.05)', p: 0.5, borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <Button
              size="small"
              onClick={() => setViewMode('cards')}
              sx={{
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.72rem',
                px: 1.8,
                py: 0.6,
                background: viewMode === 'cards' ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : 'transparent',
                color: viewMode === 'cards' ? '#ffffff' : mode === 'dark' ? '#34D399' : '#64748B',
                boxShadow: viewMode === 'cards' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                textTransform: 'none'
              }}
            >
              🎴 Card View (2 Sections/Step)
            </Button>
            <Button
              size="small"
              onClick={() => setViewMode('all')}
              sx={{
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.72rem',
                px: 1.8,
                py: 0.6,
                background: viewMode === 'all' ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : 'transparent',
                color: viewMode === 'all' ? '#ffffff' : mode === 'dark' ? '#34D399' : '#64748B',
                boxShadow: viewMode === 'all' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                textTransform: 'none'
              }}
            >
              📄 Show All Sections
            </Button>
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', fontSize: '0.75rem', letterSpacing: 0.2 }}>
              Prescription Progress
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 900, color: mode === 'dark' ? '#34D399' : '#059669', fontSize: '0.75rem' }}>
              {Math.round(((activeStep + 1) / 4) * 100)}% Completed
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={((activeStep + 1) / 4) * 100}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(226, 232, 240, 0.8)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background: 'linear-gradient(90deg, #059669 0%, #10B981 50%, #34D399 100%)',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
              }
            }}
          />
        </Box>

        {/* 4 Interactive Step Indicator Cards */}
        <Grid container spacing={1.5}>
          {FORM_STEPS.map((step, idx) => {
            const isActive = activeStep === idx;
            const isCompleted = activeStep > idx;
            return (
              <Grid item xs={6} sm={3} key={idx}>
                <Paper
                  onClick={() => {
                    setActiveStep(idx);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: '20px',
                    cursor: 'pointer',
                    border: isActive
                      ? '2px solid #10B981'
                      : isCompleted
                      ? '1px solid rgba(16, 185, 129, 0.35)'
                      : '1px solid rgba(0,0,0,0.06)',
                    bgcolor: isActive
                      ? mode === 'dark' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(16, 185, 129, 0.08)'
                      : isCompleted
                      ? mode === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)'
                      : mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                    boxShadow: isActive
                      ? '0 8px 24px -4px rgba(16, 185, 129, 0.25)'
                      : '0 2px 8px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: '#10B981',
                      boxShadow: '0 6px 18px rgba(16, 185, 129, 0.18)'
                    }
                  }}
                >
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      fontSize: '1rem',
                      fontWeight: 900,
                      background: isActive
                        ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                        : isCompleted
                        ? 'linear-gradient(135deg, #047857 0%, #059669 100%)'
                        : mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      color: isActive || isCompleted ? '#ffffff' : mode === 'dark' ? '#FAF2F5' : '#64748B',
                      boxShadow: isActive ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none'
                    }}
                  >
                    {isCompleted ? <CheckIcon sx={{ fontSize: 20, color: '#ffffff' }} /> : step.icon}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: isActive ? (mode === 'dark' ? '#FAF2F5' : '#0F172A') : '#64748B', display: 'block', lineHeight: 1.25, fontSize: '0.78rem' }} noWrap>
                      {idx + 1}. {step.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isCompleted ? '#10B981' : isActive ? '#059669' : '#94A3B8', fontSize: '0.65rem', fontWeight: 800, display: 'block' }} noWrap>
                      {isCompleted ? '✓ Completed' : isActive ? '● Active Step' : 'Pending'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
      
      <Box component="form" onSubmit={handleSubmit}>
        
        {/* ═══ STEP 1: PATIENT SELECTION & VITAL SIGNS ═══ */}
        {(viewMode === 'all' || activeStep === 0) && (
          <Box 
            key={activeStep === 0 ? 'step-0' : 'step-all-0'}
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 0,
              animation: 'stepCardFadeIn 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
              '@keyframes stepCardFadeIn': {
                '0%': { opacity: 0, transform: 'translateY(16px) scale(0.992)' },
                '100%': { opacity: 1, transform: 'translateY(0) scale(1)' }
              }
            }}
          >
            {/* ─── 1. Patient Selection Card ─── */}
            <Paper 
              className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'}
              sx={{ 
                p: { xs: 2.2, sm: 3 }, 
                mb: 3, 
                borderRadius: '24px !important',
                background: mode === 'dark' ? 'rgba(15, 23, 42, 0.85) !important' : 'rgba(255, 255, 255, 0.95) !important',
                boxShadow: '0 10px 30px -5px rgba(16, 185, 129, 0.08) !important'
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', mb: 2.5, gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PersonIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', letterSpacing: -0.2 }}>
                    1. Select Target Patient <Box component="span" sx={{ color: '#EF4444' }}>*</Box>
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PersonAddIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setNewPatientDialogOpen(true)}
                    sx={{ 
                      flex: { xs: 1, sm: 'none' },
                      borderRadius: '14px', 
                      fontWeight: 800, 
                      fontSize: '0.78rem', 
                      py: 0.9,
                      px: 2,
                      background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                      textTransform: 'none',
                      '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 6px 18px rgba(16, 185, 129, 0.4)' }
                    }}
                  >
                    + New Patient
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PersonSearchIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setAddExistingPatientDialogOpen(true)}
                    sx={{ 
                      flex: { xs: 1, sm: 'none' },
                      borderRadius: '14px', 
                      fontWeight: 800, 
                      fontSize: '0.78rem', 
                      py: 0.9,
                      px: 2,
                      borderColor: mode === 'dark' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.4)', 
                      color: mode === 'dark' ? '#34D399' : '#059669',
                      bgcolor: mode === 'dark' ? 'rgba(52, 211, 153, 0.06)' : 'rgba(16, 185, 129, 0.05)',
                      textTransform: 'none',
                      '&:hover': { bgcolor: mode === 'dark' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.12)' }
                    }}
                  >
                    + Add Existing
                  </Button>
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    id="patient-search-select"
                    options={patients}
                    value={patients.find(p => (p.id || (p as any)._id) === formData.patientId) || null}
                    onChange={(_, newValue) => {
                      setFormData(prev => ({
                        ...prev,
                        patientId: newValue ? (newValue.id || (newValue as any)._id) : ''
                      }));
                    }}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      if (typeof option === 'string') return option;
                      const name = `${option.firstName || ''} ${option.lastName || ''}`.trim();
                      const detail = option.email || option.phone || '';
                      return detail ? `${name} (${detail})` : name;
                    }}
                    isOptionEqualToValue={(option, val) => 
                      Boolean(val && (option.id || (option as any)._id) === (val.id || (val as any)._id))
                    }
                    filterOptions={(options, { inputValue }) => {
                      const q = (inputValue || '').trim().toLowerCase();
                      if (!q) return options;
                      return options.filter(p => {
                        const name = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
                        const email = (p.email || '').toLowerCase();
                        const phone = (p.phone || '').replace(/[\s\-\(\)\+]/g, '');
                        const cleanQ = q.replace(/[\s\-\(\)\+]/g, '');
                        return name.includes(q) || email.includes(q) || (cleanQ && phone.includes(cleanQ));
                      });
                    }}
                    ListboxProps={{
                      sx: {
                        maxHeight: '236px !important', // Exactly 4 items visible at ~56px each
                        overflowY: 'auto',
                        p: 0.5,
                        '&::-webkit-scrollbar': {
                          width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#10B981',
                          borderRadius: '10px',
                        },
                        '& .MuiAutocomplete-option': {
                          py: 1,
                          px: 1.5,
                          borderRadius: '12px',
                          my: 0.3,
                          transition: 'all 0.15s ease',
                          '&[aria-selected="true"]': {
                            bgcolor: mode === 'dark' ? 'rgba(16, 185, 129, 0.2) !important' : 'rgba(16, 185, 129, 0.12) !important',
                          },
                          '&:hover': {
                            bgcolor: mode === 'dark' ? 'rgba(16, 185, 129, 0.12) !important' : 'rgba(16, 185, 129, 0.08) !important',
                          }
                        }
                      }
                    }}
                    renderOption={(props, patient) => (
                      <Box component="li" {...props} key={patient.id || (patient as any)._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                          <Box sx={{ 
                            width: 32, 
                            height: 32, 
                            minWidth: 32,
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', 
                            color: '#fff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 800, 
                            fontSize: '0.75rem',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                          }}>
                            {(patient.firstName?.[0] || 'P').toUpperCase()}
                          </Box>
                          <Box sx={{ overflow: 'hidden', flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', lineHeight: 1.2 }}>
                              {patient.firstName} {patient.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: mode === 'dark' ? '#94A3B8' : '#64748B', fontWeight: 600, display: 'block', mt: 0.2 }}>
                              {patient.email || patient.phone || 'No contact info'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label="Search / Select Patient *"
                        placeholder="Type to search patient by name, email or phone..."
                        required={!formData.patientId}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                <SearchIcon sx={{ color: '#10B981', fontSize: 20 }} />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          )
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            fontWeight: 700,
                            bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.9)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#10B981',
                            },
                            '&.Mui-focused': {
                              borderColor: '#10B981',
                              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.15)'
                            }
                          },
                          '& .MuiInputLabel-root': {
                            color: mode === 'dark' ? '#94A3B8' : '#64748B',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            '&.Mui-focused': {
                              color: '#10B981'
                            }
                          }
                        }}
                      />
                    )}
                    noOptionsText={
                      <Box sx={{ py: 1, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: mode === 'dark' ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                          No matching patients found.
                        </Typography>
                        <Button 
                          size="small" 
                          startIcon={<PersonAddIcon />} 
                          onClick={() => setNewPatientDialogOpen(true)}
                          sx={{ mt: 1, textTransform: 'none', color: '#10B981', fontWeight: 700 }}
                        >
                          + Create New Patient
                        </Button>
                      </Box>
                    }
                  />
                </Grid>

                {/* Family Profiles Bar */}
                {selectedPatient && (
                  <Grid item xs={12}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 1.8, 
                        borderRadius: '18px', 
                        bgcolor: mode === 'dark' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.04)',
                        borderColor: selectedProfile ? '#10B981' : '#dc2626',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.06)'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#059669', fontSize: '0.82rem' }}>
                          👨‍👩‍👧‍👦 Select Family Member for this Prescription *:
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                          onClick={handleOpenAddFamilyMemberDialog}
                          sx={{
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            py: 0.5,
                            px: 1.5,
                            bgcolor: mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                            color: mode === 'dark' ? '#34D399' : '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            textTransform: 'none',
                            '&:hover': {
                              bgcolor: 'rgba(16, 185, 129, 0.22)',
                              borderColor: '#10B981'
                            }
                          }}
                        >
                          + Add Family Member
                        </Button>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        {familyProfiles.map((profile) => (
                          <Paper
                            key={profile.id}
                            onClick={() => setSelectedProfile(profile)}
                            elevation={selectedProfile?.id === profile.id ? 2 : 0}
                            sx={{
                              p: 1,
                              px: 1.5,
                              borderRadius: '14px',
                              cursor: 'pointer',
                              border: selectedProfile?.id === profile.id ? '2px solid #10B981' : '1px solid rgba(16, 185, 129, 0.2)',
                              bgcolor: selectedProfile?.id === profile.id ? (mode === 'dark' ? 'rgba(16, 185, 129, 0.22)' : '#e6f7f2') : (mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.9)'),
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                borderColor: '#10B981'
                              }
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: selectedProfile?.id === profile.id ? '#059669' : (mode === 'dark' ? '#334155' : '#e2e8f0'),
                                color: selectedProfile?.id === profile.id ? '#ffffff' : (mode === 'dark' ? '#94a3b8' : '#475569'),
                                fontSize: '0.8rem',
                                fontWeight: 800
                              }}
                            >
                              {RELATIONSHIP_ICONS[profile.relationship] || '👤'}
                            </Avatar>
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', display: 'block', lineHeight: 1.2, fontSize: '0.78rem' }}>
                                {profile.firstName} {profile.lastName}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.65rem' }}>
                                {RELATIONSHIP_LABELS[profile.relationship]}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace', color: '#10B981', fontSize: '0.65rem', bgcolor: 'rgba(16, 185, 129, 0.1)', px: 0.8, py: 0.2, borderRadius: '6px' }}>
                              {profile.patientDisplayId}
                            </Typography>
                          </Paper>
                        ))}

                        {/* Quick Add Member Action Card */}
                        <Paper
                          onClick={handleOpenAddFamilyMemberDialog}
                          elevation={0}
                          sx={{
                            p: 1,
                            px: 1.5,
                            borderRadius: '14px',
                            cursor: 'pointer',
                            border: '1.5px dashed rgba(16, 185, 129, 0.4)',
                            bgcolor: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.8,
                            color: mode === 'dark' ? '#34D399' : '#059669',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              bgcolor: 'rgba(16, 185, 129, 0.08)',
                              borderColor: '#10B981'
                            }
                          }}
                        >
                          <AddIcon sx={{ fontSize: 18 }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.74rem' }}>
                            + Add Member
                          </Typography>
                        </Paper>
                      </Box>
                      {!selectedProfile && (
                        <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600, mt: 1, display: 'block', fontSize: '0.72rem' }}>
                          ⚠️ Please select which family member this prescription is for
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                )}

                {loadingProfiles && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                      <CircularProgress size={16} sx={{ color: '#428475' }} />
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Loading family profiles...</Typography>
                    </Box>
                  </Grid>
                )}
                
                {selectedPatient && (
                  <Grid item xs={12}>
                    {/* Rich Patient Context Card */}
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
                      {/* Patient Header */}
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

                        {/* Past Prescriptions */}
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
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: expandedPastRxId ? 520 : 300, overflowY: 'auto', pr: 0.5, pb: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(66,132,117,0.3)', borderRadius: 2 } }}>
                                {pastDoctorPrescriptions.slice(0, 5).map((rx) => {
                                  const isExpanded = expandedPastRxId === rx.id;
                                  const isTrailActive = activeTreatmentTrailRxId === rx.id;
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
                                        bgcolor: isTrailActive
                                          ? (mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)')
                                          : (mode === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(244, 248, 246, 0.9)'),
                                        borderColor: isTrailActive
                                          ? '#10b981'
                                          : isExpanded
                                          ? '#428475'
                                          : (mode === 'dark' ? 'rgba(137, 215, 183, 0.15)' : 'rgba(18, 48, 41, 0.08)'),
                                        boxShadow: isTrailActive ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none',
                                        transition: 'all 0.2s',
                                        overflow: 'hidden'
                                      }}
                                    >
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
                                            {isTrailActive && (
                                              <Chip
                                                label="🔄 Trail Active"
                                                size="small"
                                                sx={{
                                                  height: 18,
                                                  fontSize: '0.6rem',
                                                  fontWeight: 800,
                                                  bgcolor: '#10b981',
                                                  color: '#ffffff',
                                                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)'
                                                }}
                                              />
                                            )}
                                          </Box>
                                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>
                                            📅 {new Date(rx.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            {medicationNames.length > 0 && ` • 💊 ${medicationNames.slice(0, 2).join(', ')}${medicationNames.length > 2 ? ` +${medicationNames.length - 2}` : ''}`}
                                          </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
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

                                      <Collapse in={isExpanded}>
                                        <Box sx={{ p: 2, pt: 1, pb: 2, borderTop: '1px dashed rgba(66, 132, 117, 0.2)', bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.7)' }}>
                                          {rx.medications && rx.medications.length > 0 && (
                                            <Box sx={{ mb: 1.5 }}>
                                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem', display: 'block', mb: 0.8 }}>
                                                💊 Prescribed Medications ({rx.medications.length})
                                              </Typography>
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, maxHeight: 240, overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(66,132,117,0.2)', borderRadius: 2 } }}>
                                                {rx.medications.map((m: any, idx: number) => {
                                                  const getMedNote = (med: any): string | null => {
                                                    if (!med) return null;
                                                    const inst = typeof med.instructions === 'string' ? med.instructions.trim() : (med.instructions?.text || med.instructions?.instructions || '');
                                                    if (inst && inst !== '[object Object]') return inst;
                                                    const note = typeof med.note === 'string' ? med.note.trim() : (typeof med.notes === 'string' ? med.notes.trim() : '');
                                                    if (note && note !== '[object Object]') return note;
                                                    const food = typeof med.foodRelation === 'string' ? med.foodRelation.trim() : (typeof med.mealRelation === 'string' ? med.mealRelation.trim() : '');
                                                    if (food && food !== '[object Object]') return food;
                                                    return null;
                                                  };
                                                  const noteStr = getMedNote(m);

                                                  return (
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
                                                          m.frequency && m.frequency !== m.dosage ? `Freq: ${m.frequency}` : null,
                                                          m.duration ? `Duration: ${m.duration}` : null,
                                                          noteStr ? `Note: ${noteStr}` : null
                                                        ].filter(Boolean).join(' • ') || 'Standard Dosage'}
                                                      </Typography>
                                                    </Box>
                                                  );
                                                })}
                                              </Box>
                                            </Box>
                                          )}

                                          {(() => {
                                            const adviceText = (rx as any).advice || rx.notes;
                                            if (!adviceText) return null;
                                            const cleanText = typeof adviceText === 'string'
                                              ? adviceText.trim()
                                              : Array.isArray(adviceText)
                                              ? adviceText.join(', ')
                                              : typeof adviceText === 'object'
                                              ? (adviceText.text || adviceText.advice || adviceText.notes || '')
                                              : String(adviceText);
                                            if (!cleanText || cleanText === '[object Object]') return null;
                                            return (
                                              <Box sx={{ mb: 1.5 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem', display: 'block', mb: 0.3 }}>
                                                  📝 Doctor Notes & Advice
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: mode === 'dark' ? '#cbd5e1' : '#475569', fontSize: '0.73rem', display: 'block', fontStyle: 'italic' }}>
                                                  {cleanText}
                                                </Typography>
                                              </Box>
                                            );
                                          })()}

                                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 1.5, pt: 1, borderTop: '1px solid rgba(66,132,117,0.1)', flexWrap: 'wrap' }}>
                                            <Box
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleTreatmentTrail(rx);
                                              }}
                                              sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.8,
                                                cursor: 'pointer',
                                                py: 0.4,
                                                px: 1.2,
                                                borderRadius: '10px',
                                                bgcolor: isTrailActive ? 'rgba(16, 185, 129, 0.15)' : (mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                                                border: `1.5px solid ${isTrailActive ? '#10b981' : 'rgba(66, 132, 117, 0.2)'}`,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                  bgcolor: isTrailActive ? 'rgba(16, 185, 129, 0.22)' : 'rgba(66, 132, 117, 0.1)'
                                                }
                                              }}
                                            >
                                              <Switch
                                                size="small"
                                                checked={isTrailActive}
                                                onChange={() => handleToggleTreatmentTrail(rx)}
                                                onClick={(e) => e.stopPropagation()}
                                                sx={{
                                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: '#10b981',
                                                    '& + .MuiSwitch-track': {
                                                      backgroundColor: '#10b981',
                                                      opacity: 0.8
                                                    }
                                                  }
                                                }}
                                              />
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  fontWeight: 800,
                                                  color: isTrailActive ? '#10b981' : (mode === 'dark' ? '#FAF2F5' : '#1A312C'),
                                                  fontSize: '0.74rem',
                                                  userSelect: 'none'
                                                }}
                                              >
                                                {isTrailActive ? 'Treatment Trail Active' : 'Continue Treatment Trail'}
                                              </Typography>
                                            </Box>
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

                        {/* External Prescription Scanner */}
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

            {/* ─── 2. Vital Signs Section Card ─── */}
            <Paper 
              className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'} 
              sx={{ 
                p: { xs: 2.2, sm: 3 }, 
                mb: 3, 
                borderRadius: '24px !important',
                background: mode === 'dark' ? 'rgba(15, 23, 42, 0.85) !important' : 'rgba(255, 255, 255, 0.95) !important',
                boxShadow: '0 10px 30px -5px rgba(16, 185, 129, 0.08) !important'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <VitalIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', letterSpacing: -0.2 }}>
                    2. Vital Signs (Consultation)
                  </Typography>
                </Box>
                <Chip 
                  label="Vital Metrics" 
                  size="small" 
                  sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.68rem', 
                    bgcolor: 'rgba(16, 185, 129, 0.12)', 
                    color: mode === 'dark' ? '#34D399' : '#059669',
                    borderRadius: '8px'
                  }} 
                />
              </Box>

              <Grid container spacing={2}>
                {/* ─── Blood Pressure Dual Card ─── */}
                <Grid item xs={12}>
                  <Box className="modern-vital-card vital-accent-bp">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BpIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0F172A' }}>
                          Blood Pressure
                        </Typography>
                      </Box>
                      {(() => {
                        const parts = (formData.vitalSigns?.bloodPressure || '').split('/');
                        const sysNum = parseInt(parts[0]?.trim() || '0', 10);
                        const diaNum = parseInt(parts[1]?.replace('mmHg', '').trim() || '0', 10);
                        if (!sysNum && !diaNum) return null;
                        const isElevated = sysNum >= 120 || diaNum >= 80;
                        const isHigh = sysNum >= 140 || diaNum >= 90;
                        const statusText = isHigh ? 'High' : isElevated ? 'Elevated' : 'Normal';
                        const statusColor = isHigh ? '#EF4444' : isElevated ? '#F59E0B' : '#10B981';
                        const statusBg = isHigh ? 'rgba(239, 68, 68, 0.12)' : isElevated ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)';
                        return (
                          <Chip label={statusText} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20, bgcolor: statusBg, color: statusColor, borderRadius: '6px' }} />
                        );
                      })()}
                    </Box>

                    <Grid container spacing={1.5} alignItems="center">
                      <Grid item xs={5.5}>
                        <Box className="modern-vital-input">
                          <TextField
                            variant="standard"
                            size="small"
                            type="number"
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
                            InputProps={{ disableUnderline: true }}
                            sx={{ flex: 1, '& input': { textAlign: 'center', fontWeight: 900, fontSize: '1.05rem', color: mode === 'dark' ? '#FAF2F5' : '#0F172A', p: '4px' } }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', fontSize: '0.7rem', ml: 0.5 }}>SYS</Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={1} sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#94A3B8', fontSize: '1.2rem', lineHeight: 1 }}>/</Typography>
                      </Grid>

                      <Grid item xs={5.5}>
                        <Box className="modern-vital-input">
                          <TextField
                            variant="standard"
                            size="small"
                            type="number"
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
                            InputProps={{ disableUnderline: true }}
                            sx={{ flex: 1, '& input': { textAlign: 'center', fontWeight: 900, fontSize: '1.05rem', color: mode === 'dark' ? '#FAF2F5' : '#0F172A', p: '4px' } }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', fontSize: '0.7rem', ml: 0.5 }}>DIA</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.68rem', display: 'block', mt: 1, textAlign: 'center' }}>
                      Target Normal: &lt;120 / &lt;80 mmHg
                    </Typography>
                  </Box>
                </Grid>

                {/* ─── Pulse Rate ─── */}
                <Grid item xs={6} sm={4}>
                  <Box className="modern-vital-card vital-accent-pulse">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '6px', bgcolor: 'rgba(244, 63, 94, 0.12)', color: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PulseIcon sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', fontSize: '0.78rem' }}>
                        Pulse Rate
                      </Typography>
                    </Box>
                    <Box className="modern-vital-input">
                      <TextField
                        variant="standard"
                        size="small"
                        type="number"
                        placeholder="72"
                        value={formData.vitalSigns?.pulse ? formData.vitalSigns.pulse.replace(/[^0-9]/g, '') : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            vitalSigns: { ...formData.vitalSigns, pulse: val ? `${val} bpm` : '' }
                          });
                        }}
                        InputProps={{ disableUnderline: true }}
                        sx={{ flex: 1, '& input': { textAlign: 'center', fontWeight: 900, fontSize: '1rem', color: mode === 'dark' ? '#FAF2F5' : '#0F172A', p: '4px' } }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', fontSize: '0.68rem' }}>bpm</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.65rem', display: 'block', mt: 0.8, textAlign: 'center' }}>
                      Normal: 60 - 100
                    </Typography>
                  </Box>
                </Grid>

                {/* ─── Temperature ─── */}
                <Grid item xs={6} sm={4}>
                  <Box className="modern-vital-card vital-accent-temp">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '6px', bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TempIcon sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', fontSize: '0.78rem' }}>
                        Temperature
                      </Typography>
                    </Box>
                    <Box className="modern-vital-input">
                      <TextField
                        variant="standard"
                        size="small"
                        placeholder="98.6"
                        value={formData.vitalSigns?.temperature ? formData.vitalSigns.temperature.replace(/[^0-9.]/g, '') : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            vitalSigns: { ...formData.vitalSigns, temperature: val ? `${val} °F` : '' }
                          });
                        }}
                        InputProps={{ disableUnderline: true }}
                        sx={{ flex: 1, '& input': { textAlign: 'center', fontWeight: 900, fontSize: '1rem', color: mode === 'dark' ? '#FAF2F5' : '#0F172A', p: '4px' } }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', fontSize: '0.68rem' }}>°F</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.65rem', display: 'block', mt: 0.8, textAlign: 'center' }}>
                      Normal: 97 - 99 °F
                    </Typography>
                  </Box>
                </Grid>

                {/* ─── SpO2 Level ─── */}
                <Grid item xs={6} sm={4}>
                  <Box className="modern-vital-card vital-accent-spo2">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '6px', bgcolor: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Spo2Icon sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', fontSize: '0.78rem' }}>
                        SpO2 Level
                      </Typography>
                    </Box>
                    <Box className="modern-vital-input">
                      <TextField
                        variant="standard"
                        size="small"
                        type="number"
                        placeholder="98"
                        value={formData.vitalSigns?.spo2 ? formData.vitalSigns.spo2.replace(/[^0-9]/g, '') : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            vitalSigns: { ...formData.vitalSigns, spo2: val ? `${val} %` : '' }
                          });
                        }}
                        InputProps={{ disableUnderline: true }}
                        sx={{ flex: 1, '& input': { textAlign: 'center', fontWeight: 900, fontSize: '1rem', color: mode === 'dark' ? '#FAF2F5' : '#0F172A', p: '4px' } }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', fontSize: '0.68rem' }}>%</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.65rem', display: 'block', mt: 0.8, textAlign: 'center' }}>
                      Normal: 95 - 100%
                    </Typography>
                  </Box>
                </Grid>

                {/* ─── Resp. Rate ─── */}
                <Grid item xs={6} sm={4}>
                  <Box className="modern-vital-card vital-accent-resp">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '6px', bgcolor: 'rgba(20, 184, 166, 0.12)', color: '#14B8A6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ fontSize: '0.78rem' }}>🫁</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', fontSize: '0.78rem' }}>
                        Resp. Rate
                      </Typography>
                    </Box>
                    <Box className="modern-vital-input">
                      <TextField
                        variant="standard"
                        size="small"
                        placeholder="16"
                        value={formData.vitalSigns?.respiratoryRate ? formData.vitalSigns.respiratoryRate.replace(/[^0-9]/g, '') : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            vitalSigns: { ...formData.vitalSigns, respiratoryRate: val ? `${val} /min` : '' }
                          });
                        }}
                        InputProps={{ disableUnderline: true }}
                        sx={{ flex: 1, '& input': { textAlign: 'center', fontWeight: 900, fontSize: '1rem', color: mode === 'dark' ? '#FAF2F5' : '#0F172A', p: '4px' } }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', fontSize: '0.65rem' }}>/min</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.65rem', display: 'block', mt: 0.8, textAlign: 'center' }}>
                      Normal: 12 - 20
                    </Typography>
                  </Box>
                </Grid>

                {/* ─── BMI ─── */}
                <Grid item xs={6} sm={4}>
                  <Box className="modern-vital-card vital-accent-bmi">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '6px', bgcolor: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BmiIcon sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', fontSize: '0.78rem' }}>
                        BMI Index
                      </Typography>
                    </Box>
                    <Box className="modern-vital-input">
                      <TextField
                        variant="standard"
                        size="small"
                        placeholder="24.5"
                        value={formData.vitalSigns?.bmi || ''}
                        onChange={handleVitalChange('bmi')}
                        InputProps={{ disableUnderline: true }}
                        sx={{ flex: 1, '& input': { textAlign: 'center', fontWeight: 900, fontSize: '1rem', color: mode === 'dark' ? '#FAF2F5' : '#0F172A', p: '4px' } }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8', fontSize: '0.65rem' }}>kg/m²</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.65rem', display: 'block', mt: 0.8, textAlign: 'center' }}>
                      Normal: 18.5 - 24.9
                    </Typography>
                  </Box>
                </Grid>

                {/* ─── Pain Scale ─── */}
                <Grid item xs={12} sm={4}>
                  <Box className="modern-vital-card vital-accent-pain">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '6px', bgcolor: 'rgba(244, 63, 94, 0.12)', color: '#F43F5E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PainIcon sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', fontSize: '0.78rem' }}>
                        Pain Scale Level
                      </Typography>
                    </Box>
                    <Box className="modern-vital-input">
                      <TextField
                        variant="standard"
                        size="small"
                        placeholder="e.g., 4 / 10"
                        value={formData.vitalSigns?.painScale || ''}
                        onChange={handleVitalChange('painScale')}
                        InputProps={{ disableUnderline: true }}
                        sx={{ flex: 1, '& input': { textAlign: 'center', fontWeight: 900, fontSize: '0.95rem', color: mode === 'dark' ? '#FAF2F5' : '#0F172A', p: '4px' } }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.65rem', display: 'block', mt: 0.8, textAlign: 'center' }}>
                      0 (No Pain) to 10 (Severe)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* ═══ STEP 2: CLINICAL ASSESSMENT & DIAGNOSIS ═══ */}
        {(viewMode === 'all' || activeStep === 1) && (
          <Box 
            key={activeStep === 1 ? 'step-1' : 'step-all-1'}
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 0,
              animation: 'stepCardFadeIn 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
              '@keyframes stepCardFadeIn': {
                '0%': { opacity: 0, transform: 'translateY(16px) scale(0.992)' },
                '100%': { opacity: 1, transform: 'translateY(0) scale(1)' }
              }
            }}
          >
            {/* ─── 3. Chief Complaints & Diagnosis ─── */}
            <Paper 
              className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'} 
              sx={{ 
                p: { xs: 2.2, sm: 3 }, 
                mb: 3, 
                borderRadius: '24px !important',
                background: mode === 'dark' ? 'rgba(15, 23, 42, 0.85) !important' : 'rgba(255, 255, 255, 0.95) !important',
                boxShadow: '0 10px 30px -5px rgba(16, 185, 129, 0.08) !important'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MedicalIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', letterSpacing: -0.2 }}>
                    3. Complaints & Diagnosis
                  </Typography>
                </Box>
                <Chip 
                  label="Clinical Findings" 
                  size="small" 
                  sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.68rem', 
                    bgcolor: 'rgba(16, 185, 129, 0.12)', 
                    color: mode === 'dark' ? '#34D399' : '#059669',
                    borderRadius: '8px'
                  }} 
                />
              </Box>

              <Grid container spacing={2.5}>
                {/* Presenting Complaints */}
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem', display: 'block', mb: 0.8 }}>
                    Presenting Complaints
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g., Epigastric pain, moderate for 3 days"
                      value={newComplaint}
                      onChange={(e) => setNewComplaint(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('presentingComplaints', newComplaint, setNewComplaint))}
                      InputProps={{ 
                        sx: { 
                          borderRadius: '16px',
                          fontWeight: 600,
                          bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.95)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          '& fieldset': { border: 'none' }
                        } 
                      }}
                    />
                    <Button 
                      type="button"
                      variant="contained" 
                      onClick={() => addToArray('presentingComplaints', newComplaint, setNewComplaint)}
                      sx={{ 
                        background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', 
                        minWidth: 48, 
                        height: 40,
                        borderRadius: '14px', 
                        px: 2,
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                        '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' }
                      }}
                    >
                      <AddIcon sx={{ color: '#fff' }} />
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1.2 }}>
                    {formData.presentingComplaints?.map((item, idx) => (
                      <Chip 
                        key={idx} 
                        label={item} 
                        onDelete={() => removeFromArray('presentingComplaints', idx)} 
                        sx={{ 
                          fontWeight: 700, 
                          fontSize: '0.78rem',
                          borderRadius: '10px',
                          bgcolor: mode === 'dark' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.12)', 
                          color: mode === 'dark' ? '#34D399' : '#059669',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          '& .MuiChip-deleteIcon': { color: mode === 'dark' ? '#34D399' : '#059669', '&:hover': { color: '#EF4444' } }
                        }} 
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Clinical Examination Findings */}
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem', display: 'block', mb: 0.8 }}>
                    Clinical Findings
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g., Tenderness in upper abdomen"
                      value={newFinding}
                      onChange={(e) => setNewFinding(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('clinicalFindings', newFinding, setNewFinding))}
                      InputProps={{ 
                        sx: { 
                          borderRadius: '16px',
                          fontWeight: 600,
                          bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.95)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          '& fieldset': { border: 'none' }
                        } 
                      }}
                    />
                    <Button 
                      type="button"
                      variant="contained" 
                      onClick={() => addToArray('clinicalFindings', newFinding, setNewFinding)}
                      sx={{ 
                        background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', 
                        minWidth: 48, 
                        height: 40,
                        borderRadius: '14px', 
                        px: 2,
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                        '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' }
                      }}
                    >
                      <AddIcon sx={{ color: '#fff' }} />
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1.2 }}>
                    {formData.clinicalFindings?.map((item, idx) => (
                      <Chip 
                        key={idx} 
                        label={item} 
                        onDelete={() => removeFromArray('clinicalFindings', idx)} 
                        sx={{ 
                          fontWeight: 700, 
                          fontSize: '0.78rem',
                          borderRadius: '10px',
                          bgcolor: mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)', 
                          color: mode === 'dark' ? '#FBBF24' : '#D97706',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          '& .MuiChip-deleteIcon': { color: mode === 'dark' ? '#FBBF24' : '#D97706', '&:hover': { color: '#EF4444' } }
                        }} 
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Provisional Diagnosis */}
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem', display: 'block', mb: 0.8 }}>
                    Provisional Diagnosis
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="e.g., Acute Gastritis / GERD (with epigastric distress)..."
                      value={newDiagnosis}
                      onChange={(e) => setNewDiagnosis(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          addToArray('provisionalDiagnosis', newDiagnosis, setNewDiagnosis);
                        }
                      }}
                      InputProps={{ 
                        sx: { 
                          borderRadius: '16px',
                          fontWeight: 600,
                          bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.95)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          '& fieldset': { border: 'none' }
                        } 
                      }}
                    />
                    <Button 
                      type="button"
                      variant="contained" 
                      onClick={() => addToArray('provisionalDiagnosis', newDiagnosis, setNewDiagnosis)}
                      sx={{ 
                        background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', 
                        minWidth: 48, 
                        borderRadius: '14px', 
                        px: 2,
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                        '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' }
                      }}
                    >
                      <AddIcon sx={{ color: '#fff' }} />
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1.2 }}>
                    {formData.provisionalDiagnosis?.map((item, idx) => (
                      <Chip 
                        key={idx} 
                        label={item} 
                        onDelete={() => removeFromArray('provisionalDiagnosis', idx)} 
                        sx={{ 
                          fontWeight: 800, 
                          fontSize: '0.78rem',
                          borderRadius: '10px',
                          bgcolor: mode === 'dark' ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5', 
                          color: mode === 'dark' ? '#34D399' : '#047857',
                          border: mode === 'dark' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid #A7F3D0',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                          '& .MuiChip-deleteIcon': { color: mode === 'dark' ? '#34D399' : '#047857', opacity: 0.85, '&:hover': { opacity: 1, color: '#EF4444' } }
                        }} 
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Current Medications (Ongoing) */}
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem', display: 'block', mb: 0.8 }}>
                    Current Medications (Ongoing)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g., Metformin 500mg BD, Amlodipine 5mg OD"
                      value={newCurrentMed}
                      onChange={(e) => setNewCurrentMed(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('currentMedications', newCurrentMed, setNewCurrentMed))}
                      InputProps={{ 
                        sx: { 
                          borderRadius: '16px',
                          fontWeight: 600,
                          bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.95)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          '& fieldset': { border: 'none' }
                        } 
                      }}
                    />
                    <Button 
                      type="button"
                      variant="contained" 
                      onClick={() => addToArray('currentMedications', newCurrentMed, setNewCurrentMed)}
                      sx={{ 
                        background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', 
                        minWidth: 48, 
                        height: 40,
                        borderRadius: '14px', 
                        px: 2,
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                        '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' }
                      }}
                    >
                      <AddIcon sx={{ color: '#fff' }} />
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1.2 }}>
                    {formData.currentMedications?.map((item, idx) => (
                      <Chip 
                        key={idx} 
                        label={item} 
                        onDelete={() => removeFromArray('currentMedications', idx)} 
                        sx={{ 
                          fontWeight: 700, 
                          fontSize: '0.78rem',
                          borderRadius: '10px',
                          bgcolor: mode === 'dark' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.12)', 
                          color: mode === 'dark' ? '#22D3EE' : '#0891B2',
                          border: '1px solid rgba(6, 182, 212, 0.25)',
                          '& .MuiChip-deleteIcon': { color: mode === 'dark' ? '#22D3EE' : '#0891B2', '&:hover': { color: '#EF4444' } }
                        }} 
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Past Surgical History */}
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem', display: 'block', mb: 0.8 }}>
                    Past Surgical History
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g., Appendectomy (2019), Cholecystectomy (2021)"
                      value={newSurgery}
                      onChange={(e) => setNewSurgery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('pastSurgicalHistory', newSurgery, setNewSurgery))}
                      InputProps={{ 
                        sx: { 
                          borderRadius: '16px',
                          fontWeight: 600,
                          bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.95)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          '& fieldset': { border: 'none' }
                        } 
                      }}
                    />
                    <Button 
                      type="button"
                      variant="contained" 
                      onClick={() => addToArray('pastSurgicalHistory', newSurgery, setNewSurgery)}
                      sx={{ 
                        background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', 
                        minWidth: 48, 
                        height: 40,
                        borderRadius: '14px', 
                        px: 2,
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                        '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' }
                      }}
                    >
                      <AddIcon sx={{ color: '#fff' }} />
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1.2 }}>
                    {formData.pastSurgicalHistory?.map((item, idx) => (
                      <Chip 
                        key={idx} 
                        label={item} 
                        onDelete={() => removeFromArray('pastSurgicalHistory', idx)} 
                        sx={{ 
                          fontWeight: 700, 
                          fontSize: '0.78rem',
                          borderRadius: '10px',
                          bgcolor: mode === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.12)', 
                          color: mode === 'dark' ? '#A78BFA' : '#7C3AED',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          '& .MuiChip-deleteIcon': { color: mode === 'dark' ? '#A78BFA' : '#7C3AED', '&:hover': { color: '#EF4444' } }
                        }} 
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* ═══ STEP 3: RX MEDICATIONS & LAB TESTS ═══ */}
        {(viewMode === 'all' || activeStep === 2) && (
          <Box 
            key={activeStep === 2 ? 'step-2' : 'step-all-2'}
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 0,
              animation: 'stepCardFadeIn 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
              '@keyframes stepCardFadeIn': {
                '0%': { opacity: 0, transform: 'translateY(16px) scale(0.992)' },
                '100%': { opacity: 1, transform: 'translateY(0) scale(1)' }
              }
            }}
          >
            {/* ─── 4. Prescribed Medications (Rx) Section ─── */}
            <Paper 
              className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'} 
              sx={{ 
                p: { xs: 2.2, sm: 3 }, 
                mb: 3, 
                borderRadius: '24px !important',
                background: mode === 'dark' ? 'rgba(15, 23, 42, 0.85) !important' : 'rgba(255, 255, 255, 0.95) !important',
                boxShadow: '0 10px 30px -5px rgba(16, 185, 129, 0.08) !important'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MedicationIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', letterSpacing: -0.2 }}>
                    4. Rx – Prescribed Medications *
                  </Typography>
                </Box>
                <Chip 
                  label={`${formData.medications?.length || 0} Added`} 
                  size="small" 
                  sx={{ 
                    fontWeight: 900, 
                    fontSize: '0.7rem',
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', 
                    color: '#ffffff',
                    borderRadius: '10px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }} 
                />
              </Box>

              {/* Add New Medication Glass Container */}
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: { xs: 2, sm: 2.5 }, 
                  mb: 2.5, 
                  borderRadius: '20px', 
                  bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.9)', 
                  borderColor: 'rgba(16, 185, 129, 0.25)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', mb: 1.8, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', display: 'inline-block' }} />
                  + Add Medication Item (Real-time Indian Medicines Autocomplete)
                </Typography>
                
                <Grid container spacing={2}>
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
                            bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
                            backdropFilter: 'blur(20px)',
                            border: '1.5px solid #10B981',
                            boxShadow: '0 16px 40px rgba(16, 185, 129, 0.2)',
                            overflow: 'hidden',
                            '& .MuiAutocomplete-listbox': {
                              p: 1,
                              maxHeight: '260px',
                              '&::-webkit-scrollbar': { width: '6px' },
                              '&::-webkit-scrollbar-thumb': { bgcolor: '#059669', borderRadius: '10px' }
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
                              color: mode === 'dark' ? '#FAF2F5' : '#0F172A',
                              transition: 'all 0.15s ease',
                              '&:hover, &.Mui-focused': {
                                bgcolor: mode === 'dark' ? 'rgba(16, 185, 129, 0.2) !important' : 'rgba(16, 185, 129, 0.12) !important',
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
                                  <SearchIcon sx={{ color: '#10B981', fontSize: 20 }} />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                            sx: { 
                              borderRadius: '16px', 
                              fontWeight: 700,
                              bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                              border: '1px solid rgba(16, 185, 129, 0.2)',
                              '& fieldset': { border: 'none' }
                            }
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={5} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="med-type-label" sx={{ fontWeight: 700 }}>Form</InputLabel>
                      <Select
                        labelId="med-type-label"
                        value={newMedication.type || 'Tablet'}
                        label="Form"
                        onChange={(e) => {
                          const newType = e.target.value;
                          const updated = recalcMedication({ ...newMedication, type: newType });
                          setNewMedication(updated);
                        }}
                        sx={{ 
                          borderRadius: '16px', 
                          fontWeight: 700,
                          bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          '& fieldset': { border: 'none' }
                        }}
                      >
                        <MenuItem value="Tablet">💊 Tablet</MenuItem>
                        <MenuItem value="Capsule">💊 Capsule</MenuItem>
                        <MenuItem value="Syrup">🧪 Syrup</MenuItem>
                        <MenuItem value="Injection">💉 Injection</MenuItem>
                        <MenuItem value="Ointment">🧴 Ointment</MenuItem>
                        <MenuItem value="Drops">💧 Drops</MenuItem>
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
                        sx: { 
                          borderRadius: '16px', 
                          bgcolor: newMedication.isSOS ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                          fontWeight: 900, 
                          fontSize: '0.85rem', 
                          color: newMedication.isSOS ? '#EF4444' : '#059669',
                          border: newMedication.isSOS ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                          '& fieldset': { border: 'none' }
                        }
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem' }}>
                        Time of Day:
                      </Typography>

                      <Chip
                        icon={<SosIcon sx={{ fontSize: 16, color: newMedication.isSOS ? '#fff !important' : '#EF4444 !important' }} />}
                        label={newMedication.isSOS ? '🆘 SOS Mode (ACTIVE)' : '🆘 SOS (When Needed)'}
                        size="small"
                        clickable
                        onClick={() => {
                          const newSOS = !newMedication.isSOS;
                          const newReason = newSOS ? (newMedication.sosReason || 'Fever') : '';
                          const newInst = formatInstructionsWithSos(newMedication.instructions, newSOS, newReason);
                          const updated = recalcMedication({
                            ...newMedication,
                            isSOS: newSOS,
                            sosReason: newReason,
                            instructions: newInst
                          });
                          setNewMedication(updated);
                        }}
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          height: 28,
                          borderRadius: '12px',
                          bgcolor: newMedication.isSOS ? '#EF4444' : 'rgba(239, 68, 68, 0.12)',
                          color: newMedication.isSOS ? '#ffffff' : '#EF4444',
                          border: '1.5px solid #EF4444',
                          boxShadow: newMedication.isSOS ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none',
                          transition: 'all 0.2s ease',
                          '&:active': { transform: 'scale(0.95)' }
                        }}
                      />
                    </Box>

                    {newMedication.isSOS && (
                      <Box sx={{ mb: 1.5, p: 1.5, borderRadius: '16px', bgcolor: 'rgba(239, 68, 68, 0.06)', border: '1.5px dashed rgba(239, 68, 68, 0.4)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#EF4444', display: 'block', mb: 0.8 }}>
                          🆘 Indicate Reason for SOS (Only When Needed):
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 1.2 }}>
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
                                  const newInst = formatInstructionsWithSos(newMedication.instructions, true, newReason);
                                  const updated = recalcMedication({
                                    ...newMedication,
                                    sosReason: newReason,
                                    instructions: newInst
                                  });
                                  setNewMedication(updated);
                                }}
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  height: 26,
                                  borderRadius: '10px',
                                  bgcolor: isSelected ? '#EF4444' : mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : '#ffffff',
                                  color: isSelected ? '#fff' : '#EF4444',
                                  border: isSelected ? '1.5px solid #EF4444' : '1px solid rgba(239, 68, 68, 0.25)'
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
                            const newInst = formatInstructionsWithSos(newMedication.instructions, true, customR);
                            const updated = recalcMedication({
                              ...newMedication,
                              sosReason: customR,
                              instructions: newInst
                            });
                            setNewMedication(updated);
                          }}
                          InputProps={{ sx: { borderRadius: '12px', bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : '#ffffff', fontSize: '0.8rem' } }}
                        />
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                      {([
                        { key: 'morning' as const, label: 'Morn', icon: <MorningIcon />, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', activeBg: 'rgba(245, 158, 11, 0.2)', border: '#F59E0B' },
                        { key: 'afternoon' as const, label: 'Day', icon: <AfternoonIcon />, color: '#EAB308', bg: 'rgba(234, 179, 8, 0.1)', activeBg: 'rgba(234, 179, 8, 0.2)', border: '#EAB308' },
                        { key: 'evening' as const, label: 'Eve', icon: <EveningIcon />, color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)', activeBg: 'rgba(249, 115, 22, 0.2)', border: '#F97316' },
                        { key: 'night' as const, label: 'Night', icon: <NightIcon />, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)', activeBg: 'rgba(99, 102, 241, 0.2)', border: '#6366F1' }
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
                                openMealPopover(e as any, time.key);
                              }
                            }}
                            sx={{
                              flex: 1,
                              p: 1.2,
                              borderRadius: '18px',
                              border: isActive ? `2.5px solid ${time.border}` : '1.5px solid rgba(16, 185, 129, 0.15)',
                              bgcolor: isActive ? time.activeBg : (mode === 'dark' ? 'rgba(15, 23, 42, 0.5)' : '#ffffff'),
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: isActive ? `0 6px 16px ${time.color}33` : '0 2px 6px rgba(0,0,0,0.02)',
                              '&:hover': { transform: 'translateY(-2px)' }
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 900, color: time.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4, fontSize: '0.75rem' }}>
                              {time.icon} {time.label}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: isActive ? time.color : '#94A3B8', my: 0.2 }}>
                              {isActive ? `×${doseCount}` : '-'}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: time.color, fontWeight: 800, display: 'block', height: 16 }} noWrap>
                              {isActive ? (mealRel || 'Set meal') : 'Off'}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Grid>

                  {/* Popover for dose count & meal relation */}
                  <Popover
                    open={Boolean(mealPopoverAnchor)}
                    anchorEl={mealPopoverAnchor}
                    onClose={() => setMealPopoverAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    slotProps={{
                      paper: {
                        sx: {
                          p: 2.2,
                          borderRadius: '24px',
                          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
                          border: '1.5px solid #10B981',
                          bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.99)',
                          backdropFilter: 'blur(20px)',
                          width: 'calc(100vw - 32px)',
                          maxWidth: 360,
                          mt: 1
                        }
                      }
                    }}
                  >
                    <Box sx={{ mb: 1.5, textAlign: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: mode === 'dark' ? '#34D399' : '#059669', fontSize: '0.9rem' }}>
                        {mealPopoverTimeKey.charAt(0).toUpperCase() + mealPopoverTimeKey.slice(1)} — Dose & Meal
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669', display: 'block', mb: 0.8, textAlign: 'center' }}>
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
                                border: isSelected ? '2.5px solid #10B981' : '2px solid rgba(16, 185, 129, 0.2)',
                                background: isSelected ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : 'transparent',
                                color: isSelected ? '#fff' : '#0F172A',
                                fontWeight: 900,
                                fontSize: '0.8rem',
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
                          sx={{ width: 75, '& input': { textAlign: 'center', fontWeight: 800, p: '8px', fontSize: '0.8rem' }, '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669', display: 'block', mb: 0.8, textAlign: 'center' }}>
                      Meal relation (optional)
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 0.6, mb: 0.6, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {[
                        { label: 'With Food', shortLabel: 'With', icon: <WithFoodIcon sx={{ fontSize: 14 }} />, color: '#1565c0', bg: 'rgba(21, 101, 192, 0.1)' },
                        { label: 'Before Food', shortLabel: 'Before', icon: <BeforeFoodIcon sx={{ fontSize: 14 }} />, color: '#e65100', bg: 'rgba(230, 81, 0, 0.1)' },
                        { label: 'After Food', shortLabel: 'After', icon: <AfterFoodIcon sx={{ fontSize: 14 }} />, color: '#6a1b9a', bg: 'rgba(106, 27, 154, 0.1)' }
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
                              fontWeight: 800,
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

                    <Box sx={{ display: 'flex', gap: 0.6, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Empty Stomach', icon: <EmptyStomachIcon sx={{ fontSize: 14 }} />, color: '#00695c', bg: 'rgba(0, 105, 92, 0.1)' },
                        { label: 'Any Time', icon: <AnyTimeIcon sx={{ fontSize: 14 }} />, color: '#37474f', bg: 'rgba(55, 71, 79, 0.1)' }
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
                              fontWeight: 800,
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

                  {/* ─── Dosing Alteration / Interval Section ─── */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <span>🔄</span> Dosing Alteration / Interval:
                      </Typography>
                      {newMedication.intervalType === 'custom' && (customIntervalText || newMedication.intervalDays) ? (
                        <Chip
                          label={`Custom: Every ${customIntervalText || newMedication.intervalDays} days (${Number(customIntervalText || newMedication.intervalDays) === 1 ? 'Daily' : Number(customIntervalText || newMedication.intervalDays) === 2 ? 'Alternate Days' : `1 dose / ${customIntervalText || newMedication.intervalDays}d`})`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                            color: '#ffffff',
                            borderRadius: '10px'
                          }}
                        />
                      ) : newMedication.intervalDays && newMedication.intervalDays > 1 ? (
                        <Chip
                          label={`Takes every ${newMedication.intervalDays} days (${newMedication.intervalDays === 2 ? 'Alternate Days' : newMedication.intervalDays === 7 ? 'Weekly' : `1 dose / ${newMedication.intervalDays}d`})`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                            color: '#ffffff',
                            borderRadius: '10px'
                          }}
                        />
                      ) : (
                        <Chip
                          label="Everyday (Daily)"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            bgcolor: 'rgba(16, 185, 129, 0.12)',
                            color: mode === 'dark' ? '#34D399' : '#059669',
                            borderRadius: '8px'
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {[
                        { days: 1, label: 'Everyday (Daily)' },
                        { days: 2, label: 'Alternate Days (Every 2d)' },
                        { days: 3, label: 'Every 3 Days' },
                        { days: 4, label: 'Every 4 Days' },
                        { days: 5, label: 'Every 5 Days' },
                        { days: 7, label: 'Weekly (Every 7d)' },
                        { days: 10, label: 'Every 10 Days' }
                      ].map((preset) => {
                        // Presets are selected ONLY if user is NOT in custom mode
                        const isSelected = newMedication.intervalType !== 'custom' && (newMedication.intervalDays || 1) === preset.days;
                        return (
                          <Chip
                            key={preset.days}
                            label={preset.label}
                            size="small"
                            clickable
                            onClick={() => {
                              setCustomIntervalText('');
                              const presetTypeMap: Record<number, 'daily' | 'alternate' | 'every_3_days' | 'every_4_days' | 'every_5_days' | 'weekly' | 'every_10_days'> = {
                                1: 'daily',
                                2: 'alternate',
                                3: 'every_3_days',
                                4: 'every_4_days',
                                5: 'every_5_days',
                                7: 'weekly',
                                10: 'every_10_days'
                              };
                              const updated = recalcMedication({
                                ...newMedication,
                                intervalDays: preset.days,
                                intervalType: presetTypeMap[preset.days] || 'daily',
                                intervalLabel: preset.days === 1 ? 'Daily' : preset.days === 2 ? 'Alternate Days' : `Every ${preset.days} Days`
                              });
                              setNewMedication(updated);
                            }}
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              background: isSelected
                                ? (preset.days === 1
                                    ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                                    : 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)')
                                : mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(139, 92, 246, 0.08)',
                              color: isSelected ? '#ffffff' : mode === 'dark' ? '#C4B5FD' : '#6D28D9',
                              border: isSelected ? 'none' : '1px solid rgba(139, 92, 246, 0.25)',
                              boxShadow: isSelected ? '0 2px 8px rgba(139, 92, 246, 0.35)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          />
                        );
                      })}

                      {/* Custom Alteration Number Input */}
                      {(() => {
                        const isCustomActive = newMedication.intervalType === 'custom' || !!customIntervalText;
                        return (
                          <Box
                            onClick={() => {
                              if (newMedication.intervalType !== 'custom') {
                                const cur = newMedication.intervalDays || 1;
                                const initText = cur > 1 ? String(cur) : '';
                                setCustomIntervalText(initText);
                                setNewMedication({
                                  ...newMedication,
                                  intervalType: 'custom'
                                });
                              }
                            }}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              bgcolor: isCustomActive
                                ? (mode === 'dark' ? 'rgba(139, 92, 246, 0.22)' : 'rgba(139, 92, 246, 0.12)')
                                : (mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(139, 92, 246, 0.05)'),
                              p: '2px 8px',
                              borderRadius: '12px',
                              border: isCustomActive
                                ? '2px solid #8B5CF6'
                                : '1px solid rgba(139, 92, 246, 0.25)',
                              boxShadow: isCustomActive ? '0 2px 8px rgba(139, 92, 246, 0.25)' : 'none',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Typography variant="caption" sx={{ fontWeight: 800, color: isCustomActive ? (mode === 'dark' ? '#DDD6FE' : '#6D28D9') : (mode === 'dark' ? '#C4B5FD' : '#6D28D9'), fontSize: '0.7rem' }}>
                              Custom: Every
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              placeholder="Days"
                              value={customIntervalText}
                              onFocus={() => {
                                if (newMedication.intervalType !== 'custom') {
                                  const cur = newMedication.intervalDays || 1;
                                  const initText = cur > 1 ? String(cur) : '';
                                  setCustomIntervalText(initText);
                                  setNewMedication({
                                    ...newMedication,
                                    intervalType: 'custom'
                                  });
                                }
                              }}
                              onChange={(e) => {
                                const raw = e.target.value;
                                setCustomIntervalText(raw);
                                const val = parseInt(raw, 10);
                                if (val >= 1 && val <= 365) {
                                  const updated = recalcMedication({
                                    ...newMedication,
                                    intervalDays: val,
                                    intervalType: 'custom',
                                    intervalLabel: `Every ${val} Days`
                                  });
                                  setNewMedication(updated);
                                } else {
                                  // Even while empty or typing, keep custom mode so presets don't activate
                                  setNewMedication({
                                    ...newMedication,
                                    intervalType: 'custom'
                                  });
                                }
                              }}
                              onBlur={() => {
                                const val = parseInt(customIntervalText, 10);
                                if (val >= 1 && val <= 365) {
                                  const updated = recalcMedication({
                                    ...newMedication,
                                    intervalDays: val,
                                    intervalType: 'custom',
                                    intervalLabel: `Every ${val} Days`
                                  });
                                  setNewMedication(updated);
                                } else {
                                  // If left blank when leaving field, reset to everyday daily
                                  setCustomIntervalText('');
                                  const updated = recalcMedication({
                                    ...newMedication,
                                    intervalDays: 1,
                                    intervalType: 'daily',
                                    intervalLabel: 'Daily'
                                  });
                                  setNewMedication(updated);
                                }
                              }}
                              inputProps={{ min: 1, max: 365 }}
                              sx={{
                                width: 55,
                                '& input': { textAlign: 'center', fontWeight: 800, p: '4px', fontSize: '0.78rem', color: mode === 'dark' ? '#ffffff' : 'inherit' },
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px',
                                  bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
                                  '& fieldset': {
                                    borderColor: isCustomActive ? '#8B5CF6' : undefined
                                  }
                                }
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 800, color: isCustomActive ? (mode === 'dark' ? '#DDD6FE' : '#6D28D9') : (mode === 'dark' ? '#C4B5FD' : '#6D28D9'), fontSize: '0.7rem' }}>
                              days
                            </Typography>
                          </Box>
                        );
                      })()}
                    </Box>
                  </Grid>

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
                      InputProps={{ 
                        sx: { 
                          borderRadius: '16px', 
                          fontWeight: 700,
                          bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          '& fieldset': { border: 'none' }
                        } 
                      }}
                    />
                  </Grid>
                  <Grid item xs={5} sm={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="dur-unit-label" sx={{ fontWeight: 700 }}>Unit</InputLabel>
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
                        sx={{ 
                          borderRadius: '16px', 
                          fontWeight: 700,
                          bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          '& fieldset': { border: 'none' }
                        }}
                      >
                        <MenuItem value="Days">Days</MenuItem>
                        <MenuItem value="Weeks">Weeks</MenuItem>
                        <MenuItem value="Months">Months</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Duration Presets */}
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem', display: 'block', mb: 0.8 }}>
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
                      ].map(p => {
                        const isSelected = newMedication.durationValue === p.num && newMedication.durationUnit === p.unit;
                        return (
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
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              background: isSelected ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(16, 185, 129, 0.08)',
                              color: isSelected ? '#ffffff' : mode === 'dark' ? '#34D399' : '#059669',
                              border: isSelected ? 'none' : '1px solid rgba(16, 185, 129, 0.25)',
                              boxShadow: isSelected ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                            }}
                          />
                        );
                      })}
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
                        const calc = calculateQuantityFromTiming(t, newMedication.durationValue || 5, newMedication.durationUnit || 'Days', newMedication.type, newMedication.intervalDays || 1);
                        return calc.detailStr || 'Select time of day to auto-calculate';
                      })()}
                      InputProps={{ 
                        sx: { 
                          borderRadius: '16px', 
                          fontWeight: 700,
                          bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          '& fieldset': { border: 'none' }
                        } 
                      }}
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
                      InputProps={{ 
                        sx: { 
                          borderRadius: '16px', 
                          fontWeight: 700,
                          bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          '& fieldset': { border: 'none' }
                        } 
                      }}
                    />
                  </Grid>

                  {(!newMedication.timing || ((newMedication.timing.morning || 0) === 0 && (newMedication.timing.afternoon || 0) === 0 && (newMedication.timing.evening || 0) === 0 && (newMedication.timing.night || 0) === 0)) && !newMedication.isSOS && (
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem', display: 'block', mb: 0.8 }}>
                        Quick Quantity Presets:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                        {[
                          '10 Tablets', '14 Tablets', '20 Tablets', '30 Tablets',
                          '10 Capsules', '14 Capsules', '1 Bottle (100ml)', '1 Strip', '2 Vials', '1 Tube'
                        ].map(q => {
                          const isSelected = newMedication.quantity === q;
                          return (
                            <Chip
                              key={q}
                              label={q}
                              size="small"
                              onClick={() => setNewMedication({ ...newMedication, quantity: q })}
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.72rem',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                background: isSelected ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(16, 185, 129, 0.08)',
                                color: isSelected ? '#ffffff' : mode === 'dark' ? '#34D399' : '#059669',
                                border: isSelected ? 'none' : '1px solid rgba(16, 185, 129, 0.25)'
                              }}
                            />
                          );
                        })}
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Button 
                      type="button"
                      variant="contained" 
                      fullWidth 
                      onClick={addMedication}
                      startIcon={<AddIcon sx={{ color: '#ffffff' }} />}
                      sx={{ 
                        height: 48, 
                        background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', 
                        color: '#ffffff', 
                        fontWeight: 900, 
                        fontSize: '0.9rem',
                        borderRadius: '16px',
                        boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                        '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' }
                      }}
                    >
                      + Add Medication to Prescription
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Mobile-Friendly Added Medication Cards */}
              {formData.medications && formData.medications.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem', display: 'block', mb: 1.2 }}>
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
                        borderRadius: '20px', 
                        bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
                        borderColor: mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.06)'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#0F172A' }}>
                              {idx + 1}. {med.name}
                            </Typography>
                            {med.type && (
                              <Chip label={med.type} size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.12)', color: mode === 'dark' ? '#34D399' : '#059669', borderRadius: '8px' }} />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 0.8 }}>
                            <Chip 
                              label={`Dosage: ${med.dosage || 'As directed'}`} 
                              size="small" 
                              sx={{ fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '0.72rem', borderRadius: '8px' }} 
                            />
                            {med.intervalDays && Number(med.intervalDays) > 1 && (
                              <Chip 
                                label={`🔄 Interval: ${Number(med.intervalDays) === 2 ? 'Alternate Days (Every 2d)' : Number(med.intervalDays) === 7 ? 'Weekly (Every 7d)' : `Every ${med.intervalDays} Days`}`} 
                                size="small" 
                                sx={{ fontWeight: 900, background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)', color: '#ffffff', fontSize: '0.72rem', borderRadius: '8px' }} 
                              />
                            )}
                            <Chip 
                              label={`⏱️ Duration: ${med.duration || 'N/A'}`} 
                              size="small" 
                              sx={{ fontWeight: 800, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', fontSize: '0.72rem', borderRadius: '8px' }} 
                            />
                            {med.quantity && (
                              <Chip 
                                label={`📦 Quantity: ${med.quantity}`} 
                                size="small" 
                                sx={{ fontWeight: 800, bgcolor: 'rgba(168, 85, 247, 0.1)', color: '#9333EA', fontSize: '0.72rem', borderRadius: '8px' }} 
                              />
                            )}
                          </Box>

                          {med.isSOS && (
                            <Box sx={{ mb: 0.8 }}>
                              <Chip
                                icon={<SosIcon sx={{ fontSize: 14, color: '#fff !important' }} />}
                                label={`🆘 SOS (Only When Needed)${med.sosReason ? `: ${med.sosReason}` : ''}`}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: '#EF4444', color: '#fff', fontSize: '0.68rem', height: 22, borderRadius: '8px' }}
                              />
                            </Box>
                          )}

                          {med.timing && ((med.timing.morning || 0) > 0 || (med.timing.afternoon || 0) > 0 || (med.timing.evening || 0) > 0 || (med.timing.night || 0) > 0) && (
                            <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', mb: 0.8 }}>
                              {(med.timing.morning || 0) > 0 && (
                                <Chip
                                  label={`🌅 ×${med.timing.morning} Morning${med.mealRelations?.morning ? ` · ${med.mealRelations.morning}` : ''}`}
                                  size="small"
                                  sx={{ fontWeight: 800, bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#D97706', fontSize: '0.68rem', height: 24, borderRadius: '8px' }}
                                />
                              )}
                              {(med.timing.afternoon || 0) > 0 && (
                                <Chip
                                  label={`☀️ ×${med.timing.afternoon} Afternoon${med.mealRelations?.afternoon ? ` · ${med.mealRelations.afternoon}` : ''}`}
                                  size="small"
                                  sx={{ fontWeight: 800, bgcolor: 'rgba(234, 179, 8, 0.15)', color: '#CA8A04', fontSize: '0.68rem', height: 24, borderRadius: '8px' }}
                                />
                              )}
                              {(med.timing.evening || 0) > 0 && (
                                <Chip
                                  label={`🌆 ×${med.timing.evening} Evening${med.mealRelations?.evening ? ` · ${med.mealRelations.evening}` : ''}`}
                                  size="small"
                                  sx={{ fontWeight: 800, bgcolor: 'rgba(249, 115, 22, 0.15)', color: '#EA580C', fontSize: '0.68rem', height: 24, borderRadius: '8px' }}
                                />
                              )}
                              {(med.timing.night || 0) > 0 && (
                                <Chip
                                  label={`🌙 ×${med.timing.night} Night${med.mealRelations?.night ? ` · ${med.mealRelations.night}` : ''}`}
                                  size="small"
                                  sx={{ fontWeight: 800, bgcolor: 'rgba(99, 102, 241, 0.15)', color: '#4F46E5', fontSize: '0.68rem', height: 24, borderRadius: '8px' }}
                                />
                              )}
                            </Box>
                          )}

                          {med.instructions && (
                            <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontStyle: 'italic', mt: 0.5 }}>
                              "{med.instructions}"
                            </Typography>
                          )}
                        </Box>
                        <IconButton size="small" onClick={() => removeMedication(idx)} sx={{ color: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.08)', ml: 1, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.18)' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Card>
                  ))}
                </Box>
              )}

              {/* Medication Notes */}
              <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem', display: 'block', mb: 0.8 }}>
                Medication Warnings / Notes
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g., Avoid taking with milk or antacids"
                  value={newMedNote}
                  onChange={(e) => setNewMedNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('medicationNotes', newMedNote, setNewMedNote))}
                  InputProps={{ 
                    sx: { 
                      borderRadius: '16px', 
                      fontWeight: 600,
                      bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.95)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      '& fieldset': { border: 'none' }
                    } 
                  }}
                />
                <Button 
                  type="button"
                  variant="contained" 
                  onClick={() => addToArray('medicationNotes', newMedNote, setNewMedNote)}
                  sx={{ 
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', 
                    minWidth: 48, 
                    height: 40,
                    borderRadius: '14px', 
                    px: 2,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <AddIcon sx={{ color: '#fff' }} />
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1.2 }}>
                {formData.medicationNotes?.map((item, idx) => (
                  <Chip 
                    key={idx} 
                    label={item} 
                    onDelete={() => removeFromArray('medicationNotes', idx)} 
                    sx={{ 
                      fontWeight: 700, 
                      fontSize: '0.78rem',
                      borderRadius: '10px',
                      bgcolor: 'rgba(245, 158, 11, 0.15)', 
                      color: mode === 'dark' ? '#FBBF24' : '#D97706',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      '& .MuiChip-deleteIcon': { color: '#D97706', '&:hover': { color: '#EF4444' } }
                    }} 
                  />
                ))}
              </Box>
            </Paper>

            {/* ─── 5. Required Investigations ─── */}
            <Paper 
              className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'} 
              sx={{ 
                p: { xs: 2.2, sm: 3 }, 
                mb: 3, 
                borderRadius: '24px !important',
                background: mode === 'dark' ? 'rgba(15, 23, 42, 0.85) !important' : 'rgba(255, 255, 255, 0.95) !important',
                boxShadow: '0 10px 30px -5px rgba(16, 185, 129, 0.08) !important'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScienceIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#0F172A', letterSpacing: -0.2 }}>
                  5. Required Investigations & Lab Tests
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem' }}>
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
                <Box key={cat.category} sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#94A3B8' : '#64748B', display: 'block', mb: 0.8, fontSize: '0.72rem' }}>
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
                              openInvDialogForTest(item.name);
                            }
                          }}
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            background: isSelected ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : mode === 'dark' ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.95)',
                            color: isSelected ? '#ffffff' : mode === 'dark' ? '#FAF2F5' : '#0F172A',
                            border: isSelected ? 'none' : '1px solid rgba(16, 185, 129, 0.2)',
                            boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                            transition: 'all 0.2s ease',
                            '&:active': { transform: 'scale(0.95)' }
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              ))}

              <Box sx={{ mt: 2, mb: 2.5 }}>
                <Chip
                  label="➕ + Other (Add Custom Test Not Listed)"
                  onClick={() => openInvDialogCustom()}
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    bgcolor: 'rgba(16, 185, 129, 0.12)',
                    color: mode === 'dark' ? '#34D399' : '#059669',
                    border: '1.5px dashed #10B981',
                    py: 1,
                    px: 1,
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
                  }}
                />
              </Box>

              {formData.investigations && formData.investigations.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#34D399' : '#059669', display: 'block', mb: 1.2, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem' }}>
                    Added Investigations ({formData.investigations.length})
                  </Typography>
                  {formData.investigations.map((inv, idx) => {
                    const priorityColor = inv.priority === 'Urgent' ? '#EF4444' : inv.priority === 'Routine' ? '#10B981' : '#F59E0B';
                    return (
                      <Card 
                        key={idx} 
                        variant="outlined" 
                        sx={{ 
                          mb: 1.2, 
                          p: 1.8, 
                          borderRadius: '16px', 
                          bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : '#ffffff', 
                          borderColor: 'rgba(16, 185, 129, 0.2)',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.05)',
                          transition: 'all 0.2s ease', 
                          '&:hover': { borderColor: '#10B981' } 
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.6 }}>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#0F172A' }}>
                                {idx + 1}. {inv.testName}
                              </Typography>
                              <Chip
                                label={inv.priority || 'Normal'}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontWeight: 800,
                                  fontSize: '0.68rem',
                                  bgcolor: `${priorityColor}18`,
                                  color: priorityColor,
                                  border: `1px solid ${priorityColor}44`,
                                  borderRadius: '8px'
                                }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ color: mode === 'dark' ? '#34D399' : '#059669', display: 'block', fontWeight: 700 }}>
                              {inv.reason || 'Standard check'} • Fasting: {inv.fasting || 'Not specified'}
                            </Typography>
                            {inv.specialInstructions && (
                              <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(250, 242, 245, 0.6)' : '#64748B', display: 'block', fontStyle: 'italic', mt: 0.3 }}>
                                📋 {inv.specialInstructions}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" onClick={() => openInvDialogForEdit(idx)} sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => removeInvestigation(idx)} sx={{ color: '#ef4444' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
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
            </Paper>
          </Box>
        )}

        {/* ═══ STEP 4: ADVICE, FOLLOW-UP & REMARKS ═══ */}
        {(viewMode === 'all' || activeStep === 3) && (
          <Box 
            key={activeStep === 3 ? 'step-3' : 'step-all-3'}
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 0,
              animation: 'stepCardFadeIn 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
              '@keyframes stepCardFadeIn': {
                '0%': { opacity: 0, transform: 'translateY(16px) scale(0.992)' },
                '100%': { opacity: 1, transform: 'translateY(0) scale(1)' }
              }
            }}
          >
            {/* ─── 6. Diet & Lifestyle Recommendations ─── */}
            <Paper 
              className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'} 
              sx={{ 
                p: { xs: 2.2, sm: 3 }, 
                mb: 3, 
                borderRadius: '24px !important'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DietIcon sx={{ color: 'var(--color-mint)' }} /> 6. Diet & Lifestyle Advice
              </Typography>
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
                      type="button"
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
                      type="button"
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
                  <Typography variant="caption" sx={{ fontWeight: '#ef4444', color: '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                      type="button"
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
            </Paper>

            {/* ─── 7. Follow-Up Schedule ─── */}
            <Paper 
              className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'} 
              sx={{ 
                p: { xs: 2.2, sm: 3 }, 
                mb: 3, 
                borderRadius: '24px !important'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EventIcon sx={{ color: 'var(--color-mint)' }} /> 7. Follow-Up Schedule
              </Typography>
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
                      type="button"
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
            </Paper>

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

            {/* ─── 8. Consultation Fee & Indian Billing Options ─── */}
            <Paper 
              className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'} 
              sx={{ 
                p: { xs: 2.2, sm: 3 }, 
                mb: 3, 
                borderRadius: '24px !important',
                border: '1.5px solid rgba(0, 200, 150, 0.35)',
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(14, 59, 51, 0.92) 0%, rgba(10, 37, 32, 0.96) 100%) !important'
                  : 'linear-gradient(135deg, rgba(240, 253, 248, 0.98) 0%, rgba(230, 249, 241, 0.95) 100%) !important'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: mode === 'dark' ? '#FAF2F5' : '#0E3B33', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaymentsIcon sx={{ color: '#00C896', fontSize: 22 }} />
                  8. Consultation Fee & Billing (Indian OPD)
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={generateBillEnabled}
                      onChange={(e) => setGenerateBillEnabled(e.target.checked)}
                      color="success"
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ fontWeight: 800, color: generateBillEnabled ? '#00C896' : '#94A8A3' }}>
                      {generateBillEnabled ? '✓ Auto-Generate Bill' : 'Skip Billing'}
                    </Typography>
                  }
                />
              </Box>

              {generateBillEnabled && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Follow-up eligibility banner */}
                  {billingFollowUpEligibility?.isEligible && (
                    <Alert severity="success" sx={{ borderRadius: '16px', fontWeight: 700, bgcolor: 'rgba(0, 200, 150, 0.15)', color: mode === 'dark' ? '#89D7B7' : '#0E3B33', border: '1px solid #00C896' }}>
                      🎯 {billingFollowUpEligibility.message} — Free Follow-up rate applied automatically.
                    </Alert>
                  )}

                  {/* Visit Type & Fee Selection */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#428475', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                      Consultation Visit Type & Fee
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={4}>
                        <Paper
                          onClick={() => { setBillingVisitType('standard'); setBillingConsultFee(500); }}
                          sx={{
                            p: 1.5,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            border: `2px solid ${billingVisitType === 'standard' ? '#00C896' : 'rgba(255,255,255,0.1)'}`,
                            bgcolor: billingVisitType === 'standard' ? 'rgba(0, 200, 150, 0.15)' : 'transparent',
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: mode === 'dark' ? '#FAF2F5' : '#0E3B33' }}>
                            🩺 First / Standard Visit
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#00C896', mt: 0.3 }}>
                            ₹{billingConsultFee}
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Paper
                          onClick={() => { setBillingVisitType('follow_up'); }}
                          sx={{
                            p: 1.5,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            border: `2px solid ${billingVisitType === 'follow_up' ? '#00C896' : 'rgba(255,255,255,0.1)'}`,
                            bgcolor: billingVisitType === 'follow_up' ? 'rgba(0, 200, 150, 0.15)' : 'transparent',
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: mode === 'dark' ? '#FAF2F5' : '#0E3B33' }}>
                            🔄 Follow-up Visit (₹0)
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#00C896', mt: 0.3 }}>
                            ₹{billingFollowUpFee}
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Paper
                          onClick={() => setBillingVisitType('custom')}
                          sx={{
                            p: 1.5,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            border: `2px solid ${billingVisitType === 'custom' ? '#00C896' : 'rgba(255,255,255,0.1)'}`,
                            bgcolor: billingVisitType === 'custom' ? 'rgba(0, 200, 150, 0.15)' : 'transparent',
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: mode === 'dark' ? '#FAF2F5' : '#0E3B33' }}>
                            ⚙️ Custom Fee
                          </Typography>
                          <TextField
                            size="small"
                            type="number"
                            value={billingConsultFee}
                            onChange={(e) => setBillingConsultFee(Number(e.target.value))}
                            InputProps={{ sx: { height: 28, fontSize: '0.85rem', fontWeight: 800, borderRadius: '8px' } }}
                            sx={{ mt: 0.5, width: 90 }}
                          />
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* In-Clinic Minor Procedures Quick-Add */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#428475', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                      Add In-Clinic Procedures & Services
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                      {[
                        { name: 'Nebulization', price: 150 },
                        { name: 'Wound Dressing / Suture Removal', price: 200 },
                        { name: 'ECG Recording', price: 300 },
                        { name: 'Blood Sugar Rapid Test', price: 100 },
                        { name: 'Injection Administration', price: 50 },
                        { name: 'Ear Syringing', price: 250 }
                      ].map((proc, pIdx) => (
                        <Chip
                          key={pIdx}
                          label={`+ ${proc.name} (₹${proc.price})`}
                          onClick={() => {
                            setBillingProcedures(prev => [...prev, {
                              description: proc.name,
                              unitPrice: proc.price,
                              quantity: 1,
                              hsnSacCode: '999312',
                              itemType: 'procedure'
                            }]);
                          }}
                          sx={{
                            fontWeight: 700,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                            color: mode === 'dark' ? '#FAF2F5' : '#0E3B33',
                            border: '1px solid rgba(0, 200, 150, 0.25)',
                            '&:hover': { bgcolor: 'rgba(0, 200, 150, 0.2)' }
                          }}
                        />
                      ))}
                    </Box>

                    {/* Added Procedures List */}
                    {billingProcedures.length > 0 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mb: 1 }}>
                        {billingProcedures.map((item, idx) => (
                          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderRadius: '10px', bgcolor: 'rgba(0, 200, 150, 0.08)', border: '1px solid rgba(0, 200, 150, 0.2)' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0E3B33' }}>
                              {item.description} (Qty: {item.quantity})
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 900, color: '#00C896' }}>
                                ₹{item.unitPrice * item.quantity}
                              </Typography>
                              <IconButton size="small" onClick={() => setBillingProcedures(prev => prev.filter((_, i) => i !== idx))} sx={{ color: '#EF4444' }}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>

                  {/* GST, Discount & Payment Controls */}
                  <Grid container spacing={2}>
                    {/* GST Exemption Toggle */}
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 1.5, borderRadius: '16px', bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0E3B33', display: 'block' }}>
                              Indian GST Status
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94A8A3', fontSize: '0.68rem' }}>
                              {billingGstType === 'exempt' ? 'Exempt under SAC 999312 (Bill of Supply)' : `Taxable (${billingGstRate}% CGST+SGST)`}
                            </Typography>
                          </Box>
                          <Chip
                            label={billingGstType === 'exempt' ? 'EXEMPT (0%)' : `${billingGstRate}% GST`}
                            size="small"
                            onClick={() => setBillingGstType(prev => prev === 'exempt' ? 'cgst_sgst' : 'exempt')}
                            sx={{ fontWeight: 900, bgcolor: billingGstType === 'exempt' ? 'rgba(0,200,150,0.2)' : 'rgba(255,152,0,0.2)', color: billingGstType === 'exempt' ? '#00C896' : '#FF9800', cursor: 'pointer' }}
                          />
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Discount / Concession */}
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 1.5, borderRadius: '16px', bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff', border: mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#2A6B5D', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.72rem' }}>
                            Concession / Discount
                          </Typography>
                          <Box sx={{ display: 'flex', bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '8px', p: '2px' }}>
                            <Button
                              type="button"
                              size="small"
                              onClick={() => {
                                setBillingDiscountType('percent');
                                const cFee = billingVisitType === 'follow_up' ? billingFollowUpFee : Number(billingConsultFee);
                                const pTot = billingProcedures.reduce((s, p) => s + (Number(p.unitPrice) * Number(p.quantity)), 0);
                                setBillingDiscount(Math.round(((cFee + pTot) * billingDiscountPercent) / 100));
                              }}
                              sx={{
                                py: 0.2, px: 1, minWidth: 32, fontSize: '0.7rem', fontWeight: 800, borderRadius: '6px', textTransform: 'none',
                                bgcolor: billingDiscountType === 'percent' ? 'var(--color-mint)' : 'transparent',
                                color: billingDiscountType === 'percent' ? (mode === 'dark' ? '#0F1D1B' : '#ffffff') : (mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                                '&:hover': { bgcolor: billingDiscountType === 'percent' ? 'var(--color-mint)' : 'transparent' }
                              }}
                            >
                              % Percent
                            </Button>
                            <Button
                              type="button"
                              size="small"
                              onClick={() => setBillingDiscountType('flat')}
                              sx={{
                                py: 0.2, px: 1, minWidth: 32, fontSize: '0.7rem', fontWeight: 800, borderRadius: '6px', textTransform: 'none',
                                bgcolor: billingDiscountType === 'flat' ? 'var(--color-mint)' : 'transparent',
                                color: billingDiscountType === 'flat' ? (mode === 'dark' ? '#0F1D1B' : '#ffffff') : (mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                                '&:hover': { bgcolor: billingDiscountType === 'flat' ? 'var(--color-mint)' : 'transparent' }
                              }}
                            >
                              ₹ Flat
                            </Button>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {billingDiscountType === 'percent' ? (
                            <TextField
                              size="small"
                              label="Discount (%)"
                              type="number"
                              value={billingDiscountPercent || ''}
                              onChange={(e) => {
                                const pct = Math.max(0, Math.min(100, Number(e.target.value)));
                                setBillingDiscountPercent(pct);
                                const cFee = billingVisitType === 'follow_up' ? billingFollowUpFee : Number(billingConsultFee);
                                const pTot = billingProcedures.reduce((s, p) => s + (Number(p.unitPrice) * Number(p.quantity)), 0);
                                setBillingDiscount(Math.round(((cFee + pTot) * pct) / 100));
                              }}
                              InputProps={{ 
                                endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ fontWeight: 800 }}>%</Typography></InputAdornment>,
                                sx: { borderRadius: '12px', height: 38 } 
                              }}
                              sx={{ flex: '1 1 120px' }}
                            />
                          ) : (
                            <TextField
                              size="small"
                              label="Discount (₹)"
                              type="number"
                              value={billingDiscount || ''}
                              onChange={(e) => setBillingDiscount(Math.max(0, Number(e.target.value)))}
                              InputProps={{ 
                                startAdornment: <InputAdornment position="start"><Typography variant="caption" sx={{ fontWeight: 800 }}>₹</Typography></InputAdornment>,
                                sx: { borderRadius: '12px', height: 38 } 
                              }}
                              sx={{ flex: '1 1 120px' }}
                            />
                          )}

                          <FormControl size="small" sx={{ flex: '1 1 140px' }}>
                            <InputLabel>Reason</InputLabel>
                            <Select
                              value={billingConcessionReason}
                              label="Reason"
                              onChange={(e) => setBillingConcessionReason(e.target.value)}
                              sx={{ borderRadius: '12px', height: 38 }}
                            >
                              <MenuItem value="">None</MenuItem>
                              <MenuItem value="senior_citizen">Senior Citizen</MenuItem>
                              <MenuItem value="courtesy">Doctor Courtesy</MenuItem>
                              <MenuItem value="staff">Staff / Family</MenuItem>
                              <MenuItem value="bpl">BPL / EWS Concession</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>

                        {/* Quick Percentage Chips */}
                        {billingDiscountType === 'percent' && (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            {[0, 10, 20, 25, 50, 100].map((pct) => (
                              <Chip
                                key={pct}
                                label={pct === 100 ? '100% Free' : `${pct}%`}
                                size="small"
                                clickable
                                onClick={() => {
                                  setBillingDiscountPercent(pct);
                                  const cFee = billingVisitType === 'follow_up' ? billingFollowUpFee : Number(billingConsultFee);
                                  const pTot = billingProcedures.reduce((s, p) => s + (Number(p.unitPrice) * Number(p.quantity)), 0);
                                  setBillingDiscount(Math.round(((cFee + pTot) * pct) / 100));
                                }}
                                sx={{
                                  height: 24,
                                  fontWeight: 800,
                                  fontSize: '0.7rem',
                                  borderRadius: '6px',
                                  bgcolor: billingDiscountPercent === pct 
                                    ? (mode === 'dark' ? 'rgba(137, 215, 183, 0.3)' : 'rgba(66, 132, 117, 0.25)')
                                    : (mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
                                  color: billingDiscountPercent === pct 
                                    ? (mode === 'dark' ? '#89D7B7' : '#1A312C')
                                    : (mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.65)'),
                                  border: billingDiscountPercent === pct ? '1px solid var(--color-mint)' : '1px solid transparent'
                                }}
                              />
                            ))}
                            {billingDiscount > 0 && (
                              <Typography variant="caption" sx={{ ml: 'auto', fontWeight: 800, color: '#10B981', fontSize: '0.72rem' }}>
                                saves ₹{billingDiscount}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Paper>
                    </Grid>

                    {/* Payment Mode */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Payment Status</InputLabel>
                        <Select
                          value={billingPaymentStatus}
                          label="Payment Status"
                          onChange={(e) => setBillingPaymentStatus(e.target.value as any)}
                          sx={{ borderRadius: '14px' }}
                        >
                          <MenuItem value="paid">🟢 Paid (Cash Collected in Clinic)</MenuItem>
                          <MenuItem value="paid_upi">📱 Paid (via Clinic UPI QR)</MenuItem>
                          <MenuItem value="unpaid">🟠 Unpaid / Bill Due (Send Payment Link)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Multi-Channel Patient Dispatch Toggles: WhatsApp & SMS, Email, Patient App */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 1.5, borderRadius: '16px', bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.25)' : '#F8FAFC', border: mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#89D7B7' : '#2A6B5D', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.72rem', display: 'block', mb: 0.8 }}>
                          Dispatch & Sync Channels
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={12} sm={4}>
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={billingSendWhatsapp}
                                  onChange={(e) => setBillingSendWhatsapp(e.target.checked)}
                                  color="success"
                                />
                              }
                              label={
                                <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0E3B33', fontSize: '0.78rem' }}>
                                  📱 WhatsApp & SMS
                                </Typography>
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={billingSendEmail}
                                  onChange={(e) => setBillingSendEmail(e.target.checked)}
                                  color="success"
                                />
                              }
                              label={
                                <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0E3B33', fontSize: '0.78rem' }}>
                                  📧 Email (PDF Invoice)
                                </Typography>
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={billingSendPatientApp}
                                  onChange={(e) => setBillingSendPatientApp(e.target.checked)}
                                  color="success"
                                />
                              }
                              label={
                                <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0E3B33', fontSize: '0.78rem' }}>
                                  📲 Patient App & Portal
                                </Typography>
                              }
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Net Payable Summary Banner */}
                  {(() => {
                    const cFee = billingVisitType === 'follow_up' ? billingFollowUpFee : billingConsultFee;
                    const procTotal = billingProcedures.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0);
                    const subtotal = cFee + procTotal;
                    const netTotal = Math.max(0, subtotal - (Number(billingDiscount) || 0));
                    return (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: '14px', bgcolor: 'rgba(0, 200, 150, 0.2)', border: '1px solid #00C896' }}>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#0E3B33' }}>
                            ESTIMATED BILL TOTAL:
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A8A3', display: 'block', fontSize: '0.7rem' }}>
                            Consultation: ₹{cFee} + Procedures: ₹{procTotal} {billingDiscount > 0 ? `- Disc: ₹${billingDiscount}` : ''}
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#00C896' }}>
                          ₹{netTotal} INR
                        </Typography>
                      </Box>
                    );
                  })()}
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* ─── Step Navigation Control Bar (Desktop/Tablet) ─── */}
        <Paper 
          elevation={8}
          className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'} 
          sx={{ 
            display: { xs: 'none', sm: 'block' },
            p: 2.5, 
            mt: 3, 
            mb: 4, 
            borderRadius: '24px !important',
            background: mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(20, 42, 36, 0.95), rgba(13, 27, 23, 0.98))' 
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 253, 246, 0.98))',
            backdropFilter: 'blur(20px)',
            border: mode === 'dark' ? '1px solid rgba(137, 215, 183, 0.2)' : '1px solid rgba(66, 132, 117, 0.15)'
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Left side: Cancel & Prev Step */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
                sx={{ 
                  height: 46, 
                  px: 2.5,
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)', 
                  color: mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                  borderRadius: '16px',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { borderColor: mode === 'dark' ? '#89D7B7' : '#428475', bgcolor: 'rgba(137,215,183,0.08)' }
                }}
              >
                Cancel
              </Button>

              {viewMode === 'cards' && activeStep > 0 && (
                <Button
                  variant="outlined"
                  onClick={handlePrevStep}
                  startIcon={<PrevIcon />}
                  sx={{ 
                    height: 46, 
                    px: 2.5,
                    borderColor: 'var(--color-mint)', 
                    color: mode === 'dark' ? '#89D7B7' : '#2A6B5D',
                    borderRadius: '16px',
                    fontWeight: 800,
                    textTransform: 'none',
                    bgcolor: mode === 'dark' ? 'rgba(137, 215, 183, 0.1)' : 'rgba(66, 132, 117, 0.06)',
                    '&:hover': { bgcolor: mode === 'dark' ? 'rgba(137, 215, 183, 0.2)' : 'rgba(66, 132, 117, 0.12)' }
                  }}
                >
                  Previous Step
                </Button>
              )}
            </Box>

            {/* Center: Step badge */}
            {viewMode === 'cards' && (
              <Chip
                label={`Step ${activeStep + 1} of ${FORM_STEPS.length} — ${FORM_STEPS[activeStep].label}`}
                size="medium"
                sx={{
                  bgcolor: mode === 'dark' ? 'rgba(137, 215, 183, 0.15)' : 'rgba(66, 132, 117, 0.1)',
                  color: mode === 'dark' ? '#89D7B7' : '#1A312C',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  borderRadius: '12px',
                  py: 0.5,
                  px: 1
                }}
              />
            )}

            {/* Right side: Next Step or Submit */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              {viewMode === 'cards' && activeStep < FORM_STEPS.length - 1 ? (
                <Button
                  type="button"
                  variant="contained"
                  onClick={handleNextStep}
                  endIcon={<NextIcon />}
                  sx={{ 
                    height: 48, 
                    px: 3.5,
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', 
                    color: '#ffffff',
                    borderRadius: '16px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    textTransform: 'none',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                    '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)' }
                  }}
                >
                  Next Step Card
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={22} sx={{ color: '#ffffff' }} /> : <SendIcon />}
                  sx={{ 
                    height: 48, 
                    px: 4,
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', 
                    color: '#ffffff',
                    borderRadius: '16px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                    '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' }
                  }}
                >
                  {loading ? 'Issuing Prescription...' : 'Issue Prescription'}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* ─── Mobile Centered Floating Stepper Dock ─── */}
        <Paper
          elevation={0}
          className="specular-sheen"
          sx={{
            display: { xs: 'block', sm: 'none' },
            position: 'fixed',
            bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
            left: '50% !important',
            right: 'auto !important',
            transform: 'translateX(-50%) !important',
            width: 'calc(100% - 24px)',
            maxWidth: '480px',
            zIndex: 1400,
            p: 1.5,
            pt: 1.5,
            borderRadius: '28px !important',
            overflow: 'hidden',
            bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(30px) saturate(220%)',
            WebkitBackdropFilter: 'blur(30px) saturate(220%)',
            border: mode === 'dark' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(16, 185, 129, 0.25)',
            boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.25), 0 4px 14px rgba(16, 185, 129, 0.15)'
          }}
        >
          {/* Top Thin Progress Line */}
          <LinearProgress
            variant="determinate"
            value={((activeStep + 1) / 4) * 100}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              bgcolor: 'transparent',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #059669 0%, #34D399 100%)'
              }
            }}
          />

          {/* Compact Step Tabs & Mode Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2, px: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              {FORM_STEPS.map((step, idx) => {
                const isActive = activeStep === idx;
                const isCompleted = activeStep > idx;
                return (
                  <Box
                    key={idx}
                    onClick={() => {
                      setActiveStep(idx);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.4,
                      px: isActive ? 1.2 : 0.8,
                      py: 0.4,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      bgcolor: isActive
                        ? (mode === 'dark' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.12)')
                        : (mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                      border: isActive
                        ? (mode === 'dark' ? '1.5px solid #34D399' : '1.5px solid #059669')
                        : '1px solid transparent',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <Typography sx={{ fontSize: '0.85rem', lineHeight: 1 }}>{step.icon}</Typography>
                    {isActive && (
                      <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem', color: mode === 'dark' ? '#FAF2F5' : '#0F172A', lineHeight: 1 }}>
                        {step.label.split(' ')[0]}
                      </Typography>
                    )}
                    {isCompleted && !isActive && <CheckIcon sx={{ fontSize: 11, color: '#34D399' }} />}
                  </Box>
                );
              })}
            </Box>

            <Button
              size="small"
              type="button"
              onClick={() => setViewMode(prev => prev === 'cards' ? 'all' : 'cards')}
              sx={{
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.65rem',
                px: 1,
                py: 0.3,
                color: mode === 'dark' ? '#34D399' : '#059669',
                bgcolor: mode === 'dark' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textTransform: 'none',
                minWidth: 0
              }}
            >
              {viewMode === 'cards' ? '🎴 Cards' : '📄 All'}
            </Button>
          </Box>

          {/* Bottom Action Controls */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {viewMode === 'cards' && activeStep > 0 && (
              <Button
                size="small"
                type="button"
                variant="outlined"
                onClick={handlePrevStep}
                startIcon={<PrevIcon sx={{ fontSize: 16 }} />}
                sx={{
                  height: 42,
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  px: 2,
                  borderColor: mode === 'dark' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                  color: mode === 'dark' ? '#34D399' : '#059669',
                  bgcolor: mode === 'dark' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(16, 185, 129, 0.04)',
                  textTransform: 'none'
                }}
              >
                Prev
              </Button>
            )}

            {viewMode === 'cards' && activeStep < FORM_STEPS.length - 1 ? (
              <Button
                fullWidth
                type="button"
                size="small"
                variant="contained"
                onClick={handleNextStep}
                endIcon={<NextIcon sx={{ fontSize: 18 }} />}
                sx={{
                  height: 42,
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  textTransform: 'none'
                }}
              >
                Next Step Card
              </Button>
            ) : (
              <Button
                fullWidth
                type="submit"
                size="small"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} sx={{ color: '#ffffff' }} /> : <SendIcon sx={{ fontSize: 18 }} />}
                sx={{
                  height: 42,
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  textTransform: 'none'
                }}
              >
                {loading ? 'Issuing...' : 'Issue Prescription'}
              </Button>
            )}
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

          {/* ─── Guardian Section (Minors under 15) ─── */}
          {isMinorPatient && (
            <Box sx={{ mt: 2.5 }}>
              <Alert
                severity="warning"
                sx={{
                  borderRadius: '14px',
                  mb: 2,
                  py: 0.8,
                  bgcolor: mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  '& .MuiAlert-message': { fontSize: '0.82rem', fontWeight: 700 }
                }}
              >
                ⚠️ This patient is under 15 years old. A legal guardian is required.
              </Alert>

              {/* Guardian Mode Toggle */}
              <Box sx={{ display: 'flex', gap: 0.8, mb: 2 }}>
                <Button
                  size="small"
                  type="button"
                  onClick={() => { setGuardianMode('link'); setGuardianFound(null); }}
                  sx={{
                    flex: 1,
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    py: 0.8,
                    bgcolor: guardianMode === 'link' ? '#428475' : (mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    color: guardianMode === 'link' ? '#ffffff' : (mode === 'dark' ? '#89D7B7' : '#1A312C'),
                    border: guardianMode === 'link' ? '1.5px solid #89D7B7' : '1px solid rgba(0,0,0,0.1)',
                    textTransform: 'none',
                    '&:hover': { bgcolor: guardianMode === 'link' ? '#356d61' : 'rgba(66,132,117,0.08)' }
                  }}
                >
                  🔗 Link Existing Account
                </Button>
                <Button
                  size="small"
                  type="button"
                  onClick={() => { setGuardianMode('create'); setGuardianFound(null); }}
                  sx={{
                    flex: 1,
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    py: 0.8,
                    bgcolor: guardianMode === 'create' ? '#428475' : (mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    color: guardianMode === 'create' ? '#ffffff' : (mode === 'dark' ? '#89D7B7' : '#1A312C'),
                    border: guardianMode === 'create' ? '1.5px solid #89D7B7' : '1px solid rgba(0,0,0,0.1)',
                    textTransform: 'none',
                    '&:hover': { bgcolor: guardianMode === 'create' ? '#356d61' : 'rgba(66,132,117,0.08)' }
                  }}
                >
                  ➕ Create Guardian Account
                </Button>
              </Box>

              {/* Link Existing Guardian */}
              {guardianMode === 'link' && (
                <Box>
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid item xs={8}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Search by Email, Phone, or Patient ID"
                        value={guardianSearchQuery}
                        onChange={(e) => setGuardianSearchQuery(e.target.value)}
                        InputProps={{ sx: { borderRadius: '12px' } }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        type="button"
                        variant="contained"
                        disabled={!guardianSearchQuery.trim() || guardianSearching}
                        onClick={async () => {
                          setGuardianSearching(true);
                          setGuardianFound(null);
                          try {
                            const result = await usersAPI.lookupPatientById(guardianSearchQuery.trim());
                            if (result && result.id) {
                              setGuardianFound(result);
                            } else {
                              setNewPatientError('Guardian not found. Try a different email, phone, or ID.');
                            }
                          } catch {
                            setNewPatientError('Guardian not found. Try a different email, phone, or ID.');
                          } finally {
                            setGuardianSearching(false);
                          }
                        }}
                        sx={{
                          height: 40,
                          borderRadius: '12px',
                          bgcolor: 'var(--color-forest)',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          textTransform: 'none'
                        }}
                      >
                        {guardianSearching ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Find'}
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Guardian Found Card */}
                  {guardianFound && (
                    <Card
                      variant="outlined"
                      sx={{
                        mt: 1.5,
                        p: 1.5,
                        borderRadius: '14px',
                        bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.12)' : 'rgba(102, 205, 170, 0.1)',
                        borderColor: 'var(--color-mint)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                      }}
                    >
                      <Avatar sx={{ bgcolor: '#428475', width: 36, height: 36, fontSize: '0.85rem', fontWeight: 900 }}>
                        {(guardianFound.firstName || '?')[0]}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#123029' }}>
                          {guardianFound.firstName} {guardianFound.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: mode === 'dark' ? '#89D7B7' : '#428475', fontWeight: 600, display: 'block' }}>
                          {guardianFound.email || guardianFound.phone || guardianFound.id}
                        </Typography>
                      </Box>
                      <Chip label="✓ Guardian" size="small" sx={{ bgcolor: '#428475', color: '#ffffff', fontWeight: 800, fontSize: '0.68rem' }} />
                    </Card>
                  )}
                </Box>
              )}

              {/* Create New Guardian */}
              {guardianMode === 'create' && (
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Guardian First Name *"
                      value={guardianCreateData.firstName}
                      onChange={(e) => setGuardianCreateData({ ...guardianCreateData, firstName: e.target.value })}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Guardian Last Name *"
                      value={guardianCreateData.lastName}
                      onChange={(e) => setGuardianCreateData({ ...guardianCreateData, lastName: e.target.value })}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Guardian Email"
                      type="email"
                      value={guardianCreateData.email}
                      onChange={(e) => setGuardianCreateData({ ...guardianCreateData, email: e.target.value })}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Guardian Phone"
                      value={guardianCreateData.phone}
                      onChange={(e) => setGuardianCreateData({ ...guardianCreateData, phone: e.target.value })}
                      InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                  </Grid>
                </Grid>
              )}
            </Box>
          )}

          {newPatientError && (
            <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700, mt: 1, display: 'block', px: 1 }}>
              ⚠️ {newPatientError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => { setNewPatientDialogOpen(false); setGuardianFound(null); setGuardianSearchQuery(''); setGuardianCreateData({ firstName: '', lastName: '', email: '', phone: '' }); }} sx={{ borderRadius: '12px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              creatingPatient ||
              !newPatientData.firstName ||
              !newPatientData.lastName ||
              !newPatientData.dateOfBirth ||
              (newPatientData.noEmail ? !newPatientData.phone : !newPatientData.email) ||
              (isMinorPatient && !isGuardianResolved)
            }
            onClick={async () => {
              try {
                setCreatingPatient(true);
                setNewPatientError('');

                // Build guardian payload for minors
                let guardianPayload: any = {};
                if (isMinorPatient) {
                  if (guardianMode === 'link' && guardianFound) {
                    guardianPayload.guardianId = guardianFound.id;
                  } else if (guardianMode === 'create') {
                    guardianPayload.guardianData = {
                      firstName: guardianCreateData.firstName,
                      lastName: guardianCreateData.lastName,
                      email: guardianCreateData.email,
                      phone: guardianCreateData.phone,
                    };
                  }
                }

                // Create patient via real API (auto-links to doctor on backend)
                const result = await usersAPI.createPatient({
                  firstName: newPatientData.firstName,
                  lastName: newPatientData.lastName,
                  email: newPatientData.noEmail ? '' : newPatientData.email,
                  phone: newPatientData.phone,
                  dateOfBirth: newPatientData.dateOfBirth,
                  gender: newPatientData.gender,
                  address: newPatientData.address,
                  noEmail: newPatientData.noEmail,
                  ...guardianPayload
                });
                const newP = result.patient || result;
                const tempPwd = result.tempPassword || '';
                // Refresh the full linked patient list from backend
                await fetchMyPatients();
                setSelectedPatient(newP);
                setFormData(prev => ({ ...prev, patientId: newP.id }));
                setNewPatientDialogOpen(false);
                setNewPatientData({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: 'male', address: '', noEmail: false });
                // Reset guardian state
                setGuardianFound(null);
                setGuardianSearchQuery('');
                setGuardianCreateData({ firstName: '', lastName: '', email: '', phone: '' });
                // Show temp password in success snackbar
                const guardianInfo = result.guardianName ? ` | Guardian: ${result.guardianName}` : '';
                if (tempPwd) {
                  setNewPatientSuccess(`✅ Patient created! Temporary password: ${tempPwd}${guardianInfo}`);
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
                    label="Patient ID, Mobile Number or Email *"
                    placeholder="Enter Patient ID, 10-digit Mobile Number, or Email"
                    value={patientIdToLookup}
                    onChange={(e) => {
                      setPatientIdToLookup(e.target.value);
                      setLookupError('');
                    }}
                    helperText="Search patient by ID, 10-digit mobile number, or email address"
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
                        const cleanDigits = query.replace(/[^\d]/g, '');
                        const match = patients.find(p => {
                          const pMobile = String((p as any)?.contactNumber || (p as any)?.phone || (p as any)?.mobile || '');
                          const pMobileDigits = pMobile.replace(/[^\d]/g, '');
                          const mobileMatch = pMobile.toLowerCase().includes(query) || (cleanDigits.length >= 3 && pMobileDigits.includes(cleanDigits));

                          return (
                            (p?.id || '').toLowerCase().includes(query) || 
                            (p?.email || '').toLowerCase().includes(query) || 
                            mobileMatch ||
                            `${p?.firstName || ''} ${p?.lastName || ''}`.toLowerCase().includes(query)
                          );
                        });
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

      {/* ─── Dialog: Add Family Member under Patient Account ─── */}
      <Dialog
        open={addFamilyMemberDialogOpen}
        onClose={() => setAddFamilyMemberDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(24px)',
            color: mode === 'dark' ? '#FAF2F5' : '#0F172A',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.2, pb: 1 }}>
          <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex' }}>
            <PersonAddIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
              Add Family Member
            </Typography>
            <Typography variant="caption" sx={{ color: mode === 'dark' ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
              Under account: {selectedPatient?.firstName} {selectedPatient?.lastName} ({selectedPatient?.phone || selectedPatient?.email})
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {familyMemberError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '14px', fontWeight: 700 }}>
              {familyMemberError}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Relationship */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontWeight: 700 }}>Relationship *</InputLabel>
                <Select
                  value={familyMemberForm.relationship}
                  label="Relationship *"
                  onChange={(e) => setFamilyMemberForm({ ...familyMemberForm, relationship: e.target.value as any })}
                  sx={{ borderRadius: '14px', fontWeight: 700 }}
                >
                  <MenuItem value="spouse">👫 Spouse / Wife / Husband</MenuItem>
                  <MenuItem value="child">👶 Child / Son / Daughter</MenuItem>
                  <MenuItem value="parent">👴 Parent / Father / Mother</MenuItem>
                  <MenuItem value="sibling">🧑‍🤝‍🧑 Sibling / Brother / Sister</MenuItem>
                  <MenuItem value="other">👤 Other Dependent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Names */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="First Name *"
                placeholder="e.g. Rahul"
                value={familyMemberForm.firstName}
                onChange={(e) => setFamilyMemberForm({ ...familyMemberForm, firstName: e.target.value })}
                InputProps={{ sx: { borderRadius: '14px', fontWeight: 700 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Last Name *"
                placeholder="e.g. Kumar"
                value={familyMemberForm.lastName}
                onChange={(e) => setFamilyMemberForm({ ...familyMemberForm, lastName: e.target.value })}
                InputProps={{ sx: { borderRadius: '14px', fontWeight: 700 } }}
              />
            </Grid>

            {/* DOB & Gender */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date of Birth"
                InputLabelProps={{ shrink: true }}
                value={familyMemberForm.dateOfBirth}
                onChange={(e) => setFamilyMemberForm({ ...familyMemberForm, dateOfBirth: e.target.value })}
                InputProps={{ sx: { borderRadius: '14px' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select
                  value={familyMemberForm.gender}
                  label="Gender"
                  onChange={(e) => setFamilyMemberForm({ ...familyMemberForm, gender: e.target.value })}
                  sx={{ borderRadius: '14px' }}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Phone & Blood Type */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Phone Number"
                placeholder="Optional (defaults to primary phone)"
                value={familyMemberForm.phone}
                onChange={(e) => setFamilyMemberForm({ ...familyMemberForm, phone: e.target.value })}
                InputProps={{ sx: { borderRadius: '14px' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Blood Type</InputLabel>
                <Select
                  value={familyMemberForm.bloodType}
                  label="Blood Type"
                  onChange={(e) => setFamilyMemberForm({ ...familyMemberForm, bloodType: e.target.value })}
                  sx={{ borderRadius: '14px' }}
                >
                  <MenuItem value="">Unknown</MenuItem>
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-">O-</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Medical History / Allergies Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Known Allergies / Medical Notes"
                placeholder="e.g. Allergic to Penicillin, Asthmatic, etc."
                value={familyMemberForm.medicalHistory}
                onChange={(e) => setFamilyMemberForm({ ...familyMemberForm, medicalHistory: e.target.value })}
                InputProps={{ sx: { borderRadius: '14px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
          <Button
            onClick={() => setAddFamilyMemberDialogOpen(false)}
            sx={{ borderRadius: '12px', fontWeight: 700, color: mode === 'dark' ? '#94A3B8' : '#64748B' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={addingFamilyMember || !familyMemberForm.firstName.trim() || !familyMemberForm.lastName.trim()}
            onClick={handleAddFamilyMemberSubmit}
            sx={{
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: '#ffffff',
              fontWeight: 800,
              px: 2.5,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' }
            }}
          >
            {addingFamilyMember ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Add & Select'}
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

      {/* Investigation Detail Dialog */}
      <InvestigationDetailDialog
        open={invDialogOpen}
        onClose={() => setInvDialogOpen(false)}
        onConfirm={handleInvDialogConfirm}
        initialData={invDialogTest}
        isCustom={invDialogIsCustom}
        isEditing={invDialogEditIndex !== null}
        mode={mode}
      />

      <DigiLockerWarmupModal
        open={digilockerLoading}
        onClose={() => setDigilockerLoading(false)}
      />
    </Container>
  );
};

export default NewPrescription;
