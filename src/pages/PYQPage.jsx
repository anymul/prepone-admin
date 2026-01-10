// import { useState, useEffect } from "react";
// import {
//     Box,
//     Button,
//     TextField,
//     Dialog,
//     DialogTitle,
//     DialogContent,
//     DialogContentText,
//     DialogActions,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     Paper,
//     Select,
//     MenuItem,
//     FormControl,
//     InputLabel,
//     Card,
//     CardContent,
//     CardHeader,
//     Typography,
//     Chip,
//     Skeleton,
//     IconButton,
//     Stack,
//     Pagination,
//     Link as MuiLink
// } from "@mui/material";
// import {
//     Plus,
//     Edit,
//     Trash2,
//     FileText,
//     ExternalLink,
//     GraduationCap,
//     X
// } from "lucide-react";

// export default function PYQPage() {
//     const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

//     // States
//     const [pyqs, setPYQs] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [filter, setFilter] = useState({ studentClass: "", subject: "", year: "" });
//     const [subjects, setSubjects] = useState([]);
//     const [dialogOpen, setDialogOpen] = useState(false);
//     const [editPyq, setEditPyq] = useState(null);
//     const [form, setForm] = useState({ year: "", subject: "", studentClass: "", examName: "", downloadUrl: "" });
//     const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });

//     // Fetch subjects based on class filter
//     useEffect(() => {
//         let url = `${API_BASE_URL}/utility/subject`;
//         if (filter.studentClass) {
//             url = `${API_BASE_URL}/utility/subject/class/${filter.studentClass}`;
//         }

//         fetch(url)
//             .then(res => {
//                 if (!res.ok) throw new Error('Failed to fetch subjects');
//                 return res.json();
//             })
//             .then(data => {
//                 setSubjects(Array.isArray(data) ? data : []);
//                 if (filter.subject && !data.some(s => s._id === filter.subject)) {
//                     setFilter(f => ({ ...f, subject: "" }));
//                 }
//             })
//             .catch(error => {
//                 console.error("Failed to fetch subjects:", error);
//                 setSubjects([]);
//             });
//     }, [filter.studentClass, API_BASE_URL]);

//     // Fetch PYQs with filters
//     useEffect(() => {
//         setLoading(true);
//         const params = new URLSearchParams({
//             studentClass: filter.studentClass,
//             subject: filter.subject,
//             year: filter.year,
//             page: pagination.page,
//             limit: 10
//         });

//         fetch(`${API_BASE_URL}/pyqs?${params}`)
//             .then(res => {
//                 if (!res.ok) throw new Error('Failed to fetch PYQs');
//                 return res.json();
//             })
//             .then(data => {
//                 setPYQs(Array.isArray(data.pyqs) ? data.pyqs : []);
//                 setPagination(p => ({
//                     ...p,
//                     totalPages: data.totalPages || 1,
//                     totalCount: data.totalCount || 0,
//                 }));
//             })
//             .catch(error => {
//                 console.error("Failed to fetch PYQs:", error);
//                 setPYQs([]);
//             })
//             .finally(() => setLoading(false));
//     }, [filter, pagination.page, API_BASE_URL]);

//     function openDialog(pyq = null) {
//         setEditPyq(pyq);
//         if (pyq) {
//             setForm({
//                 _id: pyq._id,
//                 year: pyq.year,
//                 subject: pyq.subject?._id || pyq.subject,
//                 studentClass: pyq.studentClass,
//                 examName: pyq.examName ?? "",
//                 downloadUrl: pyq.downloadUrl,
//             });
//         } else {
//             setForm({ year: "", subject: "", studentClass: filter.studentClass, examName: "", downloadUrl: "" });
//         }
//         setDialogOpen(true);
//     }

//     function handleSubmit(e) {
//         e.preventDefault();
//         const method = editPyq ? "PUT" : "POST";
//         const url = editPyq ? `${API_BASE_URL}/pyqs/${editPyq._id}` : `${API_BASE_URL}/pyqs`;

