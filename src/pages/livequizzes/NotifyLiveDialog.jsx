// src/pages/livequizzes/NotifyLiveDialog.jsx
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Typography,
} from '@mui/material';
import { Bell, Clock, Radio, Send, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';

const formatDateTime = (iso) => {
  if (!iso) return '–';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '–';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export function NotifyLiveDialog({ open, quiz, onClose, onSuccess }) {
  const [force, setForce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForce(false);
      setError(null);
      setBusy(false);
    }
  }, [open, quiz]);

  if (!quiz) return null;

  const alreadySent = Boolean(quiz.liveNotificationSent);

  const handleSend = async () => {
    try {
      setBusy(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/live-quiz/${quiz.id || quiz._id}/notify-live`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ force }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispatch live notification.');
      }

      toast.success(
        `Live broadcast sent to ${quiz.board} Class ${quiz.studentClass} students.`
      );

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('[NotifyLiveDialog] dispatch error:', err);
      setError(err.message || 'Failed to broadcast notification.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '14px',
          border: `1px solid ${tokens.rule}`,
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          pt: 2,
          pb: 1.5,
          borderBottom: `1px solid ${tokens.rule}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 0.75,
              borderRadius: '8px',
              bgcolor: tokens.inkTint,
              color: tokens.ink,
            }}
          >
            <Radio size={18} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: 17, fontWeight: 600 }}>
              Broadcast "Live Now" push
            </Typography>
            <Typography variant="caption" color="text.secondary">
              High-priority live notification
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          disabled={busy}
          size="small"
          aria-label="Close"
          sx={{ minWidth: 40, minHeight: 40 }}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, py: 2.5, display: 'grid', gap: 2.5 }}>
        {/* Target Audience Summary */}
        <Box
          sx={{
            p: 2,
            borderRadius: '10px',
            bgcolor: tokens.sheet,
            border: `1px solid ${tokens.rule}`,
            display: 'grid',
            gap: 1.25,
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: 15, color: tokens.text }}>
            {quiz.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', color: 'text.secondary', fontSize: 13.5 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Users size={14} color={tokens.muted} />
              <span>
                Target: <strong>{quiz.board}</strong> • Class {quiz.studentClass}
                {quiz.stream ? ` (${quiz.stream})` : ''}
              </span>
            </Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Clock size={14} color={tokens.muted} />
              <span>Ends {formatDateTime(quiz.windowEndTime)}</span>
            </Box>
          </Box>
        </Box>

        {/* Status notification notice */}
        {alreadySent ? (
          <Alert severity="warning" sx={{ borderRadius: '8px' }}>
            A notification for this quiz was already broadcast
            {quiz.liveNotificationSentAt ? ` on ${formatDateTime(quiz.liveNotificationSentAt)}` : ''}.
            Check the box below if you wish to send a repeat broadcast.
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary">
            This will dispatch a high-priority FCM push notification to all active registered students in{' '}
            <strong>
              {quiz.board} Class {quiz.studentClass}
            </strong>
            , informing them that the competitive quiz is currently open.
          </Typography>
        )}

        {alreadySent && (
          <FormControlLabel
            control={
              <Checkbox
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                disabled={busy}
              />
            }
            label="Force re-broadcast to students"
          />
        )}

        {error && (
          <Alert severity="error" role="alert" sx={{ borderRadius: '8px' }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 2,
          borderTop: `1px solid ${tokens.rule}`,
          gap: 1.5,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={busy}
          sx={{
            minHeight: 40,
            color: 'text.secondary',
            borderColor: tokens.rule,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={busy || (alreadySent && !force)}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
          sx={{
            minHeight: 40,
            bgcolor: tokens.ink,
            '&:hover': { bgcolor: tokens.inkDark },
          }}
        >
          {busy ? 'Broadcasting...' : alreadySent ? 'Re-broadcast now' : 'Send notification now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
