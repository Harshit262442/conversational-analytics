-- =============================================================
-- Extended seed: HR, Inventory, Sales, Purchase
-- Additive — run AFTER seed.sql.
-- All time-series rows use CURDATE() arithmetic so the data
-- always includes "today", "this week", "this month".
-- =============================================================
USE analytics_db;

DROP TABLE IF EXISTS sales_order_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS sales_orders;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS goods_receipts;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS payroll;
DROP TABLE IF EXISTS leaves;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS employees;

-- =============================================================
-- HR
-- =============================================================
CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_code VARCHAR(20) UNIQUE,
  full_name     VARCHAR(120),
  email         VARCHAR(120),
  department    VARCHAR(60),
  role          VARCHAR(80),
  hire_date     DATE,
  salary        DECIMAL(10,2),
  manager_id    INT,
  status        VARCHAR(20)   -- 'active', 'on_leave', 'resigned'
);

INSERT INTO employees (employee_code, full_name, email, department, role, hire_date, salary, manager_id, status) VALUES
('E-001','Alice Chen',   'alice.chen@company.com',   'Production', 'Operator Lead',     '2022-03-14',  62000, NULL, 'active'),
('E-002','Bob Patel',    'bob.patel@company.com',    'Production', 'Operator',          '2023-06-20',  48000, 1,    'active'),
('E-003','Carol Singh',  'carol.singh@company.com',  'Production', 'Operator',          '2021-11-02',  51000, 1,    'active'),
('E-004','Dan Wilson',   'dan.wilson@company.com',   'Production', 'Operator',          '2023-09-15',  47000, 1,    'active'),
('E-005','Eva Garcia',   'eva.garcia@company.com',   'Quality',    'QA Analyst',        '2022-08-05',  58000, 12,   'active'),
('E-006','Frank Lee',    'frank.lee@company.com',    'Production', 'Operator',          '2020-04-18',  55000, 1,    'active'),
('E-007','Grace Kim',    'grace.kim@company.com',    'Production', 'Operator',          '2024-01-10',  46000, 1,    'active'),
('E-008','Henry Brown',  'henry.brown@company.com',  'Assembly',   'Tech Lead',         '2019-07-22',  72000, NULL, 'active'),
('E-009','Iris Walker',  'iris.walker@company.com',  'Assembly',   'Robotics Tech',     '2022-02-11',  61000, 8,    'active'),
('E-010','Jack Davis',   'jack.davis@company.com',   'Finishing',  'Paint Operator',    '2023-05-01',  49000, NULL, 'active'),
('E-011','Karen White',  'karen.white@company.com',  'Welding',    'Welder',            '2021-09-08',  53000, NULL, 'active'),
('E-012','Liam Brown',   'liam.brown@company.com',   'Quality',    'Quality Manager',   '2018-04-12', 95000, NULL, 'active'),
('E-013','Maya Patel',   'maya.patel@company.com',   'HR',         'HR Manager',        '2017-10-04',105000, NULL, 'active'),
('E-014','Nikhil Rao',   'nikhil.rao@company.com',   'HR',         'HR Specialist',     '2022-12-19', 56000, 13,   'active'),
('E-015','Olivia Park',  'olivia.park@company.com',  'Finance',    'Finance Manager',   '2019-02-25',110000, NULL, 'active'),
('E-016','Paul Adams',   'paul.adams@company.com',   'Finance',    'Accountant',        '2023-08-14', 58000, 15,   'active'),
('E-017','Quinn Lopez',  'quinn.lopez@company.com',  'Sales',      'Sales Director',    '2017-06-30',135000, NULL, 'active'),
('E-018','Riya Shah',    'riya.shah@company.com',    'Sales',      'Account Executive', '2022-04-04', 72000, 17,   'active'),
('E-019','Sam Tan',      'sam.tan@company.com',      'Sales',      'Account Executive', '2024-02-19', 65000, 17,   'active'),
('E-020','Tara Iyer',    'tara.iyer@company.com',    'Sales',      'SDR',               '2024-09-11', 48000, 17,   'active'),
('E-021','Umar Khan',    'umar.khan@company.com',    'Purchase',   'Purchase Manager',  '2020-01-09', 92000, NULL, 'active'),
('E-022','Vera Cruz',    'vera.cruz@company.com',    'Purchase',   'Buyer',             '2023-03-22', 60000, 21,   'active'),
('E-023','Will Hayes',   'will.hayes@company.com',   'Inventory',  'Warehouse Lead',    '2021-05-18', 64000, NULL, 'active'),
('E-024','Xinyi Liu',    'xinyi.liu@company.com',    'Inventory',  'Stock Clerk',       '2024-04-02', 42000, 23,   'active'),
('E-025','Yara Ahmed',   'yara.ahmed@company.com',   'Maintenance','Maintenance Tech',  '2022-07-07', 57000, NULL, 'active'),
('E-026','Zane Miller',  'zane.miller@company.com',  'Maintenance','Maintenance Tech',  '2023-11-29', 52000, 25,   'active'),
('E-027','Aaron Cole',   'aaron.cole@company.com',   'IT',         'IT Admin',          '2021-08-16', 71000, NULL, 'active'),
('E-028','Bea Moss',     'bea.moss@company.com',     'IT',         'Data Analyst',      '2024-06-03', 68000, 27,   'active'),
('E-029','Cara Singh',   'cara.singh@company.com',   'Production', 'Operator',          '2025-02-05', 44000, 1,    'on_leave'),
('E-030','Dev Roy',      'dev.roy@company.com',      'Production', 'Operator',          '2024-11-12', 45000, 1,    'resigned');

