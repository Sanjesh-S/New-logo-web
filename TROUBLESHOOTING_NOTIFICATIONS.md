# Troubleshooting Notification Issues

## Issue: Not receiving Telegram and WhatsApp notifications

### Step 1: Check Firebase Functions Logs

```bash
# View recent logs
firebase functions:log

# View logs for specific functions
firebase functions:log --only telegramNotify
firebase functions:log --only whatsappNotify
firebase functions:log --only pickupRequests
```

### Step 2: Verify Functions are Deployed

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Functions** → **Dashboard**
4. Verify these functions exist and are active:
   - `telegramNotify`
   - `whatsappNotify`
   - `pickupRequests`

### Step 3: Verify Secrets are Configured

```bash
# Check if secrets are set
firebase functions:secrets:access TELEGRAM_BOT_TOKEN
firebase functions:secrets:access TELEGRAM_CHAT_ID
firebase functions:secrets:access TWILIO_ACCOUNT_SID
firebase functions:secrets:access TWILIO_AUTH_TOKEN
firebase functions:secrets:access TWILIO_WHATSAPP_NUMBER
```

### Step 4: Check Environment Variables

Verify these are set in your `.env.local`:
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FUNCTIONS_URL` (or it will be auto-constructed)
- `NEXT_PUBLIC_FUNCTION_REGION` (defaults to `us-central1`)

### Step 5: Test Functions Directly

Test the Telegram function:
```bash
curl -X POST https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/telegramNotify \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Test Device",
    "price": 1000,
    "customer": {
      "name": "Test User",
      "phone": "+1234567890",
      "email": "test@example.com",
      "address": "123 Test St",
      "city": "Test City",
      "state": "Test State",
      "pincode": "123456"
    },
    "pickupDate": "2024-01-15",
    "pickupTime": "10:00 AM",
    "requestId": "test-123"
  }'
```

### Step 6: Common Issues

#### Issue: "Function not found" or 404
- **Solution**: Redeploy functions: `firebase deploy --only functions`

#### Issue: "Environment variable not found"
- **Solution**: 
  1. Verify secrets are set: `firebase functions:secrets:access SECRET_NAME`
  2. Redeploy functions after setting secrets
  3. Check function code uses `defineSecret` correctly

#### Issue: "Permission denied"
- **Solution**: 
  1. Check Firebase IAM roles
  2. Ensure secrets have access granted: `firebase functions:secrets:access SECRET_NAME`

#### Issue: Functions URL is incorrect
- **Solution**: 
  1. Check `NEXT_PUBLIC_FUNCTIONS_URL` in environment variables
  2. Or verify `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is correct
  3. Check `NEXT_PUBLIC_FUNCTION_REGION` matches your deployment region

#### Issue: Secrets not accessible in functions
- **Solution**:
  1. Verify secrets are defined in `functions/src/index.ts` using `defineSecret`
  2. Verify functions use `.runWith({ secrets: [...] })`
  3. Redeploy functions after adding secrets

### Step 7: Check Browser Console

Open browser DevTools → Console and look for:
- Network errors when calling functions
- CORS errors
- Function URL errors

### Step 8: Verify Function URLs

The functions URL should be:
```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net
```

Or if using custom region:
```
https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net
```

### Step 9: Redeploy Functions

After making changes, always redeploy:
```bash
cd functions
npm run build
firebase deploy --only functions
```

### Step 10: Check Function Logs in Console

1. Go to Firebase Console → Functions
2. Click on a function (e.g., `telegramNotify`)
3. Go to **Logs** tab
4. Look for errors or warnings

## Quick Fix Checklist

- [ ] Functions are deployed (`firebase deploy --only functions`)
- [ ] Secrets are set in Secret Manager
- [ ] Secrets are granted access to functions
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is set correctly
- [ ] `NEXT_PUBLIC_FUNCTIONS_URL` is set (or auto-constructed correctly)
- [ ] Function logs show no errors
- [ ] Test function directly with curl (see Step 5)
