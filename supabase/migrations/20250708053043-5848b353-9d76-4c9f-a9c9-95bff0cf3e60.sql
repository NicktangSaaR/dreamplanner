-- Enable realtime for todos table
ALTER TABLE public.todos REPLICA IDENTITY FULL;

-- Add todos table to realtime publication 
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;