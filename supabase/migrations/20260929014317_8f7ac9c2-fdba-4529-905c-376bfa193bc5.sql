CREATE OR REPLACE FUNCTION public.can_access_student_data(viewer_id uuid, student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.counselor_student_relationships AS r
    WHERE r.counselor_id = $1 AND r.student_id = $2
  ) OR EXISTS (
    SELECT 1
    FROM public.counselor_collaborations AS c
    WHERE c.collaborator_id = $1 AND c.student_id = $2
  );
$function$;