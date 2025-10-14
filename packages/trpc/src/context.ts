import { createClient } from '@supabase/supabase-js'

export async function createContext(opts: { headers: Headers }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: opts.headers.get('authorization') || '',
      },
    },
  })

  // Get user from session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    supabase,
    user,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
