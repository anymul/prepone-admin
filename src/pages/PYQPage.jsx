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
    Paper,
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
    Link as MuiLink,
} from "@mui/material";
import {
    Plus,
    Edit,
    Trash2,
    FileText,
    ExternalLink,
    GraduationCap,
    X,
    Upload
} from "lucide-react";

export default function PYQPage() {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";
    const TOKEN_KEY = 'token';

    const [pyqs, setPYQs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [filter, setFilter] = useState({ studentClass: "", subject: "", year: "", board: "" });
    const [filterSubjects, setFilterSubjects] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editPyq, setEditPyq] = useState(null);
    const [form, setForm] = useState({ year: "", subject: "", studentClass: "", examName: "", board: "" });
    const [formSubjects, setFormSubjects] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);

    const getAuthHeaders = (isMultipart = false) => {
        const token = localStorage.getItem(TOKEN_KEY);
        const headers = {
            'x-auth-token': token
        };

        if (!isMultipart) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    };

    const handleResponse = async (res) => {
        if (res.status === 401) {
            window.location.href = '/login';
            throw new Error("Unauthorized");
        }
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
        }
        return res.json();
    };

    useEffect(() => {
        let url = `${API_BASE_URL}/utility/subject`;
        if (filter.studentClass) {
            url = `${API_BASE_URL}/utility/subject/class/${filter.studentClass}`;
        }

        fetch(url, { headers: getAuthHeaders() })
            .then(res => {
                if (res.status === 401) return [];
                return res.json();
            })
            .then(data => {
                setFilterSubjects(Array.isArray(data) ? data : []);
                if (filter.subject && Array.isArray(data) && !data.some(s => s._id === filter.subject)) {
                    setFilter(f => ({ ...f, subject: "" }));
                }
            })
            .catch(err => console.error("Filter subjects error:", err));
    }, [filter.studentClass, API_BASE_URL]);

    useEffect(() => {
        if (!form.studentClass) {
            setFormSubjects([]);
            return;
        }
        const url = `${API_BASE_URL}/utility/subject/class/${form.studentClass}`;

        fetch(url, { headers: getAuthHeaders() })
            .then(handleResponse)
            .then(data => {
                setFormSubjects(Array.isArray(data) ? data : []);
            })
            .catch(err => console.error("Form subjects error:", err));
    }, [form.studentClass, API_BASE_URL]);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({
            studentClass: filter.studentClass,
            subject: filter.subject,
            year: filter.year,
            board: filter.board,
            page: pagination.page,
            limit: 10
        });

        fetch(`${API_BASE_URL}/pyqs?${params}`, { headers: getAuthHeaders() })
            .then(handleResponse)
            .then(data => {
                setPYQs(Array.isArray(data.pyqs) ? data.pyqs : []);
                setPagination(p => ({
                    ...p,
                    totalPages: data.totalPages || 1,
                    totalCount: data.totalCount || 0,
                }));
            })
            .catch(error => {
                console.error("Failed to fetch PYQs:", error);
            })
            .finally(() => setLoading(false));
    }, [filter, pagination.page, API_BASE_URL]);

    function openDialog(pyq = null) {
        setEditPyq(pyq);
        setSelectedFile(null);

        if (pyq) {
            setForm({
                _id: pyq._id,
                year: pyq.year,
                subject: pyq.subject?._id || pyq.subject,
                studentClass: pyq.studentClass,
                examName: pyq.examName || pyq.title || "",
                board: pyq.board || "CBSE",
            });
        } else {
            setForm({
                year: new Date().getFullYear(),
                subject: "",
                studentClass: filter.studentClass || "",
                examName: "",
                board: filter.board || "CBSE"
            });
        }
        setDialogOpen(true);
    }

    function handleFileChange(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== "application/pdf") {
                alert("Only PDF files are allowed.");
                return;
            }
            setSelectedFile(file);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.subject || !form.board) {
            alert("Please select a Subject and Board.");
            return;
        }

        setSubmitting(true);

        try {
            let url, method, body, headers;

            if (editPyq) {
                url = `${API_BASE_URL}/pyqs/${editPyq._id}`;
                method = "PUT";
                headers = getAuthHeaders(false);
                body = JSON.stringify({
                    ...form,
                    title: form.examName
                });
            } else {
                url = `${API_BASE_URL}/pyqs/upload`;
                method = "POST";

                const formData = new FormData();
                formData.append("subject", form.subject);
                formData.append("year", form.year);
                formData.append("title", form.examName);
                formData.append("studentClass", form.studentClass);
                formData.append("board", form.board);

                if (selectedFile) {
                    formData.append("pdf", selectedFile);
                } else {
                    throw new Error("Please select a PDF file.");
                }

                body = formData;
                headers = getAuthHeaders(true);
            }

            const res = await fetch(url, { method, headers, body });
            await handleResponse(res);

            setDialogOpen(false);
            window.location.reload();

        } catch (error) {
            console.error("Submit Error:", error);
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    }

    function handleDelete(id) {
        if (!window.confirm("Delete this PYQ?")) return;

        fetch(`${API_BASE_URL}/pyqs/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        })
            .then(handleResponse)
            .then(() => {
                window.location.reload();
            })
            .catch(error => console.error("Delete Error:", error));
    }

    return (
        <Box sx={{ maxWidth: '1400px', mx: 'auto', p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Previous Year Questions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage and organize past exam papers.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Plus size={16} />}
                    onClick={() => openDialog()}
                >
                    Add New PYQ
                </Button>
            </Box>

            <Card variant="outlined" sx={{ mb: 3, bgcolor: 'action.hover' }}>
                <CardContent>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Board</InputLabel>
                            <Select
                                value={filter.board}
                                onChange={e => setFilter({ ...filter, board: e.target.value })}
                                label="Board"
                            >
                                <MenuItem value="">All Boards</MenuItem>
                                <MenuItem value="CBSE">CBSE</MenuItem>
                                <MenuItem value="BSEB">BSEB</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Class</InputLabel>
                            <Select
                                value={filter.studentClass}
                                onChange={e => setFilter({ ...filter, studentClass: e.target.value || "", subject: "" })}
                                label="Class"
                            >
                                <MenuItem value="">All Classes</MenuItem>
                                <MenuItem value="10">Class 10</MenuItem>
                                <MenuItem value="12">Class 12</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Subject</InputLabel>
                            <Select
                                value={filter.subject}
                                onChange={e => setFilter({ ...filter, subject: e.target.value || "" })}
                                label="Subject"
                            >
                                <MenuItem value="">All Subjects</MenuItem>
                                {filterSubjects.map(s => (
                                    <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Year"
                            placeholder="Filter"
                            value={filter.year}
                            onChange={e => setFilter({ ...filter, year: e.target.value })}
                        />

                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<X size={16} />}
                            onClick={() => setFilter({ studentClass: "", subject: "", year: "", board: "" })}
                            sx={{ minWidth: { md: 180 } }}
                        >
                            Reset
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Card variant="outlined">
                <CardHeader
                    title={
                        <Box>
                            <Typography variant="h6">PYQ Library</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Showing {pagination.totalCount} papers
                            </Typography>
                        </Box>
                    }
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                />
                <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell width={100}>Year</TableCell>
                                    <TableCell>Class & Subject</TableCell>
                                    <TableCell>Exam Name</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    [1, 2, 3].map((i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton width={60} /></TableCell>
                                            <TableCell><Skeleton width={120} /></TableCell>
                                            <TableCell><Skeleton width={150} /></TableCell>
                                            <TableCell align="right"><Skeleton width={100} /></TableCell>
                                        </TableRow>
                                    ))
                                ) : pyqs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                <FileText size={32} style={{ opacity: 0.2 }} />
                                                <Typography color="text.secondary">
                                                    No PYQs found matching your filters.
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : pyqs.map(pyq => (
                                    <TableRow key={pyq._id} hover>
                                        <TableCell>
                                            <Chip label={pyq.year} variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="600">
                                                    {pyq.subject?.name || "Unknown"}
                                                </Typography>
                                                <Stack direction="row" spacing={1} mt={0.5}>
                                                    <Chip
                                                        icon={<GraduationCap size={12} />}
                                                        label={`Class ${pyq.studentClass}`}
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                    />
                                                    {pyq.board && (
                                                        <Chip
                                                            label={pyq.board}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                    )}
                                                </Stack>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="500">
                                                {pyq.examName || pyq.title || "Final Exam"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                                {safeHttpUrl(pyq.fileUrl, API_BASE_URL.replace(/\/api\/v1\/?$/, '') || undefined) && (
                                                    <IconButton
                                                        size="small"
                                                        component={MuiLink}
                                                        href={safeHttpUrl(pyq.fileUrl, API_BASE_URL.replace(/\/api\/v1\/?$/, '') || undefined)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ color: 'primary.main' }}
                                                    >
                                                        <ExternalLink size={16} />
                                                    </IconButton>
                                                )}
                                                <IconButton size="small" onClick={() => openDialog(pyq)}>
                                                    <Edit size={16} />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDelete(pyq._id)} color="error">
                                                    <Trash2 size={16} />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {pagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={pagination.totalPages}
                        page={pagination.page}
                        onChange={(e, page) => setPagination(p => ({ ...p, page }))}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editPyq ? "Edit PYQ Details" : "Upload New PYQ"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        {editPyq ? "Update metadata only." : "Fill details and upload PDF."}
                    </DialogContentText>

                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>

                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth required>
                                <InputLabel>Board</InputLabel>
                                <Select
                                    value={form.board}
                                    onChange={e => setForm({ ...form, board: e.target.value })}
                                    label="Board"
                                >
                                    <MenuItem value="CBSE">CBSE</MenuItem>
                                    <MenuItem value="BSEB">BSEB</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth required>
                                <InputLabel>Class</InputLabel>
                                <Select
                                    value={form.studentClass}
                                    onChange={e => {
                                        setForm({ ...form, studentClass: e.target.value, subject: "" });
                                    }}
                                    label="Class"
                                >
                                    <MenuItem value="10">Class 10</MenuItem>
                                    <MenuItem value="12">Class 12</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>

                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth required disabled={!form.studentClass}>
                                <InputLabel>Subject</InputLabel>
                                <Select
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    label="Subject"
                                >
                                    {formSubjects.length > 0 ? (
                                        formSubjects.map(s => (
                                            <MenuItem key={s._id} value={s._id}>
                                                {s.name}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled>
                                            {form.studentClass ? "No subjects found" : "Select Class first"}
                                        </MenuItem>
                                    )}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                required
                                label="Year"
                                type="number"
                                placeholder="YYYY"
                                value={form.year}
                                onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                            />
                        </Stack>

                        <TextField
                            fullWidth
                            label="Exam Name"
                            placeholder="e.g. Maths BSEB 2025"
                            value={form.examName}
                            onChange={e => setForm(f => ({ ...f, examName: e.target.value }))}
                        />

                        {!editPyq ? (
                            <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, textAlign: 'center' }}>
                                <input
                                    accept="application/pdf"
                                    style={{ display: 'none' }}
                                    id="upload-pdf-file"
                                    type="file"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="upload-pdf-file">
                                    <Button variant="outlined" component="span" startIcon={<Upload size={16} />}>
                                        Select PDF File
                                    </Button>
                                </label>
                                {selectedFile && (
                                    <Typography variant="body2" sx={{ mt: 1, color: 'success.main', fontWeight: 'bold' }}>
                                        Selected: {selectedFile.name}
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    File uploads are only available when creating new PYQs.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                        {submitting ? "Saving..." : (editPyq ? "Update" : "Upload")}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}