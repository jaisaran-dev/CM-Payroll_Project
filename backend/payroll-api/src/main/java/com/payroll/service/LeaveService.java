package com.payroll.service;

import com.payroll.dto.leave.LeaveRequest;
import com.payroll.dto.leave.LeaveResponse;
import com.payroll.entity.Employee;
import com.payroll.entity.Leave;
import com.payroll.entity.User;
import com.payroll.enums.LeaveStatus;
import com.payroll.exception.ResourceNotFoundException;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.LeaveRepository;
import com.payroll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRepository leaveRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    // Helper to get Employee from JWT Email
    private Employee getEmployeeByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getEmployee() == null) {
            throw new RuntimeException("Admin accounts cannot perform employee actions.");
        }
        return user.getEmployee();
    }

    // ==========================================
    // EMPLOYEE METHODS
    // ==========================================

    @Transactional
    public LeaveResponse applyLeave(LeaveRequest request, String loggedInEmail) {
        Employee employee = getEmployeeByEmail(loggedInEmail);

        Leave leave = Leave.builder()
                .employee(employee)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .subject(request.getSubject())
                .reason(request.getReason())
                .leaveType(request.getLeaveType())
                .session(request.getSession())
                .status(LeaveStatus.PENDING)
                .build();

        return mapToResponse(leaveRepository.save(leave));
    }

    @Transactional
    public LeaveResponse updateLeave(Long id, LeaveRequest request, String loggedInEmail) {
        Employee employee = getEmployeeByEmail(loggedInEmail);
        Leave leave = leaveRepository.findByIdAndEmployeeId(id, employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found or unauthorized"));

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new RuntimeException("You can only edit PENDING leave requests.");
        }

        leave.setStartDate(request.getStartDate());
        leave.setEndDate(request.getEndDate());
        leave.setSubject(request.getSubject());
        leave.setReason(request.getReason());
        leave.setLeaveType(request.getLeaveType());
        leave.setSession(request.getSession());

        return mapToResponse(leaveRepository.save(leave));
    }

    @Transactional
    public void cancelLeave(Long id, String loggedInEmail) {
        Employee employee = getEmployeeByEmail(loggedInEmail);
        Leave leave = leaveRepository.findByIdAndEmployeeId(id, employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found or unauthorized"));

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new RuntimeException("You can only cancel PENDING leave requests.");
        }

        leaveRepository.delete(leave);
    }

    public List<LeaveResponse> getMyLeaves(String loggedInEmail) {
        Employee employee = getEmployeeByEmail(loggedInEmail);
        return leaveRepository.findByEmployeeIdOrderByAppliedAtDesc(employee.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ==========================================
    // ADMIN METHODS
    // ==========================================

    public List<LeaveResponse> getAllLeaves() {
        return leaveRepository.findAllByOrderByAppliedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeaveResponse updateLeaveStatus(Long leaveId, LeaveStatus status, String managerRemark) {
        Leave leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        leave.setStatus(status);
        leave.setManagerRemark(managerRemark);
        leave.setReviewedAt(LocalDateTime.now());

        return mapToResponse(leaveRepository.save(leave));
    }

    // ==========================================
    // MAPPER
    // ==========================================
    private LeaveResponse mapToResponse(Leave leave) {
        return LeaveResponse.builder()
                .id(leave.getId())
                .employeeId(leave.getEmployee().getId())
                .employeeName(leave.getEmployee().getName())
                .startDate(leave.getStartDate())
                .endDate(leave.getEndDate())
                .subject(leave.getSubject())
                .reason(leave.getReason())
                .leaveType(leave.getLeaveType() != null ? leave.getLeaveType().name() : null)
                .session(leave.getSession() != null ? leave.getSession().name() : null)
                .status(leave.getStatus().name())
                .managerRemark(leave.getManagerRemark())
                .appliedAt(leave.getAppliedAt())
                .reviewedAt(leave.getReviewedAt())
                .build();
    }
}
