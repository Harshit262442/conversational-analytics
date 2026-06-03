# Deployment Guide — Take it Live

This deploys the app to two free services:
- **Frontend** → Vercel (React build, free, auto-deploys on git push)
- **Backend** → Render (Flask + SQLite, free, spins down after 15 min idle)

End result: a public URL like `https://conversational-analytics.vercel.app` you can share.

---

## What changes for production

Local dev uses MySQL. Production uses **SQLite** (no separate DB hosting needed).
The same `app.py` handles both — switched by the `DB_TYPE` environment variable.

| Layer | Local dev | Production |
|---|---|---|
| Frontend | `npm run dev` on port 5173 | Vercel static site |
| Backend | `python app.py` on port 5000 | Gunicorn on Render |
| Database | MySQL (via Workbench) | SQLite file (created at boot) |
| API URL | Vite proxy `/api` → `127.0.0.1:5000` | `VITE_API_URL=https://<render>.onrender.com` |

---

## Step 1 — Push the latest code to GitHub

If you haven't yet:

```bash
cd "C:\Users\Harshit Verma\conversational-analytics"
git add .
git commit -m "Add deployment configs"
git push
```

---

## Step 2 — Deploy the backend to Render (10 min)

1. Go to https://render.com → **Sign up** (use GitHub login)
2. Top-right → **New +** → **Web Service**
3. **Connect GitHub** → pick `conversational-analytics`
4. Fill the form:

   | Field | Value |
   |---|---|
   | Name | `analytics-backend` (becomes the URL prefix) |
   | Region | choose closest |
   | Branch | `main` |
   | **Root directory** | `backend` |
   | Runtime | `Python 3` |
   | Build command | `pip install -r requirements.txt` |
   | Start command | *(leave blank — Procfile handles it)* |
   | Instance type | **Free** |

5. Click **Advanced** → **Add Environment Variables**:

   | Key | Value |
   |---|---|
   | `DB_TYPE` | `sqlite` |
   | `GEMINI_API_KEY` | *(your real key — same one in your local .env)* |
   | `GEMINI_MODEL` | `gemini-2.5-flash-lite` |
   | `ALLOWED_ORIGINS` | *(leave blank for now — add Vercel URL after Step 3)* |
   | `SQLITE_PATH` | `/var/data/analytics.db` |

6. Click **Create Web Service**. First deploy takes ~3 minutes.

7. When it shows **"Live"**, copy the URL (e.g. `https://analytics-backend.onrender.com`). Open it in a browser, hit `/api/health` — you should see `{"status": "ok"}`.

⚠️ **Free tier note**: backend spins down after 15 min of no traffic. First request after that takes ~30 sec to wake up. Subsequent requests are instant.

---

## Step 3 — Deploy the frontend to Vercel (5 min)

1. Go to https://vercel.com → **Sign up** (GitHub login)
2. Top-right → **Add New** → **Project**
3. **Import** the `conversational-analytics` repo
4. **Configure**:

   | Field | Value |
   |---|---|
   | Framework Preset | Vite (auto-detected) |
   | **Root Directory** | `frontend` *(click "Edit" then change it)* |
   | Build Command | `npm run build` (default) |
   | Output Directory | `dist` (default) |

5. **Environment Variables**:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | *(paste your Render URL from Step 2)* |

6. Click **Deploy**. First build takes ~2 minutes.

7. When it's done, you get a URL like `https://conversational-analytics-abc.vercel.app`.

---

## Step 4 — Connect them (CORS)

The backend needs to allow the Vercel URL.

1. Back in Render → your backend service → **Environment**
2. Edit `ALLOWED_ORIGINS` → set it to your Vercel URL:
   ```
   https://conversational-analytics-abc.vercel.app
   ```
   (no trailing slash)
3. Save. Render auto-redeploys (~1 min).

---

## Step 5 — Test the live URL

Visit your Vercel URL → sign in as `admin / admin123` → ask a question.

If the first request hangs ~30 sec, that's Render waking the backend from sleep. After that it's instant until 15 min of inactivity pass again.

---

## Future updates

You don't have to redeploy manually. Both services watch your GitHub repo:

- Push to `main` → Vercel rebuilds the frontend (~30 sec)
- Push to `main` → Render rebuilds the backend (~2 min)

```bash
git add .
git commit -m "Whatever change"
git push
```

That's it. Both services pick up the change automatically.

---

## Troubleshooting

**"Failed to fetch" or CORS errors**
- Check `ALLOWED_ORIGINS` on Render matches your Vercel URL exactly (no trailing slash, https, etc.)
- Check `VITE_API_URL` on Vercel matches your Render URL

**Backend wakes slowly**
- Free tier limitation. To eliminate cold starts: upgrade Render to Starter ($7/mo) or use Railway.

**Login doesn't work after deploy**
- The SQLite DB resets on every Render deploy because `init_sqlite.py` runs at boot.
- Default users `admin/admin123`, `alice/alice123`, etc. are always available.

**Gemini quota exceeded**
- Same as local: switch to a different `GEMINI_MODEL` or new API key. Set it in Render → Environment.

---

## Resume note

Once live, you can add to your CV:

> *"Conversational analytics dashboard — Live at https://your-app.vercel.app. React + Flask + SQLite + Gemini API. Deployed to Vercel and Render."*

Recruiters click. Click counts.
