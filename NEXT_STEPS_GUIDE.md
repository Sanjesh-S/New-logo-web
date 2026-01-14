# Step-by-Step Guide: What to Do Next

This guide walks you through deploying Firebase Functions and updating your frontend to use them.

---

## Prerequisites Check

Before starting, ensure you have:
- ✅ Firebase CLI installed (`firebase --version` should work)
- ✅ Logged into Firebase (`firebase login`)
- ✅ Node.js 20+ installed
- ✅ All dependencies installed (`npm install` in root and `functions` directory)

---

## Step 1: Verify Firebase Project Configuration

### 1.1 Check Firebase Project ID

Open `.firebaserc` and verify your project ID:

```json
{
  "projects": {
    "default": "worthyten-otp-a925d"
  }
}
```

**Note:** If your project ID is different, update it in `.firebaserc`.

### 1.2 Verify Firebase Login

```bash
firebase login
```

If not logged in, follow the prompts to authenticate.

### 1.3 Set Active Project

```bash
firebase use default
```

Or set a specific project:
```bash
firebase use worthyten-otp-a925d
```

---

## Step 2: Build Firebase Functions

### 2.1 Navigate to Functions Directory

```bash
cd functions
```

### 2.2 Build Functions

```bash
npm run build
```

**Expected Output:**
```
> build
> tsc

(No errors - build successful)
```

**If you see errors:**
- Check TypeScript version: `npm list typescript`
- Ensure all dependencies are installed: `npm install`
- Check `functions/tsconfig.json` configuration

### 2.3 Verify Build Output

Check that `lib/` directory was created:

```bash
ls lib/
```

You should see compiled `.js` files:
- `lib/index.js`
- `lib/calculate.js`
- `lib/valuations.js`
- etc.

---

## Step 3: Set Environment Variables in Firebase

Firebase Functions need access to your API keys and secrets. You have two options:

### Option A: Using Firebase Functions Secrets (Recommended for Production)

This is the secure way to store sensitive data.

#### 3.1 Set Each Secret

Run these commands one by one (Firebase will prompt you to enter the value):

```bash
# Telegram Configuration
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
# When prompted, paste your Telegram bot token

firebase functions:secrets:set TELEGRAM_CHAT_ID
# When prompted, paste your Telegram chat ID

# Twilio Configuration
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_WHATSAPP_NUMBER

# Email Configuration
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set FROM_EMAIL
```

**Note:** For `FROM_EMAIL`, enter: `WorthyTen <noreply@worthyten.com>` or your verified email.

#### 3.2 Update Functions Code to Use Secrets

If using secrets, you need to update the functions to access them. However, since we're using `process.env`, Firebase automatically injects secrets as environment variables when deployed.

**Current code already supports this** - no changes needed!

### Option B: Using Firebase Functions Config (Legacy, Still Works)

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

**If using config instead of secrets**, update functions to access:
```typescript
const token = process.env.TELEGRAM_BOT_TOKEN || functions.config().telegram?.bot_token
```

---

## Step 4: Deploy Firebase Functions

### 4.1 Deploy All Functions

From the project root directory:

```bash
firebase deploy --only functions
```

**Expected Output:**
```
=== Deploying to 'worthyten-otp-a925d'...

i  deploying functions
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
✓  functions: required APIs are enabled

Running command: npm --prefix "$RESOURCE_DIR" run build
✓  functions: Finished running pre-deploy script.

✔  functions: all functions deployed successfully!

✔  Deploy complete!
```

### 4.2 Note the Function URLs

After deployment, Firebase will show you the URLs for each function:

```
Function URLs:
  calculate: https://us-central1-worthyten-otp-a925d.cloudfunctions.net/calculate
  valuations: https://us-central1-worthyten-otp-a925d.cloudfunctions.net/valuations
  pickupRequests: https://us-central1-worthyten-otp-a925d.cloudfunctions.net/pickupRequests
  schedulePickup: https://us-central1-worthyten-otp-a925d.cloudfunctions.net/schedulePickup
  devices: https://us-central1-worthyten-otp-a925d.cloudfunctions.net/devices
  telegramNotify: https://us-central1-worthyten-otp-a925d.cloudfunctions.net/telegramNotify
  whatsappNotify: https://us-central1-worthyten-otp-a925d.cloudfunctions.net/whatsappNotify
  emailConfirm: https://us-central1-worthyten-otp-a925d.cloudfunctions.net/emailConfirm
```

