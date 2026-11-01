import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, FormControlLabel, IconButton, LinearProgress, Menu, MenuItem,
  Skeleton, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Download, ListFilter, MoreHorizontal, Pencil, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '@/components/Panel';
import { APPROVE_NOTES, MIN_REASON, REJECT_REASONS, advanceIndex, buildCsv, reviewState, stepIndex } from '@/lib/review';
import { useScope } from '@/lib/scope-context';
import { loadSyllabus } from '@/lib/syllabusData';
import { getJson, sendJson } from '@/lib/useResource';
import { tokens } from '@/theme';
import QuestionEditor from './questions/QuestionEditor';
import QueuePanel from './review/QueuePanel';
import ReviewCard from './review/ReviewCard';
import SuggestDrawer, { useSuggestions } from './review/SuggestDrawer';
import useQueue from './review/useQueue';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const FILTERS = [['all', 'All'], ['unreviewed', 'Not reviewed'], ['approved', 'Approved'], ['rejected', 'Rejected']];
const UNDO_MS = 8000;
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

const sourceFromParams = (p) => {
  switch (p.get('source')) {
    case 'chapter': return p.get('chapter') && p.get('subject') ? { type: 'chapter', subjectId: p.get('subject'), chapterId: p.get('chapter') } : null;
    case 'subject': return p.get('subject') ? { type: 'subject', subjectId: p.get('subject') } : null;
    case 'test': return p.get('test') ? { type: 'test', testId: p.get('test') } : null;
    case 'unreviewed': case 'rejected': case 'flagged': return { type: p.get('source') };
    default: return null;
  }
};
const paramsFromSource = (s) => {
  if (!s) return {};
  if (s.type === 'chapter') return { source: 'chapter', subject: s.subjectId, chapter: s.chapterId };
  if (s.type === 'subject') return { source: 'subject', subject: s.subjectId };
  if (s.type === 'test') return { source: 'test', test: s.testId };
  return { source: s.type };
};

