// src/pages/livequizzes/LiveQuizDetailDrawer.jsx
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Skeleton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import {
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Radio,
  Send,
  Timer,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import LatexRenderer from '@/components/LatexRenderer';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';

const formatDateTime = (iso) => {
  if (!iso) return '–';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '–';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatSeconds = (sec) => {
  if (!sec && sec !== 0) return '–';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s > 0 ? `${s}s` : ''}`;
};

export function LiveQuizDetailDrawer({
  open,
  quizId,
  onClose,
  onOpenNotify,
  refreshKey,
}) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !quizId) {
      setData(null);
      return;
    }

    let isCancelled = false;
    async function fetchQuizDetail() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/live-quiz/admin/${quizId}`, {
          headers: authHeaders(),
        });
        const resData = await res.json();
        if (isCancelled) return;
        if (!res.ok || !resData.success) {
          throw new Error(resData.message || 'Failed to load quiz details.');
        }
        setData(resData);
      } catch (err) {
        if (!isCancelled) {
          console.error('[LiveQuizDetailDrawer] fetch error:', err);
          setError(err.message || 'Could not load quiz details.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchQuizDetail();
    return () => {
      isCancelled = true;
    };
  }, [open, quizId, refreshKey]);

  const quiz = data?.quiz;
  const stats = data?.stats;
  const leaderboard = data?.leaderboard || [];
  const questions = data?.questions || [];

  const isLive = quiz?.computedStatus === 'live';
  const isUpcoming = quiz?.computedStatus === 'upcoming';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 600, md: 760, lg: 880 },
          maxWidth: '100%',
          bgcolor: tokens.paper,
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Drawer Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            px: 3,
            py: 2.25,
            bgcolor: tokens.sheet,
            borderBottom: `1px solid ${tokens.rule}`,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 600, fontSize: 20 }}>
                {quiz?.title || (loading ? <Skeleton width={220} /> : 'Live Quiz Details')}
              </Typography>
              {quiz && (
                <Chip
                  label={
                    isLive
                      ? '● LIVE NOW'
                      : isUpcoming
                      ? 'Upcoming'
                      : 'Completed'
                  }
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: isLive ? tokens.greenTint : isUpcoming ? tokens.amberTint : tokens.paper,
                    color: isLive ? tokens.green : isUpcoming ? tokens.amber : tokens.muted,
                    borderColor: isLive ? tokens.green : isUpcoming ? tokens.amber : tokens.rule,
                    borderWidth: 1,
                    borderStyle: 'solid',
                  }}
                />
              )}
              {quiz?.testCode && (
                <Chip
                  label={`Code: ${quiz.testCode}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: tokens.ink,
                    borderColor: tokens.rule,
                  }}
                />
              )}
            </Box>

            {quiz && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                  mt: 0.75,
                  color: 'text.secondary',
                  fontSize: 13.5,
                }}
              >
                <span>
                  <strong>{quiz.board}</strong> • Class {quiz.studentClass}
                  {quiz.stream ? ` (${quiz.stream})` : ''}
                </span>
                <span>•</span>
                <span>
                  Window: {formatDateTime(quiz.windowStartTime)} – {formatDateTime(quiz.windowEndTime)}
                </span>
                {quiz.attemptDurationMinutes && (
                  <>
                    <span>•</span>
                    <span>{quiz.attemptDurationMinutes}m attempt limit</span>
                  </>
                )}
              </Box>
            )}
          </Box>

          <IconButton
            onClick={onClose}
            aria-label="Close drawer"
            sx={{ minWidth: 44, minHeight: 44, color: tokens.muted }}
          >
            <X size={20} />
          </IconButton>
        </Box>

        {/* Action & Stats Banner */}
        {quiz && (
          <Box
            sx={{
              px: 3,
              py: 2,
              bgcolor: tokens.sheet,
              borderBottom: `1px solid ${tokens.rule}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              {/* Quick Metrics */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
                    Participants
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.1 }}>
                    {stats?.totalParticipants ?? 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.muted, fontSize: 12 }}>
                    {stats?.submittedCount ?? 0} submitted
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ height: 32, alignSelf: 'center' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
                    Top score
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.green, lineHeight: 1.1 }}>
                    {stats?.topScore ?? 0}
                    <Typography component="span" variant="caption" sx={{ color: tokens.muted, ml: 0.5 }}>
                      / {quiz.totalMarks}
                    </Typography>
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ height: 32, alignSelf: 'center' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
                    Avg accuracy
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.1 }}>
                    {stats?.avgAccuracy ?? 0}%
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ height: 32, alignSelf: 'center' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
                    Avg time taken
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.text, lineHeight: 1.1 }}>
                    {formatSeconds(stats?.avgTimeTaken)}
                  </Typography>
                </Box>
              </Box>

              {/* Broadcast Live Notification Trigger */}
              <Button
                variant="contained"
                size="small"
                onClick={() => onOpenNotify && onOpenNotify(quiz)}
                startIcon={<Send size={15} />}
                sx={{
                  bgcolor: tokens.ink,
                  color: '#fff',
                  minHeight: 40,
                  px: 2,
                  fontWeight: 600,
                  borderRadius: '8px',
                  '&:hover': { bgcolor: tokens.inkDark },
                }}
              >
                Broadcast push
              </Button>
            </Box>
          </Box>
        )}

        {/* Tab Switcher */}
        <Box sx={{ bgcolor: tokens.sheet, borderBottom: `1px solid ${tokens.rule}`, px: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                minHeight: 44,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: 14.5,
                px: 1.5,
              },
              '& .Mui-selected': {
                fontWeight: 600,
                color: tokens.ink,
              },
            }}
          >
            <Tab label={`Leaderboard & Participants (${leaderboard.length})`} />
            <Tab label={`Questions & Accuracy (${questions.length})`} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          {loading && !data && (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Skeleton variant="rounded" height={60} />
              <Skeleton variant="rounded" height={60} />
              <Skeleton variant="rounded" height={60} />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          {!loading && data && (
            <>
              {/* TAB 0: LEADERBOARD */}
              {tab === 0 && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  {leaderboard.length === 0 ? (
                    <Box
                      sx={{
                        p: 5,
                        textAlign: 'center',
                        bgcolor: tokens.sheet,
                        borderRadius: '12px',
                        border: `1px solid ${tokens.rule}`,
                      }}
                    >
                      <Trophy size={40} color={tokens.muted} style={{ margin: '0 auto 12px' }} />
                      <Typography sx={{ fontWeight: 600 }}>No participants yet</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {isUpcoming
                          ? 'This quiz has not started yet. Participants will appear in real time once it opens.'
                          : 'No students participated in this live quiz window.'}
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        bgcolor: tokens.sheet,
                        borderRadius: '12px',
                        border: `1px solid ${tokens.rule}`,
                        overflow: 'hidden',
                      }}
                    >
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#F6EFE3' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: tokens.muted, width: 60 }}>
                              Rank
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: tokens.muted }}>
                              Student
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: tokens.muted }}>
                              Score
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: tokens.muted }}>
                              Accuracy
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: tokens.muted }}>
                              Time
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: tokens.muted }}>
                              Submitted
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {leaderboard.map((item) => {
                            const isTop3 = item.rank <= 3;
                            return (
                              <TableRow key={item.attemptId || item.rank} hover>
                                <TableCell sx={{ py: 1.5 }}>
                                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                    {item.rank === 1 && <Trophy size={16} color={tokens.amber} />}
                                    {item.rank === 2 && <Award size={16} color="#718096" />}
                                    {item.rank === 3 && <Award size={16} color="#C05621" />}
                                    <Typography
                                      sx={{
                                        fontWeight: isTop3 ? 700 : 500,
                                        fontSize: 14,
                                        color: isTop3 ? tokens.ink : 'text.primary',
                                      }}
                                    >
                                      #{item.rank}
                                    </Typography>
                                  </Box>
                                </TableCell>

                                <TableCell sx={{ py: 1.5 }}>
                                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                                    {item.studentName}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: tokens.muted }}>
                                    {item.studentEmail || item.studentPhone || '–'}
                                  </Typography>
                                </TableCell>

                                <TableCell sx={{ py: 1.5 }}>
                                  <Typography sx={{ fontWeight: 600, fontSize: 14.5 }}>
                                    {item.score}
                                    <Typography component="span" variant="caption" sx={{ color: tokens.muted, ml: 0.5 }}>
                                      / {item.totalMarks}
                                    </Typography>
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: tokens.muted }}>
                                    {Math.round(item.percentage)}%
                                  </Typography>
                                </TableCell>

                                <TableCell sx={{ py: 1.5 }}>
                                  <Chip
                                    label={`${Math.round(item.accuracy || 0)}%`}
                                    size="small"
                                    sx={{
                                      fontWeight: 600,
                                      bgcolor:
                                        item.accuracy >= 75
                                          ? tokens.greenTint
                                          : item.accuracy >= 50
                                          ? tokens.amberTint
                                          : tokens.redTint,
                                      color:
                                        item.accuracy >= 75
                                          ? tokens.green
                                          : item.accuracy >= 50
                                          ? tokens.amber
                                          : tokens.red,
                                    }}
                                  />
                                </TableCell>

                                <TableCell sx={{ py: 1.5 }}>
                                  <Typography sx={{ fontSize: 13.5 }}>
                                    {formatSeconds(item.timeTakenSeconds)}
                                  </Typography>
                                </TableCell>

                                <TableCell sx={{ py: 1.5 }}>
                                  <Typography variant="caption" sx={{ color: tokens.muted }}>
                                    {formatDateTime(item.submittedAt)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Box>
                  )}
                </Box>
              )}

              {/* TAB 1: QUESTIONS & ACCURACY */}
              {tab === 1 && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  {questions.map((q) => {
                    const accuracy = q.accuracy;
                    const qText = q.questionText?.en || q.questionText?.hi || q.questionText || '';

                    return (
                      <Box
                        key={q.questionId}
                        sx={{
                          p: 2.5,
                          borderRadius: '12px',
                          bgcolor: tokens.sheet,
                          border: `1px solid ${tokens.rule}`,
                          display: 'grid',
                          gap: 1.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={`Q${q.questionNumber}`}
                              size="small"
                              sx={{ fontWeight: 700, bgcolor: tokens.inkTint, color: tokens.ink }}
                            />
                            {q.chapterName && (
                              <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
                                {q.chapterName}
                              </Typography>
                            )}
                            <Chip
                              label={q.difficulty}
                              size="small"
                              variant="outlined"
                              sx={{
                                textTransform: 'capitalize',
                                fontSize: 11,
                                height: 20,
                                borderColor: tokens.rule,
                              }}
                            />
                          </Box>

                          {/* Accuracy Badge */}
                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            {accuracy != null ? (
                              <Chip
                                label={`${accuracy}% correct`}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  bgcolor:
                                    accuracy >= 70
                                      ? tokens.greenTint
                                      : accuracy >= 40
                                      ? tokens.amberTint
                                      : tokens.redTint,
                                  color:
                                    accuracy >= 70
                                      ? tokens.green
                                      : accuracy >= 40
                                      ? tokens.amber
                                      : tokens.red,
                                }}
                              />
                            ) : (
                              <Typography variant="caption" sx={{ color: tokens.muted }}>
                                No attempts
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Question Text */}
                        <Box sx={{ fontSize: 15, color: tokens.text, lineHeight: 1.55 }}>
                          <LatexRenderer text={qText} />
                        </Box>

                        {/* Options */}
                        <Box sx={{ display: 'grid', gap: 0.75, pt: 0.5 }}>
                          {(q.options || []).map((opt, optIdx) => {
                            const isCorrect = optIdx === q.correctOptionIndex;
                            const optText = typeof opt === 'object' ? (opt.en || opt.hi || '') : String(opt);

                            return (
                              <Box
                                key={optIdx}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.25,
                                  p: 1.25,
                                  borderRadius: '8px',
                                  bgcolor: isCorrect ? tokens.greenTint : tokens.paper,
                                  border: `1px solid ${isCorrect ? tokens.green : tokens.rule}`,
                                  fontSize: 14,
                                }}
                              >
                                <Typography
                                  component="span"
                                  sx={{
                                    fontWeight: 700,
                                    width: 22,
                                    color: isCorrect ? tokens.green : tokens.muted,
                                  }}
                                >
                                  {String.fromCharCode(65 + optIdx)}.
                                </Typography>
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                  <LatexRenderer text={optText} />
                                </Box>
                                {isCorrect && (
                                  <CheckCircle2 size={16} color={tokens.green} style={{ flexShrink: 0 }} />
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
