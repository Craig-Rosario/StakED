import { Route, Routes } from "react-router-dom";
import Landing from "@/pages/landing/Landing";
import Dashboard from "@/pages/student/Dashboard";
import Layout from "@/layout/Layout";
import Upcoming from "@/pages/student/Upcoming";
import ClassmatesPage from "@/pages/student/Classmates";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/user/dashboard" element={<Dashboard />} />
        <Route path="/user/upcoming" element={<Upcoming/>}/>
        <Route path="/user/classmates" element={<ClassmatesPage/>}/>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
