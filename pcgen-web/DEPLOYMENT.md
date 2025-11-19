# Deployment Guide

## Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy this Next.js application.

### Deploy from GitHub

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js and configure everything
6. Click "Deploy"

Your app will be live in ~2 minutes at `https://your-project.vercel.app`

### Deploy from CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd pcgen-web
vercel

# Follow prompts to link/create project
```

### Environment Variables

No environment variables are required for the MVP. All data is stored client-side in IndexedDB.

## Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod
```

## Option 3: Static Export

For completely static hosting (GitHub Pages, S3, etc.):

```bash
# Build
npm run build

# The .next folder contains the built app
# Serve it with any static host
```

## Option 4: Self-Hosted (Docker)

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t pcgen-web .
docker run -p 3000:3000 pcgen-web
```

## Post-Deployment Checklist

- [ ] Test character creation flow
- [ ] Test import/export functionality
- [ ] Test on mobile devices
- [ ] Verify IndexedDB works
- [ ] Check browser console for errors
- [ ] Test edit mode
- [ ] Verify all calculations are correct

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### IndexedDB Not Working

Check browser compatibility. IndexedDB requires HTTPS in production (except localhost).

### Data Not Persisting

Ensure the site is served over HTTPS. Some browsers block IndexedDB on HTTP.

## Monitoring

After deployment, monitor:
- Build times (should be < 2 minutes)
- Page load times (should be < 3 seconds)
- Browser console errors
- User feedback

## Updates

To deploy updates:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push

# Vercel auto-deploys on push to main
# Or manually redeploy: vercel --prod
```

## Domain Setup

### Custom Domain on Vercel

1. Go to project settings
2. Click "Domains"
3. Add your domain
4. Update DNS records as shown
5. SSL auto-configured

## Performance

Expected metrics:
- First load: < 3s
- Subsequent loads: < 1s (cached)
- Lighthouse score: 90+

---

**Ready to Deploy!** 🚀

The app is production-ready and passes all build checks.
