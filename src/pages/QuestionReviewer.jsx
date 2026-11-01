import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Box, Typography, Card, CardContent, Chip, LinearProgress,
    IconButton, Tooltip, Button, TextField, CircularProgress,
    Drawer, Tabs, Tab, Divider, Stack, Grid, Paper,
    ToggleButtonGroup, ToggleButton, Collapse, Alert, Badge,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Radio, RadioGroup, FormControlLabel, Checkbox
} from "@mui/material";
import {
    ThumbsUp, ThumbsDown, Flag, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, Clock, SkipForward,
    BookOpen, Layers, ChevronDown, ChevronUp, SplitSquareHorizontal,
    Info, Download, RotateCcw, List, X, Sparkles, AlertTriangle,
    ShieldCheck, Zap, BarChart3, Bot, Edit2, Save, Wand2, Search // Added new icons
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import LatexRenderer from "../components/LatexRenderer";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

// ─── Helpers ────────────────────────────────────────────────────────────────

const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const DIFFICULTY_COLOR = { easy: "success", medium: "warning", hard: "error" };
const OPTION_LABELS = ["A", "B", "C", "D"];
const indexMap = ['A', 'B', 'C', 'D'];

const QUICK_REMARKS = [
    "Incorrect answer",
    "Duplicate question",
    "LaTeX formatting broken",
    "Hindi translation missing",
    "Hindi translation mismatch",
    "Model answer insufficient",
    "Ambiguous stem",
    "Wrong chapter",
    "Poor quality",
    "Wrong Hindi terminology",
    "Good question ✓",
];

const ISSUE_SEVERITY = {
    "incorrect-answer": "error",
    "wrong-chapter": "error",
    "english-hindi-mismatch": "warning",
    "stem-ambiguous": "warning",
    "insufficient-data": "warning",
    "duplicate": "warning",
    "explanation-weak": "info",
    "requires-sign-convention-note": "info",
};

const VERDICT_COLOR = { approve: "success", reject: "error", needs_review: "warning" };
const VERDICT_LABEL = { approve: "Approved by AI", reject: "Rejected by AI", needs_review: "Needs Review" };

const sessionKey = (cls, subjectId, chapterId) =>
    `auditSession_${cls}_${subjectId}_${chapterId}`;
const mockTestSessionKey = (testId) =>
    `auditSession_mocktest_${testId}`;
const saveSession = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) { }
};
const loadSession = (key) => {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (_) { return {}; }
};

// ─── Setup Wizard ─────────────────────────────────────────────────────────────

