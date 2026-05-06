import { useEffect, useLayoutEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Troubleshooting } from "./pages/Troubleshooting";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { FAQs } from "./pages/FAQs";
import { LoginSelection } from "./pages/LoginSelection";
import { StudentLogin } from "./pages/StudentLogin";
import { AdminLogin } from "./pages/AdminLogin";
import { StudentDashboard } from "./pages/StudentDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AccountsList } from "./pages/AccountsList";
import { UserAccounts } from "./pages/UserAccounts";
import { AnalyticsDashboard } from "./pages/AnalyticsDashboard";
import { SupportRequests } from "./pages/SupportRequests";
import { ResetPassword } from "./pages/ResetPassword";
import { Settings } from "./pages/Settings";
import { TroubleshootingAdmin } from "./pages/TroubleshootingAdmin";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, persister } from "./lib/queryClient";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  // Browsers default to "auto" for SPA navigations — restore previous scroll.
  // Force "manual" so each route change starts at the top instead of the
  // user's last scroll position on that page.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // useLayoutEffect runs synchronously after DOM mutation but BEFORE paint, so
  // the new page never flashes at the old scroll offset.
  useLayoutEffect(() => {
    if (hash) return; // let hash links jump to their anchor instead
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, hash]);

  return null;
}

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/troubleshooting" 
            element={
              <ProtectedRoute>
                <Troubleshooting />
              </ProtectedRoute>
            } 
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/login-selection" element={<LoginSelection />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/accounts-list" 
            element={
              <ProtectedRoute>
                <AccountsList />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/user-accounts"
            element={
              <ProtectedRoute>
                <UserAccounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support-requests"
            element={
              <ProtectedRoute>
                <SupportRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/troubleshooting"
            element={
              <ProtectedRoute>
                <TroubleshootingAdmin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: persister!,
        maxAge: 24 * 60 * 60 * 1000,
        // Bump buster to invalidate cache caches that stored non-serializable
        // lucide forwardRef objects as `{}` — those cause React error #130 on
        // re-render. The new shape stores iconName strings instead.
        buster: "v2-iconname",
      }}
    >
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}