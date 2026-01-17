
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
      ${todo.due_date ? ` - Due: ${new Date(todo.due_date).toLocaleDateString()}` : ''}
      ${todo.starred ? ' ⭐' : ''}
    </li>
  `).join('');
  
  return `
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
          <h1>Dreamplanner Todo Reminder</h1>
          <p>The following to-do items are pending for ${studentName}:</p>
          <ul>
            ${todoListHtml}
          </ul>
          <div class="footer">
            <p>此邮件由 DreamPlane Education 自动发送，请勿回复。</p>
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
      ${todo.due_date ? ` - Due: ${new Date(todo.due_date).toLocaleDateString()}` : ''}
      ${todo.starred ? ' ⭐' : ''}
    </li>
  `).join('');
  
  // Create student email HTML template with requested format
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
          <h1>Dreamplanner Weekly Reminders</h1>
          <p>${studentName}, You have the following to-dos to be completed:</p>
          <ul>
            ${todoListHtml}
          </ul>
          <div class="footer">
            <p>此邮件由 DreamPlane Education 自动发送，请勿回复。</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  // Create counselor email HTML template with similar format
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
          <h1>Dreamplanner Weekly Reminders</h1>
          <p>${counselorName}, Your student ${studentName} has the following to-dos to be completed:</p>
          <ul>
            ${todoListHtml}
          </ul>
          <div class="footer">
            <p>此邮件由 DreamPlane Education 自动发送，请勿回复。</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return { studentHtmlContent, counselorHtmlContent };
}
