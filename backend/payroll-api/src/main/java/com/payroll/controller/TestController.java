package com.payroll.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;

@RestController
@RequestMapping("/api/test")
public class TestController {
    private final DataSource dataSource;

    public TestController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/db")
    public String testDb() {
        try (Connection connection = dataSource.getConnection()) {
            return "✅ CONNECTED! Database: " + connection.getMetaData().getDatabaseProductName();
        } catch (Exception e) {
            return "❌ FAILED: " + e.getMessage();
        }
    }
}
