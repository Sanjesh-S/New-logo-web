import { NextResponse } from 'next/server'
import { getInventoryStats } from '@/lib/firebase/database'

export async function GET() {
  try {
    const stats = await getInventoryStats()
    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
