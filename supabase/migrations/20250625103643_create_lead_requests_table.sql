-- Create table to store lead generation requests
create table if not exists public.lead_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  user_name text,
  lead_description text not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Optional: index for faster queries by user
create index if not exists idx_lead_requests_user_id on public.lead_requests(user_id);

-- Enable Row Level Security
ALTER TABLE public.lead_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own lead requests
CREATE POLICY "Users can insert their own lead requests"
  ON public.lead_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can select their own lead requests
CREATE POLICY "Users can view their own lead requests"
  ON public.lead_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own lead requests
CREATE POLICY "Users can update their own lead requests"
  ON public.lead_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own lead requests
CREATE POLICY "Users can delete their own lead requests"
  ON public.lead_requests FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Service role (admin) can do anything
CREATE POLICY "Service role can do anything"
  ON public.lead_requests
  TO service_role
  USING (true)
  WITH CHECK (true);

