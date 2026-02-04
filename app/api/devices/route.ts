import { NextRequest, NextResponse } from 'next/server'
import { getDevices, getDevice } from '@/lib/firebase/database'
import { createLogger } from '@/lib/utils/logger'
import { getCache, setCache, generateCacheKey } from '@/lib/utils/cache'

const logger = createLogger('API:Devices')


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const model = searchParams.get('model')

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
