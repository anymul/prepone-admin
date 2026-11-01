import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Collapse, Drawer, IconButton, MenuItem, Radio, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { Sparkles, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import LatexRenderer from '@/components/LatexRenderer';
import { sendJson } from '@/lib/useResource';
import { tokens } from '@/theme';

export const QUESTION_TYPES = [
  { value: 'MCQ', label: 'Multiple choice' },
  { value: 'VeryShortSubjective', label: 'Very short answer' },
  { value: 'ShortSubjective', label: 'Short answer' },
  { value: 'LongSubjective', label: 'Long answer' },
  { value: 'CompetencyBased', label: 'Competency based' },
];
export const typeLabel = (value) => QUESTION_TYPES.find((t) => t.value === value)?.label || 'Multiple choice';

const LETTERS = ['A', 'B', 'C', 'D'];
const blankText = () => ({ en: '', hi: '' });

export const emptyForm = () => ({
  questionType: 'MCQ',
  questionText: blankText(),
  options: [blankText(), blankText(), blankText(), blankText()],
  correctOptionIndex: -1,
  difficulty: 'medium',
  marks: '1',
  explanation: blankText(),
  topicName: '',
  bloomLevel: '',
  modelAnswer: '',
  markingScheme: '',
  wordLimit: '',
});

export function toForm(question) {
  const options = question.options ? [...question.options] : [];
  if ((question.questionType || 'MCQ') === 'MCQ') while (options.length < 4) options.push(blankText());
  return {
    questionType: question.questionType || 'MCQ',
    questionText: { ...blankText(), ...(question.questionText || {}) },
    options: options.map((o) => ({ ...blankText(), ...o })),
    correctOptionIndex: question.correctOptionIndex ?? -1,
    difficulty: question.difficulty || 'medium',
    marks: String(question.marks || 1),
    explanation: { ...blankText(), ...(question.explanation || {}) },
    topicName: question.topicName || '',
    bloomLevel: question.bloomLevel || '',
    modelAnswer: typeof question.modelAnswer === 'string' ? question.modelAnswer : '',
    markingScheme: question.markingScheme || '',
    wordLimit: question.wordLimit ? String(question.wordLimit) : '',
  };
}

const present = (value, requirement) => {
  const en = Boolean(value?.en?.trim());
  const hi = Boolean(value?.hi?.trim());
  switch (requirement) {
    case 'en_only': return en;
    case 'hi_only': return hi;
    case 'either': return en || hi;
    default: return en && hi;
  }
};
const requirementText = { both: 'English and Hindi', en_only: 'English', hi_only: 'Hindi', either: 'English or Hindi' };

// Blocking problems stop saving. When editing an existing question, a missing language is only a warning
// (older questions may predate the subject's rule); when adding, the API would reject it, so it blocks.
export function validate(form, requirement = 'both', creating = true) {
  const errors = [];
  const warnings = [];
  const langProblem = (message) => (creating ? errors : warnings).push(message);

  const anyText = Boolean(form.questionText.en.trim() || form.questionText.hi.trim());
  if (!anyText) errors.push('Write the question.');
  else if (!present(form.questionText, requirement)) langProblem(`The question needs ${requirementText[requirement] || 'text'}.`);

  if (form.questionType === 'MCQ') {
    const filled = form.options.filter((o) => o.en.trim() || o.hi.trim());
    if (filled.length < 2) errors.push('Add at least two options.');
    else if (filled.some((o) => !present(o, requirement))) langProblem(`Every option needs ${requirementText[requirement] || 'text'}.`);
    const correct = form.options[form.correctOptionIndex];
    if (form.correctOptionIndex < 0 || !correct || !(correct.en.trim() || correct.hi.trim())) errors.push('Mark which option is correct.');
  }
  if (!(Number.parseInt(form.marks, 10) > 0)) errors.push('Marks must be 1 or more.');
  return { errors, warnings };
}

function toBody(form) {
  const body = {
    questionType: form.questionType,
    questionText: form.questionText,
    explanation: form.explanation,
    difficulty: form.difficulty,
    marks: Number.parseInt(form.marks, 10) || 1,
    topicName: form.topicName.trim() || undefined,
    bloomLevel: form.bloomLevel.trim() || undefined,
  };
  if (form.questionType === 'MCQ') {
    // Blank options are dropped, so the correct answer must keep pointing at the same option.
    const kept = form.options.map((o, i) => ({ o, i })).filter(({ o }) => o.en.trim() || o.hi.trim());
    body.options = kept.map(({ o }) => o);
    body.correctOptionIndex = kept.findIndex(({ i }) => i === form.correctOptionIndex);
  } else {
    body.modelAnswer = form.modelAnswer || undefined;
    body.markingScheme = form.markingScheme || undefined;
    body.wordLimit = form.wordLimit ? Number.parseInt(form.wordLimit, 10) : undefined;
  }
  return body;
}

const mathy = (text) => /[$\\]/.test(text || '');

function LanguageToggle({ lang, setLang, form }) {
  const filled = (l) => Boolean(form.questionText[l]?.trim());
  return (
    <ToggleButtonGroup exclusive size="small" value={lang} onChange={(_, v) => v && setLang(v)} aria-label="Editing language">
      {[['en', 'English'], ['hi', 'हिंदी']].map(([value, label]) => (
        <ToggleButton key={value} value={value} sx={{ px: 1.5, gap: 0.75 }}>
          {label}
          <Box component="span" aria-label={filled(value) ? 'filled' : 'empty'} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: filled(value) ? tokens.green : '#B4BAC8' }} />
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

function MathHint({ text }) {
  if (!mathy(text)) return null;
  return (
    <Box sx={{ mt: 0.75, p: 1, bgcolor: '#F8F9FB', border: `1px solid ${tokens.rule}`, borderRadius: '5px', fontSize: 14 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>Preview</Typography>
      <LatexRenderer text={text} />
    </Box>
  );
}

function Preview({ form, lang }) {
  const pick = (v) => v?.[lang] || v?.en || v?.hi || '';
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ fontSize: 16, lineHeight: 1.6 }}><LatexRenderer text={pick(form.questionText)} /></Box>
      {form.questionType === 'MCQ' && (
        <Box sx={{ display: 'grid', gap: 1 }}>
          {form.options.map((o, i) => {
            if (!(o.en.trim() || o.hi.trim())) return null;
            const correct = i === form.correctOptionIndex;
            return (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, p: 1.25, border: `1px solid ${correct ? '#BFE0CE' : tokens.rule}`, bgcolor: correct ? tokens.greenTint : 'transparent', borderRadius: '6px' }}>
                <Typography sx={{ fontWeight: 600, width: 18 }}>{LETTERS[i]}</Typography>
                <Box sx={{ flexGrow: 1 }}><LatexRenderer text={pick(o)} /></Box>
                {correct && <Typography variant="caption" sx={{ color: tokens.green, fontWeight: 600 }}>Correct</Typography>}
              </Box>
            );
          })}
        </Box>
      )}
      {pick(form.explanation) && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Explanation</Typography>
          <Box sx={{ fontSize: 14, lineHeight: 1.6 }}><LatexRenderer text={pick(form.explanation)} /></Box>
        </Box>
      )}
      {form.questionType !== 'MCQ' && form.modelAnswer && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Model answer</Typography>
          <Box sx={{ fontSize: 14, whiteSpace: 'pre-wrap' }}><LatexRenderer text={form.modelAnswer} /></Box>
        </Box>
      )}
    </Box>
  );
}

