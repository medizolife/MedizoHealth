'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Chip
} from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import jwtDecode from 'jwt-decode';
import { useAuth } from '../../contexts/AuthContext';

const RegisterForm = ({ onClose }) => {
  const { register, googleLogin, loading, error, clearError } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [googleMode, setGoogleMode] = useState(false);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    specialization: '',
    dateOfBirth: '',
    contactNumber: '',
    address: ''
  });
  
  const [localError, setLocalError] = useState('');
  
  const handleChange = (e) => {
    if (error || localError) {
      clearError();
      setLocalError('');
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      setGoogleCredential(credentialResponse.credential);
      setGoogleMode(true);
      setFormData(prev => ({
        ...prev,
        firstName: decoded.given_name || '',
        lastName: decoded.family_name || '',
        email: decoded.email || '',
        password: '',
        confirmPassword: '',
      }));
      setLocalError('');
      clearError && clearError();
      // Skip account info step — go straight to personal details
      setActiveStep(1);
    } catch {
      setLocalError('Failed to read Google account info. Please try manually.');
    }
  };
  
  const handleNext = () => {
    if (activeStep === 0) {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setLocalError('Please fill in all required fields');
        return;
      }
      if (!googleMode) {
        if (formData.password !== formData.confirmPassword) {
          setLocalError('Passwords do not match');
          return;
        }
        if (formData.password.length < 6) {
          setLocalError('Password must be at least 6 characters long');
          return;
        }
      }
    }
    setActiveStep((prev) => prev + 1);
    setLocalError('');
  };
  
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setLocalError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (googleMode && googleCredential) {
        await googleLogin(googleCredential, formData.role);
      } else {
        await register(formData);
      }
      if (onClose) onClose();
    } catch {
      // Error handled by context
    }
  };
  
  const steps = ['Account Information', 'Personal Details', 'Review'];
  
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        Create Your Account
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>
      
      {(error || localError) && (
        <Alert severity="error" sx={{ mb: 2 }}>{error || localError}</Alert>
      )}
      
      <Box component="form" onSubmit={activeStep === steps.length - 1 ? handleSubmit : (e) => e.preventDefault()}>
        {activeStep === 0 && (
          <Grid container spacing={2}>
            {/* Google Sign-up */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setLocalError('Google sign-in failed. Please try again.')}
                  text="signup_with"
                  shape="rectangular"
                  width="100%"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Divider><Chip label="OR FILL MANUALLY" size="small" sx={{ fontSize: '0.7rem', color: 'text.secondary' }} /></Divider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Register as</FormLabel>
                <RadioGroup row name="role" value={formData.role} onChange={handleChange}>
                  <FormControlLabel value="patient" control={<Radio />} label="Patient" />
                  <FormControlLabel value="doctor" control={<Radio />} label="Doctor" />
                  <FormControlLabel value="pharmacist" control={<Radio />} label="Pharmacist" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        )}
        
        {activeStep === 1 && (
          <Grid container spacing={2}>
            {googleMode && (
              <Grid item xs={12}>
                <Alert severity="success" sx={{ mb: 1 }}>
                  Signed in with Google as <strong>{formData.firstName} {formData.lastName}</strong>. Please complete your profile below.
                </Alert>
                <FormControl component="fieldset" sx={{ mb: 1 }}>
                  <FormLabel component="legend">Register as</FormLabel>
                  <RadioGroup row name="role" value={formData.role} onChange={handleChange}>
                    <FormControlLabel value="patient" control={<Radio />} label="Patient" />
                    <FormControlLabel value="doctor" control={<Radio />} label="Doctor" />
                  </RadioGroup>
                </FormControl>
              </Grid>
            )}
            {formData.role === 'doctor' ? (
              <>
                <Grid item xs={12}>
                  <TextField fullWidth label="Specialization" name="specialization" value={formData.specialization} onChange={handleChange} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} InputLabelProps={{ shrink: true }} inputProps={{ max: new Date().toISOString().split('T')[0] }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Address" name="address" multiline rows={3} value={formData.address} onChange={handleChange} />
                </Grid>
              </>
            )}
          </Grid>
        )}
        
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Account Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Name:</Typography>
                <Typography variant="body1" color="text.secondary">{formData.firstName} {formData.lastName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Email:</Typography>
                <Typography variant="body1" color="text.secondary">{formData.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Role:</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{formData.role}</Typography>
              </Grid>
              {googleMode && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Auth Method:</Typography>
                  <Typography variant="body1" color="text.secondary">Google Account</Typography>
                </Grid>
              )}
              {formData.role === 'doctor' && formData.specialization && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Specialization:</Typography>
                  <Typography variant="body1" color="text.secondary">{formData.specialization}</Typography>
                </Grid>
              )}
              {formData.role === 'patient' && formData.dateOfBirth && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Date of Birth:</Typography>
                  <Typography variant="body1" color="text.secondary">{formData.dateOfBirth}</Typography>
                </Grid>
              )}
              {formData.contactNumber && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Contact:</Typography>
                  <Typography variant="body1" color="text.secondary">{formData.contactNumber}</Typography>
                </Grid>
              )}
              {formData.address && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Address:</Typography>
                  <Typography variant="body1" color="text.secondary">{formData.address}</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
          <div>
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" color="primary" type="submit" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : (googleMode ? 'Create Account' : 'Register')}
              </Button>
            ) : (
              <Button variant="contained" color="primary" onClick={handleNext}>Next</Button>
            )}
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterForm;
