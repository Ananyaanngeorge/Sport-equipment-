package com.example.sports.controller;

import com.example.sports.dto.IssueRequest;
import com.example.sports.entity.Issue;
import com.example.sports.service.IssueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Issue & Return transactions.
 * Base URL: /api/issues
 */
@RestController
@RequestMapping("/api/issues")
@CrossOrigin(origins = "*")
public class IssueController {

    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }

    // GET /api/issues
    @GetMapping
    public ResponseEntity<List<Issue>> getAllIssues() {
        return ResponseEntity.ok(issueService.getAllIssues());
    }

    // GET /api/issues/active
    @GetMapping("/active")
    public ResponseEntity<List<Issue>> getActiveIssues() {
        return ResponseEntity.ok(issueService.getActiveIssues());
    }

    // POST /api/issues (Issue equipment)
    @PostMapping
    public ResponseEntity<Issue> issueEquipment(@Valid @RequestBody IssueRequest request) {
        Issue created = issueService.issueEquipment(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // PUT /api/issues/{id}/return (Return equipment)
    @PutMapping("/{id}/return")
    public ResponseEntity<Issue> returnEquipment(@PathVariable Long id) {
        Issue returned = issueService.returnEquipment(id);
        return ResponseEntity.ok(returned);
    }
}
