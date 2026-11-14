# AI Money Mentor

AI Money Mentor is a full-stack personal finance app for Indian users that combines financial calculators, tax guidance, and AI-powered planning. The product is designed to make complex money decisions more approachable through guided assessments, regime comparisons, and long-term projections.

## Mission

A large portion of Indian households do not have a clear financial plan. Many people avoid professional advice because of cost, complexity, or trust gaps. AI Money Mentor brings a beginner-friendly, low-friction alternative by combining education, automation, and AI reasoning in one experience.

## Core features

- Money Health Score
  - Six-part assessment covering emergency funds, insurance, investments, debt health, tax efficiency, and retirement readiness.
  - Produces an overall score and personalized recommendations.

- Tax Wizard
  - Compares old vs new income-tax regimes.
  - Surfaces missed deductions such as 80C, 80D, NPS, and HRA-linked exemptions.
  - Shows tax estimates and regime recommendations.

- FIRE Planner
  - Estimates retirement corpus requirements using inflation and return assumptions.
  - Calculates a required monthly SIP and projects portfolio growth over time.
  - Breaks down asset allocation into equity, debt, gold, and cash buckets.

- AI insights
  - Sends structured user data to an Express backend and orchestrates domain-specific AI agents.
  - Uses Google Gemini to return actionable advice.

## Tech stack

- Frontend: React 19, Vite, Chart.js, Lucide icons, custom CSS
- Backend: Node.js + Express
- AI: Google Gemini via the Generative AI SDK
- Persistence: browser localStorage for demo state and lightweight app data
- Email: Nodemailer for contact form delivery (optional)

## Local setup

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env` file in the project root with the following values:

```env
GEMINI_API_KEY=your_google_gemini_key
ALLOWED_ORIGIN=http://localhost:5173
PORT=3001

# Optional contact form configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CONTACT_EMAIL=hello@yourdomain.com
```

If the frontend and backend run from the same origin, you can leave `VITE_API_BASE_URL` empty in the browser app. For separate deployments, set it to the backend URL in the frontend environment.

### Start the app

Backend:

```bash
npm run server
```

Frontend:

```bash
npm run dev
```

Open http://localhost:5173 in the browser.

## Project structure

```text
src/
  components/
  context/
  lib/
  pages/
  assets/
server/
  agents/
  utils/
  index.js
lib/
  format.js
public/
```

## Important notes

This repository is a product prototype and demo app. Several flows are intentionally simplified for speed and usability, and some state remains client-side for a lightweight experience. For production-grade deployment, the app should move toward server-managed authentication, verified user sessions, and stricter backend validation.

## License

MIT
