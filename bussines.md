# Campusza — Business rules by screen

> **Living document.** When you change a feature, workflow, or validation rule, update the matching section here in the same change.  
> Last updated: 2026-10-31

---

## Screens by role (navigation)

Source of truth for sidebar: `school-hub/src/config/navigation.tsx`.  
Routes: `school-hub/src/App.tsx`.

### Login redirect (`/signin`)

| Role from API | Redirect after login |
|---------------|----------------------|
| `admin`, `admin_staff` | `/admin` or `/admin/onboarding` if setup incomplete |
| `staff` | `/staff` |
| **Staff profile job role `administrator`** | Login and staff save set **`users.role`** to **`admin_staff`** (admin app, not `/staff`). Primary org **`admin`** from signup is unchanged. |
| `student` | `/student/homework` (mobile + DOB login on `/signin` → Student tab) |
| `parent` | **Not implemented** |

**Route guard:** Admin, staff, and student app URLs require a valid **`campusza_user`** session in the browser (login stores email/role/org; no separate bearer token yet). Opening a protected URL while signed out sends you to **`/signin`** and returns you to that URL after login when the role allows it. Already signed in → **`/signin`** redirects into the app. **`/`** (marketing home) also redirects into the app when a session exists.

### Admin (`admin` / `admin_staff`)

**Sidebar** — collapsible groups (`AdminSidebarNavMenu`); active route highlighted; parent group auto-expands. **Dashboard** is a top-level link. **Settings** and **My Profile** live under the **Administration** group (same pattern as other sections).

| Group | Label | Route | Notes |
|-------|--------|--------|--------|
| *(top)* | Dashboard | `/admin` | Overview |
| People & Students | Students | `/admin/students` | |
| People & Students | Staff | `/admin/staff` | |
| People & Students | Promotion | `/admin/promotion` | Promote & transfer |
| People & Students | Classes | `/admin/classes` | |
| Timetable & Scheduling | School Calendar | `/admin/school-calendar` | |
| Timetable & Scheduling | Notifications | `/admin/notifications` | Calendar + notices publish |
| Timetable & Scheduling | Timetable | `/admin/schedule` | Leave & substitutes |
| Timetable & Scheduling | Bell Schedule | `/admin/bell-schedule` | Grade periods |
| **Exams** | Exam series | `/admin/exams` | Series, sessions, seating |
| **Exams** | Exam marks | `/admin/exam-marks` | Class registers & publish |
| Teaching & Attendance | Attendance | `/admin/attendance` | |
| Teaching & Attendance | Homework | `/admin/homework` | |
| Administration | Settings | `/admin/settings` | **`admin` only** |
| Administration | My Profile | `/admin/profile` | Also in user dropdown |

**Routes without sidebar** (direct URL / in-app links)

| Route | Purpose |
|--------|---------|
| `/admin/onboarding` | First-time setup; auto-redirect until complete |
| `/admin/students/:id` | Student detail |
| `/admin/class-config` | Fees, documents, class config |
| `/admin/reports` | Reports |
| `/admin/rooms`, `/admin/exam-rooms`, `/admin/terms` | Redirect to **Settings → References** (`?tab=references&ref=rooms` or `ref=terms`) |
| `/admin/exams/:seriesId` | Exam series detail — subject sessions & combined classes |

### Staff (`staff`)

**Sidebar menu**

| Label | Route |
|-------|--------|
| Dashboard | `/staff` |
| Classes & attendance | `/staff/classes` | Attendance + homework per selected class |
| Timetable | `/staff/schedule` | |
| Homework | `/staff/classes?tab=homework` | Same page as classes; homework tab |
| Students | `/staff/students` |
| Notifications | `/staff/notifications` | Calendar today + notices |
| Profile | `/staff/profile` |

**Routes without sidebar**

| Route | Purpose |
|--------|---------|
| `/staff/attendance` | Standalone attendance (also embedded in Classes) |
| `/staff/students/:studentId` | Student detail |
| `/staff/grades` | Grades & assessment components |
| `/staff/documents` | Document requirements list |
| `/staff/documents/:documentId/students` | Per-student document status |

### Student (`student`)

**Navigation:** On **desktop (lg+)**, sidebar matches the table below. On **mobile**, the drawer sidebar is hidden; **bottom tab bar** shows the same destinations (short labels: Home, Exams, Results, Schedule, Alerts, Profile) with logo + account menu in the top bar.

| Label | Route |
|-------|--------|
| Homework | `/student/homework` |
| Exam timetable | `/student/exams` |
| Exam results | `/student/exam-results` |
| Timetable | `/student/timetable` |
| Notifications | `/student/notifications` | Calendar today + notices |
| Profile | `/student/profile` |

**Status:** Student sign-in (mobile + DOB) and homework-by-date are live; profile is basic.

### Parent (`parent`)

**Not built.** `UserRole` includes `parent` in code, but there are **no routes**, **no sidebar items**, and **no login redirect** for parents.

### Public

| Route | Purpose |
|--------|---------|
| `/` | Landing |
| `/signin` | Sign in |
| `/auth/forgot-password` | Request password reset email |
| `/auth/reset-password` | Set new password from email link (`?token=`) |
| `/auth/setup-password` | First-time password + email OTP (`?token=`) |
| `/register` | Organization signup |

### Feature matrix (quick reference)

| Feature | Admin | Staff | Student | Parent |
|---------|-------|-------|---------|--------|
| School dashboard | ✅ | ✅ | ❌ | ❌ |
| All students | ✅ | Own classes only | ❌ | ❌ |
| Staff management | ✅ | ❌ | ❌ | ❌ |
| Classes / terms / calendar | ✅ | ❌ | ❌ | ❌ |
| Timetable & substitutes | ✅ | Own schedule | ❌ | ❌ |
| Attendance | ✅ school-wide | ✅ own classes | ❌ | ❌ |
| Homework | ✅ overview | ✅ assign | ⚠️ placeholder | ❌ |
| Grades | ❌ | ✅ URL only | ❌ | ❌ |
| Documents | ❌ | ✅ URL only | ❌ | ❌ |
| Reports / class config | ✅ URL only | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ |

