"""Regenerate user password hashes (sha256) — run once after seed.sql.

The seed.sql file embeds placeholder hashes for documentation, but those
literal strings won't match sha256 of the plaintext. Run this script to
overwrite them with real hashes so login actually works.

  python seed_users.py
"""
import hashlib
import os

import mysql.connector
from dotenv import load_dotenv

load_dotenv()

USERS = [
    ("admin", "admin123", "Operations"),
    ("alice", "alice123", "Quality"),
    ("bob",   "bob123",   "Production"),
    ("carol", "carol123", "Maintenance"),
]

def sha(p): return hashlib.sha256(p.encode()).hexdigest()

conn = mysql.connector.connect(
    host=os.getenv("MYSQL_HOST", "localhost"),
    user=os.getenv("MYSQL_USER", "root"),
    password=os.getenv("MYSQL_PASSWORD", ""),
    database=os.getenv("MYSQL_DB", "analytics_db"),
)
cur = conn.cursor()
for u, p, d in USERS:
    cur.execute(
        """INSERT INTO users (username, password_hash, department)
           VALUES (%s, %s, %s)
           ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash),
                                    department=VALUES(department)""",
        (u, sha(p), d),
    )
conn.commit()
cur.close()
conn.close()
print("Seeded", len(USERS), "users.")
