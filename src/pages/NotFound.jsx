import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Container,
  Stack,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  Home,
  ErrorOutline
} from '@mui/icons-material';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center' }}>
          {/* Error Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 3,
              borderRadius: 2,
              bgcolor: 'error.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ErrorOutline sx={{ fontSize: 48, color: 'error.main' }} />
          </Box>

          {/* 404 Code */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '4rem', sm: '6rem' },
              fontWeight: 700,
              color: 'text.primary',
              mb: 2,
              letterSpacing: '-0.02em'
            }}
          >
            404
          </Typography>

          {/* Heading */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 2
            }}
          >
            Page Not Found
          </Typography>

          <Divider sx={{ my: 3, maxWidth: 400, mx: 'auto' }} />

          {/* Description */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 480, mx: 'auto', lineHeight: 1.6 }}
          >
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </Typography>

          {/* Action Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              component={Link}
              to="/"
              variant="contained"
              size="large"
              startIcon={<Home />}
              sx={{
                px: 4,
                py: 1.25,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 1
                }
              }}
            >
              Return to Dashboard
            </Button>

            <Button
              onClick={() => navigate(-1)}
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              sx={{
                px: 4,
                py: 1.25,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                borderWidth: 1.5,
                '&:hover': {
                  borderWidth: 1.5
                }
              }}
            >
              Go Back
            </Button>
          </Stack>

          {/* Help Text */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 4 }}
          >
            Need assistance? Contact support at{' '}
            <Typography
              component="span"
              variant="body2"
              color="primary.main"
              sx={{ fontWeight: 600 }}
            >
              support@prepone.com
            </Typography>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
