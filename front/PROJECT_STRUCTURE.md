# React Project Structure Overview

This document describes the structure and architecture of the React project for reference when creating an admin template.

## Project Setup
- **Framework**: React 19.1.0 with Vite 6.3.5
- **Router**: React Router DOM 7.6.2
- **Styling**: Tailwind CSS with DaisyUI
- **Form Handling**: React Hook Form with Yup validation
- **HTTP Client**: Axios
- **Additional**: xlsx for Excel import/export

## Directory Structure
```
src/
├── api/                    # API service files
│   ├── kilasy.js
│   └── registre.js
├── components/             # Reusable components
│   ├── common/             # Generic components
│   │   ├── GenericCreation.jsx
│   │   ├── GenericDelete.jsx
│   │   ├── GenericEdition.jsx
│   │   ├── GenericForm.jsx
│   │   └── GenericList.jsx
│   └── famille/            # Feature-specific components
├── features/               # Feature modules (domain-driven)
│   ├── famille/            # Famille feature
│   │   ├── components/     # Component files (Create, Edit, List, Delete)
│   │   ├── services/       # Business logic and API calls
│   │   └── utils/          # Utility functions
│   ├── kilasy/             # Kilasy feature
│   │   ├── KilasyList.jsx
│   │   ├── KilasyCreate.jsx
│   │   ├── KilasyEdit.jsx
│   │   └── KilasyDelete.jsx
│   └── membre/             # Membre feature
│       ├── components/
│       │   ├── Create.jsx
│       │   ├── Delete.jsx
│       │   ├── Edit.jsx
│       │   ├── List.jsx
│       │   └── XlsxImport.jsx
│       ├── services/
│       └── utils/
├── pages/                  # Page-level components
│   ├── Dashboard.jsx
│   ├── Home.jsx
│   ├── Famille.jsx
│   ├── Kilasy.jsx
│   └── Membre.jsx
├── routes/                 # Application routing
│   └── index.jsx           # Router configuration with nested routes
├── App.jsx                 # Main application component (currently minimal)
├── main.jsx                # Application entry point (uses RouterProvider)
├── index.css              # Tailwind/DaisyUI configuration and custom styles
```

## Key Architectural Patterns

### 1. Feature-First Architecture
- Each business entity (membre, kilasy, famille) has its own folder in `features/`
- Each feature contains components, services, and utilities related to that domain

### 2. Generic Components
- Reusable components in `components/common/` (GenericCreation, GenericList, etc.)
- Likely used as base components for feature-specific implementations

### 3. Routing Structure
- Nested routes using React Router's children pattern
- Parent routes (Membre, Kilasy, Famille) with child routes (list, create, edit, delete)
- Dashboard as the main layout component

### 4. Styling
- Tailwind CSS with DaisyUI for component styling
- Custom theme defined in index.css
- Light theme with custom color palette

### 5. API Layer
- API services in the `api/` directory
- Axios for HTTP requests
- Feature-specific services in each feature's service directory

## Dependencies
- Core: React 19, React DOM, React Router DOM
- Styling: Tailwind CSS, DaisyUI
- Forms: React Hook Form, Yup
- HTTP: Axios
- Excel: xlsx
- Build: Vite, @vitejs/plugin-react

## Key Features
- CRUD operations for different entities
- Excel import/export functionality
- Nested routing for complex UI flows
- Reusable generic components for standard operations

This structure follows modern React best practices with feature-based organization, reusable generic components, and clean separation of concerns. For an admin template, you can use this same architecture with additional features like user management, role-based access control, analytics, and administrative functions.