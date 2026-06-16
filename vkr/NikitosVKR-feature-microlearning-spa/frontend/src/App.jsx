import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Layout from './components/Layout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Courses from './pages/Courses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import Lesson from './pages/Lesson.jsx';
import Test from './pages/Test.jsx';
import Support from './pages/Support.jsx';
import Profile from './pages/Profile.jsx';

import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminCourses from './pages/admin/AdminCourses.jsx';
import AdminCourseEditor from './pages/admin/AdminCourseEditor.jsx';
import AdminTickets from './pages/admin/AdminTickets.jsx';
import AdminFaq from './pages/admin/AdminFaq.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/lessons/:id" element={<Lesson />} />
              <Route path="/lessons/:id/test" element={<Test />} />
              <Route path="/support" element={<Support />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/courses/:id/edit" element={<AdminCourseEditor />} />
              <Route path="/admin/tickets" element={<AdminTickets />} />
              <Route path="/admin/faq" element={<AdminFaq />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
