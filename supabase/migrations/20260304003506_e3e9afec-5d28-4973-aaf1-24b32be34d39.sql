
-- =============================================
-- Engine 1: Stage Engine (阶段引擎)
-- =============================================
CREATE TABLE public.student_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_phase text NOT NULL DEFAULT 'exploration' CHECK (current_phase IN ('exploration', 'positioning', 'consolidation', 'application')),
  phase_start_date date NOT NULL DEFAULT CURRENT_DATE,
  compression_mode boolean NOT NULL DEFAULT false,
  phase_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

ALTER TABLE public.student_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own phase" ON public.student_phases FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can update own phase" ON public.student_phases FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own phase" ON public.student_phases FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Counselors can view student phases" ON public.student_phases FOR SELECT USING (
  EXISTS (SELECT 1 FROM counselor_student_relationships WHERE counselor_id = auth.uid() AND student_id = student_phases.student_id)
  OR EXISTS (SELECT 1 FROM counselor_collaborations WHERE collaborator_id = auth.uid() AND student_id = student_phases.student_id)
);
CREATE POLICY "Counselors can manage student phases" ON public.student_phases FOR ALL USING (
  EXISTS (SELECT 1 FROM counselor_student_relationships WHERE counselor_id = auth.uid() AND student_id = student_phases.student_id)
);
CREATE POLICY "Admins can manage all phases" ON public.student_phases FOR ALL USING (is_admin(auth.uid()));

-- =============================================
-- Engine 2: Quarter Engine (季度节奏引擎)
-- =============================================
CREATE TABLE public.student_quarters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quarter text NOT NULL CHECK (quarter IN ('Q1_fall', 'Q2_winter', 'Q3_spring', 'Q4_summer')),
  academic_year text NOT NULL,
  quarter_focus text,
  quarter_kpi text,
  quarter_risk text,
  auto_suggestions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, quarter, academic_year)
);

ALTER TABLE public.student_quarters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own quarters" ON public.student_quarters FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can manage own quarters" ON public.student_quarters FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Counselors can view student quarters" ON public.student_quarters FOR SELECT USING (
  EXISTS (SELECT 1 FROM counselor_student_relationships WHERE counselor_id = auth.uid() AND student_id = student_quarters.student_id)
  OR EXISTS (SELECT 1 FROM counselor_collaborations WHERE collaborator_id = auth.uid() AND student_id = student_quarters.student_id)
);
CREATE POLICY "Counselors can manage student quarters" ON public.student_quarters FOR ALL USING (
  EXISTS (SELECT 1 FROM counselor_student_relationships WHERE counselor_id = auth.uid() AND student_id = student_quarters.student_id)
);
CREATE POLICY "Admins can manage all quarters" ON public.student_quarters FOR ALL USING (is_admin(auth.uid()));

-- =============================================
-- Engine 3: Evaluation Engine (评分与反馈引擎)
-- =============================================
CREATE TABLE public.student_engine_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluation_date date NOT NULL DEFAULT CURRENT_DATE,
  quarter text,
  academic_year text,
  ari_score numeric(4,1) DEFAULT 0,
  narrative_index numeric(4,1) DEFAULT 0,
  compound_growth numeric(4,1) DEFAULT 0,
  game_risk numeric(4,1) DEFAULT 0,
  ari_auto numeric(4,1),
  narrative_auto numeric(4,1),
  compound_auto numeric(4,1),
  game_risk_auto numeric(4,1),
  counselor_adjustment_notes text,
  total_score numeric(5,1) GENERATED ALWAYS AS (ari_score + narrative_index + compound_growth + game_risk) STORED,
  strategy_alert boolean DEFAULT false,
  strategy_alert_message text,
  evaluated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_engine_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own scores" ON public.student_engine_scores FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Counselors can view student scores" ON public.student_engine_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM counselor_student_relationships WHERE counselor_id = auth.uid() AND student_id = student_engine_scores.student_id)
  OR EXISTS (SELECT 1 FROM counselor_collaborations WHERE collaborator_id = auth.uid() AND student_id = student_engine_scores.student_id)
);
CREATE POLICY "Counselors can manage student scores" ON public.student_engine_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM counselor_student_relationships WHERE counselor_id = auth.uid() AND student_id = student_engine_scores.student_id)
);
CREATE POLICY "Admins can manage all scores" ON public.student_engine_scores FOR ALL USING (is_admin(auth.uid()));

-- =============================================
-- Engine 4: Meeting Loop Engine (会议与执行闭环)
-- =============================================
CREATE TABLE public.student_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meeting_date timestamptz NOT NULL DEFAULT now(),
  core_goal text,
  last_month_completion text,
  current_risk text,
  decisions text,
  meeting_notes text,
  ai_generated_minutes text,
  ai_generated_email text,
  next_meeting_date timestamptz,
  next_meeting_reminder_sent boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own meetings" ON public.student_meetings FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Counselors can view student meetings" ON public.student_meetings FOR SELECT USING (
  EXISTS (SELECT 1 FROM counselor_student_relationships WHERE counselor_id = auth.uid() AND student_id = student_meetings.student_id)
  OR EXISTS (SELECT 1 FROM counselor_collaborations WHERE collaborator_id = auth.uid() AND student_id = student_meetings.student_id)
);
CREATE POLICY "Counselors can manage student meetings" ON public.student_meetings FOR ALL USING (
  EXISTS (SELECT 1 FROM counselor_student_relationships WHERE counselor_id = auth.uid() AND student_id = student_meetings.student_id)
);
CREATE POLICY "Admins can manage all meetings" ON public.student_meetings FOR ALL USING (is_admin(auth.uid()));

-- Meeting Action Items
CREATE TABLE public.meeting_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.student_meetings(id) ON DELETE CASCADE,
  title text NOT NULL,
  assigned_to text,
  due_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access via meeting" ON public.meeting_action_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM student_meetings sm
    WHERE sm.id = meeting_action_items.meeting_id
    AND (
      sm.student_id = auth.uid()
      OR EXISTS (SELECT 1 FROM counselor_student_relationships WHERE counselor_id = auth.uid() AND student_id = sm.student_id)
      OR is_admin(auth.uid())
    )
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_student_phases_updated_at BEFORE UPDATE ON public.student_phases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_quarters_updated_at BEFORE UPDATE ON public.student_quarters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_engine_scores_updated_at BEFORE UPDATE ON public.student_engine_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_meetings_updated_at BEFORE UPDATE ON public.student_meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_meeting_action_items_updated_at BEFORE UPDATE ON public.meeting_action_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
