# Conversational Analytics Dashboard

Ask questions about a company database in **plain English** and get instant
**charts and tables**. A local AI model (via Ollama) converts the question
into SQL, the backend safely runs it on MySQL, and the result is visualised
automatically. Covers five domains: **Sales, HR, Inventory, Purchase,
Manufacturing**.

**Everything runs locally and offline — no API keys, no usage limits, no data
leaves the machine.**

**Stack**
- Frontend: React + Vite + Recharts
- Backend: Python Flask
- Database: MySQL 8
- AI model: Ollama running `qwen2.5-coder` (local, on the CPU)

---

## 1. Prerequisites

Install these four things first:

| Tool | Download | Notes |
|------|----------|-------|
| **Python 3.10+** | https://www.python.org/downloads | Tick "Add Python to PATH" |
| **Node.js 18+** | https://nodejs.org | |
| **MySQL 8** | https://dev.mysql.com/downloads/installer | Remember the root password |
| **Ollama** | https://ollama.com/download | Runs the AI model locally |

After installing Ollama, download the model (one-time, ~4–5 GB):

```bash
ollama pull qwen2.5-coder:7b
```

> Optional: for a faster response on slower laptops, also `ollama pull qwen2.5-coder:3b`
> and set `OLLAMA_MODEL=qwen2.5-coder:3b` in your `.env`.

---

## 2. Database setup

Create and load the sample database (run from the project root):

```bash
mysql -u root -p < seed.sql
mysql -u root -p < seed_extended.sql
```

On Windows PowerShell, use:

```powershell
Get-Content seed.sql | mysql -u root -p
Get-Content seed_extended.sql | mysql -u root -p
```

This creates `analytics_db` with 22 tables of realistic sample data
(dates are generated relative to today, so "this week" queries always work).

---

## 3. Backend (Flask)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env         # macOS/Linux: cp .env.example .env
```

Then open `.env` and set your **MySQL password** (the only value you must
change). Everything else is pre-filled for local Ollama use.

Seed the login users (one-time):

```bash
python seed_users.py
```

Start the backend:

```bash
python app.py
```

It serves on `http://localhost:5000`. Leave this window open.

---

## 4. Frontend (React)

In a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

It serves on `http://localhost:5173`. Leave this window open too.

---

## 5. Use it

1. Make sure **Ollama** is running (it starts automatically after install; look
   for its icon in the system tray).
2. Open **http://localhost:5173** in your browser.
3. Sign in:

   | Username | Password | Department  |
   |----------|----------|-------------|
   | admin    | admin123 | Operations  |
   | alice    | alice123 | Quality     |
   | bob      | bob123   | Production  |
   | carol    | carol123 | Maintenance |

4. Ask a question, e.g.:
   - *Top 5 customers by total revenue*
   - *Average salary by department*
   - *Which products are below their reorder level?*
   - *Daily production trend for the last 15 days*
   - *How many invoices are overdue?*

> The **first** question is slower (the AI model loads into memory). After that
> it stays warm and responds in a few seconds. The chart and table appear first;
> the AI insight and suggested follow-up questions stream in a moment later.

---

## 6. How it works (one paragraph)

The browser sends your question to the Flask backend. The backend builds a
prompt containing the full database schema and sends it to the local Ollama
model, which returns a SQL query. The backend checks the SQL is a safe
read-only `SELECT`, runs it on MySQL, auto-detects the best chart type, logs
the query, and returns the rows. The frontend renders the chart, the table, an
AI-written insight, and three suggested follow-up questions.

---

## 7. Project layout

```
conversational-analytics/
├── backend/
│   ├── app.py              Flask app (API + AI + safety + SQL)
│   ├── seed_users.py       Inserts login users
│   ├── requirements.txt
│   └── .env.example        Copy to .env
├── frontend/
│   └── src/                React components, API client, styles
├── seed.sql                Manufacturing + system tables
├── seed_extended.sql       HR, Inventory, Sales, Purchase tables
├── Technical_Report.pdf    Full technical report
└── README.md
```

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot reach Ollama" | Make sure Ollama is running; try `ollama serve` in a terminal |
| Login fails | Run `python seed_users.py` in the backend folder |
| "Access denied" on MySQL | Check the password in `backend/.env` |
| Recent-data queries return nothing | Re-run the two seed files to refresh dates |
| First query very slow | Normal — the model is loading into RAM; subsequent queries are fast |