-- Attendance: last 30 days for active employees (sparse but recent)
CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id  INT,
  work_date    DATE,
  check_in     TIME,
  check_out    TIME,
  hours_worked DECIMAL(4,1),
  status       VARCHAR(20)    -- 'present', 'absent', 'half_day', 'wfh'
);

INSERT INTO attendance (employee_id, work_date, check_in, check_out, hours_worked, status)
SELECT e.id, d.work_date, '09:00:00', '18:00:00', 8.0, 'present'
FROM employees e
JOIN (
  SELECT CURDATE() - INTERVAL 0  DAY AS work_date UNION ALL
  SELECT CURDATE() - INTERVAL 1  DAY UNION ALL
  SELECT CURDATE() - INTERVAL 2  DAY UNION ALL
  SELECT CURDATE() - INTERVAL 3  DAY UNION ALL
  SELECT CURDATE() - INTERVAL 4  DAY UNION ALL
  SELECT CURDATE() - INTERVAL 7  DAY UNION ALL
  SELECT CURDATE() - INTERVAL 8  DAY UNION ALL
  SELECT CURDATE() - INTERVAL 9  DAY UNION ALL
  SELECT CURDATE() - INTERVAL 10 DAY UNION ALL
  SELECT CURDATE() - INTERVAL 14 DAY UNION ALL
  SELECT CURDATE() - INTERVAL 21 DAY UNION ALL
  SELECT CURDATE() - INTERVAL 28 DAY
) d
WHERE e.status = 'active';

-- Mix in a few absences and half-days for realism
UPDATE attendance SET status='absent',   hours_worked=0, check_in=NULL, check_out=NULL
  WHERE employee_id IN (2,7,14,22) AND work_date = CURDATE() - INTERVAL 2 DAY;
UPDATE attendance SET status='half_day', hours_worked=4, check_out='13:00:00'
  WHERE employee_id IN (5,11,18) AND work_date = CURDATE() - INTERVAL 4 DAY;
UPDATE attendance SET status='wfh'
  WHERE employee_id IN (13,15,27,28) AND work_date = CURDATE() - INTERVAL 1 DAY;

