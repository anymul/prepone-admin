import {
  Box, Button, Skeleton, Typography,
} from '@mui/material';
import { tokens } from '@/theme';

// Chart colours: one validated accent, a neutral for context, and the status red for failures.
export const ACCENT = '#5A32A3';
export const CONTEXT = '#B4BAC8';
export const BAD = tokens.red;
export const RANGES = [7, 30, 90];
// Failure rates at or above this are flagged in red.
export const FAILURE_ALERT_PCT = 10;

export const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
export const rupees = (n) => `₹${fmt(n)}`;
export const oneDecimal = (n) => +Number(n || 0).toFixed(1);
export const compact = (v) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}K` : v);
export const fmtDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const CREDIT_LABELS = {
  signup_bonus: 'Signup bonus',
  iap_topup_purchase: 'Credit top-ups bought',
  subscription_allowance_refresh: 'Monthly subscription credits',
  admin_grant: 'Granted by an admin',
  refund: 'Refunds',
  evaluation_spend_subscription: 'Evaluations paid with subscription credits',
  evaluation_spend_topup: 'Evaluations paid with top-up credits',
  evaluation_spend_unlimited: 'Evaluations on unlimited plans',
  rewarded_ad: 'Rewarded ads watched',
  referral_reward: 'Referral rewards',
};
export const METHOD_LABELS = { register: 'Entered a code at signup', google_login: 'Entered a code at Google sign-in', in_app_redeem: 'Entered a code in the app' };

// ── shared pieces ────────────────────────────────────────────────────────────────
export function Body({ resource, onRetry, height = 160, children }) {
  const { status, data } = resource;
  if (status === 'loading' && !data) {
    return <Box sx={{ p: 2 }}><Skeleton variant="rounded" height={height} /></Box>;
  }
  if (status === 'error') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 600 }}>Couldn't load this</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>The API didn't respond. Check system health, then try again.</Typography>
        <Button variant="outlined" size="small" onClick={onRetry}>Try again</Button>
      </Box>
    );
  }
  // Keep the previous render, dimmed, while a new range loads.
  return <Box sx={{ opacity: status === 'loading' ? 0.5 : 1, transition: 'opacity 150ms' }}>{children(data)}</Box>;
}

export function Stat({ resource, pick }) {
  const { status, data } = resource;
  let value = <Skeleton width={70} height={32} />;
  let note = <Skeleton width="80%" height={18} />;
  if (status === 'error') {
    value = '–';
    note = "Couldn't load";
  } else if (data) {
    const picked = pick(data);
    value = picked.value;
    note = picked.note;
  }
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2, minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary">{pick.label}</Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.02em', mt: 0.25 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{note}</Typography>
    </Box>
  );
}
export const stat = (label, fn) => Object.assign(fn, { label });

// Horizontal bars for comparing magnitude. One series, one colour; the value sits at the tip.
export function BarList({ rows, color = ACCENT, onSelect, busyId, emptyText = 'Nothing to show yet.' }) {
  if (!rows.length) return <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{emptyText}</Typography>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <Box sx={{ p: 2, display: 'grid', gap: 1.25 }}>
      {rows.map((row) => {
        const content = (
          <>
            <Typography component="span" sx={{ fontSize: 13, fontWeight: 500, minWidth: 0 }}>{row.label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Box sx={{ height: 12, width: `${Math.max((row.value / max) * 100, row.value > 0 ? 1.5 : 0)}%`, maxWidth: 'calc(100% - 90px)', bgcolor: color, borderRadius: '0 4px 4px 0', opacity: busyId != null && busyId === row.id ? 0.5 : 1 }} />
              <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{row.valueLabel ?? fmt(row.value)}</Typography>
            </Box>
          </>
        );
        const sx = { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(140px, 42%) 1fr' }, gap: { xs: 0.5, sm: 2 }, alignItems: 'center', textAlign: 'left' };
        return onSelect ? (
          <Box key={row.id ?? row.label} component="button" type="button" onClick={() => onSelect(row)} disabled={busyId != null && busyId === row.id}
            sx={{ ...sx, p: 0, m: 0, border: 0, bgcolor: 'transparent', font: 'inherit', color: 'inherit', cursor: 'pointer', borderRadius: '4px', '&:hover span:first-of-type': { color: 'primary.main' } }}>
            {content}
          </Box>
        ) : (
          <Box key={row.id ?? row.label} sx={sx}>{content}</Box>
        );
      })}
    </Box>
  );
}

export function Facts({ rows }) {
  return (
    <Box sx={{ px: 2, py: 0.5 }}>
      {rows.map(([label, value, tone]) => (
        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: `1px solid ${tokens.rule}`, '&:last-of-type': { borderBottom: 0 } }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: tone === 'bad' ? BAD : 'text.primary', textAlign: 'right' }}>{value}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export function LineKey({ color, label }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 12, color: 'text.secondary' }}>
      <Box component="span" sx={{ width: 14, height: 2, borderRadius: 1, bgcolor: color }} />
      {label}
    </Box>
  );
}

// One readout listing every series at the hovered day. Values lead, series names follow.
export function DayTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', border: `1px solid ${tokens.rule}`, borderRadius: '6px', boxShadow: 3, px: 1.5, py: 1, minWidth: 150 }}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>{fmtDay(label)}</Typography>
      {payload.map((p) => (
        <Box key={p.dataKey} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
          <Box component="span" sx={{ width: 10, height: 2, borderRadius: 1, bgcolor: p.color || p.fill }} />
          <Typography component="span" sx={{ fontSize: 13, fontWeight: 600 }}>{fmt(p.value)}</Typography>
          <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>{p.name}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export const axisProps = { tick: { fontSize: 12, fill: tokens.muted }, tickLine: false, axisLine: { stroke: tokens.rule } };
export const tickGap = (n) => Math.max(0, Math.ceil(n / 7) - 1);

