# Sports Equipment Management System
### A Real-World College Web Application by a Team of 3 First-Year Computer Science Engineering Students

---

## 1. Project Title & Overview
**Project Title:** Sports Equipment Management System  
**Category:** College Laboratory & Course Project  
**Author:** Team of 3 CSE Students  
**Academic Target:** 1st Year B.Tech / B.E. Computer Science and Engineering  
**Architecture:** 3-Tier Enterprise Web Architecture:
- **Presentation Layer:** Responsive Browser-based Web Application (HTML5, CSS3, JavaScript ES6)
- **Application & Service Layer:** Spring Boot 3.2.5, REST APIs, Spring Data JPA / Hibernate
- **Persistence Layer:** MySQL Relational Database (`sports_equipment_db`)

The **Sports Equipment Management System** is a software solution designed for college sports departments, physical education directors, and gymkhana offices. It automates sports inventory registration, student borrowing requests, equipment issue tracking, automatic stock deduction, return processing, and real-time dashboard analytics.

---

## 2. Project Objective
1. **Eliminate Paper Logs:** Replace manual sports registers with a persistent, foreign-key relational database in MySQL.
2. **Prevent Loss and Over-Issuing:** Atomically check stock availability before issuing equipment so quantity cannot drop below zero.
3. **Strict Accountability:** Enforce student identity validation and disallow record deletion if students or equipment have active borrowings.
4. **Learn Real-World Architecture:** Gain hands-on understanding of enterprise 3-tier architecture:
   - Presentation: Responsive Web UI with Sidebar, Top Navigation, Modals, and Dashboard Cards
   - Service & Logic: Spring Boot & Spring Data JPA with `@Transactional`
   - Database: MySQL Relational Database with Foreign Key and CHECK constraints

---

## 3. Technologies Used

| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Language** | Java | 21 (LTS) | Modern Java language syntax, records, pattern matching |
| **Backend Framework** | Spring Boot | 3.2.5 | Enterprise REST API server, transaction control, static web host |
| **ORM / Data Access** | Spring Data JPA / Hibernate | 6.x | Automatic CRUD repositories, SQL generation, object mapping |
| **Database** | MySQL | 8.0+ | Relational database with Foreign Key and CHECK constraints |
| **Web Frontend** | HTML5, CSS3, JavaScript (ES6) | Modern Standard | Responsive browser-based dashboard UI (`src/main/resources/static/`) |
| **HTTP Communication** | REST API & Fetch API | JSON | Standard asynchronous communication between browser and Spring Boot |
| **JSON Parser** | Jackson (`jackson-databind`) | 2.15+ | JSON serialization and deserialization with JavaTimeModule |
| **Build Tool** | Apache Maven | 3.9+ | Dependency management and build packaging |
| **Recommended IDE** | IntelliJ IDEA Community / Ultimate | 2023+ | Running Spring Boot backend and editing code |
| **DB Administration**| MySQL Workbench | 8.0+ | Database inspection, query execution, table verification |

---

## 4. System Architecture

```text
+------------------------------------------------------------------+
|                    BROWSER-BASED WEB FRONTEND                    |
|  Responsive Web Dashboard (http://localhost:8080)                |
|  ├── Sidebar Navigation (Dashboard, Equipment, Students, Issues) |
|  ├── Top Navbar (Live Status, Quick Actions, Mobile Hamburger)   |
|  ├── Dashboard (5 KPI Cards, Dual Tables)                        |
|  ├── Equipment Management (CRUD, Search, Filter, Stock Alert)    |
|  ├── Student Management (Register, Search, Email Uniqueness)     |
|  ├── Issue Equipment Form (Auto-Stock Check, Date Picker)        |
|  └── Return Equipment Table (Return Action, Stock Replenish)     |
+------------------------------------------------------------------+
                                │
                                │ HTTP JSON REST API (Port 8080)
                                ▼
+------------------------------------------------------------------+
|                       SPRING BOOT BACKEND                        |
|                                                                  |
|  1. REST Controllers:                                            |
|     EquipmentController, StudentController, IssueController,     |
|     DashboardController                                          |
|                                                                  |
|  2. Service Layer (@Service & @Transactional):                   |
|     EquipmentService, StudentService, IssueService,              |
|     DashboardService                                             |
|                                                                  |
|  3. Exception Handler (@RestControllerAdvice):                   |
|     GlobalExceptionHandler (Returns friendly error JSON)         |
|                                                                  |
|  4. Data Access Layer (Spring Data JPA):                         |
|     EquipmentRepository, StudentRepository, IssueRepository      |
+------------------------------------------------------------------+
                                │
                                │ JDBC Driver (mysql-connector-j)
                                ▼
+------------------------------------------------------------------+
|                        MYSQL DATABASE                            |
|  Database: sports_equipment_db                                   |
|  ├── Table: equipment (id, name, category, total_qty, avail_qty) |
|  ├── Table: student   (id, full_name, email, phone, department)  |
|  └── Table: issue     (id, student_id, equipment_id, status)     |
+------------------------------------------------------------------+
```

