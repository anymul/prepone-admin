// Layout.jsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';
import ErrorBoundary from '../ErrorBoundary';
import { useScope } from '@/lib/scope-context';
import { CLASSES, classFromPath } from '@/lib/scopeRoutes';

export function Layout({ children }) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { setClassId } = useScope();

  // Opening a class-specific link (or a bookmark) switches the scope to that class.
  useEffect(() => {
    const c = classFromPath(location.pathname);
    if (c && CLASSES.includes(c)) setClassId(c);
  }, [location.pathname, setClassId]);

  if (location.pathname === '/login') {
    return <Box sx={{ minHeight: '100vh' }}>{children}</Box>;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Box
        component="a"
        href="#main"
        sx={{
          position: 'absolute',
          left: 8,
          top: -48,
          zIndex: theme.zIndex.tooltip,
          px: 1.5,
          py: 1,
          borderRadius: 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          fontSize: 13,
          fontWeight: 600,
          '&:focus': { top: 8 },
        }}
      >
        Skip to content
      </Box>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar isMobile={isMobile} onMenu={() => setSidebarOpen(true)} />
        <Box component="main" id="main" tabIndex={-1} sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2.5, md: 4 }, outline: 'none' }}>
          {/* Keyed by route so a crashed page recovers when the user navigates elsewhere. */}
          <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}
