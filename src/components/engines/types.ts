export interface StudentPhase {
  id: string;
  student_id: string;
  current_phase: 'exploration' | 'positioning' | 'consolidation' | 'application';
  phase_start_date: string;
  compression_mode: boolean;
  phase_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentQuarter {
  id: string;
  student_id: string;
  quarter: 'Q1_fall' | 'Q2_winter' | 'Q3_spring' | 'Q4_summer';
  academic_year: string;
  quarter_focus: string | null;
  quarter_kpi: string | null;
  quarter_risk: string | null;
  auto_suggestions: any[];
  created_at: string;
  updated_at: string;
}

export interface StudentEngineScore {
  id: string;
  student_id: string;
  evaluation_date: string;
  quarter: string | null;
  academic_year: string | null;
  ari_score: number;
  narrative_index: number;
  compound_growth: number;
  game_risk: number;
  ari_auto: number | null;
  narrative_auto: number | null;
  compound_auto: number | null;
  game_risk_auto: number | null;
  counselor_adjustment_notes: string | null;
  total_score: number;
  strategy_alert: boolean;
  strategy_alert_message: string | null;
  evaluated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentMeeting {
  id: string;
  student_id: string;
  meeting_date: string;
  core_goal: string | null;
  last_month_completion: string | null;
  current_risk: string | null;
  decisions: string | null;
  meeting_notes: string | null;
  ai_generated_minutes: string | null;
  ai_generated_email: string | null;
  next_meeting_date: string | null;
  next_meeting_reminder_sent: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingActionItem {
  id: string;
  meeting_id: string;
  title: string;
  assigned_to: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const PHASE_LABELS: Record<string, string> = {
  exploration: '探索阶段 Exploration',
  positioning: '定位阶段 Positioning',
  consolidation: '聚焦阶段 Consolidation',
  application: '申请阶段 Application',
};

export const QUARTER_LABELS: Record<string, string> = {
  Q1_fall: 'Q1 秋季 Fall',
  Q2_winter: 'Q2 冬季 Winter',
  Q3_spring: 'Q3 春季 Spring',
  Q4_summer: 'Q4 夏季 Summer',
};

export const QUARTER_DEFAULT_FOCUS: Record<string, string> = {
  Q1_fall: 'AP + 科研报名 + 竞赛',
  Q2_winter: '选课 + 夏校 + 科研',
  Q3_spring: '科研深化 + 校外活动',
  Q4_summer: '夏校 + 实习 + 项目 + 新学年预备',
};
