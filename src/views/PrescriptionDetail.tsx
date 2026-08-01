'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPrescriptionById } from '../services/prescriptions';
import { prescriptionsAPI } from '../services/api';
import { getPatientById } from '../services/patients';
import { findUserById } from '../utils/auth';
import { Prescription } from '../types/prescription';
import { Doctor, Patient } from '../types/auth';
import { 
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Grid,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle
} from '@mui/material';
import QRCode from 'qrcode.react';
import { 
  Print as PrintIcon, 
  Download as DownloadIcon, 
  Done as DoneIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  QrCode2 as QrIcon
} from '@mui/icons-material';

const PrescriptionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { user } = authState;
  
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  useEffect(() => {
    const fetchPrescriptionDetails = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const prescriptionData = await getPrescriptionById(id);
        setPrescription(prescriptionData);
        
        if (prescriptionData.patientId) {
          try {
            const patientData = await getPatientById(prescriptionData.patientId);
            setPatient(patientData);
          } catch (e) {
            console.log('Patient details fetch failed');
          }
        }
        
        if (prescriptionData.doctorId) {
          const doctorData = findUserById(prescriptionData.doctorId);
          setDoctor(doctorData as Doctor);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching prescription details:', err);
        setError('Failed to load prescription details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrescriptionDetails();
  }, [id]);
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleShare = async () => {
    if (navigator.share && prescription) {
      try {
        await navigator.share({
          title: `Medizo Digital Prescription - ${prescription.medication || 'Medication'}`,
          text: `View digital prescription for ${patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleDownloadPdf = async () => {
    if (!id) return;
    try {
      setDownloadingPdf(true);
      const blob = await prescriptionsAPI.downloadPrescription(id);
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Prescription_${id.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading prescription PDF:', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress sx={{ color: '#134F4D' }} />
      </Box>
    );
  }
  
  if (error || !prescription) {
    return (
      <Container maxWidth="xs" sx={{ mt: 4, px: 2 }}>
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: '20px' }}>
          <Typography color="error" sx={{ mb: 2 }}>{error || 'Prescription not found'}</Typography>
          <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ bgcolor: '#134F4D' }}>
            Back to Feed
          </Button>
        </Paper>
      </Container>
    );
  }
  
  const isDoctor = user?.role === 'doctor';
  
  return (
    <Container maxWidth="xs" sx={{ pt: 2, pb: 4, px: 2 }}>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '24px', border: '1px solid rgba(19, 79, 77, 0.15)', bgcolor: '#ffffff' }}>
        {/* Mobile Header Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#134F4D', fontWeight: 700, letterSpacing: 1 }}>
              DIGITAL PRESCRIPTION
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              #{prescription.id?.substring(0, 8) || 'RX-001'}
            </Typography>
          </Box>
          <Chip 
            label={prescription.status ? prescription.status.toUpperCase() : 'ACTIVE'} 
            color={prescription.status === 'completed' ? 'success' : 'primary'}
            sx={{ fontWeight: 700, borderRadius: '8px', height: 26, fontSize: '0.75rem' }}
          />
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Medication Details Card */}
        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '16px', mb: 2, border: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#134F4D', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            💊 Prescribed Medications
          </Typography>

          {prescription.medications && prescription.medications.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {prescription.medications.map((med, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#ffffff' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {idx + 1}. {med.name}
                    </Typography>
                    {med.type && (
                      <Chip label={med.type} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(19, 79, 77, 0.1)', color: '#134F4D' }} />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 0.5 }}>
                    <Chip label={`Dosage: ${med.dosage || 'As directed'}`} size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9', fontSize: '0.72rem' }} />
                    <Chip label={`⏱️ Duration: ${med.duration || 'As needed'}`} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', fontSize: '0.72rem' }} />
                    {med.quantity && (
                      <Chip label={`📦 Quantity: ${med.quantity}`} size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#047857', fontSize: '0.72rem' }} />
                    )}
                  </Box>
                  {med.instructions && (
                    <Typography variant="caption" sx={{ display: 'block', color: '#475569', fontStyle: 'italic', mt: 0.5 }}>
                      Instructions: "{med.instructions}"
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          ) : (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mb: 0.5 }}>
                {prescription.medication || 'Prescribed Medication'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Chip label={`Dosage: ${prescription.dosage || 'As directed'}`} size="small" sx={{ fontWeight: 700 }} />
                <Chip label={`⏱️ Duration: ${prescription.duration || 'As needed'}`} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8' }} />
              </Box>
              {prescription.instructions && (
                <Typography variant="body2" sx={{ mt: 1, color: '#475569', fontStyle: 'italic' }}>
                  Instructions: "{prescription.instructions}"
                </Typography>
              )}
            </Box>
          )}
        </Box>
        
        {/* Doctor & Patient Info */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f1f5f9' }}>
              <Typography variant="caption" color="text.secondary">DOCTOR</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {doctor ? `Dr. ${doctor.lastName}` : 'Attending MD'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {doctor?.specialization || 'Healthcare'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f1f5f9' }}>
              <Typography variant="caption" color="text.secondary">PATIENT</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {patient ? `${patient.firstName} ${patient.lastName}` : 'Registered Patient'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Issued: {new Date(prescription.createdAt || Date.now()).toLocaleDateString()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* QR Verification trigger */}
        <Paper 
          onClick={() => setQrModalOpen(true)}
          sx={{ 
            p: 2, 
            textAlign: 'center', 
            borderRadius: '16px', 
            bgcolor: '#e6f4f1', 
            border: '1px dashed #134F4D',
            cursor: 'pointer',
            mb: 2
          }}
        >
          <QrIcon sx={{ fontSize: 32, color: '#134F4D', mb: 0.5 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#134F4D' }}>
            Tap to View Verification QR Code
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Authenticity token for pharmacy verification
          </Typography>
        </Paper>

        {/* Mobile Actions Stack */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          {/* Download Full PDF */}
          <Button
            fullWidth
            variant="contained"
            startIcon={downloadingPdf ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            sx={{ 
              height: 48, 
              borderRadius: '16px',
              bgcolor: '#134F4D', 
              color: '#ffffff',
              fontWeight: 800, 
              boxShadow: '0 4px 16px rgba(19, 79, 77, 0.25)',
              '&:hover': { bgcolor: '#0e3b3a' } 
            }}
          >
            {downloadingPdf ? 'Generating PDF...' : 'Download Full PDF'}
          </Button>

          {/* Print Prescription */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ 
              height: 44, 
              borderRadius: '16px',
              borderColor: 'rgba(19, 79, 77, 0.4)', 
              color: '#134F4D',
              fontWeight: 800,
              '&:hover': { bgcolor: 'rgba(19, 79, 77, 0.06)', borderColor: '#134F4D' }
            }}
          >
            Print Prescription
          </Button>

          {/* Share Link */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShare}
            sx={{ 
              height: 44, 
              borderRadius: '16px',
              borderColor: 'rgba(19, 79, 77, 0.4)', 
              color: '#134F4D',
              fontWeight: 800,
              '&:hover': { bgcolor: 'rgba(19, 79, 77, 0.06)', borderColor: '#134F4D' }
            }}
          >
            Share Prescription
          </Button>

          <Button 
            fullWidth
            variant="text" 
            onClick={() => navigate('/dashboard')}
            sx={{ color: '#64748b', mt: 0.5, fontWeight: 700 }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>

      {/* QR Code Full Screen Modal */}
      <Dialog 
        open={qrModalOpen} 
        onClose={() => setQrModalOpen(false)}
        PaperProps={{ sx: { borderRadius: '24px', p: 2, textAlign: 'center' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#134F4D' }}>QR Verification</Typography>
          <IconButton onClick={() => setQrModalOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '16px', display: 'inline-block', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <QRCode value={prescription.id || 'VALID-RX'} size={200} />
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            Digital Signature Token: {prescription.id || 'RX-MEDIZO'}
          </Typography>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default PrescriptionDetail;
