import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { profile } = useProfile();
  const navigate = useNavigate();

  // Redirect if user is not an admin
  useEffect(() => {
    if (profile && !profile.is_admin) {
      navigate('/');
      toast.error("You don't have permission to access this page");
    }
  }, [profile, navigate]);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      console.log("Fetching all profiles");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
      }

      console.log("Fetched profiles:", data);
      return data;
    },
    enabled: !!profile?.is_admin,
  });

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name || "N/A"}</TableCell>
                    <TableCell>{user.user_type}</TableCell>
                    <TableCell>{user.school || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement edit functionality
                          toast.info("Edit functionality coming soon");
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}