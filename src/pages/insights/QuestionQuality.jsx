import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, IconButton, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { ChevronDown } from 'lucide-react';
import LatexRenderer from '@/components/LatexRenderer';
import { Panel, PanelHeader } from '@/components/Panel';
import { getJson, useResource } from '@/lib/useResource';
import { tokens } from '@/theme';
import { ACCENT, BAD, BarList, Body, CONTEXT, fmt } from './shared';

const LENSES = [
  { id: 'keyMayBeWrong', label: 'Answer key may be wrong', rule: (t) => `Students keep choosing the same wrong option: one wrong option picked by ${t.keyWrongDominantPct}% or more, while ${t.keyWrongCorrectMaxPct}% or fewer get it right. Check the key and the wording before the next test.` },
  { id: 'difficultyOff', label: 'Difficulty looks off', rule: (t) => `Marked easy but ${t.easyMaxCorrectPct}% or fewer answer it correctly, or marked hard but more than ${t.hardMinCorrectPct}% do. Change the difficulty label.` },
  { id: 'oftenSkipped', label: 'Often skipped', rule: () => 'Students leave these blank more than most. The wording or the data given may be unclear.' },
  { id: 'slowToAnswer', label: 'Slow to answer', rule: () => 'Students spend the longest on these. They may be too long or too hard for the marks.' },
];

const secs = (n) => (n >= 60 ? `${Math.floor(n / 60)}m ${Math.round(n % 60)}s` : `${Math.round(n)}s`);

// How students split across the options, with the suspicious wrong option in red.
function OptionSplit({ row }) {
  return (
    <Box sx={{ display: 'grid', gap: 0.75, flex: '1 1 320px', maxWidth: 420 }}>
      {row.split.map((o) => {
        const suspicious = !o.isCorrect && row.dominantWrong?.label === o.label;
        return (
          <Box key={o.label} sx={{ display: 'grid', gridTemplateColumns: '84px 1fr', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{`Option ${o.label}${o.isCorrect ? ' (key)' : ''}`}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ height: 12, width: `${Math.max(o.sharePct, o.sharePct > 0 ? 1.5 : 0)}%`, maxWidth: 'calc(100% - 44px)', bgcolor: o.isCorrect ? ACCENT : suspicious ? BAD : CONTEXT, borderRadius: '0 4px 4px 0' }} />
              <Typography component="span" sx={{ fontSize: 13, fontWeight: 600 }}>{`${o.sharePct}%`}</Typography>
            </Box>
          </Box>
        );
      })}
      {row.skippedPct > 0 && <Typography variant="caption" color="text.secondary">{`${row.skippedPct}% left it blank`}</Typography>}
    </Box>
  );
}

function QuestionRow({ row, lens }) {
  const [open, setOpen] = useState(false);
  const canOpen = row.studentClass != null;
  return (
    <Fragment>
      <TableRow hover onClick={() => setOpen((o) => !o)} sx={{ cursor: 'pointer', '& > td': { borderBottom: open ? 0 : undefined, verticalAlign: 'top' } }}>
        <TableCell sx={{ maxWidth: 420 }}>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
            <IconButton size="small" aria-expanded={open} aria-label={open ? 'Hide answer split' : 'Show answer split'} sx={{ mt: '-4px', ml: '-8px' }}>
              <ChevronDown size={16} style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 150ms' }} />
            </IconButton>
            <Box sx={{ minWidth: 0, fontSize: 13 }}><LatexRenderer text={row.text} /></Box>
          </Box>
        </TableCell>
        <TableCell>{row.chapterName || 'Unknown chapter'}</TableCell>
        <TableCell align="right">{fmt(row.attempts)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: lens === 'difficultyOff' ? 600 : 400 }}>{`${row.correctPct}%`}</TableCell>
        <TableCell align="right" sx={{ fontWeight: lens === 'oftenSkipped' ? 600 : 400 }}>{`${row.skippedPct}%`}</TableCell>
        <TableCell align="right" sx={{ fontWeight: lens === 'slowToAnswer' ? 600 : 400 }}>{secs(row.avgTimeSec)}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap', color: lens === 'keyMayBeWrong' ? BAD : undefined, fontWeight: lens === 'keyMayBeWrong' ? 600 : 400 }}>
          {row.dominantWrong ? `Option ${row.dominantWrong.label} (${row.dominantWrong.sharePct}%)` : '–'}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={7} sx={{ bgcolor: '#F8F9FB' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2, py: 0.5 }}>
              <OptionSplit row={row} />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', mr: 1 }}>{`Marked ${row.difficulty}`}</Typography>
                {canOpen && (
                  <>
                    <Button component={Link} to={`/questions/${row.studentClass}/${row.subjectId}/${row.chapterId}`} variant="outlined" size="small">Open in question bank</Button>
                    <Button component={Link} to={`/review?source=chapter&subject=${row.subjectId}&chapter=${row.chapterId}`} variant="contained" size="small">Review this chapter</Button>
                  </>
                )}
              </Box>
            </Box>
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}

