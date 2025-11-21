# TinyLink - URL Shortener

A simple URL shortener like bit.ly. Create short links, track clicks, and manage your URLs.

## Setup

1. Install dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Create `.env` files:

**Backend** (copy from `backend/.env.example`):
```bash
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require
PORT=3001
```

**Frontend** (copy from `frontend/.env.example`):
```bash
VITE_API_URL=http://localhost:3001
```

3. Run backend:
```bash
cd backend
npm run dev
```

4. Run frontend (in new terminal):
```bash
cd frontend
npm run dev
```

Visit: `http://localhost:3000`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthz` | Health check |
| POST | `/api/links` | Create link (409 if duplicate) |
| GET | `/api/links` | List all links |
| GET | `/api/links/:code` | Get link stats |
| DELETE | `/api/links/:code` | Delete link |
| GET | `/:code` | Redirect (302) |

## Testing

```bash
cd backend
npm test
```

## Deployment

### Backend (Render)
1. Create new Web Service on Render
2. Connect your GitHub repo
3. Set Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add environment variable:
   - `DATABASE_URL` = your Neon Postgres URL

### Frontend (Vercel)
1. Import your GitHub repo on Vercel
2. Set Root Directory: `frontend`
3. Framework: Vite
4. Add environment variable:
   - `VITE_API_URL` = your Render backend URL

### Database
Use Neon Postgres (free tier)

## Tech Stack

- Backend: Node.js, Express, PostgreSQL
- Frontend: React, Vite
- Database: Neon Postgres (free tier)
- Testing: Jest, Supertest
