// src/pages/livequizzes/CreateLiveQuizDrawer.jsx
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
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Calendar, Clock, HelpCircle, Radio, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { loadSyllabus } from '@/lib/syllabusData';
import { tokens } from '@/theme';

const formatLocalISO = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function CreateLiveQuizDrawer({ open, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [board, setBoard] = useState('BSEB');
  const [studentClass, setStudentClass] = useState(12);
  const [stream, setStream] = useState('Science');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjectsList, setSubjectsList] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Time window
  const [windowStart, setWindowStart] = useState('');
  const [windowEnd, setWindowEnd] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);

  // Question selection mode
  const [questionCount, setQuestionCount] = useState(25);

  // Live settings
  const [testCode, setTestCode] = useState('');
  const [leaderboardVisibility, setLeaderboardVisibility] = useState('during_and_after');
  const [allowFeedback, setAllowFeedback] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Default times when drawer opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      // Set to today 19:00 if before 19:00, otherwise now + 15m
      const s = new Date(now);
      s.setHours(19, 0, 0, 0);
      if (s <= now) {
        s.setTime(now.getTime() + 15 * 60 * 1000);
      }
      const e = new Date(s.getTime() + 3 * 3600 * 1000); // 3 hours window

      setWindowStart(formatLocalISO(s));
      setWindowEnd(formatLocalISO(e));
      setTitle('');
      setDescription('');
      setTestCode('');
      setQuestionCount(25);
      setDurationMinutes(45);
      setError(null);
    }
  }, [open]);

  // Load subjects for chosen board + class
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function fetchSubjects() {
      try {
        setLoadingSubjects(true);
        const data = await loadSyllabus(board, Number(studentClass));
        if (cancelled) return;
        setSubjectsList(data || []);
        if (data && data.length > 0) {
          setSelectedSubjectId(data[0]._id);
        } else {
          setSelectedSubjectId('');
        }
      } catch (err) {
        if (!cancelled) console.error('[CreateLiveQuizDrawer] load subjects error:', err);
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    }
    fetchSubjects();
    return () => {
      cancelled = true;
    };
  }, [open, board, studentClass]);

  // Quick preset handlers
  const handlePresetTonight = () => {
    const s = new Date();
    s.setHours(19, 0, 0, 0);
    const e = new Date(s.getTime() + 3 * 3600 * 1000);
    setWindowStart(formatLocalISO(s));
    setWindowEnd(formatLocalISO(e));
  };

  const handlePresetTomorrow = () => {
    const s = new Date();
    s.setDate(s.getDate() + 1);
    s.setHours(19, 0, 0, 0);
    const e = new Date(s.getTime() + 3 * 3600 * 1000);
    setWindowStart(formatLocalISO(s));
    setWindowEnd(formatLocalISO(e));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the live quiz.');
      return;
    }
    if (!selectedSubjectId) {
      setError('Please select a subject for the live quiz.');
      return;
    }
    if (!windowStart || !windowEnd) {
      setError('Please specify both window start and end times.');
      return;
    }

    const startDate = new Date(windowStart);
    const endDate = new Date(windowEnd);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
      setError('Window start time must be before window end time.');
      return;
    }

    try {
      setBusy(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        board,
        studentClass: Number(studentClass),
        stream: stream || null,
        subjects: [selectedSubjectId],
        windowStartTime: startDate.toISOString(),
        windowEndTime: endDate.toISOString(),
        testCode: testCode.trim() ? testCode.trim().toUpperCase() : undefined,
        autoPick: {
          subjectId: selectedSubjectId,
          count: questionCount,
        },
        liveSettings: {
          showLiveLeaderboard: leaderboardVisibility !== 'hidden',
          leaderboardVisibility,
          allowRealtimeFeedback: allowFeedback,
          attemptDurationMinutes: Number(durationMinutes) || null,
        },
      };

      const res = await fetch(`${API_BASE_URL}/live-quiz/create`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to schedule live quiz.');
      }

      toast.success(`Live quiz "${title.trim()}" scheduled successfully! Code: ${data.data?.testCode}`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('[CreateLiveQuizDrawer] submit error:', err);
      setError(err.message || 'Something went wrong while creating the live quiz.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={busy ? undefined : onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 560, md: 680 },
          maxWidth: '100%',
          bgcolor: tokens.paper,
        },
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Drawer Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2.25,
            bgcolor: tokens.sheet,
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
              <Radio size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18 }}>
                Schedule live quiz
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Create a time-windowed competitive challenge
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} disabled={busy} aria-label="Close" sx={{ minWidth: 40, minHeight: 40 }}>
            <X size={20} />
          </IconButton>
        </Box>

        {/* Drawer Form Body */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'grid', gap: 3 }}>
          {error && (
            <Alert severity="error" role="alert" sx={{ borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          {/* Section 1: Basic Information */}
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.ink }}>
              1. Quiz details
            </Typography>

            <TextField
              label="Quiz title"
              required
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BSEB Class 12 Physics Mega Challenge"
              disabled={busy}
            />

            <TextField
              label="Description (optional)"
              fullWidth
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions or remarks for participating students..."
              disabled={busy}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5 }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="board-label">Board</InputLabel>
                <Select
                  labelId="board-label"
                  value={board}
                  label="Board"
                  onChange={(e) => setBoard(e.target.value)}
                  disabled={busy}
                >
                  <MenuItem value="BSEB">BSEB</MenuItem>
                  <MenuItem value="CBSE">CBSE</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel id="class-label">Class</InputLabel>
                <Select
                  labelId="class-label"
                  value={studentClass}
                  label="Class"
                  onChange={(e) => setStudentClass(Number(e.target.value))}
                  disabled={busy}
                >
                  <MenuItem value={10}>Class 10</MenuItem>
                  <MenuItem value={11}>Class 11</MenuItem>
                  <MenuItem value={12}>Class 12</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel id="stream-label">Stream</InputLabel>
                <Select
                  labelId="stream-label"
                  value={stream}
                  label="Stream"
                  onChange={(e) => setStream(e.target.value)}
                  disabled={busy}
                >
                  <MenuItem value="Science">Science</MenuItem>
                  <MenuItem value="Commerce">Commerce</MenuItem>
                  <MenuItem value="Arts">Arts</MenuItem>
                  <MenuItem value="">None / General</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <FormControl size="small" fullWidth required>
              <InputLabel id="subject-label">Subject</InputLabel>
              <Select
                labelId="subject-label"
                value={selectedSubjectId}
                label="Subject"
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={busy || loadingSubjects}
              >
                {subjectsList.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name} ({s.chapters?.length || 0} chapters)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ borderColor: tokens.rule }} />

          {/* Section 2: Timing & Schedule Window */}
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.ink }}>
                2. Live window &amp; duration
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label="Tonight 7 PM"
                  size="small"
                  clickable
                  onClick={handlePresetTonight}
                  disabled={busy}
                  sx={{ borderColor: tokens.rule }}
                />
                <Chip
                  label="Tomorrow 7 PM"
                  size="small"
                  clickable
                  onClick={handlePresetTomorrow}
                  disabled={busy}
                  sx={{ borderColor: tokens.rule }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Window opens (start time)"
                type="datetime-local"
                required
                fullWidth
                value={windowStart}
                onChange={(e) => setWindowStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={busy}
              />

              <TextField
                label="Window closes (end time)"
                type="datetime-local"
                required
                fullWidth
                value={windowEnd}
                onChange={(e) => setWindowEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={busy}
              />
            </Box>

            <TextField
              label="Per-student attempt duration (minutes)"
              type="number"
              fullWidth
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              inputProps={{ min: 5, max: 240 }}
              helperText="The timer each student gets once they click 'Start Quiz'."
              disabled={busy}
            />
          </Box>

          <Divider sx={{ borderColor: tokens.rule }} />

          {/* Section 3: Questions Generation */}
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Sparkles size={16} color={tokens.ink} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.ink }}>
                3. Balanced question draw
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: '10px',
                bgcolor: tokens.sheet,
                border: `1px solid ${tokens.rule}`,
                display: 'grid',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Number of questions:
                </Typography>
                <Chip
                  label={`${questionCount} questions`}
                  size="small"
                  sx={{ fontWeight: 700, bgcolor: tokens.inkTint, color: tokens.ink }}
                />
              </Box>

              <Slider
                value={questionCount}
                min={10}
                max={60}
                step={5}
                marks={[
                  { value: 15, label: '15' },
                  { value: 25, label: '25' },
                  { value: 40, label: '40' },
                  { value: 50, label: '50' },
                ]}
                onChange={(_, v) => setQuestionCount(v)}
                disabled={busy}
                sx={{ color: tokens.ink }}
              />

              <Typography variant="caption" color="text.secondary">
                Questions will be automatically selected from the question bank for this subject, drawing an evenly balanced difficulty mix (30% easy, 50% medium, 20% hard).
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: tokens.rule }} />

          {/* Section 4: Settings & Test Code */}
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.ink }}>
              4. Settings &amp; access code
            </Typography>

            <TextField
              label="Custom test code (optional)"
              fullWidth
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              placeholder="e.g. LQCHEM26 (leave blank to auto-generate)"
              helperText="Students can enter this code in the app to join instantly."
              disabled={busy}
            />

            <FormControl fullWidth size="small">
              <InputLabel id="leaderboard-vis-label">Leaderboard visibility</InputLabel>
              <Select
                labelId="leaderboard-vis-label"
                value={leaderboardVisibility}
                label="Leaderboard visibility"
                onChange={(e) => setLeaderboardVisibility(e.target.value)}
                disabled={busy}
              >
                <MenuItem value="during_and_after">Show ranks during and after quiz</MenuItem>
                <MenuItem value="after_only">Show leaderboard only after window closes</MenuItem>
                <MenuItem value="hidden">Hide leaderboard from students</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={allowFeedback}
                  onChange={(e) => setAllowFeedback(e.target.checked)}
                  disabled={busy}
                />
              }
              label="Allow immediate feedback after answering each question"
            />
          </Box>
        </Box>

        {/* Drawer Actions */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: tokens.sheet,
            borderTop: `1px solid ${tokens.rule}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
          }}
        >
          <Button variant="outlined" onClick={onClose} disabled={busy} sx={{ minHeight: 42, color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={busy || !title.trim() || !selectedSubjectId}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <Radio size={16} />}
            sx={{
              minHeight: 42,
              px: 3,
              bgcolor: tokens.ink,
              fontWeight: 600,
              '&:hover': { bgcolor: tokens.inkDark },
            }}
          >
            {busy ? 'Scheduling...' : 'Schedule live quiz'}
          </Button>
        </Box>
      </form>
    </Drawer>
  );
}
