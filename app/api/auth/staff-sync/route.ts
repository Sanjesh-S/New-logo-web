import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const auth = getAdminAuth()
    const decoded = await auth.verifyIdToken(token)
    const uid = decoded.uid

    const db = getAdminFirestore()
    const uidDocRef = db.collection('staffUsers').doc(uid)
    const uidDoc = await uidDocRef.get()

    if (uidDoc.exists) {
      const data = uidDoc.data()!
      return NextResponse.json({
        synced: true,
        role: data.role,
        isActive: data.isActive,
        showroomId: data.showroomId || null,
        showroomName: data.showroomName || null,
        staffId: uid,
        name: data.name,
      })
    }

    const phone = decoded.phone_number
    const email = decoded.email

    let matchedDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null

    if (phone) {
      const phoneSnap = await db.collection('staffUsers')
        .where('phoneNumber', '==', phone)
        .limit(1)
        .get()
      if (!phoneSnap.empty) matchedDoc = phoneSnap.docs[0]
    }

    if (!matchedDoc && email) {
      const emailSnap = await db.collection('staffUsers')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get()
      if (!emailSnap.empty) matchedDoc = emailSnap.docs[0]
    }

    if (!matchedDoc) {
      return NextResponse.json({ error: 'Not a staff member' }, { status: 403 })
    }

    const staffData = matchedDoc.data()
    const oldDocId = matchedDoc.id

    await uidDocRef.set({
      ...staffData,
      _migratedFrom: oldDocId,
      _migratedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    if (oldDocId !== uid) {
      await db.collection('staffUsers').doc(oldDocId).delete()
    }

    return NextResponse.json({
      synced: true,
      role: staffData.role,
      isActive: staffData.isActive,
      showroomId: staffData.showroomId || null,
      showroomName: staffData.showroomName || null,
      staffId: uid,
      name: staffData.name,
    })
  } catch (error: any) {
    console.error('Staff sync error:', error)
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
