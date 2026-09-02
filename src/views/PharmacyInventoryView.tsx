'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Avatar,
  Chip,
  IconButton,
  Grid,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Divider,
  Badge
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  LocalPharmacy as PharmacyIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  Inventory2 as InventoryIcon,
  MonetizationOn as RupeeIcon,
  AccessTime as ExpiryIcon,
  AddCircleOutline as PlusIcon,
  RemoveCircleOutline as MinusIcon,
  Place as RackIcon,
  Medication as MedIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import {
  getInventoryList,
  getInventoryStats,
  createInventoryItem,
  updateInventoryItem,
  adjustStockQuantity,
  deleteInventoryItem
} from '../services/inventory';
import {
  InventoryItem,
  InventoryStats,
  DosageForm,
  CreateInventoryPayload
} from '../types/inventory';

const DOSAGE_FORMS: DosageForm[] = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Ointment',
  'Drops',
  'Inhaler',
  'Powder',
  'Suspension',
  'Cream',
  'Gel',
  'Solution',
  'Lotion',
  'Other'
];

export default function PharmacyInventoryView() {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { user } = authState;
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  // Inventory Data States
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dosageFilter, setDosageFilter] = useState('all');

  // Add / Edit Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const initialFormState: CreateInventoryPayload = {
    medicineName: '',
    genericName: '',
    dosageForm: 'Tablet',
    strength: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 100,
    unitPrice: 0,
    mrp: 0,
    reorderLevel: 20,
    rackLocation: '',
    notes: ''
  };
  const [formData, setFormData] = useState<CreateInventoryPayload>(initialFormState);

  // Load stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await getInventoryStats();
      if (res && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to load inventory stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load inventory items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getInventoryList({
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        dosageForm: dosageFilter !== 'all' ? dosageFilter : undefined,
        limit: 100
      });
      if (res && Array.isArray(res.items)) {
        setItems(res.items);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.error('Failed to load inventory items:', err);
      setError(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, dosageFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  // Handle Quick +/- Stock Adjustment
  const handleAdjustStock = async (id: string, delta: number) => {
    try {
      const res = await adjustStockQuantity(id, delta);
      if (res && res.item) {
        setItems(prev => prev.map(item => (item.id === id ? res.item : item)));
        fetchStats();
      }
    } catch (err: any) {
      console.error('Failed to adjust stock:', err);
      setError(err.response?.data?.message || 'Failed to adjust stock quantity');
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: InventoryItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormData({
      medicineName: item.medicineName || '',
      genericName: item.genericName || '',
      dosageForm: item.dosageForm || 'Tablet',
      strength: item.strength || '',
      manufacturer: item.manufacturer || '',
      batchNumber: item.batchNumber || '',
      expiryDate: item.expiryDate || '',
      quantity: item.quantity !== undefined ? item.quantity : 0,
      unitPrice: item.unitPrice !== undefined ? item.unitPrice : 0,
      mrp: item.mrp !== undefined ? item.mrp : 0,
      reorderLevel: item.reorderLevel !== undefined ? item.reorderLevel : 20,
      rackLocation: item.rackLocation || '',
      notes: item.notes || ''
    });
    setModalOpen(true);
  };

  // Save Add / Edit
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medicineName?.trim()) {
      setError('Medicine name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (isEditing && editingId) {
        await updateInventoryItem(editingId, formData);
        setSuccessMsg('Medicine updated successfully');
      } else {
        await createInventoryItem(formData);
        setSuccessMsg('Medicine added to inventory successfully');
      }

      setModalOpen(false);
      fetchItems();
      fetchStats();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Save inventory error:', err);
      setError(err.response?.data?.message || 'Failed to save inventory item');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Dialog
  const handleConfirmDelete = (item: InventoryItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  // Execute Delete
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await deleteInventoryItem(itemToDelete.id);
      setSuccessMsg(`"${itemToDelete.medicineName}" deleted from inventory`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchItems();
      fetchStats();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Delete inventory error:', err);
      setError(err.response?.data?.message || 'Failed to delete inventory item');
    } finally {
      setDeleting(false);
    }
  };

  // Helper for expiry color
  const getExpiryBadge = (expiryDate?: string) => {
    if (!expiryDate) return <Chip size="small" label="No Expiry" sx={{ height: 22, fontSize: '0.7rem' }} />;
    const exp = new Date(expiryDate).getTime();
    if (isNaN(exp)) return <Chip size="small" label={expiryDate} sx={{ height: 22, fontSize: '0.7rem' }} />;
    const diffDays = Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return (
        <Chip
          icon={<ErrorIcon sx={{ fontSize: '13px !important', color: '#EF4444 !important' }} />}
          label={`Expired (${expiryDate})`}
          size="small"
          sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        />
      );
    }
    if (diffDays <= 30) {
      return (
        <Chip
          icon={<WarningIcon sx={{ fontSize: '13px !important', color: '#F59E0B !important' }} />}
          label={`${diffDays}d left (${expiryDate})`}
          size="small"
          sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}
        />
      );
    }
    return (
      <Chip
        icon={<CheckCircleIcon sx={{ fontSize: '13px !important', color: '#10B981 !important' }} />}
        label={expiryDate}
        size="small"
        sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.25)' }}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: { xs: 1.5, sm: 3 }, pb: 12, fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
      {/* ── Top Header Bar ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: '24px',
          bgcolor: isDark ? 'rgba(17, 29, 26, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(18, 48, 41, 0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: isDark ? '0 16px 36px rgba(0, 0, 0, 0.4)' : '0 12px 32px rgba(18, 48, 41, 0.06)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={() => navigate('/dashboard')}
              sx={{
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                color: isDark ? '#FFFFFF' : '#123029',
                borderRadius: '14px',
                p: 1.2,
                '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0' }
              }}
            >
              <BackIcon />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: { xs: 42, sm: 48 },
                  height: { xs: 42, sm: 48 },
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
                }}
              >
                📦
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#123029', fontSize: { xs: '1.05rem', sm: '1.25rem' }, lineHeight: 1.2 }}>
                  Stock &amp; Pharmacy Inventory
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 800, display: 'block', mt: 0.2 }}>
                  {user?.pharmacyName || user?.clinicName || 'Medizo Pharmacy Store'} • Real-Time Ledger
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                fetchStats();
                fetchItems();
              }}
              startIcon={<RefreshIcon sx={{ fontSize: '18px !important' }} />}
              sx={{
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.8rem',
                textTransform: 'none',
                px: 1.8,
                py: 0.8,
                color: isDark ? '#34D399' : '#0D9488',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : '#99F6E4',
                bgcolor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDFA'
              }}
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              size="small"
              onClick={handleOpenAdd}
              startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
              sx={{
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.82rem',
                textTransform: 'none',
                px: 2.2,
                py: 0.9,
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFFFFF',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' }
              }}
            >
              + Add Medicine
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ── Notification Banners ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '16px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: '16px' }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* ── KPI Stat Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Total Medicines',
            val: stats?.totalItems ?? items.length,
            icon: <InventoryIcon sx={{ fontSize: 24, color: '#3B82F6' }} />,
            color: '#3B82F6',
            bg: 'rgba(59, 130, 246, 0.12)'
          },
          {
            label: 'Total Units in Stock',
            val: stats?.totalUnits ?? items.reduce((sum, i) => sum + (i.quantity || 0), 0),
            icon: <MedIcon sx={{ fontSize: 24, color: '#10B981' }} />,
            color: '#10B981',
            bg: 'rgba(16, 185, 129, 0.12)'
          },
          {
            label: 'Low Stock (< Reorder)',
            val: stats?.lowStockCount ?? items.filter(i => i.quantity > 0 && i.quantity <= i.reorderLevel).length,
            icon: <WarningIcon sx={{ fontSize: 24, color: '#F59E0B' }} />,
            color: '#F59E0B',
            bg: 'rgba(245, 158, 11, 0.12)'
          },
          {
            label: 'Out of Stock / Expired',
            val: (stats?.outOfStockCount ?? items.filter(i => i.quantity === 0).length) + (stats?.expiredCount ?? 0),
            icon: <ErrorIcon sx={{ fontSize: 24, color: '#EF4444' }} />,
            color: '#EF4444',
            bg: 'rgba(239, 68, 68, 0.12)'
          },
          {
            label: 'Stock Value (MRP)',
            val: `₹${(stats?.totalValuation ?? items.reduce((sum, i) => sum + (i.quantity * (i.mrp || 0)), 0)).toLocaleString('en-IN')}`,
            icon: <RupeeIcon sx={{ fontSize: 24, color: '#8B5CF6' }} />,
            color: '#8B5CF6',
            bg: 'rgba(139, 92, 246, 0.12)'
          }
        ].map((kpi, idx) => (
          <Grid item xs={6} sm={4} md={2.4} key={idx}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '20px',
                bgcolor: isDark ? 'rgba(17, 29, 26, 0.75)' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(18, 48, 41, 0.08)',
                boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B', fontSize: '0.72rem' }}>
                  {kpi.label}
                </Typography>
                <Box sx={{ p: 0.8, borderRadius: '12px', bgcolor: kpi.bg, display: 'flex' }}>
                  {kpi.icon}
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#123029', fontSize: { xs: '1.2rem', sm: '1.45rem' } }}>
                {statsLoading ? <CircularProgress size={18} /> : kpi.val}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── Search & Filter Toolbar ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 3,
          borderRadius: '20px',
          bgcolor: isDark ? 'rgba(17, 29, 26, 0.85)' : '#FFFFFF',
          border: isDark ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(18, 48, 41, 0.08)'
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Medicine Name, Composition, Batch..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: isDark ? '#34D399' : '#0D9488' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '12px',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                  fontSize: '0.85rem'
                }
              }}
            />
          </Grid>

          <Grid item xs={6} md={3.5}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.85rem' }}>Stock Status</InputLabel>
              <Select
                value={statusFilter}
                label="Stock Status"
                onChange={e => setStatusFilter(e.target.value)}
                sx={{ borderRadius: '12px', fontSize: '0.85rem' }}
              >
                <MenuItem value="all">All Stock Statuses</MenuItem>
                <MenuItem value="in_stock">🟢 In Stock</MenuItem>
                <MenuItem value="low_stock">🟡 Low Stock (&lt; Reorder)</MenuItem>
                <MenuItem value="out_of_stock">🔴 Out of Stock (0 Units)</MenuItem>
                <MenuItem value="expired">⚠️ Expired Batches</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={3.5}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.85rem' }}>Dosage Form</InputLabel>
              <Select
                value={dosageFilter}
                label="Dosage Form"
                onChange={e => setDosageFilter(e.target.value)}
                sx={{ borderRadius: '12px', fontSize: '0.85rem' }}
              >
                <MenuItem value="all">All Dosage Forms</MenuItem>
                {DOSAGE_FORMS.map(df => (
                  <MenuItem key={df} value={df}>{df}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Inventory Content List ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#10B981' }} />
        </Box>
      ) : items.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: '24px',
            bgcolor: isDark ? 'rgba(17, 29, 26, 0.5)' : '#FFFFFF',
            border: isDark ? '1px dashed rgba(255, 255, 255, 0.15)' : '1px dashed #CBD5E1'
          }}
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 2,
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
              color: '#10B981'
            }}
          >
            📦
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#123029', mb: 1 }}>
            No medicines found in inventory
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#64748B', maxWidth: 450, mx: 'auto', mb: 3 }}>
            {searchTerm || statusFilter !== 'all' || dosageFilter !== 'all'
              ? 'Try adjusting your search criteria or resetting filters.'
              : 'Get started by adding your first batch of pharmacy stock.'}
          </Typography>
          <Button
            variant="contained"
            onClick={handleOpenAdd}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: '12px',
              fontWeight: 800,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: '#FFFFFF'
            }}
          >
            + Add First Medicine
          </Button>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: '20px',
            bgcolor: isDark ? 'rgba(17, 29, 26, 0.85)' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(18, 48, 41, 0.08)',
            overflow: 'hidden'
          }}
        >
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', fontSize: '0.78rem' }}>MEDICINE &amp; COMPOSITION</TableCell>
                <TableCell sx={{ fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', fontSize: '0.78rem' }}>DOSAGE / FORM</TableCell>
                <TableCell sx={{ fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', fontSize: '0.78rem' }}>BATCH &amp; LOCATION</TableCell>
                <TableCell sx={{ fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', fontSize: '0.78rem' }}>EXPIRY</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', fontSize: '0.78rem' }}>STOCK QUANTITY</TableCell>
                <TableCell sx={{ fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', fontSize: '0.78rem' }}>PRICING</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: isDark ? '#94A3B8' : '#475569', fontSize: '0.78rem' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(item => (
                <TableRow
                  key={item.id}
                  sx={{
                    '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC' },
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #F1F5F9'
                  }}
                >
                  {/* Medicine Name & Generic */}
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#123029' }}>
                      {item.medicineName}
                    </Typography>
                    {item.genericName && (
                      <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', fontSize: '0.72rem' }}>
                        {item.genericName}
                      </Typography>
                    )}
                    {item.manufacturer && (
                      <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#94A3B8', fontSize: '0.68rem' }}>
                        Mfr: {item.manufacturer}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Dosage Form & Strength */}
                  <TableCell>
                    <Chip
                      label={item.dosageForm || 'Tablet'}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                        color: isDark ? '#60A5FA' : '#1D4ED8'
                      }}
                    />
                    {item.strength && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.3, fontWeight: 700, color: isDark ? '#94A3B8' : '#475569' }}>
                        {item.strength}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Batch & Rack Location */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: isDark ? '#E2E8F0' : '#1E293B' }}>
                      {item.batchNumber ? `Batch: ${item.batchNumber}` : '—'}
                    </Typography>
                    {item.rackLocation && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.2 }}>
                        <RackIcon sx={{ fontSize: 13, color: '#10B981' }} />
                        <Typography variant="caption" sx={{ color: isDark ? '#34D399' : '#059669', fontWeight: 700 }}>
                          {item.rackLocation}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>

                  {/* Expiry */}
                  <TableCell>
                    {getExpiryBadge(item.expiryDate)}
                  </TableCell>

                  {/* Stock Quantity with +/- Quick Adjust */}
                  <TableCell align="center">
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', p: 0.5, borderRadius: '14px' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleAdjustStock(item.id, -1)}
                        disabled={item.quantity <= 0}
                        sx={{ p: 0.3, color: '#EF4444' }}
                        title="Reduce 1"
                      >
                        <MinusIcon sx={{ fontSize: 18 }} />
                      </IconButton>

                      <Typography
                        variant="body2"
                        sx={{
                          minWidth: 40,
                          textAlign: 'center',
                          fontWeight: 900,
                          color: item.quantity === 0 ? '#EF4444' : item.quantity <= item.reorderLevel ? '#F59E0B' : (isDark ? '#34D399' : '#059669')
                        }}
                      >
                        {item.quantity}
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={() => handleAdjustStock(item.id, 1)}
                        sx={{ p: 0.3, color: '#10B981' }}
                        title="Add 1"
                      >
                        <PlusIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                    {item.reorderLevel && item.quantity <= item.reorderLevel && (
                      <Typography variant="caption" sx={{ display: 'block', color: '#F59E0B', fontWeight: 700, fontSize: '0.65rem', mt: 0.3 }}>
                        Low Stock (Min {item.reorderLevel})
                      </Typography>
                    )}
                  </TableCell>

                  {/* Pricing */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#FFFFFF' : '#123029' }}>
                      MRP: ₹{item.mrp || 0}
                    </Typography>
                    {item.unitPrice > 0 && (
                      <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', fontSize: '0.7rem' }}>
                        Cost: ₹{item.unitPrice}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right">
                    <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                      <Tooltip title="Edit Medicine Details">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(item)}
                          sx={{
                            color: '#3B82F6',
                            bgcolor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
                            borderRadius: '10px',
                            p: 0.8
                          }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete from Stock">
                        <IconButton
                          size="small"
                          onClick={() => handleConfirmDelete(item)}
                          sx={{
                            color: '#EF4444',
                            bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                            borderRadius: '10px',
                            p: 0.8
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Add / Edit Medicine Dialog ── */}
      <Dialog
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDark ? '#0F172A' : '#FFFFFF',
            p: 1
          }
        }}
      >
        <form onSubmit={handleSaveItem}>
          <DialogTitle sx={{ fontWeight: 900, fontSize: '1.25rem', color: isDark ? '#FFFFFF' : '#0F172A' }}>
            {isEditing ? '✏️ Edit Medicine in Stock' : '➕ Add New Medicine to Stock'}
          </DialogTitle>

          <DialogContent dividers sx={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }}>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12} sm={7}>
                <TextField
                  fullWidth
                  required
                  label="Medicine Brand Name"
                  placeholder="e.g. Dolo 650, Augmentin 625 Duo"
                  value={formData.medicineName}
                  onChange={e => setFormData({ ...formData, medicineName: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Dosage Form</InputLabel>
                  <Select
                    value={formData.dosageForm || 'Tablet'}
                    label="Dosage Form"
                    onChange={e => setFormData({ ...formData, dosageForm: e.target.value })}
                  >
                    {DOSAGE_FORMS.map(df => (
                      <MenuItem key={df} value={df}>{df}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Generic Formula / Composition"
                  placeholder="e.g. Paracetamol / Acetaminophen"
                  value={formData.genericName}
                  onChange={e => setFormData({ ...formData, genericName: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Strength"
                  placeholder="e.g. 650mg, 500mg, 10ml"
                  value={formData.strength}
                  onChange={e => setFormData({ ...formData, strength: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Manufacturer / Pharma Brand"
                  placeholder="e.g. Micro Labs, Cipla, Sun Pharma"
                  value={formData.manufacturer}
                  onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Batch Number"
                  placeholder="e.g. ML-2026-X01"
                  value={formData.batchNumber}
                  onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.expiryDate}
                  onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stock Quantity (Units)"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  size="small"
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Reorder Safety Level"
                  value={formData.reorderLevel}
                  onChange={e => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                  size="small"
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cost Price (₹)"
                  value={formData.unitPrice}
                  onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                  size="small"
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>

              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Selling MRP (₹)"
                  value={formData.mrp}
                  onChange={e => setFormData({ ...formData, mrp: Number(e.target.value) })}
                  size="small"
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Rack / Shelf Location"
                  placeholder="e.g. Shelf A-3, Cold Storage"
                  value={formData.rackLocation}
                  onChange={e => setFormData({ ...formData, rackLocation: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes / Storage Instructions"
                  placeholder="e.g. Store below 25°C, schedule H prescription drug"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => setModalOpen(false)}
              disabled={submitting}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', color: '#64748B' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                borderRadius: '12px',
                fontWeight: 800,
                textTransform: 'none',
                px: 3,
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFFFFF'
              }}
            >
              {submitting ? <CircularProgress size={20} color="inherit" /> : isEditing ? 'Update Medicine' : 'Save to Inventory'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#EF4444' }}>
          Delete Medicine?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: isDark ? '#E2E8F0' : '#475569' }}>
            Are you sure you want to delete <strong>{itemToDelete?.medicineName}</strong> from your stock? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteItem}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '10px' }}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
