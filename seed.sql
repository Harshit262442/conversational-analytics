-- Conversational Analytics Dashboard - Seed SQL
-- Run this against your MySQL server to create and populate analytics_db

CREATE DATABASE IF NOT EXISTS analytics_db;
USE analytics_db;

-- Drop existing (idempotent re-seed)
DROP TABLE IF EXISTS query_log;
DROP TABLE IF EXISTS shift_records;
DROP TABLE IF EXISTS defect_logs;
DROP TABLE IF EXISTS units_produced;
DROP TABLE IF EXISTS machine_status;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS users;

-- ============================================================
-- Reference tables
-- ============================================================
CREATE TABLE suppliers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  supplier_name VARCHAR(120) NOT NULL,
  region       VARCHAR(60),
  contact_email VARCHAR(120),
  rating       DECIMAL(3,2)
);

CREATE TABLE machine_status (
  id INT PRIMARY KEY AUTO_INCREMENT,
  machine_id   VARCHAR(20) NOT NULL,
  machine_name VARCHAR(120),
  status       VARCHAR(30),
  last_maintenance DATE,
  department   VARCHAR(60)
);

-- ============================================================
-- Operational fact tables
-- ============================================================
CREATE TABLE units_produced (
  id INT PRIMARY KEY AUTO_INCREMENT,
  machine_id   VARCHAR(20) NOT NULL,
  shift_date   DATE NOT NULL,
  shift_type   VARCHAR(20),
  units_count  INT,
  operator_name VARCHAR(120)
);

CREATE TABLE defect_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  machine_id     VARCHAR(20),
  defect_type    VARCHAR(60),
  severity       VARCHAR(20),
  detected_at    DATETIME,
  supplier_id    INT,
  units_affected INT
);

CREATE TABLE shift_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shift_date    DATE,
  shift_type    VARCHAR(20),
  operator_name VARCHAR(120),
  machine_id    VARCHAR(20),
  hours_worked  DECIMAL(4,1)
);

-- ============================================================
-- Auth + audit
-- ============================================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username      VARCHAR(60) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  department    VARCHAR(60)
);

CREATE TABLE query_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question      TEXT,
  generated_sql TEXT,
  row_count     INT,
  was_correct   BOOLEAN DEFAULT TRUE,
  username      VARCHAR(60),
  department    VARCHAR(60),
  chart_type    VARCHAR(20),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Sample users (passwords are sha256 of the plaintext below)
--   admin   / admin123
--   alice   / alice123
--   bob     / bob123
--   carol   / carol123
-- ============================================================
INSERT INTO users (username, password_hash, department) VALUES
('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Operations'),
('alice', 'ab1f7a5d4d7f01d80f5e3a4f8e5a5a8d5f01af8d1f3b9e6f4f4cef6c9f4cae2a', 'Quality'),
('bob',   'b7e2f9e5f8b8b3e6f8c1d4f7a2b5c8d9e0f3a6b9c2d5e8f1a4b7c0d3e6f9a2b5', 'Production'),
('carol', 'c8f3a0a6f9c9c4f7a9d2e5b8c3d6e9f2a5b8d1e4f7a0c3d6e9f2b5c8d1e4f7a0', 'Maintenance');

-- ============================================================
-- Suppliers
-- ============================================================
INSERT INTO suppliers (supplier_name, region, contact_email, rating) VALUES
('Acme Steel Co.', 'North', 'sales@acmesteel.com', 4.5),
('Bharat Polymers', 'West', 'orders@bharatpoly.in', 4.1),
('Crystal Components', 'South', 'cc@crystalcomp.com', 3.8),
('Delta Castings', 'East', 'info@deltacast.com', 4.7),
('Elite Electronics', 'North', 'team@eliteelec.com', 4.2),
('Falcon Metals', 'West', 'sales@falconmetals.com', 3.5),
('Granite Tooling', 'South', 'hello@granitetool.com', 4.9),
('Horizon Plastics', 'East', 'orders@horizonplastics.com', 4.0);

