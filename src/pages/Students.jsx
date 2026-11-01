// src/pages/Students.jsx
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
  Coins,
  CreditCard,
  Eye,
  Filter,
  GraduationCap,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Panel, PanelHeader } from '@/components/Panel';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';
import { GrantCreditsDialog } from './students/GrantCreditsDialog';
import { StudentDrawer } from './students/StudentDrawer';

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

const formatTimeAgo = (iso) => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Never';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)}d ago`;
  return formatDate(iso);
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [board, setBoard] = useState('all');
  const [studentClass, setStudentClass] = useState('all');
  const [plan, setPlan] = useState('all');
  const [sort, setSort] = useState('recent');

  // Modals & Drawers
  const [drawerStudentId, setDrawerStudentId] = useState(null);
  const [grantDialogStudent, setGrantDialogStudent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (appliedSearch.trim()) params.set('search', appliedSearch.trim());
      if (board !== 'all') params.set('board', board);
      if (studentClass !== 'all') params.set('studentClass', studentClass);
      if (plan !== 'all') params.set('plan', plan);
      if (sort !== 'recent') params.set('sort', sort);

      const res = await fetch(`${API_BASE_URL}/students/admin/list?${params.toString()}`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch student directory.');
      }

      setStudents(data.students || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('[Students] fetch error:', err);
      setError(err.message || 'Could not load students. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedSearch, board, studentClass, plan, sort, refreshKey]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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
    board !== 'all' ||
    studentClass !== 'all' ||
    plan !== 'all' ||
    sort !== 'recent';

  const handleResetFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setBoard('all');
    setStudentClass('all');
    setPlan('all');
    setSort('recent');
    setPage(1);
  };

  const handleCreditGrantSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <Box sx={{ display: 'grid', gap: 3.5, pb: 6 }}>
      {/* Page Title & Overview */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: tokens.text }}>
          Students and credits
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search registered students, inspect 360° test performance &amp; credit ledger, and grant goodwill credits.
        </Typography>
      </Box>

      {/* Quick Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
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
            }}
          >
            <Users size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Total registered
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {fmt(total)}
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
              bgcolor: tokens.accentTint,
              color: tokens.amber,
            }}
          >
            <Coins size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Credits &amp; refunds
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              Admin grant
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
            }}
          >
            <GraduationCap size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Class coverage
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              BSEB &amp; CBSE
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Filter Toolbar */}
      <Panel sx={{ p: 2.5 }}>
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '2.5fr 1fr 1fr 1fr 1.5fr auto',
            },
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          {/* Search box */}
          <TextField
            size="small"
            placeholder="Search student name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color={tokens.muted} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    sx={{ p: 0.5 }}
                  >
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            fullWidth
          />

          {/* Board */}
          <FormControl size="small" fullWidth>
            <InputLabel id="board-select-label">Board</InputLabel>
            <Select
              labelId="board-select-label"
              value={board}
              label="Board"
              onChange={(e) => {
                setBoard(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All boards</MenuItem>
              <MenuItem value="BSEB">BSEB</MenuItem>
              <MenuItem value="CBSE">CBSE</MenuItem>
            </Select>
          </FormControl>

          {/* Class */}
          <FormControl size="small" fullWidth>
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              labelId="class-select-label"
              value={studentClass}
              label="Class"
              onChange={(e) => {
                setStudentClass(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All classes</MenuItem>
              <MenuItem value="10">Class 10</MenuItem>
              <MenuItem value="11">Class 11</MenuItem>
              <MenuItem value="12">Class 12</MenuItem>
            </Select>
          </FormControl>

          {/* Plan */}
          <FormControl size="small" fullWidth>
            <InputLabel id="plan-select-label">Plan</InputLabel>
            <Select
              labelId="plan-select-label"
              value={plan}
              label="Plan"
              onChange={(e) => {
                setPlan(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All plans</MenuItem>
              <MenuItem value="premium">Premium</MenuItem>
              <MenuItem value="free">Free</MenuItem>
            </Select>
          </FormControl>

          {/* Sort */}
          <FormControl size="small" fullWidth>
            <InputLabel id="sort-select-label">Sort by</InputLabel>
            <Select
              labelId="sort-select-label"
              value={sort}
              label="Sort by"
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="recent">Recently joined</MenuItem>
              <MenuItem value="activity">Last active</MenuItem>
              <MenuItem value="credits_desc">Highest credits</MenuItem>
              <MenuItem value="credits_asc">Lowest credits</MenuItem>
              <MenuItem value="name">Name (A–Z)</MenuItem>
            </Select>
          </FormControl>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              type="submit"
              variant="contained"
              size="small"
              sx={{
                bgcolor: tokens.ink,
                color: '#fff',
                minHeight: 40,
                px: 2,
                fontWeight: 600,
                borderRadius: '8px',
                '&:hover': { bgcolor: tokens.inkDark },
              }}
            >
              Search
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleResetFilters}
                startIcon={<RotateCcw size={15} />}
                sx={{
                  minHeight: 40,
                  px: 1.5,
                  color: tokens.muted,
                  borderColor: tokens.rule,
                  '&:hover': { borderColor: tokens.muted },
                }}
              >
                Reset
              </Button>
            )}
          </Box>
        </Box>
      </Panel>

      {/* Student Directory Table Panel */}
      <Panel>
        <PanelHeader
          title="Student directory"
          description={
            total > 0
              ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${fmt(total)} registered students`
              : 'Registered student accounts'
          }
          action={
            <IconButton
              onClick={fetchStudents}
              disabled={loading}
              aria-label="Refresh student list"
              sx={{ minWidth: 40, minHeight: 40 }}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </IconButton>
          }
        />

        {error && (
          <Box sx={{ p: 3 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={fetchStudents}>
                  Try again
                </Button>
              }
              sx={{ borderRadius: '8px' }}
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* Loading state */}
        {loading && (
          <Box sx={{ p: 2.5, display: 'grid', gap: 1.5 }}>
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
          </Box>
        )}

        {/* Empty state */}
        {!loading && !error && students.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Users size={44} color={tokens.muted} style={{ margin: '0 auto 16px' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              No students found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {hasActiveFilters
                ? 'No students matched the active search and filter criteria.'
                : 'There are no registered students yet.'}
            </Typography>
            {hasActiveFilters && (
              <Button variant="outlined" size="small" onClick={handleResetFilters}>
                Clear filters
              </Button>
            )}
          </Box>
        )}

        {/* Desktop Table */}
        {!loading && !error && students.length > 0 && (
          <>
            <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: '#F6EFE3' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                      Student
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                      Board &amp; Class
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                      Plan
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                      Credits
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                      Last active
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const isPrem =
                      student.isPremium ||
                      student.billing?.state === 'active' ||
                      Boolean(student.billing?.tier && student.billing.tier !== 'free');
                    const balance = student.credits?.balance ?? 0;

                    return (
                      <TableRow
                        key={student._id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: tokens.inkTint },
                        }}
                        onClick={() => setDrawerStudentId(student._id)}
                      >
                        {/* Student Name & Email */}
                        <TableCell sx={{ py: 1.75 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: 14.5, color: tokens.text }}>
                              {student.name || 'Unnamed student'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: tokens.muted, fontSize: 13 }}>
                              {student.email}
                              {student.phone ? ` • ${student.phone}` : ''}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Board & Class */}
                        <TableCell sx={{ py: 1.75 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                            {student.board || 'BSEB'} • Class {student.studentClass || '10'}
                          </Typography>
                          {student.studentStream && (
                            <Typography variant="caption" sx={{ color: tokens.muted }}>
                              {student.studentStream}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Plan */}
                        <TableCell sx={{ py: 1.75 }}>
                          <Chip
                            label={isPrem ? 'Premium' : 'Free'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor: isPrem ? tokens.inkTint : tokens.paper,
                              color: isPrem ? tokens.ink : tokens.muted,
                              borderColor: isPrem ? tokens.ink : tokens.rule,
                              borderWidth: 1,
                              borderStyle: 'solid',
                            }}
                          />
                        </TableCell>

                        {/* Credits */}
                        <TableCell sx={{ py: 1.75 }}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                            <Coins size={16} color={tokens.amber} />
                            <Typography sx={{ fontWeight: 600, fontSize: 14.5 }}>
                              {balance}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>
                            Earned: {student.credits?.lifetimeEarned ?? 0}
                          </Typography>
                        </TableCell>

                        {/* Last active */}
                        <TableCell sx={{ py: 1.75 }}>
                          <Typography sx={{ fontSize: 13.5 }}>
                            {formatTimeAgo(student.lastActivityDate)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: tokens.muted }}>
                            Joined {formatDate(student.createdAt)}
                          </Typography>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ py: 1.75 }} onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setDrawerStudentId(student._id)}
                              startIcon={<Eye size={14} />}
                              sx={{
                                minHeight: 36,
                                color: tokens.ink,
                                borderColor: tokens.rule,
                                textTransform: 'none',
                                fontWeight: 500,
                                '&:hover': {
                                  bgcolor: tokens.inkTint,
                                  borderColor: tokens.ink,
                                },
                              }}
                            >
                              360° Profile
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => setGrantDialogStudent(student)}
                              startIcon={<PlusCircle size={14} />}
                              sx={{
                                minHeight: 36,
                                bgcolor: tokens.ink,
                                color: '#fff',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { bgcolor: tokens.inkDark },
                              }}
                            >
                              Grant
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            {/* Mobile View: Cards */}
            <Box
              sx={{
                display: { xs: 'grid', md: 'none' },
                gap: 1.5,
                p: 2,
              }}
            >
              {students.map((student) => {
                const isPrem =
                  student.isPremium ||
                  student.billing?.state === 'active' ||
                  Boolean(student.billing?.tier && student.billing.tier !== 'free');
                const balance = student.credits?.balance ?? 0;

                return (
                  <Box
                    key={student._id}
                    onClick={() => setDrawerStudentId(student._id)}
                    sx={{
                      p: 2,
                      borderRadius: '10px',
                      bgcolor: tokens.sheet,
                      border: `1px solid ${tokens.rule}`,
                      display: 'grid',
                      gap: 1.5,
                      cursor: 'pointer',
                      '&:active': { bgcolor: tokens.inkTint },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: 16 }}>
                          {student.name || 'Unnamed student'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, wordBreak: 'break-all' }}>
                          {student.email}
                        </Typography>
                        {student.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {student.phone}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={isPrem ? 'Premium' : 'Free'}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: isPrem ? tokens.inkTint : tokens.paper,
                          color: isPrem ? tokens.ink : tokens.muted,
                          borderColor: isPrem ? tokens.ink : tokens.rule,
                          borderWidth: 1,
                          borderStyle: 'solid',
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderTop: `1px solid ${tokens.rule}`,
                        borderBottom: `1px solid ${tokens.rule}`,
                        fontSize: 13.5,
                      }}
                    >
                      <Typography sx={{ color: tokens.muted }}>
                        {student.board || 'BSEB'} • Class {student.studentClass || '10'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Coins size={16} color={tokens.amber} />
                        <Typography sx={{ fontWeight: 700, color: tokens.ink }}>
                          {balance} credits
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1.25,
                        pt: 0.5,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outlined"
                        fullWidth
                        size="medium"
                        onClick={() => setDrawerStudentId(student._id)}
                        startIcon={<Eye size={16} />}
                        sx={{
                          minHeight: 44,
                          color: tokens.ink,
                          borderColor: tokens.rule,
                          fontWeight: 500,
                        }}
                      >
                        360° Profile
                      </Button>
                      <Button
                        variant="contained"
                        fullWidth
                        size="medium"
                        onClick={() => setGrantDialogStudent(student)}
                        startIcon={<PlusCircle size={16} />}
                        sx={{
                          minHeight: 44,
                          bgcolor: tokens.ink,
                          color: '#fff',
                          fontWeight: 600,
                          '&:hover': { bgcolor: tokens.inkDark },
                        }}
                      >
                        Grant
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Pagination Controls */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2,
                borderTop: `1px solid ${tokens.rule}`,
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Rows per page:
                </Typography>
                <Select
                  size="small"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  sx={{ height: 36, minWidth: 70 }}
                >
                  <MenuItem value={15}>15</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </Box>

              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
                shape="rounded"
                size="medium"
                sx={{
                  '& .Mui-selected': {
                    bgcolor: `${tokens.ink} !important`,
                    color: '#fff',
                  },
                }}
              />
            </Box>
          </>
        )}
      </Panel>

      {/* 360° Student Detail Drawer */}
      <StudentDrawer
        open={Boolean(drawerStudentId)}
        studentId={drawerStudentId}
        onClose={() => setDrawerStudentId(null)}
        onOpenGrantCredits={(student) => setGrantDialogStudent(student)}
        refreshKey={refreshKey}
      />

      {/* Grant Credits Modal Dialog */}
      <GrantCreditsDialog
        open={Boolean(grantDialogStudent)}
        student={grantDialogStudent}
        onClose={() => setGrantDialogStudent(null)}
        onSuccess={handleCreditGrantSuccess}
      />
    </Box>
  );
}
