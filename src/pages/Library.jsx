import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, InputAdornment, Menu, MenuItem, Skeleton, Tab, Table,
  TableBody, TableCell, TableHead, TablePagination, TableRow, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import { ExternalLink, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '@/components/Panel';
import { API_BASE_URL, safeHttpUrl } from '@/lib/api';
import { useScope } from '@/lib/scope-context';
import { loadSyllabus } from '@/lib/syllabusData';
import { formatBytes } from '@/lib/upload';
import { getJson, sendJson, useResource } from '@/lib/useResource';
import { tokens } from '@/theme';
import UploadDrawer, { LANGUAGES } from './library/UploadDrawer';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const PAGE_SIZE = 20;
const TABS = [{ id: 'papers', label: 'Previous year papers' }, { id: 'notes', label: 'Revision notes' }];
const YEARS = Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - i);

// Files are served by the API; relative paths (e.g. /uploads/...) are resolved against its origin.
const apiOrigin = (() => { try { return new URL(API_BASE_URL, window.location.origin).origin; } catch { return window.location.origin; } })();
const fileHref = (url) => safeHttpUrl(url, apiOrigin);
const languageLabel = (l) => LANGUAGES.find((x) => x.value === String(l || '').toLowerCase())?.label || (l ? l : 'English and Hindi');

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

const Empty = ({ title, body, action }) => (
  <Box sx={{ p: 4 }}>
    <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 2 : 0 }}>{body}</Typography>
    {action}
  </Box>
);

