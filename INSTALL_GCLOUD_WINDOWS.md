# Install Google Cloud SDK on Windows

You have **3 options** - choose the easiest for you:

## Option 1: Web UI (Easiest - No Installation!) 🎉

**Skip `gcloud` CLI entirely** - do everything in Google Cloud Console:

1. **Go to:** [Google Cloud Console](https://console.cloud.google.com/)
2. **Select project:** `worthyten-otp-a925d`
3. **Create Service Account:**
   - Go to: IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Name: `github-actions`
   - Click "Create and Continue"
   - Grant roles:
     - `Secret Manager Admin`
     - `Cloud Functions Admin`
   - Click "Done"

4. **Create Key:**
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON"
   - Download the file (it will be named something like `worthyten-otp-a925d-xxxxx.json`)

5. **Add to GitHub:**
   - Open the downloaded JSON file
   - Copy **entire contents**
   - Go to GitHub → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste the entire JSON
   - Click "Add secret"

6. **Delete the downloaded JSON file** (for security)

✅ **Done!** No CLI needed!

---

## Option 2: PowerShell (Recommended for Windows)

### Install Google Cloud SDK

**In PowerShell (as Administrator):**
```powershell
# Install the module
Install-Module GoogleCloud

# First time use will prompt to install gcloud CLI - say Yes
```

**Or download installer:**
1. Go to: https://cloud.google.com/sdk/docs/install-sdk#windows
2. Download the installer
3. Run it and follow the prompts

### Authenticate
```powershell
gcloud init
# Follow prompts to login and select project: worthyten-otp-a925d
```

### Then run the commands from QUICK_SETUP_SERVICE_ACCOUNT.md

---

## Option 3: Git Bash (Your Current Terminal)

### Install Google Cloud SDK

1. **Download installer:**
   - Go to: https://cloud.google.com/sdk/docs/install-sdk#windows
   - Download the Windows installer
   - Run it and follow prompts

2. **Add to PATH:**
   - The installer should add it automatically
   - If not, add `C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin` to your PATH

3. **Restart terminal** and verify:
   ```bash
   gcloud --version
   ```

### Authenticate
```bash
gcloud init
# Follow prompts to login and select project: worthyten-otp-a925d
```

### Then run the commands from QUICK_SETUP_SERVICE_ACCOUNT.md

---

## 🎯 Recommendation

**Use Option 1 (Web UI)** - it's the fastest and doesn't require any installation!
