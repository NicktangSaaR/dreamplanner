import jsPDF from "jspdf";
import { Todo } from "@/hooks/todos/useTodoQuery";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const exportCalendarAsListPDF = (todos: Todo[], year: number, studentName?: string) => {
  const pdf = new jsPDF();
  
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
    pdf.setFont("helvetica", "bold");
    pdf.text(month, 20, yPosition);
    yPosition += 10;
    
    // Todos for this month
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    
    if (monthTodos.length === 0) {
      pdf.text("  No todos this month", 20, yPosition);
      yPosition += 8;
    } else {
      monthTodos.forEach(todo => {
        const status = todo.completed ? "[✓] " : "[ ] ";
        const text = `  ${status}${todo.title}`;
        pdf.text(text, 20, yPosition);
        yPosition += 8;
        
        // Check if we need a new page
        if (yPosition > 280) {
          pdf.addPage();
          yPosition = 20;
        }
      });
    }
    
    yPosition += 5; // Extra space between months
  });
  
  // Save the PDF
  pdf.save(`${year}-calendar-todo-list.pdf`);
};

export const exportCalendarAsGridPDF = (todos: Todo[], year: number, studentName?: string) => {
  const pdf = new jsPDF("landscape");
  
  // Header
  pdf.setFontSize(20);
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
  
  // Calendar grid - 4 columns x 3 rows
  const startY = studentName ? 50 : 40;
  const cellWidth = 65;
  const cellHeight = 50;
  const startX = 20;
  
  MONTHS.forEach((month, index) => {
    const row = Math.floor(index / 4);
    const col = index % 4;
    
    const x = startX + col * cellWidth;
    const y = startY + row * cellHeight;
    
    // Draw month cell border
    pdf.rect(x, y, cellWidth, cellHeight);
    
    // Month name
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(month, x + 2, y + 8);
    
    // Todos for this month
    const monthTodos = todosByMonth[index] || [];
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    
    let todoY = y + 15;
    if (monthTodos.length === 0) {
      pdf.text("No todos", x + 2, todoY);
    } else {
      monthTodos.slice(0, 4).forEach(todo => { // Limit to 4 todos per cell
        const status = todo.completed ? "✓" : "•";
        const text = `${status} ${todo.title.slice(0, 20)}${todo.title.length > 20 ? "..." : ""}`;
        pdf.text(text, x + 2, todoY);
        todoY += 6;
      });
      
      if (monthTodos.length > 4) {
        pdf.text(`+${monthTodos.length - 4} more...`, x + 2, todoY);
      }
    }
  });
  
  // Save the PDF
  pdf.save(`${year}-calendar-grid.pdf`);
};