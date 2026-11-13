
export type UserType = "student" | "counselor" | "admin";

export interface UserProfile {
  id: string;
  user_type: UserType;
  email?: string | null;
  /** Counselor accounts are approved by an admin before they can be used. */
  is_verified?: boolean | null;
}

export const isValidUserType = (type: string): type is UserType => {
  return ['student', 'counselor', 'admin'].includes(type);
};

