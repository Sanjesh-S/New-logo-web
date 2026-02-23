import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import type { QCDecision } from '@/lib/firebase/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, sourceType, sourceId, verificationId, reviewerId, reviewerName, decision, targetShowroomId, notes } = body

    if (!orderId || !sourceType || !reviewerId || !decision) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getAdminFirestore()
    const ts = FieldValue.serverTimestamp()

    const reviewRef = await db.collection('qcReviews').add({
      orderId,
      sourceType,
      sourceId: sourceId || orderId,
      verificationId: verificationId || null,
      reviewerId,
      reviewerName: reviewerName || 'QC',
      decision,
      targetShowroomId: decision === 'showroom' ? targetShowroomId : null,
      notes: notes || '',
      createdAt: ts,
      updatedAt: ts,
    })
    const reviewId = reviewRef.id

    let productName = '', brand = '', category = '', serialNumber = '', agreedPrice = 0
    let condition = '', devicePhotos: string[] = [], sourceShowroomId: string | undefined

    if (sourceType === 'pickup') {
      let pickupDoc = null as any
      const docSnap = await db.collection('pickupRequests').doc(orderId).get()
      if (docSnap.exists) {
        pickupDoc = { id: docSnap.id, ...docSnap.data() }
      } else {
        const qSnap = await db.collection('pickupRequests').where('orderId', '==', orderId).limit(1).get()
        if (!qSnap.empty) {
          const d = qSnap.docs[0]
          pickupDoc = { id: d.id, ...d.data() }
        }
      }

      const verSnap = await db.collection('pickupVerifications').where('orderId', '==', orderId).limit(1).get()
      const verDoc = verSnap.empty ? null : { id: verSnap.docs[0].id, ...verSnap.docs[0].data() } as any

      if (pickupDoc) {
        productName = pickupDoc.productName || ''
        agreedPrice = pickupDoc.price || 0
        await db.collection('pickupRequests').doc(pickupDoc.id).update({ status: decision, updatedAt: ts })
      }
      if (verDoc) {
        serialNumber = verDoc.serialNumber || ''
        devicePhotos = verDoc.devicePhotos || []
        condition = 'From online assessment'
      }
    } else {
      const walkInId = sourceId || orderId
      const walkInDoc = await db.collection('showroomWalkIns').doc(walkInId).get()
      if (walkInDoc.exists) {
        const wd = walkInDoc.data() as any
        productName = wd.product?.name || ''
        brand = wd.product?.brand || ''
        category = wd.product?.category || ''
        serialNumber = wd.product?.serialNumber || ''
        agreedPrice = wd.manualPrice || 0
        condition = wd.staffNotes || ''
        devicePhotos = wd.devicePhotos || []
        sourceShowroomId = wd.showroomId
        await db.collection('showroomWalkIns').doc(walkInId).update({ status: decision, updatedAt: ts })
      }
    }

    const inventoryRef = await db.collection('inventory').add({
      orderId,
      sourceType,
      sourceId: sourceId || orderId,
      sourceShowroomId: sourceShowroomId || null,
      verificationId: verificationId || null,
      qcReviewId: reviewId,
      serialNumber,
      productName,
      brand,
      category,
      condition,
      currentLocation: decision,
      currentShowroomId: decision === 'showroom' ? targetShowroomId : null,
      status: 'in_stock',
      agreedPrice,
      devicePhotos,
      qcDecision: decision,
      qcNotes: notes || '',
      createdAt: ts,
      updatedAt: ts,
    })
    const inventoryId = inventoryRef.id

    await db.collection('stockMovements').add({
      inventoryId,
      orderId,
      serialNumber,
      productName,
      type: 'stock_in',
      fromLocation: null,
      toLocation: decision,
      reason: 'qc_routing',
      performedBy: reviewerId,
      performedByName: reviewerName || 'QC',
      notes: `QC decision: ${decision}. ${notes || ''}`.trim(),
      createdAt: ts,
    })

    return NextResponse.json({ reviewId, inventoryId })
  } catch (error: any) {
    console.error('QC review error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
