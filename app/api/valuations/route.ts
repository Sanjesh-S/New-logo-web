import { NextRequest, NextResponse } from 'next/server'
import { createValuation, getValuation, updateValuation, getUserValuations } from '@/lib/firebase/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, brand, model, condition, usage, accessories, basePrice, estimatedValue, userId } = body

    if (!category || !brand || !model || !condition || !usage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const valuationId = await createValuation({
      category,
      brand,
      model,
      condition,
      usage,
      accessories: accessories || [],
      basePrice,
      estimatedValue,
      userId: userId || null,
      status: 'pending',
    })

    return NextResponse.json({ 
      success: true, 
      id: valuationId,
      message: 'Valuation created successfully' 
    })
  } catch (error) {
    console.error('Error creating valuation:', error)
    return NextResponse.json(
      { error: 'Failed to create valuation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (id) {
      const valuation = await getValuation(id)
      if (!valuation) {
        return NextResponse.json(
          { error: 'Valuation not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ valuation })
    }

    if (userId) {
      const valuations = await getUserValuations(userId)
      return NextResponse.json({ valuations })
    }

    return NextResponse.json(
      { error: 'Missing id or userId parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching valuation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch valuation' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing valuation id' },
        { status: 400 }
      )
    }

    await updateValuation(id, updates)

    return NextResponse.json({ 
      success: true,
      message: 'Valuation updated successfully' 
    })
  } catch (error) {
    console.error('Error updating valuation:', error)
    return NextResponse.json(
      { error: 'Failed to update valuation' },
      { status: 500 }
    )
  }
}






