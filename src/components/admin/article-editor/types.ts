
export interface ArticleEditorProps {
  articleId?: string;
  onSave?: (article: any) => void;
  onCancel?: () => void;
}

export interface ArticleData {
  title: string;
  content: string;
  updated_at: string;
  created_at?: string;
  author_id?: string;
}
