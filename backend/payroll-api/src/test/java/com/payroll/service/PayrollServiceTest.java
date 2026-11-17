package com.payroll.service;

import com.payroll.dto.payroll.PayrollListResponse;
import com.payroll.dto.payroll.PayrollPaymentHistoryResponse;
import com.payroll.dto.payroll.PayrollPaymentRequest;
import com.payroll.entity.Attendance;
import com.payroll.entity.Employee;
import com.payroll.entity.PayrollPayment;
import com.payroll.entity.User;
import com.payroll.enums.AttendanceStatus;
import com.payroll.enums.SalaryType;
import com.payroll.enums.SystemRole;
import com.payroll.enums.WorkMode;
import com.payroll.exception.SelfPayrollPaymentNotAllowedException;
import com.payroll.repository.AttendanceRepository;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.PayrollPaymentRepository;
import com.payroll.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PayrollServiceTest {

    @Test
    void currentPayrollCountsPresentDaysOnlyAfterEmployeeCreation() {
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        AttendanceRepository attendanceRepository = mock(AttendanceRepository.class);
        PayrollPaymentRepository paymentRepository = mock(PayrollPaymentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PayrollService service = new PayrollService(
                employeeRepository, attendanceRepository, paymentRepository, userRepository);
        LocalDate today = LocalDate.of(2026, 11, 17);
        Employee employee = employee(1L, LocalDate.of(2026, 11, 10));

        when(employeeRepository.findByIsActiveTrue()).thenReturn(List.of(employee));
        when(attendanceRepository.findByEmployeeIdsAndDateRangeAndStatus(
                List.of(1L), LocalDate.of(2026, 11, 1), today, AttendanceStatus.PRESENT))
                .thenReturn(List.of(
                        attendance(employee, LocalDate.of(2026, 11, 9)),
                        attendance(employee, LocalDate.of(2026, 11, 10)),
                        attendance(employee, today)));
        when(paymentRepository.findByPayrollMonthAndPayrollYear(11, 2026)).thenReturn(List.of());
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(adminUser()));
        when(userRepository.findByEmployeeIdIn(List.of(1L))).thenReturn(List.of());

        List<PayrollListResponse> payroll = service.getCurrentPayrollList(today, "admin@example.com");

        assertEquals(1, payroll.size());
        assertEquals(2, payroll.getFirst().getTotalDays());
        assertEquals(new BigDecimal("2000.00"), payroll.getFirst().getPayableAmount());
        assertEquals(new BigDecimal("2000.00"), payroll.getFirst().getBalance());
    }

    @Test
    void currentPayrollExcludesTheLoggedInAdminsOwnEmployee() {
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        AttendanceRepository attendanceRepository = mock(AttendanceRepository.class);
        PayrollPaymentRepository paymentRepository = mock(PayrollPaymentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PayrollService service = new PayrollService(
                employeeRepository, attendanceRepository, paymentRepository, userRepository);
        LocalDate today = LocalDate.of(2026, 11, 17);
        Employee adminEmployee = employee(1L, LocalDate.of(2026, 11, 10));
        Employee otherEmployee = employee(2L, LocalDate.of(2026, 11, 10));
        User admin = User.builder()
                .email("admin@example.com")
                .systemRole(SystemRole.ADMIN)
                .employee(adminEmployee)
                .build();

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(employeeRepository.findByIsActiveTrue()).thenReturn(List.of(adminEmployee, otherEmployee));
        when(attendanceRepository.findByEmployeeIdsAndDateRangeAndStatus(
                List.of(2L), LocalDate.of(2026, 11, 1), today, AttendanceStatus.PRESENT))
                .thenReturn(List.of());
        when(paymentRepository.findByPayrollMonthAndPayrollYear(11, 2026)).thenReturn(List.of());
        when(userRepository.findByEmployeeIdIn(List.of(2L))).thenReturn(List.of());

        List<PayrollListResponse> payroll = service.getCurrentPayrollList(today, "admin@example.com");

        assertEquals(1, payroll.size());
        assertEquals(2L, payroll.getFirst().getEmployeeId());
    }

    @Test
    void recordPaymentRejectsTheLoggedInAdminsOwnEmployee() {
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        AttendanceRepository attendanceRepository = mock(AttendanceRepository.class);
        PayrollPaymentRepository paymentRepository = mock(PayrollPaymentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PayrollService service = new PayrollService(
                employeeRepository, attendanceRepository, paymentRepository, userRepository);
        Employee adminEmployee = employee(1L, LocalDate.of(2026, 11, 10));
        User admin = User.builder()
                .email("admin@example.com")
                .systemRole(SystemRole.ADMIN)
                .employee(adminEmployee)
                .build();
        PayrollPaymentRequest request = new PayrollPaymentRequest();
        request.setEmployeeId(1L);
        request.setAmount(new BigDecimal("500.00"));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));

        assertThrows(
                SelfPayrollPaymentNotAllowedException.class,
                () -> service.recordCurrentPayrollPayment(
                        request, LocalDateTime.of(2026, 11, 17, 14, 30), "admin@example.com"));

        verify(employeeRepository, never()).findActiveByIdForUpdate(1L);
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void recordPaymentRejectsAmountAboveCurrentOutstandingBalance() {
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        AttendanceRepository attendanceRepository = mock(AttendanceRepository.class);
        PayrollPaymentRepository paymentRepository = mock(PayrollPaymentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PayrollService service = new PayrollService(
                employeeRepository, attendanceRepository, paymentRepository, userRepository);
        LocalDate today = LocalDate.of(2026, 11, 17);
        Employee employee = employee(1L, LocalDate.of(2026, 11, 10));
        PayrollPaymentRequest request = new PayrollPaymentRequest();
        request.setEmployeeId(1L);
        request.setAmount(new BigDecimal("2500.00"));

        when(employeeRepository.findActiveByIdForUpdate(1L)).thenReturn(Optional.of(employee));
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(adminUser()));
        when(attendanceRepository.countDistinctAttendanceDays(
                1L, LocalDate.of(2026, 11, 10), today, AttendanceStatus.PRESENT))
                .thenReturn(2L);
        when(paymentRepository.sumPaymentsForEmployeeAndPeriod(1L, 11, 2026))
                .thenReturn(new BigDecimal("500.00"));

        assertThrows(IllegalArgumentException.class,
                () -> service.recordCurrentPayrollPayment(
                        request, today.atTime(14, 30), "admin@example.com"));
    }

    @Test
    void recordPaymentStoresPartialAmountAndReturnsUpdatedBalance() {
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        AttendanceRepository attendanceRepository = mock(AttendanceRepository.class);
        PayrollPaymentRepository paymentRepository = mock(PayrollPaymentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PayrollService service = new PayrollService(
                employeeRepository, attendanceRepository, paymentRepository, userRepository);
        LocalDate today = LocalDate.of(2026, 11, 17);
        Employee employee = employee(1L, LocalDate.of(2026, 11, 10));
        PayrollPaymentRequest request = new PayrollPaymentRequest();
        request.setEmployeeId(1L);
        request.setAmount(new BigDecimal("500.00"));

        when(employeeRepository.findActiveByIdForUpdate(1L)).thenReturn(Optional.of(employee));
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(adminUser()));
        when(attendanceRepository.countDistinctAttendanceDays(
                1L, LocalDate.of(2026, 11, 10), today, AttendanceStatus.PRESENT))
                .thenReturn(2L);
        when(paymentRepository.sumPaymentsForEmployeeAndPeriod(1L, 11, 2026))
                .thenReturn(new BigDecimal("500.00"));
        when(paymentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findByEmployeeId(1L))
                .thenReturn(Optional.of(User.builder().email("asha@example.com").build()));

        LocalDateTime paidAt = today.atTime(14, 30);
        PayrollListResponse response = service.recordCurrentPayrollPayment(
                request, paidAt, "admin@example.com");

        assertEquals(new BigDecimal("1000.00"), response.getPaidAmount());
        assertEquals(new BigDecimal("1000.00"), response.getBalance());
        assertEquals("PARTIAL", response.getStatus());
        assertEquals(today, response.getPaidOn());
        verify(paymentRepository).save(argThat(payment ->
                payment.getEmployee().getId().equals(1L)
                        && payment.getPayrollMonth() == 11
                        && payment.getPayrollYear() == 2026
                        && payment.getAmount().equals(new BigDecimal("500.00"))
                        && payment.getPaidOn().equals(today)
                        && payment.getPaidAt().equals(paidAt)
                        && payment.getPaidBy().getEmail().equals("admin@example.com")));
    }

    @Test
    void paymentHistoryReturnsTimestampAndAdminWhoRecordedEachPayment() {
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        AttendanceRepository attendanceRepository = mock(AttendanceRepository.class);
        PayrollPaymentRepository paymentRepository = mock(PayrollPaymentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PayrollService service = new PayrollService(
                employeeRepository, attendanceRepository, paymentRepository, userRepository);
        Employee employee = employee(1L, LocalDate.of(2026, 11, 10));
        User admin = adminUser();
        LocalDate paymentDate = LocalDate.of(2026, 11, 17);
        LocalDateTime paymentTime = paymentDate.atTime(14, 30);
        PayrollPayment payment = PayrollPayment.builder()
                .id(2L)
                .employee(employee)
                .payrollMonth(11)
                .payrollYear(2026)
                .amount(new BigDecimal("500.00"))
                .paidOn(paymentDate)
                .paidAt(paymentTime)
                .paidBy(admin)
                .build();
        PayrollPayment legacyPayment = PayrollPayment.builder()
                .id(1L)
                .employee(employee)
                .payrollMonth(10)
                .payrollYear(2026)
                .amount(new BigDecimal("300.00"))
                .paidOn(LocalDate.of(2026, 10, 31))
                .build();

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(paymentRepository.findByEmployeeIdOrderByIdDesc(1L))
                .thenReturn(List.of(payment, legacyPayment));

        List<PayrollPaymentHistoryResponse> history = service.getPaymentHistory(1L);

        assertEquals(2, history.size());
        assertEquals(paymentTime, history.getFirst().getPaidAt());
        assertEquals("admin@example.com", history.getFirst().getPaidBy());
        assertEquals(LocalDate.of(2026, 10, 31).atStartOfDay(), history.getLast().getPaidAt());
        assertEquals("Not recorded", history.getLast().getPaidBy());
    }

    private User adminUser() {
        return User.builder()
                .email("admin@example.com")
                .systemRole(SystemRole.ADMIN)
                .build();
    }

    private Employee employee(Long id, LocalDate createdDate) {
        return Employee.builder()
                .id(id)
                .name("Asha Employee")
                .workMode(WorkMode.OFFICE)
                .salaryType(SalaryType.MONTHLY)
                .salaryAmount(new BigDecimal("30000.00"))
                .isActive(true)
                .createdAt(createdDate.atTime(10, 0))
                .build();
    }

    private Attendance attendance(Employee employee, LocalDate date) {
        return Attendance.builder()
                .employee(employee)
                .attendanceDate(date)
                .status(AttendanceStatus.PRESENT)
                .build();
    }
}
