import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Article, ArticleCategory } from "@/types/article";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ArticleEditorProps {
  article?: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ArticleFormData {
  title: string;
  content: string;
  category_id: string;
}

const fontSizes = [
  "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"
];

const colors = [
  "#000000", "#9b87f5", "#7E69AB", "#6E59A5", "#D6BCFA", 
  "#F2FCE2", "#FEF7CD", "#FEC6A1", "#FFDEE2", "#D3E4FD"
];

export default function ArticleEditor({ article, isOpen, onClose }: ArticleEditorProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorState, setEditorState] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<ArticleFormData>({
    defaultValues: {
      title: article?.title || "",
      category_id: article?.category_id || ""
    }
  });

  useEffect(() => {
    if (article) {
      reset({
        title: article.title,
        category_id: article.category_id || "",
      });
      setEditorState(article.content);
    } else {
      reset({
        title: "",
        category_id: "",
      });
      setEditorState("");
    }
  }, [article, reset]);

  const { data: categories } = useQuery({
    queryKey: ['article-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ArticleCategory[];
    }
  });

  const saveArticleMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const { error } = await supabase
        .from('articles')
        .upsert({
          id: article?.id,
          title: data.title,
          content: contentRef.current?.innerHTML || "",
          category_id: data.category_id,
          author_id: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success(article ? "文章已更新" : "文章已创建");
      onClose();
    },
    onError: (error) => {
      console.error("Error saving article:", error);
      toast.error("保存失败：" + error.message);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const onSubmit = async (data: ArticleFormData) => {
    setIsSubmitting(true);
    saveArticleMutation.mutate(data);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const handleLinkInsert = () => {
    const url = prompt("请输入链接地址：");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const handleImageInsert = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;
        
        try {
          const { error: uploadError } = await supabase.storage
            .from("article-images")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from("article-images")
            .getPublicUrl(filePath);

          execCommand("insertImage", data.publicUrl);
          toast.success("图片上传成功");
        } catch (error) {
          console.error("Error uploading image:", error);
          toast.error("图片上传失败");
        }
      }
    };
    input.click();
  };

  const handleVideoInsert = () => {
    const url = prompt("请输入视频链接（支持YouTube嵌入链接）：");
    if (url) {
      const videoHtml = `<iframe width="560" height="315" src="${url}" frameborder="0" allowfullscreen></iframe>`;
      contentRef.current?.focus();
      document.execCommand("insertHTML", false, videoHtml);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{article ? "编辑文章" : "新建文章"}</DialogTitle>
          <DialogDescription>
            在这里编辑文章内容。填写完成后点击保存。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              {...register("title", { required: "标题不能为空" })}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">分类</Label>
            <Select
              onValueChange={(value) => setValue("category_id", value)}
              defaultValue={article?.category_id || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>内容</Label>
            <div className="border rounded-md">
              <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => execCommand("bold")}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>加粗</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => execCommand("italic")}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>斜体</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => execCommand("underline")}
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>下划线</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => execCommand("formatBlock", "<h1>")}
                      >
                        <Heading1 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>一级标题</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => execCommand("formatBlock", "<h2>")}
                      >
                        <Heading2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>二级标题</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => execCommand("justifyLeft")}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>左对齐</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => execCommand("justifyCenter")}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>居中对齐</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => execCommand("justifyRight")}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>右对齐</TooltipContent>
                  </Tooltip>

                  <Popover>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Type className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>字号</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className="w-40">
                      <div className="grid grid-cols-2 gap-2">
                        {fontSizes.map((size) => (
                          <Button
                            key={size}
                            variant="ghost"
                            size="sm"
                            onClick={() => execCommand("fontSize", size)}
                            style={{ fontSize: size }}
                          >
                            {size}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Palette className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>字体颜色</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <PopoverContent className="w-40">
                      <div className="grid grid-cols-5 gap-2">
                        {colors.map((color) => (
                          <Button
                            key={color}
                            variant="ghost"
                            size="icon"
                            onClick={() => execCommand("foreColor", color)}
                            className="w-6 h-6 p-0"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLinkInsert}
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>插入链接</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleImageInsert}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>插入图片</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleVideoInsert}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>插入视频</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div
                ref={contentRef}
                contentEditable
                className="min-h-[300px] p-4 focus:outline-none"
                dangerouslySetInnerHTML={{ __html: editorState }}
                onInput={(e) => setEditorState(e.currentTarget.innerHTML)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
