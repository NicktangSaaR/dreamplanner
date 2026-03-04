ALTER TABLE public.planning_documents ADD COLUMN phase text DEFAULT NULL;

COMMENT ON COLUMN public.planning_documents.phase IS 'The planning phase this document belongs to: exploration, positioning, consolidation, application';