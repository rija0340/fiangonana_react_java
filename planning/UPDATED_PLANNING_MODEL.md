# Planning Functionality Specification - Updated Data Model

## Overview of the Updated Approach

Based on the requirements, the planning system should work as follows:

1. **Date Selection**: Use date picker to select specific dates for planning
2. **Dynamic Days**: Instead of fixed day names (like "Lundi", "Mardi"), use actual dates
3. **Role Assignment per Date**: Assign roles to members for specific dates
4. **Recurring Pattern**: Same roles for similar days of the week across weeks (e.g., Mondays, Wednesdays, Fridays)

## Updated Conceptual Data Model

### Entity-Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     Membre      │       │      Jour       │
├─────────────────┤       ├─────────────────┤
│ id: Long        │       │ id: Long        │
│ nom: String     │       │ date: LocalDate │
│ prenom: String  │       │ nom: String     │
│ ...autres champs│       │ type: String    │
│                 │       │ ...autres champs│
└─────────┬───────┘       └─────────┬───────┘
          │                         │
          │                         │
          │                         │
          │    ┌─────────────────┐  │
          │    │   Planning      │  │
          │    ├─────────────────┤  │
          │    │ id: Long        │  │
          │    │ date: LocalDate │  │
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

**Membre Entity (unchanged):**
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

**Jour Entity (updated):**
- `id`: Primary key (Long)
- `date`: The specific date (LocalDate)
- `nom`: Name of the day based on the date (String - e.g., "Lundi 06/01/2025")
- `type`: Type of day (e.g., "Semaine 1", "Semaine 2") (String)
- `jourSemaine`: Day of week (1-7) to identify pattern (Integer)

**Role Entity (unchanged):**
- `id`: Primary key (Long)
- `nom`: Name of the religious role (e.g. "PRESIDE", "FAMPAHEREZANA") (String)
- `description`: Description of the role (String)
- `type`: Type of the role (String)

**Planning Entity (updated):**
- `id`: Primary key (Long)
- `date`: The specific date for the assignment (LocalDate)
- `jour`: Associated date/day (ManyToOne to Jour)
- `role`: Associated role (ManyToOne to Role)
- `membre`: Assigned member (ManyToOne to Membre)

### Key Changes and Relationships

1. **Jour Entity now represents a specific Date**: Rather than a generic day type, each Jour entity represents a specific calendar date.

2. **Planning uses Date directly**: The Planning entity now has both a date field and a reference to the Jour entity (which also contains the date for additional context).

3. **Date-based Selection**: Users select specific dates using date pickers, creating Jour entries for those specific dates.

4. **Pattern Recognition**: The system can identify recurring patterns based on the day of the week (jourSemaine field).

### Implementation Workflow

1. **Configuration Phase**:
   - User selects multiple dates using date picker (e.g., all Mondays, Wednesdays, Fridays for several weeks)
   - System creates Jour entities for each selected date
   - User assigns roles to each selected date

2. **Planning Generation Phase**:
   - System generates planning entries for each date with the appropriate roles
   - Members are assigned to roles based on their availability for those specific dates
   - Equity algorithm ensures fair distribution across all selected dates

3. **Management Phase**:
   - Users can modify assignments for specific dates
   - System maintains the relationship between dates, roles, and members
   - Statistics and analytics are calculated per specific date

### Benefits of This Approach

1. **Flexibility**: Ability to plan for specific dates rather than generic days
2. **Precision**: Clear identification of exact dates for assignments
3. **Recurring Patterns**: Can recognize and manage recurring day patterns (Mondays, Wednesdays, etc.)
4. **Maintainability**: Clear relationship between actual dates and role assignments
5. **Reporting**: Better reporting based on actual calendar dates rather than generic day names

## API Considerations

The API endpoints would need to adapt to this new model:

```
GET    /api/planning?dateFrom={date}&dateTo={date} - Get planning for a date range
GET    /api/planning/by-date/{date} - Get planning for a specific date
GET    /api/jour/by-date-range?dateFrom={date}&dateTo={date} - Get jours for date range
POST   /api/jour/create-from-dates - Create multiple jours from selected dates
```