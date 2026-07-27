'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { 
  Download as DownloadIcon,
  QrCode as QrCodeIcon,
  EventNote as EventNoteIcon,
  LocalPharmacy as LocalPharmacyIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import QRCode from 'qrcode.react';
import { prescriptionsAPI } from '../../services/api';

const PrescriptionList = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch prescriptions from API
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const response = await prescriptionsAPI.getMyPrescriptions();
        setPrescriptions(response || []);
      } catch (error) {
        console.error('Failed to fetch prescriptions:', error);
        // Fallback to test data if API fails
        setPrescriptions([
        {
          id: 'test-rx-001',
          date: '2024-01-10',
          doctor: 'Dr. Sarah Johnson',
          diagnosis: 'Common Cold',
          medications: [
            { name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '5 days' }
          ],
          instructions: 'Take with food. Rest and stay hydrated.',
          followUpDate: '2024-01-15',
          status: 'active'
        }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);
  
  const handleOpenDialog = (prescription) => {
    setSelectedPrescription(prescription);
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  const downloadPrescription = async (id) => {
    try {
      setLoading(true);
      await prescriptionsAPI.downloadPrescription(id);
      console.log(`Successfully downloaded prescription ${id}`);
    } catch (error) {
      console.error('Failed to download prescription:', error);
      // You could add a toast notification here
      alert('Failed to download prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        My Prescriptions
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="body1" paragraph>
          Here you can view all your prescriptions. Click on any prescription to see details
          or download a copy with QR verification.
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" sx={{ mr: 2 }}>Status indicators:</Typography>
          <Chip 
            label="Active" 
            color="success" 
            size="small" 
            sx={{ mr: 1 }} 
          />
          <Chip 
            label="Completed" 
            color="default" 
            size="small" 
          />
        </Box>
      </Paper>
      
      <Grid container spacing={3}>
        {prescriptions.map((prescription) => (
          <Grid item xs={12} md={6} key={prescription.id}>
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {prescription.diagnosis}
                  </Typography>
                  <Chip 
                    label={prescription.status === 'active' ? 'Active' : 'Completed'} 
                    color={prescription.status === 'active' ? 'success' : 'default'} 
                    size="small" 
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Prescribed: {formatDate(prescription.date)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocalPharmacyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    By: {prescription.doctor}
                  </Typography>
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  Medications:
                </Typography>
                <List dense sx={{ mb: 1 }}>
                  {prescription.medications.slice(0, 2).map((med, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemText 
                        primary={med.name} 
                        secondary={med.dosage} 
                      />
                    </ListItem>
                  ))}
                  {prescription.medications.length > 2 && (
                    <Typography variant="body2" color="primary">
                      +{prescription.medications.length - 2} more medications
                    </Typography>
                  )}
                </List>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button 
                  size="small" 
                  startIcon={<EventNoteIcon />}
                  onClick={() => handleOpenDialog(prescription)}
                >
                  View Details
                </Button>
                <Button 
                  size="small" 
                  color="primary" 
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadPrescription(prescription.id)}
                >
                  Download
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Prescription Detail Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedPrescription && (
          <>
            <DialogTitle>
              <Typography variant="h6">
                Prescription Details
              </Typography>
            </DialogTitle>
            
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Prescription ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPrescription.id}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date Issued
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedPrescription.date)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Prescribed By
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPrescription.doctor}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Follow-up Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedPrescription.followUpDate)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Diagnosis
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPrescription.diagnosis}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Medications
                  </Typography>
                  <List>
                    {selectedPrescription.medications.map((med, index) => (
                      <React.Fragment key={index}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={med.name}
                            secondary={
                              <>
                                <Typography component="span" variant="body2">
                                  Dosage: {med.dosage}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2">
                                  Frequency: {med.frequency}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2">
                                  Duration: {med.duration}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        {index < selectedPrescription.medications.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Special Instructions
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedPrescription.instructions}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Box 
                    sx={{ 
                      border: '1px dashed #ccc', 
                      p: 3, 
                      textAlign: 'center',
                      width: 200,
                      height: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    {selectedPrescription.id ? (
                      <>
                        <QRCode 
                          value={selectedPrescription.id}
                          size={150}
                          level="M"
                          includeMargin
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          QR Verification Code
                        </Typography>
                      </>
                    ) : (
                      <>
                        <QrCodeIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          QR Code Not Available
                        </Typography>
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button 
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => downloadPrescription(selectedPrescription.id)}
              >
                Download PDF
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PrescriptionList;
