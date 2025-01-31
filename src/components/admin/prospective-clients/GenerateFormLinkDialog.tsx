import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Link } from "lucide-react";

interface GenerateFormLinkDialogProps {
  formUrl: string;
}

export default function GenerateFormLinkDialog({ formUrl }: GenerateFormLinkDialogProps) {
  const [open, setOpen] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      toast.success("链接已复制到剪贴板");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("复制链接失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Link className="h-4 w-4" />
          生成链接
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>生成表单链接</DialogTitle>
          <DialogDescription>
            复制下面的链接发送给潜在客户，让他们填写表单。
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input
            value={formUrl}
            readOnly
            className="flex-1"
          />
          <Button variant="secondary" className="gap-2" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
            复制
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}