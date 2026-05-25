# admin-spec-v2-courses.md — Multi-Course System

> This document extends all previous specs. Read `admin-spec-v2.md`,
> `admin-spec-v2-drafts.md`, and `admin-spec-v2-image-cleanup.md` first.
> This addendum covers course creation, course-scoped roles, the dynamic
> sidebar, and the updated admin editor experience.

---

## Architecture Overview

```
Single notes branch (no per-course branches)

src/content/notes/
  computer-science/
    modules.js          ← CS course config
    notes/
    tools/
  chemistry/
    modules.js          ← Chemistry course config
    notes/
    tools/
  robotics/
    modules.js          ← Robotics course config

public/notes/img/
  computer-science/
  chemistry/
  robotics/
```

One `modules.js` per course. The `Sidebar` component receives a course config
as props and renders accordingly. Owners see all courses. Course admins and
contributors see only their assigned course.

---

## Role Hierarchy

| Role | Scope | Can do |
|------|-------|--------|
| `owner` | Global (`course_id = null`) | Everything |
| `admin` | One course (`course_id = 'chemistry'`) | Manage their course file system, add/delete contributors for their course |
| `contributor` | One course + specific directories | Write notes in assigned directories |

Rules:
- Only owners can create courses
- Only owners can create admins
- Only owners can upgrade contributors to admins
- Only owners can run image cleanup scans
- Admins can create contributors for their course only
- Admins can delete contributors from their course only
- Admins cannot create other admins
- Contributors are scoped to their course entirely — cannot see other courses

---

## Supabase Setup

### Courses table

```sql
create table courses (
  id text primary key,              -- slug e.g. 'chemistry'
  display_name text not null,       -- e.g. 'Chemistry'
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  description text default ''
);

alter table courses enable row level security;

-- Anyone authenticated can read courses
-- (needed so admin editor can list available courses)
create policy "authenticated read" on courses
  for select using (auth.role() = 'authenticated');

-- Only owners can insert
create policy "owners insert" on courses
  for insert with check (
    exists (
      select 1 from admin_users
      where id = auth.uid() and role = 'owner'
    )
  );

-- Only owners can update
create policy "owners update" on courses
  for update using (
    exists (
      select 1 from admin_users
      where id = auth.uid() and role = 'owner'
    )
  );

-- Only owners can delete
create policy "owners delete" on courses
  for delete using (
    exists (
      select 1 from admin_users
      where id = auth.uid() and role = 'owner'
    )
  );
```

### admin_users update

The `course_id` column was added in the previous migration. This is the
reference constraint that should be added now that the `courses` table exists:

```sql
alter table admin_users
add constraint fk_admin_users_course
foreign key (course_id) references courses(id)
on delete set null;

-- Insert computer-science as the first course
-- (retroactively formalises the existing CS content)
insert into courses (id, display_name, description)
values (
  'computer-science',
  'Computer Science',
  'Core computer science notes and tools'
);
```

---

## modules.js Per Course

Each course has its own `modules.js` at
`src/content/notes/[courseId]/modules.js`.

Structure is identical to the current global `modules.js` but scoped to
one course:

```js
// src/content/notes/chemistry/modules.js
export const modules = [
  {
    id: 'organic',
    label: 'Organic Chemistry',
    subfolders: ['notes', 'reactions', 'lab-reports'],
  },
  {
    id: 'inorganic',
    label: 'Inorganic Chemistry',
    subfolders: ['notes', 'periodic-table'],
  },
]
```

The `Sidebar` component imports the correct `modules.js` based on which
course the user is viewing.

---

## Dynamic Sidebar

The `Sidebar` component is updated to accept a `courseId` prop and
dynamically import the correct course config.

```jsx
// Sidebar receives courseId from the router or parent context
function Sidebar({ courseId }) {
  const [modules, setModules] = useState([])

  useEffect(() => {
    // Dynamic import based on courseId
    import(`../../content/notes/${courseId}/modules.js`)
      .then(mod => setModules(mod.modules))
      .catch(() => setModules([]))
  }, [courseId])

  // renders module list using modules state
}
```

For the public-facing site, `courseId` comes from the URL:
`/notes/chemistry/organic/intro` → `courseId = 'chemistry'`.

