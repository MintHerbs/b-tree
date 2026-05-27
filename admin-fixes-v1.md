# admin-fixes-v1.md — Claude Code Fix & Test Session

> Hand this file to Claude Code. Each section is a self-contained
> fix + test unit. Run them in order. Confirm each section passes
> before moving to the next. Never run two sections in the same session.

---

## Section 1 — Ctrl+S saves draft, not GitHub

### What is wrong
`Ctrl+S` calls `handleSave()` which pushes to GitHub.
It should call a `saveDraftNow()` function that only flushes
to localStorage and Supabase — no GitHub involvement.

### Prompt

> Read these files in full before making any changes:
> - `src/hooks/useDraft.js`
> - `src/hooks/useEditorSave.js`
> - `src/pages/admin/AdminEditor.jsx`
>
> **Fix 1 — `useDraft.js`:**
> Add a `saveDraftNow` function using `useCallback`:
> ```js
> const saveDraftNow = useCallback(async () => {
>   localStorage.setItem(
>     'admin-draft',
>     JSON.stringify({ title, content, selectedPath })
>   )
>   if (!userId) return
>   await supabase.from('drafts').upsert({
>     user_id:    userId,
>     title,
>     content,
>     module_id:  selectedPath?.moduleId ?? null,
>     subfolder:  selectedPath?.subfolder ?? null,
>     updated_at: new Date().toISOString(),
>   }, { onConflict: 'user_id' })
> }, [userId, title, content, selectedPath])
> ```
> Return `saveDraftNow` alongside the existing `clearDraft`.
>
> **Fix 2 — `useEditorSave.js`:**
> Destructure `saveDraftNow` from the `useDraft` call.
> Return `saveDraftNow` from the hook.
>
> **Fix 3 — `AdminEditor.jsx`:**
> Add `saveDraftNow` to the `useEditorSave` destructuring.
> Find the Ctrl+S keydown handler (`if (key === 's')`).
> Replace `handleSave()` with `saveDraftNow()`.
> `handleSave` must only be called by the Save/publish button — never
> by any keyboard shortcut.
>
> **Test:**
> After fixing, write a test in `src/hooks/useDraft.test.js`:
>
> ```
> describe saveDraftNow:
>   - calls localStorage.setItem with key 'admin-draft' and
>     correct JSON immediately (no debounce)
>   - calls supabase upsert with correct fields immediately
>   - does not call supabase if userId is null
> ```
>
> Run `npm test -- --run src/hooks/useDraft.test.js` and
> report pass/fail. Do not fix test failures — report only.

---

## Section 2 — Image queue persists to IndexedDB

### What is wrong
`imageQueueRef` is in-memory only. If the user closes the browser
or refreshes before publishing, all queued draft images are lost.
`draftDB.js` exists but is never called from `useEditorImages.js`.

### Prompt

> Read these files in full before making any changes:
> - `src/lib/draftDB.js`
> - `src/hooks/useEditorImages.js`
>
> **Fix 1 — Save blob on insert:**
> In `handleImageUpload`, after adding to `imageQueueRef.current[draftKey]`,
> add:
> ```js
> import { saveImageBlob } from '../lib/draftDB'
> await saveImageBlob(draftKey, file)
> ```
>
> **Fix 2 — Restore queue from IndexedDB on mount:**
> Add a `useEffect` that runs once on mount (empty dependency array):
> ```js
> import { getAllImageKeys, getImageBlob } from '../lib/draftDB'
>
> useEffect(() => {
>   const restore = async () => {
>     try {
>       const keys = await getAllImageKeys()
>       for (const key of keys) {
>         const blob = await getImageBlob(key)
>         if (blob) {
>           const ext = key.split('.').pop()
>           imageQueueRef.current[key] = { file: blob, ext }
>         }
>       }
>     } catch {
>       // IndexedDB unavailable — continue without restoring
>     }
>   }
>   restore()
> }, [])
> ```
>
> **Fix 3 — Verify publish clears IndexedDB:**
> Open `src/hooks/useEditorSave.js`. Confirm `clearAllImageBlobs()`
> from `draftDB.js` is called after a successful publish.
> If it is missing, add it after `clearDraft()`.
>
> **Test:**
> Write `src/hooks/useEditorImages.test.js` with these tests:
>
> ```
> describe handleImageUpload:
>   - calls saveImageBlob with the correct draftKey and file
>   - adds the file to imageQueueRef.current under the draftKey
>   - inserts draft:// placeholder into editor at cursor position
>   - shows error toast when selectedPath is null
>   - does NOT call uploadImage (images must not upload immediately)
>
> describe queue restore on mount:
>   - calls getAllImageKeys on mount
>   - calls getImageBlob for each key returned
>   - populates imageQueueRef.current with restored blobs
> ```
>
> Mock `draftDB` entirely using `vi.mock('../lib/draftDB', ...)`.
> Mock `editorRef.current` with `{ executeEdits: vi.fn(), getPosition: vi.fn() }`.
>
> Run `npm test -- --run src/hooks/useEditorImages.test.js` and
> report pass/fail. Do not fix failures — report only.

