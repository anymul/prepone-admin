// src/pages/ScheduledJobs.jsx
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  Layers,
  Play,
  RefreshCw,
  Server,
  Sparkles,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Panel, PanelHeader } from '@/components/Panel';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';

const CATEGORY_COLORS = {
  Engagement: { color: tokens.amber, bgcolor: tokens.amberTint },
  Retention: { color: tokens.ink, bgcolor: tokens.inkTint },
  Content: { color: '#0284C7', bgcolor: '#E0F2FE' },
  Maintenance: { color: tokens.green, bgcolor: tokens.greenTint },
  Billing: { color: '#7C3AED', bgcolor: '#EDE9FE' },
};

const formatDate = (iso) => {
  if (!iso) return 'Never run';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Never run';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export default function ScheduledJobs() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState([]);
  const [serverTime, setServerTime] = useState(null);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Running state
  const [runningJobId, setRunningJobId] = useState(null);

  // Result dialog
  const [resultDialog, setResultDialog] = useState(null);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/notifications/cron/status`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch scheduled jobs status');
      }

      setJobs(data.jobs || []);
      setStats(data.last24HoursStats || []);
      setServerTime(data.serverTime);
      setTimezone(data.timezone || 'Asia/Kolkata');
    } catch (err) {
      console.error('[ScheduledJobs] fetch error:', err);
      setError(err.message || 'Could not load scheduled jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Trigger job manually
  const handleRunJob = async (jobId, jobName) => {
    try {
      setRunningJobId(jobId);

      const res = await fetch(`${API_BASE_URL}/notifications/cron/run/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to run job ${jobName}`);
      }

      toast.success(`Job "${jobName}" executed successfully!`);
      setResultDialog({
        jobName,
        jobId,
        success: true,
        data: data.result,
        executedAt: data.runRecord?.executedAt || new Date().toISOString(),
      });

      fetchStatus();
    } catch (err) {
      console.error('Trigger job error:', err);
      toast.error(err.message || `Job "${jobName}" failed`);
      setResultDialog({
        jobName,
        jobId,
        success: false,
        error: err.message,
        executedAt: new Date().toISOString(),
      });
    } finally {
      setRunningJobId(null);
    }
  };

  const categories = ['all', ...Array.from(new Set(jobs.map((j) => j.category).filter(Boolean)))];

  const filteredJobs =
    selectedCategory === 'all' ? jobs : jobs.filter((j) => j.category === selectedCategory);

  const total24hDispatches = stats.reduce((acc, curr) => acc + (curr.count || 0), 0);

  return (
    <Box sx={{ display: 'grid', gap: 3.5, pb: 6 }}>
      {/* Header */}
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
            Scheduled jobs (cron)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Inspect background timers, monitor 24h execution activity, and trigger safety-valve manual runs.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={fetchStatus}
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
            Refresh status
          </Button>

          <Button
            variant="contained"
            onClick={() => handleRunJob('all', 'All Scheduled Jobs')}
            disabled={Boolean(runningJobId)}
            startIcon={
              runningJobId === 'all' ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Zap size={16} />
              )
            }
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
            {runningJobId === 'all' ? 'Running batch...' : 'Run all batch jobs'}
          </Button>
        </Box>
      </Box>

      {/* Metrics Strip */}
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
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: tokens.inkTint,
              color: tokens.ink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Registered cron jobs
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {jobs.length}
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
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: tokens.amberTint,
              color: tokens.amber,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Last 24h dispatches
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {total24hDispatches}
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
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: tokens.greenTint,
              color: tokens.green,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Timezone
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {timezone}
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
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Server size={22} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Server timestamp
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: tokens.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {serverTime ? formatDate(serverTime) : 'Syncing...'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Category Pills */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <Button
            key={cat}
            size="small"
            onClick={() => setSelectedCategory(cat)}
            sx={{
              minHeight: 34,
              px: 2,
              borderRadius: '20px',
              textTransform: 'capitalize',
              fontWeight: selectedCategory === cat ? 600 : 500,
              color: selectedCategory === cat ? tokens.ink : tokens.muted,
              bgcolor: selectedCategory === cat ? tokens.inkTint : tokens.sheet,
              border: `1px solid ${selectedCategory === cat ? tokens.ink : tokens.rule}`,
              '&:hover': { bgcolor: tokens.inkTint },
            }}
          >
            {cat === 'all' ? 'All categories' : cat}
          </Button>
        ))}
      </Box>

      {/* Jobs Panel */}
      <Panel>
        <PanelHeader
          title={`Scheduled Jobs (${filteredJobs.length})`}
          subtitle="All jobs run in timezone Asia/Kolkata automatically via node-cron"
        />

        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {loading ? (
          <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={32} sx={{ color: tokens.ink }} />
            <Typography variant="body2" color="text.secondary">
              Reading system cron schedule...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Desktop Table View */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead sx={{ bgcolor: '#F6EFE3' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Job name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Schedule</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Description &amp; target</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Last execution</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredJobs.map((job) => {
                    const catCfg = CATEGORY_COLORS[job.category] || CATEGORY_COLORS.Engagement;
                    const isRunning = runningJobId === job.id;

                    return (
                      <TableRow
                        key={job.id}
                        hover
                        sx={{
                          '&:hover': { bgcolor: 'rgba(63, 33, 112, 0.03)' },
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text }}>
                            {job.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={job.category}
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                color: catCfg.color,
                                bgcolor: catCfg.bgcolor,
                                border: `1px solid ${catCfg.color}30`,
                              }}
                            />
                            <Typography variant="caption" sx={{ color: tokens.muted, fontFamily: 'monospace' }}>
                              {job.id}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text }}>
                            {job.scheduleText}
                          </Typography>
                          <Typography variant="caption" sx={{ color: tokens.muted, fontFamily: 'monospace' }}>
                            {job.cronExpression}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ py: 2, maxWidth: 300 }}>
                          <Typography variant="body2" sx={{ color: tokens.text, fontSize: '0.85rem' }}>
                            {job.description}
                          </Typography>
                          <Typography variant="caption" sx={{ color: tokens.muted, display: 'block', mt: 0.5 }}>
                            Target: {job.target}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ py: 2 }}>
                          {job.lastRun ? (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: job.lastRun.success ? tokens.green : tokens.red,
                                  }}
                                />
                                <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.text }}>
                                  {job.lastRun.success ? 'Success' : 'Failed'}
                                </Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>
                                {formatDate(job.lastRun.executedAt)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: tokens.muted }}>
                              Waiting for schedule
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell align="right" sx={{ py: 2 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={isRunning}
                            onClick={() => handleRunJob(job.id, job.name)}
                            startIcon={
                              isRunning ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <Play size={14} />
                              )
                            }
                            sx={{
                              minHeight: 34,
                              borderColor: tokens.rule,
                              color: tokens.ink,
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              '&:hover': { borderColor: tokens.ink, bgcolor: tokens.inkTint },
                            }}
                          >
                            {isRunning ? 'Running...' : 'Run now'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            {/* Mobile Cards View */}
            <Box sx={{ display: { xs: 'grid', md: 'none' }, gap: 1.5, p: 2 }}>
              {filteredJobs.map((job) => {
                const catCfg = CATEGORY_COLORS[job.category] || CATEGORY_COLORS.Engagement;
                const isRunning = runningJobId === job.id;

                return (
                  <Box
                    key={job.id}
                    sx={{
                      p: 2,
                      borderRadius: '10px',
                      bgcolor: tokens.sheet,
                      border: `1px solid ${tokens.rule}`,
                      display: 'grid',
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.text }}>
                          {job.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: tokens.muted, fontFamily: 'monospace' }}>
                          {job.cronExpression}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={job.category}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: catCfg.color,
                          bgcolor: catCfg.bgcolor,
                          border: `1px solid ${catCfg.color}30`,
                        }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: tokens.text, fontSize: '0.85rem' }}>
                      {job.description}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: `1px solid ${tokens.rule}` }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>
                          {job.scheduleText}
                        </Typography>
                        {job.lastRun && (
                          <Typography variant="caption" sx={{ color: job.lastRun.success ? tokens.green : tokens.red, fontWeight: 500 }}>
                            Last run: {formatDate(job.lastRun.executedAt)}
                          </Typography>
                        )}
                      </Box>

                      <Button
                        size="small"
                        variant="outlined"
                        disabled={isRunning}
                        onClick={() => handleRunJob(job.id, job.name)}
                        startIcon={isRunning ? <CircularProgress size={14} color="inherit" /> : <Play size={14} />}
                        sx={{
                          minHeight: 44,
                          px: 2,
                          borderColor: tokens.rule,
                          color: tokens.ink,
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        {isRunning ? 'Running...' : 'Run now'}
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </Panel>

      {/* Execution Output Dialog */}
      <Dialog
        open={Boolean(resultDialog)}
        onClose={() => setResultDialog(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            bgcolor: tokens.paper,
            border: `1px solid ${tokens.rule}`,
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: tokens.sheet, borderBottom: `1px solid ${tokens.rule}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {resultDialog?.success ? (
              <CheckCircle2 size={20} color={tokens.green} />
            ) : (
              <AlertTriangle size={20} color={tokens.red} />
            )}
            <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.text }}>
              Execution Result: {resultDialog?.jobName}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, display: 'grid', gap: 2, mt: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Executed at {formatDate(resultDialog?.executedAt)}
            </Typography>
            <Chip
              size="small"
              label={resultDialog?.success ? 'Success' : 'Failed'}
              sx={{
                fontWeight: 600,
                color: resultDialog?.success ? tokens.green : tokens.red,
                bgcolor: resultDialog?.success ? tokens.greenTint : tokens.redTint,
              }}
            />
          </Box>

          {resultDialog?.error ? (
            <Alert severity="error">{resultDialog.error}</Alert>
          ) : (
            <Box
              component="pre"
              sx={{
                p: 2,
                borderRadius: '8px',
                bgcolor: tokens.sheet,
                border: `1px solid ${tokens.rule}`,
                color: tokens.text,
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                overflowX: 'auto',
                maxHeight: 280,
              }}
            >
              {JSON.stringify(resultDialog?.data, null, 2)}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: tokens.sheet, borderTop: `1px solid ${tokens.rule}` }}>
          <Button
            onClick={() => setResultDialog(null)}
            variant="contained"
            sx={{
              minHeight: 36,
              bgcolor: tokens.ink,
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.inkDark, boxShadow: 'none' },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
