import { NextRequest, NextResponse } from 'next/server'
import { transferInventoryItem, type InventoryLocation } from '@/lib/firebase/database'

export async function POST(request: NextRequest) {
  try {
    const { id, toLocation, reason, performedBy, performedByName, notes, targetShowroomId } = await request.json()
    if (!id || !toLocation || !performedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    await transferInventoryItem(id, toLocation as InventoryLocation, reason || 'manual_transfer', performedBy, performedByName || 'Staff', notes, targetShowroomId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
