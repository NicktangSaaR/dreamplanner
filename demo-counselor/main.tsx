import React from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import CounselorHome from "@/features/counselor/CounselorHome";
import CounselorStudentPage from "@/features/counselor/CounselorStudentPage";
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <LanguageProvider>
        <MemoryRouter initialEntries={["/counselor-dashboard"]}>
          <div className="border-b border-brass/40 bg-brass/10 px-4 py-2 text-center text-xs text-foreground/80">
            演示页面 · 示例数据，所有操作只在这个页面里生效，不会保存到系统
          </div>
          <Routes>
            <Route path="/counselor-dashboard" element={<CounselorHome />} />
            <Route path="/counselor-dashboard/student/:studentId" element={<StudentRoute />} />
            <Route path="*" element={<Navigate to="/counselor-dashboard" replace />} />
          </Routes>
          <Toaster />
          <Sonner />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