For the admin editor, `courseId` comes from the logged-in user's
`course_id` field (or the selected course for owners).

---

## File Structure

```
src/
  hooks/
    useCourses.js              ← NEW: fetch/create/delete courses
    useAdminUsers.js           ← NEW: extracted from AdminUsers, course-aware
  components/
    admin/
      CourseManagementDrawer.jsx    ← NEW: owner-only course creation UI
      CourseManagementDrawer.module.css
    layout/
      Sidebar/
        Sidebar.jsx            ← UPDATED: accepts courseId prop
        modules.js             ← DEPRECATED: kept for backwards compat only
  content/
    notes/
      computer-science/
        modules.js             ← NEW: moved from Sidebar/modules.js
      chemistry/
        modules.js             ← NEW: created when course is created
```

---

## `useCourses.js`

```js
// src/hooks/useCourses.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { commitFile, listDirectory } from '../lib/githubApi'

export function useCourses({ isOwner }) {

  const [courses, setCourses]   = useState([])
  const [loading, setLoading]   = useState(true)

  // Fetch all courses from Supabase
  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setCourses(data ?? [])
        setLoading(false)
      })
  }, [])

  // Create a new course
  // 1. Insert into Supabase courses table
  // 2. Create folder structure in GitHub
  // 3. Create initial modules.js for the course
  async function createCourse({ displayName, description = '' }, userId) {
    if (!isOwner) throw new Error('Owners only')

    // Slugify display name: "Organic Chemistry" → "organic-chemistry"
    const id = displayName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Insert into Supabase
    const { error } = await supabase.from('courses').insert({
      id,
      display_name: displayName,
      description,
      created_by: userId,
    })
    if (error) throw new Error(`Failed to create course: ${error.message}`)

    // Create default folder structure in GitHub
    const basePath = `src/content/notes/${id}`
    await commitFile(
      `${basePath}/notes/.gitkeep`,
      '',
      `feat: init ${id} course`
    )
    await commitFile(
      `${basePath}/tools/.gitkeep`,
      '',
      `feat: init ${id} course tools`
    )
    await commitFile(
      `public/notes/img/${id}/.gitkeep`,
      '',
      `feat: init ${id} image folder`
    )

    // Create initial modules.js for the course
    const initialModules = `export const modules = [
  {
    id: 'notes',
    label: 'Notes',
    subfolders: ['notes'],
  },
]
`
    await commitFile(
      `${basePath}/modules.js`,
      initialModules,
      `feat: add modules.js for ${id}`
    )

    // Update local state
    const newCourse = { id, display_name: displayName, description }
    setCourses(prev => [...prev, newCourse])
    return newCourse
  }

  // Delete a course (owners only)
  // Removes from Supabase only — does NOT delete GitHub content
  // (non-destructive to actual notes)
  async function deleteCourse(courseId) {
    if (!isOwner) throw new Error('Owners only')
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
    if (error) throw new Error(`Failed to delete course: ${error.message}`)
    setCourses(prev => prev.filter(c => c.id !== courseId))
  }

  return { courses, loading, createCourse, deleteCourse }
}
```

---

## `useAdminUsers.js` — Course-Aware

Updated version of the existing `AdminUsers` logic, now course-scoped:

