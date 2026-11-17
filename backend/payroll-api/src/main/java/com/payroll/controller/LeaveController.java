package com.payroll.controller;

import com.payroll.dto.common.ApiResponse;
import com.payroll.dto.leave.LeaveRequest;
import com.payroll.dto.leave.LeaveResponse;
import com.payroll.enums.LeaveStatus;
import com.payroll.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    // ==========================================
    // EMPLOYEE ENDPOINTS
    // ==========================================

    @PostMapping("/employee/apply")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<LeaveResponse>> applyLeave(
            @RequestBody LeaveRequest request, Authentication authentication) {
        LeaveResponse data = leaveService.applyLeave(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.<LeaveResponse>builder()
                .success(true).message("Leave applied successfully").data(data).build());
    }

    @PutMapping("/employee/update/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<LeaveResponse>> updateLeave(
            @PathVariable Long id, @RequestBody LeaveRequest request, Authentication authentication) {
        LeaveResponse data = leaveService.updateLeave(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.<LeaveResponse>builder()
                .success(true).message("Leave updated successfully").data(data).build());
    }

    @DeleteMapping("/employee/cancel/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<String>> cancelLeave(
            @PathVariable Long id, Authentication authentication) {
        leaveService.cancelLeave(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true).message("Leave cancelled successfully").data(null).build());
    }

    @GetMapping("/employee/my-leaves")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> getMyLeaves(Authentication authentication) {
        List<LeaveResponse> data = leaveService.getMyLeaves(authentication.getName());
        return ResponseEntity.ok(ApiResponse.<List<LeaveResponse>>builder()
                .success(true).message("My leaves fetched successfully").data(data).build());
    }

    // ==========================================
    // ADMIN ENDPOINTS
    // ==========================================

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveResponse>>> getAllLeaves() {
        List<LeaveResponse> data = leaveService.getAllLeaves();
        return ResponseEntity.ok(ApiResponse.<List<LeaveResponse>>builder()
                .success(true).message("All leaves fetched successfully").data(data).build());
    }

    @PatchMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LeaveResponse>> updateLeaveStatus(
            @PathVariable Long id,
            @RequestParam LeaveStatus status,
            @RequestParam(required = false) String managerRemark) {

        LeaveResponse data = leaveService.updateLeaveStatus(id, status, managerRemark);
        return ResponseEntity.ok(ApiResponse.<LeaveResponse>builder()
                .success(true).message("Leave status updated successfully").data(data).build());
    }
}
