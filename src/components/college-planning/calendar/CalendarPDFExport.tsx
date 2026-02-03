import jsPDF from "jspdf";
import { Todo } from "@/hooks/todos/useTodoQuery";
import { setupChineseFont } from "./chineseFont";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const exportCalendarAsListPDF = async (todos: Todo[], year: number, studentName?: string) => {
  const pdf = new jsPDF();
  
  // Try to load Chinese font
  const hasChineseFont = await setupChineseFont(pdf);
  
  // Header
  pdf.setFontSize(20);
  pdf.text(`${year} Calendar - Todo List`, 20, 20);
  
  if (studentName) {
    pdf.setFontSize(12);
    pdf.text(`Student: ${studentName}`, 20, 30);
  }
  
  let yPosition = studentName ? 50 : 40;
  
  // Group todos by month
  const todosByMonth: { [key: number]: Todo[] } = {};
  todos.forEach(todo => {
    if (todo.due_date) {
      const todoDate = new Date(todo.due_date);
      if (todoDate.getFullYear() === year) {
        const month = todoDate.getMonth();
        if (!todosByMonth[month]) {
          todosByMonth[month] = [];
        }
        todosByMonth[month].push(todo);
      }
    }
  });
  
  // Generate list by month
  MONTHS.forEach((month, index) => {
    const monthTodos = todosByMonth[index] || [];
    
    // Check if we need a new page
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
    
    // Month header
    pdf.setFontSize(16);
    if (hasChineseFont) {
      pdf.setFont("NotoSansSC", "normal");
    } else {
      pdf.setFont("helvetica", "bold");
    }
    pdf.text(month, 20, yPosition);
    yPosition += 10;
    
    // Todos for this month
    pdf.setFontSize(12);
    if (hasChineseFont) {
      pdf.setFont("NotoSansSC", "normal");
    } else {
      pdf.setFont("helvetica", "normal");
    }
    
    if (monthTodos.length === 0) {
      pdf.text("  No todos this month", 20, yPosition);
      yPosition += 8;
    } else {
      monthTodos.forEach(todo => {
        const status = todo.completed ? "[Done] " : "[ ] ";
        const title = hasChineseFont ? todo.title : sanitizeForPDF(todo.title);
        const text = `  ${status}${title}`;
        
        // Split long text to prevent overflow
        const lines = pdf.splitTextToSize(text, 170);
        lines.forEach((line: string) => {
          pdf.text(line, 20, yPosition);
          yPosition += 8;
          
          // Check if we need a new page
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      });
    }
    
    yPosition += 5; // Extra space between months
  });
  
  // Save the PDF
  pdf.save(`${year}-calendar-todo-list.pdf`);
};

export const exportCalendarAsGridPDF = async (todos: Todo[], year: number, studentName?: string) => {
  const pdf = new jsPDF("landscape");
  
  // Try to load Chinese font
  const hasChineseFont = await setupChineseFont(pdf);
  
  // Header
  pdf.setFontSize(20);
  if (hasChineseFont) {
    pdf.setFont("NotoSansSC", "normal");
  }
  pdf.text(`${year} Calendar`, 20, 20);
  
  if (studentName) {
    pdf.setFontSize(12);
    pdf.text(`Student: ${studentName}`, 20, 30);
  }
  
  // Group todos by month
  const todosByMonth: { [key: number]: Todo[] } = {};
  todos.forEach(todo => {
    if (todo.due_date) {
      const todoDate = new Date(todo.due_date);
      if (todoDate.getFullYear() === year) {
        const month = todoDate.getMonth();
        if (!todosByMonth[month]) {
          todosByMonth[month] = [];
        }
        todosByMonth[month].push(todo);
      }
    }
  });
  
  // Calendar grid - 3 columns x 4 rows (larger cells)
  const startY = studentName ? 45 : 35;
  const cellWidth = 90;
  const cellHeight = 45;
  const startX = 10;
  
  MONTHS.forEach((month, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    
    const x = startX + col * cellWidth;
    const y = startY + row * cellHeight;
    
    // Draw month cell border
    pdf.rect(x, y, cellWidth, cellHeight);
    
    // Month name
    pdf.setFontSize(11);
    if (hasChineseFont) {
      pdf.setFont("NotoSansSC", "normal");
    } else {
      pdf.setFont("helvetica", "bold");
    }
    pdf.text(month, x + 3, y + 8);
    
    // Todos for this month
    const monthTodos = todosByMonth[index] || [];
    pdf.setFontSize(8);
    if (hasChineseFont) {
      pdf.setFont("NotoSansSC", "normal");
    } else {
      pdf.setFont("helvetica", "normal");
    }
    
    let todoY = y + 15;
    if (monthTodos.length === 0) {
      pdf.text("No todos", x + 3, todoY);
    } else {
      monthTodos.slice(0, 5).forEach(todo => { // Show up to 5 todos per cell
        const status = todo.completed ? "✓" : "•";
        const title = hasChineseFont ? todo.title : sanitizeForPDF(todo.title);
        // Allow longer titles (up to 35 chars)
        const truncatedTitle = title.slice(0, 35) + (title.length > 35 ? "..." : "");
        const text = `${status} ${truncatedTitle}`;
        pdf.text(text, x + 3, todoY);
        todoY += 6;
      });
      
      if (monthTodos.length > 5) {
        pdf.text(`+${monthTodos.length - 5} more...`, x + 3, todoY);
      }
    }
  });
  
  // Save the PDF
  pdf.save(`${year}-calendar-grid.pdf`);
};

// Remove non-ASCII characters for fallback when Chinese font is not available
const sanitizeForPDF = (text: string): string => {
  // Replace common Chinese punctuation with ASCII equivalents
  return text
    .replace(/：/g, ':')
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/、/g, ',')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/【/g, '[')
    .replace(/】/g, ']')
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    // Replace Chinese characters with placeholder
    .replace(/[\u4e00-\u9fa5]/g, '?');
};
