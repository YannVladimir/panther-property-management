-- Now that hr.employees exists (V6), retrofit real FK constraints onto the plain-Long
-- columns Phases 4 and 5 used as placeholders (payroll_records.employee_id,
-- preventive_tasks.assigned_staff_id) — see BACKEND_PLAN.md section 9, decision on
-- loose coupling before a referenced domain exists.
--
-- Added NOT VALID: this enforces the constraint for all future writes without requiring
-- every pre-existing row to already reference a valid employee (safe to run against a
-- database that already has payroll/preventive-task rows predating this migration).
-- Run VALIDATE CONSTRAINT once historical data has been reconciled, if ever needed.

ALTER TABLE payroll_records
    ADD CONSTRAINT fk_payroll_records_employee
    FOREIGN KEY (employee_id) REFERENCES employees (id) NOT VALID;

ALTER TABLE preventive_tasks
    ADD CONSTRAINT fk_preventive_tasks_staff
    FOREIGN KEY (assigned_staff_id) REFERENCES employees (id) NOT VALID;
