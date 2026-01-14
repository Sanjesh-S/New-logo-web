# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
# Get these values from Firebase Console: Project Settings > General > Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Firebase Functions Configuration (for production)
# Option 1: Set the full Functions URL
NEXT_PUBLIC_FUNCTIONS_URL=https://us-central1-your-project-id.cloudfunctions.net

# Option 2: Set project ID and region (Functions URL will be auto-constructed)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FUNCTION_REGION=us-central1

# Telegram Bot Configuration (optional, for admin notifications)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Twilio WhatsApp Configuration (optional, for customer notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+919843010869

# Email Configuration (optional, for customer email confirmations)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=WorthyTen <noreply@worthyten.com>
```

## Required Variables

All `NEXT_PUBLIC_FIREBASE_*` variables are **required**. The application will fail to start if they are missing.

## Optional Variables

- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Only needed if using Google Analytics
- `NEXT_PUBLIC_FUNCTIONS_URL` - Firebase Cloud Functions URL (auto-constructed if not set, using PROJECT_ID and REGION)
- `NEXT_PUBLIC_FUNCTION_REGION` - Firebase Functions region (default: `us-central1`)
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` - Only needed for Telegram admin notifications
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_NUMBER` - Only needed for WhatsApp customer notifications
- `RESEND_API_KEY` and `FROM_EMAIL` - Only needed for email customer confirmations
- `NEXT_PUBLIC_API_URL` - Only needed if different from default `http://localhost:3000` (legacy, for local development)

## Getting Twilio Configuration

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Account** → **General** → **Account Info**
3. Copy your **Account SID** and **Auth Token**
4. Navigate to **Messaging** → **Senders** → **WhatsApp senders**
5. Copy your verified WhatsApp sender number (e.g., `+919843010869`)
6. Add these to your `.env.local` file

**Note:** Twilio WhatsApp requires a verified sender number. Make sure your WhatsApp sender is set up and approved in Twilio Console.

## Getting Email Configuration (Resend)

1. Go to [Resend](https://resend.com/) and create a free account
2. Navigate to **API Keys** in your dashboard
3. Create a new API key
4. Copy the API key and add it to `.env.local` as `RESEND_API_KEY`
5. Set `FROM_EMAIL` to your verified sender email (e.g., `WorthyTen <noreply@yourdomain.com>`)

**Note:** 
- Resend offers a free tier with 3,000 emails/month
- You need to verify your domain or use Resend's test domain for sending emails
- All email logs are stored in Firebase Firestore collection `emailLogs` for tracking

## Getting Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on the web app or create a new one
6. Copy the configuration values

**Important:** Never commit `.env.local` to version control. It should already be in `.gitignore`.