//         fetch(url, {
//             method,
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(form),
//         })
//             .then(res => {
//                 if (!res.ok) throw new Error('Failed to save PYQ');
//                 return res.json();
//             })
//             .then(() => {
//                 setDialogOpen(false);
//                 setPagination(p => ({ ...p, page: 1 }));
//             })
//             .catch(error => console.error("Submit Error:", error));
//     }

//     function handleDelete(id) {
//         if (!window.confirm("Are you sure you want to delete this PYQ?")) return;

//         fetch(`${API_BASE_URL}/pyqs/${id}`, { method: "DELETE" })
//             .then(res => {
//                 if (!res.ok) throw new Error('Failed to delete');
//                 setPagination(p => ({ ...p, page: 1 }));
//             })
//             .catch(error => console.error("Delete Error:", error));
//     }

//     return (
//         <Box sx={{ maxWidth: '1400px', mx: 'auto', p: { xs: 2, md: 3 } }}>
//             {/* Header */}
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
//                 <Box>
//                     <Typography variant="h4" fontWeight="bold">
//                         Previous Year Questions
//                     </Typography>
//                     <Typography variant="body2" color="text.secondary">
//                         Manage and organize past exam papers.
//                     </Typography>
//                 </Box>
//                 <Button
//                     variant="contained"
//                     startIcon={<Plus size={16} />}
//                     onClick={() => openDialog()}
//                 >
//                     Add New PYQ
//                 </Button>
//             </Box>

//             {/* Filters */}
//             <Card variant="outlined" sx={{ mb: 3, bgcolor: 'action.hover' }}>
//                 <CardContent>
//                     <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
//                         <FormControl fullWidth size="small">
//                             <InputLabel>Class</InputLabel>
//                             <Select
//                                 value={filter.studentClass}
//                                 onChange={e => setFilter({ studentClass: e.target.value || "", subject: "", year: filter.year })}
//                                 label="Class"
//                             >
//                                 <MenuItem value="">All Classes</MenuItem>
//                                 <MenuItem value="10">Class 10</MenuItem>
//                                 <MenuItem value="12">Class 12</MenuItem>
//                             </Select>
//                         </FormControl>

//                         <FormControl fullWidth size="small">
//                             <InputLabel>Subject</InputLabel>
//                             <Select
//                                 value={filter.subject}
//                                 onChange={e => setFilter({ ...filter, subject: e.target.value || "" })}
//                                 label="Subject"
//                             >
//                                 <MenuItem value="">All Subjects</MenuItem>
//                                 {subjects.map(s => (
//                                     <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
//                                 ))}
//                             </Select>
//                         </FormControl>

//                         <TextField
//                             fullWidth
//                             size="small"
//                             type="number"
//                             label="Year"
//                             placeholder="Filter by Year"
//                             value={filter.year}
//                             onChange={e => setFilter({ ...filter, year: e.target.value })}
//                         />

//                         <Button
//                             fullWidth
//                             variant="outlined"
//                             startIcon={<X size={16} />}
//                             onClick={() => setFilter({ studentClass: "", subject: "", year: "" })}
//                             sx={{ minWidth: { md: 180 } }}
//                         >
//                             Reset Filters
//                         </Button>
//                     </Stack>
//                 </CardContent>
//             </Card>

