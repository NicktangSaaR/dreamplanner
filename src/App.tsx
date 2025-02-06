
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import StudentProfilePage from "@/pages/StudentProfilePage";
import CounselorProfilePage from "@/pages/CounselorProfilePage";
import CounselorDashboard from "@/pages/CounselorDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import StudentView from "@/pages/StudentView";
import MockInterview from "@/pages/MockInterview";
import NotFound from "@/pages/NotFound";
import About from "@/pages/About";
import Index from "@/pages/Index";
import Articles from "@/pages/Articles";
import ArticleDetail from "@/pages/ArticleDetail";
import AdminDashboard from "@/pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<AuthLayout />}>
          <Route path="/mock-interview" element={<MockInterview />} />
          <Route path="/student-profile" element={<StudentProfilePage />} />
          <Route path="/counselor-profile" element={<CounselorProfilePage />} />
          <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
          <Route
            path="/counselor-dashboard/student/:studentId"
            element={<StudentView />}
          />
          <Route path="/student-dashboard/:studentId" element={<StudentDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/parent-dashboard" element={<StudentView />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <Sonner />
    </BrowserRouter>
  );
}
