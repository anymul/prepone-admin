import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Typography,
    TextField,
    FormControlLabel,
    Checkbox,
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
    Chip,
    Tooltip,
    IconButton,
    Collapse,
    Grid,
    CircularProgress,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Languages,
    ChevronDown
} from 'lucide-react';

const initialFormState = {
    title: '',
    description: '',
    durationInMinutes: 60,
    passingMarks: 33,
    subjects: [],
    questions: [],
    stream: '',
};

export default function MockTestFormPage() {
    const { classId, testId } = useParams();
    const navigate = useNavigate();
    const isEditing = !!testId;

    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

    const [formState, setFormState] = useState(initialFormState);
    const [allSubjects, setAllSubjects] = useState([]);
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [usedQuestions, setUsedQuestions] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [displayLanguage, setDisplayLanguage] = useState('en');
    const [expandedChapters, setExpandedChapters] = useState(new Set());

    useEffect(() => {
        const loadPageData = async () => {
            setLoading(true);
            try {
                let effectiveClassId = classId;
                let testData = null;


                const token = localStorage.getItem('token');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                if (isEditing) {
                    const testRes = await fetch(`${API_BASE_URL}/mocktest/${testId}`, { headers });
                    if (!testRes.ok) throw new Error('Mock test not found');
                    testData = await testRes.json();
                    effectiveClassId = testData.studentClass;
                }

                if (!effectiveClassId) throw new Error('Could not determine the class for this page.');

                const subjectsRes = await fetch(`${API_BASE_URL}/utility/subject/class/${effectiveClassId}`, { headers });
                const subjectsData = await subjectsRes.json();

                setAllSubjects(Array.isArray(subjectsData) ? subjectsData : []);

                if (isEditing && testData) {
                    setFormState({
                        title: testData.title || '',
                        description: testData.description || '',
                        durationInMinutes: testData.durationInMinutes,
                        passingMarks: testData.passingMarks,
                        stream: testData.stream,
                        subjects: testData.subjects.map(s => typeof s === 'object' ? s._id : s),
                        questions: testData.questions.map(q => typeof q === 'object' ? q._id : q),
                    });
                }
            } catch (error) {
                console.error("Error loading page data:", error);
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        loadPageData();
    }, [testId, classId, isEditing, navigate, API_BASE_URL]);

    useEffect(() => {
        if (formState.subjects.length === 0) {
            setAvailableQuestions([]);
            setUsedQuestions(new Set());
            return;
        }

        const fetchQuestionsForSubjects = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/mocktest/questions-for-subjects`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ subjectIds: formState.subjects }),
                });

                const questionsData = await res.json();
                setAvailableQuestions(Array.isArray(questionsData) ? questionsData : []);

                const classId = allSubjects.find(s => formState.subjects.includes(s._id))?.studentClass;
                if (classId) {
                    const mockTestsRes = await fetch(`${API_BASE_URL}/mocktest/class/${classId}`);
                    const mockTests = await mockTestsRes.json();

                    const usedQuestionIds = new Set();
                    mockTests.forEach(test => {
                        if (isEditing && test._id === testId) return;
                        test.questions.forEach(q => {
                            const qId = typeof q === 'object' ? q._id : q;
                            usedQuestionIds.add(qId);
                        });
                    });

                    setUsedQuestions(usedQuestionIds);
                }
            } catch (error) {
                console.error("Failed to fetch questions:", error);
            }
        };

        fetchQuestionsForSubjects();
    }, [formState.subjects, allSubjects, testId, isEditing, API_BASE_URL]);

    const groupedQuestions = useMemo(() => {
        const groups = {};

        availableQuestions.forEach(q => {
            const subjectId = q.subjectId?._id || 'unknown';
            const subjectName = q.subjectId?.name || 'Unknown Subject';
            const chapterId = q.chapterId?._id || 'unknown';
            const chapterName = q.chapterId?.name || 'Unknown Chapter';

            if (!groups[subjectId]) {
                groups[subjectId] = {
                    name: subjectName,
                    chapters: {}
                };
            }

            if (!groups[subjectId].chapters[chapterId]) {
                groups[subjectId].chapters[chapterId] = {
                    name: chapterName,
                    questions: []
                };
            }

            groups[subjectId].chapters[chapterId].questions.push(q);
        });

        return groups;
    }, [availableQuestions]);

    const calculateTotalSelectedMarks = useMemo(() => {
        return formState.questions.reduce((total, qId) => {
            const question = availableQuestions.find(q => q._id === qId);
            return total + (question ? question.marks : 0);
        }, 0);
    }, [formState.questions, availableQuestions]);

    const questionStats = useMemo(() => {
        const total = availableQuestions.length;
        const used = availableQuestions.filter(q => usedQuestions.has(q._id)).length;
        const fresh = total - used;
        return { total, used, fresh };
    }, [availableQuestions, usedQuestions]);

    const getQuestionText = (question) => {
        if (displayLanguage === 'both') {
            const en = question.questionText?.en || '';
            const hi = question.questionText?.hi || '';
            return { en, hi, hasBoth: en && hi };
        }

        const text = question.questionText?.[displayLanguage];
        if (!text) {
            const fallback = displayLanguage === 'en'
                ? question.questionText?.hi
                : question.questionText?.en;
            return fallback || '[No Text Available]';
        }
        return text;
    };

    const getChapterStats = (questions) => {
        const total = questions.length;
        const selected = questions.filter(q => formState.questions.includes(q._id)).length;
        const used = questions.filter(q => usedQuestions.has(q._id)).length;
        const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
        const selectedMarks = questions
            .filter(q => formState.questions.includes(q._id))
            .reduce((sum, q) => sum + (q.marks || 0), 0);

        return { total, selected, used, totalMarks, selectedMarks };
    };

    const toggleChapter = (chapterId) => {
        setExpandedChapters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(chapterId)) {
                newSet.delete(chapterId);
            } else {
                newSet.add(chapterId);
            }
            return newSet;
        });
    };

    const handleChapterSelectAll = (questions, checked) => {
        const questionIds = questions.map(q => q._id);
        setFormState(s => ({
            ...s,
            questions: checked
                ? [...new Set([...s.questions, ...questionIds])]
                : s.questions.filter(id => !questionIds.includes(id))
        }));
    };

    const handleExpandCollapseAll = () => {
        if (expandedChapters.size > 0) {
            setExpandedChapters(new Set());
        } else {
            const allChapterIds = Object.values(groupedQuestions).flatMap(subject =>
                Object.keys(subject.chapters)
            );
            setExpandedChapters(new Set(allChapterIds));
        }
    };

    const handleSaveMockTest = async () => {
        const effectiveClassId = isEditing ? (allSubjects.length > 0 ? allSubjects[0].studentClass : null) : classId;
        if (!effectiveClassId) return alert("Could not determine the class for this test.");

        const url = isEditing ? `${API_BASE_URL}/mocktest/${testId}` : `${API_BASE_URL}/mocktest`;
        const method = isEditing ? 'PATCH' : 'POST';
        const body = { ...formState, studentClass: effectiveClassId, totalMarks: calculateTotalSelectedMarks };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error("Failed to save mock test.");
            navigate(`/mock-tests/${effectiveClassId}`);
        } catch (error) {
            console.error("Failed to save mock test:", error);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <IconButton onClick={() => navigate(-1)} size="small">
                    <ArrowLeft size={20} />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">
                    {isEditing ? 'Edit Mock Test' : 'Create New Mock Test'}
                </Typography>
            </Box>

            {/* Test Details Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardHeader title="Test Details" />
                <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Test Title"
                            fullWidth
                            placeholder="e.g., Physics Chapter 1 Test"
                            value={formState.title}
                            onChange={e => setFormState(s => ({ ...s, title: e.target.value }))}
                        />

                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="A short description of the test"
                            value={formState.description}
                            onChange={e => setFormState(s => ({ ...s, description: e.target.value }))}
                        />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Time (mins)"
                                    type="number"
                                    fullWidth
                                    value={formState.durationInMinutes}
                                    onChange={e => setFormState(s => ({ ...s, durationInMinutes: parseInt(e.target.value) || 0 }))}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Passing Marks (%)"
                                    type="number"
                                    fullWidth
                                    value={formState.passingMarks}
                                    onChange={e => setFormState(s => ({ ...s, passingMarks: parseInt(e.target.value) || 0 }))}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Stream</InputLabel>
                                    <Select
                                        value={formState.stream}
                                        onChange={e => setFormState(s => ({ ...s, stream: e.target.value }))}
                                        label="Stream"
                                    >
                                        <MenuItem value="Science">Science</MenuItem>
                                        <MenuItem value="Commerce">Commerce</MenuItem>
                                        <MenuItem value="Arts">Arts</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    label="Total Marks"
                                    type="number"
                                    fullWidth
                                    disabled
                                    value={calculateTotalSelectedMarks}
                                    InputProps={{ style: { fontWeight: 'bold' } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>

            {/* Select Subjects Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardHeader
                    title="Select Subjects"
                    subheader="Selecting subjects will load their questions below. Changing subjects will reset selected questions."
                />
                <CardContent>
                    <Grid container spacing={2}>
                        {allSubjects.map(subject => (
                            <Grid item xs={12} sm={6} md={4} key={subject._id}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formState.subjects.includes(subject._id)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const newSubjects = checked
                                                    ? [...formState.subjects, subject._id]
                                                    : formState.subjects.filter(id => id !== subject._id);
                                                setFormState(s => ({ ...s, subjects: newSubjects, questions: [] }));
                                            }}
                                        />
                                    }
                                    label={<Typography fontWeight="500">{subject.name}</Typography>}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>

            {/* Select Questions Card */}
            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2 }}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="h6">Select Questions ({formState.questions.length} selected)</Typography>
                                    {questionStats.used > 0 && (
                                        <Tooltip title={
                                            <Box>
                                                Questions marked with <Chip label="Used" size="small" variant="outlined" sx={{ mx: 0.5 }} /> are already in other mock tests
                                            </Box>
                                        }>
                                            <AlertCircle size={20} color="#f97316" />
                                        </Tooltip>
                                    )}
                                </Box>
                                {formState.subjects.length > 0 && questionStats.total > 0 && (
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                        <Chip label={`Total: ${questionStats.total}`} size="small" variant="outlined" />
                                        <Chip label={`Used: ${questionStats.used}`} size="small" sx={{ borderColor: '#f97316', color: '#f97316' }} variant="outlined" />
                                        <Chip label={`Fresh: ${questionStats.fresh}`} size="small" sx={{ borderColor: '#16a34a', color: '#16a34a' }} variant="outlined" />
                                    </Box>
                                )}
                            </Box>

                            {formState.subjects.length > 0 && availableQuestions.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Button variant="outlined" size="small" onClick={handleExpandCollapseAll}>
                                        {expandedChapters.size > 0 ? 'Collapse All' : 'Expand All'}
                                    </Button>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Languages size={16} />
                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                            <Select value={displayLanguage} onChange={e => setDisplayLanguage(e.target.value)}>
                                                <MenuItem value="en">English</MenuItem>
                                                <MenuItem value="hi">हिंदी</MenuItem>
                                                <MenuItem value="both">Both</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    }
                />
                <CardContent>
                    {formState.subjects.length > 0 ? (
                        availableQuestions.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {Object.entries(groupedQuestions).map(([subjectId, subject]) => (
                                    <Paper key={subjectId} variant="outlined">
                                        <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                                            <Typography variant="subtitle1" fontWeight="bold">{subject.name}</Typography>
                                        </Box>
                                        {Object.entries(subject.chapters).map(([chapterId, chapter]) => {
                                            const stats = getChapterStats(chapter.questions);
                                            const isExpanded = expandedChapters.has(chapterId);
                                            const allSelected = stats.selected === stats.total;
                                            const someSelected = stats.selected > 0 && stats.selected < stats.total;

                                            return (
                                                <Box key={chapterId} sx={{ borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, '&:hover': { bgcolor: 'action.hover' } }}>
                                                        <Checkbox
                                                            checked={allSelected}
                                                            indeterminate={someSelected}
                                                            onChange={(e) => handleChapterSelectAll(chapter.questions, e.target.checked)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <Box
                                                            onClick={() => toggleChapter(chapterId)}
                                                            sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, cursor: 'pointer', gap: 1 }}
                                                        >
                                                            <IconButton size="small">
                                                                <ChevronDown
                                                                    sx={{
                                                                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                                                        transition: 'transform 0.2s'
                                                                    }}
                                                                    size={20}
                                                                />
                                                            </IconButton>
                                                            <Box sx={{ flexGrow: 1 }}>
                                                                <Typography fontWeight="500">{chapter.name}</Typography>
                                                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                                                    <Chip label={`${stats.selected}/${stats.total} selected`} size="small" />
                                                                    <Chip label={`${stats.selectedMarks}/${stats.totalMarks} marks`} size="small" variant="outlined" />
                                                                    {stats.used > 0 && (
                                                                        <Chip label={`${stats.used} used`} size="small" sx={{ borderColor: '#f97316', color: '#f97316' }} variant="outlined" />
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    </Box>

                                                    <Collapse in={isExpanded}>
                                                        <TableContainer>
                                                            <Table size="small">
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell width={50}></TableCell>
                                                                        <TableCell>Question</TableCell>
                                                                        <TableCell>Status</TableCell>
                                                                        <TableCell align="right">Marks</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {chapter.questions.map(q => {
                                                                        const isUsed = usedQuestions.has(q._id);
                                                                        const questionText = getQuestionText(q);

                                                                        return (
                                                                            <TableRow key={q._id} sx={{ bgcolor: isUsed ? '#fff7ed' : 'inherit' }}>
                                                                                <TableCell>
                                                                                    <Checkbox
                                                                                        checked={formState.questions.includes(q._id)}
                                                                                        onChange={(e) => {
                                                                                            const checked = e.target.checked;
                                                                                            const newQuestions = checked
                                                                                                ? [...formState.questions, q._id]
                                                                                                : formState.questions.filter(id => id !== q._id);
                                                                                            setFormState(s => ({ ...s, questions: newQuestions }));
                                                                                        }}
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    {displayLanguage === 'both' && questionText.hasBoth ? (
                                                                                        <Tooltip
                                                                                            title={
                                                                                                <Box>
                                                                                                    <Typography variant="body2" gutterBottom><strong>English:</strong> {questionText.en}</Typography>
                                                                                                    <Typography variant="body2"><strong>Hindi:</strong> {questionText.hi}</Typography>
                                                                                                </Box>
                                                                                            }
                                                                                        >
                                                                                            <Box sx={{ maxWidth: 400 }}>
                                                                                                <Typography variant="body2" noWrap>
                                                                                                    <strong style={{ fontSize: '0.75rem', color: '#6b7280' }}>EN:</strong> {questionText.en}
                                                                                                </Typography>
                                                                                                <Typography variant="body2" noWrap>
                                                                                                    <strong style={{ fontSize: '0.75rem', color: '#6b7280' }}>HI:</strong> {questionText.hi}
                                                                                                </Typography>
                                                                                            </Box>
                                                                                        </Tooltip>
                                                                                    ) : (
                                                                                        <Tooltip
                                                                                            title={
                                                                                                <Box>
                                                                                                    {q.questionText?.en && <Typography variant="body2" gutterBottom><strong>EN:</strong> {q.questionText.en}</Typography>}
                                                                                                    {q.questionText?.hi && <Typography variant="body2"><strong>HI:</strong> {q.questionText.hi}</Typography>}
                                                                                                </Box>
                                                                                            }
                                                                                        >
                                                                                            <Typography variant="body2" noWrap sx={{ maxWidth: 400 }}>
                                                                                                {typeof questionText === 'string' ? questionText : questionText.en || questionText.hi}
                                                                                            </Typography>
                                                                                        </Tooltip>
                                                                                    )}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    {isUsed ? (
                                                                                        <Chip label="Used" size="small" sx={{ borderColor: '#f97316', color: '#f97316' }} variant="outlined" />
                                                                                    ) : (
                                                                                        <Chip label="Fresh" size="small" sx={{ borderColor: '#16a34a', color: '#16a34a' }} variant="outlined" />
                                                                                    )}
                                                                                </TableCell>
                                                                                <TableCell align="right">{q.marks}</TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    </Collapse>
                                                </Box>
                                            );
                                        })}
                                    </Paper>
                                ))}
                            </Box>
                        ) : (
                            <Typography color="text.secondary" textAlign="center" py={2}>
                                No questions found for the selected subject(s).
                            </Typography>
                        )
                    ) : (
                        <Typography color="text.secondary" textAlign="center" py={2}>
                            Select subjects to see available questions.
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
                <Button variant="contained" onClick={handleSaveMockTest} disabled={loading}>Save Mock Test</Button>
            </Box>
        </Box>
    );
}
