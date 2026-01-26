# Deployment Guide - Environment Variables & API Keys

This guide explains how to securely store and manage your API keys (Firebase, Twilio, Telegram) when deploying to your own domain.

## 🔐 Security Overview

### Client-Side vs Server-Side Variables

**Client-Side Variables (NEXT_PUBLIC_*):**
- These are **public** and visible in the browser
- Safe to expose: Firebase API keys, project IDs
- Used in: `lib/firebase/config.ts`, client components

**Server-Side Variables (No NEXT_PUBLIC_ prefix):**
- These are **secret** and only run on the server
- Never expose: Twilio tokens, Telegram tokens, Firebase Admin keys
- Used in: API routes, Firebase Functions, server components

## 📋 Required Environment Variables

### 1. Firebase Configuration (Client-Side)

Get these from: **Firebase Console** → **Project Settings** → **General** → **Your apps**

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Note:** Firebase API keys are safe to expose publicly. Firebase uses security rules to protect your data.

### 2. Twilio Configuration (Server-Side - SECRET!)

Get these from: **Twilio Console** → **Account** → **API Keys & Tokens**

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token-here
TWILIO_WHATSAPP_NUMBER=+1234567890
WHATSAPP_TEMPLATE_NAME=your-template-name
WHATSAPP_CONTENT_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ CRITICAL:** These are **SECRET** credentials. Never commit them to Git or expose them publicly.

### 3. Telegram Bot Configuration (Server-Side - SECRET!)

Get these from: **Telegram** → **@BotFather**

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Push your code to GitHub** (without `.env.local`)

2. **Import project to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Add Environment Variables:**
   - Go to **Project Settings** → **Environment Variables**
   - Add each variable from `.env.example`
   - Select environments: **Production**, **Preview**, **Development**

4. **Deploy:**
   - Vercel automatically detects Next.js
   - Deploys on every push to main branch

**Vercel automatically:**
- Encrypts environment variables
- Only exposes `NEXT_PUBLIC_*` to client
- Keeps server-side variables secure

### Option 2: Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase:**
   ```bash
   firebase init hosting
   ```

3. **Set Environment Variables:**
   - For **Firebase Functions**: Use `firebase functions:secrets:set` (recommended) or environment variables
   ```bash
   # Set secrets (recommended - encrypted at rest)
   firebase functions:secrets:set TELEGRAM_BOT_TOKEN
   firebase functions:secrets:set TELEGRAM_CHAT_ID
   firebase functions:secrets:set TWILIO_ACCOUNT_SID
   firebase functions:secrets:set TWILIO_AUTH_TOKEN
   firebase functions:secrets:set TWILIO_WHATSAPP_NUMBER
   firebase functions:secrets:set WHATSAPP_CONTENT_SID
   ```
   
   Or set environment variables directly:
   ```bash
   firebase functions:config:set telegram.bot_token="xxx" telegram.chat_id="xxx"
   firebase functions:config:set twilio.account_sid="ACxxx" twilio.auth_token="xxx"
   ```

   - For **Next.js**: Use `.env.production` file (not committed to Git)
   - Or use Firebase Hosting environment variables (if supported)

4. **Deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

### Option 3: Your Own Server (VPS/Dedicated)

1. **SSH into your server**

2. **Create `.env.local` file:**
   ```bash
   nano .env.local
   # Paste all your environment variables
   ```

3. **Set file permissions (IMPORTANT!):**
   ```bash
   chmod 600 .env.local  # Only owner can read/write
   ```

4. **Add to `.gitignore`:**
   ```gitignore
   .env.local
   .env.production
   ```

5. **Run your app:**
   ```bash
   npm run build
   npm start
   ```

### Option 4: Docker

1. **Create `.env.production` file** (not in Git)

2. **Use Docker secrets or environment variables:**
   ```dockerfile
   # Dockerfile
   FROM node:18
   WORKDIR /app
   COPY . .
   RUN npm install
   RUN npm run build
   CMD ["npm", "start"]
   ```

3. **Run with environment file:**
   ```bash
   docker run --env-file .env.production your-image
   ```

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use environment variables for all secrets
- ✅ Add `.env.local` to `.gitignore`
- ✅ Use different credentials for development/production
- ✅ Rotate API keys regularly
- ✅ Use least-privilege access (only grant necessary permissions)
- ✅ Enable Firebase Security Rules
- ✅ Use HTTPS in production

### ❌ DON'T:
- ❌ Commit `.env.local` to Git
- ❌ Hardcode credentials in source code
- ❌ Share API keys in screenshots or messages
- ❌ Use production keys in development
- ❌ Expose server-side variables to client

## 🛠️ Local Development Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your actual values:**
   ```bash
   nano .env.local
   ```

