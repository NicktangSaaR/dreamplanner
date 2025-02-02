import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import LoginPage from "@/pages/LoginPage";
import StudentDashboardPage from "@/pages/StudentDashboardPage";
import CounselorDashboardPage from "@/pages/CounselorDashboardPage";
import StudentProfilePage from "@/pages/StudentProfilePage";
import CounselorProfilePage from "@/pages/CounselorProfilePage";
import CareerInterestTestPage from "@/pages/CareerInterestTestPage";
import AuthGuard from "@/components/auth/AuthGuard";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<AuthGuard><StudentDashboardPage /></AuthGuard>} />
          <Route path="/student-dashboard/:id" element={<AuthGuard><StudentDashboardPage /></AuthGuard>} />
          <Route path="/counselor-dashboard/:id" element={<AuthGuard><CounselorDashboardPage /></AuthGuard>} />
          <Route path="/student-profile" element={<AuthGuard><StudentProfilePage /></AuthGuard>} />
          <Route path="/counselor-profile" element={<AuthGuard><CounselorProfilePage /></AuthGuard>} />
          <Route path="/career-interest-test" element={<AuthGuard><CareerInterestTestPage /></AuthGuard>} />
        </Routes>
        <Toaster />
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}