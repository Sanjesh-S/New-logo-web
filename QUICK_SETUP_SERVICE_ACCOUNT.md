# Quick Setup: Firebase Service Account for GitHub Actions

## Why?
GitHub Actions needs permission to sync secrets to Firebase. This is a **one-time setup**.

## ⚡ Quick Start

**Don't have `gcloud` installed?** Use the **Web UI method** instead - it's easier!
See `INSTALL_GCLOUD_WINDOWS.md` for the web UI steps (no installation needed).

## Steps (5 minutes)

### 1. Create Service Account
```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions" \
  --project=worthyten-otp-a925d
```

### 2. Grant Permissions
```bash
# Allow managing secrets
gcloud projects add-iam-policy-binding worthyten-otp-a925d \
  --member="serviceAccount:github-actions@worthyten-otp-a925d.iam.gserviceaccount.com" \
  --role="roles/secretmanager.admin"

# Allow deploying functions
gcloud projects add-iam-policy-binding worthyten-otp-a925d \
  --member="serviceAccount:github-actions@worthyten-otp-a925d.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.admin"
```

### 3. Create Key
```bash
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@worthyten-otp-a925d.iam.gserviceaccount.com
```

### 4. Add to GitHub
1. Open `key.json` file
2. Copy **entire contents** (it's a JSON object)
3. Go to GitHub → Settings → Secrets and variables → Actions
4. Click "New repository secret"
5. Name: `FIREBASE_SERVICE_ACCOUNT`
6. Value: Paste the entire JSON from `key.json`
7. Click "Add secret"

### 5. Delete key.json (for security)
```bash
rm key.json
```

## ✅ Done!

Now when you push to `main`, GitHub Actions will:
- ✅ Automatically sync your GitHub secrets to Firebase
- ✅ Deploy functions
- ✅ Everything works!

**You only manage secrets in GitHub from now on!** 🎉