function SetupWizard({ onStart }) {
    const [step, setStep] = useState(1);
    const [selectedClass, setSelectedClass] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingChapters, setLoadingChapters] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const cls = params.get("class");
        const subjectId = params.get("subject");
        const chapterId = params.get("chapter");
        if (cls) setSelectedClass(Number(cls));
        if (subjectId) setSelectedSubject({ _id: subjectId, name: params.get("subjectName") || subjectId });
        if (chapterId) setSelectedChapter({ _id: chapterId, name: params.get("chapterName") || chapterId });
    }, []);

    const fetchSubjects = async (classId) => {
        setLoadingSubjects(true);
        try {
            const res = await fetch(`${API_BASE_URL}/utility/subject/class/${classId}`, { headers: authHeaders() });
            const data = await res.json();
            setSubjects(data.data || data || []);
        } catch { toast.error("Failed to load subjects"); }
        finally { setLoadingSubjects(false); }
    };

    const fetchChapters = async (subjectId) => {
        setLoadingChapters(true);
        try {
            const res = await fetch(`${API_BASE_URL}/utility/subject/${subjectId}/chapters`, { headers: authHeaders() });
            const data = await res.json();
            setChapters(data.data || data || []);
        } catch { toast.error("Failed to load chapters"); }
        finally { setLoadingChapters(false); }
    };

    const handleClassSelect = (cls) => {
        setSelectedClass(cls); setSelectedSubject(null); setSelectedChapter(null);
        fetchSubjects(cls); setStep(2);
    };
    const handleSubjectSelect = (subject) => {
        setSelectedSubject(subject); setSelectedChapter(null);
        fetchChapters(subject._id); setStep(3);
    };
    const handleStart = () => {
        const params = new URLSearchParams({
            class: selectedClass,
            subject: selectedSubject._id,
            subjectName: selectedSubject.name,
            chapter: selectedChapter?._id || "all",
            chapterName: selectedChapter?.name || "All Chapters",
        });
        window.history.replaceState({}, "", `?${params.toString()}`);
        onStart({ selectedClass, selectedSubject, selectedChapter });
    };

    const STEPS = ["Class", "Subject", "Chapter"];

    return (
        <Box sx={{ maxWidth: 720, mx: "auto", py: 4 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={4}>
                {STEPS.map((label, i) => {
                    const active = step === i + 1;
                    const done = step > i + 1;
                    return (
                        <React.Fragment key={label}>
                            <Chip label={`${i + 1}. ${label}`}
                                color={done ? "success" : active ? "primary" : "default"}
                                variant={active ? "filled" : done ? "filled" : "outlined"}
                                onClick={() => done && setStep(i + 1)}
                                sx={{ cursor: done ? "pointer" : "default", fontWeight: active ? 700 : 400 }}
                            />
                            {i < 2 && <ChevronRight size={16} style={{ opacity: 0.4 }} />}
                        </React.Fragment>
                    );
                })}
            </Stack>
            <LinearProgress variant="determinate" value={((step - 1) / 2) * 100} sx={{ mb: 4, borderRadius: 8, height: 6 }} />

            {step === 1 && (
                <Box>
                    <Typography variant="h5" fontWeight={700} mb={1}>Select Class</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>Choose the class to audit questions for.</Typography>
                    <Stack direction="row" spacing={2}>
                        {[10, 12].map((cls) => (
                            <Card key={cls} onClick={() => handleClassSelect(cls)} sx={{
                                flex: 1, textAlign: "center", py: 5, cursor: "pointer", border: "2px solid",
                                borderColor: selectedClass === cls ? "primary.main" : "divider",
                                transition: "all 0.18s", "&:hover": { borderColor: "primary.main", boxShadow: 3 },
                            }}>
                                <Typography variant="h3" fontWeight={800}>Class {cls}</Typography>
                                <Typography variant="body2" color="text.secondary" mt={1}>Bihar Board</Typography>
                            </Card>
                        ))}
                    </Stack>
                </Box>
            )}

            {step === 2 && (
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                        <IconButton size="small" onClick={() => setStep(1)}><ChevronLeft size={18} /></IconButton>
                        <Typography variant="h5" fontWeight={700}>Select Subject — Class {selectedClass}</Typography>
                    </Stack>
                    {loadingSubjects ? (
                        <Grid container spacing={2}>{[...Array(6)].map((_, i) => (
                            <Grid item xs={6} sm={4} key={i}>
                                <Card sx={{ height: 120, borderRadius: 2, bgcolor: "action.hover" }} />
                            </Grid>
                        ))}</Grid>
                    ) : (
                        <Grid container spacing={2}>
                            {subjects.map((subject) => (
                                <Grid item xs={6} sm={4} key={subject._id}>
                                    <Card onClick={() => handleSubjectSelect(subject)} sx={{
                                        display: "flex", flexDirection: "column", alignItems: "center",
                                        justifyContent: "center", height: "100%", minHeight: 120,
                                        textAlign: "center", p: 2, cursor: "pointer", border: "2px solid",
                                        borderColor: selectedSubject?._id === subject._id ? "primary.main" : "divider",
                                        "&:hover": { borderColor: "primary.main", boxShadow: 2 },
                                    }}>
                                        <BookOpen size={22} style={{ marginBottom: 8, opacity: 0.7 }} />
                                        <Typography variant="body1" fontWeight={600} sx={{ wordBreak: "break-word", width: "100%" }}>
                                            {subject.name}
                                        </Typography>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            )}

            {step === 3 && (
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                        <IconButton size="small" onClick={() => setStep(2)}><ChevronLeft size={18} /></IconButton>
                        <Typography variant="h5" fontWeight={700}>Select Chapter — {selectedSubject?.name}</Typography>
                    </Stack>
                    {loadingChapters ? (
                        <Stack spacing={1}>{[...Array(5)].map((_, i) => (<Box key={i} sx={{ height: 52, borderRadius: 2, bgcolor: "action.hover" }} />))}</Stack>
                    ) : (
                        <Stack spacing={1}>
                            <Card onClick={() => setSelectedChapter(null)} sx={{
                                px: 3, py: 1.5, cursor: "pointer", border: "2px solid",
                                borderColor: selectedChapter === null ? "primary.main" : "divider",
                                "&:hover": { borderColor: "primary.main" },
                            }}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Layers size={18} style={{ opacity: 0.6 }} />
                                    <Typography fontWeight={600}>All Chapters</Typography>
                                </Stack>
                            </Card>
                            {chapters.map((ch) => (
                                <Card key={ch._id} onClick={() => setSelectedChapter(ch)} sx={{
                                    px: 3, py: 1.5, cursor: "pointer", border: "2px solid",
                                    borderColor: selectedChapter?._id === ch._id ? "primary.main" : "divider",
                                    "&:hover": { borderColor: "primary.main" },
                                }}>
                                    <Typography>{ch.name}</Typography>
                                </Card>
                            ))}
                        </Stack>
                    )}
                    {selectedChapter !== undefined && (
                        <Box mt={4}>
                            <Button variant="contained" size="large" fullWidth
                                startIcon={<ShieldCheck size={18} />}
                                onClick={handleStart}
                                sx={{ py: 1.5, fontWeight: 700 }}
                            >
                                Start Quality Audit
                            </Button>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}

// ─── Mock Test Review Selector ────────────────────────────────────────────────

function MockTestReviewSelector({ onStart }) {
    const [selectedClass, setSelectedClass] = useState("all");
    const [selectedBoard, setSelectedBoard] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [mockTests, setMockTests] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchMockTests = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedClass !== "all") params.set("classId", selectedClass);
            if (selectedBoard !== "all") params.set("board", selectedBoard);
            if (searchQuery.trim()) params.set("search", searchQuery.trim());

            const res = await fetch(`${API_BASE_URL}/tests/admin/list?${params.toString()}`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error("Failed to fetch mock tests");
            const data = await res.json();
            setMockTests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching mock tests:", err);
            toast.error("Failed to load mock tests");
            setMockTests([]);
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedBoard, searchQuery]);

    useEffect(() => {
        fetchMockTests();
    }, [fetchMockTests]);

    const handleSelectTest = (test) => {
        const params = new URLSearchParams({
            mode: "mocktest",
            testId: test._id,
            title: test.title,
        });
        window.history.replaceState({}, "", `?${params.toString()}`);
        onStart({
            type: "mocktest",
            testId: test._id,
            mockTest: test,
        });
    };

    return (
        <Box sx={{ maxWidth: 840, mx: "auto", py: 2 }}>
            <Box mb={3}>
                <Typography variant="h5" fontWeight={700} mb={0.5}>
                    Select Mock Test to Review
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Review, audit, and fix questions specifically curated in mock tests. Changes update directly in the question database.
                </Typography>
            </Box>

            {/* Filter Bar */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Search mock tests by title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.5 }} />,
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <ToggleButtonGroup
                            size="small"
                            exclusive
                            value={selectedClass}
                            onChange={(_, v) => v !== null && setSelectedClass(v)}
                            fullWidth
                        >
                            <ToggleButton value="all">All Classes</ToggleButton>
                            <ToggleButton value="10">Class 10</ToggleButton>
                            <ToggleButton value="12">Class 12</ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                    <Grid item xs={6} sm={2.5}>
                        <ToggleButtonGroup
                            size="small"
                            exclusive
                            value={selectedBoard}
                            onChange={(_, v) => v !== null && setSelectedBoard(v)}
                            fullWidth
                        >
                            <ToggleButton value="all">All</ToggleButton>
                            <ToggleButton value="BSEB">BSEB</ToggleButton>
                            <ToggleButton value="CBSE">CBSE</ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                    <Grid item xs={12} sm={1.5} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<RotateCcw size={14} />}
                            onClick={fetchMockTests}
                            disabled={loading}
                            fullWidth
                        >
                            Refresh
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Mock Tests List */}
            {loading ? (
                <Box sx={{ p: 4, textAlign: "center" }}>
                    <CircularProgress size={32} />
                    <Typography mt={2} color="text.secondary" variant="body2">Loading mock tests…</Typography>
                </Box>
            ) : mockTests.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: 2 }}>
                    <Typography variant="body1" fontWeight={600} color="text.secondary">
                        No mock tests found matching your filters.
                    </Typography>
                    <Typography variant="body2" color="text.disabled" mt={0.5}>
                        Try adjusting class, board, or search query.
                    </Typography>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {mockTests.map((test) => (
                        <Card
                            key={test._id}
                            variant="outlined"
                            onClick={() => handleSelectTest(test)}
                            sx={{
                                p: 2.5,
                                cursor: "pointer",
                                transition: "all 0.18s ease-in-out",
                                "&:hover": { borderColor: "primary.main", boxShadow: 2 },
                                display: "flex",
                                flexDirection: "column",
                                gap: 1.5,
                            }}
                        >
                            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                <Box sx={{ flex: 1, minWidth: 240 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                                        {test.title}
                                    </Typography>
                                    {test.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: 13 }}>
                                            {test.description}
                                        </Typography>
                                    )}
                                </Box>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<ShieldCheck size={16} />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectTest(test);
                                    }}
                                    sx={{ fontWeight: 600, textTransform: "none", flexShrink: 0 }}
                                >
                                    Review Questions
                                </Button>
                            </Stack>

                            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.8} alignItems="center">
                                <Chip label={`Class ${test.studentClass}`} size="small" />
                                <Chip label={test.board || "BSEB"} size="small" variant="outlined" />
                                <Chip
                                    icon={<List size={13} />}
                                    label={`${test.questionCount || 0} Questions`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                                {test.durationInMinutes && (
                                    <Chip
                                        icon={<Clock size={13} />}
                                        label={`${test.durationInMinutes} mins`}
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                                {test.totalMarks && (
                                    <Chip label={`${test.totalMarks} Marks`} size="small" variant="outlined" />
                                )}
                                {test.status && (
                                    <Chip
                                        label={test.status.toUpperCase()}
                                        size="small"
                                        color={test.status === "active" || test.status === "live" ? "success" : "default"}
                                        variant={test.status === "active" || test.status === "live" ? "filled" : "outlined"}
                                        sx={{ fontSize: 10, height: 20 }}
                                    />
                                )}
                                {test.isPYQ && (
                                    <Chip label="PYQ" size="small" color="secondary" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                                )}
                            </Stack>

                            {test.subjects && test.subjects.length > 0 && (
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center", mr: 0.5 }}>
                                        Subjects:
                                    </Typography>
                                    {test.subjects.map((sub, idx) => (
                                        <Chip
                                            key={idx}
                                            label={typeof sub === "object" ? sub.name : sub}
                                            size="small"
                                            sx={{ fontSize: 11, height: 20, bgcolor: "action.hover" }}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Card>
                    ))}
                </Stack>
            )}
        </Box>
    );
}

// ─── Setup Hub with Tabs ──────────────────────────────────────────────────────

function AuditSetupHub({ onStartSubjectChapter, onStartMockTest, initialTab = 0 }) {
    const [tab, setTab] = useState(initialTab);

    return (
        <Box sx={{ maxWidth: 840, mx: "auto", py: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                <ShieldCheck size={26} />
                <Typography variant="h5" fontWeight={800}>Question Quality Audit &amp; Review</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Human review + AI verification + Live Database Editing for question quality.
            </Typography>

            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    mb: 3,
                    "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: 15, py: 1.5 }
                }}
            >
                <Tab icon={<BookOpen size={18} />} iconPosition="start" label="Subject & Chapter Audit" />
                <Tab icon={<Layers size={18} />} iconPosition="start" label="Mock Test Review" />
            </Tabs>

            {tab === 0 && <SetupWizard onStart={onStartSubjectChapter} />}
            {tab === 1 && <MockTestReviewSelector onStart={onStartMockTest} />}
        </Box>
    );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats, autoVerifyStatus, onAutoVerify, autoVerifying, onOpenBatchFix, batchFixing, batchProgress, totalQuestions }) {
    return (
        <Stack direction="row" spacing={1.5} flexWrap="wrap" mb={2} alignItems="center">
            {[
                { icon: <CheckCircle2 size={15} />, label: "Approved", value: stats.approved, color: "success.main" },
                { icon: <XCircle size={15} />, label: "Rejected", value: stats.rejected, color: "error.main" },
                { icon: <SkipForward size={15} />, label: "Skipped", value: stats.skipped, color: "text.secondary" },
                { icon: <Clock size={15} />, label: "Pending", value: stats.pending, color: "warning.main" },
                { icon: <Bot size={15} />, label: "AI Verified", value: stats.aiVerified, color: "info.main" },
            ].map(({ icon, label, value, color }) => (
                <Stack key={label} direction="row" alignItems="center" spacing={0.5}
                    sx={{ bgcolor: "action.hover", px: 1.5, py: 0.5, borderRadius: 2 }}>
                    <Box sx={{ color, display: "flex" }}>{icon}</Box>
                    <Typography variant="caption" sx={{ color }} fontWeight={700}>{value}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Stack>
            ))}
            <Box sx={{ flex: 1 }} />
            <Button
                size="small" variant="outlined"
                startIcon={autoVerifying ? <CircularProgress size={13} /> : <Sparkles size={14} />}
                onClick={onAutoVerify}
                disabled={autoVerifying || batchFixing}
                color="primary"
            >
                {autoVerifying ? `Verifying…` : "Auto Verify All"}
            </Button>
            <Button
                size="small" variant="contained"
                startIcon={batchFixing ? <CircularProgress size={13} color="inherit" /> : <Wand2 size={14} />}
                onClick={onOpenBatchFix}
                disabled={autoVerifying || totalQuestions === 0}
                color="secondary"
                sx={{ ml: 1 }}
            >
                {batchFixing ? `Auto-Fixing (${batchProgress.current}/${batchProgress.total})` : "Auto-Fix Chapter (AI)"}
            </Button>
        </Stack>
    );
}

// ─── AI Verdict Banner ────────────────────────────────────────────────────────

function AIVerdictBanner({ aiResult }) {
    if (!aiResult) return null;

    const colors = { approve: "success", reject: "error", needs_review: "warning" };
    const severity = colors[aiResult.verdict] || "info";
    const conf = Math.round((aiResult.confidence || 0) * 100);

    return (
        <Alert severity={severity} icon={<Bot size={16} />} sx={{ mb: 2, py: 0.75 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Box>
                    <Typography variant="caption" fontWeight={700} display="block">
                        AI: {VERDICT_LABEL[aiResult.verdict]} ({conf}% confidence)
                    </Typography>
                    {aiResult.issues?.length > 0 && (
                        <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                            {aiResult.issues.map((issue) => (
                                <Chip key={issue} label={issue.replace(/-/g, " ")} size="small"
                                    color={ISSUE_SEVERITY[issue] === "error" ? "error" : ISSUE_SEVERITY[issue] === "warning" ? "warning" : "default"}
                                    variant="outlined" sx={{ height: 20, fontSize: 10 }}
                                />
                            ))}
                        </Stack>
                    )}
                </Box>
                {aiResult.suggested_fix && (
                    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 280, fontStyle: "italic" }}>
                        💡 {aiResult.suggested_fix}
                    </Typography>
                )}
            </Stack>
        </Alert>
    );
}

// ─── Question Card (View & Edit Modes) ────────────────────────────────────────

function QuestionCard({
    question, index, total, lang, onLangChange, flagged, onFlag, splitView, aiResult,
    isEditing, setIsEditing, editForm, setEditForm, onSaveEdit, isSaving,
    onAIFix, isFixingLatex
}) {
    const [modelAnswerOpen, setModelAnswerOpen] = useState(true);

    if (!question) return null;

    // View Mode Constants
    const qText = question.questionText?.[lang] || question.questionText?.en || "";
    const getModelAnswer = (q, l) => {
        if (!q) return "";
        const ma = (q.modelAnswer !== undefined && q.modelAnswer !== null && q.modelAnswer !== "")
            ? q.modelAnswer
            : q.explanation;
        if (!ma) return "";
        if (typeof ma === 'string') return ma;
        return ma[l] || ma.en || ma.hi || "";
    };
    const modelAnswer = getModelAnswer(question, lang);
    const renderOptionText = (opt) => opt?.[lang] || opt?.en || "";

    return (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ p: 3, flex: 1, overflowY: "auto" }}>
                {/* Header row */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={0.5}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {index + 1} / {total}
                        </Typography>
                        <Chip label={`Class ${question.studentClass || "N/A"}`} size="small" />
                        <Chip label={question.subjectName || question.subjectId?.name || "Subject"} size="small" variant="outlined" />
                        <Chip label={question.chapterName || question.chapterId?.name || "Chapter"} size="small" variant="outlined" />
                        <Chip label={question.difficulty || "medium"} size="small"
                            color={DIFFICULTY_COLOR[question.difficulty || "medium"]} />
                        {aiResult?.verdict && !isEditing && (
                            <Chip
                                icon={<Bot size={11} />}
                                label={aiResult.verdict.replace("_", " ")}
                                size="small"
                                color={VERDICT_COLOR[aiResult.verdict]}
                                variant="outlined"
                            />
                        )}
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                        {!isEditing && (
                            <Tooltip title="Toggle split EN/HI view">
                                <IconButton size="small" onClick={() => onLangChange("split")} color={splitView ? "primary" : "default"}>
                                    <SplitSquareHorizontal size={16} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {!isEditing && (
                            <Tooltip title={flagged ? "Remove flag" : "Flag for re-check"}>
                                <IconButton size="small" onClick={onFlag} color={flagged ? "warning" : "default"}>
                                    <Flag size={16} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Button
                            variant={isEditing ? "contained" : "outlined"}
                            color={isEditing ? "primary" : "inherit"}
                            size="small"
                            startIcon={isEditing ? <X size={15} /> : <Edit2 size={15} />}
                            onClick={() => setIsEditing(!isEditing)}
                            sx={{ ml: 1, textTransform: "none" }}
                        >
                            {isEditing ? "Cancel Edit" : "Edit"}
                        </Button>
                    </Stack>
                </Stack>

                <LinearProgress variant="determinate" value={((index + 1) / total) * 100}
                    sx={{ mb: 2, borderRadius: 8, height: 4 }} />

                {!isEditing && <AIVerdictBanner aiResult={aiResult} />}

                {/* ────────────────────────────────────────────────────────────────
                    EDIT MODE
                    ──────────────────────────────────────────────────────────────── */}
                {isEditing && editForm ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                        {/* Question Text Fields */}
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" fontWeight="600">Question Text</Typography>
                                <Button
                                    variant="outlined" size="small" color="secondary"
                                    startIcon={isFixingLatex ? <CircularProgress size={14} color="inherit" /> : <Wand2 size={14} />}
                                    onClick={onAIFix}
                                    disabled={isFixingLatex || (!editForm.questionText.en && !editForm.questionText.hi)}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {isFixingLatex ? 'Fixing...' : 'AI Fix LaTeX'}
                                </Button>
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">English</Typography>
                                    <TextField
                                        fullWidth multiline rows={3}
                                        value={editForm.questionText.en}
                                        onChange={e => setEditForm(prev => ({ ...prev, questionText: { ...prev.questionText, en: e.target.value } }))}
                                        sx={{ mt: 0.5 }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Hindi</Typography>
                                    <TextField
                                        fullWidth multiline rows={3}
                                        value={editForm.questionText.hi}
                                        onChange={e => setEditForm(prev => ({ ...prev, questionText: { ...prev.questionText, hi: e.target.value } }))}
                                        sx={{ mt: 0.5 }}
                                    />
                                </Box>
                            </Box>
                        </Box>

                        {/* Options Fields (If MCQ) */}
                        {editForm.questionType === 'MCQ' && (
                            <Box>
                                <Typography variant="subtitle2" fontWeight="600" gutterBottom>Options & Correct Answer</Typography>
                                <RadioGroup
                                    value={indexMap[editForm.correctOptionIndex]}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setEditForm({ ...editForm, correctOptionIndex: indexMap.indexOf(val) });
                                    }}
                                >
                                    {editForm.options.map((opt, i) => (
                                        <Paper key={i} variant="outlined" sx={{
                                            p: 2, mb: 1.5,
                                            bgcolor: indexMap[editForm.correctOptionIndex] === indexMap[i] ? 'action.selected' : 'background.paper',
                                            borderColor: indexMap[editForm.correctOptionIndex] === indexMap[i] ? 'primary.main' : 'divider'
                                        }}>
                                            <FormControlLabel
                                                value={indexMap[i]} control={<Radio />}
                                                label={
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, width: '100%', ml: 1 }}>
                                                        <Box>
                                                            <Typography variant="caption" fontWeight="600" color="text.secondary">Option {indexMap[i]} (EN)</Typography>
                                                            <TextField
                                                                fullWidth size="small"
                                                                value={opt.en}
                                                                onChange={e => {
                                                                    const newOptions = [...editForm.options];
                                                                    newOptions[i].en = e.target.value;
                                                                    setEditForm(prev => ({ ...prev, options: newOptions }));
                                                                }}
                                                                sx={{ mt: 0.5 }}
                                                            />
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="caption" fontWeight="600" color="text.secondary">Option {indexMap[i]} (HI)</Typography>
                                                            <TextField
                                                                fullWidth size="small"
                                                                value={opt.hi}
                                                                onChange={e => {
                                                                    const newOptions = [...editForm.options];
                                                                    newOptions[i].hi = e.target.value;
                                                                    setEditForm(prev => ({ ...prev, options: newOptions }));
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
                        )}

                        {/* Model Answer Field */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight="600" gutterBottom>Model Answer</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                                <TextField
                                    fullWidth multiline rows={3} label="English"
                                    value={editForm.modelAnswer?.en || ""}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setEditForm(prev => ({
                                            ...prev,
                                            modelAnswer: { ...prev.modelAnswer, en: val },
                                            explanation: { ...prev.explanation, en: val },
                                        }));
                                    }}
                                />
                                <TextField
                                    fullWidth multiline rows={3} label="Hindi"
                                    value={editForm.modelAnswer?.hi || ""}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setEditForm(prev => ({
                                            ...prev,
                                            modelAnswer: { ...prev.modelAnswer, hi: val },
                                            explanation: { ...prev.explanation, hi: val },
                                        }));
                                    }}
                                />
                            </Box>
                        </Box>

                        <Button
                            variant="contained" color="success" size="large"
                            startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}
                            onClick={onSaveEdit}
                            disabled={isSaving}
                            sx={{ mt: 1, py: 1.5, fontWeight: 700 }}
                        >
                            {isSaving ? 'Saving Changes...' : 'Save Updated Question'}
                        </Button>
                    </Box>
                ) : (
                    /* ────────────────────────────────────────────────────────────────
                       VIEW MODE
                       ──────────────────────────────────────────────────────────────── */
                    <>
                        {/* Language toggle */}
                        {!splitView && (
                            <ToggleButtonGroup size="small" exclusive value={lang}
                                onChange={(_, v) => v && onLangChange(v)} sx={{ mb: 2 }}>
                                <ToggleButton value="en">EN</ToggleButton>
                                <ToggleButton value="hi">हि</ToggleButton>
                            </ToggleButtonGroup>
                        )}

                        {/* Question text */}
                        {splitView ? (
                            <Grid container spacing={2} mb={3}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" mb={0.5} display="block">English</Typography>
                                    <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.7 }} component="div">
                                        <LatexRenderer text={question.questionText?.en || ""} />
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" mb={0.5} display="block">हिन्दी</Typography>
                                    <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.7 }} component="div">
                                        <LatexRenderer text={question.questionText?.hi || ""} />
                                    </Typography>
                                </Grid>
                            </Grid>
                        ) : (
                            <Typography variant="body1" fontWeight={600} mb={3} sx={{ lineHeight: 1.7 }} component="div">
                                <LatexRenderer text={qText} />
                            </Typography>
                        )}

                        {/* Options */}
                        <Stack spacing={1} mb={3}>
                            {(question.options || []).map((opt, i) => {
                                const isCorrect = i === question.correctOptionIndex;
                                return (
                                    <Stack key={i} direction="row" alignItems="center" spacing={1.5} sx={{
                                        px: 2, py: 1.2, borderRadius: 2, border: "1.5px solid",
                                        borderColor: isCorrect ? "success.main" : "divider",
                                        bgcolor: isCorrect ? "success.light" : "transparent",
                                    }}>
                                        <Typography variant="caption" fontWeight={800} sx={{
                                            width: 24, height: 24, borderRadius: "50%",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            bgcolor: isCorrect ? "success.main" : "action.hover",
                                            color: isCorrect ? "success.contrastText" : "text.primary",
                                            flexShrink: 0,
                                        }}>
                                            {OPTION_LABELS[i]}
                                        </Typography>
                                        {splitView ? (
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}><LatexRenderer text={opt?.en || ""} /></Grid>
                                                <Grid item xs={6}><LatexRenderer text={opt?.hi || ""} /></Grid>
                                            </Grid>
                                        ) : (
                                            <Typography variant="body2" component="div">
                                                <LatexRenderer text={renderOptionText(opt)} />
                                            </Typography>
                                        )}
                                        {isCorrect && <CheckCircle2 size={15} style={{ color: "var(--mui-palette-success-main)", marginLeft: "auto", flexShrink: 0 }} />}
                                    </Stack>
                                );
                            })}
                        </Stack>

                        {/* Model Answer */}
                        <Divider sx={{ mb: 1.5 }} />
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Info size={15} style={{ opacity: 0.5 }} />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>MODEL ANSWER</Typography>
                            </Stack>
                            <IconButton size="small" onClick={() => setModelAnswerOpen((o) => !o)}>
                                {modelAnswerOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </IconButton>
                        </Stack>
                        <Collapse in={modelAnswerOpen}>
                            {splitView ? (
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary" mb={0.5} display="block">English</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }} component="div">
                                            <LatexRenderer text={getModelAnswer(question, 'en') || "No model answer provided."} />
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary" mb={0.5} display="block">हिन्दी</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }} component="div">
                                            <LatexRenderer text={getModelAnswer(question, 'hi') || "No model answer provided."} />
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }} component="div">
                                    <LatexRenderer text={modelAnswer || "No model answer provided."} />
                                </Typography>
                            )}
                        </Collapse>
                    </>
                )}

                {/* ID strip */}
                <Stack direction="row" spacing={2} mt={2} pt={2} borderTop="1px dashed" borderColor="divider">
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                        ID: {question._id}
                    </Typography>
                    {question.marks && (
                        <Typography variant="caption" color="text.disabled">{question.marks} mark{question.marks > 1 ? "s" : ""}</Typography>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}

// ─── Audit Panel (replaces Review Panel) ─────────────────────────────────────

function AuditPanel({
    review, onReviewChange, onSubmit, onSubmitNext, onSkip,
    submitting, skippedCount, aiResult, question, disableActions
}) {
    const { status, remark } = review;

    const appendRemark = (text) => {
        const sep = remark ? (remark.endsWith(" ") ? "" : " ") : "";
        onReviewChange({ remark: (remark || "") + sep + text });
    };

    const acceptAISuggestion = () => {
        if (!aiResult) return;
        const mappedStatus = aiResult.verdict === "approve" ? "approved"
            : aiResult.verdict === "reject" ? "rejected"
                : null;
        const issueRemark = aiResult.issues?.join(", ") || "";
        const fix = aiResult.suggested_fix ? ` — Fix: ${aiResult.suggested_fix}` : "";
        onReviewChange({
            status: mappedStatus,
            remark: issueRemark + fix,
        });
        toast.success("Accepted AI suggestion");
    };

    return (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", height: "100%", opacity: disableActions ? 0.6 : 1, pointerEvents: disableActions ? "none" : "auto" }}>
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6" fontWeight={700}>Audit Decision</Typography>
                    {aiResult && (
                        <Tooltip title="Accept AI verdict and issues as-is">
                            <Button size="small" variant="outlined" startIcon={<Zap size={13} />}
                                onClick={acceptAISuggestion} color="primary">
                                Use AI suggestion
                            </Button>
                        </Tooltip>
                    )}
                </Stack>

                {/* Previous review status */}
                {review.existingStatus && (
                    <Alert severity={review.existingStatus === "approved" ? "success" : "error"}
                        sx={{ mb: 2, py: 0.5 }} icon={false}>
                        <Typography variant="caption">
                            Previously <strong>{review.existingStatus}</strong>
                            {review.existingReviewer ? ` by ${review.existingReviewer}` : ""}
                            {review.existingDate ? ` on ${new Date(review.existingDate).toLocaleDateString()}` : ""}
                        </Typography>
                    </Alert>
                )}

                {/* Approve / Reject */}
                <Stack direction="row" spacing={2} mb={2.5}>
                    <Button fullWidth variant={status === "approved" ? "contained" : "outlined"} color="success"
                        startIcon={<ThumbsUp size={17} />}
                        onClick={() => onReviewChange({ status: status === "approved" ? null : "approved" })}
                        sx={{ py: 1.5, fontWeight: 700 }}>
                        Approve
                    </Button>
                    <Button fullWidth variant={status === "rejected" ? "contained" : "outlined"} color="error"
                        startIcon={<ThumbsDown size={17} />}
                        onClick={() => onReviewChange({ status: status === "rejected" ? null : "rejected" })}
                        sx={{ py: 1.5, fontWeight: 700 }}>
                        Reject
                    </Button>
                </Stack>

                {/* Quality check tags */}
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Quick issue tags
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.8} mt={0.8} mb={2}>
                    {QUICK_REMARKS.map((r) => (
                        <Chip key={r} label={r} size="small" variant="outlined"
                            onClick={() => appendRemark(r)}
                            sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }} />
                    ))}
                </Stack>

                {/* Remark field */}
                <TextField
                    label="Audit remark (optional)"
                    multiline rows={3} fullWidth
                    value={remark || ""}
                    onChange={(e) => onReviewChange({ remark: e.target.value })}
                    inputProps={{ maxLength: 500 }}
                    helperText={`${remark?.length || 0}/500`}
                    placeholder="e.g. Option B is correct, Hindi uses wrong terminology…"
                    sx={{ mb: 2 }}
                />

                {/* Actions */}
                <Stack spacing={1}>
                    <Button variant="contained" fullWidth size="large"
                        disabled={!status || submitting}
                        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <ChevronRight size={17} />}
                        onClick={onSubmitNext} sx={{ py: 1.4, fontWeight: 700 }}>
                        Submit &amp; Next
                    </Button>
                    <Button variant="outlined" fullWidth disabled={!status || submitting} onClick={onSubmit}>
                        Submit Only
                    </Button>
                    <Button variant="text" fullWidth color="inherit"
                        endIcon={<SkipForward size={15} />} onClick={onSkip}>
                        Skip ({skippedCount} skipped)
                    </Button>
                </Stack>

                {/* Keyboard hints */}
                <Stack direction="row" flexWrap="wrap" gap={0.5} mt={2} sx={{ opacity: 0.5 }}>
                    {[["A", "Approve"], ["R", "Reject"], ["→", "Next"], ["←", "Prev"], ["Enter", "Submit & Next"]].map(([key, action]) => (
                        <Stack key={key} direction="row" alignItems="center" spacing={0.3}>
                            <Typography variant="caption" sx={{
                                border: "1px solid", borderColor: "divider", borderRadius: 1,
                                px: 0.6, py: 0.1, fontFamily: "monospace", fontSize: 10
                            }}>{key}</Typography>
                            <Typography variant="caption" sx={{ fontSize: 10 }}>{action}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
}

// ─── AI Verification Progress Dialog ─────────────────────────────────────────

function AutoVerifyDialog({ open, progress, total, batchSize }) {
    const batchesDone = Math.floor(progress / batchSize);
    const totalBatches = Math.ceil(total / batchSize);
    const pct = total === 0 ? 0 : Math.round((progress / total) * 100);

    return (
        <Dialog open={open} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Bot size={20} />
                    <Typography fontWeight={700}>AI Auto-Verification Running</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ py: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{ borderRadius: 8, height: 8 }}
                    />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        {progress} / {total} questions verified
                        {totalBatches > 0 && ` • Batch ${batchesDone} / ${totalBatches}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                        Checking answer validity, Hindi translation, ambiguity, chapter fit...
                    </Typography>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

// ─── Batch AI LaTeX Fix Dialog ────────────────────────────────────────────────

function BatchLatexFixDialog({
    open,
    onClose,
    running,
    progress,
    onStart,
    onStop,
    targetName,
    totalQuestions
}) {
    const [onlyUnreviewed, setOnlyUnreviewed] = useState(false);

    const pct = progress.total === 0 ? 0 : Math.round((progress.current / progress.total) * 100);
    const isFinished = !running && progress.total > 0 && progress.current >= progress.total;

    return (
        <Dialog open={open} onClose={running ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Wand2 size={22} color="#7c3aed" />
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Auto-Fix Chapter LaTeX (AI)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Target: {targetName || "Current Selection"} ({totalQuestions} Questions)
                            </Typography>
                        </Box>
                    </Stack>
                    {!running && (
                        <IconButton size="small" onClick={onClose}>
                            <X size={18} />
                        </IconButton>
                    )}
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                {!running && !isFinished && (
                    <Stack spacing={2.5} py={1}>
                        <Alert severity="info" icon={<Sparkles size={18} />}>
                            This tool automatically scans all questions in this chapter, repairs broken LaTeX ($...$ inline and $$...$$ display math), fixes OCR artifacts, and generates comprehensive step-by-step bilingual explanations directly into MongoDB.
                        </Alert>

                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Configuration
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={onlyUnreviewed}
                                        onChange={(e) => setOnlyUnreviewed(e.target.checked)}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2">Only fix unreviewed or flagged questions</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Skips questions that have already been marked as approved.
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Paper>

                        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                            <Button variant="outlined" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<Wand2 size={16} />}
                                onClick={() => onStart(onlyUnreviewed)}
                            >
                                Start Auto-Fix ({totalQuestions} Questions)
                            </Button>
                        </Stack>
                    </Stack>
                )}

                {running && (
                    <Stack spacing={2.5} py={1}>
                        <Box>
                            <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                <Typography variant="body2" fontWeight={600}>
                                    Processing: {progress.current} of {progress.total}
                                </Typography>
                                <Typography variant="body2" fontWeight={700} color="secondary.main">
                                    {pct}%
                                </Typography>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={pct}
                                color="secondary"
                                sx={{ borderRadius: 4, height: 8 }}
                            />
                        </Box>

                        <Stack direction="row" spacing={1.5} justifyContent="space-around">
                            <Box sx={{ textAlign: "center", p: 1, borderRadius: 1.5, bgcolor: "action.hover", minWidth: 90 }}>
                                <Typography variant="h6" fontWeight={700} color="success.main">
                                    {progress.fixed}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Fixed & Saved</Typography>
                            </Box>
                            <Box sx={{ textAlign: "center", p: 1, borderRadius: 1.5, bgcolor: "action.hover", minWidth: 90 }}>
                                <Typography variant="h6" fontWeight={700} color="error.main">
                                    {progress.failed}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Errors</Typography>
                            </Box>
                            <Box sx={{ textAlign: "center", p: 1, borderRadius: 1.5, bgcolor: "action.hover", minWidth: 90 }}>
                                <Typography variant="h6" fontWeight={700} color="text.secondary">
                                    {Math.max(0, progress.total - progress.current)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Remaining</Typography>
                            </Box>
                        </Stack>

                        {progress.activeText && (
                            <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 2, borderLeft: '3px solid', borderColor: 'secondary.main' }}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Current Operation:
                                </Typography>
                                <Typography variant="body2" noWrap fontWeight={500}>
                                    {progress.activeText}
                                </Typography>
                            </Box>
                        )}

                        {progress.log && progress.log.length > 0 && (
                            <Box sx={{ bgcolor: "grey.900", color: "grey.100", p: 1.5, borderRadius: 1.5, maxHeight: 110, overflowY: "auto" }}>
                                <Typography variant="caption" color="grey.400" display="block" mb={0.5}>
                                    Recent Activity:
                                </Typography>
                                {progress.log.map((item, idx) => (
                                    <Typography key={idx} variant="caption" display="block" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                                        • {item}
                                    </Typography>
                                ))}
                            </Box>
                        )}

                        <Stack direction="row" justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={onStop}
                            >
                                Stop Auto-Fix
                            </Button>
                        </Stack>
                    </Stack>
                )}

                {isFinished && (
                    <Stack spacing={2.5} py={1} textAlign="center" alignItems="center">
                        <CheckCircle2 size={48} color="#22c55e" />
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Chapter Auto-Fix Finished!
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mt={0.5}>
                                Successfully corrected and saved {progress.fixed} question{progress.fixed === 1 ? '' : 's'}.
                                {progress.failed > 0 && ` (${progress.failed} failed)`}
                            </Typography>
                        </Box>
                        <Button variant="contained" color="primary" onClick={onClose}>
                            Back to Reviewer
                        </Button>
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Audit Analytics Drawer ───────────────────────────────────────────────────

function AuditAnalyticsDrawer({ open, onClose, questions, reviews, aiResults }) {
    const total = questions.length;
    const approved = Object.values(reviews).filter((r) => r.status === "approved").length;
    const rejected = Object.values(reviews).filter((r) => r.status === "rejected").length;
    const skipped = Object.values(reviews).filter((r) => r.skipped).length;
    const pending = total - approved - rejected - skipped;

    const aiApproved = Object.values(aiResults).filter((r) => r.verdict === "approve").length;
    const aiRejected = Object.values(aiResults).filter((r) => r.verdict === "reject").length;
    const aiReview = Object.values(aiResults).filter((r) => r.verdict === "needs_review").length;

    // Issue frequency
    const issueCount = {};
    Object.values(aiResults).forEach((r) => {
        (r.issues || []).forEach((issue) => {
            issueCount[issue] = (issueCount[issue] || 0) + 1;
        });
    });
    const topIssues = Object.entries(issueCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const Stat = ({ label, value, color }) => (
        <Box sx={{ textAlign: "center", py: 1.5, px: 2, borderRadius: 2, bgcolor: "action.hover" }}>
            <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
    );

    return (
        <Drawer anchor="right" open={open} onClose={onClose}
            PaperProps={{ sx: { width: 380, p: 0 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" px={3} pt={3} pb={1}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <BarChart3 size={20} />
                    <Typography variant="h6" fontWeight={700}>Audit Analytics</Typography>
                </Stack>
                <IconButton onClick={onClose}><X size={18} /></IconButton>
            </Stack>
            <Divider />

            <Box sx={{ overflow: "auto", p: 3 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    Human Review
                </Typography>
                <Grid container spacing={1.5} mt={0.5} mb={3}>
                    <Grid item xs={6}><Stat label="Approved" value={approved} color="success.main" /></Grid>
                    <Grid item xs={6}><Stat label="Rejected" value={rejected} color="error.main" /></Grid>
                    <Grid item xs={6}><Stat label="Pending" value={pending} color="warning.main" /></Grid>
                    <Grid item xs={6}><Stat label="Skipped" value={skipped} color="text.secondary" /></Grid>
                </Grid>

                {Object.keys(aiResults).length > 0 && (
                    <>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.07em" }}>
                            AI Verification
                        </Typography>
                        <Grid container spacing={1.5} mt={0.5} mb={3}>
                            <Grid item xs={4}><Stat label="AI Approve" value={aiApproved} color="success.main" /></Grid>
                            <Grid item xs={4}><Stat label="AI Reject" value={aiRejected} color="error.main" /></Grid>
                            <Grid item xs={4}><Stat label="AI Review" value={aiReview} color="warning.main" /></Grid>
                        </Grid>
                    </>
                )}

                {topIssues.length > 0 && (
                    <>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.07em" }}>
                            Top Issues (AI)
                        </Typography>
                        <Stack spacing={1} mt={1}>
                            {topIssues.map(([issue, count]) => (
                                <Stack key={issue} direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">{issue.replace(/-/g, " ")}</Typography>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <LinearProgress variant="determinate"
                                            value={(count / total) * 100}
                                            sx={{ width: 80, borderRadius: 8, height: 6 }} />
                                        <Typography variant="caption" fontWeight={700}>{count}</Typography>
                                    </Stack>
                                </Stack>
                            ))}
                        </Stack>
                    </>
                )}

                <Divider sx={{ my: 3 }} />
                <Typography variant="caption" color="text.secondary">
                    {total} questions loaded · Session coverage: {total > 0 ? Math.round(((approved + rejected + skipped) / total) * 100) : 0}%
                </Typography>
            </Box>
        </Drawer>
    );
}

// ─── Queue Drawer ─────────────────────────────────────────────────────────────

function QueueDrawer({ open, onClose, questions, currentIndex, reviews, flags, aiResults, onJump }) {
    const [tab, setTab] = useState("all");

    const STATUS_FILTER = {
        all: () => true,
        pending: (q) => !reviews[q._id]?.status && !reviews[q._id]?.skipped,
        approved: (q) => reviews[q._id]?.status === "approved",
        rejected: (q) => reviews[q._id]?.status === "rejected",
        skipped: (q) => reviews[q._id]?.skipped,
        flagged: (q) => flags[q._id],
        "ai-issues": (q) => aiResults[q._id]?.verdict === "reject" || aiResults[q._id]?.verdict === "needs_review",
    };

    const filtered = questions.filter(STATUS_FILTER[tab]);

    const StatusIcon = ({ qid }) => {
        const r = reviews[qid];
        const ai = aiResults[qid];
        if (r?.skipped) return <SkipForward size={14} style={{ opacity: 0.5 }} />;
        if (r?.status === "approved") return <CheckCircle2 size={14} style={{ color: "var(--mui-palette-success-main)" }} />;
        if (r?.status === "rejected") return <XCircle size={14} style={{ color: "var(--mui-palette-error-main)" }} />;
        if (ai?.verdict === "reject") return <AlertTriangle size={14} style={{ color: "var(--mui-palette-error-main)", opacity: 0.7 }} />;
        if (ai?.verdict === "needs_review") return <AlertTriangle size={14} style={{ color: "var(--mui-palette-warning-main)", opacity: 0.7 }} />;
        return <Clock size={14} style={{ opacity: 0.4 }} />;
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}
            PaperProps={{ sx: { width: 380, p: 0 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} pt={2} pb={1}>
                <Typography variant="h6" fontWeight={700}>Question Queue</Typography>
                <IconButton onClick={onClose}><X size={18} /></IconButton>
            </Stack>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 1 }}>
                <Tab value="all" label="All" />
                <Tab value="pending" label="Pending" />
                <Tab value="approved" label="Approved" />
                <Tab value="rejected" label="Rejected" />
                <Tab value="skipped" label="Skipped" />
                <Tab value="ai-issues" label="AI Issues 🤖" />
                <Tab value="flagged" label="Flagged 🚩" />
            </Tabs>
            <Divider />
            <Box sx={{ overflow: "auto", flex: 1 }}>
                {filtered.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">No questions in this category.</Typography>
                    </Box>
                ) : (
                    filtered.map((q) => {
                        const realIndex = questions.indexOf(q);
                        const active = realIndex === currentIndex;
                        const ai = aiResults[q._id];
                        return (
                            <Stack key={q._id} direction="row" alignItems="center" spacing={1.5}
                                onClick={() => { onJump(realIndex); onClose(); }}
                                sx={{
                                    px: 2, py: 1.5, cursor: "pointer",
                                    bgcolor: active ? "primary.light" : "transparent",
                                    "&:hover": { bgcolor: active ? "primary.light" : "action.hover" },
                                    borderBottom: "1px solid", borderColor: "divider",
                                }}>
                                <Typography variant="caption" sx={{ minWidth: 24, fontWeight: 700, color: "text.secondary" }}>
                                    {realIndex + 1}
                                </Typography>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13
                                    }}>
                                        {q.questionText?.en?.slice(0, 55) || "—"}…
                                    </Typography>
                                    {ai?.issues?.length > 0 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                                            {ai.issues.slice(0, 2).join(", ")}
                                        </Typography>
                                    )}
                                </Box>
                                <StatusIcon qid={q._id} />
                                {flags[q._id] && <span style={{ fontSize: 12 }}>🚩</span>}
                            </Stack>
                        );
                    })
                )}
            </Box>
        </Drawer>
    );
}

// ─── Session Summary ──────────────────────────────────────────────────────────

function SessionSummary({ stats, questions, reviews, aiResults, selection, onReset, onReviewRejected }) {
    const exportCSV = () => {
        const rows = [
            ["Question ID", "Question Text (EN)", "Human Status", "Human Remark", "AI Verdict", "AI Confidence", "AI Issues", "AI Suggested Fix", "Reviewer", "Timestamp"],
            ...questions.map((q) => {
                const r = reviews[q._id] || {};
                const ai = aiResults[q._id] || {};
                return [
                    q._id,
                    `"${(q.questionText?.en || "").slice(0, 80).replace(/"/g, '""')}"`,
                    r.status || "pending",
                    `"${(r.remark || "").replace(/"/g, '""')}"`,
                    ai.verdict || "",
                    ai.confidence ? Math.round(ai.confidence * 100) + "%" : "",
                    `"${(ai.issues || []).join("; ")}"`,
                    `"${(ai.suggested_fix || "").replace(/"/g, '""')}"`,
                    r.reviewerName || "",
                    r.timestamp || "",
                ];
            }),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        const filenameTitle = selection.type === "mocktest"
            ? (selection.mockTest?.title || selection.title || "mocktest").replace(/[^a-zA-Z0-9_-]/g, "_")
            : (selection.selectedSubject?.name || "questions");
        a.download = `audit-${filenameTitle}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const aiRejected = Object.values(aiResults).filter((r) => r.verdict === "reject").length;

    return (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 3, mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <CheckCircle2 size={20} />
                <Typography variant="h6" fontWeight={700}>Audit Session Complete</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={1}>
                {stats.approved + stats.rejected} reviewed — {stats.approved} approved, {stats.rejected} rejected, {stats.skipped} skipped
            </Typography>
            {aiRejected > 0 && (
                <Typography variant="body2" color="error.main" mb={2}>
                    ⚠️ {aiRejected} questions flagged as rejected by AI — review before publishing.
                </Typography>
            )}
            <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                <Button variant="outlined" startIcon={<Download size={15} />} onClick={exportCSV}>
                    Export Audit CSV
                </Button>
                {stats.rejected > 0 && (
                    <Button variant="outlined" color="error" startIcon={<RotateCcw size={15} />} onClick={onReviewRejected}>
                        Review Rejected Again
                    </Button>
                )}
                <Button variant="outlined" startIcon={<ChevronLeft size={15} />} onClick={onReset}>
                    {selection.type === "mocktest" ? "Change Mock Test" : "Change Chapter"}
                </Button>
            </Stack>
        </Card>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuestionQualityAudit() {
    const { user } = useAuth();

    const [selection, setSelection] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [reviews, setReviews] = useState({});
    const [aiResults, setAiResults] = useState({});

    const [lang, setLang] = useState("en");
    const [splitView, setSplitView] = useState(false);
    const [flags, setFlags] = useState({});
    const [queueOpen, setQueueOpen] = useState(false);
    const [analyticsOpen, setAnalyticsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [sessionDone, setSessionDone] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isFixingLatex, setIsFixingLatex] = useState(false);

    // Auto-verify state
    const [autoVerifying, setAutoVerifying] = useState(false);
    const [verifyProgress, setVerifyProgress] = useState(0);
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const BATCH_SIZE = 10;

    // Batch AI LaTeX Fix State
    const [batchFixOpen, setBatchFixOpen] = useState(false);
    const [batchFixRunning, setBatchFixRunning] = useState(false);
    const [batchFixProgress, setBatchFixProgress] = useState({
        current: 0,
        total: 0,
        fixed: 0,
        failed: 0,
        activeText: "",
        log: []
    });
    const batchFixAbortRef = useRef(false);

    const currentQuestion = questions[currentIndex] || null;
    const currentReview = reviews[currentQuestion?._id] || { status: null, remark: "" };
    const currentAI = aiResults[currentQuestion?._id] || null;

    const stats = {
        approved: Object.values(reviews).filter((r) => r.status === "approved").length,
        rejected: Object.values(reviews).filter((r) => r.status === "rejected").length,
        skipped: Object.values(reviews).filter((r) => r.skipped).length,
        pending: questions.length - Object.values(reviews).filter((r) => r.status || r.skipped).length,
        aiVerified: Object.keys(aiResults).length,
    };

    // Reset Edit State on Navigation
    useEffect(() => {
        setIsEditing(false);
        setEditForm(null);
    }, [currentIndex]);

    // Setup Edit Form data
    useEffect(() => {
        if (isEditing && currentQuestion) {
            const rawMA = (currentQuestion.modelAnswer !== undefined && currentQuestion.modelAnswer !== null && currentQuestion.modelAnswer !== "")
                ? currentQuestion.modelAnswer
                : currentQuestion.explanation;

            const parsedMA = typeof rawMA === 'string'
                ? { en: rawMA, hi: '' }
                : (rawMA || { en: '', hi: '' });

            setEditForm({
                questionType: currentQuestion.questionType || 'MCQ',
                questionText: currentQuestion.questionText || { en: '', hi: '' },
                options: currentQuestion.options && currentQuestion.options.length >= 4
                    ? [...currentQuestion.options]
                    : [{ en: '', hi: '' }, { en: '', hi: '' }, { en: '', hi: '' }, { en: '', hi: '' }],
                correctOptionIndex: currentQuestion.correctOptionIndex ?? -1,
                modelAnswer: { en: parsedMA.en || '', hi: parsedMA.hi || '' },
                explanation: currentQuestion.explanation || { en: parsedMA.en || '', hi: parsedMA.hi || '' },
                marks: currentQuestion.marks || 1
            });
        }
    }, [isEditing, currentQuestion]);

    // URL parameters check on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode");
        const testId = params.get("testId");
        const title = params.get("title");

        if (mode === "mocktest" && testId) {
            setSelection({
                type: "mocktest",
                testId,
                title: title ? decodeURIComponent(title) : "Mock Test",
            });
            return;
        }

        const cls = params.get("class");
        const subjectId = params.get("subject");
        const chapterId = params.get("chapter");
        if (cls && subjectId) {
            setSelection({
                type: "chapter",
                selectedClass: Number(cls),
                selectedSubject: { _id: subjectId, name: params.get("subjectName") || subjectId },
                selectedChapter: chapterId && chapterId !== "all" ? { _id: chapterId, name: params.get("chapterName") || chapterId } : null,
            });
        }
    }, []);

    // ── Fetch questions ──
    const fetchQuestions = async (sel) => {
        setLoadingQuestions(true);
        setCurrentIndex(0);
        try {
            let qs = [];
            let key = "";

            if (sel.type === "mocktest") {
                const testId = sel.testId || sel.mockTest?._id;
                const res = await fetch(`${API_BASE_URL}/tests/${testId}/review-questions`, {
                    headers: authHeaders(),
                });
                if (!res.ok) throw new Error("Failed to load mock test questions");
                const data = await res.json();
                qs = data.questions || [];
                if (data.test && !sel.mockTest) {
                    setSelection((prev) => ({ ...prev, mockTest: data.test }));
                }
                key = mockTestSessionKey(testId);
            } else {
                const params = new URLSearchParams({ subjectId: sel.selectedSubject._id });
                if (sel.selectedChapter?._id) params.set("chapterId", sel.selectedChapter._id);
                const res = await fetch(`${API_BASE_URL}/utility/question?${params}`, { headers: authHeaders() });
                const data = await res.json();
                qs = data.data || data || [];
                key = sessionKey(sel.selectedClass, sel.selectedSubject._id, sel.selectedChapter?._id || "all");
            }

            setQuestions(qs);

            // Pre-fill reviews from DB audit records if present
            const dbReviews = {};
            qs.forEach((q) => {
                if (q.audit?.status) {
                    dbReviews[q._id] = {
                        status: q.audit.status,
                        remark: q.audit.remark || "",
                        reviewedBy: q.audit.reviewedBy,
                        reviewerName: q.audit.reviewerName,
                        timestamp: q.audit.timestamp,
                        existingStatus: q.audit.status,
                        existingReviewer: q.audit.reviewerName,
                        existingDate: q.audit.timestamp,
                    };
                }
            });

            const saved = loadSession(key);
            setReviews({ ...dbReviews, ...(saved.reviews || {}) });
            if (saved.currentIndex !== undefined && saved.currentIndex < qs.length) {
                setCurrentIndex(saved.currentIndex);
            }
            if (saved.flags) setFlags(saved.flags);
            if (saved.aiResults) setAiResults(saved.aiResults);
        } catch (err) {
            console.error("Failed to load questions:", err);
            toast.error("Failed to load questions");
        } finally {
            setLoadingQuestions(false);
        }
    };

    useEffect(() => { if (selection) fetchQuestions(selection); }, [selection]);

    // Session persistence
    useEffect(() => {
        if (!selection || !questions.length) return;
        const key = selection.type === "mocktest"
            ? mockTestSessionKey(selection.testId || selection.mockTest?._id)
            : sessionKey(selection.selectedClass, selection.selectedSubject?._id, selection.selectedChapter?._id || "all");
        saveSession(key, { reviews, currentIndex, flags, aiResults });
    }, [reviews, currentIndex, flags, aiResults, selection, questions.length]);


    // ── Edit Handlers ──
    const handleAIFixLatex = async () => {
        setIsFixingLatex(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                questionType: editForm.questionType,
                questionText: editForm.questionText,
                explanation: editForm.modelAnswer || editForm.explanation,
                correctOptionIndex: editForm.correctOptionIndex,
            };
            if (editForm.questionType === 'MCQ') {
                payload.options = editForm.options;
            }

            const res = await fetch(`${API_BASE_URL}/utility/ai/fix-latex`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to fix LaTeX. Server returned an error.");

            const data = await res.json();
            const returnedAnswer = data.modelAnswer || data.explanation;

            setEditForm(prev => ({
                ...prev,
                questionText: data.questionText || prev.questionText,
                options: prev.questionType === 'MCQ' ? (data.options || prev.options) : prev.options,
                correctOptionIndex: data.correctOptionIndex !== undefined ? data.correctOptionIndex : prev.correctOptionIndex,
                modelAnswer: returnedAnswer || prev.modelAnswer,
                explanation: data.explanation || returnedAnswer || prev.explanation,
            }));
            toast.success("AI finished correcting LaTeX syntax.");
        } catch (error) {
            console.error("AI Fix Error:", error);
            toast.error("Failed to fix LaTeX via AI.");
        } finally {
            setIsFixingLatex(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editForm.questionText.en.trim() && !editForm.questionText.hi.trim()) {
            return toast.error("Question text cannot be empty.");
        }

        setIsSavingEdit(true);
        try {
            const token = localStorage.getItem('token');
            const body = { ...editForm, marks: parseInt(editForm.marks) };

            if (body.questionType === 'MCQ') {
                body.options = body.options.filter(opt => opt.en.trim() !== '' || opt.hi.trim() !== '');
            } else {
                delete body.options;
                delete body.correctOptionIndex;
            }

            if (editForm.modelAnswer) {
                body.modelAnswer = editForm.modelAnswer;
                body.explanation = editForm.modelAnswer;
            }

            const res = await fetch(`${API_BASE_URL}/utility/question/${currentQuestion._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.message || "Failed to update question in database");
            }

            const updatedQuestion = await res.json();

            // Update the local list so the UI reflects changes immediately
            setQuestions(prev => {
                const updated = [...prev];
                updated[currentIndex] = { ...updated[currentIndex], ...updatedQuestion, ...body };
                return updated;
            });

            setIsEditing(false);
            toast.success("Question updated in database successfully!");
        } catch (error) {
            console.error("Save Edit Error:", error);
            toast.error(error.message || "Failed to save edited question.");
        } finally {
            setIsSavingEdit(false);
        }
    };


    // ── Auto-verify via backend ──
    const handleAutoVerify = useCallback(async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!questions || !questions.length) return;

        setAutoVerifying(true);
        setVerifyProgress(0);
        setVerifyDialogOpen(true);

        try {
            const body = {
                questionIds: questions.map(q => q._id || q.id),
                batchSize: BATCH_SIZE
            };

            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const res = await fetch(`${API_BASE_URL}/questions/auto-verify`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server error ${res.status}: ${text}`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const messages = buffer.split('\n\n');
                buffer = messages.pop() || '';

                for (const msg of messages) {
                    if (msg.trim().startsWith('data:')) {
                        const dataStr = msg.replace(/^data:\s*/, '').trim();
                        if (!dataStr) continue;

                        try {
                            const data = JSON.parse(dataStr);

                            if (data.type === 'progress') {
                                setVerifyProgress(data.done);
                                if (data.results && data.results.length > 0) {
                                    setAiResults(prev => {
                                        const newMap = { ...prev };
                                        data.results.forEach(r => { newMap[r._id || r.id] = r; });
                                        return newMap;
                                    });
                                }
                            }
                            else if (data.type === 'complete') {
                                setAiResults(prev => {
                                    const newMap = { ...prev };
                                    data.results.forEach(r => { newMap[r._id || r.id] = r; });
                                    return newMap;
                                });
                                toast.success(`AI done: ${data.summary.approved} approved, ${data.summary.rejected} rejected`);
                            }
                            else if (data.type === 'error') {
                                throw new Error(data.message);
                            }
                        } catch (e) {
                            console.warn('[AutoVerify] Failed to parse JSON chunk:', dataStr);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[AutoVerify] Stream failed:', err);
            toast.error(`Auto-verify failed: ${err.message}`);
        } finally {
            setAutoVerifying(false);
            setTimeout(() => setVerifyDialogOpen(false), 600);
        }
    }, [questions, API_BASE_URL]);

    // ── Batch Auto-Fix Chapter LaTeX ──
    const handleStartBatchFix = async (onlyUnreviewed = false) => {
        let targetQuestions = questions;
        if (onlyUnreviewed) {
            targetQuestions = questions.filter(q => !reviews[q._id]?.status || flags[q._id]);
        }
        if (!targetQuestions.length) {
            toast.info("No questions to fix matching the chosen criteria.");
            return;
        }

        setBatchFixRunning(true);
        batchFixAbortRef.current = false;
        setBatchFixProgress({
            current: 0,
            total: targetQuestions.length,
            fixed: 0,
            failed: 0,
            activeText: "Starting batch LaTeX fix...",
            log: []
        });

        const token = localStorage.getItem("token");
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };

        let processedCount = 0;
        let fixedCount = 0;
        let failedCount = 0;
        const concurrency = 2;
        let nextIndex = 0;

        const runWorker = async () => {
            while (nextIndex < targetQuestions.length && !batchFixAbortRef.current) {
                const indexToProcess = nextIndex++;
                const q = targetQuestions[indexToProcess];
                const qId = q._id || q.id;

                setBatchFixProgress(prev => ({
                    ...prev,
                    activeText: `Q#${indexToProcess + 1}: ${(q.questionText?.en || q.questionText?.hi || "").substring(0, 50)}...`
                }));

                try {
                    const res = await fetch(`${API_BASE_URL}/utility/ai/fix-and-save-question/${qId}`, {
                        method: "POST",
                        headers
                    });

                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}`);
                    }

                    const updatedQuestion = await res.json();
                    fixedCount++;

                    // Dynamically update the questions array in state
                    setQuestions(prev => prev.map(item => (item._id === qId ? updatedQuestion : item)));

                    setBatchFixProgress(prev => ({
                        ...prev,
                        fixed: fixedCount,
                        log: [`Q#${indexToProcess + 1} fixed & saved`, ...prev.log.slice(0, 4)]
                    }));
                } catch (err) {
                    console.error(`Failed to fix question ${qId}:`, err);
                    failedCount++;
                    setBatchFixProgress(prev => ({
                        ...prev,
                        failed: failedCount,
                        log: [`Q#${indexToProcess + 1} error: ${err.message}`, ...prev.log.slice(0, 4)]
                    }));
                } finally {
                    processedCount++;
                    setBatchFixProgress(prev => ({
                        ...prev,
                        current: processedCount
                    }));
                }
            }
        };

        const workers = [];
        for (let i = 0; i < Math.min(concurrency, targetQuestions.length); i++) {
            workers.push(runWorker());
        }
        await Promise.all(workers);

        setBatchFixRunning(false);
        if (batchFixAbortRef.current) {
            toast.warning(`Auto-fix stopped. ${fixedCount} questions were saved.`);
        } else {
            toast.success(`Batch LaTeX fix completed! ${fixedCount} fixed, ${failedCount} errors.`);
        }
    };

    const handleStopBatchFix = () => {
        batchFixAbortRef.current = true;
        setBatchFixRunning(false);
    };

    // ── Navigation ──
    const navigate = useCallback((dir) => {
        // Prevent accidental navigation if there are unsaved edits
        if (isEditing) {
            const confirmLeave = window.confirm("You have unsaved edits. Discard them?");
            if (!confirmLeave) return;
        }
        setCurrentIndex((i) => Math.max(0, Math.min(questions.length - 1, i + dir)));
    }, [questions.length, isEditing]);

    const updateReview = useCallback((qid, patch) => {
        if (!qid) return;
        setReviews((prev) => ({
            ...prev,
            [qid]: { ...{ status: null, remark: "", ...prev[qid] }, ...patch },
        }));
    }, []);

    const submitReview = useCallback(async (qid, advance) => {
        const r = reviews[qid] || {};
        if (!r.status) return;
        setSubmitting(true);
        try {
            const body = {
                status: r.status,
                remark: r.remark,
                reviewedBy: user?._id || user?.userId,
                reviewerName: user?.name,
                timestamp: new Date().toISOString(),
                aiVerdict: aiResults[qid]?.verdict || null,
                aiIssues: aiResults[qid]?.issues || [],
            };

            try {
                await fetch(`${API_BASE_URL}/utility/question/${qid}/review`, {
                    method: "PATCH",
                    headers: authHeaders(),
                    body: JSON.stringify(body),
                });
            } catch {
                localStorage.setItem(`review_${qid}`, JSON.stringify(body));
            }

            setReviews((prev) => ({ ...prev, [qid]: { ...prev[qid], ...body } }));
            toast.success(r.status === "approved" ? "✅ Approved!" : "❌ Rejected");

            if (advance) {
                setCurrentIndex((prev) => {
                    const next = prev + 1;
                    if (next >= questions.length) { setSessionDone(true); return prev; }
                    return next;
                });
            }
        } catch { toast.error("Failed to save review"); }
        finally { setSubmitting(false); }
    }, [reviews, user, questions.length, aiResults]);

    // ── Keyboard shortcuts ──
    useEffect(() => {
        const handler = (e) => {
            // Disable shortcuts if we are editing or typing in a field
            if (isEditing || e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;

            if (e.key === "ArrowRight") navigate(1);
            else if (e.key === "ArrowLeft") navigate(-1);
            else if (e.key === "a" || e.key === "A") updateReview(currentQuestion?._id, { status: "approved" });
            else if (e.key === "r" || e.key === "R") updateReview(currentQuestion?._id, { status: "rejected" });
            else if (e.key === "Enter") submitReview(currentQuestion?._id, true);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [currentQuestion, navigate, updateReview, submitReview, isEditing]);

    const handleSkip = () => {
        const qid = currentQuestion?._id;
        if (!qid) return;
        setReviews((prev) => ({ ...prev, [qid]: { ...prev[qid], skipped: true } }));
        const next = currentIndex + 1;
        if (next >= questions.length) setSessionDone(true);
        else setCurrentIndex(next);
    };

    const handleLangChange = (v) => {
        if (v === "split") { setSplitView((s) => !s); }
        else { setSplitView(false); setLang(v); }
    };

    const handleResetSelection = () => {
        window.history.replaceState({}, "", window.location.pathname);
        setSelection(null);
        setSessionDone(false);
        setQuestions([]);
        setReviews({});
        setAiResults({});
        setFlags({});
        setCurrentIndex(0);
    };

    // ── Setup screen ──
    if (!selection) {
        return (
            <AuditSetupHub
                onStartSubjectChapter={(sel) => {
                    setSelection({ type: "chapter", ...sel });
                    setSessionDone(false);
                    setReviews({});
                    setAiResults({});
                }}
                onStartMockTest={(sel) => {
                    setSelection(sel);
                    setSessionDone(false);
                    setReviews({});
                    setAiResults({});
                }}
            />
        );
    }

    if (loadingQuestions) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <CircularProgress />
                <Typography mt={2} color="text.secondary">Loading questions…</Typography>
            </Box>
        );
    }

    if (!questions.length) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary">No questions found.</Typography>
                <Button sx={{ mt: 2 }} onClick={handleResetSelection} startIcon={<ChevronLeft size={16} />}>Change Selection</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1280, mx: "auto" }}>
            {/* Top bar */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
                {selection.type === "mocktest" ? (
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <IconButton size="small" onClick={handleResetSelection}><ChevronLeft size={18} /></IconButton>
                        <ShieldCheck size={20} />
                        <Typography variant="h6" fontWeight={700}>Mock Test Review</Typography>
                        <Chip
                            label={selection.mockTest?.title || selection.title || "Mock Test"}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 700 }}
                        />
                        {(selection.mockTest?.studentClass || selection.studentClass) && (
                            <Chip label={`Class ${selection.mockTest?.studentClass || selection.studentClass}`} size="small" />
                        )}
                        {selection.mockTest?.board && (
                            <Chip label={selection.mockTest.board} size="small" variant="outlined" />
                        )}
                        <Chip label={`${questions.length} Questions`} size="small" variant="outlined" />
                    </Stack>
                ) : (
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <IconButton size="small" onClick={handleResetSelection}><ChevronLeft size={18} /></IconButton>
                        <ShieldCheck size={20} />
                        <Typography variant="h6" fontWeight={700}>Quality Audit</Typography>
                        <Chip label={`Class ${selection.selectedClass}`} size="small" />
                        <Chip label={selection.selectedSubject?.name} size="small" variant="outlined" />
                        {selection.selectedChapter && <Chip label={selection.selectedChapter.name} size="small" variant="outlined" />}
                        <Chip label={`${questions.length} Questions`} size="small" variant="outlined" />
                    </Stack>
                )}
                <Stack direction="row" spacing={1}>
                    <Button size="small" startIcon={<BarChart3 size={15} />} onClick={() => setAnalyticsOpen(true)} variant="outlined">
                        Analytics
                    </Button>
                    <Badge badgeContent={Object.values(aiResults).filter((r) => r.verdict !== "approve").length || null} color="warning">
                        <Button size="small" startIcon={<List size={15} />} onClick={() => setQueueOpen(true)} variant="outlined">
                            Queue ({questions.length})
                        </Button>
                    </Badge>
                </Stack>
            </Stack>

            {/* Stats + Auto Verify + Auto Fix */}
            <StatsBar
                stats={stats}
                autoVerifying={autoVerifying}
                onAutoVerify={handleAutoVerify}
                onOpenBatchFix={() => setBatchFixOpen(true)}
                batchFixing={batchFixRunning}
                batchProgress={batchFixProgress}
                totalQuestions={questions.length}
            />

            {/* Session complete banner */}
            {sessionDone && (
                <SessionSummary
                    stats={stats}
                    questions={questions}
                    reviews={reviews}
                    aiResults={aiResults}
                    selection={selection}
                    onReset={handleResetSelection}
                    onReviewRejected={() => {
                        const firstRejected = questions.findIndex((q) => reviews[q._id]?.status === "rejected");
                        if (firstRejected >= 0) { setCurrentIndex(firstRejected); setSessionDone(false); }
                    }}
                />
            )}

            {/* Main 2-col layout */}
            <Grid container spacing={2} alignItems="stretch">
                <Grid item xs={12} md={7}>
                    <QuestionCard
                        question={currentQuestion}
                        index={currentIndex}
                        total={questions.length}
                        lang={lang}
                        onLangChange={handleLangChange}
                        splitView={splitView}
                        flagged={!!flags[currentQuestion?._id]}
                        aiResult={currentAI}
                        onFlag={() => {
                            const qid = currentQuestion?._id;
                            setFlags((f) => ({ ...f, [qid]: !f[qid] }));
                        }}
                        // Edit Props Passed Down
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        onSaveEdit={handleSaveEdit}
                        isSaving={isSavingEdit}
                        onAIFix={handleAIFixLatex}
                        isFixingLatex={isFixingLatex}
                    />
                </Grid>
                <Grid item xs={12} md={5}>
                    <AuditPanel
                        review={currentReview}
                        onReviewChange={(patch) => updateReview(currentQuestion?._id, patch)}
                        onSubmit={() => submitReview(currentQuestion?._id, false)}
                        onSubmitNext={() => submitReview(currentQuestion?._id, true)}
                        onSkip={handleSkip}
                        submitting={submitting}
                        skippedCount={stats.skipped}
                        aiResult={currentAI}
                        question={currentQuestion}
                        disableActions={isEditing} // Block human review while editing
                    />
                </Grid>
            </Grid>

            {/* Sticky nav bar */}
            <Paper elevation={0} sx={{
                position: "sticky", bottom: 0, mt: 3, py: 1.5, px: 2,
                borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2,
            }}>
                <IconButton onClick={() => navigate(-1)} disabled={currentIndex === 0} aria-label="Previous">
                    <ChevronLeft size={20} />
                </IconButton>
                <Box sx={{ flex: 1, maxWidth: 480, textAlign: "center" }}>
                    <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                        {currentIndex + 1} / {questions.length}
                        {currentAI && (
                            <Chip
                                label={`AI: ${currentAI.verdict?.replace("_", " ")}`}
                                size="small"
                                color={VERDICT_COLOR[currentAI.verdict]}
                                sx={{ ml: 1, height: 18, fontSize: 10 }}
                            />
                        )}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={((currentIndex + 1) / questions.length) * 100}
                        sx={{ borderRadius: 8, height: 6 }}
                    />
                </Box>
                <IconButton onClick={() => navigate(1)} disabled={currentIndex === questions.length - 1} aria-label="Next">
                    <ChevronRight size={20} />
                </IconButton>
            </Paper>

            {/* Drawers & dialogs */}
            <QueueDrawer
                open={queueOpen}
                onClose={() => setQueueOpen(false)}
                questions={questions}
                currentIndex={currentIndex}
                reviews={reviews}
                flags={flags}
                aiResults={aiResults}
                onJump={(i) => {
                    if (isEditing && !window.confirm("You have unsaved edits. Discard them?")) return;
                    setCurrentIndex(i);
                }}
            />
            <AuditAnalyticsDrawer
                open={analyticsOpen}
                onClose={() => setAnalyticsOpen(false)}
                questions={questions}
                reviews={reviews}
                aiResults={aiResults}
            />
            <AutoVerifyDialog
                open={verifyDialogOpen}
                progress={verifyProgress}
                total={questions.length}
                batchSize={BATCH_SIZE}
            />
            <BatchLatexFixDialog
                open={batchFixOpen}
                onClose={() => setBatchFixOpen(false)}
                running={batchFixRunning}
                progress={batchFixProgress}
                onStart={handleStartBatchFix}
                onStop={handleStopBatchFix}
                targetName={
                    selection.type === "mocktest"
                        ? (selection.mockTest?.title || selection.title || "Mock Test")
                        : (selection.selectedChapter?.name
                            ? `${selection.selectedSubject?.name || ''} - ${selection.selectedChapter.name}`
                            : selection.selectedSubject?.name || "Chapter")
                }
                totalQuestions={questions.length}
            />
        </Box>
    );
}