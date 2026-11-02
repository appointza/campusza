# Admin Classes - Data Flow Explanation

## Overview
The `/admin/classes` page shows how to get data from the database, filter it, and create new classes.

---

## 1. Initial Data Loading (Component Mount)

### What Happens:
When the page loads, 4 API calls are made in parallel:

```typescript
const [classes, staff, refs, termData] = await Promise.all([
  classService.getAll(),           // Get all classes
  staffService.getAll(),           // Get all staff
  referenceValueService.getAll(),  // Get reference values (grades, sections, rooms, years)
  termService.getAll(),            // Get all terms
]);
```

### Data Stored in State:
- **classesData**: Classes transformed to UI format
- **staffOptions**: Staff available to assign as mentors
- **referenceValues**: Dropdown options (grades, sections, rooms, academic years)
- **terms**: All terms from database

---

## 2. Reference Values (Dropdown Options)

Reference values are fetched ONCE and used everywhere.

### Categories Available:
- **GRADE** → Grade 9, Grade 10, Grade 11, etc.
- **ACADEMIC_YEAR** → 2024-2025, 2025-2026, etc.
- **CLASS_SECTION** → A, B, C, D, etc.
- **ROOM_NUMBER** → Room 101, Room 102, etc.

### Example:
```typescript
const academicYearOptions = useMemo(
  () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR),
  [referenceValues]
);
// Result: [
//   { id: "ref-1", name: "2024-2025", code: "AY2024" },
//   { id: "ref-2", name: "2025-2026", code: "AY2025" }
// ]
```

---

## 3. Add New Class Form - Data Flow

### Step 1: Select Academic Year
User selects academic year from dropdown.

```typescript
<Select value={addFormData.academicYear} onValueChange={(value) => 
  setAddFormData({ ...addFormData, academicYear: value, termId: "" })
}>
  {academicYearOptions.map(year => (
    <SelectItem key={year.id} value={year.id}>
      {year.name}
    </SelectItem>
  ))}
</Select>
```

### Step 2: Filter Terms by Academic Year
When academic year changes, terms are filtered automatically.

```typescript
const filteredTerms = useMemo(() => {
  if (!addFormData.academicYear) return terms;
  
  // Convert reference value ID to name (e.g., ref-1 → "2024-2025")
  const yearName = resolveReferenceValueName(
    referenceValues, 
    ReferenceValueCategory.ACADEMIC_YEAR, 
    addFormData.academicYear
  );
  
  // Filter terms that match the selected academic year
  return terms.filter((term) => term.academicYear === yearName);
}, [terms, addFormData.academicYear, referenceValues]);
```

### Step 3: Select Term
User selects term from filtered options.

```typescript
<Select value={addFormData.termId} onValueChange={(value) => 
  setAddFormData({ ...addFormData, termId: value })
}>
  {filteredTerms.map(term => (
    <SelectItem key={term.id} value={term.id}>
      {term.name}
    </SelectItem>
  ))}
</Select>
```

### Step 4: Fill Other Fields
- **Grade**: Select from grades reference values
- **Section**: Select from sections reference values
- **Room**: Select from rooms reference values
- **Capacity**: Enter number
- **Mentor**: Optional - select staff member

### Step 5: Create Class
When form is submitted:

```typescript
const handleAddClass = async () => {
  // 1. Validate all required fields
  if (!addFormData.grade || !addFormData.section || 
      !addFormData.academicYear || !addFormData.termId) {
    // Show error
    return;
  }

  // 2. Get display names from reference values
  const gradeName = getGradeName(addFormData.grade);        // e.g., "Grade 9"
  const sectionName = getSectionName(addFormData.section);  // e.g., "A"
  
  // 3. Generate class name
  const name = `${gradeName}-${sectionName}`; // e.g., "Grade 9-A"

  // 4. Prepare payload for backend
  const payload: ClassData = {
    id: "",
    name,
    grade: addFormData.grade,        // Reference value ID
    section: addFormData.section,    // Reference value ID
    academicYear: addFormData.academicYear,  // Reference value ID
    termId: addFormData.termId,      // Term ID
    room: addFormData.room,          // Reference value ID
    capacity: addFormData.capacity,
    mentorId: addFormData.mentorId,
    // ... other fields
  };

  // 5. Send to backend
  const created = await classService.create(payload);
  
  // 6. Add to local state
  setClassesData([...classesData, mapClassToUi(created)]);
};
```

