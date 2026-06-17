import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Box, Typography, Card, CardContent, Chip, LinearProgress,
    IconButton, Tooltip, Button, TextField, CircularProgress,
    Drawer, Tabs, Tab, Divider, Stack, Grid, Paper,
    ToggleButtonGroup, ToggleButton, Collapse, Alert, Badge,
    Dialog, DialogTitle, DialogContent, DialogActions,
    MenuItem, Select, FormControl, InputLabel, Accordion,
    AccordionSummary, AccordionDetails,
} from "@mui/material";
import {
    ThumbsUp, ThumbsDown, Flag, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, Clock, SkipForward, ClipboardCheck,
    BookOpen, Layers, ChevronDown, ChevronUp, SplitSquareHorizontal,
    Info, Download, RotateCcw, List, X, Sparkles, AlertTriangle,
    ShieldCheck, Languages, Copy, Zap, BarChart3, Bot,
    CheckCheck, Hash, FileText, PenLine, RefreshCcw, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import LatexRenderer from "../components/LatexRenderer";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// ─── Helpers ────────────────────────────────────────────────────────────────

const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const DIFFICULTY_COLOR = { easy: "success", medium: "warning", hard: "error" };
const OPTION_LABELS = ["A", "B", "C", "D"];

const QUICK_REMARKS = [
    "Incorrect answer",
    "Duplicate question",
    "LaTeX formatting broken",
    "Hindi translation missing",
    "Hindi translation mismatch",
    "Explanation insufficient",
    "Ambiguous stem",
    "Wrong chapter",
    "Poor quality",
    "Wrong Hindi terminology",
    "Good question ✓",
];

// Issue tag → severity mapping
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

    const BATCHSIZE = 10;

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

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats, autoVerifyStatus, onAutoVerify, autoVerifying }) {
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
                disabled={autoVerifying}
                color="primary"
            >
                {autoVerifying ? `Verifying…` : "Auto Verify All"}
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

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({ question, index, total, lang, onLangChange, flagged, onFlag, splitView, aiResult }) {
    const [explanationOpen, setExplanationOpen] = useState(true);
    const [issuesOpen, setIssuesOpen] = useState(true);
    if (!question) return null;

    const qText = question.questionText?.[lang] || question.questionText?.en || "";
    const explanation = question.explanation?.[lang] || question.explanation?.en || "";
    const renderOptionText = (opt) => opt?.[lang] || opt?.en || "";

    return (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
                {/* Header row */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={0.5}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {index + 1} / {total}
                        </Typography>
                        <Chip label={`Class ${question.studentClass || "N/A"}`} size="small" />
                        <Chip label={question.subjectId?.name || "Subject"} size="small" variant="outlined" />
                        <Chip label={question.chapterId?.name || "Chapter"} size="small" variant="outlined" />
                        <Chip label={question.difficulty || "medium"} size="small"
                            color={DIFFICULTY_COLOR[question.difficulty || "medium"]} />
                        <Chip label={`${question.marks || 1}m`} size="small" variant="outlined" />
                        {aiResult?.verdict && (
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
                        <Tooltip title="Toggle split EN/HI view">
                            <IconButton size="small" onClick={() => onLangChange("split")} color={splitView ? "primary" : "default"}>
                                <SplitSquareHorizontal size={16} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={flagged ? "Remove flag" : "Flag for re-check"}>
                            <IconButton size="small" onClick={onFlag} color={flagged ? "warning" : "default"}>
                                <Flag size={16} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                <LinearProgress variant="determinate" value={((index + 1) / total) * 100}
                    sx={{ mb: 2, borderRadius: 8, height: 4 }} />

                {/* AI Verdict Banner */}
                <AIVerdictBanner aiResult={aiResult} />

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

                {/* Explanation */}
                <Divider sx={{ mb: 1.5 }} />
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Info size={15} style={{ opacity: 0.5 }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>EXPLANATION</Typography>
                    </Stack>
                    <IconButton size="small" onClick={() => setExplanationOpen((o) => !o)}>
                        {explanationOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </IconButton>
                </Stack>
                <Collapse in={explanationOpen}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }} component="div">
                        <LatexRenderer text={explanation || "No explanation provided."} />
                    </Typography>
                </Collapse>

                {/* ID strip */}
                <Stack direction="row" spacing={2} mt={2}>
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
    submitting, skippedCount, aiResult, question
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
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}>
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

// AI Verification Progress Dialog
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
        a.download = `audit-${selection.selectedSubject?.name || "questions"}-${new Date().toISOString().slice(0, 10)}.csv`;
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
                    Change Chapter
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

    // Auto-verify state
    const [autoVerifying, setAutoVerifying] = useState(false);
    const [verifyProgress, setVerifyProgress] = useState(0);
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const BATCHSIZE = 10;
    const BATCH_SIZE = 10;

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

    // ── Fetch questions ──
    const fetchQuestions = async (sel) => {
        setLoadingQuestions(true);
        setCurrentIndex(0);
        try {
            const params = new URLSearchParams({ subjectId: sel.selectedSubject._id });
            if (sel.selectedChapter?._id) params.set("chapterId", sel.selectedChapter._id);
            const res = await fetch(`${API_BASE_URL}/utility/question?${params}`, { headers: authHeaders() });
            const data = await res.json();
            const qs = data.data || data || [];
            setQuestions(qs);

            const key = sessionKey(sel.selectedClass, sel.selectedSubject._id, sel.selectedChapter?._id || "all");
            const saved = loadSession(key);
            if (saved.reviews) setReviews(saved.reviews);
            if (saved.currentIndex) setCurrentIndex(saved.currentIndex);
            if (saved.flags) setFlags(saved.flags);
            if (saved.aiResults) setAiResults(saved.aiResults);
        } catch { toast.error("Failed to load questions"); }
        finally { setLoadingQuestions(false); }
    };

    useEffect(() => { if (selection) fetchQuestions(selection); }, [selection]);

    // Session persistence
    useEffect(() => {
        if (!selection || !questions.length) return;
        const key = sessionKey(selection.selectedClass, selection.selectedSubject._id, selection.selectedChapter?._id || "all");
        saveSession(key, { reviews, currentIndex, flags, aiResults });
    }, [reviews, currentIndex, flags, aiResults, selection, questions.length]);

    // ── Auto-verify via backend ──
    // Auto-verify via backend
    const handleAutoVerify = useCallback(async (e) => {
        // 1. Prevent accidental form submission / page reloads
        if (e && e.preventDefault) e.preventDefault();

        if (!questions || !questions.length) return;

        setAutoVerifying(true);
        setVerifyProgress(0);
        setVerifyDialogOpen(true);

        try {
            const body = {
                // 2. Safe fallback to _id since Mongoose .lean() strips the .id virtual
                questionIds: questions.map(q => q._id || q.id),
                batchSize: BATCHSIZE
            };

            // 3. Fetch token dynamically (module-level constants can hold stale/null tokens)
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            console.log('[AutoVerify] Calling backend...', body);

            const res = await fetch(`${API_BASE_URL}/questions/auto-verify`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server error ${res.status}: ${text}`);
            }

            console.log('[AutoVerify] Stream connected, reading chunks...');

            // 4. Use raw TextDecoder instead of TextDecoderStream for 100% browser compatibility
            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const messages = buffer.split('\n\n');

                // Keep the last incomplete chunk in the buffer
                buffer = messages.pop() || '';

                for (const msg of messages) {
                    if (msg.trim().startsWith('data:')) {
                        // Safely strip the "data:" prefix
                        const dataStr = msg.replace(/^data:\s*/, '').trim();
                        if (!dataStr) continue;

                        try {
                            const data = JSON.parse(dataStr);
                            console.log('[AutoVerify] Parsed chunk:', data.type);

                            if (data.type === 'start') {
                                console.log(`Processing total of ${data.total} questions`);
                            }
                            else if (data.type === 'progress') {
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
    }, [questions, API_BASE_URL, BATCHSIZE]);
    // ── Navigation ──
    const navigate = useCallback((dir) => {
        setCurrentIndex((i) => Math.max(0, Math.min(questions.length - 1, i + dir)));
    }, [questions.length]);

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
            if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
            if (e.key === "ArrowRight") navigate(1);
            else if (e.key === "ArrowLeft") navigate(-1);
            else if (e.key === "a" || e.key === "A") updateReview(currentQuestion?._id, { status: "approved" });
            else if (e.key === "r" || e.key === "R") updateReview(currentQuestion?._id, { status: "rejected" });
            else if (e.key === "Enter") submitReview(currentQuestion?._id, true);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [currentQuestion, navigate, updateReview, submitReview]);

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

    // ── Setup screen ──
    if (!selection) {
        return (
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                    <ShieldCheck size={24} />
                    <Typography variant="h5" fontWeight={700}>Question Quality Audit</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={4}>
                    Human review + AI verification for bilingual MCQ quality control.
                </Typography>
                <SetupWizard onStart={(sel) => {
                    setSelection(sel); setSessionDone(false);
                    setReviews({}); setAiResults({});
                }} />
            </Box>
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
                <Button sx={{ mt: 2 }} onClick={() => setSelection(null)} startIcon={<ChevronLeft size={16} />}>Change Selection</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1280, mx: "auto" }}>
            {/* Top bar */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton size="small" onClick={() => setSelection(null)}><ChevronLeft size={18} /></IconButton>
                    <ShieldCheck size={20} />
                    <Typography variant="h6" fontWeight={700}>Quality Audit</Typography>
                    <Chip label={`Class ${selection.selectedClass}`} size="small" />
                    <Chip label={selection.selectedSubject?.name} size="small" variant="outlined" />
                    {selection.selectedChapter && <Chip label={selection.selectedChapter.name} size="small" variant="outlined" />}
                </Stack>
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

            {/* Stats + Auto Verify */}
            <StatsBar
                stats={stats}
                autoVerifying={autoVerifying}
                onAutoVerify={handleAutoVerify}
            />

            {/* Session complete banner */}
            {sessionDone && (
                <SessionSummary
                    stats={stats}
                    questions={questions}
                    reviews={reviews}
                    aiResults={aiResults}
                    selection={selection}
                    onReset={() => setSelection(null)}
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
                onJump={(i) => setCurrentIndex(i)}
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
        </Box>
    );
}