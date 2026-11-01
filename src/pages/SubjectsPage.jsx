import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  IconButton,
  InputAdornment,
  Skeleton,
  Avatar,
  Alert,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ChevronRight,
  MenuBook,
  Search
} from '@mui/icons-material';

export default function SubjectsPage() {
  const { classId } = useParams();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // State for dialogs and forms
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Fetch subjects from the API
  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/utility/subject/class/${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }

      const data = await response.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load subjects. Please try again.');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [classId, API_BASE_URL]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/utility/subject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newSubjectName,
          studentClass: parseInt(classId)
        }),
      });

      if (!response.ok) throw new Error('Failed to add subject');

      setNewSubjectName('');
      setIsAddOpen(false);
      await fetchSubjects();
    } catch (err) {
      console.error(err);
      setError('Failed to add subject. Please try again.');
    }
  };

  const handleEditSubject = async () => {
    if (!newSubjectName.trim() || !selectedSubject) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/utility/subject/${selectedSubject._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newSubjectName }),
      });

      if (!response.ok) throw new Error('Failed to update subject');

      setNewSubjectName('');
      setSelectedSubject(null);
      setIsEditOpen(false);
      await fetchSubjects();
    } catch (err) {
      console.error(err);
      setError('Failed to update subject. Please try again.');
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/utility/subject/${selectedSubject._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete subject');

      setSelectedSubject(null);
      setIsDeleteOpen(false);
      await fetchSubjects();
    } catch (err) {
      console.error(err);
      setError('Failed to delete subject. Please try again.');
    }
  };

  const openEditDialog = (subject) => {
    setSelectedSubject(subject);
    setNewSubjectName(subject.name);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (subject) => {
    setSelectedSubject(subject);
    setIsDeleteOpen(true);
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Class {classId} Subjects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and organize subjects for Class {classId} curriculum
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setNewSubjectName('');
            setIsAddOpen(true);
          }}
          sx={{ whiteSpace: 'nowrap', textTransform: 'none', fontWeight: 600 }}
        >
          Add Subject
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Main Card */}
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight="600">
                Subject List
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} registered
              </Typography>
            </Box>
            <TextField
              size="small"
              placeholder="Search subjects..."
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                  <Skeleton variant="rounded" width={48} height={48} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton width="40%" height={24} />
                    <Skeleton width="20%" height={20} />
                  </Box>
                  <Skeleton variant="rounded" width={120} height={36} />
                </Box>
              ))}
            </Box>
          ) : filteredSubjects.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell width={80}>Icon</TableCell>
                    <TableCell>Subject Name</TableCell>
                    <TableCell align="right">Chapters</TableCell>
                    <TableCell align="right" width={120}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSubjects.map((subject) => (
                    <TableRow key={subject._id} hover>
                      <TableCell>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: 'primary.main',
                            borderRadius: 1.5
                          }}
                        >
                          <MenuBook />
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="600">
                          {subject.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Class {classId}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          component={Link}
                          to={`/chapters/${classId}/${subject._id}`}
                          size="small"
                          sx={{ textTransform: 'none' }}
                          endIcon={<ChevronRight />}
                        >
                          Manage Chapters
                        </Button>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => openEditDialog(subject)}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => openDeleteDialog(subject)}>
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
                No subjects found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                {searchTerm ? "Try adjusting your search query." : "Get started by adding a new subject to this class."}
              </Typography>
              {!searchTerm && (
                <Button variant="outlined" startIcon={<Add />} onClick={() => setIsAddOpen(true)} sx={{ textTransform: 'none' }}>
                  Add Subject
                </Button>
              )}
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Add Subject Dialog */}
      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Subject</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Create a new subject for Class {classId}. This will appear in the student app.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Subject Name"
            placeholder="e.g. Mathematics, Physics"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsAddOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleAddSubject} variant="contained" sx={{ textTransform: 'none' }}>
            Create Subject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Subject</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Update the subject details below.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Subject Name"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEditSubject()}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsEditOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleEditSubject} variant="contained" sx={{ textTransform: 'none' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Subject Dialog */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} maxWidth="sm">
        <DialogTitle>Delete Subject?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. This will permanently delete <strong>{selectedSubject?.name}</strong> and all associated chapters and questions.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsDeleteOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteSubject} color="error" variant="contained" sx={{ textTransform: 'none' }}>
            Delete Subject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
