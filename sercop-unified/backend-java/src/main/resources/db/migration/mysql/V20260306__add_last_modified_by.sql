-- Add last_modified_by tracking to department plans
ALTER TABLE cp_paa_department_plan
  ADD COLUMN last_modified_by VARCHAR(100),
  ADD COLUMN last_modified_by_name VARCHAR(200);
