package com.payroll.repository;

import com.payroll.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.payroll.enums.AttendanceStatus;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    @Query("SELECT a FROM Attendance a JOIN FETCH a.employee WHERE a.employee.id = :employeeId")
    List<Attendance> findByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("SELECT a FROM Attendance a JOIN FETCH a.employee WHERE a.employee.id = :employeeId AND a.attendanceDate = :attendanceDate")
    Optional<Attendance> findByEmployeeIdAndAttendanceDate(@Param("employeeId") Long employeeId, @Param("attendanceDate") LocalDate attendanceDate);

    @Query("SELECT a FROM Attendance a JOIN FETCH a.employee WHERE a.attendanceDate = :attendanceDate")
    List<Attendance> findByAttendanceDate(@Param("attendanceDate") LocalDate attendanceDate);

    @Query("SELECT a FROM Attendance a JOIN FETCH a.employee WHERE a.employee.id IN :employeeIds AND a.attendanceDate = :attendanceDate")
    List<Attendance> findByEmployeeIdInAndAttendanceDate(@Param("employeeIds") List<Long> employeeIds, @Param("attendanceDate") LocalDate attendanceDate);

    @Query("""
            select count(distinct a.attendanceDate)
            from Attendance a
            where a.employee.id = :employeeId
              and a.attendanceDate between :periodStart and :periodEnd
              and a.status = :status
            """)
    long countDistinctAttendanceDays(
            @Param("employeeId") Long employeeId,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd,
            @Param("status") AttendanceStatus status
    );

    @Query("""
            select a
            from Attendance a
            join fetch a.employee
            where a.employee.id in :employeeIds
              and a.attendanceDate between :periodStart and :periodEnd
              and a.status = :status
            """)
    List<Attendance> findByEmployeeIdsAndDateRangeAndStatus(
            @Param("employeeIds") List<Long> employeeIds,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd,
            @Param("status") AttendanceStatus status
    );
}