---

## Section 3 — Subfolder creation 404 fix

### What is wrong
`handleNewSubfolder` calls `getFileContent` to read `modules.js`
but constructs the wrong path — it includes `moduleId` or `subfolderName`
in the path instead of reading from the course root.
Correct path: `src/content/notes/${selectedCourse}/modules.js`

### Prompt

> Read `src/hooks/useEditorModules.js` in full.
>
> Find `handleNewSubfolder`. Locate the `getFileContent` call inside it.
> Print the exact path string it currently passes to `getFileContent`.
>
> The correct path for the course modules file is always:
> ```
> src/content/notes/${selectedCourse}/modules.js
> ```
>
> Fix the path to use only `selectedCourse` — remove any `moduleId`,
> `subfolderName`, or subfolder segments from it.
>
> Then check `handleNewModule`, `handleRenameSubfolder`,
> `handleDeleteSubfolder`, and `handleRenameModule` — if any of them
> also construct a path to `modules.js` that incorrectly includes
> `moduleId` or subfolder segments, apply the same fix to each.
>
> **Test:**
> Write `src/hooks/useEditorModules.test.js` with these tests:
>
> ```
> describe handleNewSubfolder:
>   - commits .gitkeep to correct path:
>     src/content/notes/${selectedCourse}/${moduleId}/${subfolderName}/.gitkeep
>   - calls getFileContent with path:
>     src/content/notes/${selectedCourse}/modules.js  (course root only)
>   - calls commitFileWithRetry to update modules.js after creating subfolder
>   - calls setModules to update local state immediately
>   - shows success toast on completion
>   - shows error toast if commitFile throws
>
> describe handleNewModule:
>   - calls getFileContent with course-root modules.js path
>   - calls commitFileWithRetry to update modules.js
> ```
>
> Mock `githubApi` functions inline in `vi.mock` factory.
> Mock `supabase` inline in `vi.mock` factory.
>
> Run `npm test -- --run src/hooks/useEditorModules.test.js` and
> report pass/fail. Do not fix failures — report only.

---

## Section 4 — SMILES: white molecules + immediate render

### What is wrong
Two bugs:
1. `drawer.draw(tree, svg, 'light')` renders black molecules on
   white background. Should be white molecules on transparent.
2. After inserting a molecule, the raw `<MoleculeStructure ... />` tag
   shows in Monaco instead of the SVG. `renderInlineWidgets` is not
   called immediately after insert.

### Prompt

