import { describe, it, expect } from 'vitest'
import { validateSchema } from '@/lib/validations'
import { pickupRequestSchema, valuationSchema, calculateRequestSchema } from '@/lib/validations/schemas'

describe('Validation Schemas', () => {
  describe('pickupRequestSchema', () => {
    it('should validate a valid pickup request', () => {
      const validRequest = {
        productName: 'Canon EOS R5',
        price: 2500,
        customer: {
          name: 'John Doe',
          phone: '9876543210',
          email: 'john@example.com',
          address: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
        pickupDate: '2024-01-15',
        pickupTime: '10:00 AM',
      }

      const result = validateSchema(pickupRequestSchema, validRequest)
      expect(result.isValid).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should reject invalid phone number', () => {
      const invalidRequest = {
        productName: 'Canon EOS R5',
        price: 2500,
        customer: {
          name: 'John Doe',
          phone: '1234567890', // Invalid: doesn't start with 6-9
          email: 'john@example.com',
          address: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
        pickupDate: '2024-01-15',
        pickupTime: '10:00 AM',
      }

      const result = validateSchema(pickupRequestSchema, invalidRequest)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('valuationSchema', () => {
    it('should validate a valid valuation', () => {
      const validValuation = {
        category: 'cameras',
        brand: 'canon',
        model: 'EOS R5',
        condition: 'excellent',
        usage: 'light',
        accessories: ['box', 'charger'],
      }

      const result = validateSchema(valuationSchema, validValuation)
      expect(result.isValid).toBe(true)
    })

    it('should reject invalid category', () => {
      const invalidValuation = {
        category: 'invalid',
        brand: 'canon',
        model: 'EOS R5',
      }

      const result = validateSchema(valuationSchema, invalidValuation)
      expect(result.isValid).toBe(false)
    })
  })

  describe('calculateRequestSchema', () => {
    it('should validate a valid calculate request', () => {
      const validRequest = {
        brand: 'canon',
        model: 'EOS R5',
        condition: 'excellent',
        usage: 'light',
        accessories: ['box'],
      }

      const result = validateSchema(calculateRequestSchema, validRequest)
      expect(result.isValid).toBe(true)
    })

    it('should require brand and model', () => {
      const invalidRequest = {
        brand: 'canon',
        // missing model
      }

      const result = validateSchema(calculateRequestSchema, invalidRequest)
      expect(result.isValid).toBe(false)
    })
  })
})
