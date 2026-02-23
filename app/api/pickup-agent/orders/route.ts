import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 })
    }

    const db = getAdminFirestore()
    const snap = await db.collection('pickupRequests').where('assignedTo', '==', agentId).get()

    const orders = snap.docs.map(d => {
      const data = d.data()
      return { id: d.id, ...data }
    })

    orders.sort((a: any, b: any) => {
      const aTime = a.createdAt?._seconds || a.createdAt?.seconds || 0
      const bTime = b.createdAt?._seconds || b.createdAt?.seconds || 0
      return bTime - aTime
    })

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('Error fetching agent orders:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
