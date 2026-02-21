import { NextRequest, NextResponse } from 'next/server'
import { getAgentAssignedOrders } from '@/lib/firebase/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }
    const orders = await getAgentAssignedOrders(agentId)
    return NextResponse.json({ orders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