---

## How to use this file

| Column | Meaning |
|--------|---------|
| **Route** | URL in school-hub |
| **Who** | Admin / Staff / Student / Public |
| **Purpose** | What the screen is for |
| **Rules** | Business logic, constraints, and edge cases |

---

## Public & auth

### `/` — Landing
- **Who:** Public
- **Purpose:** Marketing / entry to sign in or register.

### `/signin`
- **Who:** Public
- **Purpose:** Login; session stored for API calls (`campusza_user` in localStorage).
- **Rules:** Staff tab: enter email — if the account still needs a password, the page shows **Set password** (emails a link on this screen; no separate forgot-password steps). After setting password via the email link, use **I set my password — sign in** to show the password field. Normal accounts see email + password and **Sign In**; **Forgot your password?** sends a reset link inline (same email API). Students: mobile + DOB tab. **`users.isfactory = true`** marks a **platform super admin**; login response includes **`isfactory`** and the session stores it for future cross-org tooling (same admin UI as org admin today).

### `/auth/forgot-password`
- **Who:** Public
- **Purpose:** Request a password reset link by email.
- **Rules:** Same success message whether or not the email exists. Rate-limited on server. No role or organization picker.

### `/auth/reset-password`
- **Who:** Public (link from email)
- **Purpose:** Choose a new password after forgot-password.
- **Rules:** Token single-use, ~30 minutes. Password min 8 characters; confirmation must match. Success → sign in.

### `/auth/setup-password`
- **Who:** Public (link from welcome email)
- **Purpose:** Set password for new **admin**, **admin_staff**, and **staff** accounts (and similar email-based users).
- **Rules:** Setup token single-use, ~30 minutes. After the setup email is sent, the account is treated as email-verified so the user can set a password directly (OTP step only if email was not sent). Password min 8 characters. Success → sign in at `/signin`. Org signup at `/register` still sets password during registration.

### `/register`
- **Who:** Public
- **Purpose:** New organization signup.

---

## Admin — dashboard

### `/admin`
- **Who:** Admin, admin_staff (school); platform super admin (`users.isfactory = true`).
- **Purpose:** School overview for org admins; super admins are sent to the platform registry.
- **Rules:**
  - **School admin:** `GetAdminDashboardPage` — students, staff, classes today, attendance, recent activity for the signed-in **organization only**.
  - **Super admin (`isfactory`):** Sidebar shows **only** **Registered schools** → **`/admin/platform`**. No other admin nav items. Direct URLs to other `/admin/*` routes redirect to **`/admin/platform`**. Onboarding is skipped. Session stores **`isfactory`** / **`isFactory`**; **`GetSuperAdminFlag`** refreshes the flag on login and admin sidebar load.

### `/admin/platform`
- **Who:** Platform super admin only (`users.isfactory = true` in session).
- **Purpose:** Count and list all registered schools/organizations; configure **Campusza platform fee per active student**.
- **Rules:** Non–super-admins redirect to `/admin`. Data from `GetPlatformDashboardPage`. This is the **only** admin screen super admins may use.
  - **Pricing:** Configured **per organization** (each school row). Choose **per academic year** or **per term** (1st / 2nd / 3rd term, etc.). **Edit pricing** on a row; saved via `SavePlatformStudentPricing` with `organizationid` (`organization_platform_pricing` table).
  - **School list:** **Admin** and **Mobile** come from the org’s primary **admin** user (name from linked staff profile or username; mobile from user `mobile`, else staff phone, else organization phone). **Rate** shows that org’s configured amounts; **Est. platform fee** = active students × yearly rate (or sum of term amounts when billing is per term).

---

## Admin — setup & onboarding

### `/admin/onboarding`
- **Who:** Admin, admin_staff
- **Nav:** Not in sidebar; forced redirect until complete.
- **Purpose:** First-time school setup (reference values, terms, optional staff).
- **Rules:**
  - Flow order: welcome → **staff** (roles, departments, leave types + optional add staff) → academic structure → teaching setup → grading → finish.
  - Reference chips can be added; suggested/added chips are not shown as removable clutter on wrong steps.
  - Staff roles/departments belong on the staff step, not the grading step.

### `/admin/terms` (redirect)
- **URL:** `/admin/terms` redirects to **`/admin/settings?tab=references&ref=terms`**.
- **Purpose:** Academic terms are created on **Settings → References → Academic terms** (same `terms` table as before).

### `/admin/school-calendar`
- **Who:** Admin
- **Purpose:** Per-term calendar: closed days, half-days, weekly patterns.
- **Rules:** Day types: `open`, `closed`, `half_day`. Used to constrain attendance and school-day logic.

### `/admin/notifications`
- **Who:** Admin, admin_staff
- **Purpose:** Publish free-text notices and view the same calendar summary staff/students see.
- **Rules:**
  - Resolves the **active term** (today within term dates, else latest active term) and loads that term’s school calendar rules.
  - **Today** shows open / half day / leave (closed) with optional reason from calendar rules.
  - **Upcoming** lists the next non-working days (closed or half day) within three weeks.
  - **Notices:** title (optional), message body, audience (`all`, `staff`, `student`), optional publish from/to dates; soft-delete removes a notice.
  - Staff and students see only notices matching their role and within the publish window.

