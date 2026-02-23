import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const sourceType = searchParams.get('type') || 'pickup'
    const docId = searchParams.get('docId') || orderId

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const db = getAdminFirestore()
    const result: Record<string, any> = { showrooms: [] }

    const showroomsSnap = await db.collection('showrooms').where('isActive', '==', true).get()
    result.showrooms = showroomsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    if (sourceType === 'pickup') {
      let pickupData = null
      const docSnap = await db.collection('pickupRequests').doc(orderId).get()
      if (docSnap.exists) {
        pickupData = { id: docSnap.id, ...docSnap.data() }
      } else {
        const qSnap = await db.collection('pickupRequests').where('orderId', '==', orderId).limit(1).get()
        if (!qSnap.empty) {
          const d = qSnap.docs[0]
          pickupData = { id: d.id, ...d.data() }
        }
      }
      result.pickupData = pickupData

      const verSnap = await db.collection('pickupVerifications').where('orderId', '==', orderId).limit(1).get()
      if (!verSnap.empty) {
        const d = verSnap.docs[0]
        result.verification = { id: d.id, ...d.data() }
      } else {
        result.verification = null
      }

      // Fetch assessment data
      let assessment: Record<string, any> | null = null
      const pd = pickupData as any
      const directAnswers = pd?.assessmentAnswers || pd?.device?.assessmentAnswers
      if (directAnswers && Object.keys(directAnswers).length > 0) {
        assessment = directAnswers
      }
      const valuationId = pd?.valuationId
      if (valuationId) {
        try {
          let valDoc = await db.collection('valuations').doc(valuationId).get()
          if (!valDoc.exists) {
            const vSnap = await db.collection('valuations').where('orderId', '==', valuationId).limit(1).get()
            if (!vSnap.empty) valDoc = vSnap.docs[0]
          }
          if (valDoc.exists) {
            const valAnswers = valDoc.data()?.answers
            if (valAnswers && typeof valAnswers === 'object' && Object.keys(valAnswers).length > 0) {
              assessment = { ...valAnswers, ...(assessment || {}) }
            }
          }
        } catch (e) {
          console.warn('Could not fetch valuation for assessment:', e)
        }
      }
      result.assessment = assessment
    } else {
      const walkInId = docId || orderId
      const walkInDoc = await db.collection('showroomWalkIns').doc(walkInId).get()
      if (walkInDoc.exists) {
        result.walkInData = { id: walkInDoc.id, ...walkInDoc.data() }
      } else {
        result.walkInData = null
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching QC review data:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
