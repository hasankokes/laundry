import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

// Proxy kullanarak Supabase istemcisini sadece ilk kullanıldığında (lazy) başlatıyoruz.
// Bu sayede Next.js build aşamasında module evaluation sırasında patlamasını engelliyoruz.
let _client: any = null;
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    if (!_client) {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('supabaseUrl and supabaseKey are required');
      }
      _client = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      })
    }
    return _client[prop];
  }
})

export const now = () => new Date().toISOString()