### `/admin/bell-schedule` (Grade periods)
- **Who:** Admin
- **Purpose:** Bell schedule / period times per grade; grade subjects and staff-by-class.
- **Rules:**
  - **Step 1:** Select subjects for the grade and **Save grade subjects** (stored on grade metadata; synced to all classes in that grade).
  - **Step 2:** After subjects are saved, **Staff by class** shows one card per class; each saved subject has a **Select staff** dropdown (same layout as before). Empty selections are filled automatically from staff who teach that subject (class homeroom preferred when they match); admins can change any dropdown before **Save all classes** or per-class **Save**. Classes are matched to the grade by reference id or name (e.g. UKG stored as id or label on `/admin/classes`).
  - Staff dropdown prefers teachers who have that subject on their staff profile; falls back to all active staff if none match.
  - **Step 3:** Bell times / period quick setup below staff assignment.
  - Periods include teaching slots and break/lunch rows. Admin timetable grid rows follow grade bell schedule when class has a grade.

### `/admin/class-config`
- **Who:** Admin
- **Nav:** URL only (not in sidebar).
- **Purpose:** Class-level configuration (fees, documents).

### `/admin/settings`
- **Who:** Admin
- **Purpose:** Organization settings and reference values.
- **Rules:**
  - **General → Admission Number Series:** configure **prefix**, **next series number**, **suffix**, digit **padding**, and **auto-generate on add**.
  - **General → School information:** load/save org **name**, contact, address from `organizations`; **school logo** via **Upload logo** (`organization_assets`, kind `logo`, stored as **`logo_asset_id`**). Preview uses asset download URL. Max **25 MB**, images only.
  - **Brand color:** click the logo preview (or use the color picker / hex field) to set **`brand_primary_color`** (`#RRGGBB`). Saved with **Save school information**. Drives **primary**, **accent**, gradients, shadows, sidebar, and **student bottom navigation** on all student routes.
  - Preview shows the next admission number (format: prefix + zero-padded number + suffix).
  - When auto-generate is on, admin/staff can leave admission no blank on add student; system assigns and increments the series.
  - **References** tab: sidebar shows **School rooms**, **Academic terms**, and school lookup lists only (academic year, grade, section, subject, department, exam types, grade columns, staff role, leave type)—same set as onboarding. System/status lookups (gender, fee status, report type, payment mode, etc.) are not listed here even if they exist in the database. Reference rows for `room_number` and `term_status` stay hidden. **Add record** applies to the selected lookup category.
  - **Academic structure** tab: choose an **academic year** (from References → Academic year). Shows **terms** for that year (dates, status) and **classes** grouped under each term (grade, section, teacher, enrollment). Classes in the year with no term appear in a separate warning block. Links to manage terms and `/admin/classes`. URL: `/admin/settings?tab=academic-structure&year={referenceId}`.

---

## Admin — people & classes

### `/admin/students`, `/admin/students/:id`
- **Who:** Admin
- **Purpose:** Student roster and profile (enrollment, history).
- **Rules:**
  - Student list and edit are separate views: selecting a row (or **Edit**) hides the list and shows only the full tabbed edit form (basic, academic, parents, address, medical, transport, fee, docs). **Back to students** returns to the list. The roster **Name** column is plain text (no colored initial circle).
  - Enrollment is per academic year; history is not overwritten on promotion.
  - Add student requires phone + date of birth (DOB is student login password).
  - Roster **class / year** column reflects the student’s **current enrollment**, resolved from the linked **class** record (not stale copied names on the enrollment row alone).
  - **Tabs:** **Students** (roster with year/class filters) and **Promotion history** (org-wide `student_promotions` with link to run promote and open student detail).
  - Saving the student **profile** does not change class or academic year; placement updates only through enrollment APIs (promote / transfer).

### `/admin/promotion`
- **Who:** Admin, admin_staff
- **Purpose:** **Promote** (bulk, new year/class) and **Transfer** (one student, same year, new class).
- **Rules:**
  - **Promote:** Pick **From class** to load current enrollments (matches class id, or same class name + academic year when duplicate class rows exist). Section labels may be reference ids or names — both are accepted.
  - **Promote:** … new enrollment’s **academic year** comes from the selected **To academic year** (resolved to reference storage), not only the target class row.
  - **Transfer:** Pick student, target class, roll, reason, effective date → closes the prior enrollment and creates a new current enrollment from the **target class** (including that class’s academic year); writes `student_transfers`.
  - If no active enrollment matches the source class, promotion **fails** with an error (no silent no-op).
  - History visible on `/admin/students/:id` (Promotions / Transfers tabs).

### `/admin/staff`
- **Who:** Admin
- **Purpose:** Staff roster, subjects, roles, departments.
- **Rules:**
  - Staff must have **subjects** on profile for timetable and **replacement** matching.
  - **Add Staff** opens `/admin/staff/new` (full screen).
  - **Edit** on a card turns that card into an inline form (same fields as create/edit). **Save** / **Cancel** on the card; only one card can be edited at a time.
  - Each roster card shows First Name, Last Name, Email, Phone, Role, Department, Subjects, and Status. **Edit** and **Delete** are on the card (no view-profile action). Staff cards use a **flat** layout (no drop shadow) with a slightly darker border. Search is inline below the page title (no outer card/border).
  - Remove uses a confirmation dialog.
  - Create and edit require first name, last name, email, department, and role. If department is not selected, **Save** is blocked and an inline error is shown under the department field (and a toast). Subjects are optional. Status is edited only on the edit screen / inline card.
  - After save, the screen returns to the roster. New staff receive a **Set up your Campusza account** email with a link to `/auth/setup-password` (SMTP in `appsettings` → `Mail`); no temporary password in the UI.

### `/admin/staff/new`
- **Who:** Admin
- **Nav:** URL only (opened from **Add Staff** on `/admin/staff`).
- **Purpose:** Create a staff member.
- **Rules:** Same required fields as the staff roster create rule above.

### `/admin/staff/:id/edit`
- **Who:** Admin
- **Nav:** URL only (optional deep link; roster **Edit** uses inline card edit instead).
- **Purpose:** Update one staff member on a dedicated screen.
- **Rules:** Same fields as inline edit. Missing id shows “not found” and back to roster.

