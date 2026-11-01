// Sidebar.jsx
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Box, Drawer, IconButton, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import {
  Activity,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileQuestion,
  Layers,
  LayoutDashboard,
  LogOut,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Presentation,
  Radio,
  Users,
  Zap,
} from 'lucide-react';

import Logo from '@/components/Logo';
import { LogoutDialog } from '@/components/LogoutDialog';
import { useAuth } from '@/lib/auth-context';
import { BOARDS, useScope } from '@/lib/scope-context';
import { CLASSES, pathForClass } from '@/lib/scopeRoutes';
import { tokens } from '@/theme';

export const DRAWER_WIDTH = 272;
export const RAIL_WIDTH = 76;

const COLLAPSE_KEY = 'sidebar.collapsed';
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } };

// Grouped by what an admin is trying to do. Items that belong to a class follow the scope switcher.
const buildSections = (classId) => [
  {
    items: [{ title: 'Overview', icon: LayoutDashboard, to: '/', match: ['/'] }],
  },
  {
    heading: 'Content',
    items: [
      { title: 'Syllabus', icon: BookOpen, to: '/syllabus', match: ['/syllabus'] },
      { title: 'Questions', icon: FileQuestion, to: '/questions', match: ['/questions'] },
      { title: 'Flashcards', icon: Layers, to: '/flashcards', match: ['/flashcards'] },
      { title: 'Knowledge graph', icon: Network, to: '/knowledge-graph', match: ['/knowledge-graph'] },
      { title: 'Library', icon: BookMarked, to: '/library', match: ['/library'] },
    ],
  },
  {
    heading: 'Tests',
    items: [
      { title: 'Mock tests', icon: ClipboardList, to: '/mock-tests', match: ['/mock-tests'] },
      { title: 'Live quizzes', icon: Radio, to: '/live-quizzes', match: ['/live-quizzes'] },
    ],
  },
  {
    heading: 'Quality',
    items: [
      { title: 'Review questions', icon: ClipboardCheck, to: '/review', match: ['/review'] },
      { title: 'Business insights', icon: BarChart3, to: '/insights', match: ['/insights'] },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { title: 'Students & credits', icon: Users, to: '/students', match: ['/students'] },
      { title: 'Workshop leads', icon: Presentation, to: '/workshops', match: ['/workshops'] },
      { title: 'Send notifications', icon: Bell, to: '/notifications', match: ['/notifications'] },
      { title: 'Automatic nudges', icon: Zap, to: '/automatic-nudges', match: ['/automatic-nudges'] },
      { title: 'Scheduled jobs', icon: Clock, to: '/scheduled-jobs', match: ['/scheduled-jobs'] },
      { title: 'System health', icon: Activity, to: '/system-health', match: ['/system-health'] },
    ],
  },
];

const matches = (pathname, item) => item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

const itemSx = (active) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  minHeight: 42,
  px: 1.5,
  borderRadius: '5px',
  color: active ? tokens.ink : 'text.primary',
  bgcolor: active ? tokens.inkTint : 'transparent',
  fontSize: 14.5,
  fontWeight: active ? 600 : 500,
  textDecoration: 'none',
  '& svg': { color: active ? tokens.ink : tokens.muted, flexShrink: 0 },
  '&:hover': { bgcolor: active ? tokens.inkTint : 'action.hover' },
  '&::before': active
    ? { content: '""', position: 'absolute', left: -14, top: 9, bottom: 9, width: 3, borderRadius: '0 3px 3px 0', bgcolor: tokens.ink }
    : {},
});

function NavItem({ item, pathname, onNavigate, collapsed }) {
  const active = matches(pathname, item);
  const Icon = item.icon;
  const link = (
    <Box
      component={Link}
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? item.title : undefined}
      sx={{ ...itemSx(active), ...(collapsed ? { justifyContent: 'center', px: 0 } : {}) }}
    >
      <Icon size={18} strokeWidth={1.9} />
      {!collapsed && <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</Box>}
    </Box>
  );
  return collapsed ? <Tooltip title={item.title} placement="right">{link}</Tooltip> : link;
}

