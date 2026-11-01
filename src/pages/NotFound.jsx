import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { Bubble } from '@/components/Bubble';

export default function NotFound() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', pt: { xs: 4, md: 10 } }}>
      <Box sx={{ mb: 2 }}><Bubble level="none" size={28} title="Not found" /></Box>
      <Typography variant="h4" component="h1">This page doesn't exist</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        There is nothing at <Box component="span" sx={{ fontWeight: 600, color: 'text.primary', wordBreak: 'break-all' }}>{pathname}</Box>. It may have moved, or the link may be mistyped.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button component={Link} to="/" variant="contained">Go to overview</Button>
        <Button variant="outlined" onClick={() => navigate(-1)}>Go back</Button>
      </Box>
    </Box>
  );
}
