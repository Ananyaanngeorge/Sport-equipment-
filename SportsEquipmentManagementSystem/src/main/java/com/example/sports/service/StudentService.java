package com.example.sports.service;

import com.example.sports.entity.Student;
import com.example.sports.exception.BadRequestException;
import com.example.sports.exception.ResourceNotFoundException;
import com.example.sports.repository.IssueRepository;
import com.example.sports.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service handling Student registration and management logic.
 */
@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final IssueRepository issueRepository;

    public StudentService(StudentRepository studentRepository, IssueRepository issueRepository) {
        this.studentRepository = studentRepository;
        this.issueRepository = issueRepository;
    }

    public List<Student> getAllStudents(String search) {
        if (search != null && !search.trim().isEmpty()) {
            return studentRepository.findByFullNameContainingIgnoreCaseOrDepartmentContainingIgnoreCase(search.trim(), search.trim());
        }
        return studentRepository.findAll();
    }

    public Student getStudentById(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));
    }

    @Transactional
    public Student createStudent(Student student) {
        validateStudentFields(student);

        if (studentRepository.existsByEmail(student.getEmail().trim().toLowerCase())) {
            throw new BadRequestException("Email already exists: " + student.getEmail());
        }

        student.setEmail(student.getEmail().trim().toLowerCase());
        student.setFullName(student.getFullName().trim());
        return studentRepository.save(student);
    }

    @Transactional
    public Student updateStudent(Long id, Student updated) {
        Student existing = getStudentById(id);
        validateStudentFields(updated);

        String newEmail = updated.getEmail().trim().toLowerCase();
        Optional<Student> emailOwner = studentRepository.findByEmail(newEmail);
        if (emailOwner.isPresent() && !emailOwner.get().getId().equals(id)) {
            throw new BadRequestException("Email is already used by another student: " + newEmail);
        }

        existing.setFullName(updated.getFullName().trim());
        existing.setEmail(newEmail);
        existing.setPhone(updated.getPhone().trim());
        existing.setDepartment(updated.getDepartment().trim());
        existing.setClassSemester(updated.getClassSemester().trim());

        return studentRepository.save(existing);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = getStudentById(id);

        boolean hasActiveIssues = issueRepository.existsByStudentAndStatus(student, "ISSUED");
        if (hasActiveIssues) {
            throw new BadRequestException("Cannot delete student with active issues.");
        }

        studentRepository.delete(student);
    }

    private void validateStudentFields(Student student) {
        if (student.getFullName() == null || student.getFullName().trim().isEmpty()) {
            throw new BadRequestException("Full name is required.");
        }
        if (student.getEmail() == null || student.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email is required.");
        }
        if (!student.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new BadRequestException("Invalid email format.");
        }
        if (student.getPhone() == null || student.getPhone().trim().isEmpty()) {
            throw new BadRequestException("Phone number is required.");
        }
        if (student.getDepartment() == null || student.getDepartment().trim().isEmpty()) {
            throw new BadRequestException("Department is required.");
        }
        if (student.getClassSemester() == null || student.getClassSemester().trim().isEmpty()) {
            throw new BadRequestException("Class/Semester is required.");
        }
    }
}