### `/admin/classes`
- **Who:** Admin
- **Purpose:** Classes, sections, academic year, term assignment.
- **Rules:**
  - **Class homeroom:** Each **active class** may use a given **school room** at most once per **academic year** (e.g. Room 1 for LKG-A in 2025–26 blocks another class in **that same year**; the same room may be reused for a new year’s classes). Timetable and exams may still use the same room in other periods; this rule applies to the class **Room** field on `/admin/classes` only.
  - **Room picker:** Homeroom choices come from **Settings → References → School rooms**. Inline **Add room** on create/edit class still allowed when the list is empty.
  - Term dropdown filters by **selected academic year** (term’s `academicyear` / name must match).
  - Empty term list usually means term is tied to a different year label (e.g. 2026–2028 vs 2026–2027).
  - **Class cards** list the same summary fields as edit: academic year, term, subject, teacher, room, student count, schedule, class mentor, assistant mentor (empty assistant shows **No Assistant Mentor**).
  - Card actions: **Edit** (inline on card, Save/Cancel) and **Delete** icon buttons; one class editable at a time (no edit dialog).
  - Roster cards are **compact** in view mode (summary line + short grid); editing expands one **full-width** row for the form (from `sm` breakpoint up; single column on small phones).

---

## Admin — timetable, leave & substitutes

### `/admin/schedule`
- **Who:** Admin
- **Purpose:** Class timetables, leave, substitute teachers.
- **Rules:**
  - **Week navigator:** Column headers show **day + date** (en-GB) for the selected week.
  - **Timetable cells:** Weekly template; **substitutions** show per **date** (yellow ring + “Sub” + substitute name on that weekday’s date).
  - **Leave:** Cannot record overlapping **pending/approved** leave for same staff and overlapping dates.
  - **Leave duration:** Replacement needed only on **actual leave days** in range, not whole week.
  - **Assign replacement:** (1) Pick **free teacher** at slot, (2) Pick **subject** from that teacher’s profile (default = scheduled subject if they teach it).
  - After assign: card removed from “needs replacement”; entry appears in **Replacement history**.
  - Replacement stores `subject_id` / `subject` (migration: `add_staff_replacement_subject.sql`).
  - **Auto-generate:** Opens with **no** grades/classes pre-selected. After you check a grade (e.g. UKG), the **Classes** list shows only classes for that grade (matched by grade id or name). Pick classes, then **Generate** (disabled until at least one class is checked).
  - **Class View tab:** Search or pick a class; cards show grade/section, class teacher, periods/week, working days, subjects, and teachers; **View Schedule** shows that class’s weekly grid (read-only; uses that grade’s bell schedule).
  - **Staff View tab:** No default “all staff”; pick a staff member (or **View Schedule** on a card) to see their weekly grid.
  - **Subject/week summary:** Per-class table shows periods per subject per week on the Timetable tab.
  - **Rooms:** Period room choices come from **Settings → References → School rooms** (`SchoolRoom/Select`). Saved timetable rows store the room **`school_rooms.id`** in `staff_schedules.room` (display name shown in the UI). Room double-booking is blocked when the same room id overlaps on the same day and time (frontend validation + backend on save).

### `/admin/attendance`
- **Who:** Admin
- **Purpose:** View/manage attendance across school.
- **Rules:** Dates formatted consistently (en-GB). School calendar enforcement planned/extend as needed.

### `/admin/homework`
- **Who:** Admin
- **Purpose:** Overview of homework assignments.

### `/admin/exams`
- **Who:** Admin / admin_staff
- **Purpose:** Create **exam series** (term, date range, assessment type) and open **grade timetable** for subject dates.
- **Rules:**
  - **List layout:** **Cards** (default) or **List** table toggle on the series list; search filters by name, term, type, and status. Choice is remembered for the browser session.
  - **Save details** on edit keeps you on the list; **Edit grade timetable** / **Save & open timetable** opens `/admin/exams/:seriesId` for subject dates. Create flow still opens timetable after save.
  - Series dates must fall within the selected **term**; academic year must match the term.
  - Lifecycle: **Draft → Scheduled → Published** (Cancel allowed with reason). **Validate** runs calendar, overlap, and session checks before Schedule/Publish.
  - **Publish** sets all non-cancelled sessions in the series to **Published** (students only see published series + published sessions).
  - Sessions support **multiple classes** on one sitting (combined exam).
  - Subject must be allowed for each attached class (grade metadata + class subjects).
  - **School calendar:** `closed` days block exams; **half_day** allows exams only until the configured latest end time (`organizations.settings` → `{ "exams": { "halfDayLatestEnd": "12:00:00" } }`, default `12:00:00`). Policy text is returned on `GetAdminExamsPage` for admins.
  - **Student overlap:** saving or validating detects the same student (current enrollments across attached classes) with overlapping exam times on the same date.
  - Organization scope enforced server-side (`OrganizationIdResolver`); do not trust client org IDs alone.

### `/admin/exams/:seriesId`
- **Who:** Admin / admin_staff
- **Purpose:** **Grade timetable only** — assign exam dates per subject for each grade in the series term.
- **Rules:**
  - Saving a series from `/admin/exams` always opens this page. Pick **grade**, enter **exam date** per subject (from Admin → Schedule grade subjects), **Save timetable** (all sections of that grade in the term). Repeat for each grade.
  - Default start/end at the top fill new rows; each subject row has its own **Start** and **End** for multiple papers on one day (e.g. morning 9–12, evening 4–6). Quick slot buttons set all rows; adjust individual subjects as needed.
  - **All sessions** lists saved rows; **Edit in planner** selects that grade in the planner above.
  - Combined exams: one save attaches every class section for the selected grade. No separate single-subject form.
  - **Seating** link opens room allocation for a session.
  - Session save/validate uses same calendar, overlap, and subject rules as series-level validation.