//             {/* Table */}
//             <Card variant="outlined">
//                 <CardHeader
//                     title={
//                         <Box>
//                             <Typography variant="h6">PYQ Library</Typography>
//                             <Typography variant="body2" color="text.secondary">
//                                 Showing {pagination.totalCount} papers
//                             </Typography>
//                         </Box>
//                     }
//                     sx={{ borderBottom: 1, borderColor: 'divider' }}
//                 />
//                 <CardContent sx={{ p: 0 }}>
//                     <TableContainer>
//                         <Table>
//                             <TableHead sx={{ bgcolor: 'action.hover' }}>
//                                 <TableRow>
//                                     <TableCell width={100}>Year</TableCell>
//                                     <TableCell>Class & Subject</TableCell>
//                                     <TableCell>Exam Name</TableCell>
//                                     <TableCell align="right">Actions</TableCell>
//                                 </TableRow>
//                             </TableHead>
//                             <TableBody>
//                                 {loading ? (
//                                     [1, 2, 3].map((i) => (
//                                         <TableRow key={i}>
//                                             <TableCell><Skeleton width={60} /></TableCell>
//                                             <TableCell>
//                                                 <Skeleton width={120} sx={{ mb: 0.5 }} />
//                                                 <Skeleton width={80} />
//                                             </TableCell>
//                                             <TableCell><Skeleton width={150} /></TableCell>
//                                             <TableCell align="right"><Skeleton width={100} /></TableCell>
//                                         </TableRow>
//                                     ))
//                                 ) : pyqs.length === 0 ? (
//                                     <TableRow>
//                                         <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
//                                             <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
//                                                 <FileText size={32} style={{ opacity: 0.2 }} />
//                                                 <Typography color="text.secondary">
//                                                     No PYQs found matching your filters.
//                                                 </Typography>
//                                             </Box>
//                                         </TableCell>
//                                     </TableRow>
//                                 ) : pyqs.map(pyq => (
//                                     <TableRow
//                                         key={pyq._id}
//                                         hover
//                                         sx={{
//                                             '& .action-buttons': {
//                                                 opacity: 0,
//                                                 transition: 'opacity 0.2s'
//                                             },
//                                             '&:hover .action-buttons': {
//                                                 opacity: 1
//                                             }
//                                         }}
//                                     >
//                                         <TableCell>
//                                             <Chip
//                                                 label={pyq.year}
//                                                 variant="outlined"
//                                                 size="small"
//                                                 sx={{ fontWeight: 600 }}
//                                             />
//                                         </TableCell>
//                                         <TableCell>
//                                             <Box>
//                                                 <Typography variant="body2" fontWeight="600">
//                                                     {pyq.subject?.name || "Unknown Subject"}
//                                                 </Typography>
//                                                 <Chip
//                                                     icon={<GraduationCap size={12} />}
//                                                     label={`Class ${pyq.studentClass}`}
//                                                     size="small"
//                                                     sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
//                                                 />
//                                             </Box>
//                                         </TableCell>
//                                         <TableCell>
//                                             <Typography variant="body2" fontWeight="500">
//                                                 {pyq.examName || "Final Exam"}
//                                             </Typography>
//                                         </TableCell>
//                                         <TableCell align="right">
//                                             <Box className="action-buttons" sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
//                                                 <IconButton
//                                                     size="small"
//                                                     component={MuiLink}
//                                                     href={pyq.downloadUrl}
//                                                     target="_blank"
//                                                     rel="noopener noreferrer"
//                                                     title="View File"
//                                                     sx={{ color: 'primary.main' }}
//                                                 >
//                                                     <ExternalLink size={16} />
//                                                 </IconButton>
//                                                 <IconButton
//                                                     size="small"
//                                                     onClick={() => openDialog(pyq)}
//                                                     title="Edit"
//                                                 >
//                                                     <Edit size={16} />
//                                                 </IconButton>
//                                                 <IconButton
//                                                     size="small"
//                                                     onClick={() => handleDelete(pyq._id)}
//                                                     title="Delete"
//                                                     sx={{ '&:hover': { color: 'error.main' } }}
//                                                 >
//                                                     <Trash2 size={16} />
//                                                 </IconButton>
//                                             </Box>
//                                         </TableCell>
//                                     </TableRow>
//                                 ))}
//                             </TableBody>
//                         </Table>
//                     </TableContainer>
//                 </CardContent>
//             </Card>

//             {/* Pagination */}
//             {pagination.totalPages > 1 && (
//                 <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
//                     <Pagination
//                         count={pagination.totalPages}
//                         page={pagination.page}
//                         onChange={(e, page) => setPagination(p => ({ ...p, page }))}
//                         color="primary"
//                         showFirstButton
//                         showLastButton
//                     />
//                 </Box>
//             )}

