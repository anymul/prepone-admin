import { useEffect, useState } from 'react';
import { Alert, Box, Button, Drawer, FormControlLabel, IconButton, MenuItem, Switch, TextField, Typography } from '@mui/material';
import { Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import LatexRenderer from '@/components/LatexRenderer';
import { sendJson } from '@/lib/useResource';
import { tokens } from '@/theme';

export const MAX_TEXT = 1500;
const blank = () => ({ frontText: '', backText: '', difficulty: 'medium', tags: '', isActive: true });
const toForm = (card) => ({ frontText: card.frontText || '', backText: card.backText || '', difficulty: card.difficulty || 'medium', tags: (card.tags || []).join(', '), isActive: card.isActive !== false });
export const parseTags = (text) => [...new Set(String(text).split(',').map((t) => t.trim()).filter(Boolean))];

function Side({ label, text }) {
  return (
    <Box sx={{ border: `1px solid ${tokens.rule}`, borderRadius: '8px', p: 2, minHeight: 84, bgcolor: '#F8F9FB' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Box sx={{ fontSize: 15, lineHeight: 1.6, mt: 0.5, whiteSpace: 'pre-wrap' }}>{text.trim() ? <LatexRenderer text={text} /> : <Typography color="text.secondary" component="span">Nothing yet</Typography>}</Box>
    </Box>
  );
}

// mode: 'create' | 'edit'
export default function CardEditor({ open, mode, card, chapter, onClose, onSaved, onDelete }) {
  const creating = mode === 'create';
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(creating ? blank() : toForm(card));
    setError('');
    setBusy(false);
  }, [open, creating, card]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const problems = [];
  if (!form.frontText.trim()) problems.push('Write the front of the card.');
  if (!form.backText.trim()) problems.push('Write the back of the card.');
  if (form.frontText.length > MAX_TEXT || form.backText.length > MAX_TEXT) problems.push(`Each side can be at most ${MAX_TEXT} characters.`);

  const save = async () => {
    if (problems.length) return;
    setBusy(true);
    setError('');
    const body = { frontText: form.frontText.trim(), backText: form.backText.trim(), difficulty: form.difficulty, tags: parseTags(form.tags), isActive: form.isActive };
    try {
      if (creating) await sendJson('POST', '/flashcards/admin', { ...body, chapterId: chapter._id });
      else await sendJson('PATCH', `/flashcards/admin/${card._id}`, body);
      toast.success(creating ? 'Card added' : 'Card saved');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={busy ? undefined : onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, maxWidth: '100%' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 3, py: 2, borderBottom: `1px solid ${tokens.rule}` }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" component="h2">{creating ? 'Add a flashcard' : 'Edit flashcard'}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{chapter?.name}</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" disabled={busy}><X size={18} /></IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'grid', gap: 2.5, alignContent: 'start' }}>
          <TextField label="Front (the question or term)" value={form.frontText} onChange={(e) => set({ frontText: e.target.value })} multiline minRows={2} fullWidth disabled={busy} helperText="Wrap maths in $...$, for example $x^2$." />
          <TextField label="Back (the answer)" value={form.backText} onChange={(e) => set({ backText: e.target.value })} multiline minRows={3} fullWidth disabled={busy} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' } }}>
            <TextField select label="Difficulty" value={form.difficulty} onChange={(e) => set({ difficulty: e.target.value })} disabled={busy}>
              {['easy', 'medium', 'hard'].map((d) => <MenuItem key={d} value={d} sx={{ textTransform: 'capitalize' }}>{d}</MenuItem>)}
            </TextField>
            <TextField label="Tags (comma separated, optional)" value={form.tags} onChange={(e) => set({ tags: e.target.value })} disabled={busy} />
          </Box>
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} disabled={busy} />} label={form.isActive ? 'Shown to students' : 'Hidden from students'} />

          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography variant="subtitle2">How students see it</Typography>
            <Side label="Front" text={form.frontText} />
            <Side label="Back" text={form.backText} />
          </Box>
          {error && <Alert severity="error" role="alert">{error}</Alert>}
        </Box>

        <Box sx={{ borderTop: `1px solid ${tokens.rule}`, p: 2, display: 'grid', gap: 1.25 }}>
          {problems.length > 0 && <Alert severity="info" sx={{ py: 0 }}>{problems.join(' ')}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Box>{!creating && onDelete && <Button color="error" startIcon={<Trash2 size={14} />} onClick={() => onDelete(card)} disabled={busy}>Delete</Button>}</Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={onClose} disabled={busy}>Cancel</Button>
              <Button variant="contained" onClick={save} disabled={busy || problems.length > 0}>{creating ? 'Add card' : 'Save changes'}</Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
