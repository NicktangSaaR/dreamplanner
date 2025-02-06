
import { Article } from "@/types/article";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ArticleTableProps {
  articles: Article[];
  onEdit: (article: Article) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, published: boolean) => void;
}

export default function ArticleTable({ 
  articles, 
  onEdit, 
  onDelete,
  onTogglePublish 
}: ArticleTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>标题</TableHead>
          <TableHead>分类</TableHead>
          <TableHead>发布状态</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {articles?.map((article) => (
          <TableRow key={article.id}>
            <TableCell>{article.title}</TableCell>
            <TableCell>{article.category?.name}</TableCell>
            <TableCell>
              <Switch
                checked={article.published}
                onCheckedChange={(checked) => 
                  onTogglePublish(article.id, checked)
                }
              />
            </TableCell>
            <TableCell>
              {new Date(article.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(article)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  if (confirm('确定要删除这篇文章吗？')) {
                    onDelete(article.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
