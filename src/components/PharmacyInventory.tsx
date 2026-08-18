'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Stack,
  Autocomplete,
  Divider,
  Alert
} from '@mui/material';
import {
  Inventory2 as InventoryIcon,
  Medication as MedIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  WarningAmber as WarningIcon,
  ErrorOutline as OutOfStockIcon,
  CheckCircleOutline as InStockIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  LocalOffer as PriceIcon,
  Category as CategoryIcon,
  EventBusy as ExpiryIcon,
  Place as RackIcon,
  AddCircle as AddCircleIcon,
  Science as ScienceIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';
import {
  InventoryItem,
  InventoryStats,
  DosageForm,
  CreateInventoryPayload
} from '../types/inventory';
import {
  getInventoryList,
  getInventoryStats,
  createInventoryItem,
  updateInventoryItem,
  adjustStockQuantity,
  deleteInventoryItem
} from '../services/inventory';
import indianMedicines from '../data/indianMedicines.json';

interface PharmacyInventoryProps {
  onNotify?: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

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

export default function PharmacyInventory({ onNotify }: PharmacyInventoryProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dosageFilter, setDosageFilter] = useState('all');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  // Modals state
  const [addCatalogModalOpen, setAddCatalogModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateInventoryPayload>({
    medicineName: '',
    genericName: '',
    dosageForm: 'Tablet',
    strength: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 10,
    unitPrice: 0,
    mrp: 0,
    reorderLevel: 10,
    rackLocation: '',
    isCustom: false,
    notes: ''
  });

  // Master catalog autocomplete search
  const [catalogSearchText, setCatalogSearchText] = useState('');
  const [selectedCatalogMed, setSelectedCatalogMed] = useState<string | null>(null);

  const notify = (msg: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    if (onNotify) onNotify(msg, severity);
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await getInventoryStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (e) {
      console.error('Failed to load inventory stats:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await getInventoryList({
        search: search.trim(),
        status: statusFilter !== 'all' ? statusFilter : undefined,
        dosageForm: dosageFilter !== 'all' ? dosageFilter : undefined,
        limit: 200
      });
      if (res.success) {
        setItems(res.items || []);
      }
    } catch (e) {
      console.error('Failed to load inventory list:', e);
      notify('Failed to load stock list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchInventory();
  }, [statusFilter, dosageFilter]);

  // Handle Search on Enter or debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Catalog filtered matches
  const catalogSuggestions = useMemo(() => {
    if (!catalogSearchText || catalogSearchText.length < 2) return [];
    const q = catalogSearchText.toLowerCase().trim();
    const all = indianMedicines as string[];
    const matches: string[] = [];
    for (let i = 0; i < all.length && matches.length < 40; i++) {
      if (all[i].toLowerCase().includes(q)) {
        matches.push(all[i]);
      }
    }
    return matches;
  }, [catalogSearchText]);

  // Quick inline stock adjustment
  const handleQuickAdjust = async (item: InventoryItem, delta: number) => {
    try {
      setAdjustingId(item.id);
      const res = await adjustStockQuantity(item.id, delta);
      if (res.success && res.item) {
        setItems(prev => prev.map(it => it.id === item.id ? res.item : it));
        fetchStats();
      }
    } catch (e: any) {
      notify(e.response?.data?.message || 'Failed to adjust quantity', 'error');
    } finally {
      setAdjustingId(null);
    }
  };

  // Delete item
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from your pharmacy stock?`)) {
      return;
    }
    try {
      const res = await deleteInventoryItem(id);
      if (res.success) {
        setItems(prev => prev.filter(it => it.id !== id));
        fetchStats();
        notify(`"${name}" removed from stock`, 'success');
      }
    } catch (e) {
      notify('Failed to delete item', 'error');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      medicineName: item.medicineName,
      genericName: item.genericName || '',
      dosageForm: item.dosageForm || 'Tablet',
      strength: item.strength || '',
      manufacturer: item.manufacturer || '',
      batchNumber: item.batchNumber || '',
      expiryDate: item.expiryDate || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      mrp: item.mrp,
      reorderLevel: item.reorderLevel || 10,
      rackLocation: item.rackLocation || '',
      isCustom: item.isCustom,
      notes: item.notes || ''
    });
    setEditModalOpen(true);
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      setFormSubmitting(true);
      const res = await updateInventoryItem(selectedItem.id, formData);
      if (res.success && res.item) {
        setItems(prev => prev.map(it => it.id === selectedItem.id ? res.item : it));
        fetchStats();
        setEditModalOpen(false);
        notify('Medicine stock updated successfully', 'success');
      }
    } catch (e: any) {
      notify(e.response?.data?.message || 'Failed to update medicine', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Save from Catalog
  const handleSaveCatalogItem = async () => {
    if (!selectedCatalogMed && !formData.medicineName) {
      notify('Please select a medicine from the database', 'warning');
      return;
    }

    try {
      setFormSubmitting(true);
      const name = selectedCatalogMed || formData.medicineName;
      const res = await createInventoryItem({
        ...formData,
        medicineName: name,
        isCustom: false
      });

      if (res.success && res.item) {
        setItems(prev => [res.item, ...prev]);
        fetchStats();
        setAddCatalogModalOpen(false);
        setSelectedCatalogMed(null);
        setCatalogSearchText('');
        notify(`Added "${name}" to your stock!`, 'success');
      }
    } catch (e: any) {
      notify(e.response?.data?.message || 'Failed to add medicine', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Save Custom Medicine
  const handleSaveCustomItem = async () => {
    if (!formData.medicineName.trim()) {
      notify('Medicine name is required', 'warning');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await createInventoryItem({
        ...formData,
        isCustom: true
      });

      if (res.success && res.item) {
        setItems(prev => [res.item, ...prev]);
        fetchStats();
        setCustomModalOpen(false);
        notify(`Added custom medicine "${formData.medicineName}" to your stock!`, 'success');
      }
    } catch (e: any) {
      notify(e.response?.data?.message || 'Failed to add custom medicine', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePrintStock = () => {
    window.print();
  };

  const getStatusBadge = (status: string, qty: number) => {
    if (status === 'out_of_stock' || qty <= 0) {
      return <Chip label="Out of Stock" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontWeight: 800, fontSize: '0.7rem' }} />;
    }
    if (status === 'low_stock') {
      return <Chip label="Low Stock" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: 800, fontSize: '0.7rem' }} />;
    }
    if (status === 'expired') {
      return <Chip label="Expired" size="small" sx={{ bgcolor: 'rgba(225, 29, 72, 0.2)', color: '#E11D48', fontWeight: 800, fontSize: '0.7rem' }} />;
    }
    return <Chip label="In Stock" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 800, fontSize: '0.7rem' }} />;
  };

  return (
    <Box sx={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}>
      {/* 5 Real-Time KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Unique Medicines */}
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(13, 148, 136, 0.12)' : '#F0FDFA',
              border: isDark ? '1px solid rgba(13, 148, 136, 0.3)' : '1px solid #CCFBF1',
              textAlign: 'center',
              boxShadow: isDark ? 'none' : '0 4px 14px rgba(13, 148, 136, 0.06)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mb: 0.5 }}>
              <InventoryIcon sx={{ color: isDark ? '#2DD4BF' : '#0D9488', fontSize: 20 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#99F6E4' : '#0F766E' }}>
                Total Items
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0F766E' }}>
              {statsLoading ? <CircularProgress size={18} /> : stats?.totalItems || 0}
            </Typography>
          </Paper>
        </Grid>

        {/* Total Units In Stock */}
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
              border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #A7F3D0',
              textAlign: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mb: 0.5 }}>
              <MedIcon sx={{ color: isDark ? '#34D399' : '#059669', fontSize: 20 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#A7F3D0' : '#047857' }}>
                Stock Units
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#34D399' : '#059669' }}>
              {statsLoading ? <CircularProgress size={18} /> : stats?.totalUnits || 0}
            </Typography>
          </Paper>
        </Grid>

        {/* Low Stock Items */}
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper
            elevation={0}
            onClick={() => setStatusFilter(statusFilter === 'low_stock' ? 'all' : 'low_stock')}
            sx={{
              p: 2,
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
              border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              '&:hover': { transform: 'scale(1.02)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mb: 0.5 }}>
              <WarningIcon sx={{ color: isDark ? '#FBBF24' : '#D97706', fontSize: 20 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#FDE68A' : '#B45309' }}>
                Low Stock
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#FBBF24' : '#D97706' }}>
              {statsLoading ? <CircularProgress size={18} /> : stats?.lowStockCount || 0}
            </Typography>
          </Paper>
        </Grid>

        {/* Out of Stock */}
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper
            elevation={0}
            onClick={() => setStatusFilter(statusFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
            sx={{
              p: 2,
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
              border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              '&:hover': { transform: 'scale(1.02)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mb: 0.5 }}>
              <OutOfStockIcon sx={{ color: isDark ? '#F87171' : '#DC2626', fontSize: 20 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#FECACA' : '#B91C1C' }}>
                Out of Stock
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#F87171' : '#DC2626' }}>
              {statsLoading ? <CircularProgress size={18} /> : stats?.outOfStockCount || 0}
            </Typography>
          </Paper>
        </Grid>

        {/* Inventory Valuation */}
        <Grid item xs={12} sm={8} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF',
              border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #C7D2FE',
              textAlign: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8, mb: 0.5 }}>
              <PriceIcon sx={{ color: isDark ? '#818CF8' : '#4F46E5', fontSize: 20 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#C7D2FE' : '#3730A3' }}>
                Total Valuation
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#818CF8' : '#4F46E5' }}>
              {statsLoading ? <CircularProgress size={18} /> : `₹${(stats?.totalValuation || 0).toLocaleString()}`}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Critical Expiry & Stock Action Alerts */}
      {((stats?.expiredCount || 0) > 0 || (stats?.expiringSoonCount || 0) > 0 || (stats?.lowStockCount || 0) > 0) && (
        <Alert
          severity={(stats?.expiredCount || 0) > 0 ? 'error' : 'warning'}
          icon={<ExpiryIcon />}
          sx={{
            mb: 3,
            borderRadius: '20px',
            bgcolor: (stats?.expiredCount || 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: (stats?.expiredCount || 0) > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            color: (stats?.expiredCount || 0) > 0 ? (isDark ? '#FCA5A5' : '#991B1B') : (isDark ? '#FDE68A' : '#92400E'),
            alignItems: 'center',
            '& .MuiAlert-icon': { color: (stats?.expiredCount || 0) > 0 ? '#EF4444' : '#F59E0B' }
          }}
          action={
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {(stats?.expiredCount || 0) > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => setStatusFilter('expired')}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, fontSize: '0.75rem' }}
                >
                  View {stats?.expiredCount} Expired
                </Button>
              )}
              {(stats?.lowStockCount || 0) > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => setStatusFilter('low_stock')}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800, fontSize: '0.75rem' }}
                >
                  View {stats?.lowStockCount} Low Stock
                </Button>
              )}
            </Stack>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {(stats?.expiredCount || 0) > 0 
              ? `Action Required: You have ${stats?.expiredCount} expired medicine(s) and ${stats?.expiringSoonCount || 0} batch(es) nearing expiry within 30 days.`
              : `Stock Notice: You have ${stats?.expiringSoonCount || 0} batch(es) nearing expiry within 30 days and ${stats?.lowStockCount || 0} low stock item(s).`}
          </Typography>
        </Alert>
      )}

      {/* Main Stock Table Container Glass Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: '28px',
          bgcolor: isDark ? 'rgba(17, 29, 26, 0.92)' : '#FFFFFF',
          border: isDark ? '1px solid rgba(102, 205, 170, 0.25)' : '1px solid rgba(18, 48, 41, 0.12)',
          boxShadow: isDark ? '0 16px 36px rgba(0,0,0,0.4)' : '0 12px 32px rgba(18, 48, 41, 0.08)'
        }}
      >
        {/* Action Header & Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              bgcolor: 'rgba(13, 148, 136, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <InventoryIcon sx={{ color: isDark ? '#2DD4BF' : '#0F766E', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#123029' }}>
                My Pharmacy Stock
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 600 }}>
                Manage live quantities, batch codes, expiry dates, rack locations, and pricing
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchInventory}
              startIcon={<RefreshIcon />}
              sx={{
                borderRadius: '14px',
                fontWeight: 800,
                textTransform: 'none',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                color: isDark ? '#FAF2F5' : '#123029'
              }}
            >
              Refresh
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={handlePrintStock}
              startIcon={<PrintIcon />}
              sx={{
                borderRadius: '14px',
                fontWeight: 800,
                textTransform: 'none',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                color: isDark ? '#FAF2F5' : '#123029'
              }}
            >
              Print Sheet
            </Button>

            <Button
              variant="contained"
              size="medium"
              onClick={() => {
                setFormData({
                  medicineName: '',
                  genericName: '',
                  dosageForm: 'Tablet',
                  strength: '',
                  manufacturer: '',
                  batchNumber: '',
                  expiryDate: '',
                  quantity: 10,
                  unitPrice: 0,
                  mrp: 0,
                  reorderLevel: 10,
                  rackLocation: '',
                  isCustom: true,
                  notes: ''
                });
                setCustomModalOpen(true);
              }}
              startIcon={<AddCircleIcon />}
              sx={{
                borderRadius: '16px',
                fontWeight: 900,
                textTransform: 'none',
                bgcolor: '#0D9488',
                color: '#FFFFFF',
                '&:hover': { bgcolor: '#0F766E' }
              }}
            >
              + Custom Medicine
            </Button>

            <Button
              variant="contained"
              size="medium"
              onClick={() => {
                setFormData({
                  medicineName: '',
                  genericName: '',
                  dosageForm: 'Tablet',
                  strength: '',
                  manufacturer: '',
                  batchNumber: '',
                  expiryDate: '',
                  quantity: 10,
                  unitPrice: 0,
                  mrp: 0,
                  reorderLevel: 10,
                  rackLocation: '',
                  isCustom: false,
                  notes: ''
                });
                setSelectedCatalogMed(null);
                setCatalogSearchText('');
                setAddCatalogModalOpen(true);
              }}
              startIcon={<MedIcon />}
              sx={{
                borderRadius: '16px',
                fontWeight: 900,
                textTransform: 'none',
                bgcolor: '#10B981',
                color: '#FFFFFF',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              + 250k+ Indian Catalog
            </Button>
          </Stack>
        </Box>

        {/* Filter Controls Row */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search medicine name, generic composition, batch, or rack..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: isDark ? '#2DD4BF' : '#0F766E', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#F8FAFC'
                }
              }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: isDark ? '#9CA3AF' : '#64748B' }}>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: '14px', bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#F8FAFC' }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="in_stock">🟢 In Stock</MenuItem>
                <MenuItem value="low_stock">🟡 Low Stock</MenuItem>
                <MenuItem value="out_of_stock">🔴 Out of Stock</MenuItem>
                <MenuItem value="expired">⚠️ Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: isDark ? '#9CA3AF' : '#64748B' }}>Dosage Form</InputLabel>
              <Select
                value={dosageFilter}
                label="Dosage Form"
                onChange={(e) => setDosageFilter(e.target.value)}
                sx={{ borderRadius: '14px', bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#F8FAFC' }}
              >
                <MenuItem value="all">All Dosage Forms</MenuItem>
                {DOSAGE_FORMS.map(df => (
                  <MenuItem key={df} value={df}>{df}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Stock Items Table */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={36} sx={{ color: '#10B981' }} />
            <Typography variant="body2" sx={{ mt: 2, color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 700 }}>
              Loading pharmacy inventory...
            </Typography>
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
            <InventoryIcon sx={{ fontSize: 56, color: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#123029' }}>
              No Medicines in Stock Found
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#9CA3AF' : '#64748B', mb: 3, maxWidth: 450, mx: 'auto' }}>
              {search || statusFilter !== 'all' || dosageFilter !== 'all'
                ? 'Try adjusting your search terms or filters.'
                : 'Start by importing from our 250k+ Indian medicines catalog or add custom pharmacist medicines.'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => setAddCatalogModalOpen(true)}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: '14px',
                fontWeight: 900,
                bgcolor: '#10B981',
                color: '#FFFFFF',
                textTransform: 'none'
              }}
            >
              Add First Medicine
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ borderRadius: '18px', overflow: 'hidden' }}>
            <Table size="medium">
              <TableHead sx={{ bgcolor: isDark ? 'rgba(0,0,0,0.4)' : '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0F766E' }}>Medicine Name</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0F766E' }}>Dosage & Strength</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0F766E' }}>Batch & Expiry</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0F766E' }}>Rack</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0F766E' }}>Price (₹)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0F766E' }}>Quantity & Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: isDark ? '#2DD4BF' : '#0F766E' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      bgcolor: item.status === 'out_of_stock'
                        ? (isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(254, 242, 242, 0.6)')
                        : 'transparent'
                    }}
                  >
                    {/* Medicine Name */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#123029', fontSize: '0.92rem' }}>
                          {item.medicineName}
                        </Typography>
                        {item.isCustom && (
                          <Chip label="Custom" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 900, bgcolor: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }} />
                        )}
                      </Box>
                      {item.genericName && (
                        <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', display: 'block', fontWeight: 600 }}>
                          {item.genericName}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Dosage & Strength */}
                    <TableCell>
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <Chip label={item.dosageForm || 'Tablet'} size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }} />
                        {item.strength && (
                          <Chip label={item.strength} size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800, bgcolor: isDark ? 'rgba(13, 148, 136, 0.15)' : '#E6FFFA', color: isDark ? '#2DD4BF' : '#0F766E' }} />
                        )}
                      </Stack>
                    </TableCell>

                    {/* Batch & Expiry */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#E2E8F0' : '#334155' }}>
                        {item.batchNumber ? `Batch: ${item.batchNumber}` : '—'}
                      </Typography>
                      {item.expiryDate && (
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: new Date(item.expiryDate) < new Date() ? '#EF4444' : (isDark ? '#9CA3AF' : '#64748B') }}>
                          Exp: {item.expiryDate}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Rack Location */}
                    <TableCell>
                      {item.rackLocation ? (
                        <Chip icon={<RackIcon sx={{ fontSize: '13px !important' }} />} label={item.rackLocation} size="small" sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />
                      ) : (
                        <Typography variant="caption" sx={{ color: isDark ? '#6B7280' : '#94A3B8' }}>—</Typography>
                      )}
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: isDark ? '#F8FAFC' : '#123029' }}>
                        ₹{item.unitPrice || item.mrp || 0}
                      </Typography>
                      {item.mrp && item.mrp > item.unitPrice && (
                        <Typography variant="caption" sx={{ color: isDark ? '#9CA3AF' : '#64748B', textDecoration: 'line-through' }}>
                          MRP ₹{item.mrp}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Quantity & Quick Adjuster */}
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                        <IconButton
                          size="small"
                          disabled={adjustingId === item.id || item.quantity <= 0}
                          onClick={() => handleQuickAdjust(item, -1)}
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '8px',
                            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1' }
                          }}
                        >
                          <RemoveIcon sx={{ fontSize: 14 }} />
                        </IconButton>

                        <Typography sx={{ fontWeight: 900, minWidth: 28, textAlign: 'center', color: isDark ? '#FAF2F5' : '#123029', fontSize: '1rem' }}>
                          {item.quantity}
                        </Typography>

                        <IconButton
                          size="small"
                          disabled={adjustingId === item.id}
                          onClick={() => handleQuickAdjust(item, 1)}
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '8px',
                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
                            color: '#10B981',
                            '&:hover': { bgcolor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0' }
                          }}
                        >
                          <AddIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                      {getStatusBadge(item.status, item.quantity)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit Details & Pricing">
                          <IconButton size="small" onClick={() => handleOpenEdit(item)} sx={{ color: isDark ? '#2DD4BF' : '#0F766E' }}>
                            <EditIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete from Stock">
                          <IconButton size="small" onClick={() => handleDelete(item.id, item.medicineName)} sx={{ color: '#EF4444' }}>
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Modal 1: Add from 250k+ Indian Catalog */}
      <Dialog
        open={addCatalogModalOpen}
        onClose={() => setAddCatalogModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDark ? '#111D1A' : '#FFFFFF',
            border: isDark ? '1px solid rgba(102, 205, 170, 0.3)' : '1px solid #E2E8F0',
            fontFamily: "'Outfit', sans-serif"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#123029' }}>
          📦 Add Medicine from 250k+ Indian Catalog
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }}>
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: '14px', fontWeight: 600 }}>
            Type brand name or generic composition to search from over 250,000 verified Indian medicines and add directly to your pharmacy stock.
          </Alert>

          <Autocomplete
            freeSolo
            options={catalogSuggestions}
            value={selectedCatalogMed}
            onChange={(_, newValue) => {
              setSelectedCatalogMed(newValue);
              if (newValue) {
                setFormData(prev => ({ ...prev, medicineName: newValue }));
              }
            }}
            inputValue={catalogSearchText}
            onInputChange={(_, newInputValue) => setCatalogSearchText(newInputValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Indian Medicines Catalog"
                placeholder="e.g. Dolo 650, Augmentin 625, Pan 40..."
                fullWidth
                sx={{ mb: 2.5 }}
              />
            )}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Dosage Form</InputLabel>
                <Select
                  value={formData.dosageForm}
                  label="Dosage Form"
                  onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                >
                  {DOSAGE_FORMS.map(df => (
                    <MenuItem key={df} value={df}>{df}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Strength (e.g. 500mg / 10ml)"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Initial Quantity (Units)"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Unit Price ₹ (Selling)"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="MRP ₹"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Batch Number"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Expiry Date"
                InputLabelProps={{ shrink: true }}
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Rack / Shelf Location"
                placeholder="e.g. Rack B-4"
                value={formData.rackLocation}
                onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }}>
          <Button onClick={() => setAddCatalogModalOpen(false)} sx={{ fontWeight: 800, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={formSubmitting || (!selectedCatalogMed && !formData.medicineName)}
            onClick={handleSaveCatalogItem}
            sx={{
              borderRadius: '14px',
              fontWeight: 900,
              textTransform: 'none',
              bgcolor: '#10B981',
              color: '#FFFFFF',
              '&:hover': { bgcolor: '#059669' }
            }}
          >
            {formSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Add to My Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal 2: Add Custom Medicine */}
      <Dialog
        open={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDark ? '#111D1A' : '#FFFFFF',
            border: isDark ? '1px solid rgba(102, 205, 170, 0.3)' : '1px solid #E2E8F0',
            fontFamily: "'Outfit', sans-serif"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#123029' }}>
          ✨ Add Custom / Private Pharmacist Medicine
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                required
                size="small"
                label="Medicine Brand Name"
                placeholder="e.g. Custom Compounded Solution"
                value={formData.medicineName}
                onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Dosage Form</InputLabel>
                <Select
                  value={formData.dosageForm}
                  label="Dosage Form"
                  onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                >
                  {DOSAGE_FORMS.map(df => (
                    <MenuItem key={df} value={df}>{df}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Generic Name / Active Composition"
                placeholder="e.g. Paracetamol + Caffeine"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Strength"
                placeholder="e.g. 500mg + 50mg"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Manufacturer / Brand"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Rack / Shelf Location"
                placeholder="e.g. Section C-12"
                value={formData.rackLocation}
                onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Initial Quantity (Units)"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Unit Price ₹ (Selling)"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Reorder Alert Level"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value, 10) || 10 })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Batch Number"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Expiry Date"
                InputLabelProps={{ shrink: true }}
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }}>
          <Button onClick={() => setCustomModalOpen(false)} sx={{ fontWeight: 800, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={formSubmitting || !formData.medicineName.trim()}
            onClick={handleSaveCustomItem}
            sx={{
              borderRadius: '14px',
              fontWeight: 900,
              textTransform: 'none',
              bgcolor: '#0D9488',
              color: '#FFFFFF',
              '&:hover': { bgcolor: '#0F766E' }
            }}
          >
            {formSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Save Custom Medicine'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal 3: Edit Medicine Stock */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: isDark ? '#111D1A' : '#FFFFFF',
            border: isDark ? '1px solid rgba(102, 205, 170, 0.3)' : '1px solid #E2E8F0',
            fontFamily: "'Outfit', sans-serif"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: isDark ? '#F8FAFC' : '#123029' }}>
          ✏️ Edit Medicine Stock & Pricing
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="Medicine Name"
                value={formData.medicineName}
                onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Dosage Form</InputLabel>
                <Select
                  value={formData.dosageForm}
                  label="Dosage Form"
                  onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                >
                  {DOSAGE_FORMS.map(df => (
                    <MenuItem key={df} value={df}>{df}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Generic Name / Active Ingredients"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Strength"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Current Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Unit Price ₹ (Selling)"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="MRP ₹"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Batch Number"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Expiry Date"
                InputLabelProps={{ shrink: true }}
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Rack Location"
                value={formData.rackLocation}
                onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }}>
          <Button onClick={() => setEditModalOpen(false)} sx={{ fontWeight: 800, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={formSubmitting}
            onClick={handleSaveEdit}
            sx={{
              borderRadius: '14px',
              fontWeight: 900,
              textTransform: 'none',
              bgcolor: '#10B981',
              color: '#FFFFFF',
              '&:hover': { bgcolor: '#059669' }
            }}
          >
            {formSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
