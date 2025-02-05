
export interface Article {
  id: string;
  title: string;
  content: string;
  category_id: string | null;
  author_id: string;
  published: boolean;
  publish_date: string | null;
  created_at: string;
  updated_at: string;
  category?: ArticleCategory | null;
  article_categories?: ArticleCategory;
}

export interface ArticleCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}
