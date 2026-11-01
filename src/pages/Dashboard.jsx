import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FilePlus2,
  Layers,
  Plus,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { Bubble } from '@/components/Bubble';
import { Panel, PanelHeader } from '@/components/Panel';
import { useScope } from '@/lib/scope-context';
import { HEALTHY_MIN, levelOf, loadSyllabus } from '@/lib/syllabusData';
import { HEALTH_LABEL, useHealth } from '@/lib/useHealth';
import { getJson, useResource } from '@/lib/useResource';
import { tokens } from '@/theme';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

// ── Attention strip cell ────────────────────────────────────────────────────────
function AttentionCell({ resource, onRetry, build }) {
  const { status, data } = resource;
  let content;

  if (status === 'loading' && !data) {
    content = (
      <>
        <Skeleton width="40%" height={16} sx={{ mb: 1 }} />
        <Skeleton width="85%" height={24} />
        <Skeleton width="60%" height={18} sx={{ mt: 0.5 }} />
      </>
    );
  } else if (status === 'error') {
    content = (
      <>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          STATUS
        </Typography>
        <Typography sx={{ fontSize: 15, fontWeight: 600, mt: 0.5 }}>
          Couldn't load this metric
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          The API didn't respond. Check system health, then try again.
        </Typography>
        <Button size="small" onClick={onRetry} sx={{ alignSelf: 'flex-start', mt: 1, ml: -1 }}>
          Try again
        </Button>
      </>
    );
  } else {
    const { category, tone, headline, detail, action, to } = build(data);
    const Icon = tone === 'bad' ? AlertCircle : tone === 'good' ? CheckCircle2 : null;
    const iconColor = tone === 'bad' ? tokens.red : tone === 'good' ? tokens.green : tokens.ink;

    content = (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              color: tone === 'bad' ? tokens.red : 'text.secondary',
              letterSpacing: 0.2,
            }}
          >
            {category}
          </Typography>
          {Icon && <Icon size={16} color={iconColor} style={{ flexShrink: 0 }} />}
        </Box>

        <Typography sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35 }}>
          {headline}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {detail}
        </Typography>
        <Button
          component={Link}
          to={to}
          size="small"
          sx={{
            alignSelf: 'flex-start',
            mt: 1.25,
            ml: -1,
            fontWeight: 600,
            color: 'primary.main',
          }}
        >
          {action}
        </Button>
      </>
    );
  }

  return (
    <Box
      sx={{
        p: 2.75,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100%',
      }}
    >
      {content}
    </Box>
  );
}

// ── Chapter Bubble ──────────────────────────────────────────────────────────────
function ChapterBubble({ subject, chapter }) {
  const count = chapter.questionCount || 0;
  const label = `${chapter.name}: ${count === 0 ? 'no questions' : `${fmt(count)} question${count === 1 ? '' : 's'}`}`;

  return (
    <Tooltip title={label} placement="top">
      <Box
        component={Link}
        to={`/questions?subject=${subject._id}&chapter=${chapter._id}`}
        aria-label={label}
        sx={{
          width: 26,
          height: 26,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          transition: 'background-color 150ms ease',
          '&:hover': {
            bgcolor: count === 0 ? tokens.redTint : tokens.inkTint,
          },
          '&:focus-visible': {
            outline: `2px solid ${tokens.ink}`,
            outlineOffset: 2,
          },
        }}
      >
        <Bubble level={levelOf(count)} size={15} />
      </Box>
    </Tooltip>
  );
}

const LEDGER_COLUMNS = { xs: 'minmax(0, 1fr)', md: '220px minmax(0, 1fr) 100px' };

