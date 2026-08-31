import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Auth
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Owner
import OwnerDashboard from '@/pages/owner/OwnerDashboard';
import MyInstrumentsPage from '@/pages/owner/MyInstrumentsPage';
import ApplyPage from '@/pages/owner/ApplyPage';
import MyApplicationsPage from '@/pages/owner/MyApplicationsPage';
import ApplicationDetailPage from '@/pages/owner/ApplicationDetailPage';
import CertificatesPage from '@/pages/owner/CertificatesPage';
import NotificationsPage from '@/pages/owner/NotificationsPage';
import MarketplacePage from '@/pages/owner/MarketplacePage';

// Inspector
import InspectorDashboard from '@/pages/inspector/InspectorDashboard';
import InspectorApplicationsPage from '@/pages/inspector/InspectorApplicationsPage';
import ApplicationReviewPage from '@/pages/inspector/ApplicationReviewPage';

// Admin
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminApplicationsPage from '@/pages/admin/AdminApplicationsPage';
import AIAlertsPage from '@/pages/admin/AIAlertsPage';
import AuditLogsPage from '@/pages/admin/AuditLogsPage';
import OfficerAllocationPage from '@/pages/admin/OfficerAllocationPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';

// Shared / Public
import QRVerifyPage from '@/pages/public/QRVerifyPage';
import ChatbotPage from '@/pages/ChatbotPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify/:id" element={<QRVerifyPage />} />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Owner routes */}
            <Route path="/owner/dashboard" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/owner/instruments" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><MyInstrumentsPage /></ProtectedRoute>} />
            <Route path="/owner/apply" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><ApplyPage /></ProtectedRoute>} />
            <Route path="/owner/applications" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><MyApplicationsPage /></ProtectedRoute>} />
            <Route path="/owner/applications/:id" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><ApplicationDetailPage /></ProtectedRoute>} />
            <Route path="/owner/certificates" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><CertificatesPage /></ProtectedRoute>} />
            <Route path="/owner/notifications" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><NotificationsPage /></ProtectedRoute>} />
            <Route path="/owner/marketplace" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><MarketplacePage /></ProtectedRoute>} />
            <Route path="/owner/transfer" element={<ProtectedRoute allowedRoles={['owner', 'admin']}><MarketplacePage /></ProtectedRoute>} />

            {/* Chatbot - accessible to all authenticated users */}
            <Route path="/chatbot" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />

            {/* Inspector routes */}
            <Route path="/inspector/dashboard" element={<ProtectedRoute allowedRoles={['inspector', 'admin']}><InspectorDashboard /></ProtectedRoute>} />
            <Route path="/inspector/applications" element={<ProtectedRoute allowedRoles={['inspector', 'admin']}><InspectorApplicationsPage /></ProtectedRoute>} />
            <Route path="/inspector/applications/:id" element={<ProtectedRoute allowedRoles={['inspector', 'admin']}><ApplicationReviewPage /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/applications" element={<ProtectedRoute allowedRoles={['admin']}><AdminApplicationsPage /></ProtectedRoute>} />
            <Route path="/admin/ai-alerts" element={<ProtectedRoute allowedRoles={['admin']}><AIAlertsPage /></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AuditLogsPage /></ProtectedRoute>} />
            <Route path="/admin/officer-allocation" element={<ProtectedRoute allowedRoles={['admin']}><OfficerAllocationPage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReportsPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
