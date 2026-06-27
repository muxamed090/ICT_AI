// Re-export from the canonical location to support both import paths:
// @/utils/supabase/client  (Supabase guide convention)
// @/lib/supabase/client    (existing project convention)
export { createClient } from '@/lib/supabase/client'
