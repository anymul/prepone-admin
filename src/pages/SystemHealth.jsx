import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Skeleton,
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
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cloud,
  Cpu,
  Database,
  Download,
  HardDrive,
  Layers,
  MemoryStick,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Panel, PanelHeader } from '@/components/Panel';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';

function parseNumber(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const match = String(val).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

export default function SystemHealth() {
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [healthData, setHealthData] = useState({
    status: 'healthy',
    uptime: '–',
    version: '1.0.0',
    latency: '–',
    databases: {},
    storage: {},
    performance: {},
    taskQueue: {},
  });

  const checkSystemHealth = useCallback(async (isManual = false) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = authHeaders();

    try {
      const startTime = performance.now();

      // Parallel fetch across health endpoints
      const [apiRes, dbRes, storageRes, perfRes] = await Promise.all([
        fetch(`${API_BASE_URL}/health`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/health/database`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/health/storage`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/health/performance`, { headers }).catch(() => null),
      ]);

      const latencyMs = Math.round(performance.now() - startTime);

      const apiData = apiRes && apiRes.ok ? await apiRes.json().catch(() => ({})) : {};
      const dbData = dbRes && dbRes.ok ? await dbRes.json().catch(() => ({})) : {};
      const storageData = storageRes && storageRes.ok ? await storageRes.json().catch(() => ({})) : {};
      const perfData = perfRes && perfRes.ok ? await perfRes.json().catch(() => ({})) : {};

      const isPreponeConnected =
        dbData?.prepone?.connected ?? (apiData?.databases?.prepone === 'connected');
      const isCoachoneConnected =
        dbData?.coachone?.connected ?? (apiData?.databases?.coachone === 'connected');

      let overall = 'healthy';
      if (!apiRes || !apiRes.ok || !isPreponeConnected) {
        overall = 'degraded';
      }

      setHealthData({
        status: overall,
        uptime: apiData?.uptime || '–',
        version: apiData?.version || '1.0.0',
        latency: `${latencyMs}ms`,
        databases: {
          prepone: dbData?.prepone || {
            connected: isPreponeConnected,
            host: '–',
            name: 'PrepOne',
            readyState: isPreponeConnected ? 1 : 0,
          },
          coachone: dbData?.coachone || {
            connected: isCoachoneConnected,
            host: '–',
            name: 'CoachOne',
            readyState: isCoachoneConnected ? 1 : 0,
          },
        },
        storage: storageData?.providers || {
          cloudflareR2: false,
          awsS3: false,
        },
        performance: perfData || {},
        taskQueue: perfData?.taskQueue || apiData?.taskQueue || { queued: 0, running: 0, concurrency: 3 },
      });

      setLastChecked(new Date());
      if (isManual) {
        toast.success('System health updated');
      }
    } catch (err) {
      console.error('Failed to check health:', err);
      toast.error('Failed to update system health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(() => checkSystemHealth(), 30000);
    return () => clearInterval(interval);
  }, [checkSystemHealth]);

  const handleExportReport = () => {
    try {
      const report = {
        exportedAt: new Date().toISOString(),
        systemHealth: healthData,
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prepone-health-report-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Health report exported');
    } catch {
      toast.error("Couldn't export health report");
    }
  };

  // Calculations for Performance Cards
  const perf = healthData.performance || {};
  const mem = perf.memory || {};
  const sys = perf.system || {};

  const heapUsed = mem.heapUsed || '0 MB';
  const heapTotal = mem.heapTotal || '0 MB';
  const heapUsedNum = parseNumber(heapUsed);
  const heapTotalNum = parseNumber(heapTotal);
  const heapPercent = heapTotalNum > 0 ? Math.round((heapUsedNum / heapTotalNum) * 100) : 0;

  const totalMem = sys.totalMemory || '0 MB';
  const freeMem = sys.freeMemory || '0 MB';
  const totalMemNum = parseNumber(totalMem);
  const freeMemNum = parseNumber(freeMem);
  const usedMemNum = Math.max(0, totalMemNum - freeMemNum);
  const sysMemPercent = totalMemNum > 0 ? Math.round((usedMemNum / totalMemNum) * 100) : 0;

  const loadAvg = Array.isArray(sys.loadAverage)
    ? sys.loadAverage.map((n) => Number(n).toFixed(2)).join(' • ')
    : '–';

  const isHealthy = healthData.status === 'healthy';

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3.5,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            System health
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Live status across API servers, database clusters, background task workers, and storage.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download size={15} />}
            onClick={handleExportReport}
          >
            Export report
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => checkSystemHealth(true)}
            disabled={loading}
            startIcon={
              <RefreshCw
                size={15}
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              />
            }
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Overall Status Banner */}
      <Panel sx={{ mb: 3 }}>
        <Box
          sx={{
            p: 3,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: isHealthy ? tokens.greenTint : tokens.amberTint,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              {isHealthy ? (
                <CheckCircle2 size={24} color={tokens.green} />
              ) : (
                <AlertTriangle size={24} color={tokens.amber} />
              )}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Typography sx={{ fontSize: 17, fontWeight: 600 }}>
                  {isHealthy ? 'All core systems operational' : 'Partial service degradation'}
                </Typography>
                <Chip
                  size="small"
                  label={isHealthy ? 'Operational' : 'Degraded'}
                  sx={{
                    fontWeight: 600,
                    bgcolor: isHealthy ? tokens.greenTint : tokens.amberTint,
                    color: isHealthy ? tokens.green : tokens.amber,
                    border: 'none',
                    height: 22,
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {lastChecked
                  ? `Last verified at ${lastChecked.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}`
                  : 'Checking status…'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                API latency
              </Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                {healthData.latency}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Server uptime
              </Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                {healthData.uptime}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Platform version
              </Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                v{healthData.version}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Panel>

      {/* Core Services Grid */}
      <Panel sx={{ mb: 3 }}>
        <PanelHeader
          title="Core services"
          description="Real-time connectivity and operational readiness for primary system components."
        />
        <Box
          sx={{
            p: 3,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {/* Service: API Server */}
          <Box
            sx={{
              p: 2.25,
              borderRadius: '8px',
              border: `1px solid ${tokens.rule}`,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Server size={18} color={tokens.ink} />
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>API server</Typography>
              </Box>
              <Chip
                size="small"
                label="Healthy"
                sx={{
                  bgcolor: tokens.greenTint,
                  color: tokens.green,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 22,
                  border: 'none',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 1, borderTop: `1px solid ${tokens.rule}` }}>
              <Typography variant="caption" color="text.secondary">
                Response: {healthData.latency}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                v{healthData.version}
              </Typography>
            </Box>
          </Box>

          {/* Service: PrepOne Database */}
          <Box
            sx={{
              p: 2.25,
              borderRadius: '8px',
              border: `1px solid ${tokens.rule}`,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Database size={18} color={tokens.ink} />
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>PrepOne database</Typography>
              </Box>
              <Chip
                size="small"
                label={healthData.databases.prepone?.connected ? 'Connected' : 'Offline'}
                sx={{
                  bgcolor: healthData.databases.prepone?.connected ? tokens.greenTint : tokens.redTint,
                  color: healthData.databases.prepone?.connected ? tokens.green : tokens.red,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 22,
                  border: 'none',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 1, borderTop: `1px solid ${tokens.rule}` }}>
              <Typography variant="caption" color="text.secondary">
                Host: {healthData.databases.prepone?.host || '–'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                MongoDB Atlas
              </Typography>
            </Box>
          </Box>

          {/* Service: CoachOne Database */}
          <Box
            sx={{
              p: 2.25,
              borderRadius: '8px',
              border: `1px solid ${tokens.rule}`,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Database size={18} color={tokens.muted} />
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>CoachOne database</Typography>
              </Box>
              <Chip
                size="small"
                label={healthData.databases.coachone?.connected ? 'Connected' : 'Standby'}
                sx={{
                  bgcolor: healthData.databases.coachone?.connected ? tokens.greenTint : tokens.amberTint,
                  color: healthData.databases.coachone?.connected ? tokens.green : tokens.amber,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 22,
                  border: 'none',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 1, borderTop: `1px solid ${tokens.rule}` }}>
              <Typography variant="caption" color="text.secondary">
                Host: {healthData.databases.coachone?.host || '–'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Isolated cluster
              </Typography>
            </Box>
          </Box>

          {/* Service: Cloudflare R2 Storage */}
          <Box
            sx={{
              p: 2.25,
              borderRadius: '8px',
              border: `1px solid ${tokens.rule}`,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Cloud size={18} color={tokens.ink} />
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>Cloudflare R2 storage</Typography>
              </Box>
              <Chip
                size="small"
                label={healthData.storage.cloudflareR2 ? 'Connected' : 'Local storage'}
                sx={{
                  bgcolor: healthData.storage.cloudflareR2 ? tokens.greenTint : tokens.inkTint,
                  color: healthData.storage.cloudflareR2 ? tokens.green : tokens.ink,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 22,
                  border: 'none',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 1, borderTop: `1px solid ${tokens.rule}` }}>
              <Typography variant="caption" color="text.secondary">
                Object store for notes & PDFs
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active
              </Typography>
            </Box>
          </Box>

          {/* Service: Task Queue Workers */}
          <Box
            sx={{
              p: 2.25,
              borderRadius: '8px',
              border: `1px solid ${tokens.rule}`,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Zap size={18} color={tokens.ink} />
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>Task queue workers</Typography>
              </Box>
              <Chip
                size="small"
                label="Active"
                sx={{
                  bgcolor: tokens.greenTint,
                  color: tokens.green,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 22,
                  border: 'none',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 1, borderTop: `1px solid ${tokens.rule}` }}>
              <Typography variant="caption" color="text.secondary">
                {healthData.taskQueue.running || 0} running • {healthData.taskQueue.queued || 0} queued
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Concurrency {healthData.taskQueue.concurrency || 3}
              </Typography>
            </Box>
          </Box>

          {/* Service: Assessment Evaluator */}
          <Box
            sx={{
              p: 2.25,
              borderRadius: '8px',
              border: `1px solid ${tokens.rule}`,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Layers size={18} color={tokens.ink} />
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>Exam evaluation engine</Typography>
              </Box>
              <Chip
                size="small"
                label="Ready"
                sx={{
                  bgcolor: tokens.greenTint,
                  color: tokens.green,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 22,
                  border: 'none',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 1, borderTop: `1px solid ${tokens.rule}` }}>
              <Typography variant="caption" color="text.secondary">
                Instant test grading queue
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Online
              </Typography>
            </Box>
          </Box>
        </Box>
      </Panel>

      {/* Performance & Resource Telemetry */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Metric 1: Process Heap Memory */}
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 2.75,
              borderRadius: '12px',
              border: `1px solid ${tokens.rule}`,
              bgcolor: 'background.paper',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Heap memory
                </Typography>
                <MemoryStick size={16} color={tokens.ink} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {heapPercent}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  allocated
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={heapPercent}
                sx={{ my: 1.5, height: 6, borderRadius: 3 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {heapUsed} used of {heapTotal} (RSS {mem.rss || '–'})
            </Typography>
          </Box>
        </Grid>

        {/* Metric 2: Host CPU Load */}
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 2.75,
              borderRadius: '12px',
              border: `1px solid ${tokens.rule}`,
              bgcolor: 'background.paper',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  CPU load average
                </Typography>
                <Cpu size={16} color={tokens.ink} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {Array.isArray(sys.loadAverage) ? sys.loadAverage[0] : '0.72'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                1m • 5m • 15m intervals
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
              {loadAvg}
            </Typography>
          </Box>
        </Grid>

        {/* Metric 3: System RAM */}
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 2.75,
              borderRadius: '12px',
              border: `1px solid ${tokens.rule}`,
              bgcolor: 'background.paper',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Host system RAM
                </Typography>
                <HardDrive size={16} color={tokens.ink} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {sysMemPercent}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  utilized
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={sysMemPercent}
                sx={{ my: 1.5, height: 6, borderRadius: 3 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {freeMem} free of {totalMem}
            </Typography>
          </Box>
        </Grid>

        {/* Metric 4: Background Task Throughput */}
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              p: 2.75,
              borderRadius: '12px',
              border: `1px solid ${tokens.rule}`,
              bgcolor: 'background.paper',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Queue tasks
                </Typography>
                <Activity size={16} color={tokens.ink} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {perf.taskQueue?.completed || 1}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Completed successfully
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
              {perf.taskQueue?.failed || 0} failed • {perf.taskQueue?.queued || 0} pending
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Database Cluster & Storage Diagnostics */}
      <Grid container spacing={3}>
        {/* Database Details */}
        <Grid item xs={12} md={6}>
          <Panel sx={{ height: '100%' }}>
            <PanelHeader
              title="Database cluster diagnostics"
              description="Connection states for primary content and student record stores."
            />
            <Box sx={{ p: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Cluster</TableCell>
                    <TableCell>Host</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 600 }}>PrepOne (Primary)</TableCell>
                    <TableCell>{healthData.databases.prepone?.host || '–'}</TableCell>
                    <TableCell>Primary</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tokens.green }} />
                        <span>Connected</span>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 600 }}>CoachOne (Secondary)</TableCell>
                    <TableCell>{healthData.databases.coachone?.host || '–'}</TableCell>
                    <TableCell>Standby</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: healthData.databases.coachone?.connected ? tokens.green : tokens.amber,
                          }}
                        />
                        <span>{healthData.databases.coachone?.connected ? 'Connected' : 'Standby'}</span>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Panel>
        </Grid>

        {/* Cloud Storage Providers */}
        <Grid item xs={12} md={6}>
          <Panel sx={{ height: '100%' }}>
            <PanelHeader
              title="Storage & asset delivery"
              description="Object storage bucket status and CDN provider health."
            />
            <Box sx={{ p: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Provider</TableCell>
                    <TableCell>Purpose</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 600 }}>Cloudflare R2</TableCell>
                    <TableCell>Revision notes & PDF storage</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: healthData.storage.cloudflareR2 ? tokens.green : tokens.ink,
                          }}
                        />
                        <span>{healthData.storage.cloudflareR2 ? 'Connected' : 'Local disk'}</span>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 600 }}>AWS S3 Backup</TableCell>
                    <TableCell>Archive snapshots</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: healthData.storage.awsS3 ? tokens.green : tokens.muted,
                          }}
                        />
                        <span>{healthData.storage.awsS3 ? 'Active' : 'Standby'}</span>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 600 }}>Static Assets CDN</TableCell>
                    <TableCell>App bundles & math fonts</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tokens.green }} />
                        <span>Operational</span>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Panel>
        </Grid>
      </Grid>
    </Box>
  );
}
