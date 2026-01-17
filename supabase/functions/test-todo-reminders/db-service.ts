
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

export interface DatabaseService {
  getUncompletedTodos(studentId: string): Promise<any[]>;
  getCounselorForStudent(studentId: string): Promise<any>;
}

export class SupabaseDatabaseService implements DatabaseService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getUncompletedTodos(studentId: string): Promise<any[]> {
    // First get the todos
    const { data: todos, error: todosError } = await this.supabase
      .from("todos")
      .select("id, title, completed, starred, due_date, author_id")
      .eq("author_id", studentId)
      .eq("completed", false);
    
    if (todosError) {
      console.error("Error fetching todos:", todosError);
      throw todosError;
    }
    
    if (!todos || todos.length === 0) {
      return [];
    }
    
    // Get student profile separately
    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .select("id, email, full_name, user_type")
      .eq("id", studentId)
      .single();
    
    if (profileError) {
      console.error("Error fetching student profile:", profileError);
    }
    
    // Attach profile to todos
    return todos.map(todo => ({
      ...todo,
      profiles: profile || null
    }));
  }

  async getCounselorForStudent(studentId: string): Promise<any> {
    try {
      console.log(`Fetching counselor for student: ${studentId}`);
      
      // 获取与学生关联的辅导员
      const { data: relationship, error: relationshipError } = await this.supabase
        .from("counselor_student_relationships")
        .select(`
          counselor_id
        `)
        .eq("student_id", studentId)
        .single();
      
      if (relationshipError) {
        console.error("Error fetching counselor relationship:", relationshipError);
        return null;
      }
      
      if (!relationship || !relationship.counselor_id) {
        console.log(`No counselor found for student: ${studentId}`);
        return null;
      }
      
      console.log(`Found counselor ID: ${relationship.counselor_id}`);
      
      // 获取辅导员详细信息
      const { data: counselor, error: counselorError } = await this.supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email
        `)
        .eq("id", relationship.counselor_id)
        .single();
      
      if (counselorError) {
        console.error("Error fetching counselor profile:", counselorError);
        return null;
      }
      
      console.log(`Found counselor: ${JSON.stringify(counselor)}`);
      return counselor;
    } catch (error) {
      console.error("Exception in getCounselorForStudent:", error);
      return null;
    }
  }
}

export function createDatabaseService(supabaseUrl: string, supabaseKey: string): DatabaseService {
  return new SupabaseDatabaseService(supabaseUrl, supabaseKey);
}
