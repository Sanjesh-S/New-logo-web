import { NextRequest, NextResponse } from 'next/server'
import { getReceiptsByOrder } from '@/lib/firebase/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }
    const receipts = await getReceiptsByOrder(orderId)
    return NextResponse.json({ receipts })
  } catch (error: any) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
