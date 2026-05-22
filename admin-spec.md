# admin-spec.md — Mooner.dev Admin Panel

## Overview

A password-protected admin panel at `/admin` for writing and publishing
markdown notes directly to GitHub without touching code.
Authentication via Supabase Auth. File commits via GitHub API.

---

## Credentials

### Owner accounts (create these in Supabase Auth dashboard)
| Username | Email | Password | Role |
|---|---|---|---|
| tanoo | tanoo@mooner.dev | `Tn8xKm#P2vQ!` | owner |
| atish | atish@mooner.dev | `At7wJn$R4bX@` | owner |
| moon | moon@mooner.dev | `Mn9pLk#W3cY!` | owner |

**Save these passwords somewhere safe — they are not stored in the codebase.**

---

## Supabase Setup

Run this SQL in the Supabase SQL editor:

```sql
-- Admin users table
create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text not null default 'contributor',
  -- owners: allowed_directories is ignored (full access)
  -- contributors: array of module ids they can write to
  -- e.g. ['math', 'operating-systems']
  allowed_directories text[] default '{}',
  created_at timestamptz default now()
);

alter table admin_users enable row level security;

-- Simplified RLS policies to avoid infinite recursion
-- Anyone authenticated can read their own row
create policy "read own profile" on admin_users
  for select using (id = auth.uid());

-- Allow all authenticated users to read all rows
-- (since only admins will have accounts anyway)
create policy "authenticated read all" on admin_users
  for select using (auth.role() = 'authenticated');

-- Allow authenticated users to insert (we'll check role in the application)
create policy "authenticated insert" on admin_users
  for insert with check (auth.role() = 'authenticated');

-- Allow authenticated users to delete (we'll check role in the application)
create policy "authenticated delete" on admin_users
  for delete using (auth.role() = 'authenticated');

-- Allow authenticated users to update (for future use)
create policy "authenticated update" on admin_users
  for update using (auth.role() = 'authenticated');
```

**Note:** The simplified RLS policies avoid infinite recursion by checking `auth.role()` 
instead of querying the `admin_users` table. Owner-only restrictions are enforced 
in the application code (AdminUsers.jsx).

### Creating Owner Accounts

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" for each owner
3. Enter email and password from the credentials table above
4. **Important:** Check "Auto Confirm User" to skip email verification
5. After creating all three users, get their UUIDs from the users list
6. Run this SQL (replace with actual UUIDs):

```sql
-- Replace the UUIDs with actual user IDs from Supabase Auth
insert into admin_users (id, username, role) values
  ('actual-tanoo-uuid-here', 'tanoo', 'owner'),
  ('actual-atish-uuid-here', 'atish', 'owner'),
  ('actual-moon-uuid-here', 'moon', 'owner');
```

---

## Environment Variables

Add to `.env` and Vercel:
```
VITE_GITHUB_TOKEN=ghp_yourtoken
VITE_GITHUB_OWNER=MintHerbs
VITE_GITHUB_REPO=b-tree
VITE_GITHUB_BRANCH=notes
```

**Important Setup Steps:**

1. **Create GitHub Personal Access Token:**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` scope (full control of repositories)
   - Copy the token and add to `.env` as `VITE_GITHUB_TOKEN`

2. **Ensure `notes` branch exists and has required files:**
   - The `notes` branch must contain `src/components/layout/Sidebar/modules.js`
   - If branch is empty, copy files from main:
     ```bash
     git checkout notes
     git checkout main -- src/components/layout/Sidebar/modules.js
     git checkout main -- src/content/notes/
     git checkout main -- public/notes/
     git commit -m "Add required files for admin panel"
     git push origin notes
     ```
   - Or merge main into notes: `git checkout notes && git merge main && git push`

3. **Restart dev server** after changing `.env` for variables to take effect

---

## Routes

| Path | Component | Access |
|---|---|---|
| `/admin` | AdminLogin | Public |
| `/admin/editor` | AdminEditor | Authenticated |
| `/admin/users` | AdminUsers | Owners only |

Add to `src/routes/index.jsx`:
```jsx
import { lazy } from 'react'

const AdminLogin  = lazy(() => import('../pages/admin/AdminLogin'))
const AdminEditor = lazy(() => import('../pages/admin/AdminEditor'))
const AdminUsers  = lazy(() => import('../pages/admin/AdminUsers'))

