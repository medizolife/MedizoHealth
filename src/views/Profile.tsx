'use client';
import React, { useState, useEffect, useRef } from 'react';
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
  AccordionDetails
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
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { updateDoctorProfile, uploadProfileImage, uploadClinicLogo, uploadSignature } from '../services/doctors';
import { updatePatientProfile } from '../services/patients';
import { Doctor, Patient } from '../types/auth';
import WallpaperCarouselHero from '../components/WallpaperCarouselHero';

const Profile = () => {
  const { authState } = useAuth();
  const { user } = authState;
  
  const [loading, setLoading] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const profileImageRef = useRef<HTMLInputElement>(null);
  const clinicLogoRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);
  
  const [doctorFormData, setDoctorFormData] = useState<Partial<Doctor>>({
    firstName: '',
    lastName: '',
    specialization: '',
    contactNumber: '',
    profileImage: '',
    clinicLogo: '',
    signature: '',
    clinicName: '',
    clinicAddress: '',
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
      setDoctorFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        specialization: doctorUser.specialization || '',
        contactNumber: doctorUser.contactNumber || '',
        profileImage: doctorUser.profileImage || '',
        clinicLogo: doctorUser.clinicLogo || '',
        signature: doctorUser.signature || '',
        clinicName: doctorUser.clinicName || '',
        clinicAddress: doctorUser.clinicAddress || '',
        alternateEmail: doctorUser.alternateEmail || '',
        secondaryPhone: doctorUser.secondaryPhone || '',
        fax: doctorUser.fax || '',
        whatsapp: doctorUser.whatsapp || '',
        website: doctorUser.website || '',
        linkedin: doctorUser.linkedin || '',
        twitter: doctorUser.twitter || '',
        facebook: doctorUser.facebook || '',
        instagram: doctorUser.instagram || '',
        licenseNumber: doctorUser.licenseNumber || '',
        experience: doctorUser.experience || '',
        qualifications: doctorUser.qualifications || ''
      });
    } else if (user.role === 'patient') {
      setPatientFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        dateOfBirth: (user as Patient).dateOfBirth || '',
        contactNumber: (user as Patient).contactNumber || '',
        address: (user as Patient).address || ''
      });
    }
  }, [user]);
  
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
  
  // Handle remove image
  const handleRemoveImage = async (field: 'profileImage' | 'clinicLogo' | 'signature') => {
    try {
      setError(null);
      setDoctorFormData(prev => ({ ...prev, [field]: '' }));
      await updateDoctorProfile({ ...doctorFormData, [field]: '' });
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
        await updateDoctorProfile(doctorFormData);
      } else if (user?.role === 'patient') {
        await updatePatientProfile(patientFormData);
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
    if (path.startsWith('http')) return path;
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${apiUrl}${path}`;
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
    <Container maxWidth="md" sx={{ pt: { xs: 2, sm: 3 }, pb: 6, px: { xs: 2, sm: 3 } }} className="animate-slide-up">
      
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

      <Paper elevation={0} className={mode === 'dark' ? 'apple-glass-card-dark' : 'apple-glass-card'} sx={{ p: 3, borderRadius: '24px !important', mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: mode === 'dark' ? '#FAF2F5' : 'var(--color-forest)' }}>
            Account Details
          </Typography>
          <Typography variant="body2" sx={{ color: mode === 'dark' ? 'var(--color-mint)' : 'var(--color-teal)', fontWeight: 600 }}>
            Member since: {new Date(user.createdAt).toLocaleDateString()}
          </Typography>
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
                        High-resolution avatar, logo, and digital signature for prescriptions
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Grid container spacing={{ xs: 1.2, sm: 2.5 }}>
                  {/* Profile Image */}
                  <Grid item xs={4} sm={4}>
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
                  <Grid item xs={4} sm={4}>
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
                  <Grid item xs={4} sm={4}>
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
                        label="Clinic Name"
                        name="clinicName"
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
    </Container>
  );
};

export default Profile;
