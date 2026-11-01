import { tokens } from '@/theme';

// An OMR-style answer bubble. It is the dashboard's unit of meaning:
//   full  = chapter has a healthy question bank (ink, filled)
//   half  = chapter has some questions but is thin (ink, half filled)
//   none  = chapter has no questions yet (red ring, empty)
const COLORS = { full: tokens.ink, half: tokens.ink, none: tokens.red };

export function Bubble({ level = 'none', size = 14, title }) {
  const color = COLORS[level] || tokens.ink;
  const r = size / 2 - 1;
  const c = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <circle cx={c} cy={c} r={r} fill={level === 'full' ? color : tokens.sheet} stroke={color} strokeWidth="1.5" />
      {level === 'half' && <path d={`M ${c} ${c - r} A ${r} ${r} 0 0 0 ${c} ${c + r} Z`} fill={color} />}
    </svg>
  );
}

// Brand mark: a row of answer bubbles, the last one still to be filled in.
export function BrandMark({ height = 16 }) {
  const levels = ['full', 'full', 'half', 'none'];
  const gap = height * 0.3;
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      {levels.map((level, i) => (
        <Bubble key={i} level={level} size={height} />
      ))}
    </span>
  );
}
