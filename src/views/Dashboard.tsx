'use client';
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Tab, 
  Tabs,
  List,
  ListItem,
  ListItemText,
  Divider,
  Fab,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon, 
  Medication as MedicationIcon, 
  CheckCircle as ActiveIcon, 
  History as HistoryIcon,
  ChevronRight as ChevronRightIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPrescriptions } from '../services/prescriptions';
import { Prescription } from '../types/prescription';
import EnhancedPatientManagement from '../components/EnhancedPatientManagement';

const Dashboard = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { user } = authState;
  
  const [tabValue, setTabValue] = useState(0);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const data = await getPrescriptions();
        setPrescriptions(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);
  
  const activePrescriptions = prescriptions.filter(p => p.status !== 'completed');
  const completedPrescriptions = prescriptions.filter(p => p.status === 'completed');
  
  return (
    <Container maxWidth="sm" sx={{ pt: 2, pb: 4, px: 2 }}>
      {/* Mobile Greeting Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" sx={{ color: '#134F4D', fontWeight: 700, letterSpacing: 1.5 }}>
          HEALTH DASHBOARD
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
          Hello, {user?.role === 'doctor' ? `Dr. ${user?.lastName || ''}` : `${user?.firstName || 'User'}`} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.role === 'doctor' ? 'Manage your patients and active prescriptions' : 'Track your current medications & medical records'}
        </Typography>
      </Box>

      {/* Mobile Quick Stats Summary */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
        <Card sx={{ flex: 1, bgcolor: '#e6f4f1', border: '1px solid rgba(19,79,77,0.2)', borderRadius: '16px' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ActiveIcon sx={{ color: '#134F4D' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#134F4D' }}>
                {activePrescriptions.length}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#134F4D' }}>
              Active Prescriptions
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, bgcolor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '16px' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon sx={{ color: '#64748b' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#475569' }}>
                {completedPrescriptions.length}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>
              Completed Records
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', bgcolor: '#fff' }}>
        <Tabs
          value={tabValue}
          onChange={(_e, v) => setTabValue(v)}
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid #f1f5f9',
            '& .MuiTab-root': { fontWeight: 700, fontSize: '0.85rem' },
            '& .Mui-selected': { color: '#134F4D' }
          }}
        >
          <Tab label={`Active (${activePrescriptions.length})`} />
          <Tab label={`Completed (${completedPrescriptions.length})`} />
          {user?.role === 'doctor' && <Tab label="Patients" icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" />}
        </Tabs>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={32} sx={{ color: '#134F4D' }} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="body2">{error}</Typography>
          </Box>
        ) : (
          <Box sx={{ p: 1 }}>
            {tabValue === 0 && (
              activePrescriptions.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <MedicationIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No active prescriptions found</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {activePrescriptions.map((prescription, idx) => (
                    <React.Fragment key={prescription.id || idx}>
                      <ListItem 
                        button 
                        onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                        sx={{ borderRadius: '12px', my: 0.5, p: 1.5 }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                              {prescription.medication || (prescription.provisionalDiagnosis && prescription.provisionalDiagnosis[0]) || 'Prescription Document'}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Dosage: {prescription.dosage || 'As directed'} • {new Date(prescription.createdAt || Date.now()).toLocaleDateString()}
                            </Typography>
                          }
                        />
                        <Chip label="Active" size="small" color="primary" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, mr: 1 }} />
                        <ChevronRightIcon sx={{ color: '#94a3b8' }} />
                      </ListItem>
                      {idx < activePrescriptions.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )
            )}

            {tabValue === 1 && (
              completedPrescriptions.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <HistoryIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No completed records found</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {completedPrescriptions.map((prescription, idx) => (
                    <React.Fragment key={prescription.id || idx}>
                      <ListItem 
                        button 
                        onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                        sx={{ borderRadius: '12px', my: 0.5, p: 1.5 }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                              {prescription.medication || (prescription.provisionalDiagnosis && prescription.provisionalDiagnosis[0]) || 'Prescription Record'}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Completed: {new Date(prescription.createdAt || Date.now()).toLocaleDateString()}
                            </Typography>
                          }
                        />
                        <ChevronRightIcon sx={{ color: '#94a3b8' }} />
                      </ListItem>
                      {idx < completedPrescriptions.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )
            )}

            {tabValue === 2 && user?.role === 'doctor' && (
              <Box sx={{ p: 1 }}>
                <EnhancedPatientManagement />
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Floating Action Button for Doctors */}
      {user?.role === 'doctor' && (
        <Fab 
          color="primary" 
          aria-label="add prescription"
          onClick={() => navigate('/prescriptions/new')}
          sx={{ 
            position: 'fixed', 
            bottom: 80, 
            right: 20, 
            bgcolor: '#134F4D', 
            '&:hover': { bgcolor: '#0e3b3a' },
            boxShadow: '0 8px 24px rgba(19,79,77,0.3)'
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default Dashboard;
