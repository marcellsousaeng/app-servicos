import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gqsuwqeumfwduxkgodwz.supabase.co'
const supabaseKey = 'sb_publishable_NfKdmsdeXLIBavOCUksCcQ_KDLGI8Jm'

export const supabase = createClient(supabaseUrl, supabaseKey)
