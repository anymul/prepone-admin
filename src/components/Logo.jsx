import { Box } from '@mui/material';

export default function Logo({ size = 40 }) {
  return <Box component="img" src="/logo.png" alt="PrepOne" width={size} height={size} sx={{ display: 'block', borderRadius: `${Math.round(size * 0.24)}px`, flexShrink: 0 }} />;
}
