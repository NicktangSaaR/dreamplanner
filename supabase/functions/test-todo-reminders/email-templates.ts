// To-do reminder emails, for the student and their counselor. Each email has a
// complete Chinese version followed by a complete English version.
//
// Styles are inline (many mail apps drop <style> blocks), the font list covers
// Chinese on every platform, and long titles wrap instead of being cut off.

const SITE = "https://dreamplaneredu.com";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans SC', Arial, sans-serif";
const C = { ink: "#1f2d2a", muted: "#5f6f6b", line: "#e3ebe8", brand: "#1f5c4d", soft: "#f3f7f5", late: "#b42318" };

type Todo = {
  title?: string | null;
  title_zh?: string | null;
  title_en?: string | null;
  /** The title the translations were made from; if it differs, show the title as typed. */
  title_source?: string | null;
  due_date?: string | null;
  starred?: boolean | null;
};

const titleIn = (t: Todo, lang: "zh" | "en") =>
  (t.title_source === t.title ? (lang === "zh" ? t.title_zh : t.title_en) : null) || t.title;

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const today = () => new Date().toISOString().slice(0, 10);
const day = (d?: string | null) => (d ? String(d).slice(0, 10) : "");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const zhDate = (d: string) => `${Number(d.slice(0, 4))}年${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;
const enDate = (d: string) => `${MONTHS[Number(d.slice(5, 7)) - 1]} ${Number(d.slice(8, 10))}, ${d.slice(0, 4)}`;

/** Dated items first (soonest first), then undated; starred first within a day. */
function sorted(todos: Todo[]) {
  return [...todos].sort((a, b) => {
    const da = day(a.due_date) || "9999", db = day(b.due_date) || "9999";
    return da === db ? Number(!!b.starred) - Number(!!a.starred) : da < db ? -1 : 1;
  });
}

function list(todos: Todo[], lang: "zh" | "en") {
  const now = today();
  const rows = sorted(todos).map((t) => {
    const d = day(t.due_date);
    const late = d && d < now;
    const when = d
      ? `<div style="margin-top:2px;font-size:13px;color:${late ? C.late : C.muted};">${
          lang === "zh" ? `截止：${zhDate(d)}${late ? "（已逾期）" : ""}` : `Due ${enDate(d)}${late ? " (overdue)" : ""}`
        }</div>`
      : "";
    return `<tr><td style="padding:10px 12px;border-top:1px solid ${C.line};font-size:15px;line-height:1.5;color:${C.ink};word-break:break-word;overflow-wrap:anywhere;">
      ${t.starred ? "★ " : ""}${esc(titleIn(t, lang)) || (lang === "zh" ? "（未命名待办）" : "(untitled to-do)")}${when}</td></tr>`;
  });
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${C.line};border-radius:6px;">${rows.join("")}</table>`;
}

function section(lang: "zh" | "en", heading: string, intro: string, todos: Todo[], button: { href: string; label: string }, closing: string) {
  return `
  <div lang="${lang === "zh" ? "zh-CN" : "en"}" style="padding:24px;">
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:${C.brand};font-weight:600;">${heading}</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.ink};">${intro}</p>
    ${list(todos, lang)}
    <p style="margin:20px 0 0;"><a href="${button.href}" style="display:inline-block;background:${C.brand};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:15px;">${button.label}</a></p>
    <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:${C.muted};">${closing}</p>
  </div>`;
}

function page(zh: string, en: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.soft};font-family:${FONT};">
  <div style="max-width:600px;margin:0 auto;padding:16px;">
    <div style="background:#ffffff;border:1px solid ${C.line};border-radius:8px;font-family:${FONT};">
      ${zh}
      <div style="border-top:1px dashed ${C.line};margin:0 24px;"></div>
      ${en}
    </div>
    <p style="margin:12px 4px 0;font-size:12px;line-height:1.6;color:${C.muted};font-family:${FONT};">
      此邮件由 DreamPlanner 自动发送，请勿直接回复。<br>This email was sent automatically by DreamPlanner. Please don't reply to it.
    </p>
  </div>
