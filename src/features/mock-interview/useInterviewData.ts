import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BankQuestion, CustomQuestion, InterviewBank, QuestionType } from "./types";

// The new columns/table are not in the generated Supabase types yet, so the
// queries go through an untyped client view and are typed at the edges.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const BANK_COLUMNS =
  "id, title, description, school, program, preparation_time, response_time, is_active, created_at, sim_enabled, sim_question_count, sim_shuffle, sim_retakes";
const QUESTION_COLUMNS =
  "id, bank_id, title, description, question_type, preparation_time, response_time, sort_order";
const CUSTOM_COLUMNS =
  "id, user_id, title, question_type, preparation_time, response_time, created_at";

/** Banks visible to the current user (students: active only; admins: all). */
export function useBanks() {
  return useQuery({
    queryKey: ["mi-banks"],
    queryFn: async (): Promise<InterviewBank[]> => {
      const { data, error } = await db.from("mock_interview_questions").select(BANK_COLUMNS).order("title");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** All questions the current user can see, grouped by bank id. */
export function useBankQuestions() {
  return useQuery({
    queryKey: ["mi-bank-questions"],
    queryFn: async (): Promise<Record<string, BankQuestion[]>> => {
      const { data, error } = await db
        .from("mock_interview_bank_questions")
        .select(QUESTION_COLUMNS)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      const byBank: Record<string, BankQuestion[]> = {};
      for (const q of (data ?? []) as BankQuestion[]) {
        (byBank[q.bank_id] ??= []).push(q);
      }
      return byBank;
    },
  });
}

/** Custom questions written by a student (defaults to the signed-in user). */
export function useCustomQuestions(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["mi-custom", userId],
    enabled: !!userId,
    queryFn: async (): Promise<CustomQuestion[]> => {
      const { data, error } = await db
        .from("mock_interview_custom_questions")
        .select(CUSTOM_COLUMNS)
        .eq("user_id", userId)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface CustomQuestionInput {
  title: string;
  question_type: QuestionType;
  preparation_time: number;
  response_time: number;
}

export function useCustomQuestionMutations(userId: string | null | undefined) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["mi-custom", userId] });

  const add = useMutation({
    mutationFn: async (input: CustomQuestionInput | CustomQuestionInput[]) => {
      const rows = (Array.isArray(input) ? input : [input]).map((r) => ({ ...r, user_id: userId }));
      if (!rows.length) return;
      const { error } = await db.from("mock_interview_custom_questions").insert(rows);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("mock_interview_custom_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { add, remove };
}

// ------------------------------------------------------------- admin -------

export interface BankInput {
  title: string;
  description: string | null;
  school: string | null;
  program: string | null;
  preparation_time: number;
  response_time: number;
  is_active: boolean;
  sim_enabled: boolean;
  sim_question_count: number | null;
  sim_shuffle: boolean;
  sim_retakes: number;
}

export interface BankQuestionInput {
  title: string;
  question_type: QuestionType;
  preparation_time: number | null;
  response_time: number | null;
}

export function useBankAdmin() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["mi-banks"] });
    qc.invalidateQueries({ queryKey: ["mi-bank-questions"] });
  };

  const saveBank = useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: BankInput }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const query = id
        ? db.from("mock_interview_questions").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id)
        : db.from("mock_interview_questions").insert({ ...input, is_system: true, created_by: user?.id });
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const setActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await db.from("mock_interview_questions").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const deleteBank = useMutation({
    mutationFn: async (id: string) => {
      const { error: qErr } = await db.from("mock_interview_bank_questions").delete().eq("bank_id", id);
      if (qErr) throw qErr;
      const { error } = await db.from("mock_interview_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const importQuestions = useMutation({
    mutationFn: async ({ bankId, startOrder, rows }: { bankId: string; startOrder: number; rows: BankQuestionInput[] }) => {
      const payload = rows.map((r, i) => ({ ...r, bank_id: bankId, sort_order: startOrder + i + 1 }));
      const { error } = await db.from("mock_interview_bank_questions").insert(payload);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const updateQuestion = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BankQuestionInput }) => {
      const { error } = await db
        .from("mock_interview_bank_questions")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("mock_interview_bank_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { saveBank, setActive, deleteBank, importQuestions, updateQuestion, deleteQuestion };
}
