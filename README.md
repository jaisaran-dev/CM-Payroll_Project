# CM Payroll Management System

A full-stack Payroll and Attendance Management System designed to simplify employee management, attendance tracking, leave management, and payroll processing.

The application provides separate Admin and Employee modules with a responsive user interface and secure backend API integration.

## Technology Stack

| Component      | Technology                    |
| -------------- | ----------------------------- |
| Frontend       | Angular, TypeScript           |
| UI Styling     | Tailwind CSS                  |
| Backend        | Java 21, Spring Boot          |
| API            | REST API                      |
| Database       | TiDB Cloud (MySQL Compatible) |
| ORM            | Spring Data JPA, Hibernate    |
| Authentication | Spring Security, JWT          |
| Build Tool     | Maven                         |

## Project Structure

```text
CM-Payroll/
├── backend/
│   └── payroll-api/       # Spring Boot REST API
├── database/
│   ├── schema.sql         # Database schema
│   └── migrations/        # Database migrations
└── frontend/
    └── payroll-ui/        # Angular application
```

## Application Features

### Admin Module

- Employee Management
- Attendance Management
- Leave Management
- Payroll Management
- Salary Calculation and Breakdown

### Employee Module

- Secure Login
- Attendance Marking
- Leave Application and Tracking

## Getting Started

### Prerequisites

Make sure the following tools are installed:

- Node.js 20.19+ and npm
- Java JDK 21
- MySQL-compatible database
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/jaisaran-dev/CM-Payroll_Project.git
cd CM-Payroll
```

### 2. Database Configuration

Configure the database connection using environment variables:

```env
DB_USERNAME = "2GNte3zsgiBXynv.root"
DB_PASSWORD = "901SoPz4bpB0aKze"
JWT_SECRET = "fbdc51fd5361fb654162428a8a7abfba343993288a2342197663d0a116fb412f"
```

For local development, you can use the provided SQL schema:

```bash
mysql -h localhost -u root -p < database/schema.sql
```

### 3. Run Backend

Navigate to the backend directory:

```bash
cd backend/payroll-api
```

Start the Spring Boot application:

```bash
./mvnw spring-boot:run
```

Backend runs at:

```text
http://localhost:8080
```

### 4. Run Frontend

Open another terminal:

```bash
cd frontend/payroll-ui
```

Install dependencies:

```bash
npm install
```

Start the Angular application:

```bash
ng serve
```

Frontend runs at:

```text
http://localhost:4200
```

## Build and Test

**Frontend**

```bash
cd frontend/payroll-ui
npm run build
npm test -- --watch=false
```

**Backend**

```bash
cd backend/payroll-api
./mvnw test
```

## Live Deployment

The application is deployed using the following cloud services:

| Component | Platform   | Purpose                           |
| --------- | ---------- | --------------------------------- |
| Frontend  | Vercel     | Angular application hosting       |
| Backend   | Render     | Spring Boot REST API hosting      |
| Database  | TiDB Cloud | Managed MySQL-compatible database |

### Deployment Architecture

```text
          User
           |
           v
    Angular Frontend
        (Vercel)
           |
           | REST API Requests
           v
    Spring Boot Backend
        (Render)
           |
           | Database Connection
           v
       TiDB Cloud
        (Database)
```

## Production Configuration

The production application uses environment variables to manage sensitive configuration.

- Database credentials are configured securely in the backend environment.
- JWT signing secret is managed through environment variables.
- Frontend API configuration points to the deployed backend.
- Backend CORS configuration allows requests from the deployed frontend.
- HTTPS is used for production communication.

## Project Documentation

For additional technical information:

- `frontend/payroll-ui/README.md` – Frontend setup and architecture.
- `backend/payroll-api/README.md` – Backend setup and API documentation.
- `database/schema.sql` – Database structure.

---
