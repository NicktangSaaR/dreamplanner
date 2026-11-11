/**
 * Students created by staff log in with a username. Their login address is
 * internal (<username>@student.dreamplaneredu.com) and never receives mail;
 * the email they add to their profile is used for password reset.
 */
export const STUDENT_DOMAIN = "student.dreamplaneredu.com";

/** What the login form sends: an email as typed, or a username's login address. */
export const loginAddress = (identifier: string) => {
  const id = identifier.trim();
  return id.includes("@") ? id : `${id.toLowerCase()}@${STUDENT_DOMAIN}`;
};

/** An internal login address shouldn't be shown as anyone's email. */
export const isInternalAddress = (email: string | null | undefined) => !!email && email.toLowerCase().endsWith(`@${STUDENT_DOMAIN}`);

/** Suggest a username from an English or pinyin name: "Amy Chen" → "amy.chen". */
export const suggestUsername = (name: string) =>
  name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s._-]/g, "").trim().replace(/\s+/g, ".").replace(/^[._-]+/, "").slice(0, 30);

export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/;
