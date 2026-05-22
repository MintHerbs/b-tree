# admin-spec-v2.md — Mooner.dev Admin Panel (JotterPad UI Redesign)

> This document supersedes `admin-spec.md`. All backend logic (Supabase, GitHub API,
> auth, modules.js) is unchanged. Only the frontend layout and component architecture
> is being replaced. Cross-reference the original `admin-spec.md` for SQL, env vars,
> and API helpers — they are not repeated here.

---

## Overview of Changes

The three-column layout (`240px directory | editor | preview`) is replaced with a
**full-screen blank canvas** writing experience modelled on JotterPad:

- The canvas fills the entire viewport. Writing area is centered at `max-width: 720px`.
- The directory picker becomes a **slide-in drawer** (left), toggled by a nav icon.
- The preview becomes a **full-screen modal overlay**, toggled by a nav icon.
- The users panel becomes a **slide-in drawer** (right), toggled by a nav icon (owners only).
- A **dual-row navbar** replaces any top bar: Row 1 is document controls, Row 2 is the
  markdown formatting toolbar.
- No sidebar from the rest of the app appears on admin pages (already handled in `App.jsx`).

---

## Design Tokens

All colors must be imported from `src/constants/colors.js`. Never hardcode hex values.

```js
import { colors } from '../../constants/colors'
// Then reference as colors.accent, colors.bg, colors.border, etc.
```

Key tokens used throughout:

| Token           | Value                    | Usage                                      |
|-----------------|--------------------------|--------------------------------------------|
| `colors.bg`     | `#000000`                | Full canvas background                     |
| `colors.surface`| `#0f0f0f`                | Navbar rows, drawer backgrounds            |
| `colors.border` | `#222222`                | All dividers, drawer edges, modal borders  |
| `colors.accent` | `#8B5CF6`                | Active state, selected path, focus rings   |
| `colors.orange` | `#EA6C0A`                | Unsaved-changes dot, warning states        |
| `colors.text`   | `#ffffff`                | Primary text                               |
| `colors.textMuted` | `rgba(255,255,255,0.6)` | Placeholder text, inactive labels        |
| `colors.error`  | `#ef4444`                | Error toasts                               |
| `colors.success`| `#22c55e`                | Success toasts                             |

---

## Icon Library

All icons use `@phosphor-icons/react`. Import individually:

```js
import {
  Folder, FolderOpen, Eye, CloudArrowUp, Users, Plus, Trash,
  TextBolder, TextItalic, TextStrikethrough, Code, Image,
  CaretDown, SignOut, ArrowLeft, DotsThreeVertical, PencilSimple,
  FilePlus, FolderPlus, X, Check, Warning, ArrowsDownUp
} from '@phosphor-icons/react'
```

Icon sizing convention:
- Navbar icons: `size={18}` with `weight="regular"`
- Drawer/panel icons: `size={16}` with `weight="regular"`
- Active/selected icons: `weight="fill"`

---

## Animate UI Components

Already installed via `npx shadcn@latest add @animate-ui/components-radix-files`.

Additional components to use:
- `@animate-ui/components-radix-files` — file tree in the directory drawer
- CSS `transition` with `cubic-bezier(0.4, 0, 0.2, 1)` for all drawer open/close
- `@radix-ui/react-dialog` for the preview modal (already a peer dep of animate-ui)
- `@radix-ui/react-popover` for the text-style dropdown and context menus
- `@radix-ui/react-tooltip` for all navbar icon tooltips

---

## File Structure

```
src/pages/admin/
├── AdminLogin.jsx              ← unchanged
├── AdminLogin.module.css       ← unchanged
├── AdminEditor.jsx             ← FULL REWRITE (UI only; all GitHub/Supabase logic kept)
├── AdminEditor.module.css      ← FULL REWRITE
├── AdminUsers.jsx              ← converted to a drawer component (no separate route needed)
├── AdminUsers.module.css       ← updated
└── useAdmin.js                 ← unchanged

src/components/admin/           ← NEW directory for sub-components
├── EditorNavbar.jsx            ← dual-row navbar
├── EditorNavbar.module.css
├── DirectoryDrawer.jsx         ← left slide-in drawer (file tree + module management)
├── DirectoryDrawer.module.css
├── PreviewModal.jsx            ← full-screen preview overlay
├── PreviewModal.module.css
├── UsersDrawer.jsx             ← right slide-in drawer (owners only)
├── UsersDrawer.module.css
├── FormattingToolbar.jsx       ← row 2 of navbar
├── FormattingToolbar.module.css
├── StyleDropdown.jsx           ← Title / Subtitle / Body picker
└── ToastNotification.jsx       ← replaces inline error/success strings
```