---

## 5. Database Schema & Design

### 5.1 `equipment` Table
Stores inventory of sports goods.
```sql
CREATE TABLE equipment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    total_quantity INT NOT NULL,
    available_quantity INT NOT NULL,
    description TEXT,
    CONSTRAINT chk_quantities CHECK (
        total_quantity > 0 AND 
        available_quantity >= 0 AND 
        available_quantity <= total_quantity
    )
);
```

### 5.2 `student` Table
Stores registered students eligible to borrow equipment.
```sql
CREATE TABLE student (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    department VARCHAR(100) NOT NULL,
    class_semester VARCHAR(50) NOT NULL
);
```

### 5.3 `issue` Table
Maintains transaction ledger with Foreign Key integrity.
```sql
CREATE TABLE issue (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    equipment_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    issue_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
    CONSTRAINT fk_issue_student FOREIGN KEY (student_id) REFERENCES student(id),
    CONSTRAINT fk_issue_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);
```

---

## 6. Project Package Structure

```text
SportsEquipmentManagementSystem/
│
├── pom.xml
├── README.md
│
└── src/
    └── main/
        ├── resources/
        │   ├── application.properties
        │   ├── schema.sql
        │   ├── data.sql
        │   └── static/                              [Browser-based Web UI]
        │       ├── index.html                       [Responsive Single-Page Dashboard]
        │       ├── css/
        │       │   └── style.css                    [Responsive Layout & Color Themes]
        │       └── js/
        │           └── app.js                       [REST API Fetch & DOM Rendering]
        │
        └── java/
            └── com/example/sports/
                │
                ├── SportsEquipmentManagementSystemApplication.java   [Spring Boot Entry Point]
                │
                ├── entity/
                │   ├── Equipment.java                                [JPA Entity for Equipment]
                │   ├── Student.java                                  [JPA Entity for Student]
                │   └── Issue.java                                    [JPA Entity for Transactions]
                │
                ├── repository/
                │   ├── EquipmentRepository.java                      [Spring Data JPA for Equipment]
                │   ├── StudentRepository.java                        [Spring Data JPA for Students]
                │   └── IssueRepository.java                          [Spring Data JPA for Issues]
                │
                ├── service/
                │   ├── EquipmentService.java                         [Business Logic & Checks]
                │   ├── StudentService.java                           [Validation & Email Uniqueness]
                │   ├── IssueService.java                             [@Transactional Issue & Return]
                │   └── DashboardService.java                         [Dynamic Aggregate Metric Queries]
                │
                ├── controller/
                │   ├── EquipmentController.java                      [REST API: /api/equipment]
                │   ├── StudentController.java                        [REST API: /api/students]
                │   ├── IssueController.java                          [REST API: /api/issues]
                │   └── DashboardController.java                      [REST API: /api/dashboard]
                │
                ├── dto/
                │   ├── DashboardResponse.java                        [Dashboard Aggregates DTO]
                │   └── IssueRequest.java                             [Borrowing Payload DTO]
                │
                ├── exception/
                │   ├── ResourceNotFoundException.java                [404 Custom Exception]
                │   ├── BadRequestException.java                      [400 Custom Exception]
                │   └── GlobalExceptionHandler.java                   [Centralized JSON Error Mapper]
                │
                └── config/
                    └── DataInitializer.java                          [Seeds Sample Equipment & Students]
```

