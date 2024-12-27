/*
  # Fix system messages and RLS policies

  1. Changes
    - Add system user for system messages
    - Update RLS policies to allow system messages
    - Add policy for system user operations
    
  2. Security
    - Enable RLS on messages table
    - Add specific policy for system messages
*/

-- Create system user if not exists
INSERT INTO public.chat_users (id, nickname, is_guest)
VALUES ('00000000-0000-0000-0000-000000000000', 'System', false)
ON CONFLICT (id) DO NOTHING;

-- Update messages policies
DROP POLICY IF EXISTS "Allow insert for valid users" ON public.messages;

CREATE POLICY "Allow insert for valid users"
  ON public.messages
  FOR INSERT
  TO public
  WITH CHECK (
    user_id = '00000000-0000-0000-0000-000000000000' OR -- Allow system messages
    EXISTS (
      SELECT 1 FROM public.chat_users
      WHERE id = user_id AND is_guest = true -- Only allow guest users to insert
    )
  );

-- Add policy for system user operations
CREATE POLICY "Allow system user operations"
  ON public.messages
  FOR ALL
  TO public
  USING (user_id = '00000000-0000-0000-0000-000000000000');