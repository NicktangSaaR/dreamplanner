// The "please upload your latest report card" email to a student: the first
// request, and the reminder two days before the due date.
import { type EmailLang, inOrder, subjectFor } from "./emailLang.ts";

const SITE = "https://dreamplaneredu.com";
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function transcriptEmail(opts: {
  studentId: string; name: string | null; due: string; message?: string | null; reminder?: boolean; lang: EmailLang;
}) {
  const { studentId, due, reminder, lang } = opts;
  const name = esc(opts.name || "");
  const note = opts.message ? `<p style="border-left:3px solid #2C6E63;padding-left:10px;color:#3b4a47">${esc(opts.message)}</p>` : "";
  const button = (label: string) =>
    `<p style="margin:20px 0 0"><a href="${SITE}/student-dashboard/${studentId}" style="display:inline-block;background:#2C6E63;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px">${label}</a></p>`;
  const zh = `<div lang="zh-CN">
      <h1 style="margin:0 0 16px;font-size:20px;color:#173f38">${reminder ? "别忘了上传成绩单" : "请上传最新成绩单"}</h1>
      <p>${name || "同学"}，你好：</p>
      <p>${reminder ? "提醒一下：" : "你的升学顾问"}请你在 <strong>${esc(due)}</strong> 前登录 DreamPlanner，点首页的「成绩单」上传最新的成绩单（PDF、照片或截图都可以）。</p>
      ${note}${button("去上传")}</div>`;
  const en = `<div lang="en">
      <h1 style="margin:0 0 16px;font-size:20px;color:#173f38">${reminder ? "Don't forget your report card" : "Please upload your latest report card"}</h1>
      <p>Hi ${name || "there"},</p>
      <p>${reminder ? "A quick reminder: please" : "Your counselor has asked you to"} upload your latest report card in DreamPlanner by <strong>${esc(due)}</strong>. Sign in and click “Report cards” on your home page (a PDF, photo or screenshot is fine).</p>
      ${note}${button("Upload now")}</div>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body style="margin:0;background:#f5f7f6;font-family:-apple-system,Segoe UI,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2d2a">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#fff;border:1px solid #dfe7e4;border-radius:8px;padding:24px;line-height:1.6">
      ${inOrder(lang, zh, en).join('<div style="border-top:1px dashed #dfe7e4;margin:24px 0"></div>')}
    </div>
    <p style="font-size:12px;color:#6b7c78;margin:12px 4px">${inOrder(lang, "这是 DreamPlanner 自动发送的邮件。", "This email was sent automatically by DreamPlanner.").join("<br>")}</p>
  </div></body></html>`;
  const subject = reminder
    ? subjectFor(lang, `提醒：请在 ${due} 前上传最新成绩单`, `Reminder: upload your report card by ${due}`)
    : subjectFor(lang, `请在 ${due} 前上传最新成绩单`, `Please upload your report card by ${due}`);
  return { subject, html };
}
