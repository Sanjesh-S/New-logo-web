# Fix "chat not found" Error

## Current Error
```
Bad Request: chat not found
error_code: 400
```

This means your `TELEGRAM_CHAT_ID` is incorrect.

## How to Get the Correct Chat ID

### Method 1: Using getUpdates API (Recommended)

1. **Get your bot token** from Secret Manager or BotFather

2. **Send a message to your bot** on Telegram (any message)

3. **Call the Telegram API** to get updates:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```

4. **Look for the chat ID** in the response:
   ```json
   {
     "ok": true,
     "result": [
       {
         "message": {
           "chat": {
             "id": 123456789,  // <-- This is your chat ID
             "type": "private"
           }
         }
       }
     ]
   }
   ```

### Method 2: Using a Telegram Bot

1. Message [@userinfobot](https://t.me/userinfobot) on Telegram
2. It will reply with your user ID (this is your chat ID for direct messages)

### Method 3: For Groups/Channels

1. Add your bot to the group/channel
2. Make the bot an admin (for channels)
3. Send a message in the group/channel
4. Call `getUpdates` API
5. Look for the chat ID (usually negative for groups/channels)

## Update the Chat ID Secret

Once you have the correct chat ID:

```bash
firebase functions:secrets:set TELEGRAM_CHAT_ID
# Paste the correct chat ID when prompted
```

## Important Notes

- **Direct messages**: Chat ID is a positive number (e.g., `123456789`)
- **Groups**: Chat ID is a negative number (e.g., `-1001234567890`)
- **Channels**: Chat ID is also negative (e.g., `-1001234567890`)
- **Bot must be started**: Send `/start` to your bot first
- **For groups**: Bot must be added to the group

## After Updating

1. **Redeploy functions** (secrets are automatically picked up):
   ```bash
   firebase deploy --only functions
   ```

2. **Test again** by creating a pickup request

3. **Check logs**:
   ```bash
   firebase functions:log --only telegramNotify
   ```

## Quick Test

Test if your bot and chat ID work:

```bash
# Replace YOUR_BOT_TOKEN and YOUR_CHAT_ID
curl https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage \
  -d "chat_id=YOUR_CHAT_ID" \
  -d "text=Test message"
```

If this works, your credentials are correct!
