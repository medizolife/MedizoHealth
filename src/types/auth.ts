export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  role: 'doctor' | 'patient' | 'pharmacist';
  profileImage?: string;
  picture?: string;
  specialization?: string;
  pharmacyName?: string;
  licenseNumber?: string;
  pharmacyAddress?: string;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
  digilockerVerified?: boolean;
}

export interface Doctor extends User {
  role: 'doctor';
  specialization?: string;
  contactNumber?: string;
  // Profile and clinic images
  profileImage?: string;
  clinicLogo?: string;
  signature?: string;
  stamp?: string;
  // Extended contact information
  clinicName?: string;
  clinicAddress?: string;
  clinicLatitude?: number;
  clinicLongitude?: number;
  clinicLocationAccuracy?: number;
  clinicPlaceName?: string;
  alternateEmail?: string;
  secondaryPhone?: string;
  fax?: string;
  whatsapp?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  licenseNumber?: string;
  experience?: string;
  qualifications?: string;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth?: string;
  gender?: string;
  contactNumber?: string;
  address?: string;
  bloodType?: string;
  allergies?: string | string[];
  emergencyContact?: string;
  medicalHistory?: string;
  guardianId?: string;
  familyProfiles?: any[];
}

export interface PharmacistUser extends User {
  role: 'pharmacist';
  pharmacyName?: string;
  licenseNumber?: string;
  pharmacyAddress?: string;
  phone?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  password: string;
  role: 'doctor' | 'patient';
}

export interface AuthContextType {
  authState: AuthState;
  isAuthenticated: boolean;
  user: User | null;
  dobVerified: boolean;
  needsDobVerification: boolean;
  markDobVerified: () => void;
  login: (credentialsOrEmail: LoginCredentials | string, password?: string) => Promise<any>;
  loginMobile: (mobileNumber: string, dateOfBirth: string, password: string) => Promise<any>;
  loginEmailOtp: (email: string, otp: string) => Promise<any>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (credential: string, role?: string) => Promise<{ isNewUser: boolean; requiresRoleSelection?: boolean; googleUserInfo?: any; user?: User; token?: string } | void>;
  googleCompleteRegistration: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}
