-- =======================================================
-- Sports Equipment Management System
-- Optional Sample Initial Data Script
-- =======================================================

INSERT IGNORE INTO equipment (id, name, category, total_quantity, available_quantity, description) VALUES
(1, 'Football', 'Outdoor', 15, 12, 'Official size 5 match footballs for tournament & practice'),
(2, 'Basketball', 'Outdoor', 10, 8, 'Spalding composite leather standard basketballs'),
(3, 'Volleyball', 'Outdoor', 12, 10, 'Mikasa soft touch indoor/outdoor volleyballs'),
(4, 'Badminton Racket', 'Indoor', 20, 16, 'Yonex carbon fiber lightweight rackets with covers'),
(5, 'Cricket Bat', 'Outdoor', 8, 7, 'English willow full-size bats for college cricket team'),
(6, 'Yoga Mat', 'Fitness', 25, 23, 'High-density anti-tear non-slip exercise mats');

INSERT IGNORE INTO student (id, full_name, email, phone, department, class_semester) VALUES
(1, 'Aarav Sharma', 'aarav.sharma@college.edu', '9876543210', 'Computer Science Engineering', 'Semester 2'),
(2, 'Diya Patel', 'diya.patel@college.edu', '9876543211', 'Information Technology', 'Semester 2'),
(3, 'Rohan Verma', 'rohan.verma@college.edu', '9876543212', 'Electronics & Comm.', 'Semester 4');

INSERT IGNORE INTO issue (id, student_id, equipment_id, quantity, issue_date, return_date, status) VALUES
(1, 1, 1, 2, CURDATE(), NULL, 'ISSUED'),
(2, 2, 4, 2, CURDATE(), NULL, 'ISSUED'),
(3, 3, 2, 1, CURDATE(), NULL, 'ISSUED');