```js
// src/hooks/useAdminUsers.js

// Fetch users for a specific course (admins + contributors)
// Owners pass courseId = null to see all users across all courses
async function fetchUsers(courseId) {
  let query = supabase.from('admin_users').select('*')
  if (courseId !== null) {
    query = query.eq('course_id', courseId)
  }
  const { data } = await query.order('created_at', { ascending: true })
  return data ?? []
}

// Create a new user (owner creates admin or contributor,
// course admin creates contributor only for their course)
async function createUser({ email, username, role, courseId, allowedDirectories, password }) {
  // Course admins can only create contributors
  if (!isOwner && role !== 'contributor') {
    throw new Error('Course admins can only create contributors')
  }
  // Course admins can only create users for their own course
  if (!isOwner && courseId !== currentUserCourseId) {
    throw new Error('Cannot create users for other courses')
  }

  // Create Supabase auth account
  const { data: authData, error: authError } = await supabase.auth.admin
    .createUser({ email, password, email_confirm: true })
  if (authError) throw new Error(authError.message)

  // Insert into admin_users
  const { error: dbError } = await supabase.from('admin_users').insert({
    id: authData.user.id,
    username,
    role,
    course_id: courseId,
    allowed_directories: allowedDirectories ?? [],
  })
  if (dbError) throw new Error(dbError.message)
}

// Upgrade a contributor to admin (owners only)
async function upgradeToAdmin(userId) {
  if (!isOwner) throw new Error('Owners only')
  const { error } = await supabase
    .from('admin_users')
    .update({ role: 'admin' })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

// Delete a user
// Owners can delete anyone. Course admins can only delete
// contributors from their own course.
async function deleteUser(userId, targetCourseId) {
  if (!isOwner && targetCourseId !== currentUserCourseId) {
    throw new Error('Cannot delete users from other courses')
  }
  if (!isOwner) {
    // Verify target is a contributor, not an admin
    const { data } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', userId)
      .single()
    if (data?.role !== 'contributor') {
      throw new Error('Course admins can only delete contributors')
    }
  }
  await supabase.auth.admin.deleteUser(userId)
  await supabase.from('admin_users').delete().eq('id', userId)
}
```

---

## CourseManagementDrawer (Owners Only)

A slide-in drawer from the right, triggered by a new `<Briefcase />` icon
in Navbar Row 1 (owners only, next to the Users icon).

```
┌─────────────────────────────────────────┐
│  Courses                          [×]   │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │ Computer Science    [Manage] [⋮]  │  │
│  │ Chemistry           [Manage] [⋮]  │  │
│  │ Robotics            [Manage] [⋮]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ▾ Create new course                    │
│    Name  ___________________________    │
│    Description (optional) __________    │
│    Assign admin  [Select user ▾]        │
│    or  [Skip for now]                   │
│    [Create course]                      │
└─────────────────────────────────────────┘
```

**[Manage]** button on each course row:
- Opens the `UsersDrawer` pre-filtered to that course
- Shows that course's admins and contributors
- Owner can add/delete users, upgrade contributors to admin

**[⋮] context menu** on each course row:
- "Rename course" → inline input
- "Delete course" → confirmation popover:
  `"This removes the course from the system but does not delete notes from GitHub."`

**Create new course flow:**
1. Owner types course name
2. Optional: assign existing user as course admin via dropdown
   (lists all users with `role = 'admin'` and `course_id = null` — unassigned admins)
   OR skip
3. Click "Create course" → calls `createCourse()` → creates GitHub folders +
   `modules.js` + Supabase row
4. If admin was assigned: updates their `course_id` in `admin_users`
5. Success toast: `"Chemistry created"`
6. Course appears in the list immediately

---

## AdminEditor — Course Scope

### Owner experience
- Sees a course selector dropdown in Navbar Row 1 (between the folder icon and title)
- Dropdown lists all courses from Supabase
- Switching courses reloads the directory drawer with that course's modules
- Can write and publish to any course

```jsx
// Course selector in navbar (owners only)
<select
  value={selectedCourse}
  onChange={e => setSelectedCourse(e.target.value)}
  className={styles.courseSelector}
>
  {courses.map(c => (
    <option key={c.id} value={c.id}>{c.display_name}</option>
  ))}
</select>
```

Styled to match the navbar: `background: transparent`, `color: colors.text`,
`border: 1px solid colors.border`, `border-radius: 6px`, `padding: 4px 8px`.

### Course admin experience
- No course selector — they see only their course
- `selectedCourse` is hardcoded to `profile.course_id` on mount
- Directory drawer shows only their course's modules
- Cannot see or navigate to other courses

### Contributor experience
- Same as course admin but formatting toolbar is the only interaction
- Cannot create subfolders or modules
- Directory picker is read-only — they select a destination but cannot modify
  the folder structure

---

## AdminEditor State Updates

Add to `useEditorState.js`:

