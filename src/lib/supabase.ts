import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'dummy_key'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

export const now = () => new Date().toISOString()
