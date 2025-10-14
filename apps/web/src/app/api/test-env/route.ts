import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    keyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'missing',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
  })
}
