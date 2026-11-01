// src/pages/KnowledgeGraph.jsx
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Layers,
  Network,
  Pencil,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Panel, PanelHeader } from '@/components/Panel';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';
import { EditEdgeDialog } from './knowledgegraph/EditEdgeDialog';

const TYPE_CONFIG = {
  HARD_PREREQUISITE: {
    label: 'Hard prerequisite',
    color: tokens.ink,
    bgcolor: tokens.inkTint,
  },
  SOFT_PREREQUISITE: {
    label: 'Soft prerequisite',
    color: tokens.amber,
    bgcolor: tokens.amberTint,
  },
  CONCEPTUAL_EXTENSION: {
    label: 'Conceptual extension',
    color: '#0284C7',
    bgcolor: '#E0F2FE',
  },
};

export default function KnowledgeGraph() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [board, setBoard] = useState('CBSE');
  const [studentClass, setStudentClass] = useState('12');

  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active view tab (pipeline vs table)
  const [activeTab, setActiveTab] = useState('pipeline');

  // Edge Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEdge, setEditingEdge] = useState(null);

  // Seed confirmation dialog
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Deleting edge
  const [deletingId, setDeletingId] = useState(null);

  // Fetch subjects overview
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/knowledge-graph/admin/overview`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubjects(data.subjects || []);
        if (data.subjects.length > 0 && !selectedSubjectId) {
          // Default to Class 12 CBSE Maths or first subject
          const defaultSubj =
            data.subjects.find((s) => s.studentClass === 12 && s.board === 'CBSE') ||
            data.subjects[0];
          setSelectedSubjectId(defaultSubj._id);
          setBoard(defaultSubj.board || 'CBSE');
          setStudentClass(String(defaultSubj.studentClass || 12));
        }
      }
    } catch (err) {
      console.error('[KnowledgeGraph] overview error:', err);
    }
  }, [selectedSubjectId]);

  // Fetch subject graph
  const fetchSubjectGraph = useCallback(async (subjId) => {
    if (!subjId) return;
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/knowledge-graph/admin/subject/${subjId}`, {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch knowledge graph for subject');
      }

      setGraphData(data.data);
    } catch (err) {
      console.error('[KnowledgeGraph] subject graph error:', err);
      setError(err.message || 'Could not load knowledge graph');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchSubjectGraph(selectedSubjectId);
    }
  }, [selectedSubjectId, fetchSubjectGraph]);

  // Handle seed standard curriculum graph
  const handleSeedGraph = async () => {
    try {
      setSeeding(true);
      const res = await fetch(`${API_BASE_URL}/knowledge-graph/seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to seed knowledge graph');
      }

      toast.success(
        `Curriculum knowledge graph seeded successfully (${data.edgesSeeded || 0} edges).`
      );
      setSeedConfirmOpen(false);
      fetchOverview();
      if (selectedSubjectId) fetchSubjectGraph(selectedSubjectId);
    } catch (err) {
      console.error('Seed graph error:', err);
      toast.error(err.message || 'Could not seed knowledge graph');
    } finally {
      setSeeding(false);
    }
  };

  // Handle delete edge
  const handleDeleteEdge = async (edgeId) => {
    try {
      setDeletingId(edgeId);
      const res = await fetch(`${API_BASE_URL}/knowledge-graph/admin/edges/${edgeId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete prerequisite edge');
      }

      toast.success('Prerequisite edge deleted');
      if (selectedSubjectId) fetchSubjectGraph(selectedSubjectId);
    } catch (err) {
      console.error('Delete edge error:', err);
      toast.error(err.message || 'Could not delete edge');
    } finally {
      setDeletingId(null);
    }
  };

  const currentSubject = subjects.find((s) => s._id === selectedSubjectId);
  const chapters = graphData?.chapters || [];
  const edges = graphData?.edges || [];
  const foundationalChapters = graphData?.foundationalChapters || [];
  const isAcyclic = graphData?.isAcyclic ?? true;

  const foundationalEdgesCount = edges.filter(
    (e) => (e.fromClass || 10) < (currentSubject?.studentClass || 12)
  ).length;

  return (
    <Box sx={{ display: 'grid', gap: 3.5, pb: 6 }}>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: tokens.text }}>
            Knowledge graph &amp; prerequisites
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Curate chapter dependencies and foundational pipelines across subjects to power the AI root-cause diagnostic engine.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => setSeedConfirmOpen(true)}
            startIcon={<Sparkles size={16} />}
            sx={{
              minHeight: 44,
              borderColor: tokens.rule,
              color: tokens.text,
              textTransform: 'none',
              bgcolor: tokens.sheet,
              '&:hover': { borderColor: tokens.ink, bgcolor: tokens.inkTint },
            }}
          >
            Seed standard graph
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              setEditingEdge(null);
              setDialogOpen(true);
            }}
            disabled={!selectedSubjectId}
            startIcon={<PlusCircle size={16} />}
            sx={{
              minHeight: 44,
              bgcolor: tokens.ink,
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.inkDark, boxShadow: 'none' },
            }}
          >
            Add prerequisite link
          </Button>
        </Box>
      </Box>

      {/* Scope Filter Bar */}
      <Panel>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="kg-board-label">Board</InputLabel>
            <Select
              labelId="kg-board-label"
              value={board}
              label="Board"
              onChange={(e) => {
                const newBoard = e.target.value;
                setBoard(newBoard);
                const match = subjects.find(
                  (s) => s.board === newBoard && String(s.studentClass) === studentClass
                );
                if (match) setSelectedSubjectId(match._id);
              }}
              sx={{ bgcolor: tokens.sheet }}
            >
              <MenuItem value="CBSE">CBSE</MenuItem>
              <MenuItem value="BSEB">BSEB (Bihar Board)</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="kg-class-label">Class</InputLabel>
            <Select
              labelId="kg-class-label"
              value={studentClass}
              label="Class"
              onChange={(e) => {
                const newClass = e.target.value;
                setStudentClass(newClass);
                const match = subjects.find(
                  (s) => s.board === board && String(s.studentClass) === newClass
                );
                if (match) setSelectedSubjectId(match._id);
              }}
              sx={{ bgcolor: tokens.sheet }}
            >
              <MenuItem value="10">Class 10</MenuItem>
              <MenuItem value="12">Class 12</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel id="kg-subject-label">Subject</InputLabel>
            <Select
              labelId="kg-subject-label"
              value={selectedSubjectId}
              label="Subject"
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              sx={{ bgcolor: tokens.sheet }}
            >
              {subjects
                .filter((s) => s.board === board && String(s.studentClass) === studentClass)
                .map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name} ({s.chapterCount || 0} chapters, {s.edgeCount || 0} links)
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>
      </Panel>

      {/* Metrics & DAG Status Strip */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        <Box
          sx={{
            p: 2.5,
            borderRadius: '12px',
            bgcolor: tokens.sheet,
            border: `1px solid ${tokens.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: tokens.inkTint,
              color: tokens.ink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Curriculum chapters (nodes)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {chapters.length}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderRadius: '12px',
            bgcolor: tokens.sheet,
            border: `1px solid ${tokens.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: tokens.amberTint,
              color: tokens.amber,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Network size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Prerequisite edges
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {edges.length}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderRadius: '12px',
            bgcolor: tokens.sheet,
            border: `1px solid ${tokens.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GitBranch size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Foundational links (Class 10 $\rightarrow$ 12)
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.2 }}>
              {foundationalEdgesCount}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            p: 2.5,
            borderRadius: '12px',
            bgcolor: tokens.sheet,
            border: `1px solid ${tokens.rule}`,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: isAcyclic ? tokens.greenTint : tokens.redTint,
              color: isAcyclic ? tokens.green : tokens.red,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isAcyclic ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
              Curriculum graph health
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: isAcyclic ? tokens.green : tokens.red }}>
              {isAcyclic ? 'Valid DAG (Acyclic)' : 'Cycle detected!'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Graph Content */}
      <Panel>
        <Box sx={{ borderBottom: `1px solid ${tokens.rule}`, px: 2, pt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Prerequisite Pipeline" value="pipeline" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab label={`Edges Matrix (${edges.length})`} value="matrix" sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>

          <Button
            size="small"
            variant="text"
            onClick={() => fetchSubjectGraph(selectedSubjectId)}
            startIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            sx={{ color: tokens.muted, textTransform: 'none', minHeight: 36 }}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {loading ? (
          <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={32} sx={{ color: tokens.ink }} />
            <Typography variant="body2" color="text.secondary">
              Loading knowledge graph...
            </Typography>
          </Box>
        ) : activeTab === 'pipeline' ? (
          /* Tab 1: Prerequisite Pipeline View */
          <Box sx={{ p: { xs: 2, sm: 3 }, display: 'grid', gap: 2 }}>
            {chapters.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No chapters found for this subject.
              </Typography>
            ) : (
              chapters.map((ch, idx) => {
                // Find incoming prerequisites for this chapter
                const incomingEdges = edges.filter(
                  (e) => (e.toChapterId?._id || e.toChapterId) === ch._id
                );
                // Find outgoing unlocked chapters
                const outgoingEdges = edges.filter(
                  (e) => (e.fromChapterId?._id || e.fromChapterId) === ch._id
                );

                return (
                  <Box
                    key={ch._id}
                    sx={{
                      p: 2,
                      borderRadius: '10px',
                      bgcolor: tokens.sheet,
                      border: `1px solid ${tokens.rule}`,
                      display: 'grid',
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            bgcolor: tokens.inkTint,
                            color: tokens.ink,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {ch.order || idx + 1}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.text }}>
                            {ch.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: tokens.muted }}>
                            Class {ch.studentClass} • {incomingEdges.length} prerequisite(s) • unlocks {outgoingEdges.length} topic(s)
                          </Typography>
                        </Box>
                      </Box>

                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setEditingEdge({
                            toChapterId: ch._id,
                            toChapterName: ch.name,
                            board,
                          });
                          setDialogOpen(true);
                        }}
                        startIcon={<PlusCircle size={14} />}
                        sx={{
                          minHeight: 32,
                          borderColor: tokens.rule,
                          color: tokens.ink,
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          '&:hover': { borderColor: tokens.ink, bgcolor: tokens.inkTint },
                        }}
                      >
                        Add prerequisite
                      </Button>
                    </Box>

                    {/* Incoming Dependencies (Prerequisites) */}
                    {incomingEdges.length > 0 && (
                      <Box sx={{ pl: { xs: 0, sm: 5.5 } }}>
                        <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, display: 'block', mb: 0.75 }}>
                          Prerequisites required before studying:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {incomingEdges.map((e) => {
                            const cfg = TYPE_CONFIG[e.dependencyType] || TYPE_CONFIG.HARD_PREREQUISITE;
                            return (
                              <Chip
                                key={e._id}
                                size="small"
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                      {e.fromChapterName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                      (Cl. {e.fromClass} • {(e.strength * 100).toFixed(0)}%)
                                    </Typography>
                                  </Box>
                                }
                                onClick={() => {
                                  setEditingEdge(e);
                                  setDialogOpen(true);
                                }}
                                onDelete={() => handleDeleteEdge(e._id)}
                                sx={{
                                  color: cfg.color,
                                  bgcolor: cfg.bgcolor,
                                  border: `1px solid ${cfg.color}30`,
                                  cursor: 'pointer',
                                }}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {/* Outgoing Unlocks */}
                    {outgoingEdges.length > 0 && (
                      <Box sx={{ pl: { xs: 0, sm: 5.5 } }}>
                        <Typography variant="caption" sx={{ color: tokens.green, fontWeight: 600, display: 'block', mb: 0.75 }}>
                          Unlocks higher-level topics:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {outgoingEdges.map((e) => (
                            <Chip
                              key={e._id}
                              size="small"
                              label={`→ ${e.toChapterName} (Class ${e.toClass})`}
                              variant="outlined"
                              sx={{
                                borderColor: tokens.rule,
                                color: tokens.text,
                                fontSize: '0.75rem',
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        ) : (
          /* Tab 2: Edges Table View */
          <Box sx={{ overflowX: 'auto' }}>
            {edges.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
                No prerequisite links created for this subject yet. Click "Add prerequisite link" to connect chapters.
              </Typography>
            ) : (
              <Table size="small" sx={{ minWidth: 700 }}>
                <TableHead sx={{ bgcolor: '#F6EFE3' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Prerequisite Chapter</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Dependent Chapter</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Dependency Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Weight</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>Rationale</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: tokens.text, py: 1.5 }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {edges.map((e) => {
                    const cfg = TYPE_CONFIG[e.dependencyType] || TYPE_CONFIG.HARD_PREREQUISITE;
                    const isDeleting = deletingId === e._id;

                    return (
                      <TableRow key={e._id} hover>
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text }}>
                            {e.fromChapterName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: tokens.muted }}>
                            Class {e.fromClass}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text }}>
                            {e.toChapterName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: tokens.muted }}>
                            Class {e.toClass}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ py: 1.5 }}>
                          <Chip
                            size="small"
                            label={cfg.label}
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              color: cfg.color,
                              bgcolor: cfg.bgcolor,
                              border: `1px solid ${cfg.color}30`,
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text }}>
                            {(e.strength * 100).toFixed(0)}%
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ py: 1.5, maxWidth: 260 }}>
                          <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>
                            {e.explanation || 'Standard curriculum prerequisite link'}
                          </Typography>
                        </TableCell>

                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Edit edge">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingEdge(e);
                                  setDialogOpen(true);
                                }}
                                sx={{ color: tokens.ink, p: 0.75 }}
                              >
                                <Pencil size={15} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete edge">
                              <IconButton
                                size="small"
                                disabled={isDeleting}
                                onClick={() => handleDeleteEdge(e._id)}
                                sx={{ color: tokens.red, p: 0.75 }}
                              >
                                {isDeleting ? <CircularProgress size={14} /> : <Trash2 size={15} />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </Panel>

      {/* Edit / Create Edge Dialog */}
      <EditEdgeDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingEdge(null);
        }}
        edge={editingEdge}
        subjectId={selectedSubjectId}
        board={board}
        chapters={chapters}
        foundationalChapters={foundationalChapters}
        onSaved={() => {
          if (selectedSubjectId) fetchSubjectGraph(selectedSubjectId);
          fetchOverview();
        }}
      />

      {/* Seed Confirmation Dialog */}
      <Dialog
        open={seedConfirmOpen}
        onClose={() => setSeedConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            bgcolor: tokens.paper,
            border: `1px solid ${tokens.rule}`,
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: tokens.sheet, borderBottom: `1px solid ${tokens.rule}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.text }}>
            Seed Standard Knowledge Graph?
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This will populate all standard Class 10 to 12 STEM curriculum prerequisite links (Mathematics, Physics, Chemistry, Biology) across CBSE and BSEB boards.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: tokens.sheet, borderTop: `1px solid ${tokens.rule}` }}>
          <Button onClick={() => setSeedConfirmOpen(false)} disabled={seeding} sx={{ color: tokens.muted, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSeedGraph}
            disabled={seeding}
            startIcon={seeding ? <CircularProgress size={16} color="inherit" /> : <Sparkles size={16} />}
            sx={{
              minHeight: 36,
              bgcolor: tokens.ink,
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: tokens.inkDark, boxShadow: 'none' },
            }}
          >
            {seeding ? 'Seeding...' : 'Seed curriculum graph'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
