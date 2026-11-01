import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, InputAdornment,
  Menu, MenuItem, Skeleton, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { FileUp, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import LatexRenderer from '@/components/LatexRenderer';
import { Bubble } from '@/components/Bubble';
import { Panel } from '@/components/Panel';
import { useScope } from '@/lib/scope-context';
import { levelOf, loadSyllabus, totalsOf } from '@/lib/syllabusData';
import { getJson, sendJson } from '@/lib/useResource';
import { tokens } from '@/theme';
import QuestionEditor, { QUESTION_TYPES, typeLabel } from './questions/QuestionEditor';
import ImportDrawer from './questions/ImportDrawer';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const PAGE_SIZES = [25, 50, 100];
const DIFFICULTY_COLOR = { easy: tokens.green, medium: tokens.amber, hard: tokens.red };

const reviewOf = (q) => q.audit?.status || 'unreviewed';
const REVIEW_LABEL = { approved: 'Approved', rejected: 'Rejected', unreviewed: 'Not reviewed' };

// ── syllabus tree ─────────────────────────────────────────────────────────────────
function SyllabusTree({ subjects, status, subjectId, chapterId, onPick }) {
  if (status === 'loading' && subjects.length === 0) {
    return <Box sx={{ p: 2, display: 'grid', gap: 1 }}>{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={32} />)}</Box>;
  }
  return (
    <Box sx={{ p: 1.5, flexGrow: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      {subjects.map((s) => {
        const open = s._id === subjectId;
        const t = totalsOf(s);
        return (
          <Box key={s._id}>
            <Box component="button" type="button" onClick={() => onPick(s._id, null)} aria-expanded={open}
              sx={{ display: 'flex', width: '100%', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, textAlign: 'left', border: 0, font: 'inherit', cursor: 'pointer', px: 1.5, py: 1.5, borderRadius: '8px', bgcolor: open && !chapterId ? tokens.inkTint : 'transparent', color: open && !chapterId ? tokens.ink : 'text.primary', '&:hover': { bgcolor: open && !chapterId ? tokens.inkTint : 'action.hover' } }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{s.name}</Typography>
              <Typography variant="caption" color="text.secondary">{fmt(t.questions)}</Typography>
            </Box>
            {open && (
              <Box sx={{ ml: 1.75, pl: 1, borderLeft: `1px solid ${tokens.rule}`, mb: 1.5, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2px' }}>
                {s.chapters.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1, py: 0.75 }}>No chapters. Add some in the syllabus.</Typography>}
                {s.chapters.map((c) => {
                  const active = c._id === chapterId;
                  return (
                    <Box key={c._id} component="button" type="button" onClick={() => onPick(s._id, c._id)} aria-current={active ? 'true' : undefined}
                      sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 1.25, textAlign: 'left', border: 0, font: 'inherit', cursor: 'pointer', px: 1.5, py: 1.15, borderRadius: '8px', bgcolor: active ? tokens.inkTint : 'transparent', color: active ? tokens.ink : 'text.primary', '&:hover': { bgcolor: active ? tokens.inkTint : 'action.hover' } }}>
                      <Bubble level={levelOf(c.questionCount || 0)} size={12} />
                      <Typography sx={{ fontSize: 14, fontWeight: active ? 600 : 400, flexGrow: 1, minWidth: 0 }} noWrap title={c.name}>{c.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{fmt(c.questionCount || 0)}</Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────────
export default function Questions() {
  const { board, classId } = useScope();
  const [params, setParams] = useSearchParams();

  const [syllabus, setSyllabus] = useState({ status: 'loading', subjects: [] });
  const loadTree = useCallback(async (signal) => {
    try { setSyllabus({ status: 'ready', subjects: await loadSyllabus(board, classId, signal) }); }
    catch (err) { if (err?.name !== 'AbortError') setSyllabus({ status: 'error', subjects: [] }); }
  }, [board, classId]);
  useEffect(() => {
    const controller = new AbortController();
    setSyllabus((s) => ({ ...s, status: 'loading' }));
    loadTree(controller.signal);
    return () => controller.abort();
  }, [loadTree]);

  const { subjects } = syllabus;
  const subject = subjects.find((s) => s._id === params.get('subject')) || subjects[0] || null;
  const chapter = subject?.chapters.find((c) => c._id === params.get('chapter')) || (params.get('chapter') ? null : subject?.chapters[0]) || null;
  const pick = (subjectId, chapterId) => setParams(chapterId ? { subject: subjectId, chapter: chapterId } : { subject: subjectId }, { replace: true });

  // ── questions for the selection ──
  const [list, setList] = useState({ status: 'loading', questions: [] });
  const subjectId = subject?._id;
  const chapterId = chapter?._id;
  const loadQuestions = useCallback(async (signal) => {
    if (!subjectId) return setList({ status: 'ready', questions: [] });
    try {
      const data = await getJson(`/utility/question?subjectId=${subjectId}${chapterId ? `&chapterId=${chapterId}` : ''}`, signal);
      setList({ status: 'ready', questions: Array.isArray(data) ? data : [] });
    } catch (err) {
      if (err?.name !== 'AbortError') setList({ status: 'error', questions: [] });
    }
  }, [subjectId, chapterId]);
  useEffect(() => {
    const controller = new AbortController();
    setList((l) => ({ ...l, status: 'loading' }));
    loadQuestions(controller.signal);
    return () => controller.abort();
  }, [loadQuestions]);
  const refresh = () => { loadQuestions(); loadTree(); };

  // ── filters, selection, paging ──
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [review, setReview] = useState('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState(() => new Set());
  useEffect(() => { setPage(0); setSelected(new Set()); }, [subjectId, chapterId, search, type, difficulty, review]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return list.questions.filter((q) =>
      (type === 'all' || (q.questionType || 'MCQ') === type)
      && (difficulty === 'all' || q.difficulty === difficulty)
      && (review === 'all' || reviewOf(q) === review)
      && (!term || (q.questionText?.en || '').toLowerCase().includes(term) || (q.questionText?.hi || '').includes(search.trim())));
  }, [list.questions, search, type, difficulty, review]);
  const visible = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const allSelected = filtered.length > 0 && filtered.every((q) => selected.has(q._id));
  const toggle = (id) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  // ── editor, import, delete ──
  const [editor, setEditor] = useState({ open: false, mode: 'edit', question: null });
  const [importOpen, setImportOpen] = useState(params.get('import') === '1');
  const [deleteTarget, setDeleteTarget] = useState(null); // question | 'selected'
  const [busy, setBusy] = useState(false);
  const [diffAnchor, setDiffAnchor] = useState(null);

  useEffect(() => { if (params.get('import') === '1') setImportOpen(true); }, [params]);
  const closeImport = () => {
    setImportOpen(false);
    if (params.get('import')) { const next = new URLSearchParams(params); next.delete('import'); setParams(next, { replace: true }); }
  };

  const confirmDelete = async () => {
    const ids = deleteTarget === 'selected' ? [...selected] : [deleteTarget._id];
    setBusy(true);
    const results = await Promise.allSettled(ids.map((id) => sendJson('DELETE', `/utility/question/${id}`)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBusy(false);
    setDeleteTarget(null);
    setEditor((e) => ({ ...e, open: false }));
    setSelected(new Set());
    if (failed) toast.error(`${failed} of ${ids.length} couldn't be deleted`);
    else toast.success(ids.length === 1 ? 'Question deleted' : `${ids.length} questions deleted`);
    refresh();
  };

  const setDifficultyForSelected = async (value) => {
    setDiffAnchor(null);
    const ids = [...selected];
    setBusy(true);
    const results = await Promise.allSettled(ids.map((id) => sendJson('PATCH', `/utility/question/${id}`, { difficulty: value })));
    setBusy(false);
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed) toast.error(`${failed} of ${ids.length} couldn't be updated`);
    else toast.success(`Difficulty set to ${value} for ${ids.length} question${ids.length === 1 ? '' : 's'}`);
    setSelected(new Set());
    refresh();
  };

  const canAdd = Boolean(subject && chapter);
  const noSubjects = syllabus.status === 'ready' && subjects.length === 0;
  const filtersActive = search || type !== 'all' || difficulty !== 'all' || review !== 'all';
  const title = chapter ? chapter.name : subject ? `All of ${subject.name}` : 'Questions';

  return (
    <Box sx={{ maxWidth: 1360, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h4" component="h1">Questions</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>{`The question bank for ${board} Class ${classId}. Pick a chapter on the left.`}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FileUp size={16} />} onClick={() => setImportOpen(true)} >Import CSV</Button>
          <Tooltip title={canAdd ? '' : 'Pick a chapter first'}>
            <span><Button variant="contained" startIcon={<Plus size={16} />} disabled={!canAdd} onClick={() => setEditor({ open: true, mode: 'create', question: null })}>Add question</Button></span>
          </Tooltip>
        </Box>
      </Box>

      {syllabus.status === 'error' && (
        <Panel sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 600 }}>Couldn't load the syllabus</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>The API didn't respond. Check system health, then try again.</Typography>
          <Button variant="outlined" size="small" onClick={() => loadTree()}>Try again</Button>
        </Panel>
      )}

      {noSubjects && (
        <Panel sx={{ p: 4 }}>
          <Typography variant="h6">{`No subjects in ${board} Class ${classId} yet`}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2, maxWidth: 520 }}>Add subjects and chapters in the syllabus first, or import a CSV file that has subject and chapter columns and they are created for you.</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" component={Link} to="/syllabus">Open syllabus</Button>
            <Button variant="outlined" onClick={() => setImportOpen(true)}>Import CSV</Button>
          </Box>
        </Panel>
      )}

      {syllabus.status !== 'error' && !noSubjects && (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '300px minmax(0, 1fr)' }, alignItems: 'start' }}>
          <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 16, alignSelf: 'start', height: 'calc(100vh - 64px - 48px)' }}>
            <Panel sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ px: 2.5, py: 2, flexShrink: 0, borderBottom: `1px solid ${tokens.rule}` }}><Typography variant="h6">Syllabus</Typography></Box>
              <SyllabusTree subjects={subjects} status={syllabus.status} subjectId={subject?._id} chapterId={chapter?._id} onPick={pick} />
            </Panel>
          </Box>

          <Box sx={{ display: { xs: 'grid', md: 'none' }, gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <TextField select size="small" label="Subject" value={subject?._id || ''} onChange={(e) => pick(e.target.value, null)}>
              {subjects.map((s) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Chapter" value={chapter?._id || ''} onChange={(e) => pick(subject._id, e.target.value || null)}>
              <MenuItem value="">All chapters</MenuItem>
              {(subject?.chapters || []).map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
            </TextField>
          </Box>

          <Panel sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${tokens.rule}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>{title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {list.status === 'loading' && list.questions.length === 0 ? 'Loading…' : `${fmt(filtered.length)}${filtersActive ? ` of ${fmt(list.questions.length)}` : ''} question${filtered.length === 1 ? '' : 's'}`}
                </Typography>
              </Box>
              {chapter && <Button size="small" component={Link} to={`/review?source=chapter&subject=${subject._id}&chapter=${chapter._id}`}>Review this chapter</Button>}
            </Box>

            <Box sx={{ px: 2, py: 1.25, display: 'flex', gap: 1, flexWrap: 'wrap', borderBottom: `1px solid ${tokens.rule}` }}>
              <TextField size="small" placeholder="Search question text" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 180, flexGrow: 1, maxWidth: 300 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search size={15} /></InputAdornment> }} inputProps={{ 'aria-label': 'Search question text' }} />
              <TextField select size="small" value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 130 }} inputProps={{ 'aria-label': 'Type' }}>
                <MenuItem value="all">All types</MenuItem>
                {QUESTION_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
              <TextField select size="small" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} sx={{ minWidth: 125 }} inputProps={{ 'aria-label': 'Difficulty' }}>
                <MenuItem value="all">Any level</MenuItem>
                {['easy', 'medium', 'hard'].map((d) => <MenuItem key={d} value={d} sx={{ textTransform: 'capitalize' }}>{d}</MenuItem>)}
              </TextField>
              <TextField select size="small" value={review} onChange={(e) => setReview(e.target.value)} sx={{ minWidth: 150 }} inputProps={{ 'aria-label': 'Review status' }}>
                <MenuItem value="all">Any review</MenuItem>
                {Object.entries(REVIEW_LABEL).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
              </TextField>
              {filtersActive && <Button size="small" onClick={() => { setSearch(''); setType('all'); setDifficulty('all'); setReview('all'); }}>Clear filters</Button>}
            </Box>

            {selected.size > 0 && (
              <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: tokens.inkTint, borderBottom: `1px solid ${tokens.rule}` }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{`${fmt(selected.size)} selected`}</Typography>
                <Button size="small" onClick={(e) => setDiffAnchor(e.currentTarget)} disabled={busy}>Set difficulty</Button>
                <Menu anchorEl={diffAnchor} open={Boolean(diffAnchor)} onClose={() => setDiffAnchor(null)}>
                  {['easy', 'medium', 'hard'].map((d) => <MenuItem key={d} onClick={() => setDifficultyForSelected(d)} sx={{ textTransform: 'capitalize' }}>{d}</MenuItem>)}
                </Menu>
                <Button size="small" color="error" startIcon={<Trash2 size={14} />} onClick={() => setDeleteTarget('selected')} disabled={busy}>Delete</Button>
                <Button size="small" onClick={() => setSelected(new Set())} sx={{ ml: 'auto' }}>Clear selection</Button>
              </Box>
            )}

            {list.status === 'error' ? (
              <Box sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 600 }}>Couldn't load questions</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>The API didn't respond. Try again.</Typography>
                <Button variant="outlined" size="small" onClick={() => loadQuestions()}>Try again</Button>
              </Box>
            ) : list.status === 'loading' && list.questions.length === 0 ? (
              <Box sx={{ p: 2, display: 'grid', gap: 1 }}>{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={52} />)}</Box>
            ) : filtered.length === 0 ? (
              <Box sx={{ p: 4 }}>
                <Typography sx={{ fontWeight: 600 }}>{filtersActive ? 'No questions match these filters' : chapter ? 'No questions in this chapter yet' : 'No questions here yet'}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{filtersActive ? 'Try removing a filter.' : 'Add one by hand or import a CSV file.'}</Typography>
                {!filtersActive && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" size="small" disabled={!canAdd} onClick={() => setEditor({ open: true, mode: 'create', question: null })}>Add question</Button>
                    <Button variant="outlined" size="small" onClick={() => setImportOpen(true)}>Import CSV</Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto', opacity: list.status === 'loading' ? 0.5 : 1, transition: 'opacity 150ms' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"><Checkbox size="small" checked={allSelected} indeterminate={selected.size > 0 && !allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(filtered.map((q) => q._id)))} inputProps={{ 'aria-label': 'Select all matching questions' }} /></TableCell>
                      <TableCell>Question</TableCell><TableCell>Type</TableCell><TableCell>Difficulty</TableCell><TableCell align="right">Marks</TableCell><TableCell>Review</TableCell><TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visible.map((q) => {
                      const state = reviewOf(q);
                      return (
                        <TableRow key={q._id} hover selected={selected.has(q._id)} onClick={() => setEditor({ open: true, mode: 'edit', question: q })} sx={{ cursor: 'pointer', '& td': { verticalAlign: 'top' }, '&:hover .row-delete': { opacity: 1 } }}>
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}><Checkbox size="small" checked={selected.has(q._id)} onChange={() => toggle(q._id)} inputProps={{ 'aria-label': 'Select question' }} /></TableCell>
                          <TableCell sx={{ maxWidth: 520 }}>
                            <Box sx={{ fontSize: 13.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              <LatexRenderer text={q.questionText?.en || q.questionText?.hi || ''} />
                            </Box>
                            {!q.questionText?.hi && subject?.languageRequirement === 'both' && <Typography variant="caption" sx={{ color: tokens.amber }}>No Hindi text</Typography>}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{typeLabel(q.questionType)}</TableCell>
                          <TableCell><Chip size="small" label={q.difficulty || 'medium'} variant="outlined" sx={{ textTransform: 'capitalize', color: DIFFICULTY_COLOR[q.difficulty] || DIFFICULTY_COLOR.medium, borderColor: DIFFICULTY_COLOR[q.difficulty] || DIFFICULTY_COLOR.medium }} /></TableCell>
                          <TableCell align="right">{q.marks ?? 1}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', color: state === 'approved' ? tokens.green : state === 'rejected' ? tokens.red : 'text.secondary', fontWeight: state === 'unreviewed' ? 400 : 600 }}>{REVIEW_LABEL[state]}</TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="Delete"><IconButton size="small" className="row-delete" aria-label="Delete question" onClick={() => setDeleteTarget(q)} sx={{ opacity: { xs: 1, md: 0 }, '&:focus-visible': { opacity: 1 }, '&:hover': { color: tokens.red } }}><Trash2 size={15} /></IconButton></Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={pageSize} onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={PAGE_SIZES} labelRowsPerPage="Per page" />
              </Box>
            )}
          </Panel>
        </Box>
      )}

      <QuestionEditor
        open={editor.open} mode={editor.mode} question={editor.question} subject={subject} chapter={chapter} board={board}
        onClose={() => setEditor((e) => ({ ...e, open: false }))}
        onSaved={() => { setEditor((e) => ({ ...e, open: false })); refresh(); }}
        onDelete={(q) => setDeleteTarget(q)}
      />

      <ImportDrawer open={importOpen} onClose={closeImport} syllabus={subjects} subject={subject} chapter={chapter} board={board} classId={classId} onImported={refresh} />

      <Dialog open={Boolean(deleteTarget)} onClose={busy ? undefined : () => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{deleteTarget === 'selected' ? `Delete ${fmt(selected.size)} questions?` : 'Delete this question?'}</DialogTitle>
        <DialogContent><DialogContentText>{deleteTarget === 'selected' ? 'These questions are removed from the bank. This cannot be undone.' : 'It is removed from the bank. This cannot be undone.'}</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={busy}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={busy}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
