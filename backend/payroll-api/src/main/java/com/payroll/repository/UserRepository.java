package com.payroll.repository;

import com.payroll.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    // NEW: Helps us easily find the login info for a specific employee
    Optional<User> findByEmployeeId(Long employeeId);

    List<User> findByEmployeeIdIn(List<Long> employeeIds);
}
