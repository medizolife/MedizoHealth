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
  duration: string;
  instructions: string;
}

// Investigation/Test required
export interface Investigation {
  testName: string;
  reason?: string;
  priority?: string;
  fasting?: string;
}

// Follow-up information
export interface FollowUpInfo {
  appointmentDate?: string;
  appointmentTime?: string;
  purpose?: string;
  bringItems?: string[];
}

export interface Prescription {
  id: string;
  doctorId: string;
  patientId: string;
  
  // Basic Info
  medication: string;
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
  
  // System fields
  qrCode: string;
  status: 'active' | 'completed' | 'cancelled';
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
