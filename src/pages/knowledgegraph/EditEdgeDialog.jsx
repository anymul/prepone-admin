// src/pages/knowledgegraph/EditEdgeDialog.jsx
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowRight, Link2, PlusCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';

export function EditEdgeDialog({ open, onClose, edge, subjectId, board, chapters = [], foundationalChapters = [], onSaved }) {
  const isEditing = Boolean(edge?._id);

  const [fromChapterId, setFromChapterId] = useState('');
  const [toChapterId, setToChapterId] = useState('');
  const [dependencyType, setDependencyType] = useState('HARD_PREREQUISITE');
  const [strength, setStrength] = useState(1.0);
  const [explanation, setExplanation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (edge) {
      setFromChapterId(edge.fromChapterId || '');
      setToChapterId(edge.toChapterId || '');
      setDependencyType(edge.dependencyType || 'HARD_PREREQUISITE');
      setStrength(edge.strength ?? 1.0);
      setExplanation(edge.explanation || '');
      setError(null);
    } else {
      setFromChapterId('');
      setToChapterId('');
      setDependencyType('HARD_PREREQUISITE');
      setStrength(1.0);
      setExplanation('');
      setError(null);
    }
  }, [edge, open]);

  const allAvailableFromChapters = [
    ...chapters.map((c) => ({ ...c, label: `Class ${c.studentClass} • ${c.name}` })),
    ...foundationalChapters
      .filter((fc) => !chapters.some((c) => c._id === fc._id))
      .map((fc) => ({
        ...fc,
        label: `[Foundation Class ${fc.studentClass}] ${fc.name}`,
      })),
  ];

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!isEditing && (!fromChapterId || !toChapterId)) {
        throw new Error('Please select both a prerequisite chapter and a dependent chapter.');
      }

      if (!isEditing && fromChapterId === toChapterId) {
        throw new Error('A chapter cannot be a prerequisite of itself.');
      }

      const url = isEditing
        ? `${API_BASE_URL}/knowledge-graph/admin/edges/${edge._id}`
        : `${API_BASE_URL}/knowledge-graph/admin/edges`;

      const method = isEditing ? 'PATCH' : 'POST';

      const payload = isEditing
        ? { dependencyType, strength, explanation }
        : {
            fromChapterId,
            toChapterId,
            dependencyType,
            strength,
            explanation,
            board: board || 'CBSE',
          };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save prerequisite edge');
      }

      toast.success(isEditing ? 'Prerequisite edge updated' : 'Prerequisite edge created');
      if (onSaved) onSaved(data.edge);
      onClose();
    } catch (err) {
      console.error('Save edge error:', err);
      setError(err.message || 'Could not save prerequisite edge');
      toast.error(err.message || 'Could not save prerequisite edge');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          bgcolor: tokens.paper,
          border: `1px solid ${tokens.rule}`,
        },
      }}
    >
      <DialogTitle sx={{ bgcolor: tokens.sheet, borderBottom: `1px solid ${tokens.rule}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Link2 size={20} color={tokens.ink} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.text }}>
            {isEditing ? 'Edit Prerequisite Link' : 'Add Prerequisite Link'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, display: 'grid', gap: 2.5, mt: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}

        {isEditing ? (
          <Box
            sx={{
              p: 2,
              borderRadius: '8px',
              bgcolor: tokens.sheet,
              border: `1px solid ${tokens.rule}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Prerequisite
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text }}>
                {edge.fromChapterName}
              </Typography>
            </Box>

            <ArrowRight size={18} color={tokens.ink} />

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Dependent topic
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text }}>
                {edge.toChapterName}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="from-chapter-label">Prerequisite (Foundational chapter)</InputLabel>
              <Select
                labelId="from-chapter-label"
                value={fromChapterId}
                label="Prerequisite (Foundational chapter)"
                onChange={(e) => setFromChapterId(e.target.value)}
                sx={{ bgcolor: tokens.sheet }}
              >
                {allAvailableFromChapters.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="to-chapter-label">Dependent (Requires foundational mastery)</InputLabel>
              <Select
                labelId="to-chapter-label"
                value={toChapterId}
                label="Dependent (Requires foundational mastery)"
                onChange={(e) => setToChapterId(e.target.value)}
                sx={{ bgcolor: tokens.sheet }}
              >
                {chapters.map((c) => (
                  <MenuItem key={c._id} value={c._id} disabled={c._id === fromChapterId}>
                    Class {c.studentClass} • {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        <FormControl fullWidth size="small">
          <InputLabel id="dep-type-label">Dependency type</InputLabel>
          <Select
            labelId="dep-type-label"
            value={dependencyType}
            label="Dependency type"
            onChange={(e) => setDependencyType(e.target.value)}
            sx={{ bgcolor: tokens.sheet }}
          >
            <MenuItem value="HARD_PREREQUISITE">
              <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.ink }}>
                Hard Prerequisite (Must master foundational concepts first)
              </Typography>
            </MenuItem>
            <MenuItem value="SOFT_PREREQUISITE">
              <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.amber }}>
                Soft Prerequisite (Helpful background context)
              </Typography>
            </MenuItem>
            <MenuItem value="CONCEPTUAL_EXTENSION">
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0284C7' }}>
                Conceptual Extension (Advanced thematic continuation)
              </Typography>
            </MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ p: 2, borderRadius: '8px', bgcolor: tokens.sheet, border: `1px solid ${tokens.rule}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.text }}>
              Dependency Strength: {(strength * 100).toFixed(0)}%
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Weight used by diagnostic engine
            </Typography>
          </Box>
          <Slider
            value={strength}
            min={0.1}
            max={1.0}
            step={0.05}
            onChange={(_, val) => setStrength(val)}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
            sx={{ color: tokens.ink }}
          />
        </Box>

        <TextField
          label="Pedagogical explanation"
          placeholder="Why is mastering the prerequisite required before attempting this chapter?"
          multiline
          rows={3}
          size="small"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          helperText="Explains the cognitive connection to students and teachers"
          sx={{ bgcolor: tokens.sheet }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: tokens.sheet, borderTop: `1px solid ${tokens.rule}` }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: tokens.muted, textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : isEditing ? <Save size={16} /> : <PlusCircle size={16} />}
          sx={{
            minHeight: 38,
            bgcolor: tokens.ink,
            color: '#ffffff',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { bgcolor: tokens.inkDark, boxShadow: 'none' },
          }}
        >
          {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create link'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
