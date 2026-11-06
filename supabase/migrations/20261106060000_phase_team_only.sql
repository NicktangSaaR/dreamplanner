-- Stage settings (stage, start date, compression, notes) are for the
-- counselor team only; students no longer read them.
DROP POLICY IF EXISTS "Students can view own phase" ON public.student_phases;