// In AppRoutes function:
<Route path="/admin"          element={<AdminLogin />} />
<Route path="/admin/editor"   element={<AdminEditor />} />
<Route path="/admin/users"    element={<AdminUsers />} />
```

Add to `src/App.jsx` to hide sidebar on admin pages:
```jsx
const isAdminRoute = location.pathname.startsWith('/admin')

// Conditionally render sidebar
{!isAdminRoute && (
  <Sidebar
    defaultOpenGroup="database"
    activeChild={activeChild}
    onChildSelect={setActiveChild}
    isChatOpen={isChatOpen}
    setIsChatOpen={setIsChatOpen}
    unreadCount={unreadCount}
  />
)}
```

---

## File Structure

```
src/pages/admin/
├── AdminLogin.jsx
├── AdminLogin.module.css
├── AdminEditor.jsx
├── AdminEditor.module.css
├── AdminUsers.jsx
├── AdminUsers.module.css
└── useAdmin.js          ← auth state + permission helpers

src/lib/
├── githubApi.js         ← GitHub API helpers
└── adminSupabase.js     ← admin-specific Supabase calls (imports from supabaseClient.js)
```

**Note:** `adminSupabase.js` imports from `./supabaseClient` not `./supabase`

---

## AdminLogin Page

Simple centered login form on the starfield background.

```jsx
// Fields: email + password
// On submit: supabase.auth.signInWithPassword({ email, password })
// On success: navigate('/admin/editor')
// On error: show "Invalid credentials"
```

Styling:
- Centered card: `background: #0f0f0f`, `border: 1px solid #222`,
  `border-radius: 16px`, `padding: 48px`, `width: 360px`
- Title: `Admin` in `#8B5CF6`, `font-size: 1.8rem`, `font-weight: 800`
- Inputs: same style as rest of app (`background: #0f0f0f`, `border: 1px solid #222`)
- Submit button: ghost purple button
- No navbar, no sidebar — just the login card on starfield

---

## AdminEditor Page

Three-column layout:

```
┌─────────────────┬──────────────────────────┬──────────────────┐
│  Directory      │  Editor (1.5x width)     │  Preview         │
│  Picker         │                          │                  │
│  (240px)        │  Title input             │  MarkdownRenderer│
│                 │  ─────────────           │                  │
│  math/          │  Monaco Editor           │  Live preview    │
│  ├── notes      │                          │  (same styling   │
│  └── tools      │  Image drop zone         │  as NotesPage)   │
│  os/            │                          │                  │
│  ├── labs       │  [ Save to GitHub ]      │                  │
│  ...            │                          │                  │
└─────────────────┴──────────────────────────┴──────────────────┘
```

**Layout:** `grid-template-columns: 240px 1.5fr 1fr` (editor is 50% wider than preview)
**No sidebar** on admin pages for cleaner interface.

### Directory Picker (left panel)
- Lists all modules from `modules.js`
- Contributors only see their `allowed_directories`
- Owners see all
- Clicking a module expands to show `notes/` and `tools/` subfolders
- Clicking a subfolder selects it as the save destination
- Selected path shown highlighted in `#8B5CF6`
- "New subfolder" button to create a new folder inside a module

### Editor (middle panel)
```jsx
// Title input
<input
  placeholder="Note title (e.g. Binary Search Trees)"
  value={title}
  onChange={e => setTitle(e.target.value)}
/>
// Auto-converts to filename: "binary-search-trees.md"

// Monaco Editor
import Editor from '@monaco-editor/react'
<Editor
  height="60vh"
  defaultLanguage="markdown"
  theme="vs-dark"
  value={content}
  onChange={setContent}
  onMount={(editor) => { editorRef.current = editor }}
  options={{
    fontSize: 14,
    wordWrap: 'on',
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
  }}
/>

// Note: editorRef is used to insert images at cursor position
// Wrapper needs background: #1e1e1e for proper cursor visibility
```

