import { NextRequest, NextResponse } from 'next/server'
import { getDevices, getDevice } from '@/lib/firebase/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const model = searchParams.get('model')

    if (brand && model) {
      const device = await getDevice(brand, model)
      if (!device) {
        return NextResponse.json(
          { error: 'Device not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ device })
    }

    if (category) {
      const devices = await getDevices(category, brand || undefined)
      return NextResponse.json({ devices })
    }

    return NextResponse.json(
      { error: 'Missing category, or brand and model parameters' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}



