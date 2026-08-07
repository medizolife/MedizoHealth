export interface FamilyProfile {
  id: string;
  accountId: string;
  profileIndex: number;
  relationship: 'self' | 'spouse' | 'parent' | 'child' | 'sibling' | 'other';
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  bloodType?: string;
  allergies?: {
    environmental?: string[];
    food?: string[];
    drugs?: string[];
    other?: string[];
  };
  diseaseHistory?: string[];
  chronicConditions?: string[];
  medicalHistory?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  patientDisplayId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateFamilyProfileData {
  relationship: 'spouse' | 'parent' | 'child' | 'sibling' | 'other';
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  bloodType?: string;
  allergies?: {
    environmental?: string[];
    food?: string[];
    drugs?: string[];
    other?: string[];
  };
  diseaseHistory?: string[];
  chronicConditions?: string[];
  medicalHistory?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
}

export interface UpdateFamilyProfileData extends Partial<CreateFamilyProfileData> {}

export const RELATIONSHIP_LABELS: Record<string, string> = {
  self: 'Self',
  spouse: 'Spouse',
  parent: 'Parent',
  child: 'Child',
  sibling: 'Sibling',
  other: 'Other'
};

export const RELATIONSHIP_ICONS: Record<string, string> = {
  self: '🧑',
  spouse: '👫',
  parent: '👴',
  child: '👶',
  sibling: '🧑‍🤝‍🧑',
  other: '👤'
};
