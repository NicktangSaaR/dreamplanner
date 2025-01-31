import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import QuickAccessCards from "./prospective-clients/QuickAccessCards";
import ConfigurationForm from "./prospective-clients/ConfigurationForm";
import { Button } from "@/components/ui/button";
import { Download, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  student_name: string;
  grade: string;
  school: string;
  gpa: number | null;
  created_at: string;
  transcript_url: string | null;
}

interface Config {
  form_url: string;
  sheet_url: string;
}

export default function ProspectiveClientManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [config, setConfig] = useState<Config>({ form_url: '', sheet_url: '' });
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('prospective_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error("Failed to fetch leads");
    }
  };

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('client_sheets_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error("Failed to fetch configuration");
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prospective_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Lead deleted successfully");
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error("Failed to delete lead");
    }
  };

  const downloadTranscript = async (url: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('transcripts')
        .download(url);

      if (error) throw error;

      // Create a download link
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop() || 'transcript';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading transcript:', error);
      toast.error("Failed to download transcript");
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchConfig();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <QuickAccessCards
        totalLeads={leads.length}
        totalDownloads={leads.filter(l => l.transcript_url).length}
      />

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <ConfigurationForm
            formUrl={config.form_url}
            sheetUrl={config.sheet_url}
            onUpdate={fetchConfig}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prospective Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>School</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>{lead.student_name}</TableCell>
                  <TableCell>{lead.grade}</TableCell>
                  <TableCell>{lead.school}</TableCell>
                  <TableCell>{lead.gpa || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(lead.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {lead.transcript_url && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => downloadTranscript(lead.transcript_url!)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteLead(lead.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}