import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
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
  AlertCircle,
  AlertTriangle,
  Battery,
  Bell,
  CheckCircle2,
  Clock,
  History,
  Megaphone,
  Phone,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Signal,
  Smartphone,
  Sparkles,
  Target,
  Trophy,
  Users,
  Wifi,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { Panel, PanelHeader } from '@/components/Panel';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const NOTIFICATION_TYPES = [
  { value: 'general', label: 'General', icon: Megaphone, tint: tokens.inkTint, color: tokens.ink },
  { value: 'announcement', label: 'Announcement', icon: Sparkles, tint: tokens.accentTint, color: tokens.amber },
  { value: 'reminder', label: 'Reminder', icon: Clock, tint: tokens.inkTint, color: tokens.ink },
  { value: 'offer', label: 'Special offer', icon: Zap, tint: tokens.greenTint, color: tokens.green },
  { value: 'achievement', label: 'Achievement', icon: Trophy, tint: tokens.accentTint, color: tokens.amber },
];

const QUICK_TEMPLATES = [
  {
    label: 'Mock test live',
    type: 'reminder',
    title: 'New mock test is now live',
    body: 'Test your exam readiness with the newly published mock test. Tap to start solving now.',
  },
  {
    label: 'Revision notes',
    type: 'announcement',
    title: 'New revision notes uploaded',
    body: 'High-yield revision notes are now available in your Library. Review key concepts before your exam.',
  },
  {
    label: 'Daily practice',
    type: 'reminder',
    title: 'Keep your streak alive today',
    body: 'Spend 15 minutes practicing today’s questions to maintain your study streak and exam readiness.',
  },
  {
    label: 'Subscription renewal',
    type: 'offer',
    title: 'Your PrepOne plan is expiring soon',
    body: 'Renew your subscription today to keep unlimited test evaluations, detailed analytics, and AI grading.',
  },
];

