# School Management System - Business Logic & Flow Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Core Business Concepts](#core-business-concepts)
3. [Business Flow Diagrams](#business-flow-diagrams)
4. [Key Workflows](#key-workflows)
5. [Data Models & Relationships](#data-models--relationships)
6. [Academic Year & Semester Management](#academic-year--semester-management)
7. [Student Lifecycle](#student-lifecycle)
8. [Staff Management](#staff-management)
9. [Attendance Management](#attendance-management)
10. [Fee Management](#fee-management)
11. [Document Management](#document-management)
12. [Class Configuration](#class-configuration)

---

## System Overview

This is a comprehensive Student Management System designed for schools, colleges, and educational institutions. The system manages students, staff, classes, attendance, grades, fees, certificates, and all related administrative tasks.

### Key Features
- **Multi-tenant Architecture**: Supports multiple organizations
- **Role-Based Access Control**: Admin, Admin Staff, Staff, Student, Parent roles
- **Academic Year & Semester Management**: Flexible academic calendar support
- **Student Promotion System**: Track student progression across academic years
- **Dynamic Configuration**: Class-based rules for fees, documents, and marksheets
- **Comprehensive Reporting**: Attendance, performance, financial reports

---

## Core Business Concepts

### 1. Organization
- Each school/institution is an **Organization**
- Organizations have their own students, staff, classes, and configurations
- Multi-tenant isolation ensures data separation

### 2. Academic Structure
- **Academic Year**: e.g., "2024-25", "2025-26"
- **Semester Type**: Semester 1, Semester 2, Annual, Quarterly, Term-Based
- **Term**: Specific periods within an academic year (e.g., "Fall 2024", "Spring 2025")
- **Class**: Grade + Section combination (e.g., "Grade 10-A")

### 3. Student Lifecycle
1. **Admission**: Student is created with Academic Year and Semester
2. **Enrollment**: Student is enrolled in a specific class for a term
3. **Active Learning**: Student attends classes, receives grades, pays fees
4. **Promotion**: Student moves to next academic year/semester
5. **Graduation/Transfer**: Student completes or transfers

### 4. Reference Values
- System-wide lookup data (Genders, Blood Groups, Statuses, etc.)
- Managed centrally in Reference Values
- Used in dropdowns and forms throughout the system

---

## Business Flow Diagrams

### Student Creation Flow
```
1. Admin creates Student
   ↓
2. Select Academic Year (e.g., "2024-25")
   ↓
3. Select Semester Type (Semester 1, Semester 2, Annual, etc.)
   ↓
4. Select Class (Grade + Section)
   ↓
5. Assign Roll Number
   ↓
6. Student is enrolled in selected Academic Year + Semester
   ↓
7. All records (attendance, grades, fees) linked to this context
```

### Student Promotion Flow
```
1. Academic Year/Semester ends
   ↓
2. Admin initiates Promotion
   ↓
3. Select Students to Promote
   ↓
4. Select New Academic Year
   ↓
5. Select New Semester Type
   ↓
6. Select New Class (can promote to next grade)
   ↓
7. System creates Promotion Record
   ↓
8. Student's currentAcademicYear and currentSemesterType updated
   ↓
9. New Enrollment created for new Academic Year/Semester
   ↓
10. Previous records (attendance, grades, fees) remain linked to old context
   ↓
11. Student can now have new records in new context
```

### Attendance Marking Flow
```
1. Staff/Admin opens Attendance page
   ↓
2. Select Date
   ↓
3. Select Class
   ↓
4. System shows all students in that class
   ↓
5. Mark each student: Present/Absent/Late/Excused/Half Day
   ↓
6. Save attendance
   ↓
7. Records stored with:
   - Student ID
   - Date
   - Class ID
   - Academic Year (from student's current context)
   - Semester Type (from student's current context)
```

### Fee Management Flow
```
1. Admin configures Fee Structure for Class + Semester
   ↓
2. System creates StudentFee record when:
   - Student is enrolled
   - New term starts
   - Based on Class Configuration rules
   ↓
3. Fee includes:
   - Total Amount
   - Due Date
   - Payment Schedule (One-time/Installments/Monthly)
   ↓
4. Payments recorded:
   - Amount
   - Date
   - Payment Mode (Cash/Card/Bank Transfer/Online/Cheque)
   - Receipt Number
   ↓
5. System tracks:
   - Paid Amount
   - Pending Amount
   - Status (Paid/Partial/Unpaid/Overdue/Waived)
```

### Document Management Flow
```
1. Admin configures Document Requirements in Class Configuration
   ↓
2. For each Class + Semester, define:
   - Document Type (Marksheet, Bonafide, Transfer Certificate, etc.)
   - Action (Collect from Student / Issue by School)
   - Required At (Admission/Term Start/Term End/Graduation/On Demand)
   - Assigned Staff (who is responsible)
   ↓
3. Staff views assigned documents in Documents page
   ↓
4. Staff clicks on document (e.g., "Bonafide Certificate for Grade 9")
   ↓
5. System shows all students in that class
   ↓
6. Staff marks each student:
   - Issued (if action = "issue")
   - Collected (if action = "collect")
   - Pending
   ↓
7. System tracks status per student
```

---

## Key Workflows

### 1. Student Admission Workflow

**Step 1: Create Student**
- Admin navigates to `/admin/students`
- Clicks "Add Student"
- Fills in:
  - Personal Information (Name, DOB, Gender, Address)
  - Parent/Guardian Information
  - **Academic Year** (required)
  - **Semester Type** (required)
  - Class Selection
  - Roll Number

**Step 2: Enrollment**
- System automatically creates `StudentEnrollment` record
- Links student to:
  - Selected Class
  - Selected Term
  - Academic Year
  - Semester Type

**Step 3: Initial Setup**
- Student's `currentAcademicYear` and `currentSemesterType` set
- Student status = "active"
- Ready for attendance, grades, fees

### 2. Student Promotion Workflow

**When to Promote:**
- End of Academic Year
- End of Semester
- Grade promotion

**Promotion Process:**
1. Admin selects students to promote
2. Choose new Academic Year
3. Choose new Semester Type
4. Select new Class (can be next grade)
5. System:
   - Creates `StudentPromotion` record (history)
   - Updates student's `currentAcademicYear`
   - Updates student's `currentSemesterType`
   - Updates student's `classId`, `className`, `grade`
   - Creates new `StudentEnrollment` for new context
   - **Preserves all previous records** (attendance, grades, fees remain linked to old academic year/semester)

**Result:**
- Student now has new academic context
- Previous records remain accessible via history
- New records will be linked to new context

### 3. Attendance Management Workflow

**Student Attendance:**
1. Staff/Admin goes to Attendance page
2. Selects date and class
3. System shows students enrolled in that class for current academic year/semester
4. Mark attendance for each student
5. Records stored with full context (academic year, semester, term)

**Staff Attendance:**
1. Admin goes to Attendance page → Staff tab
2. View all active staff
3. Mark attendance: Present/Absent/Late/Excused/Half Day
4. Optional: Add check-in/check-out times
5. Optional: Add remarks

### 4. Fee Management Workflow

**Fee Configuration:**
1. Admin goes to `/admin/class-config` → Fee Configuration tab
2. Configure fees for:
   - Specific Grade
   - Specific Class (optional)
   - Semester Type
   - Term
3. Define:
   - Total Amount
   - Currency
   - Payment Schedule (One-time/Installments/Monthly)
   - Number of Installments (if applicable)
   - Due Date

**Fee Assignment:**
- System automatically creates `StudentFee` records based on:
  - Student's enrollment
  - Class configuration rules
  - Term start dates

**Payment Recording:**
1. Admin/Staff records payment
2. Enter:
   - Amount
   - Payment Date
   - Payment Mode
   - Receipt Number
   - Optional remarks
3. System updates:
   - Paid Amount
   - Pending Amount
   - Status

### 5. Document Management Workflow

**Configuration:**
1. Admin goes to `/admin/class-config` → Documents tab
2. Add document requirement:
   - Grade/Class
   - Semester Type
   - Document Type (Marksheet, Bonafide, etc.)
   - Action (Collect/Issue)
   - Required At (Admission/Term Start/etc.)
   - Assign Staff (who handles it)

**Staff Processing:**
1. Staff goes to `/staff/documents`
2. Views documents assigned to them
3. Clicks on a document
4. System shows all students in that class
5. Staff marks each student:
   - Issued (if school issues)
   - Collected (if collected from student)
   - Pending

**Tracking:**
- System tracks status per student
- Shows progress (X of Y students completed)
- Summary statistics

### 6. Class Configuration Workflow

**Purpose:** Dynamically configure rules per class and semester

**Documents Tab:**
- Define which documents are required for which classes
- Set when they're required (admission, term start, etc.)
- Assign staff responsibility
- Distinguish between "collect" and "issue" documents

**Fee Configuration Tab:**
- Set fee amounts per class and semester
- Define payment schedules
- Configure installments

**Benefits:**
- Different classes can have different requirements
- Semester 1 might need different documents than Semester 2
- Grade 10 might need marksheets, Grade 9 might not
- Flexible and configurable

---

## Data Models & Relationships

### Core Entities

```
Organization
  ├── Users (Admin, Staff, Students, Parents)
  ├── Classes
  ├── Students
  ├── Staff
  ├── Terms
  ├── Subjects
  └── Reference Values

Student
  ├── StudentEnrollment (links to Class + Term + Academic Year + Semester)
  ├── StudentPromotion (history of promotions)
  ├── Attendance Records
  ├── Grades
  ├── Fees
  └── Certificates

Class
  ├── Students (enrolled)
  ├── Subjects (taught)
  ├── Schedule
  ├── Mentor (assigned staff)
  └── Assistant Mentor (assigned staff)

Term
  ├── Classes
  ├── Student Enrollments
  ├── Holidays
  └── Academic Year

Reference Values
  └── Used throughout system (Genders, Statuses, Types, etc.)
```

### Key Relationships

1. **Student → Academic Year/Semester**
   - Student has `currentAcademicYear` and `currentSemesterType`
   - All new records use this context
   - Promotion updates these fields

2. **Student → Enrollment**
   - One student can have multiple enrollments (one per academic year/semester)
   - Each enrollment links to Class + Term + Academic Year + Semester

3. **Student → Promotion**
   - One student can have multiple promotions (tracking history)
   - Each promotion records: from → to (academic year, semester, class)

4. **Class → Configuration**
   - Each class can have document requirements
   - Each class can have fee configurations
   - Rules are semester-specific

5. **Staff → Documents**
   - Staff can be assigned to handle specific documents
   - Staff views assigned documents in their dashboard

---

## Academic Year & Semester Management

### Academic Year
- Format: "YYYY-YY" (e.g., "2024-25")
- Managed as Reference Values
- Used throughout system for:
  - Student enrollment
  - Class creation
  - Term creation
  - Fee configuration
  - Report generation

### Semester Types
1. **Semester 1**: First half of academic year
2. **Semester 2**: Second half of academic year
3. **Annual**: Full year (no semesters)
4. **Quarterly**: Four quarters per year
5. **Term Based**: Based on terms (e.g., Fall, Spring, Summer)

### Term
- Specific periods within academic year
- Examples: "Fall 2024", "Spring 2025", "Summer 2025"
- Can have multiple terms per academic year
- Each term has start date, end date, status

### Business Rules
- Students are created with Academic Year + Semester
- All records (attendance, grades, fees) are linked to student's current Academic Year + Semester
- When student is promoted, Academic Year + Semester are updated
- Previous records remain linked to old Academic Year + Semester (preserved for history)

---

## Student Lifecycle

### 1. Admission
- Student created with:
  - Personal information
  - Parent/Guardian information
  - Academic Year (required)
  - Semester Type (required)
  - Class assignment
  - Roll number

### 2. Enrollment
- Automatic enrollment record created
- Links to:
  - Class
  - Term
  - Academic Year
  - Semester Type

### 3. Active Period
- Student attends classes
- Receives grades
- Pays fees
- All records linked to current Academic Year + Semester

### 4. Promotion
- Admin promotes student to new Academic Year/Semester
- System:
  - Creates promotion history record
  - Updates student's current context
  - Creates new enrollment
  - Preserves all previous records

### 5. Completion
- Student graduates or transfers
- Status updated to "graduated" or "transferred"
- All records remain accessible

---

## Staff Management

### Staff Roles
- Teacher
- Administrator
- Counselor
- Coach
- Librarian
- Nurse
- Other

### Staff Assignments
1. **Class Mentor**: Main responsible staff for a class
2. **Assistant Mentor**: Secondary responsible staff
3. **Subject Teacher**: Teaches specific subjects to classes
4. **Document Handler**: Assigned to handle specific documents

### Staff Attendance
- Track daily attendance
- Mark: Present/Absent/Late/Excused/Half Day
- Record check-in/check-out times
- Add remarks

---

## Attendance Management

### Student Attendance
- Marked per class per day
- Statuses: Present, Absent, Late, Excused, Half Day
- Linked to:
  - Student
  - Class
  - Date
  - Academic Year (from student)
  - Semester Type (from student)
  - Term

### Staff Attendance
- Marked per staff per day
- Same statuses as student attendance
- Optional check-in/check-out times
- Used for payroll and leave management

### Attendance Reports
- Daily attendance by class
- Student attendance summary
- Staff attendance summary
- Attendance rate calculations

---

## Fee Management

### Fee Structure
- Configured per:
  - Grade
  - Class (optional)
  - Semester Type
  - Term

### Fee Types
- Tuition Fee
- Registration Fee
- Library Fee
- Laboratory Fee
- Sports Fee
- Transport Fee
- Hostel Fee
- Other

### Payment Modes
- Cash
- Card
- Bank Transfer
- Online Payment
- Cheque

### Fee Status
- Paid: Fully paid
- Partial: Partially paid
- Unpaid: Not paid yet
- Overdue: Past due date
- Waived: Fee waived

### Payment Schedule
- One-time: Single payment
- Installments: Multiple payments over time
- Monthly: Monthly payments

---

## Document Management

### Document Types
- Marksheet
- Report Card
- Transfer Certificate
- Bonafide Certificate
- Character Certificate
- Migration Certificate
- ID Card
- Other

### Document Actions
1. **Collect**: Document collected from student
   - Example: Transfer Certificate from previous school
2. **Issue**: Document issued by school
   - Example: Bonafide Certificate, Marksheet

### Document Requirements
- Configured per:
  - Grade/Class
  - Semester Type
  - Required At: Admission, Term Start, Term End, Graduation, On Demand

### Staff Assignment
- Each document can be assigned to a staff member
- Staff views assigned documents in their dashboard
- Staff marks status per student (Issued/Collected/Pending)

---

## Class Configuration

### Purpose
Dynamically configure rules that vary by class and semester.

### Documents Configuration
- Define which documents are required
- Set when they're required
- Assign staff responsibility
- Track collection/issuance per student

### Fee Configuration
- Set fee amounts per class and semester
- Define payment schedules
- Configure installments

### Business Rules
- Grade 10 might need marksheets, Grade 9 might not
- Semester 1 might need different documents than Semester 2
- Different classes can have different fee structures
- All configurable per class and semester

---

## Reference Values System

### Purpose
Centralized lookup data used throughout the system.

### Categories
- Gender
- Blood Group
- Relationship
- Payment Mode
- Student Status
- Staff Status
- Leave Type
- Fee Type
- Certificate Type
- Document Type
- Semester Type
- Academic Year
- Assessment Type
- Attendance Status
- Term Status
- And more...

### Management
- Admin can create custom reference values
- System values cannot be deleted
- Used in dropdowns and forms
- Ensures consistency across the system

---

## Database Schema Highlights

### Key Tables
1. **students**: Core student information with current academic context
2. **student_enrollments**: Links students to classes, terms, academic years, semesters
3. **student_promotions**: History of student promotions
4. **classes**: Grade + Section combinations
5. **terms**: Academic periods
6. **attendance**: Student and staff attendance records
7. **student_fees**: Fee records per student per term
8. **certificates**: Certificate records
9. **reference_values**: Lookup data
10. **class_configurations**: Dynamic rules per class

### Important Fields
- `current_academic_year`: Student's current academic year
- `current_semester_type`: Student's current semester
- `organization_id`: Multi-tenant isolation
- `is_active`: Soft delete flag

---

## API & Data Flow

### Student Creation
```
POST /api/students
{
  "firstName": "...",
  "lastName": "...",
  "academicYear": "2024-25",
  "semesterType": "semester_1",
  "classId": "...",
  ...
}
→ Creates Student
→ Creates StudentEnrollment
→ Sets currentAcademicYear and currentSemesterType
```

### Student Promotion
```
POST /api/students/{id}/promote
{
  "toAcademicYear": "2025-26",
  "toSemesterType": "semester_1",
  "toClassId": "...",
  "promotionDate": "2025-06-01"
}
→ Creates StudentPromotion (history)
→ Updates Student.currentAcademicYear
→ Updates Student.currentSemesterType
→ Creates new StudentEnrollment
→ Previous records remain unchanged
```

### Attendance Marking
```
POST /api/attendance
{
  "studentId": "...",
  "date": "2024-01-15",
  "status": "present",
  ...
}
→ Creates Attendance record
→ Links to student's currentAcademicYear and currentSemesterType
```

---

## Best Practices

### 1. Academic Year Management
- Always create students with explicit Academic Year and Semester
- Use Reference Values for Academic Years (ensures consistency)
- Promote students at end of academic periods

### 2. Student Records
- All records automatically use student's current Academic Year/Semester
- Don't manually change Academic Year/Semester (use promotion)
- Previous records remain accessible for history

### 3. Class Configuration
- Configure documents and fees per class and semester
- Assign staff to documents for accountability
- Review configurations at start of each academic period

### 4. Reference Values
- Use system-defined values when possible
- Create custom values only when needed
- Don't delete system values

### 5. Multi-tenancy
- Always filter by `organizationId`
- Never expose data across organizations
- Use `isActive` for soft deletes

---

## Future Enhancements

1. **Bulk Promotion**: Promote multiple students at once
2. **Automated Promotion**: Auto-promote based on academic calendar
3. **Fee Reminders**: Automated reminders for pending fees
4. **Document Templates**: Generate documents from templates
5. **Parent Portal**: Parents view student progress, fees, attendance
6. **Mobile App**: Mobile access for staff and parents
7. **Analytics Dashboard**: Advanced analytics and insights
8. **Integration**: Integration with payment gateways, SMS, email

---

## Support & Documentation

For technical documentation, see:
- Model definitions: `src/models/`
- Database schema: `src/models/schema.sql`
- UI components: `src/components/`
- Pages: `src/pages/`

For questions or issues, contact the development team.
