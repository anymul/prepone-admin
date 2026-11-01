import { useCallback, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, Drawer, IconButton, LinearProgress, Typography } from '@mui/material';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import LatexRenderer from '@/components/LatexRenderer';
import { changedFields, changesAnswerKey, suggestionPatch } from '@/lib/review';
import { sendJson } from '@/lib/useResource';
import { tokens } from '@/theme';

const BATCH_LIMIT = 50;
const CONCURRENCY = 2;

const show = (v) => (v && typeof v === 'object' && ('en' in v || 'hi' in v) ? [v.en && `EN: ${v.en}`, v.hi && `HI: ${v.hi}`].filter(Boolean).join('\n') : v == null ? '' : String(v));
const optionLabel = (i) => 'ABCDEFGH'[i] || String(i + 1);

// AI LaTeX clean-up as suggestions: nothing is saved until the reviewer applies it.
export function useSuggestions({ onApplied }) {
  const [items, setItems] = useState([]);
  const [run, setRun] = useState({ running: false, done: 0, total: 0, failed: 0 });
  const stopRef = useRef(false);

  const suggestFor = useCallback(async (q) => {
    const payload = { questionType: q.questionType || 'MCQ', questionText: q.questionText, explanation: q.explanation, correctOptionIndex: q.correctOptionIndex };
    if ((q.questionType || 'MCQ') === 'MCQ') payload.options = q.options;
    const data = await sendJson('POST', '/utility/ai/fix-latex', payload);
    const after = { questionText: data.questionText, options: data.options, explanation: data.explanation, correctOptionIndex: data.correctOptionIndex };
    const changes = changedFields(q, { ...q, ...Object.fromEntries(Object.entries(after).filter(([, v]) => v !== undefined)) });
    return changes.length ? { id: q._id, question: q, after, changes, keyChanged: changesAnswerKey(q, after), status: 'pending' } : null;
  }, []);

  const addItems = (found) => setItems((prev) => [...found, ...prev.filter((p) => !found.some((f) => f.id === p.id))]);

  const suggestOne = useCallback(async (q) => {
    setRun({ running: true, done: 0, total: 1, failed: 0 });
    try {
      const found = await suggestFor(q);
      if (found) addItems([found]);
      else toast.success('The AI found no LaTeX problems in this question.');
      return Boolean(found);
    } catch (err) {
      toast.error(err.message || "The AI couldn't check this question");
      return false;
    } finally {
      setRun({ running: false, done: 1, total: 1, failed: 0 });
    }
  }, [suggestFor]);

  const suggestMany = useCallback(async (questions) => {
    const targets = questions.slice(0, BATCH_LIMIT);
    stopRef.current = false;
    setRun({ running: true, done: 0, total: targets.length, failed: 0 });
    let next = 0;
    let done = 0;
    let failed = 0;
    const worker = async () => {
      while (next < targets.length && !stopRef.current) {
        const q = targets[next];
        next += 1;
        try {
          const found = await suggestFor(q);
          if (found) addItems([found]);
        } catch { failed += 1; }
        done += 1;
        setRun({ running: true, done, total: targets.length, failed });
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
    setRun({ running: false, done, total: targets.length, failed });
    return { checked: done, failed, capped: questions.length > BATCH_LIMIT };
  }, [suggestFor]);

  const setStatus = (id, status) => setItems((list) => list.map((i) => (i.id === id ? { ...i, status } : i)));
  const apply = useCallback(async (item) => {
    try {
      const patch = suggestionPatch(item.question, item.after);
      await sendJson('PATCH', `/utility/question/${item.id}`, patch);
      onApplied(item.id, patch);
      setStatus(item.id, 'applied');
      return true;
    } catch (err) {
      toast.error(err.message || "Couldn't apply the suggestion");
      setStatus(item.id, 'error');
      return false;
    }
  }, [onApplied]);
  const discard = useCallback((item) => setStatus(item.id, 'discarded'), []);
  const stop = () => { stopRef.current = true; };
  const clear = () => setItems([]);

  return { items, run, suggestOne, suggestMany, apply, discard, stop, clear };
}

function Diff({ change }) {
  const cell = (label, value) => (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Box component="pre" sx={{ m: 0, mt: 0.25, p: 1, bgcolor: '#F8F9FB', border: `1px solid ${tokens.rule}`, borderRadius: '5px', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>{show(value) || ' '}</Box>
    </Box>
  );
  const answerKey = change.key === 'correctOptionIndex';
  return (
    <Box sx={{ display: 'grid', gap: 0.75 }}>
      <Typography variant="subtitle2" sx={{ color: answerKey ? tokens.red : 'text.primary' }}>{change.label}</Typography>
      <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        {cell('Now', answerKey ? `Option ${optionLabel(change.before)}` : change.before)}
        {cell('Suggested', answerKey ? `Option ${optionLabel(change.after)}` : change.after)}
      </Box>
      {!answerKey && change.after && (
        <Box sx={{ fontSize: 14, p: 1, border: `1px solid ${tokens.rule}`, borderRadius: '5px' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Preview of the suggestion</Typography>
          <LatexRenderer text={show(change.after).replace(/^(EN|HI): /gm, '')} />
        </Box>
      )}
    </Box>
  );
}

function Item({ item, onApply, onDiscard }) {
  const settled = item.status !== 'pending' && item.status !== 'error';
  const title = item.question.questionText?.en || item.question.questionText?.hi || 'Question';
  return (
    <Box sx={{ border: `1px solid ${item.keyChanged ? '#F0C9C9' : tokens.rule}`, borderRadius: '8px', p: 1.75, display: 'grid', gap: 1.25, opacity: settled ? 0.6 : 1 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{[item.question.chapterName, `${item.changes.length} change${item.changes.length === 1 ? '' : 's'}`].filter(Boolean).join(', ')}</Typography>
        </Box>
        {item.status === 'applied' && <Chip size="small" label="Applied" sx={{ bgcolor: tokens.greenTint, color: tokens.green }} />}
        {item.status === 'discarded' && <Chip size="small" label="Discarded" />}
      </Box>
      {item.keyChanged && <Alert severity="error" sx={{ py: 0 }}>This suggestion changes the answer key. Check it against the question before applying.</Alert>}
      {!settled && item.changes.map((c) => <Diff key={c.key} change={c} />)}
      {!settled && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant={item.keyChanged ? 'outlined' : 'contained'} color={item.keyChanged ? 'error' : 'primary'} onClick={() => onApply(item)}>{item.keyChanged ? 'Apply anyway' : 'Apply'}</Button>
          <Button size="small" onClick={() => onDiscard(item)}>Discard</Button>
          {item.status === 'error' && <Typography variant="caption" sx={{ color: tokens.red, alignSelf: 'center' }}>Couldn't save. Try again.</Typography>}
        </Box>
      )}
    </Box>
  );
}

export default function SuggestDrawer({ open, onClose, suggestions }) {
  const { items, run, apply, discard, stop, clear } = suggestions;
  const pending = items.filter((i) => i.status === 'pending' || i.status === 'error');
  const safe = pending.filter((i) => !i.keyChanged);

  const applyAllSafe = async () => {
    let ok = 0;
    for (const item of safe) if (await apply(item)) ok += 1;
    if (ok) toast.success(`${ok} suggestion${ok === 1 ? '' : 's'} applied`);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 680 }, maxWidth: '100%' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 3, py: 2, borderBottom: `1px solid ${tokens.rule}` }}>
          <Box>
            <Typography variant="h5" component="h2">LaTeX suggestions</Typography>
            <Typography variant="body2" color="text.secondary">The AI proposes fixes. Nothing changes until you apply a suggestion.</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close"><X size={18} /></IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'grid', gap: 2, alignContent: 'start' }}>
          {run.running && (
            <Box>
              <LinearProgress variant="determinate" value={run.total ? (run.done / run.total) * 100 : 0} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{`Checked ${run.done} of ${run.total}${run.failed ? `, ${run.failed} could not be checked` : ''}`}</Typography>
                {run.total > 1 && <Button size="small" onClick={stop}>Stop</Button>}
              </Box>
            </Box>
          )}
          {!run.running && run.total > 1 && <Typography variant="body2" color="text.secondary">{`Checked ${run.done} questions${run.failed ? `, ${run.failed} could not be checked` : ''}. ${items.length} have suggestions.`}</Typography>}
          {items.length === 0 && !run.running && <Typography color="text.secondary">No suggestions yet. Ask the AI to check a question, or the unreviewed questions in this queue.</Typography>}
          {items.map((item) => <Item key={item.id} item={item} onApply={apply} onDiscard={discard} />)}
        </Box>

        <Box sx={{ borderTop: `1px solid ${tokens.rule}`, p: 2, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Button onClick={clear} disabled={items.length === 0 || run.running}>Clear list</Button>
          <Button variant="contained" onClick={applyAllSafe} disabled={safe.length === 0 || run.running}>{safe.length ? `Apply ${safe.length} that keep the answer key` : 'Apply all'}</Button>
        </Box>
      </Box>
    </Drawer>
  );
}
