// src/pages/LiveQuizzes.jsx
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Activity,
  ArrowUpDown,
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Flame,
  HelpCircle,
  Play,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Panel, PanelHeader } from '@/components/Panel';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';
import { CreateLiveQuizDrawer } from './livequizzes/CreateLiveQuizDrawer';
import { LiveQuizDetailDrawer } from './livequizzes/LiveQuizDetailDrawer';
import { NotifyLiveDialog } from './livequizzes/NotifyLiveDialog';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const formatDateTime = (iso) => {
  if (!iso) return '–';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '–';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function LiveQuizzes() {
  const [mainTab, setMainTab] = useState(0);

  // Quizzes list state
  const [quizzes, setQuizzes] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [boardFilter, setBoardFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Auto-status state
  const [autoStatus, setAutoStatus] = useState(null);
  const [loadingAutoStatus, setLoadingAutoStatus] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [runningAuto, setRunningAuto] = useState(false);

  // Modals & Drawers
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [detailQuizId, setDetailQuizId] = useState(null);
  const [notifyQuiz, setNotifyQuiz] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch live quizzes
  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (boardFilter !== 'all') params.set('board', boardFilter);
      if (classFilter !== 'all') params.set('studentClass', classFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (appliedSearch.trim()) params.set('search', appliedSearch.trim());

      const res = await fetch(`${API_BASE_URL}/live-quiz/admin/list?${params.toString()}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load live quizzes.');
      }

      setQuizzes(data.quizzes || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('[LiveQuizzes] fetch error:', err);
      setError(err.message || 'Could not load live quizzes.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, boardFilter, classFilter, typeFilter, appliedSearch, refreshKey]);

  // Fetch auto-quiz status
  const fetchAutoStatus = useCallback(async () => {
    try {
      setLoadingAutoStatus(true);
      const res = await fetch(`${API_BASE_URL}/live-quiz/admin/auto-status`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAutoStatus(data);
      }
    } catch (err) {
      console.error('[LiveQuizzes] auto status error:', err);
    } finally {
      setLoadingAutoStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  useEffect(() => {
    fetchAutoStatus();
  }, [fetchAutoStatus]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setPage(1);
    setAppliedSearch(search);
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setBoardFilter('all');
    setClassFilter('all');
    setTypeFilter('all');
    setSearch('');
    setAppliedSearch('');
    setPage(1);
  };

  const handleRunAutoQuiz = async () => {
    try {
      setRunningAuto(true);
      const res = await fetch(`${API_BASE_URL}/live-quiz/auto/run`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to trigger auto live quiz.');
      }

      if (dryRun) {
        toast.info(
          `Dry run complete: ${data.data?.length || 0} audience targets evaluated.`
        );
      } else {
        toast.success(
          `Daily live quiz generator executed! ${data.data?.filter((d) => d.status === 'created').length || 0} new quizzes created.`
        );
        fetchAutoStatus();
        fetchQuizzes();
      }
    } catch (err) {
      console.error('[LiveQuizzes] run auto quiz error:', err);
      toast.error(err.message || 'Auto quiz execution failed.');
    } finally {
      setRunningAuto(false);
    }
  };

  // Metrics calculation
  const liveCount = quizzes.filter((q) => q.computedStatus === 'live').length;
  const upcomingCount = quizzes.filter((q) => q.computedStatus === 'upcoming').length;
  const totalParticipantsSum = quizzes.reduce((acc, q) => acc + (q.participantCount || 0), 0);

  return (
    <Box sx={{ display: 'grid', gap: 3.5, pb: 6 }}>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: tokens.text }}>
              Live quizzes
            </Typography>
            {liveCount > 0 && (
              <Chip
                label={`${liveCount} LIVE NOW`}
                size="small"
                sx={{
                  bgcolor: tokens.greenTint,
                  color: tokens.green,
                  fontWeight: 700,
                  fontSize: 12,
                  animation: 'pulse 2s infinite',
                }}
              />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Schedule competitive time-windowed quizzes, control daily auto-quizzes, and track participant leaderboards.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={() => setCreateDrawerOpen(true)}
            startIcon={<Plus size={18} />}
            sx={{
              minHeight: 42,
              px: 2.5,
              bgcolor: tokens.ink,
              fontWeight: 600,
              borderRadius: '8px',
              '&:hover': { bgcolor: tokens.inkDark },
            }}
          >
            Schedule live quiz
          </Button>
        </Box>
      </Box>

      {/* Top Metrics Strip */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' },
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
              bgcolor: liveCount > 0 ? tokens.greenTint : tokens.paper,
              color: liveCount > 0 ? tokens.green : tokens.muted,
            }}
          >
            <Radio size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Live right now
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {liveCount} {liveCount === 1 ? 'quiz' : 'quizzes'}
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
            }}
          >
            <Clock size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Upcoming scheduled
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {upcomingCount}
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
              bgcolor: tokens.inkTint,
              color: tokens.ink,
            }}
          >
            <Users size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Live participants
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {fmt(totalParticipantsSum)}
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
            <Sparkles size={22} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Today's auto subject
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }} noWrap>
              {autoStatus?.today?.subject || 'Class 12'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Tabs: Quizzes Directory vs Auto-Quiz Engine */}
      <Box sx={{ borderBottom: `1px solid ${tokens.rule}` }}>
        <Tabs
          value={mainTab}
          onChange={(_, v) => setMainTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: 15,
              minHeight: 46,
              px: 2,
            },
            '& .Mui-selected': {
              fontWeight: 600,
              color: tokens.ink,
            },
          }}
        >
          <Tab label={`All Live Quizzes (${total})`} />
          <Tab label="Daily Auto-Quiz Engine" />
        </Tabs>
      </Box>

      {/* TAB 0: QUIZZES DIRECTORY */}
      {mainTab === 0 && (
        <Box sx={{ display: 'grid', gap: 3 }}>
          {/* Filters Panel */}
          <Panel sx={{ p: 2.5 }}>
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                  md: '2fr 1fr 1fr 1fr auto',
                },
                gap: 1.5,
                alignItems: 'center',
              }}
            >
              {/* Search text */}
              <TextField
                size="small"
                placeholder="Search quiz title, test code..."
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
                        onClick={() => {
                          setSearch('');
                          setAppliedSearch('');
                          setPage(1);
                        }}
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

              {/* Status */}
              <FormControl size="small" fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="live">● Live right now</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="ended">Completed / Ended</MenuItem>
                </Select>
              </FormControl>

              {/* Board */}
              <FormControl size="small" fullWidth>
                <InputLabel id="board-flt-label">Board</InputLabel>
                <Select
                  labelId="board-flt-label"
                  value={boardFilter}
                  label="Board"
                  onChange={(e) => {
                    setBoardFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="all">All boards</MenuItem>
                  <MenuItem value="BSEB">BSEB</MenuItem>
                  <MenuItem value="CBSE">CBSE</MenuItem>
                </Select>
              </FormControl>

              {/* Type */}
              <FormControl size="small" fullWidth>
                <InputLabel id="type-flt-label">Type</InputLabel>
                <Select
                  labelId="type-flt-label"
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="all">All types</MenuItem>
                  <MenuItem value="auto">Daily Auto-Quiz</MenuItem>
                  <MenuItem value="manual">Manual Quiz</MenuItem>
                </Select>
              </FormControl>

              {/* Action Buttons */}
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
                    '&:hover': { bgcolor: tokens.inkDark },
                  }}
                >
                  Filter
                </Button>
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
                  }}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </Panel>

          {/* Quizzes Table Panel */}
          <Panel>
            <PanelHeader
              title="Scheduled live quizzes"
              description={
                total > 0
                  ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${fmt(total)} live quizzes`
                  : 'Live quizzes overview'
              }
              action={
                <IconButton
                  onClick={fetchQuizzes}
                  disabled={loading}
                  aria-label="Refresh live quizzes"
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
                    <Button color="inherit" size="small" onClick={fetchQuizzes}>
                      Try again
                    </Button>
                  }
                  sx={{ borderRadius: '8px' }}
                >
                  {error}
                </Alert>
              </Box>
            )}

            {loading && (
              <Box sx={{ p: 2.5, display: 'grid', gap: 1.5 }}>
                <Skeleton variant="rounded" height={48} />
                <Skeleton variant="rounded" height={48} />
                <Skeleton variant="rounded" height={48} />
                <Skeleton variant="rounded" height={48} />
              </Box>
            )}

            {!loading && !error && quizzes.length === 0 && (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Radio size={44} color={tokens.muted} style={{ margin: '0 auto 16px' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  No live quizzes found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                  No quizzes match your filter criteria.
                </Typography>
                <Button variant="outlined" size="small" onClick={handleResetFilters}>
                  Clear filters
                </Button>
              </Box>
            )}

            {!loading && !error && quizzes.length > 0 && (
              <>
                {/* Desktop Table View */}
                <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
                  <Table size="medium">
                    <TableHead sx={{ bgcolor: '#F6EFE3' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                          Quiz &amp; Code
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                          Audience
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                          Schedule Window
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                          Status
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                          Participants
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                          Push notification
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: tokens.muted, fontSize: 13 }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {quizzes.map((quiz) => {
                        const isLive = quiz.computedStatus === 'live';
                        const isUpcoming = quiz.computedStatus === 'upcoming';

                        return (
                          <TableRow
                            key={quiz.id}
                            hover
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { bgcolor: tokens.inkTint },
                            }}
                            onClick={() => setDetailQuizId(quiz.id)}
                          >
                            {/* Title & Code */}
                            <TableCell sx={{ py: 1.75 }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{ fontWeight: 600, fontSize: 14.5, color: tokens.text }}>
                                    {quiz.title}
                                  </Typography>
                                  {quiz.autoGenerated && (
                                    <Chip
                                      label="Daily Auto"
                                      size="small"
                                      sx={{
                                        fontSize: 11,
                                        height: 20,
                                        bgcolor: tokens.accentTint,
                                        color: tokens.amber,
                                        fontWeight: 600,
                                      }}
                                    />
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                                  <Chip
                                    label={quiz.testCode || 'NO CODE'}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      fontFamily: 'monospace',
                                      fontSize: 11,
                                      height: 20,
                                      borderColor: tokens.rule,
                                      color: tokens.ink,
                                      fontWeight: 600,
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ color: tokens.muted }}>
                                    {quiz.totalQuestions} questions • {quiz.totalMarks} marks
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>

                            {/* Audience */}
                            <TableCell sx={{ py: 1.75 }}>
                              <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                                {quiz.board} • Class {quiz.studentClass}
                              </Typography>
                              {quiz.stream && (
                                <Typography variant="caption" sx={{ color: tokens.muted }}>
                                  {quiz.stream}
                                </Typography>
                              )}
                            </TableCell>

                            {/* Window */}
                            <TableCell sx={{ py: 1.75 }}>
                              <Typography sx={{ fontSize: 13.5 }}>
                                {formatDateTime(quiz.windowStartTime)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: tokens.muted }}>
                                to {formatDateTime(quiz.windowEndTime)}
                              </Typography>
                            </TableCell>

                            {/* Status */}
                            <TableCell sx={{ py: 1.75 }}>
                              <Chip
                                label={
                                  isLive ? '● Live now' : isUpcoming ? 'Upcoming' : 'Completed'
                                }
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  bgcolor: isLive ? tokens.greenTint : isUpcoming ? tokens.amberTint : tokens.paper,
                                  color: isLive ? tokens.green : isUpcoming ? tokens.amber : tokens.muted,
                                  borderColor: isLive ? tokens.green : isUpcoming ? tokens.amber : tokens.rule,
                                  borderWidth: 1,
                                  borderStyle: 'solid',
                                }}
                              />
                            </TableCell>

                            {/* Participants */}
                            <TableCell sx={{ py: 1.75 }}>
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                                <Users size={16} color={tokens.muted} />
                                <Typography sx={{ fontWeight: 600, fontSize: 14.5 }}>
                                  {quiz.participantCount}
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* Push notification */}
                            <TableCell sx={{ py: 1.75 }}>
                              {quiz.liveNotificationSent ? (
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: tokens.green }}>
                                  <CheckCircle2 size={15} />
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.green }}>
                                    Broadcast sent
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: tokens.muted }}>
                                  Not dispatched
                                </Typography>
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell align="right" sx={{ py: 1.75 }} onClick={(e) => e.stopPropagation()}>
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => setDetailQuizId(quiz.id)}
                                  startIcon={<Trophy size={14} />}
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
                                  Leaderboard
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => setNotifyQuiz(quiz)}
                                  startIcon={<Send size={14} />}
                                  sx={{
                                    minHeight: 36,
                                    bgcolor: isLive ? tokens.green : tokens.ink,
                                    color: '#fff',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': {
                                      bgcolor: isLive ? '#15613C' : tokens.inkDark,
                                    },
                                  }}
                                >
                                  Broadcast
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
                <Box sx={{ display: { xs: 'grid', md: 'none' }, gap: 1.5, p: 2 }}>
                  {quizzes.map((quiz) => {
                    const isLive = quiz.computedStatus === 'live';
                    const isUpcoming = quiz.computedStatus === 'upcoming';

                    return (
                      <Box
                        key={quiz.id}
                        onClick={() => setDetailQuizId(quiz.id)}
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
                              {quiz.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Code: <strong>{quiz.testCode}</strong> • {quiz.board} Class {quiz.studentClass}
                            </Typography>
                          </Box>
                          <Chip
                            label={isLive ? '● Live now' : isUpcoming ? 'Upcoming' : 'Completed'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor: isLive ? tokens.greenTint : isUpcoming ? tokens.amberTint : tokens.paper,
                              color: isLive ? tokens.green : isUpcoming ? tokens.amber : tokens.muted,
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderTop: `1px solid ${tokens.rule}`, borderBottom: `1px solid ${tokens.rule}`, fontSize: 13 }}>
                          <Typography sx={{ color: tokens.muted }}>
                            Window: {formatDateTime(quiz.windowStartTime)}
                          </Typography>
                          <Typography sx={{ fontWeight: 700, color: tokens.ink }}>
                            {quiz.participantCount} participants
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.25, pt: 0.5 }} onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outlined"
                            fullWidth
                            size="medium"
                            onClick={() => setDetailQuizId(quiz.id)}
                            startIcon={<Trophy size={16} />}
                            sx={{ minHeight: 44, color: tokens.ink, borderColor: tokens.rule, fontWeight: 500 }}
                          >
                            Leaderboard
                          </Button>
                          <Button
                            variant="contained"
                            fullWidth
                            size="medium"
                            onClick={() => setNotifyQuiz(quiz)}
                            startIcon={<Send size={16} />}
                            sx={{ minHeight: 44, bgcolor: tokens.ink, color: '#fff', fontWeight: 600 }}
                          >
                            Broadcast
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                {/* Pagination */}
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
                  <Typography variant="body2" color="text.secondary">
                    Page {page} of {totalPages}
                  </Typography>

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
        </Box>
      )}

      {/* TAB 1: DAILY AUTO-QUIZ ENGINE */}
      {mainTab === 1 && (
        <Box sx={{ display: 'grid', gap: 3 }}>
          {/* Engine Header Panel */}
          <Panel sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ maxWidth: 640 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Sparkles size={20} color={tokens.ink} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Automated daily competitive challenge
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                  Every day from <strong>19:00 to 22:00 IST</strong>, PrepOne automatically generates and hosts a 50-question competitive live challenge for Class 12 Science students (BSEB and CBSE). Questions are freshly drawn in a 30/50/20 difficulty split with a 60-day repeat prevention window.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dryRun}
                        onChange={(e) => setDryRun(e.target.checked)}
                        disabled={runningAuto}
                      />
                    }
                    label="Dry run (preview without saving)"
                  />
                  <Button
                    variant="contained"
                    onClick={handleRunAutoQuiz}
                    disabled={runningAuto}
                    startIcon={runningAuto ? <CircularProgress size={16} color="inherit" /> : <Play size={16} />}
                    sx={{
                      minHeight: 42,
                      px: 2.5,
                      bgcolor: dryRun ? tokens.amber : tokens.ink,
                      color: '#fff',
                      fontWeight: 600,
                      borderRadius: '8px',
                      '&:hover': { bgcolor: dryRun ? '#8A5807' : tokens.inkDark },
                    }}
                  >
                    {runningAuto ? 'Running...' : dryRun ? 'Run preview now' : 'Run generator now'}
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  The automated cron normally executes this daily in the background.
                </Typography>
              </Box>
            </Box>
          </Panel>

          {/* Weekly Schedule Plan Matrix */}
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tokens.ink }}>
              Weekly subject rotation plan
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(7, 1fr)' }, gap: 1.5 }}>
              {[
                { day: 'Monday', subject: 'Physics' },
                { day: 'Tuesday', subject: 'Chemistry' },
                { day: 'Wednesday', subject: 'Maths' },
                { day: 'Thursday', subject: 'Biology' },
                { day: 'Friday', subject: 'Hindi' },
                { day: 'Saturday', subject: 'English' },
                { day: 'Sunday', subject: 'Maths' },
              ].map((item) => {
                const isToday =
                  autoStatus?.today?.subject?.toLowerCase() === item.subject.toLowerCase() &&
                  new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(new Date()) === item.day;

                return (
                  <Box
                    key={item.day}
                    sx={{
                      p: 2,
                      borderRadius: '10px',
                      bgcolor: isToday ? tokens.inkTint : tokens.sheet,
                      border: `1px solid ${isToday ? tokens.ink : tokens.rule}`,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: isToday ? tokens.ink : tokens.muted, fontWeight: isToday ? 700 : 500 }}>
                      {item.day}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.5, color: isToday ? tokens.ink : 'text.primary' }}>
                      {item.subject}
                    </Typography>
                    {isToday && (
                      <Chip
                        label="Today"
                        size="small"
                        sx={{ mt: 1, height: 18, fontSize: 10, bgcolor: tokens.ink, color: '#fff', fontWeight: 700 }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Next 7 Days Preview List */}
          {autoStatus?.next7Days && (
            <Panel>
              <PanelHeader
                title="Upcoming 7-day auto schedule"
                description="Status of automated daily quizzes across BSEB and CBSE Class 12 Science"
              />
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F6EFE3' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: tokens.muted }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.muted }}>Day</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.muted }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.muted }}>Target Window</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.muted }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {autoStatus.next7Days.map((item) => (
                    <TableRow key={item.date} hover>
                      <TableCell sx={{ py: 1.5, fontWeight: item.isToday ? 700 : 400 }}>
                        {item.date} {item.isToday && '(Today)'}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>{item.dayOfWeek}</TableCell>
                      <TableCell sx={{ py: 1.5, fontWeight: 600 }}>{item.subject}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>19:00 – 22:00 IST</TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        {item.generatedCount > 0 ? (
                          <Chip
                            label={`Generated (${item.generatedCount} tests)`}
                            size="small"
                            sx={{ fontWeight: 600, bgcolor: tokens.greenTint, color: tokens.green }}
                          />
                        ) : (
                          <Chip
                            label="Scheduled"
                            size="small"
                            variant="outlined"
                            sx={{ color: tokens.muted, borderColor: tokens.rule }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
          )}
        </Box>
      )}

      {/* Schedule Quiz Drawer */}
      <CreateLiveQuizDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={() => {
          fetchQuizzes();
          fetchAutoStatus();
        }}
      />

      {/* Quiz Detail & Leaderboard Drawer */}
      <LiveQuizDetailDrawer
        open={Boolean(detailQuizId)}
        quizId={detailQuizId}
        onClose={() => setDetailQuizId(null)}
        onOpenNotify={(q) => setNotifyQuiz(q)}
        refreshKey={refreshKey}
      />

      {/* Broadcast Notification Dialog */}
      <NotifyLiveDialog
        open={Boolean(notifyQuiz)}
        quiz={notifyQuiz}
        onClose={() => setNotifyQuiz(null)}
        onSuccess={() => {
          fetchQuizzes();
          setRefreshKey((k) => k + 1);
        }}
      />
    </Box>
  );
}
