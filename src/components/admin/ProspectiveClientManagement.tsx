import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ConfigurationForm from "./prospective-clients/ConfigurationForm";
import QuickAccessCards from "./prospective-clients/QuickAccessCards";
import { SheetsConfig } from "./types";

export default function ProspectiveClientManagement() {
  const { data: config, isLoading } = useQuery({
    queryKey: ["sheetsConfig"],
    queryFn: async () => {
      console.log("Fetching sheets configuration...");
      const { data, error } = await supabase
        .from("client_sheets_config")
        .select("*")
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching config:", error);
        throw error;
      }

      console.log("Fetched config:", data);
      return data as SheetsConfig;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <ConfigurationForm config={config} />
      {config && <QuickAccessCards config={config} />}
    </div>
  );
}