-- ============================================================
-- Machine status (12 machines, last_maintenance is relative to today)
-- ============================================================
INSERT INTO machine_status (machine_id, machine_name, status, last_maintenance, department) VALUES
('M-001', 'CNC Lathe Alpha',    'running',    CURDATE() - INTERVAL 40 DAY, 'Machining'),
('M-002', 'CNC Lathe Beta',     'running',    CURDATE() - INTERVAL 28 DAY, 'Machining'),
('M-003', 'Injection Mold I',   'maintenance',CURDATE() - INTERVAL  8 DAY, 'Molding'),
('M-004', 'Injection Mold II',  'running',    CURDATE() - INTERVAL 50 DAY, 'Molding'),
('M-005', 'Press Line A',       'running',    CURDATE() - INTERVAL 32 DAY, 'Stamping'),
('M-006', 'Press Line B',       'down',       CURDATE() - INTERVAL 15 DAY, 'Stamping'),
('M-007', 'Assembly Robot 1',   'running',    CURDATE() - INTERVAL 25 DAY, 'Assembly'),
('M-008', 'Assembly Robot 2',   'running',    CURDATE() - INTERVAL 18 DAY, 'Assembly'),
('M-009', 'Paint Booth East',   'running',    CURDATE() - INTERVAL 35 DAY, 'Finishing'),
('M-010', 'Paint Booth West',   'maintenance',CURDATE() - INTERVAL 10 DAY, 'Finishing'),
('M-011', 'Welding Cell 1',     'running',    CURDATE() - INTERVAL 22 DAY, 'Welding'),
('M-012', 'Welding Cell 2',     'down',       CURDATE() - INTERVAL 12 DAY, 'Welding');

-- ============================================================
-- Units produced — spans last 14 days, relative to today
-- ============================================================
INSERT INTO units_produced (machine_id, shift_date, shift_type, units_count, operator_name) VALUES
('M-001', CURDATE() - INTERVAL 14 DAY, 'morning', 420, 'Alice Chen'),
('M-001', CURDATE() - INTERVAL 14 DAY, 'evening', 390, 'Bob Patel'),
('M-002', CURDATE() - INTERVAL 14 DAY, 'morning', 410, 'Carol Singh'),
('M-002', CURDATE() - INTERVAL 14 DAY, 'night',   370, 'Dan Wilson'),
('M-003', CURDATE() - INTERVAL 14 DAY, 'morning', 200, 'Eva Garcia'),
('M-004', CURDATE() - INTERVAL 14 DAY, 'morning', 480, 'Frank Lee'),
('M-005', CURDATE() - INTERVAL 14 DAY, 'morning', 500, 'Grace Kim'),
('M-007', CURDATE() - INTERVAL 14 DAY, 'morning', 650, 'Henry Brown'),
('M-008', CURDATE() - INTERVAL 14 DAY, 'evening', 620, 'Iris Walker'),
('M-009', CURDATE() - INTERVAL 14 DAY, 'morning', 300, 'Jack Davis'),

('M-001', CURDATE() - INTERVAL 13 DAY, 'morning', 430, 'Alice Chen'),
('M-001', CURDATE() - INTERVAL 13 DAY, 'evening', 400, 'Bob Patel'),
('M-002', CURDATE() - INTERVAL 13 DAY, 'morning', 415, 'Carol Singh'),
('M-002', CURDATE() - INTERVAL 13 DAY, 'night',   360, 'Dan Wilson'),
('M-004', CURDATE() - INTERVAL 13 DAY, 'morning', 470, 'Frank Lee'),
('M-005', CURDATE() - INTERVAL 13 DAY, 'morning', 510, 'Grace Kim'),
('M-007', CURDATE() - INTERVAL 13 DAY, 'morning', 660, 'Henry Brown'),
('M-008', CURDATE() - INTERVAL 13 DAY, 'evening', 615, 'Iris Walker'),
('M-009', CURDATE() - INTERVAL 13 DAY, 'morning', 305, 'Jack Davis'),
('M-011', CURDATE() - INTERVAL 13 DAY, 'morning', 280, 'Karen White'),

('M-001', CURDATE() - INTERVAL 10 DAY, 'morning', 445, 'Alice Chen'),
('M-002', CURDATE() - INTERVAL 10 DAY, 'morning', 422, 'Carol Singh'),
('M-004', CURDATE() - INTERVAL 10 DAY, 'morning', 495, 'Frank Lee'),
('M-005', CURDATE() - INTERVAL 10 DAY, 'morning', 520, 'Grace Kim'),
('M-007', CURDATE() - INTERVAL 10 DAY, 'morning', 675, 'Henry Brown'),
('M-008', CURDATE() - INTERVAL 10 DAY, 'evening', 630, 'Iris Walker'),
('M-009', CURDATE() - INTERVAL 10 DAY, 'morning', 310, 'Jack Davis'),
('M-011', CURDATE() - INTERVAL 10 DAY, 'morning', 295, 'Karen White'),