-- Leaves
CREATE TABLE leaves (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT,
  leave_type  VARCHAR(20),    -- 'sick', 'casual', 'earned', 'unpaid'
  start_date  DATE,
  end_date    DATE,
  status      VARCHAR(20),    -- 'approved', 'pending', 'rejected'
  reason      VARCHAR(200)
);

INSERT INTO leaves (employee_id, leave_type, start_date, end_date, status, reason) VALUES
(2,  'sick',    CURDATE() - INTERVAL 2 DAY, CURDATE() - INTERVAL 2 DAY, 'approved', 'fever'),
(7,  'sick',    CURDATE() - INTERVAL 2 DAY, CURDATE() - INTERVAL 1 DAY, 'approved', 'flu'),
(11, 'casual',  CURDATE() + INTERVAL 3 DAY, CURDATE() + INTERVAL 4 DAY, 'pending',  'personal'),
(14, 'earned',  CURDATE() - INTERVAL 10 DAY,CURDATE() - INTERVAL 6 DAY, 'approved', 'vacation'),
(18, 'sick',    CURDATE() - INTERVAL 4 DAY, CURDATE() - INTERVAL 4 DAY, 'approved', 'migraine'),
(22, 'casual',  CURDATE() - INTERVAL 2 DAY, CURDATE() - INTERVAL 2 DAY, 'approved', 'family event'),
(29, 'earned',  CURDATE() - INTERVAL 5 DAY, CURDATE() + INTERVAL 10 DAY,'approved', 'extended leave'),
(5,  'casual',  CURDATE() + INTERVAL 10 DAY,CURDATE() + INTERVAL 11 DAY,'pending',  'wedding'),
(19, 'unpaid',  CURDATE() - INTERVAL 30 DAY,CURDATE() - INTERVAL 25 DAY,'approved', 'travel');

-- Payroll: last 3 months for each active employee
CREATE TABLE payroll (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT,
  pay_month   DATE,            -- first of month
  basic       DECIMAL(10,2),
  allowances  DECIMAL(10,2),
  deductions  DECIMAL(10,2),
  net_pay     DECIMAL(10,2),
  paid_on     DATE
);

INSERT INTO payroll (employee_id, pay_month, basic, allowances, deductions, net_pay, paid_on)
SELECT
  e.id,
  DATE_FORMAT(CURDATE() - INTERVAL m MONTH, '%Y-%m-01'),
  ROUND(e.salary/12,2),
  ROUND(e.salary/12 * 0.10,2),
  ROUND(e.salary/12 * 0.18,2),
  ROUND(e.salary/12 * 0.92,2),
  LAST_DAY(CURDATE() - INTERVAL m MONTH)
FROM employees e
JOIN (SELECT 1 AS m UNION SELECT 2 UNION SELECT 3) months
WHERE e.status='active';

-- =============================================================
-- Inventory
-- =============================================================
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sku           VARCHAR(20) UNIQUE,
  product_name  VARCHAR(120),
  category      VARCHAR(60),
  unit_price    DECIMAL(10,2),
  reorder_level INT
);

INSERT INTO products (sku, product_name, category, unit_price, reorder_level) VALUES
('SKU-001','Steel Plate 10mm',  'Raw Material', 45.00,  500),
('SKU-002','Steel Rod 8mm',     'Raw Material', 12.50, 1000),
('SKU-003','Polymer Granules',  'Raw Material',  8.20, 2000),
('SKU-004','Casting Mold A',    'Tooling',     320.00,   50),
('SKU-005','Casting Mold B',    'Tooling',     410.00,   40),
('SKU-006','Bearing 6202',      'Component',     3.20,  300),
('SKU-007','Bearing 6204',      'Component',     4.10,  300),
('SKU-008','Servo Motor 200W',  'Component',   145.00,   80),
('SKU-009','Hydraulic Hose',    'Component',    22.00,  150),
('SKU-010','Paint Primer 5L',   'Consumable',   28.00,  120),
('SKU-011','Paint Top Coat 5L', 'Consumable',   32.00,  120),
('SKU-012','Welding Rod E6013', 'Consumable',    6.50,  500),
('SKU-013','Cutting Disc 4"',   'Consumable',    1.80, 1000),
('SKU-014','Finished Widget A', 'Finished Goods',95.00,  200),
('SKU-015','Finished Widget B', 'Finished Goods',125.00, 200),
('SKU-016','Finished Widget C', 'Finished Goods',180.00, 150),
('SKU-017','Spare Filter',      'Spare Part',   18.00,   80),
('SKU-018','Spare Belt',        'Spare Part',   24.50,   60),
('SKU-019','Lubricant 1L',      'Consumable',    9.50,  200),
('SKU-020','Safety Gloves',     'PPE',           4.20,  400);

