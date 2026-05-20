"""
Conversational Analytics Dashboard - Flask backend.

Endpoints:
  POST /api/login                -> returns { username, department }
  POST /api/query                -> text-to-SQL via Claude, executes on MySQL
  GET  /api/history              -> last 20 questions from query_log
  POST /api/feedback             -> mark a query_log row as incorrect
  GET  /api/export/csv?query_id  -> CSV of a past query result
"""

import csv
import functools
import hashlib
import io
import os
import random
import re
import secrets
import time
from datetime import datetime, date
from decimal import Decimal

import mysql.connector
from google import genai
from google.genai import types as genai_types
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request, Response
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": ["http://localhost:5173"]}},
    supports_credentials=False,
    allow_headers=["Content-Type", "Authorization"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
MYSQL_CONFIG = {
    "host":     os.getenv("MYSQL_HOST", "localhost"),
    "user":     os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DB", "analytics_db"),
}

gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# In-memory session store: token -> {"username": ..., "department": ...}
# Wiped on backend restart, which is fine for dev.
SESSIONS: dict[str, dict] = {}


def auth_required(f):
    """Reject any request without a valid Bearer token.
    Accepts token via Authorization header OR ?token= query param
    (the latter is required for plain-anchor file downloads).
    """
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        token = ""
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:].strip()
        if not token:
            token = (request.args.get("token") or "").strip()
        if not token:
            return jsonify({"error": "Not signed in"}), 401
        user = SESSIONS.get(token)
        if not user:
            return jsonify({"error": "Session expired, please sign in again"}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return wrapper

# ---------------------------------------------------------------------------
# System prompt for Claude  (schema + rules)
# ---------------------------------------------------------------------------
SYSTEM_PROMPT_TEMPLATE = """You are a senior MySQL analyst. Convert the user's question into a single valid MySQL SELECT query.

TODAY'S DATE is {today}. Always use this when interpreting "today", "yesterday", "this week", "last week", "this month", "last month", "this quarter", "this year", "YTD". Prefer CURDATE() / NOW() arithmetic so queries stay date-relative.

DATA DOMAINS available:
  1) Manufacturing  (units_produced, defect_logs, machine_status, shift_records, suppliers)
  2) HR             (employees, attendance, leaves, payroll)
  3) Inventory      (products, warehouses, inventory, stock_movements)
  4) Sales          (customers, sales_orders, sales_order_items, invoices)
  5) Purchase       (purchase_orders, purchase_order_items, goods_receipts, suppliers)

SCHEMA:

-- Manufacturing
units_produced(id, machine_id, shift_date, shift_type ['morning','evening','night'], units_count, operator_name)
defect_logs(id, machine_id, defect_type, severity ['low','medium','high','critical'], detected_at DATETIME, supplier_id->suppliers.id, units_affected)
machine_status(id, machine_id, machine_name, status ['running','maintenance','down'], last_maintenance, department)
shift_records(id, shift_date, shift_type, operator_name, machine_id, hours_worked)
suppliers(id, supplier_name, region, contact_email, rating)

-- HR
employees(id, employee_code, full_name, email, department, role, hire_date, salary, manager_id->employees.id, status ['active','on_leave','resigned'])
attendance(id, employee_id->employees.id, work_date, check_in TIME, check_out TIME, hours_worked, status ['present','absent','half_day','wfh'])
leaves(id, employee_id->employees.id, leave_type ['sick','casual','earned','unpaid'], start_date, end_date, status ['approved','pending','rejected'], reason)
payroll(id, employee_id->employees.id, pay_month DATE (first of month), basic, allowances, deductions, net_pay, paid_on)

-- Inventory
products(id, sku, product_name, category ['Raw Material','Tooling','Component','Consumable','Finished Goods','Spare Part','PPE'], unit_price, reorder_level)
warehouses(id, warehouse_name, location, capacity)
inventory(id, product_id->products.id, warehouse_id->warehouses.id, quantity, last_updated DATETIME)
stock_movements(id, product_id->products.id, warehouse_id->warehouses.id, movement_type ['in','out','transfer','adjust'], quantity, reference, movement_date DATETIME)

-- Sales
customers(id, customer_name, email, phone, region ['North','South','East','West'], segment ['enterprise','mid_market','smb'], created_at)
sales_orders(id, order_number, customer_id->customers.id, order_date, status ['pending','shipped','delivered','cancelled'], total_amount, salesperson)
sales_order_items(id, sales_order_id->sales_orders.id, product_id->products.id, quantity, unit_price, line_total)
invoices(id, invoice_number, sales_order_id->sales_orders.id, invoice_date, amount, status ['paid','pending','overdue'], paid_on)

-- Purchase
purchase_orders(id, po_number, supplier_id->suppliers.id, order_date, status ['pending','received','cancelled'], total_amount, buyer)
purchase_order_items(id, po_id->purchase_orders.id, product_id->products.id, quantity, unit_cost, line_total)
goods_receipts(id, po_id->purchase_orders.id, received_date, received_by, status ['complete','partial','rejected'])

OUTPUT FORMAT (strict):
- Return EXACTLY ONE MySQL SELECT statement. Nothing else.
- No markdown fences, no language tag, no backticks around the SQL.
- No leading text like "Here is the SQL". No trailing semicolon. No comments.
- Use only the tables and columns listed above. Do NOT invent columns.
- Use single quotes for string literals. Never wrap identifiers in backticks.
- Single statement only — no multiple statements, no stored procedures, no CTEs unless strictly needed.
- For dates use CURDATE(), NOW(), DATE_SUB(CURDATE(), INTERVAL n DAY), or YEAR()/MONTH().
- Never use DATEADD or GETDATE (those are SQL Server). Use DATE_SUB/DATE_ADD/CURDATE/NOW.

QUERY SHAPING (so charts render well):
- Time-series → SELECT a DATE as the FIRST column, the numeric metric as the SECOND column, ORDER BY date.
- Category breakdown → category as FIRST column, numeric metric as SECOND column, ORDER BY metric DESC.
- Single-number answer (count/total/avg without grouping) → ONE row, ONE column.
- Lists/details → up to 100 rows, human-readable columns (names/codes) instead of raw IDs.

SCOPE:
- Only write SELECT statements. Never INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, REPLACE, GRANT.
- Always JOIN through proper FK relationships when spanning tables.
- If a question is genuinely ambiguous between two domains, pick the most likely interpretation and answer it; do NOT return CANNOT_ANSWER for ambiguity.
- Only return the literal text CANNOT_ANSWER (uppercase, no quotes, no other text) if the question truly has no plausible mapping to any table above.
"""


def build_system_prompt() -> str:
    return SYSTEM_PROMPT_TEMPLATE.format(today=date.today().isoformat())


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def get_db():
    return mysql.connector.connect(**MYSQL_CONFIG)


def hash_password(plain: str) -> str:
    return hashlib.sha256(plain.encode("utf-8")).hexdigest()


def clean_sql(text: str) -> str:
    """Extract a single SQL statement from a possibly-noisy model response.

    Handles markdown fences, leading 'sql' tag, narrative text before/after
    the SQL, inline comments, and trailing semicolons.
    """
    if not text:
        return ""
    t = text.strip()
    # Sentinel for unanswerable
    if t.upper().startswith("CANNOT_ANSWER"):
        return "CANNOT_ANSWER"
    # Drop all triple-backtick fences
    t = re.sub(r"```(?:sql|mysql)?\s*", "", t, flags=re.IGNORECASE)
    t = t.replace("```", "")
    # Strip line comments and block comments
    t = re.sub(r"--[^\n]*", "", t)
    t = re.sub(r"/\*.*?\*/", "", t, flags=re.DOTALL)
    # Skip any preamble like "Here is the SQL:" — find first SELECT or WITH
    m = re.search(r"\b(SELECT|WITH)\b", t, re.IGNORECASE)
    if m:
        t = t[m.start():]
    # Take only the first statement
    if ";" in t:
        t = t.split(";", 1)[0]
    # Collapse runs of whitespace to single spaces (helps MySQL parser
    # tolerate weird line breaks the model might emit)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n\s*\n", "\n", t)
    return t.strip()


SELECT_ONLY = re.compile(r"^\s*select\b", re.IGNORECASE)
FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|replace)\b",
    re.IGNORECASE,
)


