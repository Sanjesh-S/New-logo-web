# Pricing Data Migration Guide

## Current State

The `/api/calculate` endpoint currently uses hardcoded pricing data in `app/api/calculate/route.ts`:
- `BASE_PRICES` - Base prices for different camera models
- `CONDITION_MULTIPLIERS` - Condition-based multipliers
- `USAGE_MULTIPLIERS` - Usage-based multipliers
- `ACCESSORY_PRICES` - Accessory prices

## Recommended Migration

Move all pricing data to Firestore `productPricing` collection for dynamic updates.

### Step 1: Create Pricing Data Structure

Create a `productPricing` collection in Firestore with the following structure:

```typescript
{
  productId: string,  // Reference to products collection
  basePrice: number,
  conditionMultipliers: {
    excellent: number,
    good: number,
    fair: number,
    poor: number,
  },
  usageMultipliers: {
    light: number,
    moderate: number,
    heavy: number,
  },
  accessoryPrices: {
    [accessoryName: string]: number,
  },
  updatedAt: Timestamp,
}
```

### Step 2: Update API Route

1. Modify `app/api/calculate/route.ts` to fetch pricing from Firestore
2. Add fallback to hardcoded values if Firestore data is unavailable
3. Implement caching for pricing data

### Step 3: Admin Interface

Create an admin interface to manage pricing:
- Update base prices
- Adjust multipliers
- Manage accessory prices
- Bulk import/export pricing data

### Benefits

- ✅ Dynamic pricing updates without code deployment
- ✅ Product-specific pricing rules
- ✅ Historical pricing tracking
- ✅ Easy A/B testing of pricing strategies
- ✅ Centralized pricing management

### Implementation Notes

- Keep hardcoded values as fallback during migration
- Implement caching to reduce Firestore reads
- Add versioning for pricing rules if needed
- Consider time-based pricing (seasonal adjustments)
