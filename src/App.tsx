
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import AuthLayout from "@/components/auth/AuthLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
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
import Contact from "@/pages/Contact";
import Index from "@/pages/Index";
import Articles from "@/pages/Articles";
import ArticleDetail from "@/pages/ArticleDetail";
import AdminDashboard from "@/pages/AdminDashboard";
import ActivityBrainstorming from "@/pages/ActivityBrainstorming";
import Admissions from "@/pages/Admissions";
import PublicResumeForm from "@/pages/PublicResumeForm";
import Footer from "@/components/layout/Footer";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/resume-form" element={<PublicResumeForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<AuthLayout />}>
            <Route path="/mock-interview" element={
              <ProtectedRoute allowedUserTypes={["student", "admin"]}>
                <MockInterview />
              </ProtectedRoute>
            } />
            <Route path="/activity-brainstorming" element={
              <ProtectedRoute allowedUserTypes={["student", "counselor", "admin"]}>
                <ActivityBrainstorming />
              </ProtectedRoute>
            } />
            <Route path="/student-profile" element={
              <ProtectedRoute allowedUserTypes={["student"]}>
                <StudentProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/counselor-profile" element={
              <ProtectedRoute allowedUserTypes={["counselor"]}>
                <CounselorProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/counselor-dashboard" element={
              <ProtectedRoute allowedUserTypes={["counselor"]}>
                <CounselorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/counselor-dashboard/student/:studentId" element={
              <ProtectedRoute allowedUserTypes={["counselor"]}>
                <StudentView />
              </ProtectedRoute>
            } />
            <Route path="/student-dashboard/:studentId" element={
              <ProtectedRoute allowedUserTypes={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute allowedUserTypes={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <Toaster />
        <Sonner />
      </div>
    </BrowserRouter>
  );
}
