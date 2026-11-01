import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, InputAdornment,
  MenuItem, Skeleton, TextField, Tooltip, Typography,
} from '@mui/material';
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Bubble } from '@/components/Bubble';
import { Panel, PanelHeader } from '@/components/Panel';
import { useScope } from '@/lib/scope-context';
import { sendJson } from '@/lib/useResource';
import { levelOf, loadSyllabus, totalsOf } from '@/lib/syllabusData';
import { tokens } from '@/theme';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

export const LANGUAGE_OPTIONS = [
  { value: 'both', label: 'English and Hindi', help: 'Every question needs both languages.' },
  { value: 'en_only', label: 'English only', help: 'Questions need English text.' },
  { value: 'hi_only', label: 'Hindi only', help: 'Questions need Hindi text.' },
  { value: 'either', label: 'Either language', help: 'Questions need at least one language.' },
];

// ── subject dialog ───────────────────────────────────────────────────────────────
function SubjectDialog({ open, subject, classId, board, onClose, onSaved }) {
  const editing = Boolean(subject);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('both');
  const [stream, setStream] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(subject?.name || '');
    setLanguage(subject?.languageRequirement || 'both');
    setStream(subject?.stream || '');
    setError('');
  }, [open, subject]);

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Enter a subject name.');
    setBusy(true);
    setError('');
    try {
      const body = { name: name.trim(), languageRequirement: language, ...(classId === 12 ? { stream: stream.trim() } : {}) };
      const saved = editing
        ? await sendJson('PATCH', `/utility/subject/${subject._id}`, body)
        : await sendJson('POST', '/utility/subject', { ...body, studentClass: classId, board });
      toast.success(editing ? 'Subject saved' : 'Subject added');
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <Box component="form" onSubmit={save} noValidate>
        <DialogTitle>{editing ? 'Edit subject' : `Add a subject to ${board} Class ${classId}`}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          <TextField label="Subject name" value={name} onChange={(e) => setName(e.target.value)} autoFocus fullWidth error={Boolean(error) && !name.trim()} />
          <TextField select label="Question language" value={language} onChange={(e) => setLanguage(e.target.value)} fullWidth helperText={LANGUAGE_OPTIONS.find((o) => o.value === language)?.help}>
            {LANGUAGE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
          {classId === 12 && <TextField label="Stream (optional)" value={stream} onChange={(e) => setStream(e.target.value)} placeholder="Science, Commerce or Arts" fullWidth />}
          {error && <Typography variant="body2" sx={{ color: tokens.red }} role="alert">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy}>{editing ? 'Save changes' : 'Add subject'}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function ConfirmDelete({ open, title, body, busy, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent><DialogContentText>{body}</DialogContentText></DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error" disabled={busy}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── chapters ─────────────────────────────────────────────────────────────────────
function ChapterRow({ chapter, index, total, subjectId, onRename, onMove, onDelete, busy }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(chapter.name);
  const count = chapter.questionCount || 0;

  const commit = async () => {
    const next = name.trim();
    setEditing(false);
    if (next && next !== chapter.name) await onRename(chapter, next);
    else setName(chapter.name);
  };

  return (
    <Box role="row" sx={{ display: 'grid', gridTemplateColumns: { xs: '28px minmax(0, 1fr) 84px', md: '36px minmax(0, 1fr) 150px 150px' }, gap: 1.5, alignItems: 'center', px: 2, py: 0.75, minHeight: 44, borderBottom: `1px solid ${tokens.rule}`, '&:hover .row-actions, &:focus-within .row-actions': { opacity: 1 } }}>
      <Typography role="cell" sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'right' }}>{index + 1}</Typography>

      <Box role="cell" sx={{ minWidth: 0 }}>
        {editing ? (
          <TextField size="small" value={name} autoFocus fullWidth onChange={(e) => setName(e.target.value)} onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setName(chapter.name); setEditing(false); } }} inputProps={{ 'aria-label': 'Chapter name' }} />
        ) : (
          <Typography noWrap sx={{ fontSize: 14, fontWeight: 500 }} title={chapter.name}>{chapter.name}</Typography>
        )}
      </Box>

      <Box role="cell" sx={{ display: 'flex', alignItems: 'center', gap: 1, gridColumn: { xs: '1 / -1', md: 'auto' }, gridRow: { xs: 2, md: 'auto' }, pl: { xs: '40px', md: 0 } }}>
        <Bubble level={levelOf(count)} size={14} />
        <Typography component={Link} to={`/questions?subject=${subjectId}&chapter=${chapter._id}`} sx={{ fontSize: 13, fontWeight: 600, color: count ? 'text.primary' : tokens.red, textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
          {count === 0 ? 'No questions' : `${fmt(count)} question${count === 1 ? '' : 's'}`}
        </Typography>
      </Box>

      <Box role="cell" className="row-actions" sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25, opacity: { xs: 1, md: 0 }, transition: 'opacity 120ms' }}>
        <Tooltip title="Move up"><span><IconButton size="small" aria-label={`Move ${chapter.name} up`} disabled={busy || index === 0} onClick={() => onMove(index, -1)}><ArrowUp size={15} /></IconButton></span></Tooltip>
        <Tooltip title="Move down"><span><IconButton size="small" aria-label={`Move ${chapter.name} down`} disabled={busy || index === total - 1} onClick={() => onMove(index, 1)}><ArrowDown size={15} /></IconButton></span></Tooltip>
        <Tooltip title="Rename"><IconButton size="small" aria-label={`Rename ${chapter.name}`} onClick={() => setEditing(true)}><Pencil size={15} /></IconButton></Tooltip>
        <Tooltip title={count ? `Delete its ${fmt(count)} questions first` : 'Delete chapter'}>
          <span><IconButton size="small" aria-label={`Delete ${chapter.name}`} disabled={count > 0 || busy} onClick={() => onDelete(chapter)} sx={{ '&:hover': { color: tokens.red } }}><Trash2 size={15} /></IconButton></span>
        </Tooltip>
      </Box>
    </Box>
  );
}