### Image Drop Zone
```jsx
import { useDropzone } from 'react-dropzone'

// Accepts: image/png, image/jpeg, image/svg+xml, image/gif, image/webp
// On drop:
//   1. Fetch current image count in public/notes/img/[moduleId]/
//      via GitHub API listDirectory
//   2. Rename file to (count + 1).[ext]
//   3. Upload to public/notes/img/[moduleId]/[number].[ext] via GitHub API
//   4. Insert into editor at cursor: ![image](/notes/img/[moduleId]/[number].[ext])
//      Uses editorRef.current.executeEdits() for precise cursor insertion
//   5. Show success message: "✓ Image uploaded and inserted into editor"

// Image appears in preview panel automatically (via MarkdownRenderer)
// To delete: remove the markdown path from editor text
// No thumbnail display below dropzone - images only shown in preview

// Styling:
// Dashed border, rounded, #0f0f0f background
// "Drop images here or click to upload" text
```

### Save Button
```jsx
// On click:
// 1. Validate: title and directory must be selected
// 2. Convert title to filename:
//    "Binary Search Trees" → "binary-search-trees.md"
// 3. Commit .md to GitHub:
//    path: src/content/notes/[moduleId]/[subfolder]/[filename].md
//    content: the markdown content from editor
//    message: "docs: add [filename] to [moduleId]/[subfolder]"
// 4. Update modules.js to add new note to the module's notes array
//    (read current modules.js → parse → add entry → commit updated file)
// 5. Show success: "Published! Vercel is deploying..."
// 6. On error: show red error message
```

---

## AdminUsers Page (owners only)

```jsx
// Layout: table of all users
// Columns: Username | Email | Role | Allowed Directories | Actions

// Add User form:
//   - Email input
//   - Username input
//   - Role selector (owner / contributor)
//   - Directory multi-select (for contributors)
//   - Generate password button (random 12-char)
//   - Create button → supabase.auth.admin.createUser + insert into admin_users

// Delete button on each row:
//   - supabase.auth.admin.deleteUser(userId)
//   - delete from admin_users where id = userId

// Edit permissions button:
//   - Modal to update allowed_directories array
//   - update admin_users set allowed_directories = [...] where id = userId
```

---

## githubApi.js

```js
const OWNER  = import.meta.env.VITE_GITHUB_OWNER
const REPO   = import.meta.env.VITE_GITHUB_REPO
const BRANCH = import.meta.env.VITE_GITHUB_BRANCH
const TOKEN  = import.meta.env.VITE_GITHUB_TOKEN

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
}

// Get file SHA (needed for updates)
export async function getFileSha(path) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers }
  )
  if (res.status === 404) return null
  const data = await res.json()
  return data.sha ?? null
}

// Commit a text file
export async function commitFile(path, content, message) {
  const sha = await getFileSha(path)
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  }
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    { method: 'PUT', headers, body: JSON.stringify(body) }
  )
  if (!res.ok) throw new Error(`GitHub commit failed: ${res.status}`)
  return res.json()
}

// Upload a binary file (image)
export async function uploadImage(path, fileArrayBuffer) {
  const sha = await getFileSha(path)
  const base64 = btoa(
    new Uint8Array(fileArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  )
  const body = {
    message: `assets: upload ${path.split('/').pop()}`,
    content: base64,
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  }
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    { method: 'PUT', headers, body: JSON.stringify(body) }
  )
  if (!res.ok) throw new Error(`Image upload failed: ${res.status}`)
  return res.json()
}

// List files in a directory (to count existing images)
export async function listDirectory(path) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers }
  )
  if (res.status === 404) return []
  return res.json()
}

// Get raw file content
export async function getFileContent(path) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers }
  )
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(`Failed to read file (${res.status}): ${errorData.message || res.statusText}`)
  }
  const data = await res.json()
  return decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))
}
```

**Note:** Improved error handling to provide detailed error messages for debugging.

---

## Title to Filename conversion

```js
export function titleToFilename(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .replace(/\s+/g, '-')            // spaces to hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/(^-|-$)/g, '')         // trim leading/trailing hyphens
}
// "Binary Search Trees!" → "binary-search-trees"
// Then save as "binary-search-trees.md"
```

---

## modules.js Auto-Update

When a new note is saved, read the current `modules.js` from GitHub,
add the new entry to the correct module's `notes` array, and commit
the updated file.

