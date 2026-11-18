import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Counselors and admins always; students unless an admin has turned it off. */
export const canUseMockInterview = (p: { user_type?: string | null; mock_interview_enabled?: boolean | null } | null | undefined) =>
  !!p && (p.user_type === "admin" || p.user_type === "counselor" || p.mock_interview_enabled === true);

/** Whether the signed-in user may use the mock interview. */
export function useMockInterviewAccess() {
  const { data, isLoading } = useQuery({
    queryKey: ["mock-interview-access"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { ok: false, staff: false };
      const { data } = await (supabase as any)
        .from("profiles").select("user_type, mock_interview_enabled").eq("id", session.user.id).maybeSingle();
      return { ok: canUseMockInterview(data), staff: data?.user_type === "admin" || data?.user_type === "counselor" };
    },
  });
  // `locked` only once we know, so the button doesn't flash grey while loading.
  return { allowed: data?.ok === true, staff: data?.staff === true, loading: isLoading, locked: !isLoading && data?.ok !== true };
}
