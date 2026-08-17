import api from './api';
import { FamilyProfile, CreateFamilyProfileData, UpdateFamilyProfileData } from '../types/familyProfile';
import { getCachedData, setCachedData, clearApiCache } from './apiCache';

/**
 * Get all family profiles for the logged-in patient
 */
export const getFamilyProfiles = async (forceRefresh = false): Promise<FamilyProfile[]> => {
  if (!forceRefresh) {
    const cached = getCachedData<{ profiles: FamilyProfile[] }>('family_profiles');
    if (cached) return cached.profiles;
  }
  const response = await api.get<{ profiles: FamilyProfile[]; maxProfiles: number }>('/family-profiles');
  setCachedData('family_profiles', response.data);
  return response.data.profiles;
};

/**
 * Get a specific family profile by ID
 */
export const getFamilyProfileById = async (profileId: string): Promise<FamilyProfile> => {
  const response = await api.get<FamilyProfile>(`/family-profiles/${profileId}`);
  return response.data;
};

/**
 * Create a new family member profile
 */
export const createFamilyProfile = async (data: CreateFamilyProfileData): Promise<FamilyProfile> => {
  clearApiCache();
  const response = await api.post<{ profile: FamilyProfile }>('/family-profiles', data);
  return response.data.profile;
};

/**
 * Update a family profile
 */
export const updateFamilyProfile = async (profileId: string, data: UpdateFamilyProfileData): Promise<FamilyProfile> => {
  clearApiCache();
  const response = await api.put<{ profile: FamilyProfile }>(`/family-profiles/${profileId}`, data);
  return response.data.profile;
};

/**
 * Soft-delete a family profile
 */
export const deleteFamilyProfile = async (profileId: string): Promise<void> => {
  clearApiCache();
  await api.delete(`/family-profiles/${profileId}`);
};

/**
 * Doctor: Get all family profiles for a specific patient account
 */
export const getProfilesByAccountId = async (accountId: string): Promise<FamilyProfile[]> => {
  const response = await api.get<{ profiles: FamilyProfile[] }>(`/family-profiles/account/${accountId}`);
  return response.data.profiles;
};

/**
 * Doctor/Admin: Create a new family profile under a specific patient account
 */
export const createFamilyProfileForAccount = async (accountId: string, data: CreateFamilyProfileData): Promise<FamilyProfile> => {
  clearApiCache();
  const response = await api.post<{ profile: FamilyProfile }>(`/family-profiles/account/${accountId}`, data);
  return response.data.profile;
};

/**
 * Ensure self-profile exists for the logged-in patient
 */
export const ensureSelfProfile = async (): Promise<FamilyProfile> => {
  clearApiCache();
  const response = await api.post<{ profile: FamilyProfile }>('/family-profiles/ensure-self');
  return response.data.profile;
};
