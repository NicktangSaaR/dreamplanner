/** Where each kind of user lands: their own dashboard. */
export function homePath(userType: string | null | undefined, userId: string | null | undefined) {
  if (!userId) return "/login";
  switch (userType) {
    case "counselor":
      return "/counselor-dashboard";
    case "admin":
      return "/admin-dashboard";
    case "student":
      return `/student-dashboard/${userId}`;
    default:
      return "/";
  }
}
