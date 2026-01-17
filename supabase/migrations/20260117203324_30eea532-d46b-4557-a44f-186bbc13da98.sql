-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create reminder_contacts table for storing contact recipients
CREATE TABLE public.reminder_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reminder_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all contacts" 
ON public.reminder_contacts 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create contacts" 
ON public.reminder_contacts 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update contacts" 
ON public.reminder_contacts 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete contacts" 
ON public.reminder_contacts 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reminder_contacts_updated_at
BEFORE UPDATE ON public.reminder_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();