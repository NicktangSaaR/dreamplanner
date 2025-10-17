-- Allow collaborator counselors to manage student todos via counselor_collaborations
-- This fixes RLS violations when collaborators import or edit student todo items

-- INSERT policy for collaborators
CREATE POLICY "Collaborators can insert student todos"
ON public.todos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.counselor_collaborations cc
    WHERE cc.collaborator_id = auth.uid()
      AND cc.student_id = todos.author_id
  )
);

-- UPDATE policy for collaborators
CREATE POLICY "Collaborators can update student todos"
ON public.todos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.counselor_collaborations cc
    WHERE cc.collaborator_id = auth.uid()
      AND cc.student_id = todos.author_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.counselor_collaborations cc
    WHERE cc.collaborator_id = auth.uid()
      AND cc.student_id = todos.author_id
  )
);

-- DELETE policy for collaborators
CREATE POLICY "Collaborators can delete student todos"
ON public.todos
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.counselor_collaborations cc
    WHERE cc.collaborator_id = auth.uid()
      AND cc.student_id = todos.author_id
  )
);