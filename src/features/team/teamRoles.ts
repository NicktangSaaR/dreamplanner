import type { MessageKey } from "@/i18n/translations";

export const TEAM_ROLES = ["followup", "essay_interview", "research", "other"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const roleLabelKey = (role: string): MessageKey =>
  (TEAM_ROLES.includes(role as TeamRole) ? `team.role.${role}` : "team.role.other") as MessageKey;
