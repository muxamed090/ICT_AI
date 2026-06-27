// Re-export from the canonical location to support both import paths:
// @/utils/supabase/middleware  (Supabase guide convention)
// @/lib/supabase/middleware    (existing project convention)
export { updateSession } from '@/lib/supabase/middleware'