---

## AdminEditor Page — New Layout

```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR ROW 1 (48px)                                    │
│  [☰] [Title — click to edit] [●unsaved]    [👁][☁][👥] │
├─────────────────────────────────────────────────────────┤
│  NAVBAR ROW 2 (40px — formatting toolbar)               │
│  [B][I][S][</>][🖼] | [Style ▾] | [+Module][⚙]         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│          CANVAS (full viewport, bg: #000000)            │
│                                                         │
│          ┌──────────────────────────────┐               │
│          │  centered writing area       │               │
│          │  max-width: 720px            │               │
│          │  Monaco Editor (no border,   │               │
│          │  no line numbers, no minimap)│               │
│          └──────────────────────────────┘               │
│                                                         │
└─────────────────────────────────────────────────────────┘

← Directory Drawer slides in from LEFT (320px wide)
→ Users Drawer slides in from RIGHT (420px wide)
↑ Preview Modal overlays FULL SCREEN
```

### CSS Grid for the page

```css
.adminEditor {
  display: grid;
  grid-template-rows: 48px 40px 1fr;
  height: 100vh;
  background: var(--bg);   /* colors.bg */
  overflow: hidden;
}

.canvas {
  overflow-y: auto;
  display: flex;
  justify-content: center;
  padding: 48px 24px 120px;
}

.writingArea {
  width: 100%;
  max-width: 720px;
}
```

---

## Navbar Row 1 — Document Controls

### Layout

```
LEFT                          CENTER (flex: 1)          RIGHT
[Folder icon] [Title] [dot]                   [Eye] [Cloud] [Users] [Avatar▾]
```

### Title Input

- Inline `<input>` with `background: transparent`, `border: none`, `color: colors.text`
- `font-size: 15px`, `font-weight: 500`
- Placeholder: `"Untitled"` in `colors.textMuted`
- Width: auto-grows with content (use a hidden `<span>` mirror technique)
- On focus: shows a subtle `1px solid colors.border` underline only (no box)

### Unsaved Dot

- A `8px` circle to the right of the title
- `background: colors.orange` when there are unsaved changes
- Hidden when document is clean
- Animate with a gentle `pulse` keyframe (scale 1 → 1.15 → 1, 2s infinite)

### Right-side icon buttons

Each is a `<button>` with `width: 36px`, `height: 36px`, `border-radius: 8px`,
`background: transparent`, hover: `background: rgba(255,255,255,0.06)`.
Wrap each in a `@radix-ui/react-tooltip` with a short label.

| Icon | Phosphor | Tooltip | Action |
|------|----------|---------|--------|
| View | `<Eye />` | "Preview" | Opens `PreviewModal` |
| Save | `<CloudArrowUp />` | "Save to GitHub" | Runs save handler |
| Users | `<Users />` | "Manage users" | Opens `UsersDrawer` (owners only; hidden for contributors) |
| Avatar | `<UserCircle />` | username | Dropdown: shows username + role, then "Sign out" |

### Folder/Directory toggle (left)

- `<Folder />` when drawer is closed, `<FolderOpen />` when open
- Same 36×36 button style as above
- `color: colors.accent` when drawer is open, otherwise `colors.iconOff`/hover `colors.iconHover`

---

## Navbar Row 2 — Formatting Toolbar

```
[B] [I] [S] [</>] [Image]  |  [Style ▾]  |  [+ Module] [Delete Module]
```

### Formatting buttons

All buttons 32×32, `border-radius: 6px`, same hover bg as Row 1 buttons.
Active state (when cursor is inside bold/italic text): `background: rgba(139,92,246,0.15)`,
`color: colors.accent`.

| Button | Icon | Tooltip | Action |
|--------|------|---------|--------|
| Bold | `<TextBolder />` | "Bold (⌘B)" | Insert/wrap `**text**` at cursor |
| Italic | `<TextItalic />` | "Italic (⌘I)" | Insert/wrap `*text*` at cursor |
| Strikethrough | `<TextStrikethrough />` | "Strikethrough" | Insert/wrap `~~text~~` at cursor |
| Code | `<Code />` | "Code block" | Insert `\`\`\`\n\n\`\`\`` at cursor |
| Image | `<Image />` | "Insert image" | Opens native file picker (png, jpg, svg); runs the existing image-upload flow |

All formatting actions use `editorRef.current.executeEdits()` on the Monaco Editor instance.

### Style Dropdown

A `@radix-ui/react-popover` triggered by a button showing the current block style.

