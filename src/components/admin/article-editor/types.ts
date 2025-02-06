
export interface ArticleEditorProps {
  articleId?: string;
  onSave?: (article: any) => void;
  onCancel?: () => void;
}

export interface ArticleData {
  title: string;
  content: string;
  category_id?: string;
  updated_at: string;
  created_at?: string;
  author_id?: string;
}

export interface FormattingCommand {
  name: string;
  label: string;
  icon?: React.ReactNode;
  value?: string;
}

export interface FormattingToolbarProps {
  onExecCommand: (command: string, value?: string) => void;
}
