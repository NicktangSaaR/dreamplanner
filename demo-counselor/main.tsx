import React from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import CounselorHome from "@/features/counselor/CounselorHome";
import CounselorStudentPage from "@/features/counselor/CounselorStudentPage";
import StudentHome from "@/features/student-home/StudentHome";
import { DEMO_STUDENT_VIEW, setDemoUser } from "./mock";
import "@/index.css";

try {
  if (!localStorage.getItem("dreamplanner.lang")) localStorage.setItem("dreamplanner.lang", "zh");
} catch {
  /* storage unavailable */
}

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function StudentRoute() {
  const { studentId } = useParams();
  return <CounselorStudentPage key={studentId} studentId={studentId!} />;
}

function DemoBanner() {
  const nav = useNavigate();
  const loc = useLocation();
  const student = loc.pathname === "/student-view";
  const go = (asStudent: boolean) => {
    setDemoUser(asStudent);
    qc.clear();
    nav(asStudent ? "/student-view" : "/counselor-dashboard/student/s0000002-0000-0000-0000-000000000000");
  };
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-brass/40 bg-brass/10 px-4 py-2 text-center text-xs text-foreground/80">
      <span>演示页面 · 示例数据，所有操作只在这个页面里生效，不会保存到系统</span>
      <button className="rounded border border-brass/50 bg-background px-2 py-0.5 font-medium hover:bg-brass/10" onClick={() => go(!student)}>
        {student ? "← 回到顾问视角（Evan Liu）" : "切换到学生视角（Evan Liu）→"}
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <LanguageProvider>
        <MemoryRouter initialEntries={["/counselor-dashboard"]}>
          <DemoBanner />
          <Routes>
            <Route path="/counselor-dashboard" element={<CounselorHome />} />
            <Route path="/counselor-dashboard/student/:studentId" element={<StudentRoute />} />
            <Route path="/student-view" element={<StudentHome studentId={DEMO_STUDENT_VIEW} />} />
            <Route path="*" element={<Navigate to="/counselor-dashboard" replace />} />
          </Routes>
          <Toaster />
          <Sonner />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
