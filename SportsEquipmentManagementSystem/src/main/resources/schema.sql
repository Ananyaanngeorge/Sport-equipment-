-- =======================================================
-- Sports Equipment Management System
-- MySQL Database Creation Script
-- Suitable for running in MySQL Workbench
-- =======================================================

CREATE DATABASE IF NOT EXISTS sports_equipment_db;
USE sports_equipment_db;

-- 1. Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    total_quantity INT NOT NULL,
    available_quantity INT NOT NULL,
    description TEXT,
    CONSTRAINT chk_quantities CHECK (total_quantity > 0 AND available_quantity >= 0 AND available_quantity <= total_quantity)
);

-- 2. Student Table
CREATE TABLE IF NOT EXISTS student (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    department VARCHAR(100) NOT NULL,
    class_semester VARCHAR(50) NOT NULL
);

-- 3. Issue Table (Foreign keys referencing student and equipment)
CREATE TABLE IF NOT EXISTS issue (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    equipment_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    issue_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
    CONSTRAINT fk_issue_student FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE RESTRICT,
    CONSTRAINT fk_issue_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT
);
