"""
Create and seed a SQLite database for production deployment.

Run:    python init_sqlite.py
Output: analytics.db  (or wherever SQLITE_PATH points)

This script creates all tables and inserts the same kind of sample data
that the MySQL seed scripts create, but using SQLite-friendly syntax and
date('now', '-N days') expressions so the data stays current.
"""
import os
import hashlib
import sqlite3
from datetime import date, timedelta

PATH = os.getenv("SQLITE_PATH", "analytics.db")


def sha(p): return hashlib.sha256(p.encode()).hexdigest()


SCHEMA = """
DROP TABLE IF EXISTS query_log;
DROP TABLE IF EXISTS goods_receipts;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS sales_order_items;
DROP TABLE IF EXISTS sales_orders;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS payroll;
DROP TABLE IF EXISTS leaves;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS shift_records;
DROP TABLE IF EXISTS defect_logs;
DROP TABLE IF EXISTS units_produced;
DROP TABLE IF EXISTS machine_status;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS users;

CREATE TABLE suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_name TEXT NOT NULL,
  region TEXT,
  contact_email TEXT,
  rating REAL
);
CREATE TABLE machine_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id TEXT NOT NULL,
  machine_name TEXT,
  status TEXT,
  last_maintenance TEXT,
  department TEXT
);
CREATE TABLE units_produced (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id TEXT NOT NULL,
  shift_date TEXT NOT NULL,
  shift_type TEXT,
  units_count INTEGER,
  operator_name TEXT
);
CREATE TABLE defect_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id TEXT,
  defect_type TEXT,
  severity TEXT,
  detected_at TEXT,
  supplier_id INTEGER,
  units_affected INTEGER
);
CREATE TABLE shift_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_date TEXT,
  shift_type TEXT,
  operator_name TEXT,
  machine_id TEXT,
  hours_worked REAL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code TEXT UNIQUE,
  full_name TEXT,
  email TEXT,
  department TEXT,
  role TEXT,
  hire_date TEXT,
  salary REAL,
  manager_id INTEGER,
  status TEXT
);
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  work_date TEXT,
  check_in TEXT,
  check_out TEXT,
  hours_worked REAL,
  status TEXT
);
CREATE TABLE leaves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  leave_type TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT,
  reason TEXT
);
CREATE TABLE payroll (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  pay_month TEXT,
  basic REAL,
  allowances REAL,
  deductions REAL,
  net_pay REAL,
  paid_on TEXT
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE,
  product_name TEXT,
  category TEXT,
  unit_price REAL,
  reorder_level INTEGER
);
CREATE TABLE warehouses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warehouse_name TEXT, location TEXT, capacity INTEGER
);
CREATE TABLE inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER, warehouse_id INTEGER, quantity INTEGER,
  last_updated TEXT DEFAULT (datetime('now'))
);
CREATE TABLE stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER, warehouse_id INTEGER,
  movement_type TEXT, quantity INTEGER, reference TEXT,
  movement_date TEXT
);
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT, email TEXT, phone TEXT,
  region TEXT, segment TEXT, created_at TEXT
);
CREATE TABLE sales_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE, customer_id INTEGER,
  order_date TEXT, status TEXT,
  total_amount REAL, salesperson TEXT
);
CREATE TABLE sales_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sales_order_id INTEGER, product_id INTEGER,
  quantity INTEGER, unit_price REAL, line_total REAL
);
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE, sales_order_id INTEGER,
  invoice_date TEXT, amount REAL, status TEXT, paid_on TEXT
);
CREATE TABLE purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_number TEXT UNIQUE, supplier_id INTEGER,
  order_date TEXT, status TEXT, total_amount REAL, buyer TEXT
);
CREATE TABLE purchase_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER, product_id INTEGER,
  quantity INTEGER, unit_cost REAL, line_total REAL
);
CREATE TABLE goods_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER, received_date TEXT,
  received_by TEXT, status TEXT
);
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  department TEXT
);
CREATE TABLE query_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT, generated_sql TEXT, row_count INTEGER,
  was_correct INTEGER DEFAULT 1,
  username TEXT, department TEXT, chart_type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
"""


def days_ago(n): return (date.today() - timedelta(days=n)).isoformat()


