// In-memory stand-in for the Supabase client: sign-up succeeds and is remembered for the demo.
export const lastSignup: { email?: string; data?: Record<string, string> } = {};
const listeners: (() => void)[] = [];
export const onSignup = (fn: () => void) => listeners.push(fn);

export const supabase: any = {
  auth: {
    signUp: async ({ email, options }: any) => {
      await new Promise((r) => setTimeout(r, 600));
      lastSignup.email = email;
      lastSignup.data = options?.data ?? {};
      listeners.forEach((f) => f());
      return { data: { user: { id: "demo", email } }, error: null };
    },
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
};
