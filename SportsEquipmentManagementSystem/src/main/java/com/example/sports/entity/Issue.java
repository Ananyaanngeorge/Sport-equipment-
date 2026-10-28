package com.example.sports.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * ============================================================================
 * Issue Entity: Represents equipment checkout and return transactions.
 * Table: issue
 * 
 * Features late return fine management:
 * - Overdue rate: ₹5.00 per day after expectedReturnDate.
 * - Tracks fineAmount, finePaid status, and dynamic fine calculation.
 * ============================================================================
 */
@Entity
@Table(name = "issue")
public class Issue {

    // Overdue fine policy: ₹5 per day late
    public static final double FINE_RATE_PER_DAY = 5.0;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many issues can be made by one student
    @NotNull(message = "Student is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    // Many issues can involve one equipment item
    @NotNull(message = "Equipment is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Column(nullable = false)
    private Integer quantity;

    @NotNull(message = "Issue date is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    // Due date for returning equipment (defaults to issueDate + 7 days)
    @NotNull(message = "Expected return date is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @Column(name = "expected_return_date", nullable = false)
    private LocalDate expectedReturnDate;

    // Actual date when student returned the equipment
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @Column(name = "return_date")
    private LocalDate returnDate;

    // Status: "ISSUED" or "RETURNED"
    @Column(nullable = false, length = 20)
    private String status = "ISSUED";

    // Late Return Fine: ₹5 per day overdue
    @Column(name = "fine_amount", nullable = false)
    private Double fineAmount = 0.0;

    // Fine Payment Status: true if fine paid or no fine, false if fine unpaid
    @Column(name = "fine_paid", nullable = false)
    private Boolean finePaid = false;

    // Default constructor
    public Issue() {
    }

    // Parameterized constructor
    public Issue(Student student, Equipment equipment, Integer quantity, LocalDate issueDate, LocalDate expectedReturnDate, String status) {
        this.student = student;
        this.equipment = equipment;
        this.quantity = quantity;
        this.issueDate = issueDate;
        this.expectedReturnDate = expectedReturnDate;
        this.status = status;
        this.fineAmount = 0.0;
        this.finePaid = false;
    }

    // =========================================================================
    // FINE CALCULATION BUSINESS METHODS (₹5 per day overdue)
    // =========================================================================

    /**
     * Calculates the number of days overdue based on expected return date.
     * If returned, compares returnDate with expectedReturnDate.
     * If still ISSUED, compares today with expectedReturnDate.
     */
    public long getDaysOverdue() {
        if (expectedReturnDate == null) {
            return 0;
        }
        LocalDate compareDate = returnDate != null ? returnDate : LocalDate.now();
        if (compareDate.isAfter(expectedReturnDate)) {
            return ChronoUnit.DAYS.between(expectedReturnDate, compareDate);
        }
        return 0;
    }

    /**
     * Checks if this issue is currently delayed/overdue.
     */
    public boolean isOverdue() {
        return getDaysOverdue() > 0;
    }

    /**
     * Calculates the overdue fine amount in Rupees (₹5 per day).
     * Formula: days overdue * ₹5.00
     */
    public double calculateFine() {
        long days = getDaysOverdue();
        return days > 0 ? days * FINE_RATE_PER_DAY : 0.0;
    }

    // =========================================================================
    // GETTERS AND SETTERS
    // =========================================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Equipment getEquipment() {
        return equipment;
    }

    public void setEquipment(Equipment equipment) {
        this.equipment = equipment;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getExpectedReturnDate() {
        return expectedReturnDate;
    }

    public void setExpectedReturnDate(LocalDate expectedReturnDate) {
        this.expectedReturnDate = expectedReturnDate;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getFineAmount() {
        return fineAmount;
    }

    public void setFineAmount(Double fineAmount) {
        this.fineAmount = fineAmount;
    }

    public Boolean getFinePaid() {
        return finePaid;
    }

    public void setFinePaid(Boolean finePaid) {
        this.finePaid = finePaid;
    }
}
