import { useMemo, useState } from 'react';
import { Box, Checkbox, Chip, Collapse, InputAdornment, MenuItem, TextField, Typography } from '@mui/material';
import { ChevronDown, Search } from 'lucide-react';
import LatexRenderer from '@/components/LatexRenderer';
import { typeOf, TYPE_LABELS } from '@/lib/draw';
import { tokens } from '@/theme';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const DIFF_COLOR = { easy: tokens.green, medium: tokens.amber, hard: tokens.red };

export const questionText = (q, lang) => q.questionText?.[lang] || q.questionText?.en || q.questionText?.hi || '';

// Hand-pick questions from the chapters of the chosen subjects. Candidates are { subject, chapters, questions }.
export default function QuestionPicker({ groups, selectedIds, used, lang, onToggle, onToggleMany }) {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [type, setType] = useState('all');
  const [freshOnly, setFreshOnly] = useState(false);
  const [open, setOpen] = useState(() => new Set());

  const term = search.trim().toLowerCase();
  const matches = (q) =>
    (difficulty === 'all' || q.difficulty === difficulty)
    && (type === 'all' || typeOf(q) === type)
    && (!freshOnly || !used.has(q._id))
    && (!term || (q.questionText?.en || '').toLowerCase().includes(term) || (q.questionText?.hi || '').includes(search.trim()));

  // subject -> chapter -> filtered questions
  const tree = useMemo(() => groups.map(({ subject, questions }) => {
    const byChapter = new Map(subject.chapters.map((c) => [c._id, { chapter: c, questions: [] }]));
    questions.filter(matches).forEach((q) => {
      const key = String(q.chapterId?._id ?? q.chapterId);
      if (!byChapter.has(key)) byChapter.set(key, { chapter: { _id: key, name: 'Unknown chapter' }, questions: [] });
      byChapter.get(key).questions.push(q);
    });
    return { subject, chapters: [...byChapter.values()].filter((c) => c.questions.length > 0) };
  }), [groups, term, difficulty, type, freshOnly, used]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleOpen = (id) => setOpen((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const total = tree.reduce((n, s) => n + s.chapters.reduce((m, c) => m + c.questions.length, 0), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        <TextField size="small" placeholder="Search question text" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 200, flexGrow: 1, maxWidth: 320 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={15} /></InputAdornment> }} inputProps={{ 'aria-label': 'Search question text' }} />
        <TextField select size="small" value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 150 }} inputProps={{ 'aria-label': 'Type' }}>
          <MenuItem value="all">All types</MenuItem>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} sx={{ minWidth: 125 }} inputProps={{ 'aria-label': 'Difficulty' }}>
          <MenuItem value="all">Any level</MenuItem>
          {['easy', 'medium', 'hard'].map((d) => <MenuItem key={d} value={d} sx={{ textTransform: 'capitalize' }}>{d}</MenuItem>)}
        </TextField>
        <Box component="label" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13, cursor: 'pointer' }}>
          <Checkbox size="small" checked={freshOnly} onChange={(e) => setFreshOnly(e.target.checked)} />
          Hide questions used in other tests
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{`${fmt(total)} questions match.`}</Typography>

      {tree.map(({ subject, chapters }) => (
        <Box key={subject._id} sx={{ mb: 2 }}>
          {tree.length > 1 && <Typography variant="subtitle1" sx={{ mb: 0.75 }}>{subject.name}</Typography>}
          <Box sx={{ border: `1px solid ${tokens.rule}`, borderRadius: '6px', overflow: 'hidden' }}>
            {chapters.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>No questions match the filters.</Typography>}
            {chapters.map(({ chapter, questions }, i) => {
              const ids = questions.map((q) => q._id);
              const picked = ids.filter((id) => selectedIds.has(id)).length;
              const isOpen = open.has(chapter._id);
              return (
                <Box key={chapter._id} sx={{ borderTop: i ? `1px solid ${tokens.rule}` : 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, bgcolor: '#F8F9FB' }}>
                    <Checkbox size="small" checked={picked === ids.length} indeterminate={picked > 0 && picked < ids.length}
                      onChange={() => onToggleMany(questions, picked !== ids.length)} inputProps={{ 'aria-label': `Select all in ${chapter.name}` }} />
                    <Box component="button" type="button" onClick={() => toggleOpen(chapter._id)} aria-expanded={isOpen}
                      sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', gap: 1, border: 0, bgcolor: 'transparent', font: 'inherit', cursor: 'pointer', textAlign: 'left', py: 0.5 }}>
                      <ChevronDown size={15} style={{ transform: isOpen ? 'none' : 'rotate(-90deg)', transition: 'transform 150ms', color: tokens.muted }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 600, flexGrow: 1 }}>{chapter.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{`${picked} of ${questions.length} selected`}</Typography>
                    </Box>
                  </Box>
                  <Collapse in={isOpen} unmountOnExit>
                    {questions.map((q) => (
                      <Box key={q._id} component="label" sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, px: 1, py: 0.75, borderTop: `1px solid ${tokens.rule}`, cursor: 'pointer', bgcolor: selectedIds.has(q._id) ? tokens.inkTint : 'transparent', '&:hover': { bgcolor: selectedIds.has(q._id) ? tokens.inkTint : 'action.hover' } }}>
                        <Checkbox size="small" checked={selectedIds.has(q._id)} onChange={() => onToggle(q)} sx={{ mt: '-4px' }} />
                        <Box sx={{ flexGrow: 1, minWidth: 0, fontSize: 13.5 }}><LatexRenderer text={questionText(q, lang)} /></Box>
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
                          {typeOf(q) !== 'MCQ' && <Chip size="small" variant="outlined" label={TYPE_LABELS[typeOf(q)]} />}
                          <Chip size="small" variant="outlined" label={q.difficulty || 'medium'} sx={{ textTransform: 'capitalize', color: DIFF_COLOR[q.difficulty] || DIFF_COLOR.medium, borderColor: DIFF_COLOR[q.difficulty] || DIFF_COLOR.medium }} />
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 38, textAlign: 'right' }}>{`${q.marks || 1} mark${(q.marks || 1) === 1 ? '' : 's'}`}</Typography>
                          {used.has(q._id) && <Chip size="small" label="Used" sx={{ bgcolor: tokens.amberTint, color: tokens.amber }} />}
                        </Box>
                      </Box>
                    ))}
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
