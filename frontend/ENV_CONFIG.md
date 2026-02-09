# Environment Configuration

## Frontend Environment Variables

### Development (.env)

```
VITE_API_URL=http://localhost:5000
```

### Production (.env.production)

```
VITE_API_URL=https://aaz-inter-production.up.railway.app
```

## How It Works

1. **Local Development**: Uses `.env` file → connects to `http://localhost:5000`
2. **Vercel Production**: Uses `.env.production` file → connects to Railway backend
3. **NO FALLBACKS**: The app will fail fast if `VITE_API_URL` is not set

## Deployment Checklist

### Vercel Frontend

- ✅ `.env.production` is committed to git
- ✅ Vercel automatically uses `.env.production` for production builds
- ✅ No need to set environment variables in Vercel dashboard

### Railway Backend

- ✅ CORS allows `https://aaz-international.vercel.app`
- ✅ CORS allows all `*.vercel.app` domains (for preview deployments)
- ✅ OPTIONS method enabled for preflight requests

## Testing

### Local

```bash
cd frontend
npm run dev
# Should connect to http://localhost:5000
```

### Production Build

```bash
cd frontend
npm run build
npm run preview
# Should connect to https://aaz-inter-production.up.railway.app
```

## Troubleshooting

If you see CORS errors:

1. Check browser console for the actual origin being used
2. Verify Railway backend is running
3. Check Railway logs for CORS warnings
4. Ensure Vercel deployment used `.env.production`
