import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Profile } from "./useProfile";
import { RealtimePresenceState } from "@supabase/supabase-js";

export interface ActiveUser {
  id: string;
  name: string;
  type: 'student' | 'counselor';
  lastActive: string;
}

interface PresenceState {
  [key: string]: {
    id: string;
    name: string;
    type: 'student' | 'counselor';
    lastActive: string;
  }[];
}

export function usePresence(studentId: string | undefined, profile: Profile | null) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    if (!studentId || !profile) return;

    console.log("Setting up presence channel for student:", studentId);

    const presenceChannel = supabase.channel(`presence:${studentId}`);

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState() as RealtimePresenceState<ActiveUser>;
        const users = Object.values(state).flat();
        setActiveUsers(users as ActiveUser[]);
        console.log('Active users:', users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const newUser = newPresences[0] as unknown as ActiveUser;
        toast.info(`${newUser.name} joined the dashboard`);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftUser = leftPresences[0] as unknown as ActiveUser;
        toast.info(`${leftUser.name} left the dashboard`);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && profile) {
          const presenceData: ActiveUser = {
            id: profile.id,
            name: profile.full_name || 'Anonymous',
            type: profile.user_type as 'student' | 'counselor',
            lastActive: new Date().toISOString(),
          };
          
          await presenceChannel.track(presenceData);
        }
      });

    return () => {
      console.log("Cleaning up presence channel");
      supabase.removeChannel(presenceChannel);
    };
  }, [studentId, profile]);

  return { activeUsers };
}