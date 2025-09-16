-- AimHelper Pro: Database Migration to Inches/360
-- This script migrates the database from cm/360 to inches/360

-- Start transaction
BEGIN;

-- Add new inches_per_360 columns
ALTER TABLE test_results ADD COLUMN inches_per_360 REAL;
ALTER TABLE user_optimization ADD COLUMN recommended_inches_per_360 REAL;

-- Migrate existing cm/360 data to inches/360
-- Formula: inches = cm / 2.54
UPDATE test_results
SET inches_per_360 = cm_per_360 / 2.54
WHERE cm_per_360 IS NOT NULL;

UPDATE user_optimization
SET recommended_inches_per_360 = recommended_cm_per_360 / 2.54
WHERE recommended_cm_per_360 IS NOT NULL;

-- Create backup table for safety
CREATE TABLE test_results_backup AS SELECT * FROM test_results;
CREATE TABLE user_optimization_backup AS SELECT * FROM user_optimization;

-- Drop old cm/360 columns (uncomment after verification)
-- ALTER TABLE test_results DROP COLUMN cm_per_360;
-- ALTER TABLE user_optimization DROP COLUMN recommended_cm_per_360;

-- Rename new columns to match application expectations
-- ALTER TABLE test_results RENAME COLUMN inches_per_360 TO cm_per_360;
-- ALTER TABLE user_optimization RENAME COLUMN recommended_inches_per_360 TO recommended_cm_per_360;

COMMIT;

-- Verification queries
SELECT 'Migration completed. Verify data:' as status;
SELECT COUNT(*) as total_test_results FROM test_results;
SELECT COUNT(*) as migrated_test_results FROM test_results WHERE inches_per_360 IS NOT NULL;
SELECT COUNT(*) as total_optimizations FROM user_optimization;
SELECT COUNT(*) as migrated_optimizations FROM user_optimization WHERE recommended_inches_per_360 IS NOT NULL;

-- Sample data check
SELECT
    test_type,
    cm_per_360 as old_cm,
    inches_per_360 as new_inches,
    (cm_per_360 / 2.54) as calculated_inches
FROM test_results
WHERE cm_per_360 IS NOT NULL
LIMIT 5;