// ── Coverage Ledger ─────────────────────────────────────────────────────────────
function Ledger({ board, classId, resource, onRetry }) {
  const { status, data } = resource;

  if (status === 'loading' && !data) {
    return (
      <Box sx={{ p: 3, display: 'grid', gap: 2 }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={36} />
        ))}
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 600 }}>
          Couldn't load {board} Class {classId} subjects
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          The API didn't respond. Check system health, then try again.
        </Typography>
        <Button variant="outlined" size="small" onClick={onRetry}>
          Try again
        </Button>
      </Box>
    );
  }

  if (!data?.length) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 600 }}>
          No subjects for {board} Class {classId} yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Add subjects and chapters first, then chapter question coverage will appear here.
        </Typography>
        <Button component={Link} to="/syllabus" variant="contained" size="small">
          Manage syllabus
        </Button>
      </Box>
    );
  }

  return (
    <Box role="table" aria-label={`${board} Class ${classId} question coverage by subject`}>
      {/* Table Header */}
      <Box
        role="row"
        sx={{
          display: { xs: 'none', md: 'grid' },
          gridTemplateColumns: LEDGER_COLUMNS,
          gap: 2,
          px: 3,
          py: 1.25,
          bgcolor: '#F6EFE3',
          borderBottom: `1px solid ${tokens.rule}`,
          color: tokens.muted,
          fontSize: '0.8125rem',
          fontWeight: 600,
        }}
      >
        <Box role="columnheader">Subject</Box>
        <Box role="columnheader">Chapters</Box>
        <Box role="columnheader" sx={{ textAlign: 'right' }}>
          Questions
        </Box>
      </Box>

      {/* Table Rows */}
      {data.map((subject) => {
        const total = subject.chapters.reduce((sum, c) => sum + (c.questionCount || 0), 0);
        const empty = subject.chapters.filter((c) => !c.questionCount).length;
        const chapters = [...subject.chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return (
          <Box
            key={subject._id}
            role="row"
            sx={{
              display: 'grid',
              gridTemplateColumns: LEDGER_COLUMNS,
              gap: { xs: 1.5, md: 2 },
              alignItems: 'center',
              px: 3,
              py: 2,
              borderBottom: `1px solid ${tokens.rule}`,
              transition: 'background-color 150ms ease',
              '&:hover': {
                bgcolor: 'rgba(63, 33, 112, 0.03)',
              },
              '&:last-of-type': {
                borderBottom: 0,
              },
            }}
          >
            {/* Subject Info */}
            <Box role="cell" sx={{ minWidth: 0 }}>
              <Typography
                component={Link}
                to={`/syllabus?subject=${subject._id}`}
                sx={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: 'text.primary',
                  textDecoration: 'none',
                  display: 'inline-block',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {subject.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.25 }}
              >
                {subject.failed
                  ? 'Chapters unavailable'
                  : `${chapters.length} chapter${chapters.length === 1 ? '' : 's'}`}
                {empty > 0 && (
                  <Box component="span" sx={{ color: tokens.red, fontWeight: 600 }}>
                    {` • ${empty} empty`}
                  </Box>
                )}
              </Typography>
            </Box>

            {/* Chapter Bubbles Matrix */}
            <Box
              role="cell"
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '4px',
                minWidth: 0,
              }}
            >
              {subject.failed ? (
                <Typography variant="body2" color="text.secondary">
                  Couldn't load chapters.
                </Typography>
              ) : chapters.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  No chapters created yet.
                </Typography>
              ) : (
                chapters.map((chapter) => (
                  <ChapterBubble
                    key={chapter._id}
                    subject={subject}
                    chapter={chapter}
                  />
                ))
              )}
            </Box>

            {/* Total Questions Count & Quick Link */}
            <Box
              role="cell"
              sx={{
                textAlign: 'right',
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                gap: 1.5,
              }}
            >
              <Typography sx={{ fontSize: 14.5, fontWeight: 600, tabularNums: true }}>
                {fmt(total)}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function Legend() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 3,
        color: tokens.muted,
        fontSize: '0.8125rem',
      }}
      aria-label="Coverage legend"
    >
      {[
        ['none', 'No questions'],
        ['half', `Under ${HEALTHY_MIN} questions`],
        ['full', `${HEALTHY_MIN} or more questions (healthy)`],
      ].map(([level, text]) => (
        <Box key={level} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <Bubble level={level} size={14} />
          <span>{text}</span>
        </Box>
      ))}
    </Box>
  );
}

// ── System Status Panel ─────────────────────────────────────────────────────────
const STATE_COLOR = {
  ok: tokens.green,
  degraded: tokens.amber,
  down: tokens.red,
  loading: '#BFB3A4',
};