export default function Library() {
  const { board, classId } = useScope();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'papers';
  const isPapers = tab === 'papers';

  // shared: syllabus for the scoped board + class (subject and chapter pickers)
  const [syllabus, setSyllabus] = useState({ status: 'loading', subjects: [] });
  useEffect(() => {
    const controller = new AbortController();
    setSyllabus((s) => ({ ...s, status: 'loading' }));
    loadSyllabus(board, classId, controller.signal)
      .then((subjects) => setSyllabus({ status: 'ready', subjects }))
      .catch((err) => { if (err?.name !== 'AbortError') setSyllabus({ status: 'error', subjects: [] }); });
    return () => controller.abort();
  }, [board, classId]);

  // filters
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [page, setPage] = useState(0);
  useEffect(() => { setSubjectId(''); setChapterId(''); }, [board, classId]);
  useEffect(() => { setPage(0); }, [tab, board, classId, subjectId, chapterId, year, status, debouncedSearch]);

  const subject = syllabus.subjects.find((s) => s._id === subjectId);

  // list
  const [tick, setTick] = useState(0);
  const query = useMemo(() => {
    const q = new URLSearchParams({ board, studentClass: String(classId), page: String(page + 1), limit: String(PAGE_SIZE) });
    if (isPapers) {
      if (subjectId) q.set('subject', subjectId);
      if (year) q.set('year', year);
    } else {
      if (subjectId) q.set('subjectId', subjectId);
      if (chapterId) q.set('chapterId', chapterId);
      if (status === 'published') q.set('isPublished', 'true');
      if (status === 'draft') q.set('isPublished', 'false');
      if (status === 'premium') q.set('isPremium', 'true');
      if (debouncedSearch.trim()) q.set('search', debouncedSearch.trim());
    }
    return q.toString();
  }, [isPapers, board, classId, page, subjectId, chapterId, year, status, debouncedSearch]);
  const [list, reload] = useResource((signal) => getJson(`${isPapers ? '/pyqs' : '/revision-notes'}?${query}`, signal, { raw: true }), [isPapers, query, tick]);
  const refresh = () => setTick((n) => n + 1);

  const rows = isPapers ? (list.data?.pyqs || []) : (list.data?.data || []);
  const total = isPapers ? (list.data?.totalCount ?? 0) : (list.data?.pagination?.total ?? 0);
  const filtersActive = Boolean(subjectId || chapterId || year || search || status !== 'all');
  const loading = list.status === 'loading' && !list.data;

  // upload / edit / delete
  const [drawer, setDrawer] = useState({ open: false, mode: 'create', item: null });
  const [menu, setMenu] = useState({ anchor: null, item: null });
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const removeItem = async () => {
    setBusy(true);
    try {
      await sendJson('DELETE', `${isPapers ? '/pyqs' : '/revision-notes'}/${confirm._id}`);
      toast.success(isPapers ? 'Paper deleted' : 'Note deleted');
      setConfirm(null);
      refresh();
    } catch (err) { toast.error(err.message || "Couldn't delete it"); }
    finally { setBusy(false); }
  };
  const togglePublished = async (note) => {
    try {
      await sendJson('PUT', `/revision-notes/${note._id}`, { isPublished: !note.isPublished });
      toast.success(note.isPublished ? 'Moved to drafts' : 'Published');
      refresh();
    } catch (err) { toast.error(err.message || "Couldn't update the note"); }
  };

  const changeTab = (_, value) => setParams(value === 'papers' ? {} : { tab: value }, { replace: true });
  const openNew = () => setDrawer({ open: true, mode: 'create', item: null });
  const noun = isPapers ? 'paper' : 'note';

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1 }}>
        <Box>
          <Typography variant="h4" component="h1">Library</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>{`Previous year papers and short revision notes for ${board} Class ${classId}.`}</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={openNew}>{isPapers ? 'Upload paper' : 'Upload note'}</Button>
      </Box>

      <Tabs value={tab} onChange={changeTab} aria-label="Library sections" sx={{ mb: 2.5, borderBottom: `1px solid ${tokens.rule}` }}>
        {TABS.map((t) => <Tab key={t.id} value={t.id} label={t.label} />)}
      </Tabs>

      <Panel>
        <Box sx={{ px: 2, py: 1.25, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', borderBottom: `1px solid ${tokens.rule}` }}>
          <TextField select size="small" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setChapterId(''); }} sx={{ minWidth: 160 }} inputProps={{ 'aria-label': 'Subject' }} SelectProps={{ displayEmpty: true }}>
            <MenuItem value="">All subjects</MenuItem>
            {syllabus.subjects.map((s) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
          </TextField>
          {isPapers ? (
            <TextField select size="small" value={year} onChange={(e) => setYear(e.target.value)} sx={{ minWidth: 120 }} inputProps={{ 'aria-label': 'Year' }} SelectProps={{ displayEmpty: true }}>
              <MenuItem value="">Any year</MenuItem>
              {YEARS.map((y) => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
            </TextField>
          ) : (
            <>
              <TextField select size="small" value={chapterId} onChange={(e) => setChapterId(e.target.value)} disabled={!subject} sx={{ minWidth: 170 }} inputProps={{ 'aria-label': 'Chapter' }} SelectProps={{ displayEmpty: true }}>
                <MenuItem value="">All chapters</MenuItem>
                {(subject?.chapters || []).map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
              </TextField>
              <TextField select size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 140 }} inputProps={{ 'aria-label': 'Status' }}>
                <MenuItem value="all">Any status</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="draft">Drafts</MenuItem>
                <MenuItem value="premium">Premium only</MenuItem>
              </TextField>
              <TextField size="small" placeholder="Search notes" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 200, flexGrow: 1, maxWidth: 300 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search size={15} /></InputAdornment> }} inputProps={{ 'aria-label': 'Search notes' }} />
            </>
          )}
          {filtersActive && <Button size="small" onClick={() => { setSubjectId(''); setChapterId(''); setYear(''); setStatus('all'); setSearch(''); }}>Clear filters</Button>}
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>{list.data ? `${fmt(total)} ${noun}${total === 1 ? '' : 's'}` : ''}</Typography>
        </Box>

        {list.status === 'error' ? (
          <Empty title={`Couldn't load the ${noun}s`} body="The API didn't respond. Check system health, then try again." action={<Button variant="outlined" size="small" onClick={reload}>Try again</Button>} />
        ) : loading ? (
          <Box sx={{ p: 2, display: 'grid', gap: 1 }}>{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={48} />)}</Box>
        ) : rows.length === 0 ? (
          <Empty
            title={filtersActive ? `No ${noun}s match these filters` : `No ${noun}s for ${board} Class ${classId} yet`}
            body={filtersActive ? 'Try removing a filter.' : isPapers ? 'Upload a past exam paper as a PDF and students can open it from the app.' : 'Upload a short revision note as a PDF, tied to a chapter.'}
            action={!filtersActive && <Button variant="contained" size="small" onClick={openNew}>{isPapers ? 'Upload paper' : 'Upload note'}</Button>}
          />
        ) : (
          <Box sx={{ overflowX: 'auto', opacity: list.status === 'loading' ? 0.5 : 1, transition: 'opacity 150ms' }}>
            <Table size="small">
              <TableHead>
                {isPapers ? (
                  <TableRow><TableCell>Paper</TableCell><TableCell>Subject</TableCell><TableCell>Year</TableCell><TableCell>Added</TableCell><TableCell /></TableRow>
                ) : (
                  <TableRow><TableCell>Note</TableCell><TableCell>Subject and chapter</TableCell><TableCell>File</TableCell><TableCell>Access</TableCell><TableCell align="right">Reads</TableCell><TableCell /></TableRow>
                )}
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const href = fileHref(isPapers ? row.fileUrl : row.pdfUrl);
                  return (
                    <TableRow key={row._id} hover sx={{ '& td': { verticalAlign: 'top' } }}>
                      {isPapers ? (
                        <>
                          <TableCell sx={{ fontWeight: 600 }}>{row.title || row.examName || 'Untitled'}</TableCell>
                          <TableCell>{row.subject?.name || '–'}</TableCell>
                          <TableCell>{row.year}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell sx={{ maxWidth: 340 }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{row.title}</Typography>
                            {row.description && <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{row.description}</Typography>}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13.5 }}>{row.subjectId?.name || '–'}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.chapterId?.name || ''}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13.5 }}>{row.pageCount ? `${row.pageCount} pages` : 'Pages unknown'}</Typography>
                            <Typography variant="caption" color="text.secondary">{[formatBytes(row.fileSizeBytes), languageLabel(row.language)].filter(Boolean).join(', ')}</Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Chip size="small" variant="outlined" label={row.isPublished ? 'Published' : 'Draft'} sx={{ fontWeight: 600, color: row.isPublished ? tokens.green : 'text.secondary', borderColor: row.isPublished ? '#BFE0CE' : tokens.rule, bgcolor: row.isPublished ? tokens.greenTint : 'transparent' }} />
                            {row.isPremium && <Chip size="small" label="Premium" sx={{ ml: 0.5, bgcolor: tokens.amberTint, color: tokens.amber, fontWeight: 600 }} />}
                            {row.board === 'both' && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Both boards</Typography>}
                          </TableCell>
                          <TableCell align="right"><Typography variant="caption" sx={{ display: 'block' }}>{`${fmt(row.viewCount)} views`}</Typography><Typography variant="caption" color="text.secondary">{`${fmt(row.downloadCount)} downloads`}</Typography></TableCell>
                        </>
                      )}
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {href && <Tooltip title="Open the PDF"><IconButton size="small" component="a" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${row.title || 'file'} (new tab)`}><ExternalLink size={15} /></IconButton></Tooltip>}
                        <Tooltip title="Edit"><IconButton size="small" aria-label="Edit" onClick={() => setDrawer({ open: true, mode: 'edit', item: row })}><Pencil size={15} /></IconButton></Tooltip>
                        <IconButton size="small" aria-label={`More actions for ${row.title || 'item'}`} onClick={(e) => setMenu({ anchor: e.currentTarget, item: row })}><MoreHorizontal size={15} /></IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={PAGE_SIZE} rowsPerPageOptions={[PAGE_SIZE]} labelRowsPerPage="Per page" />
          </Box>
        )}
      </Panel>

      <Menu anchorEl={menu.anchor} open={Boolean(menu.anchor)} onClose={() => setMenu({ anchor: null, item: null })}>
        {!isPapers && menu.item && <MenuItem onClick={() => { togglePublished(menu.item); setMenu({ anchor: null, item: null }); }}>{menu.item.isPublished ? 'Move to drafts' : 'Publish'}</MenuItem>}
        <MenuItem onClick={() => { setConfirm(menu.item); setMenu({ anchor: null, item: null }); }} sx={{ color: tokens.red }}><Trash2 size={14} style={{ marginRight: 8 }} />Delete</MenuItem>
      </Menu>

      <Dialog open={Boolean(confirm)} onClose={busy ? undefined : () => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{`Delete "${confirm?.title || confirm?.examName || 'this item'}"?`}</DialogTitle>
        <DialogContent><DialogContentText>{isPapers ? 'Students will no longer see this paper. This cannot be undone.' : 'The note and its PDF are removed from storage. This cannot be undone.'}</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} disabled={busy}>Cancel</Button>
          <Button color="error" variant="contained" onClick={removeItem} disabled={busy}>Delete</Button>
        </DialogActions>
      </Dialog>

      <UploadDrawer
        open={drawer.open} kind={isPapers ? 'paper' : 'note'} mode={drawer.mode} item={drawer.item} syllabus={syllabus.subjects} board={board} classId={classId} defaultSubjectId={subjectId}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))} onSaved={() => { setDrawer((d) => ({ ...d, open: false })); refresh(); }}
      />
    </Box>
  );
}