```
┌──────────────────┐
│  ● Title    (H1) │   font-size: 13px, font-weight: 700
│  ○ Subtitle (H2) │   font-size: 12px, font-weight: 500
│  ○ Body         │   font-size: 12px, normal
└──────────────────┘
```

- Detecting current style: read the current line's text via Monaco, check if it starts with `# `, `## `, or neither.
- Applying: replace the leading `#`/`##` on the current line via `executeEdits`.
- Users can still type `#`, `##` manually — the dropdown just reflects the line's current state.

Button label: `"Title"` / `"Subtitle"` / `"Body"` depending on detected style.
Caret: `<CaretDown size={12} />` inline.

### Module management (owners only — hidden for contributors)

These two buttons live at the far right of Row 2, separated by a `1px` vertical divider.

| Button | Icon | Tooltip | Action |
|--------|------|---------|--------|
| New Module | `<FilePlus />` | "New module" | Opens an inline popover with a text input; on confirm, creates the module via GitHub API and refreshes the module list |
| Settings | `<DotsThreeVertical />` | "Module actions" | Dropdown: "Delete selected module" (with confirmation) |

---

## Directory Drawer (Left)

### Behaviour

- Opens/closes with a CSS `transform: translateX()` transition: `320ms cubic-bezier(0.4, 0, 0.2, 1)`
- When open, the canvas does NOT reflow. The drawer overlays the canvas with a subtle
  backdrop (`rgba(0,0,0,0.4)`) that closes the drawer on click.
- Width: `320px`
- Background: `colors.surface` (`#0f0f0f`)
- Left border (when open): `1px solid colors.border`

### Structure

```
┌──────────────────────────────┐
│  Files              [×]      │  ← header
├──────────────────────────────┤
│  ▾ web                       │  ← module (expandable)
│    ├── notes/       [+][⋮]   │  ← subfolder row
│    └── tools/       [+][⋮]   │
│  ▸ robotics                  │
│  ▸ operating-systems         │
│  ─────────────────────────── │
│  [+ New Module]              │  ← owners only
└──────────────────────────────┘
```

### File tree

Use `@animate-ui/components-radix-files` as the base tree component.
Each module is a collapsible group. Each subfolder inside is a leaf row.

**Module row:**
- `<Folder size={14} />` icon + module name
- On click: toggles expand/collapse with animate-ui's animated accordion
- Right side (visible on hover): `<FolderPlus size={14} />` (new subfolder) + `<DotsThreeVertical size={14} />` (context menu)

**Subfolder row:**
- Indented 16px, `<File size={14} />` icon + folder name
- On click: selects this as the save destination; row background becomes
  `rgba(139,92,246,0.12)`, text becomes `colors.accent`
- Currently selected path is shown in a small label below the tree:
  `"Saving to: web / notes"` in `colors.textMuted`

**Context menu on subfolder (`<DotsThreeVertical />`):**
A `@radix-ui/react-popover` with:
- "Rename" → inline text input replaces the label; confirm with Enter
- "Delete" → confirmation popover: "Delete this folder? Notes inside will be orphaned."

### Drag and drop

- Each subfolder row is both a drag source and a drop target.
- A `.md` file from one subfolder can be dragged to another subfolder in the same or different module.
- Use the HTML5 Drag and Drop API. On `dragstart`, store `{ fromModule, fromSubfolder, filename }`.
- On `drop`, call the GitHub API to move the file (read content → commit to new path → delete old path) and update `modules.js`.
- Visual feedback: drop target row gets `border: 1px dashed colors.accent` while dragging over it.

### New Subfolder

Clicking `<FolderPlus />` on a module row:
1. Appends an inline text input below the module's last subfolder.
2. On Enter: creates the subfolder by committing a `.gitkeep` file to GitHub
   at `src/content/notes/[moduleId]/[subfolderName]/.gitkeep`.
3. Refreshes the file tree.

### New Module (owners only)

Clicking `[+ New Module]`:
1. Appends an inline text input at the bottom of the list.
2. On Enter: creates two default subfolders (`notes` and `tools`) by committing
   `.gitkeep` files and updating `modules.js`.
3. The module name is slugified the same way as `titleToFilename`.

### Delete Module (owners only)

Via the `<DotsThreeVertical />` context menu on a module row:
- Shows a confirmation popover: "Delete [module]? All notes inside will be removed from modules.js."
- On confirm: removes the module entry from `modules.js` and commits the updated file.
- Does NOT delete the actual `.md` files from GitHub (non-destructive to content).

---

## Preview Modal

### Behaviour