const formatDate = (iso) => {
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

export default function NotificationSender() {
  const [activeTab, setActiveTab] = useState('compose');

  // Overall audience metrics
  const [stats, setStats] = useState({
    totalUsers: 0,
    usersWithTokens: 0,
    usersWithoutTokens: 0,
    usersByClass: [],
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notificationType, setNotificationType] = useState('general');

  // Audience Filter State
  const [board, setBoard] = useState('all');
  const [studentClass, setStudentClass] = useState('all');
  const [plan, setPlan] = useState('all');
  const [activity, setActivity] = useState('all');
  const [streak, setStreak] = useState('all');
  const [acquisition, setAcquisition] = useState('all');

  // Audience Estimation
  const [estimate, setEstimate] = useState({
    totalMatching: 0,
    reachableWithFcm: 0,
    dailyBroadcastsToday: 0,
    dailyBroadcastLimit: 5,
    limitReached: false,
  });
  const [estimating, setEstimating] = useState(false);

  // Safeguards & Actions
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [overrideLimit, setOverrideLimit] = useState(false);

  // Past Campaigns History State
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsTotal, setCampaignsTotal] = useState(0);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [campaignsLimit] = useState(15);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Fetch overall audience stats
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await fetch(`${API_BASE_URL}/notifications/stats`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalUsers: Number(data.totalUsers || 0),
          usersWithTokens: Number(data.usersWithTokens || 0),
          usersWithoutTokens: Number(data.usersWithoutTokens || 0),
          usersByClass: Array.isArray(data.usersByClass) ? data.usersByClass : [],
        });
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch live audience estimate based on active filters
  const fetchEstimate = useCallback(async () => {
    try {
      setEstimating(true);
      const res = await fetch(`${API_BASE_URL}/notifications/admin/audience/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          audienceFilters: {
            board,
            studentClass,
            plan,
            activity,
            streak,
            acquisition,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEstimate({
          totalMatching: data.totalMatching || 0,
          reachableWithFcm: data.reachableWithFcm || 0,
          dailyBroadcastsToday: data.dailyBroadcastsToday || 0,
          dailyBroadcastLimit: data.dailyBroadcastLimit || 5,
          limitReached: Boolean(data.limitReached),
        });
      }
    } catch (err) {
      console.error('Audience estimate error:', err);
    } finally {
      setEstimating(false);
    }
  }, [board, studentClass, plan, activity, streak, acquisition]);

  // Fetch past campaigns
  const fetchCampaigns = useCallback(async (p = 1) => {
    try {
      setLoadingCampaigns(true);
      const res = await fetch(
        `${API_BASE_URL}/notifications/admin/campaigns?page=${p}&limit=${campaignsLimit}`,
        {
          headers: authHeaders(),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setCampaigns(data.campaigns || []);
        setCampaignsTotal(data.total || 0);
        setCampaignsPage(data.page || 1);
      }
    } catch (err) {
      console.error('Fetch campaigns error:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  }, [campaignsLimit]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchEstimate();
  }, [fetchEstimate]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchCampaigns(campaignsPage);
    }
  }, [activeTab, campaignsPage, fetchCampaigns]);

  // Handle template selection
  const handleApplyTemplate = (tmpl) => {
    setTitle(tmpl.title);
    setBody(tmpl.body);
    setNotificationType(tmpl.type);
    toast.success(`Loaded "${tmpl.label}" template`);
  };

  const handleClear = () => {
    setTitle('');
    setBody('');
    setNotificationType('general');
  };

  // Test push to admin
  const handleTestSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please enter a title and message before testing');
      return;
    }

    try {
      setTesting(true);
      const res = await fetch(`${API_BASE_URL}/notifications/admin/campaigns/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ title, body, type: notificationType }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to send test push');
      }

      toast.success(data.message || 'Test push notification validated');
    } catch (err) {
      console.error('Test push error:', err);
      toast.error(err.message || 'Test push failed');
    } finally {
      setTesting(false);
    }
  };

  // Broadcast campaign to audience
  const handleSendBroadcast = async () => {
    try {
      setSending(true);

      const res = await fetch(`${API_BASE_URL}/notifications/admin/campaigns/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          title,
          body,
          type: notificationType,
          audienceFilters: {
            board,
            studentClass,
            plan,
            activity,
            streak,
            acquisition,
          },
          overrideLimit,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to broadcast campaign');
      }

      toast.success(data.message || 'Campaign sent successfully!');
      setConfirmOpen(false);
      handleClear();
      fetchEstimate();
      fetchCampaigns(1);
    } catch (err) {
      console.error('Send campaign error:', err);
      toast.error(err.message || 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  const reachRate = useMemo(() => {
    if (!stats.totalUsers) return 0;
    return Math.round((stats.usersWithTokens / stats.totalUsers) * 100);
  }, [stats]);

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
            Campaigns and audiences
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Write push messages, target student cohorts with precise filters, and inspect campaign history.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            component={Link}
            to="/automatic-nudges"
            variant="outlined"
            startIcon={<Zap size={16} color={tokens.ink} />}
            sx={{
              minHeight: 44,
              borderColor: tokens.rule,
              color: tokens.text,
              bgcolor: tokens.sheet,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13.5,
              '&:hover': { borderColor: tokens.ink, bgcolor: tokens.inkTint },
            }}
          >
            Automatic nudges
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              fetchStats();
              fetchEstimate();
              if (activeTab === 'history') fetchCampaigns(campaignsPage);
            }}
            disabled={loadingStats || estimating}
            startIcon={<RefreshCw size={16} className={loadingStats || estimating ? 'animate-spin' : ''} />}
            sx={{
              minHeight: 44,
              borderColor: tokens.rule,
              color: tokens.text,
              textTransform: 'none',
              bgcolor: tokens.sheet,
              '&:hover': { borderColor: tokens.ink, bgcolor: tokens.inkTint },
            }}
          >
            Refresh audience metrics
          </Button>
        </Box>
      </Box>

      {/* Top Audience Metric Cards */}
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
              flexShrink: 0,
            }}
          >
            <Users size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Total registered students
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {loadingStats ? <Skeleton width={60} /> : fmt(stats.totalUsers)}
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
              flexShrink: 0,
            }}
          >
            <Bell size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Reachable with push (FCM)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {loadingStats ? <Skeleton width={60} /> : fmt(stats.usersWithTokens)}
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
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Daily broadcasts today
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {estimate.dailyBroadcastsToday} / {estimate.dailyBroadcastLimit}
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
              flexShrink: 0,
            }}
          >
            <Activity size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Overall push reach rate
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {loadingStats ? <Skeleton width={50} /> : `${reachRate}%`}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: `1px solid ${tokens.rule}` }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Compose & Target" value="compose" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label={`Campaign History (${fmt(campaignsTotal)})`} value="history" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* Tab 1: Compose & Target */}
      {activeTab === 'compose' ? (
        <Grid container spacing={3.5}>
          {/* Left Column: Form & Targeting */}
          <Grid item xs={12} lg={7}>
            <Box sx={{ display: 'grid', gap: 3 }}>
              {/* Quick Templates */}
              <Panel>
                <PanelHeader title="Quick templates" />
                <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {QUICK_TEMPLATES.map((tmpl) => (
                    <Chip
                      key={tmpl.label}
                      label={tmpl.label}
                      onClick={() => handleApplyTemplate(tmpl)}
                      sx={{
                        fontWeight: 500,
                        bgcolor: tokens.sheet,
                        border: `1px solid ${tokens.rule}`,
                        color: tokens.text,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: tokens.inkTint, borderColor: tokens.ink, color: tokens.ink },
                      }}
                    />
                  ))}
                </Box>
              </Panel>

              {/* Message Composer */}
              <Panel>
                <PanelHeader
                  title="Message composer"
                  action={
                    (title || body) && (
                      <Button
                        size="small"
                        variant="text"
                        onClick={handleClear}
                        startIcon={<RotateCcw size={14} />}
                        sx={{ color: tokens.muted, textTransform: 'none' }}
                      >
                        Clear
                      </Button>
                    )
                  }
                />
                <Box sx={{ p: 2.5, display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500, mb: 1, display: 'block' }}>
                      Message type
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {NOTIFICATION_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = notificationType === type.value;
                        return (
                          <Chip
                            key={type.value}
                            icon={<Icon size={14} color={isSelected ? type.color : tokens.muted} />}
                            label={type.label}
                            onClick={() => setNotificationType(type.value)}
                            sx={{
                              fontWeight: isSelected ? 600 : 500,
                              color: isSelected ? type.color : tokens.text,
                              bgcolor: isSelected ? type.tint : tokens.sheet,
                              border: `1px solid ${isSelected ? type.color : tokens.rule}`,
                              cursor: 'pointer',
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>

                  <TextField
                    label="Campaign title"
                    placeholder="e.g. New Mock Test Published"
                    fullWidth
                    size="small"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    helperText={`${title.length}/120 characters`}
                    sx={{ bgcolor: tokens.sheet }}
                  />

                  <TextField
                    label="Push body text"
                    placeholder="Enter the push notification text that students will see on their lock screens..."
                    multiline
                    rows={4}
                    fullWidth
                    size="small"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    helperText={`${body.length}/500 characters`}
                    sx={{ bgcolor: tokens.sheet }}
                  />
                </Box>
              </Panel>

              {/* Audience Targeting Panel */}
              <Panel>
                <PanelHeader
                  title="Target audience cohorts"
                  subtitle="Combine criteria to target the exact student segment"
                />
                <Box sx={{ p: 2.5, display: 'grid', gap: 2 }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                      gap: 2,
                    }}
                  >
                    {/* Class */}
                    <FormControl size="small" fullWidth>
                      <InputLabel id="target-class-label">Class</InputLabel>
                      <Select
                        labelId="target-class-label"
                        value={studentClass}
                        label="Class"
                        onChange={(e) => setStudentClass(e.target.value)}
                        sx={{ bgcolor: tokens.sheet }}
                      >
                        <MenuItem value="all">All classes</MenuItem>
                        <MenuItem value="9">Class 9</MenuItem>
                        <MenuItem value="10">Class 10</MenuItem>
                        <MenuItem value="11">Class 11</MenuItem>
                        <MenuItem value="12">Class 12</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Board */}
                    <FormControl size="small" fullWidth>
                      <InputLabel id="target-board-label">Board</InputLabel>
                      <Select
                        labelId="target-board-label"
                        value={board}
                        label="Board"
                        onChange={(e) => setBoard(e.target.value)}
                        sx={{ bgcolor: tokens.sheet }}
                      >
                        <MenuItem value="all">All boards</MenuItem>
                        <MenuItem value="CBSE">CBSE</MenuItem>
                        <MenuItem value="BSEB">BSEB (Bihar Board)</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Plan */}
                    <FormControl size="small" fullWidth>
                      <InputLabel id="target-plan-label">Subscription plan</InputLabel>
                      <Select
                        labelId="target-plan-label"
                        value={plan}
                        label="Subscription plan"
                        onChange={(e) => setPlan(e.target.value)}
                        sx={{ bgcolor: tokens.sheet }}
                      >
                        <MenuItem value="all">All plans</MenuItem>
                        <MenuItem value="free">Free tier students</MenuItem>
                        <MenuItem value="trial">Trial / bonus tier</MenuItem>
                        <MenuItem value="premium">Active Premium</MenuItem>
                        <MenuItem value="expiring_7d">Expiring in 7 days</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Activity */}
                    <FormControl size="small" fullWidth>
                      <InputLabel id="target-activity-label">Inactivity window</InputLabel>
                      <Select
                        labelId="target-activity-label"
                        value={activity}
                        label="Inactivity window"
                        onChange={(e) => setActivity(e.target.value)}
                        sx={{ bgcolor: tokens.sheet }}
                      >
                        <MenuItem value="all">Any activity status</MenuItem>
                        <MenuItem value="inactive_7d">Inactive &ge; 7 days</MenuItem>
                        <MenuItem value="inactive_14d">Inactive &ge; 14 days</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Streak */}
                    <FormControl size="small" fullWidth>
                      <InputLabel id="target-streak-label">Daily streak</InputLabel>
                      <Select
                        labelId="target-streak-label"
                        value={streak}
                        label="Daily streak"
                        onChange={(e) => setStreak(e.target.value)}
                        sx={{ bgcolor: tokens.sheet }}
                      >
                        <MenuItem value="all">Any streak status</MenuItem>
                        <MenuItem value="unfinished_streak">Has unfinished streak today</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Acquisition */}
                    <FormControl size="small" fullWidth>
                      <InputLabel id="target-acquisition-label">Acquisition source</InputLabel>
                      <Select
                        labelId="target-acquisition-label"
                        value={acquisition}
                        label="Acquisition source"
                        onChange={(e) => setAcquisition(e.target.value)}
                        sx={{ bgcolor: tokens.sheet }}
                      >
                        <MenuItem value="all">All sign-up sources</MenuItem>
                        <MenuItem value="referred">Referred by student</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Dynamic Audience Estimation Bar */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '10px',
                      bgcolor: tokens.sheet,
                      border: `1px solid ${tokens.rule}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '8px',
                          bgcolor: tokens.inkTint,
                          color: tokens.ink,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Target size={18} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
                          Estimated audience reach
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: tokens.text }}>
                          {estimating ? (
                            <Skeleton width={120} />
                          ) : (
                            `${fmt(estimate.reachableWithFcm)} push-reachable students`
                          )}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>
                        Matching criteria: {fmt(estimate.totalMatching)} students
                      </Typography>
                      <Typography variant="caption" sx={{ color: estimate.limitReached ? tokens.red : tokens.green, fontWeight: 600 }}>
                        {estimate.limitReached ? 'Daily broadcast cap reached (5/5)' : `${5 - estimate.dailyBroadcastsToday} broadcasts left today`}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Safeguard Action Buttons */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, pt: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={handleTestSend}
                      disabled={testing || !title.trim() || !body.trim()}
                      startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <Phone size={16} />}
                      sx={{
                        minHeight: 44,
                        borderColor: tokens.rule,
                        color: tokens.text,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { borderColor: tokens.ink, bgcolor: tokens.inkTint },
                      }}
                    >
                      {testing ? 'Sending test...' : 'Send test to my device'}
                    </Button>

                    <Button
                      variant="contained"
                      onClick={() => setConfirmOpen(true)}
                      disabled={!title.trim() || !body.trim() || estimate.reachableWithFcm === 0}
                      startIcon={<Send size={16} />}
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
                      Broadcast to {fmt(estimate.reachableWithFcm)} students
                    </Button>
                  </Box>
                </Box>
              </Panel>
            </Box>
          </Grid>

          {/* Right Column: Mobile Device Live Preview */}
          <Grid item xs={12} lg={5}>
            <Panel>
              <PanelHeader title="Lock screen live preview" subtitle="Simulated view on Android / iOS lock screen" />
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                {/* Mobile Device Frame */}
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 320,
                    borderRadius: '28px',
                    bgcolor: '#1E1926',
                    p: 1.5,
                    boxShadow: '0 12px 36px rgba(42, 31, 51, 0.15)',
                    border: '4px solid #332B3E',
                  }}
                >
                  {/* Phone Screen */}
                  <Box
                    sx={{
                      borderRadius: '20px',
                      bgcolor: '#2A1F33',
                      minHeight: 420,
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      color: '#ffffff',
                    }}
                  >
                    {/* Status Bar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        9:41
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                        <Signal size={12} />
                        <Wifi size={12} />
                        <Battery size={14} />
                      </Box>
                    </Box>

                    {/* Clock Widget */}
                    <Box sx={{ textAlign: 'center', my: 2 }}>
                      <Typography variant="h3" sx={{ fontWeight: 300, letterSpacing: -1 }}>
                        09:41
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Tuesday, 2 November
                      </Typography>
                    </Box>

                    {/* Push Notification Banner */}
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.75,
                        borderRadius: '14px',
                        bgcolor: 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        display: 'grid',
                        gap: 0.75,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: '4px',
                              bgcolor: tokens.accent,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                            }}
                          >
                            P
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                            PrepOne
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>
                          Just now
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          color: '#ffffff',
                          lineHeight: 1.3,
                        }}
                      >
                        {title.trim() || 'Notification Title'}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.85)',
                          fontSize: '0.75rem',
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {body.trim() || 'Preview push message text will appear here.'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Panel>
          </Grid>
        </Grid>
      ) : (
        /* Tab 2: Campaign History */
        <Panel>
          <PanelHeader
            title="Past campaign broadcasts"
            subtitle="Database record of all push broadcasts sent through the campaign center"
          />

          {loadingCampaigns ? (
            <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={32} sx={{ color: tokens.ink }} />
              <Typography variant="body2" color="text.secondary">
                Loading campaign history...
              </Typography>
            </Box>
          ) : campaigns.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tokens.text }}>
                No broadcast campaigns yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                When you dispatch an audience campaign, its delivery numbers and recipient count will appear here.
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 700 }}>
                  <TableHead sx={{ bgcolor: '#F6EFE3' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Campaign</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Target Audience</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Recipients</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Delivery Rate</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Sent At</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Sender</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {campaigns.map((camp) => {
                      const deliveryRate = camp.recipientCount
                        ? Math.round((camp.successCount / camp.recipientCount) * 100)
                        : 0;

                      return (
                        <TableRow key={camp._id} hover>
                          <TableCell sx={{ py: 1.75 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text }}>
                              {camp.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: tokens.muted, display: 'block', maxWidth: 300 }}>
                              {camp.body}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ py: 1.75 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {camp.audienceFilters?.board !== 'all' && (
                                <Chip size="small" label={camp.audienceFilters.board} sx={{ fontSize: '0.7rem' }} />
                              )}
                              {camp.audienceFilters?.studentClass !== 'all' && (
                                <Chip size="small" label={`Class ${camp.audienceFilters.studentClass}`} sx={{ fontSize: '0.7rem' }} />
                              )}
                              {camp.audienceFilters?.plan !== 'all' && (
                                <Chip size="small" label={`Plan: ${camp.audienceFilters.plan}`} sx={{ fontSize: '0.7rem' }} />
                              )}
                              {camp.audienceFilters?.activity !== 'all' && (
                                <Chip size="small" label={camp.audienceFilters.activity} sx={{ fontSize: '0.7rem' }} />
                              )}
                              {camp.audienceFilters?.streak !== 'all' && (
                                <Chip size="small" label="Unfinished streak" sx={{ fontSize: '0.7rem' }} />
                              )}
                              {camp.audienceFilters?.acquisition !== 'all' && (
                                <Chip size="small" label="Referred" sx={{ fontSize: '0.7rem' }} />
                              )}
                              {Object.values(camp.audienceFilters || {}).every((v) => v === 'all') && (
                                <Chip size="small" label="All students" sx={{ fontSize: '0.7rem' }} />
                              )}
                            </Box>
                          </TableCell>

                          <TableCell sx={{ py: 1.75 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text }}>
                              {fmt(camp.recipientCount)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: tokens.muted }}>
                              {fmt(camp.successCount)} delivered
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ py: 1.75 }}>
                            <Chip
                              size="small"
                              label={`${deliveryRate}%`}
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                color: deliveryRate >= 80 ? tokens.green : tokens.amber,
                                bgcolor: deliveryRate >= 80 ? tokens.greenTint : tokens.amberTint,
                              }}
                            />
                          </TableCell>

                          <TableCell sx={{ py: 1.75 }}>
                            <Typography variant="body2" sx={{ color: tokens.text, fontSize: '0.85rem' }}>
                              {formatDate(camp.sentAt || camp.createdAt)}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ py: 1.75 }}>
                            <Typography variant="caption" sx={{ color: tokens.muted }}>
                              {camp.sentBy || 'Admin'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>

              {/* Pagination */}
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${tokens.rule}` }}>
                <Pagination
                  count={Math.ceil(campaignsTotal / campaignsLimit) || 1}
                  page={campaignsPage}
                  onChange={(_, p) => setCampaignsPage(p)}
                  color="primary"
                  size="small"
                />
              </Box>
            </>
          )}
        </Panel>
      )}

      {/* Safeguard Confirmation Modal */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
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
            <AlertTriangle size={20} color={tokens.amber} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.text }}>
              Confirm Campaign Broadcast
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, display: 'grid', gap: 2, mt: 1 }}>
          <Alert severity="warning" sx={{ fontSize: '0.85rem' }}>
            Push notifications are delivered directly to students' phone lock screens and cannot be recalled or edited once sent.
          </Alert>

          <Box sx={{ p: 2, borderRadius: '8px', bgcolor: tokens.sheet, border: `1px solid ${tokens.rule}` }}>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Title
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text, mb: 1 }}>
              {title}
            </Typography>

            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Message
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.text, mb: 1.5 }}>
              {body}
            </Typography>

            <Divider sx={{ my: 1, borderColor: tokens.rule }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Total Target Reach
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.ink }}>
                {fmt(estimate.reachableWithFcm)} students
              </Typography>
            </Box>
          </Box>

          {estimate.limitReached && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                id="override-limit-checkbox"
                checked={overrideLimit}
                onChange={(e) => setOverrideLimit(e.target.checked)}
              />
              <label htmlFor="override-limit-checkbox" style={{ fontSize: '0.85rem', color: tokens.red }}>
                I acknowledge the daily 5-campaign limit is reached and choose to override.
              </label>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: tokens.sheet, borderTop: `1px solid ${tokens.rule}` }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={sending} sx={{ color: tokens.muted, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendBroadcast}
            disabled={sending || (estimate.limitReached && !overrideLimit)}
            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
            sx={{
              minHeight: 40,
              bgcolor: tokens.ink,
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.inkDark, boxShadow: 'none' },
            }}
          >
            {sending ? 'Broadcasting...' : 'Confirm & Send Broadcast'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
