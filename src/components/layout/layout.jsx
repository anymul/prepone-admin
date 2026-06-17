// Layout.jsx
import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { useLocation } from 'react-router-dom';
import { Box, IconButton, AppBar, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Menu } from 'lucide-react';

export function Layout({ children }) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (location.pathname === '/login') {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        {children}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile Top AppBar */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ minHeight: 56, px: 2 }}>
            <IconButton
              edge="start"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              sx={{ mr: 1.5 }}
            >
              <Menu size={22} />
            </IconButton>
            <Typography variant="h6" fontWeight="bold" color="primary">
              PrepOne
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              Management Portal
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 3,
          bgcolor: 'background.default',
          // On mobile, add top padding to account for the AppBar
          pt: isMobile ? '72px' : 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}