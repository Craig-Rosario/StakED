import { Route, Routes } from "react-router-dom";
import Landing from "@/pages/landing/Landing";
import Dashboard from "@/pages/student/Dashboard";
import Layout from "@/layout/Layout";
import Upcoming from "@/pages/student/Upcoming";
import ClassmatesPage from "@/pages/student/Classmates";
import VerifierDashboard from "@/pages/verifier/VerifierDashboard";
import LayoutVerifier from "@/layout/LayoutVerifier";
import VerifierClasses from "@/pages/verifier/VerifierClasses";
import CreateExam from "@/pages/verifier/CreateExam";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/user/dashboard" element={<Dashboard />} />
        <Route path="/user/upcoming" element={<Upcoming/>}/>
        <Route path="/user/classmates" element={<ClassmatesPage/>}/>
      </Route>

      <Route element={<LayoutVerifier />}>
        <Route path="/verifier/dashboard" element={<VerifierDashboard />} />
        <Route path="/verifier/classes" element={<VerifierClasses />} />
        <Route path="/verifier/create-exam" element={<CreateExam />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