//             {/* Add/Edit Dialog */}
//             <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
//                 <DialogTitle>
//                     {editPyq ? "Edit PYQ" : "Add New PYQ"}
//                 </DialogTitle>
//                 <DialogContent>
//                     <DialogContentText sx={{ mb: 2 }}>
//                         Enter the details for the previous year question paper.
//                     </DialogContentText>
//                     <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
//                         <Stack direction="row" spacing={2}>
//                             <FormControl fullWidth required>
//                                 <InputLabel>Class</InputLabel>
//                                 <Select
//                                     value={form.studentClass}
//                                     onChange={e => setForm({ ...form, studentClass: e.target.value })}
//                                     label="Class"
//                                 >
//                                     <MenuItem value="10">Class 10</MenuItem>
//                                     <MenuItem value="12">Class 12</MenuItem>
//                                 </Select>
//                             </FormControl>

//                             <TextField
//                                 fullWidth
//                                 required
//                                 label="Year"
//                                 type="number"
//                                 placeholder="YYYY"
//                                 inputProps={{ min: 2000, max: 2100 }}
//                                 value={form.year}
//                                 onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
//                             />
//                         </Stack>

//                         <FormControl fullWidth required>
//                             <InputLabel>Subject</InputLabel>
//                             <Select
//                                 value={form.subject}
//                                 onChange={e => setForm({ ...form, subject: e.target.value })}
//                                 label="Subject"
//                             >
//                                 {subjects.map(s => (
//                                     <MenuItem key={s._id} value={s._id}>
//                                         {s.name} (Class {s.studentClass})
//                                     </MenuItem>
//                                 ))}
//                             </Select>
//                         </FormControl>

//                         <TextField
//                             fullWidth
//                             label="Exam Name"
//                             placeholder="e.g. CBSE Board Exam, Term 1"
//                             value={form.examName}
//                             onChange={e => setForm(f => ({ ...f, examName: e.target.value }))}
//                         />

