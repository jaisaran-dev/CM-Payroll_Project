package com.payroll.dto.employee;

import com.payroll.enums.SalaryType;
import com.payroll.enums.SystemRole;
import com.payroll.enums.WorkMode;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class EmployeeRequest {
    private String name;
    private WorkMode workMode;
    private SalaryType salaryType;
    private BigDecimal salaryAmount;

    // Login Access Fields
    private String email;
    private String password;
    private SystemRole systemRole; // ADMIN, MANAGER, EMPLOYEE
}
