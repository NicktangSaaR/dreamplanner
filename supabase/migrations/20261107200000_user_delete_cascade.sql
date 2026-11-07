-- Deleting a user failed whenever they had any linked rows (to-dos, team
-- links, invitations...), because those foreign keys had no ON DELETE rule.
--
-- * The person's own data is removed with them (CASCADE): their to-dos,
--   practice records, shared folder, evaluations, invitations, team links.
-- * Records other people rely on are kept and just lose the author
--   (SET NULL): articles, meetings, reports, resume requests, question banks.

ALTER TABLE public.counselor_collaborations DROP CONSTRAINT IF EXISTS counselor_collaborations_student_id_fkey;
ALTER TABLE public.counselor_collaborations ADD CONSTRAINT counselor_collaborations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.counselor_collaborations DROP CONSTRAINT IF EXISTS counselor_collaborations_primary_counselor_id_fkey;
ALTER TABLE public.counselor_collaborations ADD CONSTRAINT counselor_collaborations_primary_counselor_id_fkey FOREIGN KEY (primary_counselor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.counselor_collaborations DROP CONSTRAINT IF EXISTS counselor_collaborations_collaborator_id_fkey;
ALTER TABLE public.counselor_collaborations ADD CONSTRAINT counselor_collaborations_collaborator_id_fkey FOREIGN KEY (collaborator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.counselor_student_relationships DROP CONSTRAINT IF EXISTS counselor_student_relationships_student_profiles_fkey;
ALTER TABLE public.counselor_student_relationships ADD CONSTRAINT counselor_student_relationships_student_profiles_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.counselor_student_relationships DROP CONSTRAINT IF EXISTS counselor_student_relationships_counselor_profiles_fkey;
ALTER TABLE public.counselor_student_relationships ADD CONSTRAINT counselor_student_relationships_counselor_profiles_fkey FOREIGN KEY (counselor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.interview_practice_records DROP CONSTRAINT IF EXISTS interview_practice_records_user_id_fkey;
ALTER TABLE public.interview_practice_records ADD CONSTRAINT interview_practice_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.shared_folders DROP CONSTRAINT IF EXISTS shared_folders_created_by_fkey;
ALTER TABLE public.shared_folders ADD CONSTRAINT shared_folders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.student_evaluations DROP CONSTRAINT IF EXISTS student_evaluations_student_id_fkey;
ALTER TABLE public.student_evaluations ADD CONSTRAINT student_evaluations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.student_invitations DROP CONSTRAINT IF EXISTS student_invitations_counselor_id_fkey;
ALTER TABLE public.student_invitations ADD CONSTRAINT student_invitations_counselor_id_fkey FOREIGN KEY (counselor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_author_id_fkey;
ALTER TABLE public.todos ADD CONSTRAINT todos_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.youtube_credentials DROP CONSTRAINT IF EXISTS youtube_credentials_user_id_fkey;
ALTER TABLE public.youtube_credentials ADD CONSTRAINT youtube_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.academic_report_requests ALTER COLUMN requested_by DROP NOT NULL;
ALTER TABLE public.academic_report_requests DROP CONSTRAINT IF EXISTS academic_report_requests_requested_by_fkey;
ALTER TABLE public.academic_report_requests ADD CONSTRAINT academic_report_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.academic_reports ALTER COLUMN uploaded_by DROP NOT NULL;
ALTER TABLE public.academic_reports DROP CONSTRAINT IF EXISTS academic_reports_uploaded_by_fkey;
ALTER TABLE public.academic_reports ADD CONSTRAINT academic_reports_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.articles ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.articles DROP CONSTRAINT IF EXISTS articles_author_id_fkey;
ALTER TABLE public.articles ADD CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.counselor_student_relationships ALTER COLUMN added_by DROP NOT NULL;
ALTER TABLE public.counselor_student_relationships DROP CONSTRAINT IF EXISTS counselor_student_relationships_added_by_fkey;
ALTER TABLE public.counselor_student_relationships ADD CONSTRAINT counselor_student_relationships_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.mock_interview_questions ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.mock_interview_questions DROP CONSTRAINT IF EXISTS mock_interview_questions_created_by_fkey;
ALTER TABLE public.mock_interview_questions ADD CONSTRAINT mock_interview_questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.planning_reports ALTER COLUMN generated_by DROP NOT NULL;
ALTER TABLE public.planning_reports DROP CONSTRAINT IF EXISTS planning_reports_generated_by_fkey;
ALTER TABLE public.planning_reports ADD CONSTRAINT planning_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.resume_requests ALTER COLUMN admin_id DROP NOT NULL;
ALTER TABLE public.resume_requests DROP CONSTRAINT IF EXISTS resume_requests_admin_id_fkey;
ALTER TABLE public.resume_requests ADD CONSTRAINT resume_requests_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.student_engine_scores ALTER COLUMN evaluated_by DROP NOT NULL;
ALTER TABLE public.student_engine_scores DROP CONSTRAINT IF EXISTS student_engine_scores_evaluated_by_fkey;
ALTER TABLE public.student_engine_scores ADD CONSTRAINT student_engine_scores_evaluated_by_fkey FOREIGN KEY (evaluated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.student_meetings ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.student_meetings DROP CONSTRAINT IF EXISTS student_meetings_created_by_fkey;
ALTER TABLE public.student_meetings ADD CONSTRAINT student_meetings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