def is_safe_select(sql: str) -> bool:
    return bool(SELECT_ONLY.match(sql)) and not FORBIDDEN.search(sql)


def detect_chart_type(columns, rows):
    if not rows or not columns:
        return "table"
    if len(rows) == 1 and len(columns) == 1:
        return "metric"
    # date/time column -> line
    sample = rows[0]
    for value in sample:
        if isinstance(value, (date, datetime)):
            return "line"
    if len(columns) == 2:
        # 2nd column numeric?
        second = sample[1]
        if isinstance(second, (int, float, Decimal)):
            return "bar"
    return "table"


def serialize(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def ask_claude_for_sql(question: str, retry_context: dict | None = None) -> str:
    """Ask Gemini for SQL. If retry_context is provided, send the failing
    SQL + MySQL error back so the model can self-correct.
    """
    if gemini_client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    if retry_context:
        prompt = (
            f"Question: {question}\n\n"
            f"Your previous SQL failed with a MySQL error.\n"
            f"Previous SQL:\n{retry_context['sql']}\n\n"
            f"MySQL error: {retry_context['error']}\n\n"
            f"Write a CORRECTED single SELECT query. Return only the SQL."
        )
    else:
        prompt = question

    response = call_gemini_with_retry(prompt)
    # If the model ran out of tokens mid-SQL, treat as failure so we don't
    # send half a statement to MySQL.
    try:
        finish_reason = response.candidates[0].finish_reason
        if finish_reason and str(finish_reason).upper().endswith("MAX_TOKENS"):
            raise RuntimeError("Model response was truncated. Try a simpler question.")
    except (AttributeError, IndexError):
        pass
    return clean_sql(response.text or "")


# Errors worth retrying — server overload, transient unavailability, rate spikes.
# We do NOT retry 400 (bad request), 401 (auth), or daily-quota exhaustion.
_RETRYABLE_PATTERNS = ("503", "UNAVAILABLE", "INTERNAL", "DEADLINE_EXCEEDED",
                       "overloaded", "high demand")


def call_gemini_with_retry(prompt: str, attempts: int = 4):
    """Call Gemini with exponential backoff on transient errors."""
    last_exc = None
    for i in range(attempts):
        try:
            return gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=build_system_prompt(),
                    temperature=0,
                    max_output_tokens=2048,
                ),
            )
        except Exception as e:
            msg = str(e)
            last_exc = e
            transient = any(p in msg for p in _RETRYABLE_PATTERNS)
            if not transient or i == attempts - 1:
                raise
            # Exponential backoff: 1s, 2s, 4s with a little jitter
            delay = (2 ** i) + random.uniform(0, 0.5)
            time.sleep(delay)
    raise last_exc  # pragma: no cover


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/api/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    conn = get_db()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT username, password_hash, department FROM users WHERE username=%s",
            (username,),
        )
        row = cur.fetchone()
        cur.close()
    finally:
        conn.close()

    if not row or row["password_hash"] != hash_password(password):
        return jsonify({"error": "invalid credentials"}), 401

    token = secrets.token_urlsafe(32)
    SESSIONS[token] = {
        "username": row["username"],
        "department": row["department"],
    }
    return jsonify({
        "username": row["username"],
        "department": row["department"],
        "token": token,
    })


