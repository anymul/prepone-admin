import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  Button,
  Chip,
  Grid,
  Stack,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Zap,
  Clock,
  RotateCw,
  Send,
  Play,
  Pencil,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Flame,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { tokens } from '@/theme';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import NudgeEditorDrawer from './automatic-nudges/NudgeEditorDrawer';
import { Link } from 'react-router-dom';

const CATEGORIES = ['All', 'Retention', 'Habits', 'Competition', 'Events'];

export default function AutomaticNudges() {
  const [nudges, setNudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingNudge, setEditingNudge] = useState(null);
  const [triggeringId, setTriggeringId] = useState(null);
  const [testingId, setTestingId] = useState(null);

  const fetchNudges = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/notifications/admin/nudges');
      setNudges(res.nudges || []);
    } catch (err) {
      console.error('Error fetching automatic nudges:', err);
      toast.error(err.message || 'Failed to load automatic nudges');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNudges();
  }, []);

  // Master Toggle Switch handler
  const handleToggle = async (nudgeId, currentStatus) => {
    const newStatus = !currentStatus;
    // Optimistic update
    setNudges((prev) =>
      prev.map((n) => (n.nudgeId === nudgeId ? { ...n, enabled: newStatus } : n))
    );

    try {
      await api.patch(`/notifications/admin/nudges/${nudgeId}`, { enabled: newStatus });
      toast.success(
        newStatus
          ? `Enabled "${nudges.find((n) => n.nudgeId === nudgeId)?.name}"`
          : `Paused "${nudges.find((n) => n.nudgeId === nudgeId)?.name}"`
      );
    } catch (err) {
      // Rollback
      setNudges((prev) =>
        prev.map((n) => (n.nudgeId === nudgeId ? { ...n, enabled: currentStatus } : n))
      );
      toast.error('Failed to update nudge toggle: ' + err.message);
    }
  };

  // Immediate Test Send handler
  const handleTestSend = async (nudge) => {
    setTestingId(nudge.nudgeId);
    try {
      const res = await api.post(`/notifications/admin/nudges/${nudge.nudgeId}/test`);
      toast.success(`Test push dispatched for "${nudge.name}"`, {
        description: `Preview: "${res.preview?.title || nudge.activeTitle}"`,
      });
    } catch (err) {
      toast.error('Test push failed: ' + err.message);
    } finally {
      setTestingId(null);
    }
  };

  // Immediate Run Now handler
  const handleTriggerNow = async (nudge) => {
    setTriggeringId(nudge.nudgeId);
    try {
      const res = await api.post(`/notifications/admin/nudges/${nudge.nudgeId}/trigger`);
      toast.success(`Triggered "${nudge.name}" cron job`, {
        description: `Checked candidates / delivered successfully.`,
      });
      fetchNudges();
    } catch (err) {
      toast.error('Failed to execute nudge: ' + err.message);
    } finally {
      setTriggeringId(null);
    }
  };

  // Filtered nudges list
  const filteredNudges = useMemo(() => {
    if (selectedCategory === 'All') return nudges;
    return nudges.filter((n) => n.category === selectedCategory);
  }, [nudges, selectedCategory]);

  // Aggregate stats
  const aggregateMetrics = useMemo(() => {
    const total = nudges.length;
    const active = nudges.filter((n) => n.enabled).length;
    let total24h = 0;
    let total7d = 0;
    let totalFailed7d = 0;

    for (const n of nudges) {
      total24h += n.stats?.sent24h || 0;
      total7d += n.stats?.sent7d || 0;
      totalFailed7d += n.stats?.failed7d || 0;
    }

    const totalAttempts = total7d + totalFailed7d;
    const deliveryRate = totalAttempts > 0 ? Math.round((total7d / totalAttempts) * 100) : 100;

    return { total, active, total24h, total7d, deliveryRate };
  }, [nudges]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1240, mx: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: tokens.inkTint,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={20} color={tokens.ink} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.ink }}>
              Automatic nudges
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: tokens.muted, mt: 0.5, fontSize: 13.5 }}>
            Background student re-engagement crons, retention prompts, and streak notifications.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', alignSelf: { xs: 'stretch', sm: 'auto' } }}>
          <Button
            component={Link}
            to="/notifications"
            variant="outlined"
            size="small"
            endIcon={<ArrowUpRight size={14} />}
            sx={{
              borderColor: tokens.hairline,
              color: tokens.ink,
              bgcolor: tokens.sheet,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13,
              '&:hover': { bgcolor: tokens.inkTint, borderColor: tokens.ink },
            }}
          >
            Campaign broadcasts
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RotateCw size={14} className={refreshing ? 'animate-spin' : ''} />}
            onClick={() => fetchNudges(true)}
            sx={{
              borderColor: tokens.hairline,
              color: tokens.ink,
              bgcolor: tokens.sheet,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13,
              '&:hover': { bgcolor: tokens.inkTint, borderColor: tokens.ink },
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* KPI Cards Strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: tokens.sheet, border: `1px solid ${tokens.hairline}`, borderRadius: '10px' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, textTransform: 'uppercase' }}>
                Active nudges
              </Typography>
              <Typography variant="h6" sx={{ color: tokens.ink, fontWeight: 700, mt: 0.25 }}>
                {loading ? <Skeleton width={60} /> : `${aggregateMetrics.active} of ${aggregateMetrics.total}`}
              </Typography>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                Automatic background delivery
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: tokens.sheet, border: `1px solid ${tokens.hairline}`, borderRadius: '10px' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, textTransform: 'uppercase' }}>
                Sent last 24h
              </Typography>
              <Typography variant="h6" sx={{ color: tokens.ink, fontWeight: 700, mt: 0.25 }}>
                {loading ? <Skeleton width={60} /> : aggregateMetrics.total24h.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Students reached today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: tokens.sheet, border: `1px solid ${tokens.hairline}`, borderRadius: '10px' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, textTransform: 'uppercase' }}>
                Sent last 7 days
              </Typography>
              <Typography variant="h6" sx={{ color: tokens.ink, fontWeight: 700, mt: 0.25 }}>
                {loading ? <Skeleton width={60} /> : aggregateMetrics.total7d.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Weekly delivery volume
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: tokens.sheet, border: `1px solid ${tokens.hairline}`, borderRadius: '10px' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, textTransform: 'uppercase' }}>
                Delivery success
              </Typography>
              <Typography variant="h6" sx={{ color: tokens.ink, fontWeight: 700, mt: 0.25 }}>
                {loading ? <Skeleton width={60} /> : `${aggregateMetrics.deliveryRate}%`}
              </Typography>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                FCM push reliability
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Filter Pills */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2.5, overflowX: 'auto', pb: 0.5 }}>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            clickable
            onClick={() => setSelectedCategory(cat)}
            sx={{
              fontWeight: 600,
              fontSize: 13,
              bgcolor: selectedCategory === cat ? tokens.ink : tokens.sheet,
              color: selectedCategory === cat ? '#fff' : tokens.muted,
              border: `1px solid ${selectedCategory === cat ? tokens.ink : tokens.hairline}`,
              '&:hover': {
                bgcolor: selectedCategory === cat ? tokens.ink : tokens.inkTint,
              },
            }}
          />
        ))}
      </Box>

      {/* Nudge Cards Grid */}
      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius: '12px' }} />
          ))}
        </Stack>
      ) : filteredNudges.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: tokens.sheet, borderRadius: '12px', border: `1px solid ${tokens.hairline}` }}>
          <Typography variant="body1" sx={{ color: tokens.muted, fontWeight: 500 }}>
            No automatic nudges found in this category.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredNudges.map((nudge) => {
            const isCustomized = Boolean(nudge.customTitle || nudge.customBody);

            return (
              <Grid item xs={12} key={nudge.nudgeId}>
                <Card
                  sx={{
                    bgcolor: tokens.sheet,
                    border: `1px solid ${tokens.hairline}`,
                    borderRadius: '12px',
                    boxShadow: 'none',
                    transition: 'border-color 0.15s ease',
                    opacity: nudge.enabled ? 1 : 0.65,
                    '&:hover': { borderColor: tokens.ink },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    {/* Header Row */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 1.5,
                        mb: 1.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: tokens.ink, fontSize: 16 }}>
                          {nudge.name}
                        </Typography>

                        <Chip
                          label={nudge.category}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: 11.5,
                            bgcolor: tokens.inkTint,
                            color: tokens.ink,
                          }}
                        />

                        {isCustomized && (
                          <Chip
                            label="Custom copy"
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: 11,
                              bgcolor: '#FEF3C7',
                              color: '#92400E',
                            }}
                          />
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: tokens.muted, fontSize: 12.5 }}>
                          <Clock size={13} />
                          <span>{nudge.scheduleHuman}</span>
                        </Box>
                      </Box>

                      {/* ON/OFF Switch */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: nudge.enabled ? '#166534' : tokens.muted }}>
                          {nudge.enabled ? 'ACTIVE' : 'PAUSED'}
                        </Typography>
                        <Switch
                          checked={nudge.enabled}
                          onChange={() => handleToggle(nudge.nudgeId, nudge.enabled)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: tokens.ink,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              bgcolor: tokens.ink,
                            },
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Target Audience Description */}
                    <Typography variant="body2" sx={{ color: tokens.muted, fontSize: 13, mb: 1.75 }}>
                      <strong>Target:</strong> {nudge.targetAudience} — {nudge.description}
                    </Typography>

                    {/* Active Copy Preview Box */}
                    <Box
                      sx={{
                        p: 1.75,
                        borderRadius: '8px',
                        bgcolor: tokens.cream,
                        border: `1px solid ${tokens.hairline}`,
                        mb: 2,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: tokens.ink, fontSize: 13.5, mb: 0.5 }}>
                        {nudge.activeTitle}
                      </Typography>
                      <Typography variant="body2" sx={{ color: tokens.ink, fontSize: 13, lineHeight: 1.45 }}>
                        {nudge.activeBody}
                      </Typography>
                    </Box>

                    {/* Footer Row: Metrics & Action Buttons */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 1.5,
                        pt: 1,
                        borderTop: `1px solid ${tokens.hairline}`,
                      }}
                    >
                      {/* Delivery Stats */}
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: tokens.muted, fontSize: 12 }}>
                          24h: <strong style={{ color: tokens.ink }}>{nudge.stats?.sent24h || 0}</strong> sent
                        </Typography>
                        <Typography variant="caption" sx={{ color: tokens.muted, fontSize: 12 }}>
                          7d: <strong style={{ color: tokens.ink }}>{nudge.stats?.sent7d || 0}</strong> sent
                        </Typography>
                        {(nudge.stats?.failed7d || 0) > 0 && (
                          <Typography variant="caption" sx={{ color: '#DC2626', fontSize: 12, fontWeight: 600 }}>
                            {nudge.stats.failed7d} failures
                          </Typography>
                        )}
                        {nudge.stats?.lastDispatchedAt && (
                          <Typography variant="caption" sx={{ color: tokens.muted, fontSize: 11.5 }}>
                            Last sent: {new Date(nudge.stats.lastDispatchedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        )}
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Pencil size={13} />}
                          onClick={() => setEditingNudge(nudge)}
                          sx={{
                            borderColor: tokens.hairline,
                            color: tokens.ink,
                            textTransform: 'none',
                            fontSize: 12.5,
                            fontWeight: 600,
                            minHeight: 36,
                            '&:hover': { borderColor: tokens.ink, bgcolor: tokens.inkTint },
                          }}
                        >
                          Tune copy
                        </Button>

                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Send size={13} />}
                          disabled={testingId === nudge.nudgeId}
                          onClick={() => handleTestSend(nudge)}
                          sx={{
                            borderColor: tokens.hairline,
                            color: tokens.muted,
                            textTransform: 'none',
                            fontSize: 12.5,
                            minHeight: 36,
                            '&:hover': { borderColor: tokens.ink, color: tokens.ink },
                          }}
                        >
                          {testingId === nudge.nudgeId ? 'Sending...' : 'Test push'}
                        </Button>

                        <Tooltip title="Trigger immediate manual execution of this cron">
                          <Button
                            variant="text"
                            size="small"
                            startIcon={<Play size={13} />}
                            disabled={triggeringId === nudge.nudgeId}
                            onClick={() => handleTriggerNow(nudge)}
                            sx={{
                              color: tokens.ink,
                              textTransform: 'none',
                              fontSize: 12.5,
                              minHeight: 36,
                              '&:hover': { bgcolor: tokens.inkTint },
                            }}
                          >
                            {triggeringId === nudge.nudgeId ? 'Running...' : 'Run now'}
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Nudge Copy Editor Drawer */}
      <NudgeEditorDrawer
        open={Boolean(editingNudge)}
        nudge={editingNudge}
        onClose={() => setEditingNudge(null)}
        onSaved={fetchNudges}
      />
    </Box>
  );
}
