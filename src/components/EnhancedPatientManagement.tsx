'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  Stack,
  Divider,
  Avatar,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  LocalPharmacy as PharmacyIcon,
  Bloodtype as BloodIcon,
  ContactEmergency as EmergencyIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Cake as CakeIcon,
  Visibility as VisibilityIcon,
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { prescriptionsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../types/auth';
import {
  getManagedPatients,
  getPatientMedicalDetails,
  updatePatientMedicalInfo
} from '../services/patients';interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  dateOfBirth: string;
  contactNumber: string;
  address: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string[];
  bloodType?: string;
  insurance?: string;
}

interface EnhancedPatient extends Omit<Patient, 'medicalHistory'> {
  prescriptionHistory?: any[];
  totalPrescriptions?: number;
  latestPrescription?: any;
  activePrescriptions?: number;
  completedPrescriptions?: number;
  allMedications?: any[];
  diagnoses?: string[];
  allergies?: string[];
  medicalHistory?: string[];
  emergencyContact?: any;
  bloodType?: string;
  insurance?: any;
}

interface FollowUpAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  diagnosis: string;
  followUpDate: string;
  daysUntil: number;
  isToday: boolean;
  isUpcoming: boolean;
}

const EnhancedPatientManagement: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<EnhancedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<EnhancedPatient | null>(null);
  const [medicalDetailsOpen, setMedicalDetailsOpen] = useState(false);
  const [medicalDetails, setMedicalDetails] = useState<any>(null);
  const [medicalDetailsLoading, setMedicalDetailsLoading] = useState(false);
  const [editMedicalOpen, setEditMedicalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState<FollowUpAppointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<FollowUpAppointment[]>([]);
  const [medicalFormData, setMedicalFormData] = useState({
    allergies: [] as string[],
    medicalHistory: [] as string[],
    emergencyContact: { name: '', phone: '', relationship: '' },
    bloodType: '',
    insurance: { provider: '', policyNumber: '', groupNumber: '' }
  });

  // Fetch managed patients and appointments on component mount
  useEffect(() => {
    fetchManagedPatients();
    fetchFollowUpAppointments();
  }, []);

  const fetchFollowUpAppointments = async () => {
    try {
      const prescriptions = await prescriptionsAPI.getMyPrescriptions();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const appointmentsWithFollowUp: FollowUpAppointment[] = [];
      
      prescriptions.forEach((rx: any) => {
        if (rx.followUpDate) {
          const followUp = new Date(rx.followUpDate);
          followUp.setHours(0, 0, 0, 0);
          
          const diffTime = followUp.getTime() - today.getTime();
          const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Include today and next 7 days
          if (daysUntil >= 0 && daysUntil <= 7) {
            appointmentsWithFollowUp.push({
              id: rx.id || rx._id,
              patientId: rx.patientId,
              patientName: rx.patientName || 'Unknown Patient',
              patientEmail: rx.patientEmail || '',
              diagnosis: rx.diagnosis,
              followUpDate: rx.followUpDate,
              daysUntil,
              isToday: daysUntil === 0,
              isUpcoming: daysUntil > 0 && daysUntil <= 7
            });
          }
        }
      });
      
      // Sort by date
      appointmentsWithFollowUp.sort((a, b) => a.daysUntil - b.daysUntil);
      
      setTodayAppointments(appointmentsWithFollowUp.filter(a => a.isToday));
      setUpcomingAppointments(appointmentsWithFollowUp.filter(a => a.isUpcoming));
    } catch (err) {
      console.error('Error fetching follow-up appointments:', err);
    }
  };

  const fetchManagedPatients = async () => {
    try {
      setLoading(true);
      const data = await getManagedPatients();
      setPatients(data as EnhancedPatient[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching managed patients:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMedicalDetails = async (patient: EnhancedPatient) => {
    try {
      setMedicalDetailsLoading(true);
      setSelectedPatient(patient);
      const details = await getPatientMedicalDetails(patient.id);
      setMedicalDetails(details);
      setMedicalDetailsOpen(true);
    } catch (err) {
      console.error('Error fetching medical details:', err);
      setError('Failed to load medical details');
    } finally {
      setMedicalDetailsLoading(false);
    }
  };

  const handleEditMedicalInfo = (patient: EnhancedPatient) => {
    setSelectedPatient(patient);
    setMedicalFormData({
      allergies: patient.allergies || [],
      medicalHistory: patient.medicalHistory || [],
      emergencyContact: patient.emergencyContact || { name: '', phone: '', relationship: '' },
      bloodType: patient.bloodType || '',
      insurance: patient.insurance || { provider: '', policyNumber: '', groupNumber: '' }
    });
    setEditMedicalOpen(true);
  };

  const handleSaveMedicalInfo = async () => {
    if (!selectedPatient) return;

    try {
      await updatePatientMedicalInfo(selectedPatient.id, medicalFormData);
      setEditMedicalOpen(false);
      fetchManagedPatients();
    } catch (err) {
      console.error('Error updating medical info:', err);
      setError('Failed to update medical information');
    }
  };

  const handleAddAllergy = () => {
    const newAllergy = prompt('Enter new allergy:');
    if (newAllergy?.trim()) {
      setMedicalFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setMedicalFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const handleAddMedicalHistory = () => {
    const newHistory = prompt('Enter medical history item:');
    if (newHistory?.trim()) {
      setMedicalFormData(prev => ({
        ...prev,
        medicalHistory: [...prev.medicalHistory, newHistory.trim()]
      }));
    }
  };

  const handleRemoveMedicalHistory = (index: number) => {
    setMedicalFormData(prev => ({
      ...prev,
      medicalHistory: prev.medicalHistory.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString();
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
      {/* Today's Appointments Alert */}
      {todayAppointments.length > 0 && (
        <Alert 
          severity="warning" 
          icon={<TodayIcon />}
          sx={{ mb: 3 }}
          action={
            <Chip label={`${todayAppointments.length}`} color="warning" size="small" />
          }
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Today's Follow-up Appointments
          </Typography>
        </Alert>
      )}

      {/* Today's Appointments Section */}
      {todayAppointments.length > 0 && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            border: '2px solid #ff9800'
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <TodayIcon color="warning" fontSize="large" />
            <Typography variant="h5" color="warning.dark" fontWeight="bold">
              Today's Appointments ({todayAppointments.length})
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {todayAppointments.map((apt) => (
              <Grid item xs={12} sm={6} md={4} key={apt.id}>
                <Card sx={{ bgcolor: 'white', boxShadow: 2 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {apt.patientName}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {apt.patientEmail}
                    </Typography>
                    <Chip 
                      label={apt.diagnosis} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <ScheduleIcon fontSize="small" color="warning" />
                      <Typography variant="caption" color="warning.dark" fontWeight="bold">
                        Follow-up TODAY
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Upcoming Appointments Section (Next 7 Days) */}
      {upcomingAppointments.length > 0 && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4, 
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            border: '1px solid #2196f3'
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <NotificationsIcon color="info" fontSize="large" />
            <Typography variant="h6" color="info.dark" fontWeight="bold">
              Upcoming Appointments - Next 7 Days ({upcomingAppointments.length})
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {upcomingAppointments.map((apt) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={apt.id}>
                <Card sx={{ bgcolor: 'white', boxShadow: 1 }}>
                  <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="subtitle2" fontWeight="bold" noWrap>
                      {apt.patientName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                      {apt.diagnosis}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <ScheduleIcon fontSize="small" color="info" />
                      <Typography variant="caption" color="info.dark" fontWeight="bold">
                        {apt.daysUntil === 1 ? 'Tomorrow' : `In ${apt.daysUntil} days`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {formatDate(apt.followUpDate)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Patients Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {patients.length} {patients.length === 1 ? 'patient' : 'patients'} under your care
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {patients.length === 0 ? (
        <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No patients yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Patients will appear here after you create prescriptions for them.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {patients.map((patient) => (
            <Grid item xs={12} sm={6} md={4} key={patient.id}>
              <Card 
                elevation={3} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Patient Header */}
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main', 
                        width: 56, 
                        height: 56, 
                        mr: 2 
                      }}
                    >
                      <PersonIcon fontSize="large" />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div">
                        {patient.firstName} {patient.lastName}
                      </Typography>
                      <Chip 
                        label="Patient" 
                        size="small" 
                        color="secondary" 
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Contact Information */}
                  <Stack spacing={1.5} mb={2}>
                    <Box display="flex" alignItems="center">
                      <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" noWrap>
                        {patient.email}
                      </Typography>
                    </Box>
                    
                    {patient.contactNumber && (
                      <Box display="flex" alignItems="center">
                        <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {patient.contactNumber}
                        </Typography>
                      </Box>
                    )}

                    <Box display="flex" alignItems="center">
                      <CakeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {formatDate(patient.dateOfBirth)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  {/* Prescription Stats */}
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Prescription Summary
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Chip
                        icon={<PharmacyIcon />}
                        label={`${patient.totalPrescriptions || 0} Total`}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        icon={<AssignmentIcon />}
                        label={`${patient.activePrescriptions || 0} Active`}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    </Stack>
                  </Box>

                  {/* Latest Prescription */}
                  {patient.latestPrescription && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Latest Treatment
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          {patient.latestPrescription.diagnosis}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(patient.latestPrescription.createdAt)}
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  {/* Medical Alerts */}
                  {patient.allergies && patient.allergies.length > 0 && (
                    <Box mt={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <WarningIcon fontSize="small" color="warning" />
                        <Typography variant="caption" color="warning.main">
                          {patient.allergies.length} {patient.allergies.length === 1 ? 'Allergy' : 'Allergies'}
                        </Typography>
                      </Stack>
                    </Box>
                  )}

                  {patient.bloodType && (
                    <Box mt={1}>
                      <Chip
                        icon={<BloodIcon />}
                        label={`Blood: ${patient.bloodType}`}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </Box>
                  )}
                </CardContent>

                <Divider />

                {/* Action Buttons */}
                <CardActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewMedicalDetails(patient)}
                    fullWidth
                  >
                    View Details
                  </Button>
                  
                  {Boolean(patient.totalPrescriptions && patient.totalPrescriptions > 0) && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PharmacyIcon />}
                      onClick={() => navigate('/prescriptions/all')}
                      fullWidth
                    >
                      View Prescriptions
                    </Button>
                  )}
                  
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditMedicalInfo(patient)}
                    fullWidth
                  >
                    Edit Medical Info
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Medical Details Dialog */}
      <Dialog 
        open={medicalDetailsOpen} 
        onClose={() => setMedicalDetailsOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          Medical Details - {selectedPatient?.firstName} {selectedPatient?.lastName}
        </DialogTitle>
        <DialogContent>
          {medicalDetailsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : medicalDetails && (
            <Box>
              <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Prescription History" />
                <Tab label="Medical Information" />
              </Tabs>

              {tabValue === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Treatment Summary
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Total Prescriptions: <strong>{medicalDetails.totalPrescriptions}</strong>
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Active Prescriptions: <strong>{medicalDetails.activePrescriptions}</strong>
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Completed: <strong>{medicalDetails.completedPrescriptions}</strong>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Medical Alerts
                        </Typography>
                        {medicalDetails.allergies && medicalDetails.allergies.length > 0 ? (
                          medicalDetails.allergies.map((allergy: string, index: number) => (
                            <Chip 
                              key={`allergy-view-${allergy}-${index}`} 
                              label={allergy} 
                              color="warning" 
                              size="small" 
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No known allergies
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Prescription History
                  </Typography>
                  {medicalDetails.prescriptionHistory && medicalDetails.prescriptionHistory.length > 0 ? (
                    medicalDetails.prescriptionHistory.map((prescription: any, index: number) => (
                      <Accordion key={prescription.id}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box display="flex" justifyContent="space-between" width="100%">
                            <Typography variant="body1">
                              {prescription.diagnosis}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDateTime(prescription.createdAt)}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" gutterBottom>
                                Medications:
                              </Typography>
                              <List dense>
                                {prescription.medications.map((med: any, medIndex: number) => (
                                  <ListItem key={`${prescription.id}-med-${med.name}-${medIndex}`}>
                                    <ListItemText 
                                      primary={med.name}
                                      secondary={`${med.dosage} - ${med.frequency} for ${med.duration}`}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" gutterBottom>
                                Notes:
                              </Typography>
                              <Typography variant="body2">
                                {prescription.notes || 'No additional notes'}
                              </Typography>
                              <Box mt={2}>
                                <Chip 
                                  label={prescription.status}
                                  color={prescription.status === 'active' ? 'success' : 'default'}
                                  size="small"
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  ) : (
                    <Typography color="text.secondary">
                      No prescription history available
                    </Typography>
                  )}
                </Box>
              )}

              {tabValue === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <BloodIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Medical Information
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Blood Type: <strong>{medicalDetails.bloodType || 'Not specified'}</strong>
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                          Medical History:
                        </Typography>
                        {medicalDetails.medicalHistory && medicalDetails.medicalHistory.length > 0 ? (
                          <List dense>
                            {medicalDetails.medicalHistory.map((history: string, index: number) => (
                              <ListItem key={`history-view-${history}-${index}`}>
                                <ListItemText primary={history} />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No medical history recorded
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <EmergencyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Emergency Contact
                        </Typography>
                        {medicalDetails.emergencyContact ? (
                          <Box>
                            <Typography variant="body2">
                              Name: <strong>{medicalDetails.emergencyContact.name}</strong>
                            </Typography>
                            <Typography variant="body2">
                              Phone: <strong>{medicalDetails.emergencyContact.phone}</strong>
                            </Typography>
                            <Typography variant="body2">
                              Relationship: <strong>{medicalDetails.emergencyContact.relationship}</strong>
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No emergency contact specified
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMedicalDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Medical Information Dialog */}
      <Dialog 
        open={editMedicalOpen} 
        onClose={() => setEditMedicalOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Edit Medical Information - {selectedPatient?.firstName} {selectedPatient?.lastName}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Allergies:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {medicalFormData.allergies.map((allergy, index) => (
                  <Chip
                    key={`form-allergy-${allergy}-${index}`}
                    label={allergy}
                    color="warning"
                    onDelete={() => handleRemoveAllergy(index)}
                  />
                ))}
                <Button size="small" onClick={handleAddAllergy}>
                  Add Allergy
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Medical History:
              </Typography>
              <Box display="flex" flexDirection="column" gap={1} mb={2}>
                {medicalFormData.medicalHistory.map((history, index) => (
                  <Chip
                    key={`form-history-${history}-${index}`}
                    label={history}
                    onDelete={() => handleRemoveMedicalHistory(index)}
                  />
                ))}
                <Button size="small" onClick={handleAddMedicalHistory}>
                  Add Medical History
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Blood Type"
                value={medicalFormData.bloodType}
                onChange={(e) => setMedicalFormData(prev => ({ ...prev, bloodType: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Emergency Contact:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Name"
                value={medicalFormData.emergencyContact.name}
                onChange={(e) => setMedicalFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Phone"
                value={medicalFormData.emergencyContact.phone}
                onChange={(e) => setMedicalFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Relationship"
                value={medicalFormData.emergencyContact.relationship}
                onChange={(e) => setMedicalFormData(prev => ({ 
                  ...prev, 
                  emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMedicalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveMedicalInfo} variant="contained">
            Save Medical Information
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedPatientManagement;