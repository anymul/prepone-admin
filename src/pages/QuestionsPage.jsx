import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LatexRenderer from '@/components/LatexRenderer';

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  IconButton,
  Skeleton,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ArrowBack,
  FilterList,
  Upload,
  Download,
  Search,
  Visibility
} from '@mui/icons-material';
import Papa from 'papaparse';

const optionMap = { A: 0, B: 1, C: 2, D: 3 };
const indexMap = ['A', 'B', 'C', 'D'];

const initialFormState = {
  questionText: { en: '', hi: '' },
  options: [
    { en: '', hi: '' },
    { en: '', hi: '' },
    { en: '', hi: '' },
    { en: '', hi: '' },
  ],
  correctOptionIndex: -1,
  difficulty: 'medium',
  marks: '1',
  explanation: { en: '', hi: '' },
};

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export default function QuestionsPage() {
  const { classId, subjectId: paramSubjectId, chapterId: paramChapterId } = useParams();
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(paramSubjectId || '');
  const [selectedChapter, setSelectedChapter] = useState(paramChapterId || '');
  const [loading, setLoading] = useState({ subjects: true, chapters: false, questions: false });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [explanationTab, setExplanationTab] = useState(0);

  // CSV Import States
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(prev => ({ ...prev, subjects: true }));
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/utility/subject/class/${classId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        setSubjects(Array.isArray(data) ? data : []);
        if (!paramSubjectId && data.length > 0) {
          setSelectedSubject(data[0]._id);
        } else {
          setSelectedSubject(paramSubjectId || '');
        }
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
        setSubjects([]);
      } finally {
        setLoading(prev => ({ ...prev, subjects: false }));
      }
    };
    fetchSubjects();
  }, [classId, paramSubjectId, API_BASE_URL]);

  // Fetch chapters
  useEffect(() => {
    if (!selectedSubject) {
      setChapters([]);
      setSelectedChapter('');
      return;
    }
    const fetchChapters = async () => {
      setLoading(prev => ({ ...prev, chapters: true }));
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/utility/subject/${selectedSubject}/chapters`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        setChapters(Array.isArray(data) ? data : []);
        if (paramChapterId && data.some(c => c._id === paramChapterId)) {
          setSelectedChapter(paramChapterId);
        } else if (data.length > 0) {
          setSelectedChapter(data[0]._id);
        } else {
          setSelectedChapter('');
        }
      } catch (error) {
        console.error("Failed to fetch chapters:", error);
        setChapters([]);
      } finally {
        setLoading(prev => ({ ...prev, chapters: false }));
      }
    };
    fetchChapters();
  }, [selectedSubject, paramChapterId, API_BASE_URL]);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    if (!selectedSubject) return;
    setLoading(prev => ({ ...prev, questions: true }));
    let url = `${API_BASE_URL}/utility/question?subjectId=${selectedSubject}`;
    if (selectedChapter) {
      url += `&chapterId=${selectedChapter}`;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      setQuestions([]);
    } finally {
      setLoading(prev => ({ ...prev, questions: false }));
    }
  }, [selectedSubject, selectedChapter, API_BASE_URL]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);
  // Form submit handler
  const handleFormSubmit = async () => {
    if (!formState.questionText.en.trim() || !formState.options[0].en.trim() || !formState.options[1].en.trim() || formState.correctOptionIndex === -1) {
      alert("Please fill all required fields: Question (EN), Option A (EN), Option B (EN), and select a correct answer.");
      return;
    }

    const body = {
      ...formState,
      marks: parseInt(formState.marks),
      options: formState.options.filter(opt => opt.en.trim() !== '' || opt.hi.trim() !== ''),
    };

    try {
      const token = localStorage.getItem('token');
      if (editingQuestionId) {
        await fetch(`${API_BASE_URL}/utility/question/${editingQuestionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body),
        });
      } else {
        const url = `${API_BASE_URL}/utility/subject/${selectedSubject}/chapters/${selectedChapter}/questions`;
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body),
        });
      }
      setIsFormOpen(false);
      await fetchQuestions();
    } catch (error) {
      console.error("Failed to save question:", error);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/utility/question/${selectedQuestion._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setIsDeleteOpen(false);
      setSelectedQuestion(null);
      await fetchQuestions();
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  };

  // CSV File Handler
  const handleCsvFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please select a valid CSV file');
      return;
    }

    setCsvFile(file);
    setCsvErrors([]);
    setCsvPreview([]);

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const { data, errors: parseErrors } = results;

        if (parseErrors.length > 0) {
          setCsvErrors(parseErrors.map(e => `Row ${e.row}: ${e.message}`));
        }

        const parsedQuestions = [];
        const validationErrors = [];

        data.slice(1).forEach((row, index) => {
          const rowNum = index + 2;

          if (!row || row.every(cell => !cell || cell.trim() === '')) {
            return;
          }

          if (!row[5] || !row[6] || !row[7] || !row[10]) {
            validationErrors.push(`Row ${rowNum}: Missing required fields (question_en, optA_en, optB_en, correct_option)`);
            return;
          }

          const correctIndex = optionMap[row[10]?.trim().toUpperCase()];
          if (correctIndex === undefined) {
            validationErrors.push(`Row ${rowNum}: Invalid correct_option '${row[10]}'. Must be A, B, C, or D`);
            return;
          }

          const question = {
            questionText: {
              en: row[5]?.trim() || '',
              hi: row[0]?.trim() || ''
            },
            options: [
              { en: row[6]?.trim() || '', hi: row[1]?.trim() || '' },
              { en: row[7]?.trim() || '', hi: row[2]?.trim() || '' },
              { en: row[8]?.trim() || '', hi: row[3]?.trim() || '' },
              { en: row[9]?.trim() || '', hi: row[4]?.trim() || '' },
            ].filter(opt => opt.en || opt.hi),
            correctOptionIndex: correctIndex,
            difficulty: row[11]?.trim().toLowerCase() || 'medium',
            marks: parseInt(row[12]) || 1,
            explanation: {
              en: row[13]?.trim() || '',
              hi: row[14]?.trim() || ''
            }
          };

          if (question.options.length < 2) {
            validationErrors.push(`Row ${rowNum}: Must have at least 2 options`);
            return;
          }

          parsedQuestions.push(question);
        });

        if (validationErrors.length > 0) {
          setCsvErrors(prev => [...prev, ...validationErrors]);
        }

        setCsvPreview(parsedQuestions);
      },
      error: (error) => {
        setCsvErrors([`Parse error: ${error.message}`]);
      }
    });
  };

  const handleCsvImport = async () => {
    if (csvPreview.length === 0) {
      alert('No valid questions to import');
      return;
    }

    if (csvErrors.length > 0) {
      if (!window.confirm(`Found ${csvErrors.length} error(s). Continue with ${csvPreview.length} valid questions?`)) {
        return;
      }
    }

    try {
      setLoading(prev => ({ ...prev, questions: true }));
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/utility/question/bulkpost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectId: selectedSubject,
          chapterId: selectedChapter,
          questions: csvPreview,
        }),
      });
      alert(`${csvPreview.length} questions imported successfully!`);
      setIsCsvImportOpen(false);
      setCsvFile(null);
      setCsvPreview([]);
      setCsvErrors([]);
      fetchQuestions();
    } catch (error) {
      console.error("Failed to import CSV:", error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, questions: false }));
    }
  };

  const handleDownloadTemplate = () => {
    const csvData = [
      [
        'question_hi',
        'optA_hi',
        'optB_hi',
        'optC_hi',
        'optD_hi',
        'question_en',
        'optA_en',
        'optB_en',
        'optC_en',
        'optD_en',
        'correct_option',
        'difficulty',
        'marks',
        'explanation_en',
        'explanation_hi'
      ],
      [
        'भारत की राजधानी क्या है?',
        'मुंबई',
        'नई दिल्ली',
        'कोलकाता',
        'चेन्नई',
        'What is the capital of India?',
        'Mumbai',
        'New Delhi',
        'Kolkata',
        'Chennai',
        'B',
        'easy',
        '1',
        'New Delhi is the official capital of India.',
        'नई दिल्ली भारत की आधिकारिक राजधानी है।'
      ]
    ];

    const csv = Papa.unparse(csvData);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'questions_template.csv';
    link.click();
  };

  const openAddDialog = () => {
    setEditingQuestionId(null);
    setFormState(initialFormState);
    setIsFormOpen(true);
  };

  const openEditDialog = (question) => {
    setEditingQuestionId(question._id);
    const paddedOptions = [...question.options];
    while (paddedOptions.length < 4) {
      paddedOptions.push({ en: '', hi: '' });
    }

    setFormState({
      questionText: question.questionText || { en: '', hi: '' },
      options: paddedOptions,
      correctOptionIndex: question.correctOptionIndex,
      difficulty: question.difficulty,
      marks: question.marks.toString(),
      explanation: question.explanation || { en: '', hi: '' },
    });
    setIsFormOpen(true);
  };

  const openViewDialog = (question) => {
    setSelectedQuestion(question);
    setIsViewOpen(true);
  };

  const openDeleteDialog = (question) => {
    setSelectedQuestion(question);
    setIsDeleteOpen(true);
  };

  const filteredQuestions = questions.filter(q =>
    q.questionText?.en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.questionText?.hi?.includes(searchTerm)
  );

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'hard': return 'error';
      default: return 'warning';
    }
  };
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate(`/subjects/${classId}`)} size="small">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">Question Bank</Typography>
            <Typography variant="body1" color="text.secondary">
              Manage questions for Class {classId}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setIsCsvImportOpen(true)}
            disabled={!selectedChapter}
            sx={{ textTransform: 'none' }}
          >
            Import CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openAddDialog}
            disabled={!selectedChapter}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Add Question
          </Button>
        </Box>
      </Box>

      {/* Filters Card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, 1fr)'
              },
              gap: 2
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Subject"
              >
                {subjects.map(s => (
                  <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" disabled={!selectedSubject || chapters.length === 0}>
              <InputLabel>Chapter</InputLabel>
              <Select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                label="Chapter"
              >
                {chapters.map(c => (
                  <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card variant="outlined">
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight="600">Questions List</Typography>
              <Typography variant="body2" color="text.secondary">
                {loading.questions ? 'Loading questions...' :
                  selectedChapter ? `${filteredQuestions.length} questions found` : 'Select a chapter to view questions'}
              </Typography>
            </Box>
            {!loading.questions && selectedChapter && (
              <Chip label={`${filteredQuestions.length} Total`} size="small" />
            )}
          </Box>

          {loading.questions ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3, 4].map((i) => (
                <Box key={i} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Skeleton width="75%" height={24} />
                  <Skeleton width="50%" height={20} sx={{ mt: 1 }} />
                </Box>
              ))}
            </Box>
          ) : !selectedChapter ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, textAlign: 'center' }}>
              <FilterList sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>No Chapter Selected</Typography>
              <Typography variant="body2" color="text.secondary">
                Please select a subject and chapter to manage questions
              </Typography>
            </Box>
          ) : filteredQuestions.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell width="60%">Question</TableCell>
                    <TableCell>Difficulty</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredQuestions.map((q) => (
                    <TableRow key={q._id} hover>
                      <TableCell>
                        <Box sx={{ mb: 0.5 }}>
                          <Typography variant="body2" fontWeight="600" component="div">
                            {q.questionText?.en ? (
                              <LatexRenderer text={q.questionText.en} />
                            ) : (
                              <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No English Text</span>
                            )}
                          </Typography>
                        </Box>
                        {q.questionText?.hi && (
                          <Typography variant="caption" color="text.secondary" component="div">
                            <LatexRenderer text={q.questionText.hi} />
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={q.difficulty}
                          size="small"
                          color={getDifficultyColor(q.difficulty)}
                          sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => openViewDialog(q)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => openEditDialog(q)}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => openDeleteDialog(q)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, textAlign: 'center' }}>
              <Search sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>No questions found</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm ? 'Try adjusting your search terms' : 'Start adding questions to this chapter'}
              </Typography>
              {!searchTerm && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={() => setIsCsvImportOpen(true)} sx={{ textTransform: 'none' }}>Import CSV</Button>
                  <Button variant="contained" onClick={openAddDialog} sx={{ textTransform: 'none' }}>Add Question</Button>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {editingQuestionId ? 'Edit Question' : 'Add New Question'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Question Text */}
            <Box>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Question Text
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 2
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">English</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Enter question in English..."
                    value={formState.questionText.en}
                    onChange={e => setFormState(prev => ({ ...prev, questionText: { ...prev.questionText, en: e.target.value } }))}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Hindi</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="प्रश्न हिंदी में दर्ज करें..."
                    value={formState.questionText.hi}
                    onChange={e => setFormState(prev => ({ ...prev, questionText: { ...prev.questionText, hi: e.target.value } }))}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Options */}
            <Box>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Options (Select correct answer)
              </Typography>
              <RadioGroup
                value={indexMap[formState.correctOptionIndex]}
                onChange={(e) => setFormState({ ...formState, correctOptionIndex: optionMap[e.target.value] })}
              >
                {formState.options.map((opt, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 1.5,
                      bgcolor: indexMap[formState.correctOptionIndex] === indexMap[index] ? 'action.selected' : 'background.paper',
                      borderColor: indexMap[formState.correctOptionIndex] === indexMap[index] ? 'primary.main' : 'divider'
                    }}
                  >
                    <FormControlLabel
                      value={indexMap[index]}
                      control={<Radio />}
                      label={
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                            gap: 2,
                            width: '100%',
                            ml: 1
                          }}
                        >
                          <Box>
                            <Typography variant="caption" fontWeight="600" color="text.secondary">
                              Option {indexMap[index]} (EN)
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder={`Option ${indexMap[index]} English`}
                              value={opt.en}
                              onChange={e => {
                                const newOptions = [...formState.options];
                                newOptions[index].en = e.target.value;
                                setFormState(prev => ({ ...prev, options: newOptions }));
                              }}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                          <Box>
                            <Typography variant="caption" fontWeight="600" color="text.secondary">
                              Option {indexMap[index]} (HI)
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder={`विकल्प ${indexMap[index]} हिंदी`}
                              value={opt.hi}
                              onChange={e => {
                                const newOptions = [...formState.options];
                                newOptions[index].hi = e.target.value;
                                setFormState(prev => ({ ...prev, options: newOptions }));
                              }}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                      }
                      sx={{ width: '100%', alignItems: 'flex-start' }}
                    />
                  </Paper>
                ))}
              </RadioGroup>
            </Box>

            {/* Settings */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 2
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  value={formState.difficulty}
                  onChange={(e) => setFormState({ ...formState, difficulty: e.target.value })}
                  label="Difficulty Level"
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Marks</InputLabel>
                <Select
                  value={formState.marks}
                  onChange={(e) => setFormState({ ...formState, marks: e.target.value })}
                  label="Marks"
                >
                  {[1, 2, 3, 4, 5].map(m => (
                    <MenuItem key={m} value={m.toString()}>{m} Mark{m > 1 ? 's' : ''}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Explanation */}
            <Box>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Explanation (Optional)
              </Typography>
              <Tabs value={explanationTab} onChange={(e, v) => setExplanationTab(v)}>
                <Tab label="English" />
                <Tab label="Hindi" />
              </Tabs>
              <TabPanel value={explanationTab} index={0}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Explain the answer in English..."
                  value={formState.explanation.en}
                  onChange={e => setFormState(prev => ({ ...prev, explanation: { ...prev.explanation, en: e.target.value } }))}
                />
              </TabPanel>
              <TabPanel value={explanationTab} index={1}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="उत्तर का स्पष्टीकरण हिंदी में..."
                  value={formState.explanation.hi}
                  onChange={e => setFormState(prev => ({ ...prev, explanation: { ...prev.explanation, hi: e.target.value } }))}
                />
              </TabPanel>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={() => setIsFormOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleFormSubmit} variant="contained" sx={{ textTransform: 'none' }}>
            {editingQuestionId ? 'Update Question' : 'Save Question'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Question Dialog */}
      <Dialog open={isViewOpen} onClose={() => setIsViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          Question Details
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedQuestion && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="caption" fontWeight="600" color="text.secondary" textTransform="uppercase">
                  Question
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'action.hover' }}>
                  <Typography variant="body1" fontWeight="600" gutterBottom component="div">
                    <LatexRenderer text={selectedQuestion.questionText?.en} />
                  </Typography>
                  {selectedQuestion.questionText?.hi && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body1" component="div">
                        <LatexRenderer text={selectedQuestion.questionText?.hi} />
                      </Typography>
                    </>
                  )}
                </Paper>

              </Box>

              <Box>
                <Typography variant="caption" fontWeight="600" color="text.secondary" textTransform="uppercase">
                  Options
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedQuestion.options.map((opt, index) => (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: selectedQuestion.correctOptionIndex === index ? 'success.50' : 'background.paper',
                        borderColor: selectedQuestion.correctOptionIndex === index ? 'success.main' : 'divider',
                        borderWidth: selectedQuestion.correctOptionIndex === index ? 2 : 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip
                          label={indexMap[index]}
                          size="small"
                          color={selectedQuestion.correctOptionIndex === index ? 'success' : 'default'}
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={selectedQuestion.correctOptionIndex === index ? 600 : 400} component="div">
                            <LatexRenderer text={opt.en} />
                          </Typography>
                          {opt.hi && (
                            <Typography variant="caption" color="text.secondary" component="div">
                              <LatexRenderer text={opt.hi} />
                            </Typography>
                          )}
                        </Box>

                      </Box>
                      {selectedQuestion.correctOptionIndex === index && (
                        <Chip label="Correct Answer" size="small" color="success" />
                      )}
                    </Paper>
                  ))}
                </Box>
              </Box>

              {(selectedQuestion.explanation?.en || selectedQuestion.explanation?.hi) && (
                <Box>
                  <Typography variant="caption" fontWeight="600" color="text.secondary" textTransform="uppercase">
                    Explanation
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'info.50' }}>
                    {selectedQuestion.explanation?.en && (
                      <Typography variant="body2" gutterBottom component="div">
                        <LatexRenderer text={selectedQuestion.explanation.en} />
                      </Typography>
                    )}
                    {selectedQuestion.explanation?.hi && (
                      <Typography variant="body2" color="text.secondary" component="div">
                        <LatexRenderer text={selectedQuestion.explanation.hi} />
                      </Typography>
                    )}
                  </Paper>

                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 3, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2">
                  <strong>Difficulty:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedQuestion.difficulty}</span>
                </Typography>
                <Typography variant="body2">
                  <strong>Marks:</strong> {selectedQuestion.marks}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsViewOpen(false)} variant="contained" sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={isCsvImportOpen} onClose={() => setIsCsvImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Questions from CSV</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  minWidth: 250,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '2px dashed',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                  position: 'relative'
                }}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileSelect}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
                <Upload sx={{ fontSize: 40, color: 'action.active', mb: 1 }} />
                <Typography variant="body2" fontWeight="600">
                  Click to Upload CSV
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  or drag and drop file here
                </Typography>
                {csvFile && (
                  <Chip label={csvFile.name} color="primary" size="small" sx={{ mt: 1 }} />
                )}
              </Paper>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleDownloadTemplate}
                  sx={{ textTransform: 'none' }}
                >
                  Download Template
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                  Use the template for correct formatting
                </Typography>
              </Box>
            </Box>

            {csvErrors.length > 0 && (
              <Alert severity="error">
                <AlertTitle>Found {csvErrors.length} Errors</AlertTitle>
                <Box sx={{ maxHeight: 120, overflow: 'auto' }}>
                  {csvErrors.map((error, idx) => (
                    <Typography key={idx} variant="caption" display="block">
                      • {error}
                    </Typography>
                  ))}
                </Box>
              </Alert>
            )}

            {csvPreview.length > 0 && (
              <Paper variant="outlined">
                <Box sx={{ p: 1.5, bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="600">Preview</Typography>
                  <Chip label={`${csvPreview.length} valid questions`} color="success" size="small" />
                </Box>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  <List dense>
                    {csvPreview.map((q, idx) => (
                      <ListItem key={idx} divider>
                        <ListItemText
                          primary={q.questionText.en}
                          secondary={q.questionText.hi}
                          secondaryTypographyProps={{ noWrap: true }}
                        />
                        <Chip label={`Ans: ${indexMap[q.correctOptionIndex]}`} size="small" variant="outlined" />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => {
            setIsCsvImportOpen(false);
            setCsvFile(null);
            setCsvPreview([]);
            setCsvErrors([]);
          }} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCsvImport}
            disabled={csvPreview.length === 0 || loading.questions}
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            {loading.questions ? 'Importing...' : `Import ${csvPreview.length} Questions`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} maxWidth="sm">
        <DialogTitle>Delete Question?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this question? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsDeleteOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteQuestion} color="error" variant="contained" sx={{ textTransform: 'none' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

