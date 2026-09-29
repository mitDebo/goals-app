import { createClient } from '@supabase/supabase-js'

// Both values are public by design: the publishable key only lets a browser
// start sign-in; our own API decides what a signed-in user may do.
const SUPABASE_URL = 'https://asbwrznqoesdbhrwfbtz.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_S9VmYQTPil1lWXdkRO9m_A_f7C5r2BG'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
})
