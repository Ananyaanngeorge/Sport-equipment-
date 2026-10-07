package com.example.sports.service;

import com.example.sports.dto.IssueRequest;
import com.example.sports.entity.Equipment;
import com.example.sports.entity.Issue;
import com.example.sports.entity.Student;
import com.example.sports.exception.BadRequestException;
import com.example.sports.exception.ResourceNotFoundException;
import com.example.sports.repository.EquipmentRepository;
import com.example.sports.repository.IssueRepository;
import com.example.sports.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Service handling Issue and Return transactions.
 * Business logic is strictly centralized here and protected by @Transactional.
 */
@Service
public class IssueService {

    private final IssueRepository issueRepository;
    private final StudentRepository studentRepository;
    private final EquipmentRepository equipmentRepository;

    public IssueService(IssueRepository issueRepository, StudentRepository studentRepository, EquipmentRepository equipmentRepository) {
        this.issueRepository = issueRepository;
        this.studentRepository = studentRepository;
        this.equipmentRepository = equipmentRepository;
    }

    // Retrieve all issue records
    public List<Issue> getAllIssues() {
        return issueRepository.findAllByOrderByIdDesc();
    }

    // Retrieve active (currently ISSUED) records
    public List<Issue> getActiveIssues() {
        return issueRepository.findByStatusOrderByIssueDateDesc("ISSUED");
    }

    /**
     * Issues equipment to a student.
     * Enforces atomic transaction: updates stock and creates record together.
     */
    @Transactional
    public Issue issueEquipment(IssueRequest request) {
        // 1. Verify student exists
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + request.getStudentId()));

        // 2. Verify equipment exists
        Equipment equipment = equipmentRepository.findById(request.getEquipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with ID: " + request.getEquipmentId()));

        // 3. Verify quantity > 0
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new BadRequestException("Quantity must be greater than zero.");
        }

        // 4. Verify requested quantity <= available quantity
        if (request.getQuantity() > equipment.getAvailableQuantity()) {
            throw new BadRequestException("Insufficient equipment available. Available: " +
                    equipment.getAvailableQuantity() + ", Requested: " + request.getQuantity());
        }

        // 5. Create issue record
        Issue issue = new Issue();
        issue.setStudent(student);
        issue.setEquipment(equipment);
        issue.setQuantity(request.getQuantity());

        // 6. Set status to ISSUED
        issue.setStatus("ISSUED");

        // 7. Set issue date (use provided date or today)
        issue.setIssueDate(request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now());
        issue.setReturnDate(null);

        // 8. Decrease available quantity
        equipment.setAvailableQuantity(equipment.getAvailableQuantity() - request.getQuantity());
        equipmentRepository.save(equipment);

        // 9. Save issue record
        return issueRepository.save(issue);
    }

    /**
     * Returns previously issued equipment.
     * Increases available stock back in database.
     */
    @Transactional
    public Issue returnEquipment(Long issueId) {
        // 1. Find issue
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue record not found with ID: " + issueId));

        // 2. Verify it is currently ISSUED
        if (!"ISSUED".equalsIgnoreCase(issue.getStatus())) {
            throw new BadRequestException("Equipment has already been returned.");
        }

        Equipment equipment = issue.getEquipment();

        // 3. Change status to RETURNED
        issue.setStatus("RETURNED");

        // 4. Set return date
        issue.setReturnDate(LocalDate.now());

        // 5. Increase equipment available quantity
        equipment.setAvailableQuantity(equipment.getAvailableQuantity() + issue.getQuantity());

        // Ensure available cannot exceed total quantity due to any anomaly
        if (equipment.getAvailableQuantity() > equipment.getTotalQuantity()) {
            equipment.setAvailableQuantity(equipment.getTotalQuantity());
        }

        // 6. Save changes
        equipmentRepository.save(equipment);
        return issueRepository.save(issue);
    }
}
