'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Patient } from '../types/auth';
import { getPatients, createPatient, updatePatient, deletePatient } from '../services/patients';
import { useAuth } from '../contexts/AuthContext';
import { digilockerAPI } from '../services/api';
import DigiLockerWarmupModal from './DigiLockerWarmupModal';

interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  dateOfBirth?: string;
  gender?: string;
  contactNumber?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
}

const PatientManagement: React.FC = () => {
  const { authState } = useAuth();
  const { user } = authState;
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [warmupOpen, setWarmupOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    contactNumber: '',
    address: '',
    emergencyContact: '',
    medicalHistory: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await getPatients();
      setPatients(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (patient?: Patient) => {
    if (!patient && user?.role === 'doctor' && !user?.digilockerVerified) {
      if (window.confirm('Identity Verification Required: Doctors must verify their identity via DigiLocker before creating new patients. Would you like to verify now?')) {
        setWarmupOpen(true);
      }
      return;
    }

    if (patient) {
      setEditingPatient(patient);
      setFormData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth || '',
        contactNumber: patient.contactNumber || '',
        address: patient.address || '',
        emergencyContact: patient.emergencyContact || '',
        medicalHistory: patient.medicalHistory || ''
      });
    } else {
      setEditingPatient(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        dateOfBirth: '',
        contactNumber: '',
        address: '',
        emergencyContact: '',
        medicalHistory: ''
      });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingPatient(null);
    setError(null);
  };

  const handleInputChange = (field: keyof PatientFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);
      setError(null);

      // Validation
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError('Please fill in all required fields');
        return;
      }

      if (!editingPatient && (!formData.password || !formData.confirmPassword)) {
        setError('Password is required for new patients');
        return;
      }

      if (!editingPatient && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (editingPatient) {
        // Update existing patient
        const updatedPatient = await updatePatient(editingPatient.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          dateOfBirth: formData.dateOfBirth,
          contactNumber: formData.contactNumber,
          address: formData.address,
          emergencyContact: formData.emergencyContact,
          medicalHistory: formData.medicalHistory
        });
        
        setPatients(prev => prev.map(p => 
          p.id === editingPatient.id ? updatedPatient : p
        ));
      } else {
        // Create new patient
        const newPatient = await createPatient({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password!,
          dateOfBirth: formData.dateOfBirth,
          contactNumber: formData.contactNumber,
          address: formData.address,
          emergencyContact: formData.emergencyContact,
          medicalHistory: formData.medicalHistory,
          role: 'patient'
        });
        
        setPatients(prev => [...prev, newPatient]);
      }

      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving patient:', err);
      setError(err.response?.data?.message || 'Failed to save patient');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (patient: Patient) => {
    if (window.confirm(`Are you sure you want to delete patient ${patient.firstName} ${patient.lastName}?`)) {
      try {
        await deletePatient(patient.id);
        setPatients(prev => prev.filter(p => p.id !== patient.id));
      } catch (err) {
        console.error('Error deleting patient:', err);
        setError('Failed to delete patient');
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Patient Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Patient
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Date of Birth</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Registered</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary">
                    No patients found. Click "Add New Patient" to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <PersonIcon color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Chip 
                          label="Patient" 
                          size="small" 
                          color="secondary" 
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{patient.email}</Typography>
                      </Box>
                      {patient.contactNumber && (
                        <Box display="flex" alignItems="center">
                          <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{patient.contactNumber}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(patient.dateOfBirth)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {patient.address || 'Not specified'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(patient.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Patient">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(patient)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Patient">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(patient)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Patient Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPatient ? 'Edit Patient' : 'Add New Patient'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
              />
            </Grid>
            {!editingPatient && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    required
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange('dateOfBirth')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Number"
                value={formData.contactNumber}
                onChange={handleInputChange('contactNumber')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={formData.address}
                onChange={handleInputChange('address')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={formData.emergencyContact}
                onChange={handleInputChange('emergencyContact')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical History"
                multiline
                rows={3}
                value={formData.medicalHistory}
                onChange={handleInputChange('medicalHistory')}
                placeholder="Any relevant medical history, allergies, or conditions..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitLoading}
          >
            {submitLoading ? <CircularProgress size={20} /> : (editingPatient ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      <DigiLockerWarmupModal
        open={warmupOpen}
        onClose={() => setWarmupOpen(false)}
      />
    </Box>
  );
};

export default PatientManagement;