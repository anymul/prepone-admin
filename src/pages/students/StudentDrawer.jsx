// src/pages/students/StudentDrawer.jsx
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
  Skeleton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  FileText,
  Mail,
  Phone,
  PlusCircle,
  Sparkles,
  Target,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react';
import { Bubble } from '@/components/Bubble';
import { API_BASE_URL, authHeaders } from '@/lib/api';
import { tokens } from '@/theme';

const CREDIT_LABELS = {
  signup_bonus: 'Signup bonus',
  iap_topup_purchase: 'Credit top-up purchased',
  subscription_allowance_refresh: 'Subscription allowance',
  admin_grant: 'Granted by admin',
  refund: 'Refund',
  evaluation_spend_subscription: 'Evaluation (subscription credit)',
  evaluation_spend_topup: 'Evaluation (top-up credit)',
  evaluation_spend_unlimited: 'Evaluation (unlimited plan)',
  rewarded_ad: 'Rewarded ad watched',
  referral_reward: 'Referral reward',
};

const formatDate = (iso) => {
  if (!iso) return '–';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '–';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

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

export function StudentDrawer({
  open,
  studentId,
  onClose,
  onOpenGrantCredits,
  refreshKey,
}) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !studentId) {
      setData(null);
      return;
    }

    let isCancelled = false;
    async function fetchStudentDetails() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/students/admin/${studentId}`, {
          headers: authHeaders(),
        });
        const resData = await res.json();
        if (isCancelled) return;
        if (!res.ok || !resData.success) {
          throw new Error(resData.message || 'Could not load student profile.');
        }
        setData(resData);
      } catch (err) {
        if (!isCancelled) {
          console.error('[StudentDrawer] fetch error:', err);
          setError(err.message || 'Failed to load student details.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchStudentDetails();
    return () => {
      isCancelled = true;
    };
  }, [open, studentId, refreshKey]);

  const student = data?.student;
  const creditHistory = data?.creditHistory || [];
  const testResults = data?.testResults || [];
  const weakTopics = data?.weakTopics || [];

  const isPremium =
    student?.isPremium ||
    student?.billing?.state === 'active' ||
    Boolean(student?.billing?.tier && student.billing.tier !== 'free');

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 540, md: 680 },
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
                {student?.name || (loading ? <Skeleton width={180} /> : 'Student Profile')}
              </Typography>
              {student && (
                <Chip
                  label={isPremium ? 'Premium' : 'Free tier'}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: isPremium ? tokens.inkTint : tokens.paper,
                    color: isPremium ? tokens.ink : tokens.muted,
                    borderColor: isPremium ? tokens.ink : tokens.rule,
                    borderWidth: 1,
                    borderStyle: 'solid',
                  }}
                />
              )}
            </Box>

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
              {student?.email && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <Mail size={14} color={tokens.muted} />
                  <span>{student.email}</span>
                </Box>
              )}
              {student?.phone && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <Phone size={14} color={tokens.muted} />
                  <span>{student.phone}</span>
                </Box>
              )}
              {student?.board && (
                <Typography component="span" sx={{ fontSize: 13.5, color: tokens.muted }}>
                  {student.board} • Class {student.studentClass || '10'}
                  {student.studentStream ? ` (${student.studentStream})` : ''}
                </Typography>
              )}
            </Box>
          </Box>

          <IconButton
            onClick={onClose}
            aria-label="Close drawer"
            sx={{ minWidth: 44, minHeight: 44, color: tokens.muted }}
          >
            <X size={20} />
          </IconButton>
        </Box>

        {/* Top Credits & Quick Actions Banner */}
        {student && (
          <Box
            sx={{
              px: 3,
              py: 2,
              bgcolor: tokens.sheet,
              borderBottom: `1px solid ${tokens.rule}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  bgcolor: tokens.accentTint,
                  color: tokens.amber,
                }}
              >
                <Coins size={22} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 500 }}>
                  Credit balance
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: tokens.ink, lineHeight: 1.1 }}>
                    {student.credits?.balance ?? 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    credits available
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: tokens.muted, fontSize: 12 }}>
                  Earned: {student.credits?.lifetimeEarned ?? 0} • Used: {student.credits?.lifetimeUsed ?? 0}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              size="small"
              onClick={() => onOpenGrantCredits && onOpenGrantCredits(student)}
              startIcon={<PlusCircle size={16} />}
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
              Grant credits
            </Button>
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
            <Tab label={`Credit ledger (${creditHistory.length})`} />
            <Tab label={`Mock tests (${testResults.length})`} />
            <Tab label={`Weak topics (${weakTopics.length})`} />
            <Tab label="Profile & billing" />
          </Tabs>
        </Box>

        {/* Tab Body */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          {loading && !data && (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Skeleton variant="rounded" height={60} />
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
              {/* TAB 0: CREDIT LEDGER */}
              {tab === 0 && (
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  {creditHistory.length === 0 ? (
                    <Box
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        bgcolor: tokens.sheet,
                        borderRadius: '12px',
                        border: `1px solid ${tokens.rule}`,
                      }}
                    >
                      <Coins size={36} color={tokens.muted} style={{ margin: '0 auto 12px' }} />
                      <Typography sx={{ fontWeight: 600 }}>No credit transactions yet</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        This student hasn't spent or earned any credits yet.
                      </Typography>
                    </Box>
                  ) : (
                    creditHistory.map((item) => {
                      const isGain = item.delta > 0;
                      return (
                        <Box
                          key={item._id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            borderRadius: '10px',
                            bgcolor: tokens.sheet,
                            border: `1px solid ${tokens.rule}`,
                            gap: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 36,
                                height: 36,
                                borderRadius: '8px',
                                bgcolor: isGain ? tokens.greenTint : tokens.paper,
                                color: isGain ? tokens.green : tokens.muted,
                                flexShrink: 0,
                              }}
                            >
                              {isGain ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: 14.5 }}>
                                {CREDIT_LABELS[item.type] || item.type}
                              </Typography>
                              {item.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ fontSize: 13, wordBreak: 'break-word' }}
                                >
                                  {item.description}
                                </Typography>
                              )}
                              <Typography variant="caption" sx={{ color: tokens.muted }}>
                                {formatDateTime(item.createdAt)}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: 16,
                                color: isGain ? tokens.green : 'text.primary',
                              }}
                            >
                              {isGain ? `+${item.delta}` : item.delta}
                            </Typography>
                            <Typography variant="caption" sx={{ color: tokens.muted }}>
                              Bal: {item.balance}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Box>
              )}

              {/* TAB 1: MOCK TESTS */}
              {tab === 1 && (
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  {testResults.length === 0 ? (
                    <Box
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        bgcolor: tokens.sheet,
                        borderRadius: '12px',
                        border: `1px solid ${tokens.rule}`,
                      }}
                    >
                      <Trophy size={36} color={tokens.muted} style={{ margin: '0 auto 12px' }} />
                      <Typography sx={{ fontWeight: 600 }}>No test attempts recorded</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        This student hasn't completed any mock tests yet.
                      </Typography>
                    </Box>
                  ) : (
                    testResults.map((test) => {
                      const accuracy = Math.round(test.accuracy || 0);
                      const isHigh = accuracy >= 75;
                      const isMedium = accuracy >= 50 && accuracy < 75;

                      return (
                        <Box
                          key={test._id}
                          sx={{
                            p: 2,
                            borderRadius: '10px',
                            bgcolor: tokens.sheet,
                            border: `1px solid ${tokens.rule}`,
                            display: 'grid',
                            gap: 1.25,
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                                {test.mockTest?.title || 'Mock Test'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: tokens.muted }}>
                                Completed {formatDateTime(test.completedAt)}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${accuracy}% accuracy`}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                bgcolor: isHigh ? tokens.greenTint : isMedium ? tokens.amberTint : tokens.redTint,
                                color: isHigh ? tokens.green : isMedium ? tokens.amber : tokens.red,
                              }}
                            />
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              gap: 2.5,
                              flexWrap: 'wrap',
                              fontSize: 13.5,
                              pt: 0.5,
                              borderTop: `1px solid ${tokens.rule}`,
                              color: 'text.secondary',
                            }}
                          >
                            <Box>
                              Score:{' '}
                              <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {test.score ?? 0} / {test.totalQuestions || test.mockTest?.totalMarks || 0}
                              </Typography>
                            </Box>
                            <Box>
                              Correct:{' '}
                              <Typography component="span" sx={{ fontWeight: 600, color: tokens.green }}>
                                {test.correctAnswers ?? 0}
                              </Typography>
                            </Box>
                            <Box>
                              Incorrect:{' '}
                              <Typography component="span" sx={{ fontWeight: 600, color: tokens.red }}>
                                {test.incorrectAnswers ?? 0}
                              </Typography>
                            </Box>
                            <Box>
                              Time taken:{' '}
                              <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {formatSeconds(test.timeTakenInSeconds)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Box>
              )}

              {/* TAB 2: WEAK TOPICS */}
              {tab === 2 && (
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  {weakTopics.length === 0 ? (
                    <Box
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        bgcolor: tokens.sheet,
                        borderRadius: '12px',
                        border: `1px solid ${tokens.rule}`,
                      }}
                    >
                      <Target size={36} color={tokens.green} style={{ margin: '0 auto 12px' }} />
                      <Typography sx={{ fontWeight: 600 }}>No weak topics flagged</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Either this student hasn't taken tests yet, or accuracy across all tested chapters is healthy (&gt;60%).
                      </Typography>
                    </Box>
                  ) : (
                    weakTopics.map((topic, i) => (
                      <Box
                        key={topic.name || i}
                        sx={{
                          p: 2,
                          borderRadius: '10px',
                          bgcolor: tokens.sheet,
                          border: `1px solid ${tokens.rule}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Bubble value={topic.accuracy != null ? (topic.accuracy < 30 ? 0 : 0.5) : 0} />
                            <Typography sx={{ fontWeight: 600, fontSize: 14.5 }}>
                              {topic.name}
                            </Typography>
                          </Box>
                          {topic.totalQuestions != null && (
                            <Typography variant="caption" sx={{ color: tokens.muted, mt: 0.5, display: 'block' }}>
                              {topic.correctQuestions} of {topic.totalQuestions} questions correct
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                          {topic.accuracy != null ? (
                            <Chip
                              label={`${topic.accuracy}%`}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                bgcolor: tokens.redTint,
                                color: tokens.red,
                              }}
                            />
                          ) : (
                            <Chip
                              label="Needs revision"
                              size="small"
                              sx={{
                                fontWeight: 500,
                                bgcolor: tokens.amberTint,
                                color: tokens.amber,
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              )}

              {/* TAB 3: PROFILE & BILLING */}
              {tab === 3 && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  {/* Account overview */}
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: tokens.sheet,
                      borderRadius: '12px',
                      border: `1px solid ${tokens.rule}`,
                      display: 'grid',
                      gap: 1.75,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.ink }}>
                      Account details
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Student ID</Typography>
                        <Typography sx={{ fontSize: 13, fontFamily: 'monospace' }}>{student._id}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Joined on</Typography>
                        <Typography sx={{ fontSize: 14 }}>{formatDate(student.createdAt)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Last active</Typography>
                        <Typography sx={{ fontSize: 14 }}>{formatDate(student.lastActivityDate)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Board & Class</Typography>
                        <Typography sx={{ fontSize: 14 }}>
                          {student.board || 'BSEB'} • Class {student.studentClass || '10'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Billing overview */}
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: tokens.sheet,
                      borderRadius: '12px',
                      border: `1px solid ${tokens.rule}`,
                      display: 'grid',
                      gap: 1.75,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.ink }}>
                      Subscription & Plan
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Plan tier</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>
                          {student.billing?.tier || (isPremium ? 'Premium' : 'Free')}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Subscription state</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>
                          {student.billing?.state || 'Inactive'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Source</Typography>
                        <Typography sx={{ fontSize: 14, textTransform: 'capitalize' }}>
                          {student.billing?.source || 'None'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Expires / Renewal</Typography>
                        <Typography sx={{ fontSize: 14 }}>
                          {student.billing?.expiresAt ? formatDate(student.billing.expiresAt) : 'No active renewal'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Referral info */}
                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: tokens.sheet,
                      borderRadius: '12px',
                      border: `1px solid ${tokens.rule}`,
                      display: 'grid',
                      gap: 1.75,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.ink }}>
                      Referral program
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Referral code</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                          {student.referralCode || 'None generated'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Students referred</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                          {student.referralCount ?? 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
