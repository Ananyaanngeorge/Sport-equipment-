package com.example.sports.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * DTO received when creating a new equipment issue.
 */
public class IssueRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Equipment ID is required")
    private Long equipmentId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be greater than zero")
    private Integer quantity;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate issueDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate expectedReturnDate;

    public IssueRequest() {
    }

    public IssueRequest(Long studentId, Long equipmentId, Integer quantity, LocalDate issueDate) {
        this(studentId, equipmentId, quantity, issueDate, issueDate != null ? issueDate.plusDays(7) : LocalDate.now().plusDays(7));
    }

    public IssueRequest(Long studentId, Long equipmentId, Integer quantity, LocalDate issueDate, LocalDate expectedReturnDate) {
        this.studentId = studentId;
        this.equipmentId = equipmentId;
        this.quantity = quantity;
        this.issueDate = issueDate;
        this.expectedReturnDate = expectedReturnDate;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getEquipmentId() {
        return equipmentId;
    }

    public void setEquipmentId(Long equipmentId) {
        this.equipmentId = equipmentId;
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
}