function AddChapter({ onAdd }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try { await onAdd(name.trim()); setName(''); } finally { setBusy(false); }
  };
  return (
    <Box component="form" onSubmit={submit} sx={{ display: 'flex', gap: 1, p: 1.5, borderBottom: `1px solid ${tokens.rule}`, bgcolor: '#F8F9FB' }}>
      <TextField size="small" fullWidth placeholder="New chapter name" value={name} onChange={(e) => setName(e.target.value)} inputProps={{ 'aria-label': 'New chapter name' }} />
      <Button type="submit" variant="contained" size="small" startIcon={<Plus size={14} />} disabled={!name.trim() || busy} sx={{ whiteSpace: 'nowrap' }}>Add chapter</Button>
    </Box>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────────
export default function Syllabus() {
  const { board, classId } = useScope();
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState({ status: 'loading', subjects: [] });
  const [search, setSearch] = useState('');
  const [subjectDialog, setSubjectDialog] = useState({ open: false, subject: null });
  const [confirm, setConfirm] = useState(null); // { kind: 'subject' | 'chapter', item }
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (signal) => {
    try {
      const subjects = await loadSyllabus(board, classId, signal);
      setState({ status: 'ready', subjects });
    } catch (err) {
      if (err?.name !== 'AbortError') setState({ status: 'error', subjects: [] });
    }
  }, [board, classId]);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, status: 'loading' }));
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = () => load();
  const { subjects, status } = state;
  const selectedId = params.get('subject');
  const selected = subjects.find((s) => s._id === selectedId) || subjects[0] || null;
  const select = (id) => setParams({ subject: id }, { replace: true });

  const filtered = useMemo(() => subjects.filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase())), [subjects, search]);

  // ── mutations (each reloads so counts stay honest) ──
  const run = async (action, success) => {
    setBusy(true);
    try {
      await action();
      if (success) toast.success(success);
      await reload();
      return true;
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addChapter = (name) => {
    const order = selected.chapters.reduce((m, c) => Math.max(m, c.order || 0), 0) + 1;
    return run(() => sendJson('POST', `/utility/subject/${selected._id}/chapters`, { name, studentClass: classId, order }), 'Chapter added');
  };
  const renameChapter = (chapter, name) => run(() => sendJson('PATCH', `/utility/chapter/${chapter._id}`, { name }), 'Chapter renamed');
  const moveChapter = (index, delta) => {
    const next = [...selected.chapters];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    const changes = next.map((c, i) => ({ c, order: i + 1 })).filter(({ c, order }) => c.order !== order);
    return run(() => Promise.all(changes.map(({ c, order }) => sendJson('PATCH', `/utility/chapter/${c._id}`, { order }))));
  };

  const confirmDelete = async () => {
    const { kind, item } = confirm;
    const ok = await run(() => sendJson('DELETE', kind === 'subject' ? `/utility/subject/${item._id}` : `/utility/chapter/${item._id}`), kind === 'subject' ? 'Subject deleted' : 'Chapter deleted');
    if (ok) setConfirm(null);
  };

  const changeLanguage = (value) => run(() => sendJson('PATCH', `/utility/subject/${selected._id}/language-requirement`, { languageRequirement: value }), 'Question language updated');

  const onSubjectSaved = async (saved) => {
    setSubjectDialog({ open: false, subject: null });
    if (saved?._id) select(saved._id);
    await reload();
  };

  // ── render ──
  const empty = status === 'ready' && subjects.length === 0;

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h4" component="h1">Syllabus</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>{`Subjects and chapters for ${board} Class ${classId}, with how many questions each chapter has.`}</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setSubjectDialog({ open: true, subject: null })}>Add subject</Button>
      </Box>

      {status === 'error' && (
        <Panel sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 600 }}>Couldn't load the syllabus</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>The API didn't respond. Check system health, then try again.</Typography>
          <Button variant="outlined" size="small" onClick={reload}>Try again</Button>
        </Panel>
      )}

      {empty && (
        <Panel sx={{ p: 4 }}>
          <Typography variant="h6">{`No subjects in ${board} Class ${classId} yet`}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2, maxWidth: 520 }}>Add a subject, then its chapters. You can also import questions with subject and chapter columns, and anything missing is created for you.</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={() => setSubjectDialog({ open: true, subject: null })}>Add subject</Button>
            <Button variant="outlined" component={Link} to="/questions?import=1">Import questions</Button>
          </Box>
        </Panel>
      )}

      {status !== 'error' && !empty && (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '320px minmax(0, 1fr)' }, alignItems: 'start' }}>
          <Panel sx={{ position: { md: 'sticky' }, top: 16, alignSelf: 'start', maxHeight: { md: 'calc(100vh - 64px - 48px)' }, display: 'flex', flexDirection: 'column' }}>
            <PanelHeader title="Subjects" />
            <Box sx={{ p: 2, flexShrink: 0, borderBottom: `1px solid ${tokens.rule}` }}>
              <TextField size="small" fullWidth placeholder="Search subjects" value={search} onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search size={15} /></InputAdornment> }} inputProps={{ 'aria-label': 'Search subjects' }} />
            </Box>
            {status === 'loading' && subjects.length === 0 ? (
              <Box sx={{ p: 2, display: 'grid', gap: 1 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={44} />)}</Box>
            ) : (
              <Box role="list" sx={{ p: 1.5, flexGrow: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2px', alignContent: 'start' }}>
                {filtered.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>No subject matches "{search}".</Typography>}
                {filtered.map((s) => {
                  const t = totalsOf(s);
                  const active = selected?._id === s._id;
                  return (
                    <Box key={s._id} role="listitem" component="button" type="button" onClick={() => select(s._id)} aria-current={active ? 'true' : undefined}
                      sx={{ display: 'block', width: '100%', textAlign: 'left', border: 0, font: 'inherit', cursor: 'pointer', px: 1.5, py: 1.4, borderRadius: '8px', bgcolor: active ? tokens.inkTint : 'transparent', color: active ? tokens.ink : 'text.primary', '&:hover': { bgcolor: active ? tokens.inkTint : 'action.hover' } }}>
                      <Typography sx={{ fontSize: 14, fontWeight: active ? 600 : 500 }}>{s.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.failed ? 'Chapters unavailable' : `${s.chapters.length} chapter${s.chapters.length === 1 ? '' : 's'}, ${fmt(t.questions)} questions`}
                        {t.empty > 0 && !s.failed && <Box component="span" sx={{ color: tokens.red, fontWeight: 600 }}>{`, ${t.empty} empty`}</Box>}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Panel>

          {selected && (
            <Panel>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, px: 2, py: 1.5, borderBottom: `1px solid ${tokens.rule}` }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" component="h2">{selected.name}</Typography>
                  {selected.stream && <Typography variant="caption" color="text.secondary">{`Stream: ${selected.stream}`}</Typography>}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <TextField select size="small" value={selected.languageRequirement || 'both'} onChange={(e) => changeLanguage(e.target.value)} disabled={busy} sx={{ minWidth: 200 }} inputProps={{ 'aria-label': 'Question language' }}>
                    {LANGUAGE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                  <Button variant="outlined" size="small" startIcon={<Pencil size={14} />} onClick={() => setSubjectDialog({ open: true, subject: selected })}>Edit</Button>
                  <Tooltip title={selected.chapters.length ? `Delete its ${selected.chapters.length} chapters first` : 'Delete subject'}>
                    <span><Button variant="outlined" size="small" color="error" startIcon={<Trash2 size={14} />} disabled={selected.chapters.length > 0 || busy} onClick={() => setConfirm({ kind: 'subject', item: selected })}>Delete</Button></span>
                  </Tooltip>
                </Box>
              </Box>

              <AddChapter onAdd={addChapter} />

              {selected.failed ? (
                <Box sx={{ p: 3 }}><Typography sx={{ fontWeight: 600 }}>Couldn't load chapters</Typography><Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={reload}>Try again</Button></Box>
              ) : selected.chapters.length === 0 ? (
                <Box sx={{ p: 3 }}>
                  <Typography sx={{ fontWeight: 600 }}>No chapters yet</Typography>
                  <Typography variant="body2" color="text.secondary">Type a name above and press Enter to add the first chapter.</Typography>
                </Box>
              ) : (
                <Box role="table" aria-label={`${selected.name} chapters`}>
                  <Box role="row" sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '36px minmax(0, 1fr) 150px 150px', gap: 1.5, px: 2, py: 0.75, bgcolor: '#F8F9FB', borderBottom: `1px solid ${tokens.rule}`, color: 'text.secondary', fontSize: 12, fontWeight: 600 }}>
                    <Box role="columnheader" sx={{ textAlign: 'right' }}>#</Box><Box role="columnheader">Chapter</Box><Box role="columnheader">Questions</Box><Box role="columnheader" />
                  </Box>
                  {selected.chapters.map((c, i) => (
                    <ChapterRow key={c._id} chapter={c} index={i} total={selected.chapters.length} subjectId={selected._id} busy={busy}
                      onRename={renameChapter} onMove={moveChapter} onDelete={(chapter) => setConfirm({ kind: 'chapter', item: chapter })} />
                  ))}
                </Box>
              )}
            </Panel>
          )}
        </Box>
      )}

      <SubjectDialog open={subjectDialog.open} subject={subjectDialog.subject} classId={classId} board={board} onClose={() => setSubjectDialog({ open: false, subject: null })} onSaved={onSubjectSaved} />
      <ConfirmDelete
        open={Boolean(confirm)}
        busy={busy}
        title={confirm?.kind === 'subject' ? `Delete ${confirm?.item.name}?` : `Delete chapter "${confirm?.item.name}"?`}
        body={confirm?.kind === 'subject' ? 'This subject has no chapters, so nothing else is lost. This cannot be undone.' : 'This chapter has no questions, so nothing else is lost. This cannot be undone.'}
        onClose={() => setConfirm(null)}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
