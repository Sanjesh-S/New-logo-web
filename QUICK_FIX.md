# Quick Fix for Firebase Error

## Error: `auth/invalid-api-key`

This error occurs because Firebase environment variables are missing.

## Solution

Create a `.env.local` file in the root directory (`D:\Cursor-Final\.env.local`) with your Firebase credentials.

### Step 1: Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **"Your apps"** section
5. Find your web app (or click **"Add app"** → Web icon `</>`) 
6. Copy the configuration values

### Step 2: Create `.env.local` File

Create a file named `.env.local` in the project root (`D:\Cursor-Final\.env.local`) with this content:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Replace the placeholder values with your actual Firebase credentials.**

### Step 3: Restart the Development Server

After creating the `.env.local` file:

1. Stop the current server (Ctrl+C in the terminal)
2. Restart it: `npm run dev`

The error should be resolved!

---

## If You Need to Use Old Credentials Temporarily

If you need to quickly restore the previous hardcoded credentials temporarily while setting up `.env.local`, you can temporarily modify `lib/firebase/config.ts`:

**⚠️ WARNING: Only for local development. Never commit credentials to git!**

But the **recommended approach** is to create the `.env.local` file with your Firebase credentials.

---

## Need Help?

- See `ENV_SETUP.md` for detailed instructions
- Check Firebase Console for your project settings
- Ensure `.env.local` is in the project root (same level as `package.json`)
