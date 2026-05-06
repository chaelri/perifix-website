import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col">
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
        </Routes>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}