CREATE TABLE warehouses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  warehouse_name VARCHAR(60),
  location       VARCHAR(80),
  capacity       INT
);

INSERT INTO warehouses (warehouse_name, location, capacity) VALUES
('WH-North','Mumbai',  10000),
('WH-South','Chennai',  8000),
('WH-East', 'Kolkata',  6000),
('WH-West', 'Pune',     7000);

CREATE TABLE inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id   INT,
  warehouse_id INT,
  quantity     INT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES
(1,1, 820),(1,2, 410),(2,1,1500),(2,3, 800),(3,2,2200),(3,4,1100),
(4,1,  60),(4,2,  30),(5,1,  45),(5,3,  25),(6,2, 480),(6,4, 220),
(7,1, 380),(7,3, 290),(8,2, 110),(8,4,  70),(9,1,  40),(9,2,  30),
(10,3,140),(10,4,160),(11,1,150),(11,2,170),(12,3,620),(12,4,510),
(13,1,1100),(13,4,890),(14,2,310),(14,3,260),(15,1,240),(15,4,180),
(16,2,210),(16,3,160),(17,4, 25),(17,1, 20),(18,2, 85),(18,3, 55),
(19,1,260),(19,4,190),(20,2,120),(20,3,100);

CREATE TABLE stock_movements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id    INT,
  warehouse_id  INT,
  movement_type VARCHAR(20),   -- 'in', 'out', 'transfer', 'adjust'
  quantity      INT,
  reference     VARCHAR(60),
  movement_date DATETIME
);

INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, reference, movement_date) VALUES
(1, 1,'in',  500,'PO-1001', CURDATE() - INTERVAL 0 DAY),
(2, 1,'out', 200,'WO-7741', CURDATE() - INTERVAL 0 DAY),
(3, 2,'in',1000,'PO-1002', CURDATE() - INTERVAL 1 DAY),
(6, 2,'out', 150,'WO-7742', CURDATE() - INTERVAL 1 DAY),
(14,2,'out', 80, 'SO-5001', CURDATE() - INTERVAL 1 DAY),
(15,4,'out', 60, 'SO-5002', CURDATE() - INTERVAL 2 DAY),
(8, 4,'in',  40, 'PO-1003', CURDATE() - INTERVAL 2 DAY),
(10,3,'in', 120,'PO-1004', CURDATE() - INTERVAL 3 DAY),
(12,4,'out', 200,'WO-7743', CURDATE() - INTERVAL 3 DAY),
(20,3,'in', 300,'PO-1005', CURDATE() - INTERVAL 4 DAY),
(11,1,'out', 50, 'WO-7744', CURDATE() - INTERVAL 5 DAY),
(16,3,'out', 35, 'SO-5003', CURDATE() - INTERVAL 5 DAY),
(7, 3,'in', 200,'PO-1006', CURDATE() - INTERVAL 6 DAY),
(2, 3,'out', 350,'WO-7745', CURDATE() - INTERVAL 7 DAY),
(14,3,'out', 45, 'SO-5004', CURDATE() - INTERVAL 7 DAY),
(5, 1,'in',  20, 'PO-1007', CURDATE() - INTERVAL 8 DAY),
(13,4,'out', 400,'WO-7746', CURDATE() - INTERVAL 9 DAY),
(19,1,'in', 100,'PO-1008', CURDATE() - INTERVAL 10 DAY),
(1, 2,'out', 180,'WO-7747', CURDATE() - INTERVAL 12 DAY),
(15,1,'out', 25, 'SO-5005', CURDATE() - INTERVAL 14 DAY),
(3, 4,'in', 800,'PO-1009', CURDATE() - INTERVAL 18 DAY),
(8, 2,'out', 30, 'WO-7748', CURDATE() - INTERVAL 21 DAY),
(17,4,'adjust', -5,'AUDIT', CURDATE() - INTERVAL 25 DAY),
(20,2,'in', 200,'PO-1010', CURDATE() - INTERVAL 28 DAY);

