import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { requestId, agentId, agentName, assignedByRole, assignedByName, status } = await request.json()
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    const db = getAdminFirestore()

    if (status && !agentId) {
      await db.collection('pickupRequests').doc(requestId).update({
        status,
        updatedAt: FieldValue.serverTimestamp(),
      })
      return NextResponse.json({ success: true, status })
    }

    if (!agentId) {
      await db.collection('pickupRequests').doc(requestId).update({
        assignedTo: '',
        assignedAgentName: '',
        assignedByRole: '',
        assignedByName: '',
        status: 'confirmed',
        updatedAt: FieldValue.serverTimestamp(),
      })
      return NextResponse.json({ success: true, status: 'confirmed' })
    }

    await db.collection('pickupRequests').doc(requestId).update({
      assignedTo: agentId,
      assignedAgentName: agentName || '',
      assignedAt: FieldValue.serverTimestamp(),
      assignedByRole: assignedByRole || 'qc_team',
      assignedByName: assignedByName || '',
      status: 'assigned',
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true, status: 'assigned' })
  } catch (error: any) {
    console.error('Error assigning agent:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
