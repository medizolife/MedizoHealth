import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Cake as CakeIcon,
  Save as SaveIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Transgender as TransgenderIcon
} from '@mui/icons-material';
import { updatePatient } from '../services/patients';
import { updateFamilyProfile } from '../services/familyProfiles';

interface EditPatientProfileModalProps {
  open: boolean;
  onClose: () => void;
  patient: any;
  onPatientUpdated: (updatedPatient: any) => void;
  isFamilyProfile?: boolean;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const EditPatientProfileModal: React.FC<EditPatientProfileModalProps> = ({
  open,
  onClose,
  patient,
  onPatientUpdated,
  isFamilyProfile = false
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    address: '',
    bloodType: '',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
    allergies: '',
    medicalHistory: ''
  });

  // Calculate age from dateOfBirth
  const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 && age < 150 ? age : null;
  };

  // Populate form when patient opens
  useEffect(() => {
    if (patient && open) {
      let addrStr = '';
      if (typeof patient.address === 'object' && patient.address !== null) {
        addrStr = [patient.address.street, patient.address.city, patient.address.state]
          .filter(Boolean)
          .join(', ');
      } else if (patient.address) {
        addrStr = String(patient.address);
      }

      let emName = '';
      let emRel = '';
      let emPhone = '';
      if (patient.emergencyContact) {
        if (typeof patient.emergencyContact === 'object') {
          emName = patient.emergencyContact.name || '';
          emRel = patient.emergencyContact.relationship || '';
          emPhone = patient.emergencyContact.phone || '';
        } else {
          emName = String(patient.emergencyContact);
        }
      }

      let allergiesStr = '';
      if (Array.isArray(patient.allergies)) {
        allergiesStr = patient.allergies
          .map((a: any) => (typeof a === 'object' && a !== null ? (a.name || a.allergy || JSON.stringify(a)) : String(a)))
          .join(', ');
      } else if (typeof patient.allergies === 'object' && patient.allergies !== null) {
        const parts: string[] = [];
        Object.values(patient.allergies).forEach((val) => {
          if (Array.isArray(val)) parts.push(...val);
        });
        allergiesStr = parts.join(', ');
      } else if (patient.allergies) {
        allergiesStr = String(patient.allergies);
      }

      let medHistoryStr = '';
      if (Array.isArray(patient.medicalHistory)) {
        medHistoryStr = patient.medicalHistory
          .map((m: any) => (typeof m === 'object' && m !== null ? (m.name || m.condition || JSON.stringify(m)) : String(m)))
          .join(', ');
      } else if (patient.medicalHistory) {
        medHistoryStr = String(patient.medicalHistory);
      }

      let dobFormatted = '';
      if (patient.dateOfBirth || patient.dob) {
        const rawDob = patient.dateOfBirth || patient.dob;
        const d = new Date(rawDob);
        if (!isNaN(d.getTime())) {
          dobFormatted = d.toISOString().split('T')[0];
        }
      }

      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        email: patient.email || '',
        gender: (patient.gender || '').toLowerCase(),
        dateOfBirth: dobFormatted,
        phone: patient.contactNumber || patient.phone || '',
        address: addrStr,
        bloodType: patient.bloodType || '',
        emergencyName: emName,
        emergencyRelationship: emRel,
        emergencyPhone: emPhone,
        allergies: allergiesStr,
        medicalHistory: medHistoryStr
      });
      setError(null);
      setSuccess(null);
    }
  }, [patient, open]);

  const currentAge = calculateAge(formData.dateOfBirth);

  const handleGenderSelect = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    const targetId = patient.id || patient._id;
    if (!targetId) return;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const isFamily = Boolean(isFamilyProfile || (patient.accountId && patient.relationship));

      // Build payload
      const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender ? formData.gender.toLowerCase() : '',
        dateOfBirth: formData.dateOfBirth || '',
        phone: formData.phone.trim(),
        contactNumber: formData.phone.trim(),
        address: formData.address.trim(),
        bloodType: formData.bloodType || '',
        emergencyContact: {
          name: formData.emergencyName.trim(),
          relationship: formData.emergencyRelationship.trim(),
          phone: formData.emergencyPhone.trim()
        }
      };

      if (formData.medicalHistory) {
        payload.medicalHistory = formData.medicalHistory.trim();
      }

      if (formData.allergies) {
        const parsed = formData.allergies
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        payload.allergies = isFamily ? { other: parsed } : parsed;
      }

      let updatedData: any = null;

      if (isFamily) {
        updatedData = await updateFamilyProfile(targetId, payload);
      } else {
        if (formData.email) {
          payload.email = formData.email.trim();
        }
        updatedData = await updatePatient(targetId, payload);
      }

      setSuccess('Patient profile updated successfully!');
      if (onPatientUpdated) {
        onPatientUpdated({
          ...patient,
          ...payload,
          ...(updatedData || {})
        });
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to update patient profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update patient profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: isDark ? '1.5px solid rgba(16, 185, 129, 0.25)' : '1.5px solid rgba(16, 185, 129, 0.15)',
          boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(16, 185, 129, 0.12)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1.2,
              borderRadius: '14px',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
              color: isDark ? '#34D399' : '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <PersonIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#FAF2F5' : '#0F172A', lineHeight: 1.2 }}>
              Edit Patient Profile
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {isFamilyProfile ? 'Family Member Profile' : 'Primary Patient Account'} • Manage demographics, contact & medical data
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} disabled={loading} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, maxHeight: '72vh', overflowY: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '14px', fontWeight: 600 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2.5, borderRadius: '14px', bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#047857', fontWeight: 700 }}>
              {success}
            </Alert>
          )}

          {/* Section 1: Demographics */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: isDark ? '#34D399' : '#059669',
                mb: 1.5,
                textTransform: 'uppercase',
                fontSize: '0.72rem',
                letterSpacing: 0.5
              }}
            >
              1. Personal Demographics
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name *"
                  fullWidth
                  size="small"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 700 } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name *"
                  fullWidth
                  size="small"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 700 } }}
                />
              </Grid>

              {/* Gender Selection */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 0.8 }}>
                    Gender *
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {[
                      { val: 'male', label: 'Male', icon: <MaleIcon sx={{ fontSize: 16 }} /> },
                      { val: 'female', label: 'Female', icon: <FemaleIcon sx={{ fontSize: 16 }} /> },
                      { val: 'other', label: 'Other', icon: <TransgenderIcon sx={{ fontSize: 16 }} /> }
                    ].map(g => (
                      <Chip
                        key={g.val}
                        icon={g.icon}
                        label={g.label}
                        clickable
                        onClick={() => handleGenderSelect(g.val)}
                        color={formData.gender === g.val ? 'primary' : 'default'}
                        variant={formData.gender === g.val ? 'filled' : 'outlined'}
                        sx={{
                          flex: 1,
                          fontWeight: 800,
                          borderRadius: '10px',
                          height: 36,
                          fontSize: '0.78rem',
                          ...(formData.gender === g.val && {
                            bgcolor: isDark ? '#10B981' : '#059669',
                            color: '#ffffff',
                            '& .MuiChip-icon': { color: '#ffffff' }
                          })
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>

              {/* Date of Birth & Age Preview */}
              <Grid item xs={12} sm={6}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                      Date of Birth
                    </Typography>
                    {currentAge !== null && (
                      <Chip
                        label={`${currentAge} years old`}
                        size="small"
                        icon={<CakeIcon sx={{ fontSize: 13 }} />}
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          bgcolor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)',
                          color: isDark ? '#34D399' : '#059669'
                        }}
                      />
                    )}
                  </Box>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 700 } }}
                  />
                </Box>
              </Grid>

              {/* Phone Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Phone Number"
                  fullWidth
                  size="small"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ fontSize: 18, color: '#64748b' }} />
                      </InputAdornment>
                    )
                  }}
                  placeholder="+91 9876543210"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 700 } }}
                />
              </Grid>

              {/* Email Address */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  size="small"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ fontSize: 18, color: '#64748b' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 700 } }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />

          {/* Section 2: Address & Emergency Details */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: isDark ? '#34D399' : '#059669',
                mb: 1.5,
                textTransform: 'uppercase',
                fontSize: '0.72rem',
                letterSpacing: 0.5
              }}
            >
              2. Address & Emergency Details
            </Typography>

            <Grid container spacing={2}>
              {/* Full Address */}
              <Grid item xs={12}>
                <TextField
                  label="Residential Address"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <HomeIcon sx={{ fontSize: 18, color: '#64748b' }} />
                      </InputAdornment>
                    )
                  }}
                  placeholder="Street address, apartment, city, state, postal code"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', fontWeight: 600 } }}
                />
              </Grid>

              {/* Blood Group */}
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="blood-type-label">Blood Group</InputLabel>
                  <Select
                    labelId="blood-type-label"
                    label="Blood Group"
                    value={formData.bloodType}
                    onChange={(e) => setFormData(prev => ({ ...prev, bloodType: e.target.value }))}
                    sx={{ borderRadius: '12px', fontWeight: 700 }}
                  >
                    <MenuItem value="">
                      <em>Unknown / Not Specified</em>
                    </MenuItem>
                    {BLOOD_GROUPS.map(bg => (
                      <MenuItem key={bg} value={bg} sx={{ fontWeight: 700 }}>
                        🩸 {bg}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Emergency Contact Name */}
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Emergency Contact Name"
                  fullWidth
                  size="small"
                  value={formData.emergencyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyName: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 700 } }}
                />
              </Grid>

              {/* Emergency Contact Relationship */}
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Relationship"
                  fullWidth
                  size="small"
                  value={formData.emergencyRelationship}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyRelationship: e.target.value }))}
                  placeholder="e.g. Spouse, Parent"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 700 } }}
                />
              </Grid>

              {/* Emergency Contact Phone */}
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Emergency Contact Phone"
                  fullWidth
                  size="small"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 700 } }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />

          {/* Section 3: Clinical Highlights */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: isDark ? '#34D399' : '#059669',
                mb: 1.5,
                textTransform: 'uppercase',
                fontSize: '0.72rem',
                letterSpacing: 0.5
              }}
            >
              3. Clinical Highlights
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Known Allergies"
                  fullWidth
                  size="small"
                  value={formData.allergies}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder="e.g. Penicillin, Peanuts, Dust (comma separated)"
                  helperText="Separate multiple allergies with commas"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 600 } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Medical History / Chronic Conditions"
                  fullWidth
                  size="small"
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                  placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma"
                  helperText="Key pre-existing medical conditions"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 600 } }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Button
            onClick={onClose}
            disabled={loading}
            variant="text"
            sx={{ fontWeight: 700, textTransform: 'none', color: '#64748b' }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              borderRadius: '14px',
              fontWeight: 800,
              textTransform: 'none',
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)'
              }
            }}
          >
            {loading ? 'Saving Changes...' : 'Save Patient Profile'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditPatientProfileModal;