-- =============================================================
-- Sales
-- =============================================================
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_name VARCHAR(120),
  email         VARCHAR(120),
  phone         VARCHAR(30),
  region        VARCHAR(60),
  segment       VARCHAR(30),    -- 'enterprise', 'mid_market', 'smb'
  created_at    DATE
);

INSERT INTO customers (customer_name, email, phone, region, segment, created_at) VALUES
('Tata Industries',     'orders@tata.com',     '+91-22-1111-1111','West',  'enterprise', '2023-01-15'),
('Reliance Mfg',        'pr@reliance.com',     '+91-22-2222-2222','West',  'enterprise', '2022-08-20'),
('Mahindra Auto',       'buy@mahindra.com',    '+91-22-3333-3333','West',  'enterprise', '2023-05-10'),
('Infosys Plant',       'plant@infosys.com',   '+91-80-4444-4444','South', 'enterprise', '2024-02-12'),
('Wipro Industrial',    'sourcing@wipro.com',  '+91-80-5555-5555','South', 'enterprise', '2023-11-03'),
('Bajaj Components',    'orders@bajaj.com',    '+91-20-6666-6666','West',  'mid_market', '2024-06-18'),
('Hero Manufacturing',  'po@hero.com',         '+91-11-7777-7777','North', 'mid_market', '2023-09-22'),
('Maruti Suppliers',    'sup@maruti.com',      '+91-11-8888-8888','North', 'mid_market', '2022-12-30'),
('LG Components',       'lg@lgc.com',          '+91-44-9999-9999','South', 'mid_market', '2024-03-05'),
('Samsung Parts',       'sam@samsungp.com',    '+91-44-1212-1212','South', 'enterprise', '2023-04-09'),
('Local Workshop A',    'a@workshop.in',       '+91-33-3434-3434','East',  'smb',        '2024-08-14'),
('Local Workshop B',    'b@workshop.in',       '+91-33-3535-3535','East',  'smb',        '2024-10-02'),
('CNC Garage',          'orders@cncgarage.in', '+91-22-3636-3636','West',  'smb',        '2025-01-22'),
('Precision Tools Co',  'sales@ptools.in',     '+91-80-3737-3737','South', 'mid_market', '2024-05-30'),
('Reliable Spares',     'order@rsp.in',        '+91-33-3838-3838','East',  'smb',        '2024-11-19');

CREATE TABLE sales_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(20) UNIQUE,
  customer_id  INT,
  order_date   DATE,
  status       VARCHAR(20),   -- 'pending', 'shipped', 'delivered', 'cancelled'
  total_amount DECIMAL(12,2),
  salesperson  VARCHAR(120)
);

