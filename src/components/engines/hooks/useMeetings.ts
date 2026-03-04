import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudentMeeting, MeetingActionItem } from "../types";
import { toast } from "sonner";

export const useMeetings = (studentId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["student-meetings", studentId],
    queryFn: async (): Promise<StudentMeeting[]> => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("student_meetings")
        .select("*")
        .eq("student_id", studentId)
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return (data || []) as StudentMeeting[];
    },
    enabled: !!studentId,
  });

  const createMeeting = useMutation({
    mutationFn: async (meeting: Partial<StudentMeeting> & { student_id: string; created_by: string }) => {
      const { data, error } = await supabase
        .from("student_meetings")
        .insert(meeting)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-meetings", studentId] });
      toast.success("会议已创建");
    },
    onError: (error: Error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StudentMeeting> & { id: string }) => {
      const { data, error } = await supabase
        .from("student_meetings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-meetings", studentId] });
      toast.success("会议已更新");
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  return { meetings, isLoading, createMeeting, updateMeeting };
};

export const useActionItems = (meetingId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: actionItems = [], isLoading } = useQuery({
    queryKey: ["meeting-actions", meetingId],
    queryFn: async (): Promise<MeetingActionItem[]> => {
      if (!meetingId) return [];
      const { data, error } = await supabase
        .from("meeting_action_items")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("priority")
        .order("due_date");
      if (error) throw error;
      return (data || []) as MeetingActionItem[];
    },
    enabled: !!meetingId,
  });

  const createAction = useMutation({
    mutationFn: async (item: Partial<MeetingActionItem> & { meeting_id: string; title: string }) => {
      const { data, error } = await supabase
        .from("meeting_action_items")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-actions", meetingId] });
    },
    onError: (error: Error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });

  const toggleAction = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("meeting_action_items")
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-actions", meetingId] });
    },
  });

  return { actionItems, isLoading, createAction, toggleAction };
};
