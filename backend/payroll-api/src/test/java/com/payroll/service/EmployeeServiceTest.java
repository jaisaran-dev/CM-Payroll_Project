package com.payroll.service;

import com.payroll.dto.employee.EmployeeRequest;
import com.payroll.entity.Employee;
import com.payroll.entity.User;
import com.payroll.enums.SystemRole;
import com.payroll.exception.SelfDeleteNotAllowedException;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmployeeServiceTest {

    @Test
    void createEmployeeRejectsSuperAdminRoleAssignment() {
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        EmployeeService service = new EmployeeService(
                employeeRepository, userRepository, mock(PasswordEncoder.class));
        EmployeeRequest request = new EmployeeRequest();
        request.setSystemRole(SystemRole.SUPER_ADMIN);

        assertThrows(IllegalArgumentException.class, () -> service.createEmployee(request));

        verify(employeeRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateEmployeeRejectsPromotingAnExistingUserToSuperAdmin() {
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        EmployeeService service = new EmployeeService(
                employeeRepository, userRepository, mock(PasswordEncoder.class));
        Employee employee = Employee.builder().id(1L).build();
        User user = User.builder().email("admin@example.com").systemRole(SystemRole.ADMIN).build();
        EmployeeRequest request = new EmployeeRequest();
        request.setEmail("admin@example.com");
        request.setSystemRole(SystemRole.SUPER_ADMIN);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(userRepository.findByEmployeeId(1L)).thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class, () -> service.updateEmployee(1L, request));

        verify(employeeRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void softDeleteRejectsTheLoggedInUsersOwnEmployeeProfile() {
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        EmployeeService service = new EmployeeService(
                employeeRepository, userRepository, mock(PasswordEncoder.class));
        Employee employee = Employee.builder().id(1L).isActive(true).build();
        User currentUser = User.builder().email("admin@example.com").employee(employee).build();

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(currentUser));

        assertThrows(
                SelfDeleteNotAllowedException.class,
                () -> service.softDeleteEmployee(1L, "admin@example.com"));

        verify(employeeRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void softDeleteStillAllowsDeletingAnotherEmployeesProfile() {
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        EmployeeService service = new EmployeeService(
                employeeRepository, userRepository, mock(PasswordEncoder.class));
        Employee currentEmployee = Employee.builder().id(1L).build();
        Employee targetEmployee = Employee.builder().id(2L).isActive(true).build();
        User currentUser = User.builder().email("admin@example.com").employee(currentEmployee).build();
        User targetUser = User.builder().email("employee@example.com").enabled(true).build();

        when(employeeRepository.findById(2L)).thenReturn(Optional.of(targetEmployee));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(currentUser));
        when(userRepository.findByEmployeeId(2L)).thenReturn(Optional.of(targetUser));

        service.softDeleteEmployee(2L, "admin@example.com");

        assertFalse(targetEmployee.getIsActive());
        assertFalse(targetUser.getEnabled());
        verify(employeeRepository).save(targetEmployee);
        verify(userRepository).save(targetUser);
    }

    @Test
    void createEmployeeStoresEncodedPassword() {
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        Employee employee = Employee.builder().id(1L).name("Employee").build();
        EmployeeService service = new EmployeeService(
                employeeRepository, userRepository, passwordEncoder);
        EmployeeRequest request = new EmployeeRequest();
        request.setEmail("employee@example.com");
        request.setPassword("secret");

        when(userRepository.findByEmail("employee@example.com")).thenReturn(Optional.empty());
        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);
        when(passwordEncoder.encode("secret")).thenReturn("{bcrypt}encoded");

        service.createEmployee(request);

        var savedUser = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(savedUser.capture());
        assertEquals("{bcrypt}encoded", savedUser.getValue().getPasswordHash());
    }
}
