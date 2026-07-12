import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthProvider";
import { AssetsPage } from "./pages/AssetsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { OrganizationSetupPage } from "./pages/OrganizationSetupPage";
import { SignupPage } from "./pages/SignupPage";
import { BookingsPage } from "./pages/BookingsPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { AuditPage } from "./pages/AuditPage";
import { UsersPage } from "./pages/UsersPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { Toaster } from "@/components/ui/sonner";



function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="assets" element={<AssetsPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="audits" element={<AuditPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<OrganizationSetupPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