### `/admin/rooms` (redirect)
- **URL:** `/admin/rooms` and `/admin/exam-rooms` redirect to **`/admin/settings?tab=references&ref=rooms`**.
- **Purpose:** **School rooms** master — class homeroom, timetable, exam seating — managed on **Settings → References → School rooms**.
- **Rules:** One pool of rooms for the whole school. Unique active name per org; positive capacity; optional seating grid (rows × columns must not exceed capacity). Cross-org room references rejected on class/timetable/exam save. **`room_number` reference values are deprecated.**

### `/admin/exam-rooms`
- **Purpose:** Alias redirect to **Settings → References → School rooms** (same as `/admin/rooms`).

### `/admin/exams/:seriesId/sessions/:sessionId/seating`
- **Who:** Admin / admin_staff
- **Purpose:** Assign rooms to a session, generate seats (`RollNumber` / `AdmissionNumber`), view seat plan; invigilator API available.
- **Rules:** Rooms must not overlap other sessions at the same date/time; allocated capacity ≤ room capacity; total capacity must cover eligible students before seating; manual/locked seats preserved on auto-generate; published sessions require correction reason; `FOR UPDATE` session lock during seating writes.
  - **Manual assign:** Student must belong to a class on the session; room must be allocated to the session; replacing an occupied or locked seat requires explicit replace and/or correction reason.
  - **Invigilators:** Staff assigned per session room; staff and room must belong to the organization.

### `/admin/exam-marks`
- **Who:** Admin / admin_staff
- **Purpose:** Class-wide **exam marks register** (one row per student, column per subject session); approve registers and publish **Results Published** for the series.
- **Rules:**
  - Registers are keyed by **exam series + class**; combined sessions (e.g. 10-A + 10-B Maths) use the **same** `exam_session_id` but **separate** registers per class roster.
  - **Access:** `GetRegister` treats `users.role` **admin** / **admin_staff** as full register access (no staff row required). Staff users need a matching **staff** profile (by `profile_id` or staff email).
  - Workflow on `exam_class_mark_registers`: **Draft → Submitted → Approved**; reopen requires reason and audit; approved registers block edits until reopen.
  - Marks: `Present` within `max_marks`; **Absent / Excused / Exempt ⇒ NULL marks**; **Pending + NULL** = not entered (distinct from zero).
  - Staff submit drafts; **admin** approves and publishes results after all class registers are approved and complete.
  - **Staff save:** class mentor / assistant mentor may edit **any subject column** on that class register; timetable teachers may edit columns for subjects they teach on `staff_schedules`; others may edit if the subject is on their staff profile. (Exam sessions are already limited to the selected class.)
  - `exam_marks` is separate from legacy **`/staff/grades`** (`student_grades`); no sync between them.
  - Print-friendly register view via browser print CSS.

### `/staff/exam-marks`
- **Who:** Staff (class teacher, scheduled subject teacher, or subject on profile for that class)
- **Purpose:** Enter and submit class exam marks for assigned classes/subjects only.
- **Rules:** Same register grid as admin; cannot approve or publish; invigilator assignment does **not** grant marks entry. Class list includes mentor classes and classes from the staff timetable.

### `/student/exam-results`
- **Who:** Student
- **Purpose:** View **own** results after series status **Results Published**.
- **Rules:** API rejects other students’ IDs and unpublished series; totals exclude exempt subjects; absent rows do not invent marks.

### `/admin/reports`
- **Who:** Admin
- **Nav:** URL only (not in sidebar).
- **Purpose:** Reports and exports.

### `/admin/profile`
- **Who:** Admin
- **Purpose:** User profile; sidebar name from session email/username.

---

## Staff

### `/staff` — Dashboard
- **Who:** Staff
- **Purpose:** Today’s classes, counts, next class.
- **Rules:** Based on staff’s assigned classes and today’s timetable template.

### `/staff/classes`
- **Who:** Staff
- **Purpose:** **Hub for class work** — pick a class, shared date, then **Attendance** or **Homework** tab.
- **Rules:**
  - Left panel = class list; right panel = tabs (**Attendance** | **Homework**) for the **active class**.
  - One **date** control applies to both tabs (today shortcut available).
  - URL: `?classId=` and `?tab=attendance|homework` (Homework nav links to `?tab=homework`).
  - Attendance: mark present/absent/late per student; past dates read-only.
  - Homework: add/edit/delete for **selected class** on selected date (timetable slot or class fallback).

### `/staff/attendance`
- **Who:** Staff
- **Nav:** URL only; primary flow is **Classes & attendance** (`/staff/classes`).
- **Purpose:** Dedicated attendance view (class + date).

### `/staff/schedule`
- **Who:** Staff
- **Purpose:** Personal timetable with **date** overrides (leave & substitutes).
- **Rules:**
  - Date picker selects **effective** day (not only weekly template).
  - **Substitute duty** (`substitute`): staff covers another teacher — marked **Substitute** (amber), “covering for …”.
  - **Covered** (`covered`): own class while on leave — **Substitute** badge + replacement name.
  - **On leave** (`on_leave`): approved leave, awaiting or showing substitute.
  - Weekly grid highlights selected day column; substitute cells show **SUB** tag.
  - Requires `staff_replacements.subject_id` columns in DB (see migrations).

### `/staff/homework`
- **Who:** Staff
- **Nav:** Redirects to `/staff/classes?tab=homework` (homework lives on Classes page).
- **Purpose:** Legacy route; use Classes page homework tab.