- Triggered by the `<Eye />` button in Row 1.
- Full-screen overlay using `@radix-ui/react-dialog`.
- Entrance: `opacity 0 → 1` + `scale(0.97) → scale(1)`, `220ms ease-out`.
- Exit: reverse, `180ms ease-in`.
- Background: `colors.bg` (pure black — matches the public notes page feel).
- Close: `<X />` button top-right, or press `Escape`.

### Content

```
┌─────────────────────────────────────────────────────────┐
│                                           [×]            │
│                                                         │
│          ┌──────────────────────────────┐               │
│          │  <MarkdownRenderer           │               │
│          │    content={content} />      │               │
│          │  (same component used on     │               │
│          │   public NotesPage)          │               │
│          └──────────────────────────────┘               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- Rendered markdown area: `max-width: 720px`, centered, same styling as `NotesPage`.
- The document title appears as an `<h1>` at the top of the preview.

---

## Users Drawer (Right, Owners Only)

### Behaviour

- Slides in from the **right**, same transition as Directory Drawer but `translateX(+320px) → 0`.
- Width: `420px`
- Same backdrop behaviour as Directory Drawer.
- Only mounted/rendered if `profile.role === 'owner'`.
- The `<Users />` icon in Row 1 is hidden (not just disabled) for contributors.

### Content

This is the existing `AdminUsers` logic, now rendered inside a drawer:

```
┌────────────────────────────────────────┐
│  Team                           [×]    │
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │ Username │ Role │ Actions        │  │
│  │──────────┼──────┼────────────────│  │
│  │ tanoo    │ owner│ [Edit] [Del]   │  │
│  │ moon     │ owner│ [Edit] [Del]   │  │
│  │ atish    │ owner│ [Edit] [Del]   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ▾ Add new user                        │  ← collapsible section
│    Email ___________________           │
│    Username _________________          │
│    Role [Owner ▾]                      │
│    Directories (multi-select)          │
│    Password [Generate]                 │
│    [Create user]                       │
└────────────────────────────────────────┘
```

All the existing `AdminUsers.jsx` logic (Supabase calls, password generation, role checks)
moves into this component. The `/admin/users` route can remain as a redirect to `/admin/editor`
with the drawer auto-opened (via a `?panel=users` query param), or be deprecated.

---

## Monaco Editor — Canvas Mode

The editor is restyled to feel like a blank writing surface:

```js
<Editor
  height="100%"
  defaultLanguage="markdown"
  theme="vs-dark"            // keep for cursor visibility
  value={content}
  onChange={v => { setContent(v); setUnsaved(true) }}
  onMount={editor => { editorRef.current = editor }}
  options={{
    fontSize: 15,
    lineHeight: 28,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    wordWrap: 'on',
    minimap: { enabled: false },
    lineNumbers: 'off',        // ← turned OFF for clean canvas feel
    scrollBeyondLastLine: true,
    renderLineHighlight: 'none',
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    scrollbar: {
      vertical: 'hidden',
      horizontal: 'hidden',
    },
    padding: { top: 0, bottom: 120 },
    // Match bg to canvas so there's no editor "box" visible
    // Set via defineTheme (see below)
  }}
/>
```

### Custom Monaco Theme

Call `monaco.editor.defineTheme` in the `beforeMount` prop to override the background:

```js
function handleBeforeMount(monaco) {
  monaco.editor.defineTheme('mooner-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#000000',        // colors.bg
      'editor.foreground': '#ffffff',         // colors.text
      'editorLineNumber.foreground': '#333333',
      'editor.selectionBackground': '#8B5CF640',  // colors.accent at 25%
      'editor.lineHighlightBackground': '#00000000',  // transparent
    }
  })
}

<Editor beforeMount={handleBeforeMount} theme="mooner-dark" ... />
```

---

## Toast Notification System

Replace all inline `error`/`success` string states with a single `<ToastNotification />` component.

```js
// Usage inside AdminEditor
const { showToast } = useToast()

