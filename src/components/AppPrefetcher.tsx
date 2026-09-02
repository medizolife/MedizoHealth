import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { healthcareApi } from '../services/healthcareExtensionsApi';
import { prescriptionsAPI, usersAPI } from '../services/api';

/**
 * AppPrefetcher: Pre-warms client caches in idle background threads
 * upon login so navigating to any route/tab renders instantly with zero loading spinners.
 */
export const AppPrefetcher: React.FC = () => {
  const { user, authState } = useAuth();
  const currentUser = user || authState?.user;
  const isAuth = Boolean(currentUser && (authState?.isAuthenticated || Boolean(localStorage.getItem('token'))));

  useEffect(() => {
    if (!isAuth || !currentUser) return;

    // Use requestIdleCallback or setTimeout to defer background prefetching
    const prewarmTimer = setTimeout(() => {
      const role = currentUser.role;

      if (role === 'doctor') {
        // Pre-warm Doctor Portal & Sub-Routes
        Promise.allSettled([
          healthcareApi.getDoctorNetwork(),
          healthcareApi.getOutgoingReferrals(),
          healthcareApi.getIncomingReferrals(),
          healthcareApi.getDoctorBills(),
          healthcareApi.getDoctorRateCard(),
          healthcareApi.getClinicServices(),
          prescriptionsAPI.getMyPrescriptions(),
          usersAPI.getMyPatients()
        ]).catch(() => {});
      } else if (role === 'patient') {
        // Pre-warm Patient Dashboard & Records
        Promise.allSettled([
          prescriptionsAPI.getMyPrescriptions(),
          healthcareApi.getMyBills(),
          healthcareApi.getFamilyProfiles()
        ]).catch(() => {});
      } else if (role === 'nurse') {
        // Pre-warm Nurse Home Care & Assignments
        Promise.allSettled([
          healthcareApi.getHomeCareRequests()
        ]).catch(() => {});
      } else if (role === 'pharmacist') {
        // Pre-warm Pharmacist Prescriptions
        Promise.allSettled([
          prescriptionsAPI.getMyPrescriptions()
        ]).catch(() => {});
      }
    }, 100);

    return () => clearTimeout(prewarmTimer);
  }, [isAuth, currentUser?.id, currentUser?.role]);

  return null;
};

export default AppPrefetcher;
