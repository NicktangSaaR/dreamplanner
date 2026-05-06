// Supabase client（Taro/小程序环境）
// 小程序里没有 fetch，需要 polyfill 或用 Taro.request 自定义 fetch
import { createClient } from "@supabase/supabase-js";
import Taro from "@tarojs/taro";

// ⚠️ 替换为你的 Supabase 项目信息
const SUPABASE_URL = "https://fyxnuhqzgkzfuldqurej.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eG51aHF6Z2t6ZnVsZHF1cmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwMDUzNTQsImV4cCI6MjA1MzU4MTM1NH0.GBnHFSxU14sp7I_X75vpAbq09YiZYqGiOeUMlUCb0qQ";

// 小程序 Storage 适配
const taroStorage = {
  getItem: (key: string) => Taro.getStorageSync(key) || null,
  setItem: (key: string, value: string) => Taro.setStorageSync(key, value),
  removeItem: (key: string) => Taro.removeStorageSync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: taroStorage as any,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// 微信登录：拿 code → 调 wechat-login Edge Function → verifyOtp 拿 session
export async function loginWithWechat(): Promise<
  { status: "logged_in" | "bound"; userId: string }
  | { status: "needs_binding"; openid: string }
> {
  const { code } = await Taro.login();
  const res = await Taro.request({
    url: `${SUPABASE_URL}/functions/v1/wechat-login`,
    method: "POST",
    data: { code },
    header: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
  });
  const body = res.data as any;
  if (body.status === "needs_binding") return { status: "needs_binding", openid: body.openid };

  // 用 hashed_token + email 走 verifyOtp
  const { error } = await supabase.auth.verifyOtp({
    type: "magiclink",
    email: body.email,
    token_hash: body.hashed_token,
  });
  if (error) throw error;
  return { status: body.status, userId: body.user_id };
}

export async function bindWechatToEmail(email: string) {
  const { code } = await Taro.login();
  const res = await Taro.request({
    url: `${SUPABASE_URL}/functions/v1/wechat-login`,
    method: "POST",
    data: { code, action: "bind", email },
    header: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
  });
  const body = res.data as any;
  if (body.error) throw new Error(body.error);
  const { error } = await supabase.auth.verifyOtp({
    type: "magiclink",
    email: body.email,
    token_hash: body.hashed_token,
  });
  if (error) throw error;
  return body.user_id as string;
}
