import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "@/layout/Layout";
import LayoutVerifier from "@/layout/LayoutVerifier";

// Pages
import Landing from "@/pages/landing/Landing";
import Dashboard from "@/pages/student/Dashboard";
import Upcoming from "@/pages/student/Upcoming";
import ClassmatesPage from "@/pages/student/Classmates";
import VerifierDashboard from "@/pages/verifier/VerifierDashboard";
import VerifierClasses from "@/pages/verifier/VerifierClasses";
import VerifierClassesDetails from "@/pages/verifier/VerifierClassesDetails";
import IntegratedCreateExam from "@/pages/verifier/IntegratedCreateExam";
import GradeExam from "@/pages/verifier/GradeExam";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />

      {/* Student Routes */}
      <Route element={<Layout />}>
        <Route path="/user/dashboard" element={<Dashboard />} />
        <Route path="/user/upcoming" element={<Upcoming />} />
        <Route path="/user/classmates" element={<ClassmatesPage />} />
      </Route>

      {/* Verifier Routes */}
      <Route element={<LayoutVerifier />}>
        <Route path="/verifier/dashboard" element={<VerifierDashboard />} />
        <Route path="/verifier/classes" element={<VerifierClasses />} />
        <Route path="/verifier/classes/:id" element={<VerifierClassesDetails />} />
        <Route path="/verifier/create-exam" element={<IntegratedCreateExam />} />
        <Route path="/verifier/grade/:examId" element={<GradeExam />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