### `/staff/students`, `/staff/students/:studentId`
- **Who:** Staff
- **Purpose:** **Class roster hub** — pick a class, view students in that class, add new students to the selected class.
- **Rules:**
  - Left panel = assigned classes with student count; right panel = roster for **active class**.
  - URL: `?classId=` deep-links from Classes page **Roster** button.
  - **Add to this class** pre-fills class and academic year; roll number defaults to next in class.
  - Search and status filter apply within the selected class roster.
  - **Edit** opens a tabbed dialog: Basic, Academic, Parents, Address, Medical, Transport, Fee (+ app login), Documents (upload placeholder).
  - **Required on save:** admission no, first name, gender, guardian name/phone, class roll number.
  - **Academic tab:** academic year, class, and section are **read-only** (from current enrollment); roll number updates the enrollment record. Class changes use **Transfer**, not edit.
  - **Extended fields** (father/mother, transport, fees, house, category, etc.) stored in `students.extended_profile` JSON; core identity/contact on `students`.
  - On **add student**, backend auto-creates a `users` row (`role=student`) with **mobile** (from student phone) and **password = date of birth** (DOB required on add form).
  - Promote / import / export still available; detail view at `/staff/students/:studentId`.

### `/staff/notifications`
- **Who:** Staff
- **Purpose:** Read-only feed: **today’s** school calendar status, upcoming closed/half days, and admin notices (`all` + `staff` audiences within publish dates).

### `/staff/grades`
- **Who:** Staff
- **Nav:** URL only (not in sidebar).
- **Purpose:** Grades per class/term; assessment components and weights.
- **Rules:** Component codes locked after first save if grades exist.

### `/staff/documents`, `/staff/documents/:documentId/students`
- **Who:** Staff
- **Nav:** URL only (not in sidebar).
- **Purpose:** Document requirements and per-student status.

### `/staff/profile`
- **Who:** Staff
- **Purpose:** Profile.

---

## Student

**Portal status:** Student login via `/signin` → **Student** tab (mobile + DOB). Sidebar routes below.

**Shell branding:** On all student screens (mobile top bar and lg+ sidebar), the app shows the **school name** and **school logo** from organization settings (`logo_asset_id` or legacy `logo_url`), not the Campusza product mark. If the org has no name configured, the Campusza fallback is shown until branding loads or when name is missing. When **`brand_primary_color`** is set, student UI uses it as the primary theme color.

### `/signin` (student tab)
- **Who:** Student
- **Rules:** Mobile number (10 digits) + **date of birth** as password. API: `User/LoginWithMobile`. Redirect to `/student/homework`.

### `/student/homework`
- **Who:** Student (signed in with mobile + DOB)
- **Nav:** Sidebar
- **Purpose:** View homework assigned to the student’s current class for a selected date.
- **Rules:**
  - Date picker loads assignments for that **assigned date** (`GetStudentHomeworkPage`); grouped by subject.
  - Empty state when no enrollment or no homework for the date.

### `/student/exams`
- **Who:** Student (signed in with mobile + DOB)
- **Nav:** Sidebar **Exam timetable**
- **Purpose:** Read-only list of **published** exam sessions for the student’s **current enrollment class**.
- **Rules:**
  - Data from `GetStudentExamTimetablePage` (student id from session; org from resolver).
  - Only **Published** exam series and **Published** sessions for the enrolled class; no draft/scheduled items, no other students’ data, no cross-org rows.
  - Unpublished exams are never returned even if the client guesses session IDs.

### `/student/timetable`
- **Who:** Student
- **Nav:** Sidebar
- **Purpose:** Class weekly timetable and daily periods table.
- **Rules:**
  - Date picker loads effective schedule for that day (`GetStudentTimetablePage`).
  - Shows subject, teacher, room; substitute/leave badges when applicable.
  - Weekly grid highlights the selected weekday column.

### `/student/notifications`
- **Who:** Student
- **Nav:** Sidebar
- **Purpose:** Calendar today/upcoming closed or half days plus admin notices (`all` + `student`).
- **Rules:** Student layout uses a compact hero header, today strip, timeline for upcoming non-working days, and notice cards with left accent; empty state when no notices.

### `/student/profile`
- **Who:** Student
- **Nav:** Sidebar (when student layout is used).
- **Purpose:** Profile.

## Parent

**Portal status:** Not implemented — no routes, nav, or login in `App.tsx` / `SignIn.tsx`.

---

## Cross-cutting rules

| Area | Rule |
|------|------|
| **Dates** | UI dates prefer **en-GB** (`formatShortDate`, `formatDateRange`, `localDateYmd`). |
| **Replacements** | One active replacement per schedule + **date**; status `active`, `is_active` true. |
| **Staff ID** | Page APIs resolve staff via session `staffId` or email → `ResolveStaffIdAsync`. |
| **Assets** | Org files live in **`organization_assets`** (metadata + storage key). Upload via API → store **`photo_asset_id`**, **`logo_asset_id`**, or **`document_uploads.asset_id`**. Max **25 MB**; images, PDF, common Office docs. Local disk under server **`AssetStorage/`** when S3 is off; enable **`ApplicationSettings:awss3config:iss3enabled`** for S3. Download: `GET .../OrganizationAsset/Download/{id}?organizationid=&email=`. |
| **Migrations** | Run SQL in `campusza_server/Campusza/Database/migrations/` before using new columns (e.g. replacement subject, homework, school calendar, **organization_assets**). |
| **API** | Frontend: `school-hub`; backend: `campusza_server` (.NET). Restart API after server changes. |
| **Email** | SMTP via `Mail` (or `Email:*` / `CAMPUSZA_SMTP_*` env) in `appsettings.json`. Links use `ApplicationSettings:frontendBaseUrl` (e.g. `http://localhost:8087`). Used for staff/admin initial setup, forgot password, and password-changed notices. Students use mobile + DOB, not email reset. |

---

## Changelog

