import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import AuthLayout from "@/components/auth/AuthLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import CollegePlanning from "@/pages/CollegePlanning";
import Profile from "@/pages/Profile";
import CounselorDashboard from "@/pages/CounselorDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import StudentView from "@/pages/StudentView";
import StudentSummaryPage from "@/components/college-planning/StudentSummaryPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/college-planning" element={<CollegePlanning />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
            <Route path="/counselor-dashboard/student/summary/:studentId" element={
              <div className="min-h-screen bg-background">
                <StudentSummaryPage studentId={useParams<{ studentId: string }>().studentId || ""} />
              </div>
            } />
            <Route path="/counselor-dashboard/student/:studentId" element={<StudentView />} />
            <Route path="/student-dashboard/:studentId" element={<StudentDashboard />} />
          </Route>
        </Routes>
        <Toaster />
        <SonnerToaster position="top-center" />
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}