showToast('Published! Vercel is deploying...', 'success')
showToast('Title and directory are required', 'error')
showToast('Image uploaded and inserted', 'success')
```

Toast appearance:
- Fixed bottom-right: `position: fixed; bottom: 24px; right: 24px; z-index: 9999`
- `background: colors.surface`, `border: 1px solid colors.border`, `border-radius: 10px`
- `padding: 12px 16px`, `font-size: 13px`
- Left accent bar: `4px` wide, `border-radius: 2px`:
  - Success: `colors.success`
  - Error: `colors.error`
- Auto-dismiss after `3500ms` with fade-out animation
- Max 3 toasts stacked (oldest dismissed first)

---

## Save Flow (unchanged logic, updated UX)

1. Validate title + selected directory → show error toast if missing
2. Show loading state: `<CloudArrowUp />` icon spins (CSS `animation: spin 1s linear infinite`)
3. `titleToFilename(title)` → filename
4. `commitFile(...)` → commit `.md` to GitHub
5. `getFileContent(modules.js path)` → read current modules
6. Insert new entry → `commitFile(modules.js path, ...)`
7. Success toast: `"Published! Vercel is deploying..."`
8. `setUnsaved(false)` → orange dot disappears

---

## Image Upload Flow (updated trigger, same logic)

Triggered by `<Image />` button in Row 2 OR by dropping an image onto the canvas.

For the toolbar button:
```js
// Hidden file input, triggered programmatically
const fileInputRef = useRef()
// In toolbar:
<button onClick={() => fileInputRef.current.click()}>
  <Image size={18} />
</button>
<input
  ref={fileInputRef}
  type="file"
  accept="image/png,image/jpeg,image/svg+xml"
  style={{ display: 'none' }}
  onChange={e => handleImageUpload(e.target.files[0])}
/>
```

The canvas also still accepts drag-drop via `react-dropzone` on the writing area div.
Both paths call the same `handleImageUpload` function (unchanged from original spec).

---

## AdminLogin Page (unchanged)

No changes to `AdminLogin.jsx` or its styles. The visual design is already correct per the original spec.

---

## Responsive Considerations

The admin panel is desktop-only (no mobile breakpoints needed — this is an internal tool).
Minimum supported width: `960px`. Below this, show a centered message:
`"The admin panel is designed for desktop use."` with a `<Monitor />` icon from Phosphor.

---

## NPM Packages

All already installed except:

```bash
npm install @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-tooltip
```

(These are likely already present as peer deps of animate-ui / shadcn. Check `node_modules` before installing.)

---

## Implementation Prompts

---

### Prompt A — Sub-component scaffolding + color/icon setup

> Read `admin-spec-v2.md` in full. Do not build any logic yet — only scaffold the file
> structure and wiring.
>
> 1. Create the directory `src/components/admin/`.
> 2. Create empty stub files for all components listed in the File Structure section
>    of the spec: `EditorNavbar.jsx`, `EditorNavbar.module.css`, `DirectoryDrawer.jsx`,
>    `DirectoryDrawer.module.css`, `PreviewModal.jsx`, `PreviewModal.module.css`,
>    `UsersDrawer.jsx`, `UsersDrawer.module.css`, `FormattingToolbar.jsx`,
>    `FormattingToolbar.module.css`, `StyleDropdown.jsx`, `ToastNotification.jsx`.
> 3. In `ToastNotification.jsx`, implement the full toast system described in the
>    "Toast Notification System" section, including the `useToast` hook. Export both
>    `ToastNotification` (the container component) and `useToast`.
> 4. Verify that `@radix-ui/react-dialog`, `@radix-ui/react-popover`, and
>    `@radix-ui/react-tooltip` are present in `node_modules`. If any are missing,
>    add a comment at the top of the relevant stub: `// npm install @radix-ui/react-dialog`
> 5. Confirm `@phosphor-icons/react` is importable by adding a single test import
>    to `EditorNavbar.jsx` (just a comment-import, no rendering yet).
> 6. Do not modify `AdminEditor.jsx`, `AdminLogin.jsx`, `useAdmin.js`, or any file
>    outside `src/components/admin/` and `src/pages/admin/`. Do not change any routes.

---

### Prompt B — EditorNavbar (Row 1 + Row 2 shell)

