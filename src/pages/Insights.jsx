import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as ChartTooltipHost, XAxis, YAxis } from 'recharts';
import { Panel, PanelHeader } from '@/components/Panel';
import { getJson, useResource } from '@/lib/useResource';
import { tokens } from '@/theme';
import {
  ACCENT, BAD, BarList, Body, CONTEXT, CREDIT_LABELS, DayTooltip, FAILURE_ALERT_PCT, Facts, LineKey, METHOD_LABELS, RANGES,
  Stat, axisProps, compact, fmt, fmtDay, oneDecimal, rupees, stat, tickGap,
} from './insights/shared';
import QuestionQuality from './insights/QuestionQuality';
import Retention from './insights/Retention';

// ── sections ─────────────────────────────────────────────────────────────────────
function GrowthPanel({ resource, onRetry, range }) {
  const [view, setView] = useState('chart');
  return (
    <Panel>
      <PanelHeader
        title="Student growth"
        description={`New students and students who practised each day, last ${range} days.`}
        action={
          <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => v && setView(v)} aria-label="Chart or table">
            <ToggleButton value="chart" sx={{ px: 1.25 }}>Chart</ToggleButton>
            <ToggleButton value="table" sx={{ px: 1.25 }}>Table</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <Body resource={resource} onRetry={onRetry} height={280}>
        {({ series }) => view === 'table' ? (
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow><TableCell>Day</TableCell><TableCell align="right">New students</TableCell><TableCell align="right">Students who practised</TableCell></TableRow></TableHead>
              <TableBody>
                {[...series].reverse().map((r) => (
                  <TableRow key={r.date}><TableCell>{fmtDay(r.date)}</TableCell><TableCell align="right">{fmt(r.signups)}</TableCell><TableCell align="right">{fmt(r.practising)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <LineKey color={ACCENT} label="Students who practised" />
              <LineKey color={CONTEXT} label="New students" />
            </Box>
            <Box role="img" aria-label={`Line chart of daily new students and students who practised over ${range} days. Use the table view for exact values.`} sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={tokens.rule} />
                  <XAxis dataKey="date" tickFormatter={fmtDay} interval={tickGap(series.length)} {...axisProps} />
                  <YAxis allowDecimals={false} tickFormatter={compact} width={44} {...axisProps} axisLine={false} />
                  <ChartTooltipHost content={<DayTooltip />} cursor={{ stroke: '#8A91A3', strokeWidth: 1 }} />
                  <Line type="monotone" dataKey="signups" name="New students" stroke={CONTEXT} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: CONTEXT, stroke: '#fff', strokeWidth: 2 }} strokeLinecap="round" />
                  <Line type="monotone" dataKey="practising" name="Students who practised" stroke={ACCENT} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }} strokeLinecap="round" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}
      </Body>
    </Panel>
  );
}

function AdoptionPanel({ resource, onRetry }) {
  return (
    <Panel>
      <PanelHeader title="How students use PrepOne" description="Share of all students who do each thing." />
      <Body resource={resource} onRetry={onRetry} height={200}>
        {({ overview: o, mockTests: m, adaptivePractice: a }) => {
          const total = o.totalStudents;
          const row = (label, value) => ({ label, value, valueLabel: `${fmt(value)} (${total ? Math.round((value / total) * 100) : 0}%)` });
          return <BarList rows={[row('All students', total), row('Active in the last 30 days', o.activeLast30Days), row('Took a mock test', m.studentsAttempted), row('Used adaptive practice', a.studentsUsed), row('Subscribed or premium', o.premiumUsers)]} />;
        }}
      </Body>
    </Panel>
  );
}

function RevenuePanel({ resource, onRetry, range }) {
  return (
    <Panel>
      <PanelHeader title="Subscriptions and revenue" description="Current subscribers by plan. Revenue is an estimate from list prices." />
      <Body resource={resource} onRetry={onRetry} height={260}>
        {({ plans, totals, newSubscriptions, note }) => (
          <>
            {(totals.onHold > 0 || totals.expiringIn7d > 0 || totals.inGrace > 0) && (
              <Box sx={{ px: 2, py: 1.25, bgcolor: tokens.redTint, borderBottom: `1px solid ${tokens.rule}`, fontSize: 13 }}>
                <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, color: '#7B1B1B' }}>Revenue you can still keep: </Typography>
                {[
                  totals.onHold > 0 && `${fmt(totals.onHold)} with a failed payment (on hold)`,
                  totals.inGrace > 0 && `${fmt(totals.inGrace)} in the grace period`,
                  totals.expiringIn7d > 0 && `${fmt(totals.expiringIn7d)} expiring within 7 days without auto-renew`,
                ].filter(Boolean).join(', ')}.
              </Box>
            )}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Plan</TableCell><TableCell align="right">Paying</TableCell><TableCell align="right">In grace</TableCell>
                  <TableCell align="right">On hold</TableCell><TableCell align="right">Cancelled, still active</TableCell><TableCell align="right">Est. per month</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.length === 0 && <TableRow><TableCell colSpan={6}>No Google Play subscriptions yet.</TableCell></TableRow>}
                {plans.map((p) => (
                  <TableRow key={p.productId}>
                    <TableCell sx={{ fontWeight: 600 }}>{p.label}{p.price != null && <Typography component="span" variant="caption" color="text.secondary">{` ${rupees(p.price)}`}</Typography>}</TableCell>
                    <TableCell align="right">{fmt(p.paying)}</TableCell><TableCell align="right">{fmt(p.grace)}</TableCell>
                    <TableCell align="right" sx={{ color: p.onHold ? BAD : undefined, fontWeight: p.onHold ? 600 : 400 }}>{fmt(p.onHold)}</TableCell>
                    <TableCell align="right">{fmt(p.cancelledWithAccess)}</TableCell><TableCell align="right">{rupees(p.estMonthlyRevenue)}</TableCell>
                  </TableRow>
                ))}
                {plans.length > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(totals.payingSubscribers)}</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(totals.inGrace)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(totals.onHold)}</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(totals.cancelledWithAccess)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{rupees(totals.estMonthlyRevenue)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Box sx={{ px: 2, pt: 2, pb: 1 }}>
              <Typography variant="subtitle2">{`${fmt(newSubscriptions.total)} new subscriptions in the last ${range} days`}</Typography>
              <Box role="img" aria-label={`Bar chart of new subscriptions per day over ${range} days`} sx={{ height: 110, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={newSubscriptions.series} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={tokens.rule} />
                    <XAxis dataKey="date" tickFormatter={fmtDay} interval={tickGap(newSubscriptions.series.length)} {...axisProps} />
                    <YAxis allowDecimals={false} width={44} {...axisProps} axisLine={false} />
                    <ChartTooltipHost content={<DayTooltip />} cursor={{ fill: 'rgba(63, 33, 112, 0.06)' }} />
                    <Bar dataKey="count" name="New subscriptions" fill={ACCENT} maxBarSize={14} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, pb: 1.5 }}>
              {`${note} Also on free access: ${fmt(totals.freeAccess.referral)} from referrals, ${fmt(totals.freeAccess.institute)} from institutes, ${fmt(totals.freeAccess.admin)} granted by an admin.`}
            </Typography>
          </>
        )}
      </Body>
    </Panel>
  );
}

