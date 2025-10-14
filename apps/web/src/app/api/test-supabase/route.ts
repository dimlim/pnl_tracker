import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log('URL:', supabaseUrl)
    console.log('Key length:', serviceRoleKey?.length)
    console.log('Key start:', serviceRoleKey?.substring(0, 30))
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    
    // Try to select from assets
    const { data, error } = await supabase
      .from('assets')
      .select('id, symbol')
      .limit(5)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
    }
    
    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    })
  }
}
