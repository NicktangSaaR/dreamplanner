// The email a student gets when their counselor sends a message from DreamPlanner.
// The message itself is shown as written; the frame around it follows the
// student's email language (English first when both).
import { type EmailLang, inOrder } from "../_shared/emailLang.ts";

const SITE = "https://dreamplaneredu.com";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', Arial, sans-serif";
const C = { ink: "#1f2d2a", muted: "#5f6f6b", line: "#e3ebe8", brand: "#1f5c4d", soft: "#f3f7f5" };
export const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function messageEmail(opts: {
  studentName: string; senderName: string; subject: string | null; body: string; lang: EmailLang; canReply: boolean;
}) {
  const { lang, canReply } = opts;
  const s = esc(opts.studentName), c = esc(opts.senderName || "");
  const text = esc(opts.body).replace(/\r?\n/g, "<br>");
  const greet = inOrder(lang, `${s ? `${s}，` : ""}你好！${c || "你的顾问"}在 DreamPlanner 给你发了一条消息：`, `Hi${s ? ` ${s}` : ""}, ${c || "your counselor"} sent you a message on DreamPlanner:`);
  const reply = canReply
    ? inOrder(lang, "直接回复这封邮件即可回复顾问。", "Reply to this email to answer your counselor.")
    : inOrder(lang, "如有问题请联系你的顾问。", "If you have questions, please contact your counselor.");
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.soft};font-family:${FONT};">
  <div style="max-width:600px;margin:0 auto;padding:16px;">
    <div style="background:#ffffff;border:1px solid ${C.line};border-radius:8px;padding:24px;font-family:${FONT};">
      ${greet.map((g) => `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${C.muted};">${g}</p>`).join("")}
      ${opts.subject ? `<h1 style="margin:16px 0 8px;font-size:19px;line-height:1.4;color:${C.brand};font-weight:600;">${esc(opts.subject)}</h1>` : ""}
      <div style="margin:${opts.subject ? "0" : "16px"} 0 20px;padding:14px 16px;background:${C.soft};border-left:3px solid ${C.brand};border-radius:4px;font-size:15px;line-height:1.75;color:${C.ink};">${text}</div>
      ${reply.map((r) => `<p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:${C.muted};">${r}</p>`).join("")}
      <p style="margin:16px 0 0;"><a href="${SITE}/login" style="display:inline-block;background:${C.brand};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:15px;">${inOrder(lang, "打开 DreamPlanner", "Open DreamPlanner").join(" · ")}</a></p>
    </div>
    <p style="margin:12px 4px 0;font-size:12px;line-height:1.6;color:${C.muted};font-family:${FONT};">${inOrder(lang, "此邮件由 DreamPlanner 代你的顾问发送。", "Sent by DreamPlanner on behalf of your counselor.").join("<br>")}</p>
  </div>
</body></html>`;
  const fallback = inOrder(lang, `来自${opts.senderName || "顾问"}的消息`, `Message from ${opts.senderName || "your counselor"}`).join(" · ");
  return { subject: opts.subject?.trim() || fallback, html };
}