function LearningPanel({ analytics, learning, onRetryAnalytics, onRetryLearning }) {
  return (
    <Panel>
      <PanelHeader title="Learning results" description="Across all mock tests and adaptive practice." />
      <Body resource={analytics} onRetry={onRetryAnalytics} height={180}>
        {({ mockTests: m, adaptivePractice: a }) => (
          <Facts rows={[
            ['Mock tests taken', fmt(m.totalTestsTaken)],
            ['Average mock test accuracy', `${oneDecimal(m.avgAccuracy)}%`],
            ['Average time per mock test', `${oneDecimal(m.avgTimeTakenMinutes)} min`],
            ['Practice questions answered', fmt(a.totalQuestionsAnswered)],
            ['Practice answers correct', `${oneDecimal(a.overallCorrectRate)}%`],
          ]} />
        )}
      </Body>
      <Box sx={{ borderTop: `1px solid ${tokens.rule}` }}>
        <Body resource={learning} onRetry={onRetryLearning} height={50}>
          {({ struggling, strong, minTests, studentsWithEnoughTests }) => (
            <Facts rows={[
              [`Students averaging under ${struggling.threshold}%`, studentsWithEnoughTests ? `${fmt(struggling.count)} (${struggling.share}%)` : 'Not enough data', struggling.share >= 25 ? 'bad' : undefined],
              [`Students averaging ${strong.threshold}% or more`, studentsWithEnoughTests ? `${fmt(strong.count)} (${strong.share}%)` : 'Not enough data'],
              ['Counted from students with', `${minTests}+ mock tests`],
            ]} />
          )}
        </Body>
      </Box>
    </Panel>
  );
}

