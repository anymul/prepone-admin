import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardActions,
    Typography,
    TextField,
    Tabs,
    Tab,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Paper,
    Skeleton,
    InputAdornment,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    ArrowBack,
    AccessTime,
    Description,
    ContentCopy,
    Search,
    Assignment
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function MockTestListPage() {
    const { classId } = useParams();
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

    const [allMockTests, setAllMockTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0); // 0 = all, 1 = active, 2 = draft
    const [searchQuery, setSearchQuery] = useState('');
    const [testToDelete, setTestToDelete] = useState(null);
    const [duplicatingId, setDuplicatingId] = useState(null);
    const [error, setError] = useState('');

    const fetchMockTests = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/mocktest/class/${classId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch mock tests');
            }

            const data = await res.json();
            setAllMockTests(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch mock tests:", error);
            setError('Failed to load mock tests. Please try again.');
            setAllMockTests([]);
        } finally {
            setLoading(false);
        }
    }, [classId, API_BASE_URL]);

    useEffect(() => {
        fetchMockTests();
    }, [fetchMockTests]);

    const filteredMockTests = useMemo(() => {
        let filtered = allMockTests;

        // Status Filter
        const tabMapping = ['all', 'active', 'draft'];
        const currentFilter = tabMapping[activeTab];

        if (currentFilter !== 'all') {
            filtered = filtered.filter(test => test.status === currentFilter);
        }

        // Search Filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(test =>
                test.title.toLowerCase().includes(lowerQuery) ||
                test.description?.toLowerCase().includes(lowerQuery)
            );
        }

        return filtered;
    }, [allMockTests, activeTab, searchQuery]);

    const handleDeleteMockTest = async () => {
        if (!testToDelete) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/mocktest/${testToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                throw new Error('Failed to delete mock test');
            }

            setTestToDelete(null);
            fetchMockTests();
        } catch (error) {
            console.error("Failed to delete mock test:", error);
            setError('Failed to delete mock test. Please try again.');
        }
    };

    const handleDuplicateMockTest = async (testId) => {
        setDuplicatingId(testId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/mocktest/${testId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                throw new Error('Failed to duplicate mock test');
            }

            fetchMockTests();
        } catch (error) {
            console.error("Failed to duplicate mock test:", error);
            setError('Failed to duplicate mock test. Please try again.');
        } finally {
            setDuplicatingId(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'draft': return 'default';
            case 'archived': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 4,
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' }
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={() => navigate('/dashboard')} size="small">
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">Mock Tests</Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage assessments for Class {classId}
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate(`/mock-tests/create/${classId}`)}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        alignSelf: { xs: 'stretch', sm: 'auto' }
                    }}
                >
                    Create New Test
                </Button>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: { xs: 'stretch', md: 'center' }
                    }}>
                        <Tabs
                            value={activeTab}
                            onChange={(e, newVal) => setActiveTab(newVal)}
                            sx={{
                                borderBottom: { xs: 1, md: 0 },
                                borderColor: { xs: 'divider', md: 'transparent' }
                            }}
                        >
                            <Tab label="All Tests" sx={{ textTransform: 'none', fontWeight: 600 }} />
                            <Tab label="Active" sx={{ textTransform: 'none', fontWeight: 600 }} />
                            <Tab label="Drafts" sx={{ textTransform: 'none', fontWeight: 600 }} />
                        </Tabs>

                        <TextField
                            size="small"
                            placeholder="Search by title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: { xs: '100%', md: 300 } }}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Mock Tests Grid */}
            {loading ? (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)'
                    },
                    gap: 3
                }}>
                    {[1, 2, 3].map(i => (
                        <Card variant="outlined" sx={{ height: 320 }} key={i}>
                            <Box sx={{ height: 6, bgcolor: 'action.selected' }} />
                            <CardHeader
                                title={<Skeleton width="75%" height={28} />}
                                subheader={<Skeleton width="50%" height={20} />}
                            />
                            <CardContent>
                                <Skeleton width="100%" height={20} sx={{ mb: 1 }} />
                                <Skeleton width="66%" height={20} sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Skeleton variant="rounded" width="48%" height={40} />
                                    <Skeleton variant="rounded" width="48%" height={40} />
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            ) : filteredMockTests.length > 0 ? (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)'
                    },
                    gap: 3
                }}>
                    {filteredMockTests.map(test => (
                        <Card
                            key={test._id}
                            variant="outlined"
                            className="card-hover"
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Top colored bar */}
                            <Box sx={{
                                height: 4,
                                background: '#673AB7'
                            }} />

                            <CardHeader
                                title={
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                            <Typography
                                                variant="h6"
                                                fontWeight="700"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical'
                                                }}
                                            >
                                                {test.title}
                                            </Typography>
                                            <Box sx={{ textAlign: 'right', minWidth: 60 }}>
                                                <Typography variant="h5" fontWeight="bold" color="primary.main">
                                                    {test.totalMarks}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                                    Marks
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            <Chip
                                                label={test.status || 'Draft'}
                                                color={getStatusColor(test.status)}
                                                size="small"
                                                sx={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.7rem' }}
                                            />
                                            {test.stream && (
                                                <Chip
                                                    label={test.stream}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                }
                                sx={{ pb: 1 }}
                            />

                            <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        minHeight: 40,
                                        mb: 2
                                    }}
                                >
                                    {test.description || 'No description provided.'}
                                </Typography>

                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 1,
                                    mb: 2
                                }}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            bgcolor: 'primary.50',
                                            borderColor: 'primary.100'
                                        }}
                                    >
                                        <AccessTime fontSize="small" color="primary" />
                                        <Box>
                                            <Typography variant="body2" fontWeight="700" color="primary.main">
                                                {test.durationInMinutes}m
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Duration
                                            </Typography>
                                        </Box>
                                    </Paper>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            bgcolor: 'secondary.50',
                                            borderColor: 'secondary.100'
                                        }}
                                    >
                                        <Description fontSize="small" color="secondary" />
                                        <Box>
                                            <Typography variant="body2" fontWeight="700" color="secondary.main">
                                                {test.questions?.length || 0}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Questions
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Box>

                                <Box>
                                    <Typography
                                        variant="caption"
                                        fontWeight="700"
                                        color="text.secondary"
                                        sx={{
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            display: 'block',
                                            mb: 0.5
                                        }}
                                    >
                                        Subjects Covered
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {test.subjects?.slice(0, 3).map((s, idx) => (
                                            <Chip
                                                key={idx}
                                                label={typeof s === 'object' ? s.name : s}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'info.50',
                                                    color: 'info.dark',
                                                    borderColor: 'info.200',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600
                                                }}
                                            />
                                        ))}
                                        {test.subjects?.length > 3 && (
                                            <Chip
                                                label={`+${test.subjects.length - 3}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'action.selected',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600
                                                }}
                                            />
                                        )}
                                        {(!test.subjects || test.subjects.length === 0) && (
                                            <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                                No subjects assigned
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </CardContent>

                            <CardActions
                                sx={{
                                    justifyContent: 'space-between',
                                    borderTop: 1,
                                    borderColor: 'divider',
                                    bgcolor: 'action.hover',
                                    px: 2,
                                    py: 1
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" fontWeight="500">
                                    {test.createdAt ? format(new Date(test.createdAt), 'MMM d, yyyy') : 'Unknown'}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDuplicateMockTest(test._id)}
                                        disabled={duplicatingId === test._id}
                                        title="Duplicate"
                                        color="primary"
                                    >
                                        {duplicatingId === test._id ? (
                                            <CircularProgress size={16} />
                                        ) : (
                                            <ContentCopy fontSize="small" />
                                        )}
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => navigate(`/mock-tests/edit/${test._id}`)}
                                        title="Edit"
                                        color="warning"
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => setTestToDelete(test)}
                                        title="Delete"
                                        color="error"
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>
                            </CardActions>
                        </Card>
                    ))}
                </Box>
            ) : (
                <Paper
                    variant="outlined"
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 10,
                        textAlign: 'center',
                        border: '2px dashed',
                        borderColor: 'divider',
                        bgcolor: 'action.hover'
                    }}
                >
                    <Box sx={{ bgcolor: 'action.selected', p: 3, borderRadius: '50%', mb: 2 }}>
                        <Assignment sx={{ fontSize: 48, color: 'action.active' }} />
                    </Box>
                    <Typography variant="h6" fontWeight="700" gutterBottom>
                        {searchQuery ? 'No Matching Tests Found' : 'No Mock Tests Found'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 3 }}>
                        {searchQuery
                            ? 'Try adjusting your search or filter criteria.'
                            : "You haven't created any mock tests for this class yet. Start by creating your first test."}
                    </Typography>
                    {!searchQuery && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => navigate(`/mock-tests/create/${classId}`)}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Create First Test
                        </Button>
                    )}
                </Paper>
            )}

            {/* Delete Dialog */}
            <Dialog
                open={!!testToDelete}
                onClose={() => setTestToDelete(null)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Delete Mock Test?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This action cannot be undone. This will permanently delete
                        <Box component="span" sx={{ fontWeight: 700, color: 'text.primary', mx: 0.5 }}>
                            "{testToDelete?.title}"
                        </Box>
                        and remove it from student dashboards.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setTestToDelete(null)}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteMockTest}
                        color="error"
                        variant="contained"
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Delete Test
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