> Read `admin-spec-v2.md`. Build `EditorNavbar.jsx` and `EditorNavbar.module.css`.
>
> This component receives these props:
> ```js
> {
>   title,              // string
>   onTitleChange,      // fn(string)
>   unsaved,            // boolean
>   onToggleDirectory,  // fn()
>   directoryOpen,      // boolean
>   onPreview,          // fn()
>   onSave,             // fn()
>   saving,             // boolean (CloudArrowUp spins when true)
>   onToggleUsers,      // fn() — only called if isOwner
>   isOwner,            // boolean
>   username,           // string
>   onSignOut,          // fn()
>   editorRef,          // forwarded from AdminEditor
>   onFormatAction,     // fn(action: 'bold'|'italic'|'strike'|'code')
>   onInsertImage,      // fn() — triggers hidden file input
>   currentStyle,       // 'title'|'subtitle'|'body'
>   onStyleChange,      // fn('title'|'subtitle'|'body')
>   onNewModule,        // fn(moduleName)
>   onDeleteModule,     // fn() — deletes currently-selected module
>   isOwner,            // boolean — hides module management buttons for contributors
> }
> ```
>
> Implement:
> - Row 1 layout exactly as described in the "Navbar Row 1" section.
> - The auto-sizing title input using the hidden `<span>` mirror technique.
> - The pulsing orange unsaved dot (CSS keyframe).
> - The `<CloudArrowUp />` spinning CSS animation when `saving === true`.
> - The avatar dropdown using `@radix-ui/react-popover` showing username, role, and
>   a Sign Out option.
> - The `<Users />` icon is conditionally rendered only when `isOwner === true`.
> - Row 2: all formatting buttons with correct Phosphor icons and tooltips via
>   `@radix-ui/react-tooltip`.
> - `StyleDropdown.jsx`: a `@radix-ui/react-popover` with three options
>   (Title/H1, Subtitle/H2, Body). The trigger button shows the current style name.
> - The New Module button (`<FilePlus />`) and module-actions button
>   (`<DotsThreeVertical />`) at far right of Row 2, visible to owners only.
> - All colors from `src/constants/colors.js` — no hardcoded hex values.
> - All icons from `@phosphor-icons/react`.
>
> Do not implement the formatting logic itself (bold/italic wrapping) — just wire up
> `onClick` to call `onFormatAction(action)`. Do not modify `AdminEditor.jsx` yet.

---

### Prompt C — DirectoryDrawer

> Read `admin-spec-v2.md`, specifically the "Directory Drawer" section.
>
> Build `DirectoryDrawer.jsx` and `DirectoryDrawer.module.css`.
>
> Props:
> ```js
> {
>   open,                 // boolean
>   onClose,              // fn()
>   modules,              // array from modules.js (same shape as existing picker)
>   allowedDirectories,   // string[] (contributors) or null (owners see all)
>   selectedPath,         // { moduleId, subfolder } | null
>   onSelectPath,         // fn({ moduleId, subfolder })
>   isOwner,              // boolean
>   onNewSubfolder,       // fn(moduleId, subfolderName)
>   onRenameSubfolder,    // fn(moduleId, oldName, newName)
>   onDeleteSubfolder,    // fn(moduleId, subfolderName)
>   onNewModule,          // fn(moduleName)
>   onDeleteModule,       // fn(moduleId)
>   onMoveFile,           // fn({ fromModule, fromSubfolder, filename, toModule, toSubfolder })
> }
> ```
>
> Implement:
> - Slide-in from the left using `transform: translateX(-320px)` → `translateX(0)`,
>   transition `320ms cubic-bezier(0.4, 0, 0.2, 1)`. The drawer is always mounted in
>   the DOM; the `open` prop controls the transform.
> - Semi-transparent backdrop `div` (behind the drawer, above the canvas) that calls
>   `onClose` on click. Only visible when `open === true`.
> - File tree using `@animate-ui/components-radix-files`. Each module is a collapsible
>   group. Subfolders are leaf rows.
> - Hover actions on module rows: `<FolderPlus />` for new subfolder,
>   `<DotsThreeVertical />` for context menu (owners only).
> - Hover actions on subfolder rows: `<DotsThreeVertical />` for rename/delete context
>   menu (owners only).
> - Inline text input for new subfolder (appended below last subfolder on click of
>   `<FolderPlus />`). On Enter: calls `onNewSubfolder`. On Escape: cancels.
> - Inline text input for rename: replaces subfolder label. On Enter: calls
>   `onRenameSubfolder`. On Escape: cancels.
> - Inline text input for new module at the bottom (owners only `[+ New Module]` button).
>   On Enter: calls `onNewModule`.
> - Delete confirmation via a `@radix-ui/react-popover` (not `window.confirm`).
> - HTML5 drag and drop on subfolder rows. `dragstart` stores payload in
>   `event.dataTransfer.setData`. `dragover` adds dashed-border class. `drop` calls
>   `onMoveFile`. `dragleave`/`dragend` removes the dashed-border class.
> - Selected path highlighted: `background: rgba(139,92,246,0.12)`, `color: colors.accent`.
> - "Saving to: module / subfolder" label at the bottom of the drawer.
> - Contributors: filter modules by `allowedDirectories`; hide all owner-only controls.
> - All colors from `src/constants/colors.js`. All icons from `@phosphor-icons/react`.
>
> Do not modify `AdminEditor.jsx` yet.

---

### Prompt D — PreviewModal + UsersDrawer

