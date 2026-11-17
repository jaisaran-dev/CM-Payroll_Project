package com.payroll.service;

import com.payroll.dto.attendance.*;
import com.payroll.entity.Attendance;
import com.payroll.entity.Employee;
import com.payroll.entity.User;
import com.payroll.exception.ResourceNotFoundException;
import com.payroll.repository.AttendanceRepository;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public AttendanceResponse markAttendanceByAdmin(AdminAttendanceRequest request) {
        if (request.getAttendanceDate().isAfter(LocalDate.now())) {
            throw new RuntimeException("Cannot mark attendance for future dates.");
        }

        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (!employee.getIsActive()) {
            throw new RuntimeException("Cannot mark attendance for an inactive employee.");
        }

        Optional<Attendance> existingAttendance = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(request.getEmployeeId(), request.getAttendanceDate());

        Attendance attendance;
        if (existingAttendance.isPresent()) {
            attendance = existingAttendance.get();
            attendance.setStatus(request.getStatus());
            attendance.setRemarks(request.getRemarks());
        } else {
            attendance = Attendance.builder()
                    .employee(employee)
                    .attendanceDate(request.getAttendanceDate())
                    .status(request.getStatus())
                    .remarks(request.getRemarks())
                    .build();
        }

        Attendance saved = attendanceRepository.save(attendance);
        return mapToResponse(saved);
    }

    public AttendanceResponse markAttendanceByEmployee(EmployeeAttendanceRequest request, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getEmployee() == null) {
            throw new RuntimeException("Admin accounts cannot mark employee attendance.");
        }

        Long employeeId = user.getEmployee().getId();

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        LocalDate today = LocalDate.now();

        Optional<Attendance> existingAttendance = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(employeeId, today);

        Attendance attendance;
        if (existingAttendance.isPresent()) {
            attendance = existingAttendance.get();
            attendance.setStatus(request.getStatus());
            attendance.setRemarks(request.getRemarks());
        } else {
            attendance = Attendance.builder()
                    .employee(employee)
                    .attendanceDate(today)
                    .status(request.getStatus())
                    .remarks(request.getRemarks())
                    .build();
        }

        Attendance saved = attendanceRepository.save(attendance);
        return mapToResponse(saved);
    }

    public List<AdminAttendanceListResponse> getDailyAttendanceList(LocalDate date) {
        if (date.isAfter(LocalDate.now())) {
            throw new RuntimeException("Cannot fetch attendance for future dates.");
        }

        List<Employee> activeEmployees = employeeRepository.findByIsActiveTrueAndCreatedAtLessThan(
                date.plusDays(1).atStartOfDay());
        List<Attendance> attendanceRecords = attendanceRepository.findByAttendanceDate(date);

        Map<Long, Attendance> attendanceMap = attendanceRecords.stream()
                .collect(Collectors.toMap(a -> a.getEmployee().getId(), a -> a));

        List<AdminAttendanceListResponse> responseList = new ArrayList<>();

        for (Employee emp : activeEmployees) {
            Attendance record = attendanceMap.get(emp.getId());

            if (record != null) {
                responseList.add(AdminAttendanceListResponse.builder()
                        .employeeId(emp.getId())
                        .name(emp.getName())
                        .role(emp.getWorkMode() != null ? emp.getWorkMode().name() : "OFFICE")
                        .status(record.getStatus().name())
                        .remarks(record.getRemarks() != null ? record.getRemarks() : "")
                        .build());
            } else {
                responseList.add(AdminAttendanceListResponse.builder()
                        .employeeId(emp.getId())
                        .name(emp.getName())
                        .role(emp.getWorkMode() != null ? emp.getWorkMode().name() : "OFFICE")
                        .status("ABSENT")
                        .remarks("Not Marked")
                        .build());
            }
        }

        return responseList;
    }

    public List<AttendanceResponse> getAttendanceByEmployee(Long employeeId) {
        return attendanceRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ==========================================
    public AttendanceResponse getTodayAttendanceForEmployee(String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getEmployee() == null) {
            return null;
        }

        Employee employee = employeeRepository.findById(user.getEmployee().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        // Find attendance for today
        Optional<Attendance> todayAttendance = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(employee.getId(), LocalDate.now());

        return todayAttendance.map(this::mapToResponse).orElse(null);
    }

    @Transactional
    public void markBulkAttendanceByAdmin(BulkAttendanceRequest request) {
        if (request.getAttendanceDate().isAfter(LocalDate.now())) {
            throw new RuntimeException("Cannot mark attendance for future dates.");
        }

        if (request.getEmployeeIds() == null || request.getEmployeeIds().isEmpty()) {
            throw new RuntimeException("No employees selected.");
        }

        // 1. Fetch all valid active employees at once
        List<Employee> employees = employeeRepository.findAllById(request.getEmployeeIds())
                .stream().filter(Employee::getIsActive).toList();

        Map<Long, Employee> employeeMap = employees.stream()
                .collect(Collectors.toMap(Employee::getId, e -> e));

        // 2. Fetch existing attendance records for these employees on this date
        List<Attendance> existingRecords = attendanceRepository
                .findByEmployeeIdInAndAttendanceDate(request.getEmployeeIds(), request.getAttendanceDate());

        Map<Long, Attendance> existingMap = existingRecords.stream()
                .collect(Collectors.toMap(a -> a.getEmployee().getId(), a -> a));

        // 3. Prepare records to save
        List<Attendance> toSave = new ArrayList<>();
        for (Long empId : request.getEmployeeIds()) {
            Employee emp = employeeMap.get(empId);
            if (emp == null) continue; // Skip if employee not found or inactive

            Attendance attendance = existingMap.get(empId);
            if (attendance != null) {
                // Update existing
                attendance.setStatus(request.getStatus());
                attendance.setRemarks(request.getRemarks());
            } else {
                // Create new
                attendance = Attendance.builder()
                        .employee(emp)
                        .attendanceDate(request.getAttendanceDate())
                        .status(request.getStatus())
                        .remarks(request.getRemarks())
                        .build();
            }
            toSave.add(attendance);
        }

        // 4. Bulk save
        attendanceRepository.saveAll(toSave);
    }


    private AttendanceResponse mapToResponse(Attendance a) {
        return AttendanceResponse.builder()
                .id(a.getId())
                .employeeId(a.getEmployee().getId())
                .employeeName(a.getEmployee().getName())
                .attendanceDate(a.getAttendanceDate())
                .status(a.getStatus().name())
                .remarks(a.getRemarks())
                .build();
    }
}
