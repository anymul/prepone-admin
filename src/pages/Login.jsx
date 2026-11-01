import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { clearAuthNotice, peekAuthNotice } from '@/lib/session';
import Logo from '@/components/Logo';
import { tokens } from '@/theme';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Shows why we were signed out (expired / idle) the first time the page renders.
  const [error, setError] = useState(() => peekAuthNotice());
  useEffect(() => { clearAuthNotice(); }, []);
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Only follow same-app paths; never an absolute or protocol-relative URL.
  const from = /^\/(?!\/)/.test(location.state?.from || '') ? location.state.from : '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('Enter your email or username and your password.');
      return;
    }
    if (cleanUsername.length < 3) {
      setError('Your username must be at least 3 characters.');
      return;
    }

    setLoading(true);
    const res = await login(cleanUsername, cleanPassword);
    if (res?.success) {
      navigate(from, { replace: true });
    } else {
      setError(res?.message || 'The email, username or password is incorrect.');
      setLoading(false);
    }
  };

  if (user) return <Navigate to={from} replace />;

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', p: 2 }}>
      <Box component="main" sx={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Logo size={44} />
          <Typography sx={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>PrepOne Admin</Typography>
        </Box>

        <Box sx={{ bgcolor: 'background.paper', border: `1px solid ${tokens.rule}`, borderRadius: '8px', p: { xs: 2.5, sm: 3.5 } }}>
          <Typography variant="h5" component="h1">Sign in</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
            Use your PrepOne admin account.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'grid', gap: 2 }}>
            {error && <Alert severity="error" role="alert">{error}</Alert>}

            <TextField
              id="username"
              label="Email or username"
              size="medium"
              fullWidth
              autoFocus
              disabled={loading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              inputProps={{ autoCapitalize: 'none', autoCorrect: 'off', spellCheck: 'false' }}
            />

            <TextField
              id="password"
              label="Password"
              size="medium"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              inputProps={{ autoCapitalize: 'none', autoCorrect: 'off', spellCheck: 'false' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      edge="end"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mt: 0.5, height: 44 }}>
              {loading ? <CircularProgress size={20} color="inherit" aria-label="Signing in" /> : 'Sign in'}
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Locked out or need an account? Ask a PrepOne super admin.
        </Typography>
      </Box>
    </Box>
  );
}
