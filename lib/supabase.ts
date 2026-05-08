import { createClient } from '@supabase/supabase-js'

// O código agora é inteligente: ele pergunta à Vercel quais chaves usar
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)