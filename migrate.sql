-- =============================================================
-- Non-destructive migration
--   1. Adds query_log.chart_type if missing
--   2. Shifts manufacturing time-series dates forward so the
--      most recent row is "today" — preserves relative spacing
--      between rows, preserves query_log, preserves users
-- Safe to run multiple times (becomes a no-op once aligned).
-- =============================================================
USE analytics_db;

-- -------------------------------------------------------------
-- 1) Add chart_type column to query_log if it doesn't exist
-- -------------------------------------------------------------
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'analytics_db'
    AND TABLE_NAME   = 'query_log'
    AND COLUMN_NAME  = 'chart_type'
);
SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE query_log ADD COLUMN chart_type VARCHAR(20)',
    'SELECT ''chart_type column already present'' AS info');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -------------------------------------------------------------
-- 2) Shift manufacturing dates forward
--    offset = today - (latest existing shift_date)
-- -------------------------------------------------------------
SET @latest := (SELECT MAX(shift_date) FROM units_produced);
SET @offset := DATEDIFF(CURDATE(), @latest);

UPDATE units_produced
   SET shift_date = shift_date + INTERVAL @offset DAY
 WHERE @offset IS NOT NULL AND @offset <> 0;

UPDATE defect_logs
   SET detected_at = detected_at + INTERVAL @offset DAY
 WHERE @offset IS NOT NULL AND @offset <> 0;

UPDATE shift_records
   SET shift_date = shift_date + INTERVAL @offset DAY
 WHERE @offset IS NOT NULL AND @offset <> 0;

UPDATE machine_status
   SET last_maintenance = last_maintenance + INTERVAL @offset DAY
 WHERE @offset IS NOT NULL AND @offset <> 0;

SELECT
  @offset AS days_shifted,
  (SELECT MAX(shift_date) FROM units_produced) AS new_latest_shift_date,
  CURDATE() AS today;
