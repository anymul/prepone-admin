import { useState, useEffect } from "react";
import { safeHttpUrl } from "@/lib/api";
import {
    Box,
    Button,
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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Chip,
    Skeleton,
    IconButton,
    Stack,
    Pagination,
    FormControlLabel,
    Switch,
    CircularProgress,
    Tooltip,
    Link as MuiLink,
} from "@mui/material";
import {
    Plus,
    Edit,
    Trash2,
    FileText,
    ExternalLink,
    X,
    Upload,
    BookOpen,
    Eye,
    Download,
    CheckCircle,
    Clock,
    Lock,
} from "lucide-react";

export default function RevisionNotesPage() {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";
    const TOKEN_KEY = "token";

    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Filters
    const [filter, setFilter] = useState({
        studentClass: "",
        subject: "",
        board: "",
        search: "",
    });
    const [filterSubjects, setFilterSubjects] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    // Dialogs
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);

    // Language helpers
    const getLanguageLabel = (lang) => {
        switch ((lang || "").toLowerCase()) {
            case "en":
            case "english":
                return "English";
            case "hi":
            case "hindi":
                return "Hindi";
            case "hinglish":
                return "Hinglish";
            case "bilingual":
            case "both":
                return "Bilingual";
            default:
                return lang || "Bilingual";
        }
    };

    const normalizeLangCode = (l) => {
        const val = (l || "").toLowerCase();
        if (val === "english" || val === "en") return "en";
        if (val === "hindi" || val === "hi") return "hi";
        if (val === "hinglish") return "hinglish";
        return "bilingual";
    };

    // Form state
    const initialFormState = {
        title: "",
        description: "",
        board: "both",
        studentClass: "12",
        stream: "Science",
        subjectId: "",
        chapterId: "",
        language: "en",
        tags: "",
        isPublished: true,
        isPremium: false,
    };
    const [form, setForm] = useState(initialFormState);
    const [formSubjects, setFormSubjects] = useState([]);
    const [formChapters, setFormChapters] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);

    const getAuthHeaders = (isMultipart = false) => {
        const token = localStorage.getItem(TOKEN_KEY);
        const headers = {
            "x-auth-token": token,
            Authorization: `Bearer ${token}`,
        };

        if (!isMultipart) {
            headers["Content-Type"] = "application/json";
        }
        return headers;
    };

    const handleResponse = async (res) => {
        if (res.status === 401) {
            window.location.href = "/login";
            throw new Error("Unauthorized. Please login again.");
        }
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || `Error ${res.status}: ${res.statusText}`);
        }
        return res.json();
    };

    // Load filter subjects when filter.studentClass changes
    useEffect(() => {
        let url = `${API_BASE_URL}/utility/subject`;
        if (filter.studentClass) {
            url = `${API_BASE_URL}/utility/subject/class/${filter.studentClass}`;
        }

        fetch(url, { headers: getAuthHeaders() })
            .then((res) => (res.status === 401 ? [] : res.json()))
            .then((data) => {
                setFilterSubjects(Array.isArray(data) ? data : []);
                if (filter.subject && Array.isArray(data) && !data.some((s) => s._id === filter.subject)) {
                    setFilter((f) => ({ ...f, subject: "" }));
                }
            })
            .catch((err) => console.error("Filter subjects error:", err));
    }, [filter.studentClass]);

    // Load form subjects when form.studentClass changes
    useEffect(() => {
        if (!form.studentClass) {
            setFormSubjects([]);
            return;
        }

        fetch(`${API_BASE_URL}/utility/subject/class/${form.studentClass}`, {
            headers: getAuthHeaders(),
        })
            .then((res) => (res.status === 401 ? [] : res.json()))
            .then((data) => {
                setFormSubjects(Array.isArray(data) ? data : []);
                if (form.subjectId && Array.isArray(data) && !data.some((s) => s._id === form.subjectId)) {
                    setForm((f) => ({ ...f, subjectId: "", chapterId: "" }));
                }
            })
            .catch((err) => console.error("Form subjects error:", err));
    }, [form.studentClass]);

    // Load form chapters when form.subjectId changes
    useEffect(() => {
        if (!form.subjectId) {
            setFormChapters([]);
            return;
        }

        fetch(`${API_BASE_URL}/utility/subject/${form.subjectId}/chapters`, {
            headers: getAuthHeaders(),
        })
            .then((res) => (res.status === 401 ? [] : res.json()))
            .then((data) => {
                setFormChapters(Array.isArray(data) ? data : []);
                if (form.chapterId && Array.isArray(data) && !data.some((c) => c._id === form.chapterId)) {
                    setForm((f) => ({ ...f, chapterId: "" }));
                }
            })
            .catch((err) => console.error("Form chapters error:", err));
    }, [form.subjectId]);

    // Fetch notes list with pagination & filters
    const fetchNotes = () => {
        setLoading(true);
        const params = new URLSearchParams();
        params.append("page", pagination.page);
        params.append("limit", 15);

        if (filter.board) params.append("board", filter.board);
        if (filter.studentClass) params.append("studentClass", filter.studentClass);
        if (filter.subject) params.append("subjectId", filter.subject);
        if (filter.search.trim()) params.append("search", filter.search.trim());

        fetch(`${API_BASE_URL}/revision-notes?${params.toString()}`, {
            headers: getAuthHeaders(),
        })
            .then(handleResponse)
            .then((data) => {
                setNotes(data.data || []);
                if (data.pagination) {
                    setPagination((p) => ({
                        ...p,
                        totalPages: data.pagination.totalPages || 1,
                        total: data.pagination.total || 0,
                    }));
                }
            })
            .catch((err) => console.error("Fetch notes error:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchNotes();
    }, [pagination.page, filter.board, filter.studentClass, filter.subject]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination((p) => ({ ...p, page: 1 }));
        fetchNotes();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== "application/pdf") {
                alert("Please select a valid PDF file.");
                return;
            }
            setSelectedFile(file);
        }
    };

    const openUploadDialog = () => {
        setForm(initialFormState);
        setSelectedFile(null);
        setUploadDialogOpen(true);
    };

    const openEditDialog = (note) => {
        setSelectedNote(note);
        setForm({
            title: note.title || "",
            description: note.description || "",
            board: note.board || "both",
            studentClass: String(note.studentClass || "12"),
            stream: note.stream || "Science",
            subjectId: note.subjectId?._id || note.subjectId || "",
            chapterId: note.chapterId?._id || note.chapterId || "",
            language: normalizeLangCode(note.language),
            tags: Array.isArray(note.tags) ? note.tags.join(", ") : "",
            isPublished: note.isPublished !== false,
            isPremium: note.isPremium === true,
        });
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (note) => {
        setSelectedNote(note);
        setDeleteDialogOpen(true);
    };

    // Handle Upload Note
    const handleUploadSubmit = async (e) => {
        e.preventDefault();

        if (!form.title.trim()) {
            alert("Title is required.");
            return;
        }
        if (!form.studentClass) {
            alert("Class is required.");
            return;
        }
        if (!form.subjectId) {
            alert("Subject is required.");
            return;
        }
        if (!form.chapterId) {
            alert("Chapter is required.");
            return;
        }
        if (!selectedFile) {
            alert("Please select a PDF file to upload.");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("pdf", selectedFile);
            formData.append("title", form.title.trim());
            formData.append("description", form.description.trim());
            formData.append("board", form.board);
            formData.append("studentClass", form.studentClass);
            formData.append("stream", form.stream);
            formData.append("subjectId", form.subjectId);
            formData.append("chapterId", form.chapterId);
            formData.append("language", normalizeLangCode(form.language));
            formData.append("tags", form.tags);
            formData.append("isPublished", form.isPublished);
            formData.append("isPremium", form.isPremium);

            const res = await fetch(`${API_BASE_URL}/revision-notes/upload`, {
                method: "POST",
                headers: getAuthHeaders(true),
                body: formData,
            });

            await handleResponse(res);

            setUploadDialogOpen(false);
            setSelectedFile(null);
            fetchNotes();
        } catch (error) {
            console.error("Upload error:", error);
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Edit Note
    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!form.title.trim()) {
            alert("Title is required.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/revision-notes/${selectedNote._id}`, {
                method: "PUT",
                headers: getAuthHeaders(false),
                body: JSON.stringify({
                    title: form.title.trim(),
                    description: form.description.trim(),
                    board: form.board,
                    studentClass: Number(form.studentClass),
                    stream: form.stream,
                    language: normalizeLangCode(form.language),
                    tags: form.tags,
                    isPublished: form.isPublished,
                    isPremium: form.isPremium,
                }),
            });

            await handleResponse(res);

            setEditDialogOpen(false);
            setSelectedNote(null);
            fetchNotes();
        } catch (error) {
            console.error("Edit error:", error);
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Delete Note
    const handleDeleteSubmit = async () => {
        if (!selectedNote) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/revision-notes/${selectedNote._id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });

            await handleResponse(res);

            setDeleteDialogOpen(false);
            setSelectedNote(null);
            fetchNotes();
        } catch (error) {
            console.error("Delete error:", error);
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes <= 0) return "-";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Box sx={{ maxWidth: "1400px", mx: "auto", p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Short Revision Notes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Upload and manage high-yield PDF revision notes stored on Cloudflare R2.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Plus size={16} />}
                    onClick={openUploadDialog}
                    sx={{ textTransform: "none", fontWeight: 600, px: 2.5 }}
                >
                    Upload Revision Note
                </Button>
            </Box>

            {/* Filter Card */}
            <Card variant="outlined" sx={{ mb: 3, bgcolor: "action.hover" }}>
                <CardContent>
                    <Box component="form" onSubmit={handleSearchSubmit}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Board</InputLabel>
                                <Select
                                    value={filter.board}
                                    onChange={(e) => {
                                        setFilter({ ...filter, board: e.target.value });
                                        setPagination((p) => ({ ...p, page: 1 }));
                                    }}
                                    label="Board"
                                >
                                    <MenuItem value="">All Boards</MenuItem>
                                    <MenuItem value="CBSE">CBSE</MenuItem>
                                    <MenuItem value="BSEB">BSEB</MenuItem>
                                    <MenuItem value="both">Both (CBSE & BSEB)</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel>Class</InputLabel>
                                <Select
                                    value={filter.studentClass}
                                    onChange={(e) => {
                                        setFilter({ ...filter, studentClass: e.target.value || "", subject: "" });
                                        setPagination((p) => ({ ...p, page: 1 }));
                                    }}
                                    label="Class"
                                >
                                    <MenuItem value="">All Classes</MenuItem>
                                    <MenuItem value="10">Class 10</MenuItem>
                                    <MenuItem value="11">Class 11</MenuItem>
                                    <MenuItem value="12">Class 12</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel>Subject</InputLabel>
                                <Select
                                    value={filter.subject}
                                    onChange={(e) => {
                                        setFilter({ ...filter, subject: e.target.value || "" });
                                        setPagination((p) => ({ ...p, page: 1 }));
                                    }}
                                    label="Subject"
                                >
                                    <MenuItem value="">All Subjects</MenuItem>
                                    {filterSubjects.map((s) => (
                                        <MenuItem key={s._id} value={s._id}>
                                            {s.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                size="small"
                                label="Search"
                                placeholder="Search title, tags..."
                                value={filter.search}
                                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                sx={{ minWidth: { md: 100 } }}
                            >
                                Search
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<X size={16} />}
                                onClick={() => {
                                    setFilter({ studentClass: "", subject: "", board: "", search: "" });
                                    setPagination((p) => ({ ...p, page: 1 }));
                                }}
                                sx={{ minWidth: { md: 120 } }}
                            >
                                Reset
                            </Button>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>

            {/* Notes Table Card */}
            <Card variant="outlined">
                <CardHeader
                    title={
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box>
                                <Typography variant="h6">Revision Notes Library</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Showing {notes.length} of {pagination.total} notes
                                </Typography>
                            </Box>
                        </Box>
                    }
                    sx={{ borderBottom: 1, borderColor: "divider" }}
                />
                <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: "action.hover" }}>
                                <TableRow>
                                    <TableCell>Note Details</TableCell>
                                    <TableCell>Class & Subject</TableCell>
                                    <TableCell>Board</TableCell>
                                    <TableCell>Document Info</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Analytics</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    [1, 2, 3, 4, 5].map((i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton width={180} /></TableCell>
                                            <TableCell><Skeleton width={130} /></TableCell>
                                            <TableCell><Skeleton width={70} /></TableCell>
                                            <TableCell><Skeleton width={110} /></TableCell>
                                            <TableCell><Skeleton width={80} /></TableCell>
                                            <TableCell><Skeleton width={80} /></TableCell>
                                            <TableCell align="right"><Skeleton width={90} /></TableCell>
                                        </TableRow>
                                    ))
                                ) : notes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    gap: 1.5,
                                                }}
                                            >
                                                <FileText size={36} style={{ opacity: 0.25 }} />
                                                <Typography variant="h6" color="text.secondary">
                                                    No revision notes found
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Click "Upload Revision Note" above to add your first note.
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    notes.map((note) => {
                                        const subjectName =
                                            note.subjectId?.name || note.subjectName || "Subject";
                                        const chapterName =
                                            note.chapterId?.name || note.chapterName || "";

                                        return (
                                            <TableRow key={note._id} hover>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight="600">
                                                            {note.title}
                                                        </Typography>
                                                        {note.description && (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{
                                                                    display: "-webkit-box",
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: "vertical",
                                                                    overflow: "hidden",
                                                                    maxWidth: 280,
                                                                }}
                                                            >
                                                                {note.description}
                                                            </Typography>
                                                        )}
                                                        {Array.isArray(note.tags) && note.tags.length > 0 && (
                                                            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap">
                                                                {note.tags.slice(0, 3).map((t, idx) => (
                                                                    <Chip
                                                                        key={idx}
                                                                        label={`#${t}`}
                                                                        size="small"
                                                                        sx={{ height: 18, fontSize: "0.65rem" }}
                                                                    />
                                                                ))}
                                                            </Stack>
                                                        )}
                                                    </Box>
                                                </TableCell>

                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="500">
                                                            Class {note.studentClass} • {subjectName}
                                                        </Typography>
                                                        {chapterName && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                {chapterName}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={
                                                            note.board === "both"
                                                                ? "CBSE & BSEB"
                                                                : note.board
                                                        }
                                                        size="small"
                                                        color={
                                                            note.board === "both"
                                                                ? "primary"
                                                                : note.board === "CBSE"
                                                                ? "info"
                                                                : "secondary"
                                                        }
                                                        variant="outlined"
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {note.pageCount ? `${note.pageCount} pages` : "Pages N/A"}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatBytes(note.fileSizeBytes)} • {getLanguageLabel(note.language)}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Stack spacing={0.5}>
                                                        <Chip
                                                            label={note.isPublished ? "Published" : "Draft"}
                                                            size="small"
                                                            color={note.isPublished ? "success" : "default"}
                                                            sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }}
                                                        />
                                                        {note.isPremium && (
                                                            <Chip
                                                                icon={<Lock size={10} />}
                                                                label="PRO"
                                                                size="small"
                                                                color="warning"
                                                                sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
                                                            />
                                                        )}
                                                    </Stack>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography variant="caption" display="block">
                                                        👁️ {note.viewCount || 0} views
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ⬇️ {note.downloadCount || 0} downloads
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                                        {safeHttpUrl(note.pdfUrl) && (
                                                            <Tooltip title="View PDF">
                                                                <IconButton
                                                                    size="small"
                                                                    component={MuiLink}
                                                                    href={safeHttpUrl(note.pdfUrl)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    sx={{ color: "primary.main" }}
                                                                >
                                                                    <ExternalLink size={16} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip title="Edit Metadata">
                                                            <IconButton size="small" onClick={() => openEditDialog(note)}>
                                                                <Edit size={16} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete Note">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => openDeleteDialog(note)}
                                                                color="error"
                                                            >
                                                                <Trash2 size={16} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination
                        count={pagination.totalPages}
                        page={pagination.page}
                        onChange={(e, page) => setPagination((p) => ({ ...p, page }))}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}

            {/* 1. Upload Dialog */}
            <Dialog open={uploadDialogOpen} onClose={() => !submitting && setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold" }}>Upload New Revision Note</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Upload a revision note PDF to Cloudflare R2 and configure study metadata.
                    </DialogContentText>

                    <Box component="form" onSubmit={handleUploadSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        <TextField
                            fullWidth
                            required
                            label="Note Title"
                            placeholder="e.g. Laws of Motion - Quick Summary & Formulas"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />

                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth required>
                                <InputLabel>Board</InputLabel>
                                <Select
                                    value={form.board}
                                    onChange={(e) => setForm({ ...form, board: e.target.value })}
                                    label="Board"
                                >
                                    <MenuItem value="both">Both (CBSE & BSEB)</MenuItem>
                                    <MenuItem value="CBSE">CBSE</MenuItem>
                                    <MenuItem value="BSEB">BSEB</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth required>
                                <InputLabel>Class</InputLabel>
                                <Select
                                    value={form.studentClass}
                                    onChange={(e) =>
                                        setForm({ ...form, studentClass: e.target.value, subjectId: "", chapterId: "" })
                                    }
                                    label="Class"
                                >
                                    <MenuItem value="10">Class 10</MenuItem>
                                    <MenuItem value="11">Class 11</MenuItem>
                                    <MenuItem value="12">Class 12</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>

                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth required disabled={!form.studentClass}>
                                <InputLabel>Subject</InputLabel>
                                <Select
                                    value={form.subjectId}
                                    onChange={(e) => setForm({ ...form, subjectId: e.target.value, chapterId: "" })}
                                    label="Subject"
                                >
                                    {formSubjects.map((s) => (
                                        <MenuItem key={s._id} value={s._id}>
                                            {s.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth required disabled={!form.subjectId}>
                                <InputLabel>Chapter</InputLabel>
                                <Select
                                    value={form.chapterId}
                                    onChange={(e) => setForm({ ...form, chapterId: e.target.value })}
                                    label="Chapter"
                                >
                                    {formChapters.map((c) => (
                                        <MenuItem key={c._id} value={c._id}>
                                            {c.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>

                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Stream</InputLabel>
                                <Select
                                    value={form.stream}
                                    onChange={(e) => setForm({ ...form, stream: e.target.value })}
                                    label="Stream"
                                >
                                    <MenuItem value="Science">Science</MenuItem>
                                    <MenuItem value="Commerce">Commerce</MenuItem>
                                    <MenuItem value="Arts">Arts</MenuItem>
                                    <MenuItem value="General">General</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Language</InputLabel>
                                <Select
                                    value={normalizeLangCode(form.language)}
                                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                                    label="Language"
                                >
                                    <MenuItem value="en">English</MenuItem>
                                    <MenuItem value="hi">Hindi</MenuItem>
                                    <MenuItem value="hinglish">Hinglish</MenuItem>
                                    <MenuItem value="bilingual">Bilingual</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>

                        <TextField
                            fullWidth
                            label="Tags (comma-separated)"
                            placeholder="FormulaSheet, HighYield, Revision"
                            value={form.tags}
                            onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Description (Optional)"
                            placeholder="Key topics covered, formulas included..."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />

                        {/* PDF File Picker Zone */}
                        <Box
                            sx={{
                                border: "2px dashed",
                                borderColor: selectedFile ? "primary.main" : "divider",
                                bgcolor: selectedFile ? "action.selected" : "background.paper",
                                p: 2.5,
                                borderRadius: 1.5,
                                textAlign: "center",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                "&:hover": { borderColor: "primary.main" },
                            }}
                        >
                            <input
                                accept="application/pdf"
                                style={{ display: "none" }}
                                id="upload-note-pdf-file"
                                type="file"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="upload-note-pdf-file" style={{ cursor: "pointer", width: "100%", display: "block" }}>
                                {selectedFile ? (
                                    <Stack alignItems="center" spacing={1}>
                                        <FileText size={32} color="#10b981" />
                                        <Typography variant="subtitle2" fontWeight="600">
                                            {selectedFile.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatBytes(selectedFile.size)} • Click to change PDF
                                        </Typography>
                                    </Stack>
                                ) : (
                                    <Stack alignItems="center" spacing={1}>
                                        <Upload size={32} color="#6366f1" />
                                        <Typography variant="subtitle2" fontWeight="600">
                                            Click to select a PDF document
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            PDF will be uploaded directly to Cloudflare R2
                                        </Typography>
                                    </Stack>
                                )}
                            </label>
                        </Box>

                        <Stack direction="row" spacing={3}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.isPublished}
                                        onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                                        color="success"
                                    />
                                }
                                label="Published (Live for students)"
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.isPremium}
                                        onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                                        color="warning"
                                    />
                                }
                                label="PRO Only"
                            />
                        </Stack>

                        <DialogActions sx={{ px: 0, pt: 2 }}>
                            <Button onClick={() => setUploadDialogOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={submitting || !selectedFile}
                                startIcon={submitting ? <CircularProgress size={16} /> : <Upload size={16} />}
                            >
                                {submitting ? "Uploading..." : "Upload Note"}
                            </Button>
                        </DialogActions>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* 2. Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => !submitting && setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold" }}>Edit Revision Note Details</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Update metadata for this note. (PDF document remains stored on Cloudflare R2).
                    </DialogContentText>

                    <Box component="form" onSubmit={handleEditSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        <TextField
                            fullWidth
                            required
                            label="Note Title"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />

                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth required>
                                <InputLabel>Board</InputLabel>
                                <Select
                                    value={form.board}
                                    onChange={(e) => setForm({ ...form, board: e.target.value })}
                                    label="Board"
                                >
                                    <MenuItem value="both">Both (CBSE & BSEB)</MenuItem>
                                    <MenuItem value="CBSE">CBSE</MenuItem>
                                    <MenuItem value="BSEB">BSEB</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth required>
                                <InputLabel>Class</InputLabel>
                                <Select
                                    value={form.studentClass}
                                    onChange={(e) => setForm({ ...form, studentClass: e.target.value })}
                                    label="Class"
                                >
                                    <MenuItem value="10">Class 10</MenuItem>
                                    <MenuItem value="11">Class 11</MenuItem>
                                    <MenuItem value="12">Class 12</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>

                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Stream</InputLabel>
                                <Select
                                    value={form.stream}
                                    onChange={(e) => setForm({ ...form, stream: e.target.value })}
                                    label="Stream"
                                >
                                    <MenuItem value="Science">Science</MenuItem>
                                    <MenuItem value="Commerce">Commerce</MenuItem>
                                    <MenuItem value="Arts">Arts</MenuItem>
                                    <MenuItem value="General">General</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Language</InputLabel>
                                <Select
                                    value={normalizeLangCode(form.language)}
                                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                                    label="Language"
                                >
                                    <MenuItem value="en">English</MenuItem>
                                    <MenuItem value="hi">Hindi</MenuItem>
                                    <MenuItem value="hinglish">Hinglish</MenuItem>
                                    <MenuItem value="bilingual">Bilingual</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>

                        <TextField
                            fullWidth
                            label="Tags (comma-separated)"
                            value={form.tags}
                            onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />

                        <Stack direction="row" spacing={3}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.isPublished}
                                        onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                                        color="success"
                                    />
                                }
                                label="Published"
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.isPremium}
                                        onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                                        color="warning"
                                    />
                                }
                                label="PRO Only"
                            />
                        </Stack>

                        <DialogActions sx={{ px: 0, pt: 2 }}>
                            <Button onClick={() => setEditDialogOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="contained" disabled={submitting}>
                                {submitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogActions>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* 3. Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => !submitting && setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold" }}>Delete Revision Note?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>"{selectedNote?.title}"</strong>?
                        <br />
                        <br />
                        This will permanently delete the metadata record and remove the PDF object from Cloudflare R2 storage.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteSubmit}
                        color="error"
                        variant="contained"
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={16} /> : <Trash2 size={16} />}
                    >
                        {submitting ? "Deleting..." : "Delete Permanently"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
