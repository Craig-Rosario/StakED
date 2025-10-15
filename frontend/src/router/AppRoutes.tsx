import { Route, Routes } from "react-router-dom";
import Landing from "@/pages/landing/Landing";
import Dashboard from "@/pages/student/Dashboard";
import Layout from "@/layout/Layout";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/user/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
