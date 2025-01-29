import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile && !profile.is_admin) {
      navigate('/');
    }
  }, [profile, navigate]);

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-6">
        {/* Admin features will be added here */}
      </div>
    </div>
  );
}