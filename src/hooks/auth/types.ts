
export type UserType = "student" | "counselor" | "admin";

export interface UserProfile {
  id: string;
  user_type: UserType;
  email?: string | null;
}

export const isValidUserType = (type: string): type is UserType => {
  return ['student', 'counselor', 'admin'].includes(type);
};

