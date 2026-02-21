import { NextRequest, NextResponse } from 'next/server'
import { getStockMovements, type StockMovementType } from '@/lib/firebase/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const inventoryId = searchParams.get('inventoryId') || undefined
    const type = searchParams.get('type') as StockMovementType | null

    const movements = await getStockMovements({
      inventoryId,
      type: type || undefined,
    })
    return NextResponse.json({ movements })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
