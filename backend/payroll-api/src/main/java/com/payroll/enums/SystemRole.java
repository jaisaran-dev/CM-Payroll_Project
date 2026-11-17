package com.payroll.enums;

public enum SystemRole {
    ADMIN,
    SUPER_ADMIN,
    EMPLOYEE;

    public boolean hasAdminAccess() {
        return this == ADMIN || this == SUPER_ADMIN;
    }
}
