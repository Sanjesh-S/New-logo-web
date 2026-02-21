import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function GET() {
  try {
    const db = getAdminFirestore()
    const snap = await db.collection('showrooms').get()
    const showrooms = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ showrooms })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, city, state, pincode, phone } = body
    if (!name || !address || !city || !state || !pincode || !phone) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    const db = getAdminFirestore()
    const docRef = await db.collection('showrooms').add({
      name, address, city, state, pincode, phone, isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ id: docRef.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const body = await request.json()
    const db = getAdminFirestore()
    await db.collection('showrooms').doc(id).update({
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
