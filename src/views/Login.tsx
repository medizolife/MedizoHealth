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
  Divider,
  Chip
} from '@mui/material';
import { LockOutlined as LockIcon, Person as PersonIcon, MedicalServices as DoctorIcon } from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  const { authState, login } = useAuth();
  const { loading, error, isAuthenticated } = authState;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) return;
    await login({ email, password });
  };
  
  return (
    <Container component="main" maxWidth="xs" sx={{ pt: 3, pb: 4, px: 2 }}>
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
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/LOGO.png"
            alt="Medizo Logo"
            sx={{ width: 56, height: 56, borderRadius: '12px', mb: 1 }}
          />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#134F4D' }}>
            Welcome to Medizo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to access your digital prescriptions
          </Typography>
        </Box>

        {/* Role Selector Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center' }}>
          <Chip
            icon={<PersonIcon />}
            label="Patient"
            clickable
            color={role === 'patient' ? 'primary' : 'default'}
            onClick={() => setRole('patient')}
            sx={{ flex: 1, height: 40, fontWeight: 600 }}
          />
          <Chip
            icon={<DoctorIcon />}
            label="Doctor"
            clickable
            color={role === 'doctor' ? 'primary' : 'default'}
            onClick={() => setRole('doctor')}
            sx={{ flex: 1, height: 40, fontWeight: 600 }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{ sx: { borderRadius: '12px' } }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{ sx: { borderRadius: '12px' } }}
          />

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
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : `Sign In as ${role === 'doctor' ? 'Doctor' : 'Patient'}`}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">OR</Typography>
          </Divider>

          <Button
            component={RouterLink}
            to="/register"
            fullWidth
            variant="outlined"
            size="large"
            sx={{ height: 44, borderColor: '#134F4D', color: '#134F4D' }}
          >
            Create New Account
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
