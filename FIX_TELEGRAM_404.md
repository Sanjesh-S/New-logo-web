# Fix Telegram 404 Error

## Problem
The logs show:
```
Telegram API error {
  status: 404,
  statusText: 'Not Found',
  error: { ok: false, error_code: 404, description: 'Not Found' }
}
```

## Causes of Telegram 404 Error

1. **Invalid Bot Token** - The bot token is incorrect or has been revoked
2. **Invalid Chat ID** - The chat ID doesn't exist or the bot hasn't been added to that chat
3. **Bot Not Started** - The user hasn't started a conversation with the bot

## Solutions

### Step 1: Verify Bot Token

1. Go to Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/mybots`
3. Select your bot
4. Click "API Token"
5. Copy the token and verify it matches what's in Secret Manager

### Step 2: Verify Chat ID

**Method 1: Using BotFather**
1. Start a conversation with your bot
2. Send any message to your bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for `"chat":{"id":123456789}` - that's your chat ID

**Method 2: Using a Test Message**
1. Send a message to your bot
2. The chat ID is usually a negative number for groups/channels, or a positive number for direct messages

### Step 3: Update Secrets

If the token or chat ID is wrong:

```bash
# Update Telegram Bot Token
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
# Paste the correct token when prompted

# Update Telegram Chat ID
firebase functions:secrets:set TELEGRAM_CHAT_ID
# Paste the correct chat ID when prompted
```

### Step 4: Redeploy Functions

After updating secrets, redeploy:

```bash
cd functions
npm run build
firebase deploy --only functions
```

### Step 5: Test the Bot

Test if the bot works:
1. Send a message to your bot on Telegram
2. The bot should respond (if it has a message handler)
3. If the bot doesn't respond, the token might be wrong

### Step 6: Test Function Directly

Test the function with correct credentials:

```bash
curl -X POST https://us-central1-worthyten-otp-a925d.cloudfunctions.net/telegramNotify \
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

## Common Issues

### Issue: Bot token works but chat ID is wrong
- **Solution**: Make sure you're using the correct chat ID. For groups, it's usually negative. For direct messages, it's positive.

### Issue: Bot was deleted and recreated
- **Solution**: Get a new token from BotFather and update the secret

### Issue: Bot hasn't been started
- **Solution**: Send `/start` to your bot first, then try sending a message

### Issue: Bot doesn't have permission in a group
- **Solution**: Make sure the bot is an admin in the group, or use a direct message chat ID instead

## Quick Checklist

- [ ] Bot token is correct (check with BotFather)
- [ ] Chat ID is correct (get from getUpdates API)
- [ ] Bot has been started (send /start to bot)
- [ ] Secrets are updated in Secret Manager
- [ ] Functions are redeployed after updating secrets
- [ ] Test function directly with curl