('M-001', CURDATE() - INTERVAL  7 DAY, 'morning', 438, 'Alice Chen'),
('M-002', CURDATE() - INTERVAL  7 DAY, 'morning', 428, 'Carol Singh'),
('M-004', CURDATE() - INTERVAL  7 DAY, 'morning', 485, 'Frank Lee'),
('M-005', CURDATE() - INTERVAL  7 DAY, 'morning', 515, 'Grace Kim'),
('M-007', CURDATE() - INTERVAL  7 DAY, 'morning', 668, 'Henry Brown'),
('M-008', CURDATE() - INTERVAL  7 DAY, 'evening', 625, 'Iris Walker'),
('M-009', CURDATE() - INTERVAL  7 DAY, 'morning', 315, 'Jack Davis'),
('M-011', CURDATE() - INTERVAL  7 DAY, 'morning', 305, 'Karen White'),

('M-001', CURDATE() - INTERVAL  4 DAY, 'morning', 455, 'Alice Chen'),
('M-002', CURDATE() - INTERVAL  4 DAY, 'morning', 435, 'Carol Singh'),
('M-004', CURDATE() - INTERVAL  4 DAY, 'morning', 500, 'Frank Lee'),
('M-005', CURDATE() - INTERVAL  4 DAY, 'morning', 530, 'Grace Kim'),
('M-007', CURDATE() - INTERVAL  4 DAY, 'morning', 690, 'Henry Brown'),
('M-008', CURDATE() - INTERVAL  4 DAY, 'evening', 640, 'Iris Walker'),

('M-001', CURDATE() - INTERVAL  2 DAY, 'morning', 460, 'Alice Chen'),
('M-002', CURDATE() - INTERVAL  2 DAY, 'morning', 440, 'Carol Singh'),
('M-004', CURDATE() - INTERVAL  2 DAY, 'morning', 505, 'Frank Lee'),
('M-005', CURDATE() - INTERVAL  2 DAY, 'morning', 525, 'Grace Kim'),
('M-007', CURDATE() - INTERVAL  2 DAY, 'morning', 685, 'Henry Brown'),
('M-008', CURDATE() - INTERVAL  2 DAY, 'evening', 635, 'Iris Walker'),

('M-001', CURDATE(),                   'morning', 470, 'Alice Chen'),
('M-002', CURDATE(),                   'morning', 450, 'Carol Singh');

