import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function GET() {
  try {
    const db = getAdminFirestore()
    const snap = await db.collection('staffUsers').get()
    const staff = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ staff })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phoneNumber, email, role, isActive, showroomId, showroomName, createdBy } = body
    if (!name || !phoneNumber || !role) {
      return NextResponse.json({ error: 'Name, phone, and role are required' }, { status: 400 })
    }
    const db = getAdminFirestore()
    const docRef = await db.collection('staffUsers').add({
      name,
      phoneNumber,
      email: email || null,
      role,
      isActive: isActive ?? true,
      showroomId: showroomId || null,
      showroomName: showroomName || null,
      createdBy: createdBy || null,
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
    await db.collection('staffUsers').doc(id).update({
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const db = getAdminFirestore()
    await db.collection('staffUsers').doc(id).update({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
