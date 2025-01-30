import { useProfileQuery } from "./profile/useProfileQuery";
import { Profile, ProfileError } from "@/types/profile";

export const useProfile = () => {
  const { 
    data: profile, 
    isLoading,
    error,
  } = useProfileQuery();

  return {
    profile: profile as Profile | null,
    isLoading,
    error: error as ProfileError | null,
  };
};