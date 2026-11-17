package com.payroll.service;

import com.payroll.dto.employee.EmployeeRequest;
import com.payroll.dto.employee.EmployeeResponse;
import com.payroll.entity.Employee;
import com.payroll.entity.User;
import com.payroll.enums.SystemRole;
import com.payroll.exception.ResourceNotFoundException;
import com.payroll.exception.SelfDeleteNotAllowedException;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        if (request.getSystemRole() == SystemRole.SUPER_ADMIN) {
            throw new IllegalArgumentException("Super Admin access can only be assigned directly in the database.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already in use!");
        }

        Employee employee = Employee.builder()
                .name(request.getName())
                .workMode(request.getWorkMode())
                .salaryType(request.getSalaryType())
                .salaryAmount(request.getSalaryAmount())
                .isActive(true)
                .build();
        Employee savedEmployee = employeeRepository.save(employee);

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .systemRole(request.getSystemRole() != null ? request.getSystemRole() : SystemRole.EMPLOYEE)
                .employee(savedEmployee)
                .enabled(true)
                .mustChangePassword(false)
                .build();
        userRepository.save(user);

        return mapToResponse(savedEmployee, user);
    }

    public List<EmployeeResponse> getAll() {
        return employeeRepository.findByIsActiveTrue().stream()
                .map(emp -> {
                    User user = userRepository.findByEmployeeId(emp.getId()).orElse(null);
                    return mapToResponse(emp, user);
                })
                .collect(Collectors.toList());
    }

    public EmployeeResponse getById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + id));

        User user = userRepository.findByEmployeeId(id).orElse(null);
        return mapToResponse(employee, user);
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        User user = userRepository.findByEmployeeId(id)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found for this employee"));

        // Name check removed. Only checking email (ignoring current email).
        if (!user.getEmail().equals(request.getEmail()) && userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already in use by another user!");
        }
        if (request.getSystemRole() == SystemRole.SUPER_ADMIN
                && user.getSystemRole() != SystemRole.SUPER_ADMIN) {
            throw new IllegalArgumentException(
                    "Super Admin access can only be assigned directly in the database.");
        }

        employee.setName(request.getName());
        employee.setWorkMode(request.getWorkMode());
        employee.setSalaryType(request.getSalaryType());
        employee.setSalaryAmount(request.getSalaryAmount());

        user.setEmail(request.getEmail());
        if (request.getSystemRole() != null) {
            user.setSystemRole(request.getSystemRole());
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        Employee updatedEmp = employeeRepository.save(employee);
        User updatedUser = userRepository.save(user);

        return mapToResponse(updatedEmp, updatedUser);
    }

    @Transactional
    public void softDeleteEmployee(Long id, String currentUserEmail) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (currentUser.getEmployee() != null && id.equals(currentUser.getEmployee().getId())) {
            throw new SelfDeleteNotAllowedException("You cannot delete your own employee profile.");
        }

        employee.setIsActive(false);
        employeeRepository.save(employee);

        userRepository.findByEmployeeId(id).ifPresent(user -> {
            user.setEnabled(false);
            userRepository.save(user);
        });
    }

    private EmployeeResponse mapToResponse(Employee employee, User user) {
        return EmployeeResponse.builder()
                .id(employee.getId())
                .name(employee.getName())
                .workMode(employee.getWorkMode() != null ? employee.getWorkMode().name() : null)
                .salaryType(employee.getSalaryType() != null ? employee.getSalaryType().name() : null)
                .salaryAmount(employee.getSalaryAmount())
                .email(user != null ? user.getEmail() : null)
                .systemRole(user != null && user.getSystemRole() != null ? user.getSystemRole().name() : null)
                .isActive(employee.getIsActive())
                .build();
    }
}
