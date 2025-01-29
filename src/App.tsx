import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthLayout from "@/components/auth/AuthLayout";
import CollegePlanning from "@/pages/CollegePlanning";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Profile from "@/pages/Profile";
import CounselorDashboard from "@/pages/CounselorDashboard";
import MockInterview from "@/pages/MockInterview";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<AuthLayout />}>
          <Route path="/mock-interview" element={<MockInterview />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/college-planning" element={<CollegePlanning />} />
          <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
          <Route path="/counselor-dashboard/student/:studentId/*" element={<CounselorDashboard />} />
          <Route path="/student-dashboard/:studentId" element={<CollegePlanning />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}