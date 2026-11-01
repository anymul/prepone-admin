import React from 'react';
import { Box, Button, Typography } from '@mui/material';

// Stale lazy chunk after a new deploy ("Failed to fetch dynamically imported module") is fixed by a reload.
const isChunkError = (error) =>
  /dynamically imported module|Loading chunk|Importing a module script failed/i.test(String(error?.message || error));

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const chunk = isChunkError(error);
    return (
      <Box sx={{ minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          {chunk ? 'A new version is available' : 'Something went wrong'}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
          {chunk
            ? 'Reload the page to get the latest version of the dashboard.'
            : 'This page hit an unexpected error. Your data is safe — try again, or reload the page.'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!chunk && <Button variant="outlined" onClick={() => this.setState({ error: null })}>Try again</Button>}
          <Button variant="contained" onClick={() => window.location.reload()}>Reload</Button>
        </Box>
      </Box>
    );
  }
}
