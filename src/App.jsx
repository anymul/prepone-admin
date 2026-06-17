import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material'; // MUI imports
import { AuthProvider, useAuth } from './lib/auth-context';
import { Layout } from './components/layout/layout';

// Pages
import Login from './pages/Login';
import NotificationSender from './pages/NotificationSender';
import Dashboard from './pages/Dashboard';
import SubjectsPage from './pages/SubjectsPage';
import ChaptersPage from './pages/ChaptersPage';
import QuestionsPage from './pages/QuestionsPage';
import MockTestListPage from './pages/MockTestListPage';
import MockTestFormPage from './pages/MockTestFormPage';
import NotFound from './pages/NotFound';
import PYQPage from './pages/PYQPage';
import MasterQuestionUploader from './pages/MasterQues';
import FullMockTestGenerator from './pages/FullMockTestGenerator';
import SystemHealth from './pages/SystemHealth';
import QuestionReviewer from './pages/QuestionReviewer';

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Replaced Tailwind classes with MUI Box for centering
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/subjects/:classId" element={
        <ProtectedRoute>
          <Layout>
            <SubjectsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/chapters/:classId/:subjectId" element={
        <ProtectedRoute>
          <Layout>
            <ChaptersPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/questions/:classId" element={
        <ProtectedRoute>
          <Layout>
            <QuestionsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/questions/:classId/:subjectId/:chapterId" element={
        <ProtectedRoute>
          <Layout>
            <QuestionsPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/mock-tests/:classId" element={
        <ProtectedRoute>
          <Layout>
            <MockTestListPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/mock-tests/create/:classId" element={
        <ProtectedRoute>
          <Layout>
            <MockTestFormPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/mock-tests/edit/:testId" element={
        <ProtectedRoute>
          <Layout>
            <MockTestFormPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/pyqs" element={
        <ProtectedRoute>
          <Layout>
            <PYQPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/master-question-uploader" element={
        <ProtectedRoute>
          <Layout>
            <MasterQuestionUploader />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/mocktest-generator" element={
        <ProtectedRoute>
          <Layout>
            <FullMockTestGenerator />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/notifications" element={
        <ProtectedRoute>
          <Layout>
            <NotificationSender />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={
        <ProtectedRoute>
          <Layout>
            <NotFound />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/question-reviewer" element={
        <ProtectedRoute>
          <Layout>
            <QuestionReviewer />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/system-health" element={
        <ProtectedRoute>
          <Layout>
            <SystemHealth />
          </Layout>
        </ProtectedRoute>
      } />

    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