</body></html>`;
}

/** Email to the student (also used when sending to another address for this student). */
export function studentEmail(todos: Todo[], studentName: string) {
  const name = esc(studentName);
  const n = todos.length;
  const zh = section("zh", "待办提醒",
    `${name}，你好！你还有 <strong>${n}</strong> 项待办没有完成，请记得按时完成：`,
    todos, { href: `${SITE}/login`, label: "打开 DreamPlanner" },
    "完成后在 DreamPlanner 里打勾即可。顾问布置的任务如果需要更多时间，可以点任务旁的「申请延期」。有问题请随时联系你的顾问。");
  const en = section("en", "To-do reminder",
    `Hi ${name}, you still have <strong>${n}</strong> to-do${n === 1 ? "" : "s"} to finish:`,
    todos, { href: `${SITE}/login`, label: "Open DreamPlanner" },
    "Tick each one off in DreamPlanner when it's done. Need more time on a task from your counselor? Use “Ask for more time” next to it. Questions? Contact your counselor any time.");
  return { subject: `待办提醒 · To-do reminder：${studentName}`, html: page(zh, en) };
}

/** A titled list, or a short line when it's empty. */
function block(lang: "zh" | "en", title: string, items: Todo[], empty: string) {
  return `<h2 style="margin:20px 0 8px;font-size:16px;line-height:1.4;color:${C.ink};font-weight:600;">${title}</h2>
    ${items.length ? list(items, lang) : `<p style="margin:0;font-size:14px;color:${C.muted};">${empty}</p>`}`;
}

/** Email to the counselor about one student: the student's to-dos and the counselor's own tasks. */
export function counselorEmail(todos: Todo[], studentName: string, counselorName: string, mine: Todo[] = []) {
  const s = esc(studentName), c = esc(counselorName);
  const n = todos.length, m = mine.length;
  const part = (lang: "zh" | "en") => {
    const zh = lang === "zh";
    const intro = zh
      ? `${c}，你好！关于学生 <strong>${s}</strong>：学生还有 <strong>${n}</strong> 项待办${n ? "（已同时提醒学生）" : ""}，你还有 <strong>${m}</strong> 项要做的事。`
      : `Hi ${c}, about your student <strong>${s}</strong>: they have <strong>${n}</strong> open to-do${n === 1 ? "" : "s"}${n ? " (we've reminded them too)" : ""}, and you have <strong>${m}</strong> task${m === 1 ? "" : "s"} of your own.`;
    const button = zh ? { href: `${SITE}/counselor-dashboard`, label: "打开顾问工作台" } : { href: `${SITE}/counselor-dashboard`, label: "Open your workspace" };
    return `
  <div lang="${zh ? "zh-CN" : "en"}" style="padding:24px;">
    <h1 style="margin:0 0 12px;font-size:20px;line-height:1.4;color:${C.brand};font-weight:600;">${zh ? "待办提醒" : "To-do reminder"}</h1>
    <p style="margin:0;font-size:15px;line-height:1.7;color:${C.ink};">${intro}</p>
    ${block(lang, zh ? `你要做的事（${m}）` : `Your tasks (${m})`, mine, zh ? "你没有未完成的事。" : "Nothing open for you.")}
    ${block(lang, zh ? `学生要做的事（${n}）` : `The student's to-dos (${n})`, todos, zh ? "学生的待办都完成了。" : "The student has finished everything.")}
    <p style="margin:20px 0 0;"><a href="${button.href}" style="display:inline-block;background:${C.brand};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:15px;">${button.label}</a></p>
    <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:${C.muted};">${zh
      ? "可以在学生的「跟进」页查看进度、修改日期或处理延期申请。"
      : "Use the student's Follow-up tab to check progress, change dates or answer extension requests."}</p>
  </div>`;
  };
  return { subject: `待办提醒 · To-do reminder：${studentName}`, html: page(part("zh"), part("en")) };
}
