import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import SignUp from "@/pages/signup";
import { lastSignup } from "./mock";
import "@/index.css";
import { gradPhaseOn, gradSummary, type EntryTerm, type GradDegree, type GradStatus } from "@/shared/planning";

const GRAD_ZH: Record<string, string> = { grad_positioning: "定位", grad_background: "背景提升", grad_materials: "材料准备", grad_application: "申请", grad_admission: "录取" };

const box: React.CSSProperties = { maxWidth: 560, margin: "32px auto", padding: 24, border: "1px solid hsl(var(--border))", borderRadius: 8, background: "hsl(var(--card))" };
const muted: React.CSSProperties = { color: "hsl(var(--muted-foreground))", fontSize: 14, lineHeight: 1.6 };

// Same rule as the new sign-up trigger (outside July/August).
function statusFor(grade?: string) {
  if (!grade) return "G9";
  if (grade === "G7" || grade === "G8") return "Pre-9";
  if (grade === "Transfer") return "Transfer Student";
  return grade;
}
const PHASE: Record<string, string> = { G9: "探索期", G10: "定位期", G11: "巩固期", G12: "申请期", "College Bound": "申请期" };

function AfterSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "home">("email");
  const d = lastSignup.data ?? {};
  const isGrad = d.applicant_type === "graduate";
  const status = isGrad
    ? gradSummary({ applicantType: "graduate", gradStatus: d.grad_status as GradStatus, gradDegree: d.grad_degree as GradDegree, entryTerm: (d.target_entry_term || null) as EntryTerm | null, entryYear: d.target_entry_year ? Number(d.target_entry_year) : null }, "zh")
    : statusFor(d.grade);
  const gradPhase = isGrad ? GRAD_ZH[gradPhaseOn((d.target_entry_term || "fall") as EntryTerm, d.target_entry_year ? Number(d.target_entry_year) : null, new Date())] : "";
  return (
    <div style={{ padding: "0 16px" }}>
      {step === "email" ? (
        <div style={box}>
          <p style={{ ...muted, fontSize: 12 }}>第 2 步 · 学生的邮箱（模拟）</p>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: "6px 0 12px" }}>收到一封「Confirm your signup」验证邮件</h2>
          <p style={muted}>
            注册后页面会跳到登录页，并提示去邮箱验证。学生必须先点邮件里的验证链接，才能登录。
            邮件发到：<strong>{lastSignup.email}</strong>
          </p>
          <div style={{ marginTop: 16, padding: 16, border: "1px dashed hsl(var(--border))", borderRadius: 6 }}>
            <p style={{ fontWeight: 600 }}>Confirm your signup</p>
            <p style={muted}>Follow this link to confirm your user:</p>
            <Button style={{ marginTop: 8 }} onClick={() => setStep("home")}>Confirm your mail（点击模拟验证并登录）</Button>
          </div>
        </div>
      ) : (
        <div style={box}>
          <p style={{ ...muted, fontSize: 12 }}>第 3 步 · 验证并登录后，系统里保存的资料</p>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: "6px 0 12px" }}>{d.full_name}（{d.english_name}）</h2>
          <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["学校", d.school],
                ["年级 / 服务状态", status],
                ["规划阶段", isGrad ? gradPhase + (d.target_entry_year ? "（按入学时间自动推进）" : "（入学时间未定，顾问设置后自动划分时间轴）") : PHASE[status] ?? "—（顾问手动设置）"],
                ["感兴趣的专业", d.interested_majors],
                ["家长邮箱", d.parent_email || "未填写"],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderTop: "1px solid hsl(var(--border))" }}>
                  <td style={{ padding: "8px 0", color: "hsl(var(--muted-foreground))", width: 140 }}>{k}</td>
                  <td style={{ padding: "8px 0", fontWeight: k === "年级 / 服务状态" ? 600 : 400 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ ...muted, marginTop: 12, padding: 10, borderRadius: 6, background: "hsl(var(--muted))" }}>
            修复前：无论选几年级，「年级 / 服务状态」都会显示 <strong>G9</strong>。修复后：直接用学生选的年级，顾问端、规划阶段和自动升年级都以此为准。
          </p>
          <Button variant="outline" style={{ marginTop: 16 }} onClick={() => navigate("/signup")}>再注册一次试试</Button>
        </div>
      )}
    </div>
  );
}

function Banner() {
  return (
    <div style={{ position: "fixed", bottom: 16, left: 16, right: 16, zIndex: 60, margin: "0 auto", maxWidth: 560, padding: "8px 12px", fontSize: 12, borderRadius: 6, border: "1px solid hsl(36 56% 42% / .4)", background: "hsl(150 12% 97% / .97)", boxShadow: "0 1px 3px rgba(0,0,0,.12)" }}>
      演示页面 · 第 1 步是正式网站（修复后）的注册页，可随意填写，不会真的创建账号或发邮件
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MemoryRouter initialEntries={["/signup"]}>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<AfterSignup />} />
        <Route path="*" element={<AfterSignup />} />
      </Routes>
      <Banner />
      <Toaster />
    </MemoryRouter>
  </React.StrictMode>,
);
