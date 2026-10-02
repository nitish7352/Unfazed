import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastProvider } from "./components/common/Toast";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

// Public pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import JoinAsTherapistPage from "./pages/JoinAsTherapistPage";

// App pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import ClientsPage from "./pages/clients/ClientsPage";
import ClientDetailPage from "./pages/clients/ClientDetailPage";
import SessionsPage from "./pages/sessions/SessionsPage";
import SessionDetailPage from "./pages/sessions/SessionDetailPage";
import CalendarPage from "./pages/sessions/CalendarPage";
import NotesPage from "./pages/notes/NotesPage";
import NoteEditorPage from "./pages/notes/NoteEditorPage";
import BillingPage from "./pages/billing/BillingPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import SubscriptionPage from "./pages/settings/SubscriptionPage";
import VideoRoomPage from "./pages/VideoRoomPage";
import ChatPage from "./pages/chat/ChatPage";

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <Routes>
                {/* ── Public routes ── */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route
                  path="/join-as-therapist"
                  element={<JoinAsTherapistPage />}
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* ── Video room — standalone, no sidebar ── */}
                <Route element={<ProtectedRoute />}>
                  <Route
                    path="/session/room/:roomId"
                    element={<VideoRoomPage />}
                  />
                </Route>

                {/* ── Protected app with sidebar layout ── */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/clients" element={<ClientsPage />} />
                    <Route path="/clients/:id" element={<ClientDetailPage />} />
                    <Route path="/sessions" element={<SessionsPage />} />
                    <Route
                      path="/sessions/calendar"
                      element={<CalendarPage />}
                    />
                    <Route
                      path="/sessions/:id"
                      element={<SessionDetailPage />}
                    />
                    <Route path="/notes" element={<NotesPage />} />
                    <Route path="/notes/:id" element={<NoteEditorPage />} />
                    <Route
                      path="/notes/session/:sessionId"
                      element={<NoteEditorPage />}
                    />
                    <Route path="/billing" element={<BillingPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/chat/:clientId" element={<ChatPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route
                      path="/settings/subscription"
                      element={<SubscriptionPage />}
                    />
                  </Route>
                </Route>

                {/* ── 404 ── */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
