import { NextRequest, NextResponse } from 'next/server'
import { createPickupVerification, updatePickupRequest } from '@/lib/firebase/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, pickupRequestId, agentId, agentName, devicePhotos, customerIdProof, serialNumber, notes } = body
    if (!orderId || !pickupRequestId || !agentId || !devicePhotos || !customerIdProof || !serialNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const id = await createPickupVerification({
      orderId, pickupRequestId, agentId, agentName: agentName || 'Agent',
      devicePhotos, customerIdProof, serialNumber,
      notes: notes || undefined, status: 'submitted',
    })
    await updatePickupRequest(pickupRequestId, { status: 'picked_up' as any })
    return NextResponse.json({ id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
