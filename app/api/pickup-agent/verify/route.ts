import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, pickupRequestId, agentId, agentName, devicePhotos, customerIdProof, serialNumber, notes } = body
    if (!orderId || !pickupRequestId || !agentId || !devicePhotos || !customerIdProof || !serialNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getAdminFirestore()

    const verRef = await db.collection('pickupVerifications').add({
      orderId,
      pickupRequestId,
      agentId,
      agentName: agentName || 'Agent',
      devicePhotos,
      customerIdProof,
      serialNumber,
      notes: notes || '',
      status: 'submitted',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    await db.collection('pickupRequests').doc(pickupRequestId).update({
      status: 'picked_up',
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ id: verRef.id })
  } catch (error: any) {
    console.error('Verification submit error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
