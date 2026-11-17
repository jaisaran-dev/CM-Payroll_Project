# Payroll API – Backend

The backend application for the CM Payroll Management System, developed using **Java 21 and Spring Boot**.

It provides REST APIs for authentication, employee management, attendance tracking, leave management, and payroll processing. The API connects with the Angular frontend and TiDB Cloud database to manage application data securely.

## Technology Stack

| Technology         | Purpose                          |
| ------------------ | -------------------------------- |
| Java 21            | Backend development              |
| Spring Boot        | Backend framework                |
| Spring Data JPA    | Database operations              |
| Hibernate          | ORM                              |
| Spring Security    | Authentication and authorization |
| JWT                | Token-based authentication       |
| BCrypt             | Password encryption              |
| MySQL / TiDB Cloud | Relational database              |
| Maven              | Build and dependency management  |

## Requirements

Before running the application, make sure you have:

- Java JDK 21
- MySQL or TiDB Cloud database
- MySQL-compatible database client
- Git
- Environment variables for database credentials and JWT secret

**Note:** Maven is not required to be installed separately because the project includes Maven Wrapper.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/jaisaran-dev/CM-Payroll_Project.git
cd CM-Payroll/backend/payroll-api
```

### 2. Database Configuration

The application supports MySQL and TiDB Cloud.

For local development, create the database using the provided SQL schema:

```bash
mysql -h localhost -u root -p < ../../database/schema.sql
```

Configure the required environment variables:

```bash
export DB_USERNAME="2GNte3zsgiBXynv.root"
export DB_PASSWORD="901SoPz4bpB0aKze"
export JWT_SECRET="fbdc51fd5361fb654162428a8a7abfba343993288a2342197663d0a116fb412f"
```

### 3. Run Backend Application

Start the Spring Boot application:

```bash
./mvnw spring-boot:run
```

The backend runs at:

```text
http://localhost:8080
```

API base URL:

```text
http://localhost:8080/api
```

## Project Architecture

The backend follows a layered architecture to separate API handling, business logic, and database operations.

### Folder Structure

```text
src/main/java/com/payroll/
├── config/          # Application configuration
├── controller/      # REST API endpoints
├── dto/             # Request and response objects
├── entity/          # JPA entities
├── enums/           # Application roles and statuses
├── exception/       # Exception handling
├── repository/      # Database access layer
├── security/        # JWT and security configuration
└── service/         # Business logic
```

### Architecture Responsibilities

| Layer      | Responsibility                                    |
| ---------- | ------------------------------------------------- |
| Controller | Handles HTTP requests and API responses           |
| Service    | Contains business logic and application workflows |
| Repository | Performs database operations                      |
| Entity     | Represents database tables                        |
| DTO        | Defines API request and response structures       |
| Security   | Manages authentication and authorization          |
| Exception  | Handles application errors consistently           |
| Config     | Manages application configuration                 |

### Request Flow

```text
Client Request
      |
      v
  Controller
      |
      v
   Service
      |
      v
  Repository
      |
      v
   Database
      |
      v
  API Response