> Read `admin-spec-v2.md`, the "Preview Modal" and "Users Drawer" sections.
>
> **Part 1 — PreviewModal.jsx:**
>
> Props: `{ open, onClose, title, content }`
>
> Implement using `@radix-ui/react-dialog`:
> - Full-screen overlay. Background `colors.bg`.
> - Entrance: `opacity 0→1` + `scale(0.97→1)`, 220ms ease-out. Exit: reverse, 180ms.
> - Content: centered `max-width: 720px` div. Document `title` rendered as `<h1>` above
>   the `<MarkdownRenderer content={content} />` component. Import `MarkdownRenderer`
>   from wherever it currently lives in the codebase.
> - Close button: `<X />` (Phosphor), fixed top-right of the modal. Escape key also closes.
> - Scrollable if content overflows.
>
> **Part 2 — UsersDrawer.jsx:**
>
> Props: `{ open, onClose, currentUserId }`
>
> Migrate the full content and logic from `AdminUsers.jsx` into this component:
> - Slide-in from the right: `transform: translateX(420px)` → `translateX(0)`,
>   same transition curve as DirectoryDrawer.
> - Same backdrop behaviour as DirectoryDrawer.
> - Header: "Team" title + `<X />` close button.
> - Users table: Username, Role, Allowed Directories, Actions (Edit / Delete).
> - "Add new user" collapsible section (default collapsed) with the full add-user form:
>   email, username, role selector, directory multi-select, generate-password button,
>   create button.
> - All existing Supabase logic, permission checks, and owner-only guards from
>   `AdminUsers.jsx` are preserved exactly. Only the wrapping layout changes.
> - `AdminUsers.jsx` can remain as a thin wrapper that renders `<UsersDrawer open={true} />`
>   for backwards-compatibility with the `/admin/users` route, or redirect to `/admin/editor?panel=users`.
>
> Do not modify `AdminEditor.jsx` yet.

---

### Prompt E — AdminEditor.jsx full rewrite

