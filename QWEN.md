# QWEN Context File

## Project Overview

This is a full-stack web application called "fiangonana_react_java" that manages church-related data. It features a React frontend built with Vite and a Spring Boot backend with SQLite database, following a modern full-stack architecture.

The application appears to be designed for managing church members (membres), families (familles), groups/classes (kilasys), and planning (planning). It provides comprehensive CRUD operations for different entities with advanced features like Excel import/export and filtering capabilities.

## Architecture

### Frontend (React + Vite)
- **Framework**: React 19.1.0 with Vite 6.3.5
- **Router**: React Router DOM 7.6.2
- **Styling**: Tailwind CSS with DaisyUI
- **Form Handling**: React Hook Form with Yup validation
- **HTTP Client**: Axios
- **Build Tool**: Vite

**Directory Structure**:
```
front/
├── public/
├── src/
│   ├── api/                    # API service files
│   ├── components/             # Reusable components
│   │   ├── common/             # Generic components
│   │   └── famille/            # Feature-specific components
│   ├── features/               # Feature modules (domain-driven)
│   │   ├── famille/            # Famille feature
│   │   ├── kilasy/             # Kilasy feature
│   │   └── membre/             # Membre feature
│   ├── pages/                  # Page-level components
│   ├── routes/                 # Application routing
│   ├── App.jsx                 # Main application component
│   └── main.jsx                # Application entry point
```

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.5.6
- **Web Framework**: Spring Web (REST APIs)
- **Data Persistence**: Spring Data JPA with Hibernate
- **Database**: SQLite
- **Additional**: Apache POI for Excel operations
- **Build Tool**: Maven

**Key Components**:
- REST Controllers for members, families, and groups
- JPA Entities and Repositories
- Excel import functionality

## Building and Running

### Frontend
1. Navigate to the `front/` directory
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. The frontend will be available on `http://localhost:5173`

### Backend
1. Navigate to the `back/` directory
2. Run with Maven wrapper: `./mvnw spring-boot:run`
3. The backend will start on `http://localhost:8082`

**Note**: The backend CORS configuration allows requests from `http://localhost:5173` and `http://localhost:8082`.

### Production Build
- Frontend: `npm run build` (creates a `dist/` folder)
- Backend: `./mvnw clean package` (creates executable JAR in `target/`)

## Development Conventions

### Frontend Conventions
- **Feature-First Architecture**: Each business entity has its own folder in `features/`
- **Generic Components**: Reusable components in `components/common/` for standard CRUD operations
- **React Hooks**: Modern React with hooks instead of class components
- **ESLint**: Code linting with standard rules
- **Tailwind + DaisyUI**: Utility-first CSS with component library

### Backend Conventions
- **RESTful APIs**: Standard REST endpoints following CRUD patterns
- **JPA/Hibernate**: Object-relational mapping with SQLite database
- **Dependency Injection**: Using Spring's automatic dependency injection
- **Controller-Service-Repository Pattern**: Clean separation of concerns

### API Endpoints
- `/api/membres` - Member management
- `/api/familles` - Family management  
- `/api/kilasys` - Group/class management
- `/api/planning` - Planning management
- `/api/import-excel` - Excel import functionality

### Database
- SQLite is used for local development (demo.db file)
- JPA automatically creates/drops tables on startup (ddl-auto=create-drop)

## Key Features

1. **Member Management** - Create, read, update, delete members with filtering by gender, baptism status, category, etc.
2. **Family Management** - Organize members into families
3. **Group Management** - Manage classes or groups (kilasy)
4. **Excel Import/Export** - Bulk data operations
5. **Responsive UI** - Built with Tailwind CSS and DaisyUI for modern UI
6. **Nested Routing** - Complex page structures with React Router
7. **Form Validation** - Using React Hook Form and Yup
8. **Generic Components** - Reusable CRUD components to reduce code duplication

## Project Purpose

This application appears to be designed for managing church-related information, including:
- Church member data (names, baptism status, family connections, etc.)
- Family structures within the church
- Groups or classes (kilasy) that members belong to
- Planning and scheduling features
- Import/export capabilities for data management