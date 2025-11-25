-- Add grounded field to messages table for tutor quality tracking
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS grounded boolean DEFAULT true;