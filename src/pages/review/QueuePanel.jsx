import { Box, IconButton, MenuItem, Skeleton, TextField, Typography } from '@mui/material';
import { AlertTriangle, CircleDashed, X, XCircle } from 'lucide-react';
import { Bubble } from '@/components/Bubble';
import { Panel } from '@/components/Panel';
import { tokens } from '@/theme';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

function QueueRow({ icon: Icon, label, count, active, onClick, tone }) {
  return (
    <Box component="button" type="button" onClick={onClick} aria-current={active ? 'true' : undefined}
      sx={{ display: 'flex', width: '100%', minHeight: 44, alignItems: 'center', gap: 1.25, textAlign: 'left', border: 0, font: 'inherit', cursor: 'pointer', px: 1.5, py: 1.25, borderRadius: '8px', bgcolor: active ? tokens.inkTint : 'transparent', color: active ? tokens.ink : 'text.primary', '&:hover': { bgcolor: active ? tokens.inkTint : 'action.hover' } }}>
      <Icon size={16} color={tone || (active ? tokens.ink : tokens.muted)} />
      <Typography sx={{ fontSize: 14, fontWeight: active ? 600 : 500, flexGrow: 1, minWidth: 0 }}>{label}</Typography>
      {count != null && <Typography variant="caption" sx={{ color: tone && count > 0 ? tone : 'text.secondary', fontWeight: 600 }}>{fmt(count)}</Typography>}
    </Box>
  );
}

// Where to start reviewing: smart queues, a chapter tree with review progress, and mock tests.
export default function QueuePanel({ syllabus, progress, tests, source, onPick, onClose }) {
  const subjects = syllabus.subjects;
  const totals = Object.values(progress).reduce((t, c) => ({ total: t.total + c.total, approved: t.approved + c.approved, rejected: t.rejected + c.rejected }), { total: 0, approved: 0, rejected: 0 });
  const unreviewed = totals.total - totals.approved - totals.rejected;
  const activeSubject = source?.type === 'chapter' || source?.type === 'subject' ? source.subjectId : null;

  return (
    <Panel sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {onClose && (
        <Box sx={{ p: 1.5, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${tokens.rule}` }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Queues & Chapters</Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close queue drawer" sx={{ minWidth: 40, minHeight: 40 }}>
            <X size={18} />
          </IconButton>
        </Box>
      )}
      <Box sx={{ p: 1.5, flexShrink: 0, borderBottom: `1px solid ${tokens.rule}`, display: 'grid', gap: '2px' }}>
        <QueueRow icon={CircleDashed} label="Not reviewed yet" count={unreviewed} active={source?.type === 'unreviewed'} onClick={() => onPick({ type: 'unreviewed' })} />
        <QueueRow icon={XCircle} label="Rejected" count={totals.rejected} tone={tokens.red} active={source?.type === 'rejected'} onClick={() => onPick({ type: 'rejected' })} />
        <QueueRow icon={AlertTriangle} label="Students keep getting these wrong" active={source?.type === 'flagged'} tone={tokens.amber} onClick={() => onPick({ type: 'flagged' })} />
      </Box>

      <Box sx={{ px: 2.5, pt: 2, pb: 0.5, flexShrink: 0 }}><Typography variant="subtitle2">Chapters</Typography></Box>
      {syllabus.status === 'loading' && subjects.length === 0 ? (
        <Box sx={{ p: 2, display: 'grid', gap: 1 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={30} />)}</Box>
      ) : (
        <Box sx={{ p: 1.5, flexGrow: 1, minHeight: 120, overflowY: 'auto', overflowX: 'hidden' }}>
          {subjects.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>No subjects in this board and class.</Typography>}
          {subjects.map((s) => {
            const open = s._id === activeSubject;
            const sub = s.chapters.reduce((t, c) => ({ total: t.total + (progress[c._id]?.total || 0), done: t.done + (progress[c._id] ? progress[c._id].approved + progress[c._id].rejected : 0) }), { total: 0, done: 0 });
            return (
              <Box key={s._id}>
                <Box component="button" type="button" onClick={() => onPick({ type: 'subject', subjectId: s._id })} aria-expanded={open}
                  sx={{ display: 'flex', width: '100%', minHeight: 44, alignItems: 'center', justifyContent: 'space-between', gap: 1, textAlign: 'left', border: 0, font: 'inherit', cursor: 'pointer', px: 1.5, py: 1.25, borderRadius: '8px', bgcolor: source?.type === 'subject' && source.subjectId === s._id ? tokens.inkTint : 'transparent', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{s.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{sub.total ? `${fmt(sub.done)} of ${fmt(sub.total)}` : 'No questions'}</Typography>
                </Box>
                {open && (
                  <Box sx={{ ml: 1.75, pl: 1, borderLeft: `1px solid ${tokens.rule}`, mb: 1.5, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2px' }}>
                    {s.chapters.map((c) => {
                      const p = progress[c._id] || { total: 0, approved: 0, rejected: 0 };
                      const done = p.approved + p.rejected;
                      const active = source?.type === 'chapter' && source.chapterId === c._id;
                      return (
                        <Box key={c._id} component="button" type="button" onClick={() => onPick({ type: 'chapter', subjectId: s._id, chapterId: c._id })} aria-current={active ? 'true' : undefined}
                          sx={{ display: 'flex', width: '100%', minHeight: 44, alignItems: 'center', gap: 1.25, textAlign: 'left', border: 0, font: 'inherit', cursor: 'pointer', px: 1.5, py: 1.25, borderRadius: '8px', bgcolor: active ? tokens.inkTint : 'transparent', color: active ? tokens.ink : 'text.primary', '&:hover': { bgcolor: active ? tokens.inkTint : 'action.hover' } }}>
                          <Bubble level={p.total === 0 ? 'none' : done === p.total ? 'full' : done > 0 ? 'half' : 'none'} size={12} />
                          <Typography sx={{ fontSize: 14, fontWeight: active ? 600 : 400, flexGrow: 1, minWidth: 0 }} noWrap title={c.name}>{c.name}</Typography>
                          <Typography variant="caption" sx={{ flexShrink: 0, color: p.rejected ? tokens.red : 'text.secondary', fontWeight: p.rejected ? 600 : 400 }}>{p.total ? `${done}/${p.total}` : '0'}</Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      <Box sx={{ p: 2, flexShrink: 0, borderTop: `1px solid ${tokens.rule}` }}>
        <TextField select size="small" fullWidth label="Review a mock test" value={source?.type === 'test' ? source.testId : ''} onChange={(e) => onPick({ type: 'test', testId: e.target.value })} disabled={tests.length === 0}
          SelectProps={{ sx: { minHeight: 44 } }}
          helperText={tests.length === 0 ? 'No mock tests for this board and class.' : undefined}>
          {tests.map((t) => <MenuItem key={t._id} value={t._id}>{`${t.title} (${t.questionCount})`}</MenuItem>)}
        </TextField>
      </Box>
    </Panel>
  );
}
