import { NextRequest, NextResponse } from 'next/server'
import { getInventoryItems, createInventoryItem, type InventoryLocation, type InventoryStatus } from '@/lib/firebase/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
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
