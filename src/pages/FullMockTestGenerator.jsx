import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, CardHeader, Typography, TextField, Grid, Alert, Paper, Stack,
  ToggleButton, ToggleButtonGroup, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemText, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';

import boardConfig from './config/boardConfig.json';

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

const QUESTION_TYPE_ORDER = [
  'MCQ', 'VeryShortSubjective', 'ShortSubjective', 'LongSubjective', 'CompetencyBased'
];

export default function FullMockTestGenerator() {
  const [board, setBoard] = useState('CBSE');
  const [studentClass, setStudentClass] = useState('12');
  const [stream, setStream] = useState('Science');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chapterDistribution, setChapterDistribution] = useState({});
  const [isPremium, setIsPremium] = useState(false);

  // NEW: Dynamic Configuration States
  const [mockTestTitle, setMockTestTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationInMinutes, setDurationInMinutes] = useState(180);
  const [passingPercentage, setPassingPercentage] = useState(33);
  const [status, setStatus] = useState('active');
  const [isBilingual, setIsBilingual] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [draftQuestions, setDraftQuestions] = useState([]);
  const [draftTotalMarks, setDraftTotalMarks] = useState(0);
  const [usedQuestionIds, setUsedQuestionIds] = useState(new Set());

  useEffect(() => { fetchUsedQuestions(); }, []);

  useEffect(() => {
    fetchSubjects();
    setSelectedSubject(null);
    setChapters([]);
    setChapterDistribution({});
  }, [stream, board, studentClass]);

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters(selectedSubject._id);
      // Auto-generate a default description based on selection
      setDescription(`${board} Class ${studentClass} - ${selectedSubject.name} Mock Test`);
    }
  }, [selectedSubject, isPremium]);

  const fetchUsedQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/tests/used-questions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsedQuestionIds(new Set(response.data.usedQuestionIds || []));
    } catch (err) {
      console.error("Failed to load used questions", err);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/utility/subject/class/${studentClass}/stream/${stream}?board=${board}`;
      const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
      setSubjects(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async (subjectId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/utility/chapters/subject/${subjectId}?board=${board}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setChapters(response.data);
      initializeDistribution(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const initializeDistribution = (chapterList) => {
    const initialDistribution = {};
    chapterList.forEach(chapter => {
      initialDistribution[chapter._id] = {
        name: chapter.name, available: chapter.questionCount || 0,
        MCQ: 0, VeryShortSubjective: 0, ShortSubjective: 0, LongSubjective: 0, CompetencyBased: 0
      };
    });
    setChapterDistribution(initialDistribution);
  };

  const currentBoardWeightage = boardConfig[board]?.[studentClass] || {};
  const officialData = selectedSubject ? currentBoardWeightage[selectedSubject.name] : null;

  const updateChapterQuestions = (chapterId, type, value) => {
    setChapterDistribution(prev => ({
      ...prev, [chapterId]: { ...prev[chapterId], [type]: parseInt(value) || 0 }
    }));
  };

  const autoDistributeQuestions = () => {
    if (!officialData) return;
    const newDistribution = { ...chapterDistribution };
    const numChapters = chapters.length;
    if (numChapters === 0) return;

    officialData.sectionStructure.forEach(section => {
      if (!isPremium && section.type !== 'MCQ') return;
      const totalCount = section.count;
      const basePerChapter = Math.floor(totalCount / numChapters);
      const remainder = totalCount % numChapters;

      chapters.forEach((chapter, index) => {
        newDistribution[chapter._id][section.type] += basePerChapter + (index < remainder ? 1 : 0);
      });
    });
    setChapterDistribution(newDistribution);
  };

  const getQuestionMarkValue = (type) => {
    if (!officialData) return 1;
    const section = officialData.sectionStructure.find(s => s.type === type);
    return section ? section.marksEach : 1;
  };


  const generateDraft = async () => {
    if (!mockTestTitle.trim()) {
      alert('Please enter a mock test title');
      return;
    }

    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const selectedQuestions = [];
      let calculatedMarks = 0;
      let skippedDueToReuse = 0;

      for (const [chapterId, distribution] of Object.entries(chapterDistribution)) {
        const totalRequested = distribution.MCQ + distribution.VeryShortSubjective +
          distribution.ShortSubjective + distribution.LongSubjective + distribution.CompetencyBased;

        if (totalRequested === 0) continue;

        const response = await axios.get(`${API_BASE_URL}/utility/question`, {
          params: { chapterId, subjectId: selectedSubject._id, board }, headers
        });

        const chapterQuestions = response.data;
        const typesToFetch = isPremium
          ? ['MCQ', 'VeryShortSubjective', 'ShortSubjective', 'LongSubjective', 'CompetencyBased']
          : ['MCQ'];

        typesToFetch.forEach(type => {
          if (distribution[type] > 0) {
            const availableOfType = chapterQuestions.filter(q => q.questionType === type && !usedQuestionIds.has(q._id));
            const totalOfType = chapterQuestions.filter(q => q.questionType === type).length;
            skippedDueToReuse += (totalOfType - availableOfType.length);

            const selected = getRandomQuestions(availableOfType, distribution[type]);
            selectedQuestions.push(...selected);
            calculatedMarks += (selected.length * getQuestionMarkValue(type));
          }
        });
      }

      if (selectedQuestions.length === 0) throw new Error("No unused questions available.");

      selectedQuestions.sort((a, b) => QUESTION_TYPE_ORDER.indexOf(a.questionType) - QUESTION_TYPE_ORDER.indexOf(b.questionType));

      setDraftQuestions(selectedQuestions);
      setDraftTotalMarks(calculatedMarks);
      setReviewModalOpen(true);
      if (skippedDueToReuse > 0) setSuccess(`Note: Skipped ${skippedDueToReuse} previously used questions.`);
    } catch (err) {
      setError(`Failed to gather questions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const submitMockTest = async () => {
    setLoading(true); setReviewModalOpen(false);
    try {
      const token = localStorage.getItem('token');
      const finalQuestionIds = draftQuestions.map(q => q._id);

      const mockTestData = {
        board,
        title: mockTestTitle,
        description,
        isBilingual,
        studentClass: parseInt(studentClass),
        subjects: [selectedSubject._id],
        questions: finalQuestionIds,
        durationInMinutes,
        stream,
        totalMarks: draftTotalMarks,
        passingMarks: Math.ceil(draftTotalMarks * (passingPercentage / 100)),
        status,
        isPremium,
        testType: isPremium ? 'Mixed' : 'MCQ'
      };

      await axios.post(`${API_BASE_URL}/tests`, mockTestData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUsedQuestionIds(prev => new Set([...prev, ...finalQuestionIds]));
      setSuccess(`Mock test created successfully!`);
      setMockTestTitle('');
      initializeDistribution(chapters);
      setDraftQuestions([]);
    } catch (err) {
      setError(`Failed to create mock test: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getRandomQuestions = (questions, count) => {
    return [...questions].sort(() => 0.5 - Math.random()).slice(0, Math.min(count, questions.length));
  };

  const resetTracker = async () => {
    if (!window.confirm("Reset tracker? Used questions will reappear.")) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/tests/used-questions`, { headers: { 'Authorization': `Bearer ${token}` } });
      setUsedQuestionIds(new Set());
      setSuccess("Tracker reset successfully.");
    } catch (err) {
      setError("Failed to reset tracking data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 3 }, bgcolor: '#F8F9FB', minHeight: '100vh' }}>
      <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
        <Typography variant="h4" fontWeight="700" gutterBottom>Master Mock Test Generator</Typography>
        {usedQuestionIds.size > 0 && (
          <Button variant="outlined" color="warning" size="small" onClick={resetTracker} sx={{ position: 'absolute', top: 0, right: 0 }}>
            Reset Tracker ({usedQuestionIds.size} Used)
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardHeader title="Step 1: Core Configuration" titleTypographyProps={{ variant: 'h6', fontWeight: 700 }} />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Select Board</Typography>
              <ToggleButtonGroup value={board} exclusive onChange={(e, val) => val && setBoard(val)} fullWidth>
                <ToggleButton value="BSEB">BSEB</ToggleButton>
                <ToggleButton value="CBSE">CBSE</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Select Class</Typography>
              <ToggleButtonGroup value={studentClass} exclusive onChange={(e, val) => val && setStudentClass(val)} fullWidth>
                <ToggleButton value="10">Class 10</ToggleButton>
                <ToggleButton value="12">Class 12</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Select Stream</Typography>
              <ToggleButtonGroup value={stream} exclusive onChange={(e, val) => val && setStream(val)} fullWidth>
                <ToggleButton value="Science">Science</ToggleButton>
                <ToggleButton value="Commerce">Commerce</ToggleButton>
                <ToggleButton value="Arts">Arts</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="700">Step 2: Select Subject & Tier</Typography>
              <FormControlLabel
                control={<Switch checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} color="primary" />}
                label={<Typography fontWeight="600" color={isPremium ? 'primary' : 'text.secondary'}>Premium Tier</Typography>}
              />
            </Box>
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            {subjects.map(subject => (
              <Grid item xs={12} sm={6} md={4} key={subject._id}>
                <Paper
                  variant="outlined" onClick={() => setSelectedSubject(subject)}
                  sx={{ p: 2, textAlign: 'center', cursor: 'pointer', borderRadius: 2, bgcolor: selectedSubject?._id === subject._id ? 'primary.main' : 'background.paper', color: selectedSubject?._id === subject._id ? 'primary.contrastText' : 'text.primary' }}
                >
                  <Typography variant="subtitle1" fontWeight="600">{subject.name}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {selectedSubject && (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardHeader title="Step 3: Test Details & Rules" titleTypographyProps={{ variant: 'h6', fontWeight: 700 }} />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Mock Test Title" value={mockTestTitle} onChange={(e) => setMockTestTitle(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="number" label="Duration (Minutes)" value={durationInMinutes} onChange={(e) => setDurationInMinutes(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth type="number" label="Passing %" value={passingPercentage} onChange={(e) => setPassingPercentage(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel control={<Switch checked={isBilingual} onChange={(e) => setIsBilingual(e.target.checked)} />} label="Bilingual Test" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {selectedSubject && chapters.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="700">Step 4: Question Distribution</Typography>
                {officialData && <Button variant="outlined" size="small" onClick={autoDistributeQuestions}>Auto Distribute</Button>}
              </Box>
            }
          />
          <CardContent>
            <Stack spacing={2}>
              {chapters.map((chapter, index) => {
                const dist = chapterDistribution[chapter._id] || {};
                return (
                  <Paper key={chapter._id} variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>{index + 1}. {chapter.name}</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={isPremium ? 2.4 : 4}>
                        <TextField label="MCQ" type="number" size="small" fullWidth value={dist.MCQ || 0} onChange={(e) => updateChapterQuestions(chapter._id, 'MCQ', e.target.value)} />
                      </Grid>
                      {isPremium && (
                        <>
                          <Grid item xs={12} sm={2.4}>
                            <TextField label="VSA" type="number" size="small" fullWidth value={dist.VeryShortSubjective || 0} onChange={(e) => updateChapterQuestions(chapter._id, 'VeryShortSubjective', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} sm={2.4}>
                            <TextField label="SA" type="number" size="small" fullWidth value={dist.ShortSubjective || 0} onChange={(e) => updateChapterQuestions(chapter._id, 'ShortSubjective', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} sm={2.4}>
                            <TextField label="LA" type="number" size="small" fullWidth value={dist.LongSubjective || 0} onChange={(e) => updateChapterQuestions(chapter._id, 'LongSubjective', e.target.value)} />
                          </Grid>
                          <Grid item xs={12} sm={2.4}>
                            <TextField label="CS" type="number" size="small" fullWidth value={dist.CompetencyBased || 0} onChange={(e) => updateChapterQuestions(chapter._id, 'CompetencyBased', e.target.value)} />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      )}

      {selectedSubject && chapters.length > 0 && (
        <Button variant="contained" color="primary" size="large" fullWidth onClick={generateDraft} disabled={loading} sx={{ mb: 3, py: 2, fontSize: '1.125rem', fontWeight: 700 }}>
          {loading ? 'Preparing Draft...' : 'Review Questions'}
        </Button>
      )}

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Dialog open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ fontWeight: 700 }}>Review Selected Questions ({draftQuestions.length} Total | {draftTotalMarks} Marks)</DialogTitle>
        <DialogContent dividers>
          <List>
            {draftQuestions.map((q, i) => (
              <ListItem key={q._id || i} divider>
                <ListItemText primary={`Q${i + 1}. ${q.questionText?.en || 'Text unavailable'}`} secondary={`Type: ${q.questionType} | Marks: ${q.marks || getQuestionMarkValue(q.questionType)} | Difficulty: ${q.difficulty}`} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReviewModalOpen(false)} color="inherit">Back to Edit</Button>
          <Button onClick={submitMockTest} variant="contained" color="success" disabled={draftQuestions.length === 0}>Confirm & Create Test</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}