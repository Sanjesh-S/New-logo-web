import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const db = getAdminFirestore()

    let orderData: any = null
    const docSnap = await db.collection('pickupRequests').doc(orderId).get()
    if (docSnap.exists) {
      orderData = { id: docSnap.id, ...docSnap.data() }
    } else {
      const qSnap = await db.collection('pickupRequests').where('orderId', '==', orderId).limit(1).get()
      if (!qSnap.empty) {
        const d = qSnap.docs[0]
        orderData = { id: d.id, ...d.data() }
      }
    }

    if (!orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    let assessment: Record<string, any> | null = null
    const directAnswers = orderData.assessmentAnswers || orderData.device?.assessmentAnswers
    if (directAnswers && Object.keys(directAnswers).length > 0) {
      assessment = directAnswers
    }

    const valuationId = orderData.valuationId
    if (valuationId) {
      try {
        let valDoc = await db.collection('valuations').doc(valuationId).get()
        if (!valDoc.exists) {
          const vSnap = await db.collection('valuations').where('orderId', '==', valuationId).limit(1).get()
          if (!vSnap.empty) valDoc = vSnap.docs[0]
        }
        if (valDoc.exists) {
          const valData = valDoc.data()
          const valAnswers = valData?.answers
          if (valAnswers && typeof valAnswers === 'object' && Object.keys(valAnswers).length > 0) {
            assessment = { ...valAnswers, ...(assessment || {}) }
          }
        }
      } catch (e) {
        console.warn('Could not fetch valuation for assessment:', e)
      }
    }

    return NextResponse.json({ order: orderData, assessment })
  } catch (error: any) {
    console.error('Error fetching order detail:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
