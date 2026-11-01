// src/pages/students/GrantCreditsDialog.jsx
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { Coins, X } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';

const PRESET_AMOUNTS = [1, 3, 5, 10, 25, 50];

const PRESET_REASONS = [
  'Evaluation goodwill',
  'Refund for failed attempt',
  'Compensation for app error',
  'Promotional credit',
  'Support assistance',
];

export function GrantCreditsDialog({ open, student, onClose, onSuccess }) {
  const [amount, setAmount] = useState(3);
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setAmount(3);
      setSelectedReason(PRESET_REASONS[0]);
      setCustomReason('');
      setError(null);
      setBusy(false);
    }
  }, [open, student]);

  if (!student) return null;

  const currentBalance = student.credits?.balance ?? 0;
  const numericAmount = Number(amount);
  const isCustom = selectedReason === 'custom';
  const effectiveReason = isCustom
    ? customReason.trim() || 'Admin manual grant'
    : selectedReason;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid positive number of credits.');
      return;
    }

    try {
      setBusy(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/credits/admin-grant`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          userId: student._id,
          amount: numericAmount,
          reason: effectiveReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to grant credits.');
      }

      toast.success(
        `Granted ${numericAmount} ${numericAmount === 1 ? 'credit' : 'credits'} to ${student.name || 'student'}. New balance: ${data.balance}`
      );

      if (onSuccess) {
        onSuccess(data.balance);
      }
      onClose();
    } catch (err) {
      console.error('[GrantCreditsDialog] submit error:', err);
      setError(err.message || 'Something went wrong while granting credits.');
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
              bgcolor: tokens.accentTint,
              color: tokens.amber,
            }}
          >
            <Coins size={18} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: 17, fontWeight: 600 }}>
              Grant credits
            </Typography>
            <Typography variant="caption" color="text.secondary">
              For {student.name}
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

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 2.5, py: 2.5, display: 'grid', gap: 2.5 }}>
          {/* Current balance card */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderRadius: '8px',
              bgcolor: tokens.inkTint,
              border: `1px solid ${tokens.rule}`,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
                Current balance
              </Typography>
              <Typography variant="h6" sx={{ color: tokens.ink, fontWeight: 600 }}>
                {currentBalance} credits
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
                After grant
              </Typography>
              <Typography variant="h6" sx={{ color: tokens.green, fontWeight: 600 }}>
                {currentBalance + (numericAmount > 0 ? numericAmount : 0)} credits
              </Typography>
            </Box>
          </Box>

          {/* Amount input & preset chips */}
          <Box sx={{ display: 'grid', gap: 1.25 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Credits to add
            </Typography>
            <TextField
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={busy}
              fullWidth
              inputProps={{ min: 1, max: 1000, step: 1 }}
              placeholder="e.g. 5"
              autoFocus
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              {PRESET_AMOUNTS.map((amt) => {
                const active = numericAmount === amt;
                return (
                  <Chip
                    key={amt}
                    label={`+${amt}`}
                    clickable
                    onClick={() => setAmount(amt)}
                    disabled={busy}
                    sx={{
                      minHeight: 32,
                      fontWeight: active ? 600 : 500,
                      bgcolor: active ? tokens.inkTint : tokens.sheet,
                      color: active ? tokens.ink : 'text.primary',
                      borderColor: active ? tokens.ink : tokens.rule,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      '&:hover': {
                        bgcolor: tokens.inkTint,
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          {/* Reason selection */}
          <Box sx={{ display: 'grid', gap: 1.25 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Reason for credit grant
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {PRESET_REASONS.map((r) => {
                const active = selectedReason === r;
                return (
                  <Chip
                    key={r}
                    label={r}
                    clickable
                    onClick={() => setSelectedReason(r)}
                    disabled={busy}
                    sx={{
                      minHeight: 32,
                      fontWeight: active ? 600 : 500,
                      bgcolor: active ? tokens.inkTint : tokens.sheet,
                      color: active ? tokens.ink : 'text.primary',
                      borderColor: active ? tokens.ink : tokens.rule,
                      borderWidth: 1,
                      borderStyle: 'solid',
                    }}
                  />
                );
              })}
              <Chip
                label="Other / custom"
                clickable
                onClick={() => setSelectedReason('custom')}
                disabled={busy}
                sx={{
                  minHeight: 32,
                  fontWeight: isCustom ? 600 : 500,
                  bgcolor: isCustom ? tokens.inkTint : tokens.sheet,
                  color: isCustom ? tokens.ink : 'text.primary',
                  borderColor: isCustom ? tokens.ink : tokens.rule,
                  borderWidth: 1,
                  borderStyle: 'solid',
                }}
              />
            </Box>

            {isCustom && (
              <TextField
                label="Custom reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                disabled={busy}
                fullWidth
                multiline
                rows={2}
                placeholder="Reason or ticket reference..."
                sx={{ mt: 1 }}
              />
            )}
          </Box>

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
              '&:hover': { borderColor: tokens.muted },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={busy || !numericAmount || numericAmount <= 0}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <Coins size={16} />}
            sx={{
              minHeight: 40,
              bgcolor: tokens.ink,
              '&:hover': { bgcolor: tokens.inkDark },
            }}
          >
            {busy ? 'Granting...' : `Grant ${numericAmount > 0 ? numericAmount : ''} credits`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
