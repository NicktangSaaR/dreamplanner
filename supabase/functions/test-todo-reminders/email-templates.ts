
/**
 * Generates HTML email content for a custom recipient
 */
export function generateCustomEmailContent(
  todos: any[],
  studentName: string
) {
  // Create HTML list of todos
  const todoListHtml = todos.map(todo => `
    <li style="margin-bottom: 8px;">
      <strong>${todo.title}</strong>
      ${todo.due_date ? ` - 截止日期 Due: ${new Date(todo.due_date).toLocaleDateString()}` : ''}
      ${todo.starred ? ' ⭐' : ''}
    </li>
  `).join('');
  
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; font-size: 24px; }
          .greeting { font-size: 16px; margin-bottom: 20px; }
          ul { padding-left: 20px; }
          .contact { margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>DreamPlane 待办事项提醒 / Todo Reminder</h1>
          
          <p class="greeting">
            Dear ${studentName}，<br><br>
            请记得确认完成如下待办工作：<br>
            Please remember to complete the following pending tasks:
          </p>
          
          <ul>
            ${todoListHtml}
          </ul>
          
          <div class="contact">
            <p style="margin: 0;">
              <strong>如有疑问，请第一时间联系我们。</strong><br>
              <strong>If you have any questions, please contact us immediately.</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>此邮件由 DreamPlane Education 自动发送，请勿回复。</p>
            <p>This email was sent automatically by DreamPlane Education. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

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
      ${todo.due_date ? ` - 截止日期 Due: ${new Date(todo.due_date).toLocaleDateString()}` : ''}
      ${todo.starred ? ' ⭐' : ''}
    </li>
  `).join('');
  
  // Create student email HTML template with bilingual format
  const studentHtmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; font-size: 24px; }
          .greeting { font-size: 16px; margin-bottom: 20px; }
          ul { padding-left: 20px; }
          .contact { margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>DreamPlane 待办事项提醒 / Todo Reminder</h1>
          
          <p class="greeting">
            Dear ${studentName}，<br><br>
            请记得确认完成如下待办工作：<br>
            Please remember to complete the following pending tasks:
          </p>
          
          <ul>
            ${todoListHtml}
          </ul>
          
          <div class="contact">
            <p style="margin: 0;">
              <strong>如有疑问，请第一时间联系我们。</strong><br>
              <strong>If you have any questions, please contact us immediately.</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>此邮件由 DreamPlane Education 自动发送，请勿回复。</p>
            <p>This email was sent automatically by DreamPlane Education. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  // Create counselor email HTML template with bilingual format
  const counselorHtmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; font-size: 24px; }
          .greeting { font-size: 16px; margin-bottom: 20px; }
          ul { padding-left: 20px; }
          .contact { margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>DreamPlane 学生待办提醒 / Student Todo Reminder</h1>
          
          <p class="greeting">
            Dear ${counselorName}，<br><br>
            您的学生 <strong>${studentName}</strong> 有以下待办工作需要完成：<br>
            Your student <strong>${studentName}</strong> has the following pending tasks to complete:
          </p>
          
          <ul>
            ${todoListHtml}
          </ul>
          
          <div class="contact">
            <p style="margin: 0;">
              <strong>请提醒学生及时完成。</strong><br>
              <strong>Please remind the student to complete on time.</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>此邮件由 DreamPlane Education 自动发送，请勿回复。</p>
            <p>This email was sent automatically by DreamPlane Education. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return { studentHtmlContent, counselorHtmlContent };
}
