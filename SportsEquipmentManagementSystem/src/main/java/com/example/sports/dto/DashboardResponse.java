package com.example.sports.dto;

import com.example.sports.entity.Equipment;
import com.example.sports.entity.Issue;
import java.util.List;

/**
 * Data Transfer Object (DTO) for returning aggregated Dashboard statistics.
 */
public class DashboardResponse {

    private long totalEquipmentTypes;
    private long totalEquipmentQuantity;
    private long availableQuantity;
    private long currentlyIssuedQuantity;
    private long registeredStudents;
    private List<Issue> recentTransactions;
    private List<Equipment> inventorySummary;

    public DashboardResponse() {
    }

    public DashboardResponse(long totalEquipmentTypes, long totalEquipmentQuantity, long availableQuantity,
                             long currentlyIssuedQuantity, long registeredStudents,
                             List<Issue> recentTransactions, List<Equipment> inventorySummary) {
        this.totalEquipmentTypes = totalEquipmentTypes;
        this.totalEquipmentQuantity = totalEquipmentQuantity;
        this.availableQuantity = availableQuantity;
        this.currentlyIssuedQuantity = currentlyIssuedQuantity;
        this.registeredStudents = registeredStudents;
        this.recentTransactions = recentTransactions;
        this.inventorySummary = inventorySummary;
    }

    public long getTotalEquipmentTypes() {
        return totalEquipmentTypes;
    }

    public void setTotalEquipmentTypes(long totalEquipmentTypes) {
        this.totalEquipmentTypes = totalEquipmentTypes;
    }

    public long getTotalEquipmentQuantity() {
        return totalEquipmentQuantity;
    }

    public void setTotalEquipmentQuantity(long totalEquipmentQuantity) {
        this.totalEquipmentQuantity = totalEquipmentQuantity;
    }

    public long getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(long availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public long getCurrentlyIssuedQuantity() {
        return currentlyIssuedQuantity;
    }

    public void setCurrentlyIssuedQuantity(long currentlyIssuedQuantity) {
        this.currentlyIssuedQuantity = currentlyIssuedQuantity;
    }

    public long getRegisteredStudents() {
        return registeredStudents;
    }

    public void setRegisteredStudents(long registeredStudents) {
        this.registeredStudents = registeredStudents;
    }

    public List<Issue> getRecentTransactions() {
        return recentTransactions;
    }

    public void setRecentTransactions(List<Issue> recentTransactions) {
        this.recentTransactions = recentTransactions;
    }

    public List<Equipment> getInventorySummary() {
        return inventorySummary;
    }

    public void setInventorySummary(List<Equipment> inventorySummary) {
        this.inventorySummary = inventorySummary;
    }
}
