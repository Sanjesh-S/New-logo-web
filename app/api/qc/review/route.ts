import { NextRequest, NextResponse } from 'next/server'
import {
  createQCReview, updatePickupRequest, updateShowroomWalkIn,
  createInventoryItem, createStockMovement,
  getPickupRequest, getPickupVerification, getShowroomWalkIn,
  type QCDecision,
} from '@/lib/firebase/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, sourceType, sourceId, verificationId, reviewerId, reviewerName, decision, targetShowroomId, notes } = body

    if (!orderId || !sourceType || !reviewerId || !decision) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const reviewId = await createQCReview({
      orderId,
      sourceType,
      sourceId: sourceId || orderId,
      verificationId,
      reviewerId,
      reviewerName: reviewerName || 'QC',
      decision: decision as QCDecision,
      targetShowroomId,
      notes,
    })

    let productName = '', brand = '', category = '', serialNumber = '', agreedPrice = 0
    let condition = '', devicePhotos: string[] = [], sourceShowroomId: string | undefined

    if (sourceType === 'pickup') {
      const pd = await getPickupRequest(orderId)
      const vd = await getPickupVerification(orderId)
      if (pd) {
        productName = pd.productName || ''
        agreedPrice = pd.price || 0
        await updatePickupRequest(pd.id, { status: decision as any })
      }
      if (vd) {
        serialNumber = vd.serialNumber || ''
        devicePhotos = vd.devicePhotos || []
        condition = 'From online assessment'
      }
    } else {
      const wd = await getShowroomWalkIn(sourceId || orderId)
      if (wd) {
        productName = wd.product?.name || ''
        brand = wd.product?.brand || ''
        category = wd.product?.category || ''
        serialNumber = wd.product?.serialNumber || ''
        agreedPrice = wd.manualPrice || 0
        condition = wd.staffNotes || ''
        devicePhotos = wd.devicePhotos || []
        sourceShowroomId = wd.showroomId
        if (wd.id) await updateShowroomWalkIn(wd.id, { status: decision as any })
      }
    }

    const inventoryId = await createInventoryItem({
      orderId,
      sourceType,
      sourceId: sourceId || orderId,
      sourceShowroomId,
      verificationId,
      qcReviewId: reviewId,
      serialNumber,
      productName,
      brand,
      category,
      condition,
      currentLocation: decision as QCDecision,
      currentShowroomId: decision === 'showroom' ? targetShowroomId : undefined,
      status: 'in_stock',
      agreedPrice,
      devicePhotos,
      qcDecision: decision,
      qcNotes: notes || '',
    })

    await createStockMovement({
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
    })

    return NextResponse.json({ reviewId, inventoryId })
  } catch (error: any) {
    console.error('QC review error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
