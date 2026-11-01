import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, InputAdornment, MenuItem, Skeleton, Table, TableBody,
  TableCell, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import LatexRenderer from '@/components/LatexRenderer';
import { Bubble } from '@/components/Bubble';
import { Panel } from '@/components/Panel';
import { useScope } from '@/lib/scope-context';
import { loadSyllabus } from '@/lib/syllabusData';
import { getJson, sendJson } from '@/lib/useResource';
import { tokens } from '@/theme';
import CardEditor from './flashcards/CardEditor';
import GenerateDrawer from './flashcards/GenerateDrawer';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const PAGE_SIZE = 25;
// A chapter with at least this many cards counts as well covered.
const HEALTHY_CARDS = 10;
const levelOf = (n) => (n >= HEALTHY_CARDS ? 'full' : n > 0 ? 'half' : 'none');
const DIFF_COLOR = { easy: tokens.green, medium: tokens.amber, hard: tokens.red };

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

function Tree({ subjects, counts, status, subjectId, chapterId, onPick }) {
  if (status === 'loading' && subjects.length === 0) return <Box sx={{ p: 2, display: 'grid', gap: 1 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={32} />)}</Box>;
  return (
    <Box sx={{ p: 1.5, flexGrow: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      {subjects.map((s) => {
        const open = s._id === subjectId;
        const total = s.chapters.reduce((n, c) => n + (counts[c._id]?.total || 0), 0);
        return (
          <Box key={s._id}>
            <Box component="button" type="button" onClick={() => onPick(s._id, s.chapters[0]?._id || null)} aria-expanded={open}
              sx={{ display: 'flex', width: '100%', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, textAlign: 'left', border: 0, font: 'inherit', cursor: 'pointer', px: 1.5, py: 1.5, borderRadius: '8px', bgcolor: 'transparent', color: 'text.primary', '&:hover': { bgcolor: 'action.hover' } }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{s.name}</Typography>
              <Typography variant="caption" color="text.secondary">{fmt(total)}</Typography>
            </Box>
            {open && (
              <Box sx={{ ml: 1.75, pl: 1, borderLeft: `1px solid ${tokens.rule}`, mb: 1.5, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2px' }}>
                {s.chapters.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1, py: 0.75 }}>No chapters. Add some in the syllabus.</Typography>}
                {s.chapters.map((c) => {
                  const active = c._id === chapterId;
                  const n = counts[c._id]?.total || 0;
                  return (
                    <Box key={c._id} component="button" type="button" onClick={() => onPick(s._id, c._id)} aria-current={active ? 'true' : undefined}
                      sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 1.25, textAlign: 'left', border: 0, font: 'inherit', cursor: 'pointer', px: 1.5, py: 1.15, borderRadius: '8px', bgcolor: active ? tokens.inkTint : 'transparent', color: active ? tokens.ink : 'text.primary', '&:hover': { bgcolor: active ? tokens.inkTint : 'action.hover' } }}>
                      <Bubble level={levelOf(n)} size={12} />
                      <Typography sx={{ fontSize: 14, fontWeight: active ? 600 : 400, flexGrow: 1, minWidth: 0 }} noWrap title={c.name}>{c.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{fmt(n)}</Typography>
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

export default function Flashcards() {
  const { board, classId } = useScope();
  const [params, setParams] = useSearchParams();

  // syllabus + per-chapter card counts
  const [tree, setTree] = useState({ status: 'loading', subjects: [], counts: {} });
  const loadTree = useCallback(async (signal) => {
    try {
      const [subjects, summary] = await Promise.all([loadSyllabus(board, classId, signal), getJson(`/flashcards/admin/summary?board=${board}`, signal, { raw: true })]);
      setTree({ status: 'ready', subjects, counts: Object.fromEntries((summary.counts || []).map((c) => [c.chapterId, c])) });
    } catch (err) {
      if (err?.name !== 'AbortError') setTree({ status: 'error', subjects: [], counts: {} });
    }
  }, [board, classId]);
  useEffect(() => {
    const controller = new AbortController();
    setTree((t) => ({ ...t, status: 'loading' }));
    loadTree(controller.signal);
    return () => controller.abort();
  }, [loadTree]);

  const { subjects, counts } = tree;
  const subject = subjects.find((s) => s._id === params.get('subject')) || subjects[0] || null;
  const chapter = subject?.chapters.find((c) => c._id === params.get('chapter')) || subject?.chapters[0] || null;
  const pick = (subjectId, chapterId) => setParams(chapterId ? { subject: subjectId, chapter: chapterId } : { subject: subjectId }, { replace: true });

  // filters + list
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [difficulty, setDifficulty] = useState('all');
  const [visibility, setVisibility] = useState('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const chapterId = chapter?._id;
  useEffect(() => { setPage(0); setSelected(new Set()); }, [chapterId, debounced, difficulty, visibility]);

  const [list, setList] = useState({ status: 'loading', cards: [], total: 0 });
  const query = useMemo(() => {
    const q = new URLSearchParams({ chapterId: chapterId || '', page: String(page + 1), limit: String(PAGE_SIZE) });
    if (debounced.trim()) q.set('q', debounced.trim());
    if (difficulty !== 'all') q.set('difficulty', difficulty);
    if (visibility !== 'all') q.set('status', visibility);
    return q.toString();
  }, [chapterId, page, debounced, difficulty, visibility]);
  const loadList = useCallback(async (signal) => {
    if (!chapterId) return setList({ status: 'ready', cards: [], total: 0 });
    try {
      const data = await getJson(`/flashcards/admin?${query}`, signal, { raw: true });
      setList({ status: 'ready', cards: data.cards || [], total: data.total || 0 });
    } catch (err) {
      if (err?.name !== 'AbortError') setList({ status: 'error', cards: [], total: 0 });
    }
  }, [chapterId, query]);
  useEffect(() => {
    const controller = new AbortController();
    setList((l) => ({ ...l, status: 'loading' }));
    loadList(controller.signal);
    return () => controller.abort();
  }, [loadList]);
  const refresh = () => { loadList(); loadTree(); };

  // actions
  const [editor, setEditor] = useState({ open: false, mode: 'create', card: null });
  const [generating, setGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // card | 'selected'
  const [busy, setBusy] = useState(false);

  const bulk = async (action, ids, success) => {
    setBusy(true);
    try {
      await sendJson('POST', '/flashcards/admin/bulk', { ids, action });
      toast.success(success);
      setSelected(new Set());
      refresh();
      return true;
    } catch (err) { toast.error(err.message || 'Something went wrong'); return false; }
    finally { setBusy(false); }
  };
  const confirmDelete = async () => {
    const ids = deleteTarget === 'selected' ? [...selected] : [deleteTarget._id];
    if (await bulk('delete', ids, ids.length === 1 ? 'Card deleted' : `${ids.length} cards deleted`)) {
      setDeleteTarget(null);
      setEditor((e) => ({ ...e, open: false }));
    }
  };
  const toggleHidden = (card) => bulk(card.isActive ? 'deactivate' : 'activate', [card._id], card.isActive ? 'Card hidden from students' : 'Card shown to students');

  const cards = list.cards;
  const allSelected = cards.length > 0 && cards.every((c) => selected.has(c._id));
  const toggle = (id) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const noSubjects = tree.status === 'ready' && subjects.length === 0;
  const filtersActive = Boolean(search || difficulty !== 'all' || visibility !== 'all');
  const chapterTotal = counts[chapterId]?.total || 0;

  return (
    <Box sx={{ maxWidth: 1360, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3.5 }}>
        <Box>
          <Typography variant="h4" component="h1">Flashcards</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>{`Revision cards students review with spaced repetition, for ${board} Class ${classId}.`}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={chapter ? '' : 'Pick a chapter first'}>
            <span><Button variant="outlined" startIcon={<Sparkles size={16} />} disabled={!chapter} onClick={() => setGenerating(true)}>Write with AI</Button></span>
          </Tooltip>
          <Tooltip title={chapter ? '' : 'Pick a chapter first'}>
            <span><Button variant="contained" startIcon={<Plus size={16} />} disabled={!chapter} onClick={() => setEditor({ open: true, mode: 'create', card: null })}>Add card</Button></span>
          </Tooltip>
        </Box>
      </Box>

      {tree.status === 'error' && (
        <Panel sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 600 }}>Couldn't load flashcards</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>The API didn't respond. Check system health, then try again.</Typography>
          <Button variant="outlined" size="small" onClick={() => loadTree()}>Try again</Button>
        </Panel>
      )}

      {noSubjects && (
        <Panel sx={{ p: 4 }}>
          <Typography variant="h6">{`No subjects in ${board} Class ${classId} yet`}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2, maxWidth: 520 }}>Flashcards belong to chapters. Add subjects and chapters in the syllabus first.</Typography>
          <Button variant="contained" component={Link} to="/syllabus">Open syllabus</Button>
        </Panel>
      )}

      {tree.status !== 'error' && !noSubjects && (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '300px minmax(0, 1fr)' }, alignItems: 'start' }}>
          <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 16, alignSelf: 'start', height: 'calc(100vh - 64px - 48px)' }}>
            <Panel sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ px: 2.5, py: 2, flexShrink: 0, borderBottom: `1px solid ${tokens.rule}` }}><Typography variant="h6">Chapters</Typography></Box>
              <Tree subjects={subjects} counts={counts} status={tree.status} subjectId={subject?._id} chapterId={chapterId} onPick={pick} />
            </Panel>
          </Box>

          <Box sx={{ display: { xs: 'grid', md: 'none' }, gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <TextField select size="small" label="Subject" value={subject?._id || ''} onChange={(e) => pick(e.target.value, subjects.find((s) => s._id === e.target.value)?.chapters[0]?._id || null)}>
              {subjects.map((s) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Chapter" value={chapterId || ''} onChange={(e) => pick(subject._id, e.target.value)}>
              {(subject?.chapters || []).map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
            </TextField>
          </Box>

          <Panel sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${tokens.rule}` }}>
              <Typography variant="h6" noWrap>{chapter?.name || 'Flashcards'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {chapter ? `${fmt(chapterTotal)} card${chapterTotal === 1 ? '' : 's'} in this chapter${chapterTotal < HEALTHY_CARDS ? `. Aim for at least ${HEALTHY_CARDS}.` : '.'}` : 'This subject has no chapters yet.'}
              </Typography>
            </Box>

            <Box sx={{ px: 3, py: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', borderBottom: `1px solid ${tokens.rule}` }}>
              <TextField size="small" placeholder="Search cards" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 200, flexGrow: 1, maxWidth: 340 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search size={15} /></InputAdornment> }} inputProps={{ 'aria-label': 'Search cards' }} />
              <TextField select size="small" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} sx={{ minWidth: 125 }} inputProps={{ 'aria-label': 'Difficulty' }}>
                <MenuItem value="all">Any level</MenuItem>
                {['easy', 'medium', 'hard'].map((d) => <MenuItem key={d} value={d} sx={{ textTransform: 'capitalize' }}>{d}</MenuItem>)}
              </TextField>
              <TextField select size="small" value={visibility} onChange={(e) => setVisibility(e.target.value)} sx={{ minWidth: 140 }} inputProps={{ 'aria-label': 'Visibility' }}>
                <MenuItem value="all">Shown and hidden</MenuItem>
                <MenuItem value="active">Shown only</MenuItem>
                <MenuItem value="hidden">Hidden only</MenuItem>
              </TextField>
              {filtersActive && <Button size="small" onClick={() => { setSearch(''); setDifficulty('all'); setVisibility('all'); }}>Clear filters</Button>}
            </Box>

            {selected.size > 0 && (
              <Box sx={{ px: 3, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: tokens.inkTint, borderBottom: `1px solid ${tokens.rule}` }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{`${fmt(selected.size)} selected`}</Typography>
                <Button size="small" disabled={busy} onClick={() => bulk('deactivate', [...selected], 'Cards hidden from students')}>Hide</Button>
                <Button size="small" disabled={busy} onClick={() => bulk('activate', [...selected], 'Cards shown to students')}>Show</Button>
                <Button size="small" color="error" startIcon={<Trash2 size={14} />} disabled={busy} onClick={() => setDeleteTarget('selected')}>Delete</Button>
                <Button size="small" onClick={() => setSelected(new Set())} sx={{ ml: 'auto' }}>Clear selection</Button>
              </Box>
            )}

            {list.status === 'error' ? (
              <Box sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 600 }}>Couldn't load cards</Typography>
                <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => loadList()}>Try again</Button>
              </Box>
            ) : list.status === 'loading' && cards.length === 0 ? (
              <Box sx={{ p: 2, display: 'grid', gap: 1 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={52} />)}</Box>
            ) : cards.length === 0 ? (
              <Box sx={{ p: 4 }}>
                <Typography sx={{ fontWeight: 600 }}>{filtersActive ? 'No cards match these filters' : 'No flashcards in this chapter yet'}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{filtersActive ? 'Try removing a filter.' : 'Write one by hand, or let the AI draft a set that you review first.'}</Typography>
                {!filtersActive && chapter && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" size="small" onClick={() => setGenerating(true)}>Write with AI</Button>
                    <Button variant="outlined" size="small" onClick={() => setEditor({ open: true, mode: 'create', card: null })}>Add card</Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto', opacity: list.status === 'loading' ? 0.5 : 1, transition: 'opacity 150ms' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"><Checkbox size="small" checked={allSelected} indeterminate={selected.size > 0 && !allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(cards.map((c) => c._id)))} inputProps={{ 'aria-label': 'Select all cards on this page' }} /></TableCell>
                      <TableCell>Front</TableCell><TableCell>Back</TableCell><TableCell>Difficulty</TableCell><TableCell>Status</TableCell><TableCell align="right">Students</TableCell><TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cards.map((c) => (
                      <TableRow key={c._id} hover selected={selected.has(c._id)} onClick={() => setEditor({ open: true, mode: 'edit', card: c })} sx={{ cursor: 'pointer', '& td': { verticalAlign: 'middle', py: 2 }, '&:last-child td': { borderBottom: 0 }, '&:hover .row-actions': { opacity: 1 } }}>
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}><Checkbox size="small" checked={selected.has(c._id)} onChange={() => toggle(c._id)} inputProps={{ 'aria-label': 'Select card' }} /></TableCell>
                        <TableCell sx={{ maxWidth: 320 }}><Box sx={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}><LatexRenderer text={c.frontText} /></Box></TableCell>
                        <TableCell sx={{ maxWidth: 340 }}><Box sx={{ fontSize: 14, lineHeight: 1.45, color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}><LatexRenderer text={c.backText} /></Box></TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, textTransform: 'capitalize' }}>
                            <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: DIFF_COLOR[c.difficulty] || tokens.muted }} />{c.difficulty}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{c.isActive ? null : <Chip size="small" label="Hidden" sx={{ bgcolor: tokens.amberTint, color: tokens.amber, fontWeight: 600 }} />}</TableCell>
                        <TableCell align="right" sx={{ color: c.learners ? 'text.primary' : 'text.secondary' }}>{c.learners ? fmt(c.learners) : '–'}</TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                          <Box className="row-actions" sx={{ display: 'inline-flex', opacity: { xs: 1, md: 0 }, '&:focus-within': { opacity: 1 } }}>
                            <Tooltip title={c.isActive ? 'Hide from students' : 'Show to students'}><Button size="small" onClick={() => toggleHidden(c)} disabled={busy}>{c.isActive ? 'Hide' : 'Show'}</Button></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" aria-label="Delete card" onClick={() => setDeleteTarget(c)} sx={{ '&:hover': { color: tokens.red } }}><Trash2 size={15} /></IconButton></Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination component="div" count={list.total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={PAGE_SIZE} rowsPerPageOptions={[PAGE_SIZE]} labelRowsPerPage="Per page" />
              </Box>
            )}
          </Panel>
        </Box>
      )}

      <CardEditor open={editor.open} mode={editor.mode} card={editor.card} chapter={chapter}
        onClose={() => setEditor((e) => ({ ...e, open: false }))} onSaved={() => { setEditor((e) => ({ ...e, open: false })); refresh(); }} onDelete={(c) => setDeleteTarget(c)} />
      <GenerateDrawer open={generating} subject={subject} chapter={chapter} onClose={() => setGenerating(false)} onSaved={() => { setGenerating(false); refresh(); }} />

      <Dialog open={Boolean(deleteTarget)} onClose={busy ? undefined : () => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{deleteTarget === 'selected' ? `Delete ${fmt(selected.size)} cards?` : 'Delete this card?'}</DialogTitle>
        <DialogContent><DialogContentText>{deleteTarget === 'selected' ? 'The cards are removed, along with each student\'s review history for them. This cannot be undone. Use Hide to keep them without showing them.' : 'The card is removed, along with each student\'s review history for it. This cannot be undone. Use Hide to keep it without showing it.'}</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={busy}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={busy}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
