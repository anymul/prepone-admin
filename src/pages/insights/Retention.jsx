import { useEffect } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { Panel, PanelHeader } from '@/components/Panel';
import { getJson, useResource } from '@/lib/useResource';
import { tokens } from '@/theme';
import { Body, fmt, fmtDay } from './shared';

// One hue, light to dark with the percentage. Text flips to white once the fill is dark enough.
const cellStyle = (pct) => {
  const alpha = 0.06 + (Math.min(pct, 100) / 100) * 0.82;
  return { backgroundColor: `rgba(63, 91, 203, ${alpha.toFixed(3)})`, color: alpha > 0.45 ? '#fff' : tokens.text };
};

function Summary({ resource }) {
  const items = [
    ['activation', 'Active in their signup week', 'Share of new students who practise in the week they join'],
    ['week1', 'Back the next week', 'Active in the week after they joined'],
    ['week4', 'Still active after 4 weeks', 'Active four weeks after the week they joined'],
  ];
  const { status, data } = resource;
  return (
    <Box sx={{ display: 'grid', gap: '1px', bgcolor: tokens.rule, border: `1px solid ${tokens.rule}`, borderRadius: '6px', overflow: 'hidden', mb: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
      {items.map(([key, label, hint]) => {
        const s = data?.summary?.[key];
        let value = <Skeleton width={70} height={32} />;
        let note = <Skeleton width="80%" height={18} />;
        if (status === 'error') { value = '–'; note = "Couldn't load"; }
        else if (s) {
          value = s.cohorts ? `${s.pct}%` : 'Too early';
          note = !s.cohorts ? 'No cohort has finished this week yet'
            : s.deltaPts == null ? hint
              : `${s.deltaPts > 0 ? '+' : ''}${s.deltaPts} points vs the earlier cohorts`;
        }
        return (
          <Box key={key} sx={{ bgcolor: 'background.paper', p: 2 }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography sx={{ fontSize: 26, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.02em', mt: 0.25 }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{note}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function Heatmap({ data }) {
  const columns = Array.from({ length: data.weeks + 1 }, (_, i) => i);
  const rows = [...data.cohorts].reverse(); // newest cohort first
  return (
    <>
      <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" aria-label="Retention by signup week" sx={{ borderCollapse: 'separate', borderSpacing: '2px', width: '100%', minWidth: 640, fontSize: 13, p: 1 }}>
          <thead>
            <tr>
              <Box component="th" scope="col" sx={{ textAlign: 'left', fontWeight: 600, color: 'text.secondary', fontSize: 12, p: 1 }}>Joined in the week of</Box>
              <Box component="th" scope="col" sx={{ textAlign: 'right', fontWeight: 600, color: 'text.secondary', fontSize: 12, p: 1 }}>Students</Box>
              {columns.map((c) => <Box key={c} component="th" scope="col" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 12, p: 1, minWidth: 52 }}>{c === 0 ? 'Week 0' : `Week ${c}`}</Box>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((cohort) => (
              <tr key={cohort.weekStart}>
                <Box component="th" scope="row" sx={{ textAlign: 'left', fontWeight: 600, p: 1, whiteSpace: 'nowrap' }}>{fmtDay(cohort.weekStart)}</Box>
                <Box component="td" sx={{ textAlign: 'right', p: 1 }}>{fmt(cohort.size)}</Box>
                {cohort.cells.map((cell, i) => {
                  if (!cell) return <Box key={i} component="td" sx={{ textAlign: 'center', color: 'grey.400', p: 1 }}>–</Box>;
                  const label = `${fmt(cell.active)} of ${fmt(cohort.size)} students (${cell.pct}%)${cell.partial ? ', week still in progress' : ''}`;
                  return (
                    <Box
                      key={i}
                      component="td"
                      title={label}
                      aria-label={label}
                      sx={{ textAlign: 'center', fontWeight: 600, p: 1, borderRadius: '4px', ...(cohort.size ? cellStyle(cell.pct) : {}), ...(cell.partial && { outline: `1px dashed ${tokens.ink}`, outlineOffset: '-2px' }) }}
                    >
                      {cohort.size ? `${cell.pct}%` : '–'}
                    </Box>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, px: 2, py: 1.5, borderTop: `1px solid ${tokens.rule}`, color: 'text.secondary', fontSize: 12 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          0%
          <Box sx={{ width: 120, height: 10, borderRadius: '5px', background: 'linear-gradient(90deg, rgba(63,91,203,0.06), rgba(63,91,203,0.88))' }} />
          100%
        </Box>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 12, borderRadius: '3px', outline: `1px dashed ${tokens.ink}`, outlineOffset: '-1px' }} />
          Week still in progress
        </Box>
        <Typography variant="caption" color="text.secondary">{data.definition}</Typography>
      </Box>
    </>
  );
}

export default function Retention({ tick, onUpdated }) {
  const [resource, reload] = useResource(
    (signal) => getJson(`/analytics/insights/retention${tick > 0 ? '?refresh=1' : ''}`, signal),
    [tick]
  );
  const generatedAt = resource.data?.generatedAt;
  useEffect(() => { onUpdated(generatedAt); }, [generatedAt, onUpdated]);

  return (
    <>
      <Summary resource={resource} />
      <Panel>
        <PanelHeader title="Do new students come back?" description="Each row is the students who joined in that week. Each column is how many weeks later they were active." />
        <Body resource={resource} onRetry={reload} height={300}>{(data) => <Heatmap data={data} />}</Body>
      </Panel>
    </>
  );
}
