import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';

import { useAuth } from '../contexts/AuthContext';
import { healthcareApi } from '../services/healthcareExtensionsApi';
import api from '../services/api';

export default function BillingPortal() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [bills, setBills] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Generate bill modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  const [consultationFee, setConsultationFee] = useState(500);

  // Payment modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentRef, setPaymentRef] = useState('');

  // Invoice detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeBillDetail, setActiveBillDetail] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isDoctor) {
        const [billsRes, rxRes] = await Promise.all([
          healthcareApi.getDoctorBills(),
          api.get('/prescriptions')
        ]);
        if (billsRes.success) setBills(billsRes.bills || []);
        if (Array.isArray(rxRes.data)) setPrescriptions(rxRes.data);
      } else {
        const billsRes = await healthcareApi.getMyBills();
        if (billsRes.success) setBills(billsRes.bills || []);
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDoctor]);

  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrescriptionId) return;

    try {
      const res = await healthcareApi.generateBillFromPrescription(selectedPrescriptionId, {
        consultationFee: Number(consultationFee)
      });
      if (res.success) {
        setToast(`Invoice ${res.bill.billNumber} generated successfully!`);
        setGenerateModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate bill');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      const res = await healthcareApi.recordBillPayment(selectedBill.id, {
        paymentMethod,
        paymentTransactionRef: paymentRef || `TXN-${Date.now()}`
      });
      if (res.success) {
        setToast('Payment recorded successfully!');
        setPaymentModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleDownloadInvoicePdf = () => {
    if (!activeBillDetail) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFillColor(19, 47, 36);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setTextColor(0, 200, 150);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Medizo Healthcare', 15, 18);
    doc.setFontSize(10);
    doc.setTextColor(235, 245, 243);
    doc.text('Tax Invoice & Receipt', 15, 28);
    doc.setFontSize(10);
    doc.text(`Invoice #: ${activeBillDetail.billNumber || 'N/A'}`, pageW - 15, 18, { align: 'right' });
    doc.text(`Date: ${activeBillDetail.createdAt ? new Date(activeBillDetail.createdAt).toLocaleDateString() : 'N/A'}`, pageW - 15, 28, { align: 'right' });

    y = 55;

    // Status badge
    const status = (activeBillDetail.status || 'pending').toUpperCase();
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    if (activeBillDetail.status === 'paid') {
      doc.setTextColor(76, 175, 80);
    } else {
      doc.setTextColor(255, 152, 0);
    }
    doc.text(`Status: ${status}`, 15, y);
    y += 10;

    // Patient info if available
    if (activeBillDetail.patientName) {
      doc.setTextColor(51, 51, 51);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Patient: ${activeBillDetail.patientName}`, 15, y);
      y += 8;
    }

    y += 5;

    // Items table header
    doc.setFillColor(0, 200, 150);
    doc.rect(15, y, pageW - 30, 10, 'F');
    doc.setTextColor(11, 19, 21);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Item Description', 18, y + 7);
    doc.text('Qty', pageW - 75, y + 7, { align: 'right' });
    doc.text('Price', pageW - 45, y + 7, { align: 'right' });
    doc.text('Total', pageW - 18, y + 7, { align: 'right' });
    y += 15;

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 51, 51);
    const items = activeBillDetail.items || [];
    items.forEach((item: any, idx: number) => {
      if (idx % 2 === 0) {
        doc.setFillColor(245, 250, 248);
        doc.rect(15, y - 4, pageW - 30, 10, 'F');
      }
      doc.text(String(item.description || ''), 18, y + 3);
      doc.text(String(item.quantity || '1'), pageW - 75, y + 3, { align: 'right' });
      doc.text(`₹${item.unitPrice || 0}`, pageW - 45, y + 3, { align: 'right' });
      doc.text(`₹${item.totalPrice || 0}`, pageW - 18, y + 3, { align: 'right' });
      y += 10;
    });

    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, pageW - 15, y);
    y += 10;

    // Totals
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Subtotal:', pageW - 75, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${activeBillDetail.subtotal || 0}`, pageW - 18, y, { align: 'right' });
    y += 8;

    if (activeBillDetail.tax > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text('Tax / GST:', pageW - 75, y);
      doc.text(`₹${activeBillDetail.tax}`, pageW - 18, y, { align: 'right' });
      y += 8;
    }

    if (activeBillDetail.discount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(76, 175, 80);
      doc.text('Discount:', pageW - 75, y);
      doc.text(`-₹${activeBillDetail.discount}`, pageW - 18, y, { align: 'right' });
      y += 8;
      doc.setTextColor(51, 51, 51);
    }

    y += 3;
    doc.setDrawColor(0, 200, 150);
    doc.setLineWidth(1);
    doc.line(pageW - 100, y, pageW - 15, y);
    y += 10;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 200, 150);
    doc.text('Total Amount:', pageW - 100, y);
    doc.text(`₹${activeBillDetail.totalAmount || 0}`, pageW - 18, y, { align: 'right' });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a digitally generated invoice by www.medizo.life', pageW / 2, footerY, { align: 'center' });

    doc.save(`Invoice_${activeBillDetail.billNumber || 'Medizo'}.pdf`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '85vh' }}>
      {/* Header Banner */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: '20px', background: 'linear-gradient(135deg, #132724 0%, #0D1F1C 100%)', border: '1px solid rgba(0,200,150,0.2)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: '#00C896', color: '#0B1315', fontWeight: 900, fontSize: '1.5rem', boxShadow: '0 0 16px rgba(0,200,150,0.4)' }}>
              <PaymentsIcon sx={{ fontSize: '2rem' }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#EBF5F3' }}>
                {isDoctor ? 'Prescription Invoicing & Payments' : 'My Medical Invoices & Bills'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#00C896', fontWeight: 700 }}>
                {bills.length} Invoices Recorded
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
            {isDoctor && (
              <Button
                variant="contained"
                onClick={() => setGenerateModalOpen(true)}
                startIcon={<AddCircleOutlineIcon />}
                sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, borderRadius: '12px', textTransform: 'none', '&:hover': { bgcolor: '#00A87E' } }}
              >
                Generate Bill from Rx
              </Button>
            )}
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
          {bills.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#131F22', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography sx={{ color: '#94A8A3' }}>No medical bills found.</Typography>
              </Paper>
            </Grid>
          ) : (
            bills.map((b) => {
              const isPaid = b.status === 'paid';
              return (
                <Grid item xs={12} md={6} key={b.id}>
                  <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: '#131F22', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography sx={{ color: '#00C896', fontWeight: 800, fontFamily: 'monospace' }}>
                          {b.billNumber}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#EBF5F3' }}>
                          {isDoctor ? `Patient: ${b.patientName || 'Patient'}` : `Dr. ${b.doctorName || 'Attending Physician'}`}
                        </Typography>
                      </Box>
                      <Chip
                        label={b.status.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: isPaid ? 'rgba(76,175,80,0.15)' : 'rgba(255,152,0,0.15)',
                          color: isPaid ? '#4CAF50' : '#FF9800',
                          fontWeight: 800
                        }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#94A8A3', mb: 1 }}>
                      <strong>Items:</strong> {(b.items || []).length} Line Items
                    </Typography>

                    <Typography variant="h5" sx={{ color: '#00C896', fontWeight: 900, mb: 2 }}>
                      ₹{b.totalAmount}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setActiveBillDetail(b);
                          setDetailModalOpen(true);
                        }}
                        sx={{ color: '#EBF5F3', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '10px', textTransform: 'none' }}
                      >
                        View Invoice
                      </Button>
                      {!isPaid && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setSelectedBill(b);
                            setPaymentModalOpen(true);
                          }}
                          sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, borderRadius: '10px', textTransform: 'none', '&:hover': { bgcolor: '#00A87E' } }}
                        >
                          {isDoctor ? 'Record Payment' : 'Pay Now'}
                        </Button>
                      )}
                      {isPaid && b.receiptNumber && (
                        <Chip label={`Receipt: ${b.receiptNumber}`} size="small" sx={{ bgcolor: 'rgba(0,200,150,0.1)', color: '#00C896', fontWeight: 700 }} />
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      {/* Generate Bill Modal */}
      <Dialog open={generateModalOpen} onClose={() => setGenerateModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#131F22', color: '#EBF5F3', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <form onSubmit={handleGenerateBill}>
          <DialogTitle sx={{ fontWeight: 800, color: '#EBF5F3', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            Generate Invoice from Prescription
          </DialogTitle>
          <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#94A8A3' }}>
              Select an existing patient prescription to automatically extract consultation fee, prescribed medications, and requested lab tests.
            </Typography>

            <TextField
              select
              label="Select Prescription"
              fullWidth
              value={selectedPrescriptionId}
              onChange={(e) => setSelectedPrescriptionId(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }}
              required
            >
              <option value="">-- Choose Prescription --</option>
              {prescriptions.map((rx) => (
                <option key={rx.id} value={rx.id}>
                  {rx.patientName || 'Patient'} - {rx.diagnosis || 'General Visit'} ({rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : 'Recent'})
                </option>
              ))}
            </TextField>

            <TextField
              label="Consultation Fee (INR)"
              type="number"
              fullWidth
              value={consultationFee}
              onChange={(e) => setConsultationFee(Number(e.target.value))}
              sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Button onClick={() => setGenerateModalOpen(false)} sx={{ color: '#94A8A3' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, '&:hover': { bgcolor: '#00A87E' } }}>
              Generate Invoice
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: '#131F22', color: '#EBF5F3', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <form onSubmit={handleRecordPayment}>
          <DialogTitle sx={{ fontWeight: 800, color: '#EBF5F3', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            Record Payment
          </DialogTitle>
          <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#00C896', fontWeight: 800 }}>
              Amount Due: ₹{selectedBill?.totalAmount} ({selectedBill?.billNumber})
            </Typography>

            <TextField
              select
              label="Payment Method"
              fullWidth
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }}
            >
              <option value="upi">UPI / QR Code</option>
              <option value="card">Credit / Debit Card</option>
              <option value="cash">Cash Payment</option>
              <option value="insurance">Insurance Claim</option>
              <option value="bank_transfer">Net Banking / Transfer</option>
            </TextField>

            <TextField
              label="Transaction Reference / Note (Optional)"
              fullWidth
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              sx={{ '& .MuiInputBase-root': { bgcolor: '#0B1315', color: '#EBF5F3' } }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Button onClick={() => setPaymentModalOpen(false)} sx={{ color: '#94A8A3' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800, '&:hover': { bgcolor: '#00A87E' } }}>
              Confirm Payment
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Invoice Detail Modal */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#131F22', color: '#EBF5F3', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#EBF5F3', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Tax Invoice & Receipt</span>
          <Chip label={activeBillDetail?.status?.toUpperCase()} size="small" sx={{ bgcolor: activeBillDetail?.status === 'paid' ? 'rgba(76,175,80,0.15)' : 'rgba(255,152,0,0.15)', color: activeBillDetail?.status === 'paid' ? '#4CAF50' : '#FF9800', fontWeight: 800 }} />
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography sx={{ color: '#00C896', fontWeight: 800 }}>Medizo Healthcare</Typography>
              <Typography variant="caption" sx={{ color: '#94A8A3' }}>Invoice #: {activeBillDetail?.billNumber}</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#94A8A3' }}>
              Date: {activeBillDetail?.createdAt ? new Date(activeBillDetail.createdAt).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 2 }} />

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#94A8A3', fontWeight: 800 }}>Item Description</TableCell>
                  <TableCell sx={{ color: '#94A8A3', fontWeight: 800, textAlign: 'right' }}>Qty</TableCell>
                  <TableCell sx={{ color: '#94A8A3', fontWeight: 800, textAlign: 'right' }}>Price</TableCell>
                  <TableCell sx={{ color: '#94A8A3', fontWeight: 800, textAlign: 'right' }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(activeBillDetail?.items || []).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ color: '#EBF5F3' }}>{item.description}</TableCell>
                    <TableCell sx={{ color: '#EBF5F3', textAlign: 'right' }}>{item.quantity}</TableCell>
                    <TableCell sx={{ color: '#EBF5F3', textAlign: 'right' }}>₹{item.unitPrice}</TableCell>
                    <TableCell sx={{ color: '#00C896', textAlign: 'right', fontWeight: 700 }}>₹{item.totalPrice}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ color: '#94A8A3' }}>Subtotal:</Typography>
            <Typography sx={{ color: '#EBF5F3', fontWeight: 700 }}>₹{activeBillDetail?.subtotal}</Typography>
          </Box>
          {activeBillDetail?.tax > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: '#94A8A3' }}>Tax / GST:</Typography>
              <Typography sx={{ color: '#EBF5F3' }}>₹{activeBillDetail?.tax}</Typography>
            </Box>
          )}
          {activeBillDetail?.discount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: '#94A8A3' }}>Discount:</Typography>
              <Typography sx={{ color: '#4CAF50' }}>-₹{activeBillDetail?.discount}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="h6" sx={{ color: '#EBF5F3', fontWeight: 900 }}>Total Amount:</Typography>
            <Typography variant="h6" sx={{ color: '#00C896', fontWeight: 900 }}>₹{activeBillDetail?.totalAmount}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button onClick={() => setDetailModalOpen(false)} sx={{ color: '#94A8A3' }}>Close</Button>
          <Button startIcon={<DownloadIcon />} onClick={handleDownloadInvoicePdf} variant="contained" sx={{ bgcolor: '#00C896', color: '#0B1315', fontWeight: 800 }}>
            Download Invoice PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
