import { NextRequest, NextResponse } from 'next/server'
import { getShowroomWalkIn, updateShowroomWalkIn } from '@/lib/firebase/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const walkIn = await getShowroomWalkIn(id)
    if (!walkIn) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ walkIn })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    await updateShowroomWalkIn(id, body)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