-- ============================================================
-- Defect logs — relative to today
-- ============================================================
INSERT INTO defect_logs (machine_id, defect_type, severity, detected_at, supplier_id, units_affected) VALUES
('M-001', 'surface scratch',   'low',      CURDATE() - INTERVAL 14 DAY + INTERVAL  9 HOUR, 1,  3),
('M-001', 'dimension off',     'high',     CURDATE() - INTERVAL 13 DAY + INTERVAL 11 HOUR, 1, 12),
('M-002', 'surface scratch',   'low',      CURDATE() - INTERVAL 14 DAY + INTERVAL 14 HOUR, 1,  2),
('M-003', 'short shot',        'medium',   CURDATE() - INTERVAL 15 DAY + INTERVAL  8 HOUR, 2,  8),
('M-003', 'short shot',        'high',     CURDATE() - INTERVAL 14 DAY + INTERVAL 10 HOUR, 2, 15),
('M-003', 'warping',           'medium',   CURDATE() - INTERVAL 13 DAY + INTERVAL  9 HOUR, 2,  6),
('M-004', 'flash',             'low',      CURDATE() - INTERVAL 14 DAY + INTERVAL 15 HOUR, 2,  4),
('M-005', 'crack',             'high',     CURDATE() - INTERVAL 13 DAY + INTERVAL 12 HOUR, 4,  9),
('M-005', 'deformation',       'medium',   CURDATE() - INTERVAL 12 DAY + INTERVAL 10 HOUR, 4,  5),
('M-006', 'electrical fault',  'critical', CURDATE() - INTERVAL 14 DAY + INTERVAL 16 HOUR, 5,  0),
('M-006', 'electrical fault',  'critical', CURDATE() - INTERVAL 11 DAY + INTERVAL 11 HOUR, 5,  0),
('M-007', 'misalignment',      'low',      CURDATE() - INTERVAL 14 DAY + INTERVAL 13 HOUR, 3,  2),
('M-007', 'misalignment',      'medium',   CURDATE() - INTERVAL 13 DAY + INTERVAL 14 HOUR, 3,  4),
('M-008', 'missing component', 'high',     CURDATE() - INTERVAL 13 DAY + INTERVAL 16 HOUR, 3, 11),
('M-008', 'missing component', 'medium',   CURDATE() - INTERVAL 12 DAY + INTERVAL  9 HOUR, 3,  7),
('M-009', 'paint run',         'low',      CURDATE() - INTERVAL 14 DAY + INTERVAL 11 HOUR, 6,  3),
('M-009', 'paint run',         'medium',   CURDATE() - INTERVAL 11 DAY + INTERVAL 13 HOUR, 6,  6),
('M-010', 'paint run',         'high',     CURDATE() - INTERVAL 13 DAY + INTERVAL 10 HOUR, 6, 12),
('M-011', 'weld porosity',     'medium',   CURDATE() - INTERVAL 14 DAY + INTERVAL  9 HOUR, 7,  5),
('M-011', 'weld porosity',     'high',     CURDATE() - INTERVAL 12 DAY + INTERVAL 11 HOUR, 7,  9),
('M-012', 'cracked weld',      'critical', CURDATE() - INTERVAL 13 DAY + INTERVAL 15 HOUR, 7,  0),
('M-001', 'tool wear',         'medium',   CURDATE() - INTERVAL 10 DAY + INTERVAL 10 HOUR, 1,  5),
('M-002', 'dimension off',     'medium',   CURDATE() - INTERVAL 10 DAY + INTERVAL 14 HOUR, 1,  6),
('M-004', 'flash',             'medium',   CURDATE() - INTERVAL  9 DAY + INTERVAL  9 HOUR, 2,  4),
('M-005', 'crack',             'medium',   CURDATE() - INTERVAL  8 DAY + INTERVAL 12 HOUR, 4,  7),
('M-007', 'misalignment',      'high',     CURDATE() - INTERVAL  7 DAY + INTERVAL 10 HOUR, 3, 10),
('M-008', 'missing component', 'low',      CURDATE() - INTERVAL  7 DAY + INTERVAL 11 HOUR, 3,  2),
('M-009', 'paint run',         'low',      CURDATE() - INTERVAL  7 DAY + INTERVAL 14 HOUR, 6,  3),
('M-011', 'weld porosity',     'medium',   CURDATE() - INTERVAL  7 DAY + INTERVAL  9 HOUR, 7,  5),
('M-001', 'surface scratch',   'low',      CURDATE() - INTERVAL  6 DAY + INTERVAL 10 HOUR, 1,  2),
('M-003', 'warping',           'high',     CURDATE() - INTERVAL  6 DAY + INTERVAL 11 HOUR, 2, 11),
('M-005', 'deformation',       'high',     CURDATE() - INTERVAL  5 DAY + INTERVAL 12 HOUR, 4,  8),
('M-007', 'misalignment',      'medium',   CURDATE() - INTERVAL  5 DAY + INTERVAL 13 HOUR, 3,  4),
('M-008', 'missing component', 'high',     CURDATE() - INTERVAL  4 DAY + INTERVAL  9 HOUR, 3,  9),
('M-011', 'weld porosity',     'critical', CURDATE() - INTERVAL  4 DAY + INTERVAL 10 HOUR, 7, 14),
('M-001', 'tool wear',         'low',      CURDATE() - INTERVAL  2 DAY + INTERVAL 11 HOUR, 1,  3),
('M-008', 'missing component', 'medium',   CURDATE() - INTERVAL  1 DAY + INTERVAL 12 HOUR, 3,  5),
('M-005', 'crack',             'high',     CURDATE()                   + INTERVAL  9 HOUR, 4,  6);

