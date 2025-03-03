
/**
 * Generates HTML email content for both student and counselor
 */
export function generateEmailContent(
  todos: any[],
  studentName: string,
  counselorName: string
) {
  // Create HTML list of todos
  const todoListHtml = todos.map(todo => `
    <li style="margin-bottom: 8px;">
      <strong>${todo.title}</strong>
      ${todo.due_date ? ` - Due: ${new Date(todo.due_date).toLocaleDateString()}` : ''}
      ${todo.starred ? ' ⭐' : ''}
    </li>
  `).join('');
  
  // Create student email HTML template
  const studentHtmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; }
          ul { padding-left: 20px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>待办事项提醒</h1>
          <p>亲爱的 ${studentName},</p>
          <p>请查看以下您需要完成的待办事项:</p>
          <ul>
            ${todoListHtml}
          </ul>
          <p>请尽快完成这些待办事项，以保持您的申请进度。</p>
          <div class="footer">
            <p>此邮件由 DreamPlane Education 自动发送，请勿回复。</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  // Create counselor email HTML template
  const counselorHtmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; }
          ul { padding-left: 20px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>学生待办事项提醒</h1>
          <p>亲爱的 ${counselorName},</p>
          <p>您的学生 ${studentName} 有以下未完成的待办事项:</p>
          <ul>
            ${todoListHtml}
          </ul>
          <p>这些提醒已经同时发送给了学生本人。</p>
          <div class="footer">
            <p>此邮件由 DreamPlane Education 自动发送，请勿回复。</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return { studentHtmlContent, counselorHtmlContent };
}
