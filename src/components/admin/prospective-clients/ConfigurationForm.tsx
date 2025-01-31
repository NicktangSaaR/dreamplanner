import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
      form_url: formData.get('form_url'),
      sheet_url: formData.get('sheet_url'),
    };

    try {
      const { error } = await supabase
        .from('client_sheets_config')
        .upsert(updates);

      if (error) throw error;
      
      toast.success("Configuration updated successfully");
      onUpdate();
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error("Failed to update configuration");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form_url">Form URL</Label>
        <Input
          id="form_url"
          name="form_url"
          defaultValue={formUrl}
          placeholder="Enter the form URL"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sheet_url">Sheet URL</Label>
        <Input
          id="sheet_url"
          name="sheet_url"
          defaultValue={sheetUrl}
          placeholder="Enter the sheet URL"
        />
      </div>

      <Button type="submit">Save Configuration</Button>
    </form>
  );
}