//                         <TextField
//                             fullWidth
//                             required
//                             label="Download URL"
//                             placeholder="https://..."
//                             value={form.downloadUrl}
//                             onChange={e => setForm(f => ({ ...f, downloadUrl: e.target.value }))}
//                             helperText="Link to the PDF or resource file."
//                         />
//                     </Box>
//                 </DialogContent>
//                 <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
//                     <Button onClick={() => setDialogOpen(false)} color="inherit">
//                         Cancel
//                     </Button>
//                     <Button onClick={handleSubmit} variant="contained">
//                         {editPyq ? "Update PYQ" : "Add PYQ"}
//                     </Button>
//                 </DialogActions>
//             </Dialog>
//         </Box>
//     );
// }
import { useState, useEffect } from "react";
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
    // --- CONFIGURATION ---
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
    // Check your login page to see if you store it as 'token' or 'authToken'
    const TOKEN_KEY = 'token';

    // --- STATES ---
    const [pyqs, setPYQs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Filters
    const [filter, setFilter] = useState({ studentClass: "", subject: "", year: "" });
    const [filterSubjects, setFilterSubjects] = useState([]);

    // Pagination
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });

    // Dialog (Form)
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editPyq, setEditPyq] = useState(null);
    const [form, setForm] = useState({ year: "", subject: "", studentClass: "", examName: "" });
    const [formSubjects, setFormSubjects] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);

    // --- HELPER: AUTH HEADERS ---
    const getAuthHeaders = (isMultipart = false) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            console.warn("No auth token found in localStorage");
        }

        const headers = {
            'x-auth-token': token // Matches your middleware preference
        };

        // Only add Content-Type if NOT multipart (FormData sets its own boundary)
        if (!isMultipart) {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    };

    // --- HELPER: HANDLE 401 UNAUTHORIZED ---
    const handleResponse = async (res) => {
        if (res.status === 401) {
            alert("Session expired. Please login again.");
            // Optional: Redirect to login
            window.location.href = '/login'; 
            throw new Error("Unauthorized");
        }
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
        }
        return res.json();
    };

    // --- 1. LOAD SUBJECTS FOR FILTER ---
    useEffect(() => {
        let url = `${API_BASE_URL}/utility/subject`;
        if (filter.studentClass) {
            url = `${API_BASE_URL}/utility/subject/class/${filter.studentClass}`;
        }

        fetch(url, { headers: getAuthHeaders() })
            .then(res => {
                if (res.status === 401) return []; // Silent fail for filter
                return res.json();
            })
            .then(data => {
                setFilterSubjects(Array.isArray(data) ? data : []);
                // Validate current subject filter
                if (filter.subject && Array.isArray(data) && !data.some(s => s._id === filter.subject)) {
                    setFilter(f => ({ ...f, subject: "" }));
                }
            })
            .catch(err => console.error("Filter subjects error:", err));
    }, [filter.studentClass, API_BASE_URL]);

    // --- 2. LOAD SUBJECTS FOR DIALOG ---
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


    // --- 3. FETCH PYQS (MAIN LIST) ---
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({
            studentClass: filter.studentClass,
            subject: filter.subject,
            year: filter.year,
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
                // Don't clear PYQs on error to avoid flickering if it's just a network blip, 
                // but for 401/Auth errors, maybe you want to.
            })
            .finally(() => setLoading(false));
    }, [filter, pagination.page, API_BASE_URL]);


    // --- HANDLERS ---

    function openDialog(pyq = null) {
        setEditPyq(pyq);
        setSelectedFile(null);

        if (pyq) {
            // Edit Mode
            setForm({
                _id: pyq._id,
                year: pyq.year,
                subject: pyq.subject?._id || pyq.subject,
                studentClass: pyq.studentClass,
                examName: pyq.examName || pyq.title || "",
            });
        } else {
            // Add Mode
            setForm({
                year: new Date().getFullYear(),
                subject: "",
                studentClass: filter.studentClass || "",
                examName: ""
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

        if (!form.subject) {
            alert("Please select a Subject.");
            return;
        }

        setSubmitting(true);

        try {
            let url, method, body, headers;

            if (editPyq) {
                // EDIT: JSON Update (Metadata)
                url = `${API_BASE_URL}/pyqs/${editPyq._id}`;
                method = "PUT";
                headers = getAuthHeaders(false); // standard json headers
                body = JSON.stringify({
                    ...form,
                    title: form.examName
                });
            } else {
                // CREATE: FormData Upload
                url = `${API_BASE_URL}/pyqs/upload`;
                method = "POST";

                const formData = new FormData();
                formData.append("subject", form.subject);
                formData.append("year", form.year);
                formData.append("title", form.examName);
                formData.append("studentClass", form.studentClass);
                formData.append("examType", "Bihar Board");

                if (selectedFile) {
                    formData.append("pdf", selectedFile);
                } else {
                    throw new Error("Please select a PDF file.");
                }

                body = formData;
                headers = getAuthHeaders(true); // Multipart headers (no Content-Type)
            }

            const res = await fetch(url, { method, headers, body });
            await handleResponse(res); // Re-use our robust response handler

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
            {/* Header */}
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

            {/* Filters */}
            <Card variant="outlined" sx={{ mb: 3, bgcolor: 'action.hover' }}>
                <CardContent>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Class</InputLabel>
                            <Select
                                value={filter.studentClass}
                                onChange={e => setFilter({ studentClass: e.target.value || "", subject: "", year: filter.year })}
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
                            onClick={() => setFilter({ studentClass: "", subject: "", year: "" })}
                            sx={{ minWidth: { md: 180 } }}
                        >
                            Reset
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Table */}
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
                                                <Chip
                                                    icon={<GraduationCap size={12} />}
                                                    label={`Class ${pyq.studentClass}`}
                                                    size="small"
                                                    sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="500">
                                                {pyq.examName || pyq.title || "Final Exam"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                                {pyq.fileUrl && (
                                                    <IconButton
                                                        size="small"
                                                        component={MuiLink}
                                                        // Fix: clean up duplicate api/v1 if it exists in fileUrl
                                                        href={`${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}${pyq.fileUrl}`}
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

            {/* Pagination */}
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

            {/* Add/Edit Dialog */}
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
