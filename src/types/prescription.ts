// Vital Signs interface
export interface VitalSigns {
  bloodPressure?: string;
  pulse?: string;
  temperature?: string;
  spo2?: string;
  respiratoryRate?: string;
  bmi?: string;
  painScale?: string;
}

// Individual Medication in prescriptions
export interface MedicationItem {
  name: string;
  type?: string;
  dosage: string;
  frequency?: string;
  intervalDays?: number;
  intervalType?: 'daily' | 'alternate' | 'every_3_days' | 'every_4_days' | 'every_5_days' | 'weekly' | 'every_10_days' | 'custom';
  intervalLabel?: string;
  duration: string;
  durationValue?: number | string;
  durationUnit?: string;
  quantity?: string;
  quantityValue?: number | string;
  quantityUnit?: string;
  instructions: string;
  // Per-time-of-day dose count: 0 = not selected, 1/2/3 = number of units at that time
  timing?: {
    morning?: number;
    afternoon?: number;
    evening?: number;
    night?: number;
  };
  mealRelations?: {
    morning?: string;
    afternoon?: string;
    evening?: string;
    night?: string;
  };
  isSOS?: boolean;
  sosReason?: string;
}

// Investigation/Test required
export interface Investigation {
  testName: string;
  reason?: string;
  priority?: string;
  fasting?: string;
  specialInstructions?: string;
}

// Uploaded Diagnostic/Lab Test Report
export interface TestReport {
  id: string;
  testName?: string;
  filename: string;
  originalName: string;
  fileUrl: string;
  fileType: 'pdf' | 'image';
  mimeType?: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedByName?: string;
  uploaderRole?: 'patient' | 'doctor';
  uploadedAt: string;
  notes?: string;
}

// Follow-up information
export interface FollowUpInfo {
  appointmentDate?: string;
  appointmentTime?: string;
  purpose?: string;
  bringItems?: string[];
}

// Single Dispensing Event History record
export interface DispenseHistoryEvent {
  dispenseIndex?: number;
  dispensedAt: string;
  dispenseNotes?: string;
  itemsDispensed?: Array<{
    name: string;
    status: string;
    quantity?: string | number;
  }>;
  dispensedStatus?: string;
  totalItemsPrescribed?: number;
  totalItemsGiven?: number;
}

export interface Prescription {
  id: string;
  doctorId: string;
  patientId: string;
  
  // Basic Info
  medication: string;
  patientName?: string;
  patientEmail?: string;
  patientMobile?: string;
  patientPhone?: string;
  contactNumber?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  notes?: string;
  
  // Enhanced fields
  vitalSigns?: VitalSigns;
  
  // Chief Complaints & Clinical Notes
  presentingComplaints?: string[];
  clinicalFindings?: string[];
  provisionalDiagnosis?: string[];
  
  // Current medications patient is on
  currentMedications?: string[];
  pastSurgicalHistory?: string[];
  
  // Enhanced medication list
  medications?: MedicationItem[];
  medicationNotes?: string[];
  
  // Investigations & Reports
  testsRequired?: string[];
  investigations?: Investigation[];
  investigationNotes?: string;
  testReports?: TestReport[];
  
  // Dietary & Lifestyle
  dietModifications?: string[];
  lifestyleChanges?: string[];
  warningSigns?: string[];
  
  // Follow-up
  followUpDate?: string;
  followUpInfo?: FollowUpInfo;
  emergencyHelpline?: string;
  
  // System & Dispense fields
  qrCode: string;
  status: 'active' | 'completed' | 'cancelled';
  dispensedStatus?: 'pending' | 'dispensed' | 'partially_dispensed';
  dispensedAt?: string;
  dispensedBy?: {
    pharmacistId?: string;
    pharmacistName?: string;
    pharmacyName?: string;
    licenseNumber?: string;
  };
  dispenseNotes?: string;
  dispenseHistory?: DispenseHistoryEvent[];
  dispenseCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePrescriptionData {
  patientId: string;
  
  // Basic (legacy support)
  medication?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  notes?: string;
  
  // Enhanced fields
  vitalSigns?: VitalSigns;
  
  // Chief Complaints & Clinical Notes
  presentingComplaints?: string[];
  clinicalFindings?: string[];
  provisionalDiagnosis?: string[];
  
  // Current medications & history
  currentMedications?: string[];
  pastSurgicalHistory?: string[];
  
  // Medications array
  medications?: MedicationItem[];
  medicationNotes?: string[];
  
  // Investigations
  investigations?: Investigation[];
  investigationNotes?: string;
  
  // Dietary & Lifestyle
  dietModifications?: string[];
  lifestyleChanges?: string[];
  warningSigns?: string[];
  
  // Follow-up
  followUpDate?: string;
  followUpInfo?: FollowUpInfo;
  emergencyHelpline?: string;
}

export interface UpdatePrescriptionData {
  medication?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  notes?: string;
  status?: 'active' | 'completed' | 'cancelled';
  
  // Enhanced fields
  vitalSigns?: VitalSigns;
  presentingComplaints?: string[];
  clinicalFindings?: string[];
  provisionalDiagnosis?: string[];
  currentMedications?: string[];
  pastSurgicalHistory?: string[];
  medications?: MedicationItem[];
  medicationNotes?: string[];
  investigations?: Investigation[];
  investigationNotes?: string;
  dietModifications?: string[];
  lifestyleChanges?: string[];
  warningSigns?: string[];
  followUpDate?: string;
  followUpInfo?: FollowUpInfo;
  emergencyHelpline?: string;
}
