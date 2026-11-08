import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import MockInterviewPage from "@/features/mock-interview/MockInterviewPage";
import InterviewBankAdmin from "@/features/mock-interview/admin/InterviewBankAdmin";
import "@/index.css";

try {
  if (!localStorage.getItem("dreamplanner.lang")) localStorage.setItem("dreamplanner.lang", "zh");
} catch {
  /* storage unavailable */
}
const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Demo() {
  const [view, setView] = useState<"student" | "admin">("student");
  return (
    <>
      <div style={{ position: "fixed", bottom: 80, left: 16, zIndex: 60, maxWidth: "calc(100% - 32px)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 12, borderRadius: 6, border: "1px solid hsl(36 56% 42% / .4)", background: "hsl(150 12% 97% / .97)", boxShadow: "0 1px 3px rgba(0,0,0,.12)" }}>
        <span>演示页面 · 示例数据，不会保存到系统 · 演示里没有摄像头，可以试「书面作答」题</span>
        <span className="flex rounded border bg-background p-0.5">
          <button type="button" onClick={() => setView("student")} className={`rounded px-2 py-0.5 ${view === "student" ? "bg-primary text-primary-foreground" : ""}`}>学生 / 顾问端</button>
          <button type="button" onClick={() => setView("admin")} className={`rounded px-2 py-0.5 ${view === "admin" ? "bg-primary text-primary-foreground" : ""}`}>管理员题库</button>
        </span>
      </div>
      {view === "student" ? <MockInterviewPage /> : <div className="container mx-auto px-4 py-8"><InterviewBankAdmin /></div>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <LanguageProvider>
        <MemoryRouter initialEntries={["/mock-interview"]}>
          <Demo />
          <Toaster />
          <Sonner />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