**Save the base URL:** `https://us-central1-worthyten-otp-a925d.cloudfunctions.net`

### 4.3 Deploy Specific Functions (Optional)

If you only want to deploy one function:

```bash
firebase deploy --only functions:calculate
```

---

## Step 5: Test Firebase Functions

### 5.1 Test Calculate Function

Open a terminal and run:

```bash
curl -X POST https://us-central1-worthyten-otp-a925d.cloudfunctions.net/calculate \
  -H "Content-Type: application/json" \
  -d '{"brand":"canon","model":"EOS R5","condition":"excellent"}'
```

**Expected Response:**
```json
{
  "success": true,
  "basePrice": 2500,
  "estimatedValue": 2500,
  "breakdown": {
    "basePrice": 2500,
    "conditionMultiplier": 1,
    "usageMultiplier": 1,
    "accessoriesTotal": 0
  }
}
```

### 5.2 Test Devices Function

```bash
curl "https://us-central1-worthyten-otp-a925d.cloudfunctions.net/devices?category=cameras"
```

### 5.3 Test Valuations Function (Create)

```bash
curl -X POST https://us-central1-worthyten-otp-a925d.cloudfunctions.net/valuations \
  -H "Content-Type: application/json" \
  -d '{
    "category": "cameras",
    "brand": "canon",
    "model": "EOS R5",
    "condition": "excellent",
    "usage": "light",
    "basePrice": 2500,
    "estimatedValue": 2500
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "id": "abc123...",
  "message": "Valuation created successfully"
}
```

### 5.4 Check Function Logs

If something doesn't work, check logs:

```bash
firebase functions:log
```

Or for a specific function:

```bash
firebase functions:log --only calculate
```

---

## Step 6: Update Frontend Environment Variables

### 6.1 Open `.env.local`

Navigate to your project root and open `.env.local` file.

### 6.2 Add Functions URL

Add one of these options:

**Option 1: Full Functions URL (Recommended)**
```env
NEXT_PUBLIC_FUNCTIONS_URL=https://us-central1-worthyten-otp-a925d.cloudfunctions.net
```

**Option 2: Auto-construct from Project ID**
```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=worthyten-otp-a925d
NEXT_PUBLIC_FUNCTION_REGION=us-central1
```

**Choose Option 1** if you want explicit control, or **Option 2** if you prefer automatic URL construction.

### 6.3 Complete `.env.local` Example

Your `.env.local` should look like this:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=worthyten-otp-a925d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=worthyten-otp-a925d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=worthyten-otp-a925d.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Functions Configuration
NEXT_PUBLIC_FUNCTIONS_URL=https://us-central1-worthyten-otp-a925d.cloudfunctions.net

# Optional: For local development with API routes
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 6.4 Restart Development Server

After updating `.env.local`:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

## Step 7: Test Frontend Integration

### 7.1 Start Development Server

```bash
npm run dev
```

### 7.2 Test Key Flows

1. **Calculate Price Flow:**
   - Go to homepage
   - Select a category (e.g., Cameras)
   - Select a brand (e.g., Canon)
   - Select a model (e.g., EOS R5)
   - Complete assessment
   - Verify price calculation works

2. **Create Valuation Flow:**
   - Complete assessment
   - Submit valuation
   - Check browser console for any errors
   - Verify redirect to order summary page

3. **Device Lookup:**
   - Go to brands selection page
   - Verify brands load correctly
   - Check browser Network tab to see Functions calls

4. **Pickup Scheduling:**
   - Complete an order
   - Try scheduling a pickup
   - Verify it saves correctly

### 7.3 Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab:** Look for any errors
- **Network tab:** Verify API calls go to Firebase Functions URLs (not `/api/...`)

**Expected Network Calls:**
- `https://us-central1-...cloudfunctions.net/calculate`
- `https://us-central1-...cloudfunctions.net/valuations`
- etc.

---

## Step 8: Update GitHub Secrets (For GitHub Pages Deployment)

If deploying to GitHub Pages, add the Functions URL as a secret:

### 8.1 Go to GitHub Repository Settings

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**

### 8.2 Add Functions URL Secret

Click **New repository secret** and add:

- **Name:** `NEXT_PUBLIC_FUNCTIONS_URL`
- **Value:** `https://us-central1-worthyten-otp-a925d.cloudfunctions.net`

### 8.3 Update GitHub Actions Workflow