---

## 7. REST API Endpoints

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `GET` | `/api/dashboard` | Aggregated counts, top recent issues, inventory list | None | `DashboardResponse` |
| `GET` | `/api/equipment` | List equipment with optional `?category=` and `?search=` | None | `List<Equipment>` |
| `GET` | `/api/equipment/{id}` | Get single equipment by ID | None | `Equipment` |
| `POST` | `/api/equipment` | Create new equipment | `Equipment` | `201 Created` |
| `PUT` | `/api/equipment/{id}` | Update equipment details | `Equipment` | `Equipment` |
| `DELETE`| `/api/equipment/{id}` | Delete equipment (fails if active issues exist) | None | `204 No Content` |
| `GET` | `/api/students` | List students with optional `?search=` | None | `List<Student>` |
| `GET` | `/api/students/{id}` | Get single student by ID | None | `Student` |
| `POST` | `/api/students` | Register student (validates unique email) | `Student` | `201 Created` |
| `PUT` | `/api/students/{id}` | Update student details | `Student` | `Student` |
| `DELETE`| `/api/students/{id}` | Delete student (fails if active issues exist) | None | `204 No Content` |
| `GET` | `/api/issues` | Get all issue transactions | None | `List<Issue>` |
| `GET` | `/api/issues/active` | Get currently issued equipment | None | `List<Issue>` |
| `POST` | `/api/issues` | Borrow equipment | `IssueRequest` | `201 Created` |
| `PUT` | `/api/issues/{id}/return` | Mark equipment returned & replenish stock | None | `Issue` |

---

## 8. How to Setup and Run in IntelliJ IDEA & MySQL

### Step 1: Prepare MySQL Database
1. Open **MySQL Workbench**.
2. Run:
   ```sql
   CREATE DATABASE sports_equipment_db;
   ```
3. Hibernate automatically generates all tables upon startup, and `DataInitializer.java` populates initial sports equipment and demo students.

### Step 2: Configure MySQL Password
Open `src/main/resources/application.properties` and replace:
```properties
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### Step 3: Run Spring Boot in IntelliJ IDEA
1. Open the project folder `SportsEquipmentManagementSystem` in IntelliJ IDEA.
2. Select **Project SDK: Java 21**.
3. Locate `src/main/java/com/example/sports/SportsEquipmentManagementSystemApplication.java`.
4. Right-click and choose **Run 'SportsEquipmentManagementSystemApplication'**.
5. Console outputs:
   ```text
   Sports Equipment Management System - Backend Started!
   REST API running on: http://localhost:8080/api
   Web Application served at: http://localhost:8080/
   ```

### Step 4: Open Browser
Open your browser at:
```text
http://localhost:8080/
```
The full, modern, responsive web application will load immediately!

---

## 9. Viva Voce Examiner Questions & Answers

**Q1: Why did you build this as a 3-tier architecture with REST APIs instead of directly calling JDBC from the frontend?**  
*Answer:* A 3-tier architecture decouples presentation from data storage. Database credentials remain safe on the server side, transactions and validations (@Transactional, unique emails, stock decrement) are enforced centrally, and multiple clients (web, desktop, or mobile) can interact with the same backend without modifying database code.

**Q2: What is the significance of `@Transactional` in `IssueService.java`?**  
*Answer:* Issuing equipment requires two atomic operations: decrementing stock in `equipment` and inserting a record into `issue`. `@Transactional` guarantees ACID properties: if either fails, all changes roll back, preventing phantom borrowings or incorrect stock numbers.

**Q3: How does Spring Data JPA create database queries without writing SQL?**  
*Answer:* Spring Data JPA inspects repository method signatures (such as `findByCategoryIgnoreCaseAndNameContainingIgnoreCase`) and generates JPQL queries and parameterized SQL at runtime using dynamic proxies.

---
**Academic Project Submission | CSE Department**