@app.route("/api/logout", methods=["POST"])
@auth_required
def logout():
    auth = request.headers.get("Authorization", "")
    token = auth[7:].strip()
    SESSIONS.pop(token, None)
    return jsonify({"ok": True})


def try_execute_sql(sql: str):
    """Execute SQL. Returns (columns, raw_rows, error_msg). On success error_msg is None."""
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(sql)
        columns = [c[0] for c in cur.description] if cur.description else []
        raw_rows = cur.fetchall()
        cur.close()
        return columns, raw_rows, None
    except mysql.connector.Error as e:
        return [], [], e.msg
    finally:
        try:
            conn.close()
        except Exception:
            pass


@app.route("/api/query", methods=["POST"])
@auth_required
def query():
    body = request.get_json(silent=True) or {}
    question = (body.get("question") or "").strip()
    username = g.current_user["username"]
    department = g.current_user["department"]

    if not question:
        return jsonify({"error": "question is required"}), 400

    # ---- 1. Ask the model -------------------------------------------------
    try:
        sql = ask_claude_for_sql(question)
    except Exception as e:
        msg = str(e)
        if "503" in msg or "UNAVAILABLE" in msg or "overloaded" in msg:
            friendly = "The AI service is temporarily overloaded. Please try again in a few seconds."
        elif "429" in msg or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
            friendly = ("Daily AI quota exceeded for this model. Either wait until tomorrow "
                        "or switch GEMINI_MODEL in backend/.env (e.g. to gemini-2.0-flash).")
        else:
            friendly = f"AI request failed: {msg}"
        return jsonify({"error": friendly}), 502

    if sql.strip().upper() == "CANNOT_ANSWER":
        log_query(question, "CANNOT_ANSWER", 0, username, department)
        return jsonify({
            "error": "I can't answer that with the available data. "
                     "Try asking about sales, HR, inventory, purchase, "
                     "production, defects, machines, shifts, or suppliers.",
            "sql": None,
        }), 200

    if not is_safe_select(sql):
        log_query(question, sql, 0, username, department, was_correct=False)
        return jsonify({
            "error": "The AI returned an unsafe or non-SELECT query. Please rephrase.",
            "sql": sql,
        }), 400

    # ---- 2. Try to execute -----------------------------------------------
    columns, raw_rows, err = try_execute_sql(sql)

    # ---- 3. One self-healing retry if MySQL rejected it -------------------
    if err:
        try:
            sql_retry = ask_claude_for_sql(
                question,
                retry_context={"sql": sql, "error": err},
            )
        except Exception as e:
            log_query(question, sql, 0, username, department, was_correct=False)
            return jsonify({
                "error": f"SQL execution failed: {err}. Retry also failed: {e}",
                "sql": sql,
            }), 400

        if sql_retry.strip().upper() == "CANNOT_ANSWER" or not is_safe_select(sql_retry):
            log_query(question, sql, 0, username, department, was_correct=False)
            return jsonify({
                "error": f"SQL execution failed: {err}",
                "sql": sql,
            }), 400

        columns, raw_rows, err2 = try_execute_sql(sql_retry)
        if err2:
            log_query(question, sql_retry, 0, username, department, was_correct=False)
            return jsonify({
                "error": f"SQL execution failed after retry: {err2}",
                "sql": sql_retry,
            }), 400
        # retry succeeded — use the corrected SQL
        sql = sql_retry

    rows = [[serialize(v) for v in r] for r in raw_rows]
    chart_type = detect_chart_type(columns, raw_rows)
    query_id = log_query(question, sql, len(rows), username, department,
                         chart_type=chart_type)

    return jsonify({
        "query_id":   query_id,
        "sql":        sql,
        "columns":    columns,
        "rows":       rows,
        "chart_type": chart_type,
    })


