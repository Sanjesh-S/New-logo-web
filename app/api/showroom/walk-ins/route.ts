import { NextRequest, NextResponse } from 'next/server'
import { getShowroomWalkIns, getShowroomWalkIn, updateShowroomWalkIn, createShowroomWalkIn } from '@/lib/firebase/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const walkIn = await getShowroomWalkIn(id)
      if (!walkIn) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ walkIn })
    }

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

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const body = await request.json()
    await updateShowroomWalkIn(id, body)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
