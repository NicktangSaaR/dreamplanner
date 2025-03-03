
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0'
import { Resend } from 'npm:resend@2.0.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const resendApiKey = Deno.env.get('RESEND_API_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseKey)
const resend = new Resend(resendApiKey)

interface Todo {
  id: string
  title: string
  completed: boolean
  author_id: string
}

interface StudentProfile {
  id: string
  full_name: string | null
  email: string | null
}

interface CounselorProfile {
  id: string
  full_name: string | null
  email: string | null
}

async function getCounselorForStudent(studentId: string): Promise<CounselorProfile | null> {
  const { data, error } = await supabase
    .from('counselor_student_relationships')
    .select(`
      counselor_id,
      profiles:counselor_id(id, full_name, email)
    `)
    .eq('student_id', studentId)
    .single()

  if (error || !data) {
    console.error('Error getting counselor for student:', error)
    return null
  }

  return data.profiles as CounselorProfile
}

async function getStudentProfile(studentId: string): Promise<StudentProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', studentId)
    .single()

  if (error || !data) {
    console.error('Error getting student profile:', error)
    return null
  }

  return data as StudentProfile
}

async function getUncompletedTodos(): Promise<{ [studentId: string]: Todo[] }> {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('completed', false)

  if (error) {
    console.error('Error fetching uncompleted todos:', error)
    return {}
  }

  // Group todos by student ID
  const todosByStudent: { [studentId: string]: Todo[] } = {}
  for (const todo of data) {
    if (!todosByStudent[todo.author_id]) {
      todosByStudent[todo.author_id] = []
    }
    todosByStudent[todo.author_id].push(todo)
  }

  return todosByStudent
}

function generateEmailContent(studentName: string, todos: Todo[]): string {
  let todoListHtml = ''
  todos.forEach(todo => {
    todoListHtml += `<li style="margin-bottom: 8px;">${todo.title}</li>`
  })

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a5568;">Weekly Todo Reminder for ${studentName}</h2>
      <p>The following tasks are still pending completion:</p>
      <ul style="padding-left: 20px;">
        ${todoListHtml}
      </ul>
      <p>Please log in to review and complete these tasks.</p>
      <p style="color: #718096; font-size: 14px; margin-top: 20px;">
        This is an automated reminder from the College Planning System.
      </p>
    </div>
  `
}

async function sendReminderEmails() {
  try {
    const todosByStudent = await getUncompletedTodos()
    
    for (const [studentId, todos] of Object.entries(todosByStudent)) {
      if (todos.length === 0) continue // Skip if no uncompleted todos
      
      // Get student profile
      const studentProfile = await getStudentProfile(studentId)
      if (!studentProfile || !studentProfile.email) {
        console.log(`Student ${studentId} has no email, skipping...`)
        continue
      }
      
      // Get counselor for student
      const counselorProfile = await getCounselorForStudent(studentId)
      
      const studentName = studentProfile.full_name || 'Student'
      const emailContent = generateEmailContent(studentName, todos)
      
      // Send email to student
      console.log(`Sending email to student: ${studentProfile.email}`)
      await resend.emails.send({
        from: 'College Planning System <onboarding@resend.dev>',
        to: [studentProfile.email],
        subject: 'Weekly Todo Reminder',
        html: emailContent,
      })
      
      // Send email to counselor if exists
      if (counselorProfile && counselorProfile.email) {
        console.log(`Sending email to counselor: ${counselorProfile.email}`)
        await resend.emails.send({
          from: 'College Planning System <onboarding@resend.dev>',
          to: [counselorProfile.email],
          subject: `Todo Reminder for ${studentName}`,
          html: emailContent,
        })
      }
      
      console.log(`Reminder emails sent for ${studentName} with ${todos.length} pending todos`)
    }
    
    console.log('Weekly reminder process completed successfully')
    return { success: true, message: 'Reminders sent successfully' }
  } catch (error) {
    console.error('Error in weekly reminder process:', error)
    return { success: false, error: error.message }
  }
}

// Handle the request
Deno.serve(async () => {
  try {
    const result = await sendReminderEmails()
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in weekly todo reminders function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
