
-- 微信账号绑定
CREATE TABLE public.wechat_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  openid text NOT NULL UNIQUE,
  unionid text,
  nickname text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wechat_bindings_openid ON public.wechat_bindings(openid);

ALTER TABLE public.wechat_bindings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wechat binding"
  ON public.wechat_bindings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own wechat binding"
  ON public.wechat_bindings FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 订阅消息授权计数（每授权一次，剩余配额 +1，每推送一次 -1）
CREATE TABLE public.wechat_subscribe_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id text NOT NULL,
  remaining_quota int NOT NULL DEFAULT 0,
  last_authorized_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id)
);

ALTER TABLE public.wechat_subscribe_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscribe auth"
  ON public.wechat_subscribe_authorizations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 推送日志
CREATE TABLE public.wechat_message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  openid text NOT NULL,
  template_id text NOT NULL,
  related_todo_id uuid,
  payload jsonb,
  status text NOT NULL,
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wechat_logs_user ON public.wechat_message_logs(user_id, sent_at DESC);

ALTER TABLE public.wechat_message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own message logs"
  ON public.wechat_message_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- updated_at trigger
CREATE TRIGGER trg_wechat_bindings_updated
  BEFORE UPDATE ON public.wechat_bindings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_wechat_sub_auth_updated
  BEFORE UPDATE ON public.wechat_subscribe_authorizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
