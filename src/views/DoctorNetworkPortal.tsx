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
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { useAuth } from '../contexts/AuthContext';
import { healthcareApi } from '../services/healthcareExtensionsApi';
import api from '../services/api';

export default function DoctorNetworkPortal() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [network, setNetwork] = useState<any[]>([]);
  const [directory, setDirectory] = useState<any[]>([]);
  const [outgoingReferrals, setOutgoingReferrals] = useState<any[]>([]);
  const [incomingReferrals, setIncomingReferrals] = useState<any[]>([]);
  const [myPatients, setMyPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Referral Modal
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [referralForm, setReferralForm] = useState({
    patientId: '',
    referredDoctorId: '',
    reason: '',
    clinicalSummary: '',
    priority: 'routine'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [netRes, dirRes, outRes, inRes, patRes] = await Promise.all([
        healthcareApi.getDoctorNetwork(),
        healthcareApi.getDoctorDirectory(),
        healthcareApi.getOutgoingReferrals(),
        healthcareApi.getIncomingReferrals(),
        api.get('/users/patients/my-patients')
      ]);

      if (netRes.success) setNetwork(netRes.network || []);
      if (dirRes.success) setDirectory(dirRes.doctors || []);
      if (outRes.success) setOutgoingReferrals(outRes.referrals || []);
      if (inRes.success) setIncomingReferrals(inRes.referrals || []);
      if (patRes.data?.patients) setMyPatients(patRes.data.patients || []);
    } catch (err) {
      console.error('Error fetching doctor network data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnect = async (targetDoctorId: string) => {
    try {
      const res = await healthcareApi.connectDoctor(targetDoctorId);
      if (res.success) {
        setToast('Doctor added to your trusted network');
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to connect');
    }
  };

  const handleSendReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralForm.patientId || !referralForm.referredDoctorId || !referralForm.reason) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const res = await healthcareApi.createReferral(referralForm);
      if (res.success) {
        setToast('Patient referred successfully! The doctor has been notified.');
        setReferralDialogOpen(false);
        setReferralForm({ patientId: '', referredDoctorId: '', reason: '', clinicalSummary: '', priority: 'routine' });
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create referral');
    }
  };

  const handleUpdateReferralStatus = async (referralId: string, status: string) => {
    try {
      const res = await healthcareApi.updateReferralStatus(referralId, status);
      if (res.success) {
        setToast(`Referral status updated to "${status.toUpperCase()}"`);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update referral status');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '85vh' }}>
      {/* Header Banner */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: '20px', background: 'linear-gradient(135deg, #132724 0%, #0D1F1C 100%)', border: '1px solid rgba(0,200,150,0.2)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: '#00C896', color: '#0B1315', fontWeight: 900, fontSize: '1.5rem', boxShadow: '0 0 16px rgba(0,200,150,0.4)' }}>
              <HubIcon sx={{ fontSize: '2rem' }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#EBF5F3' }}>
                Doctor Network & Referral Hub
              </Typography>
              <Typography variant="body2" sx={{ color: '#00C896', fontWeight: 700 }}>
                Dr. {user?.firstName} {user?.lastName} • {user?.specialization || 'Medical Specialist'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A8A3' }}>
                {network.length} Doctors in Network • {outgoingReferrals.length} Outgoing Referrals
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
              onClick={() => setReferralDialogOpen(true)}
              startIcon={<SendIcon />}
              sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, borderRadius: '12px', textTransform: 'none', '&:hover': { bgcolor: '#00A87E' } }}
            >
              Refer Patient
            </Button>
          </Box>
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
          <Tab icon={<HubIcon sx={{ mr: 1 }} />} iconPosition="start" label={`My Network (${network.length})`} />
          <Tab icon={<PersonSearchIcon sx={{ mr: 1 }} />} iconPosition="start" label={`Doctors Directory (${directory.length})`} />
          <Tab icon={<SendIcon sx={{ mr: 1 }} />} iconPosition="start" label={`Outgoing Referrals (${outgoingReferrals.length})`} />
          <Tab icon={<SwapHorizIcon sx={{ mr: 1 }} />} iconPosition="start" label={`Incoming Referrals (${incomingReferrals.length})`} />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ p: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: '#00C896' }} />
        </Box>
      ) : tab === 0 ? (
        /* My Network Tab */
        <Grid container spacing={2}>
          {network.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#131F22', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography sx={{ color: '#94A8A3' }}>No doctors added to your network yet. Browse the directory to connect!</Typography>
              </Paper>
            </Grid>
          ) : (
            network.map((doc) => (
              <Grid item xs={12} md={6} key={doc.id}>
                <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: '#131F22', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800 }}>
                        {doc.firstName?.charAt(0) || 'D'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#EBF5F3' }}>
                          Dr. {doc.firstName} {doc.lastName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#00C896', fontWeight: 600 }}>
                          {doc.specialization || 'Physician'}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        setReferralForm(prev => ({ ...prev, referredDoctorId: doc.connectedDoctorId || doc.id }));
                        setReferralDialogOpen(true);
                      }}
                      sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, borderRadius: '10px', textTransform: 'none', '&:hover': { bgcolor: '#00A87E' } }}
                    >
                      Refer Patient
                    </Button>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#94A8A3' }}>
                    {doc.clinicName && `Clinic: ${doc.clinicName} • `} {doc.clinicAddress || 'Clinic Address'}
                  </Typography>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      ) : tab === 1 ? (
        /* Doctors Directory Tab */
        <Grid container spacing={2}>
          {directory.map((doc) => (
            <Grid item xs={12} md={6} key={doc.id}>
              <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: '#131F22', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800 }}>
                      {doc.firstName?.charAt(0) || 'D'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#EBF5F3' }}>
                        {doc.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#00C896', fontWeight: 600 }}>
                        {doc.specialization}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A8A3' }}>
                        {doc.clinicName || 'Medizo Clinic Network'}
                      </Typography>
                    </Box>
                  </Box>
                  {doc.isConnected ? (
                    <Chip label="In Network" size="small" sx={{ bgcolor: 'rgba(76,175,80,0.15)', color: '#4CAF50', fontWeight: 700 }} />
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PersonAddIcon />}
                      onClick={() => handleConnect(doc.id)}
                      sx={{ color: '#00C896', borderColor: 'rgba(0,200,150,0.4)', borderRadius: '10px', textTransform: 'none' }}
                    >
                      Add to Network
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : tab === 2 ? (
        /* Outgoing Referrals Tab */
        <Grid container spacing={2}>
          {outgoingReferrals.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#131F22', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography sx={{ color: '#94A8A3' }}>No outgoing patient referrals sent yet.</Typography>
              </Paper>
            </Grid>
          ) : (
            outgoingReferrals.map((r) => (
              <Grid item xs={12} md={6} key={r.id}>
                <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: '#131F22', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography sx={{ color: '#00C896', fontWeight: 800, fontFamily: 'monospace' }}>
                      {r.referralNumber}
                    </Typography>
                    <Chip label={r.status.toUpperCase()} size="small" sx={{ bgcolor: 'rgba(0,200,150,0.15)', color: '#00C896', fontWeight: 800 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#EBF5F3' }}>
                    Referred to: Dr. {r.referredDoctorFirstName} {r.referredDoctorLastName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A8A3', mb: 1 }}>
                    Patient: <strong>{r.patientFirstName} {r.patientLastName}</strong>
                  </Typography>
                  <Paper sx={{ p: 1.5, bgcolor: '#0B1315', borderRadius: '10px', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#00C896', fontWeight: 700 }}>Reason:</Typography>
                    <Typography variant="body2" sx={{ color: '#EBF5F3' }}>{r.reason}</Typography>
                  </Paper>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      ) : (
        /* Incoming Referrals Tab */
        <Grid container spacing={2}>
          {incomingReferrals.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#131F22', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography sx={{ color: '#94A8A3' }}>No incoming patient referrals received.</Typography>
              </Paper>
            </Grid>
          ) : (
            incomingReferrals.map((r) => (
              <Grid item xs={12} md={6} key={r.id}>
                <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: '#131F22', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography sx={{ color: '#00C896', fontWeight: 800, fontFamily: 'monospace' }}>
                      {r.referralNumber}
                    </Typography>
                    <Chip label={r.status.toUpperCase()} size="small" sx={{ bgcolor: 'rgba(0,200,150,0.15)', color: '#00C896', fontWeight: 800 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#EBF5F3' }}>
                    Referred by: Dr. {r.referringDoctorFirstName} {r.referringDoctorLastName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A8A3', mb: 1 }}>
                    Patient: <strong>{r.patientFirstName} {r.patientLastName}</strong> ({r.patientPhone})
                  </Typography>
                  <Paper sx={{ p: 1.5, bgcolor: '#0B1315', borderRadius: '10px', mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#00C896', fontWeight: 700 }}>Clinical Reason:</Typography>
                    <Typography variant="body2" sx={{ color: '#EBF5F3' }}>{r.reason}</Typography>
                  </Paper>
                  {r.status === 'pending' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="contained" onClick={() => handleUpdateReferralStatus(r.id, 'accepted')} sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, borderRadius: '10px', textTransform: 'none' }}>
                        Accept Referral
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => handleUpdateReferralStatus(r.id, 'rejected')} sx={{ color: '#F44336', borderColor: 'rgba(244,67,54,0.4)', borderRadius: '10px', textTransform: 'none' }}>
                        Decline
                      </Button>
                    </Box>
                  )}
                  {r.status === 'accepted' && (
                    <Button size="small" variant="contained" onClick={() => handleUpdateReferralStatus(r.id, 'completed')} sx={{ bgcolor: '#2196F3', color: '#FFF', fontWeight: 800, borderRadius: '10px', textTransform: 'none' }}>
                      Mark Consultation Complete
                    </Button>
                  )}
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Refer Patient Modal */}
      <Dialog open={referralDialogOpen} onClose={() => setReferralDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#131F22', color: '#EBF5F3', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <form onSubmit={handleSendReferral}>
          <DialogTitle sx={{ fontWeight: 800, color: '#EBF5F3', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            Refer Patient to Specialist Doctor
          </DialogTitle>
          <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth sx={{ bgcolor: '#0B1315', borderRadius: '12px' }}>
              <InputLabel sx={{ color: '#94A8A3' }}>Select Patient</InputLabel>
              <Select
                value={referralForm.patientId}
                label="Select Patient"
                onChange={(e) => setReferralForm({ ...referralForm, patientId: e.target.value })}
                sx={{ color: '#EBF5F3' }}
                required
              >
                {myPatients.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.phone || p.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ bgcolor: '#0B1315', borderRadius: '12px' }}>
              <InputLabel sx={{ color: '#94A8A3' }}>Referred Doctor</InputLabel>
              <Select
                value={referralForm.referredDoctorId}
                label="Referred Doctor"
                onChange={(e) => setReferralForm({ ...referralForm, referredDoctorId: e.target.value })}
                sx={{ color: '#EBF5F3' }}
                required
              >
                {directory.map((doc) => (
                  <MenuItem key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialization})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ bgcolor: '#0B1315', borderRadius: '12px' }}>
              <InputLabel sx={{ color: '#94A8A3' }}>Priority</InputLabel>
              <Select
                value={referralForm.priority}
                label="Priority"
                onChange={(e) => setReferralForm({ ...referralForm, priority: e.target.value })}
                sx={{ color: '#EBF5F3' }}
              >
                <MenuItem value="routine">Routine</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Referral Reason (Required)"
              fullWidth
              required
              multiline
              rows={2}
              value={referralForm.reason}
              onChange={(e) => setReferralForm({ ...referralForm, reason: e.target.value })}
              sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }}
            />

            <TextField
              label="Clinical Summary & Relevant History"
              fullWidth
              multiline
              rows={3}
              value={referralForm.clinicalSummary}
              onChange={(e) => setReferralForm({ ...referralForm, clinicalSummary: e.target.value })}
              sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Button onClick={() => setReferralDialogOpen(false)} sx={{ color: '#94A8A3' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, '&:hover': { bgcolor: '#00A87E' } }}>
              Send Referral
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}
