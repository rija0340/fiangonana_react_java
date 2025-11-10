# Planning Functionality Specification

## Overview

The planning functionality in the fiangonana_react_java project serves to manage and assign religious roles to church members across multiple weeks and days. The system provides both a standalone client-side application and an integrated backend-connected solution.

## Architecture Overview

### Standalone Planning Application
- Located in `/planning` directory
- Pure HTML/CSS/JavaScript application
- Client-side only with local storage persistence
- Self-contained with no external dependencies

### Integrated Planning Module
- Located in `/front/src/features/planning` and `/back/src/main/java/com/example/demo/controller/PlanningRestController.java`
- Full-stack implementation with React frontend and Spring Boot backend
- Database persistence with SQLite
- REST API endpoints for data management

## Features

### Core Planning Capabilities
- **Configuration**: Define days and the roles required for each day
- **Person Management**: Add church members with their availability for specific days
- **Automatic Assignment**: Algorithm that assigns people to roles based on availability and equity settings
- **Multi-Week Planning**: Generate assignments over multiple weeks (configurable)
- **Equity Balancing**: Ensures assignments are distributed fairly among available members

### Advanced Features
- **Real-time Assistant**: Visual tool that displays availability and assignment status with filtering options
- **Statistics & Analytics**: Detailed reports on assignment distribution, equity analysis, and identification of potential issues
- **Repetition Detection**: Identifies when the same person is assigned to the same role in consecutive weeks
- **Role Tracking**: Identifies roles that have never been assigned to members who could perform them

### User Interface
- **Tab-based Navigation**: Configuration, Planning, and Statistics tabs
- **Drag-and-Drop**: Reorganize days in the order they appear
- **Interactive Tables**: Clickable cells for modifying assignments
- **Filtering & Highlighting**: Visual tools for focusing on specific people, roles, or weeks
- **Responsive Design**: Adapts to desktop and mobile views

### Data Management
- **JSON Import/Export**: Configuration and planning data can be exported/imported
- **Excel Export**: Final planning can be exported to Excel format
- **Local Storage**: Standalone version persists configuration in browser storage
- **Database Storage**: Integrated version persists in SQLite database

## Technical Implementation

### Standalone Application (Client-Side)
- **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript
- **Data Storage**: localStorage for configuration, in-memory for planning data
- **Libraries**: XLSX for Excel export, Font Awesome for icons
- **UI Framework**: Custom CSS with Tailwind-like utility classes

### Integrated Application (Full-Stack)
#### Frontend
- **Framework**: React 19.1.0
- **Styling**: Tailwind CSS with DaisyUI
- **API Client**: Axios for HTTP requests
- **State Management**: React hooks (useState, useEffect)
- **File Handling**: react-datepicker for date selection

#### Backend
- **Framework**: Spring Boot 3.5.6
- **Data Persistence**: Spring Data JPA with Hibernate
- **Database**: SQLite
- **API**: RESTful endpoints with JSON
- **Models**:
  - Planning: Links week, day, role, and member
  - Jour: Represents a day in the planning system
  - Role: Represents a religious role
  - Membre: Represents a church member

## Conceptual Data Model

### Entity-Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     Membre      │       │      Jour       │
├─────────────────┤       ├─────────────────┤
│ id: Long        │       │ id: Long        │
│ nom: String     │       │ nom: String     │
│ prenom: String  │       │ description:    │
│ ...autres champs│       │   String        │
│                 │       │ ...autres champs│
└─────────┬───────┘       └─────────┬───────┘
          │                         │
          │                         │
          │                         │
          │    ┌─────────────────┐  │
          │    │   Planning      │  │
          │    ├─────────────────┤  │
          │    │ id: Long        │  │
          │    │ numeroSemaine:  │  │
          │    │   Integer       │  │
          │    │ jour: Jour      │  │
          │    │ role: Role      │  │
          └────┼──── membre:     │  │
               │    Membre      │  │
               │                 │  │
               │    ┌─────────────────┐
               │    │     Role        │
               └────┼─────────────────┤
                    │ id: Long        │
                    │ nom: String     │
                    │ description:    │
                    │   String        │
                    │ ...autres champs│
                    └─────────────────┘
