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