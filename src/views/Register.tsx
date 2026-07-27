'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  CircularProgress, 
  Container, 
  Grid,
  Chip,
  Divider
} from '@mui/material';
import { Person as PersonIcon, MedicalServices as DoctorIcon } from '@mui/icons-material';

const Register = () => {
  const navigate = useNavigate();
  const { authState, register } = useAuth();
  const { loading, error, isAuthenticated } = authState;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as 'doctor' | 'patient'
  });
  
  const [passwordError, setPasswordError] = useState('');
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      setPasswordError('');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { firstName, lastName, email, password, confirmPassword, role } = formData;
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    await register({ firstName, lastName, email, password, role });
    navigate('/login');
  };
  
  return (
    <Container component="main" maxWidth="xs" sx={{ pt: 2, pb: 4, px: 2 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: '24px', 
          bgcolor: '#ffffff',
          border: '1px solid rgba(19, 79, 77, 0.12)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Box
            component="img"
            src="/LOGO.png"
            alt="Medizo Logo"
            sx={{ width: 48, height: 48, borderRadius: '12px', mb: 1 }}
          />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#134F4D' }}>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join Medizo Healthcare Platform
          </Typography>
        </Box>

        {/* Role Selector Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center' }}>
          <Chip
            icon={<PersonIcon />}
            label="Patient Account"
            clickable
            color={formData.role === 'patient' ? 'primary' : 'default'}
            onClick={() => setFormData({ ...formData, role: 'patient' })}
            sx={{ flex: 1, height: 40, fontWeight: 600 }}
          />
          <Chip
            icon={<DoctorIcon />}
            label="Doctor Account"
            clickable
            color={formData.role === 'doctor' ? 'primary' : 'default'}
            onClick={() => setFormData({ ...formData, role: 'doctor' })}
            sx={{ flex: 1, height: 40, fontWeight: 600 }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <TextField
                name="firstName"
                required
                fullWidth
                id="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!passwordError}
                helperText={passwordError}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              mt: 3, 
              mb: 2, 
              height: 48, 
              bgcolor: '#134F4D', 
              fontSize: '1rem',
              '&:hover': { bgcolor: '#0e3b3a' } 
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : `Register as ${formData.role === 'doctor' ? 'Doctor' : 'Patient'}`}
          </Button>

          <Divider sx={{ my: 1.5 }}>
            <Typography variant="caption" color="text.secondary">OR</Typography>
          </Divider>

          <Button
            component={RouterLink}
            to="/login"
            fullWidth
            variant="outlined"
            size="large"
            sx={{ height: 44, borderColor: '#134F4D', color: '#134F4D' }}
          >
            Already Have an Account? Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
