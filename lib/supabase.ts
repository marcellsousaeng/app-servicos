import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nsxrzwsofqroebpbzcxn.supabase.co'
const supabaseKey = 
'sb_publishable_8ITIdbVjKEwYhE1mbnlglQ_LKS0rz4f'

export const supabase = createClient(supabaseUrl, supabaseKey)
