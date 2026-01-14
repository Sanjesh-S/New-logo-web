# Fix Firebase Authentication Error

## Error: `Firebase: Error (auth/invalid-api-key)`

This error occurs because Firebase environment variables are missing or incorrect in GitHub Secrets.

## ✅ Solution: Verify GitHub Secrets

### Step 1: Check GitHub Secrets

1. Go to your GitHub repository: `https://github.com/Sanjesh-S/New-logo-web`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Verify these secrets exist and are correct:

**Required Secrets:**
- ✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
- ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ✅ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_APP_ID`
- ✅ `NEXT_PUBLIC_FUNCTIONS_URL` (should be: `https://us-central1-worthyten-otp-a925d.cloudfunctions.net`)

### Step 2: Get Your Firebase Credentials

If any secrets are missing:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **worthyten-otp-a925d**
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **"Your apps"** section
5. Click on your web app (or create one if needed)
6. Copy the configuration values

### Step 3: Add/Update GitHub Secrets

For each missing secret:

1. Click **"New repository secret"**
2. Enter the **Name** (exactly as shown above, including `NEXT_PUBLIC_` prefix)
3. Paste the **Value** from Firebase Console
4. Click **"Add secret"**

**Important:** Make sure the names match exactly (case-sensitive):
- `NEXT_PUBLIC_FIREBASE_API_KEY` (not `FIREBASE_API_KEY`)
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (not `FIREBASE_AUTH_DOMAIN`)
- etc.

### Step 4: Verify Functions URL Secret

Make sure `NEXT_PUBLIC_FUNCTIONS_URL` is set to:
```
https://us-central1-worthyten-otp-a925d.cloudfunctions.net
```

### Step 5: Trigger New Deployment

After updating secrets:

1. Go to **Actions** tab
2. Click **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"** → **"Run workflow"**

Or simply push a new commit:
```bash
git commit --allow-empty -m "Trigger rebuild with updated secrets"
git push origin main
```

## 🔍 Verify Secrets Are Set Correctly

You can verify by checking the build logs:

1. Go to **Actions** → Latest workflow run
2. Click on **"build"** job
3. Expand **"Build Next.js (Static Export)"** step
4. Look for any errors about missing environment variables

## 📋 Quick Checklist

- [ ] All 7 Firebase secrets are set in GitHub
- [ ] Secret names match exactly (including `NEXT_PUBLIC_` prefix)
- [ ] Values are correct (no extra spaces, correct format)
- [ ] `NEXT_PUBLIC_FUNCTIONS_URL` is set correctly
- [ ] New deployment triggered after updating secrets

## 🚨 Common Mistakes

1. **Missing `NEXT_PUBLIC_` prefix** - Secrets must start with `NEXT_PUBLIC_` to be embedded in the build
2. **Typos in secret names** - Must match exactly (case-sensitive)
3. **Incorrect values** - Copy from Firebase Console exactly
4. **Not triggering rebuild** - Secrets are only used during build, so you need to rebuild

## ✅ After Fixing

Once secrets are set correctly and a new deployment completes:

1. Visit: `https://sanjesh-s.github.io/New-logo-web/`
2. Open browser console (F12)
3. Check for Firebase initialization logs
4. The error should be gone!

---

**Need help?** Check the build logs in GitHub Actions to see which specific secret is missing or incorrect.