```

### Entity Descriptions

**Membre Entity:**
- `id`: Primary key (Long)
- `nom`: Last name of the member (String)
- `prenom`: First name of the member (String)
- `date_naissance`: Date of birth (Date)
- `sexe`: Gender (String/Enum)
- `date_bapteme`: Baptism date (Date)
- `telephone`: Phone number (String)
- `situation_matrimoniale`: Marital status (String/Enum)
- `occupation`: Occupation (String)
- `observations`: Additional notes (String)
- `person_code`: Person code (String)
- `categorie`: Category of the member (String)
- `source`: Source of the data (String)
- `famille`: Family the member belongs to (ManyToOne)

**Jour Entity:**
- `id`: Primary key (Long)
- `nom`: Name of the day (e.g. "Alarobia", "Talata") (String)
- `description`: Additional information about the day (String)
- `ordre`: Order in which the day appears (Integer)

**Role Entity:**
- `id`: Primary key (Long)
- `nom`: Name of the religious role (e.g. "PRESIDE", "FAMPAHEREZANA") (String)
- `description`: Description of the role (String)
- `type`: Type of the role (String)

**Planning Entity:**
- `id`: Primary key (Long)
- `numeroSemaine`: Week number in the planning cycle (Integer)
- `jour`: Associated day (ManyToOne to Jour)
- `role`: Associated role (ManyToOne to Role)
- `membre`: Assigned member (ManyToOne to Membre)

### Relationships

1. **Planning → Membre**: Many-to-One
   - Each planning entry is assigned to one member
   - A member can have multiple planning entries (across different weeks/days/roles)

2. **Planning → Jour**: Many-to-One
   - Each planning entry is for one specific day
   - A day can have multiple planning entries (for different roles/weeks/members)

3. **Planning → Role**: Many-to-One
   - Each planning entry is for one specific role
   - A role can appear in multiple planning entries (across different days/weeks/members)

### Data Models
#### Planning Entity
- `id`: Primary key
- `numeroSemaine`: Week number
- `jour`: Associated day (ManyToOne)
- `role`: Associated role (ManyToOne)
- `membre`: Assigned member (ManyToOne)

### API Endpoints
```
GET    /api/planning - Get all planning assignments
GET    /api/planning/{id} - Get planning by ID
GET    /api/planning/semaine/{numeroSemaine} - Get by week number
GET    /api/planning/jour/{jourId} - Get by day ID
GET    /api/planning/role/{roleId} - Get by role ID
GET    /api/planning/membre/{membreId} - Get by member ID
GET    /api/planning/semaine/{numeroSemaine}/jour/{jourId} - Get by week and day
POST   /api/planning - Create new assignment
PUT    /api/planning/{id} - Update assignment
DELETE /api/planning/{id} - Delete assignment
DELETE /api/planning/reset - Reset all planning data
```

## Assignment Algorithm Features

The planning system uses a sophisticated algorithm that:

1. **Respects Availability**: Only assigns members who are available on the required day
2. **Prevents Conflicts**: Ensures a person isn't assigned multiple roles on the same day within the same week
3. **Prioritizes New Assignments**: Prefers assigning people who haven't yet performed a particular role
4. **Balances Workload**: When "equity mode" is enabled, distributes assignments more evenly
5. **Handles Constraints**: Manages cases where no suitable members are available for a role

## User Interface Tabs

### Configuration Tab
- Add days with specific roles
- Add members with their availability
- Modify existing days, roles, and member availability
- Import/export configuration data

### Planning Tab
- Generate the automatic assignment planning
- Manually edit assignments through click-to-edit cells
- View the real-time assistant with filtering options
- Export the planning to Excel or JSON

### Statistics Tab
- View assignment distribution per member
- Filter by people, weeks, or roles
- Analyze assignment balance and equity
- View detailed assignment history

## Deployment and Usage

### Standalone Version
- Can be run directly in any modern browser by opening `/planning/index.html`
- Settings and configuration persist in browser's local storage
- No server required

### Integrated Version
- Requires both frontend (`npm run dev`) and backend (`./mvnw spring-boot:run`) to be running
- Backend runs on port 8082, frontend on port 5173
- Access via the main application's routing system

## Data Persistence

### Standalone Version
- Configuration data (days, roles, people) stored in localStorage
- Planning assignments are temporary and lost on page refresh
- JSON export/import can save/load complete planning configurations

### Integrated Version
- All data persisted in SQLite database
- Planning assignments stored in the planning table
- Relationships maintained with jour, role, and membre tables
- Full CRUD capabilities through REST API

## Use Cases

This planning system is specifically designed for:
- **Church Service Planning**: Assigning roles for weekly services
- **Religious Event Management**: Organizing volunteers for religious events
- **Assignment Equity**: Ensuring fair distribution of religious duties
- **Scheduling**: Multi-week planning for religious responsibilities
- **Availability Management**: Tracking when members are available for service

The system is flexible enough to handle various types of role assignments in religious or community contexts where equitable scheduling and availability tracking are important.