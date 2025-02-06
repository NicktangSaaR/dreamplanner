
import { supabase } from "@/integrations/supabase/client";
import { ArticleData } from "./types";

export async function loadArticle(articleId: string) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .single();

  if (error) throw error;
  return data;
}

export async function saveArticle(articleId: string | undefined, articleData: ArticleData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("You must be logged in to create/edit articles");
  }

  if (articleId) {
    const { error } = await supabase
      .from('articles')
      .update({
        ...articleData,
        author_id: user.id
      })
      .eq('id', articleId);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('articles')
      .insert([{
        ...articleData,
        created_at: new Date().toISOString(),
        author_id: user.id
      }]);

    if (error) throw error;
  }
}