INSERT INTO sales_orders (order_number, customer_id, order_date, status, total_amount, salesperson) VALUES
('SO-5001', 1, CURDATE() - INTERVAL 1 DAY, 'shipped',   8400.00, 'Riya Shah'),
('SO-5002', 2, CURDATE() - INTERVAL 2 DAY, 'delivered', 7500.00, 'Sam Tan'),
('SO-5003', 3, CURDATE() - INTERVAL 5 DAY, 'delivered', 6300.00, 'Riya Shah'),
('SO-5004', 4, CURDATE() - INTERVAL 7 DAY, 'delivered', 4275.00, 'Sam Tan'),
('SO-5005', 5, CURDATE() - INTERVAL 14 DAY,'delivered', 3125.00, 'Tara Iyer'),
('SO-5006', 6, CURDATE() - INTERVAL 3 DAY, 'shipped',   9520.00, 'Riya Shah'),
('SO-5007', 7, CURDATE() - INTERVAL 0 DAY, 'pending',  12800.00, 'Sam Tan'),
('SO-5008', 8, CURDATE() - INTERVAL 9 DAY, 'delivered',11200.00, 'Tara Iyer'),
('SO-5009', 9, CURDATE() - INTERVAL 6 DAY, 'delivered', 5400.00, 'Riya Shah'),
('SO-5010',10, CURDATE() - INTERVAL 11 DAY,'delivered',18000.00, 'Sam Tan'),
('SO-5011',11, CURDATE() - INTERVAL 4 DAY, 'cancelled',  980.00, 'Tara Iyer'),
('SO-5012',12, CURDATE() - INTERVAL 8 DAY, 'delivered', 2240.00, 'Tara Iyer'),
('SO-5013',13, CURDATE() - INTERVAL 16 DAY,'delivered', 3600.00, 'Sam Tan'),
('SO-5014',14, CURDATE() - INTERVAL 12 DAY,'delivered', 7900.00, 'Riya Shah'),
('SO-5015',15, CURDATE() - INTERVAL 20 DAY,'delivered', 1620.00, 'Tara Iyer'),
('SO-5016', 1, CURDATE() - INTERVAL 22 DAY,'delivered',15400.00, 'Riya Shah'),
('SO-5017', 3, CURDATE() - INTERVAL 25 DAY,'delivered', 8800.00, 'Sam Tan'),
('SO-5018', 4, CURDATE() - INTERVAL 28 DAY,'delivered', 6600.00, 'Sam Tan'),
('SO-5019', 7, CURDATE() - INTERVAL 30 DAY,'delivered',14250.00, 'Sam Tan'),
('SO-5020', 8, CURDATE() - INTERVAL 35 DAY,'delivered', 9100.00, 'Tara Iyer'),
('SO-5021', 2, CURDATE() - INTERVAL 45 DAY,'delivered',16200.00, 'Sam Tan'),
('SO-5022',10, CURDATE() - INTERVAL 60 DAY,'delivered',12400.00, 'Tara Iyer');

CREATE TABLE sales_order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sales_order_id INT,
  product_id     INT,
  quantity       INT,
  unit_price     DECIMAL(10,2),
  line_total     DECIMAL(12,2)
);

INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, line_total) VALUES
(1,14, 80, 95.00, 7600.00),(1,17, 40, 18.00, 720.00),
(2,15, 60,125.00, 7500.00),
(3,16, 35,180.00, 6300.00),
(4,14, 45, 95.00, 4275.00),
(5,15, 25,125.00, 3125.00),
(6,14, 60, 95.00, 5700.00),(6,15, 30,125.00, 3750.00),
(7,16, 50,180.00, 9000.00),(7,15, 30,125.00, 3750.00),
(8,14,100, 95.00, 9500.00),(8,17,100, 18.00, 1800.00),
(9,15, 40,125.00, 5000.00),(9,20,100,  4.20, 420.00),
(10,16,100,180.00,18000.00),
(11,18, 40, 24.50, 980.00),
(12,17,124, 18.00, 2232.00),
(13,15, 28,125.00, 3500.00),
(14,16, 44,180.00, 7920.00),
(15,18, 66, 24.50, 1617.00),
(16,16, 86,180.00,15480.00),
(17,14, 92, 95.00, 8740.00),
(18,15, 53,125.00, 6625.00),
(19,16, 79,180.00,14220.00),
(20,15, 73,125.00, 9125.00);

CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(20) UNIQUE,
  sales_order_id INT,
  invoice_date   DATE,
  amount         DECIMAL(12,2),
  status         VARCHAR(20),   -- 'paid', 'pending', 'overdue'
  paid_on        DATE
);

INSERT INTO invoices (invoice_number, sales_order_id, invoice_date, amount, status, paid_on) VALUES
('INV-9001', 1, CURDATE() - INTERVAL 1  DAY, 8400.00, 'pending',  NULL),
('INV-9002', 2, CURDATE() - INTERVAL 2  DAY, 7500.00, 'paid',     CURDATE() - INTERVAL 1 DAY),
('INV-9003', 3, CURDATE() - INTERVAL 5  DAY, 6300.00, 'paid',     CURDATE() - INTERVAL 3 DAY),
('INV-9004', 4, CURDATE() - INTERVAL 7  DAY, 4275.00, 'paid',     CURDATE() - INTERVAL 4 DAY),
('INV-9005', 5, CURDATE() - INTERVAL 14 DAY, 3125.00, 'paid',     CURDATE() - INTERVAL 9 DAY),
('INV-9006', 6, CURDATE() - INTERVAL 3  DAY, 9520.00, 'pending',  NULL),
('INV-9008', 8, CURDATE() - INTERVAL 9  DAY,11200.00, 'paid',     CURDATE() - INTERVAL 5 DAY),
('INV-9009', 9, CURDATE() - INTERVAL 6  DAY, 5400.00, 'overdue',  NULL),
('INV-9010',10, CURDATE() - INTERVAL 11 DAY,18000.00, 'paid',     CURDATE() - INTERVAL 6 DAY),
('INV-9012',12, CURDATE() - INTERVAL 8  DAY, 2240.00, 'paid',     CURDATE() - INTERVAL 4 DAY),
('INV-9013',13, CURDATE() - INTERVAL 16 DAY, 3600.00, 'paid',     CURDATE() - INTERVAL 10 DAY),
('INV-9014',14, CURDATE() - INTERVAL 12 DAY, 7900.00, 'overdue',  NULL),
('INV-9016',16, CURDATE() - INTERVAL 22 DAY,15400.00, 'paid',     CURDATE() - INTERVAL 15 DAY),
('INV-9017',17, CURDATE() - INTERVAL 25 DAY, 8800.00, 'paid',     CURDATE() - INTERVAL 18 DAY),
('INV-9018',18, CURDATE() - INTERVAL 28 DAY, 6600.00, 'paid',     CURDATE() - INTERVAL 20 DAY),
('INV-9019',19, CURDATE() - INTERVAL 30 DAY,14250.00, 'paid',     CURDATE() - INTERVAL 22 DAY),
('INV-9020',20, CURDATE() - INTERVAL 35 DAY, 9100.00, 'paid',     CURDATE() - INTERVAL 28 DAY),
('INV-9021',21, CURDATE() - INTERVAL 45 DAY,16200.00, 'paid',     CURDATE() - INTERVAL 38 DAY),
('INV-9022',22, CURDATE() - INTERVAL 60 DAY,12400.00, 'paid',     CURDATE() - INTERVAL 52 DAY);

-- =============================================================
-- Purchase
-- =============================================================
CREATE TABLE purchase_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  po_number   VARCHAR(20) UNIQUE,
  supplier_id INT,
  order_date  DATE,
  status      VARCHAR(20),    -- 'pending', 'received', 'cancelled'
  total_amount DECIMAL(12,2),
  buyer       VARCHAR(120)
);

