# Payroll UI – Frontend

The frontend application for the CM Payroll Management System, built using **Angular 21, TypeScript, and Tailwind CSS**.

It provides a responsive interface for managing employees, attendance, leave requests, payroll, and authentication. The application supports separate Admin and Employee workflows with role-based navigation.

## Technology Stack

| Technology      | Purpose                          |
| --------------- | -------------------------------- |
| Angular 21      | Frontend framework               |
| TypeScript      | Application development          |
| Tailwind CSS    | UI styling and responsive design |
| Angular Signals | Reactive state management        |
| Reactive Forms  | Form handling and validation     |
| Angular Router  | Navigation and lazy loading      |
| HttpClient      | REST API integration             |
| Vitest          | Unit testing                     |

## Requirements

Make sure the following tools are installed:

- Node.js 20.19+ / 22.12+ / 24+
- npm 10.8.2
- Angular CLI 21
- A running Spring Boot backend API

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/jaisaran-dev/CM-Payroll_Project.git
cd CM-Payroll/frontend/payroll-ui
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Configure API URL

Update the API base URL in:

```text
src/environments/environment.ts
```

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://your-production-domain.com/api',
};
```

For production, configure the deployed Render API URL.

### 4. Start Development Server

```bash
ng serve
```

Open the application:

```text
http://localhost:4200
```

## Project Architecture

The application follows a feature-based architecture using Angular standalone components and lazy-loaded routes.

### Folder Structure

```text
src/app/
├── core/
│   ├── guards/
│   ├── interceptors/
│   ├── models/
│   └── services/
│
├── features/
│   ├── auth/
│   ├── attendance/
│   ├── employees/
│   ├── leave/
│   └── payroll/
│
├── shared/
│   ├── components/
│   └── layout/
│
├── app.config.ts
├── app.routes.ts
└── app.ts
```

### Architecture Responsibilities

| Module            | Responsibility                                       |
| ----------------- | ---------------------------------------------------- |
| Core Models       | TypeScript interfaces and API data types             |
| Core Services     | Authentication and API communication                 |
| Route Guards      | Role-based navigation and route protection           |
| HTTP Interceptors | JWT attachment, token refresh, and error handling    |
| Features          | Module-specific pages, forms, and business workflows |
| Shared Components | Reusable tables, buttons, notifications, and dialogs |
| Shared Layout     | Common application layout and navigation             |

## Application Modules

### 1. Authentication

- Secure login interface
- JWT-based authentication
- Access and refresh token handling
- Role-based navigation
- Session management

### 2. Employee Management

- Employee listing
- Search and filtering
- Create and update employee records
- Employee information management

### 3. Attendance Management

- Attendance overview
- Mark attendance
- Employee attendance status
- Attendance history

### 4. Leave Management

- Apply for leave
- View leave history and status
- Review leave requests
- Approve or reject leave applications

### 5. Payroll Management

- Payroll summary
- Salary calculation details
- Record employee payments
- Employee payment history

## User Roles and Navigation

The application provides different access levels based on user roles.

| Feature             | Admin | Super Admin | Employee |
| ------------------- | :---: | :---------: | :------: |
| Dashboard           |   ✓   |      ✓      |    ✓     |
| Employee Management |   ✓   |      ✓      |    —     |
| Attendance          |   ✓   |      ✓      |    ✓     |
| Leave Management    |   ✓   |      ✓      |    ✓     |
| Payroll Management  |   ✓   |      ✓      |    —     |
| Personal Attendance |   —   |      —      |    ✓     |
| Leave Application   |   —   |      —      |    ✓     |
| Payment History     |   ✓   |      ✓      |    -     |

**Note:** Frontend route guards control navigation and improve the user experience. All authentication and authorization permissions must also be validated by the backend API.

## API Integration and Data Flow

The frontend communicates with the Spring Boot backend through REST APIs using Angular HttpClient.

The application follows this request flow:

1. User interacts with a feature component.
2. Reactive forms and Angular Signals manage input and UI state.
3. Feature services send HTTP requests to the backend.
4. HTTP interceptors attach authentication tokens and handle token refresh.
5. API responses are processed and mapped to TypeScript models.
6. Components update the UI with the latest data.
7. Notifications provide feedback for successful operations and errors.

## Authentication and Security

The application uses JWT-based authentication integrated with the Spring Boot backend.

- Access tokens and refresh tokens are currently stored in browser localStorage.
- HTTP interceptors attach access tokens to authenticated requests.
- Expired access tokens trigger the configured refresh flow.
- Route guards restrict navigation based on user roles.
- Backend APIs remain responsible for enforcing authorization.

**Security Recommendation:** Use HTTPS in production and consider migrating authentication tokens to secure, HttpOnly cookies with corresponding backend support.

## Build and Testing

### Production Build

```bash
npm run build
```

The production build output is generated inside:

```text
dist/
```

### Run Unit Tests

```bash
npm test -- --watch=false
```

Unit tests are executed using Vitest through the Angular CLI.

## Deployment

The frontend application is deployed on **Vercel**.

| Environment | Platform |
| ----------- | -------- |
| Frontend    | Vercel   |

Production deployment requires the correct backend API URL and appropriate CORS configuration on the backend.

---

**CM Payroll Management System**
Frontend developed using Angular 21, TypeScript, and Tailwind CSS.
