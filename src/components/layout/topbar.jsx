import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, Breadcrumbs, IconButton, Link, Typography } from '@mui/material';
import { Menu } from 'lucide-react';
import { tokens } from '@/theme';
import { HEALTH_LABEL, useHealth } from '@/lib/useHealth';

const STATIC = {
  '/': ['Overview'],
  '/syllabus': ['Content', 'Syllabus'],
  '/questions': ['Content', 'Questions'],
  '/flashcards': ['Content', 'Flashcards'],
  '/library': ['Content', 'Library'],
  '/master-question-uploader': ['Content', 'Master question uploader'],
  '/mock-tests': ['Tests', 'Mock tests'],
  '/mock-tests/new': ['Tests', 'Mock tests', 'New test'],
  '/review': ['Quality', 'Review questions'],
  '/insights': ['Quality', 'Business insights'],
  '/notifications': ['Operations', 'Send notifications'],
  '/system-health': ['Operations', 'System health'],
};

// Builds [{ label, to? }] from the current path. The class is shown by the scope switcher, not the trail.
export function buildCrumbs(pathname) {
  if (STATIC[pathname]) return STATIC[pathname].map((label) => ({ label }));

  const parts = pathname.split('/').filter(Boolean);
  const [section] = parts;

  switch (section) {
    case 'mock-tests':
      return [{ label: 'Tests' }, { label: 'Mock tests', to: '/mock-tests' }, { label: 'Edit test' }];
    default:
      return [];
  }
}

const DOT = { ok: tokens.green, degraded: tokens.amber, down: tokens.red, loading: '#BFB3A4' };

function ApiStatus() {
  const { state } = useHealth();
  return (
    <Link
      component={RouterLink}
      to="/system-health"
      underline="none"
      aria-label={`${HEALTH_LABEL[state]}. Open system health.`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.25,
        py: 0.5,
        borderRadius: 1,
        color: 'text.secondary',
        fontSize: 14,
        '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
      }}
    >
      <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: DOT[state] }} />
      {HEALTH_LABEL[state]}
    </Link>
  );
}

export function TopBar({ isMobile, onMenu }) {
  const { pathname } = useLocation();
  const crumbs = buildCrumbs(pathname);

  return (
    <Box
      component="header"
      sx={{
        height: 64,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: { xs: 2, md: 4 },
        bgcolor: 'background.paper',
        borderBottom: `1px solid ${tokens.rule}`,
      }}
    >
      {isMobile && (
        <IconButton edge="start" onClick={onMenu} aria-label="Open navigation menu">
          <Menu size={20} />
        </IconButton>
      )}

      <Breadcrumbs separator="/" aria-label="Breadcrumb" sx={{ flexGrow: 1, minWidth: 0, fontSize: 14, '& .MuiBreadcrumbs-separator': { mx: 0.75, color: 'grey.400' } }}>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          if (crumb.to && !last) {
            return (
              <Link key={crumb.label} component={RouterLink} to={crumb.to} color="text.secondary" underline="hover">
                {crumb.label}
              </Link>
            );
          }
          return (
            <Typography key={crumb.label} component="span" sx={{ fontSize: 14, fontWeight: last ? 600 : 400, color: last ? 'text.primary' : 'text.secondary' }} aria-current={last ? 'page' : undefined}>
              {crumb.label}
            </Typography>
          );
        })}
      </Breadcrumbs>

      <ApiStatus />
    </Box>
  );
}
