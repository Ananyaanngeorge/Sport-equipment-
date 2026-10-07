package com.example.sports.repository;

import com.example.sports.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Student entity.
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    // Find student by email to enforce uniqueness
    Optional<Student> findByEmail(String email);

    // Check if email already exists
    boolean existsByEmail(String email);

    // Search students by name or department or email
    List<Student> findByFullNameContainingIgnoreCaseOrDepartmentContainingIgnoreCase(String fullName, String department);
}
