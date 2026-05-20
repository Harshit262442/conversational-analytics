# Conversational Analytics Dashboard

A Text-to-SQL analytics app for a manufacturing dataset.
Ask questions in plain English; Claude generates the SQL; results show as
charts and tables.

**Stack**
- Frontend: React + Vite + Recharts + html2canvas
- Backend: Python Flask + Anthropic SDK + mysql-connector-python
- DB: MySQL
- LLM: `claude-opus-4-7`

---

## 1. Prerequisites

- Python 3.10+
- Node 18+
- MySQL 8 running locally
- An Anthropic API key

---

## 2. Database setup

```bash
mysql -u root -p < seed.sql
```

That creates `analytics_db` with sample suppliers, machines, units, defects,
shift records, a `users` table, and an empty `query_log` audit table.

The seed file embeds placeholder user hashes for documentation only — run
`backend/seed_users.py` after step 3 to install real sha256 hashes so
login actually works:

```bash
cd backend
python seed_users.py
```

Sample logins:

| User  | Password   | Department  |
|-------|------------|-------------|
| admin | admin123   | Operations  |
| alice | alice123   | Quality     |
| bob   | bob123     | Production  |
| carol | carol123   | Maintenance |

---

## 3. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then edit .env
python app.py
```

Flask listens on `http://localhost:5000`.

`.env` must contain:

```
ANTHROPIC_API_KEY=sk-ant-...
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=analytics_db
```

### Endpoints

| Method | Path                       | Purpose                              |
|--------|----------------------------|--------------------------------------|
| POST   | `/api/login`               | `{ username, password }` → user info |
| POST   | `/api/query`               | `{ question, username, department }` |
| GET    | `/api/history`             | Last 20 questions                    |
| POST   | `/api/feedback`            | `{ query_id }` marks it wrong        |
| GET    | `/api/export/csv?query_id` | CSV download                         |
| GET    | `/api/health`              | Status ping                          |

---

## 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves on `http://localhost:5173`. Open it, sign in, and start asking
questions.

---

## 5. Example questions to try

- *How many units did each machine produce this week?*
- *Which defect type is most common?*
- *Show daily production trend for the last week*
- *Top 5 operators by total units produced*
- *Which suppliers have the most defects?*
- *How many machines are currently down?*
- *Average hours worked per operator*

---

## 6. Safety

- Backend rejects any non-SELECT statement via a regex guard before
  executing.
- The system prompt instructs Claude to return only SELECT or the literal
  `CANNOT_ANSWER`.
- All queries are recorded in `query_log` with the issuing user and
  department.
- CORS is locked to `http://localhost:5173`.

---

## 7. Features summary

- Login screen with sha256-hashed passwords (department attached to every
  query for auditing).
- Sidebar history (last 20 questions, click to re-run).
- Auto-detected chart type: `metric` / `line` / `bar` / `table`.
- Always shows the underlying SQL plus the raw data table.
- Per-result CSV export, PNG export (via html2canvas), and "wrong answer"
  feedback button.
- Friendly error banner when the AI says `CANNOT_ANSWER` or returns
  invalid SQL.
