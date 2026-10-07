package com.example.sports.repository;

import com.example.sports.entity.Equipment;
import com.example.sports.entity.Issue;
import com.example.sports.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repository interface for Issue transactions.
 */
@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {

    // Find all issues with specific status (e.g., "ISSUED")
    List<Issue> findByStatusOrderByIssueDateDesc(String status);

    // Find all issues ordered by ID descending
    List<Issue> findAllByOrderByIdDesc();

    // Find issues for a particular student
    List<Issue> findByStudent(Student student);

    // Check if there are active (ISSUED) borrowings for a student
    boolean existsByStudentAndStatus(Student student, String status);

    // Check if there are active (ISSUED) borrowings for an equipment
    boolean existsByEquipmentAndStatus(Equipment equipment, String status);

    // Sum currently issued quantities
    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM Issue i WHERE i.status = 'ISSUED'")
    long countCurrentlyIssuedQuantity();

    // Top recent transactions for dashboard
    List<Issue> findTop5ByOrderByIdDesc();
}
