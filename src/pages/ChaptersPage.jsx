import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    IconButton,
    InputAdornment,
    Skeleton,
    Stack,
    Alert,
    Divider
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    ArrowBack,
    ChevronRight,
    MenuBook,
    Search
} from '@mui/icons-material';

export default function ChaptersPage() {
    const { classId, subjectId } = useParams();
    const navigate = useNavigate();

    const [subject, setSubject] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    // Dialog state
    const [dialogState, setDialogState] = useState({ type: null, chapter: null });
    const [newChapterName, setNewChapterName] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

    const fetchChaptersAndSubject = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Fetch subject and chapters in parallel
            const [subjectRes, chaptersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/utility/subject/${subjectId}`, { headers }),
                fetch(`${API_BASE_URL}/utility/subject/${subjectId}/chapters`, { headers })
            ]);

            if (!subjectRes.ok) {
                throw new Error('Failed to fetch subject');
            }

            if (!chaptersRes.ok) {
                throw new Error('Failed to fetch chapters');
            }

            const subjectData = await subjectRes.json();
            const chaptersData = await chaptersRes.json();

            setSubject(subjectData);
            setChapters(Array.isArray(chaptersData) ? chaptersData : []);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(`Failed to load data: ${err.message}`);
            setChapters([]);
        } finally {
            setLoading(false);
        }
    }, [subjectId, API_BASE_URL]);

    useEffect(() => {
        fetchChaptersAndSubject();
    }, [fetchChaptersAndSubject]);

    const closeDialog = () => {
        setDialogState({ type: null, chapter: null });
        setNewChapterName('');
    };

    const handleFormSubmit = async () => {
        if (!newChapterName.trim()) return;

        const isEditing = !!dialogState.chapter;
        const url = isEditing
            ? `${API_BASE_URL}/utility/chapter/${dialogState.chapter._id}`
            : `${API_BASE_URL}/utility/subject/${subjectId}/chapters`;
        const method = isEditing ? 'PATCH' : 'POST';

        try {
            const token = localStorage.getItem('token');
            const body = isEditing
                ? { name: newChapterName }
                : {
                    name: newChapterName,
                    studentClass: parseInt(classId)
                };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save chapter');
            }

            closeDialog();
            await fetchChaptersAndSubject();
        } catch (err) {
            console.error("Failed to save chapter", err);
            setError(`Failed to save chapter: ${err.message}`);
        }
    };

    const handleDeleteChapter = async () => {
        if (!dialogState.chapter) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/utility/chapter/${dialogState.chapter._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete chapter');
            }

            closeDialog();
            await fetchChaptersAndSubject();
        } catch (err) {
            console.error("Failed to delete chapter", err);
            setError(`Failed to delete chapter: ${err.message}`);
        }
    };

    const openAddDialog = () => {
        setNewChapterName('');
        setDialogState({ type: 'FORM', chapter: null });
    };

    const openEditDialog = (chapter) => {
        setNewChapterName(chapter.name);
        setDialogState({ type: 'FORM', chapter: chapter });
    };

    const openDeleteDialog = (chapter) => {
        setDialogState({ type: 'DELETE', chapter: chapter });
    };

    const filteredChapters = chapters.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={() => navigate(`/subjects/${classId}`)} size="small">
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        {loading && !subject ? (
                            <Skeleton width={200} height={40} />
                        ) : (
                            <Typography variant="h4" fontWeight="bold">
                                {subject?.name} Chapters
                            </Typography>
                        )}
                        <Typography variant="body1" color="text.secondary">
                            Manage {subject?.name || "Subject"} chapters for Class {classId}
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    onClick={openAddDialog}
                    startIcon={<Add />}
                    sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                    Add Chapter
                </Button>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Main Content Card */}
            <Card variant="outlined">
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                        <Box>
                            <Typography variant="h6" fontWeight="600">
                                Chapters
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'} available
                            </Typography>
                        </Box>
                        <TextField
                            size="small"
                            placeholder="Search chapters..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: { xs: '100%', sm: 300 } }}
                        />
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {loading ? (
                        <Stack spacing={2}>
                            {[1, 2, 3].map((i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2 }}>
                                    <Skeleton variant="text" width={40} height={24} />
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Skeleton width="60%" height={24} />
                                    </Box>
                                    <Skeleton variant="rounded" width={120} height={36} />
                                </Box>
                            ))}
                        </Stack>
                    ) : filteredChapters.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                        <TableCell width={80}>Order</TableCell>
                                        <TableCell>Chapter Name</TableCell>
                                        <TableCell align="right">Questions</TableCell>
                                        <TableCell align="right" width={120}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredChapters.map((chapter, index) => (
                                        <TableRow key={chapter._id} hover>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                    {String(index + 1).padStart(2, '0')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body1" fontWeight="600">
                                                    {chapter.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    component={Link}
                                                    to={`/questions/${classId}/${subjectId}/${chapter._id}`}
                                                    size="small"
                                                    sx={{ textTransform: 'none' }}
                                                    endIcon={<ChevronRight />}
                                                >
                                                    Manage Questions
                                                </Button>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <IconButton size="small" onClick={() => openEditDialog(chapter)}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => openDeleteDialog(chapter)}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Paper
                            variant="outlined"
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                py: 8,
                                textAlign: 'center',
                                bgcolor: 'action.hover'
                            }}
                        >
                            <MenuBook sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                No chapters found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                                {searchTerm ? "Try adjusting your search query." : "Start building the curriculum for this subject by adding a chapter."}
                            </Typography>
                            {!searchTerm && (
                                <Button variant="outlined" startIcon={<Add />} onClick={openAddDialog} sx={{ textTransform: 'none' }}>
                                    Add Chapter
                                </Button>
                            )}
                        </Paper>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog
                open={dialogState.type === 'FORM'}
                onClose={closeDialog}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    {dialogState.chapter ? 'Edit Chapter' : 'Add New Chapter'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 3 }}>
                        {dialogState.chapter ? "Make changes to the chapter details." : `Add a new chapter to ${subject?.name}.`}
                    </DialogContentText>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Chapter Name"
                        placeholder="e.g. Introduction to Physics"
                        value={newChapterName}
                        onChange={(e) => setNewChapterName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFormSubmit()}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDialog} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button onClick={handleFormSubmit} variant="contained" sx={{ textTransform: 'none' }}>
                        Save Chapter
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog
                open={dialogState.type === 'DELETE'}
                onClose={closeDialog}
                maxWidth="sm"
            >
                <DialogTitle>
                    Delete Chapter?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>"{dialogState.chapter?.name}"</strong>? This will remove all questions associated with it.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDialog} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteChapter} color="error" variant="contained" sx={{ textTransform: 'none' }}>
                        Delete Chapter
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
