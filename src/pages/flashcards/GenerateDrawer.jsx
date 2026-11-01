import { useEffect, useState } from 'react';
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Drawer, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import LatexRenderer from '@/components/LatexRenderer';
import { sendJson } from '@/lib/useResource';
import { tokens } from '@/theme';

const COUNTS = [5, 10, 15, 20, 25];
const DIFF_COLOR = { easy: tokens.green, medium: tokens.amber, hard: tokens.red };

// Draft cards with the AI, review them, and save only the ones you keep. Nothing is saved until you press Add.
export default function GenerateDrawer({ open, subject, chapter, onClose, onSaved }) {
  const [count, setCount] = useState(10);
  const [context, setContext] = useState('');
  const [phase, setPhase] = useState('setup'); // setup | working | review
  const [cards, setCards] = useState([]);
  const [keep, setKeep] = useState({});
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setPhase('setup'); setCards([]); setKeep({}); setEditing(null); setError(''); setSaving(false); setContext(''); }
  }, [open, chapter?._id]);

  const generate = async () => {
    setPhase('working');
    setError('');
    try {
      const data = await sendJson('POST', '/flashcards/admin/generate-preview', { chapterId: chapter._id, count, additionalContext: context });
      setCards(data.cards);
      setKeep(Object.fromEntries(data.cards.map((c, i) => [i, !c.duplicate])));
      setEditing(null);
      setPhase('review');
    } catch (err) {
      setError(err.message);
      setPhase('setup');
    }
  };

  const edit = (i, patch) => setCards((list) => list.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const chosen = cards.filter((_, i) => keep[i]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const data = await sendJson('POST', '/flashcards/admin/bulk-create', { chapterId: chapter._id, cards: chosen.map(({ frontText, backText, difficulty, tags }) => ({ frontText, backText, difficulty, tags })) });
      toast.success(`${data.created} card${data.created === 1 ? '' : 's'} added${data.skippedDuplicates ? `, ${data.skippedDuplicates} skipped as duplicates` : ''}`);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={phase === 'working' || saving ? undefined : onClose} PaperProps={{ sx: { width: { xs: '100%', md: 640 }, maxWidth: '100%' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 3, py: 2, borderBottom: `1px solid ${tokens.rule}` }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" component="h2">Write cards with AI</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{[subject?.name, chapter?.name].filter(Boolean).join(' / ')}</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" disabled={phase === 'working' || saving}><X size={18} /></IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'grid', gap: 2, alignContent: 'start' }}>
          {phase !== 'review' && (
            <>
              <Typography color="text.secondary">The AI drafts cards for this chapter. You review them first, and only the cards you keep are saved.</Typography>
              <TextField select label="How many cards" value={count} onChange={(e) => setCount(Number(e.target.value))} disabled={phase === 'working'} sx={{ maxWidth: 200 }}>
                {COUNTS.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
              </TextField>
              <TextField label="Anything to focus on (optional)" value={context} onChange={(e) => setContext(e.target.value)} multiline minRows={2} disabled={phase === 'working'} inputProps={{ maxLength: 1000 }} placeholder="For example: formulas, definitions, common mistakes" />
              {phase === 'working' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#F8F9FB', border: `1px solid ${tokens.rule}`, borderRadius: '6px' }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2">Writing cards. This can take up to a minute.</Typography>
                </Box>
              )}
            </>
          )}

          {phase === 'review' && (
            <>
              <Typography sx={{ fontWeight: 600 }}>{`${cards.length} cards drafted. ${chosen.length} selected.`}</Typography>
              {cards.length === 0 && <Typography color="text.secondary">The AI didn't return any usable cards. Try again.</Typography>}
              {cards.map((c, i) => (
                <Box key={i} sx={{ border: `1px solid ${keep[i] ? tokens.ink : tokens.rule}`, borderRadius: '8px', p: 1.5, bgcolor: keep[i] ? tokens.inkTint : 'transparent' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                    <Checkbox size="small" checked={Boolean(keep[i])} onChange={(e) => setKeep((k) => ({ ...k, [i]: e.target.checked }))} inputProps={{ 'aria-label': `Keep card ${i + 1}` }} sx={{ mt: '-4px' }} />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      {editing === i ? (
                        <Box sx={{ display: 'grid', gap: 1 }}>
                          <TextField size="small" label="Front" value={c.frontText} onChange={(e) => edit(i, { frontText: e.target.value })} multiline fullWidth />
                          <TextField size="small" label="Back" value={c.backText} onChange={(e) => edit(i, { backText: e.target.value })} multiline fullWidth />
                          <Box><Button size="small" onClick={() => setEditing(null)}>Done</Button></Box>
                        </Box>
                      ) : (
                        <>
                          <Box sx={{ fontSize: 14, fontWeight: 600 }}><LatexRenderer text={c.frontText} /></Box>
                          <Box sx={{ fontSize: 14, color: 'text.secondary', mt: 0.5 }}><LatexRenderer text={c.backText} /></Box>
                        </>
                      )}
                      <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', mt: 0.75, flexWrap: 'wrap' }}>
                        <Chip size="small" variant="outlined" label={c.difficulty} sx={{ textTransform: 'capitalize', color: DIFF_COLOR[c.difficulty], borderColor: DIFF_COLOR[c.difficulty] }} />
                        {c.duplicate && <Chip size="small" label="Already in this chapter" sx={{ bgcolor: tokens.amberTint, color: tokens.amber }} />}
                        {editing !== i && <Button size="small" onClick={() => setEditing(i)}>Edit</Button>}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </>
          )}
          {error && <Alert severity="error" role="alert">{error}</Alert>}
        </Box>

        <Box sx={{ borderTop: `1px solid ${tokens.rule}`, p: 2, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Box>{phase === 'review' && <Button onClick={generate} disabled={saving}>Generate again</Button>}</Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} disabled={phase === 'working' || saving}>Cancel</Button>
            {phase !== 'review'
              ? <Button variant="contained" onClick={generate} disabled={phase === 'working'}>Write cards</Button>
              : <Button variant="contained" onClick={save} disabled={saving || chosen.length === 0}>{chosen.length ? `Add ${chosen.length} card${chosen.length === 1 ? '' : 's'}` : 'Add cards'}</Button>}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
