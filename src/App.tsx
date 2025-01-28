import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthLayout from "@/components/auth/AuthLayout";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import CollegePlanning from "@/pages/CollegePlanning";
import Profile from "@/pages/Profile";
import CounselorDashboard from "@/pages/CounselorDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import StudentView from "@/pages/StudentView";
import StudentSummaryPage from "@/components/college-planning/StudentSummaryPage";
import Academics from "@/pages/Academics";
import Index from "@/pages/Index";
import MockInterview from "@/pages/MockInterview";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<AuthLayout />}>
            <Route path="/mock-interview" element={<MockInterview />} />
            <Route path="/college-planning" element={<CollegePlanning />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
            <Route 
              path="/counselor-dashboard/student/summary/:studentId" 
              element={<StudentSummaryPage />} 
            />
            <Route path="/counselor-dashboard/student/:studentId" element={<StudentView />} />
            <Route path="/student-dashboard/:studentId" element={<StudentDashboard />} />
            <Route path="/student-dashboard/:studentId/academics" element={<Academics />} />
            <Route path="/counselor-dashboard/student/:studentId/academics" element={<Academics />} />
          </Route>
        </Routes>
        <Toaster />
        <SonnerToaster position="top-center" />
      </Router>
    </QueryClientProvider>
  );
}