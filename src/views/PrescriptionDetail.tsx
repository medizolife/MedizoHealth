'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPrescriptionById } from '../services/prescriptions';
import { prescriptionsAPI, getApiBaseUrl } from '../services/api';
import { getPatientById } from '../services/patients';
import { getCachedData, findInCachedList } from '../services/apiCache';
import { Prescription, TestReport } from '../types/prescription';
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
  DialogTitle,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tooltip
} from '@mui/material';
import QRCode from 'qrcode.react';
import { 
  Print as PrintIcon, 
  Download as DownloadIcon, 
  Done as DoneIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  QrCode2 as QrIcon,
  CloudUpload as CloudUploadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  DeleteOutline as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Science as ScienceIcon,
  CheckCircle as CheckCircleIcon,
  InfoOutlined as InfoIcon,
  AttachFile as AttachFileIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon,
  RestartAlt as ResetIcon,
  Contrast as ContrastIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Add as AddIcon
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

  // Test Reports states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewReportModalOpen, setViewReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<TestReport | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTestName, setUploadTestName] = useState('');
  const [customTestName, setCustomTestName] = useState('');
  const [isCustomTest, setIsCustomTest] = useState(false);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [darkModeViewer, setDarkModeViewer] = useState(false);
  const [reportFilter, setReportFilter] = useState('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    if (rx.investigations?.length) {
      text += `\n\n🧪 Required Investigations:\n${rx.investigations.map(i => i.testName).join(', ')}`;
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
      const rawPatientName = (
        patient?.name || 
        patient?.firstName ||
        prescription?.patientName || 
        (prescription as any)?.patient?.name || 
        'PATIENT'
      ).replace(/[^a-zA-Z0-9]/g, '');
      const patient4 = (rawPatientName.substring(0, 4) || 'PATI').toUpperCase();
      const prescDate = prescription?.createdAt ? new Date(prescription.createdAt) : new Date();
      const yyyy = prescDate.getFullYear();
      const mm = String(prescDate.getMonth() + 1).padStart(2, '0');
      const dd = String(prescDate.getDate()).padStart(2, '0');
      const dateFormatted = `${yyyy}-${mm}-${dd}`;
      const pdfFilename = `${patient4}_${dateFormatted}_Prescription_${id.substring(0, 8).toUpperCase()}.pdf`;

      const blob = await prescriptionsAPI.downloadPrescription(id);
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', pdfFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading prescription PDF:', err);
      alert('Failed to download PDF. Please check your connection and try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit. Please choose a smaller file.');
        return;
      }
      setUploadFile(file);
      setUploadError(null);
    }
  };

  const handleUploadReport = async () => {
    if (!prescription?.id) return;
    if (!uploadFile) {
      setUploadError('Please select a test report file (PDF, JPEG, PNG, or WEBP).');
      return;
    }

    const effectiveTestName = isCustomTest 
      ? (customTestName.trim() || 'Diagnostic Lab Report') 
      : (uploadTestName.trim() || 'Diagnostic Lab Report');

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('testName', effectiveTestName);
      if (uploadNotes.trim()) {
        formData.append('notes', uploadNotes.trim());
      }

      const response = await prescriptionsAPI.uploadTestReport(prescription.id, formData);
      
      if (response && response.prescription) {
        setPrescription(response.prescription);
      } else if (response && response.testReports) {
        setPrescription(prev => prev ? { ...prev, testReports: response.testReports } : prev);
      }

      setUploadSuccess('Test report uploaded successfully!');
      setTimeout(() => {
        setUploadSuccess(null);
        setUploadModalOpen(false);
        setUploadFile(null);
        setUploadTestName('');
        setCustomTestName('');
        setIsCustomTest(false);
        setUploadNotes('');
      }, 1000);
    } catch (err: any) {
      console.error('Error uploading test report:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload test report. Please check file and server connection.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!prescription?.id) return;
    const confirmDelete = window.confirm('Are you sure you want to remove this test report?');
    if (!confirmDelete) return;

    try {
      setDeletingReportId(reportId);
      const response = await prescriptionsAPI.deleteTestReport(prescription.id, reportId);
      if (response && response.prescription) {
        setPrescription(response.prescription);
      } else if (response && response.testReports) {
        setPrescription(prev => prev ? { ...prev, testReports: response.testReports } : prev);
      }
      if (selectedReport?.id === reportId) {
        setViewReportModalOpen(false);
        setSelectedReport(null);
      }
    } catch (err: any) {
      console.error('Error deleting test report:', err);
      alert(err.response?.data?.message || 'Failed to delete report.');
    } finally {
      setDeletingReportId(null);
    }
  };

  const openReportViewer = (report: TestReport) => {
    setSelectedReport(report);
    setZoomLevel(1);
    setRotation(0);
    setViewReportModalOpen(true);
  };

  const openUploadModal = (testName?: string) => {
    setUploadError(null);
    setUploadSuccess(null);
    setUploadFile(null);
    setUploadNotes('');
    setCustomTestName('');
    if (testName) {
      setUploadTestName(testName);
      setIsCustomTest(false);
    } else if (investigationsList.length > 0) {
      const pendingInv = investigationsList.find(inv => 
        !testReports.some(r => r.testName?.trim().toLowerCase() === inv.testName?.trim().toLowerCase())
      );
      setUploadTestName(pendingInv ? pendingInv.testName : investigationsList[0].testName);
      setIsCustomTest(false);
    } else {
      setUploadTestName('');
      setIsCustomTest(false);
    }
    setUploadModalOpen(true);
  };

  const handleNextReport = () => {
    if (!selectedReport || testReports.length <= 1) return;
    const currentIndex = testReports.findIndex(r => r.id === selectedReport.id);
    const nextIndex = (currentIndex + 1) % testReports.length;
    setSelectedReport(testReports[nextIndex]);
    setZoomLevel(1);
    setRotation(0);
  };

  const handlePrevReport = () => {
    if (!selectedReport || testReports.length <= 1) return;
    const currentIndex = testReports.findIndex(r => r.id === selectedReport.id);
    const prevIndex = (currentIndex - 1 + testReports.length) % testReports.length;
    setSelectedReport(testReports[prevIndex]);
    setZoomLevel(1);
    setRotation(0);
  };

  const resolveFileUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${getApiBaseUrl()}${url}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownloadReportFile = async (report?: TestReport | null) => {
    if (!report?.fileUrl) return;
    const fullUrl = resolveFileUrl(report.fileUrl);

    // Patient first 4 letters + upload date (e.g. SARA_2026-08-15_CTScan.png)
    const rawPatientName = (
      patient?.name || 
      patient?.firstName ||
      prescription?.patientName || 
      (prescription as any)?.patient?.name || 
      'PATIENT'
    ).replace(/[^a-zA-Z0-9]/g, '');
    const patient4 = (rawPatientName.substring(0, 4) || 'PATI').toUpperCase();

    const uploadDate = report.uploadedAt ? new Date(report.uploadedAt) : new Date();
    const yyyy = uploadDate.getFullYear();
    const mm = String(uploadDate.getMonth() + 1).padStart(2, '0');
    const dd = String(uploadDate.getDate()).padStart(2, '0');
    const dateFormatted = `${yyyy}-${mm}-${dd}`;

    // Detect file extension
    let ext = '.png';
    const nameToCheck = report.originalName || report.filename || report.fileUrl || '';
    const matchExt = nameToCheck.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    if (matchExt) {
      ext = `.${matchExt[1].toLowerCase()}`;
    } else if (report.fileType === 'pdf') {
      ext = '.pdf';
    }

    const cleanTest = (report.testName || '').replace(/[^a-zA-Z0-9]/g, '');
    const downloadFileName = cleanTest 
      ? `${patient4}_${dateFormatted}_${cleanTest}${ext}`
      : `${patient4}_${dateFormatted}${ext}`;

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
    } catch (e) {
      // Fallback
      const a = document.createElement('a');
      a.href = fullUrl;
      a.download = downloadFileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handlePrintReport = (report?: TestReport | null) => {
    if (!report?.fileUrl) return;
    const fullUrl = resolveFileUrl(report.fileUrl);

    const rawPatientName = (
      patient?.name || 
      patient?.firstName ||
      prescription?.patientName || 
      (prescription as any)?.patient?.name || 
      'PATIENT'
    ).replace(/[^a-zA-Z0-9]/g, '');
    const patient4 = (rawPatientName.substring(0, 4) || 'PATI').toUpperCase();

    const uploadDate = report.uploadedAt ? new Date(report.uploadedAt) : new Date();
    const yyyy = uploadDate.getFullYear();
    const mm = String(uploadDate.getMonth() + 1).padStart(2, '0');
    const dd = String(uploadDate.getDate()).padStart(2, '0');
    const dateFormatted = `${yyyy}-${mm}-${dd}`;
    const cleanTest = (report.testName || 'Diagnostic Report').replace(/[^a-zA-Z0-9 ]/g, '');
    const docTitle = `${patient4}_${dateFormatted}_${cleanTest.replace(/\s+/g, '')}`;

    if (report.fileType === 'pdf') {
      const printWindow = window.open(fullUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    } else {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${docTitle}</title>
              <style>
                @page {
                  size: auto;
                  margin: 8mm;
                }
                body {
                  margin: 0;
                  padding: 16px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  color: #1a202c;
                  text-align: center;
                }
                .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 2px solid #134F4D;
                  padding-bottom: 8px;
                  margin-bottom: 16px;
                  text-align: left;
                }
                .title {
                  font-size: 18px;
                  font-weight: 800;
                  color: #134F4D;
                }
                .meta {
                  font-size: 12px;
                  color: #4a5568;
                }
                .img-container {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  width: 100%;
                }
                img {
                  max-width: 100%;
                  max-height: 86vh;
                  object-fit: contain;
                  border-radius: 8px;
                }
                .notes {
                  margin-top: 12px;
                  padding: 8px 12px;
                  background: #f7fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 6px;
                  text-align: left;
                  font-size: 13px;
                }
                @media print {
                  body { padding: 0; }
                  img { max-height: 90vh; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div>
                  <div class="title">🧪 ${cleanTest} (${docTitle})</div>
                  <div class="meta">Patient: ${patient?.name || prescription?.patientName || patient4} • Uploaded ${dateFormatted}</div>
                </div>
                <div class="meta" style="text-align: right;">
                  <div>Prescription #${prescription?.id?.substring(0, 8).toUpperCase() || ''}</div>
                  <div style="font-weight: bold; color: #134F4D;">Medizo Healthcare</div>
                </div>
              </div>
              <div class="img-container">
                <img src="${fullUrl}" onload="setTimeout(() => { window.print(); }, 200);" />
              </div>
              ${report.notes ? `<div class="notes"><strong>Clinical Notes:</strong> ${report.notes}</div>` : ''}
            </body>
          </html>
        `);
        printWindow.document.close();
      }
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
  const isPatient = user?.role === 'patient';

  // Normalize investigations list
  const investigationsList: { testName: string; reason?: string; priority?: string; fasting?: string; specialInstructions?: string }[] = [];
  if (prescription.investigations && Array.isArray(prescription.investigations)) {
    prescription.investigations.forEach(inv => {
      if (typeof inv === 'string') {
        investigationsList.push({ testName: inv });
      } else if (inv && typeof inv === 'object') {
        investigationsList.push(inv);
      }
    });
  }
  if (prescription.testsRequired && Array.isArray(prescription.testsRequired)) {
    prescription.testsRequired.forEach(t => {
      if (!investigationsList.some(i => i.testName === t)) {
        investigationsList.push({ testName: t });
      }
    });
  }

  const hasPrescribedTests = investigationsList.length > 0;
  const testReports = prescription.testReports || [];
  const reportsCount = testReports.length;
  
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

        {/* Quick Action Bar (Print, Download, Share, Upload Reports) */}
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: '18px', bgcolor: '#ffffff', border: '1px solid rgba(19, 79, 77, 0.15)', display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#134F4D' }}>
              Prescription Document
            </Typography>
            <Chip 
              label={prescription.status ? prescription.status.toUpperCase() : 'ACTIVE'} 
              size="small" 
              color={prescription.status === 'completed' ? 'success' : 'primary'} 
              sx={{ fontWeight: 800, height: 22, fontSize: '0.7rem' }} 
            />
            {hasPrescribedTests && (
              <Chip 
                label={reportsCount > 0 ? `🧪 Reports Uploaded (${reportsCount})` : '🧪 Tests Required'} 
                size="small" 
                sx={{ 
                  fontWeight: 800, 
                  height: 22, 
                  fontSize: '0.7rem',
                  bgcolor: reportsCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: reportsCount > 0 ? '#047857' : '#b45309',
                  border: `1px solid ${reportsCount > 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
                }} 
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
            <Button
              variant="contained"
              size="small"
              startIcon={<CloudUploadIcon />}
              onClick={() => openUploadModal()}
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
              Upload Test Report
            </Button>
          </Box>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Digital Prescription Paper Document & Reports Section */}
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
            
            {/* Required Investigations & Lab Tests */}
            {hasPrescribedTests && (
              <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: '18px', mb: 2.5, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScienceIcon sx={{ color: '#134F4D', fontSize: 22 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#134F4D' }}>
                      Required Investigations & Lab Tests
                    </Typography>
                  </Box>
                  <Chip 
                    label={reportsCount > 0 ? `${reportsCount} of ${investigationsList.length} Uploaded` : `${investigationsList.length} Test(s) Required`} 
                    size="small" 
                    sx={{ 
                      fontWeight: 800, 
                      height: 24, 
                      fontSize: '0.7rem',
                      bgcolor: reportsCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: reportsCount > 0 ? '#047857' : '#b45309',
                      border: `1px solid ${reportsCount > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }} 
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {investigationsList.map((inv, idx) => {
                    const matchingReports = testReports.filter(r => 
                      r.testName?.trim().toLowerCase() === inv.testName?.trim().toLowerCase() ||
                      (r.testName && inv.testName && (r.testName.toLowerCase().includes(inv.testName.toLowerCase()) || inv.testName.toLowerCase().includes(r.testName.toLowerCase())))
                    );
                    const isUploaded = matchingReports.length > 0;

                    return (
                      <Paper 
                        key={idx} 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          borderRadius: '14px', 
                          bgcolor: isUploaded ? 'rgba(16, 185, 129, 0.03)' : '#ffffff', 
                          border: isUploaded ? '1.5px solid rgba(16, 185, 129, 0.35)' : '1px solid #e2e8f0',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ flex: 1, minWidth: '220px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                                {idx + 1}. {inv.testName}
                              </Typography>
                              {isUploaded ? (
                                <Chip 
                                  icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#047857 !important' }} />}
                                  label={`${matchingReports.length} Report${matchingReports.length > 1 ? 's' : ''} Uploaded`} 
                                  size="small" 
                                  sx={{ 
                                    height: 22, 
                                    fontSize: '0.68rem', 
                                    fontWeight: 800, 
                                    bgcolor: 'rgba(16, 185, 129, 0.15)', 
                                    color: '#047857',
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                  }} 
                                />
                              ) : (
                                <Chip 
                                  label="Pending Report" 
                                  size="small" 
                                  sx={{ 
                                    height: 22, 
                                    fontSize: '0.68rem', 
                                    fontWeight: 800, 
                                    bgcolor: 'rgba(245, 158, 11, 0.12)', 
                                    color: '#b45309',
                                    border: '1px solid rgba(245, 158, 11, 0.3)'
                                  }} 
                                />
                              )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 0.5 }}>
                              {inv.priority && (
                                <Chip 
                                  label={`Priority: ${inv.priority.toUpperCase()}`} 
                                  size="small" 
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.62rem', 
                                    fontWeight: 800, 
                                    bgcolor: inv.priority === 'urgent' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(19, 79, 77, 0.08)', 
                                    color: inv.priority === 'urgent' ? '#dc2626' : '#134F4D' 
                                  }} 
                                />
                              )}
                              {inv.fasting && (
                                <Chip 
                                  label={`Fasting: ${inv.fasting}`} 
                                  size="small" 
                                  sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#b45309' }} 
                                />
                              )}
                            </Box>

                            {inv.reason && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                                Reason: {inv.reason}
                              </Typography>
                            )}
                            {inv.specialInstructions && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#0369a1', fontStyle: 'italic', mt: 0.3 }}>
                                Instructions: {inv.specialInstructions}
                              </Typography>
                            )}
                          </Box>

                          {!isUploaded && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CloudUploadIcon />}
                              onClick={() => openUploadModal(inv.testName)}
                              sx={{
                                borderRadius: '10px',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                bgcolor: '#134F4D',
                                color: '#ffffff',
                                px: 2,
                                py: 0.6,
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#0e3b3a' }
                              }}
                            >
                              Upload Report
                            </Button>
                          )}
                        </Box>

                        {/* If matching reports exist, show them right here for immediate viewing */}
                        {isUploaded && (
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed rgba(16, 185, 129, 0.3)', display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {matchingReports.map((report) => (
                              <Paper
                                key={report.id}
                                variant="outlined"
                                sx={{
                                  p: 1.2,
                                  borderRadius: '10px',
                                  bgcolor: '#ffffff',
                                  border: '1px solid rgba(19, 79, 77, 0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: 1
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '180px' }}>
                                  {report.fileType === 'pdf' ? (
                                    <PdfIcon sx={{ color: '#dc2626', fontSize: 22 }} />
                                  ) : (
                                    <ImageIcon sx={{ color: '#2563eb', fontSize: 22 }} />
                                  )}
                                  <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', display: 'block' }}>
                                      {report.originalName || report.filename}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                      {formatFileSize(report.fileSize)} • {new Date(report.uploadedAt).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => openReportViewer(report)}
                                    sx={{
                                      borderRadius: '8px',
                                      fontWeight: 800,
                                      fontSize: '0.72rem',
                                      bgcolor: '#134F4D',
                                      color: '#ffffff',
                                      px: 1.5,
                                      py: 0.5,
                                      textTransform: 'none',
                                      '&:hover': { bgcolor: '#0e3b3a' }
                                    }}
                                  >
                                    View Report
                                  </Button>
                                  <Tooltip title="Print report document">
                                    <IconButton
                                      size="small"
                                      onClick={() => handlePrintReport(report)}
                                      sx={{
                                        borderRadius: '8px',
                                        border: '1px solid rgba(19, 79, 77, 0.25)',
                                        color: '#134F4D',
                                        p: 0.5
                                      }}
                                    >
                                      <PrintIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Download file to device">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDownloadReportFile(report)}
                                      sx={{
                                        borderRadius: '8px',
                                        border: '1px solid rgba(19, 79, 77, 0.25)',
                                        color: '#134F4D',
                                        p: 0.5
                                      }}
                                    >
                                      <DownloadIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Paper>
                            ))}
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<CloudUploadIcon />}
                              onClick={() => openUploadModal(inv.testName)}
                              sx={{
                                alignSelf: 'flex-start',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: '#134F4D',
                                textTransform: 'none',
                                p: 0,
                                mt: 0.5
                              }}
                            >
                              + Upload Additional / Updated Report for {inv.testName}
                            </Button>
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                </Box>

                {prescription.investigationNotes && (
                  <Typography variant="caption" sx={{ display: 'block', color: '#475569', fontStyle: 'italic', mt: 1.5 }}>
                    Doctor's Lab Notes: "{prescription.investigationNotes}"
                  </Typography>
                )}
              </Box>
            )}

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

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* LAB & DIAGNOSTIC TEST REPORTS SECTION (Interactive / Responsive) */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <Paper 
            elevation={0} 
            className="no-print"
            sx={{ 
              mt: 3, 
              p: { xs: 2.5, sm: 3 }, 
              borderRadius: '24px', 
              border: '1px solid rgba(19, 79, 77, 0.15)', 
              bgcolor: '#ffffff',
              boxShadow: '0 8px 24px rgba(19, 79, 77, 0.04)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScienceIcon sx={{ color: '#134F4D', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#134F4D' }}>
                    Lab & Diagnostic Test Reports
                  </Typography>
                  <Chip 
                    label={reportsCount} 
                    size="small" 
                    sx={{ 
                      bgcolor: reportsCount > 0 ? '#134F4D' : '#94a3b8', 
                      color: '#ffffff', 
                      fontWeight: 800, 
                      height: 22 
                    }} 
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Uploaded test results & diagnostic scan files for this prescription
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="small"
                startIcon={<CloudUploadIcon />}
                onClick={() => openUploadModal()}
                sx={{
                  borderRadius: '12px',
                  fontWeight: 800,
                  bgcolor: '#134F4D',
                  color: '#ffffff',
                  px: 2,
                  py: 0.8,
                  boxShadow: '0 4px 12px rgba(19, 79, 77, 0.15)',
                  '&:hover': { bgcolor: '#0e3b3a' }
                }}
              >
                Upload Report
              </Button>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {/* Category / Test filter chips if multiple reports exist */}
            {reportsCount > 1 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                <Chip 
                  label={`All Reports (${reportsCount})`} 
                  size="small" 
                  onClick={() => setReportFilter('ALL')}
                  sx={{ 
                    fontWeight: 800, 
                    borderRadius: '10px',
                    bgcolor: reportFilter === 'ALL' ? '#134F4D' : '#f1f5f9',
                    color: reportFilter === 'ALL' ? '#ffffff' : '#475569',
                    '&:hover': { bgcolor: reportFilter === 'ALL' ? '#0e3b3a' : '#e2e8f0' }
                  }}
                />
                {Array.from(new Set(testReports.map(r => r.testName).filter(Boolean))).map((tName) => {
                  const count = testReports.filter(r => r.testName === tName).length;
                  const isSelected = reportFilter === tName;
                  return (
                    <Chip 
                      key={String(tName)}
                      label={`${tName} (${count})`}
                      size="small"
                      onClick={() => setReportFilter(String(tName))}
                      sx={{ 
                        fontWeight: 800, 
                        borderRadius: '10px',
                        bgcolor: isSelected ? '#134F4D' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#475569',
                        '&:hover': { bgcolor: isSelected ? '#0e3b3a' : '#e2e8f0' }
                      }}
                    />
                  );
                })}
              </Box>
            )}

            {/* Reports List OR Empty State / Fallback Notice */}
            {reportsCount > 0 ? (
              <Grid container spacing={2}>
                {testReports.filter(r => reportFilter === 'ALL' || r.testName === reportFilter).map((report) => (
                  <Grid item xs={12} sm={6} key={report.id}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        border: '1px solid rgba(19, 79, 77, 0.2)',
                        bgcolor: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#134F4D',
                          boxShadow: '0 6px 20px rgba(19, 79, 77, 0.08)'
                        }
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                          <Box
                            sx={{
                              p: 1.2,
                              borderRadius: '12px',
                              bgcolor: report.fileType === 'pdf' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                              color: report.fileType === 'pdf' ? '#dc2626' : '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {report.fileType === 'pdf' ? <PdfIcon sx={{ fontSize: 26 }} /> : <ImageIcon sx={{ fontSize: 26 }} />}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Chip 
                              label={report.testName || 'Lab Report'} 
                              size="small" 
                              sx={{ 
                                height: 20, 
                                fontSize: '0.65rem', 
                                fontWeight: 800, 
                                bgcolor: 'rgba(19, 79, 77, 0.12)', 
                                color: '#134F4D',
                                mb: 0.5 
                              }} 
                            />
                            <Typography 
                              variant="subtitle2" 
                              noWrap 
                              sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}
                              title={report.originalName || report.filename}
                            >
                              {report.originalName || report.filename}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                              {formatFileSize(report.fileSize)} • {new Date(report.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Typography>
                          </Box>
                        </Box>

                        {report.uploadedByName && (
                          <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 0.5 }}>
                            Uploaded by: <strong>{report.uploadedByName}</strong> ({report.uploaderRole || 'User'})
                          </Typography>
                        )}

                        {report.notes && (
                          <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#ffffff', border: '1px solid #e2e8f0', mt: 1, mb: 1.5 }}>
                            <Typography variant="caption" sx={{ color: '#475569', fontStyle: 'italic', display: 'block' }}>
                              Note: "{report.notes}"
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 0.8, pt: 1, borderTop: '1px dashed #e2e8f0', mt: 1, alignItems: 'center' }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<VisibilityIcon />}
                          onClick={() => openReportViewer(report)}
                          sx={{
                            flex: 1,
                            borderRadius: '10px',
                            fontWeight: 800,
                            bgcolor: '#134F4D',
                            fontSize: '0.75rem',
                            py: 0.6,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#0e3b3a' }
                          }}
                        >
                          View Report
                        </Button>
                        <Tooltip title="Print report document">
                          <IconButton
                            size="small"
                            onClick={() => handlePrintReport(report)}
                            sx={{
                              borderRadius: '10px',
                              border: '1px solid rgba(19, 79, 77, 0.3)',
                              color: '#134F4D',
                              p: 0.7,
                              '&:hover': { bgcolor: 'rgba(19, 79, 77, 0.08)' }
                            }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download file to device">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadReportFile(report)}
                            sx={{
                              borderRadius: '10px',
                              border: '1px solid rgba(19, 79, 77, 0.3)',
                              color: '#134F4D',
                              p: 0.7,
                              '&:hover': { bgcolor: 'rgba(19, 79, 77, 0.08)' }
                            }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {(isDoctor || user?.id === report.uploadedBy || user?.role === 'admin') && (
                          <Tooltip title="Delete report">
                            <IconButton
                              size="small"
                              disabled={deletingReportId === report.id}
                              onClick={() => handleDeleteReport(report.id)}
                              sx={{
                                borderRadius: '10px',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#dc2626',
                                p: 0.7,
                                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' }
                              }}
                            >
                              {deletingReportId === report.id ? <CircularProgress size={16} color="error" /> : <DeleteIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              /* Fallback Notice for Doctor / Patient when no reports uploaded */
              <Box
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: '18px',
                  bgcolor: isDoctor ? 'rgba(245, 158, 11, 0.06)' : 'rgba(19, 79, 77, 0.05)',
                  border: isDoctor ? '1px dashed rgba(245, 158, 11, 0.4)' : '1px dashed rgba(19, 79, 77, 0.3)',
                  textAlign: 'center'
                }}
              >
                <ScienceIcon sx={{ fontSize: 44, color: isDoctor ? '#d97706' : '#134F4D', opacity: 0.8, mb: 1 }} />
                
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDoctor ? '#92400e' : '#134F4D', mb: 0.5 }}>
                  {isDoctor ? 'Patient has not uploaded test reports yet' : 'No test reports uploaded yet'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 2, fontSize: '0.85rem' }}>
                  {isDoctor 
                    ? 'When the patient uploads lab or diagnostic test reports for this prescription, they will automatically appear here for your direct review.' 
                    : 'Your doctor requested diagnostic tests for this prescription. Upload your lab results or diagnostic scan reports (PDF or images) so your doctor can review them.'}
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => {
                    setUploadError(null);
                    setUploadModalOpen(true);
                  }}
                  sx={{
                    borderRadius: '14px',
                    fontWeight: 800,
                    bgcolor: isDoctor ? '#2A6B5D' : '#134F4D',
                    color: '#ffffff',
                    px: 3,
                    py: 1,
                    '&:hover': { bgcolor: isDoctor ? '#1E4D43' : '#0e3b3a' }
                  }}
                >
                  {isDoctor ? 'Upload In-Clinic Lab Report' : 'Upload Test Report Now'}
                </Button>
              </Box>
            )}
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
                {/* Upload Test Report Action */}
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => openUploadModal()}
                  sx={{ 
                    height: 48, 
                    borderRadius: '16px',
                    bgcolor: '#2A6B5D', 
                    color: '#ffffff',
                    fontWeight: 800, 
                    boxShadow: '0 4px 16px rgba(42, 107, 93, 0.25)',
                    '&:hover': { bgcolor: '#1E4D43' } 
                  }}
                >
                  Upload Lab / Test Report
                </Button>

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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: UPLOAD LAB / TEST REPORT */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={uploadModalOpen}
        onClose={() => !uploading && setUploadModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '24px', p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScienceIcon sx={{ color: '#134F4D' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#134F4D' }}>
              Upload Lab / Test Report
            </Typography>
          </Box>
          <IconButton onClick={() => !uploading && setUploadModalOpen(false)} disabled={uploading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: '#f1f5f9' }}>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
              {uploadError}
            </Alert>
          )}

          {uploadSuccess && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
              {uploadSuccess}
            </Alert>
          )}

          {/* Test Name Selection: STRICTLY requested tests only */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A312C', mb: 0.8 }}>
              Select Associated Test / Investigation
            </Typography>
            
            {investigationsList.length > 0 ? (
              <>
                <TextField
                  fullWidth
                  select
                  size="small"
                  value={isCustomTest ? '__CUSTOM__' : uploadTestName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__CUSTOM__') {
                      setIsCustomTest(true);
                      setUploadTestName('');
                    } else {
                      setIsCustomTest(false);
                      setUploadTestName(val);
                    }
                  }}
                  SelectProps={{ displayEmpty: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: '14px' }
                  }}
                >
                  {investigationsList.map((inv, i) => (
                    <MenuItem key={i} value={inv.testName}>
                      🧪 {inv.testName} {inv.priority ? `(${inv.priority.toUpperCase()})` : ''} {inv.fasting ? `• Fasting: ${inv.fasting}` : ''}
                    </MenuItem>
                  ))}
                  <MenuItem value="__CUSTOM__">
                    <em>➕ Other / Additional Diagnostic Test...</em>
                  </MenuItem>
                </TextField>

                {isCustomTest && (
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type diagnostic test / scan name"
                    value={customTestName}
                    onChange={(e) => setCustomTestName(e.target.value)}
                    sx={{
                      mt: 1.5,
                      '& .MuiOutlinedInput-root': { borderRadius: '14px' }
                    }}
                    autoFocus
                  />
                )}
              </>
            ) : (
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Complete Blood Count (CBC), Chest X-Ray"
                value={uploadTestName}
                onChange={(e) => setUploadTestName(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '14px' }
                }}
              />
            )}
          </Box>

          {/* File Picker / Drop Zone */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A312C', mb: 0.8 }}>
              Report File (PDF, JPEG, PNG, WEBP — up to 10MB)
            </Typography>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                p: 3,
                border: uploadFile ? '2px solid #134F4D' : '2px dashed rgba(19, 79, 77, 0.4)',
                borderRadius: '18px',
                bgcolor: uploadFile ? 'rgba(19, 79, 77, 0.04)' : '#f8fafc',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(19, 79, 77, 0.08)',
                  borderColor: '#134F4D'
                }
              }}
            >
              {uploadFile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  {uploadFile.type === 'application/pdf' ? (
                    <PdfIcon sx={{ fontSize: 44, color: '#dc2626' }} />
                  ) : (
                    <ImageIcon sx={{ fontSize: 44, color: '#2563eb' }} />
                  )}
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {uploadFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(uploadFile.size)} • Click to change file
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <CloudUploadIcon sx={{ fontSize: 44, color: '#134F4D', opacity: 0.8 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#134F4D' }}>
                    Click to browse or drop your test report file
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Supports high-resolution camera photos, lab scan PDFs & image files
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Optional Notes */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A312C', mb: 0.8 }}>
              Notes for Doctor (Optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="e.g. Fasting sample taken at 8:00 AM at City Labs"
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '14px' }
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setUploadModalOpen(false)}
            disabled={uploading}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadReport}
            disabled={uploading || !uploadFile}
            startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
            sx={{
              borderRadius: '12px',
              fontWeight: 800,
              bgcolor: '#134F4D',
              color: '#ffffff',
              px: 3,
              textTransform: 'none',
              '&:hover': { bgcolor: '#0e3b3a' }
            }}
          >
            {uploading ? 'Uploading...' : 'Upload & Attach Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: FULL REPORT IN-PLACE VIEWER (Rich PDF & Image inspection) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={viewReportModalOpen}
        onClose={() => setViewReportModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '24px', p: 1, maxHeight: '95vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: '10px',
                bgcolor: selectedReport?.fileType === 'pdf' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                color: selectedReport?.fileType === 'pdf' ? '#dc2626' : '#2563eb',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {selectedReport?.fileType === 'pdf' ? <PdfIcon /> : <ImageIcon />}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={selectedReport?.testName || 'Lab Report'} 
                  size="small" 
                  sx={{ fontWeight: 800, bgcolor: 'rgba(19, 79, 77, 0.12)', color: '#134F4D', height: 22 }} 
                />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  {selectedReport?.originalName || selectedReport?.filename}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {selectedReport?.fileSize ? formatFileSize(selectedReport.fileSize) : ''} • Uploaded {selectedReport?.uploadedAt ? new Date(selectedReport.uploadedAt).toLocaleDateString() : ''}
              </Typography>
            </Box>
          </Box>

          {/* Interactive Viewer Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
            {/* Prev / Next Report Switcher if multiple reports */}
            {testReports.length > 1 && (
              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f1f5f9', borderRadius: '10px', p: 0.3, mr: 1 }}>
                <Tooltip title="Previous Report">
                  <IconButton size="small" onClick={handlePrevReport}>
                    <PrevIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" sx={{ px: 1, fontWeight: 700, color: '#334155' }}>
                  {(testReports.findIndex(r => r.id === selectedReport?.id) + 1)} / {testReports.length}
                </Typography>
                <Tooltip title="Next Report">
                  <IconButton size="small" onClick={handleNextReport}>
                    <NextIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {/* Image zoom and rotation toolbar */}
            {selectedReport?.fileType !== 'pdf' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#f1f5f9', borderRadius: '10px', p: 0.3 }}>
                <Tooltip title="Zoom In">
                  <IconButton size="small" onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}>
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" sx={{ px: 0.5, fontWeight: 700, minWidth: '40px', textAlign: 'center' }}>
                  {Math.round(zoomLevel * 100)}%
                </Typography>
                <Tooltip title="Zoom Out">
                  <IconButton size="small" onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}>
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Rotate 90°">
                  <IconButton size="small" onClick={() => setRotation(prev => (prev + 90) % 360)}>
                    <RotateRightIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Toggle Dark Contrast (Radiology/X-Ray Mode)">
                  <IconButton 
                    size="small" 
                    onClick={() => setDarkModeViewer(prev => !prev)}
                    sx={{ color: darkModeViewer ? '#2563eb' : 'inherit' }}
                  >
                    <ContrastIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset View">
                  <IconButton size="small" onClick={() => { setZoomLevel(1); setRotation(0); }}>
                    <ResetIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {selectedReport?.fileUrl && (
              <>
                <Tooltip title="Print this medical report / image">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={() => handlePrintReport(selectedReport)}
                    sx={{ 
                      borderRadius: '10px', 
                      fontWeight: 800, 
                      textTransform: 'none', 
                      borderColor: 'rgba(19, 79, 77, 0.35)', 
                      color: '#134F4D',
                      '&:hover': { bgcolor: 'rgba(19, 79, 77, 0.08)', borderColor: '#134F4D' }
                    }}
                  >
                    Print
                  </Button>
                </Tooltip>

                <Tooltip title="Download original report file to device">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadReportFile(selectedReport)}
                    sx={{ 
                      borderRadius: '10px', 
                      fontWeight: 800, 
                      textTransform: 'none', 
                      bgcolor: '#134F4D', 
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(19, 79, 77, 0.2)',
                      '&:hover': { bgcolor: '#0e3b3a' }
                    }}
                  >
                    Download
                  </Button>
                </Tooltip>

                <Tooltip title="Open full document in new tab">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => window.open(resolveFileUrl(selectedReport.fileUrl), '_blank')}
                    sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', borderColor: 'rgba(19, 79, 77, 0.3)', color: '#134F4D' }}
                  >
                    New Tab
                  </Button>
                </Tooltip>
              </>
            )}

            <IconButton onClick={() => setViewReportModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent 
          dividers 
          sx={{ 
            p: { xs: 1, sm: 2 }, 
            textAlign: 'center', 
            bgcolor: darkModeViewer ? '#0b1315' : '#f8fafc',
            transition: 'background-color 0.2s ease',
            overflow: 'auto',
            minHeight: '60vh',
            maxHeight: '75vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {selectedReport && (
            <Box 
              sx={{ 
                width: '100%', 
                flex: 1, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                overflow: 'auto',
                p: 1
              }}
            >
              {selectedReport.fileType === 'pdf' ? (
                <Box sx={{ width: '100%', height: '65vh', display: 'flex', flexDirection: 'column' }}>
                  <iframe
                    src={resolveFileUrl(selectedReport.fileUrl)}
                    title={selectedReport.originalName || 'PDF Report'}
                    width="100%"
                    height="100%"
                    style={{ border: 'none', borderRadius: '14px', flex: 1 }}
                  />
                  <Box sx={{ mt: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      If PDF preview is blocked by your browser,{' '}
                      <a 
                        href={resolveFileUrl(selectedReport.fileUrl)} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: '#134F4D', fontWeight: 700 }}
                      >
                        click here to view directly in browser
                      </a>
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'inline-block',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    cursor: zoomLevel > 1 ? 'grab' : 'default'
                  }}
                >
                  <Box
                    component="img"
                    src={resolveFileUrl(selectedReport.fileUrl)}
                    alt={selectedReport.testName || 'Test Report'}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '65vh',
                      borderRadius: '14px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                      objectFit: 'contain',
                      bgcolor: '#ffffff'
                    }}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Report Metadata & Clinical Notes Banner */}
          {selectedReport && (
            <Paper 
              variant="outlined" 
              sx={{ 
                mt: 2, 
                p: 2, 
                borderRadius: '16px', 
                bgcolor: '#ffffff', 
                border: '1px solid #e2e8f0', 
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#134F4D' }}>
                  Investigation: {selectedReport.testName || 'Diagnostic Report'}
                </Typography>
                {selectedReport.uploadedByName && (
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Uploaded by: <strong>{selectedReport.uploadedByName}</strong> ({selectedReport.uploaderRole || 'User'})
                  </Typography>
                )}
              </Box>

              {selectedReport.notes && (
                <Box sx={{ p: 1.2, borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#134F4D', display: 'block', mb: 0.2 }}>
                    Notes for Doctor:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic' }}>
                    "{selectedReport.notes}"
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </DialogContent>
      </Dialog>

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
