-- Create table to store admin Google Drive credentials
CREATE TABLE public.admin_google_drive_credentials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_google_drive_credentials ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view/manage credentials
CREATE POLICY "Only admins can view admin credentials"
ON public.admin_google_drive_credentials
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND user_type = 'admin'
    )
);

CREATE POLICY "Only admins can insert admin credentials"
ON public.admin_google_drive_credentials
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND user_type = 'admin'
    )
);

CREATE POLICY "Only admins can update admin credentials"
ON public.admin_google_drive_credentials
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND user_type = 'admin'
    )
);

CREATE POLICY "Only admins can delete admin credentials"
ON public.admin_google_drive_credentials
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND user_type = 'admin'
    )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_google_drive_credentials_updated_at
BEFORE UPDATE ON public.admin_google_drive_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();