import { useMemo, useState } from 'react';
import { Alert, Box, Button, Checkbox, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Sparkles } from 'lucide-react';
import boardConfig from '@/pages/config/boardConfig.json';
import { QUESTION_TYPES, TYPE_LABELS, distributeEvenly, drawQuestions, planTotal, typeOf } from '@/lib/draw';
import { tokens } from '@/theme';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const SHORT = { MCQ: 'Multiple choice', VeryShortSubjective: 'Very short', ShortSubjective: 'Short', LongSubjective: 'Long', CompetencyBased: 'Competency' };

// Draw a test from a per-chapter plan: how many questions of each type from each chapter.
export default function Generator({ board, classId, subject, questions, used, selectedCount, onDraw }) {
  const [allTypes, setAllTypes] = useState(false);
  const [avoidUsed, setAvoidUsed] = useState(true);
  const [plan, setPlan] = useState({});
  const [shortfalls, setShortfalls] = useState([]);

  const types = allTypes ? QUESTION_TYPES : ['MCQ'];
  const official = boardConfig[board]?.[String(classId)]?.[subject.name] || null;

  const available = useMemo(() => {
    const table = {};
    subject.chapters.forEach((c) => { table[c._id] = {}; });
    questions.forEach((q) => {
      const id = String(q.chapterId?._id ?? q.chapterId);
      if (!table[id] || (avoidUsed && used.has(q._id))) return;
      table[id][typeOf(q)] = (table[id][typeOf(q)] || 0) + 1;
    });
    return table;
  }, [subject, questions, used, avoidUsed]);

  const total = planTotal(plan, types);
  const setCell = (chapterId, type, raw) => {
    const max = available[chapterId]?.[type] || 0;
    const value = Math.max(0, Math.min(Number.parseInt(raw, 10) || 0, max));
    setPlan((p) => ({ ...p, [chapterId]: { ...p[chapterId], [type]: value } }));
  };

  const fillFromPattern = () => {
    const sections = official.sectionStructure.map(({ type, count }) => ({ type, count }));
    // Counts a chapter cannot supply are reported as a shortfall after drawing.
    const wanted = distributeEvenly(sections, subject.chapters.map((c) => c._id), types);
    setPlan(wanted);
    setShortfalls([]);
  };

  const draw = () => {
    const { picked, shortfalls: gaps } = drawQuestions(questions, plan, { used, avoidUsed, types });
    setShortfalls(gaps);
    onDraw(picked);
  };

  const chapterName = (id) => subject.chapters.find((c) => c._id === id)?.name || 'Unknown chapter';

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <ToggleButtonGroup exclusive size="small" value={allTypes ? 'all' : 'mcq'} onChange={(_, v) => v && setAllTypes(v === 'all')} aria-label="Question types">
          <ToggleButton value="mcq" sx={{ px: 1.5 }}>Multiple choice only</ToggleButton>
          <ToggleButton value="all" sx={{ px: 1.5 }}>All question types</ToggleButton>
        </ToggleButtonGroup>
        <Box component="label" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13, cursor: 'pointer' }}>
          <Checkbox size="small" checked={avoidUsed} onChange={(e) => setAvoidUsed(e.target.checked)} />
          Skip questions used in other tests
        </Box>
      </Box>

      {official && (
        <Box sx={{ p: 1.5, border: `1px solid ${tokens.rule}`, borderRadius: '6px', bgcolor: '#F8F9FB', display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{`${board} Class ${classId} ${subject.name} paper pattern: ${official.totalMarks} marks`}</Typography>
            <Typography variant="body2" color="text.secondary">
              {official.sectionStructure.map((s) => `${s.count} ${SHORT[s.type] || s.type} × ${s.marksEach}`).join(', ')}
            </Typography>
          </Box>
          <Button size="small" variant="outlined" onClick={fillFromPattern}>Fill from the pattern</Button>
        </Box>
      )}

      <Box sx={{ border: `1px solid ${tokens.rule}`, borderRadius: '6px', overflowX: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `minmax(160px, 1fr) repeat(${types.length}, 112px)`, minWidth: 160 + types.length * 112, bgcolor: '#F8F9FB', borderBottom: `1px solid ${tokens.rule}`, px: 1.5, py: 0.75, fontSize: 12, fontWeight: 600, color: 'text.secondary', gap: 1 }}>
          <Box>Chapter</Box>
          {types.map((t) => <Box key={t} sx={{ textAlign: 'center' }}>{SHORT[t]}</Box>)}
        </Box>
        {subject.chapters.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>This subject has no chapters yet. Add them in the syllabus.</Typography>}
        {subject.chapters.map((c) => (
          <Box key={c._id} sx={{ display: 'grid', gridTemplateColumns: `minmax(160px, 1fr) repeat(${types.length}, 112px)`, minWidth: 160 + types.length * 112, px: 1.5, py: 0.75, gap: 1, alignItems: 'center', borderBottom: `1px solid ${tokens.rule}`, '&:last-of-type': { borderBottom: 0 } }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{c.name}</Typography>
            {types.map((t) => {
              const max = available[c._id]?.[t] || 0;
              return (
                <Box key={t} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                  <TextField size="small" type="number" value={plan[c._id]?.[t] || ''} placeholder="0" disabled={max === 0}
                    onChange={(e) => setCell(c._id, t, e.target.value)} inputProps={{ min: 0, max, 'aria-label': `${c.name}, ${TYPE_LABELS[t]}`, style: { textAlign: 'center', padding: '6px 4px', width: 44 } }} />
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{`of ${fmt(max)}`}</Typography>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {shortfalls.length > 0 && (
        <Alert severity="warning">
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Some chapters did not have enough questions:</Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.25, fontSize: 13 }}>
            {shortfalls.map((s, i) => <li key={i}>{`${chapterName(s.chapterId)}: wanted ${s.wanted} ${SHORT[s.type].toLowerCase()}, found ${s.got}.`}</li>)}
          </Box>
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<Sparkles size={15} />} disabled={total === 0 || !subject.chapters.length} onClick={draw}>
          {total ? `Draw ${fmt(total)} questions` : 'Draw questions'}
        </Button>
        <Button onClick={() => { setPlan({}); setShortfalls([]); }} disabled={total === 0}>Clear</Button>
        <Typography variant="body2" color="text.secondary">
          {selectedCount > 0 ? `This replaces the ${fmt(selectedCount)} questions already in the test. You can remove or add questions afterwards.` : 'The drawn questions appear in the test on the right, where you can still remove or add questions.'}
        </Typography>
      </Box>
    </Box>
  );
}
