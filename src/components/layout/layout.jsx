import React from 'react';
import { Sidebar } from './sidebar';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';

export function Layout({ children }) {
  const location = useLocation();
  
  // Don't show sidebar on login page
  if (location.pathname === '/login') {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        {children}
      </Box>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar Component */}
      <Sidebar />
      
      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 3, 
          bgcolor: 'background.default' 
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
