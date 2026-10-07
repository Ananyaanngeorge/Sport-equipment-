package com.example.sports.service;

import com.example.sports.dto.DashboardResponse;
import com.example.sports.entity.Equipment;
import com.example.sports.entity.Issue;
import com.example.sports.repository.EquipmentRepository;
import com.example.sports.repository.IssueRepository;
import com.example.sports.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service calculating dynamic statistics for the Dashboard screen.
 * All figures are derived live from MySQL tables.
 */
@Service
public class DashboardService {

    private final EquipmentRepository equipmentRepository;
    private final StudentRepository studentRepository;
    private final IssueRepository issueRepository;

    public DashboardService(EquipmentRepository equipmentRepository, StudentRepository studentRepository, IssueRepository issueRepository) {
        this.equipmentRepository = equipmentRepository;
        this.studentRepository = studentRepository;
        this.issueRepository = issueRepository;
    }

    public DashboardResponse getDashboardData() {
        List<Equipment> allEquipment = equipmentRepository.findAll();

        long totalTypes = allEquipment.size();
        long totalQuantity = allEquipment.stream().mapToLong(Equipment::getTotalQuantity).sum();
        long availableQuantity = allEquipment.stream().mapToLong(Equipment::getAvailableQuantity).sum();
        long issuedQuantity = issueRepository.countCurrentlyIssuedQuantity();
        long registeredStudents = studentRepository.count();

        List<Issue> recentTransactions = issueRepository.findTop5ByOrderByIdDesc();

        return new DashboardResponse(
                totalTypes,
                totalQuantity,
                availableQuantity,
                issuedQuantity,
                registeredStudents,
                recentTransactions,
                allEquipment
        );
    }
}