// mode: 'create' | 'edit'. question is the existing record when editing.
export default function QuestionEditor({ open, mode, question, subject, chapter, board, initialTab = 0, onClose, onSaved, onDelete }) {
  const creating = mode === 'create';
  const requirement = subject?.languageRequirement || 'both';
  const [form, setForm] = useState(emptyForm);
  const [lang, setLang] = useState('en');
  const [tab, setTab] = useState(0);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(creating ? emptyForm() : toForm(question));
    setLang(requirement === 'hi_only' ? 'hi' : 'en');
    setTab(initialTab);
    setMore(false);
    setError('');
  }, [open, creating, question, requirement, initialTab]);

  const { errors, warnings } = useMemo(() => validate(form, requirement, creating), [form, requirement, creating]);
  const isMcq = form.questionType === 'MCQ';
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setText = (key, value) => setForm((f) => ({ ...f, [key]: { ...f[key], [lang]: value } }));
  const setOption = (i, value) => setForm((f) => ({ ...f, options: f.options.map((o, j) => (j === i ? { ...o, [lang]: value } : o)) }));

  const fixLatex = async () => {
    setFixing(true);
    try {
      const data = await sendJson('POST', '/utility/ai/fix-latex', {
        questionType: form.questionType, questionText: form.questionText, explanation: form.explanation,
        correctOptionIndex: form.correctOptionIndex, ...(isMcq ? { options: form.options } : {}),
      });
      setForm((f) => ({
        ...f,
        questionText: data.questionText || f.questionText,
        options: isMcq ? (data.options || f.options) : f.options,
        correctOptionIndex: data.correctOptionIndex !== undefined ? data.correctOptionIndex : f.correctOptionIndex,
        explanation: data.explanation || f.explanation,
      }));
      toast.success('LaTeX cleaned up. Check the preview before saving.');
    } catch (err) {
      toast.error(err.message || "Couldn't fix the LaTeX");
    } finally {
      setFixing(false);
    }
  };

  const save = async () => {
    if (errors.length) return;
    setBusy(true);
    setError('');
    try {
      const body = toBody(form);
      if (creating) {
        await sendJson('POST', '/utility/question/bulkpost', { subjectId: subject._id, chapterId: chapter._id, questions: [{ ...body, board }] });
        toast.success('Question added');
      } else {
        await sendJson('PATCH', `/utility/question/${question._id}`, body);
        toast.success('Question saved');
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const textKey = lang === 'en' ? 'English' : 'Hindi';

  return (
    <Drawer anchor="right" open={open} onClose={busy ? undefined : onClose} PaperProps={{ sx: { width: { xs: '100%', md: 720 }, maxWidth: '100%' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 3, py: 2, borderBottom: `1px solid ${tokens.rule}` }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" component="h2">{creating ? 'Add a question' : 'Edit question'}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{[subject?.name, chapter?.name].filter(Boolean).join(' / ')}</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" disabled={busy}><X size={18} /></IconButton>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: `1px solid ${tokens.rule}` }}>
          <Tab label="Edit" /><Tab label="Preview" />
        </Tabs>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          {tab === 1 ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <LanguageToggle lang={lang} setLang={setLang} form={form} />
              <Preview form={form} lang={lang} />
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gap: 2.5 }}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 110px' } }}>
                <TextField select label="Type" value={form.questionType} onChange={(e) => set({ questionType: e.target.value })}>
                  {QUESTION_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
                <TextField select label="Difficulty" value={form.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>
                  {['easy', 'medium', 'hard'].map((d) => <MenuItem key={d} value={d} sx={{ textTransform: 'capitalize' }}>{d}</MenuItem>)}
                </TextField>
                <TextField label="Marks" type="number" value={form.marks} onChange={(e) => set({ marks: e.target.value })} inputProps={{ min: 1 }} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <LanguageToggle lang={lang} setLang={setLang} form={form} />
                <Button size="small" variant="outlined" startIcon={<Sparkles size={14} />} onClick={fixLatex} disabled={fixing || !anyContent(form)}>{fixing ? 'Fixing…' : 'Fix LaTeX with AI'}</Button>
              </Box>

              <Box>
                <TextField label={`Question (${textKey})`} value={form.questionText[lang]} onChange={(e) => setText('questionText', e.target.value)} multiline minRows={3} fullWidth inputProps={{ lang }} />
                <MathHint text={form.questionText[lang]} />
              </Box>

              {isMcq && (
                <Box sx={{ display: 'grid', gap: 1.5 }} role="radiogroup" aria-label="Options. Select the correct one.">
                  <Typography variant="subtitle2">{`Options (${textKey}). Select the correct one.`}</Typography>
                  {form.options.map((o, i) => (
                    <Box key={i}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Radio checked={form.correctOptionIndex === i} onChange={() => set({ correctOptionIndex: i })} inputProps={{ 'aria-label': `Option ${LETTERS[i]} is correct` }} sx={{ p: 0.75 }} />
                        <TextField size="small" fullWidth label={`Option ${LETTERS[i]}`} value={o[lang]} onChange={(e) => setOption(i, e.target.value)} inputProps={{ lang }} />
                      </Box>
                      <Box sx={{ ml: 5 }}><MathHint text={o[lang]} /></Box>
                    </Box>
                  ))}
                </Box>
              )}

              <Box>
                <TextField label={`Explanation (${textKey})`} value={form.explanation[lang]} onChange={(e) => setText('explanation', e.target.value)} multiline minRows={2} fullWidth inputProps={{ lang }} />
                <MathHint text={form.explanation[lang]} />
              </Box>

              {!isMcq && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField label="Model answer" value={form.modelAnswer} onChange={(e) => set({ modelAnswer: e.target.value })} multiline minRows={3} fullWidth />
                  <TextField label="Marking scheme" value={form.markingScheme} onChange={(e) => set({ markingScheme: e.target.value })} multiline minRows={2} fullWidth />
                  <TextField label="Word limit (optional)" type="number" value={form.wordLimit} onChange={(e) => set({ wordLimit: e.target.value })} sx={{ maxWidth: 200 }} />
                </Box>
              )}

              <Box>
                <Button size="small" onClick={() => setMore((m) => !m)} aria-expanded={more}>{more ? 'Hide extra details' : 'More details'}</Button>
                <Collapse in={more}>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, pt: 1.5 }}>
                    <TextField label="Topic (optional)" value={form.topicName} onChange={(e) => set({ topicName: e.target.value })} />
                    <TextField label="Bloom level (optional)" value={form.bloomLevel} onChange={(e) => set({ bloomLevel: e.target.value })} />
                  </Box>
                </Collapse>
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ borderTop: `1px solid ${tokens.rule}`, p: 2, display: 'grid', gap: 1.25 }}>
          {errors.length > 0 && <Alert severity="error" sx={{ py: 0 }}>{errors.join(' ')}</Alert>}
          {errors.length === 0 && warnings.length > 0 && <Alert severity="warning" sx={{ py: 0 }}>{warnings.join(' ')}</Alert>}
          {error && <Alert severity="error" role="alert">{error}</Alert>}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box>
              {!creating && onDelete && (
                <Button color="error" startIcon={<Trash2 size={14} />} onClick={() => onDelete(question)} disabled={busy}>Delete</Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={onClose} disabled={busy}>Cancel</Button>
              <Button variant="contained" onClick={save} disabled={busy || errors.length > 0}>{creating ? 'Add question' : 'Save changes'}</Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

const anyContent = (form) => Boolean(form.questionText.en.trim() || form.questionText.hi.trim());
