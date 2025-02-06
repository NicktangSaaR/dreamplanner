
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ArticleHeaderProps {
  onNew: () => void;
}

export default function ArticleHeader({ onNew }: ArticleHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">文章管理</h2>
      <Button onClick={onNew}>
        <Plus className="h-4 w-4 mr-2" />
        新建文章
      </Button>
    </div>
  );
}