@app.route("/api/history", methods=["GET"])
@auth_required
def history():
    conn = get_db()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """SELECT id, question, generated_sql, row_count, was_correct,
                      username, department, chart_type, created_at
               FROM query_log
               ORDER BY id DESC
               LIMIT 20"""
        )
        rows = cur.fetchall()
        cur.close()
    finally:
        conn.close()

    for r in rows:
        r["created_at"] = serialize(r["created_at"])
        r["was_correct"] = bool(r["was_correct"])
    return jsonify({"history": rows})


@app.route("/api/feedback", methods=["POST"])
@auth_required
def feedback():
    body = request.get_json(silent=True) or {}
    query_id = body.get("query_id")
    if not query_id:
        return jsonify({"error": "query_id required"}), 400
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE query_log SET was_correct=FALSE WHERE id=%s", (query_id,)
        )
        conn.commit()
        cur.close()
    finally:
        conn.close()
    return jsonify({"ok": True})


@app.route("/api/export/csv", methods=["GET"])
@auth_required
def export_csv():
    query_id = request.args.get("query_id")
    if not query_id:
        return jsonify({"error": "query_id required"}), 400
    conn = get_db()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT generated_sql FROM query_log WHERE id=%s", (query_id,))
        log_row = cur.fetchone()
        cur.close()
        if not log_row:
            return jsonify({"error": "query_id not found"}), 404
        sql = log_row["generated_sql"]
        if not is_safe_select(sql):
            return jsonify({"error": "stored SQL is not a safe SELECT"}), 400
        cur = conn.cursor()
        cur.execute(sql)
        columns = [c[0] for c in cur.description] if cur.description else []
        rows = cur.fetchall()
        cur.close()
    finally:
        conn.close()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(columns)
    for r in rows:
        writer.writerow([serialize(v) for v in r])
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=query_{query_id}.csv"
        },
    )


# ---------------------------------------------------------------------------
def log_query(question, sql, row_count, username, department,
              was_correct=True, chart_type=None):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO query_log
                 (question, generated_sql, row_count, was_correct,
                  username, department, chart_type)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (question, sql, row_count, was_correct, username, department, chart_type),
        )
        new_id = cur.lastrowid
        conn.commit()
        cur.close()
        return new_id
    finally:
        conn.close()


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
