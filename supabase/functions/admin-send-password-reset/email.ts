// The "set a new password" email an admin sends (Chinese, then English).
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', Arial, sans-serif";
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function resetEmail(name: string, href: string) {
  const n = esc(name);
  const btn = (label: string) => `<p style="margin:16px 0;"><a href="${esc(href)}" style="display:inline-block;background:#1f5c4d;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:15px;">${label}</a></p>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f7f5;font-family:${FONT};">
<div style="max-width:600px;margin:0 auto;padding:16px;">
<div style="background:#ffffff;border:1px solid #e3ebe8;border-radius:8px;">
  <div lang="zh-CN" style="padding:24px;color:#1f2d2a;font-size:15px;line-height:1.7;">
    <h1 style="margin:0 0 12px;font-size:20px;color:#1f5c4d;font-weight:600;">请设置新的 DreamPlanner 密码</h1>
    <p style="margin:0;">${n ? `${n}，你好！` : "你好！"}DreamPlanner 管理员为你的账号发起了密码重置。请点击下面的按钮设置新密码，链接 1 小时内有效。</p>
    ${btn("设置新密码")}
    <p style="margin:0;font-size:14px;color:#5f6f6b;">设置新密码之前，原来的密码仍然可以使用。如有疑问，请联系你的顾问。</p>
  </div>
  <div style="border-top:1px dashed #e3ebe8;margin:0 24px;"></div>
  <div lang="en" style="padding:24px;color:#1f2d2a;font-size:15px;line-height:1.7;">
    <h1 style="margin:0 0 12px;font-size:20px;color:#1f5c4d;font-weight:600;">Please set a new DreamPlanner password</h1>
    <p style="margin:0;">${n ? `Hi ${n}, a` : "A"} DreamPlanner administrator has started a password reset for your account. Click below to set a new password; the link works for 1 hour.</p>
    ${btn("Set a new password")}
    <p style="margin:0;font-size:14px;color:#5f6f6b;">Your current password keeps working until you set a new one. Questions? Contact your counselor.</p>
  </div>
</div>
<p style="margin:12px 4px 0;font-size:12px;line-height:1.6;color:#5f6f6b;">此邮件由 DreamPlanner 自动发送，请勿直接回复。<br>This email was sent automatically by DreamPlanner. Please don't reply to it.</p>
</div></body></html>`;
  return { subject: "请设置新的 DreamPlanner 密码 · Set a new DreamPlanner password", html };
}

