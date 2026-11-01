import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, FormControlLabel, IconButton, MenuItem, Skeleton, Switch, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import LatexRenderer from '@/components/LatexRenderer';
import { Panel, PanelHeader } from '@/components/Panel';
import { useScope } from '@/lib/scope-context';
import { loadSyllabus } from '@/lib/syllabusData';
import { getJson, sendJson } from '@/lib/useResource';
import { TYPE_LABELS, passingMarksFor, passingPercentFor, sortByType, typeOf } from '@/lib/draw';
import { tokens } from '@/theme';
import Generator from './Generator';
import QuestionPicker, { questionText } from './QuestionPicker';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const STREAMS = ['Science', 'Commerce', 'Arts'];
const idOf = (v) => String(v?._id ?? v);

const blankDetails = () => ({ title: '', description: '', durationInMinutes: 60, passPercent: 33, status: 'draft', stream: '', isBilingual: true, isPremium: false });

export default function MockTestBuilder() {
  const { testId } = useParams();
  const editing = Boolean(testId);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { board, classId, setBoard, setClassId } = useScope();

  const [details, setDetails] = useState(blankDetails);
  const [mode, setMode] = useState(params.get('mode') === 'generate' ? 'generate' : 'pick');
  const [lang, setLang] = useState('en');
  const [subjectIds, setSubjectIds] = useState([]);
  const [selected, setSelected] = useState([]);
  const [ready, setReady] = useState(!editing); // the scope matches the test being edited
  const [loadError, setLoadError] = useState('');
  const [extrasKnown, setExtrasKnown] = useState(!editing); // whether passingMarks/bilingual/premium were loaded
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  // Passing marks are stored as marks, shown as a percentage. An untouched test keeps its exact stored value.
  const [baseline, setBaseline] = useState(null); // { total, passing }
  const [passTouched, setPassTouched] = useState(false);

  // ── load the test being edited ──
  useEffect(() => {
    if (!editing) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [review, extra] = await Promise.allSettled([getJson(`/tests/${testId}/review-questions`), getJson(`/tests/${testId}`)]);
        if (review.status !== 'fulfilled') throw review.reason;
        if (cancelled) return;
        const { test, questions } = review.value;
        const more = extra.status === 'fulfilled' ? extra.value : null;
        if (test.board) setBoard(test.board);
        if (test.studentClass) setClassId(test.studentClass);
        const totalMarks = test.totalMarks ?? questions.reduce((s, q) => s + (q.marks || 1), 0);
        setDetails({
          title: test.title || '',
          description: test.description || '',
          durationInMinutes: test.durationInMinutes || 60,
          passPercent: more?.passingMarks != null ? passingPercentFor(totalMarks, more.passingMarks) : 33,
          status: test.status || 'draft',
          stream: test.stream || '',
          isBilingual: more?.isBilingual ?? true,
          isPremium: more?.isPremium ?? false,
        });
        setExtrasKnown(Boolean(more));
        setBaseline(more?.passingMarks != null ? { total: totalMarks, passing: more.passingMarks } : null);
        setSelected(questions);
        setSubjectIds((test.subjects || []).map(idOf));
        setReady(true);
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || "Couldn't load this mock test");
      }
    })();
    return () => { cancelled = true; };
  }, [editing, testId, setBoard, setClassId]);

  // ── syllabus, used-question tracker ──
  const [syllabus, setSyllabus] = useState({ status: 'loading', subjects: [] });
  useEffect(() => {
    if (!ready) return undefined;
    const controller = new AbortController();
    setSyllabus((s) => ({ ...s, status: 'loading' }));
    loadSyllabus(board, classId, controller.signal)
      .then((subjects) => setSyllabus({ status: 'ready', subjects }))
      .catch((err) => { if (err?.name !== 'AbortError') setSyllabus({ status: 'error', subjects: [] }); });
    return () => controller.abort();
  }, [ready, board, classId]);

  const [used, setUsed] = useState(() => new Set());
  const loadUsed = useCallback(async () => {
    try {
      const data = await getJson('/tests/used-questions');
      setUsed(new Set(data.usedQuestionIds || []));
    } catch { /* the Used markers are a convenience; the builder still works without them */ }
  }, []);
  useEffect(() => { loadUsed(); }, [loadUsed]);

  // In edit mode the tracker also counts this test's own questions, which are not "used elsewhere".
  const usedElsewhere = useMemo(() => {
    if (!editing) return used;
    const own = new Set(selected.map((q) => q._id));
    return new Set([...used].filter((id) => !own.has(id)));
  }, [used, editing, selected]);

  // ── candidate questions for the chosen subjects ──
  const [candidates, setCandidates] = useState({}); // `${board}:${subjectId}` -> { status, questions, rejected }
  const ckey = (id) => `${board}:${id}`;
  useEffect(() => {
    subjectIds.filter((id) => !candidates[ckey(id)]).forEach((id) => {
      setCandidates((c) => ({ ...c, [ckey(id)]: { status: 'loading', questions: [], rejected: 0 } }));
      getJson(`/utility/question?subjectId=${id}&board=${board}`)
        .then((list) => {
          const all = Array.isArray(list) ? list : [];
          const good = all.filter((q) => q.audit?.status !== 'rejected');
          setCandidates((c) => ({ ...c, [ckey(id)]: { status: 'ready', questions: good, rejected: all.length - good.length } }));
        })
        .catch(() => setCandidates((c) => ({ ...c, [ckey(id)]: { status: 'error', questions: [], rejected: 0 } })));
    });
  }, [subjectIds, board]); // eslint-disable-line react-hooks/exhaustive-deps

  const subjects = useMemo(
    () => syllabus.subjects.filter((s) => !details.stream || !s.stream || s.stream === details.stream),
    [syllabus.subjects, details.stream]
  );
  const chosen = subjects.filter((s) => subjectIds.includes(s._id));
  const groups = chosen.map((subject) => ({ subject, questions: candidates[ckey(subject._id)]?.questions || [] }));
  const loadingCandidates = chosen.some((s) => candidates[ckey(s._id)]?.status !== 'ready' && candidates[ckey(s._id)]?.status !== 'error');
  const rejectedHidden = chosen.reduce((n, s) => n + (candidates[ckey(s._id)]?.rejected || 0), 0);

  // ── selection ──
  const selectedIds = useMemo(() => new Set(selected.map((q) => q._id)), [selected]);
  const touch = () => setDirty(true);
  const toggle = (q) => { touch(); setSelected((list) => (list.some((x) => x._id === q._id) ? list.filter((x) => x._id !== q._id) : [...list, q])); };
  const toggleMany = (questions, add) => {
    touch();
    setSelected((list) => {
      const ids = new Set(questions.map((q) => q._id));
      return add ? [...list, ...questions.filter((q) => !list.some((x) => x._id === q._id))] : list.filter((q) => !ids.has(q._id));
    });
  };
  const remove = (id) => { touch(); setSelected((list) => list.filter((q) => q._id !== id)); };
  const drawn = (picked) => { touch(); setSelected(sortByType(picked)); toast.success(`${picked.length} questions drawn`); };

  const pickSubject = (id) => {
    touch();
    setSubjectIds((ids) => (mode === 'generate' ? [id] : ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };
  const changeMode = (_, value) => {
    if (!value) return;
    setMode(value);
    if (value === 'generate') setSubjectIds((ids) => (ids.length > 1 ? [ids[0]] : ids));
  };

  const totalMarks = selected.reduce((s, q) => s + (q.marks || 1), 0);
  const passingMarks = baseline && !passTouched && totalMarks === baseline.total ? baseline.passing : passingMarksFor(totalMarks, details.passPercent);
  const byType = selected.reduce((acc, q) => ({ ...acc, [typeOf(q)]: (acc[typeOf(q)] || 0) + 1 }), {});
  const setField = (patch) => {
    touch();
    if ('passPercent' in patch) setPassTouched(true);
    setDetails((d) => ({ ...d, ...patch }));
  };

  const problems = [];
  if (!details.title.trim()) problems.push('Give the test a title.');
  if (selected.length === 0) problems.push('Add at least one question.');
  if (!(Number(details.durationInMinutes) > 0)) problems.push('Set the time in minutes.');
  if (!(details.passPercent >= 1 && details.passPercent <= 100)) problems.push('Passing percentage must be between 1 and 100.');

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = async () => {
    if (problems.length) return;
    setSaving(true);
    const nonMcq = selected.filter((q) => typeOf(q) !== 'MCQ').length;
    const body = {
      board,
      studentClass: classId,
      title: details.title.trim(),
      description: details.description.trim(),
      durationInMinutes: Number(details.durationInMinutes),
      status: details.status,
      stream: classId === 12 && details.stream ? details.stream : undefined,
      subjects: [...new Set(selected.map((q) => idOf(q.subjectId)))],
      questions: selected.map((q) => q._id),
      totalMarks,
      testType: nonMcq === 0 ? 'MCQ' : nonMcq === selected.length ? 'Subjective' : 'Mixed',
      ...(extrasKnown ? { passingMarks, isBilingual: details.isBilingual, isPremium: details.isPremium } : { passingMarks }),
    };
    try {
      if (editing) await sendJson('PATCH', `/tests/${testId}`, body);
      else await sendJson('POST', '/tests', body);
      toast.success(editing ? 'Mock test saved' : details.status === 'draft' ? 'Mock test saved as a draft' : 'Mock test created');
      setDirty(false);
      navigate('/mock-tests');
    } catch (err) {
      toast.error(err.message || "Couldn't save the mock test");
    } finally {
      setSaving(false);
    }
  };

  const chapterNames = useMemo(() => {
    const map = new Map();
    syllabus.subjects.forEach((s) => s.chapters.forEach((c) => map.set(c._id, c.name)));
    return map;
  }, [syllabus.subjects]);

  if (loadError) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', pt: 6 }}>
        <Typography variant="h5">Couldn't open this mock test</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>{loadError}</Typography>
        <Button component={Link} to="/mock-tests" variant="contained">Back to mock tests</Button>
      </Box>
    );
  }
  if (!ready) return <Box sx={{ maxWidth: 1280, mx: 'auto' }}><Skeleton height={60} /><Skeleton height={400} /></Box>;

  const generateSubject = mode === 'generate' ? chosen[0] : null;

  return (
    <Box sx={{ maxWidth: 1360, mx: 'auto' }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h4" component="h1">{editing ? 'Edit mock test' : 'New mock test'}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>{`${board} Class ${classId}. Pick the questions yourself or draw them from the exam pattern.`}</Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 380px' }, alignItems: 'start' }}>
        <Box sx={{ display: 'grid', gap: 2.5, minWidth: 0 }}>
          <Panel>
            <PanelHeader title="Details" />
            <Box sx={{ p: 2, display: 'grid', gap: 2 }}>
              <TextField label="Title" value={details.title} onChange={(e) => setField({ title: e.target.value })} fullWidth required autoFocus={!editing} />
              <TextField label="Description (optional)" value={details.description} onChange={(e) => setField({ description: e.target.value })} fullWidth multiline minRows={2} />
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: classId === 12 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' } }}>
                <TextField label="Time (minutes)" type="number" value={details.durationInMinutes} onChange={(e) => setField({ durationInMinutes: e.target.value })} inputProps={{ min: 1 }} />
                <TextField label="Passing percentage" type="number" value={details.passPercent} onChange={(e) => setField({ passPercent: Number(e.target.value) })} inputProps={{ min: 1, max: 100 }} />
                <TextField select label="Status" value={details.status} onChange={(e) => setField({ status: e.target.value })} helperText={details.status === 'draft' ? 'Hidden from students' : details.status === 'active' ? 'Visible to students' : undefined}>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  {!['draft', 'active'].includes(details.status) && <MenuItem value={details.status} sx={{ textTransform: 'capitalize' }}>{details.status}</MenuItem>}
                </TextField>
                {classId === 12 && (
                  <TextField select label="Stream" value={details.stream} onChange={(e) => setField({ stream: e.target.value })}>
                    <MenuItem value="">All streams</MenuItem>
                    {STREAMS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                )}
              </Box>
              {extrasKnown ? (
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <FormControlLabel control={<Switch checked={details.isBilingual} onChange={(e) => setField({ isBilingual: e.target.checked })} />} label="Show in English and Hindi" />
                  <FormControlLabel control={<Switch checked={details.isPremium} onChange={(e) => setField({ isPremium: e.target.checked })} />} label="Premium students only" />
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">Language and premium settings of this test could not be loaded, so they are left as they are.</Typography>
              )}
            </Box>
          </Panel>

          <Panel>
            <PanelHeader
              title="Questions"
              description="Choose subjects, then pick questions by hand or draw them at random from the chapters."
              action={
                <ToggleButtonGroup exclusive size="small" value={mode} onChange={changeMode} aria-label="How to add questions">
                  <ToggleButton value="pick" sx={{ px: 1.5 }}>Pick by hand</ToggleButton>
                  <ToggleButton value="generate" sx={{ px: 1.5 }}>Draw from pattern</ToggleButton>
                </ToggleButtonGroup>
              }
            />
            <Box sx={{ p: 2, display: 'grid', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.75 }}>{mode === 'generate' ? 'Subject' : 'Subjects'}</Typography>
                {syllabus.status === 'loading' && subjects.length === 0 ? <Skeleton height={32} width={300} />
                  : subjects.length === 0 ? <Typography variant="body2" color="text.secondary">{`No subjects in ${board} Class ${classId}${details.stream ? ` for ${details.stream}` : ''}. Add them in the syllabus first.`}</Typography>
                  : (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {subjects.map((s) => {
                        const on = subjectIds.includes(s._id);
                        return <Chip key={s._id} label={s.name} onClick={() => pickSubject(s._id)} color={on ? 'primary' : 'default'} variant={on ? 'filled' : 'outlined'} clickable />;
                      })}
                    </Box>
                  )}
              </Box>

              {mode === 'pick' && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ToggleButtonGroup exclusive size="small" value={lang} onChange={(_, v) => v && setLang(v)} aria-label="Show questions in">
                    <ToggleButton value="en" sx={{ px: 1.25 }}>English</ToggleButton><ToggleButton value="hi" sx={{ px: 1.25 }}>हिंदी</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}

              {chosen.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Choose a subject to see its questions.</Typography>
              ) : loadingCandidates ? (
                <Box sx={{ display: 'grid', gap: 1 }}>{[0, 1, 2].map((i) => <Skeleton key={i} height={40} />)}</Box>
              ) : mode === 'pick' ? (
                <QuestionPicker groups={groups} selectedIds={selectedIds} used={usedElsewhere} lang={lang} onToggle={toggle} onToggleMany={toggleMany} />
              ) : generateSubject ? (
                <Generator board={board} classId={classId} subject={generateSubject} questions={candidates[ckey(generateSubject._id)]?.questions || []} used={usedElsewhere} selectedCount={selected.length} onDraw={drawn} />
              ) : null}

              {rejectedHidden > 0 && <Typography variant="caption" color="text.secondary">{`${fmt(rejectedHidden)} questions marked rejected in review are hidden.`}</Typography>}
              {chosen.some((s) => candidates[ckey(s._id)]?.status === 'error') && <Alert severity="error">Couldn't load questions for a subject. Reload the page to try again.</Alert>}
            </Box>
          </Panel>
        </Box>

        <Box sx={{ position: { lg: 'sticky' }, top: { lg: 12 }, display: 'grid', gap: 2 }}>
          <Panel>
            <PanelHeader title="This test" />
            <Box sx={{ p: 2, display: 'grid', gap: 1.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                {[['Questions', fmt(selected.length)], ['Marks', fmt(totalMarks)], ['Pass at', `${fmt(passingMarks)} marks`]].map(([label, value]) => (
                  <Box key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 600 }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
              {Object.keys(byType).length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {Object.entries(byType).map(([t, n]) => `${n} ${(TYPE_LABELS[t] || t).toLowerCase()}`).join(', ')}
                </Typography>
              )}
            </Box>

            <Box sx={{ borderTop: `1px solid ${tokens.rule}`, maxHeight: 340, overflowY: 'auto' }}>
              {selected.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No questions yet.</Typography>
              ) : selected.map((q) => (
                <Box key={q._id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, px: 1.5, py: 0.75, borderBottom: `1px solid ${tokens.rule}` }}>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}><LatexRenderer text={questionText(q, lang)} /></Box>
                    <Typography variant="caption" color="text.secondary">{`${q.chapterName || chapterNames.get(idOf(q.chapterId)) || ''}${typeOf(q) !== 'MCQ' ? `, ${TYPE_LABELS[typeOf(q)]}` : ''}, ${q.marks || 1} mark${(q.marks || 1) === 1 ? '' : 's'}`}</Typography>
                  </Box>
                  <Tooltip title="Remove"><IconButton size="small" aria-label="Remove question" onClick={() => remove(q._id)}><X size={14} /></IconButton></Tooltip>
                </Box>
              ))}
            </Box>
            {selected.length > 0 && <Box sx={{ p: 1, textAlign: 'right' }}><Button size="small" onClick={() => { touch(); setSelected([]); }}>Remove all</Button></Box>}
          </Panel>

          <Panel>
            <Box sx={{ p: 2, display: 'grid', gap: 1.25 }}>
              {problems.length > 0 && <Alert severity="info" sx={{ py: 0 }}>{problems.join(' ')}</Alert>}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button component={Link} to="/mock-tests" disabled={saving}>Cancel</Button>
                <Button variant="contained" onClick={save} disabled={saving || problems.length > 0}>{editing ? 'Save changes' : 'Create mock test'}</Button>
              </Box>
            </Box>
          </Panel>
        </Box>
      </Box>
    </Box>
  );
}
