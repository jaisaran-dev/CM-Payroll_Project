package com.payroll.service;

import com.payroll.dto.attendance.AdminAttendanceListResponse;
import com.payroll.entity.Employee;
import com.payroll.entity.User;
import com.payroll.repository.AttendanceRepository;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AttendanceServiceTest {

    @Test
    void dailyListUsesSelectedDateAsEmployeeCreationCutoff() {
        AttendanceRepository attendanceRepository = mock(AttendanceRepository.class);
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AttendanceService service = new AttendanceService(
                attendanceRepository, employeeRepository, userRepository);
        LocalDate attendanceDate = LocalDate.of(2026, 11, 16);

        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(User.builder().email("admin@example.com").build()));
        when(employeeRepository.findByIsActiveTrueAndCreatedAtLessThan(
                LocalDateTime.of(2026, 11, 17, 0, 0)))
                .thenReturn(List.of());
        when(attendanceRepository.findByAttendanceDate(attendanceDate))
                .thenReturn(List.of());

        assertTrue(service.getDailyAttendanceList(attendanceDate, "admin@example.com").isEmpty());
        verify(employeeRepository).findByIsActiveTrueAndCreatedAtLessThan(
                attendanceDate.plusDays(1).atStartOfDay());
    }

    @Test
    void dailyListExcludesTheLoggedInAdminsOwnEmployee() {
        AttendanceRepository attendanceRepository = mock(AttendanceRepository.class);
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AttendanceService service = new AttendanceService(
                attendanceRepository, employeeRepository, userRepository);
        LocalDate attendanceDate = LocalDate.of(2026, 11, 16);
        Employee adminEmployee = Employee.builder().id(1L).build();
        Employee otherEmployee = Employee.builder().id(2L).build();

        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(User.builder()
                        .email("admin@example.com")
                        .employee(adminEmployee)
                        .build()));
        when(employeeRepository.findByIsActiveTrueAndCreatedAtLessThan(
                attendanceDate.plusDays(1).atStartOfDay()))
                .thenReturn(List.of(adminEmployee, otherEmployee));
        when(attendanceRepository.findByAttendanceDate(attendanceDate)).thenReturn(List.of());

        List<AdminAttendanceListResponse> attendance =
                service.getDailyAttendanceList(attendanceDate, "admin@example.com");

        assertEquals(1, attendance.size());
        assertEquals(2L, attendance.getFirst().getEmployeeId());
    }
}
