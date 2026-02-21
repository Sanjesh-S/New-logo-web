import { NextRequest, NextResponse } from 'next/server'
import { getInventoryItems, getInventoryItem, updateInventoryItem, createInventoryItem, type InventoryLocation, type InventoryStatus } from '@/lib/firebase/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const item = await getInventoryItem(id)
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ item })
    }

    const location = searchParams.get('location') as InventoryLocation | null
    const status = searchParams.get('status') as InventoryStatus | null
    const category = searchParams.get('category') || undefined
    const brand = searchParams.get('brand') || undefined

    const items = await getInventoryItems({
      location: location || undefined,
      status: status || undefined,
      category,
      brand,
    })
    return NextResponse.json({ items })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const id = await createInventoryItem(body)
    return NextResponse.json({ id })
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
    await updateInventoryItem(id, body)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