-- ============================================================
-- Shift records — relative to today
-- ============================================================
INSERT INTO shift_records (shift_date, shift_type, operator_name, machine_id, hours_worked) VALUES
(CURDATE() - INTERVAL 14 DAY,'morning','Alice Chen',  'M-001', 8.0),
(CURDATE() - INTERVAL 14 DAY,'evening','Bob Patel',   'M-001', 8.0),
(CURDATE() - INTERVAL 14 DAY,'morning','Carol Singh', 'M-002', 8.0),
(CURDATE() - INTERVAL 14 DAY,'night',  'Dan Wilson',  'M-002', 8.0),
(CURDATE() - INTERVAL 14 DAY,'morning','Eva Garcia',  'M-003', 6.5),
(CURDATE() - INTERVAL 14 DAY,'morning','Frank Lee',   'M-004', 8.0),
(CURDATE() - INTERVAL 14 DAY,'morning','Grace Kim',   'M-005', 8.0),
(CURDATE() - INTERVAL 14 DAY,'morning','Henry Brown', 'M-007', 8.0),
(CURDATE() - INTERVAL 14 DAY,'evening','Iris Walker', 'M-008', 8.0),
(CURDATE() - INTERVAL 14 DAY,'morning','Jack Davis',  'M-009', 7.5),
(CURDATE() - INTERVAL 13 DAY,'morning','Alice Chen',  'M-001', 8.0),
(CURDATE() - INTERVAL 13 DAY,'evening','Bob Patel',   'M-001', 8.0),
(CURDATE() - INTERVAL 13 DAY,'morning','Carol Singh', 'M-002', 8.0),
(CURDATE() - INTERVAL 13 DAY,'night',  'Dan Wilson',  'M-002', 7.0),
(CURDATE() - INTERVAL 13 DAY,'morning','Frank Lee',   'M-004', 8.0),
(CURDATE() - INTERVAL 13 DAY,'morning','Grace Kim',   'M-005', 8.0),
(CURDATE() - INTERVAL 13 DAY,'morning','Henry Brown', 'M-007', 8.0),
(CURDATE() - INTERVAL 13 DAY,'evening','Iris Walker', 'M-008', 8.0),
(CURDATE() - INTERVAL 13 DAY,'morning','Jack Davis',  'M-009', 8.0),
(CURDATE() - INTERVAL 13 DAY,'morning','Karen White', 'M-011', 7.5),
(CURDATE() - INTERVAL 10 DAY,'morning','Alice Chen',  'M-001', 8.0),
(CURDATE() - INTERVAL 10 DAY,'morning','Carol Singh', 'M-002', 8.0),
(CURDATE() - INTERVAL 10 DAY,'morning','Frank Lee',   'M-004', 8.0),
(CURDATE() - INTERVAL 10 DAY,'morning','Grace Kim',   'M-005', 8.0),
(CURDATE() - INTERVAL 10 DAY,'morning','Henry Brown', 'M-007', 8.0),
(CURDATE() - INTERVAL 10 DAY,'evening','Iris Walker', 'M-008', 8.0),
(CURDATE() - INTERVAL 10 DAY,'morning','Jack Davis',  'M-009', 8.0),
(CURDATE() - INTERVAL 10 DAY,'morning','Karen White', 'M-011', 8.0),
(CURDATE() - INTERVAL  7 DAY,'morning','Alice Chen',  'M-001', 8.0),
(CURDATE() - INTERVAL  7 DAY,'morning','Carol Singh', 'M-002', 8.0),
(CURDATE() - INTERVAL  7 DAY,'morning','Frank Lee',   'M-004', 8.0),
(CURDATE() - INTERVAL  7 DAY,'morning','Grace Kim',   'M-005', 8.0),
(CURDATE() - INTERVAL  7 DAY,'morning','Henry Brown', 'M-007', 8.0),
(CURDATE() - INTERVAL  7 DAY,'evening','Iris Walker', 'M-008', 8.0),
(CURDATE() - INTERVAL  4 DAY,'morning','Alice Chen',  'M-001', 8.0),
(CURDATE() - INTERVAL  4 DAY,'morning','Carol Singh', 'M-002', 8.0),
(CURDATE() - INTERVAL  2 DAY,'morning','Frank Lee',   'M-004', 8.0),
(CURDATE() - INTERVAL  2 DAY,'morning','Grace Kim',   'M-005', 8.0),
(CURDATE(),                  'morning','Alice Chen',  'M-001', 8.0),
(CURDATE(),                  'morning','Carol Singh', 'M-002', 8.0);