def main():
    if os.path.exists(PATH):
        os.remove(PATH)
    conn = sqlite3.connect(PATH)
    cur = conn.cursor()
    cur.executescript(SCHEMA)

    # ---------- users ----------
    cur.executemany("INSERT INTO users (username, password_hash, department) VALUES (?, ?, ?)", [
        ("admin", sha("admin123"), "Operations"),
        ("alice", sha("alice123"), "Quality"),
        ("bob",   sha("bob123"),   "Production"),
        ("carol", sha("carol123"), "Maintenance"),
    ])

    # ---------- suppliers ----------
    cur.executemany("INSERT INTO suppliers (supplier_name, region, contact_email, rating) VALUES (?, ?, ?, ?)", [
        ("Acme Steel Co.",     "North", "sales@acmesteel.com", 4.5),
        ("Bharat Polymers",    "West",  "orders@bharatpoly.in", 4.1),
        ("Crystal Components", "South", "cc@crystalcomp.com", 3.8),
        ("Delta Castings",     "East",  "info@deltacast.com", 4.7),
        ("Elite Electronics",  "North", "team@eliteelec.com", 4.2),
        ("Falcon Metals",      "West",  "sales@falconmetals.com", 3.5),
        ("Granite Tooling",    "South", "hello@granitetool.com", 4.9),
        ("Horizon Plastics",   "East",  "orders@horizonplastics.com", 4.0),
    ])

    # ---------- machines ----------
    machines = [
        ("M-001","CNC Lathe Alpha","running",     days_ago(40),"Machining"),
        ("M-002","CNC Lathe Beta","running",      days_ago(28),"Machining"),
        ("M-003","Injection Mold I","maintenance",days_ago(8), "Molding"),
        ("M-004","Injection Mold II","running",   days_ago(50),"Molding"),
        ("M-005","Press Line A","running",        days_ago(32),"Stamping"),
        ("M-006","Press Line B","down",           days_ago(15),"Stamping"),
        ("M-007","Assembly Robot 1","running",    days_ago(25),"Assembly"),
        ("M-008","Assembly Robot 2","running",    days_ago(18),"Assembly"),
        ("M-009","Paint Booth East","running",    days_ago(35),"Finishing"),
        ("M-010","Paint Booth West","maintenance",days_ago(10),"Finishing"),
        ("M-011","Welding Cell 1","running",      days_ago(22),"Welding"),
        ("M-012","Welding Cell 2","down",         days_ago(12),"Welding"),
    ]
    cur.executemany("INSERT INTO machine_status (machine_id, machine_name, status, last_maintenance, department) VALUES (?, ?, ?, ?, ?)", machines)

    # ---------- units_produced ----------
    ops = ["Alice Chen","Bob Patel","Carol Singh","Dan Wilson","Frank Lee","Grace Kim","Henry Brown","Iris Walker","Jack Davis","Karen White"]
    units = []
    base = 380
    for d in (14, 13, 10, 7, 4, 2, 0):
        for i, m in enumerate(["M-001","M-002","M-004","M-005","M-007","M-008","M-009","M-011"]):
            units.append((m, days_ago(d), "morning", base + i*15 + (14-d)*5, ops[i % len(ops)]))
    cur.executemany("INSERT INTO units_produced (machine_id, shift_date, shift_type, units_count, operator_name) VALUES (?, ?, ?, ?, ?)", units)

    # ---------- defects ----------
    defects = [
        ("M-001","surface scratch","low",  f"{days_ago(14)} 09:14:00", 1, 3),
        ("M-001","dimension off","high",   f"{days_ago(13)} 11:02:00", 1, 12),
        ("M-003","short shot","medium",    f"{days_ago(15)} 08:45:00", 2, 8),
        ("M-003","short shot","high",      f"{days_ago(14)} 10:11:00", 2, 15),
        ("M-005","crack","high",           f"{days_ago(13)} 12:30:00", 4, 9),
        ("M-006","electrical fault","critical", f"{days_ago(14)} 16:45:00", 5, 0),
        ("M-007","misalignment","medium",  f"{days_ago(13)} 14:05:00", 3, 4),
        ("M-008","missing component","high", f"{days_ago(13)} 16:50:00", 3, 11),
        ("M-009","paint run","medium",     f"{days_ago(11)} 13:50:00", 6, 6),
        ("M-011","weld porosity","high",   f"{days_ago(12)} 11:20:00", 7, 9),
        ("M-001","tool wear","medium",     f"{days_ago(10)} 10:25:00", 1, 5),
        ("M-007","misalignment","high",    f"{days_ago(7)}  10:40:00", 3, 10),
        ("M-011","weld porosity","critical", f"{days_ago(4)} 10:20:00", 7, 14),
        ("M-008","missing component","high", f"{days_ago(1)} 09:50:00", 3, 9),
    ]
    cur.executemany("INSERT INTO defect_logs (machine_id, defect_type, severity, detected_at, supplier_id, units_affected) VALUES (?, ?, ?, ?, ?, ?)", defects)

    # ---------- employees ----------
    emps = [
        ("E-001","Alice Chen","alice.chen@company.com","Production","Operator Lead","2022-03-14",62000,None,"active"),
        ("E-002","Bob Patel","bob.patel@company.com","Production","Operator","2023-06-20",48000,1,"active"),
        ("E-003","Carol Singh","carol.singh@company.com","Production","Operator","2021-11-02",51000,1,"active"),
        ("E-008","Henry Brown","henry.brown@company.com","Assembly","Tech Lead","2019-07-22",72000,None,"active"),
        ("E-012","Liam Brown","liam.brown@company.com","Quality","Quality Manager","2018-04-12",95000,None,"active"),
        ("E-013","Maya Patel","maya.patel@company.com","HR","HR Manager","2017-10-04",105000,None,"active"),
        ("E-015","Olivia Park","olivia.park@company.com","Finance","Finance Manager","2019-02-25",110000,None,"active"),
        ("E-017","Quinn Lopez","quinn.lopez@company.com","Sales","Sales Director","2017-06-30",135000,None,"active"),
        ("E-018","Riya Shah","riya.shah@company.com","Sales","Account Executive","2022-04-04",72000,17,"active"),
        ("E-019","Sam Tan","sam.tan@company.com","Sales","Account Executive","2024-02-19",65000,17,"active"),
        ("E-021","Umar Khan","umar.khan@company.com","Purchase","Purchase Manager","2020-01-09",92000,None,"active"),
        ("E-023","Will Hayes","will.hayes@company.com","Inventory","Warehouse Lead","2021-05-18",64000,None,"active"),
        ("E-029","Cara Singh","cara.singh@company.com","Production","Operator","2025-02-05",44000,1,"on_leave"),
    ]
    cur.executemany("INSERT INTO employees (employee_code, full_name, email, department, role, hire_date, salary, manager_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", emps)

    # ---------- attendance ----------
    att = []
    for emp_id in range(1, 13):  # for active employees
        for d in (0, 1, 2, 3, 4, 7, 8, 10, 14, 21):
            att.append((emp_id, days_ago(d), "09:00", "18:00", 8.0, "present"))
    cur.executemany("INSERT INTO attendance (employee_id, work_date, check_in, check_out, hours_worked, status) VALUES (?, ?, ?, ?, ?, ?)", att)

    # ---------- leaves ----------
    cur.executemany("INSERT INTO leaves (employee_id, leave_type, start_date, end_date, status, reason) VALUES (?, ?, ?, ?, ?, ?)", [
        (2,  "sick",    days_ago(2),  days_ago(2),  "approved", "fever"),
        (13, "earned",  days_ago(0),  (date.today()+timedelta(days=3)).isoformat(), "approved", "vacation"),
        (8,  "casual",  (date.today()+timedelta(days=3)).isoformat(), (date.today()+timedelta(days=4)).isoformat(), "pending", "personal"),
    ])

    # ---------- payroll ----------
    payroll = []
    for emp_id in range(1, 13):
        for months_ago in (1, 2, 3):
            month_date = (date.today().replace(day=1) - timedelta(days=months_ago*30)).replace(day=1).isoformat()
            basic = 5500
            payroll.append((emp_id, month_date, basic, basic*0.10, basic*0.18, basic*0.92, days_ago(months_ago*30 - 1)))
    cur.executemany("INSERT INTO payroll (employee_id, pay_month, basic, allowances, deductions, net_pay, paid_on) VALUES (?, ?, ?, ?, ?, ?, ?)", payroll)

    # ---------- products ----------
    prods = [
        ("SKU-001","Steel Plate 10mm","Raw Material",45.0,500),
        ("SKU-002","Steel Rod 8mm","Raw Material",12.5,1000),
        ("SKU-003","Polymer Granules","Raw Material",8.2,2000),
        ("SKU-006","Bearing 6202","Component",3.2,300),
        ("SKU-008","Servo Motor 200W","Component",145.0,80),
        ("SKU-010","Paint Primer 5L","Consumable",28.0,120),
        ("SKU-012","Welding Rod E6013","Consumable",6.5,500),
        ("SKU-014","Finished Widget A","Finished Goods",95.0,200),
        ("SKU-015","Finished Widget B","Finished Goods",125.0,200),
        ("SKU-016","Finished Widget C","Finished Goods",180.0,150),
        ("SKU-017","Spare Filter","Spare Part",18.0,80),
        ("SKU-020","Safety Gloves","PPE",4.2,400),
    ]
    cur.executemany("INSERT INTO products (sku, product_name, category, unit_price, reorder_level) VALUES (?, ?, ?, ?, ?)", prods)

    # ---------- warehouses ----------
    cur.executemany("INSERT INTO warehouses (warehouse_name, location, capacity) VALUES (?, ?, ?)", [
        ("WH-North","Mumbai",10000),("WH-South","Chennai",8000),
        ("WH-East","Kolkata",6000),("WH-West","Pune",7000),
    ])

    # ---------- inventory (some intentionally below reorder) ----------
    inv = [
        (1,1,820),(1,2,410),(2,1,200),(2,3,400),  # SKU-002 = 600 total < 1000 reorder
        (3,2,2200),(4,2,180),(4,4,80),            # SKU-006 = 260 < 300 reorder
        (5,2,50),(5,4,20),                         # SKU-008 = 70 < 80 reorder
        (6,3,140),(6,4,160),
        (7,3,620),(7,4,510),
        (8,2,310),(8,3,260),(9,1,240),(9,4,180),
        (10,2,210),(10,3,160),
        (11,4,30),(11,1,30),                       # SKU-017 = 60 < 80
        (12,2,520),(12,3,430),
    ]
    cur.executemany("INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, ?, ?)", inv)

    # ---------- stock_movements ----------
    cur.executemany("INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, reference, movement_date) VALUES (?, ?, ?, ?, ?, ?)", [
        (1, 1,"in",  500,"PO-1001", days_ago(0)),
        (2, 1,"out", 200,"WO-7741", days_ago(0)),
        (3, 2,"in", 1000,"PO-1002", days_ago(1)),
        (8, 2,"out", 150,"WO-7742", days_ago(1)),
        (8, 4,"in",  40,"PO-1003",  days_ago(2)),
        (6, 3,"in", 200,"PO-1006",  days_ago(6)),
        (7, 3,"out", 350,"WO-7745", days_ago(7)),
        (1, 2,"out", 180,"WO-7747", days_ago(12)),
    ])

    # ---------- customers ----------
    custs = [
        ("Tata Industries","orders@tata.com","+91-22","West","enterprise","2023-01-15"),
        ("Reliance Mfg","pr@reliance.com","+91-22","West","enterprise","2022-08-20"),
        ("Infosys Plant","plant@infosys.com","+91-80","South","enterprise","2024-02-12"),
        ("Bajaj Components","orders@bajaj.com","+91-20","West","mid_market","2024-06-18"),
        ("Hero Manufacturing","po@hero.com","+91-11","North","mid_market","2023-09-22"),
        ("Maruti Suppliers","sup@maruti.com","+91-11","North","mid_market","2022-12-30"),
        ("LG Components","lg@lgc.com","+91-44","South","mid_market","2024-03-05"),
        ("Samsung Parts","sam@samsungp.com","+91-44","South","enterprise","2023-04-09"),
        ("Local Workshop A","a@workshop.in","+91-33","East","smb","2024-08-14"),
        ("CNC Garage","orders@cncgarage.in","+91-22","West","smb","2025-01-22"),
    ]
    cur.executemany("INSERT INTO customers (customer_name, email, phone, region, segment, created_at) VALUES (?, ?, ?, ?, ?, ?)", custs)

    # ---------- sales_orders ----------
    so = [
        ("SO-5001",1, days_ago(1),  "shipped",   8400.0, "Riya Shah"),
        ("SO-5002",2, days_ago(2),  "delivered", 7500.0, "Sam Tan"),
        ("SO-5003",3, days_ago(5),  "delivered", 6300.0, "Riya Shah"),
        ("SO-5004",4, days_ago(7),  "delivered", 4275.0, "Sam Tan"),
        ("SO-5005",5, days_ago(14), "delivered", 3125.0, "Riya Shah"),
        ("SO-5006",6, days_ago(3),  "shipped",   9520.0, "Riya Shah"),
        ("SO-5007",7, days_ago(0),  "pending",   12800.0,"Sam Tan"),
        ("SO-5008",8, days_ago(9),  "delivered", 11200.0,"Riya Shah"),
        ("SO-5009",1, days_ago(6),  "delivered", 5400.0, "Riya Shah"),
        ("SO-5010",2, days_ago(11), "delivered", 18000.0,"Sam Tan"),
        ("SO-5011",10,days_ago(4),  "cancelled", 980.0,  "Riya Shah"),
        ("SO-5012",3, days_ago(8),  "delivered", 2240.0, "Sam Tan"),
        ("SO-5013",4, days_ago(16), "delivered", 3600.0, "Sam Tan"),
        ("SO-5014",5, days_ago(12), "delivered", 7900.0, "Riya Shah"),
    ]
    cur.executemany("INSERT INTO sales_orders (order_number, customer_id, order_date, status, total_amount, salesperson) VALUES (?, ?, ?, ?, ?, ?)", so)

    # ---------- sales_order_items ----------
    soi = []
    for so_id in range(1, len(so)+1):
        soi.append((so_id, 8, 50, 95.0, 50*95.0))   # 50 units of product 8
    cur.executemany("INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)", soi)

    # ---------- invoices ----------
    cur.executemany("INSERT INTO invoices (invoice_number, sales_order_id, invoice_date, amount, status, paid_on) VALUES (?, ?, ?, ?, ?, ?)", [
        ("INV-9001",1, days_ago(1),  8400.0, "pending", None),
        ("INV-9002",2, days_ago(2),  7500.0, "paid",    days_ago(1)),
        ("INV-9003",3, days_ago(5),  6300.0, "paid",    days_ago(3)),
        ("INV-9006",6, days_ago(3),  9520.0, "pending", None),
        ("INV-9009",9, days_ago(6),  5400.0, "overdue", None),
        ("INV-9014",14,days_ago(12), 7900.0, "overdue", None),
    ])

    # ---------- purchase_orders ----------
    po = [
        ("PO-1001",1, days_ago(0),  "received", 22500.0, "Vera Cruz"),
        ("PO-1002",2, days_ago(1),  "received", 8200.0,  "Vera Cruz"),
        ("PO-1006",3, days_ago(6),  "received", 820.0,   "Umar Khan"),
        ("PO-1011",1, days_ago(2),  "pending",  18900.0, "Vera Cruz"),
        ("PO-1012",5, days_ago(1),  "pending",  7200.0,  "Umar Khan"),
        ("PO-1013",8, days_ago(0),  "pending",  1480.0,  "Vera Cruz"),
    ]
    cur.executemany("INSERT INTO purchase_orders (po_number, supplier_id, order_date, status, total_amount, buyer) VALUES (?, ?, ?, ?, ?, ?)", po)

    # ---------- purchase_order_items ----------
    cur.executemany("INSERT INTO purchase_order_items (po_id, product_id, quantity, unit_cost, line_total) VALUES (?, ?, ?, ?, ?)", [
        (1,1,500,45.0,22500.0),(2,3,1000,8.2,8200.0),(3,7,200,4.1,820.0),
        (4,1,420,45.0,18900.0),(5,4,20,360.0,7200.0),(6,5,20,74.0,1480.0),
    ])

    # ---------- goods_receipts ----------
    cur.executemany("INSERT INTO goods_receipts (po_id, received_date, received_by, status) VALUES (?, ?, ?, ?)", [
        (1, days_ago(0), "Will Hayes", "complete"),
        (2, days_ago(1), "Will Hayes", "complete"),
        (3, days_ago(6), "Will Hayes", "complete"),
    ])

    conn.commit()
    conn.close()
    print(f"Created {PATH} with sample data.")


if __name__ == "__main__":
    main()
