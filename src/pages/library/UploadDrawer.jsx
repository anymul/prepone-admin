import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Drawer, FormControlLabel, IconButton, LinearProgress, MenuItem, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { FileUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { sendJson } from '@/lib/useResource';
import { formatBytes, uploadWithProgress } from '@/lib/upload';
import { tokens } from '@/theme';

// Size limits enforced by the API (multer) for each kind of file.
const LIMIT_MB = { paper: 10, note: 30 };
export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'hinglish', label: 'Hinglish' },
  { value: 'bilingual', label: 'English and Hindi' },
];
export const normalizeLanguage = (l) => {
  const v = String(l || '').toLowerCase();
  if (v === 'english' || v === 'en') return 'en';
  if (v === 'hindi' || v === 'hi') return 'hi';
  return v === 'hinglish' ? 'hinglish' : 'bilingual';
};

const blank = (kind, defaults) => (kind === 'paper'
  ? { title: '', year: new Date().getFullYear(), subjectId: defaults.subjectId || '' }
  : { title: '', description: '', subjectId: defaults.subjectId || '', chapterId: '', language: 'en', visibility: 'board', stream: '', tags: '', isPublished: true, isPremium: false });

function fromItem(kind, item) {
  if (kind === 'paper') {
    return { title: item.title || item.examName || '', year: item.year || new Date().getFullYear(), subjectId: item.subject?._id || item.subject || '' };
  }
  return {
    title: item.title || '', description: item.description || '', subjectId: item.subjectId?._id || item.subjectId || '', chapterId: item.chapterId?._id || item.chapterId || '',
    language: normalizeLanguage(item.language), visibility: item.board === 'both' ? 'both' : 'board', stream: item.stream || '',
    tags: Array.isArray(item.tags) ? item.tags.join(', ') : '', isPublished: item.isPublished !== false, isPremium: item.isPremium === true,
  };
}