---

## 4. Data Transformation

### Database → UI (Display)
```typescript
const mapClassToUi = (cls: Class): ClassData => ({
  id: cls.id,
  name: cls.name,                          // "Grade 9-A"
  grade: cls.grade,                        // "ref-1" (ID)
  section: cls.section,                    // "ref-2" (ID)
  academicYear: cls.academicYear,          // "2024-2025" (displayed name)
  termId: cls.termId,                      // "term-1" (ID)
  // ...
});
```

### UI → Database (Save)
```typescript
const buildClassPayload = (data: ClassData): Partial<Class> => {
  return {
    id: data.id,
    name: data.name,
    grade: data.grade,                                      // Keep reference ID
    section: data.section,                                  // Keep reference ID
    academicYear: getAcademicYearName(data.academicYear),  // Convert to name
    termId: data.termId,
    // ...
  };
};
```

---

## 5. Key Concepts

### Reference Values vs Direct Values
- **Reference Values**: Dropdown options fetched from DB
  - Used for: Grade, Section, Room, Academic Year
  - Stored as: IDs (e.g., "ref-1")
  - Displayed as: Names (e.g., "Grade 9")

- **Direct Values**: Regular data
  - Used for: Term, Class name, Capacity
  - Stored as: Actual values

### ID vs Name
- **IDs**: Used in form/database for consistency
- **Names**: Displayed to user for readability
- **Helper Functions**:
  - `resolveReferenceValueId()` → Name to ID
  - `resolveReferenceValueName()` → ID to Name

---

## 6. Full Example Flow

```
Page Loads
  ↓
Load Classes, Staff, Reference Values, Terms
  ↓
User Clicks "Add New Class"
  ↓
User Selects Academic Year: "2024-2025"
  ↓
Terms Filter: Show only TERM1, TERM2, TERM3 (of 2024-2025)
  ↓
User Selects Grade: "Grade 9"
User Selects Section: "A"
User Selects Term: "TERM1"
User Selects Room: "Room 101"
User Enters Capacity: "30"
  ↓
User Clicks "Create Class"
  ↓
Validation ✓
  ↓
Form Data:
  - grade: "ref-grade9"
  - section: "ref-sectionA"
  - academicYear: "ref-2024-2025"
  - termId: "term-1"
  - room: "ref-room101"
  - capacity: 30
  ↓
Transform: Name = "Grade 9-A"
  ↓
Send to Backend
  ↓
Backend Creates Class
  ↓
Response: { id: "cls-1", name: "Grade 9-A", ... }
  ↓
Add to UI: setClassesData([...classesData, mapClassToUi(created)])
  ↓
Success Toast
```

---

## 7. Database Tables Involved

### classes
- id, name, grade, section, room, capacity
- academicYear, termId
- classTeacherId, assistantMentorId
- currentEnrollment, status
- createdAt, updatedAt

### reference_values
- id, category (GRADE, SECTION, ROOM_NUMBER, ACADEMIC_YEAR)
- name, code, displayOrder

### terms
- id, name, academicYear
- startDate, endDate
- status

### staff
- id, staffId, fullName, department
- email, phone, status

---

## 8. Services Used

### classService
- `getAll()` → Get all classes
- `create(data)` → Create new class
- `update(data)` → Update class
- `delete(id)` → Delete class

### staffService
- `getAll()` → Get all staff for mentor dropdown

### referenceValueService
- `getAll()` → Get all reference values (used for dropdowns)

### termService
- `getAll()` → Get all terms (filtered by academic year)
