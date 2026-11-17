package com.payroll.service;

import com.payroll.dto.payroll.PayrollListResponse;
import com.payroll.dto.payroll.PayrollPaymentHistoryResponse;
import com.payroll.dto.payroll.PayrollPaymentRequest;
import com.payroll.dto.payroll.PayrollResponse;
import com.payroll.entity.Employee;
import com.payroll.entity.PayrollPayment;
import com.payroll.entity.User;
import com.payroll.enums.AttendanceStatus;
import com.payroll.enums.SalaryType;
import com.payroll.enums.SystemRole;
import com.payroll.exception.ResourceNotFoundException;
import com.payroll.repository.AttendanceRepository;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.PayrollPaymentRepository;
import com.payroll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PayrollService {
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final PayrollPaymentRepository payrollPaymentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<PayrollListResponse> getCurrentPayrollList(LocalDate today) {
        List<Employee> employees = employeeRepository.findByIsActiveTrue();
        if (employees.isEmpty()) {
            return List.of();
        }

        YearMonth period = YearMonth.from(today);
        LocalDate periodStart = period.atDay(1);
        List<Long> employeeIds = employees.stream().map(Employee::getId).toList();

        Map<Long, Long> presentDaysByEmployee = new HashMap<>();
        attendanceRepository.findByEmployeeIdsAndDateRangeAndStatus(
                        employeeIds, periodStart, today, AttendanceStatus.PRESENT)
                .stream()
                .filter(attendance -> !attendance.getAttendanceDate()
                        .isBefore(attendance.getEmployee().getCreatedAt().toLocalDate()))
                .forEach(attendance -> presentDaysByEmployee.merge(
                        attendance.getEmployee().getId(), 1L, Long::sum));

        Map<Long, BigDecimal> paidAmountsByEmployee = new HashMap<>();
        Map<Long, LocalDate> latestPaymentDates = new HashMap<>();
        for (PayrollPayment payment : payrollPaymentRepository.findByPayrollMonthAndPayrollYear(
                period.getMonthValue(), period.getYear())) {
            Long employeeId = payment.getEmployee().getId();
            paidAmountsByEmployee.merge(employeeId, payment.getAmount(), BigDecimal::add);
            latestPaymentDates.merge(employeeId, payment.getPaidOn(),
                    (existing, paidOn) -> existing.isAfter(paidOn) ? existing : paidOn);
        }

        Map<Long, String> emailByEmployee = new HashMap<>();
        for (User user : userRepository.findByEmployeeIdIn(employeeIds)) {
            if (user.getEmployee() != null) {
                emailByEmployee.put(user.getEmployee().getId(), user.getEmail());
            }
        }

        return employees.stream()
                .sorted(Comparator.comparing(Employee::getName, String.CASE_INSENSITIVE_ORDER))
                .map(employee -> toPayrollListResponse(
                        employee,
                        emailByEmployee.get(employee.getId()),
                        Math.toIntExact(presentDaysByEmployee.getOrDefault(employee.getId(), 0L)),
                        paidAmountsByEmployee.getOrDefault(employee.getId(), BigDecimal.ZERO),
                        latestPaymentDates.get(employee.getId()),
                        period,
                        today))
                .toList();
    }

    @Transactional
    public PayrollListResponse recordCurrentPayrollPayment(
            PayrollPaymentRequest request,
            LocalDateTime paidAt,
            String adminEmail) {
        if (request == null || request.getEmployeeId() == null) {
            throw new IllegalArgumentException("Employee id is required.");
        }
        if (paidAt == null) {
            throw new IllegalArgumentException("Payment date and time are required.");
        }
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin account not found"));
        if (admin.getSystemRole() != SystemRole.ADMIN) {
            throw new IllegalArgumentException("Only an admin can record payroll payments.");
        }

        LocalDate today = paidAt.toLocalDate();
        Employee employee = employeeRepository.findActiveByIdForUpdate(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Active employee not found"));
        BigDecimal amount = request.getAmount();
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }
        if (amount.stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException("Payment amount cannot have more than two decimal places.");
        }

        YearMonth period = YearMonth.from(today);
        LocalDate periodStart = period.atDay(1);
        LocalDate employeeStartDate = employee.getCreatedAt().toLocalDate();
        LocalDate eligibleStartDate = employeeStartDate.isAfter(periodStart)
                ? employeeStartDate
                : periodStart;
        long presentDays = eligibleStartDate.isAfter(today)
                ? 0
                : attendanceRepository.countDistinctAttendanceDays(
                        employee.getId(), eligibleStartDate, today, AttendanceStatus.PRESENT);
        BigDecimal payableAmount = calculatePayableAmount(employee, presentDays);
        BigDecimal alreadyPaid = Objects.requireNonNullElse(
                payrollPaymentRepository.sumPaymentsForEmployeeAndPeriod(
                        employee.getId(), period.getMonthValue(), period.getYear()),
                BigDecimal.ZERO);
        BigDecimal balance = payableAmount.subtract(alreadyPaid).max(BigDecimal.ZERO);
        if (balance.signum() <= 0) {
            throw new IllegalArgumentException("There is no outstanding payroll balance for this month.");
        }
        if (amount.compareTo(balance) > 0) {
            throw new IllegalArgumentException("Payment amount cannot exceed the outstanding balance.");
        }

        payrollPaymentRepository.save(PayrollPayment.builder()
                .employee(employee)
                .payrollMonth(period.getMonthValue())
                .payrollYear(period.getYear())
                .amount(amount.setScale(2, RoundingMode.UNNECESSARY))
                .paidOn(today)
                .paidAt(paidAt)
                .paidBy(admin)
                .build());

        return toPayrollListResponse(
                employee,
                userRepository.findByEmployeeId(employee.getId())
                        .map(User::getEmail)
                        .orElse(null),
                Math.toIntExact(presentDays),
                alreadyPaid.add(amount),
                today,
                period,
                today);
    }

    @Transactional(readOnly = true)
    public List<PayrollPaymentHistoryResponse> getPaymentHistory(Long employeeId) {
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return payrollPaymentRepository.findByEmployeeIdOrderByIdDesc(employeeId).stream()
                .map(payment -> PayrollPaymentHistoryResponse.builder()
                        .paymentId(payment.getId())
                        .amount(payment.getAmount())
                        .paidAt(payment.getPaidAt() != null
                                ? payment.getPaidAt()
                                : payment.getPaidOn().atStartOfDay())
                        .paidBy(payment.getPaidBy() != null
                                ? payment.getPaidBy().getEmail()
                                : "Not recorded")
                        .payrollMonth(payment.getPayrollMonth())
                        .payrollYear(payment.getPayrollYear())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public PayrollResponse calculate(Long employeeId, int month, int year) {
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12.");
        }
        YearMonth period = YearMonth.of(year, month);
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        LocalDate eligibleStartDate = emp.getCreatedAt().toLocalDate().isAfter(period.atDay(1))
                ? emp.getCreatedAt().toLocalDate()
                : period.atDay(1);
        long presentDays = eligibleStartDate.isAfter(period.atEndOfMonth())
                ? 0
                : attendanceRepository.countDistinctAttendanceDays(
                        employeeId,
                        eligibleStartDate,
                        period.atEndOfMonth(),
                        AttendanceStatus.PRESENT);

        BigDecimal days = BigDecimal.valueOf(presentDays);
        BigDecimal pay;
        String math;

        if (emp.getSalaryType() == SalaryType.MONTHLY) {
            BigDecimal daily = emp.getSalaryAmount().divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
            pay = daily.multiply(days);
            math = "(Monthly / 30) * " + presentDays;
        } else {
            pay = emp.getSalaryAmount().multiply(days);
            math = "Daily Wage * " + presentDays;
        }

        return PayrollResponse.builder()
                .employeeId(emp.getId())
                .employeeName(emp.getName())
                .salaryType(emp.getSalaryType().name())
                .baseSalary(emp.getSalaryAmount())
                .presentDays((int) presentDays)
                .calculatedPay(pay)
                .breakdown(math + " = " + pay)
                .build();
    }

    private PayrollListResponse toPayrollListResponse(
            Employee employee,
            String email,
            int presentDays,
            BigDecimal paidAmount,
            LocalDate paidOn,
            YearMonth period,
            LocalDate today) {
        BigDecimal payableAmount = calculatePayableAmount(employee, presentDays);
        BigDecimal balance = payableAmount.subtract(paidAmount).max(BigDecimal.ZERO);
        String status = payableAmount.signum() > 0 && balance.signum() == 0
                ? "PAID"
                : paidAmount.signum() > 0 ? "PARTIAL" : "PENDING";
        String calculation = employee.getSalaryType() == SalaryType.MONTHLY
                ? "(Monthly salary / 30) x " + presentDays + " present days"
                : "Daily wage x " + presentDays + " present days";

        return PayrollListResponse.builder()
                .employeeId(employee.getId())
                .employeeName(employee.getName())
                .email(email)
                .paymentType(employee.getSalaryType().name())
                .paidOn(paidOn)
                .totalDays(presentDays)
                .baseSalary(employee.getSalaryAmount())
                .payableAmount(payableAmount)
                .paidAmount(paidAmount)
                .balance(balance)
                .status(status)
                .periodStart(period.atDay(1))
                .periodEnd(today)
                .breakdown(calculation + " = " + payableAmount)
                .build();
    }

    private BigDecimal calculatePayableAmount(Employee employee, long presentDays) {
        BigDecimal days = BigDecimal.valueOf(presentDays);
        BigDecimal payableAmount = employee.getSalaryType() == SalaryType.MONTHLY
                ? employee.getSalaryAmount()
                        .divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP)
                        .multiply(days)
                : employee.getSalaryAmount().multiply(days);
        return payableAmount.setScale(2, RoundingMode.HALF_UP);
    }
}
