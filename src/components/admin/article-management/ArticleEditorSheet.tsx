
import { Article } from "@/types/article";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ArticleEditor from "../ArticleEditor";

interface ArticleEditorSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedArticle: Article | null;
  onClose: () => void;
}

export default function ArticleEditorSheet({
  isOpen,
  onOpenChange,
  selectedArticle,
  onClose,
}: ArticleEditorSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-[80%] sm:max-w-[600px] overflow-y-auto"
        style={{ maxHeight: '100vh' }}
      >
        <SheetHeader>
          <SheetTitle>{selectedArticle ? '编辑文章' : '新建文章'}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 pb-20">
          <ArticleEditor
            articleId={selectedArticle?.id}
            onSave={onClose}
            onCancel={onClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
