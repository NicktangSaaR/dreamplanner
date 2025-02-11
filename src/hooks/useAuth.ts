
import { useAuthSession } from "./auth/useAuthSession";
import { useProfile } from "./auth/useProfile";
import { useAuthActions } from "./auth/useAuthActions";
import { UserProfile, UserType } from "./auth/types";

export type { UserType, UserProfile };

export const useAuth = () => {
  useAuthSession();
  const { data: profile, isLoading } = useProfile();
  const { login, logout } = useAuthActions();

  return {
    profile,
    isLoading,
    login,
    logout,
    isAuthenticated: !!profile,
    userType: profile?.user_type,
  };
};

