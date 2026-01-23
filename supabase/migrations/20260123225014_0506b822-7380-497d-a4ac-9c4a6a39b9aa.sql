-- 创建录取案例表
CREATE TABLE public.admission_cases (
  id BIGSERIAL PRIMARY KEY,
  year TEXT NOT NULL,
  country TEXT NOT NULL,
  university TEXT NOT NULL,
  major TEXT,
  offer_image TEXT,
  profile_style TEXT NOT NULL,
  academic_background TEXT NOT NULL,
  activities JSONB DEFAULT '[]'::jsonb,
  courses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 启用行级安全
ALTER TABLE public.admission_cases ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取（公开展示）
CREATE POLICY "Allow public read access on admission_cases"
ON public.admission_cases FOR SELECT
USING (true);

-- 只允许管理员写入
CREATE POLICY "Allow admin insert on admission_cases"
ON public.admission_cases FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Allow admin update on admission_cases"
ON public.admission_cases FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Allow admin delete on admission_cases"
ON public.admission_cases FOR DELETE
USING (is_admin(auth.uid()));

-- 创建更新时间触发器
CREATE TRIGGER update_admission_cases_updated_at
  BEFORE UPDATE ON public.admission_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();