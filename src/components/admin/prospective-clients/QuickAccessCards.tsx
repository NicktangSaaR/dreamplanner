import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FileText, Link as LinkIcon } from "lucide-react";
import { SheetsConfig } from "../types";

interface QuickAccessCardsProps {
  config: SheetsConfig;
}

export default function QuickAccessCards({ config }: QuickAccessCardsProps) {
  const openUrl = (url: string) => {
    window.open(url, '_blank');
  };

  return (
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
  );
}