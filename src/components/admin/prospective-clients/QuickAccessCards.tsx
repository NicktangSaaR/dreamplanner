import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Users } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatsCard({ title, value, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

interface QuickAccessCardsProps {
  totalLeads: number;
  totalDownloads: number;
}

export default function QuickAccessCards({ totalLeads, totalDownloads }: QuickAccessCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Leads"
        value={totalLeads}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
      <StatsCard
        title="Form Downloads"
        value={totalDownloads}
        icon={<Download className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
}