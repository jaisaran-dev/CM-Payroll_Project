package com.payroll.repository;

import com.payroll.entity.Employee;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByIsActiveTrue();

    List<Employee> findByIsActiveTrueAndCreatedAtLessThan(LocalDateTime createdBefore);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Employee e where e.id = :employeeId and e.isActive = true")
    Optional<Employee> findActiveByIdForUpdate(@Param("employeeId") Long employeeId);
}