Open `.github/workflows/deploy.yml` and ensure it includes:

```yaml
env:
  NEXT_PUBLIC_FUNCTIONS_URL: ${{ secrets.NEXT_PUBLIC_FUNCTIONS_URL }}
```

---

## Step 9: Build and Test Static Export

### 9.1 Build Static Site

```bash
npm run build
```

This should complete without errors.

### 9.2 Verify Output

Check that `out/` directory was created:

```bash
ls out/
```

You should see HTML files and static assets.

### 9.3 Test Static Site Locally (Optional)

```bash
npx serve out
```

Visit `http://localhost:3000` and test the site.

---

## Step 10: Deploy Frontend

### Option A: GitHub Pages (Already Configured)

1. **Commit and Push Changes:**

```bash
git add .
git commit -m "Migrate API routes to Firebase Functions"
git push origin main
```

2. **GitHub Actions will automatically:**
   - Build the static site
   - Deploy to GitHub Pages
   - Use Functions URL from secrets

3. **Verify Deployment:**
   - Go to repository → **Actions** tab
   - Check deployment status
   - Visit your GitHub Pages URL

### Option B: Vercel (Recommended for Better Performance)

1. **Connect Repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Add Environment Variables:**
   - In Vercel dashboard → **Settings** → **Environment Variables**
   - Add `NEXT_PUBLIC_FUNCTIONS_URL`

3. **Deploy:**
   - Vercel will auto-deploy on push
   - Or click **Deploy** button

---

## Step 11: Verify Production Deployment

### 11.1 Test Production Site

Visit your deployed site and test:

- ✅ Homepage loads
- ✅ Category selection works
- ✅ Brand/model selection works
- ✅ Assessment wizard works
- ✅ Price calculation works
- ✅ Valuation submission works
- ✅ Pickup scheduling works

### 11.2 Check Function Logs

Monitor function usage:

```bash
firebase functions:log --limit 50
```

### 11.3 Monitor Errors

Check Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Functions** → **Logs**
4. Monitor for any errors

---

## Troubleshooting

### Functions Not Deploying

**Error:** `Functions did not deploy`

**Solutions:**
1. Check Firebase login: `firebase login`
2. Verify project ID: `firebase projects:list`
3. Check build errors: `cd functions && npm run build`
4. Check quota limits in Firebase Console

### Functions Return 500 Errors

**Error:** `Internal server error`

**Solutions:**
1. Check function logs: `firebase functions:log`
2. Verify environment variables are set
3. Check Firebase Console → Functions → Logs
4. Ensure Firestore rules allow access

### Frontend Can't Connect to Functions

**Error:** `Failed to fetch` or CORS errors

**Solutions:**
1. Verify `NEXT_PUBLIC_FUNCTIONS_URL` is set correctly
2. Check browser console for exact error
3. Verify Functions are deployed: `firebase functions:list`
4. Test Functions URL directly with curl

### CORS Errors

**Error:** `Access-Control-Allow-Origin` errors

**Solutions:**
1. Functions already have CORS headers configured
2. If still seeing errors, check function code
3. Verify Functions are deployed correctly

---

## Success Checklist

- [ ] Firebase Functions deployed successfully
- [ ] Environment variables/secrets set in Firebase
- [ ] Functions URLs noted and saved
- [ ] Functions tested with curl
- [ ] Frontend `.env.local` updated
- [ ] Frontend tested locally
- [ ] GitHub secrets updated (if using GitHub Pages)
- [ ] Static site builds successfully
- [ ] Frontend deployed to hosting
- [ ] Production site tested end-to-end
- [ ] Function logs monitored

---

## Next Steps After Deployment

1. **Monitor Usage:** Check Firebase Console for function invocations
2. **Set Up Alerts:** Configure alerts for function errors
3. **Optimize Costs:** Review Firebase usage and optimize if needed
4. **Remove Old API Routes:** Once confirmed working, delete `app/api/` directory
5. **Update Documentation:** Update API documentation with new endpoints

---

## Need Help?

- **Firebase Functions Docs:** https://firebase.google.com/docs/functions
- **Firebase CLI Reference:** https://firebase.google.com/docs/cli
- **Project Setup Guide:** See `FIREBASE_FUNCTIONS_SETUP.md`
- **Migration Details:** See `MIGRATION_SUMMARY.md`

---

**You're all set!** Follow these steps in order, and your application will be fully migrated and deployed. 🚀
