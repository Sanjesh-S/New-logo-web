/**
 * Zod Validation Schemas
 * 
 * This file contains all validation schemas for API endpoints using Zod.
 */

import { z } from 'zod'

// Customer schema for pickup requests
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(1, 'Address is required').max(500, 'Address is too long'),
  landmark: z.string().max(200, 'Landmark is too long').optional(),
  city: z.string().min(1, 'City is required').max(100, 'City is too long'),
  state: z.string().min(1, 'State is required').max(100, 'State is too long'),
  pincode: z.string().regex(/^\d{6}$/, 'Please enter a valid 6-digit pincode'),
})

// Pickup request schema
export const pickupRequestSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(200),
  price: z.number().positive('Price must be positive'),
  customer: customerSchema,
  pickupDate: z.string().min(1, 'Pickup date is required'),
  pickupTime: z.string().min(1, 'Pickup time is required'),
  userId: z.string().optional().nullable(),
})

// Valuation schema - supports both legacy and new assessment format
export const valuationSchema = z.object({
  category: z.enum(['cameras', 'phones', 'laptops']),
  brand: z.string().min(1, 'Brand is required').max(100),
  model: z.string().min(1, 'Model is required').max(200),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  usage: z.enum(['light', 'moderate', 'heavy']).optional(),
  accessories: z.array(z.string()).optional(),
  basePrice: z.number().nonnegative().optional(),
  internalBasePrice: z.number().nonnegative().optional(),
  estimatedValue: z.number().nonnegative().optional(),
  userId: z.string().optional().nullable(),
  productId: z.string().optional(),
  answers: z.record(z.string(), z.any()).optional(), // Assessment answers structure
  pickupAddress: z.string().optional(),
  userName: z.string().optional(),
  userPhone: z.string().optional(),
})

// Valuation update schema
export const valuationUpdateSchema = z.object({
  id: z.string().min(1, 'Valuation ID is required'),
  status: z.enum(['pending', 'approved', 'rejected', 'completed']).optional(),
  finalValue: z.number().nonnegative().optional(),
}).passthrough() // Allow additional fields

// Calculate request schema
export const calculateRequestSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  usage: z.enum(['light', 'moderate', 'heavy']).optional(),
  accessories: z.array(z.string()).optional(),
})

// Get valuation query schema
export const getValuationQuerySchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
}).refine((data) => data.id || data.userId, {
  message: 'Either id or userId must be provided',
})

// Export types inferred from schemas
export type CustomerInput = z.infer<typeof customerSchema>
export type PickupRequestInput = z.infer<typeof pickupRequestSchema>
export type ValuationInput = z.infer<typeof valuationSchema>
export type ValuationUpdateInput = z.infer<typeof valuationUpdateSchema>
export type CalculateRequestInput = z.infer<typeof calculateRequestSchema>
export type GetValuationQueryInput = z.infer<typeof getValuationQuerySchema>
