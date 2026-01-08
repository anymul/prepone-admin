import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography
} from '@mui/material';
import { LogOut, AlertTriangle } from 'lucide-react';

export function LogoutDialog({ open, onClose }) {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      
      // Optional: Call logout API endpoint if you have one
      // await fetch(`${API_BASE_URL}/auth/logout`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });

      // Small delay for UX (optional)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to login
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout on client side even if API fails
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isLoggingOut ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: 'warning.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertTriangle size={24} color="#ed6c02" />
          </Box>
          <Typography variant="h6" fontWeight="600">
            Confirm Logout
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          Are you sure you want to logout from PrepOne Management Portal? 
          You will need to login again to access the dashboard.
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isLoggingOut}
          variant="outlined"
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="contained"
          color="error"
          startIcon={<LogOut size={18} />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
