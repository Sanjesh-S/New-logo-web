import { NextRequest, NextResponse } from 'next/server'
import { getDevices, getDevice } from '@/lib/firebase/database'
import { createLogger } from '@/lib/utils/logger'
import { getCache, setCache, generateCacheKey } from '@/lib/utils/cache'
import { checkRateLimit, getClientIdentifier } from '@/lib/middleware/rate-limit'

const logger = createLogger('API:Devices')

export async function GET(request: NextRequest) {
  try {
    // Rate limiting (200 requests per minute per IP)
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(clientId, { maxRequests: 200, windowMs: 60000 })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString() } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const model = searchParams.get('model')

    // Validate query parameter lengths
    if (category && category.length > 100) {
      return NextResponse.json({ error: 'Invalid category parameter' }, { status: 400 })
    }
    if (brand && brand.length > 100) {
      return NextResponse.json({ error: 'Invalid brand parameter' }, { status: 400 })
    }
    if (model && model.length > 200) {
      return NextResponse.json({ error: 'Invalid model parameter' }, { status: 400 })
    }

    if (brand && model) {
      // Cache individual device lookups (10 minutes TTL)
      const cacheKey = generateCacheKey('/api/devices', { brand, model })
      const cached = getCache<{ device: unknown }>(cacheKey)
      
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
          },
        })
      }
      
      const device = await getDevice(brand, model)
      if (!device) {
        return NextResponse.json(
          { error: 'Device not found' },
          { status: 404 }
        )
      }
      
      const response = { device }
      setCache(cacheKey, response, 10 * 60 * 1000) // 10 minutes
      
      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
        },
      })
    }

    if (category) {
      // Cache device lists (5 minutes TTL)
      const cacheKey = generateCacheKey('/api/devices', { category, brand: brand || '' })
      const cached = getCache<{ devices: unknown }>(cacheKey)
      
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=180',
          },
        })
      }
      
      const result = await getDevices(category, brand || undefined)
      // Support both paginated and legacy return formats
      const devices = Array.isArray(result) ? result : (result.data || result)
      const response = { devices }
      setCache(cacheKey, response, 5 * 60 * 1000) // 5 minutes
      
      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=180',
        },
      })
    }

    return NextResponse.json(
      { error: 'Missing category, or brand and model parameters' },
      { status: 400 }
    )
  } catch (error) {
    logger.error('Error fetching devices', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}
