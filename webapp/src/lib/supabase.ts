import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oxffubrpyjyhqmgflssh.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_-dQI7H8CZ4pGF86K9nRgoQ_lNwa31_I'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
