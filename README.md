# Teacher Student Management API - NestJS

A comprehensive Node.js REST API built with NestJS framework for managing teacher-student relationships with MySQL database and Docker support.

## 🛠 Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: MySQL 8.0 with TypeORM
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest, Supertest
- **Containerization**: Docker & Docker Compose
- **Architecture**: Modular design with feature modules

## 📋 Prerequisites

- Node.js 18+
- MySQL 8.0+
- Docker (optional)

## 🚦 Quick Start

### Local Development

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
```
Configure your database connection in `.env`:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_NAME=class
PORT=3000
```

3. **Start MySQL database**
```bash
# Using Docker
docker run --name mysql-dev -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=class -p 3306:3306 -d mysql:8.0

# Or use your local MySQL installation
```

4. **Run the application**
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at:
- **Base URL**: `http://localhost:3000/api/v1`
- **Health Check**: `http://localhost:3000/api/v1/health`
- **Swagger Docs**: `http://localhost:3000/api/v1/docs` (development only)

### Docker Deployment

1. **Start with Docker Compose**
```bash
docker-compose up -d
```

This will start both the API server and MySQL database.

The services will be available at:
- **API Server**: `http://localhost:3000/api/v1`
- **Swagger Documentation**: `http://localhost:3000/api/v1/docs`
- **MySQL Database**: `localhost:3306`

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests  
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 📡 API Endpoints

Base URL: `http://localhost:3000/api/v1`

### 1. Register Students
Register one or more students to a teacher.

```http
POST /api/v1/register
Content-Type: application/json

{
  "teacher": "teacherken@gmail.com",
  "students": [
    "studentjon@gmail.com",
    "studenthon@gmail.com"
  ]
}
```

**Response**: `204 No Content`

### 2. Get Common Students
Retrieve students common to all specified teachers.

```http
GET /api/v1/commonstudents?teacher=teacherken%40gmail.com&teacher=teacherjoe%40gmail.com
```

**Response**:
```json
{
  "students": [
    "commonstudent1@gmail.com", 
    "commonstudent2@gmail.com"
  ]
}
```

### 3. Suspend Student
Suspend a specified student.

```http
POST /api/v1/suspend
Content-Type: application/json

{
  "student": "studentmary@gmail.com"
}
```

**Response**: `204 No Content`

### 4. Get Notification Recipients
Retrieve students who can receive a notification.

```http
POST /api/v1/retrievefornotifications
Content-Type: application/json

{
  "teacher": "teacherken@gmail.com",
  "notification": "Hello students! @studentagnes@gmail.com @studentmiche@gmail.com"
}
```

**Response**:
```json
{
  "recipients": [
    "studentbob@gmail.com",
    "studentagnes@gmail.com", 
    "studentmiche@gmail.com"
  ]
}
```

## 🏗 Project Structure

```
src/
├── modules/                    # Feature modules
│   ├── teacher/               # Teacher module
│   │   ├── teacher.controller.ts    # Request handlers
│   │   ├── teacher.service.ts       # Business logic
│   │   ├── teacher.controller.spec.ts # Controller tests
│   │   ├── teacher.service.spec.ts  # Service tests
│   │   ├── teacher.module.ts        # Module definition
│   │   └── dto/               # Data Transfer Objects
│   │       ├── register-students.dto.ts
│   │       ├── common-students.dto.ts
│   │       ├── suspend-student.dto.ts
│   │       └── notification.dto.ts
│   ├── student/               # Student module
│   │   ├── student.service.ts       # Student business logic
│   │   ├── student.service.spec.ts  # Service tests
│   │   └── student.module.ts        # Module definition
│   └── shared/                # Shared utilities
│       └── utils/             # Utility functions
│           └── email.utils.ts
├── entities/                  # TypeORM entities
│   ├── teacher.entity.ts
│   └── student.entity.ts
├── shared/                    # Shared resources
│   ├── constants/             # Application constants
│   │   └── app.constants.ts
│   └── interfaces/            # Common interfaces
│       └── common.interfaces.ts
├── controllers/               # Global controllers
│   └── health.controller.ts   # Health check endpoint
├── filters/                   # Exception filters
│   └── global-exception.filter.ts
├── app.module.ts              # Root module
└── main.ts                    # Application entry point

test/
├── teacher.e2e-spec.ts        # E2E tests
└── jest-e2e.json             # E2E Jest config
```

## 🗄 Database Schema

### Teachers Table
```sql
CREATE TABLE teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL
);
```

### Students Table  
```sql
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  suspended BOOLEAN DEFAULT false
);
```

### Teacher-Student Relationship
```sql
CREATE TABLE teacher_students (
  teacher_id INT,
  student_id INT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  PRIMARY KEY (teacher_id, student_id)
);
```

## 🔧 Available Scripts

```bash
npm run build        # Build the application
npm run start        # Start the application  
npm run start:dev    # Start in development mode
npm run start:prod   # Start in production mode
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:cov     # Run tests with coverage
npm run lint         # Lint the code
npm run format       # Format the code
```

## ⚠️ Error Handling

All endpoints return meaningful error responses:

```json
{
  "message": "Some meaningful error message"
}
```

Common HTTP status codes:
- `200` - Success (with data)
- `204` - Success (no content)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## 🐛 Validation Rules

- **Email fields**: Must be valid email format
- **Students array**: Must contain at least 1 valid email
- **All fields**: Required unless specified as optional

## 🚀 Deployment

The application is Docker-ready and can be deployed to any containerized environment:

```bash
# Build image
docker build -t teacher-api-nestjs .

# Run container
docker run -p 3000:3000 --env-file .env teacher-api-nestjs
```
