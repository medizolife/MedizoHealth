'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  Delete as DeleteIcon
} from '@mui/icons-material';
import { updateDoctorProfile, uploadProfileImage, uploadClinicLogo, uploadSignature } from '../services/doctors';
import { updatePatientProfile } from '../services/patients';
import { Doctor, Patient } from '../types/auth';

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
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {user.email}
          </Typography>
          <Typography variant="body1">
            <strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profile updated successfully!
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="h6" gutterBottom>
          Edit Profile
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {user.role === 'doctor' ? (
            <>
              {/* Profile & Clinic Images Section */}
              <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhotoCameraIcon /> Profile & Clinic Images
                  </Typography>
                  <Grid container spacing={4} sx={{ mt: 1 }}>
                    {/* Profile Image */}
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Profile Image
                        </Typography>
                        <Avatar
                          src={getImageUrl(doctorFormData.profileImage || '')}
                          sx={{ width: 120, height: 120, mb: 2, border: '3px solid #1976d2' }}
                        >
                          <PersonIcon sx={{ fontSize: 60 }} />
                        </Avatar>
                        <input
                          type="file"
                          accept="image/*"
                          ref={profileImageRef}
                          onChange={handleProfileImageUpload}
                          style={{ display: 'none' }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={uploadingProfile ? <CircularProgress size={16} /> : <PhotoCameraIcon />}
                            onClick={() => profileImageRef.current?.click()}
                            disabled={uploadingProfile}
                          >
                            {uploadingProfile ? 'Uploading...' : 'Upload Photo'}
                          </Button>
                          {doctorFormData.profileImage && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleRemoveImage('profileImage')}
                            >
                              Remove
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    
                    {/* Clinic Logo */}
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Clinic Logo
                        </Typography>
                        <Avatar
                          variant="rounded"
                          src={getImageUrl(doctorFormData.clinicLogo || '')}
                          sx={{ width: 120, height: 120, mb: 2, border: '3px solid #4caf50' }}
                        >
                          <BusinessIcon sx={{ fontSize: 60 }} />
                        </Avatar>
                        <input
                          type="file"
                          accept="image/*"
                          ref={clinicLogoRef}
                          onChange={handleClinicLogoUpload}
                          style={{ display: 'none' }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            startIcon={uploadingLogo ? <CircularProgress size={16} /> : <BusinessIcon />}
                            onClick={() => clinicLogoRef.current?.click()}
                            disabled={uploadingLogo}
                          >
                            {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                          </Button>
                          {doctorFormData.clinicLogo && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleRemoveImage('clinicLogo')}
                            >
                              Remove
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    
                    {/* Signature */}
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Signature
                        </Typography>
                        <Avatar
                          variant="rounded"
                          src={getImageUrl(doctorFormData.signature || '')}
                          sx={{ width: 150, height: 80, mb: 2, border: '3px solid #9c27b0', bgcolor: 'white' }}
                        >
                          <CreateIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <input
                          type="file"
                          accept="image/*"
                          ref={signatureRef}
                          onChange={handleSignatureUpload}
                          style={{ display: 'none' }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            startIcon={uploadingSignature ? <CircularProgress size={16} /> : <CreateIcon />}
                            onClick={() => signatureRef.current?.click()}
                            disabled={uploadingSignature}
                          >
                            {uploadingSignature ? 'Uploading...' : 'Upload Signature'}
                          </Button>
                          {doctorFormData.signature && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleRemoveImage('signature')}
                            >
                              Remove
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

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
