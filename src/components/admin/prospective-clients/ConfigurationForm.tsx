import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SheetsConfig } from "../types";

interface ConfigurationFormProps {
  config: SheetsConfig | null;
}

export default function ConfigurationForm({ config }: ConfigurationFormProps) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const updateConfig = useMutation({
    mutationFn: async (newConfig: { sheet_url: string; form_url: string }) => {
      console.log("Updating sheets configuration...", newConfig);
      setIsSubmitting(true);
      try {
        const { data, error } = await supabase
          .from("client_sheets_config")
          .upsert(
            {
              sheet_url: newConfig.sheet_url.trim(),
              form_url: newConfig.form_url.trim(),
              ...(config?.id ? { id: config.id } : {}),
            },
            { onConflict: "id" }
          )
          .select()
          .single();

        if (error) {
          console.error("Error updating config:", error);
          throw error;
        }

        console.log("Config updated successfully:", data);
        return data;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      toast.success("配置已更新");
      queryClient.invalidateQueries({ queryKey: ["sheetsConfig"] });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast.error("更新配置失败");
    },
  });

  useEffect(() => {
    if (config) {
      setSheetUrl(config.sheet_url);
      setFormUrl(config.form_url);
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim() || !formUrl.trim()) {
      toast.error("请填写所有必填字段");
      return;
    }
    updateConfig.mutate({ sheet_url: sheetUrl, form_url: formUrl });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prospective Client Management</CardTitle>
        <CardDescription>
          Configure Google Sheets integration for prospective client management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="sheet-url" className="text-sm font-medium">
              Google Sheet URL
            </label>
            <Input
              id="sheet-url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="Enter Google Sheet URL"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="form-url" className="text-sm font-medium">
              Google Form URL
            </label>
            <Input
              id="form-url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="Enter Google Form URL"
              required
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Configuration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}