function Lenses({ data }) {
  const [lens, setLens] = useState('keyMayBeWrong');
  const rows = data.lenses[lens] || [];
  const active = LENSES.find((l) => l.id === lens);

  return (
    <>
      <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${tokens.rule}` }}>
        <ToggleButtonGroup exclusive size="small" value={lens} onChange={(_, v) => v && setLens(v)} aria-label="What to look for" sx={{ flexWrap: 'wrap' }}>
          {LENSES.map((l) => (
            <ToggleButton key={l.id} value={l.id} sx={{ px: 1.5 }}>
              {l.label}
              <Box component="span" sx={{ ml: 0.75, color: data.counts[l.id] > 0 && l.id === 'keyMayBeWrong' ? BAD : 'text.secondary', fontWeight: 600 }}>{fmt(data.counts[l.id])}</Box>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>{active.rule(data.thresholds)}</Typography>
      </Box>

      {rows.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 600 }}>Nothing flagged here</Typography>
          <Typography variant="body2" color="text.secondary">
            {`Only questions with at least ${data.thresholds.minAttempts} answers in this period are judged. ${fmt(data.questionsAnalysed)} questions qualified.`}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Question</TableCell><TableCell>Chapter</TableCell>
                <TableCell align="right">Answers</TableCell><TableCell align="right">Correct</TableCell><TableCell align="right">Blank</TableCell>
                <TableCell align="right">Avg time</TableCell><TableCell>Most chosen wrong option</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{rows.map((row) => <QuestionRow key={row.questionId} row={row} lens={lens} />)}</TableBody>
          </Table>
        </Box>
      )}
    </>
  );
}

export default function QuestionQuality({ range, tick, onUpdated }) {
  const [resource, reload] = useResource(
    (signal) => getJson(`/analytics/insights/questions?days=${range}${tick > 0 ? '&refresh=1' : ''}`, signal),
    [range, tick]
  );
  const generatedAt = resource.data?.generatedAt;
  useEffect(() => { onUpdated(generatedAt); }, [generatedAt, onUpdated]);

  return (
    <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 3fr) minmax(0, 1fr)' }, alignItems: 'start' }}>
      <Panel>
        <PanelHeader
          title="Questions to fix"
          description={`Based on how students answered in mock tests over the last ${range} days. These are signals to check, not verdicts.`}
        />
        <Body resource={resource} onRetry={reload} height={320}>{(data) => <Lenses data={data} />}</Body>
      </Panel>

      <Box sx={{ display: 'grid', gap: 2.5 }}>
        <Panel>
          <PanelHeader title="Common mistakes" description="Wrong answers by the misconception they point to." />
          <Body resource={resource} onRetry={reload} height={200}>
            {({ mistakes }) => (
              <BarList
                rows={mistakes.map((m) => ({ id: m.tag, label: m.category ? `${m.tag} (${m.category})` : m.tag, value: m.count }))}
                emptyText="No tagged mistakes yet. Add misconception tags to wrong options to see them here."
              />
            )}
          </Body>
        </Panel>
        <Panel>
          <PanelHeader title="Mistakes by type" />
          <Body resource={resource} onRetry={reload} height={150}>
            {({ byCategory }) => <BarList rows={byCategory.map((c) => ({ id: c.category, label: c.category, value: c.count }))} color={CONTEXT} emptyText="No categorised mistakes yet." />}
          </Body>
        </Panel>
      </Box>
    </Box>
  );
}
