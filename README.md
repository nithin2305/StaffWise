# StaffWise HRMS

<p align="center">
  <img src="https://img.shields.io/badge/Angular-17-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular 17"/>
  <img src="https://img.shields.io/badge/Spring_Boot-3.2.0-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot 3.2.0"/>
  <img src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 17"/>
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/>
</p>

A comprehensive **Role-Based Human Resource Management System (HRMS)** built with Angular 17 and Spring Boot 3.2. StaffWise provides a complete solution for managing employees, payroll, attendance, leave requests, and more.

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with secure token management
- Role-based access control (RBAC) with 5 distinct roles
- Encrypted password storage

### 👥 User Roles
| Role | Description |
|------|-------------|
| **System Admin** | Full system access, user management, audit logs, system settings |
| **HR Manager** | Employee management, leave approvals, attendance tracking |
| **Payroll Checker** | Review and verify payroll before processing |
| **Payroll Admin** | Full payroll management, salary processing, disbursement |
| **Employee** | Personal dashboard, payslips, leave requests, attendance |

### 📊 Core Modules

#### Employee Management
- Complete employee profiles with personal and professional details
- Department and designation management
- Document management

#### Attendance Tracking
- Daily attendance marking (check-in/check-out)
- Attendance history and reports
- Late arrival tracking

#### Leave Management
- Multiple leave types (Annual, Sick, Casual)
- Leave balance tracking
- Leave request workflow with approvals
- Leave history

#### Payroll Processing
- Monthly payroll computation
- Multi-level payroll workflow (Compute → Check → Authorize → Process)
- Salary components (Basic, HRA, Allowances, Deductions)
- Payslip generation and download (PDF)
- Payroll history

#### System Administration
- Audit logs for all critical actions
- User role and permission management
- System settings configuration

## 🛠️ Tech Stack

### Frontend
- **Angular 17** - Modern web framework with standalone components
- **TypeScript 5.2** - Type-safe JavaScript
- **RxJS 7.8** - Reactive programming
- **CSS3** - Custom styling with responsive design

### Backend
- **Spring Boot 3.2.0** - Java framework
- **Spring Security** - Authentication & authorization
- **Spring Data JPA** - Database operations
- **JWT (jjwt 0.12.3)** - Token-based authentication
- **Lombok** - Boilerplate reduction
- **Maven** - Build tool

### Database
- **MySQL 8.0** - Relational database

## 📁 Project Structure

```
StaffWise/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/staffwise/hrms/
│   │   ├── config/            # Configuration classes
│   │   ├── controller/        # REST API controllers
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── entity/            # JPA entities
│   │   ├── exception/         # Custom exceptions
│   │   ├── repository/        # Data repositories
│   │   ├── security/          # Security configuration
│   │   ├── service/           # Business logic
│   │   └── util/              # Utility classes
│   └── pom.xml
│
├── frontend/                   # Angular application
│   ├── src/app/
│   │   ├── core/              # Core services, guards, interceptors
│   │   ├── features/          # Feature modules
│   │   │   ├── admin/         # System admin features
│   │   │   ├── auth/          # Login/authentication
│   │   │   ├── employee/      # Employee dashboard
│   │   │   ├── hr/            # HR management
│   │   │   └── payroll/       # Payroll management
│   │   └── shared/            # Shared components
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Java 17** (Eclipse Adoptium recommended)
- **Node.js 18+** and npm
- **MySQL 8.0**
- **Maven 3.8+** (or use included wrapper)

### Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE staffwise;
```

2. Configure database connection in `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/staffwise
spring.datasource.username=root
spring.datasource.password=your_password
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Run the application (tables are auto-created)
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will start on `http://localhost:4200`

## 🔑 Demo Accounts

The application initializes with sample data including the following test accounts:

| Role | Email | Password |
|------|-------|----------|
| System Admin | admin@staffwise.com | Admin@123 |
| HR Manager | hr@staffwise.com | Hr@123456 |
| Payroll Checker | checker@staffwise.com | Checker@123 |
| Payroll Admin | payrolladmin@staffwise.com | PayrollAdmin@123 |
| Employee | john.doe@staffwise.com | Employee@123 |

## 📸 Screenshots

### Login Page
Modern login interface with role-based demo account quick access.

### Employee Dashboard
Personal dashboard showing attendance, leave balance, and recent payslips.

### Payroll Management
Complete payroll workflow with computation, verification, and processing.

### HR Management
Employee management, leave approvals, and attendance tracking.

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Employee
- `GET /api/employee/profile` - Get employee profile
- `GET /api/employee/attendance` - Get attendance records
- `POST /api/employee/attendance/check-in` - Mark check-in
- `POST /api/employee/attendance/check-out` - Mark check-out
- `GET /api/employee/leave-balances` - Get leave balances
- `POST /api/employee/requests/leave` - Submit leave request
- `GET /api/employee/payslips` - Get payslip history

### HR
- `GET /api/hr/employees` - List all employees
- `POST /api/hr/employees` - Create employee
- `GET /api/hr/leave-requests` - Get pending leave requests
- `PUT /api/hr/leave-requests/{id}/approve` - Approve leave
- `PUT /api/hr/leave-requests/{id}/reject` - Reject leave

### Payroll
- `POST /api/payroll/compute` - Compute monthly payroll
- `GET /api/payroll/runs` - List payroll runs
- `PUT /api/payroll/runs/{id}/check` - Verify payroll (Checker)
- `PUT /api/payroll/runs/{id}/authorize` - Authorize payroll
- `PUT /api/payroll/runs/{id}/process` - Process/disburse payroll

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/settings` - System settings

## 🔒 Security Features

- **JWT Authentication** - Stateless token-based authentication
- **Password Encryption** - Secure password storage
- **Role-Based Access** - Fine-grained permission control
- **CORS Configuration** - Controlled cross-origin requests
- **Audit Logging** - Track all critical operations

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please open an issue in the repository.

---

<p align="center">
  Made with ❤️ using Angular & Spring Boot
</p>
