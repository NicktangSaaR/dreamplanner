
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
        className="w-[80%] sm:max-w-[600px]"
        style={{ 
          maxHeight: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
        }}
      >
        <SheetHeader className="mb-4">
          <SheetTitle>{selectedArticle ? '编辑文章' : '新建文章'}</SheetTitle>
        </SheetHeader>
        
        <div 
          className="flex-1 overflow-y-auto"
          style={{
            marginBottom: '20px',
          }}
        >
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
