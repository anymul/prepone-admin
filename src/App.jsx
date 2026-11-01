import { lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './lib/auth-context';
import { ScopeProvider, useScope } from './lib/scope-context';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/layout';
import ErrorBoundary from './components/ErrorBoundary';

// Login is in the main bundle (first paint); every other page is loaded on demand.
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Syllabus = lazy(() => import('./pages/Syllabus'));
const Questions = lazy(() => import('./pages/Questions'));
const MockTests = lazy(() => import('./pages/MockTests'));
const MockTestBuilder = lazy(() => import('./pages/mocktests/MockTestBuilder'));
const LiveQuizzes = lazy(() => import('./pages/LiveQuizzes'));
const Library = lazy(() => import('./pages/Library'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const KnowledgeGraph = lazy(() => import('./pages/KnowledgeGraph'));
const NotificationSender = lazy(() => import('./pages/NotificationSender'));
const AutomaticNudges = lazy(() => import('./pages/AutomaticNudges'));
const Students = lazy(() => import('./pages/Students'));
const Workshops = lazy(() => import('./pages/Workshops'));
const ScheduledJobs = lazy(() => import('./pages/ScheduledJobs'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const Insights = lazy(() => import('./pages/Insights'));
const Review = lazy(() => import('./pages/Review'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const Spinner = () => (
  <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
    <CircularProgress />
  </Box>
);

// Client-side gate only: it keeps the UI honest, the API enforces the real authorization.
// `user` is only set for an unexpired token whose role is admin (see lib/session.js).
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
};

// Old class-based URLs (bookmarks, links from other pages) open the new class-free pages with the class as scope.
const LegacyRedirect = ({ to }) => {
  const params = useParams();
  const { setClassId } = useScope();
  useEffect(() => { if (params.classId) setClassId(params.classId); }, [params.classId, setClassId]);
  return <Navigate to={to(params)} replace />;
};

// The old reviewer opened with ?class&subject&chapter or ?mode=mocktest&testId. Map those to the new queues.
const LegacyReview = () => {
  const { search } = useLocation();
  const { setClassId } = useScope();
  const p = new URLSearchParams(search);
  useEffect(() => { if (p.get('class')) setClassId(p.get('class')); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const q = (k) => encodeURIComponent(p.get(k));
  let to = '/review';
  if (p.get('mode') === 'mocktest' && p.get('testId')) to = `/review?source=test&test=${q('testId')}`;
  else if (p.get('subject') && p.get('chapter') && p.get('chapter') !== 'all') to = `/review?source=chapter&subject=${q('subject')}&chapter=${q('chapter')}`;
  else if (p.get('subject')) to = `/review?source=subject&subject=${q('subject')}`;
  return <Navigate to={to} replace />;
};

const page = (element) => (
  <ProtectedRoute>
    <Layout>
      <Suspense fallback={<Spinner />}>{element}</Suspense>
    </Layout>
  </ProtectedRoute>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />

    <Route path="/" element={page(<Dashboard />)} />
    <Route path="/syllabus" element={page(<Syllabus />)} />
    <Route path="/questions" element={page(<Questions />)} />
    <Route path="/mock-tests" element={page(<MockTests />)} />
    <Route path="/live-quizzes" element={page(<LiveQuizzes />)} />
    <Route path="/mock-tests/new" element={page(<MockTestBuilder />)} />
    <Route path="/mock-tests/:testId/edit" element={page(<MockTestBuilder />)} />
    <Route path="/mock-tests/create/:classId" element={<LegacyRedirect to={() => '/mock-tests/new'} />} />
    <Route path="/mock-tests/edit/:testId" element={<LegacyRedirect to={(p) => `/mock-tests/${p.testId}/edit`} />} />
    <Route path="/mock-tests/:classId" element={<LegacyRedirect to={() => '/mock-tests'} />} />
    <Route path="/mocktest-generator" element={<Navigate to="/mock-tests/new?mode=generate" replace />} />
    <Route path="/subjects/:classId" element={<LegacyRedirect to={() => '/syllabus'} />} />
    <Route path="/chapters/:classId/:subjectId" element={<LegacyRedirect to={(p) => `/syllabus?subject=${p.subjectId}`} />} />
    <Route path="/questions/:classId" element={<LegacyRedirect to={() => '/questions'} />} />
    <Route path="/questions/:classId/:subjectId/:chapterId" element={<LegacyRedirect to={(p) => `/questions?subject=${p.subjectId}&chapter=${p.chapterId}`} />} />
    <Route path="/master-question-uploader" element={<Navigate to="/questions?import=1" replace />} />
    <Route path="/library" element={page(<Library />)} />
    <Route path="/flashcards" element={page(<Flashcards />)} />
    <Route path="/knowledge-graph" element={page(<KnowledgeGraph />)} />
    <Route path="/pyqs" element={<Navigate to="/library" replace />} />
    <Route path="/revision-notes" element={<Navigate to="/library?tab=notes" replace />} />
    <Route path="/notifications" element={page(<NotificationSender />)} />
    <Route path="/automatic-nudges" element={page(<AutomaticNudges />)} />
    <Route path="/students" element={page(<Students />)} />
    <Route path="/workshops" element={page(<Workshops />)} />
    <Route path="/review" element={page(<Review />)} />
    <Route path="/question-reviewer" element={<LegacyReview />} />
    <Route path="/insights" element={page(<Insights />)} />
    <Route path="/system-health" element={page(<SystemHealth />)} />
    <Route path="/scheduled-jobs" element={page(<ScheduledJobs />)} />

    <Route path="*" element={page(<NotFound />)} />
  </Routes>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ScopeProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster richColors closeButton position="bottom-right" />
        </ScopeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
