package com.payroll.service;

import com.payroll.repository.AttendanceRepository;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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

        when(employeeRepository.findByIsActiveTrueAndCreatedAtLessThan(
                LocalDateTime.of(2026, 11, 17, 0, 0)))
                .thenReturn(List.of());
        when(attendanceRepository.findByAttendanceDate(attendanceDate))
                .thenReturn(List.of());

        assertTrue(service.getDailyAttendanceList(attendanceDate).isEmpty());
        verify(employeeRepository).findByIsActiveTrueAndCreatedAtLessThan(
                attendanceDate.plusDays(1).atStartOfDay());
    }
}
