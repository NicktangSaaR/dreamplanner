import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { FileText, Link as LinkIcon } from "lucide-react";

type SheetsConfig = {
  id: string;
  sheet_url: string;
  form_url: string;
};

export default function ProspectiveClientManagement() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const queryClient = useQueryClient();

  // Fetch current configuration
  const { data: config, isLoading } = useQuery({
    queryKey: ["sheetsConfig"],
    queryFn: async () => {
      console.log("Fetching sheets configuration...");
      const { data, error } = await supabase
        .from("client_sheets_config")
        .select("*")
        .single();

      if (error) {
        console.error("Error fetching config:", error);
        throw error;
      }

      console.log("Fetched config:", data);
      return data as SheetsConfig;
    },
  });

  // Update configuration mutation
  const updateConfig = useMutation({
    mutationFn: async (newConfig: { sheet_url: string; form_url: string }) => {
      console.log("Updating sheets configuration...", newConfig);
      const { data, error } = await supabase
        .from("client_sheets_config")
        .upsert(
          {
            sheet_url: newConfig.sheet_url,
            form_url: newConfig.form_url,
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

  // Set initial form values when config is loaded
  useState(() => {
    if (config) {
      setSheetUrl(config.sheet_url);
      setFormUrl(config.form_url);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig.mutate({ sheet_url: sheetUrl, form_url: formUrl });
  };

  const openUrl = (url: string) => {
    window.open(url, '_blank');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
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
              />
            </div>
            <Button type="submit" className="w-full">
              Save Configuration
            </Button>
          </form>
        </CardContent>
      </Card>

      {config && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="cursor-pointer" onClick={() => openUrl(config.sheet_url)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                View Responses Sheet
              </CardTitle>
              <CardDescription>
                Open Google Sheet to view all form responses
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer" onClick={() => openUrl(config.form_url)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Client Registration Form
              </CardTitle>
              <CardDescription>
                Open Google Form to share with prospective clients
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}