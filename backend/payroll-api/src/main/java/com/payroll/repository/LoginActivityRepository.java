package com.payroll.repository;

import com.payroll.entity.LoginActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginActivityRepository extends JpaRepository<LoginActivity, Long> {
}
