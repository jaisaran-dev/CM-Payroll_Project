
CREATE DATABASE IF NOT EXISTS payroll_db;

USE payroll_db;

-- 1. EMPLOYEES

CREATE TABLE employees (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    work_mode VARCHAR(20) NOT NULL,
    salary_type VARCHAR(20) NOT NULL,
    salary_amount DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_work_mode
        CHECK (work_mode IN ('WFH', 'OFFICE', 'ON_SITE')),

    CONSTRAINT chk_salary_type
        CHECK (salary_type IN ('MONTHLY', 'DAILY')),

    CONSTRAINT chk_salary_amount
        CHECK (salary_amount > 0)
);

-- 2. USERS

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    system_role VARCHAR(20) NOT NULL,
    employee_id BIGINT UNIQUE NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_system_role
        CHECK (system_role IN ('ADMIN', 'EMPLOYEE')),

    CONSTRAINT fk_user_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_user_employee_link
        CHECK (
            (system_role = 'ADMIN' AND employee_id IS NULL)
            OR
            (system_role = 'EMPLOYEE' AND employee_id IS NOT NULL)
        )
);

-- 3. ATTENDANCE

CREATE TABLE attendance (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    remarks VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_attendance_status
        CHECK (status IN ('PRESENT', 'ABSENT')),

    CONSTRAINT fk_attendance_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_employee_attendance_date
        UNIQUE (employee_id, attendance_date),

    INDEX idx_attendance_date (attendance_date)
);

-- 4. PAYROLL PAYMENT TRANSACTIONS

CREATE TABLE payroll_payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    payroll_month TINYINT NOT NULL,
    payroll_year SMALLINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    paid_on DATE NOT NULL,
    paid_at DATETIME(6) NULL,
    paid_by_user_id BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_payroll_month
        CHECK (payroll_month BETWEEN 1 AND 12),

    CONSTRAINT chk_payroll_payment_amount
        CHECK (amount > 0),

    CONSTRAINT fk_payroll_payment_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payroll_payment_paid_by
        FOREIGN KEY (paid_by_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    INDEX idx_payroll_payment_period_employee
        (payroll_year, payroll_month, employee_id),

    INDEX idx_payroll_payment_employee_history
        (employee_id, id)
);

-- 5. LEAVES

CREATE TABLE leaves (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME NULL,

    CONSTRAINT chk_leave_status
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),

    CONSTRAINT chk_leave_dates
        CHECK (end_date >= start_date),

    CONSTRAINT fk_leave_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE RESTRICT,

    INDEX idx_leave_employee (employee_id)
);