> Read these files before making changes:
> - `src/lib/chemUtils.js`
> - `src/components/admin/ChemModal.jsx`
> - `src/pages/admin/AdminEditor.jsx`
> - `src/hooks/useEditorFormatting.js`
>
> **Fix 1 — White molecules on transparent background (`chemUtils.js`):**
> Find the `smilesToSvgDataUrl` function.
> Change `drawer.draw(tree, svg, 'light')` to `drawer.draw(tree, svg, 'dark')`.
> In the `SvgDrawer` options object, confirm `backgroundColor: 'transparent'`
> is set. If it is not, add it.
>
> **Fix 2 — Trigger immediate Monaco render after insert (`ChemModal.jsx`):**
> Add an optional `onAfterInsert` prop to `ChemModal`.
> In the Structure tab Insert handler, call it after `onInsert`:
> ```js
> onInsert(`<MoleculeStructure alt="${input.trim()}" data="${base64}" />`)
> onAfterInsert?.()
> onClose()
> ```
>
> **Fix 3 — Pass `onAfterInsert` from AdminEditor (`AdminEditor.jsx`):**
> Find where `ChemModal` is rendered. Add:
> ```jsx
> onAfterInsert={() => {
>   if (editorRef.current && typeof renderInlineWidgets === 'function') {
>     renderInlineWidgets(editorRef.current, monacoRef.current)
>   }
> }}
> ```
> `monacoRef` should already exist — if not, create it:
> `const monacoRef = useRef(null)` and populate it in Monaco's
> `beforeMount` callback: `monacoRef.current = monaco`.
>
> **Fix 4 — Also trigger after equation insert:**
> Apply the same `onAfterInsert` pattern to the Equation tab insert
> in `ChemModal.jsx` so KaTeX formulas also render immediately.
>
> **Test:**
> Add to `src/lib/chemUtils.test.js`:
>
> ```
> describe smilesToSvgDataUrl — theme:
>   - calls drawer.draw with 'dark' as the third argument
>   - does NOT call drawer.draw with 'light'
>
> describe smilesToSvgDataUrl — background:
>   - SvgDrawer is initialized with backgroundColor: 'transparent'
> ```
>
> Run `npm test -- --run src/lib/chemUtils.test.js` and
> report pass/fail. Do not fix failures — report only.

---

## Section 5 — CORS error from `.gitkeep` download_url

### What is wrong
A `Cross-Origin Request Blocked: data:text/plain;base64,Cg==` error
appears in the console. GitHub returns `data:` URLs as `download_url`
for tiny files like `.gitkeep`. Something in the codebase is calling
`fetch()` on those `download_url` values.

### Prompt

> Search the entire codebase for any code that:
> 1. Accesses `.download_url` on a GitHub API response object
> 2. Calls `fetch()` on a variable that could contain a GitHub file URL
> 3. Iterates over results from `listDirectory` or any GitHub
>    contents API response and accesses file properties beyond
>    `name`, `path`, `sha`, `type`, `size`
>
> Search in these locations:
> - `src/components/admin/DirectoryDrawer.jsx`
> - `src/components/admin/DirectoryDrawer.module.css`
> - Any file that imports from `@animate-ui/components-radix-files`
> - Any file that imports from `githubApi.js`
> - `src/hooks/useEditorModules.js`
> - `src/hooks/useImageCleanup.js`
>
> Report every match with exact file path and line number.
> Do not change anything yet.
>
> Then in `src/lib/githubApi.js`, verify that `listDirectory`
> already filters `.gitkeep` and non-file entries. Show the current
> implementation of `listDirectory`.
>
> If any code outside `githubApi.js` is found accessing `download_url`
> or iterating raw GitHub API responses directly (bypassing
> `githubApi.js`), fix it to either:
> - Remove the `download_url` access entirely, or
> - Filter out `.gitkeep` files before any iteration
>
> After fixing, add a comment above each fix:
> `// FIX: never access download_url — GitHub returns data: URLs for tiny files`
>
> **Test (regression):**
> Add to `src/lib/githubApi.test.js`:
>
> ```
> describe listDirectory — gitkeep filtering:
>   - filters out entries where name === '.gitkeep'
>   - filters out entries where type !== 'file'
>   - returns empty array when GitHub responds with 404
>   - never returns an entry with a data: download_url
> ```
>
> Run `npm test -- --run src/lib/githubApi.test.js` and
> report pass/fail. Do not fix failures — report only.

---

## Section 6 — RichPopover complete rewrite

### What is wrong
The current RichPopover implementation is broken. The CSS does not
match the library, the Monaco editor shows raw JSX instead of a
rendered chip, and the preview rendering is unreliable.
Everything related to RichPopover must be deleted and rebuilt from scratch.

### Prompt

