package com.example.sports;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot Application Entry Point.
 * 
 * College Project: Sports Equipment Management System
 * Developed by: Team of 3 CSE Students
 * Tech Stack: Java 21, Spring Boot, Spring Data JPA, MySQL, Java Swing (REST Client)
 */
@SpringBootApplication
public class SportsEquipmentManagementSystemApplication {

    public static void main(String[] args) {
        // Allow desktop Swing UI and Spring Boot to coexist smoothly
        System.setProperty("java.awt.headless", "false");
        
        SpringApplication.run(SportsEquipmentManagementSystemApplication.class, args);
        
        System.out.println("==========================================================");
        System.out.println("  Sports Equipment Management System - Backend Started!   ");
        System.out.println("  Web Application UI:  http://localhost:8080/             ");
        System.out.println("  REST API running on: http://localhost:8080/api          ");
        System.out.println("  Connected to MySQL Database: sports_equipment_db        ");
        System.out.println("==========================================================");
    }
}
