# Deployment guide

This project is configured as a Vite + React frontend with an Express backend. It can be run locally or deployed to a single-platform hosting flow such as Vercel, or split across separate frontend and API deployments.

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Add environment variables

Create a `.env` file in the project root:

```env
PORT=3001
GEMINI_API_KEY=your_google_gemini_key
ALLOWED_ORIGIN=http://localhost:5173

# Optional contact form
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CONTACT_EMAIL=hello@yourdomain.com
```

### 3. Run the app

Backend:

```bash
npm run server
```

Frontend:

```bash
npm run dev
```

The app is then available at:

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Production deployment options

### Option A: Single deployment on Vercel (recommended for demos)

This app is already set up as a Vite project, and the Express API can live alongside the frontend when the same deployment host serves both.

Steps:

1. Push the repository to GitHub.
2. Import the repo in Vercel.
3. Choose the Vite project type and keep the root directory as `./`.
4. Add environment variables in the Vercel project settings:
   - `GEMINI_API_KEY`
   - `ALLOWED_ORIGIN` (for example `https://your-app.vercel.app`)
   - `PORT` (optional for local dev but usually not needed in a serverless environment)
   - `EMAIL_USER`, `EMAIL_PASS`, `CONTACT_EMAIL` if using the contact form
5. Deploy.

If the app is served from the same domain, the frontend can usually leave `VITE_API_BASE_URL` empty so it makes relative calls to the same origin.

### Option B: Separate frontend and backend hosts

If the frontend is hosted on Vercel or Netlify while the backend runs elsewhere, set:

```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

and ensure the backend’s `ALLOWED_ORIGIN` matches the frontend origin.

## Recommended environment settings

### Required

- `GEMINI_API_KEY`

### Backend-only

- `ALLOWED_ORIGIN`
- `PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `CONTACT_EMAIL`

### Frontend-only

- `VITE_API_BASE_URL` when the API is not on the same origin

## Post-deploy verification

After deployment, verify the following:

- The app loads without build issues.
- Health-score submissions return AI insights.
- Tax-wizard form submissions complete successfully.
- FIRE planner endpoints respond successfully.
- Contact submissions deliver if email credentials are configured.

## Production hardening notes

The current repo is best treated as a product demo or prototype. For production use, it should include:

- authenticated user sessions on the backend
- backend enforcement of premium access and credit usage
- stricter validation and rate-limiting policy for all endpoints
- staging and production environment separation

## Hosting alternatives

- Vercel: suitable for combined frontend plus API hosting
- Netlify: good for the frontend experience alone
- Railway: convenient for Node.js backends
- Render: simple deployment for Express services
- Google Cloud Run: production-grade option for a backend API

## Final checklist

- [ ] Gemini API key configured
- [ ] Correct CORS origin set
- [ ] Frontend API URL configured for non-shared deployments
- [ ] Contact-form email credentials set if used
- [ ] App tested in a production-like environment