// The board and class everything below is scoped to. Changing the class on a class-based page opens the same page
// for the new class (mock tests still use class URLs).
function ScopeSwitcher({ onNavigate, collapsed, onExpand }) {
  const { classId, setClassId, board, setBoard } = useScope();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const changeClass = (_, value) => {
    if (!value || value === classId) return;
    setClassId(value);
    const next = pathForClass(pathname, value);
    if (next) navigate(next);
    onNavigate?.();
  };

  if (collapsed) {
    return (
      <Box sx={{ py: 2, borderBottom: `1px solid ${tokens.rule}`, display: 'grid', justifyItems: 'center' }}>
        <Tooltip title={`Working on ${board}, Class ${classId}. Open to change.`} placement="right">
          <Box component="button" type="button" onClick={onExpand} aria-label={`Working on ${board}, Class ${classId}. Open the sidebar to change.`} sx={{ border: `1px solid ${tokens.rule}`, bgcolor: tokens.inkTint, color: tokens.ink, borderRadius: '8px', width: 48, py: 0.75, cursor: 'pointer', font: 'inherit', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
            {board}<br />{classId}
          </Box>
        </Tooltip>
      </Box>
    );
  }

  const compact = { height: 34, '& .MuiToggleButton-root': { py: 0, fontSize: 13.5, lineHeight: 1 } };
  return (
    <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${tokens.rule}`, display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 1 }}>
      <ToggleButtonGroup exclusive fullWidth size="small" value={board} onChange={(_, v) => v && setBoard(v)} aria-label="Board" sx={compact}>
        {BOARDS.map((b) => <ToggleButton key={b} value={b}>{b}</ToggleButton>)}
      </ToggleButtonGroup>
      <ToggleButtonGroup exclusive fullWidth size="small" value={classId} onChange={changeClass} aria-label="Class" sx={compact}>
        {CLASSES.map((c) => (
          <Tooltip key={c} title={`Class ${c}`}><ToggleButton value={c} aria-label={`Class ${c}`}>{c}</ToggleButton></Tooltip>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'A';

function UserBlock({ onSignOut, collapsed }) {
  const { user } = useAuth();
  if (collapsed) {
    return (
      <Box sx={{ py: 1.5, borderTop: `1px solid ${tokens.rule}`, display: 'grid', justifyItems: 'center' }}>
        <Tooltip title="Sign out" placement="right">
          <IconButton onClick={onSignOut} aria-label="Sign out" sx={{ color: 'text.secondary', '&:hover': { color: tokens.red, bgcolor: tokens.redTint } }}>
            <LogOut size={18} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderTop: `1px solid ${tokens.rule}` }}>
      <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: tokens.inkTint, color: tokens.ink, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
        {initials(user?.name)}
      </Box>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{user?.name || 'Admin'}</Typography>
        <Typography noWrap sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.35 }}>{user?.email}</Typography>
      </Box>
      <Tooltip title="Sign out">
        <IconButton size="small" onClick={onSignOut} aria-label="Sign out" sx={{ color: 'text.secondary', '&:hover': { color: tokens.red, bgcolor: tokens.redTint } }}>
          <LogOut size={18} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export function Sidebar({ open, onClose, isMobile }) {
  const { pathname } = useLocation();
  const { classId } = useScope();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [collapsedPref, setCollapsedPref] = useState(readCollapsed);
  const onNavigate = isMobile ? onClose : undefined;
  const collapsed = !isMobile && collapsedPref;

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsedPref ? '1' : '0'); } catch { /* storage unavailable */ }
  }, [collapsedPref]);

  const content = (
    <Box component="nav" aria-label="Main" sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ height: 72, px: collapsed ? 0 : 2.5, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 1.5, borderBottom: `1px solid ${tokens.rule}`, flexShrink: 0, '&:hover .collapse-toggle, & .collapse-toggle:focus-visible': { opacity: 1 } }}>
        {collapsed ? (
          <Tooltip title="Expand sidebar" placement="right">
            <Box component="button" type="button" onClick={() => setCollapsedPref(false)} aria-label="Expand sidebar" aria-expanded={false}
              sx={{ position: 'relative', width: 44, height: 44, p: 0, border: 0, bgcolor: 'transparent', borderRadius: '10px', cursor: 'pointer', display: 'grid', placeItems: 'center', '& .rail-icon': { opacity: 0 }, '&:hover .rail-logo, &:focus-visible .rail-logo': { opacity: 0 }, '&:hover .rail-icon, &:focus-visible .rail-icon': { opacity: 1 }, '&:hover, &:focus-visible': { bgcolor: 'action.hover' } }}>
              <Box className="rail-logo" sx={{ position: 'absolute', display: 'grid' }}><Logo size={40} /></Box>
              <Box className="rail-icon" sx={{ position: 'absolute', display: 'grid', color: 'text.secondary' }}><PanelLeftOpen size={20} /></Box>
            </Box>
          </Tooltip>
        ) : (
          <>
            <Logo size={42} />
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2 }}>PrepOne</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.3 }}>Admin</Typography>
            </Box>
            {!isMobile && (
              <Tooltip title="Collapse sidebar">
                <IconButton className="collapse-toggle" onClick={() => setCollapsedPref(true)} aria-label="Collapse sidebar" aria-expanded sx={{ color: 'text.secondary', opacity: { xs: 1, md: 0 }, transition: 'opacity 120ms' }}>
                  <PanelLeftClose size={20} />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Box>

      <ScopeSwitcher onNavigate={onNavigate} collapsed={collapsed} onExpand={() => setCollapsedPref(false)} />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', px: collapsed ? 1.25 : 2, py: 2.5, display: 'grid', alignContent: 'start', gap: collapsed ? 1.5 : 3 }}>
        {buildSections(classId).map((section, i) => (
          <Box key={section.heading || i} sx={{ display: 'grid', gap: '4px' }}>
            {section.heading && !collapsed && <Typography sx={{ px: 1.5, pb: 0.75, fontSize: 13, fontWeight: 500, color: 'text.secondary' }}>{section.heading}</Typography>}
            {section.heading && collapsed && i > 0 && <Box sx={{ borderTop: `1px solid ${tokens.rule}`, mb: 1 }} />}
            {section.items.map((item) => (
              <NavItem key={item.to} item={item} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} />
            ))}
          </Box>
        ))}
      </Box>

      <UserBlock onSignOut={() => setLogoutDialogOpen(true)} collapsed={collapsed} />
      <LogoutDialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} />
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer variant="temporary" open={open} onClose={onClose} ModalProps={{ keepMounted: true }} PaperProps={{ sx: { width: DRAWER_WIDTH } }}>
        {content}
      </Drawer>
    );
  }

  return (
    <Box sx={{ width: collapsed ? RAIL_WIDTH : DRAWER_WIDTH, flexShrink: 0, borderRight: `1px solid ${tokens.rule}`, height: '100%', transition: 'width 160ms ease' }}>
      {content}
    </Box>
  );
}