export default function UploadDrawer({ open, kind, mode, item, syllabus, board, classId, defaultSubjectId, onClose, onSaved }) {
  const editing = mode === 'edit';
  const limit = LIMIT_MB[kind];
  const [form, setForm] = useState(() => blank(kind, {}));
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromItem(kind, item) : blank(kind, { subjectId: defaultSubjectId }));
    setFile(null); setFileError(''); setProgress(null); setError(''); setBusy(false);
  }, [open, kind, editing, item, defaultSubjectId]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const subject = syllabus.find((s) => s._id === form.subjectId);
  const chapters = subject?.chapters || [];

  const pickFile = async (candidate) => {
    if (!candidate) return;
    setFileError('');
    if (candidate.type !== 'application/pdf' && !/\.pdf$/i.test(candidate.name)) return setFileError('Choose a PDF file.');
    if (candidate.size > limit * 1024 * 1024) return setFileError(`This file is ${formatBytes(candidate.size)}. The limit is ${limit} MB.`);
    const head = await candidate.slice(0, 5).text();
    if (head !== '%PDF-') return setFileError("This file isn't a valid PDF.");
    setFile(candidate);
    if (!form.title.trim()) set({ title: candidate.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim() });
  };

  const problems = [];
  if (!form.title.trim()) problems.push('Give it a title.');
  if (!form.subjectId) problems.push('Choose a subject.');
  if (kind === 'note' && !form.chapterId) problems.push('Choose a chapter.');
  if (kind === 'paper' && !(Number(form.year) >= 1990)) problems.push('Enter the exam year.');
  if (!editing && !file) problems.push('Choose a PDF file.');

  const save = async () => {
    if (problems.length) return;
    setBusy(true);
    setError('');
    try {
      if (kind === 'paper') {
        if (editing) {
          await sendJson('PUT', `/pyqs/${item._id}`, { title: form.title.trim(), year: Number(form.year), subject: form.subjectId });
        } else {
          const data = new FormData();
          data.append('pdf', file);
          data.append('subject', form.subjectId);
          data.append('year', String(form.year));
          data.append('title', form.title.trim());
          data.append('studentClass', String(classId));
          data.append('board', board);
          await uploadWithProgress('/pyqs/upload', data, setProgress);
        }
      } else {
        const noteBoard = form.visibility === 'both' ? 'both' : board;
        const common = {
          title: form.title.trim(), description: form.description.trim(), board: noteBoard, studentClass: classId,
          stream: classId === 12 ? form.stream : '', language: normalizeLanguage(form.language), tags: form.tags, isPublished: form.isPublished, isPremium: form.isPremium,
        };
        if (editing) {
          await sendJson('PUT', `/revision-notes/${item._id}`, { ...common, studentClass: item.studentClass ?? classId, board: noteBoard });
        } else {
          const data = new FormData();
          data.append('pdf', file);
          Object.entries({ ...common, subjectId: form.subjectId, chapterId: form.chapterId }).forEach(([k, v]) => data.append(k, String(v)));
          await uploadWithProgress('/revision-notes/upload', data, setProgress);
        }
      }
      toast.success(editing ? 'Saved' : kind === 'paper' ? 'Paper uploaded' : form.isPublished ? 'Note uploaded and published' : 'Note uploaded as a draft');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const noun = kind === 'paper' ? 'paper' : 'note';

  return (
    <Drawer anchor="right" open={open} onClose={busy ? undefined : onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, maxWidth: '100%' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 3, py: 2, borderBottom: `1px solid ${tokens.rule}` }}>
          <Box>
            <Typography variant="h5" component="h2">{editing ? `Edit ${noun}` : kind === 'paper' ? 'Upload a previous year paper' : 'Upload a revision note'}</Typography>
            <Typography variant="body2" color="text.secondary">{`${board} Class ${classId}`}</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" disabled={busy}><X size={18} /></IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'grid', gap: 2.5, alignContent: 'start' }}>
          {!editing && (
            <Box>
              <Box role="button" tabIndex={0} onClick={() => !busy && input.current?.click()} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !busy) input.current?.click(); }}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (!busy) pickFile(e.dataTransfer.files?.[0]); }}
                sx={{ border: `1.5px dashed ${file ? tokens.ink : tokens.rule}`, borderRadius: '8px', p: 3, textAlign: 'center', cursor: busy ? 'default' : 'pointer', bgcolor: file ? tokens.inkTint : '#F8F9FB', '&:hover': { borderColor: tokens.ink } }}>
                <FileUp size={22} color={tokens.muted} />
                <Typography sx={{ fontWeight: 600, mt: 0.5 }}>{file ? file.name : 'Choose a PDF or drop it here'}</Typography>
                <Typography variant="caption" color="text.secondary">{file ? formatBytes(file.size) : `PDF, up to ${limit} MB`}</Typography>
                <input ref={input} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
              </Box>
              {fileError && <Alert severity="error" sx={{ mt: 1 }}>{fileError}</Alert>}
            </Box>
          )}

          <TextField label={kind === 'paper' ? 'Exam name' : 'Title'} value={form.title} onChange={(e) => set({ title: e.target.value })} fullWidth required disabled={busy} />
          {kind === 'note' && <TextField label="Description (optional)" value={form.description} onChange={(e) => set({ description: e.target.value })} fullWidth multiline minRows={2} disabled={busy} />}

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: kind === 'paper' ? '1fr 120px' : '1fr' }}>
            <TextField select label="Subject" value={form.subjectId} onChange={(e) => set({ subjectId: e.target.value, chapterId: '' })} disabled={busy || editing} required
              helperText={editing && kind === 'note' ? "A note's subject and chapter can't be changed. Upload it again to move it." : syllabus.length === 0 ? `No subjects in ${board} Class ${classId} yet.` : undefined}>
              {syllabus.map((s) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
            </TextField>
            {kind === 'paper' && <TextField label="Year" type="number" value={form.year} onChange={(e) => set({ year: e.target.value })} inputProps={{ min: 1990, max: new Date().getFullYear() + 1 }} disabled={busy} required />}
          </Box>

          {kind === 'note' && (
            <>
              <TextField select label="Chapter" value={form.chapterId} onChange={(e) => set({ chapterId: e.target.value })} disabled={busy || editing || !form.subjectId} required>
                {chapters.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
              </TextField>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: classId === 12 ? '1fr 1fr' : '1fr' }}>
                <TextField select label="Language" value={form.language} onChange={(e) => set({ language: e.target.value })} disabled={busy}>
                  {LANGUAGES.map((l) => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
                </TextField>
                {classId === 12 && <TextField label="Stream" value={form.stream} onChange={(e) => set({ stream: e.target.value })} disabled={busy} placeholder="Science, Commerce or Arts" />}
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.75 }}>Who can see it</Typography>
                <ToggleButtonGroup exclusive size="small" value={form.visibility} onChange={(_, v) => v && set({ visibility: v })} aria-label="Visibility" disabled={busy}>
                  <ToggleButton value="board" sx={{ px: 1.5 }}>{`${board} students only`}</ToggleButton>
                  <ToggleButton value="both" sx={{ px: 1.5 }}>Both boards</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <TextField label="Tags (comma separated, optional)" value={form.tags} onChange={(e) => set({ tags: e.target.value })} fullWidth disabled={busy} />
              <Box sx={{ display: 'grid' }}>
                <FormControlLabel control={<Switch checked={form.isPublished} onChange={(e) => set({ isPublished: e.target.checked })} disabled={busy} />} label={form.isPublished ? 'Published, students can open it' : 'Draft, hidden from students'} />
                <FormControlLabel control={<Switch checked={form.isPremium} onChange={(e) => set({ isPremium: e.target.checked })} disabled={busy} />} label="Premium students only" />
              </Box>
            </>
          )}

          {busy && progress !== null && <Box><LinearProgress variant="determinate" value={progress} /><Typography variant="caption" color="text.secondary">{progress < 100 ? `Uploading ${progress}%` : 'Processing the file…'}</Typography></Box>}
          {error && <Alert severity="error" role="alert">{error}</Alert>}
        </Box>

        <Box sx={{ borderTop: `1px solid ${tokens.rule}`, p: 2, display: 'grid', gap: 1.25 }}>
          {problems.length > 0 && <Alert severity="info" sx={{ py: 0 }}>{problems.join(' ')}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={onClose} disabled={busy}>Cancel</Button>
            <Button variant="contained" onClick={save} disabled={busy || problems.length > 0}>{editing ? 'Save changes' : 'Upload'}</Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
