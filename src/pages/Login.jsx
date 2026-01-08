import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  InputAdornment,
  CircularProgress,
  Link as MuiLink,
  Divider,
  Container,
  Snackbar,
  Fade,
  LinearProgress
} from '@mui/material';

import {
  ErrorOutline,
  LockOutlined,
  PersonOutline,
  CheckCircle,
  Login as LoginIcon
} from '@mui/icons-material';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Toast state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!username || !password) {
      setError('Username and password are required');
      showToast('Please fill in all fields', 'error');
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      showToast('Invalid username format', 'error');
      setLoading(false);
      return;
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = login(username, password);

    if (success) {
      setError('');
      showToast('Login successful!', 'success');
      setRedirecting(true);

      // Show redirecting message for 1.5 seconds
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } else {
      setError('Invalid username or password');
      showToast('Invalid credentials. Please try again.', 'error');
      setLoading(false);
      setRedirecting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        p: 2
      }}
    >
      <Container maxWidth="xs">
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Loading Progress Bar */}
          {loading && (
            <LinearProgress
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3
              }}
            />
          )}

          {/* Header */}
          <Box sx={{ p: 4, pb: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                mx: 'auto',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                borderRadius: 1
              }}
            >
              <LockOutlined sx={{ fontSize: 28, color: 'white' }} />
            </Box>

            <Typography variant="h5" fontWeight="600" gutterBottom>
              Admin Login
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Enter your credentials to access the dashboard
            </Typography>
          </Box>

          <Divider />

          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Success Message (Redirecting) */}
                {redirecting && (
                  <Fade in={redirecting}>
                    <Alert
                      severity="success"
                      icon={<CheckCircle />}
                      sx={{
                        mb: 1,
                        '& .MuiAlert-message': {
                          width: '100%'
                        }
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Login Successful!
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Redirecting to dashboard...
                        </Typography>
                      </Box>
                    </Alert>
                  </Fade>
                )}

                {/* Error Message */}
                {error && !redirecting && (
                  <Fade in={!!error}>
                    <Alert
                      severity="error"
                      icon={<ErrorOutline />}
                      sx={{ mb: 1 }}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                <TextField
                  id="username"
                  label="Username"
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  id="password"
                  label="Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ textAlign: 'right', mt: -1 }}>
                  <MuiLink
                    href="#"
                    variant="body2"
                    underline="hover"
                    sx={{ fontWeight: 500 }}
                    onClick={(e) => {
                      e.preventDefault();
                      showToast('Please contact administrator for password reset', 'info');
                    }}
                  >
                    Forgot password?
                  </MuiLink>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={loading ? null : <LoginIcon />}
                  sx={{
                    mt: 1,
                    height: 48,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 1
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      {redirecting ? 'Redirecting...' : 'Logging in...'}
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </Box>
            </form>
          </CardContent>

          <Divider />

          <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">
              Need access?{' '}
              <MuiLink
                href="#"
                underline="hover"
                fontWeight="600"
                color="primary"
                onClick={(e) => {
                  e.preventDefault();
                  showToast('Please contact your administrator for access', 'info');
                }}
              >
                Contact Administrator
              </MuiLink>
            </Typography>
          </Box>
        </Card>

        {/* Footer */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 3 }}
        >
          © 2026 PrepOne. All rights reserved.
        </Typography>
      </Container>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Fade}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          variant="filled"
          elevation={6}
          sx={{
            width: '100%',
            minWidth: 300,
            fontWeight: 500
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
