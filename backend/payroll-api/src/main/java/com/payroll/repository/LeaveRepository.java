package com.payroll.repository;

import com.payroll.entity.Leave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveRepository extends JpaRepository<Leave, Long> {

    // For Admin: Get all leaves, newest first
    List<Leave> findAllByOrderByAppliedAtDesc();

    // For Employee: Get their own leaves
    List<Leave> findByEmployeeIdOrderByAppliedAtDesc(Long employeeId);

    // Security check: Find leave by ID and Employee ID (prevents editing others' leaves)
    Optional<Leave> findByIdAndEmployeeId(Long id, Long employeeId);
}