> Read `admin-spec-v2.md` in full. This is the integration prompt that wires everything
> together.
>
> Rewrite `AdminEditor.jsx` and `AdminEditor.module.css`:
>
> **Layout:**
> - CSS grid with `grid-template-rows: 48px 40px 1fr` and `height: 100vh`.
> - Row 1 + Row 2 = `<EditorNavbar />` (pass it all required props as defined in Prompt B).
> - Row 3 = the canvas: `overflow-y: auto`, centered writing area `max-width: 720px`,
>   `padding: 48px 24px 120px`.
> - `<DirectoryDrawer />`, `<PreviewModal />`, `<UsersDrawer />` all mounted at the top
>   of the JSX (outside the grid, as fixed-position overlays).
> - `<ToastNotification />` mounted at root level.
>
> **State:**
> ```js
> const [title, setTitle]               = useState('')
> const [content, setContent]           = useState('')
> const [unsaved, setUnsaved]           = useState(false)
> const [saving, setSaving]             = useState(false)
> const [directoryOpen, setDirectoryOpen] = useState(false)
> const [previewOpen, setPreviewOpen]   = useState(false)
> const [usersOpen, setUsersOpen]       = useState(false)
> const [selectedPath, setSelectedPath] = useState(null) // { moduleId, subfolder }
> const [modules, setModules]           = useState([])
> const [currentStyle, setCurrentStyle] = useState('body')
> const editorRef                        = useRef(null)
> const fileInputRef                     = useRef(null) // for toolbar image button
> const { profile, loading }             = useAdmin()
> const { showToast }                    = useToast()
> ```
>
> **Monaco integration:**
> - `beforeMount`: define the `mooner-dark` custom theme as described in the
>   "Custom Monaco Theme" section of the spec.
> - `onMount`: store editor instance in `editorRef.current`.
> - `onChange`: call `setContent` and `setUnsaved(true)`.
>
> **Formatting logic (`handleFormatAction`):**
> For each action, use `editorRef.current.getSelection()` and `executeEdits()`:
> - `'bold'`: wraps selected text in `**...**`, or inserts `**bold**` at cursor.
> - `'italic'`: wraps in `*...*`.
> - `'strike'`: wraps in `~~...~~`.
> - `'code'`: inserts a fenced code block (\`\`\`\n\n\`\`\`) at current line.
> - Focus returns to editor after each action via `editorRef.current.focus()`.
>
> **Style detection (`detectCurrentStyle`):**
> - Called on Monaco cursor position change event.
> - Reads the current line text via `editorRef.current.getModel().getLineContent(lineNumber)`.
> - Returns `'title'` if starts with `# `, `'subtitle'` if starts with `## `, else `'body'`.
> - Sets `currentStyle` state.
>
> **Style application (`handleStyleChange`):**
> - Reads current line, strips any leading `#`/`##` + space, prepends new prefix:
>   `'title'` → `# `, `'subtitle'` → `## `, `'body'` → (no prefix).
> - Uses `executeEdits` to replace the current line content.
>
> **Image upload (`handleImageUpload(file)`):**
> - Preserve the exact existing image upload flow from the original `AdminEditor.jsx`
>   (listDirectory → rename → uploadImage → executeEdits to insert markdown).
> - Wire to both the hidden `<input type="file" ref={fileInputRef}>` and the existing
>   `react-dropzone` on the canvas.
>
> **Save handler (`handleSave`):**
> - Preserve the exact existing save logic from the original `AdminEditor.jsx`.
> - Replace all `setError` / `setSuccess` calls with `showToast(message, 'error'|'success')`.
> - Set `saving` state around the async operations.
> - On success: `setUnsaved(false)`.
>
> **Module management handlers:**
> - `handleNewModule(name)`: slugify name, create `.gitkeep` files via `commitFile`,
>   update `modules.js`, refresh `modules` state, show success toast.
> - `handleDeleteModule(moduleId)`: remove from `modules.js`, commit, refresh state, toast.
> - `handleNewSubfolder(moduleId, name)`: commit `.gitkeep` to the new path, refresh.
> - `handleRenameSubfolder(moduleId, oldName, newName)`: update all references in
>   `modules.js`, commit, refresh.
> - `handleDeleteSubfolder(moduleId, name)`: remove from `modules.js`, commit, refresh.
> - `handleMoveFile({ fromModule, fromSubfolder, filename, toModule, toSubfolder })`:
>   read file content, commit to new path, delete from old path, update `modules.js`.
>
> **Auth guard:** unchanged — on mount check `supabase.auth.getUser()`; if null redirect to `/admin`.
>
> **Query param support:** on mount, if `location.search` contains `?panel=users` and
> `profile.role === 'owner'`, set `usersOpen(true)`.
>
> All colors from `src/constants/colors.js`. All icons from `@phosphor-icons/react`.
> Do not modify any file outside `src/pages/admin/AdminEditor.jsx`,
> `src/pages/admin/AdminEditor.module.css`, and `src/components/admin/`.

---

### Prompt F — Polish pass

> Read `admin-spec-v2.md`. Do a polish pass across all admin components:
>
> 1. **Keyboard shortcuts:** Add `useEffect` in `AdminEditor.jsx` to listen for:
>    - `Cmd/Ctrl + S` → `handleSave()`
>    - `Cmd/Ctrl + B` → `handleFormatAction('bold')`
>    - `Cmd/Ctrl + I` → `handleFormatAction('italic')`
>    - `Cmd/Ctrl + Shift + P` → `setPreviewOpen(true)`
>    Prevent default browser behaviour for all of these.
>
> 2. **Unsaved warning:** Add a `beforeunload` listener in `AdminEditor.jsx`:
>    if `unsaved === true`, prompt `"You have unsaved changes. Leave anyway?"`.
>    Remove the listener on unmount.
>
> 3. **Empty state for canvas:** When `content === ''`, show centered placeholder text
>    in the writing area: `"Start writing…"` in `colors.textMuted`, `font-size: 16px`.
>    This sits behind the Monaco Editor (opacity trick or conditional render).
>
> 4. **Module list loading:** When `AdminEditor` mounts and fetches the module list,
>    show skeleton rows in the DirectoryDrawer (3 grey shimmer bars) while loading.
>    Use a CSS `@keyframes shimmer` animation on `background: linear-gradient(...)`.
>
> 5. **Responsive guard:** Add a `useEffect` that checks `window.innerWidth < 960`
>    and sets a boolean state `isTooNarrow`. If true, render a centered message:
>    `<Monitor size={32} />` + `"Admin panel requires a larger screen."` in place of
>    the editor. Listen to `window.resize` and clean up on unmount.
>
> 6. **CSS audit:** Verify no hardcoded hex color values exist in any
>    `src/components/admin/*.module.css` or `src/pages/admin/*.module.css` file.
>    Replace any found with CSS custom properties referencing the design token values
>    (define them as `--color-accent: #8B5CF6` etc. on `:root` in a new
>    `src/styles/adminTokens.css` imported by `AdminEditor.jsx`).
>
> Do not change any logic — this prompt is styling, UX hardening, and accessibility only.
