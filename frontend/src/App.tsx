import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import thTH from 'antd/locale/th_TH';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import ProjectsPage from './pages/ProjectsPage';
import StaffPage from './pages/StaffPage';
import RosterPage from './pages/RosterPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={thTH}>
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={
                isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />
              }>
                <Route index element={<Navigate to="/dashboard/projects" replace />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="staff" element={<StaffPage />} />
                <Route path="roster" element={<RosterPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="/" element={
                isAuthenticated ? <Navigate to="/dashboard/projects" replace /> : <Navigate to="/login" replace />
              } />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
