import { Box, Typography } from '@mui/material';
import { tokens } from '@/theme';

// Flat bordered surface used for every dashboard section.
export const Panel = ({ children, sx }) => (
  <Box sx={{ bgcolor: 'background.paper', border: `1px solid ${tokens.rule}`, borderRadius: '12px', ...sx }}>{children}</Box>
);

export const PanelHeader = ({ title, description, action }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 3, py: 2.25, borderBottom: `1px solid ${tokens.rule}` }}>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h6">{title}</Typography>
      {description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{description}</Typography>}
    </Box>
    {action}
  </Box>
);
