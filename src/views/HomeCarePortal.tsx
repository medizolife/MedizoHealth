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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HealingIcon from '@mui/icons-material/Healing';

import { useAuth } from '../contexts/AuthContext';
import { healthcareApi } from '../services/healthcareExtensionsApi';

export default function HomeCarePortal() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [affiliatedNurses, setAffiliatedNurses] = useState<any[]>([]);

  // Request modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    serviceType: 'general_checkup',
    urgency: 'routine',
    preferredDate: '',
    preferredTimeSlot: 'morning',
    address: user?.address || '',
    contactPhone: user?.phone || user?.contactNumber || '',
    clinicalInstructions: ''
  });

  // Assign nurse modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedNurseId, setSelectedNurseId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await healthcareApi.getHomeCareRequests();
      if (res.success) setRequests(res.requests || []);

      if (user?.role === 'doctor' || user?.role === 'admin') {
        const nurseRes = await healthcareApi.getDoctorAffiliatedNurses();
        if (nurseRes.success) setAffiliatedNurses(nurseRes.nurses || []);
      }
    } catch (err) {
      console.error('Error fetching home care requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAssign = (reqItem: any) => {
    setSelectedRequest(reqItem);
    setSelectedNurseId('');
    setAssignModalOpen(true);
  };

  const handleAssignNurse = async () => {
    if (!selectedRequest || !selectedNurseId) {
      alert('Please select a nurse to assign');
      return;
    }
    try {
      setAssigning(true);
      const res = await healthcareApi.assignNurseToRequest(selectedRequest.id, selectedNurseId);
      if (res.success) {
        setToast(`Nurse successfully assigned to request #${selectedRequest.requestNumber}!`);
        setAssignModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign nurse');
    } finally {
      setAssigning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address || !form.contactPhone) {
      alert('Please fill address and contact phone number');
      return;
    }

    try {
      const res = await healthcareApi.requestHomeCare(form);
      if (res.success) {
        setToast(`Home care request ${res.request.requestNumber} submitted successfully!`);
        setModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit request');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '85vh' }}>
      {/* Header Banner */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: '20px', background: 'linear-gradient(135deg, #132724 0%, #0D1F1C 100%)', border: '1px solid rgba(0,200,150,0.2)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: '#00C896', color: '#0B1315', fontWeight: 900, fontSize: '1.5rem', boxShadow: '0 0 16px rgba(0,200,150,0.4)' }}>
              <HomeWorkIcon sx={{ fontSize: '2rem' }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#EBF5F3' }}>
                Home Care & Checkup Portal
              </Typography>
              <Typography variant="body2" sx={{ color: '#00C896', fontWeight: 700 }}>
                Request professional nurse visits and vital checkups at your home
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={fetchData}
              startIcon={<RefreshIcon />}
              sx={{ color: '#00C896', borderColor: 'rgba(0,200,150,0.4)', borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              onClick={() => setModalOpen(true)}
              startIcon={<AddCircleOutlineIcon />}
              sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, borderRadius: '12px', textTransform: 'none', '&:hover': { bgcolor: '#00A87E' } }}
            >
              Request Home Visit
            </Button>
          </Box>
        </Box>
      </Paper>

      {toast && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px', bgcolor: 'rgba(0,200,150,0.15)', color: '#00C896', border: '1px solid rgba(0,200,150,0.3)' }} onClose={() => setToast('')}>
          {toast}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ p: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: '#00C896' }} />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {requests.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#131F22', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography sx={{ color: '#94A8A3' }}>No home care visits requested yet.</Typography>
              </Paper>
            </Grid>
          ) : (
            requests.map((r) => (
              <Grid item xs={12} md={6} key={r.id}>
                <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: '#131F22', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography sx={{ color: '#00C896', fontWeight: 800, fontFamily: 'monospace' }}>
                      {r.requestNumber}
                    </Typography>
                    <Chip label={(r.status || 'pending').toUpperCase()} size="small" sx={{ bgcolor: r.status === 'completed' ? 'rgba(76,175,80,0.15)' : 'rgba(255,152,0,0.15)', color: r.status === 'completed' ? '#4CAF50' : '#FF9800', fontWeight: 800 }} />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#EBF5F3' }}>
                    {r.serviceType?.replace(/_/g, ' ').toUpperCase()}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#94A8A3', mb: 1 }}>
                    <strong>Address:</strong> {r.address}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#94A8A3', mb: 2 }}>
                    <strong>Preferred Slot:</strong> {r.preferredDate || 'Earliest available'} ({r.preferredTimeSlot || 'Morning'})
                  </Typography>

                  {r.nurseFirstName ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#0B1315', borderRadius: '10px' }}>
                      <HealingIcon sx={{ color: '#00C896' }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94A8A3' }}>Assigned Nurse Practitioner:</Typography>
                        <Typography variant="body2" sx={{ color: '#00C896', fontWeight: 700 }}>
                          {r.nurseFirstName} {r.nurseLastName} {r.nursePhone && `(${r.nursePhone})`}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (user?.role === 'doctor' || user?.role === 'admin') && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<HealingIcon />}
                      onClick={() => handleOpenAssign(r)}
                      sx={{ color: '#00C896', borderColor: 'rgba(0,200,150,0.4)', borderRadius: '10px', textTransform: 'none', fontWeight: 700, mt: 1 }}
                    >
                      Assign Nurse Practitioner
                    </Button>
                  )}
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Assign Nurse Dialog */}
      <Dialog open={assignModalOpen} onClose={() => setAssignModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: '#131F22', color: '#EBF5F3', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#EBF5F3', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          Assign Nurse to Request #{selectedRequest?.requestNumber}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#94A8A3' }}>
            Select an affiliated nurse practitioner to dispatch for this home care visit:
          </Typography>
          <FormControl fullWidth sx={{ bgcolor: '#0B1315', borderRadius: '12px' }}>
            <InputLabel sx={{ color: '#94A8A3' }}>Select Nurse</InputLabel>
            <Select
              value={selectedNurseId}
              label="Select Nurse"
              onChange={(e) => setSelectedNurseId(e.target.value)}
              sx={{ color: '#EBF5F3' }}
            >
              {affiliatedNurses.length === 0 ? (
                <MenuItem disabled value="">No affiliated nurses found</MenuItem>
              ) : (
                affiliatedNurses.map((n) => (
                  <MenuItem key={n.id} value={n.id}>
                    {n.firstName} {n.lastName} {n.specialization ? `(${n.specialization})` : ''}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button onClick={() => setAssignModalOpen(false)} sx={{ color: '#94A8A3' }}>Cancel</Button>
          <Button 
            onClick={handleAssignNurse} 
            disabled={!selectedNurseId || assigning}
            variant="contained" 
            sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, '&:hover': { bgcolor: '#00A87E' } }}
          >
            {assigning ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Visit Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#131F22', color: '#EBF5F3', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800, color: '#EBF5F3', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            Request Home Care Nurse Visit
          </DialogTitle>
          <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth sx={{ bgcolor: '#0B1315', borderRadius: '12px' }}>
              <InputLabel sx={{ color: '#94A8A3' }}>Service Type</InputLabel>
              <Select
                value={form.serviceType}
                label="Service Type"
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                sx={{ color: '#EBF5F3' }}
              >
                <MenuItem value="general_checkup">General Health Checkup & Vitals</MenuItem>
                <MenuItem value="wound_care">Wound Care & Sterile Dressing</MenuItem>
                <MenuItem value="post_op_care">Post-Surgical Recovery Care</MenuItem>
                <MenuItem value="vitals_monitoring">Chronic Disease & BP/Sugar Monitoring</MenuItem>
                <MenuItem value="medication_administration">Medication Administration / Injections</MenuItem>
                <MenuItem value="elderly_care">Elderly & Mobility Support</MenuItem>
                <MenuItem value="physiotherapy">In-Home Physiotherapy</MenuItem>
                <MenuItem value="palliative_care">Palliative & Supportive Care</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Preferred Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }} />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth sx={{ bgcolor: '#0B1315', borderRadius: '12px' }}>
                  <InputLabel sx={{ color: '#94A8A3' }}>Time Slot</InputLabel>
                  <Select
                    value={form.preferredTimeSlot}
                    label="Time Slot"
                    onChange={(e) => setForm({ ...form, preferredTimeSlot: e.target.value })}
                    sx={{ color: '#EBF5F3' }}
                  >
                    <MenuItem value="morning">Morning (8am - 12pm)</MenuItem>
                    <MenuItem value="afternoon">Afternoon (12pm - 4pm)</MenuItem>
                    <MenuItem value="evening">Evening (4pm - 8pm)</MenuItem>
                    <MenuItem value="anytime">Anytime</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField label="Home Address (Required)" fullWidth required multiline rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }} />
            <TextField label="Contact Phone Number" fullWidth required value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }} />
            <TextField label="Instructions or Symptoms for Nurse" fullWidth multiline rows={2} value={form.clinicalInstructions} onChange={(e) => setForm({ ...form, clinicalInstructions: e.target.value })} sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }} />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Button onClick={() => setModalOpen(false)} sx={{ color: '#94A8A3' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, '&:hover': { bgcolor: '#00A87E' } }}>
              Submit Request
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}
