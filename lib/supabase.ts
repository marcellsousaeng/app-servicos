import { createClient } from '@supabase/supabase-js'

// Lê as chaves dinamicamente da Vercel para cada projeto
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)