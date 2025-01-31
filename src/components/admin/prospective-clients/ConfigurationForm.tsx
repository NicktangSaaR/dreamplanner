import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ConfigurationFormProps {
  formUrl: string;
  sheetUrl: string;
  onUpdate: () => void;
}

export default function ConfigurationForm({ formUrl, sheetUrl, onUpdate }: ConfigurationFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const updates = {
      form_url: (formData.get('form_url') as string) || '',
      sheet_url: (formData.get('sheet_url') as string) || '',
    };

    try {
      const { error } = await supabase
        .from('client_sheets_config')
        .upsert(updates);

      if (error) throw error;
      
      toast.success("配置更新成功");
      onUpdate();
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error("配置更新失败");
    }
  };

  return (
    <div className="space-y-6">
      {!formUrl && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            请先设置表单链接，然后才能生成分享链接
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="form_url">表单链接</Label>
          <Input
            id="form_url"
            name="form_url"
            defaultValue={formUrl}
            placeholder="请输入 Google 表单链接"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sheet_url">表格链接</Label>
          <Input
            id="sheet_url"
            name="sheet_url"
            defaultValue={sheetUrl}
            placeholder="请输入 Google 表格链接"
          />
        </div>

        <Button type="submit">保存配置</Button>
      </form>
    </div>
  );
}