> **Step 1 — Audit and delete all existing RichPopover code:**
>
> Find and delete the following (confirm each exists before deleting):
> - `src/components/ui/smoothui/rich-popover/index.tsx` (or wherever
>   the RichPopover component file lives)
> - Any CSS file associated with it
> - `src/components/admin/SocialLinkModal.jsx`
> - `src/components/admin/SocialLinkModal.module.css`
>
> Then open these files and remove all RichPopover-related code:
> - `src/components/markdown/MarkdownRenderer.jsx`:
>   Remove `splitContentByRichPopovers` (or `splitContentByCustomTags`),
>   `RichPopoverChip`, `parseRichPopoverProps`, all RichPopover imports,
>   and restore the renderer to a single `ReactMarkdown` call without
>   string splitting. Keep `MoleculeStructure` handling if it exists.
> - `src/components/admin/EditorNavbar.jsx`:
>   Remove the social link / share button and its `onInsertSocialLink` prop.
> - `src/pages/admin/AdminEditor.jsx`:
>   Remove `socialLinkModalOpen`, `openSocialLinkModal`,
>   `closeSocialLinkModal`, `handleInsertSocialLink` and any
>   `SocialLinkModal` usage.
>
> Do not delete anything else. Do not touch `MoleculeStructure` code.
>
> **Step 2 — Rebuild RichPopover component:**
>
> Create `src/components/ui/RichPopover.jsx` and
> `src/components/ui/RichPopover.module.css`.
>
> The component must exactly match the smoothui library demo:
> https://smoothui.dev/docs/components/rich-popover
>
> Props:
> ```ts
> {
>   trigger: ReactNode      // the inline element that opens the popover
>   title: string           // shown in popover header
>   href?: string           // makes title a clickable link
>   description?: string    // body text
>   meta?: string           // small badge bottom-left (e.g. "0:00–2:15")
>   actionLabel?: string    // button text bottom-right
>   actionHref?: string     // button link
>   side?: 'top'|'bottom'|'left'|'right'  // default 'top'
>   align?: 'start'|'center'|'end'        // default 'center'
> }
> ```
>
> Implementation requirements:
> - Use `@radix-ui/react-popover` for the popover primitive
> - Use `framer-motion` (or `motion/react`) for entrance/exit animation:
>   - Initial: `opacity: 0, scale: 0.95, y: 5, filter: blur(8px)`
>   - Animate: `opacity: 1, scale: 1, y: 0, filter: blur(0px)`
>   - Transition: spring, stiffness 500, damping 30
>   - Respect `useReducedMotion()`
> - Popover card: dark background `#000000`, `border: 1px solid rgba(255,255,255,0.10)`,
>   `border-radius: 16px`, `padding: 16px`, `box-shadow: 0 8px 32px rgba(0,0,0,0.5)`
> - Title row: platform icon + title text, `font-weight: 500`, `font-size: 14px`
> - If `href` is provided, title is a link with an `<ExternalLink>` icon
>   (use `lucide-react` or `@phosphor-icons/react` — use whichever is
>   already installed)
> - Description: `font-size: 16px`, `color: rgba(255,255,255,0.9)`,
>   `line-height: 1.6`, `max-width: 280px`, `margin-top: 12px`
> - Bottom row (when meta or actionLabel present):
>   - Meta badge: pill shape, `background: rgba(255,255,255,0.10)`,
>     small clock icon + text
>   - Action button: white background, black text, pill shape,
>     `font-size: 12px`, play icon + label
> - Popover arrow: dark fill matching card background
> - `AnimatePresence` wraps the content for exit animation
>
> Platform icons — export these three from `RichPopover.jsx`:
> - `YouTubeIcon`: YouTube red SVG (fill `#ff0000`)
> - `InstagramIcon`: Instagram gradient SVG
> - `LinkedInIcon`: LinkedIn blue SVG (fill `#0077b5`)
>
> Each icon accepts a `className` prop defaulting to `"h-4 w-4"`.
>
> **Step 3 — Rebuild SocialLinkModal:**
>
> Create `src/components/admin/SocialLinkModal.jsx` and
> `src/components/admin/SocialLinkModal.module.css`.
>
> The modal lets users insert a social link into the editor.
> It has three platform tabs: YouTube, Instagram, LinkedIn.
> Each tab shows a platform icon (from `RichPopover.jsx` exports).
>
> Fields per platform:
> - YouTube: Title, URL, Description (optional), Timestamp/meta (optional),
>   Action label (default "Watch video")
> - Instagram: Title, URL, Description (optional),
>   Action label (default "View")
> - LinkedIn: Title, URL, Description (optional),
>   Action label (default "View")
>
> Live preview:
> - Shows a `<RichPopover>` with the filled-in fields rendered live
>   as the user types, using a mock trigger button showing the
>   platform icon only (no text label)
> - The trigger button is a small `36px × 36px` rounded square
>   matching the library demo exactly
>
> On Insert:
> - Inserts a `<SocialLink>` custom tag into the editor:
>   ```
>   <SocialLink platform="youtube" href="..." title="..." description="..."
>     meta="..." actionLabel="Watch video" />
>   ```
> - Calls `onInsert(tagString)` then `onClose()`
>
> Note: The tag name is `<SocialLink>` not `<RichPopover>` — this
> avoids confusion with the React component name.
>
> **Step 4 — Rebuild MarkdownRenderer handling:**
>
> In `src/components/markdown/MarkdownRenderer.jsx`, add back
> `<SocialLink ... />` tag detection using the same split pattern
> that was removed in Step 1.
>
> The renderer for a `SocialLink` part renders a `<RichPopover>` with:
> - `trigger`: a small platform icon button (just the icon, no text,
>   `36px × 36px` rounded square, same style as the library demo)
> - All other props passed through from the tag attributes
>
> **Step 5 — Rebuild Monaco inline widget for SocialLink:**
>
> In `src/hooks/useEditorFormatting.js`, update `renderInlineWidgets`
> to scan for `<SocialLink ... />` tags (not `<RichPopover ... />`).
> The chip shown in Monaco: platform icon SVG + title text,
> `36px` tall, same pill style as described in Section 6 of
> `admin-spec-v2-inline-rendering.md`.
>
> **Step 6 — Rewire AdminEditor + EditorNavbar:**
>
> In `AdminEditor.jsx`: add back `socialLinkModalOpen` state,
> `SocialLinkModal` mount, and `handleInsertSocialLink` that calls
> `onInsert` from the modal and inserts at cursor via `executeEdits`.
>
> In `EditorNavbar.jsx`: add back the social link toolbar button.
> Icon: `<ShareNetwork size={18} />` from `@phosphor-icons/react`.
> Tooltip: "Insert social link".
> Place it after the chemistry button in Row 2.
>
> **Step 7 — Test:**
>
> Write `src/components/ui/RichPopover.test.jsx`:
> ```
> describe RichPopover:
>   - renders trigger element
>   - opens popover on trigger click
>   - renders title in popover content
>   - renders description when provided
>   - renders meta badge when provided
>   - renders action button when actionLabel provided
>   - renders title as link when href provided
>   - does not render meta badge when meta is not provided
>
> describe YouTubeIcon:
>   - renders an svg element
>   - accepts className prop
>
> describe InstagramIcon:
>   - renders an svg element
>
> describe LinkedInIcon:
>   - renders an svg element
> ```
>
> Run `npm test -- --run src/components/ui/RichPopover.test.jsx`
> and report pass/fail. Do not fix failures — report only.

---

## Running order

| Section | Risk | Depends on |
|---------|------|------------|
| 1 — Ctrl+S | Low | Nothing |
| 2 — Image IndexedDB | Low | Section 1 |
| 3 — Subfolder 404 | Low | Nothing |
| 4 — SMILES color + render | Low | Nothing |
| 5 — CORS fix | Low | Nothing |
| 6 — RichPopover rewrite | High | Sections 4 + 5 |

Run sections 1, 3, 4, 5 in any order.
Run section 2 after section 1.
Run section 6 last — it touches the most files.

---

## After all sections complete

Run the full test suite:
```bash
npm test -- --run
```

Report total pass/fail count. Any failure that was not present
before this session should be investigated before deploying.
