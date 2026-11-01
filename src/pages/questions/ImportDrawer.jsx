import { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Alert, Box, Button, Drawer, IconButton, LinearProgress, MenuItem, TextField, Typography } from '@mui/material';
import { CheckCircle2, Download, FileUp, X, XCircle } from 'lucide-react';
import { sendJson } from '@/lib/useResource';
import { LANGUAGE_MODES, parseQuestionRows, templateRows } from '@/lib/questionCsv';
import { tokens } from '@/theme';

const CHUNK = 50;
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Single-language files can only go into subjects that accept that language.
const subjectAccepts = (requirement, mode) => (mode === 'both' ? true : requirement === 'either' || requirement === mode);

export default function ImportDrawer({ open, onClose, syllabus, subject, chapter, board, classId, onImported }) {
  const [mode, setMode] = useState('both');
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [progress, setProgress] = useState(null); // null before importing, then one entry per group
  const [running, setRunning] = useState(false);
  const input = useRef(null);

  useEffect(() => {
    if (open) { setMode('both'); setRows(null); setFileName(''); setFileError(''); setProgress(null); setRunning(false); }
  }, [open]);

  const target = subject && chapter ? { subjectId: subject._id, chapterId: chapter._id } : null;
  const parsed = useMemo(() => (rows ? parseQuestionRows(rows, { mode, target }) : null), [rows, mode, target]);

  // What each group will do: which subject/chapter it lands in and whether they already exist.
  const plan = useMemo(() => {
    if (!parsed) return [];
    return parsed.groups.map((g) => {
      if (g.usesTarget) return { ...g, label: `${subject.name} / ${chapter.name}`, subjectName: subject.name, existingSubject: subject, existingChapter: chapter, requirement: subject.languageRequirement || 'both' };
      const s = syllabus.find((x) => same(x.name, g.subject));
      const c = s?.chapters.find((x) => same(x.name, g.chapter));
      return { ...g, label: `${s?.name || g.subject} / ${c?.name || g.chapter}`, subjectName: g.subject, existingSubject: s || null, existingChapter: c || null, requirement: s?.languageRequirement || LANGUAGE_MODES[mode].requirement };
    });
  }, [parsed, syllabus, subject, chapter, mode]);

  const pickFile = (file) => {
    if (!file) return;
    setFileError('');
    if (!/\.csv$/i.test(file.name)) { setFileError('Choose a .csv file.'); return; }
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (result) => {
        setFileName(file.name);
        setRows(result.data);
        setProgress(null);
        if (result.errors.length) setFileError(`The file has formatting problems: ${result.errors[0].message}`);
      },
      error: (err) => setFileError(`Couldn't read the file: ${err.message}`),
    });
  };

  const downloadTemplate = () => {
    const csv = Papa.unparse(templateRows(mode));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `questions_template_${mode}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const runImport = async () => {
    setRunning(true);
    const steps = plan.map((g) => ({ label: g.label, total: g.questions.length, done: 0, status: 'waiting', note: '' }));
    setProgress(steps);
    const update = (i, patch) => setProgress((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
    const chapterCache = new Map(); // subjectId -> chapters, so chapters created earlier in this run are reused

    for (let i = 0; i < plan.length; i += 1) {
      const g = plan[i];
      update(i, { status: 'working' });
      try {
        let s = g.existingSubject;
        if (!s) {
          s = await sendJson('POST', '/utility/subject', { name: g.subject, studentClass: classId, board, languageRequirement: LANGUAGE_MODES[mode].requirement });
          update(i, { note: 'Created the subject.' });
        }
        let c = g.existingChapter;
        if (!c) {
          const known = chapterCache.get(s._id) || (syllabus.find((x) => x._id === s._id)?.chapters ?? []);
          c = known.find((x) => same(x.name, g.chapter));
          if (!c) {
            const order = known.reduce((m, x) => Math.max(m, x.order || 0), 0) + 1;
            c = await sendJson('POST', `/utility/subject/${s._id}/chapters`, { name: g.chapter, studentClass: classId, order });
            chapterCache.set(s._id, [...known, c]);
          }
        }
        for (let k = 0; k < g.questions.length; k += CHUNK) {
          const chunk = g.questions.slice(k, k + CHUNK).map((q) => ({ ...q, board }));
          await sendJson('POST', '/utility/question/bulkpost', { subjectId: s._id, chapterId: c._id, questions: chunk });
          update(i, { done: Math.min(k + CHUNK, g.questions.length) });
        }
        update(i, { status: 'done', done: g.questions.length });
      } catch (err) {
        update(i, { status: 'error', note: err.message });
      }
    }
    setRunning(false);
    onImported();
  };

  const finished = progress && !running;
  const importedCount = progress ? progress.filter((s) => s.status === 'done').reduce((n, s) => n + s.total, 0) : 0;
  const failedCount = progress ? progress.filter((s) => s.status === 'error').length : 0;
  const noTargetWarning = !target && parsed?.errors.some((e) => /no subject and chapter/.test(e));

  return (
    <Drawer anchor="right" open={open} onClose={running ? undefined : onClose} PaperProps={{ sx: { width: { xs: '100%', md: 760 }, maxWidth: '100%' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 3, py: 2, borderBottom: `1px solid ${tokens.rule}` }}>
          <Box>
            <Typography variant="h5" component="h2">Import questions from a CSV file</Typography>
            <Typography variant="body2" color="text.secondary">{`Into ${board} Class ${classId}. Subjects and chapters named in the file are created if they don't exist.`}</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" disabled={running}><X size={18} /></IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'grid', gap: 2.5, alignContent: 'start' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField select size="small" label="Language in the file" value={mode} onChange={(e) => setMode(e.target.value)} disabled={running || Boolean(finished)} sx={{ minWidth: 220 }}>
              {Object.entries(LANGUAGE_MODES).map(([value, m]) => <MenuItem key={value} value={value}>{m.label}</MenuItem>)}
            </TextField>
            <Button size="small" variant="outlined" startIcon={<Download size={14} />} onClick={downloadTemplate}>Download template</Button>
          </Box>

          <Typography variant="body2" color="text.secondary">
            {target
              ? `Rows with no subject and chapter columns go to ${subject.name} / ${chapter.name}.`
              : 'Pick a chapter in the question list first, or give every row a subject and a chapter column.'}
          </Typography>

          {!finished && !progress && (
            <Box
              role="button" tabIndex={0} onClick={() => input.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') input.current?.click(); }}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
              sx={{ border: `1.5px dashed ${tokens.rule}`, borderRadius: '8px', p: 3, textAlign: 'center', cursor: 'pointer', bgcolor: '#F8F9FB', '&:hover': { borderColor: tokens.ink, bgcolor: tokens.inkTint } }}
            >
              <FileUp size={22} color={tokens.muted} />
              <Typography sx={{ fontWeight: 600, mt: 0.5 }}>{fileName || 'Choose a CSV file or drop it here'}</Typography>
              <Typography variant="caption" color="text.secondary">The first row is the header. Use the template to see the columns.</Typography>
              <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
            </Box>
          )}
          {fileError && <Alert severity="error">{fileError}</Alert>}

          {parsed && !progress && (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Typography sx={{ fontWeight: 600 }}>
                {parsed.total === 0 ? 'No valid questions found.' : `${fmt(parsed.total)} valid question${parsed.total === 1 ? '' : 's'} in ${plan.length} chapter${plan.length === 1 ? '' : 's'}`}
                {parsed.errors.length > 0 && <Box component="span" sx={{ color: tokens.red }}>{`, ${fmt(parsed.errors.length)} row${parsed.errors.length === 1 ? '' : 's'} with problems`}</Box>}
              </Typography>

              {plan.length > 0 && (
                <Box sx={{ border: `1px solid ${tokens.rule}`, borderRadius: '6px', overflow: 'hidden' }}>
                  {plan.map((g, i) => {
                    const status = !g.existingSubject ? 'New subject and chapter' : !g.existingChapter ? 'New chapter' : 'Existing chapter';
                    const langWarn = g.existingSubject && !subjectAccepts(g.requirement, mode);
                    return (
                      <Box key={i} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 2, px: 1.5, py: 1, borderBottom: i < plan.length - 1 ? `1px solid ${tokens.rule}` : 0, alignItems: 'center' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography noWrap sx={{ fontSize: 14, fontWeight: 500 }}>{g.label}</Typography>
                          <Typography variant="caption" sx={{ color: langWarn ? tokens.red : 'text.secondary' }}>
                            {langWarn ? 'This subject needs English and Hindi, but the file has one language. These rows will be rejected.' : status}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{`${fmt(g.questions.length)} questions`}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {parsed.errors.length > 0 && (
                <Alert severity={noTargetWarning ? 'error' : 'warning'}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>These rows will be skipped:</Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2.25, maxHeight: 180, overflowY: 'auto', fontSize: 13 }}>
                    {parsed.errors.slice(0, 50).map((e, i) => <li key={i}>{e}</li>)}
                    {parsed.errors.length > 50 && <li>{`and ${parsed.errors.length - 50} more`}</li>}
                  </Box>
                </Alert>
              )}
            </Box>
          )}

          {progress && (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {finished && (
                <Alert severity={failedCount ? 'warning' : 'success'}>
                  {failedCount
                    ? `Imported ${fmt(importedCount)} questions. ${failedCount} chapter${failedCount === 1 ? '' : 's'} failed; fix the file and import those again.`
                    : `Imported ${fmt(importedCount)} questions.`}
                </Alert>
              )}
              {progress.map((s, i) => (
                <Box key={i} sx={{ border: `1px solid ${tokens.rule}`, borderRadius: '6px', p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {s.status === 'done' && <CheckCircle2 size={16} color={tokens.green} />}
                    {s.status === 'error' && <XCircle size={16} color={tokens.red} />}
                    <Typography sx={{ fontSize: 14, fontWeight: 600, flexGrow: 1 }} noWrap>{s.label}</Typography>
                    <Typography variant="body2" color="text.secondary">{`${fmt(s.done)} of ${fmt(s.total)}`}</Typography>
                  </Box>
                  {(s.status === 'working' || s.status === 'waiting') && <LinearProgress variant={s.status === 'working' ? 'determinate' : 'determinate'} value={s.total ? (s.done / s.total) * 100 : 0} sx={{ mt: 1 }} />}
                  {s.note && <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: s.status === 'error' ? tokens.red : 'text.secondary' }}>{s.note}</Typography>}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ borderTop: `1px solid ${tokens.rule}`, p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose} disabled={running}>{finished ? 'Close' : 'Cancel'}</Button>
          {!progress && (
            <Button variant="contained" onClick={runImport} disabled={!parsed || parsed.total === 0}>
              {parsed && parsed.errors.length > 0 && parsed.total > 0 ? `Import ${fmt(parsed.total)} valid questions` : parsed?.total ? `Import ${fmt(parsed.total)} questions` : 'Import'}
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
