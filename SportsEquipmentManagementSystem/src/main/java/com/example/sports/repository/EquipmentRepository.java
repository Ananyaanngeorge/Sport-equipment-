package com.example.sports.repository;

import com.example.sports.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repository interface for Equipment entity.
 * Provides ready-made CRUD methods and custom query methods through Spring Data JPA.
 */
@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    // Search equipment by name containing keyword (case-insensitive)
    List<Equipment> findByNameContainingIgnoreCase(String name);

    // Filter equipment by specific category
    List<Equipment> findByCategoryIgnoreCase(String category);

    // Search by both category and name keyword
    List<Equipment> findByCategoryIgnoreCaseAndNameContainingIgnoreCase(String category, String name);
}
