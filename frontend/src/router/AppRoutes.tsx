import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "@/layout/Layout";
import LayoutVerifier from "@/layout/LayoutVerifier";

// Import pages
import Landing from "@/pages/landing/Landing";
import Dashboard from "@/pages/student/Dashboard";
import Upcoming from "@/pages/student/Upcoming";
import ClassmatesPage from "@/pages/student/Classmates";
import VerifierDashboard from "@/pages/verifier/VerifierDashboard";
import VerifierClasses from "@/pages/verifier/VerifierClasses";
import VerifierClassesDetails from "@/pages/verifier/VerifierClassesDetails";
import CreateExam from "@/pages/verifier/CreateExam";

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />

      {/* User routes with Layout */}
      <Route element={<Layout />}>
        <Route path="/user/dashboard" element={<Dashboard />} />
        <Route path="/user/upcoming" element={<Upcoming />} />
        <Route path="/user/classmates" element={<ClassmatesPage />} />
      </Route>

      {/* Verifier routes */}
      <Route element={<LayoutVerifier />}>
        <Route path="/verifier/dashboard" element={<VerifierDashboard />} />
        <Route path="/verifier/classes" element={<VerifierClasses />} />
        <Route path="/verifier/classes/:id" element={<VerifierClassesDetails />} />
        <Route path="/verifier/create-exam" element={<CreateExam />} />
      </Route>

      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