function WeakChaptersPanel({ resource, onRetry }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const open = async (row) => {
    setBusy(row.id);
    setError('');
    try {
      const chapter = await getJson(`/utility/chapter/${row.id}`);
      navigate(`/questions/${chapter.studentClass}/${chapter.subjectId}/${row.id}`);
    } catch {
      setError("Couldn't open that chapter. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel>
      <PanelHeader title="Chapters students struggle with" description="How often a chapter shows up as a weak topic in mock test results. Select one to improve its questions." />
      <Body resource={resource} onRetry={onRetry} height={220}>
        {({ insights }) => (
          <BarList
            rows={(insights?.topWeakChapters || []).map((c) => ({ id: c.chapterId, label: c.chapterName || 'Unnamed chapter', value: c.weakCount }))}
            onSelect={open}
            busyId={busy}
            emptyText="No weak chapters yet. They appear once students finish mock tests."
          />
        )}
      </Body>
      {error && <Typography variant="body2" sx={{ px: 2, pb: 1.5, color: BAD }} role="alert">{error}</Typography>}
    </Panel>
  );
}

function CreditsPanel({ resource, onRetry, range }) {
  return (
    <Panel>
      <PanelHeader title="Credits" description={`Where credits came from and where they went, last ${range} days.`} />
      <Body resource={resource} onRetry={onRetry} height={200}>
        {({ byType, totals }) => {
          const rows = (list) => list.map((t) => ({ id: t.type, label: CREDIT_LABELS[t.type] || t.type, value: Math.abs(t.credits), valueLabel: fmt(Math.abs(t.credits)) }));
          return (
            <>
              <Facts rows={[['Credits earned', fmt(totals.earned)], ['Credits spent', fmt(totals.spent)], ['Rewarded ads watched', fmt(totals.adsWatched)], ['Evaluations paid for', fmt(totals.evaluationsPaidFor)]]} />
              <Box sx={{ borderTop: `1px solid ${tokens.rule}` }}>
                <Typography variant="subtitle2" sx={{ px: 2, pt: 1.5 }}>Earned</Typography>
                <BarList rows={rows(byType.filter((t) => t.credits > 0))} emptyText="No credits earned in this period." />
                <Typography variant="subtitle2" sx={{ px: 2 }}>Spent</Typography>
                <BarList rows={rows(byType.filter((t) => t.credits < 0))} color={CONTEXT} emptyText="No credits spent in this period." />
              </Box>
            </>
          );
        }}
      </Body>
    </Panel>
  );
}

function EvaluatorPanel({ resource, onRetry, range }) {
  return (
    <Panel>
      <PanelHeader title="AI answer evaluation" description={`Handwritten answer sheets marked by the evaluator, last ${range} days.`} />
      <Body resource={resource} onRetry={onRetry} height={260}>
        {({ totals: t, series }) => (
          <>
            <Facts rows={[
              ['Evaluations', fmt(t.evaluations)],
              ['Failed', `${fmt(t.failed)} (${t.failureRatePct}%)`, t.failureRatePct >= FAILURE_ALERT_PCT ? 'bad' : undefined],
              ['Marks changed by a teacher', `${fmt(t.overridden)} (${t.overrideRatePct}%)`],
              ['Flagged unfair by students', `${fmt(t.flaggedUnfair)} (${t.flaggedUnfairPct}%)`],
              ['Average time to finish', `${t.avgTurnaroundSec} sec`],
            ]} />
            <Box sx={{ px: 2, pb: 2, borderTop: `1px solid ${tokens.rule}`, pt: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <LineKey color={ACCENT} label="Completed" />
                <LineKey color={BAD} label="Failed" />
              </Box>
              <Box role="img" aria-label={`Stacked bar chart of completed and failed evaluations per day over ${range} days`} sx={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={tokens.rule} />
                    <XAxis dataKey="date" tickFormatter={fmtDay} interval={tickGap(series.length)} {...axisProps} />
                    <YAxis allowDecimals={false} width={44} {...axisProps} axisLine={false} />
                    <ChartTooltipHost content={<DayTooltip />} cursor={{ fill: 'rgba(63, 33, 112, 0.06)' }} />
                    <Bar dataKey="completed" name="Completed" stackId="e" fill={ACCENT} maxBarSize={14} stroke="#fff" strokeWidth={1} />
                    <Bar dataKey="failed" name="Failed" stackId="e" fill={BAD} maxBarSize={14} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </>
        )}
      </Body>
    </Panel>
  );
}

function ReferralsPanel({ resource, onRetry, range }) {
  return (
    <Panel>
      <PanelHeader title="Referrals" description={`Friends invited by students, last ${range} days.`} />
      <Body resource={resource} onRetry={onRetry} height={200}>
        {({ totals: t, byMethod }) => (
          <>
            <Facts rows={[
              ['Completed referrals', `${fmt(t.completed)} (${t.shareOfSignupsPct}% of new students)`],
              ['Pending', fmt(t.pending)],
              ['Revoked', fmt(t.revoked)],
              ['Credits given as rewards', fmt(t.creditsGranted)],
              ['Premium days given as rewards', fmt(t.premiumDaysGranted)],
            ]} />
            <Box sx={{ borderTop: `1px solid ${tokens.rule}` }}>
              <BarList rows={byMethod.map((m) => ({ id: m.method, label: METHOD_LABELS[m.method] || m.method, value: m.n }))} emptyText="No completed referrals in this period." />
            </Box>
          </>
        )}
      </Body>
    </Panel>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────────
function OverviewTab({ range, tick, onUpdated }) {
  const fresh = tick > 0 ? '&refresh=1' : '';
  const insight = (name) => (signal) => getJson(`/analytics/insights/${name}?days=${range}${fresh}`, signal);

  const [analytics, reloadAnalytics] = useResource((signal) => getJson('/analytics', signal), [tick]);
  const [learning, reloadLearning] = useResource((signal) => getJson(`/analytics/insights/learning${tick > 0 ? '?refresh=1' : ''}`, signal), [tick]);
  const [growth, reloadGrowth] = useResource(insight('growth'), [range, tick]);
  const [revenue, reloadRevenue] = useResource(insight('revenue'), [range, tick]);
  const [credits, reloadCredits] = useResource(insight('credits'), [range, tick]);
  const [evaluator, reloadEvaluator] = useResource(insight('evaluator'), [range, tick]);
  const [referrals, reloadReferrals] = useResource(insight('referrals'), [range, tick]);

  const signedPct = (n) => `${n > 0 ? '+' : ''}${n}%`;
  const generatedAt = growth.data?.generatedAt;
  useEffect(() => { onUpdated(generatedAt); }, [generatedAt, onUpdated]);

  return (
    <>
      <Box sx={{ display: 'grid', gap: '1px', bgcolor: tokens.rule, border: `1px solid ${tokens.rule}`, borderRadius: '6px', overflow: 'hidden', mb: 2.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' } }}>
        <Stat resource={analytics} pick={stat('Students', (d) => ({ value: fmt(d.overview.totalStudents), note: `${fmt(d.overview.activeLast7Days)} active in the last 7 days (${d.overview.engagementRate7d}%)` }))} />
        <Stat resource={growth} pick={stat(`New students, ${range} days`, (d) => ({ value: fmt(d.totals.signups), note: d.totals.signupsChangePct == null ? 'No earlier period to compare' : `${signedPct(d.totals.signupsChangePct)} vs the ${range} days before` }))} />
        <Stat resource={growth} pick={stat('Students who practised', (d) => ({ value: fmt(d.totals.practisingStudents), note: `${d.totals.practisingShare}% of all students` }))} />
        <Stat resource={revenue} pick={stat('Paying subscribers', (d) => ({ value: fmt(d.totals.payingSubscribers), note: `${d.totals.conversionPct}% of all students` }))} />
        <Stat resource={revenue} pick={stat('Estimated revenue per month', (d) => ({ value: rupees(d.totals.estMonthlyRevenue), note: 'List prices, before Play fees' }))} />
      </Box>

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 3fr) minmax(0, 2fr)' }, alignItems: 'start' }}>
        <GrowthPanel resource={growth} onRetry={reloadGrowth} range={range} />
        <AdoptionPanel resource={analytics} onRetry={reloadAnalytics} />

        <RevenuePanel resource={revenue} onRetry={reloadRevenue} range={range} />
        <LearningPanel analytics={analytics} learning={learning} onRetryAnalytics={reloadAnalytics} onRetryLearning={reloadLearning} />

        <WeakChaptersPanel resource={analytics} onRetry={reloadAnalytics} />
        <CreditsPanel resource={credits} onRetry={reloadCredits} range={range} />

        <EvaluatorPanel resource={evaluator} onRetry={reloadEvaluator} range={range} />
        <ReferralsPanel resource={referrals} onRetry={reloadReferrals} range={range} />
      </Box>
    </>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'quality', label: 'Question quality' },
  { id: 'retention', label: 'Retention' },
];

export default function Insights() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'overview';
  const [range, setRange] = useState(30);
  const [tick, setTick] = useState(0); // > 0 means "skip the server's cache"
  const [updatedAt, setUpdatedAt] = useState(null);

  const changeRange = (_, value) => {
    if (!value) return;
    setRange(value);
    setTick(0);
  };
  const changeTab = (_, value) => {
    setUpdatedAt(null);
    setParams(value === 'overview' ? {} : { tab: value }, { replace: true });
  };

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1 }}>
        <Box>
          <Typography variant="h4" component="h1">Business insights</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            How the student base, content and learning are doing. Counts only, no student names.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {updatedAt && (
            <Typography variant="caption" color="text.secondary">
              {`Updated ${new Date(updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
            </Typography>
          )}
          <Button variant="outlined" size="small" startIcon={<RefreshCw size={14} />} onClick={() => setTick((n) => n + 1)}>Refresh</Button>
          {tab !== 'retention' && (
            <ToggleButtonGroup exclusive size="small" value={range} onChange={changeRange} aria-label="Time range">
              {RANGES.map((d) => <ToggleButton key={d} value={d} sx={{ px: 1.5 }}>{`${d} days`}</ToggleButton>)}
            </ToggleButtonGroup>
          )}
        </Box>
      </Box>

      <Tabs value={tab} onChange={changeTab} aria-label="Insights sections" sx={{ mb: 2.5, borderBottom: `1px solid ${tokens.rule}` }}>
        {TABS.map((t) => <Tab key={t.id} value={t.id} label={t.label} id={`insights-tab-${t.id}`} aria-controls="insights-panel" />)}
      </Tabs>

      <Box id="insights-panel" role="tabpanel" aria-labelledby={`insights-tab-${tab}`}>
        {tab === 'overview' && <OverviewTab range={range} tick={tick} onUpdated={setUpdatedAt} />}
        {tab === 'quality' && <QuestionQuality range={range} tick={tick} onUpdated={setUpdatedAt} />}
        {tab === 'retention' && <Retention tick={tick} onUpdated={setUpdatedAt} />}
      </Box>
    </Box>
  );
}
