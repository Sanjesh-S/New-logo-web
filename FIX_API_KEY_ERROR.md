# Fix: Firebase API Key Not Valid Error

## Error: `auth/api-key-not-valid.-please-pass-a-valid-api-key`

This error means Firebase is rejecting the API key. This can happen if:

1. **API key doesn't match Firebase project**
2. **API key has restrictions enabled**
3. **API key is incorrect or has typos**

## ✅ Solution: Verify API Key in GitHub Secrets

### Step 1: Get Correct API Key from Firebase Console

1. Go to: `https://console.firebase.google.com/project/worthyten-otp-a925d/settings/general`
2. Scroll to **"Your apps"** section
3. Click on your **Web app**
4. Copy the **API key** exactly as shown

**Expected API Key:**
```
AIzaSyC4SqbxwKCJmUBNKt85UwEJgNnep9t7q0Y
```

**Important:** Make sure there are NO typos:
- Ends with `...t7q0Y` (zero, not letter O)
- No extra spaces
- Copy exactly as shown

### Step 2: Update GitHub Secret

1. Go to: `https://github.com/Sanjesh-S/New-logo-web/settings/secrets/actions`
2. Find `NEXT_PUBLIC_FIREBASE_API_KEY`
3. Click the **pencil icon** (edit)
4. Paste the API key from Firebase Console
5. Click **"Update secret"**

### Step 3: Check API Key Restrictions (If Any)

1. Go to: `https://console.cloud.google.com/apis/credentials`
2. Select project: **worthyten-otp-a925d**
3. Find your API key
4. Check if **"API restrictions"** or **"Application restrictions"** are enabled
5. If restrictions are enabled:
   - **API restrictions:** Make sure "Firebase Authentication API" is allowed
   - **Application restrictions:** Make sure your domain is allowed:
     - `sanjesh-s.github.io`
     - `localhost` (for development)

### Step 4: Verify All Firebase Config Values

Make sure ALL these values match Firebase Console exactly:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC4SqbxwKCJmUBNKt85UwEJgNnep9t7q0Y
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=worthyten-otp-a925d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=worthyten-otp-a925d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=worthyten-otp-a925d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1067702314639
NEXT_PUBLIC_FIREBASE_APP_ID=1:1067702314639:web:0bb2a39181720c306572fa
```

### Step 5: Trigger New Deployment

After updating the API key:

1. Go to **Actions** → **"Deploy to GitHub Pages"**
2. Click **"Run workflow"** → **"Run workflow"**

Or push an empty commit:
```bash
git commit --allow-empty -m "Rebuild with corrected API key"
git push origin main
```

### Step 6: Clear Browser Cache

After deployment completes:

1. **Hard refresh:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or clear cache: `Ctrl+Shift+Delete` → Clear cached files

## 🔍 Common Issues

1. **Typo in API key** - Double-check every character
2. **Wrong project** - Make sure API key is from `worthyten-otp-a925d` project
3. **API restrictions** - Check Google Cloud Console for restrictions
4. **Old cached build** - Clear browser cache after deployment

## ✅ Verify It's Fixed

After updating and redeploying:

1. Visit: `https://sanjesh-s.github.io/New-logo-web/`
2. Try sending OTP
3. Check browser console - should see Firebase initialization logs
4. Error should be gone!

---

**Still not working?** Check the build logs in GitHub Actions to see what API key value was used during the build.
