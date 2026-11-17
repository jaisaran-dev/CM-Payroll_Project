package com.payroll.entity;

import com.payroll.enums.AttendanceStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "attendance")
public class Attendance {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "employee_id") private Employee employee;
    private LocalDate attendanceDate;
    @Enumerated(EnumType.STRING) private AttendanceStatus status;
    private String remarks;
}
