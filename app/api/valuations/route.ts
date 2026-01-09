import { NextRequest, NextResponse } from 'next/server'
import { createValuation, getValuation, updateValuation, getUserValuations } from '@/lib/firebase/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      category, 
      brand, 
      model, 
      condition, 
      usage, 
      accessories, 
      basePrice, 
      internalBasePrice,
      estimatedValue, 
      userId,
      productId,
      answers // New assessment answers structure
    } = body

    // Support both old format (condition, usage) and new assessment format (answers)
    if (!category || !brand || !model) {
      return NextResponse.json(
        { error: 'Missing required fields: category, brand, model' },
        { status: 400 }
      )
    }

    // For new assessment flow, extract condition/usage from answers if needed
    let finalCondition = condition
    let finalUsage = usage
    let finalAccessories = accessories || []

    if (answers) {
      // Map assessment answers to legacy format if needed
      // This allows backward compatibility
      if (!finalCondition && answers.bodyCondition) {
        const bodyCond = Array.isArray(answers.bodyCondition) 
          ? answers.bodyCondition[0] 
          : answers.bodyCondition
        finalCondition = bodyCond || 'good'
      }
      if (!finalUsage && answers.age) {
        // Map age to usage
        if (answers.age === 'lessThan3Months') finalUsage = 'light'
        else if (answers.age === 'fourToTwelveMonths') finalUsage = 'moderate'
        else finalUsage = 'heavy'
      }
      if (!finalAccessories.length && answers.accessories) {
        finalAccessories = Array.isArray(answers.accessories) 
          ? answers.accessories 
          : [answers.accessories]
      }
    }

    // Ensure we have condition and usage (use defaults if not provided)
    finalCondition = finalCondition || 'good'
    finalUsage = finalUsage || 'moderate'

    const valuationId = await createValuation({
      category,
      brand,
      model,
      condition: finalCondition,
      usage: finalUsage,
      accessories: finalAccessories,
      basePrice: basePrice || 0,
      estimatedValue: estimatedValue || 0,
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