export default function Review() {
  const { board, classId } = useScope();
  const [params, setParams] = useSearchParams();
  const source = useMemo(() => sourceFromParams(params), [params]);
  const filter = FILTERS.some(([v]) => v === params.get('filter')) ? params.get('filter') : 'all';

  // ── syllabus, progress, tests for the left panel ──
  const [syllabus, setSyllabus] = useState({ status: 'loading', subjects: [] });
  useEffect(() => {
    const controller = new AbortController();
    setSyllabus((s) => ({ ...s, status: 'loading' }));
    loadSyllabus(board, classId, controller.signal)
      .then((subjects) => setSyllabus({ status: 'ready', subjects }))
      .catch((err) => { if (err?.name !== 'AbortError') setSyllabus({ status: 'error', subjects: [] }); });
    return () => controller.abort();
  }, [board, classId]);

  const [progress, setProgress] = useState({});
  const progressTimer = useRef(null);
  const loadProgress = useCallback(async () => {
    try {
      const data = await getJson(`/review/progress?board=${board}&classId=${classId}`, undefined, { raw: true });
      setProgress(Object.fromEntries((data.chapters || []).map((c) => [c.chapterId, c])));
    } catch { /* progress is a convenience */ }
  }, [board, classId]);
  useEffect(() => { loadProgress(); }, [loadProgress]);
  const refreshProgressSoon = () => { clearTimeout(progressTimer.current); progressTimer.current = setTimeout(loadProgress, 1200); };
  useEffect(() => () => clearTimeout(progressTimer.current), []);

  const [tests, setTests] = useState([]);
  useEffect(() => {
    getJson(`/tests/admin/list?classId=${classId}&board=${board}`).then((list) => setTests((Array.isArray(list) ? list : []).filter((t) => !t.isPYQ))).catch(() => setTests([]));
  }, [board, classId]);

  // ── the queue ──
  const queue = useQueue(source, filter, { board, classId });
  const visible = useMemo(
    () => (queue.isServerQueue || filter === 'all' ? queue.questions : queue.questions.filter((q) => reviewState(q) === filter)),
    [queue.questions, queue.isServerQueue, filter]
  );
  const [index, setIndex] = useState(0);
  const sourceKey = JSON.stringify([source, board, classId]);
  const current = visible[Math.min(index, visible.length - 1)] || null;
  const safeIndex = current ? visible.indexOf(current) : 0;

  // Back to where you stopped last time in this queue
  useEffect(() => {
    if (queue.status !== 'ready' || visible.length === 0) return;
    let saved = null;
    try { saved = localStorage.getItem(`review.pos.${sourceKey}`); } catch { /* storage unavailable */ }
    const at = saved ? visible.findIndex((q) => q._id === saved) : -1;
    setIndex(at >= 0 ? at : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.status === 'ready', sourceKey, filter]);
  useEffect(() => {
    if (!current) return;
    try { localStorage.setItem(`review.pos.${sourceKey}`, current._id); } catch { /* storage unavailable */ }
  }, [current, sourceKey]);
  // Fetch the next page when the reviewer gets close to the end
  useEffect(() => { if (queue.hasMore && visible.length - safeIndex <= 5) queue.loadMore(); }, [safeIndex, visible.length, queue.hasMore]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── view state ──
  const [lang, setLang] = useState('en');
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [usage, setUsage] = useState(null);
  const [session, setSession] = useState({ approved: 0, rejected: 0 });
  const [editorOpen, setEditorOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const reasonRef = useRef(null);

  useEffect(() => { setRejecting(false); setReason(''); setNote(''); }, [current?._id]);
  useEffect(() => { if (rejecting) setTimeout(() => reasonRef.current?.focus(), 0); }, [rejecting]);

  const suggestions = useSuggestions({ onApplied: queue.replaceQuestion });

  const pickSource = (s) => { setUsage(null); setParams(paramsFromSource(s), { replace: true }); };
  const setFilter = (value) => {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete('filter'); else next.set('filter', value);
    setParams(next, { replace: true });
  };

  const totals = useMemo(() => Object.values(progress).reduce((t, c) => ({ total: t.total + c.total, approved: t.approved + c.approved, rejected: t.rejected + c.rejected }), { total: 0, approved: 0, rejected: 0 }), [progress]);
  const unreviewedTotal = totals.total - totals.approved - totals.rejected;

  const primarySelectValue = useMemo(() => {
    if (!source) return '';
    if (source.type === 'chapter' || source.type === 'subject') return `subject:${source.subjectId}`;
    if (source.type === 'test') return `test:${source.testId}`;
    return source.type;
  }, [source]);

  const activeSubjectObj = useMemo(() => {
    if (!source || (source.type !== 'chapter' && source.type !== 'subject')) return null;
    return syllabus.subjects.find((s) => s._id === source.subjectId) || null;
  }, [source, syllabus.subjects]);

  const handlePrimarySelectChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    if (val.startsWith('subject:')) {
      const sId = val.replace('subject:', '');
      pickSource({ type: 'subject', subjectId: sId });
    } else if (val.startsWith('test:')) {
      const tId = val.replace('test:', '');
      pickSource({ type: 'test', testId: tId });
    } else {
      pickSource({ type: val });
    }
  };

  const handleChapterSelectChange = (e) => {
    const val = e.target.value;
    if (!activeSubjectObj) return;
    if (!val || val === 'all') {
      pickSource({ type: 'subject', subjectId: activeSubjectObj._id });
    } else {
      pickSource({ type: 'chapter', subjectId: activeSubjectObj._id, chapterId: val });
    }
  };

  const go = useCallback((dir) => {
    const next = stepIndex(visible, safeIndex, dir);
    if (next !== -1) setIndex(next);
  }, [visible, safeIndex]);

  // ── decisions ──
  const send = async (question, status, remark, expectedTimestamp) => {
    const res = await sendJson('PATCH', `/review/question/${question._id}`, { status, remark, expectedTimestamp: expectedTimestamp ?? null });
    queue.applyAudit(question._id, res.audit);
    refreshProgressSoon();
    return res;
  };

  const undo = async (question, previous, expected) => {
    try {
      await send(question, previous?.status || null, previous?.remark || '', expected);
      const undone = question.audit?.status;
      if (undone) setSession((s) => ({ ...s, [undone]: Math.max(0, s[undone] - 1) }));
      const at = visible.findIndex((q) => q._id === question._id);
      if (at >= 0) setIndex(at);
      toast.success('Decision undone');
    } catch (err) {
      toast.error(err.status === 409 ? 'Someone else has reviewed this question since, so it was not undone.' : err.message);
    }
  };

  const decide = async (status, remark, override) => {
    const q = current;
    if (!q || saving) return;
    if (status === 'rejected' && remark.trim().length < MIN_REASON) { setRejecting(true); return; }
    setSaving(true);
    const previous = q.audit || null;
    try {
      const res = await send(q, status, remark.trim(), override ?? previous?.timestamp);
      setSession((s) => ({ ...s, [status]: s[status] + 1 }));
      setUsage(status === 'rejected' && res.usedInTests?.count ? { question: q, ...res.usedInTests } : null);
      toast(status === 'approved' ? 'Approved' : 'Rejected', {
        duration: UNDO_MS,
        action: { label: 'Undo', onClick: () => undo({ ...q, audit: res.audit }, previous, res.audit?.timestamp) },
      });
      setRejecting(false);
      if (autoAdvance) setIndex(advanceIndex(visible, safeIndex));
    } catch (err) {
      if (err.status === 409) setConflict({ question: q, audit: err.data?.audit || null, status, remark });
      else toast.error(err.message || "The decision wasn't saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const keepTheirDecision = () => { queue.applyAudit(conflict.question._id, conflict.audit); setConflict(null); };
  const overrule = () => { const c = conflict; setConflict(null); decide(c.status, c.remark, c.audit?.timestamp ?? null); };

  // ── shortcuts ──
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable || editorOpen || suggestOpen || summaryOpen || conflict) return;
      if (e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') go(1);
      else if (e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') go(-1);
      else if (e.key === 'a' || e.key === 'A') { e.preventDefault(); decide('approved', note); }
      else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); setRejecting(true); }
      else if (e.key === 'e' || e.key === 'E') setEditorOpen(true);
      else if (e.key === 's' || e.key === 'S') { setSuggestOpen(true); if (current) suggestions.suggestOne(current); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── edit ──
  const subject = current ? syllabus.subjects.find((s) => s._id === String(current.subjectId)) || { _id: String(current.subjectId), name: current.subjectName, languageRequirement: 'both' } : null;
  const afterEdit = async () => {
    setEditorOpen(false);
    try {
      const data = await sendJson('POST', '/review/by-ids', { ids: [current._id] });
      if (data.questions[0]) queue.replaceQuestion(current._id, data.questions[0]);
    } catch { toast.error('Saved, but the screen could not refresh. Reload to see the latest.'); }
  };

  const exportCsv = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([buildCsv(queue.questions)], { type: 'text/csv;charset=utf-8;' }));
    link.download = `question-review-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const unreviewedHere = visible.filter((q) => reviewState(q) === 'unreviewed');
  const counts = queue.counts;
  const reviewedShare = counts.all ? ((counts.approved + counts.rejected) / counts.all) * 100 : 0;
  const title = { chapter: 'Chapter', subject: 'Subject', unreviewed: 'Not reviewed yet', rejected: 'Rejected questions', flagged: 'Students keep getting these wrong', test: queue.title || 'Mock test' }[source?.type] || '';
  const chapterName = source?.type === 'chapter' ? syllabus.subjects.flatMap((s) => s.chapters).find((c) => c._id === source.chapterId)?.name : null;
  const subjectName = source?.type === 'subject' ? syllabus.subjects.find((s) => s._id === source.subjectId)?.name : null;
  const heading = source?.type === 'chapter' ? chapterName || title : source?.type === 'subject' ? `All of ${subjectName || 'the subject'}` : title;

  return (
    <Box sx={{ maxWidth: 1360, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'flex-end' }, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
        <Box sx={{ minWidth: 0, maxWidth: { xs: '100%', sm: 600 } }}>
          <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' } }}>Review questions</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: 13, sm: 14 } }}>{`Check each question and approve or reject it. Rejected questions are hidden from students in ${board} Class ${classId}.`}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
          <Button variant="outlined" size="small" sx={{ minHeight: { xs: 44, sm: 36 }, flexGrow: { xs: 1, sm: 0 } }} startIcon={<Download size={14} />} onClick={() => setSummaryOpen(true)} disabled={!source}>Summary & export</Button>
          <IconButton aria-label="More actions" sx={{ minWidth: 44, minHeight: 44 }} onClick={(e) => setMenuAnchor(e.currentTarget)} disabled={!source}><MoreHorizontal size={18} /></IconButton>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem disabled={unreviewedHere.length === 0} onClick={() => { setMenuAnchor(null); setSuggestOpen(true); suggestions.suggestMany(unreviewedHere).then((r) => r.capped && toast.info('Checked the first 50. Run it again for the rest.')); }}>
              <Sparkles size={14} style={{ marginRight: 8 }} />{`Suggest LaTeX fixes for ${fmt(Math.min(unreviewedHere.length, 50))} unreviewed questions`}
            </MenuItem>
            <MenuItem onClick={() => { setMenuAnchor(null); setSuggestOpen(true); }}>Open the suggestions list</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Mobile Queue / Subject & Chapter Pickers */}
      <Box sx={{ display: { xs: 'grid', md: 'none' }, gap: 1.25, mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: activeSubjectObj ? '1fr 1fr' : '1fr', gap: 1 }}>
          <TextField
            select
            size="small"
            label="Queue / Subject"
            value={primarySelectValue}
            onChange={handlePrimarySelectChange}
            SelectProps={{ sx: { minHeight: 44 } }}
          >
            <MenuItem value="" disabled>Select a queue or subject...</MenuItem>
            <MenuItem disabled sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', bgcolor: '#F8F9FB' }}>
              Smart Queues
            </MenuItem>
            <MenuItem value="unreviewed">
              Not reviewed yet {unreviewedTotal > 0 ? `(${fmt(unreviewedTotal)})` : ''}
            </MenuItem>
            <MenuItem value="flagged">
              Students keep getting wrong
            </MenuItem>
            <MenuItem value="rejected">
              Rejected questions {totals.rejected > 0 ? `(${fmt(totals.rejected)})` : ''}
            </MenuItem>

            {syllabus.subjects.length > 0 && (
              <MenuItem disabled sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', bgcolor: '#F8F9FB' }}>
                Subjects
              </MenuItem>
            )}
            {syllabus.subjects.map((s) => {
              const sub = s.chapters.reduce(
                (t, c) => ({
                  total: t.total + (progress[c._id]?.total || 0),
                  done: t.done + (progress[c._id] ? progress[c._id].approved + progress[c._id].rejected : 0),
                }),
                { total: 0, done: 0 }
              );
              return (
                <MenuItem key={s._id} value={`subject:${s._id}`}>
                  {s.name} {sub.total ? `(${fmt(sub.done)}/${fmt(sub.total)})` : ''}
                </MenuItem>
              );
            })}

            {tests.length > 0 && (
              <MenuItem disabled sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', bgcolor: '#F8F9FB' }}>
                Mock Tests
              </MenuItem>
            )}
            {tests.map((t) => (
              <MenuItem key={t._id} value={`test:${t._id}`}>
                {t.title} ({t.questionCount})
              </MenuItem>
            ))}
          </TextField>

          {activeSubjectObj && (
            <TextField
              select
              size="small"
              label="Chapter"
              value={source?.type === 'chapter' ? source.chapterId : 'all'}
              onChange={handleChapterSelectChange}
              SelectProps={{ sx: { minHeight: 44 } }}
            >
              <MenuItem value="all">{`All of ${activeSubjectObj.name}`}</MenuItem>
              {activeSubjectObj.chapters.map((c) => {
                const p = progress[c._id] || { total: 0, approved: 0, rejected: 0 };
                const done = p.approved + p.rejected;
                return (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name} {p.total ? `(${done}/${p.total})` : ''}
                  </MenuItem>
                );
              })}
            </TextField>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ListFilter size={15} />}
            onClick={() => setMobileDrawerOpen(true)}
            sx={{ minHeight: 40, fontSize: 13, borderColor: tokens.rule }}
          >
            Browse all queues & progress
          </Button>
          {source && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {counts.all ? `${fmt(counts.all)} questions` : ''}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Main Grid: Desktop sidebar on left, Content on right */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '300px minmax(0, 1fr)' }, alignItems: 'start' }}>
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 16, alignSelf: 'start', height: 'calc(100vh - 64px - 48px)', minWidth: 0 }}>
          <QueuePanel syllabus={syllabus} progress={progress} tests={tests} source={source} onPick={pickSource} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          {!source && (
            <Panel sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Typography variant="h6">What would you like to review?</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2, maxWidth: 560 }}>Pick a chapter on the left, or start with the questions that most need a second look.</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="contained" sx={{ minHeight: 44 }} onClick={() => pickSource({ type: 'unreviewed' })}>Questions not reviewed yet</Button>
                <Button variant="outlined" sx={{ minHeight: 44 }} onClick={() => pickSource({ type: 'flagged' })}>Students keep getting these wrong</Button>
                <Button variant="outlined" sx={{ minHeight: 44 }} onClick={() => pickSource({ type: 'rejected' })}>Rejected questions</Button>
              </Box>
            </Panel>
          )}

          {source && (
            <Panel>
              <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, borderBottom: `1px solid ${tokens.rule}`, display: 'grid', gap: 1.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 600, minWidth: 0, wordBreak: 'break-word' }}>{heading}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, fontSize: { xs: 12, sm: 14 } }}>{counts.all ? `${fmt(counts.approved + counts.rejected)} of ${fmt(counts.all)} reviewed` : ''}</Typography>
                </Box>
                {counts.all > 0 && <LinearProgress variant="determinate" value={reviewedShare} sx={{ height: 6, borderRadius: 1 }} />}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  {!['unreviewed', 'rejected'].includes(source.type) ? (
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={filter}
                      onChange={(_, v) => v && setFilter(v)}
                      aria-label="Show"
                      sx={{
                        maxWidth: '100%',
                        overflowX: 'auto',
                        py: 0.25,
                        '& .MuiToggleButton-root': {
                          minHeight: { xs: 40, sm: 36 },
                          px: { xs: 1, sm: 1.25 },
                          whiteSpace: 'nowrap',
                          fontSize: { xs: 12.5, sm: 13 },
                        },
                      }}
                    >
                      {FILTERS.map(([v, label]) => <ToggleButton key={v} value={v}>{`${label} ${fmt(counts[v])}`}</ToggleButton>)}
                    </ToggleButtonGroup>
                  ) : <span />}
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={lang}
                      onChange={(_, v) => v && setLang(v)}
                      aria-label="Language"
                      sx={{
                        '& .MuiToggleButton-root': {
                          minHeight: { xs: 40, sm: 36 },
                          px: { xs: 1, sm: 1.25 },
                          fontSize: { xs: 12.5, sm: 13 },
                        },
                      }}
                    >
                      <ToggleButton value="en">English</ToggleButton>
                      <ToggleButton value="hi">हिंदी</ToggleButton>
                      <ToggleButton value="both">Both</ToggleButton>
                    </ToggleButtonGroup>
                    <FormControlLabel sx={{ m: 0 }} control={<Checkbox size="small" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} />} label={<Typography variant="body2" sx={{ fontSize: { xs: 13, sm: 14 } }}>Go to the next one</Typography>} />
                  </Box>
                </Box>
              </Box>

              {usage && (
                <Alert severity="warning" onClose={() => setUsage(null)} sx={{ m: 2, mb: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{`That question is in ${usage.count} mock test${usage.count === 1 ? '' : 's'}.`}</Typography>
                  <Typography variant="body2">Tests that are already published keep it. Swap it out so students don't see it:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                    {usage.tests.map((t) => <Button key={t._id} size="small" component={Link} to={`/mock-tests/${t._id}/edit`}>{`${t.title} (${t.status})`}</Button>)}
                  </Box>
                </Alert>
              )}

              {queue.status === 'error' ? (
                <Box sx={{ p: 3 }}>
                  <Typography sx={{ fontWeight: 600 }}>Couldn't load these questions</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{queue.error}</Typography>
                  <Button variant="outlined" size="small" sx={{ minHeight: 40 }} onClick={queue.reload}>Try again</Button>
                </Box>
              ) : queue.status === 'loading' ? (
                <Box sx={{ p: 2, display: 'grid', gap: 1.5 }}><Skeleton height={28} width="40%" /><Skeleton height={90} /><Skeleton height={44} /><Skeleton height={44} /></Box>
              ) : !current ? (
                <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                  <Typography sx={{ fontWeight: 600 }}>{filter === 'all' ? 'No questions here' : 'Nothing matches this view'}</Typography>
                  <Typography variant="body2" color="text.secondary">{source.type === 'flagged' ? 'No questions are flagged by student results yet. They appear once students have taken enough mock tests.' : 'Try another view or pick a different chapter.'}</Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', borderBottom: `1px solid ${tokens.rule}`, bgcolor: '#F8F9FB' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Previous (K or left arrow)">
                        <span>
                          <IconButton
                            size="medium"
                            aria-label="Previous question"
                            onClick={() => go(-1)}
                            disabled={safeIndex === 0}
                            sx={{ minWidth: 44, minHeight: 44 }}
                          >
                            <ChevronLeft size={20} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Typography variant="body2" sx={{ minWidth: { xs: 90, sm: 110 }, textAlign: 'center', fontWeight: 600, fontSize: { xs: 13, sm: 14 } }}>
                        {`Question ${fmt(safeIndex + 1)} of ${fmt(visible.length)}${queue.hasMore ? '+' : ''}`}
                      </Typography>
                      <Tooltip title="Next (J or right arrow)">
                        <span>
                          <IconButton
                            size="medium"
                            aria-label="Next question"
                            onClick={() => go(1)}
                            disabled={safeIndex >= visible.length - 1}
                            sx={{ minWidth: 44, minHeight: 44 }}
                          >
                            <ChevronRight size={20} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        sx={{ minHeight: { xs: 40, sm: 34 }, fontSize: { xs: 12.5, sm: 13 } }}
                        startIcon={<Sparkles size={14} />}
                        onClick={() => { setSuggestOpen(true); suggestions.suggestOne(current); }}
                      >
                        Suggest LaTeX fix
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ minHeight: { xs: 40, sm: 34 }, fontSize: { xs: 12.5, sm: 13 } }}
                        startIcon={<Pencil size={14} />}
                        onClick={() => setEditorOpen(true)}
                      >
                        Edit
                      </Button>
                    </Box>
                  </Box>

                  <Box sx={{ p: { xs: 2, sm: 2.5 } }}><ReviewCard question={current} lang={lang} flags={queue.flags[current._id]} /></Box>

                  <Box sx={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 10,
                    borderTop: `1px solid ${tokens.rule}`,
                    bgcolor: 'background.paper',
                    p: { xs: 1.5, sm: 2 },
                    pb: { xs: 'calc(12px + env(safe-area-inset-bottom, 0px))', sm: 2 },
                    display: 'grid',
                    gap: 1.25,
                    borderRadius: '0 0 6px 6px',
                    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
                  }}>
                    {rejecting ? (
                      <>
                        <TextField
                          inputRef={reasonRef}
                          size="small"
                          fullWidth
                          label="Why is it being rejected?"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          disabled={saving}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); decide('rejected', reason); }
                            if (e.key === 'Escape') setRejecting(false);
                          }}
                          helperText={`At least ${MIN_REASON} characters. Press Enter to reject, Escape to cancel.`}
                        />
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          {REJECT_REASONS.map((r) => (
                            <Chip
                              key={r}
                              size="small"
                              label={r}
                              variant={reason === r ? 'filled' : 'outlined'}
                              onClick={() => setReason(r)}
                              clickable
                              sx={{ minHeight: 32 }}
                            />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <Button sx={{ minHeight: 44 }} onClick={() => setRejecting(false)} disabled={saving}>Cancel</Button>
                          <Button
                            color="error"
                            variant="contained"
                            sx={{ minHeight: 44, flexGrow: { xs: 1, sm: 0 } }}
                            onClick={() => decide('rejected', reason)}
                            disabled={saving || reason.trim().length < MIN_REASON}
                          >
                            Reject question
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                          <TextField
                            size="small"
                            placeholder="Note (optional)"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 180 } }}
                            inputProps={{ 'aria-label': 'Note for approval' }}
                          />
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', width: '100%' }}>
                            {APPROVE_NOTES.map((n) => (
                              <Chip
                                key={n}
                                size="small"
                                label={n}
                                variant="outlined"
                                onClick={() => setNote(n)}
                                clickable
                                sx={{ minHeight: 32 }}
                              />
                            ))}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                          <Button
                            fullWidth
                            size="large"
                            variant="contained"
                            color="success"
                            onClick={() => decide('approved', note)}
                            disabled={saving}
                            sx={{ minHeight: 48, fontWeight: 600, fontSize: { xs: 14, sm: 15 } }}
                          >
                            {reviewState(current) === 'approved' ? 'Approved. Save' : 'Approve (A)'}
                          </Button>
                          <Button
                            fullWidth
                            size="large"
                            variant="outlined"
                            color="error"
                            onClick={() => setRejecting(true)}
                            disabled={saving}
                            sx={{ minHeight: 48, fontWeight: 600, fontSize: { xs: 14, sm: 15 } }}
                          >
                            {reviewState(current) === 'rejected' ? 'Rejected. Change' : 'Reject (R)'}
                          </Button>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                          Shortcuts: A approve, R reject, J or K next and previous, E edit, S suggest LaTeX fix. Decisions save straight away and can be undone for a few seconds.
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                          Decisions save immediately and can be undone within 8 seconds.
                        </Typography>
                      </>
                    )}
                  </Box>
                </>
              )}
            </Panel>
          )}
        </Box>
      </Box>

      {/* Mobile Drawer for Full Queue Hierarchy */}
      <Drawer
        anchor="bottom"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            maxHeight: '85vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ height: '75vh', minHeight: 380, display: 'flex', flexDirection: 'column' }}>
          <QueuePanel
            syllabus={syllabus}
            progress={progress}
            tests={tests}
            source={source}
            onPick={(s) => {
              pickSource(s);
              setMobileDrawerOpen(false);
            }}
            onClose={() => setMobileDrawerOpen(false)}
          />
        </Box>
      </Drawer>

      {current && (
        <QuestionEditor open={editorOpen} mode="edit" question={current} subject={subject} chapter={{ _id: String(current.chapterId), name: current.chapterName }} board={current.board || board}
          onClose={() => setEditorOpen(false)} onSaved={afterEdit} />
      )}
      <SuggestDrawer open={suggestOpen} onClose={() => setSuggestOpen(false)} suggestions={suggestions} />

      <Dialog open={Boolean(conflict)} onClose={() => setConflict(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Someone reviewed this first</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {conflict?.audit?.status
              ? `${conflict.audit.reviewerName || 'Another reviewer'} ${conflict.audit.status === 'approved' ? 'approved' : 'rejected'} this question on ${when(conflict.audit.timestamp)}.`
              : 'Another reviewer cleared the review on this question.'}
          </Typography>
          {conflict?.audit?.remark && <Typography variant="body2" color="text.secondary">{`Their note: "${conflict.audit.remark}"`}</Typography>}
          <Typography variant="body2" sx={{ mt: 1 }}>Keep their decision, or replace it with yours?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button sx={{ minHeight: 44 }} onClick={keepTheirDecision}>Keep theirs</Button>
          <Button sx={{ minHeight: 44 }} variant="contained" onClick={overrule}>{`Replace with ${conflict?.status === 'approved' ? 'approve' : 'reject'}`}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={summaryOpen} onClose={() => setSummaryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Summary</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            {[['In this view', counts.all], ['Approved', counts.approved], ['Rejected', counts.rejected], ['Not reviewed', counts.unreviewed]].map(([label, value]) => (
              <Box key={label} sx={{ p: 1, bgcolor: '#F8F9FB', borderRadius: '8px', border: `1px solid ${tokens.rule}` }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 600 }}>{fmt(value)}</Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary">{`This session: ${session.approved} approved, ${session.rejected} rejected.`}</Typography>
          {queue.questions.some((q) => reviewState(q) === 'rejected') && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Rejected, with reasons</Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.25, fontSize: 13, maxHeight: 200, overflowY: 'auto' }}>
                {queue.questions.filter((q) => reviewState(q) === 'rejected').slice(0, 30).map((q) => (
                  <li key={q._id}>{`${(q.questionText?.en || q.questionText?.hi || '').slice(0, 70)}: ${q.audit?.remark || 'no reason'}`}</li>
                ))}
              </Box>
            </Box>
          )}
          {queue.hasMore && <Typography variant="caption" color="text.secondary">{`Only the ${fmt(queue.questions.length)} questions loaded so far are in the export. Keep going to load the rest.`}</Typography>}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button sx={{ minHeight: 44 }} onClick={() => setSummaryOpen(false)}>Close</Button>
          <Button sx={{ minHeight: 44 }} variant="contained" startIcon={<Download size={14} />} onClick={exportCsv} disabled={queue.questions.length === 0}>Download CSV</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
