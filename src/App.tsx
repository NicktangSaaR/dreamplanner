import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Profile from "@/pages/Profile";
import CounselorDashboard from "@/pages/CounselorDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import StudentView from "@/pages/StudentView";
import MockInterview from "@/pages/MockInterview";
import NotFound from "@/pages/NotFound";
import About from "@/pages/About";
import Index from "@/pages/Index";
import AdminDashboard from "@/pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<AuthLayout />}>
          <Route path="/mock-interview" element={<MockInterview />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
          <Route
            path="/counselor-dashboard/student/:studentId"
            element={<StudentView />}
          />
          <Route path="/student-dashboard/:studentId" element={<StudentDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <Sonner />
    </BrowserRouter>
  );
}