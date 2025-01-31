import { useDeleteUserMutation } from "./mutations/useDeleteUserMutation";
import { useUpdateUserTypeMutation } from "./mutations/useUpdateUserTypeMutation";
import { useUpdateUserDetailsMutation } from "./mutations/useUpdateUserDetailsMutation";

export const useUserMutations = () => {
  const deleteUserMutation = useDeleteUserMutation();
  const updateUserTypeMutation = useUpdateUserTypeMutation();
  const updateUserDetailsMutation = useUpdateUserDetailsMutation();

  return {
    deleteUserMutation,
    updateUserTypeMutation,
    updateUserDetailsMutation,
  };
};