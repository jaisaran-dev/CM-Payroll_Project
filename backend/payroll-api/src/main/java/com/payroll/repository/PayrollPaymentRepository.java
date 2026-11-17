package com.payroll.repository;

import com.payroll.entity.PayrollPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PayrollPaymentRepository extends JpaRepository<PayrollPayment, Long> {

    List<PayrollPayment> findByPayrollMonthAndPayrollYear(int payrollMonth, int payrollYear);

    List<PayrollPayment> findByEmployeeIdOrderByIdDesc(Long employeeId);

    @Query("""
            select coalesce(sum(p.amount), 0)
            from PayrollPayment p
            where p.employee.id = :employeeId
              and p.payrollMonth = :payrollMonth
              and p.payrollYear = :payrollYear
            """)
    BigDecimal sumPaymentsForEmployeeAndPeriod(
            @Param("employeeId") Long employeeId,
            @Param("payrollMonth") int payrollMonth,
            @Param("payrollYear") int payrollYear
    );
}