```

Controllers handle incoming requests, services process business logic, and repositories communicate with the database. DTOs are used to transfer data between the frontend and backend.

## API Endpoints

All API endpoints use the `/api` base path.

### Authentication

| Method | Endpoint        | Description          |
| ------ | --------------- | -------------------- |
| POST   | `/auth/login`   | User login           |
| POST   | `/auth/refresh` | Refresh access token |
| POST   | `/auth/logout`  | User logout          |

### Employee Management

| Method | Endpoint          | Description          |
| ------ | ----------------- | -------------------- |
| GET    | `/employees`      | Get all employees    |
| POST   | `/employees`      | Create employee      |
| GET    | `/employees/{id}` | Get employee details |
| PUT    | `/employees/{id}` | Update employee      |
| DELETE | `/employees/{id}` | Delete employee      |

### Attendance Management

| Method | Endpoint                            | Description              |
| ------ | ----------------------------------- | ------------------------ |
| POST   | `/attendance/admin/mark`            | Mark employee attendance |
| POST   | `/attendance/admin/bulk-mark`       | Mark attendance in bulk  |
| GET    | `/attendance/admin/list`            | Get attendance records   |
| POST   | `/attendance/employee/mark`         | Employee self-marking    |
| GET    | `/attendance/employee/{employeeId}` | Get employee attendance  |
| GET    | `/attendance/employee/today`        | Get today's attendance   |

### Leave Management

| Method | Endpoint                       | Description                |
| ------ | ------------------------------ | -------------------------- |
| POST   | `/leaves/employee/apply`       | Apply for leave            |
| PUT    | `/leaves/employee/update/{id}` | Update leave request       |
| DELETE | `/leaves/employee/cancel/{id}` | Cancel leave request       |
| GET    | `/leaves/employee/my-leaves`   | Get personal leave history |
| GET    | `/leaves/admin/all`            | Get all leave requests     |
| PATCH  | `/leaves/admin/{id}/status`    | Approve or reject leave    |

### Payroll Management

| Method | Endpoint                              | Description                  |
| ------ | ------------------------------------- | ---------------------------- |
| GET    | `/payroll/employee/{id}`              | Get employee payroll details |
| GET    | `/payroll/admin/list`                 | Get payroll records          |
| POST   | `/payroll/admin/payments`             | Record employee payment      |
| GET    | `/payroll/admin/{employeeId}/history` | Get payment history          |

### Database Diagnostics

| Method | Endpoint   | Description                 |
| ------ | ---------- | --------------------------- |
| GET    | `/test/db` | Check database connectivity |

**Note:** Actual endpoint access is controlled by Spring Security and backend role-based authorization. Frontend route restrictions alone do not provide API security.

## Database Structure

The application uses a relational database to maintain employee, user, attendance, leave, payroll, and authentication records.

### Main Database Tables

| Table            | Description                             |
| ---------------- | --------------------------------------- |
| employees        | Employee information and salary details |
| users            | Login credentials and user roles        |
| attendance       | Employee attendance records             |
| leaves           | Leave applications and approval details |
| payroll_payments | Employee payment transactions           |
| refresh_tokens   | Refresh token information               |
| login_activity   | User login activity and history         |

### Database Relationships

- Each employee can have one associated login account.
- An employee can have multiple attendance records.
- An employee can submit multiple leave requests.
- An employee can have multiple payroll payment records.
- Users can have multiple refresh tokens and login activity records.

### Database Management

The project includes:

- `database/schema.sql` – Core database structure.
- `database/migrations/` – SQL scripts for database updates.

**Important:** The current SQL schema and JPA entities require synchronization. Hibernate schema updates are currently enabled for development. Before production schema changes, review the database model, prepare versioned migrations, and validate the existing data.

## Security and Authentication

The application uses Spring Security and JWT-based authentication.

- JWT access tokens for authenticated API requests.
- Refresh token rotation for session renewal.
- BCrypt password hashing.
- Role-based authorization for protected endpoints.
- Centralized exception handling.
- Secure token storage using hashed refresh tokens in the database.
- Password fields excluded from employee API response DTOs.

Legacy plaintext passwords are upgraded to BCrypt when the corresponding user successfully logs in.

## Build and Testing

### Run Unit Tests

```bash
./mvnw test
```

### Build Application

```bash
./mvnw clean package
```

The executable Spring Boot JAR is generated inside:

```text
target/
```

Ensure the database is accessible and the required environment variables are configured before running the full test suite.

## Deployment

The backend application is deployed on **Render** and connected to the TiDB Cloud database.

| Component | Platform   | Purpose                      |
| --------- | ---------- | ---------------------------- |
| Frontend  | Vercel     | Angular application hosting  |
| Backend   | Render     | Spring Boot REST API hosting |
| Database  | TiDB Cloud | Managed relational database  |

### Production Configuration

- Database credentials are configured through Render environment variables.
- JWT signing secret is securely configured in the backend environment.
- Database connections use the TiDB Cloud JDBC configuration.
- CORS is configured to allow the deployed frontend domain.
- HTTPS is enabled for production API communication.
- Production database schema changes should use reviewed SQL migrations.

## Related Documentation

- Root README – Complete project overview and setup instructions.
- Frontend README – Angular architecture, setup, and UI documentation.
- Database Schema – Core database structure and migrations.

---
