# Verify GitHub Secrets Are Set Correctly

## Quick Verification Steps

### Step 1: Check Secret Names

Go to: `https://github.com/Sanjesh-S/New-logo-web/settings/secrets/actions`

Make sure these secrets exist **exactly** as shown (case-sensitive):

✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
✅ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
✅ `NEXT_PUBLIC_FIREBASE_APP_ID`
✅ `NEXT_PUBLIC_FUNCTIONS_URL`

### Step 2: Verify Values from Firebase Console

From your Firebase Console screenshot, the values should be:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC4SqbxwKCJmUBNKt85UwEJgNnep9t7q0Y
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=worthyten-otp-a925d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=worthyten-otp-a925d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=worthyten-otp-a925d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1067702314639
NEXT_PUBLIC_FIREBASE_APP_ID=1:1067702314639:web:0bb2a39181720c306572fa
NEXT_PUBLIC_FUNCTIONS_URL=https://us-central1-worthyten-otp-a925d.cloudfunctions.net
```

### Step 3: Common Issues

1. **Missing `NEXT_PUBLIC_` prefix**
   - ❌ Wrong: `FIREBASE_API_KEY`
   - ✅ Correct: `NEXT_PUBLIC_FIREBASE_API_KEY`

2. **Extra spaces or newlines**
   - Make sure values don't have leading/trailing spaces
   - Copy directly from Firebase Console

3. **Wrong storage bucket**
   - Your Firebase Console shows: `worthyten-otp-a925d.firebasestorage.app`
   - Make sure this matches exactly (not `.appspot.com`)

4. **API Key typo**
   - Double-check the API key ends with `...t7q0Y` (not `...t7qOY`)

### Step 4: Check Build Logs

After triggering a new deployment:

1. Go to **Actions** → Latest workflow run
2. Click on **"build"** job
3. Expand **"Verify environment variables"** step
4. Check if all secrets show as "set: true"

If any show "set: false", that secret is missing or incorrectly named.

### Step 5: Verify in Built Files (Advanced)

If you want to verify the values are embedded:

1. After deployment completes
2. Visit: `https://sanjesh-s.github.io/New-logo-web/`
3. Open browser DevTools (F12)
4. Go to **Sources** tab
5. Find a JavaScript file (e.g., `_next/static/chunks/...`)
6. Search for `NEXT_PUBLIC_FIREBASE_API_KEY` or the API key value
7. You should see the actual values embedded in the code

---

## Still Not Working?

If secrets are set correctly but still getting errors:

1. **Clear browser cache** - Old builds might be cached
2. **Hard refresh** - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Check deployment timestamp** - Make sure latest deployment completed
4. **Verify secret values** - Double-check they match Firebase Console exactly
