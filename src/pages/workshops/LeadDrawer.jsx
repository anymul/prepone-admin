// src/pages/workshops/LeadDrawer.jsx
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Mail,
  MessageCircle,
  Phone,
  Save,
  School,
  Sparkles,
  Tag,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';

export const CONTACT_STATUS_CONFIG = {
  new: {
    label: 'New lead',
    color: tokens.ink,
    bgcolor: tokens.inkTint,
    description: 'Fresh registration, not contacted yet',
  },
  contacted: {
    label: 'Contacted',
    color: tokens.amber,
    bgcolor: tokens.amberTint,
    description: 'Call or WhatsApp message sent',
  },
  interested: {
    label: 'Interested',
    color: '#0284C7',
    bgcolor: '#E0F2FE',
    description: 'Positive response, awaiting session or demo',
  },
  converted: {
    label: 'Converted / Enrolled',
    color: tokens.green,
    bgcolor: tokens.greenTint,
    description: 'Joined workshop or enrolled in prep program',
  },
  not_interested: {
    label: 'Not interested',
    color: tokens.red,
    bgcolor: tokens.redTint,
    description: 'Declined or invalid contact',
  },
};

const formatDate = (iso) => {
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

export function LeadDrawer({ lead, open, onClose, onUpdated }) {
  const [contactStatus, setContactStatus] = useState('new');
  const [status, setStatus] = useState('registered');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (lead) {
      setContactStatus(lead.contactStatus || 'new');
      setStatus(lead.status || 'registered');
      setNotes(lead.contactNotes || '');
      setSaveError(null);
    }
  }, [lead]);

  if (!lead) return null;

  const cleanPhone = (lead.phone || '').replace(/\D/g, '').slice(-10);
  const waUrl = cleanPhone
    ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
        `Hi ${lead.name}, thank you for registering for the Board Pe Charcha session on Solviq!`
      )}`
    : null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      const res = await fetch(`${API_BASE_URL}/workshops/admin/registrations/${lead._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          contactStatus,
          status,
          contactNotes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update lead');
      }

      toast.success('Lead details updated successfully');
      if (onUpdated) {
        onUpdated(data.data);
      }
    } catch (err) {
      console.error('Update lead error:', err);
      setSaveError(err.message || 'Could not update lead');
      toast.error(err.message || 'Could not update lead');
    } finally {
      setSaving(false);
    }
  };

  const currentCfg = CONTACT_STATUS_CONFIG[contactStatus] || CONTACT_STATUS_CONFIG.new;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 540, md: 580 },
          maxWidth: '100vw',
          bgcolor: tokens.paper,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          bgcolor: tokens.sheet,
          borderBottom: `1px solid ${tokens.rule}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '10px',
              bgcolor: tokens.inkTint,
              color: tokens.ink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={22} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: tokens.text,
                fontSize: { xs: '1.05rem', sm: '1.2rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {lead.name}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Registered for {lead.workshopId}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close drawer"
          sx={{
            color: tokens.muted,
            width: 44,
            height: 44,
            '&:hover': { bgcolor: tokens.inkTint, color: tokens.ink },
          }}
        >
          <X size={20} />
        </IconButton>
      </Box>

      {/* Drawer Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 2.5 }, display: 'grid', gap: 2.5 }}>
        {/* Quick Action Contact Buttons */}
        <Box sx={{ display: 'grid', gridTemplateColumns: cleanPhone ? '1fr 1fr' : '1fr', gap: 1.5 }}>
          {cleanPhone && (
            <Button
              component="a"
              href={`tel:+91${cleanPhone}`}
              variant="outlined"
              startIcon={<Phone size={16} />}
              sx={{
                minHeight: 44,
                borderColor: tokens.rule,
                color: tokens.ink,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: tokens.sheet,
                '&:hover': { borderColor: tokens.ink, bgcolor: tokens.inkTint },
              }}
            >
              Call {cleanPhone}
            </Button>
          )}

          {waUrl && (
            <Button
              component="a"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              startIcon={<MessageCircle size={16} />}
              sx={{
                minHeight: 44,
                bgcolor: '#25D366',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#1EBE5D', boxShadow: 'none' },
              }}
            >
              WhatsApp
            </Button>
          )}
        </Box>

        {/* Lead Details Card */}
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            bgcolor: tokens.sheet,
            border: `1px solid ${tokens.rule}`,
            display: 'grid',
            gap: 1.75,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.text }}>
            Student details
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Class &amp; Board
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                <GraduationCap size={15} color={tokens.ink} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text }}>
                  Class {lead.studentClass} • {lead.board}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Phone number
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                <Phone size={15} color={tokens.ink} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text }}>
                  +91 {lead.phone}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ borderColor: tokens.rule }} />

          <Box sx={{ display: 'grid', gap: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Email
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                <Mail size={15} color={tokens.muted} />
                <Typography variant="body2" sx={{ color: lead.email ? tokens.text : tokens.muted }}>
                  {lead.email || 'None provided'}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                School
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                <School size={15} color={tokens.muted} />
                <Typography variant="body2" sx={{ color: lead.school ? tokens.text : tokens.muted }}>
                  {lead.school || 'Not specified'}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Workshop session
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                <Tag size={15} color={tokens.muted} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: tokens.ink }}>
                  {lead.workshopId}
                </Typography>
              </Box>
            </Box>

            {lead.source && (
              <Box>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  Lead source
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.text, mt: 0.25 }}>
                  {lead.source}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ borderColor: tokens.rule }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Registered on
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontWeight: 500, color: tokens.text, mt: 0.25 }}>
                {formatDate(lead.createdAt)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                First contacted
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontWeight: 500, color: tokens.text, mt: 0.25 }}>
                {lead.contactedAt ? formatDate(lead.contactedAt) : 'Not contacted yet'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Lead Management & CRM Updates */}
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            bgcolor: tokens.sheet,
            border: `1px solid ${tokens.rule}`,
            display: 'grid',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.text }}>
              Outreach status &amp; notes
            </Typography>
            <Chip
              size="small"
              label={currentCfg.label}
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                color: currentCfg.color,
                bgcolor: currentCfg.bgcolor,
                border: `1px solid ${currentCfg.color}30`,
              }}
            />
          </Box>

          {saveError && (
            <Alert severity="error" sx={{ fontSize: '0.85rem' }}>
              {saveError}
            </Alert>
          )}

          <FormControl fullWidth size="small">
            <InputLabel id="contact-status-label">Contact status</InputLabel>
            <Select
              labelId="contact-status-label"
              value={contactStatus}
              label="Contact status"
              onChange={(e) => setContactStatus(e.target.value)}
              sx={{ bgcolor: tokens.sheet }}
            >
              {Object.entries(CONTACT_STATUS_CONFIG).map(([key, cfg]) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: cfg.color,
                      }}
                    />
                    <Typography variant="body2">{cfg.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id="reg-status-label">Registration status</InputLabel>
            <Select
              labelId="reg-status-label"
              value={status}
              label="Registration status"
              onChange={(e) => setStatus(e.target.value)}
              sx={{ bgcolor: tokens.sheet }}
            >
              <MenuItem value="registered">Registered (active seat)</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Internal CRM notes"
            placeholder="Add notes about call discussion, parent preferences, or reminders..."
            multiline
            rows={3}
            fullWidth
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            helperText="Visible only to administrators"
            sx={{ bgcolor: tokens.sheet }}
          />

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
            sx={{
              minHeight: 44,
              bgcolor: tokens.ink,
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.inkDark, boxShadow: 'none' },
            }}
          >
            {saving ? 'Saving changes...' : 'Save lead updates'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