```js
// Read current modules.js
const current = await getFileContent('src/components/layout/Sidebar/modules.js')

// Find the module and insert new note entry
// Use string manipulation to find "notes: [" in the right module block
// and insert "{ filename: 'subfolder/filename', label: 'filename.md' },"

// Commit updated modules.js
await commitFile(
  'src/components/layout/Sidebar/modules.js',
  updatedContent,
  `feat: add ${filename} to ${moduleId} notes`
)
```

---

## Security

- `/admin/editor` and `/admin/users` check `supabase.auth.getUser()` on mount
- If not authenticated → redirect to `/admin`
- If authenticated but not owner → `/admin/users` shows 403
- Contributors see only their `allowed_directories` in the picker
- GitHub token never logged or exposed in error messages

---

## NPM packages to install

```bash
npm install @monaco-editor/react react-dropzone
```

`@octokit/rest` is NOT needed — we use raw `fetch` to the GitHub API
which is simpler and has no extra bundle cost.

---

## Implementation Prompts

### Prompt 1 — Supabase SQL + install packages
> Run `npm install @monaco-editor/react react-dropzone`. Then read
> `admin-spec.md`. Run the SQL from the Supabase Setup section in the
> Supabase SQL editor (not in code — tell the developer to run it manually).
> Create `src/lib/githubApi.js` with the exact code from the spec.
> Create `src/lib/adminSupabase.js` that exports a `getAdminProfile()`
> function: calls `supabase.from('admin_users').select('*').eq('id', userId).single()`
> and returns the profile. Do not create any page files yet.

### Prompt 2 — AdminLogin page
> Read `admin-spec.md`. Create `src/pages/admin/AdminLogin.jsx` and
> `AdminLogin.module.css`. Centered card on starfield background. Email
> and password inputs. On submit calls
> `supabase.auth.signInWithPassword({ email, password })`. On success
> navigates to `/admin/editor`. On error shows "Invalid credentials" in
> red. No navbar, no sidebar. Do not touch any other files.

### Prompt 3 — githubApi helpers + AdminEditor skeleton
> Read `admin-spec.md`. Confirm `src/lib/githubApi.js` exists from
> Prompt 1. Create `src/pages/admin/AdminEditor.jsx` and
> `AdminEditor.module.css` with the three-column layout. Left panel:
> directory picker reading from `MODULES` in `modules.js`, filtered by
> `allowed_directories` for contributors. Middle panel: title input +
> Monaco Editor + image dropzone using `react-dropzone`. Right panel:
> live preview using `MarkdownRenderer`. Auth guard: on mount call
> `supabase.auth.getUser()` — if null redirect to `/admin`.
> Do not implement save or image upload yet.

### Prompt 4 — Image upload flow
> Read `admin-spec.md` image dropzone section and `githubApi.js`.
> In `AdminEditor.jsx`, implement the `onDrop` handler: (1) get selected
> module from directory picker, (2) call `listDirectory` to count existing
> images in `public/notes/img/[moduleId]/`, (3) rename dropped file to
> `(count + 1).[ext]`, (4) call `uploadImage` with the file's ArrayBuffer,
> (5) insert `![image](/notes/img/[moduleId]/[number].[ext])` at cursor
> position in Monaco Editor, (6) show success message. Handle errors with
> red toast. Do not change any other files.

### Prompt 5 — Save to GitHub + modules.js update
> Read `admin-spec.md` save button section. In `AdminEditor.jsx`,
> implement the save handler: (1) validate title and selected directory,
> (2) convert title to filename using `titleToFilename`, (3) commit `.md`
> to `src/content/notes/[moduleId]/[subfolder]/[filename].md` via
> `commitFile`, (4) read current `modules.js` via `getFileContent`,
> (5) insert new note entry into the correct module's notes array using
> string replacement, (6) commit updated `modules.js`, (7) show
> "Published! Vercel is deploying..." success message. Do not change
> any other files.

### Prompt 6 — AdminUsers page + App.jsx routes
> Read `admin-spec.md`. Create `src/pages/admin/AdminUsers.jsx` and
> `AdminUsers.module.css`. Table of all admin users with columns:
> Username, Email, Role, Allowed Directories, Actions. Add User form
> with email, username, role, directory multi-select, and auto-generate
> password button. Delete button calls
> `supabase.auth.admin.deleteUser` + deletes from `admin_users`.
> Owner-only guard: if role !== 'owner' show 403 message.
> In `App.jsx` add the three lazy routes from the spec.
> Do not change any other files.
