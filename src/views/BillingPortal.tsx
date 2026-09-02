'use client';
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  InputAdornment
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';
import CancelIcon from '@mui/icons-material/Cancel';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { healthcareApi } from '../services/healthcareExtensionsApi';
import api from '../services/api';
import { getCachedData } from '../services/apiCache';

const DEFAULT_CLINIC_SERVICES = [
  { id: 'srv_1', name: 'Nebulization', price: 150, code: '999312', active: true },
  { id: 'srv_2', name: 'Wound Dressing / Suture Removal', price: 200, code: '999312', active: true },
  { id: 'srv_3', name: 'ECG Recording', price: 300, code: '999312', active: true },
  { id: 'srv_4', name: 'Blood Sugar Rapid Test', price: 100, code: '999312', active: true },
  { id: 'srv_5', name: 'Injection Administration', price: 50, code: '999312', active: true },
  { id: 'srv_6', name: 'Ear Syringing', price: 250, code: '999312', active: true }
];

export default function BillingPortal() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [bills, setBills] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [dayCloseSummary, setDayCloseSummary] = useState<any>(null);
  const [rateCard, setRateCard] = useState<any>({
    consultationFee: 500,
    followUpFee: 0,
    followUpDays: 7,
    teleconsultFee: 400,
    clinicUpiVpa: '',
    clinicGstin: '',
    defaultGstType: 'exempt',
    clinicServices: DEFAULT_CLINIC_SERVICES
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [autoSyncing, setAutoSyncing] = useState(false);

  // In-Clinic Procedures Management State in Rate Card Modal
  const [newProcName, setNewProcName] = useState('');
  const [newProcPrice, setNewProcPrice] = useState<string>('');

  const handleAddProcedure = () => {
    if (!newProcName.trim()) return;
    const priceNum = Math.max(0, parseFloat(newProcPrice) || 0);
    const newService = {
      id: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newProcName.trim(),
      price: priceNum,
      code: '999312',
      active: true
    };
    setRateCard((prev: any) => ({
      ...prev,
      clinicServices: [...(prev.clinicServices || []), newService]
    }));
    setNewProcName('');
    setNewProcPrice('');
  };

  const handleUpdateProcedure = (id: string, field: 'name' | 'price', value: any) => {
    setRateCard((prev: any) => ({
      ...prev,
      clinicServices: (prev.clinicServices || []).map((s: any) => {
        if (s.id === id) {
          return {
            ...s,
            [field]: field === 'price' ? (value === '' ? '' : Math.max(0, parseFloat(value) || 0)) : value
          };
        }
        return s;
      })
    }));
  };

  const handleDeleteProcedure = (id: string) => {
    setRateCard((prev: any) => ({
      ...prev,
      clinicServices: (prev.clinicServices || []).filter((s: any) => s.id !== id)
    }));
  };

  const handleResetDefaultProcedures = () => {
    if (window.confirm('Reset in-clinic procedure list to standard OPD clinic defaults?')) {
      setRateCard((prev: any) => ({
        ...prev,
        clinicServices: DEFAULT_CLINIC_SERVICES
      }));
    }
  };

  // Generate bill modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  const [consultationFee, setConsultationFee] = useState(500);
  const [visitType, setVisitType] = useState('standard');
  const [applyGst, setApplyGst] = useState(false);
  const [gstRate, setGstRate] = useState(18);
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discount, setDiscount] = useState(0);
  const [concessionReason, setConcessionReason] = useState('');
  const [markAsPaid, setMarkAsPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPatientApp, setSendPatientApp] = useState(true);

  // Payment recording modal (partial / split)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [payingAmount, setPayingAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Invoice detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeBillDetail, setActiveBillDetail] = useState<any>(null);

  // Table-top UPI QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrBill, setQrBill] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Rate card settings modal
  const [rateCardModalOpen, setRateCardModalOpen] = useState(false);
  const [rateCardSaving, setRateCardSaving] = useState(false);

  const fetchData = async (isBackground = false) => {
    if (!isBackground && bills.length === 0) {
      setLoading(true);
    }
    try {
      if (isDoctor) {
        const [billsRes, rxRes, dayCloseRes, rateRes] = await Promise.allSettled([
          healthcareApi.getDoctorBills(isBackground),
          api.get('/prescriptions'),
          healthcareApi.getDailyCollectionReport(),
          healthcareApi.getDoctorRateCard(isBackground)
        ]);
        if (billsRes.status === 'fulfilled' && billsRes.value.success) setBills(billsRes.value.bills || []);
        if (rxRes.status === 'fulfilled' && Array.isArray(rxRes.value.data)) setPrescriptions(rxRes.value.data);
        if (dayCloseRes.status === 'fulfilled' && dayCloseRes.value.success) setDayCloseSummary(dayCloseRes.value.summary);
        if (rateRes.status === 'fulfilled' && rateRes.value.success && rateRes.value.rateCard) setRateCard(rateRes.value.rateCard);
      } else {
        const billsRes = await healthcareApi.getMyBills(isBackground);
        if (billsRes.success) setBills(billsRes.bills || []);
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let hasWarmData = false;
    // Show cached data instantly (from prefetch), then refresh in background
    if (isDoctor) {
      const cachedBillsRaw = getCachedData<any>('doctor_bills');
      const cachedDayClose = getCachedData<any>('day_close_summary');
      const cachedRateCard = getCachedData<any>('doctor_rate_card');
      // Cache may contain the full API response { success, bills } or a raw array
      const cachedBills = Array.isArray(cachedBillsRaw) ? cachedBillsRaw : (cachedBillsRaw?.bills || null);
      if (cachedBills && Array.isArray(cachedBills)) { setBills(cachedBills); hasWarmData = true; }
      if (cachedDayClose) setDayCloseSummary(cachedDayClose);
      if (cachedRateCard) setRateCard((prev: any) => ({ ...prev, ...cachedRateCard }));
    } else {
      const cachedBillsRaw = getCachedData<any>('my_bills');
      const cachedBills = Array.isArray(cachedBillsRaw) ? cachedBillsRaw : (cachedBillsRaw?.bills || null);
      if (cachedBills && Array.isArray(cachedBills)) { setBills(cachedBills); hasWarmData = true; }
    }
    if (hasWarmData) {
      setLoading(false);
    }
    // Refresh silently in background
    fetchData(hasWarmData);
  }, [isDoctor]);

  const handleOpenQrModal = (bill: any) => {
    setQrBill(bill);
    const amount = Number(bill.balanceDue) > 0 ? Number(bill.balanceDue) : Number(bill.totalAmount);
    const upiVpa = bill.upiVpa || rateCard.clinicUpiVpa || 'medizoclinic@icici';
    const docName = bill.doctorName || `Dr. ${user?.firstName || ''} ${user?.lastName || ''}`;
    const uri = bill.upiQrData || `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(docName)}&am=${amount.toFixed(2)}&cu=INR&tn=Bill%20${bill.billNumber}`;
    setQrDataUrl(uri);
    setQrModalOpen(true);
  };

  const handleOpenDetailModal = (bill: any) => {
    setActiveBillDetail(bill);
    setDetailModalOpen(true);
  };

  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrescriptionId) {
      alert('Please select a prescription');
      return;
    }

    try {
      const activeChannels = [
        sendEmail && 'email',
        sendPatientApp && 'patient_app'
      ].filter(Boolean);

      const res = await healthcareApi.generateBillFromPrescription(selectedPrescriptionId, {
        consultationFee: Number(consultationFee),
        visitType,
        applyGst,
        gstType: applyGst ? 'cgst_sgst' : 'exempt',
        gstRate: applyGst ? Number(gstRate) : 0,
        discount: Number(discount),
        concessionReason,
        markAsPaid,
        paymentMethod,
        sendToPatient: activeChannels.length > 0,
        dispatchChannel: activeChannels.join(',') || 'none'
      });
      if (res.success) {
        setToast(`Bill ${res.bill.billNumber} generated & synced to patient!`);
        setGenerateModalOpen(false);
        setSelectedPrescriptionId('');
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate bill');
    }
  };

  const handleAutoSyncUnbilled = async () => {
    if (!prescriptions || prescriptions.length === 0) {
      alert('No prescriptions found in your account to sync.');
      return;
    }

    try {
      setAutoSyncing(true);
      const billedRxIds = new Set(bills.map(b => b.prescriptionId).filter(Boolean));
      const unbilledRx = prescriptions.filter(rx => !billedRxIds.has(rx.id || rx._id));

      if (unbilledRx.length === 0) {
        setToast('All prescriptions are already billed!');
        return;
      }

      let createdCount = 0;
      for (const rx of unbilledRx) {
        try {
          const rxId = rx.id || rx._id;
          await healthcareApi.generateBillFromPrescription(rxId, {
            consultationFee: Number(rateCard.consultationFee || 500),
            visitType: 'standard',
            gstType: rateCard.defaultGstType || 'exempt',
            applyGst: false,
            markAsPaid: true,
            paymentMethod: 'cash',
            sendToPatient: false
          });
          createdCount++;
        } catch (itemErr) {
          console.warn('Sync notice for Rx:', itemErr);
        }
      }

      setToast(`Auto-billing complete! Generated ${createdCount} new Bills of Supply.`);
      fetchData();
    } catch (err: any) {
      alert('Failed to complete auto-billing sync');
    } finally {
      setAutoSyncing(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      const res = await healthcareApi.recordPartialPayment(selectedBill.id, {
        amount: Number(payingAmount),
        paymentMode,
        upiTransactionRef: paymentRef || `TXN-${Date.now()}`,
        notes: paymentNotes
      });
      if (res.success) {
        setToast('Payment recorded successfully in ledger!');
        setPaymentModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleDownloadPdf = async (bill: any) => {
    try {
      await healthcareApi.downloadBillPdf(bill.id, bill.billNumber);
    } catch (e) {
      alert('Failed to download official PDF receipt. Please check connection.');
    }
  };

  const handleDispatchBill = async (billItem: any) => {
    try {
      const bId = typeof billItem === 'string' ? billItem : billItem.id;
      const bNum = billItem?.billNumber || 'Medical Bill';
      const bTot = billItem?.totalAmount || '';

      const res = await healthcareApi.dispatchBill(bId, 'email,patient_app');
      if (res.success) {
        setToast('Bill dispatched via Email (PDF) & synced to Patient App!');
      }
    } catch (e) {
      alert('Failed to dispatch bill');
    }
  };

  const handleCancelBill = async (billId: string) => {
    const reason = prompt('Please enter the cancellation reason for the audit log:');
    if (!reason) return;
    try {
      const res = await healthcareApi.cancelBill(billId, reason);
      if (res.success) {
        setToast('Bill marked as cancelled');
        fetchData();
      }
    } catch (e) {
      alert('Failed to cancel bill');
    }
  };

  const handleSaveRateCard = async () => {
    try {
      setRateCardSaving(true);
      const res = await healthcareApi.updateDoctorRateCard(rateCard);
      if (res.success) {
        setToast('Rate card and UPI settings saved successfully!');
        setRateCardModalOpen(false);
      }
    } catch (e) {
      alert('Failed to save rate card');
    } finally {
      setRateCardSaving(false);
    }
  };

  const getStatusChip = (status: string) => {
    const map: Record<string, { color: string; bg: string; label: string }> = {
      draft: { color: isDark ? '#FFB74D' : '#D97706', bg: isDark ? 'rgba(255,152,0,0.18)' : '#FEF3C7', label: 'DRAFT' },
      issued: { color: isDark ? '#60A5FA' : '#2563EB', bg: isDark ? 'rgba(33,150,243,0.18)' : '#DBEAFE', label: 'ISSUED / UNPAID' },
      partially_paid: { color: isDark ? '#FBBF24' : '#B45309', bg: isDark ? 'rgba(245,158,11,0.2)' : '#FDE68A', label: 'PARTIAL PAID' },
      paid: { color: isDark ? '#34D399' : '#059669', bg: isDark ? 'rgba(0,200,150,0.18)' : '#D1FAE5', label: 'PAID IN FULL' },
      cancelled: { color: isDark ? '#F87171' : '#DC2626', bg: isDark ? 'rgba(239,68,68,0.18)' : '#FEE2E2', label: 'CANCELLED' },
      refunded: { color: isDark ? '#C084FC' : '#7E22CE', bg: isDark ? 'rgba(168,85,247,0.18)' : '#F3E8FF', label: 'REFUNDED' }
    };
    const s = map[status] || { color: isDark ? '#94A8A3' : '#64748B', bg: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', label: status?.toUpperCase() || 'UNKNOWN' };
    return (
      <Chip
        label={s.label}
        size="small"
        sx={{ bgcolor: s.bg, color: s.color, fontWeight: 800, borderRadius: '8px', fontSize: '0.7rem' }}
      />
    );
  };

  // Theme-adaptive color helpers
  const cardBg = isDark ? 'rgba(19, 31, 34, 0.95)' : '#FFFFFF';
  const cardBorder = isDark ? '1px solid rgba(0, 200, 150, 0.25)' : '1px solid rgba(42, 107, 93, 0.16)';
  const cardShadow = isDark ? '0 16px 36px rgba(0,0,0,0.45)' : '0 8px 24px rgba(42, 107, 93, 0.08)';
  const textPrimary = isDark ? '#EBF5F3' : '#123029';
  const textSecondary = isDark ? '#94A8A3' : '#4D7268';
  const inputBg = isDark ? '#0B1315' : '#F4FAF8';

  return (
    <Container maxWidth="lg" sx={{ py: 4, fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
      {/* Toast Alert */}
      {toast && (
        <Alert 
          severity="success" 
          onClose={() => setToast('')} 
          sx={{ 
            mb: 3, 
            borderRadius: '16px', 
            fontWeight: 800,
            bgcolor: isDark ? 'rgba(0,200,150,0.18)' : '#D1FAE5',
            color: isDark ? '#34D399' : '#065F46',
            border: isDark ? '1px solid rgba(0,200,150,0.4)' : '1px solid #A7F3D0'
          }}
        >
          {toast}
        </Alert>
      )}

      {/* Header Banner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: textPrimary, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PaymentsIcon sx={{ color: isDark ? '#2DD4BF' : '#0D9488', fontSize: '2.4rem' }} />
            {isDoctor ? 'Clinical Billing & OPD Cash Register' : 'My Medical Invoices & Receipts'}
          </Typography>
          <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5, fontWeight: 600 }}>
            {isDoctor 
              ? 'Official Indian GST Bills of Supply, dynamic UPI QR payments, split ledger, and daily collection reports.'
              : 'View itemized medical receipts, tax invoices, and pay securely via UPI.'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {isDoctor && (
            <>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setRateCardModalOpen(true)}
                sx={{
                  borderRadius: '14px',
                  borderColor: isDark ? 'rgba(0, 200, 150, 0.4)' : 'rgba(42, 107, 93, 0.4)',
                  color: isDark ? '#2DD4BF' : '#0D9488',
                  fontWeight: 800,
                  textTransform: 'none',
                  bgcolor: isDark ? 'transparent' : 'rgba(42, 107, 93, 0.04)',
                  '&:hover': { borderColor: isDark ? '#2DD4BF' : '#0D9488', bgcolor: isDark ? 'rgba(0,200,150,0.1)' : 'rgba(42,107,93,0.08)' }
                }}
              >
                Rate Card & UPI
              </Button>
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                disabled={autoSyncing}
                onClick={handleAutoSyncUnbilled}
                sx={{
                  borderRadius: '14px',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(14, 165, 233, 0.4)',
                  color: isDark ? '#38BDF8' : '#0284C7',
                  fontWeight: 800,
                  textTransform: 'none',
                  bgcolor: isDark ? 'transparent' : 'rgba(14, 165, 233, 0.04)',
                  '&:hover': { borderColor: isDark ? '#38BDF8' : '#0284C7', bgcolor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(14,165,233,0.08)' }
                }}
              >
                {autoSyncing ? 'Syncing...' : 'Auto-Bill Unbilled'}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => setGenerateModalOpen(true)}
                sx={{
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' }
                }}
              >
                + Create Bill
              </Button>
            </>
          )}
          <IconButton 
            onClick={() => fetchData(false)} 
            sx={{ 
              color: textSecondary, 
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(42, 107, 93, 0.08)',
              borderRadius: '14px'
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* ─── DOCTOR OPD DAY-CLOSE COLLECTION BAR ─── */}
      {isDoctor && dayCloseSummary && (
        <Grid container spacing={2} sx={{ mb: 3.5 }}>
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2.2, borderRadius: '20px', bgcolor: cardBg, border: cardBorder, boxShadow: cardShadow }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: isDark ? '#2DD4BF' : '#0D9488', mb: 0.5 }}>
                <MonetizationOnIcon sx={{ fontSize: 20 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Today's Total Billed</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: textPrimary }}>
                ₹{dayCloseSummary.totalBilled?.toFixed(2) || '0.00'}
              </Typography>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>{dayCloseSummary.billCount || 0} Bills Issued</Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2.2, borderRadius: '20px', bgcolor: cardBg, border: cardBorder, boxShadow: cardShadow }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#10B981', mb: 0.5 }}>
                <CheckCircleIcon sx={{ fontSize: 20 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Collected Cash</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#10B981' }}>
                ₹{dayCloseSummary.cashTotal?.toFixed(2) || '0.00'}
              </Typography>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>In-Clinic Cash Drawer</Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2.2, borderRadius: '20px', bgcolor: cardBg, border: cardBorder, boxShadow: cardShadow }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0284C7', mb: 0.5 }}>
                <QrCode2Icon sx={{ fontSize: 20 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Collected UPI / Online</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#38BDF8' : '#0284C7' }}>
                ₹{((dayCloseSummary.upiTotal || 0) + (dayCloseSummary.cardTotal || 0))?.toFixed(2) || '0.00'}
              </Typography>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>UPI / Card Settlements</Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2.2, borderRadius: '20px', bgcolor: cardBg, border: isDark ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(220, 38, 38, 0.2)', boxShadow: cardShadow }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#EF4444', mb: 0.5 }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 20 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pending Balance</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: dayCloseSummary.pendingBalance > 0 ? '#EF4444' : '#10B981' }}>
                ₹{dayCloseSummary.pendingBalance?.toFixed(2) || '0.00'}
              </Typography>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>Due from Patients</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Main Bills List Table */}
      <Paper elevation={0} sx={{ bgcolor: cardBg, borderRadius: '24px', border: cardBorder, boxShadow: cardShadow, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: isDark ? '#2DD4BF' : '#0D9488' }} />
          </Box>
        ) : bills.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <ReceiptLongIcon sx={{ fontSize: 50, color: textSecondary, mb: 1.5, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ color: textPrimary, fontWeight: 800 }}>No Invoices Found</Typography>
            <Typography variant="body2" sx={{ color: textSecondary, mt: 0.5 }}>
              {isDoctor ? 'Prescription bills created in consultations will appear here.' : 'You have no issued medical bills at this time.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: isDark ? '#0B1315' : '#E6F4F1' }}>
                <TableRow>
                  <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800 }}>Bill / Invoice #</TableCell>
                  <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800 }}>Date</TableCell>
                  <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800 }}>{isDoctor ? 'Patient' : 'Attending Doctor'}</TableCell>
                  <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800 }}>GST Classification</TableCell>
                  <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800 }}>Total Billed</TableCell>
                  <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800 }}>Paid / Balance Due</TableCell>
                  <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.map((bill) => {
                  const isExempt = bill.gstType === 'exempt' || !bill.gstRate || bill.gstRate === 0;
                  const bal = Number(bill.balanceDue) !== undefined ? Number(bill.balanceDue) : (bill.status === 'paid' ? 0 : Number(bill.totalAmount));
                  const paid = Number(bill.amountPaid) !== undefined ? Number(bill.amountPaid) : (bill.status === 'paid' ? Number(bill.totalAmount) : 0);

                  return (
                    <TableRow 
                      key={bill.id} 
                      sx={{ 
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(42, 107, 93, 0.04)' },
                        borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(42, 107, 93, 0.08)'
                      }}
                    >
                      <TableCell sx={{ color: isDark ? '#2DD4BF' : '#0D9488', fontWeight: 900, fontFamily: 'monospace' }}>
                        {bill.billNumber}
                      </TableCell>
                      <TableCell sx={{ color: textPrimary, fontSize: '0.85rem' }}>
                        {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ color: textPrimary, fontWeight: 700 }}>
                        {isDoctor ? (bill.patientName || 'Patient') : (bill.doctorName || 'Doctor')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={isExempt ? 'EXEMPT (SAC 999312)' : `GST ${bill.gstRate}%`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            bgcolor: isExempt 
                              ? (isDark ? 'rgba(0,200,150,0.18)' : '#D1FAE5') 
                              : (isDark ? 'rgba(255,152,0,0.18)' : '#FEF3C7'),
                            color: isExempt 
                              ? (isDark ? '#34D399' : '#065F46') 
                              : (isDark ? '#FBBF24' : '#92400E')
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: textPrimary, fontWeight: 900 }}>
                        ₹{Number(bill.totalAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 800, display: 'block' }}>
                          Paid: ₹{paid.toFixed(2)}
                        </Typography>
                        {bal > 0 ? (
                          <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 800, display: 'block' }}>
                            Due: ₹{bal.toFixed(2)}
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700, display: 'block' }}>
                            ✓ Settled
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusChip(bill.status)}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                          {/* View Details Button */}
                          <Tooltip title="View Itemized Breakdown & GST Audit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDetailModal(bill)}
                              sx={{ 
                                color: isDark ? '#38BDF8' : '#0284C7', 
                                bgcolor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#E0F2FE' 
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Dynamic NPCI Tabletop UPI QR */}
                          <Tooltip title="Show NPCI UPI QR Code for instant patient scanning">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenQrModal(bill)}
                              sx={{ 
                                color: isDark ? '#38BDF8' : '#0284C7', 
                                bgcolor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#E0F2FE' 
                              }}
                            >
                              <QrCode2Icon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Collect Cash / Record Payment */}
                          {isDoctor && bill.status !== 'paid' && bill.status !== 'cancelled' && (
                            <Tooltip title="Record Cash / Split Payment in Ledger">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedBill(bill);
                                  setPayingAmount(bal > 0 ? bal : Number(bill.totalAmount));
                                  setPaymentMode('cash');
                                  setPaymentRef('');
                                  setPaymentNotes('');
                                  setPaymentModalOpen(true);
                                }}
                                sx={{ 
                                  color: '#10B981', 
                                  bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#D1FAE5' 
                                }}
                              >
                                <PaymentsIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* WhatsApp / SMS Dispatch Button */}
                          {isDoctor && (
                            <Tooltip title="Send via WhatsApp & SMS / Web Share to Patient">
                              <IconButton
                                size="small"
                                onClick={() => handleDispatchBill(bill)}
                                sx={{ 
                                  color: isDark ? '#2DD4BF' : '#0D9488', 
                                  bgcolor: isDark ? 'rgba(0, 200, 150, 0.12)' : '#CCFBF1' 
                                }}
                              >
                                <SendIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Official PDF Download Button */}
                          <Tooltip title="Download Official Indian Bill of Supply / Tax Invoice PDF">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadPdf(bill)}
                              sx={{ 
                                color: textSecondary, 
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(42, 107, 93, 0.08)' 
                              }}
                            >
                              <DownloadIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Cancel / Void Button */}
                          {isDoctor && bill.status !== 'cancelled' && (
                            <Tooltip title="Void or Cancel Bill (Audit Log)">
                              <IconButton
                                size="small"
                                onClick={() => handleCancelBill(bill.id)}
                                sx={{ 
                                  color: '#EF4444', 
                                  bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2' 
                                }}
                              >
                                <CancelIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ─── MODAL: DYNAMIC TABLE-TOP UPI QR SCANNER ─── */}
      <Dialog
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: cardBg,
            color: textPrimary,
            border: cardBorder,
            textAlign: 'center',
            p: 2,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1, color: isDark ? '#2DD4BF' : '#0D9488' }}>
          📱 Scan & Pay via UPI
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: textSecondary, mb: 2, fontWeight: 600 }}>
            Supports Google Pay, PhonePe, Paytm, BHIM, and any Indian UPI banking app.
          </Typography>

          {qrDataUrl && (
            <Paper sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: '20px', mb: 2, display: 'inline-block', boxShadow: '0 4px 18px rgba(0,0,0,0.08)' }}>
              <QRCodeSVG value={qrDataUrl} size={220} level="H" />
            </Paper>
          )}

          <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0D9488', mb: 0.5 }}>
            ₹{qrBill ? (Number(qrBill.balanceDue) > 0 ? Number(qrBill.balanceDue).toFixed(2) : Number(qrBill.totalAmount).toFixed(2)) : '0.00'} INR
          </Typography>
          <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>
            Invoice #{qrBill?.billNumber || ''} • Payee: {rateCard.clinicUpiVpa || 'Doctor Clinic'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
          <Button onClick={() => setQrModalOpen(false)} sx={{ borderRadius: '12px', fontWeight: 800, color: textSecondary }}>
            Close
          </Button>
          {qrBill && (
            <Button
              variant="contained"
              onClick={() => {
                setQrModalOpen(false);
                setSelectedBill(qrBill);
                setPayingAmount(Number(qrBill.balanceDue) > 0 ? Number(qrBill.balanceDue) : Number(qrBill.totalAmount));
                setPaymentMode('upi');
                setPaymentModalOpen(true);
              }}
              sx={{ borderRadius: '12px', bgcolor: isDark ? '#2DD4BF' : '#0D9488', color: '#FFFFFF', fontWeight: 800, px: 2.5 }}
            >
              ✓ Mark Paid via UPI
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ─── MODAL: CREATE / GENERATE BILL ─── */}
      <Dialog
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: cardBg,
            color: textPrimary,
            border: cardBorder,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }
        }}
      >
        <form onSubmit={handleGenerateBill}>
          <DialogTitle sx={{ fontWeight: 900, pb: 1, color: isDark ? '#2DD4BF' : '#0D9488', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(42,107,93,0.1)' }}>
            🧾 Generate Indian Bill of Supply / Tax Invoice
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: textSecondary }}>Select Prescription</InputLabel>
              <Select
                value={selectedPrescriptionId}
                label="Select Prescription"
                onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                sx={{ borderRadius: '14px', bgcolor: inputBg }}
                required
              >
                {prescriptions.length === 0 ? (
                  <MenuItem disabled value="">No active prescriptions found</MenuItem>
                ) : (
                  prescriptions.map((rx) => {
                    const rxId = rx.id || rx._id;
                    return (
                      <MenuItem key={rxId} value={rxId}>
                        {rx.patientName || 'Patient'} • RX-{rxId.substring(0, 8).toUpperCase()} ({new Date(rx.createdAt).toLocaleDateString('en-IN')})
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: textSecondary }}>Visit Type</InputLabel>
                  <Select
                    value={visitType}
                    label="Visit Type"
                    onChange={(e) => {
                      const v = e.target.value;
                      setVisitType(v);
                      if (v === 'follow_up') setConsultationFee(Number(rateCard.followUpFee || 0));
                      else if (v === 'teleconsult') setConsultationFee(Number(rateCard.teleconsultFee || 400));
                      else setConsultationFee(Number(rateCard.consultationFee || 500));
                    }}
                    sx={{ borderRadius: '14px', bgcolor: inputBg }}
                  >
                    <MenuItem value="standard">Standard Consultation</MenuItem>
                    <MenuItem value="follow_up">Follow-Up Visit</MenuItem>
                    <MenuItem value="teleconsult">Teleconsultation</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Consultation Fee (₹)"
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  InputProps={{ sx: { borderRadius: '14px', bgcolor: inputBg } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: inputBg, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: textSecondary, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                      Discount Mode
                    </Typography>
                    <Box sx={{ display: 'flex', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: '8px', p: '2px' }}>
                      <Button
                        type="button"
                        size="small"
                        onClick={() => {
                          setDiscountType('percent');
                          setDiscount(Math.round((consultationFee * discountPercent) / 100));
                        }}
                        sx={{
                          py: 0.2, px: 1, minWidth: 32, fontSize: '0.7rem', fontWeight: 800, borderRadius: '6px', textTransform: 'none',
                          bgcolor: discountType === 'percent' ? (isDark ? '#2DD4BF' : '#0D9488') : 'transparent',
                          color: discountType === 'percent' ? '#ffffff' : textSecondary
                        }}
                      >
                        % Percent
                      </Button>
                      <Button
                        type="button"
                        size="small"
                        onClick={() => setDiscountType('flat')}
                        sx={{
                          py: 0.2, px: 1, minWidth: 32, fontSize: '0.7rem', fontWeight: 800, borderRadius: '6px', textTransform: 'none',
                          bgcolor: discountType === 'flat' ? (isDark ? '#2DD4BF' : '#0D9488') : 'transparent',
                          color: discountType === 'flat' ? '#ffffff' : textSecondary
                        }}
                      >
                        ₹ Flat
                      </Button>
                    </Box>
                  </Box>

                  {discountType === 'percent' ? (
                    <TextField
                      fullWidth
                      size="small"
                      label="Discount (%)"
                      type="number"
                      value={discountPercent || ''}
                      onChange={(e) => {
                        const pct = Math.max(0, Math.min(100, Number(e.target.value)));
                        setDiscountPercent(pct);
                        setDiscount(Math.round((consultationFee * pct) / 100));
                      }}
                      InputProps={{ 
                        endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ fontWeight: 800 }}>%</Typography></InputAdornment>,
                        sx: { borderRadius: '12px', bgcolor: cardBg } 
                      }}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      size="small"
                      label="Discount (₹)"
                      type="number"
                      value={discount || ''}
                      onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                      InputProps={{ 
                        startAdornment: <InputAdornment position="start"><Typography variant="caption" sx={{ fontWeight: 800 }}>₹</Typography></InputAdornment>,
                        sx: { borderRadius: '12px', bgcolor: cardBg } 
                      }}
                    />
                  )}

                  {discountType === 'percent' && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                      {[0, 10, 20, 25, 50, 100].map((pct) => (
                        <Chip
                          key={pct}
                          label={pct === 100 ? '100% Free' : `${pct}%`}
                          size="small"
                          clickable
                          onClick={() => {
                            setDiscountPercent(pct);
                            setDiscount(Math.round((consultationFee * pct) / 100));
                          }}
                          sx={{
                            height: 22,
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            borderRadius: '6px',
                            bgcolor: discountPercent === pct ? (isDark ? 'rgba(45,212,191,0.25)' : 'rgba(13,148,136,0.2)') : 'transparent',
                            color: discountPercent === pct ? (isDark ? '#2DD4BF' : '#0D9488') : textSecondary,
                            border: discountPercent === pct ? `1px solid ${isDark ? '#2DD4BF' : '#0D9488'}` : '1px solid rgba(255,255,255,0.1)'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Concession Reason (Optional)"
                  placeholder="e.g. Senior Citizen, Staff / Family"
                  value={concessionReason}
                  onChange={(e) => setConcessionReason(e.target.value)}
                  InputProps={{ sx: { borderRadius: '14px', bgcolor: inputBg } }}
                />
              </Grid>
            </Grid>

            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F0FDFA', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #CCFBF1' }}>
              <FormControlLabel
                control={<Switch checked={applyGst} onChange={(e) => setApplyGst(e.target.checked)} color="primary" />}
                label={<Typography sx={{ fontWeight: 700, color: textPrimary, fontSize: '0.9rem' }}>Apply Indian GST (SAC 999312 is Exempt 0%)</Typography>}
              />
              {applyGst && (
                <TextField
                  fullWidth
                  size="small"
                  label="GST Rate (%)"
                  type="number"
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  sx={{ mt: 1.5 }}
                  InputProps={{ sx: { borderRadius: '12px', bgcolor: inputBg } }}
                />
              )}
            </Box>

            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: isDark ? 'rgba(0,200,150,0.08)' : '#F0FDFA', border: isDark ? '1px solid rgba(0,200,150,0.2)' : '1px solid #A7F3D0' }}>
              <FormControlLabel
                control={<Switch checked={markAsPaid} onChange={(e) => setMarkAsPaid(e.target.checked)} color="success" />}
                label={<Typography sx={{ fontWeight: 800, color: '#10B981', fontSize: '0.9rem' }}>Collect Payment Immediately (In-Clinic Cash / UPI)</Typography>}
              />
              {markAsPaid && (
                <FormControl fullWidth sx={{ mt: 1.5 }}>
                  <InputLabel sx={{ color: textSecondary }}>Payment Mode</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Payment Mode"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    sx={{ borderRadius: '12px', bgcolor: inputBg }}
                  >
                    <MenuItem value="cash">💵 Cash (In-Clinic Cash Drawer)</MenuItem>
                    <MenuItem value="upi">📱 UPI (Instant QR / App)</MenuItem>
                    <MenuItem value="card">💳 Card / POS Machine</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>

            {/* Patient Dispatch Channels */}
            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: inputBg, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: textSecondary, textTransform: 'uppercase', fontSize: '0.72rem', display: 'block', mb: 1 }}>
                Dispatch & Sync Channels
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch size="small" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} color="success" />}
                    label={<Typography variant="caption" sx={{ fontWeight: 800, color: textPrimary, fontSize: '0.78rem' }}>📧 Email (PDF)</Typography>}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch size="small" checked={sendPatientApp} onChange={(e) => setSendPatientApp(e.target.checked)} color="success" />}
                    label={<Typography variant="caption" sx={{ fontWeight: 800, color: textPrimary, fontSize: '0.78rem' }}>📲 Patient App & Portal</Typography>}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1, borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(42,107,93,0.1)' }}>
            <Button onClick={() => setGenerateModalOpen(false)} sx={{ borderRadius: '12px', color: textSecondary }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                px: 3
              }}
            >
              Generate Bill
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: RECORD PAYMENT IN LEDGER ─── */}
      <Dialog
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: cardBg,
            color: textPrimary,
            border: cardBorder,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }
        }}
      >
        <form onSubmit={handleRecordPayment}>
          <DialogTitle sx={{ fontWeight: 900, pb: 1, color: isDark ? '#2DD4BF' : '#0D9488' }}>
            💳 Record Payment against Bill {selectedBill?.billNumber}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Box sx={{ p: 2, borderRadius: '16px', bgcolor: isDark ? 'rgba(0, 200, 150, 0.1)' : '#F0FDFA', border: isDark ? '1px solid rgba(0, 200, 150, 0.3)' : '1px solid #A7F3D0' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary }}>
                Total Bill Amount: ₹{selectedBill?.totalAmount} | Currently Paid: ₹{selectedBill?.amountPaid || 0}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0D9488', mt: 0.5 }}>
                Remaining Balance Due: ₹{selectedBill?.balanceDue !== undefined ? selectedBill?.balanceDue : selectedBill?.totalAmount}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Payment Amount (₹)"
              type="number"
              value={payingAmount}
              onChange={(e) => setPayingAmount(Number(e.target.value))}
              required
              InputProps={{ sx: { borderRadius: '14px', fontWeight: 800, fontSize: '1.1rem', bgcolor: inputBg } }}
            />

            <FormControl fullWidth>
              <InputLabel sx={{ color: textSecondary }}>Payment Mode</InputLabel>
              <Select
                value={paymentMode}
                label="Payment Mode"
                onChange={(e) => setPaymentMode(e.target.value)}
                sx={{ borderRadius: '14px', bgcolor: inputBg }}
              >
                <MenuItem value="cash">💵 Cash (In-Clinic Cash Drawer)</MenuItem>
                <MenuItem value="upi">📱 UPI (Google Pay / PhonePe / Paytm)</MenuItem>
                <MenuItem value="card">💳 Card / POS Machine</MenuItem>
                <MenuItem value="insurance">🏥 Insurance / TPA Direct</MenuItem>
                <MenuItem value="cheque">📝 Bank Cheque / Transfer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Transaction Ref / UPI UTR Number (Optional)"
              placeholder="e.g. 423589123456 or POS-998"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              InputProps={{ sx: { borderRadius: '14px', bgcolor: inputBg } }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Payment Remarks / Notes"
              placeholder="Optional notes for accounting ledger..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              InputProps={{ sx: { borderRadius: '14px', bgcolor: inputBg } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button onClick={() => setPaymentModalOpen(false)} sx={{ borderRadius: '12px', color: textSecondary }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ borderRadius: '12px', bgcolor: isDark ? '#2DD4BF' : '#0D9488', color: '#FFFFFF', fontWeight: 800, px: 3 }}
            >
              Record Payment
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL: BILL DETAILS / BREAKDOWN ─── */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: cardBg,
            color: textPrimary,
            border: cardBorder,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1, color: isDark ? '#2DD4BF' : '#0D9488', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(42,107,93,0.1)' }}>
          📄 Invoice Breakdown • {activeBillDetail?.billNumber}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activeBillDetail && (
            <>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>Patient Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: textPrimary }}>{activeBillDetail.patientName || 'Patient'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>Attending Doctor</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: textPrimary }}>{activeBillDetail.doctorName || 'Doctor'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>Date of Issue</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: textPrimary }}>{new Date(activeBillDetail.createdAt).toLocaleDateString('en-IN')}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700 }}>Status</Typography>
                  <Box sx={{ mt: 0.3 }}>{getStatusChip(activeBillDetail.status)}</Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(42,107,93,0.1)' }} />

              {/* Line items table */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary }}>Itemized Clinical Line Items</Typography>
              <TableContainer sx={{ borderRadius: '16px', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(42,107,93,0.1)' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: isDark ? '#0B1315' : '#E6F4F1' }}>
                    <TableRow>
                      <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800 }}>Item Description</TableCell>
                      <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800 }}>HSN / SAC</TableCell>
                      <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800 }}>Qty</TableCell>
                      <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800 }}>Rate (₹)</TableCell>
                      <TableCell sx={{ color: isDark ? '#94A8A3' : '#1E4D40', fontWeight: 800, textAlign: 'right' }}>Total (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(!activeBillDetail.items || activeBillDetail.items.length === 0) ? (
                      <TableRow>
                        <TableCell sx={{ color: textPrimary, fontWeight: 700 }}>Clinical Outpatient Consultation</TableCell>
                        <TableCell sx={{ color: textSecondary }}>SAC 999312</TableCell>
                        <TableCell sx={{ color: textPrimary }}>1</TableCell>
                        <TableCell sx={{ color: textPrimary }}>₹{activeBillDetail.totalAmount}</TableCell>
                        <TableCell sx={{ color: textPrimary, fontWeight: 800, textAlign: 'right' }}>₹{activeBillDetail.totalAmount}</TableCell>
                      </TableRow>
                    ) : (
                      activeBillDetail.items.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ color: textPrimary, fontWeight: 700 }}>{item.description}</TableCell>
                          <TableCell sx={{ color: textSecondary }}>{item.hsnSacCode || '999312'}</TableCell>
                          <TableCell sx={{ color: textPrimary }}>{item.quantity}</TableCell>
                          <TableCell sx={{ color: textPrimary }}>₹{item.unitPrice}</TableCell>
                          <TableCell sx={{ color: textPrimary, fontWeight: 800, textAlign: 'right' }}>₹{item.totalPrice}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Financial summary */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Box sx={{ width: '280px', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: textSecondary }}>Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary }}>₹{activeBillDetail.subtotal || activeBillDetail.totalAmount}</Typography>
                  </Box>
                  {Number(activeBillDetail.discount) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#EF4444' }}>Discount:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#EF4444' }}>-₹{activeBillDetail.discount}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: textSecondary }}>GST Tax:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary }}>₹{activeBillDetail.tax || '0.00'}</Typography>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: textPrimary }}>Total Payable:</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0D9488' }}>₹{activeBillDetail.totalAmount}</Typography>
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setDetailModalOpen(false)} sx={{ borderRadius: '12px', color: textSecondary }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownloadPdf(activeBillDetail)}
            sx={{ borderRadius: '12px', bgcolor: isDark ? '#2DD4BF' : '#0D9488', color: '#FFFFFF', fontWeight: 800 }}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── MODAL: RATE CARD & CLINIC BILLING SETTINGS (RESPONSIVE) ─── */}
      <Dialog
        open={rateCardModalOpen}
        onClose={() => setRateCardModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: '16px', sm: '24px' },
            bgcolor: cardBg,
            color: textPrimary,
            border: cardBorder,
            boxShadow: '0 25px 70px rgba(0,0,0,0.35)',
            m: { xs: 1.5, sm: 3 },
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Modal Header */}
        <DialogTitle sx={{ p: { xs: 2, sm: 2.5 }, pb: 1.5, borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(42,107,93,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(0, 200, 150, 0.15)', color: '#00C896', width: 42, height: 42 }}>
              <SettingsIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontSize: { xs: '1.05rem', sm: '1.25rem' }, color: isDark ? '#2DD4BF' : '#0D9488', lineHeight: 1.2 }}>
                Clinic Rate Card & Indian Billing Settings
              </Typography>
              <Typography variant="caption" sx={{ color: textSecondary, fontSize: { xs: '0.72rem', sm: '0.8rem' } }}>
                Manage consultation rates, in-clinic procedures, and Indian payment identifiers
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setRateCardModalOpen(false)} size="small" sx={{ color: textSecondary }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        {/* Modal Scrollable Body */}
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 2.5, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
          
          {/* SECTION 1: OPD CONSULTATION & FOLLOW-UP CHARGES */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: '18px',
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(42,107,93,0.03)',
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(42,107,93,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocalHospitalIcon sx={{ color: '#00C896', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#2DD4BF' : '#0D9488', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.82rem' }}>
                1. OPD Consultation & Follow-up Charges
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Standard Consultation Fee (₹)"
                  type="number"
                  value={rateCard.consultationFee}
                  onChange={(e) => setRateCard({ ...rateCard, consultationFee: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 800, color: '#00C896' }}>₹</Typography></InputAdornment>,
                    sx: { borderRadius: '14px', bgcolor: inputBg }
                  }}
                  helperText="Primary first-visit OPD fee"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Follow-up Visit Fee (₹)"
                  type="number"
                  value={rateCard.followUpFee}
                  onChange={(e) => setRateCard({ ...rateCard, followUpFee: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 800, color: '#00C896' }}>₹</Typography></InputAdornment>,
                    sx: { borderRadius: '14px', bgcolor: inputBg }
                  }}
                  helperText="Set ₹0 for free follow-up visits"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Follow-up Validity Period (Days)"
                  type="number"
                  value={rateCard.followUpDays}
                  onChange={(e) => setRateCard({ ...rateCard, followUpDays: Number(e.target.value) })}
                  InputProps={{ sx: { borderRadius: '14px', bgcolor: inputBg } }}
                  helperText="Auto-suggests follow-up rate if patient visits within these days"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teleconsultation Fee (₹)"
                  type="number"
                  value={rateCard.teleconsultFee}
                  onChange={(e) => setRateCard({ ...rateCard, teleconsultFee: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 800, color: '#00C896' }}>₹</Typography></InputAdornment>,
                    sx: { borderRadius: '14px', bgcolor: inputBg }
                  }}
                  helperText="Online / video consultation charge"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* SECTION 2: IN-CLINIC PROCEDURES & SERVICES (EDITABLE) */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: '18px',
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(42,107,93,0.03)',
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(42,107,93,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedicalServicesIcon sx={{ color: '#00C896', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#2DD4BF' : '#0D9488', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.82rem' }}>
                  2. In-Clinic Procedures & Services (Rate Card)
                </Typography>
                <Chip
                  label={`${(rateCard.clinicServices || []).length} Procedures`}
                  size="small"
                  sx={{ fontWeight: 800, height: 22, fontSize: '0.7rem', bgcolor: 'rgba(0, 200, 150, 0.15)', color: '#00C896' }}
                />
              </Box>

              <Button
                size="small"
                startIcon={<RestartAltIcon fontSize="small" />}
                onClick={handleResetDefaultProcedures}
                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, color: textSecondary, '&:hover': { color: '#00C896' } }}
              >
                Reset OPD Defaults
              </Button>
            </Box>

            <Typography variant="body2" sx={{ color: textSecondary, fontSize: { xs: '0.78rem', sm: '0.83rem' }, mb: 2 }}>
              Add, edit names, or customize prices for minor clinic procedures. These will appear as 1-click quick add buttons in your prescriptions and billing portal.
            </Typography>

            {/* Inline Add Procedure Bar */}
            <Box
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: '14px',
                bgcolor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.85)',
                border: '1px dashed rgba(0, 200, 150, 0.4)',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1.5,
                alignItems: { xs: 'stretch', sm: 'center' }
              }}
            >
              <TextField
                size="small"
                placeholder="Procedure / Service Name (e.g. Nebulization, Dressing)"
                value={newProcName}
                onChange={(e) => setNewProcName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddProcedure(); }}
                sx={{ flex: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: inputBg } }}
              />
              <TextField
                size="small"
                type="number"
                placeholder="Fee (₹)"
                value={newProcPrice}
                onChange={(e) => setNewProcPrice(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddProcedure(); }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#00C896' }}>₹</Typography></InputAdornment>
                }}
                sx={{ flex: 1, minWidth: { sm: '130px' }, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: inputBg } }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!newProcName.trim()}
                onClick={handleAddProcedure}
                sx={{
                  borderRadius: '10px',
                  bgcolor: '#00C896',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  px: 2.5,
                  py: 0.9,
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#00A87E' }
                }}
              >
                Add Procedure
              </Button>
            </Box>

            {/* List of Procedures (Responsive Cards / Rows) */}
            <Stack spacing={1} sx={{ maxHeight: '280px', overflowY: 'auto', pr: 0.5 }}>
              {(rateCard.clinicServices || []).map((srv: any, idx: number) => (
                <Box
                  key={srv.id || idx}
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 1.5,
                    p: 1.2,
                    px: 1.8,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.95)',
                    border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(42,107,93,0.12)',
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': {
                      borderColor: 'rgba(0, 200, 150, 0.4)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 2 }}>
                    <Typography sx={{ fontWeight: 800, color: textSecondary, fontSize: '0.78rem', minWidth: '22px' }}>
                      #{idx + 1}
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={srv.name}
                      onChange={(e) => handleUpdateProcedure(srv.id, 'name', e.target.value)}
                      placeholder="Procedure Name"
                      variant="standard"
                      InputProps={{
                        disableUnderline: false,
                        sx: { fontWeight: 700, fontSize: '0.88rem', color: textPrimary }
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', minWidth: { sm: '180px' } }}>
                    <TextField
                      size="small"
                      type="number"
                      value={srv.price === 0 ? '0' : srv.price}
                      onChange={(e) => handleUpdateProcedure(srv.id, 'price', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#00C896' }}>₹</Typography></InputAdornment>,
                        sx: { borderRadius: '8px', height: '34px', fontSize: '0.88rem', fontWeight: 800, width: '100px', bgcolor: inputBg }
                      }}
                    />

                    <Tooltip title="Remove procedure">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteProcedure(srv.id)}
                        sx={{ color: '#EF4444', p: 0.8, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.12)' } }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}

              {(rateCard.clinicServices || []).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 3, color: textSecondary }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    No custom procedures added yet. Click &quot;Reset OPD Defaults&quot; above to restore standard clinic items.
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* SECTION 3: UPI QR & GSTIN SETTINGS */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: '18px',
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(42,107,93,0.03)',
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(42,107,93,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <QrCodeScannerIcon sx={{ color: '#00C896', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#2DD4BF' : '#0D9488', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.82rem' }}>
                3. Instant UPI QR & GSTIN (Optional)
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Clinic UPI VPA / ID for Dynamic QR"
                  placeholder="e.g. dr.sharma@okhdfcbank or clinic@icici"
                  value={rateCard.clinicUpiVpa || ''}
                  onChange={(e) => setRateCard({ ...rateCard, clinicUpiVpa: e.target.value })}
                  helperText="Encoded in dynamic NPCI QR codes on invoices for instant patient UPI scan"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><QrCode2Icon sx={{ color: '#00C896', fontSize: 20 }} /></InputAdornment>,
                    sx: { borderRadius: '14px', bgcolor: inputBg }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Doctor / Clinic 15-Digit GSTIN (Optional)"
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  value={rateCard.clinicGstin || ''}
                  onChange={(e) => setRateCard({ ...rateCard, clinicGstin: e.target.value })}
                  helperText="Printed on official Tax Invoices when GST registration applies"
                  InputProps={{ sx: { borderRadius: '14px', bgcolor: inputBg } }}
                />
              </Grid>
            </Grid>
          </Paper>

        </DialogContent>

        {/* Modal Actions */}
        <DialogActions
          sx={{
            p: { xs: 2, sm: 2.5 },
            px: { xs: 2, sm: 3 },
            gap: 1.5,
            borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(42,107,93,0.1)',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}
        >
          <Button
            onClick={() => setRateCardModalOpen(false)}
            sx={{ borderRadius: '12px', color: textSecondary, fontWeight: 700, px: 2.5 }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={rateCardSaving}
            onClick={handleSaveRateCard}
            sx={{
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              px: { xs: 3, sm: 4 },
              py: 1,
              boxShadow: '0 4px 14px rgba(0, 200, 150, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #047857 0%, #059669 100%)'
              }
            }}
          >
            {rateCardSaving ? <CircularProgress size={22} sx={{ color: '#FFFFFF' }} /> : '✨ Save Rate Card & Settings'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