| Date | Area | Change |
|------|------|--------|
| 2026-10-31 | Admin settings | General tab: brand color picker from school logo (`brand_primary_color`); student app theme uses saved color. |
| 2026-10-31 | Admin settings | General tab: school profile + logo upload (`logo_asset_id` / organization assets). |
| 2026-10-31 | Admin settings | References sidebar limited to onboarding/school lookups (not every DB category). |
| 2026-10-31 | Admin settings | **Academic structure** tab: year picker → terms and classes per term. |
| 2026-10-31 | Auth / staff | Staff job role **Administrator** maps to **`users.role` = `admin_staff`** (admin UI); synced on staff save and login. |
| 2026-10-31 | Admin platform | School list shows **Admin** name and **Mobile** per organization on `/admin/platform`. |
| 2026-10-31 | Admin platform | Platform fee per student is **per organization** (`organization_platform_pricing`); edit on each school row. |
| 2026-10-31 | Admin platform | Platform **fee per student** (per year or per term) on `/admin/platform`; `SavePlatformStudentPricing`. |
| 2026-10-31 | Admin platform | Super admin sidebar shows only **Registered schools**; route guard limits admin UI to `/admin/platform`. |
| 2026-10-31 | Admin platform | `/admin/platform` + sidebar **Registered schools**; `isfactory` persisted in localStorage; `GetSuperAdminFlag` sync. |
| 2026-10-31 | Admin dashboard | Super admin (`isfactory`) sees platform overview: schools registered + org list on `/admin`. |
| 2026-10-31 | Auth | `users.isfactory` super-admin flag; login returns `isfactory`; seed script for platform admin account. |
| 2026-10-31 | Student shell | Saved brand color applies to bottom nav, buttons, icons, gradients, and sidebar via CSS theme tokens. |
| 2026-10-31 | Assets | Central **`organization_assets`** table + upload/select/download API; optional FKs on staff/student photos, org logo, document uploads. |
| 2026-10-31 | Sign-in | First-time staff/admin: **Set password** on sign-in sends email link; no multi-step banner. Forgot uses same flow on page. |
| 2026-10-31 | Auth / email | Gmail SMTP (`Mail` in appsettings); setup + forgot/reset links for admin/admin_staff/staff; frontend base URL for email links. |
| 2026-10-31 | Student mobile nav | Student uses bottom tab bar on mobile; sidebar remains on lg+ screens. |
| 2026-10-31 | Student notifications | Refined student notifications layout (hero, today strip, timeline, notice cards). |
| 2026-10-31 | App auth | Stricter session validation, dashboard guard, 401 → sign-in, return URL after login. |
| 2026-10-30 | Admin promotion | Close prior enrollment uses valid enrollment_status values on promote (fixes DB check constraint). |
| 2026-10-30 | Admin promotion | Source class list matches enrollments (section id/name, duplicate class names by year). |
| 2026-10-30 | Admin students | Academic year + class filters; roster columns split by year and class; add form class scoped to year. |
| 2026-10-30 | Admin promotion | Promote API uses internal student id; new enrollment year from selected target academic year. |
| 2026-10-30 | Admin students / promotion | Roster shows current enrollment via class join; promote/transfer rewrite enrollments in a transaction and sync student placement. |
| 2026-10-30 | Admin classes | Class homeroom uniqueness scoped to **academic year** (room picker and save API). |
| 2026-10-30 | Admin nav | Dedicated **Exams** sidebar group (Exam series, Exam marks). |
| 2026-10-30 | Admin nav | **Classes** under People & Students (removed empty Academic Management group). |
| 2026-10-30 | App auth | Landing `/` redirects to role home when `campusza_user` is in the browser. |
| 2026-10-30 | Admin settings | Rooms and terms managed inline on References; standalone `/admin/rooms` and `/admin/terms` removed (redirect). |
| 2026-10-30 | Admin settings | References sidebar lists School rooms & Academic terms with counts and open links. |
| 2026-10-30 | Admin settings | References tab links to Terms/Rooms; hides `room_number` and `term_status` categories. |
| 2026-10-30 | Admin classes | Inline **Add room** on create/edit class when no rooms (quick name + capacity). |
| 2026-10-30 | Rooms / classes | Class and onboarding room pickers use Admin → Rooms only; Settings hides `room_number` reference category. |
| 2026-10-30 | Staff students | Refined roster UI — stats pills, class hero, mobile cards, cleaner table. |
| 2026-10-30 | App auth | Protected admin/staff/student routes; sign-in redirect when session missing or already logged in. |
| 2026-10-30 | Admin exams | Cards/List toggle and search on series list; cleaner actions (Schedule, Publish, overflow menu). |
| 2026-10-30 | Admin exams | Schedule/Publish (active) from edit dialog; buttons enabled only when allowed; Published shown as active for students. |
| 2026-10-29 | Exam marks register | Admin/staff caller resolved from campusza users.email + role (not UserAccount userid). |
| 2026-10-29 | Rooms | Optional seating grid may be smaller than capacity; grid cannot exceed capacity. |
| 2026-10-29 | Rooms | Migration import skips `room_number` reference rows with null `organization_id`. |
| 2026-10-29 | Rooms | Unified room tenant checks, grid validation, timetable stores room id; migration backfills staff_schedules; `SchoolRoom` + `ExamRoom` share one service. |
| 2026-10-29 | Rooms | Clarified single room pool: any room for class, timetable, or exams (no separate exam-room type). |
| 2026-10-29 | Exam module (Phase 5) | Tenant org/email binding, invigilator overlap checks, mark concurrency tokens, Phase 5 tests, register UX confirmations, optional index migration. |
| 2026-10-29 | Exam module (Phase 4) | Class marks register UI; GetRegister/SaveRegister/Submit/Approve/Reopen; results publish/revoke; student results; hall ticket API; audit; tests. |
| 2026-10-29 | Exam module (Phase 3) | Exam rooms master, session room allocation, auto/manual seating, invigilators; admin `/admin/exam-rooms` and session seating UI. |
| 2026-10-29 | Exam module (Phase 2) | Admin `/admin/exams` + series detail; student `/student/exams`; validation (calendar, overlap, term dates); `GetAdminExamsPage` / `GetStudentExamTimetablePage`; unit tests for calendar/overlap/publication rules. |
| 2026-10-29 | Exam module (backend) | Phase 1: PostgreSQL exam tables, audit log, series/session/room/mark APIs (`ExamSeries`, `ExamSession`, `ExamRoom`, `ExamMarks/SaveRegister`). No admin/student UI yet. |
| 2026-10-15 | Dev | `campusza-urls.json` served from `public/` in Vite dev (no proxy when API down). |
| 2026-10-15 | Admin students | Restored `/admin/students/:id` page (`AdminStudentDetail` + detail panel). |
| 2026-10-15 | Admin students | Removed gradient initial circle beside names in roster table. |
| 2026-10-15 | Admin staff | Staff cards: gradient accent bar, avatar initials, role/subject color chips. |
| 2026-10-15 | Admin staff | Staff roster UI polish: card headers, icon actions, inline search, tighter grid. |
| 2026-10-15 | Admin staff | Roster and search cards: no shadow; darker zinc border; inline edit uses primary border only. |
| 2026-10-15 | Admin nav | Sidebar active item: no tinted/orange background—white bar, orange label/icon only; neutral gray hover. |
| 2026-10-15 | Admin nav | Removed duplicate role badge above nav; role shown in sidebar user footer only. |
| 2026-10-15 | Admin nav | Sidebar polish: sentence-case groups, chevron expand, nested guide line, cleaner footer. |
| 2026-10-15 | Admin nav | Sidebar nav: soft orange active tint, outline icons (no filled tiles). |
| 2026-10-15 | Admin nav | Settings and My Profile under collapsible **Administration** group (same as other sidebar sections). |
| 2026-10-15 | Admin nav | Sidebar grouped into collapsible sections (People, Academic, Timetable, Teaching, Administration). |
| 2026-10-15 | Admin promotion | Sidebar **Promotion** screen (`/admin/promotion`) for bulk promote and single transfer. |
| 2026-10-13 | Admin classes | Edit form: mentor names without trailing dash, room/mentor IDs resolved, assistant mentor **No Assistant Mentor** when empty. |
| 2026-10-13 | Admin classes | Class **Edit** is inline on the card (same fields as before); edit dialog removed. |
| 2026-10-13 | Admin classes | Class cards use Edit/Delete icons; view-details (eye) menu removed. |
| 2026-10-13 | Admin classes | Class roster cards show full class summary (year, term, mentors, schedule, etc.). |
| 2026-10-13 | Admin schedule | **Class View** tab with class cards and weekly grid (mirrors Staff View). |
| 2026-10-13 | Bell schedule | Match classes to grade by reference id or name so UKG classes appear in staff step. |
| 2026-10-13 | Bell schedule | Step 1 subjects → save → Step 2 staff per class; Save all classes; staff filtered by subject when possible. |
| 2026-10-13 | Admin schedule | Auto-generate filters classes by selected grade (UKG id/name); classes hidden until a grade is checked. |
| 2026-10-13 | Admin schedule | Auto-generate starts with nothing selected; removed bulk Select All on apply-timetable targets; staff view has no default “all”. |
| 2026-10-13 | Admin staff | Department required on save; inline error if not selected. |
| 2026-10-13 | Admin staff | Roster **Edit** is inline on the card (Save/Cancel); one card at a time. |
| 2026-10-13 | Admin staff | Roster cards show full staff fields; Edit/Delete on card; view-profile removed. |
| 2026-10-13 | Admin staff | Add and edit are full screens (`/admin/staff/new`, `/admin/staff/:id/edit`), not dialogs. |
| 2026-10-13 | Admin dashboard | Loads via `GetAdminDashboardPage` (page or dashboard); falls back to `GetStats` on older API builds. |
| 2026-10-03 | Student timetable | Sidebar route `/student/timetable` — class weekly grid + daily periods table. |
| 2026-10-03 | Student homework | `/student/homework` fetches class homework by selected date (`GetStudentHomeworkPage`). |
| 2026-10-03 | Admin students | Edit view replaces list (full-width panel); Back to students returns to roster. |
| 2026-10-03 | Admin students | Split layout: list left, full tabbed edit panel on right (no modal). |
| 2026-10-03 | Admin students | Per-row Edit opens tabbed student dialog; enrollment context on page API. |
| 2026-10-03 | Staff students | Add student auto-resolves next free roll number; avoids duplicate roll DB error. |
| 2026-10-03 | Student auth | Student login: mobile + date of birth (not OTP); `LoginWithMobile` API. |
| 2026-10-03 | Staff students | Tabbed Edit dialog (basic, academic, parents, address, medical, transport, fee, docs); extended_profile JSON on students. |
| 2026-10-03 | Staff students | Per-row Edit: profile fields + roll number; enrollment roll sync API. |
| 2026-10-03 | Admin settings | Admission number series: prefix, suffix, padding, next number, auto-generate on add student. |
| 2026-10-03 | Staff students | Class-first roster on `/staff/students`; add student per selected class; `?classId=` from Classes. |
| 2026-10-03 | Staff classes | Attendance + homework on `/staff/classes` per selected class; shared date; homework nav deep-link. |
| 2026-10-03 | All | Added **Screens by role** — sidebar vs URL-only routes; student/parent status. |
| 2026-10-03 | All | Initial `bussines.md` — screen catalog + rules from current product. |
| 2026-09-19 | Admin schedule | Replacement: teacher first, then subject; hide card after assign. |
| 2026-09-19 | Staff schedule | Show substitutes with clear **Substitute** marking. |
| 2026-09-19 | DB | `staff_replacements.subject_id`, `subject` columns required for replacements API. |