INSERT INTO purchase_orders (po_number, supplier_id, order_date, status, total_amount, buyer) VALUES
('PO-1001', 1, CURDATE() - INTERVAL 0  DAY, 'received', 22500.00, 'Vera Cruz'),
('PO-1002', 2, CURDATE() - INTERVAL 1  DAY, 'received',  8200.00, 'Vera Cruz'),
('PO-1003', 5, CURDATE() - INTERVAL 2  DAY, 'received',  5800.00, 'Umar Khan'),
('PO-1004', 6, CURDATE() - INTERVAL 3  DAY, 'received',  3360.00, 'Vera Cruz'),
('PO-1005', 8, CURDATE() - INTERVAL 4  DAY, 'received',  1260.00, 'Vera Cruz'),
('PO-1006', 3, CURDATE() - INTERVAL 6  DAY, 'received',   820.00, 'Umar Khan'),
('PO-1007', 4, CURDATE() - INTERVAL 8  DAY, 'received',  8200.00, 'Vera Cruz'),
('PO-1008', 1, CURDATE() - INTERVAL 10 DAY, 'received',   950.00, 'Vera Cruz'),
('PO-1009', 2, CURDATE() - INTERVAL 18 DAY, 'received',  6560.00, 'Umar Khan'),
('PO-1010', 7, CURDATE() - INTERVAL 28 DAY, 'received',   840.00, 'Vera Cruz'),
('PO-1011', 1, CURDATE() - INTERVAL 2  DAY, 'pending',  18900.00, 'Vera Cruz'),
('PO-1012', 5, CURDATE() - INTERVAL 1  DAY, 'pending',   7200.00, 'Umar Khan'),
('PO-1013', 8, CURDATE() - INTERVAL 0  DAY, 'pending',   1480.00, 'Vera Cruz');

CREATE TABLE purchase_order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  po_id     INT,
  product_id INT,
  quantity   INT,
  unit_cost  DECIMAL(10,2),
  line_total DECIMAL(12,2)
);

INSERT INTO purchase_order_items (po_id, product_id, quantity, unit_cost, line_total) VALUES
(1, 1, 500, 45.00, 22500.00),
(2, 3,1000,  8.20,  8200.00),
(3, 4,  20,290.00,  5800.00),
(4, 6, 100, 33.60,  3360.00),  -- different cost than retail (margin)
(5, 8,  20, 63.00,  1260.00),
(6, 7, 200,  4.10,   820.00),
(7, 5,  20,410.00,  8200.00),
(8,19, 100,  9.50,   950.00),
(9, 3, 800,  8.20,  6560.00),
(10,20,200,  4.20,   840.00),
(11, 1, 420, 45.00, 18900.00),
(12, 4,  20,360.00,  7200.00),
(13, 8,  20, 74.00,  1480.00);

CREATE TABLE goods_receipts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  po_id          INT,
  received_date  DATE,
  received_by    VARCHAR(120),
  status         VARCHAR(20)   -- 'complete', 'partial', 'rejected'
);

INSERT INTO goods_receipts (po_id, received_date, received_by, status) VALUES
(1, CURDATE() - INTERVAL 0 DAY, 'Will Hayes',  'complete'),
(2, CURDATE() - INTERVAL 1 DAY, 'Xinyi Liu',   'complete'),
(3, CURDATE() - INTERVAL 2 DAY, 'Will Hayes',  'complete'),
(4, CURDATE() - INTERVAL 3 DAY, 'Xinyi Liu',   'partial'),
(5, CURDATE() - INTERVAL 4 DAY, 'Will Hayes',  'complete'),
(6, CURDATE() - INTERVAL 6 DAY, 'Will Hayes',  'complete'),
(7, CURDATE() - INTERVAL 8 DAY, 'Xinyi Liu',   'complete'),
(8, CURDATE() - INTERVAL 10 DAY,'Will Hayes',  'complete'),
(9, CURDATE() - INTERVAL 18 DAY,'Will Hayes',  'complete'),
(10,CURDATE() - INTERVAL 28 DAY,'Xinyi Liu',   'complete');
