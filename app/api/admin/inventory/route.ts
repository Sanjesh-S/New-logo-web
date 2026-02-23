import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function GET(request: NextRequest) {
  try {
    const db = getAdminFirestore()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'

    if (action === 'stats') {
      const snap = await db.collection('inventory').where('status', 'in', ['in_stock', 'in_repair']).get()
      const byLocation: Record<string, number> = {}
      const byStatus: Record<string, number> = {}
      snap.docs.forEach(d => {
        const data = d.data()
        const loc = data.currentLocation || 'unknown'
        const st = data.status || 'unknown'
        byLocation[loc] = (byLocation[loc] || 0) + 1
        byStatus[st] = (byStatus[st] || 0) + 1
      })
      return NextResponse.json({ total: snap.size, byLocation, byStatus })
    }

    if (action === 'movements') {
      const inventoryId = searchParams.get('inventoryId')
      let q = db.collection('stockMovements').orderBy('createdAt', 'desc').limit(200)
      if (inventoryId) {
        q = db.collection('stockMovements').where('inventoryId', '==', inventoryId).orderBy('createdAt', 'desc') as any
      }
      const snap = await q.get()
      const movements = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      return NextResponse.json({ movements })
    }

    // Default: list all inventory
    const snap = await db.collection('inventory').get()
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    items.sort((a: any, b: any) => {
      const aTime = a.createdAt?._seconds || a.createdAt?.seconds || 0
      const bTime = b.createdAt?._seconds || b.createdAt?.seconds || 0
      return bTime - aTime
    })
    return NextResponse.json({ items })
  } catch (error: any) {
    console.error('Inventory GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getAdminFirestore()
    const body = await request.json()
    const { action } = body

    if (action === 'transfer') {
      const { id, toLocation, reason, performedBy, performedByName, notes, toShowroomId } = body
      if (!id || !toLocation) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      const ts = FieldValue.serverTimestamp()

      const docRef = db.collection('inventory').doc(id)
      const docSnap = await docRef.get()
      if (!docSnap.exists) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }
      const item = docSnap.data()!
      const fromLocation = item.currentLocation

      await docRef.update({
        currentLocation: toLocation,
        currentShowroomId: toLocation === 'showroom' ? (toShowroomId || null) : null,
        updatedAt: ts,
      })

      await db.collection('stockMovements').add({
        inventoryId: id,
        orderId: item.orderId || '',
        serialNumber: item.serialNumber || '',
        productName: item.productName || '',
        type: 'transfer',
        fromLocation,
        toLocation,
        reason: reason || 'manual_transfer',
        performedBy: performedBy || '',
        performedByName: performedByName || '',
        notes: notes || '',
        createdAt: ts,
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'stock_out') {
      const { id, reason, performedBy, performedByName, notes } = body
      if (!id) {
        return NextResponse.json({ error: 'Missing item ID' }, { status: 400 })
      }
      const ts = FieldValue.serverTimestamp()

      const docRef = db.collection('inventory').doc(id)
      const docSnap = await docRef.get()
      if (!docSnap.exists) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }
      const item = docSnap.data()!

      await docRef.update({
        status: reason === 'sold' ? 'sold' : 'returned',
        updatedAt: ts,
      })

      await db.collection('stockMovements').add({
        inventoryId: id,
        orderId: item.orderId || '',
        serialNumber: item.serialNumber || '',
        productName: item.productName || '',
        type: 'stock_out',
        fromLocation: item.currentLocation,
        toLocation: null,
        reason: reason || 'stock_out',
        performedBy: performedBy || '',
        performedByName: performedByName || '',
        notes: notes || '',
        createdAt: ts,
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    console.error('Inventory POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
