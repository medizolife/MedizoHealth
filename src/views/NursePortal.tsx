import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Avatar,
  Tab,
  Tabs,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton
} from '@mui/material';
import HealingIcon from '@mui/icons-material/Healing';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { useAuth } from '../contexts/AuthContext';
import { healthcareApi } from '../services/healthcareExtensionsApi';

export default function NursePortal() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [patients, setPatients] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Record visit dialog
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [visitForm, setVisitForm] = useState({
    bpSystolic: 120,
    bpDiastolic: 80,
    pulseRate: 72,
    temperature: 98.6,
    spo2: 98,
    bloodSugar: 100,
    symptoms: '',
    procedures: '',
    medications: '',
    careNotes: '',
    patientCondition: 'stable'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patientsRes, scheduleRes] = await Promise.all([
        healthcareApi.getNurseAssignedPatients(),
        healthcareApi.getNurseSchedule()
      ]);
      if (patientsRes.success) setPatients(patientsRes.assignments || []);
      if (scheduleRes.success) setSchedules(scheduleRes.schedules || []);
    } catch (err) {
      console.error('Error fetching nurse portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateScheduleStatus = async (scheduleId: string, status: string) => {
    try {
      const res = await healthcareApi.updateScheduleStatus(scheduleId, status);
      if (res.success) {
        setToast(`Visit status updated to "${status.replace('_', ' ').toUpperCase()}"`);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleSaveVisitNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    try {
      const res = await healthcareApi.recordVisitDetails({
        scheduleId: selectedSchedule.id,
        homeCareRequestId: selectedSchedule.homeCareRequestId,
        patientId: selectedSchedule.patientId,
        vitals: {
          bpSystolic: Number(visitForm.bpSystolic),
          bpDiastolic: Number(visitForm.bpDiastolic),
          pulseRate: Number(visitForm.pulseRate),
          temperature: Number(visitForm.temperature),
          spo2: Number(visitForm.spo2),
          bloodSugar: Number(visitForm.bloodSugar)
        },
        symptomsObserved: visitForm.symptoms ? visitForm.symptoms.split(',').map(s => s.trim()) : [],
        proceduresPerformed: visitForm.procedures ? visitForm.procedures.split(',').map(p => p.trim()) : [],
        medicationsAdministered: visitForm.medications ? visitForm.medications.split(',').map(m => m.trim()) : [],
        careNotes: visitForm.careNotes,
        patientCondition: visitForm.patientCondition
      });

      if (res.success) {
        // Also mark schedule completed
        await healthcareApi.updateScheduleStatus(selectedSchedule.id, 'completed');
        setToast('Visit notes and vitals recorded successfully!');
        setVisitDialogOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record visit details');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '85vh' }}>
      {/* Header Banner */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: '20px', background: 'linear-gradient(135deg, #132724 0%, #0D1F1C 100%)', border: '1px solid rgba(0,200,150,0.2)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: '#00C896', color: '#0B1315', fontWeight: 900, fontSize: '1.5rem', boxShadow: '0 0 16px rgba(0,200,150,0.4)' }}>
              {user?.firstName?.charAt(0) || 'N'}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#EBF5F3' }}>
                Nurse Practitioner Portal
              </Typography>
              <Typography variant="body2" sx={{ color: '#00C896', fontWeight: 700 }}>
                {user?.firstName} {user?.lastName} • {user?.nurseSpecialization || 'Clinical Care Specialist'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A8A3' }}>
                License: {user?.nurseLicenseNumber || 'RN-ACTIVE'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={fetchData}
            startIcon={<RefreshIcon />}
            sx={{ color: '#00C896', borderColor: 'rgba(0,200,150,0.4)', borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {toast && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px', bgcolor: 'rgba(0,200,150,0.15)', color: '#00C896', border: '1px solid rgba(0,200,150,0.3)' }} onClose={() => setToast('')}>
          {toast}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3, bgcolor: '#131F22', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Tabs
          value={tab}
          onChange={(e, val) => setTab(val)}
          textColor="inherit"
          indicatorColor="primary"
          sx={{
            '& .MuiTabs-indicator': { bgcolor: '#00C896', height: 3 },
            '& .MuiTab-root': { color: '#94A8A3', fontWeight: 700, textTransform: 'none', py: 2, '&.Mui-selected': { color: '#00C896' } }
          }}
        >
          <Tab icon={<CalendarMonthIcon sx={{ mr: 1 }} />} iconPosition="start" label={`Care Visits Schedule (${schedules.length})`} />
          <Tab icon={<PersonIcon sx={{ mr: 1 }} />} iconPosition="start" label={`My Assigned Patients (${patients.length})`} />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ p: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: '#00C896' }} />
        </Box>
      ) : tab === 0 ? (
        /* Visits Schedule Tab */
        <Grid container spacing={2}>
          {schedules.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#131F22', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography sx={{ color: '#94A8A3' }}>No care visits scheduled for today.</Typography>
              </Paper>
            </Grid>
          ) : (
            schedules.map((s) => {
              const isCompleted = s.status === 'completed';
              return (
                <Grid item xs={12} md={6} key={s.id}>
                  <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: '#131F22', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#EBF5F3' }}>
                          {s.serviceType}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#00C896', fontWeight: 700 }}>
                          Patient: {s.patientFirstName} {s.patientLastName}
                        </Typography>
                      </Box>
                      <Chip
                        label={(s.status || 'pending').replace('_', ' ').toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: isCompleted ? 'rgba(76,175,80,0.15)' : s.status === 'in_progress' ? 'rgba(0,188,212,0.15)' : 'rgba(255,152,0,0.15)',
                          color: isCompleted ? '#4CAF50' : s.status === 'in_progress' ? '#00BCD4' : '#FF9800',
                          fontWeight: 800
                        }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#94A8A3', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarMonthIcon sx={{ fontSize: '1rem', color: '#00C896' }} />
                      {new Date(s.startDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#94A8A3', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocationOnIcon sx={{ fontSize: '1rem', color: '#00C896' }} />
                      {s.locationAddress}
                    </Typography>

                    {s.patientPhone && (
                      <Typography variant="body2" sx={{ color: '#94A8A3', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <PhoneIcon sx={{ fontSize: '1rem', color: '#00C896' }} />
                        {s.patientPhone}
                      </Typography>
                    )}

                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                      {s.status === 'scheduled' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DirectionsCarIcon />}
                          onClick={() => handleUpdateScheduleStatus(s.id, 'en_route')}
                          sx={{ color: '#2196F3', borderColor: 'rgba(33,150,243,0.4)', borderRadius: '10px', textTransform: 'none' }}
                        >
                          Mark En Route
                        </Button>
                      )}
                      {(s.status === 'scheduled' || s.status === 'en_route') && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => handleUpdateScheduleStatus(s.id, 'in_progress')}
                          sx={{ color: '#00BCD4', borderColor: 'rgba(0,188,212,0.4)', borderRadius: '10px', textTransform: 'none' }}
                        >
                          Start Visit
                        </Button>
                      )}
                      {s.status === 'in_progress' && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<NoteAddIcon />}
                          onClick={() => {
                            setSelectedSchedule(s);
                            setVisitDialogOpen(true);
                          }}
                          sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, borderRadius: '10px', textTransform: 'none', '&:hover': { bgcolor: '#00A87E' } }}
                        >
                          Capture Vitals & Notes
                        </Button>
                      )}
                      {isCompleted && (
                        <Chip
                          icon={<CheckCircleIcon sx={{ color: '#4CAF50 !important' }} />}
                          label="Visit Completed & Recorded"
                          size="small"
                          sx={{ bgcolor: 'rgba(76,175,80,0.1)', color: '#4CAF50', fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })
          )}
        </Grid>
      ) : (
        /* Assigned Patients Tab */
        <Grid container spacing={2}>
          {patients.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#131F22', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography sx={{ color: '#94A8A3' }}>No patient care tasks currently assigned.</Typography>
              </Paper>
            </Grid>
          ) : (
            patients.map((p) => (
              <Grid item xs={12} md={6} key={p.id}>
                <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: '#131F22', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800 }}>
                      {p.patientFirstName?.charAt(0) || 'P'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#EBF5F3' }}>
                        {p.patientFirstName} {p.patientLastName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#00C896', fontWeight: 600 }}>
                        Task: {p.assignmentType?.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                    </Box>
                  </Box>

                  {p.diseaseCondition && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#94A8A3' }}>Condition:</Typography>
                      <Typography variant="body2" sx={{ color: '#EBF5F3', fontWeight: 600 }}>{p.diseaseCondition}</Typography>
                    </Box>
                  )}

                  <Typography variant="body2" sx={{ color: '#94A8A3', mb: 1 }}>
                    <strong>Address:</strong> {p.patientAddress || 'Home Care Address'}
                  </Typography>

                  {p.specialInstructions && (
                    <Paper sx={{ p: 1.5, mb: 2, bgcolor: '#0B1315', borderRadius: '10px' }}>
                      <Typography variant="caption" sx={{ color: '#00C896', fontWeight: 700 }}>Doctor's Instructions:</Typography>
                      <Typography variant="body2" sx={{ color: '#EBF5F3' }}>{p.specialInstructions}</Typography>
                    </Paper>
                  )}

                  <Chip
                    label={`FREQUENCY: ${p.frequency?.toUpperCase() || 'DAILY'}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(0,200,150,0.15)', color: '#00C896', fontWeight: 700 }}
                  />
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Capture Vitals & Care Notes Modal */}
      <Dialog open={visitDialogOpen} onClose={() => setVisitDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#131F22', color: '#EBF5F3', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <form onSubmit={handleSaveVisitNotes}>
          <DialogTitle sx={{ fontWeight: 800, color: '#EBF5F3', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            Record Clinical Vitals & Visit Notes
          </DialogTitle>
          <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#00C896', fontWeight: 700 }}>
              Patient: {selectedSchedule?.patientFirstName} {selectedSchedule?.patientLastName}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Systolic BP (mmHg)" type="number" fullWidth value={visitForm.bpSystolic} onChange={(e) => setVisitForm({ ...visitForm, bpSystolic: Number(e.target.value) })} sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Diastolic BP (mmHg)" type="number" fullWidth value={visitForm.bpDiastolic} onChange={(e) => setVisitForm({ ...visitForm, bpDiastolic: Number(e.target.value) })} sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Pulse (bpm)" type="number" fullWidth value={visitForm.pulseRate} onChange={(e) => setVisitForm({ ...visitForm, pulseRate: Number(e.target.value) })} sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Temperature (°F)" type="number" fullWidth value={visitForm.temperature} onChange={(e) => setVisitForm({ ...visitForm, temperature: Number(e.target.value) })} sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="SpO2 (%)" type="number" fullWidth value={visitForm.spo2} onChange={(e) => setVisitForm({ ...visitForm, spo2: Number(e.target.value) })} sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Blood Sugar (mg/dL)" type="number" fullWidth value={visitForm.bloodSugar} onChange={(e) => setVisitForm({ ...visitForm, bloodSugar: Number(e.target.value) })} sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }} />
              </Grid>
            </Grid>

            <TextField
              label="Procedures Performed (e.g. Dressing changed, IV administered)"
              fullWidth
              value={visitForm.procedures}
              onChange={(e) => setVisitForm({ ...visitForm, procedures: e.target.value })}
              sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }}
            />

            <TextField
              label="Clinical Care Notes & Observations"
              fullWidth
              required
              multiline
              rows={3}
              value={visitForm.careNotes}
              onChange={(e) => setVisitForm({ ...visitForm, careNotes: e.target.value })}
              sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Button onClick={() => setVisitDialogOpen(false)} sx={{ color: '#94A8A3' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, '&:hover': { bgcolor: '#00A87E' } }}>
              Submit Visit Record
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}
