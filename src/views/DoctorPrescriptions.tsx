'use client';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Stack,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  LocalPharmacy as PharmacyIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  diagnosis: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  instructions: string;
  followUpDate?: string;
  status: 'active' | 'completed';
  createdAt: string;
}

interface PrescriptionStats {
  total: number;
  active: number;
  completed: number;
  thisMonth: number;
  uniquePatients: number;
  recentPrescriptions: Array<{
    id: string;
    diagnosis: string;
    patientName: string;
    createdAt: string;
    status: string;
  }>;
}

const DoctorPrescriptions: React.FC = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [stats, setStats] = useState<PrescriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prescriptionsRes, statsRes] = await Promise.all([
        api.get('/prescriptions'),
        api.get('/prescriptions/stats')
      ]);
      
      setPrescriptions(prescriptionsRes.data);
      setStats(statsRes.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching prescriptions:', err);
      setError(err.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPrescription = async (id: string) => {
    try {
      const response = await api.get(`/prescriptions/${id}/download`, {
        responseType: 'blob'
      });
      
      const url = globalThis.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading prescription:', err);
      alert('Failed to download prescription');
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = 
      prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          My Prescriptions
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/prescriptions/new')}
          startIcon={<PharmacyIcon />}
        >
          New Prescription
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Prescriptions
                    </Typography>
                    <Typography variant="h4">
                      {stats.total}
                    </Typography>
                  </Box>
                  <AssessmentIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Active
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.active}
                    </Typography>
                  </Box>
                  <HourglassIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Completed
                    </Typography>
                    <Typography variant="h4">
                      {stats.completed}
                    </Typography>
                  </Box>
                  <CheckCircleIcon color="action" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Unique Patients
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {stats.uniquePatients}
                    </Typography>
                  </Box>
                  <PersonIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by patient name, email, or diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Tabs
              value={statusFilter}
              onChange={(_, value) => setStatusFilter(value)}
              variant="fullWidth"
            >
              <Tab label={`All (${prescriptions.length})`} value="all" />
              <Tab 
                label={`Active (${prescriptions.filter(p => p.status === 'active').length})`} 
                value="active" 
              />
              <Tab 
                label={`Completed (${prescriptions.filter(p => p.status === 'completed').length})`} 
                value="completed" 
              />
            </Tabs>
          </Grid>
        </Grid>
      </Paper>

      {/* Prescriptions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Diagnosis</TableCell>
              <TableCell>Medications</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPrescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary" py={4}>
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No prescriptions match your search criteria'
                      : 'No prescriptions found. Create your first prescription!'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredPrescriptions.map((prescription) => (
                <TableRow key={prescription.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(prescription.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {prescription.patientName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {prescription.patientEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {prescription.diagnosis}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="column" spacing={0.5}>
                      {prescription.medications.slice(0, 2).map((med, idx) => (
                        <Typography key={`${prescription.id}-med-${med.name}-${idx}`} variant="caption">
                          • {med.name} ({med.dosage})
                        </Typography>
                      ))}
                      {prescription.medications.length > 2 && (
                        <Typography variant="caption" color="primary">
                          +{prescription.medications.length - 2} more
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={prescription.status}
                      color={prescription.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download PDF">
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadPrescription(prescription.id)}
                        color="secondary"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="textSecondary">
          Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default DoctorPrescriptions;
