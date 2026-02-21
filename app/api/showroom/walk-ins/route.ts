import { NextRequest, NextResponse } from 'next/server'
import { getShowroomWalkIns, createShowroomWalkIn } from '@/lib/firebase/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showroomId = searchParams.get('showroomId') || undefined
    const walkIns = await getShowroomWalkIns(showroomId)
    return NextResponse.json({ walkIns })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const id = await createShowroomWalkIn(body)
    return NextResponse.json({ id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
