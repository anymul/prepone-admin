// src/pages/Workshops.jsx
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  GraduationCap,
  MessageCircle,
  Phone,
  Presentation,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Panel, PanelHeader } from '@/components/Panel';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';
import { CONTACT_STATUS_CONFIG, LeadDrawer } from './workshops/LeadDrawer';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const formatDate = (iso) => {
  if (!iso) return '–';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '–';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function Workshops() {
  const [registrations, setRegistrations] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [workshopsList, setWorkshopsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [workshopFilter, setWorkshopFilter] = useState('all');
  const [boardFilter, setBoardFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contactStatusFilter, setContactStatusFilter] = useState('all');
  const [sort, setSort] = useState('-createdAt');

  // Selected lead for drawer
  const [selectedLead, setSelectedLead] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch leads
  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
      });

      if (appliedSearch.trim()) params.set('search', appliedSearch.trim());
      if (workshopFilter !== 'all') params.set('workshopId', workshopFilter);
      if (boardFilter !== 'all') params.set('board', boardFilter);
      if (classFilter !== 'all') params.set('studentClass', classFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (contactStatusFilter !== 'all') params.set('contactStatus', contactStatusFilter);

      const res = await fetch(`${API_BASE_URL}/workshops/admin/registrations?${params.toString()}`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch workshop registrations.');
      }

      setRegistrations(data.registrations || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.workshopsList && Array.isArray(data.workshopsList)) {
        setWorkshopsList(data.workshopsList);
      }
    } catch (err) {
      console.error('[Workshops] fetch error:', err);
      setError(err.message || 'Could not load registrations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, appliedSearch, workshopFilter, boardFilter, classFilter, statusFilter, contactStatusFilter, refreshKey]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const params = new URLSearchParams();
      if (workshopFilter !== 'all') params.set('workshopId', workshopFilter);

      const res = await fetch(`${API_BASE_URL}/workshops/admin/stats?${params.toString()}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('[Workshops] stats error:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [workshopFilter, refreshKey]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setPage(1);
    setAppliedSearch(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    setAppliedSearch('');
    setPage(1);
  };

  const hasActiveFilters =
    appliedSearch.trim() !== '' ||
    workshopFilter !== 'all' ||
    boardFilter !== 'all' ||
    classFilter !== 'all' ||
    statusFilter !== 'all' ||
    contactStatusFilter !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setWorkshopFilter('all');
    setBoardFilter('all');
    setClassFilter('all');
    setStatusFilter('all');
    setContactStatusFilter('all');
    setSort('-createdAt');
    setPage(1);
  };

  // 1-Click CSV Export
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams({ format: 'csv', sort });
      if (workshopFilter !== 'all') params.set('workshopId', workshopFilter);
      if (boardFilter !== 'all') params.set('board', boardFilter);
      if (classFilter !== 'all') params.set('studentClass', classFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (contactStatusFilter !== 'all') params.set('contactStatus', contactStatusFilter);
      if (appliedSearch.trim()) params.set('search', appliedSearch.trim());

      const res = await fetch(`${API_BASE_URL}/workshops/admin/registrations?${params.toString()}`, {
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error('Failed to generate CSV export');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workshop-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Leads CSV exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export CSV: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleLeadUpdated = (updatedDoc) => {
    setRegistrations((prev) =>
      prev.map((r) => (r._id === updatedDoc._id ? { ...r, ...updatedDoc } : r))
    );
    setSelectedLead(updatedDoc);
    setRefreshKey((k) => k + 1);
  };

  return (
    <Box sx={{ display: 'grid', gap: 3.5, pb: 6 }}>
      {/* Page Title & Actions */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: tokens.text }}>
            Workshop sign-ups (leads)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Filter student registrations from solviq.in, manage outreach follow-ups, and export leads.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={fetchRegistrations}
            disabled={loading}
            startIcon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            sx={{
              minHeight: 44,
              borderColor: tokens.rule,
              color: tokens.text,
              textTransform: 'none',
              bgcolor: tokens.sheet,
              '&:hover': { borderColor: tokens.ink, bgcolor: tokens.inkTint },
            }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            onClick={handleExportCsv}
            disabled={exporting || total === 0}
            startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <Download size={16} />}
            sx={{
              minHeight: 44,
              bgcolor: tokens.ink,
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.inkDark, boxShadow: 'none' },
            }}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </Box>
      </Box>

      {/* KPI / Metric Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        <Box
          sx={{
            p: 2.5,
            borderRadius: '12px',
            bgcolor: tokens.sheet,
            border: `1px solid ${tokens.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: tokens.inkTint,
              color: tokens.ink,
              flexShrink: 0,
            }}
          >
            <Users size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Total registrations
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {statsLoading ? <Skeleton width={50} /> : fmt(stats?.total ?? total)}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderRadius: '12px',
            bgcolor: tokens.sheet,
            border: `1px solid ${tokens.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: tokens.amberTint,
              color: tokens.amber,
              flexShrink: 0,
            }}
          >
            <Clock size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              New leads (uncontacted)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {statsLoading ? <Skeleton width={40} /> : fmt(stats?.byContactStatus?.new ?? 0)}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderRadius: '12px',
            bgcolor: tokens.sheet,
            border: `1px solid ${tokens.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: '#E0F2FE',
              color: '#0284C7',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Contacted &amp; interested
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {statsLoading ? (
                <Skeleton width={40} />
              ) : (
                fmt((stats?.byContactStatus?.contacted ?? 0) + (stats?.byContactStatus?.interested ?? 0))
              )}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderRadius: '12px',
            bgcolor: tokens.sheet,
            border: `1px solid ${tokens.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: tokens.greenTint,
              color: tokens.green,
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Converted / Enrolled
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {statsLoading ? <Skeleton width={40} /> : fmt(stats?.byContactStatus?.converted ?? 0)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Filter and Search Panel */}
      <Panel>
        <PanelHeader
          title="Filter and search leads"
          action={
            hasActiveFilters && (
              <Button
                size="small"
                variant="text"
                onClick={handleResetFilters}
                startIcon={<RotateCcw size={14} />}
                sx={{
                  color: tokens.muted,
                  textTransform: 'none',
                  minHeight: 36,
                  '&:hover': { color: tokens.red, bgcolor: tokens.redTint },
                }}
              >
                Reset filters
              </Button>
            )
          }
        />
        <Box sx={{ p: 2.5, display: 'grid', gap: 2 }}>
          {/* Search bar */}
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              display: 'flex',
              gap: 1.5,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search by student name, phone, email, or school..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color={tokens.muted} />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch} edge="end" aria-label="Clear search">
                      <X size={16} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: tokens.sheet }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                minHeight: 40,
                minWidth: 100,
                bgcolor: tokens.ink,
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': { bgcolor: tokens.inkDark, boxShadow: 'none' },
              }}
            >
              Search
            </Button>
          </Box>

          {/* Dropdown Filters */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(5, 1fr)',
              },
              gap: 1.5,
            }}
          >
            {/* Workshop Session */}
            <FormControl size="small" fullWidth>
              <InputLabel id="workshop-filter-label">Workshop session</InputLabel>
              <Select
                labelId="workshop-filter-label"
                value={workshopFilter}
                label="Workshop session"
                onChange={(e) => {
                  setWorkshopFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ bgcolor: tokens.sheet }}
              >
                <MenuItem value="all">All workshops</MenuItem>
                {workshopsList.map((w) => (
                  <MenuItem key={w} value={w}>
                    {w}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Outreach Status */}
            <FormControl size="small" fullWidth>
              <InputLabel id="contact-status-filter-label">Contact status</InputLabel>
              <Select
                labelId="contact-status-filter-label"
                value={contactStatusFilter}
                label="Contact status"
                onChange={(e) => {
                  setContactStatusFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ bgcolor: tokens.sheet }}
              >
                <MenuItem value="all">All contact statuses</MenuItem>
                {Object.entries(CONTACT_STATUS_CONFIG).map(([k, cfg]) => (
                  <MenuItem key={k} value={k}>
                    {cfg.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Board */}
            <FormControl size="small" fullWidth>
              <InputLabel id="board-filter-label">Board</InputLabel>
              <Select
                labelId="board-filter-label"
                value={boardFilter}
                label="Board"
                onChange={(e) => {
                  setBoardFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ bgcolor: tokens.sheet }}
              >
                <MenuItem value="all">All boards</MenuItem>
                <MenuItem value="CBSE">CBSE</MenuItem>
                <MenuItem value="BSEB">BSEB (Bihar Board)</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>

            {/* Class */}
            <FormControl size="small" fullWidth>
              <InputLabel id="class-filter-label">Class</InputLabel>
              <Select
                labelId="class-filter-label"
                value={classFilter}
                label="Class"
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ bgcolor: tokens.sheet }}
              >
                <MenuItem value="all">All classes</MenuItem>
                <MenuItem value="9">Class 9</MenuItem>
                <MenuItem value="10">Class 10</MenuItem>
                <MenuItem value="11">Class 11</MenuItem>
                <MenuItem value="12">Class 12</MenuItem>
              </Select>
            </FormControl>

            {/* Registration Status */}
            <FormControl size="small" fullWidth>
              <InputLabel id="status-filter-label">Seat status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Seat status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ bgcolor: tokens.sheet }}
              >
                <MenuItem value="all">All seats</MenuItem>
                <MenuItem value="registered">Registered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Panel>

      {/* Leads Table / List */}
      <Panel>
        <PanelHeader
          title={`Registrations (${fmt(total)})`}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Sort:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  sx={{ height: 32, fontSize: '0.825rem', bgcolor: tokens.sheet }}
                >
                  <MenuItem value="-createdAt">Newest first</MenuItem>
                  <MenuItem value="createdAt">Oldest first</MenuItem>
                  <MenuItem value="name">Name (A–Z)</MenuItem>
                  <MenuItem value="-name">Name (Z–A)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          }
        />

        {error && (
          <Box sx={{ p: 3 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={fetchRegistrations}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          </Box>
        )}

        {loading ? (
          <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={32} sx={{ color: tokens.ink }} />
            <Typography variant="body2" color="text.secondary">
              Loading workshop registrations...
            </Typography>
          </Box>
        ) : registrations.length === 0 ? (
          <Box
            sx={{
              p: 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: tokens.inkTint,
                color: tokens.ink,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Presentation size={28} />
            </Box>
            <Typography variant="h6" sx={{ color: tokens.text, fontWeight: 600 }}>
              No workshop registrations found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440 }}>
              {hasActiveFilters
                ? 'No sign-ups match your current search and filter settings. Try clearing some filters.'
                : 'No students have registered for Board Pe Charcha workshops yet.'}
            </Typography>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                sx={{
                  mt: 1,
                  borderColor: tokens.rule,
                  color: tokens.ink,
                  textTransform: 'none',
                  minHeight: 40,
                }}
              >
                Clear all filters
              </Button>
            )}
          </Box>
        ) : (
          <>
            {/* Desktop Table View */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead sx={{ bgcolor: '#F6EFE3' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Student &amp; School</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Class &amp; Board</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Workshop Session</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Outreach Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Registered</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registrations.map((lead) => {
                    const cfg = CONTACT_STATUS_CONFIG[lead.contactStatus] || CONTACT_STATUS_CONFIG.new;
                    const cleanPhone = (lead.phone || '').replace(/\D/g, '').slice(-10);
                    const waUrl = cleanPhone
                      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                          `Hi ${lead.name}, thank you for registering for the Board Pe Charcha session on Solviq!`
                        )}`
                      : null;

                    return (
                      <TableRow
                        key={lead._id}
                        hover
                        onClick={() => setSelectedLead(lead)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(63, 33, 112, 0.03)' },
                        }}
                      >
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text }}>
                            {lead.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: tokens.muted }}>
                            {lead.school || 'School not specified'}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: tokens.text }}>
                              +91 {lead.phone}
                            </Typography>
                            {waUrl && (
                              <Tooltip title="Send WhatsApp message">
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  sx={{
                                    p: 0.5,
                                    color: '#25D366',
                                    '&:hover': { bgcolor: tokens.greenTint },
                                  }}
                                >
                                  <MessageCircle size={15} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                          {lead.email && (
                            <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>
                              {lead.email}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ py: 1.5 }}>
                          <Chip
                            size="small"
                            label={`Class ${lead.studentClass} • ${lead.board}`}
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              bgcolor: tokens.paper,
                              border: `1px solid ${tokens.rule}`,
                              color: tokens.text,
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ py: 1.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              color: tokens.ink,
                              maxWidth: 180,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {lead.workshopId}
                          </Typography>
                          {lead.status === 'cancelled' && (
                            <Typography variant="caption" sx={{ color: tokens.red, fontWeight: 600 }}>
                              Seat cancelled
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ py: 1.5 }}>
                          <Chip
                            size="small"
                            label={cfg.label}
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              color: cfg.color,
                              bgcolor: cfg.bgcolor,
                              border: `1px solid ${cfg.color}30`,
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '0.85rem' }}>
                            {formatDate(lead.createdAt)}
                          </Typography>
                        </TableCell>

                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                            }}
                            startIcon={<Eye size={14} />}
                            sx={{
                              minHeight: 32,
                              borderColor: tokens.rule,
                              color: tokens.ink,
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              '&:hover': { borderColor: tokens.ink, bgcolor: tokens.inkTint },
                            }}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            {/* Mobile Card Layout */}
            <Box sx={{ display: { xs: 'grid', md: 'none' }, gap: 1.5, p: 2 }}>
              {registrations.map((lead) => {
                const cfg = CONTACT_STATUS_CONFIG[lead.contactStatus] || CONTACT_STATUS_CONFIG.new;
                const cleanPhone = (lead.phone || '').replace(/\D/g, '').slice(-10);
                const waUrl = cleanPhone
                  ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                      `Hi ${lead.name}, thank you for registering for the Board Pe Charcha session on Solviq!`
                    )}`
                  : null;

                return (
                  <Box
                    key={lead._id}
                    onClick={() => setSelectedLead(lead)}
                    sx={{
                      p: 2,
                      borderRadius: '10px',
                      bgcolor: tokens.sheet,
                      border: `1px solid ${tokens.rule}`,
                      display: 'grid',
                      gap: 1.5,
                      cursor: 'pointer',
                      '&:hover': { borderColor: tokens.ink },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.text }}>
                          {lead.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: tokens.muted }}>
                          {lead.school || 'School not specified'}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={cfg.label}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: cfg.color,
                          bgcolor: cfg.bgcolor,
                          border: `1px solid ${cfg.color}30`,
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Chip
                        size="small"
                        label={`Class ${lead.studentClass} • ${lead.board}`}
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          bgcolor: tokens.paper,
                          border: `1px solid ${tokens.rule}`,
                        }}
                      />
                      <Typography variant="caption" sx={{ color: tokens.ink, fontWeight: 500 }}>
                        {lead.workshopId}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: `1px solid ${tokens.rule}` }}>
                      <Typography variant="caption" sx={{ color: tokens.muted }}>
                        {formatDate(lead.createdAt)}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {cleanPhone && (
                          <IconButton
                            component="a"
                            href={`tel:+91${cleanPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            size="small"
                            sx={{
                              width: 44,
                              height: 44,
                              color: tokens.ink,
                              bgcolor: tokens.inkTint,
                            }}
                          >
                            <Phone size={18} />
                          </IconButton>
                        )}
                        {waUrl && (
                          <IconButton
                            component="a"
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            size="small"
                            sx={{
                              width: 44,
                              height: 44,
                              color: '#ffffff',
                              bgcolor: '#25D366',
                              '&:hover': { bgcolor: '#1EBE5D' },
                            }}
                          >
                            <MessageCircle size={18} />
                          </IconButton>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                          sx={{
                            minHeight: 44,
                            px: 1.5,
                            borderColor: tokens.rule,
                            color: tokens.ink,
                            textTransform: 'none',
                          }}
                        >
                          View
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Pagination Controls */}
            <Box
              sx={{
                p: 2,
                borderTop: `1px solid ${tokens.rule}`,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Showing {registrations.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                {Math.min(page * limit, total)} of {fmt(total)} registrations
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 90 }}>
                  <Select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    sx={{ height: 32, fontSize: '0.825rem', bgcolor: tokens.sheet }}
                  >
                    <MenuItem value={25}>25 / page</MenuItem>
                    <MenuItem value={50}>50 / page</MenuItem>
                    <MenuItem value={100}>100 / page</MenuItem>
                  </Select>
                </FormControl>

                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                  size="small"
                  showFirstButton
                  showLastButton
                />
              </Box>
            </Box>
          </>
        )}
      </Panel>

      {/* Lead Details Drawer */}
      <LeadDrawer
        lead={selectedLead}
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        onUpdated={handleLeadUpdated}
      />
    </Box>
  );
}