```js
const [selectedCourse, setSelectedCourse] = useState(null)

// On mount: owners default to first course, others use profile.course_id
useEffect(() => {
  if (!profile) return
  if (profile.role === 'owner') {
    setSelectedCourse(courses[0]?.id ?? null)
  } else {
    setSelectedCourse(profile.course_id)
  }
}, [profile, courses])
```

All GitHub paths that currently use a hardcoded module structure now
include `selectedCourse`:

```js
// Before
`src/content/notes/${moduleId}/${subfolder}/`

// After
`src/content/notes/${selectedCourse}/${moduleId}/${subfolder}/`
```

This applies to: `handleSave`, `handleImageUpload`, `handleNewSubfolder`,
`handleNewModule`, `handleMoveFile`, `handleDeleteSubfolder`.

---

## modules.js Migration

The existing `src/components/layout/Sidebar/modules.js` contains the CS
modules. It must be copied to
`src/content/notes/computer-science/modules.js`.

The old file is kept temporarily for backwards compatibility but the
`Sidebar` component should import from the new location.

Migration prompt is included below (Prompt I1).

---

## UsersDrawer — Course-Aware Updates

`UsersDrawer.jsx` receives an optional `filterCourseId` prop. When provided,
it only shows users belonging to that course. When null (owner global view),
shows all users with a course column in the table.

The "Add new user" form gains:
- A **Course** dropdown (owners only — course admins always create for their
  own course so this is hidden for them)
- A **Role** dropdown: owners see Owner/Admin/Contributor, course admins only
  see Contributor
- An **Upgrade to Admin** button on contributor rows (owners only)

---

## Implementation Prompts

---

### Prompt I1 — Supabase SQL + modules.js migration

> Do not write any application code yet.
>
> **Step 1:** Print this instruction for the developer to run in Supabase:
> ```
> Run the SQL from the "Supabase Setup" section of admin-spec-v2-courses.md.
> This creates the courses table, adds the foreign key constraint to admin_users,
> and inserts the computer-science course as the first row.
> ```
>
> **Step 2:** Copy `src/components/layout/Sidebar/modules.js` to
> `src/content/notes/computer-science/modules.js`. Do not modify the content —
> exact copy only.
>
> **Step 3:** In `src/components/layout/Sidebar/modules.js`, replace the entire
> file content with:
> ```js
> // This file is deprecated. Course modules now live at:
> // src/content/notes/[courseId]/modules.js
> // This file is kept for backwards compatibility only.
> export { modules } from '../../content/notes/computer-science/modules.js'
> ```
>
> Do not modify any other files.

---

### Prompt I2 — `useCourses.js` + `useAdminUsers.js`

> Read `admin-spec-v2-courses.md` in full. Confirm the `courses` table exists
> in Supabase and `src/content/notes/computer-science/modules.js` exists
> from Prompt I1.
>
> **Part 1 — `src/hooks/useCourses.js`:**
> Create with the exact implementation from the "`useCourses.js`" section.
> The hook accepts `{ isOwner, userId }` and returns
> `{ courses, loading, createCourse, deleteCourse }`.
>
> Key rules:
> - `createCourse` must commit 4 files to GitHub in sequence:
>   `notes/.gitkeep`, `tools/.gitkeep`, `public/notes/img/[id]/.gitkeep`,
>   and `modules.js` with the initial template
> - `deleteCourse` removes from Supabase only — never touches GitHub
> - Slugify function: lowercase, trim, replace non-alphanumeric with hyphens,
>   strip leading/trailing hyphens
>
> **Part 2 — `src/hooks/useAdminUsers.js`:**
> Extract all user management logic from `src/pages/admin/AdminUsers.jsx`
> into this hook. Add the course-aware functions from the spec:
> `fetchUsers(courseId)`, `createUser(...)`, `upgradeToAdmin(userId)`,
> `deleteUser(userId, targetCourseId)`.
>
> The hook accepts `{ isOwner, currentUserCourseId }` and returns all four
> functions plus `{ users, loadingUsers }`.
>
> Do not modify any existing files yet.

---

### Prompt I3 — CourseManagementDrawer

