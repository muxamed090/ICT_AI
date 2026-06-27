// Re-export from the canonical location to support both import paths:
// @/utils/supabase/server  (Supabase guide convention)
// @/lib/supabase/server    (existing project convention)
export { createClient } from '@/lib/supabase/server'
