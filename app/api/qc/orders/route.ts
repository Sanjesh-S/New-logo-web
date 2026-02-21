import { NextResponse } from 'next/server'
import { getOrdersForQC } from '@/lib/firebase/database'

export async function GET() {
  try {
    const orders = await getOrdersForQC()
    return NextResponse.json({ orders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