3. **Verify it's in `.gitignore`:**
   ```bash
   cat .gitignore | grep .env.local
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 🔍 Verifying Your Setup

### Check if variables are loaded:

**Client-side (in browser console):**
```javascript
console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
// Should show your project ID
```

**Server-side (in API route):**
```javascript
console.log(process.env.TWILIO_ACCOUNT_SID)
// Should show your Twilio SID (only on server!)
```

### Test Firebase:
- Try logging in
- Check Firebase Console for authentication events

### Test Twilio:
- Trigger a WhatsApp notification
- Check Twilio Console for message logs

## 🆘 Troubleshooting

### "Missing environment variables" error:
- Check `.env.local` exists
- Verify variable names match exactly (case-sensitive)
- Restart dev server after changing `.env.local`

### "Twilio credentials not configured":
- Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set
- Check they're not in `NEXT_PUBLIC_*` format
- Ensure they're set in production environment

### Firebase not working:
- Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
- Check Firebase project settings match
- Clear browser cache

## 🔥 Firebase Functions Environment Variables

Since all notification logic has been moved to Firebase Cloud Functions, you need to set environment variables for your Firebase Functions.

### Why Firebase Functions?

- **Security**: Server-side secrets (Twilio, Telegram tokens) are never exposed to the client
- **Scalability**: Functions scale automatically with your traffic
- **Reliability**: Functions run independently of your static site hosting

### Setting Environment Variables for Firebase Functions

#### Method 1: Using Firebase Secrets (Recommended - Encrypted)

Firebase Secrets are encrypted at rest and automatically injected as environment variables:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set secrets (you'll be prompted to enter the value)
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set TELEGRAM_CHAT_ID
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_WHATSAPP_NUMBER
firebase functions:secrets:set WHATSAPP_CONTENT_SID

# Grant access to functions (required for secrets to work)
firebase functions:secrets:access TELEGRAM_BOT_TOKEN --project your-project-id
firebase functions:secrets:access TELEGRAM_CHAT_ID --project your-project-id
firebase functions:secrets:access TWILIO_ACCOUNT_SID --project your-project-id
firebase functions:secrets:access TWILIO_AUTH_TOKEN --project your-project-id
firebase functions:secrets:access TWILIO_WHATSAPP_NUMBER --project your-project-id
firebase functions:secrets:access WHATSAPP_CONTENT_SID --project your-project-id
```

**Update your `functions/src/index.ts` to use secrets:**

```typescript
import { defineSecret } from 'firebase-functions/params'

// Define secrets
const telegramBotToken = defineSecret('TELEGRAM_BOT_TOKEN')
const telegramChatId = defineSecret('TELEGRAM_CHAT_ID')
const twilioAccountSid = defineSecret('TWILIO_ACCOUNT_SID')
const twilioAuthToken = defineSecret('TWILIO_AUTH_TOKEN')
const twilioWhatsAppNumber = defineSecret('TWILIO_WHATSAPP_NUMBER')
const whatsappContentSid = defineSecret('WHATSAPP_CONTENT_SID')

// Use in functions
export const telegramNotify = functions
  .runWith({ secrets: [telegramBotToken, telegramChatId] })
  .https.onRequest(async (req, res) => {
    const token = telegramBotToken.value()
    const chatId = telegramChatId.value()
    // ... rest of your code
  })
```

#### Method 2: Using Environment Variables (Simpler)

Set environment variables directly in Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Functions** → **Configuration**
4. Click **Add variable** for each secret:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER`
   - `WHATSAPP_CONTENT_SID` (optional)

Or use Firebase CLI:

```bash
firebase functions:config:set \
  telegram.bot_token="your-token" \
  telegram.chat_id="your-chat-id" \
  twilio.account_sid="ACxxx" \
  twilio.auth_token="your-token" \
  twilio.whatsapp_number="+1234567890" \
  whatsapp.content_sid="HXxxx"
```

**Note:** If using `config:set`, access variables as `process.env.TELEGRAM_BOT_TOKEN` (not `config.telegram.bot_token`).

### Deploying Firebase Functions

After setting environment variables:

```bash
# Build functions
cd functions
npm install
npm run build

# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:telegramNotify,functions:whatsappNotify
```

### Verifying Functions are Working

1. **Check Function Logs:**
   ```bash
   firebase functions:log
   ```

2. **Test Functions Locally:**
   ```bash
   # Set local environment variables
   export TELEGRAM_BOT_TOKEN="your-token"
   export TELEGRAM_CHAT_ID="your-chat-id"
   # ... etc
   
   # Run emulator
   firebase emulators:start --only functions
   ```

3. **Test via API:**
   ```bash
   curl -X POST https://us-central1-your-project.cloudfunctions.net/telegramNotify \
     -H "Content-Type: application/json" \
     -d '{"productName":"Test","price":1000,"customer":{...},"pickupDate":"2024-01-01","pickupTime":"10:00 AM","requestId":"test"}'
   ```

### Required Environment Variables for Functions

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | ✅ Yes | Telegram bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | ✅ Yes | Telegram chat ID to receive notifications |
| `TWILIO_ACCOUNT_SID` | ✅ Yes | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | ✅ Yes | Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | ✅ Yes | Twilio WhatsApp number (format: +1234567890) |
| `WHATSAPP_CONTENT_SID` | ❌ Optional | Twilio Content Template SID (for template messages) |

### Troubleshooting Firebase Functions

**"Function failed with error"**
- Check function logs: `firebase functions:log`
- Verify environment variables are set correctly
- Ensure secrets are granted access to functions

**"Environment variable not found"**
- Double-check variable names (case-sensitive)
- Redeploy functions after setting variables
- For secrets, ensure you've granted access

**"Permission denied"**
- Check Firebase IAM roles
- Ensure your account has Functions Admin role
- Verify secrets access is granted

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Twilio Security Best Practices](https://www.twilio.com/docs/iam/security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## ⚠️ Important Notes

1. **Never commit `.env.local`** - It contains your secrets!
2. **Firebase API keys are safe to expose** - They're public by design
3. **Twilio/Telegram tokens are SECRET** - Keep them server-side only
4. **Use different keys for dev/prod** - Better security isolation
5. **Rotate keys if exposed** - Change them immediately if leaked

---

**Need help?** Check your hosting provider's documentation for environment variable setup.
