# API Documentation

This document describes all available API endpoints for the CameraTrade application.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints do not require authentication. Rate limiting is applied per IP address.

---

## Endpoints

### 1. Calculate Device Value

Calculate the estimated trade-in value for a device.

**Endpoint:** `POST /api/calculate`

**Request Body:**
```json
{
  "brand": "canon",
  "model": "EOS R5",
  "condition": "excellent",  // optional: "excellent" | "good" | "fair" | "poor"
  "usage": "light",          // optional: "light" | "moderate" | "heavy"
  "accessories": ["box", "charger"]  // optional: array of strings
}
```

**Response:**
```json
{
  "success": true,
  "basePrice": 2500,
  "estimatedValue": 2650,
  "breakdown": {
    "basePrice": 2500,
    "conditionMultiplier": 1.0,
    "usageMultiplier": 1.0,
    "accessoriesTotal": 50
  }
}
```

**Rate Limit:** 200 requests per minute per IP

**Status Codes:**
- `200` - Success
- `400` - Validation error
- `429` - Rate limit exceeded
- `500` - Server error

---

### 2. Create Valuation

Create a new device valuation request.

**Endpoint:** `POST /api/valuations`

**Request Body:**
```json
{
  "category": "cameras",  // required: "cameras" | "phones" | "laptops"
  "brand": "canon",       // required
  "model": "EOS R5",      // required
  "condition": "excellent",  // optional
  "usage": "light",          // optional
  "accessories": ["box"],    // optional
  "basePrice": 2500,         // optional
  "estimatedValue": 2650,    // optional
  "userId": "user123",       // optional
  "productId": "prod123",    // optional
  "answers": {},             // optional: assessment answers object
  "pickupAddress": "...",    // optional
  "userName": "...",         // optional
  "userPhone": "..."         // optional
}
```

**Response:**
```json
{
  "success": true,
  "id": "valuation_id",
  "message": "Valuation created successfully"
}
```

**Rate Limit:** 100 requests per minute per IP

**Status Codes:**
- `200` - Success
- `400` - Validation error
- `429` - Rate limit exceeded
- `500` - Server error

---

### 3. Get Valuation(s)

Retrieve valuation(s) by ID or user ID.

**Endpoint:** `GET /api/valuations`

**Query Parameters:**
- `id` (string, optional) - Get specific valuation by ID
- `userId` (string, optional) - Get all valuations for a user

**Example:** `GET /api/valuations?id=val123`

**Response (single valuation):**
```json
{
  "valuation": {
    "id": "val123",
    "category": "cameras",
    "brand": "canon",
    "model": "EOS R5",
    "condition": "excellent",
    "estimatedValue": 2650,
    "status": "pending",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Response (multiple valuations):**
```json
{
  "valuations": [
    {
      "id": "val123",
      ...
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing id or userId parameter
- `404` - Valuation not found
- `500` - Server error

---

### 4. Update Valuation

Update an existing valuation (typically for status changes).

**Endpoint:** `PATCH /api/valuations`

**Request Body:**
```json
{
  "id": "valuation_id",  // required
  "status": "approved",  // optional: "pending" | "approved" | "rejected" | "completed"
  "finalValue": 2600     // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Valuation updated successfully"
}
```

**Status Codes:**
- `200` - Success
- `400` - Validation error (missing id)
- `500` - Server error

---

### 5. Get Devices

Retrieve devices by category and optional brand.

**Endpoint:** `GET /api/devices`

**Query Parameters:**
- `category` (string, required) - Device category
- `brand` (string, optional) - Filter by brand
- `model` (string, optional) - Get specific device (requires brand)

**Examples:**
- `GET /api/devices?category=cameras`
- `GET /api/devices?category=cameras&brand=canon`
- `GET /api/devices?brand=canon&model=EOS%20R5`

**Response:**
```json
{
  "devices": [
    {
      "id": "device_id",
      "brand": "canon",
      "model": "EOS R5",
      "category": "cameras",
      "basePrice": 2500
    }
  ]
}
```

**Caching:** Responses are cached for 5-10 minutes with appropriate cache headers.

**Status Codes:**
- `200` - Success
- `400` - Missing required parameters
- `404` - Device not found
- `500` - Server error

---

### 6. Create Pickup Request

Create a pickup request for a trade-in device.

**Endpoint:** `POST /api/pickup-requests`

**Request Body:**
```json
{
  "productName": "Canon EOS R5",  // required
  "price": 2650,                   // required
  "customer": {                    // required
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "address": "123 Main St",
    "landmark": "Near Park",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "pickupDate": "2024-01-15",      // required
  "pickupTime": "10:00 AM"         // required
}
```

**Response:**
```json
{
  "success": true,
  "id": "pickup_request_id"
}
```

**Rate Limit:** 50 requests per minute per IP

**Status Codes:**
- `200` - Success
- `400` - Validation error
- `429` - Rate limit exceeded
- `500` - Server error

---

### 7. Telegram Notification

Send Telegram notification (internal use).

**Endpoint:** `POST /api/telegram/notify`

**Note:** This endpoint is used internally by the pickup-requests endpoint and requires Telegram bot credentials to be configured.

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "ErrorCode",
  "message": "Human-readable error message",
  "details": {}  // Optional additional error details
}
```

## Rate Limiting

All POST endpoints are rate-limited:
- Calculate: 200 requests/minute
- Valuations: 100 requests/minute
- Pickup Requests: 50 requests/minute

When rate limit is exceeded, a `429 Too Many Requests` response is returned with headers:
- `Retry-After`: Seconds to wait before retrying
- `X-RateLimit-Reset`: Timestamp when rate limit resets

## Validation

All endpoints use Zod schema validation. Invalid requests return `400 Bad Request` with detailed validation errors:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "customer.email",
      "message": "Invalid email format"
    }
  ]
}
```
