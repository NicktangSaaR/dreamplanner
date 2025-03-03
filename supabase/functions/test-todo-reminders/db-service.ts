
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

export interface DatabaseService {
  getUncompletedTodos(studentId: string): Promise<any[]>;
}

export class SupabaseDatabaseService implements DatabaseService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getUncompletedTodos(studentId: string): Promise<any[]> {
    const { data: todos, error: todosError } = await this.supabase
      .from("todos")
      .select(`
        id, 
        title, 
        completed, 
        starred, 
        due_date, 
        author_id,
        profiles:author_id (
          id,
          email,
          full_name,
          user_type
        )
      `)
      .eq("author_id", studentId)
      .eq("completed", false);
    
    if (todosError) {
      console.error("Error fetching todos:", todosError);
      throw todosError;
    }
    
    return todos || [];
  }
}

export function createDatabaseService(supabaseUrl: string, supabaseKey: string): DatabaseService {
  return new SupabaseDatabaseService(supabaseUrl, supabaseKey);
}
