package com.payroll.controller;

import com.payroll.dto.common.ApiResponse;
import com.payroll.dto.employee.EmployeeRequest;
import com.payroll.dto.employee.EmployeeResponse;
import com.payroll.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(@RequestBody EmployeeRequest request) {
        EmployeeResponse data = employeeService.createEmployee(request);
        return ResponseEntity.ok(ApiResponse.<EmployeeResponse>builder()
                .success(true).message("Employee created successfully").data(data).build());
    }

    // UPDATED LIST API
    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAll() {
        List<EmployeeResponse> data = employeeService.getAll();

        // Check if the list is empty
        if (data == null || data.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.<List<EmployeeResponse>>builder()
                    .success(true)
                    .message("Employees not found")
                    .data(data) // This will send an empty array []
                    .build());
        }

        // If data exists
        return ResponseEntity.ok(ApiResponse.<List<EmployeeResponse>>builder()
                .success(true)
                .message("Employees fetched successfully")
                .data(data)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable Long id) {
        EmployeeResponse data = employeeService.getById(id);
        return ResponseEntity.ok(ApiResponse.<EmployeeResponse>builder()
                .success(true).message("Employee fetched successfully").data(data).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> update(
            @PathVariable Long id,
            @RequestBody EmployeeRequest request) {
        EmployeeResponse data = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(ApiResponse.<EmployeeResponse>builder()
                .success(true).message("Employee updated successfully").data(data).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(
            @PathVariable Long id,
            Authentication authentication) {
        employeeService.softDeleteEmployee(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true).message("Employee Deleted successfully").data(null).build());
    }
}
