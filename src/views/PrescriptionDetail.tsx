'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPrescriptionById } from '../services/prescriptions';
import { prescriptionsAPI, getApiBaseUrl } from '../services/api';
import { getPatientById } from '../services/patients';
import { getCachedData, findInCachedList } from '../services/apiCache';
import { Prescription } from '../types/prescription';
import { Patient } from '../types/auth';
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
  const location = useLocation();
  const { authState } = useAuth();
  const { user } = authState;
  
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (!id) return;

    // 1. Instant Cache Hydration (0 spinner delay)
    const cachedRx = getCachedData<Prescription>(`prescription_${id}`) || findInCachedList<Prescription>('prescriptions_list', id);
    if (cachedRx) {
      setPrescription(cachedRx);
      setLoading(false);
      if (cachedRx.patientId) {
        const cachedPatient = getCachedData<Patient>(`patient_${cachedRx.patientId}`) || findInCachedList<Patient>('my_patients', cachedRx.patientId) || findInCachedList<Patient>('all_patients', cachedRx.patientId);
        if (cachedPatient) setPatient(cachedPatient);
      }
    } else {
      setLoading(true);
    }

    // 2. Background Revalidation (Stale-While-Revalidate)
    const fetchPrescriptionDetails = async () => {
      try {
        const prescriptionData = await getPrescriptionById(id, Boolean(cachedRx));
        setPrescription(prescriptionData);
        
        if (prescriptionData.patientId) {
          try {
            const patientData = await getPatientById(prescriptionData.patientId, Boolean(cachedRx));
            setPatient(patientData);
          } catch (e) {
            console.log('Patient details fetch failed');
          }
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching prescription details:', err);
        if (!cachedRx) setError('Failed to load prescription details');
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
    if (!id) return;
    try {
      setDownloadingPdf(true);
      // Fetch PDF blob
      const blob = await prescriptionsAPI.downloadPrescription(id);
      const filename = `Prescription_${id.substring(0, 8).toUpperCase()}.pdf`;
      const pdfFile = new File([blob], filename, { type: 'application/pdf' });

      // Check if native file sharing is supported (Mobile / Chrome Web Share API)
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Medizo Digital Prescription #${id.substring(0, 8).toUpperCase()}`,
          text: `Digital Prescription for ${patient ? `${patient.firstName} ${patient.lastName}` : (prescription?.patientName || 'Patient')}`,
        });
      } else {
        // Desktop / Fallback: Download PDF file & copy clean summary
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);

        // Copy text summary
        const summaryText = buildSummaryText(prescription, patient);
        navigator.clipboard?.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 5000);
      }
    } catch (err) {
      console.error('Error sharing prescription:', err);
      // Fallback: Share clean web portal link
      const shareUrl = `${window.location.origin}/prescriptions/share/${id}`;
      navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const buildSummaryText = (rx: Prescription | null, pat: Patient | null) => {
    if (!rx) return 'Medizo Prescription Document';
    const rxId = rx.id?.substring(0, 8).toUpperCase() || 'RX';
    const patientName = pat ? `${pat.firstName} ${pat.lastName}` : (rx.patientName || 'Patient');
    const doctorName = (rx as any).doctorName ? `Dr. ${(rx as any).doctorName}` : 'Attending MD';

    let medsText = '';
    if (rx.medications && rx.medications.length > 0) {
      medsText = rx.medications.map((m, i) =>
        `${i + 1}. ${m.name} (${m.type || 'Medication'})\n   Dosage: ${m.dosage || 'As directed'} | Duration: ${m.duration || 'As needed'}`
      ).join('\n');
    } else if (rx.medication) {
      medsText = `1. ${rx.medication}\n   Dosage: ${rx.dosage || 'As directed'} | Duration: ${rx.duration || 'As needed'}`;
    }

    let text = `DIGITAL PRESCRIPTION #${rxId}\nPatient: ${patientName}\nDoctor: ${doctorName}\n\n💊 Prescribed Medications:\n${medsText}`;

    if (rx.presentingComplaints?.length) {
      text += `\n\n📋 Presenting Complaints:\n${rx.presentingComplaints.join(', ')}`;
    }
    if (rx.clinicalFindings?.length) {
      text += `\n\n🔬 Clinical Findings:\n${rx.clinicalFindings.join(', ')}`;
    }
    if (rx.vitalSigns && Object.keys(rx.vitalSigns).some(k => (rx.vitalSigns as any)[k])) {
      const v = rx.vitalSigns as any;
      text += `\n\n📊 Vital Signs:\nBP: ${v.bloodPressure || 'N/A'} | Pulse: ${v.pulse ? v.pulse + ' bpm' : 'N/A'} | Temp: ${v.temperature ? v.temperature + ' °F' : 'N/A'} | SpO2: ${v.spo2 ? v.spo2 + '%' : 'N/A'}`;
    }
    if (rx.followUpDate) {
      text += `\n\n📅 Follow-Up Date: ${new Date(rx.followUpDate).toLocaleDateString()}`;
    }

    return text;
  };

  const handleDownloadPdf = async () => {
    if (!id) return;
    try {
      setDownloadingPdf(true);
      const blob = await prescriptionsAPI.downloadPrescription(id);
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Prescription_${id.substring(0, 8).toUpperCase()}.pdf`);
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
    <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 }, pb: 6, px: { xs: 2, sm: 3, md: 4 } }}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .printable-prescription, .printable-prescription * {
            visibility: visible !important;
          }
          .printable-prescription {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 16px !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Action & Notice Bar */}
      <Box className="no-print" sx={{ mb: 2.5 }}>
        {copied && (
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: '#e6fffa', border: '1px solid #319795', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: 1 }}>
            <DoneIcon sx={{ color: '#234e52' }} />
            <Typography variant="body2" sx={{ color: '#234e52', fontWeight: 700 }}>
              Prescription PDF downloaded & text summary copied to clipboard for easy sharing!
            </Typography>
          </Paper>
        )}

        {!user && (
          <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(19, 79, 77, 0.08)', border: '1px solid rgba(19, 79, 77, 0.2)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="PUBLIC VIEW" color="primary" size="small" sx={{ fontWeight: 800, borderRadius: '6px' }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#134F4D' }}>
                Official Medizo Digital Prescription — No Account Needed to View or Print
              </Typography>
            </Box>
            <Button variant="outlined" size="small" onClick={() => navigate('/login')} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}>
              Sign In / Register
            </Button>
          </Paper>
        )}

        {/* Quick Action Bar (Print, Download, Share) */}
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: '18px', bgcolor: '#ffffff', border: '1px solid rgba(19, 79, 77, 0.15)', display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#134F4D' }}>
              Prescription Document
            </Typography>
            <Chip label={prescription.status ? prescription.status.toUpperCase() : 'ACTIVE'} size="small" color={prescription.status === 'completed' ? 'success' : 'primary'} sx={{ fontWeight: 800, height: 22, fontSize: '0.7rem' }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{
                bgcolor: '#134F4D',
                color: '#ffffff',
                fontWeight: 800,
                borderRadius: '12px',
                px: 2,
                py: 0.8,
                boxShadow: '0 4px 12px rgba(19, 79, 77, 0.2)',
                '&:hover': { bgcolor: '#0e3b3a' }
              }}
            >
              Print Prescription
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={downloadingPdf ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              sx={{
                borderColor: 'rgba(19, 79, 77, 0.4)',
                color: '#134F4D',
                fontWeight: 800,
                borderRadius: '12px',
                px: 2,
                py: 0.8,
                '&:hover': { bgcolor: 'rgba(19, 79, 77, 0.06)', borderColor: '#134F4D' }
              }}
            >
              {downloadingPdf ? 'Downloading...' : 'Download PDF'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              sx={{
                borderColor: 'rgba(19, 79, 77, 0.4)',
                color: '#134F4D',
                fontWeight: 800,
                borderRadius: '12px',
                px: 2,
                py: 0.8,
                '&:hover': { bgcolor: 'rgba(19, 79, 77, 0.06)', borderColor: '#134F4D' }
              }}
            >
              Share Link
            </Button>
          </Box>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Digital Prescription Paper Document */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper elevation={0} className="printable-prescription" sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '24px', border: '1px solid rgba(19, 79, 77, 0.15)', bgcolor: '#ffffff' }}>
            {/* Header Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#134F4D', fontWeight: 700, letterSpacing: 1 }}>
                  DIGITAL PRESCRIPTION
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  #{prescription.id?.substring(0, 8).toUpperCase() || 'RX-001'}
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
        
        {/* Diagnosis & Complaints */}
        {((prescription as any).provisionalDiagnosis && (prescription as any).provisionalDiagnosis.length > 0) && (
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '16px', mb: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#134F4D', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              🩺 Diagnosis
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {(prescription as any).provisionalDiagnosis.map((d: string, i: number) => (
                <Chip key={i} label={d} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(19, 79, 77, 0.08)', color: '#134F4D' }} />
              ))}
            </Box>
          </Box>
        )}

        {((prescription as any).presentingComplaints && (prescription as any).presentingComplaints.length > 0) && (
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '16px', mb: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#134F4D', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              📋 Presenting Complaints
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {(prescription as any).presentingComplaints.map((c: string, i: number) => (
                <Chip key={i} label={c} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#92400e' }} />
              ))}
            </Box>
          </Box>
        )}

        {((prescription as any).clinicalFindings && (prescription as any).clinicalFindings.length > 0) && (
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '16px', mb: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#134F4D', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              🔬 Clinical Findings
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {(prescription as any).clinicalFindings.map((f: string, i: number) => (
                <Chip key={i} label={f} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(59, 130, 246, 0.08)', color: '#1d4ed8' }} />
              ))}
            </Box>
          </Box>
        )}

        {/* Vital Signs */}
        {(prescription as any).vitalSigns && Object.keys((prescription as any).vitalSigns).some(k => (prescription as any).vitalSigns[k]) && (
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '16px', mb: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#134F4D', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              📊 Vital Signs
            </Typography>
            <Grid container spacing={1}>
              {(prescription as any).vitalSigns.bloodPressure && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Blood Pressure</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{(prescription as any).vitalSigns.bloodPressure}</Typography>
                </Grid>
              )}
              {(prescription as any).vitalSigns.pulse && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Pulse</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{(prescription as any).vitalSigns.pulse} bpm</Typography>
                </Grid>
              )}
              {(prescription as any).vitalSigns.temperature && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Temperature</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{(prescription as any).vitalSigns.temperature} °F</Typography>
                </Grid>
              )}
              {(prescription as any).vitalSigns.weight && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Weight</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{(prescription as any).vitalSigns.weight} kg</Typography>
                </Grid>
              )}
              {(prescription as any).vitalSigns.spo2 && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">SpO₂</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{(prescription as any).vitalSigns.spo2}%</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Notes */}
        {(prescription as any).notes && (
          <Box sx={{ bgcolor: '#fffbeb', p: 2, borderRadius: '16px', mb: 2, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#92400e', mb: 0.5 }}>📝 Notes</Typography>
            <Typography variant="body2" sx={{ color: '#78350f' }}>{(prescription as any).notes}</Typography>
          </Box>
        )}

        {/* Follow-up */}
        {(prescription as any).followUpDate && (
          <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.04)', p: 2, borderRadius: '16px', mb: 2, border: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1d4ed8', mb: 0.5 }}>📅 Follow-Up Date</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e40af' }}>
              {new Date((prescription as any).followUpDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>
        )}

        {/* Doctor & Patient Info */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f1f5f9' }}>
              <Typography variant="caption" color="text.secondary">DOCTOR</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {(prescription as any).doctorName ? `Dr. ${(prescription as any).doctorName}` : 'Attending MD'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {(prescription as any).doctorSpecialization || 'Healthcare'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f1f5f9' }}>
              <Typography variant="caption" color="text.secondary">PATIENT</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {patient ? `${patient.firstName} ${patient.lastName}` : ((prescription as any).patientName || 'Registered Patient')}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Issued: {new Date(prescription.createdAt || Date.now()).toLocaleDateString()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Verification & QR Code Footer (Included in Print) */}
        <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <QRCode value={prescription.id || 'VALID-RX'} size={72} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#134F4D', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                OFFICIAL DIGITAL PRESCRIPTION
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Token: #{prescription.id?.substring(0, 8).toUpperCase() || 'RX-MEDIZO'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Scan QR to verify on Medizo Cloud
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700 }}>
              Medizo Healthcare Management
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Verified Digital Record
            </Typography>
          </Box>
        </Box>
          </Paper>
        </Grid>
        {/* End Left Column */}

        {/* Right Column: Actions & Verification */}
        <Grid item xs={12} md={5} lg={4} className="no-print">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, position: { md: 'sticky' }, top: { md: 84 } }}>
            {/* Widescreen Inline Verification QR Card */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                textAlign: 'center', 
                borderRadius: '24px', 
                bgcolor: '#ffffff',
                border: '1px solid rgba(19, 79, 77, 0.15)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
              }}
            >
              <Typography variant="caption" sx={{ color: '#134F4D', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1.5 }}>
                Authenticity Token & QR Code
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '20px', display: 'inline-block', border: '1px solid #e2e8f0', mb: 1.5 }}>
                <QRCode value={prescription.id || 'VALID-RX'} size={180} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#134F4D' }}>
                #{prescription.id?.substring(0, 8) || 'RX-MEDIZO'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Scan with Medizo App to verify prescription authenticity & dispense
              </Typography>
            </Paper>

            {/* Actions Card */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: '24px', 
                bgcolor: '#ffffff',
                border: '1px solid rgba(19, 79, 77, 0.15)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#134F4D', mb: 2 }}>
                Prescription Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  sx={{ 
                    height: 48, 
                    borderRadius: '16px',
                    bgcolor: '#0f766e', 
                    color: '#ffffff',
                    fontWeight: 800,
                    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
                    '&:hover': { bgcolor: '#0d655e' }
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

                {user ? (
                  <Button 
                    fullWidth
                    variant="text" 
                    onClick={() => navigate('/dashboard')}
                    sx={{ color: '#64748b', mt: 0.5, fontWeight: 700 }}
                  >
                    Back to Dashboard
                  </Button>
                ) : (
                  <Button 
                    fullWidth
                    variant="text" 
                    onClick={() => navigate('/login')}
                    sx={{ color: '#134F4D', mt: 0.5, fontWeight: 800 }}
                  >
                    Sign In / Create Account
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>
        </Grid>
        {/* End Right Column */}
      </Grid>

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
            Digital Signature Token: {prescription.id?.toUpperCase() || 'RX-MEDIZO'}
          </Typography>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default PrescriptionDetail;
