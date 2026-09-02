'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tooltip
} from '@mui/material';
import { 
  PhotoCamera as PhotoCameraIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  ContactPhone as ContactPhoneIcon,
  Language as LanguageIcon,
  Create as CreateIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  DeleteForever as DeleteForeverIcon,
  MyLocation as MyLocationIcon,
  LocationOn as LocationOnIcon,
  GpsFixed as GpsFixedIcon,
  OpenInNew as OpenInNewIcon,
  Clear as ClearIcon,
  Verified as VerifiedIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { updateDoctorProfile, uploadProfileImage, uploadClinicLogo, uploadSignature, uploadStamp } from '../services/doctors';
import { updatePatientProfile } from '../services/patients';
import { Doctor, Patient } from '../types/auth';
import { usersAPI, digilockerAPI, getApiBaseUrl } from '../services/api';
import WallpaperCarouselHero from '../components/WallpaperCarouselHero';
import { FamilyProfile, CreateFamilyProfileData, RELATIONSHIP_LABELS, RELATIONSHIP_ICONS } from '../types/familyProfile';
import { getFamilyProfiles, createFamilyProfile, updateFamilyProfile, deleteFamilyProfile } from '../services/familyProfiles';
import DigiLockerWarmupModal from '../components/DigiLockerWarmupModal';

const Profile = () => {
  const { authState, logout } = useAuth();
  const { user } = authState;
  const navigate = useNavigate();

  // DigiLocker status state
  const [digilockerStatus, setDigilockerStatus] = useState<{ verified: boolean; profile: any } | null>(null);
  const [digilockerLoading, setDigilockerLoading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Location states
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Family profiles state
  const [familyProfiles, setFamilyProfiles] = useState<FamilyProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [familyDialogOpen, setFamilyDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FamilyProfile | null>(null);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [familyFormData, setFamilyFormData] = useState<CreateFamilyProfileData>({
    relationship: 'spouse',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    address: '',
    bloodType: '',
  });
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [familySuccess, setFamilySuccess] = useState<string | null>(null);
  const [savingFamily, setSavingFamily] = useState(false);
  const [deleteProfileDialogOpen, setDeleteProfileDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<FamilyProfile | null>(null);
  
  const profileImageRef = useRef<HTMLInputElement>(null);
  const clinicLogoRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);
  
  const [doctorFormData, setDoctorFormData] = useState<Partial<Doctor>>({
    firstName: '',
    lastName: '',
    specialization: '',
    contactNumber: '',
    profileImage: '',
    clinicLogo: '',
    signature: '',
    stamp: '',
    clinicName: '',
    clinicAddress: '',
    clinicLatitude: undefined,
    clinicLongitude: undefined,
    clinicLocationAccuracy: undefined,
    clinicPlaceName: '',
    alternateEmail: '',
    secondaryPhone: '',
    fax: '',
    whatsapp: '',
    website: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    licenseNumber: '',
    experience: '',
    qualifications: ''
  });
  
  const [patientFormData, setPatientFormData] = useState<Partial<Patient>>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    contactNumber: '',
    address: ''
  });
  
  // Set initial form data based on user role
  useEffect(() => {
    if (!user) return;
    
    if (user.role === 'doctor') {
      const doctorUser = user as Doctor;
      setDoctorFormData(prev => ({
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
        specialization: prev.specialization || doctorUser.specialization || '',
        contactNumber: prev.contactNumber || doctorUser.contactNumber || '',
        profileImage: prev.profileImage || doctorUser.profileImage || '',
        clinicLogo: prev.clinicLogo || doctorUser.clinicLogo || '',
        signature: prev.signature || doctorUser.signature || '',
        stamp: prev.stamp || doctorUser.stamp || '',
        clinicName: prev.clinicName || doctorUser.clinicName || '',
        clinicAddress: prev.clinicAddress || doctorUser.clinicAddress || '',
        clinicLatitude: prev.clinicLatitude !== undefined ? prev.clinicLatitude : (doctorUser.clinicLatitude !== undefined ? Number(doctorUser.clinicLatitude) : undefined),
        clinicLongitude: prev.clinicLongitude !== undefined ? prev.clinicLongitude : (doctorUser.clinicLongitude !== undefined ? Number(doctorUser.clinicLongitude) : undefined),
        clinicLocationAccuracy: prev.clinicLocationAccuracy !== undefined ? prev.clinicLocationAccuracy : (doctorUser.clinicLocationAccuracy !== undefined ? Number(doctorUser.clinicLocationAccuracy) : undefined),
        clinicPlaceName: prev.clinicPlaceName || doctorUser.clinicPlaceName || '',
        alternateEmail: prev.alternateEmail || doctorUser.alternateEmail || '',
        secondaryPhone: prev.secondaryPhone || doctorUser.secondaryPhone || '',
        fax: prev.fax || doctorUser.fax || '',
        whatsapp: prev.whatsapp || doctorUser.whatsapp || '',
        website: prev.website || doctorUser.website || '',
        linkedin: prev.linkedin || doctorUser.linkedin || '',
        twitter: prev.twitter || doctorUser.twitter || '',
        facebook: prev.facebook || doctorUser.facebook || '',
        instagram: prev.instagram || doctorUser.instagram || '',
        licenseNumber: prev.licenseNumber || doctorUser.licenseNumber || '',
        experience: prev.experience || doctorUser.experience || '',
        qualifications: prev.qualifications || doctorUser.qualifications || ''
      }));
    } else if (user.role === 'patient') {
      setPatientFormData(prev => ({
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
        dateOfBirth: prev.dateOfBirth || (user as Patient).dateOfBirth || '',
        contactNumber: prev.contactNumber || (user as Patient).contactNumber || '',
        address: prev.address || (user as Patient).address || ''
      }));
    }
  }, [user]);

  // Fetch family profiles for patients
  const fetchFamilyProfiles = async () => {
    if (user?.role !== 'patient') return;
    try {
      setLoadingProfiles(true);
      const profiles = await getFamilyProfiles(true);
      setFamilyProfiles(profiles);
    } catch (err) {
      console.error('Error fetching family profiles:', err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  // Guardian profile state (if current patient has a guardianId)
  const [guardianProfile, setGuardianProfile] = useState<any>(null);
  const [loadingGuardian, setLoadingGuardian] = useState(false);

  const fetchGuardianProfile = async () => {
    const patientUser = user as Patient;
    if (patientUser?.role === 'patient' && patientUser?.guardianId) {
      try {
        setLoadingGuardian(true);
        const res = await usersAPI.lookupPatientById(patientUser.guardianId);
        if (res && res.id) {
          setGuardianProfile(res);
        }
      } catch (err) {
        console.error('Error fetching guardian profile:', err);
      } finally {
        setLoadingGuardian(false);
      }
    }
  };

  useEffect(() => {
    if (user?.role === 'patient') {
      fetchFamilyProfiles();
      fetchGuardianProfile();
    }
  }, [user]);

  // Family profile handlers
  const handleOpenAddFamily = () => {
    setEditingProfile(null);
    setFamilyFormData({
      relationship: 'spouse',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      address: '',
      bloodType: '',
    });
    setFamilyError(null);
    setFamilyDialogOpen(true);
  };

  const handleOpenEditFamily = (profile: FamilyProfile) => {
    setEditingProfile(profile);
    setFamilyFormData({
      relationship: profile.relationship as any,
      firstName: profile.firstName,
      lastName: profile.lastName,
      dateOfBirth: profile.dateOfBirth || '',
      gender: profile.gender || '',
      phone: profile.phone || '',
      address: profile.address || '',
      bloodType: profile.bloodType || '',
    });
    setFamilyError(null);
    setFamilyDialogOpen(true);
  };

  const handleFamilyFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFamilyFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveFamily = async () => {
    if (!familyFormData.firstName?.trim() || !familyFormData.lastName?.trim()) {
      setFamilyError('First name and last name are required');
      return;
    }
    try {
      setSavingFamily(true);
      setFamilyError(null);
      if (editingProfile) {
        await updateFamilyProfile(editingProfile.id, familyFormData);
        setFamilySuccess('Profile updated successfully!');
      } else {
        await createFamilyProfile(familyFormData);
        setFamilySuccess('Family member added successfully!');
      }
      setFamilyDialogOpen(false);
      await fetchFamilyProfiles();
      setTimeout(() => setFamilySuccess(null), 3000);
    } catch (err: any) {
      setFamilyError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSavingFamily(false);
    }
  };

  const handleConfirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    try {
      setDeletingProfileId(profileToDelete.id);
      await deleteFamilyProfile(profileToDelete.id);
      setFamilySuccess('Family member removed successfully');
      setDeleteProfileDialogOpen(false);
      setProfileToDelete(null);
      await fetchFamilyProfiles();
      setTimeout(() => setFamilySuccess(null), 3000);
    } catch (err: any) {
      setFamilyError(err.response?.data?.message || 'Failed to remove profile');
    } finally {
      setDeletingProfileId(null);
    }
  };

  // Fetch DigiLocker status for doctors
  useEffect(() => {
    if (user?.role === 'doctor') {
      digilockerAPI.getStatus()
        .then(data => {
          setDigilockerStatus({
            verified: data.verified || false,
            profile: data.profile || null
          });
        })
        .catch(err => {
          console.error('Failed to fetch DigiLocker status:', err);
          setDigilockerStatus({ verified: false, profile: null });
        });
    }
  }, [user]);

  // Apply location fix coordinates and accuracy
  const applyPosition = async (pos: GeolocationPosition) => {
    const lat = Number(pos.coords.latitude.toFixed(6));
    const lng = Number(pos.coords.longitude.toFixed(6));
    const acc = Number(pos.coords.accuracy.toFixed(1));

    setDoctorFormData(prev => ({
      ...prev,
      clinicLatitude: lat,
      clinicLongitude: lng,
      clinicLocationAccuracy: acc
    }));
    setLocating(false);

    if (acc <= 50) {
      setLocationNotice(`Exact location locked with ${acc}m accuracy (target within 50m met!).`);
    } else {
      setLocationNotice(`Location recorded with ${acc}m accuracy. For <50m accuracy, enable High Accuracy GPS or move near a window.`);
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setDoctorFormData(prev => ({
            ...prev,
            clinicPlaceName: data.display_name,
            clinicAddress: prev.clinicAddress || data.display_name
          }));
        }
      }
    } catch (e) {
      // Ignore reverse geocode network error
    }
  };

  // High Accuracy GPS location detector targeting <= 50m precision
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser or device.');
      return;
    }

    setLocating(true);
    setLocationError(null);
    setLocationNotice('Acquiring high-precision GPS satellite fix... Please hold still.');

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    };

    let bestPosition: GeolocationPosition | null = null;
    let attempts = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        attempts++;
        const acc = pos.coords.accuracy;
        if (!bestPosition || acc < bestPosition.coords.accuracy) {
          bestPosition = pos;
        }

        if (acc <= 50 || attempts >= 6) {
          navigator.geolocation.clearWatch(watchId);
          applyPosition(bestPosition || pos);
        }
      },
      (err) => {
        navigator.geolocation.clearWatch(watchId);
        navigator.geolocation.getCurrentPosition(
          (pos) => applyPosition(pos),
          (fallbackErr) => {
            setLocating(false);
            let msg = 'Failed to detect location.';
            if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
              msg = 'Location access denied. Please allow location permissions in your browser/device.';
            } else if (fallbackErr.code === fallbackErr.POSITION_UNAVAILABLE) {
              msg = 'Position unavailable. Check your device GPS settings.';
            } else if (fallbackErr.code === fallbackErr.TIMEOUT) {
              msg = 'Location detection timed out. Please try again.';
            }
            setLocationError(msg);
          },
          options
        );
      },
      options
    );

    setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      if (bestPosition) {
        applyPosition(bestPosition);
      } else {
        setLocating(false);
      }
    }, 12000);
  };

  const handleClearLocation = () => {
    setDoctorFormData(prev => ({
      ...prev,
      clinicLatitude: undefined,
      clinicLongitude: undefined,
      clinicLocationAccuracy: undefined,
      clinicPlaceName: ''
    }));
    setLocationNotice(null);
    setLocationError(null);
  };
  
  // Handle doctor form input changes
  const handleDoctorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDoctorFormData({
      ...doctorFormData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle patient form input changes
  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientFormData({
      ...patientFormData,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle profile image upload
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingProfile(true);
      setError(null);
      const result = await uploadProfileImage(file);
      setDoctorFormData(prev => ({ ...prev, profileImage: result.url }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error uploading profile image:', err);
      setError('Failed to upload profile image');
    } finally {
      setUploadingProfile(false);
    }
  };
  
  // Handle clinic logo upload
  const handleClinicLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingLogo(true);
      setError(null);
      const result = await uploadClinicLogo(file);
      setDoctorFormData(prev => ({ ...prev, clinicLogo: result.url }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error uploading clinic logo:', err);
      setError('Failed to upload clinic logo');
    } finally {
      setUploadingLogo(false);
    }
  };
  
  // Handle signature upload
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingSignature(true);
      setError(null);
      const result = await uploadSignature(file);
      setDoctorFormData(prev => ({ ...prev, signature: result.url }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error uploading signature:', err);
      setError('Failed to upload signature');
    } finally {
      setUploadingSignature(false);
    }
  };
  
  // Handle doctor stamp upload
  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingStamp(true);
      setError(null);
      const result = await uploadStamp(file);
      const newStampUrl = result.url;
      setDoctorFormData(prev => ({ ...prev, stamp: newStampUrl }));
      const storedUserStr = localStorage.getItem('user');
      if (storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          storedUser.stamp = newStampUrl;
          localStorage.setItem('user', JSON.stringify(storedUser));
        } catch (e) {}
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error uploading doctor stamp:', err);
      setError('Failed to upload doctor stamp');
    } finally {
      setUploadingStamp(false);
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    try {
      setDeletingAccount(true);
      setDeleteError(null);
      await usersAPI.deleteAccount();
      logout();
      navigate('/login');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setDeleteError(
        err.response?.data?.message || 'Failed to delete account. Please try again or contact support.'
      );
    } finally {
      setDeletingAccount(false);
    }
  };
  
  // Handle remove image
  const handleRemoveImage = async (field: 'profileImage' | 'clinicLogo' | 'signature' | 'stamp') => {
    try {
      setError(null);
      setDoctorFormData(prev => ({ ...prev, [field]: '' }));
      // Only send the field being cleared — don't send entire form with potentially large image data
      await updateDoctorProfile({ [field]: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(`Error removing ${field}:`, err);
      setError(`Failed to remove image`);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      if (user?.role === 'doctor') {
        // Strip large image data from the payload to avoid Vercel's 4.5MB body limit.
        // Images are already saved via their dedicated upload endpoints (upload-profile-image,
        // upload-clinic-logo, upload-signature, upload-stamp), so we only send URL paths here
        // and exclude any base64 data:image strings.
        const { profileImage, clinicLogo, signature, stamp, ...textFields } = doctorFormData;
        
        // Only include image fields if they are URL paths (not base64 data)
        const imageFields: Partial<Doctor> = {};
        if (profileImage && !profileImage.startsWith('data:')) imageFields.profileImage = profileImage;
        if (clinicLogo && !clinicLogo.startsWith('data:')) imageFields.clinicLogo = clinicLogo;
        if (signature && !signature.startsWith('data:')) imageFields.signature = signature;
        if (stamp && !stamp.startsWith('data:')) imageFields.stamp = stamp;
        
        await updateDoctorProfile({ ...textFields, ...imageFields });
      } else if (user?.role === 'patient') {
        await updatePatientProfile(patientFormData);
      } else {
        await usersAPI.updateProfile(patientFormData);
      }
      
      setSuccess(true);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Get full image URL
  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:image/')) return path;
    const apiUrl = getApiBaseUrl().replace(/\/api\/?$/, '');
    return `${apiUrl}${path}`;
  };

  // Calculate doctor profile completeness percentage
  const calculateProfileCompleteness = () => {
    if (user?.role !== 'doctor') return null;
    const items = [
      { label: 'Basic Info & Specialization', complete: Boolean(doctorFormData.firstName && doctorFormData.lastName && doctorFormData.specialization) },
      { label: 'Medical License Number', complete: Boolean(doctorFormData.licenseNumber) },
      { label: 'Doctor Avatar Photo', complete: Boolean(doctorFormData.profileImage) },
      { label: 'Digital Rx Signature', complete: Boolean(doctorFormData.signature) },
      { label: 'Clinic Name & Address', complete: Boolean(doctorFormData.clinicName && doctorFormData.clinicAddress) },
      { label: 'Exact Clinic GPS Pin', complete: Boolean(doctorFormData.clinicLatitude !== undefined && doctorFormData.clinicLongitude !== undefined) },
      { label: 'DigiLocker Identity Verification', complete: Boolean(digilockerStatus?.verified) }
    ];
    const completedCount = items.filter(i => i.complete).length;
    const percent = Math.round((completedCount / items.length) * 100);
    const missingItems = items.filter(i => !i.complete);
    return { percent, completedCount, totalCount: items.length, missingItems };
  };
  
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="error">User not found</Typography>
      </Container>
    );
  }
  
  const { palette, mode, setPalette, toggleMode } = useThemeContext();

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 2, sm: 3 }, pb: 6, px: { xs: 2, sm: 3, md: 4 } }} className="animate-slide-up">
      
      {/* ─── Dynamic Wallpaper Carousel Hero Header ─── */}
      <WallpaperCarouselHero showSearch={false} />
      
      {/* ─── Theme & Appearance Settings Card ─── */}
      <Paper 
        className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: '24px !important'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          🎨 Theme & Appearance Settings
        </Typography>
        <Typography variant="body2" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', fontWeight: 600, mb: 2 }}>
          Choose your favorite light theme color or switch to high-contrast dark mode.
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              Color Palettes
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <IconButton
                onClick={() => setPalette('seafoam')}
                title="Seafoam"
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: '#2A6B5D',
                  border: palette === 'seafoam' ? '3px solid var(--color-mint)' : '2px solid transparent',
                  boxShadow: palette === 'seafoam' ? '0 0 10px rgba(42, 107, 93, 0.7)' : 'none',
                  '&:hover': { bgcolor: '#23584d', transform: 'scale(1.08)' },
                  transition: 'all 0.2s ease'
                }}
              >
                {palette === 'seafoam' ? <CheckCircleIcon sx={{ fontSize: 22, color: '#ffffff' }} /> : <span style={{ fontSize: 16 }}>🌿</span>}
              </IconButton>

              <IconButton
                onClick={() => setPalette('beige')}
                title="Beige"
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: '#735740',
                  border: palette === 'beige' ? '3px solid #D4B89B' : '2px solid transparent',
                  boxShadow: palette === 'beige' ? '0 0 10px rgba(115, 87, 64, 0.7)' : 'none',
                  '&:hover': { bgcolor: '#5f4734', transform: 'scale(1.08)' },
                  transition: 'all 0.2s ease'
                }}
              >
                {palette === 'beige' ? <CheckCircleIcon sx={{ fontSize: 22, color: '#ffffff' }} /> : <span style={{ fontSize: 16 }}>🌾</span>}
              </IconButton>

              <IconButton
                onClick={() => setPalette('pink')}
                title="Pink"
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: '#8A3859',
                  border: palette === 'pink' ? '3px solid #F4C2D7' : '2px solid transparent',
                  boxShadow: palette === 'pink' ? '0 0 10px rgba(138, 56, 89, 0.7)' : 'none',
                  '&:hover': { bgcolor: '#732e49', transform: 'scale(1.08)' },
                  transition: 'all 0.2s ease'
                }}
              >
                {palette === 'pink' ? <CheckCircleIcon sx={{ fontSize: 22, color: '#ffffff' }} /> : <span style={{ fontSize: 16 }}>🌸</span>}
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
              Display Mode
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              onClick={toggleMode}
              sx={{
                height: 42,
                borderRadius: '14px',
                fontWeight: 800,
                borderColor: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)',
                color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)',
                bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'transparent'
              }}
            >
              {mode === 'dark' ? '🌙 Dark Mode (Active)' : '☀️ Light Mode (Active)'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ─── Doctor Profile Completeness Progress Banner ─── */}
      {user.role === 'doctor' && (() => {
        const completeness = calculateProfileCompleteness();
        if (!completeness) return null;
        return (
          <Paper
            className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'}
            sx={{
              mb: 3,
              p: 2.5,
              borderRadius: '24px !important',
              border: '1px solid var(--glass-border)',
              bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
                  📋 Profile Completeness Status
                </Typography>
                <Chip
                  label={`${completeness.percent}% Complete`}
                  color={completeness.percent === 100 ? 'success' : completeness.percent >= 70 ? 'info' : 'warning'}
                  size="small"
                  sx={{ fontWeight: 900, fontSize: '0.75rem' }}
                />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)' }}>
                {completeness.completedCount} of {completeness.totalCount} essential requirements met
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={completeness.percent}
              sx={{
                height: 10,
                borderRadius: 5,
                mb: 2,
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  bgcolor: completeness.percent === 100 ? '#2e7d32' : completeness.percent >= 70 ? '#1976d2' : '#e65100'
                }
              }}
            />

            {completeness.missingItems.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FFB74D' : '#e65100' }}>
                  Action Required to Complete Profile:
                </Typography>
                {completeness.missingItems.map((item, idx) => (
                  <Chip
                    key={idx}
                    label={`+ ${item.label}`}
                    size="small"
                    variant="outlined"
                    color="warning"
                    sx={{ fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        );
      })()}

      {/* ─── DigiLocker Verified Identity Card (For Doctors) ─── */}
      {user.role === 'doctor' && (
        <Paper
          className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'}
          sx={{
            mb: 3,
            p: 3,
            borderRadius: '24px !important',
            border: digilockerStatus?.verified 
              ? '1.5px solid rgba(76, 175, 80, 0.4)' 
              : '1.5px solid rgba(255, 152, 0, 0.4)',
            background: mode === 'dark'
              ? (digilockerStatus?.verified
                  ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(27, 94, 32, 0.08) 100%) !important'
                  : 'linear-gradient(135deg, rgba(230, 81, 0, 0.15) 0%, rgba(191, 54, 12, 0.08) 100%) !important')
              : (digilockerStatus?.verified
                  ? 'linear-gradient(135deg, rgba(232, 245, 233, 0.95) 0%, rgba(200, 230, 201, 0.8) 100%) !important'
                  : 'linear-gradient(135deg, rgba(255, 243, 224, 0.95) 0%, rgba(255, 224, 178, 0.8) 100%) !important')
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box 
                sx={{ 
                  p: 1.2, 
                  borderRadius: '14px', 
                  bgcolor: digilockerStatus?.verified ? 'rgba(76, 175, 80, 0.2)' : 'rgba(230, 81, 0, 0.2)',
                  color: digilockerStatus?.verified ? '#2e7d32' : '#e65100'
                }}
              >
                <VerifiedIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : '#1A312C', lineHeight: 1.2 }}>
                  DigiLocker Identity Verification
                </Typography>
                <Typography variant="caption" sx={{ color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', fontWeight: 600 }}>
                  Government-backed digital identity & license verification for doctors
                </Typography>
              </Box>
            </Box>

            <Chip
              label={digilockerStatus?.verified ? 'VERIFIED ✓' : 'UNVERIFIED'}
              color={digilockerStatus?.verified ? 'success' : 'warning'}
              sx={{ fontWeight: 900, fontSize: '0.78rem', px: 1, height: 30 }}
            />
          </Box>

          {digilockerStatus?.verified ? (
            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block' }}>Verified Doctor Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{digilockerStatus.profile?.name || `${user.firstName} ${user.lastName}`}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block' }}>Masked Aadhaar / Identity ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{digilockerStatus.profile?.maskedAadhaar || digilockerStatus.profile?.digilockerid || 'Verified via DigiLocker PKCE'}</Typography>
                </Grid>
                {digilockerStatus.profile?.linkedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block' }}>Verification Date</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{new Date(digilockerStatus.profile.linkedAt).toLocaleDateString()}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mt: 1 }}>
              <Typography variant="body2" sx={{ color: mode === 'dark' ? 'rgba(255,183,77,0.9)' : '#bf360c', fontWeight: 600, fontSize: '0.83rem' }}>
                ⚠️ You have not verified your identity with DigiLocker. Verify now to enable official digital Rx signing and patient safety compliance.
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setDigilockerLoading(true);
                }}
                disabled={digilockerLoading}
                startIcon={<VerifiedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  bgcolor: '#e65100',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 2.5,
                  py: 1,
                  boxShadow: '0 4px 14px rgba(230, 81, 0, 0.3)',
                  '&:hover': { bgcolor: '#bf360c' }
                }}
              >
                {digilockerLoading ? 'Redirecting...' : 'Verify with DigiLocker'}
              </Button>
            </Box>
          )}
        </Paper>
      )}

      <Paper elevation={0} className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'} sx={{ p: 3, borderRadius: '24px !important', mb: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
              Account Details
            </Typography>
            <Typography variant="body2" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', fontWeight: 600 }}>
              Member since: {new Date(user.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          {user.id && (
            <Chip
              label={`ID: #${user.id.toUpperCase()}`}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '0.75rem',
                bgcolor: mode === 'dark' ? 'rgba(102, 205, 170, 0.15)' : 'rgba(42, 107, 93, 0.1)',
                color: mode === 'dark' ? '#66CDAA' : '#1A312C',
                border: '1px solid var(--color-mint)',
                borderRadius: '10px'
              }}
            />
          )}
        </Box>
        
        <Divider sx={{ my: 3, borderColor: 'var(--glass-border)' }} />
        
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: '14px' }}>
            Profile updated successfully!
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '14px' }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="h6" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)', mb: 2 }}>
          Edit Profile
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {user.role === 'doctor' ? (
            <>
              {/* Modern Profile & Clinic Images Media Asset Section */}
              <Paper 
                className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'}
                sx={{ 
                  mb: 3.5, 
                  p: { xs: 2.5, sm: 3 }, 
                  borderRadius: '24px !important',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.08)', color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
                      <PhotoCameraIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)', lineHeight: 1.2 }}>
                        Profile & Clinic Branding
                      </Typography>
                      <Typography variant="caption" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', fontWeight: 700 }}>
                        High-resolution avatar, logo, digital signature, and official stamp for prescriptions
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Grid container spacing={{ xs: 1.2, sm: 2.5 }}>
                  {/* Profile Image */}
                  <Grid item xs={6} sm={3}>
                    <Box 
                      sx={{ 
                        p: { xs: 1.2, sm: 2.2 }, 
                        borderRadius: { xs: '16px', sm: '20px' }, 
                        bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', 
                        border: '1px dashed var(--glass-border)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        justify: 'space-between',
                        height: '100%',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', textTransform: 'uppercase', letterSpacing: 0.3, mb: 1, fontSize: { xs: '0.58rem', sm: '0.72rem' }, textAlign: 'center', lineHeight: 1.1 }}>
                        Doctor Avatar
                      </Typography>
                      <Avatar
                        src={getImageUrl(doctorFormData.profileImage || '')}
                        sx={{ 
                          width: { xs: 52, sm: 96 }, 
                          height: { xs: 52, sm: 96 }, 
                          mb: 1.2, 
                          p: '2px',
                          bgcolor: 'var(--color-forest)',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
                        }}
                      >
                        <Avatar sx={{ width: '100%', height: '100%', bgcolor: 'var(--color-forest)', color: '#ffffff' }}>
                          <PersonIcon sx={{ fontSize: { xs: 26, sm: 48 } }} />
                        </Avatar>
                      </Avatar>
                      <input
                        type="file"
                        accept="image/*"
                        ref={profileImageRef}
                        onChange={handleProfileImageUpload}
                        style={{ display: 'none' }}
                      />
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={uploadingProfile ? <CircularProgress size={12} color="inherit" /> : <PhotoCameraIcon sx={{ fontSize: { xs: 13, sm: 16 } }} />}
                          onClick={() => profileImageRef.current?.click()}
                          disabled={uploadingProfile}
                          sx={{
                            borderRadius: '14px',
                            fontWeight: 800,
                            fontSize: { xs: '0.62rem', sm: '0.75rem' },
                            px: { xs: 1, sm: 2 },
                            py: { xs: 0.3, sm: 0.7 },
                            bgcolor: 'var(--color-forest)',
                            color: '#ffffff',
                            minWidth: 'auto'
                          }}
                        >
                          {uploadingProfile ? '...' : 'Upload'}
                        </Button>
                        {doctorFormData.profileImage && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleRemoveImage('profileImage')}
                            sx={{ borderRadius: '12px', fontWeight: 800, fontSize: { xs: '0.58rem', sm: '0.7rem' }, px: 0.8, minWidth: 'auto' }}
                          >
                            ×
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Grid>

                  {/* Clinic Logo */}
                  <Grid item xs={6} sm={3}>
                    <Box 
                      sx={{ 
                        p: { xs: 1.2, sm: 2.2 }, 
                        borderRadius: { xs: '16px', sm: '20px' }, 
                        bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', 
                        border: '1px dashed var(--glass-border)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        justify: 'space-between',
                        height: '100%',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', textTransform: 'uppercase', letterSpacing: 0.3, mb: 1, fontSize: { xs: '0.58rem', sm: '0.72rem' }, textAlign: 'center', lineHeight: 1.1 }}>
                        Clinic Emblem
                      </Typography>
                      <Avatar
                        variant="rounded"
                        src={getImageUrl(doctorFormData.clinicLogo || '')}
                        sx={{ 
                          width: { xs: 52, sm: 96 }, 
                          height: { xs: 52, sm: 96 }, 
                          mb: 1.2, 
                          borderRadius: '16px',
                          p: '2px',
                          bgcolor: '#ffffff',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
                        }}
                      >
                        <Avatar variant="rounded" sx={{ width: '100%', height: '100%', borderRadius: '14px', bgcolor: '#ffffff', color: 'var(--color-forest)' }}>
                          <BusinessIcon sx={{ fontSize: { xs: 26, sm: 44 } }} />
                        </Avatar>
                      </Avatar>
                      <input
                        type="file"
                        accept="image/*"
                        ref={clinicLogoRef}
                        onChange={handleClinicLogoUpload}
                        style={{ display: 'none' }}
                      />
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={uploadingLogo ? <CircularProgress size={12} color="inherit" /> : <BusinessIcon sx={{ fontSize: { xs: 13, sm: 16 } }} />}
                          onClick={() => clinicLogoRef.current?.click()}
                          disabled={uploadingLogo}
                          sx={{
                            borderRadius: '14px',
                            fontWeight: 800,
                            fontSize: { xs: '0.62rem', sm: '0.75rem' },
                            px: { xs: 1, sm: 2 },
                            py: { xs: 0.3, sm: 0.7 },
                            bgcolor: 'var(--color-forest)',
                            color: '#ffffff',
                            minWidth: 'auto'
                          }}
                        >
                          {uploadingLogo ? '...' : 'Upload'}
                        </Button>
                        {doctorFormData.clinicLogo && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleRemoveImage('clinicLogo')}
                            sx={{ borderRadius: '12px', fontWeight: 800, fontSize: { xs: '0.58rem', sm: '0.7rem' }, px: 0.8, minWidth: 'auto' }}
                          >
                            ×
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Grid>

                  {/* Signature */}
                  <Grid item xs={6} sm={3}>
                    <Box 
                      sx={{ 
                        p: { xs: 1.2, sm: 2.2 }, 
                        borderRadius: { xs: '16px', sm: '20px' }, 
                        bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', 
                        border: '1px dashed var(--glass-border)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        justify: 'space-between',
                        height: '100%',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', textTransform: 'uppercase', letterSpacing: 0.3, mb: 1, fontSize: { xs: '0.58rem', sm: '0.72rem' }, textAlign: 'center', lineHeight: 1.1 }}>
                        Rx Signature
                      </Typography>
                      <Avatar
                        variant="rounded"
                        src={getImageUrl(doctorFormData.signature || '')}
                        sx={{ 
                          width: { xs: 72, sm: 120 }, 
                          height: { xs: 44, sm: 65 }, 
                          mb: 1.2, 
                          borderRadius: '14px',
                          p: '2px',
                          bgcolor: '#ffffff',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
                        }}
                      >
                        <Avatar variant="rounded" sx={{ width: '100%', height: '100%', borderRadius: '12px', bgcolor: '#ffffff', color: 'var(--color-forest)' }}>
                          <CreateIcon sx={{ fontSize: { xs: 22, sm: 30 } }} />
                        </Avatar>
                      </Avatar>
                      <input
                        type="file"
                        accept="image/*"
                        ref={signatureRef}
                        onChange={handleSignatureUpload}
                        style={{ display: 'none' }}
                      />
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={uploadingSignature ? <CircularProgress size={12} color="inherit" /> : <CreateIcon sx={{ fontSize: { xs: 13, sm: 16 } }} />}
                          onClick={() => signatureRef.current?.click()}
                          disabled={uploadingSignature}
                          sx={{
                            borderRadius: '14px',
                            fontWeight: 800,
                            fontSize: { xs: '0.62rem', sm: '0.75rem' },
                            px: { xs: 1, sm: 2 },
                            py: { xs: 0.3, sm: 0.7 },
                            bgcolor: 'var(--color-forest)',
                            color: '#ffffff',
                            minWidth: 'auto'
                          }}
                        >
                          {uploadingSignature ? '...' : 'Upload'}
                        </Button>
                        {doctorFormData.signature && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleRemoveImage('signature')}
                            sx={{ borderRadius: '12px', fontWeight: 800, fontSize: { xs: '0.58rem', sm: '0.7rem' }, px: 0.8, minWidth: 'auto' }}
                          >
                            ×
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Grid>

                  {/* Doctor Stamp */}
                  <Grid item xs={6} sm={3}>
                    <Box 
                      sx={{ 
                        p: { xs: 1.2, sm: 2.2 }, 
                        borderRadius: { xs: '16px', sm: '20px' }, 
                        bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', 
                        border: '1px dashed var(--glass-border)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        justify: 'space-between',
                        height: '100%',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-forest)', textTransform: 'uppercase', letterSpacing: 0.3, mb: 1, fontSize: { xs: '0.58rem', sm: '0.72rem' }, textAlign: 'center', lineHeight: 1.1 }}>
                        Doctor Stamp
                      </Typography>
                      <Avatar
                        variant="rounded"
                        src={getImageUrl(doctorFormData.stamp || '')}
                        sx={{ 
                          width: { xs: 72, sm: 120 }, 
                          height: { xs: 44, sm: 65 }, 
                          mb: 1.2, 
                          borderRadius: '14px',
                          p: '2px',
                          bgcolor: '#ffffff',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
                        }}
                      >
                        <Avatar variant="rounded" sx={{ width: '100%', height: '100%', borderRadius: '12px', bgcolor: '#ffffff', color: 'var(--color-forest)' }}>
                          <PhotoCameraIcon sx={{ fontSize: { xs: 22, sm: 30 } }} />
                        </Avatar>
                      </Avatar>
                      <input
                        type="file"
                        accept="image/*"
                        ref={stampRef}
                        onChange={handleStampUpload}
                        style={{ display: 'none' }}
                      />
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={uploadingStamp ? <CircularProgress size={12} color="inherit" /> : <PhotoCameraIcon sx={{ fontSize: { xs: 13, sm: 16 } }} />}
                          onClick={() => stampRef.current?.click()}
                          disabled={uploadingStamp}
                          sx={{
                            borderRadius: '14px',
                            fontWeight: 800,
                            fontSize: { xs: '0.62rem', sm: '0.75rem' },
                            px: { xs: 1, sm: 2 },
                            py: { xs: 0.3, sm: 0.7 },
                            bgcolor: 'var(--color-forest)',
                            color: '#ffffff',
                            minWidth: 'auto'
                          }}
                        >
                          {uploadingStamp ? '...' : 'Upload'}
                        </Button>
                        {doctorFormData.stamp && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleRemoveImage('stamp')}
                            sx={{ borderRadius: '12px', fontWeight: 800, fontSize: { xs: '0.58rem', sm: '0.7rem' }, px: 0.8, minWidth: 'auto' }}
                          >
                            ×
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Basic Information Accordion */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon /> Basic Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={doctorFormData.firstName}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={doctorFormData.lastName}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Specialization"
                        name="specialization"
                        value={doctorFormData.specialization}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="License Number"
                        name="licenseNumber"
                        value={doctorFormData.licenseNumber}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Experience"
                        name="experience"
                        placeholder="e.g., 10 years"
                        value={doctorFormData.experience}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Qualifications"
                        name="qualifications"
                        placeholder="e.g., MBBS, MD"
                        value={doctorFormData.qualifications}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Clinic Information Accordion */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon /> Clinic Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Clinic or Hospital Name"
                        name="clinicName"
                        placeholder="e.g., City Care Hospital / Apollo Health Clinic"
                        value={doctorFormData.clinicName}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Website"
                        name="website"
                        placeholder="https://www.yourclinic.com"
                        value={doctorFormData.website}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Clinic Address"
                        name="clinicAddress"
                        multiline
                        rows={2}
                        value={doctorFormData.clinicAddress}
                        onChange={handleDoctorChange}
                      />
                    </Grid>

                    {/* Exact Clinic Location & GPS Coordinates (50m Precision) */}
                    <Grid item xs={12}>
                      <Box 
                        sx={{ 
                          p: 2.5, 
                          borderRadius: 3, 
                          bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,128,128,0.04)', 
                          border: '1px solid',
                          borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,128,128,0.15)'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, color: mode === 'dark' ? '#FAF2F5' : '#0F4C3A' }}>
                            <GpsFixedIcon color="primary" /> Practice & Clinic Location (For 15km Nearby Discovery)
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {doctorFormData.clinicLatitude !== undefined && doctorFormData.clinicLongitude !== undefined ? (
                              <Chip 
                                icon={<CheckCircleIcon />}
                                label="Nearby Discovery Active (15km)"
                                color="success"
                                size="small"
                                sx={{ fontWeight: 700 }}
                              />
                            ) : (
                              <Chip 
                                icon={<WarningIcon />}
                                label="Location Not Set — Hidden from Nearby Search"
                                color="warning"
                                size="small"
                                sx={{ fontWeight: 700 }}
                              />
                            )}
                            {doctorFormData.clinicLocationAccuracy !== undefined && (
                              <Chip 
                                icon={doctorFormData.clinicLocationAccuracy <= 50 ? <CheckCircleIcon /> : <WarningIcon />}
                                label={doctorFormData.clinicLocationAccuracy <= 50 ? `${doctorFormData.clinicLocationAccuracy}m Accuracy (≤50m)` : `${doctorFormData.clinicLocationAccuracy}m Accuracy`}
                                color={doctorFormData.clinicLocationAccuracy <= 50 ? "success" : "default"}
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Discovery Explanatory Callout */}
                        {doctorFormData.clinicLatitude === undefined || doctorFormData.clinicLongitude === undefined ? (
                          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                            📍 <strong>Be Discovered by Nearby Colleagues:</strong> Add your practice GPS pin so other doctors, nurses, pharmacists, and diagnostic labs within a <strong>15 km radius</strong> can find and refer patients to you. Click <strong>"Detect Exact GPS Location"</strong> below.
                          </Alert>
                        ) : (
                          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                            ✨ <strong>Nearby Discovery Enabled:</strong> Your practice is currently discoverable by colleagues within 15 km of ({doctorFormData.clinicLatitude}, {doctorFormData.clinicLongitude}).
                          </Alert>
                        )}

                        {locationNotice && (
                          <Alert severity={doctorFormData.clinicLocationAccuracy && doctorFormData.clinicLocationAccuracy <= 50 ? "success" : "info"} sx={{ mb: 2 }}>
                            {locationNotice}
                          </Alert>
                        )}

                        {locationError && (
                          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocationError(null)}>
                            {locationError}
                          </Alert>
                        )}

                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={5}>
                            <TextField
                              fullWidth
                              label="Latitude (°N/S)"
                              name="clinicLatitude"
                              type="number"
                              inputProps={{ step: "any" }}
                              value={doctorFormData.clinicLatitude !== undefined && doctorFormData.clinicLatitude !== null ? doctorFormData.clinicLatitude : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                setDoctorFormData(prev => ({ ...prev, clinicLatitude: val }));
                              }}
                              placeholder="e.g. 28.613939"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={5}>
                            <TextField
                              fullWidth
                              label="Longitude (°E/W)"
                              name="clinicLongitude"
                              type="number"
                              inputProps={{ step: "any" }}
                              value={doctorFormData.clinicLongitude !== undefined && doctorFormData.clinicLongitude !== null ? doctorFormData.clinicLongitude : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                setDoctorFormData(prev => ({ ...prev, clinicLongitude: val }));
                              }}
                              placeholder="e.g. 77.209021"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <TextField
                              fullWidth
                              label="Accuracy (m)"
                              name="clinicLocationAccuracy"
                              type="number"
                              disabled
                              value={doctorFormData.clinicLocationAccuracy !== undefined && doctorFormData.clinicLocationAccuracy !== null ? doctorFormData.clinicLocationAccuracy : ''}
                              placeholder="Auto GPS"
                              size="small"
                            />
                          </Grid>

                          {doctorFormData.clinicPlaceName && (
                            <Grid item xs={12}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOnIcon fontSize="small" /> <strong>Detected Area:</strong> {doctorFormData.clinicPlaceName}
                              </Typography>
                            </Grid>
                          )}

                          <Grid item xs={12} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={locating ? <CircularProgress size={18} color="inherit" /> : <MyLocationIcon />}
                              onClick={handleDetectLocation}
                              disabled={locating}
                              size="small"
                              sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                              {locating ? 'Acquiring GPS Satellite Lock...' : 'Detect Exact GPS Location'}
                            </Button>

                            {doctorFormData.clinicLatitude !== undefined && doctorFormData.clinicLongitude !== undefined && (
                              <>
                                <Button
                                  variant="outlined"
                                  color="info"
                                  startIcon={<OpenInNewIcon />}
                                  component="a"
                                  href={`https://www.google.com/maps?q=${doctorFormData.clinicLatitude},${doctorFormData.clinicLongitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="small"
                                  sx={{ textTransform: 'none' }}
                                >
                                  View on Google Maps
                                </Button>

                                <Button
                                  variant="outlined"
                                  color="error"
                                  startIcon={<ClearIcon />}
                                  onClick={handleClearLocation}
                                  size="small"
                                  sx={{ textTransform: 'none' }}
                                >
                                  Clear GPS Pin
                                </Button>
                              </>
                            )}
                          </Grid>

                          {/* OpenStreetMap Interactive Preview */}
                          {doctorFormData.clinicLatitude !== undefined && doctorFormData.clinicLongitude !== undefined && (
                            <Grid item xs={12} sx={{ mt: 1 }}>
                              <Box sx={{ borderRadius: 2, overflow: 'hidden', height: 200, border: '1px solid rgba(0,0,0,0.12)' }}>
                                <iframe
                                  title="Clinic Location Map Preview"
                                  width="100%"
                                  height="100%"
                                  frameBorder="0"
                                  scrolling="no"
                                  marginHeight={0}
                                  marginWidth={0}
                                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(doctorFormData.clinicLongitude) - 0.005}%2C${Number(doctorFormData.clinicLatitude) - 0.003}%2C${Number(doctorFormData.clinicLongitude) + 0.005}%2C${Number(doctorFormData.clinicLatitude) + 0.003}&layer=mapnik&marker=${doctorFormData.clinicLatitude}%2C${doctorFormData.clinicLongitude}`}
                                />
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Contact Information Accordion */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ContactPhoneIcon /> Contact Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Primary Phone"
                        name="contactNumber"
                        value={doctorFormData.contactNumber}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Secondary Phone"
                        name="secondaryPhone"
                        value={doctorFormData.secondaryPhone}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Alternate Email"
                        name="alternateEmail"
                        type="email"
                        value={doctorFormData.alternateEmail}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Fax"
                        name="fax"
                        value={doctorFormData.fax}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="WhatsApp"
                        name="whatsapp"
                        placeholder="+91 XXXXXXXXXX"
                        value={doctorFormData.whatsapp}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Social Media Accordion */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LanguageIcon /> Social Media Links
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="LinkedIn"
                        name="linkedin"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={doctorFormData.linkedin}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Twitter / X"
                        name="twitter"
                        placeholder="https://twitter.com/yourhandle"
                        value={doctorFormData.twitter}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Facebook"
                        name="facebook"
                        placeholder="https://facebook.com/yourpage"
                        value={doctorFormData.facebook}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Instagram"
                        name="instagram"
                        placeholder="https://instagram.com/yourhandle"
                        value={doctorFormData.instagram}
                        onChange={handleDoctorChange}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </>
          ) : user.role === 'pharmacist' ? (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  disabled
                  label="First Name"
                  value={user.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Last Name"
                  value={user.lastName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Pharmacy Name"
                  value={user.pharmacyName || 'Medizo Care Pharmacy'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  disabled
                  label="License Number"
                  value={user.licenseNumber || 'PHARM-88219'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Contact Phone"
                  value={user.phone || '+1 555-987-6543'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Account Status"
                  value="Active (Admin Verified)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  disabled
                  label="Pharmacy Address"
                  multiline
                  rows={2}
                  value={user.pharmacyAddress || '456 Healthcare Blvd, Suite 100'}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={patientFormData.firstName}
                  onChange={handlePatientChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={patientFormData.lastName}
                  onChange={handlePatientChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={patientFormData.dateOfBirth}
                  onChange={handlePatientChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  name="contactNumber"
                  value={patientFormData.contactNumber}
                  onChange={handlePatientChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  multiline
                  rows={2}
                  value={patientFormData.address}
                  onChange={handlePatientChange}
                />
              </Grid>
            </Grid>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ═══ Legal Guardian Card (For Minors with Guardian) ═══ */}
      {user?.role === 'patient' && ((user as Patient)?.guardianId || guardianProfile) && (
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: { xs: 2.5, sm: 3 },
            borderRadius: '20px',
            bgcolor: 'rgba(245, 158, 11, 0.05)',
            border: '1.5px solid rgba(245, 158, 11, 0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: '14px', bgcolor: 'rgba(245, 158, 11, 0.15)', display: 'flex' }}>
                <BadgeIcon sx={{ color: '#d97706', fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A312C' }}>
                  Legal Guardian
                </Typography>
                <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 700 }}>
                  Primary account supervisor for minor patient
                </Typography>
              </Box>
            </Box>
            <Chip label="Verified Guardian" size="small" sx={{ bgcolor: '#d97706', color: '#ffffff', fontWeight: 800, borderRadius: '8px' }} />
          </Box>

          {loadingGuardian ? (
            <CircularProgress size={24} sx={{ color: '#d97706' }} />
          ) : guardianProfile ? (
            <Card variant="outlined" sx={{ borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.25)', p: 2, bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#d97706', width: 44, height: 44, fontWeight: 900, fontSize: '1.1rem' }}>
                  {(guardianProfile.firstName || 'G')[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1A312C' }}>
                    {guardianProfile.firstName} {guardianProfile.lastName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
                    📧 {guardianProfile.email || 'No email'} {guardianProfile.phone ? `• 📱 ${guardianProfile.phone}` : ''}
                  </Typography>
                </Box>
              </Box>
            </Card>
          ) : (
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
              Guardian ID: {(user as Patient)?.guardianId}
            </Alert>
          )}
        </Paper>
      )}

      {/* ═══ Family Members Section (Patient Only) ═══ */}
      {user?.role === 'patient' && (
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: { xs: 2.5, sm: 3 },
            borderRadius: '20px',
            bgcolor: 'rgba(66, 132, 117, 0.04)',
            border: '1.5px solid rgba(66, 132, 117, 0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: '14px', bgcolor: 'rgba(66, 132, 117, 0.12)', display: 'flex' }}>
                <GroupIcon sx={{ color: '#428475', fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A312C' }}>
                  Family Members
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  {familyProfiles.length > 0 ? `${familyProfiles.length} profile${familyProfiles.length > 1 ? 's' : ''} (including you)` : 'Manage family & dependent profiles'}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenAddFamily}
              sx={{
                bgcolor: '#428475',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.78rem',
                borderRadius: '14px',
                textTransform: 'none',
                px: 2,
                boxShadow: '0 4px 16px rgba(66, 132, 117, 0.25)',
                '&:hover': { bgcolor: '#1A312C' }
              }}
            >
              Add Member
            </Button>
          </Box>

          {familySuccess && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setFamilySuccess(null)}>
              {familySuccess}
            </Alert>
          )}
          {familyError && !familyDialogOpen && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setFamilyError(null)}>
              {familyError}
            </Alert>
          )}

          {loadingProfiles ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress size={32} sx={{ color: '#428475' }} />
              <Typography variant="body2" sx={{ mt: 1, color: '#64748b' }}>Loading profiles...</Typography>
            </Box>
          ) : familyProfiles.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <GroupIcon sx={{ fontSize: 48, color: 'rgba(66, 132, 117, 0.3)', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                No family profiles yet. Click "Add Member" to add your spouse, parents, children, or dependents.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {familyProfiles.map((profile) => (
                <Grid item xs={12} sm={6} md={4} key={profile.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: '16px',
                      border: profile.relationship === 'self'
                        ? '2px solid rgba(66, 132, 117, 0.4)'
                        : '1.5px solid rgba(0, 0, 0, 0.08)',
                      bgcolor: profile.relationship === 'self'
                        ? 'rgba(66, 132, 117, 0.06)'
                        : 'rgba(255, 255, 255, 0.8)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 6px 24px rgba(66, 132, 117, 0.12)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar
                            sx={{
                              width: 42,
                              height: 42,
                              bgcolor: profile.relationship === 'self' ? '#1A312C' : '#428475',
                              color: '#89D7B7',
                              fontWeight: 800,
                              fontSize: '1rem'
                            }}
                          >
                            {RELATIONSHIP_ICONS[profile.relationship] || '👤'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A312C', lineHeight: 1.2 }}>
                              {profile.firstName} {profile.lastName}
                            </Typography>
                            <Chip
                              label={RELATIONSHIP_LABELS[profile.relationship] || profile.relationship}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: profile.relationship === 'self' ? 'rgba(26, 49, 44, 0.12)' : 'rgba(66, 132, 117, 0.1)',
                                color: profile.relationship === 'self' ? '#1A312C' : '#428475'
                              }}
                            />
                          </Box>
                        </Box>
                        {profile.relationship !== 'self' && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenEditFamily(profile)} sx={{ color: '#428475' }}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove">
                              <IconButton
                                size="small"
                                onClick={() => { setProfileToDelete(profile); setDeleteProfileDialogOpen(true); }}
                                sx={{ color: '#dc2626' }}
                                disabled={deletingProfileId === profile.id}
                              >
                                {deletingProfileId === profile.id
                                  ? <CircularProgress size={14} color="inherit" />
                                  : <DeleteIcon sx={{ fontSize: 16 }} />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                        {profile.relationship === 'self' && (
                          <Tooltip title="Edit via profile form above">
                            <Chip label="You" size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#1A312C', color: '#89D7B7' }} />
                          </Tooltip>
                        )}
                      </Box>

                      {/* Patient Display ID */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8 }}>
                        <BadgeIcon sx={{ fontSize: 14, color: '#428475' }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#428475', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                          {profile.patientDisplayId}
                        </Typography>
                      </Box>

                      {/* Quick info */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {profile.dateOfBirth && (
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                            🎂 {new Date(profile.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        )}
                        {profile.gender && (
                          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                            • {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                          </Typography>
                        )}
                        {profile.bloodType && (
                          <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700, fontSize: '0.68rem' }}>
                            • 🩸 {profile.bloodType}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {/* ═══ Add/Edit Family Member Dialog ═══ */}
      <Dialog
        open={familyDialogOpen}
        onClose={() => setFamilyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 0.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#1A312C', display: 'flex', alignItems: 'center', gap: 1 }}>
          {editingProfile ? <EditIcon sx={{ color: '#428475' }} /> : <PersonAddIcon sx={{ color: '#428475' }} />}
          {editingProfile ? 'Edit Family Member' : 'Add Family Member'}
        </DialogTitle>
        <DialogContent>
          {familyError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
              {familyError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {!editingProfile && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Relationship *</InputLabel>
                  <Select
                    name="relationship"
                    value={familyFormData.relationship}
                    label="Relationship *"
                    onChange={(e) => setFamilyFormData(prev => ({ ...prev, relationship: e.target.value as any }))}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="spouse">👫 Spouse</MenuItem>
                    <MenuItem value="parent">👴 Parent</MenuItem>
                    <MenuItem value="child">👶 Child</MenuItem>
                    <MenuItem value="sibling">🧑‍🤝‍🧑 Sibling</MenuItem>
                    <MenuItem value="other">👤 Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="First Name *"
                name="firstName"
                value={familyFormData.firstName}
                onChange={handleFamilyFormChange}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Last Name *"
                name="lastName"
                value={familyFormData.lastName}
                onChange={handleFamilyFormChange}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={familyFormData.dateOfBirth || ''}
                onChange={handleFamilyFormChange}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={familyFormData.gender || ''}
                  label="Gender"
                  onChange={(e) => setFamilyFormData(prev => ({ ...prev, gender: e.target.value as string }))}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Phone"
                name="phone"
                value={familyFormData.phone || ''}
                onChange={handleFamilyFormChange}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Blood Type</InputLabel>
                <Select
                  name="bloodType"
                  value={familyFormData.bloodType || ''}
                  label="Blood Type"
                  onChange={(e) => setFamilyFormData(prev => ({ ...prev, bloodType: e.target.value as string }))}
                  sx={{ borderRadius: '12px' }}
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Address"
                name="address"
                multiline
                rows={2}
                value={familyFormData.address || ''}
                onChange={handleFamilyFormChange}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFamilyDialogOpen(false)} sx={{ borderRadius: '12px', color: '#64748b', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveFamily}
            disabled={savingFamily}
            sx={{
              bgcolor: '#428475',
              color: '#fff',
              fontWeight: 700,
              borderRadius: '12px',
              px: 3,
              '&:hover': { bgcolor: '#1A312C' }
            }}
          >
            {savingFamily ? <CircularProgress size={20} color="inherit" /> : (editingProfile ? 'Update' : 'Add Member')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Delete Family Member Confirmation Dialog ═══ */}
      <Dialog
        open={deleteProfileDialogOpen}
        onClose={() => { setDeleteProfileDialogOpen(false); setProfileToDelete(null); }}
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon /> Remove Family Member
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
            Are you sure you want to remove <strong>{profileToDelete?.firstName} {profileToDelete?.lastName}</strong> ({RELATIONSHIP_LABELS[profileToDelete?.relationship || '']}) from your family profiles?
          </Typography>
          <Typography variant="caption" sx={{ color: '#999' }}>
            Existing prescriptions for this profile will not be deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setDeleteProfileDialogOpen(false); setProfileToDelete(null); }} sx={{ borderRadius: '12px', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDeleteProfile}
            sx={{ bgcolor: '#dc2626', color: '#fff', fontWeight: 700, borderRadius: '12px', '&:hover': { bgcolor: '#b91c1c' } }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Section */}
      <Paper
        elevation={0}
        sx={{
          mt: 3,
          p: { xs: 2.5, sm: 3 },
          borderRadius: '20px',
          bgcolor: 'rgba(220, 38, 38, 0.04)',
          border: '1px solid rgba(220, 38, 38, 0.2)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <WarningIcon sx={{ color: '#DC2626', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#DC2626', fontSize: '1.05rem' }}>
            Danger Zone
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)', mb: 2, lineHeight: 1.6 }}>
          Permanently delete your account and all associated data including prescriptions, medical records,
          and profile information. This action cannot be undone.
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteForeverIcon />}
          onClick={() => setDeleteDialogOpen(true)}
          sx={{
            borderRadius: '12px',
            fontWeight: 700,
            borderWidth: '1.5px',
            textTransform: 'none',
            '&:hover': {
              bgcolor: 'rgba(220, 38, 38, 0.08)',
              borderWidth: '1.5px',
            },
          }}
        >
          Delete My Account
        </Button>
      </Paper>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteConfirmText(''); setDeleteError(null); }}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            maxWidth: 440,
            p: 1,
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <WarningIcon sx={{ color: '#DC2626', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#DC2626' }}>
            Delete Account
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem', color: 'rgba(0,0,0,0.7)', mb: 2, lineHeight: 1.7 }}>
            This will permanently delete your account and all associated data. This action is
            <strong> irreversible</strong>.
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.6)', mb: 1.5 }}>
            To confirm, type <strong>DELETE</strong> below:
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Type DELETE to confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&.Mui-focused fieldset': {
                  borderColor: '#DC2626',
                },
              },
            }}
          />
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: '10px' }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(''); setDeleteError(null); }}
            sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
            onClick={handleDeleteAccount}
            startIcon={deletingAccount ? <CircularProgress size={16} color="inherit" /> : <DeleteForeverIcon />}
            sx={{
              borderRadius: '10px',
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' },
            }}
          >
            {deletingAccount ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      <DigiLockerWarmupModal
        open={digilockerLoading}
        onClose={() => setDigilockerLoading(false)}
      />
    </Container>
  );
};

export default Profile;
