import { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import { X, Smartphone, RotateCcw, Save, Sparkles } from 'lucide-react';
import { tokens } from '@/theme';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const SAMPLE_PREVIEW_DATA = {
  name: 'Rahul',
  dueCount: '5',
  overdueCount: '2',
  currentStreak: '7',
  behindCount: '3',
  worstChapter: 'Organic Chemistry',
  daysToExam: '45',
  lastStreak: '6',
  chaserName: 'Priya',
  xpGap: '20',
  testTitle: 'Board Sprint Mock #2',
  quizId: 'quiz_123',
};

function formatPreviewText(str, data) {
  if (!str) return '';
  return str.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

export default function NudgeEditorDrawer({ open, onClose, nudge, onSaved }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (nudge) {
      setTitle(nudge.customTitle ?? nudge.defaultTitle ?? '');
      setBody(nudge.customBody ?? nudge.defaultBody ?? '');
    }
  }, [nudge]);

  if (!nudge) return null;

  const handleInsertVariable = (variableKey, targetField) => {
    if (targetField === 'title') {
      setTitle((prev) => `${prev} ${variableKey}`.trim());
    } else {
      setBody((prev) => `${prev} ${variableKey}`.trim());
    }
  };

  const handleResetToDefault = () => {
    setTitle(nudge.defaultTitle);
    setBody(nudge.defaultBody);
    toast.info('Reverted to system default copy in editor.');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const isDefaultTitle = title.trim() === nudge.defaultTitle.trim();
      const isDefaultBody = body.trim() === nudge.defaultBody.trim();

      const payload = {
        customTitle: isDefaultTitle ? null : title.trim(),
        customBody: isDefaultBody ? null : body.trim(),
      };

      await api.patch(`/notifications/admin/nudges/${nudge.nudgeId}`, payload);
      toast.success(`Updated copy for "${nudge.name}"`);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save nudge copy:', err);
      toast.error(err.message || 'Failed to save copy');
    } finally {
      setSaving(false);
    }
  };

  const previewTitle = formatPreviewText(title, SAMPLE_PREVIEW_DATA);
  const previewBody = formatPreviewText(body, SAMPLE_PREVIEW_DATA);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480 },
          bgcolor: tokens.cream,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${tokens.hairline}`,
          bgcolor: tokens.sheet,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Sparkles size={18} color={tokens.ink} />
            <Typography variant="h6" sx={{ color: tokens.ink, fontWeight: 700, fontSize: 17 }}>
              Tune nudge copy
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: tokens.muted, fontSize: 13, mt: 0.25 }}>
            {nudge.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Close drawer">
          <X size={20} color={tokens.ink} />
        </IconButton>
      </Box>

      {/* Drawer Body */}
      <Box sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
        <Stack spacing={2.5}>
          {/* Schedule & Category info */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              bgcolor: tokens.sheet,
              border: `1px solid ${tokens.hairline}`,
            }}
          >
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Trigger schedule
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.ink, fontWeight: 600, mt: 0.25 }}>
              {nudge.scheduleHuman}
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted, fontSize: 12.5, mt: 0.5 }}>
              Audience: {nudge.targetAudience}
            </Typography>
          </Box>

          {/* Title input */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.ink, textTransform: 'uppercase' }}>
                Notification title
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.muted, fontSize: 11 }}>
                {title.length} characters
              </Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title..."
              sx={{ bgcolor: tokens.sheet }}
            />
          </Box>

          {/* Body input */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.ink, textTransform: 'uppercase' }}>
                Notification body
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.muted, fontSize: 11 }}>
                {body.length} characters
              </Typography>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message body..."
              sx={{ bgcolor: tokens.sheet }}
            />
          </Box>

          {/* Dynamic Variable Chips */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.muted, textTransform: 'uppercase', display: 'block', mb: 1 }}>
              Available dynamic tokens (tap to insert into body):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {nudge.supportedVariables.map((v) => (
                <Chip
                  key={v}
                  label={v}
                  size="small"
                  onClick={() => handleInsertVariable(v, 'body')}
                  sx={{
                    bgcolor: tokens.sheet,
                    border: `1px solid ${tokens.hairline}`,
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: tokens.inkTint, color: tokens.ink },
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ borderColor: tokens.hairline }} />

          {/* Live Mobile Lock-screen Mockup */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
              <Smartphone size={16} color={tokens.ink} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.ink, textTransform: 'uppercase' }}>
                Live preview (with sample data)
              </Typography>
            </Box>

            <Box
              sx={{
                bgcolor: '#1E1B26',
                borderRadius: '16px',
                p: 2,
                color: '#fff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}
            >
              {/* Phone Status Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, opacity: 0.6, fontSize: 11 }}>
                <span>PrepOne App</span>
                <span>Just now</span>
              </Box>

              {/* Push Notification Card */}
              <Box
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  p: 1.5,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13.5, color: '#fff', mb: 0.25 }}>
                  {previewTitle || 'Notification Title'}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4 }}>
                  {previewBody || 'Notification body text will appear here.'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Drawer Actions */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${tokens.hairline}`,
          bgcolor: tokens.sheet,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<RotateCcw size={14} />}
          onClick={handleResetToDefault}
          sx={{
            borderColor: tokens.hairline,
            color: tokens.muted,
            textTransform: 'none',
            '&:hover': { borderColor: tokens.ink, color: tokens.ink },
          }}
        >
          Reset to default
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="text"
            size="small"
            onClick={onClose}
            sx={{ color: tokens.muted, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save size={14} />}
            disabled={saving}
            onClick={handleSave}
            sx={{
              bgcolor: tokens.ink,
              color: '#fff',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#2C1650' },
            }}
          >
            Save changes
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
