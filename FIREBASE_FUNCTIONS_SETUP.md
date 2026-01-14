# Firebase Cloud Functions Setup Guide

This guide explains how to set up and deploy Firebase Cloud Functions for the WorthyTen API.

## Overview

All Next.js API routes have been migrated to Firebase Cloud Functions, allowing:
- ✅ Frontend deployment on GitHub Pages (static export)
- ✅ Backend APIs via Firebase Cloud Functions
- ✅ Custom domain support
- ✅ Full functionality maintained

## Prerequisites

1. **Firebase CLI** (already installed)
   ```bash
   firebase --version
   ```

2. **Node.js 20+** (required for Firebase Functions)

3. **Firebase Project** (already configured in `.firebaserc`)

## Setup Steps

### 1. Install Functions Dependencies

```bash
cd functions
npm install
```

### 2. Build Functions

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `lib/` directory.

### 3. Set Environment Variables

Set the following environment variables in Firebase Functions:

```bash
firebase functions:config:set \
  telegram.bot_token="YOUR_TELEGRAM_BOT_TOKEN" \
  telegram.chat_id="YOUR_TELEGRAM_CHAT_ID" \
  twilio.account_sid="YOUR_TWILIO_ACCOUNT_SID" \
  twilio.auth_token="YOUR_TWILIO_AUTH_TOKEN" \
  twilio.whatsapp_number="YOUR_TWILIO_WHATSAPP_NUMBER" \
  resend.api_key="YOUR_RESEND_API_KEY" \
  email.from="WorthyTen <noreply@worthyten.com>"
```

Or use Firebase Functions secrets (recommended for production):

```bash
# Set secrets
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set TELEGRAM_CHAT_ID
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_WHATSAPP_NUMBER
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set FROM_EMAIL
```

### 4. Update Functions Code to Use Secrets

If using secrets, update the functions to access them:

```typescript
// In functions/src/notifications/telegram.ts
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || functions.config().telegram?.bot_token
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || functions.config().telegram?.chat_id
```

### 5. Deploy Functions

```bash
# From project root
firebase deploy --only functions
```

Or deploy specific functions:

```bash
firebase deploy --only functions:calculate,functions:valuations
```

### 6. Get Functions URL

After deployment, note the Functions URL format:
```
https://us-central1-<PROJECT_ID>.cloudfunctions.net/<FUNCTION_NAME>
```

### 7. Update Frontend Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_FUNCTIONS_URL=https://us-central1-<PROJECT_ID>.cloudfunctions.net
# OR
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<PROJECT_ID>
NEXT_PUBLIC_FUNCTION_REGION=us-central1
```

The API client (`lib/api/client.ts`) will automatically construct the Functions URL from these variables.

## Available Functions

| Function Name | Endpoint | Methods | Description |
|--------------|----------|---------|-------------|
| `calculate` | `/calculate` | POST | Calculate device value |
| `valuations` | `/valuations` | GET, POST, PATCH | Manage valuations |
| `pickupRequests` | `/pickupRequests` | POST | Create pickup requests |
| `schedulePickup` | `/schedulePickup` | POST | Schedule pickup |
| `devices` | `/devices` | GET | Get device information |
| `telegramNotify` | `/telegramNotify` | POST | Send Telegram notifications |
| `whatsappNotify` | `/whatsappNotify` | POST | Send WhatsApp notifications |
| `emailConfirm` | `/emailConfirm` | POST | Send email confirmations |

## Local Development

### Run Functions Emulator

```bash
cd functions
npm run serve
```

This starts the Firebase Functions emulator at `http://localhost:5001`.

### Update Frontend for Local Development

For local development, update `.env.local`:

```env
NEXT_PUBLIC_FUNCTIONS_URL=http://localhost:5001/<PROJECT_ID>/us-central1
```

## Testing

### Test Individual Functions

```bash
# Test calculate function
curl -X POST https://us-central1-<PROJECT_ID>.cloudfunctions.net/calculate \
  -H "Content-Type: application/json" \
  -d '{"brand":"canon","model":"EOS R5","condition":"excellent"}'
```

### Test from Frontend

The frontend components now use the API client (`lib/api/client.ts`) which automatically calls the correct Functions URL.

## Custom Domain Setup

### Option 1: Firebase Hosting Rewrites

Add to `firebase.json`:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ]
  }
}
```

### Option 2: Direct Functions URL

The frontend uses the Functions URL directly, which works with any domain.

## Troubleshooting

### Functions Not Deploying

1. Check Firebase CLI is logged in:
   ```bash
   firebase login
   ```

2. Verify project ID in `.firebaserc`:
   ```bash
   cat .firebaserc
   ```

3. Check Functions build:
   ```bash
   cd functions && npm run build
   ```

### CORS Errors

CORS is handled in each function. If you see CORS errors:
1. Check the function is deployed correctly
2. Verify CORS headers are set in the function code
3. Check browser console for specific error messages

### Environment Variables Not Working

1. Verify secrets/config are set:
   ```bash
   firebase functions:config:get
   ```

2. Check function logs:
   ```bash
   firebase functions:log
   ```

## Migration Checklist

- [x] Firebase Functions initialized
- [x] All API routes migrated
- [x] Frontend components updated to use API client
- [x] Environment variables documented
- [ ] Functions deployed to Firebase
- [ ] Environment variables set in Firebase
- [ ] Frontend environment variables updated
- [ ] End-to-end testing completed

## Next Steps

1. Deploy functions to Firebase
2. Set environment variables/secrets
3. Update frontend `.env.local` with Functions URL
4. Test all endpoints
5. Deploy frontend to GitHub Pages
6. Configure custom domain (if needed)
