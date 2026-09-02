/**
 * Data Prefetch Service
 * ---------------------
 * Pre-loads API data for all main tabs immediately after login,
 * so tab switches are instant with zero loading spinners.
 *
 * Uses the existing apiCache to store results.
 */
import { setCachedData } from './apiCache';
import { getPrescriptions } from './prescriptions';
import { healthcareApi } from './healthcareExtensionsApi';
import api from './api';

let prefetchInProgress = false;

/**
 * Prefetch all critical data for the logged-in user's role.
 * Called once after login — results are cached for instant tab switches.
 */
export async function prefetchAllData(userRole: string): Promise<void> {
  if (prefetchInProgress) return;
  prefetchInProgress = true;

  try {
    // ----- Common for all authenticated users -----
    const prescriptionsPromise = getPrescriptions(true)
      .then(data => {
        if (Array.isArray(data)) {
          setCachedData('prescriptions_list', data);
        }
      })
      .catch(() => {});

    if (userRole === 'doctor') {
      // Prefetch billing, network, rate card, day-close in parallel
      await Promise.allSettled([
        prescriptionsPromise,
        healthcareApi.getDoctorBills()
          .then(res => { if (res?.success) setCachedData('doctor_bills', res.bills || []); })
          .catch(() => {}),
        healthcareApi.getDailyCollectionReport()
          .then(res => { if (res?.success) setCachedData('day_close_summary', res.summary); })
          .catch(() => {}),
        healthcareApi.getDoctorRateCard()
          .then(res => { if (res?.success && res.rateCard) setCachedData('doctor_rate_card', res.rateCard); })
          .catch(() => {}),
        healthcareApi.getClinicServices()
          .then(res => { if (res?.success) setCachedData('clinic_services', res.services || []); })
          .catch(() => {}),
        healthcareApi.getDoctorNetwork()
          .then(res => { if (res?.success) setCachedData('doctor_network', res.network || []); })
          .catch(() => {}),
        api.get('/users/patients/my-patients')
          .then(res => { if (res?.data?.patients) setCachedData('doctor_patients', res.data.patients); })
          .catch(() => {}),
      ]);
    } else if (userRole === 'patient') {
      await Promise.allSettled([
        prescriptionsPromise,
        healthcareApi.getMyBills()
          .then(res => { if (res?.success) setCachedData('patient_bills', res.bills || []); })
          .catch(() => {}),
      ]);
    } else if (userRole === 'nurse') {
      await Promise.allSettled([
        prescriptionsPromise,
        healthcareApi.getNurseAssignedPatients()
          .then(res => { if (res?.success) setCachedData('nurse_assignments', res.assignments || []); })
          .catch(() => {}),
        healthcareApi.getNurseSchedule()
          .then(res => { if (res?.success) setCachedData('nurse_schedules', res.schedules || []); })
          .catch(() => {}),
      ]);
    } else if (userRole === 'pharmacist') {
      await Promise.allSettled([
        prescriptionsPromise,
        api.get('/inventory')
          .then(res => { if (res?.data) setCachedData('pharmacy_inventory', res.data.inventory || res.data); })
          .catch(() => {}),
      ]);
    } else {
      await prescriptionsPromise;
    }
  } finally {
    prefetchInProgress = false;
  }
}
