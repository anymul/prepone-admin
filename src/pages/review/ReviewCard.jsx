import { Alert, Box, Chip, Typography } from '@mui/material';
import LatexRenderer from '@/components/LatexRenderer';
import { reviewState } from '@/lib/review';
import { typeLabel } from '@/pages/questions/QuestionEditor';
import { tokens } from '@/theme';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const DIFF = { easy: tokens.green, medium: tokens.amber, hard: tokens.red };
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

// What the student results show for each reason a question was flagged.
const flagDetail = ({ lens, row }) => {
  if (lens === 'keyMayBeWrong') return `option ${row.dominantWrong?.label} was picked by ${row.dominantWrong?.sharePct}% and only ${row.correctPct}% got it right.`;
  if (lens === 'difficultyOff') return `marked ${row.difficulty}, but ${row.correctPct}% of ${row.attempts} students got it right.`;
  if (lens === 'oftenSkipped') return `${row.skippedPct}% of ${row.attempts} students left it blank.`;
  return `students take ${Math.round(row.avgTimeSec)} seconds on average.`;
};

const pick = (value, lang) => (lang === 'hi' ? value?.hi || value?.en : value?.en || value?.hi) || '';

function Text({ value, lang, sx }) {
  if (lang === 'both') {
    return (
      <Box sx={{ display: 'grid', gap: 0.5, wordBreak: 'break-word', overflowX: 'auto', minWidth: 0, ...sx }}>
        <Box sx={{ minWidth: 0 }}><LatexRenderer text={value?.en || ''} lang="en" /></Box>
        <Box sx={{ color: 'text.secondary', minWidth: 0 }}><LatexRenderer text={value?.hi || ''} lang="hi" /></Box>
      </Box>
    );
  }
  return <Box sx={{ wordBreak: 'break-word', overflowX: 'auto', minWidth: 0, ...sx }}><LatexRenderer text={pick(value, lang)} lang={lang} /></Box>;
}

function AuditNote({ audit }) {
  const state = audit?.status;
  if (!state) return <Typography variant="body2" color="text.secondary">Not reviewed yet.</Typography>;
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline', flexWrap: 'wrap' }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: state === 'approved' ? tokens.green : tokens.red }}>{state === 'approved' ? 'Approved' : 'Rejected'}</Typography>
      <Typography variant="body2" color="text.secondary">{[audit.reviewerName && `by ${audit.reviewerName}`, when(audit.timestamp)].filter(Boolean).join(' on ')}</Typography>
      {audit.remark && <Typography variant="body2">{`"${audit.remark}"`}</Typography>}
    </Box>
  );
}

// What the reviewer judges: the question as students see it, with the answer key marked.
export default function ReviewCard({ question, lang, flags }) {
  const q = question;
  const state = reviewState(q);
  const isMcq = (q.questionType || 'MCQ') === 'MCQ';
  const modelAnswer = typeof q.modelAnswer === 'string' ? { en: q.modelAnswer } : q.modelAnswer;
  const wrongPick = flags?.find((f) => f.lens === 'keyMayBeWrong')?.row.dominantWrong;

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip size="small" label={`Class ${q.studentClass ?? '?'}`} />
        {q.subjectName && <Chip size="small" variant="outlined" label={q.subjectName} />}
        {q.chapterName && <Chip size="small" variant="outlined" label={q.chapterName} />}
        <Chip size="small" variant="outlined" label={q.difficulty || 'medium'} sx={{ textTransform: 'capitalize', color: DIFF[q.difficulty] || DIFF.medium, borderColor: DIFF[q.difficulty] || DIFF.medium }} />
        <Chip size="small" variant="outlined" label={typeLabel(q.questionType)} />
        <Chip size="small" variant="outlined" label={`${q.marks || 1} mark${(q.marks || 1) === 1 ? '' : 's'}`} />
        {state !== 'unreviewed' && <Chip size="small" label={state === 'approved' ? 'Approved' : 'Rejected'} sx={{ bgcolor: state === 'approved' ? tokens.greenTint : tokens.redTint, color: state === 'approved' ? tokens.green : tokens.red, fontWeight: 600 }} />}
      </Box>

      {flags?.length > 0 && (
        <Alert severity="warning" sx={{ py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Why this is in your queue</Typography>
          {flags.map((f, i) => <Typography key={i} variant="body2">{`${f.label}: ${flagDetail(f)}`}</Typography>)}
        </Alert>
      )}

      <Text value={q.questionText} lang={lang} sx={{ fontSize: { xs: 16, sm: 17 }, lineHeight: 1.65 }} />

      {isMcq && (
        <Box sx={{ display: 'grid', gap: 1 }}>
          {(q.options || []).map((o, i) => {
            const correct = i === q.correctOptionIndex;
            const suspicious = wrongPick && LETTERS[i] === wrongPick.label && !correct;
            return (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, p: { xs: 1.25, sm: 1.5 }, borderRadius: '8px', border: `1px solid ${correct ? '#BFE0CE' : suspicious ? '#F0C9C9' : tokens.rule}`, bgcolor: correct ? tokens.greenTint : suspicious ? tokens.redTint : 'transparent', alignItems: 'flex-start' }}>
                <Typography sx={{ fontWeight: 600, width: 22, flexShrink: 0, pt: 0.25 }}>{LETTERS[i]}</Typography>
                <Text value={o} lang={lang} sx={{ flexGrow: 1, minWidth: 0, fontSize: 15 }} />
                <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  {correct && <Typography variant="caption" sx={{ color: tokens.green, fontWeight: 600, whiteSpace: 'nowrap' }}>Answer key</Typography>}
                  {suspicious && <Typography variant="caption" sx={{ color: tokens.red, fontWeight: 600, whiteSpace: 'nowrap' }}>Most chosen</Typography>}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {(q.explanation?.en || q.explanation?.hi) && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Explanation</Typography>
          <Text value={q.explanation} lang={lang} sx={{ fontSize: 14, lineHeight: 1.6 }} />
        </Box>
      )}
      {!isMcq && (modelAnswer?.en || modelAnswer?.hi) && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Model answer</Typography>
          <Text value={modelAnswer} lang={lang} sx={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }} />
        </Box>
      )}

      <Box sx={{ pt: 1.5, borderTop: `1px solid ${tokens.rule}` }}><AuditNote audit={q.audit} /></Box>
    </Box>
  );
}
