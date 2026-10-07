package com.example.sports.controller;

import com.example.sports.entity.Equipment;
import com.example.sports.service.EquipmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Equipment endpoints.
 * Base URL: /api/equipment
 */
@RestController
@RequestMapping("/api/equipment")
@CrossOrigin(origins = "*") // Allows API calls from Swing client or external clients
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    // GET /api/equipment (with optional ?category=Outdoor&search=ball)
    @GetMapping
    public ResponseEntity<List<Equipment>> getAllEquipment(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(equipmentService.getAllEquipment(category, search));
    }

    // GET /api/equipment/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Equipment> getEquipmentById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.getEquipmentById(id));
    }

    // POST /api/equipment
    @PostMapping
    public ResponseEntity<Equipment> createEquipment(@Valid @RequestBody Equipment equipment) {
        Equipment created = equipmentService.createEquipment(equipment);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // PUT /api/equipment/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Equipment> updateEquipment(@PathVariable Long id, @Valid @RequestBody Equipment equipment) {
        Equipment updated = equipmentService.updateEquipment(id, equipment);
        return ResponseEntity.ok(updated);
    }

    // DELETE /api/equipment/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEquipment(@PathVariable Long id) {
        equipmentService.deleteEquipment(id);
        return ResponseEntity.noContent().build();
    }
}