> Read `admin-spec-v2-courses.md`. Confirm `src/hooks/useCourses.js` exists.
>
> Create `src/components/admin/CourseManagementDrawer.jsx` and its CSS module.
>
> Props: `{ open, onClose, isOwner, userId }`
>
> Implement:
> - Slide-in from right, same transition as all other drawers
> - Same backdrop behaviour
> - Width: 420px
> - Uses `useCourses({ isOwner, userId })` internally
> - Course list: each row shows display name, `[Manage]` button, `[⋮]`
>   context menu (Rename / Delete with confirmation popover)
> - "Create new course" collapsible section (collapsed by default):
>   - Name input (required)
>   - Description input (optional)
>   - "Assign admin" dropdown: lists users from `admin_users` where
>     `role = 'admin'` and `course_id IS NULL` (unassigned admins).
>     Fetched via a direct Supabase query inside the component.
>   - "Skip for now" link that clears the admin selection
>   - "Create course" button: disabled while name is empty or while creating
>   - Shows a spinner on the button while `createCourse` is in progress
>   - On success: collapses the form, shows success toast, course appears
>     in list immediately
> - Delete confirmation popover must include the warning:
>   `"This removes the course from the system but does not delete notes from GitHub."`
> - All colors from `src/constants/colors.js`
> - Icons from `@phosphor-icons/react`:
>   `Briefcase` (drawer trigger), `Plus`, `Trash`, `DotsThreeVertical`,
>   `PencilSimple`, `X`, `Users`
>
> Do not modify any existing files.

---

### Prompt I4 — Update UsersDrawer + AdminEditor state

> Read `admin-spec-v2-courses.md`. Confirm all prior I prompts are complete.
>
> **Part 1 — `UsersDrawer.jsx`:**
> - Add `filterCourseId` prop (string or null)
> - Replace internal user fetching with `useAdminUsers` hook
> - When `filterCourseId` is provided, only show users for that course
> - Add "Course" column to the users table (owners only — shows which course
>   each user belongs to, "Global" for owners)
> - Add "Upgrade to Admin" button on contributor rows (owners only):
>   calls `upgradeToAdmin(userId)`, refreshes the list, shows success toast
> - "Add new user" form: add Course dropdown (owners only), update Role
>   dropdown so course admins only see "Contributor" as an option
> - All permission guards from `useAdminUsers` apply — do not add extra
>   client-side checks beyond what the hook already enforces
>
> **Part 2 — `useEditorState.js`:**
> - Add `selectedCourse` state and `setSelectedCourse`
> - Add `courses` state (fetched via `useCourses`)
> - On mount: owners default to `courses[0]?.id`, others use
>   `profile.course_id`
>
> **Part 3 — `AdminEditor.jsx` shell:**
> - Add course selector dropdown in `EditorNavbar` props (owners only)
> - Add `courseManagementOpen` state and `CourseManagementDrawer` mounted
>   alongside other drawers (owners only)
> - Pass `selectedCourse` to `DirectoryDrawer` so it loads the correct
>   course modules
> - All GitHub paths updated to include `selectedCourse` as described in
>   the "AdminEditor State Updates" section of the spec
>
> Do not modify `useCourses.js`, `useAdminUsers.js`, or
> `CourseManagementDrawer.jsx`.

---

### Prompt I5 — Dynamic Sidebar

> Read `admin-spec-v2-courses.md`, specifically the "Dynamic Sidebar" section.
>
> Update `src/components/layout/Sidebar/Sidebar.jsx`:
> - Add `courseId` prop
> - Replace the static `modules` import with a `useEffect` that dynamically
>   imports `../../content/notes/${courseId}/modules.js` when `courseId` changes
> - While loading: show 3 skeleton rows (same shimmer animation as the
>   directory drawer loading state)
> - On import error: set modules to empty array, show no entries
> - All existing rendering logic stays identical — only the data source changes
>
> Then update wherever `Sidebar` is rendered in the app to pass the correct
> `courseId`:
> - For public routes: derive `courseId` from the URL params
>   (e.g. `/notes/chemistry/organic/intro` → `courseId = 'chemistry'`)
> - Default `courseId` to `'computer-science'` if no course is in the URL
>   (backwards compatibility for existing CS links)
>
> Do not change the visual design or CSS of the Sidebar.
> Do not modify any other files.
