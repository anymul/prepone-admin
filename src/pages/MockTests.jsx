import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, IconButton,
  InputAdornment, Menu, MenuItem, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import { ClipboardCheck, Copy, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '@/components/Panel';
import { useScope } from '@/lib/scope-context';
import { getJson, sendJson, useResource } from '@/lib/useResource';
import { tokens } from '@/theme';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const STATUS_LABEL = { active: 'Active', live: 'Live', draft: 'Draft', upcoming: 'Upcoming', scheduled: 'Scheduled', completed: 'Completed' };
const isPublished = (t) => t.status === 'active' || t.status === 'live';
const dateOf = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

function StatusChip({ status }) {
  const published = status === 'active' || status === 'live';
  return (
    <Chip size="small" variant="outlined" label={STATUS_LABEL[status] || status || 'Draft'}
      sx={{ fontWeight: 600, color: published ? tokens.green : 'text.secondary', borderColor: published ? '#BFE0CE' : tokens.rule, bgcolor: published ? tokens.greenTint : 'transparent' }} />
  );
}

export default function MockTests() {
  const { board, classId } = useScope();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [resource, reload] = useResource(
    (signal) => getJson(`/tests/admin/list?classId=${classId}&board=${board}`, signal),
    [board, classId, tick]
  );

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showPyq, setShowPyq] = useState(false);
  const [menu, setMenu] = useState({ anchor: null, test: null });
  const [confirm, setConfirm] = useState(null); // { kind: 'delete' | 'publish', test }
  const [busy, setBusy] = useState(false);

  const refresh = () => setTick((n) => n + 1);
  const tests = useMemo(() => (Array.isArray(resource.data) ? resource.data : []), [resource.data]);
  const counts = useMemo(() => ({
    all: tests.filter((t) => showPyq || !t.isPYQ).length,
    active: tests.filter((t) => (showPyq || !t.isPYQ) && isPublished(t)).length,
    draft: tests.filter((t) => (showPyq || !t.isPYQ) && t.status === 'draft').length,
  }), [tests, showPyq]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tests
      .filter((t) => showPyq || !t.isPYQ)
      .filter((t) => (filter === 'all' ? true : filter === 'active' ? isPublished(t) : t.status === 'draft'))
      .filter((t) => !term || t.title?.toLowerCase().includes(term) || t.description?.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [tests, filter, search, showPyq]);

  const act = async (fn, success) => {
    setBusy(true);
    try { await fn(); if (success) toast.success(success); refresh(); return true; }
    catch (err) { toast.error(err.message || 'Something went wrong'); return false; }
    finally { setBusy(false); }
  };

  const duplicate = (t) => act(() => sendJson('POST', `/tests/${t._id}/duplicate`), `Copied as a draft: ${t.title}`);
  const setStatus = (t, status) => act(() => sendJson('PATCH', `/tests/${t._id}`, { status }), status === 'draft' ? 'Moved to drafts' : 'Published');
  const remove = async (t) => { if (await act(() => sendJson('DELETE', `/tests/${t._id}`), 'Mock test deleted')) setConfirm(null); };

  const closeMenu = () => setMenu({ anchor: null, test: null });
  const loading = resource.status === 'loading' && !resource.data;

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h4" component="h1">Mock tests</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {resource.data ? `${board} Class ${classId}: ${fmt(counts.all)} tests, ${fmt(counts.active)} active, ${fmt(counts.draft)} in draft.` : `Tests for ${board} Class ${classId}.`}
          </Typography>
        </Box>
        <Button component={Link} to="/mock-tests/new" variant="contained" startIcon={<Plus size={16} />}>New mock test</Button>
      </Box>

      <Panel>
        <Box sx={{ px: 2, py: 1.25, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${tokens.rule}` }}>
          <ToggleButtonGroup exclusive size="small" value={filter} onChange={(_, v) => v && setFilter(v)} aria-label="Status">
            <ToggleButton value="all" sx={{ px: 1.5 }}>{`All ${counts.all}`}</ToggleButton>
            <ToggleButton value="active" sx={{ px: 1.5 }}>{`Active ${counts.active}`}</ToggleButton>
            <ToggleButton value="draft" sx={{ px: 1.5 }}>{`Drafts ${counts.draft}`}</ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControlLabel control={<Checkbox size="small" checked={showPyq} onChange={(e) => setShowPyq(e.target.checked)} />} label={<Typography variant="body2">Show previous-year tests</Typography>} />
            <TextField size="small" placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 240 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search size={15} /></InputAdornment> }} inputProps={{ 'aria-label': 'Search mock tests' }} />
          </Box>
        </Box>

        {resource.status === 'error' ? (
          <Box sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 600 }}>Couldn't load mock tests</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>The API didn't respond. Check system health, then try again.</Typography>
            <Button variant="outlined" size="small" onClick={reload}>Try again</Button>
          </Box>
        ) : loading ? (
          <Box sx={{ p: 2, display: 'grid', gap: 1 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={48} />)}</Box>
        ) : visible.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <Typography sx={{ fontWeight: 600 }}>{search || filter !== 'all' ? 'No mock tests match' : `No mock tests for ${board} Class ${classId} yet`}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {search || filter !== 'all' ? 'Try another filter or search.' : 'Pick the questions yourself, or generate a test from the exam pattern.'}
            </Typography>
            {!search && filter === 'all' && <Button component={Link} to="/mock-tests/new" variant="contained" size="small">New mock test</Button>}
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Test</TableCell><TableCell>Status</TableCell><TableCell>Subjects</TableCell>
                  <TableCell align="right">Questions</TableCell><TableCell align="right">Marks</TableCell><TableCell align="right">Time</TableCell><TableCell>Created</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((t) => (
                  <TableRow key={t._id} hover onClick={() => navigate(`/mock-tests/${t._id}/edit`)} sx={{ cursor: 'pointer', '& td': { verticalAlign: 'top' } }}>
                    <TableCell sx={{ maxWidth: 360 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{t.title}</Typography>
                      {t.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>{t.description}</Typography>}
                      {t.isPYQ && <Typography variant="caption" color="text.secondary">Previous-year test</Typography>}
                    </TableCell>
                    <TableCell><StatusChip status={t.status} /></TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{(t.subjects || []).map((s) => s.name || s).join(', ') || '–'}{t.stream ? <Typography component="span" variant="caption" color="text.secondary">{` (${t.stream})`}</Typography> : null}</TableCell>
                    <TableCell align="right">{fmt(t.questionCount)}</TableCell>
                    <TableCell align="right">{fmt(t.totalMarks)}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{t.durationInMinutes ? `${t.durationInMinutes} min` : '–'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateOf(t.createdAt)}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                      {t.status === 'draft' && <Button size="small" onClick={() => setConfirm({ kind: 'publish', test: t })} disabled={busy}>Publish</Button>}
                      <Tooltip title="More actions"><IconButton size="small" aria-label={`Actions for ${t.title}`} onClick={(e) => setMenu({ anchor: e.currentTarget, test: t })}><MoreHorizontal size={16} /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Panel>

      <Menu anchorEl={menu.anchor} open={Boolean(menu.anchor)} onClose={closeMenu}>
        <MenuItem onClick={() => { navigate(`/mock-tests/${menu.test._id}/edit`); closeMenu(); }}><Pencil size={14} style={{ marginRight: 8 }} />Edit</MenuItem>
        <MenuItem onClick={() => { navigate(`/review?source=test&test=${menu.test._id}`); closeMenu(); }}><ClipboardCheck size={14} style={{ marginRight: 8 }} />Review its questions</MenuItem>
        <MenuItem onClick={() => { duplicate(menu.test); closeMenu(); }}><Copy size={14} style={{ marginRight: 8 }} />Duplicate as draft</MenuItem>
        {menu.test && isPublished(menu.test) && <MenuItem onClick={() => { setStatus(menu.test, 'draft'); closeMenu(); }}>Move to drafts</MenuItem>}
        {menu.test && menu.test.status === 'draft' && <MenuItem onClick={() => { setConfirm({ kind: 'publish', test: menu.test }); closeMenu(); }}>Publish</MenuItem>}
        <MenuItem onClick={() => { setConfirm({ kind: 'delete', test: menu.test }); closeMenu(); }} sx={{ color: tokens.red }}><Trash2 size={14} style={{ marginRight: 8 }} />Delete</MenuItem>
      </Menu>

      <Dialog open={Boolean(confirm)} onClose={busy ? undefined : () => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{confirm?.kind === 'delete' ? `Delete "${confirm?.test.title}"?` : `Publish "${confirm?.test.title}"?`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirm?.kind === 'delete'
              ? 'The test is removed for good, along with its used-question record. Student results already saved are not deleted.'
              : `${board} Class ${classId} students will be able to take this test.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} disabled={busy}>Cancel</Button>
          {confirm?.kind === 'delete'
            ? <Button color="error" variant="contained" disabled={busy} onClick={() => remove(confirm.test)}>Delete</Button>
            : <Button variant="contained" disabled={busy} onClick={async () => { if (await act(() => sendJson('PATCH', `/tests/${confirm.test._id}`, { status: 'active' }), 'Published')) setConfirm(null); }}>Publish</Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
