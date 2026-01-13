# Deployment Notes

## ⚠️ Important: GitHub Pages Limitation

**GitHub Pages only supports static websites.** This means:

- ✅ Static pages will work
- ❌ **API routes will NOT work** (`/api/*` endpoints)
- ❌ Server-side features won't work

## Current Setup

Your `next.config.js` currently has `output: 'export'` removed because API routes require a server. For GitHub Pages deployment, you have two options:

### Option 1: Static Export (Current Workflow)
- Enables static export for GitHub Pages
- API routes won't function
- Frontend-only features will work
- Good for: Marketing pages, static content

### Option 2: Alternative Deployment (Recommended)
For full functionality including API routes, consider:

1. **Vercel** (Recommended for Next.js)
   - Free tier available
   - Automatic deployments
   - Full Next.js support including API routes
   - Easy setup: Connect GitHub repo

2. **Netlify**
   - Free tier available
   - Serverless functions for API routes
   - Automatic deployments

3. **Custom Server**
   - Deploy to any Node.js hosting
   - Full control
   - Requires server management

## GitHub Pages Deployment

The workflow (`.github/workflows/deploy.yml`) is configured to:
1. Build the Next.js app with static export
2. Deploy to GitHub Pages
3. Use the `/New-logo-web` base path

### Setup Steps:

1. **Enable GitHub Pages in repository settings:**
   - Go to Settings → Pages
   - Source: GitHub Actions

2. **Add required secrets** (Settings → Secrets and variables → Actions):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_API_URL` (optional)

3. **Push to main branch** - deployment will trigger automatically

### To Enable Static Export:

If you want to proceed with GitHub Pages (knowing API routes won't work), temporarily update `next.config.js`:

```javascript
const nextConfig = {
  output: 'export', // Add this for static export
  // ... rest of config
}
```

**Note:** This will break API routes. Consider moving API functionality to:
- Firebase Cloud Functions
- Separate backend service
- Client-side Firebase SDK calls

## Recommended: Vercel Deployment

For the best experience with Next.js:

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables
4. Deploy (automatic on every push)

Vercel provides:
- ✅ Full Next.js support
- ✅ API routes work
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Free tier