function SystemPanel() {
  const { state, data, checkedAt, refresh } = useHealth();

  const preponeDb = data?.databases?.prepone ?? 'unknown';
  const coachoneDb = data?.databases?.coachone ?? 'unknown';

  const rows = [
    { label: 'API Server', value: HEALTH_LABEL[state].replace('API ', ''), color: STATE_COLOR[state] },
    {
      label: 'PrepOne database',
      value: preponeDb,
      color: preponeDb === 'connected' ? tokens.green : preponeDb === 'unknown' ? '#BFB3A4' : tokens.red,
    },
    {
      label: 'CoachOne database',
      value: coachoneDb,
      color:
        coachoneDb === 'connected'
          ? tokens.green
          : coachoneDb === 'disabled'
            ? '#BFB3A4'
            : coachoneDb === 'unknown'
              ? '#BFB3A4'
              : tokens.red,
    },
    {
      label: 'Task queue',
      value: data?.taskQueue ? `${data.taskQueue.running} running, ${data.taskQueue.queued} queued` : 'idle',
      color: null,
    },
    { label: 'Uptime', value: data?.uptime ?? '–', color: null },
  ];

  return (
    <Panel>
      <PanelHeader
        title="System status"
        description="Health metrics across server and database clusters."
        action={
          <Tooltip title="Check now">
            <IconButton size="small" onClick={refresh} aria-label="Check system status now">
              <RefreshCw size={15} />
            </IconButton>
          </Tooltip>
        }
      />
      <Box sx={{ px: 3, py: 1 }}>
        {rows.map(({ label, value, color }) => (
          <Box
            key={label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              py: 1.25,
              borderBottom: `1px solid ${tokens.rule}`,
              '&:last-of-type': { borderBottom: 0 },
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}
            >
              {color && (
                <Box
                  component="span"
                  sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }}
                />
              )}
              <span>{value}</span>
            </Box>
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          px: 3,
          py: 1.5,
          borderTop: `1px solid ${tokens.rule}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'text.secondary',
        }}
      >
        <span>
          {checkedAt
            ? `Checked at ${checkedAt.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}`
            : 'Checking…'}
        </span>
        <Button
          component={Link}
          to="/system-health"
          size="small"
          sx={{ fontSize: '0.75rem', p: 0, minWidth: 0, color: 'primary.main' }}
        >
          Diagnostics
        </Button>
      </Box>
    </Panel>
  );
}

// ── Dashboard Page ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { board, classId } = useScope();

  // Load syllabus and question coverage for current board and class
  const [ledger, reloadLedger] = useResource(
    (signal) => loadSyllabus(board, classId, signal),
    [board, classId]
  );

  // Load mock tests for current board and class
  const [tests, reloadTests] = useResource(
    (signal) => getJson(`/tests/admin/list?classId=${classId}&board=${board}`, signal),
    [board, classId]
  );

  // Load student notification reach
  const [reach, reloadReach] = useResource(
    (signal) => getJson('/notifications/stats', signal),
    []
  );

  const totals = useMemo(() => {
    const subjects = Array.isArray(ledger.data) ? ledger.data : [];
    const chapters = subjects.flatMap((s) => s.chapters || []);
    const questions = chapters.reduce((sum, c) => sum + (c.questionCount || 0), 0);
    const empty = chapters.filter((c) => !c.questionCount).length;
    const thin = chapters.filter((c) => c.questionCount > 0 && c.questionCount < HEALTHY_MIN).length;
    const healthy = chapters.filter((c) => c.questionCount >= HEALTHY_MIN).length;
    const coveragePercent = chapters.length > 0 ? Math.round((healthy / chapters.length) * 100) : 0;

    return {
      subjects: subjects.length,
      chapters: chapters.length,
      empty,
      thin,
      healthy,
      questions,
      coveragePercent,
    };
  }, [ledger.data]);

  const quickActions = [
    { label: 'Review questions', icon: ClipboardCheck, to: '/review' },
    { label: 'Add or import questions', icon: Upload, to: '/questions?import=1' },
    { label: `Create a ${board} Class ${classId} mock test`, icon: FilePlus2, to: '/mock-tests/new' },
    { label: 'Manage syllabus & chapters', icon: BookOpen, to: '/syllabus' },
    { label: 'Revision notes & PYQs', icon: BookMarked, to: '/library' },
    { label: 'Flashcards', icon: Layers, to: '/flashcards' },
    { label: 'Send notification', icon: Bell, to: '/notifications' },
    { label: 'Business insights', icon: BarChart3, to: '/insights' },
  ];

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
            <Typography variant="h4" component="h1">
              Overview
            </Typography>
            <Chip
              size="small"
              label={`${board} • Class ${classId}`}
              sx={{
                bgcolor: tokens.inkTint,
                color: tokens.ink,
                fontWeight: 600,
                fontSize: '0.8125rem',
                border: 'none',
              }}
            />
          </Box>
          <Typography color="text.secondary">
            Curriculum question depth, test readiness, and student reach. Switch board or class in the sidebar.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            component={Link}
            to="/mock-tests/new"
            variant="outlined"
            size="small"
            startIcon={<Plus size={15} />}
          >
            New test
          </Button>
          <Button
            component={Link}
            to="/questions?import=1"
            variant="contained"
            size="small"
            startIcon={<Upload size={15} />}
          >
            Import questions
          </Button>
        </Box>
      </Box>

      {/* Highlights / Attention Strip */}
      <Panel sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            '& > *:not(:last-child)': {
              borderBottom: { xs: `1px solid ${tokens.rule}`, md: 0 },
              borderRight: { md: `1px solid ${tokens.rule}` },
            },
          }}
        >
          {/* Attention Cell 1: Question Depth */}
          <AttentionCell
            resource={ledger}
            onRetry={reloadLedger}
            build={() => {
              if (totals.empty > 0) {
                return {
                  category: 'QUESTION DEPTH',
                  tone: 'bad',
                  headline: `${fmt(totals.empty)} of ${fmt(totals.chapters)} chapters have no questions`,
                  detail: `${fmt(totals.thin)} chapters have fewer than ${HEALTHY_MIN}. Total ${fmt(totals.questions)} questions.`,
                  action: 'Add questions',
                  to: '/questions',
                };
              }
              return {
                category: 'QUESTION DEPTH',
                tone: 'good',
                headline: totals.chapters > 0 ? 'All chapters have questions' : 'No chapters created yet',
                detail: `${fmt(totals.healthy)} chapters well covered, ${fmt(totals.thin)} under ${HEALTHY_MIN}.`,
                action: 'Manage questions',
                to: '/questions',
              };
            }}
          />

          {/* Attention Cell 2: Mock Tests */}
          <AttentionCell
            resource={tests}
            onRetry={reloadTests}
            build={(list) => {
              const arr = Array.isArray(list) ? list : [];
              const draft = arr.filter((t) => t.status === 'draft').length;
              const active = arr.filter((t) => t.status === 'active' || t.status === 'live').length;
              const upcoming = arr.filter((t) => t.status === 'upcoming' || t.status === 'scheduled').length;

              return {
                category: 'MOCK TESTS',
                tone: 'neutral',
                headline: `${fmt(arr.length)} mock test${arr.length === 1 ? '' : 's'} created`,
                detail: `${fmt(active)} active, ${fmt(draft)} in draft${upcoming > 0 ? `, ${fmt(upcoming)} upcoming` : ''}.`,
                action: 'Manage mock tests',
                to: '/mock-tests',
              };
            }}
          />

          {/* Attention Cell 3: Student Reach */}
          <AttentionCell
            resource={reach}
            onRetry={reloadReach}
            build={(stats) => {
              const total = Number(stats?.totalUsers || 0);
              const reachable = Number(stats?.usersWithTokens || 0);
              const rate = total > 0 ? Math.round((reachable / total) * 100) : 0;

              return {
                category: 'AUDIENCE REACH',
                tone: 'neutral',
                headline: `${fmt(reachable)} reachable student devices`,
                detail: `${rate}% of registered students have push notifications active (${fmt(total)} registered).`,
                action: 'Send a notification',
                to: '/notifications',
              };
            }}
          />
        </Box>
      </Panel>

      {/* Main Grid: Coverage Matrix (Left) & Sidebar Panels (Right) */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 340px' },
          alignItems: 'start',
        }}
      >
        {/* Left: Question Coverage Ledger */}
        <Panel>
          <PanelHeader
            title="Question coverage"
            description={
              ledger.status === 'ready'
                ? `${fmt(totals.chapters)} chapters in ${fmt(totals.subjects)} subjects hold ${fmt(totals.questions)} questions. Click any bubble to open that chapter.`
                : 'Each bubble represents a chapter. Click one to open its question editor.'
            }
          />
          <Ledger
            board={board}
            classId={classId}
            resource={ledger}
            onRetry={reloadLedger}
          />
          <Box sx={{ px: 3, py: 1.75, borderTop: `1px solid ${tokens.rule}` }}>
            <Legend />
          </Box>
        </Panel>

        {/* Right: Quick Actions & System Status */}
        <Box sx={{ display: 'grid', gap: 3 }}>
          {/* Quick Actions Panel */}
          <Panel>
            <PanelHeader
              title="Quick actions"
              description="Direct shortcuts to high-frequency management workflows."
            />
            <Box sx={{ p: 1 }}>
              {quickActions.map(({ label, icon: Icon, to }) => (
                <Box
                  key={to}
                  component={Link}
                  to={to}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    px: 2,
                    py: 1.25,
                    borderRadius: '8px',
                    color: 'text.primary',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 150ms ease',
                    '&:hover': {
                      bgcolor: tokens.inkTint,
                      color: tokens.ink,
                      '& svg': { color: tokens.ink },
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Icon size={16} color={tokens.muted} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {label}
                    </span>
                  </Box>
                  <ChevronRight size={14} color={tokens.muted} style={{ flexShrink: 0 }} />
                </Box>
              ))}
            </Box>
          </Panel>

          {/* System Status Panel */}
          <SystemPanel />
        </Box>
      </Box>
    </Box>
  );
}
