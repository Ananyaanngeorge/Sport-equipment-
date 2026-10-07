package com.example.sports.service;

import com.example.sports.entity.Equipment;
import com.example.sports.exception.BadRequestException;
import com.example.sports.exception.ResourceNotFoundException;
import com.example.sports.repository.EquipmentRepository;
import com.example.sports.repository.IssueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service handling Equipment business logic.
 */
@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final IssueRepository issueRepository;

    // Constructor injection (Best practice for Spring)
    public EquipmentService(EquipmentRepository equipmentRepository, IssueRepository issueRepository) {
        this.equipmentRepository = equipmentRepository;
        this.issueRepository = issueRepository;
    }

    // Retrieve all equipment, with optional filtering by category and search keyword
    public List<Equipment> getAllEquipment(String category, String search) {
        boolean hasCategory = category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("All");
        boolean hasSearch = search != null && !search.trim().isEmpty();

        if (hasCategory && hasSearch) {
            return equipmentRepository.findByCategoryIgnoreCaseAndNameContainingIgnoreCase(category.trim(), search.trim());
        } else if (hasCategory) {
            return equipmentRepository.findByCategoryIgnoreCase(category.trim());
        } else if (hasSearch) {
            return equipmentRepository.findByNameContainingIgnoreCase(search.trim());
        }
        return equipmentRepository.findAll();
    }

    // Retrieve single equipment by ID
    public Equipment getEquipmentById(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with ID: " + id));
    }

    // Add new equipment (initial available quantity matches total quantity)
    @Transactional
    public Equipment createEquipment(Equipment equipment) {
        if (equipment.getName() == null || equipment.getName().trim().isEmpty()) {
            throw new BadRequestException("Equipment name cannot be empty.");
        }
        if (equipment.getCategory() == null || equipment.getCategory().trim().isEmpty()) {
            throw new BadRequestException("Category must be selected.");
        }
        if (equipment.getTotalQuantity() == null || equipment.getTotalQuantity() <= 0) {
            throw new BadRequestException("Quantity must be greater than zero.");
        }

        // Available quantity must initially equal total quantity
        equipment.setAvailableQuantity(equipment.getTotalQuantity());
        return equipmentRepository.save(equipment);
    }

    // Update existing equipment
    @Transactional
    public Equipment updateEquipment(Long id, Equipment updated) {
        Equipment existing = getEquipmentById(id);

        if (updated.getName() == null || updated.getName().trim().isEmpty()) {
            throw new BadRequestException("Equipment name cannot be empty.");
        }
        if (updated.getTotalQuantity() == null || updated.getTotalQuantity() <= 0) {
            throw new BadRequestException("Total quantity must be greater than zero.");
        }

        int currentlyIssued = existing.getTotalQuantity() - existing.getAvailableQuantity();
        if (updated.getTotalQuantity() < currentlyIssued) {
            throw new BadRequestException("New total quantity cannot be less than currently issued items (" + currentlyIssued + ").");
        }

        existing.setName(updated.getName().trim());
        existing.setCategory(updated.getCategory());
        existing.setDescription(updated.getDescription());
        existing.setTotalQuantity(updated.getTotalQuantity());

        // Support direct adjustment of available quantity (e.g. adding or removing availability)
        if (updated.getAvailableQuantity() != null) {
            if (updated.getAvailableQuantity() < 0) {
                throw new BadRequestException("Available quantity cannot be negative.");
            }
            if (updated.getAvailableQuantity() > updated.getTotalQuantity()) {
                throw new BadRequestException("Available quantity cannot exceed total quantity (" + updated.getTotalQuantity() + ").");
            }
            int maxAllowed = updated.getTotalQuantity() - currentlyIssued;
            if (updated.getAvailableQuantity() > maxAllowed) {
                throw new BadRequestException("Available quantity cannot exceed " + maxAllowed + " because " + currentlyIssued + " unit(s) are currently issued.");
            }
            existing.setAvailableQuantity(updated.getAvailableQuantity());
        } else {
            existing.setAvailableQuantity(updated.getTotalQuantity() - currentlyIssued);
        }

        return equipmentRepository.save(existing);
    }

    // Delete equipment (only permitted if no active issues exist)
    @Transactional
    public void deleteEquipment(Long id) {
        Equipment equipment = getEquipmentById(id);

        boolean hasActiveIssues = issueRepository.existsByEquipmentAndStatus(equipment, "ISSUED");
        if (hasActiveIssues) {
            throw new BadRequestException("Cannot delete equipment because it is currently issued.");
        }

        equipmentRepository.delete(equipment);
    }
}
