package com.payroll.controller;

import com.payroll.dto.attendance.*;
import com.payroll.dto.common.ApiResponse;
import com.payroll.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    // ==========================================
    // 1. ADMIN ENDPOINT: Mark any employee
    // ==========================================
    @PostMapping("/admin/mark")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> markByAdmin(@RequestBody AdminAttendanceRequest request) {
        AttendanceResponse data = attendanceService.markAttendanceByAdmin(request);
        return ResponseEntity.ok(ApiResponse.<AttendanceResponse>builder()
                .success(true)
                .message("Attendance marked by Admin")
                .data(data)
                .build());
    }

    // ==========================================
    // 2. EMPLOYEE ENDPOINT: Mark self (Today only)
    // ==========================================
    @PostMapping("/employee/mark")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> markByEmployee(
            @RequestBody EmployeeAttendanceRequest request,
            Authentication authentication) {

        String loggedInEmail = authentication.getName();
        AttendanceResponse data = attendanceService.markAttendanceByEmployee(request, loggedInEmail);

        return ResponseEntity.ok(ApiResponse.<AttendanceResponse>builder()
                .success(true)
                .message("Your attendance has been marked successfully")
                .data(data)
                .build());
    }

    // ==========================================
    // 3. ADMIN ENDPOINT: Get full list for a date
    // ==========================================
    @GetMapping("/admin/list")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminAttendanceListResponse>>> getDailyList(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<AdminAttendanceListResponse> data = attendanceService.getDailyAttendanceList(date);

        return ResponseEntity.ok(ApiResponse.<List<AdminAttendanceListResponse>>builder()
                .success(true)
                .message("Daily attendance list fetched successfully")
                .data(data)
                .build());
    }

    // ==========================================
    // 4. GET HISTORY: Admin or Employee
    // ==========================================
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendanceByEmployee(@PathVariable Long employeeId) {
        List<AttendanceResponse> data = attendanceService.getAttendanceByEmployee(employeeId);
        return ResponseEntity.ok(ApiResponse.<List<AttendanceResponse>>builder()
                .success(true)
                .message("Attendance history fetched successfully")
                .data(data)
                .build());
    }

        // ==========================================
    // EMPLOYEE ENDPOINT: Get today's status
    // ==========================================
    @GetMapping("/employee/today")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> getTodayAttendance(Authentication authentication) {
        AttendanceResponse data = attendanceService.getTodayAttendanceForEmployee(authentication.getName());
        return ResponseEntity.ok(ApiResponse.<AttendanceResponse>builder()
                .success(true)
                .message(data != null ? "Today's attendance fetched" : "No attendance marked for today")
                .data(data)
                .build());
    }

        // ==========================================
    // ADMIN ENDPOINT: Bulk mark attendance
    // ==========================================
    @PostMapping("/admin/bulk-mark")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> bulkMarkByAdmin(@RequestBody BulkAttendanceRequest request) {
        attendanceService.markBulkAttendanceByAdmin(request);
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .success(true)
                .message("Bulk attendance marked successfully")
                .data(null)
                .build());
    }
}
