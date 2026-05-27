# admin-spec-v2-multidraft.md — Multi-Draft System

> Extends all previous specs. Covers:
> 1. Multiple drafts per user (up to 5)
> 2. Drafts tab in the sidebar
> 3. Live save status indicator
> 4. Image/SVG blob scoping per draft

---

## Supabase Migration

Run this SQL in the Supabase SQL editor:

```sql
-- Step 1: Remove the one-draft-per-user constraint
alter table drafts drop constraint if exists drafts_user_id_key;

-- Step 2: Add draft name column
alter table drafts add column if not exists
  draft_name text not null default 'Untitled';

-- Step 3: Add selected_course column so draft remembers which course it belongs to
alter table drafts add column if not exists
  selected_course text;

-- Step 4: Verify the table now looks like:
-- id, user_id, draft_name, title, content, module_id,
-- subfolder, selected_course, updated_at
select column_name from information_schema.columns
where table_name = 'drafts'
order by ordinal_position;
```

---

## Data Model

### `drafts` table (updated)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | draft identifier |
| `user_id` | uuid | references auth.users |
| `draft_name` | text | user-given name e.g. "Chapter 5 Notes" |
| `title` | text | the note's markdown title |
| `content` | text | full markdown content including draft:// refs |
| `module_id` | text | selected module |
| `subfolder` | text | selected subfolder |
| `selected_course` | text | which course this draft belongs to |
| `updated_at` | timestamptz | last saved |

**Max 5 drafts per user — enforced at app level, not DB level.**

### IndexedDB blob key format (updated)

Old: `img-1.png`
New: `${draftId}:img-1.png`

This scopes blobs to a specific draft so switching drafts loads the right images. `draftId` is the Supabase row `id` (UUID).

---

## Save Status Indicator

### States

| State | Text | Color | When |
|-------|------|-------|------|
| Unsaved | `● Unsaved` | `colors.orange` | Content changed, not yet saved |
| Saving | `↑ Saving...` | `colors.textMuted` | 30s timer fired, Supabase call in progress |
| Saved | `✓ Draft saved` | `colors.success` | Supabase upsert confirmed success |
| Failed | `⚠ Save failed` | `colors.error` | Supabase upsert threw or returned error |

### Rules
- Only transitions to `Saving` when the 30-second Supabase save fires
- Not shown on every 800ms localStorage write — too noisy
- `Saved` state persists until content changes again
- `Failed` state persists until the next successful save
- On publish to GitHub: transitions to `☁ Published` (existing behaviour)

### Implementation in `useDraft.js`

Add `saveStatus` state to the hook:
```js
const [saveStatus, setSaveStatus] = useState('saved')
// 'unsaved' | 'saving' | 'saved' | 'failed'
```

On any content change: `setSaveStatus('unsaved')`
Before Supabase upsert: `setSaveStatus('saving')`
On upsert success: `setSaveStatus('saved')`
On upsert error: `setSaveStatus('failed')`

Return `saveStatus` from the hook. Pass it through to `DraftStatusIndicator`.

---

## Multi-Draft Hook: `useDrafts.js`

Replaces the single-draft `useDraft.js`. The new hook manages the full
lifecycle of multiple drafts.

```js
// src/hooks/useDrafts.js

export function useDrafts({
  userId,
  selectedCourse,
  title, setTitle,
  content, setContent,
  selectedPath, setSelectedPath,
  editorRef,
}) {
  const [drafts, setDrafts]             = useState([])   // all user's drafts
  const [activeDraftId, setActiveDraftId] = useState(null)
  const [saveStatus, setSaveStatus]     = useState('saved')
  const [loadingDrafts, setLoadingDrafts] = useState(true)
  const initialized                     = useRef(false)
  const activeIdRef                     = useRef(null)   // sync ref for timers

  // Keep ref in sync with state
  useEffect(() => { activeIdRef.current = activeDraftId }, [activeDraftId])

  // ── LOAD ALL DRAFTS ON MOUNT ────────────────────────────────────────
  // Fetch all drafts for this user from Supabase.
  // Restore the most recently edited draft into the editor.
  // Falls back to localStorage if Supabase is unavailable.

  // ── AUTO-SAVE TO LOCALSTORAGE (800ms debounce) ──────────────────────
  // Saves { draftId, title, content, selectedPath } to localStorage
  // key: `admin-draft-${activeDraftId}`
  // Only runs after initialized.current === true

  // ── AUTO-SAVE TO SUPABASE (30s debounce) ────────────────────────────
  // Upserts the active draft to Supabase.
  // Sets saveStatus: 'saving' → 'saved' | 'failed'
  // Only runs after initialized.current === true

  // ── CREATE DRAFT ─────────────────────────────────────────────────────
  // Called when user clicks "New Draft" and confirms a name.
  // Enforces 5-draft limit — throws if user already has 5.
  // Saves current draft first, then creates new empty draft in Supabase.
  // Clears editor for the new draft.
  async function createDraft(draftName) {
    if (drafts.length >= 5) {
      throw new Error('Maximum 5 drafts reached. Publish or delete one first.')
    }
    // Save current draft before switching
    await flushSave()
    // Create new row in Supabase
    const { data, error } = await supabase.from('drafts').insert({
      user_id: userId,
      draft_name: draftName,
      title: '',
      content: '',
      selected_course: selectedCourse,
      updated_at: new Date().toISOString(),
    }).select().single()
    if (error) throw new Error(error.message)
    setDrafts(prev => [...prev, data])
    setActiveDraftId(data.id)
    setTitle('')
    setContent('')
    setSelectedPath(null)
    setSaveStatus('saved')
  }

  // ── SWITCH DRAFT ─────────────────────────────────────────────────────
  // Auto-saves current draft, then loads the selected draft.
  // Restores IndexedDB blobs for the new draft.
  async function switchDraft(draftId) {
    if (draftId === activeDraftId) return
    await flushSave()
    const draft = drafts.find(d => d.id === draftId)
    if (!draft) return
    setActiveDraftId(draftId)
    setTitle(draft.title ?? '')
    setContent(draft.content ?? '')
    setSelectedPath(
      draft.module_id && draft.subfolder
        ? { moduleId: draft.module_id, subfolder: draft.subfolder }
        : null
    )
    setSaveStatus('saved')
    // Restore IndexedDB blobs for this draft
    // (blobs keyed as `${draftId}:img-X.ext`)
    await restoreDraftBlobs(draftId)
  }

  // ── DELETE DRAFT ──────────────────────────────────────────────────────
  // Deletes from Supabase and localStorage.
  // Clears associated IndexedDB blobs.
  // If it was the active draft, switches to the next available one.
  async function deleteDraft(draftId) {
    await supabase.from('drafts').delete().eq('id', draftId)
    localStorage.removeItem(`admin-draft-${draftId}`)
    await clearDraftBlobs(draftId)
    const remaining = drafts.filter(d => d.id !== draftId)
    setDrafts(remaining)
    if (draftId === activeDraftId) {
      if (remaining.length > 0) {
        await switchDraft(remaining[0].id)
      } else {
        setActiveDraftId(null)
        setTitle('')
        setContent('')
        setSelectedPath(null)
      }
    }
  }

  // ── RENAME DRAFT ─────────────────────────────────────────────────────
  async function renameDraft(draftId, newName) {
    await supabase.from('drafts')
      .update({ draft_name: newName })
      .eq('id', draftId)
    setDrafts(prev =>
      prev.map(d => d.id === draftId ? { ...d, draft_name: newName } : d)
    )
  }

  // ── FLUSH SAVE (immediate, no debounce) ──────────────────────────────
  // Called before switching or deleting drafts to ensure nothing is lost.
  async function flushSave() {
    if (!activeIdRef.current || !userId) return
    setSaveStatus('saving')
    try {
      await supabase.from('drafts').upsert({
        id: activeIdRef.current,
        user_id: userId,
        title,
        content,
        module_id: selectedPath?.moduleId ?? null,
        subfolder: selectedPath?.subfolder ?? null,
        selected_course: selectedCourse,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('failed')
    }
  }

  // ── CLEAR DRAFT (after GitHub publish) ───────────────────────────────
  // Removes the active draft from Supabase and localStorage.
  // Does NOT delete the draft row — marks it as published instead,
  // or optionally deletes it.
  async function clearActiveDraft() {
    if (!activeDraftId) return
    localStorage.removeItem(`admin-draft-${activeDraftId}`)
    await supabase.from('drafts')
      .delete()
      .eq('id', activeDraftId)
    const remaining = drafts.filter(d => d.id !== activeDraftId)
    setDrafts(remaining)
    if (remaining.length > 0) {
      await switchDraft(remaining[0].id)
    } else {
      setActiveDraftId(null)
      setTitle('')
      setContent('')
      setSelectedPath(null)
    }
  }

  return {
    drafts,
    activeDraftId,
    saveStatus,
    loadingDrafts,
    createDraft,
    switchDraft,
    deleteDraft,
    renameDraft,
    flushSave,
    clearActiveDraft,
  }
}
```

---

## IndexedDB: Draft-Scoped Blob Keys

Update `src/lib/draftDB.js`:

### Key format change
Old: `img-1.png`
New: `${draftId}:img-1.png`

```js
// Updated nextImageKey — now requires draftId
export function nextImageKey(draftId, ext) {
  const counterKey = `admin-draft-img-counter-${draftId}`
  const n = parseInt(localStorage.getItem(counterKey) ?? '0', 10) + 1
  localStorage.setItem(counterKey, String(n))
  return `${draftId}:img-${n}.${ext}`
}

// Get all keys for a specific draft
export async function getDraftImageKeys(draftId) {
  const all = await getAllImageKeys()
  return all.filter(k => k.startsWith(`${draftId}:`))
}

// Delete all blobs for a specific draft
export async function clearDraftBlobs(draftId) {
  const keys = await getDraftImageKeys(draftId)
  for (const key of keys) {
    await deleteImageBlob(key)
  }
}

// Restore queue for a specific draft
export async function restoreDraftBlobs(draftId) {
  const keys = await getDraftImageKeys(draftId)
  const result = {}
  for (const key of keys) {
    const blob = await getImageBlob(key)
    if (blob) {
      const ext = key.split('.').pop()
      result[key] = { file: blob, ext }
    }
  }
  return result
}
```

Update `extractDraftKeys` to handle the new key format:
```js
export function extractDraftKeys(markdown) {
  const matches = [...markdown.matchAll(/!\[.*?\]\(draft:\/\/(.*?)\)/g)]
  return matches.map(m => m[1])
  // Returns full keys like "abc-123:img-1.png"
}
```

---

## Drafts Tab in Sidebar

### Tab bar update

The sidebar currently shows `Files | Edit Files`. Add `Drafts` as the third tab.

```jsx
// In DirectoryDrawer.jsx or wherever the sidebar tabs live
<div className={styles.tabBar}>
  <button
    className={activeTab === 'files' ? styles.tabActive : styles.tab}
    onClick={() => setActiveTab('files')}
  >
    Files
  </button>
  <button
    className={activeTab === 'edit' ? styles.tabActive : styles.tab}
    onClick={() => setActiveTab('edit')}
  >
    Edit Files
  </button>
  <button
    className={activeTab === 'drafts' ? styles.tabActive : styles.tab}
    onClick={() => setActiveTab('drafts')}
  >
    Drafts
  </button>
</div>
```

### Drafts tab content

```
┌─────────────────────────────────────┐
│  Files  │  Edit Files  │  Drafts    │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ● Chapter 5 Notes      [⋮] │    │ ← active draft (dot indicator)
│  │   Operating Systems        │    │
│  │   2 minutes ago            │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Sorting Algorithms   [⋮] │    │
│  │   Algorithms               │    │
│  │   Yesterday                │    │
│  └─────────────────────────────┘    │
│                                     │
│  3 of 5 drafts used                 │
│                                     │
├─────────────────────────────────────┤
│  [□ New Draft]                      │ ← replaces "New Subject" when on Drafts tab
└─────────────────────────────────────┘
```

### Draft card

Each draft card shows:
- Active indicator: a small `●` dot in `colors.accent` if this is the active draft
- Draft name (bold, truncated at 28 chars)
- `[⋮]` context menu: Rename, Delete
- Module/course it belongs to (in `colors.textMuted`, smaller)
- Relative timestamp: "2 minutes ago", "Yesterday", "3 days ago"

Clicking a card calls `switchDraft(draft.id)`.

### New Draft flow

1. User clicks `[□ New Draft]`
2. An inline input appears at the top of the draft list:
   ```
   ┌──────────────────────────────────┐
   │ Draft name: [________________]   │
   │             [Cancel]  [Create]   │
   └──────────────────────────────────┘
   ```
3. User types a name and clicks Create (or presses Enter)
4. If 5 drafts already exist: show inline error
   `"Maximum 5 drafts. Publish or delete one first."`
5. On success: new draft appears at the top of the list, becomes active,
   editor clears

### Rename flow

From the `[⋮]` context menu → "Rename":
- The draft name in the card becomes an inline `<input>`
- On Enter or blur: calls `renameDraft(id, newName)`
- On Escape: cancels

### Delete flow

From the `[⋮]` context menu → "Delete":
- Confirmation popover: `"Delete this draft? This cannot be undone."`
- On confirm: calls `deleteDraft(id)`

### Draft count indicator

Below the list: `"X of 5 drafts used"` in `colors.textMuted`, `font-size: 11px`.
Turns `colors.warning` when at 4/5. Turns `colors.error` when at 5/5.

---

## File Changes Summary

| File | Change |
|------|--------|
| Supabase | Migration SQL (manual) |
| `src/lib/draftDB.js` | Add draft-scoped key functions |
| `src/hooks/useDraft.js` | Rename to `useDrafts.js`, full rewrite for multi-draft |
| `src/hooks/useEditorImages.js` | Pass `activeDraftId` to `nextImageKey` |
| `src/components/admin/DirectoryDrawer.jsx` | Add Drafts tab + draft cards |
| `src/components/admin/DirectoryDrawer.module.css` | Draft card styles |
| `src/components/admin/DraftStatusIndicator.jsx` | Wire to `saveStatus` from `useDrafts` |
| `src/pages/admin/AdminEditor.jsx` | Replace `useDraft` with `useDrafts` |

---

## Implementation Prompts

---

### Prompt M1 — Supabase migration (manual)

Run this SQL in the Supabase SQL editor before running any other prompt:

```sql
alter table drafts drop constraint if exists drafts_user_id_key;
alter table drafts add column if not exists draft_name text not null default 'Untitled';
alter table drafts add column if not exists selected_course text;
```

Verify with:
```sql
select column_name from information_schema.columns
where table_name = 'drafts' order by ordinal_position;
```

Confirm `draft_name` and `selected_course` appear before proceeding.

---

### Prompt M2 — `draftDB.js` — draft-scoped blob keys

> You are a senior software engineer updating a React + Vite admin panel.
> The draft system currently stores image blobs in IndexedDB with keys like
> `img-1.png`. With multiple drafts now supported, blobs must be scoped to a
> specific draft using keys like `${draftId}:img-1.png` so switching drafts
> loads the correct images.
>
> Read `admin-spec-v2-multidraft.md` section "IndexedDB: Draft-Scoped Blob Keys"
> and `src/lib/draftDB.js` in full.
>
> Add these new exported functions to `draftDB.js` without removing any
> existing functions: `nextImageKey` (updated signature), `getDraftImageKeys`,
> `clearDraftBlobs`, `restoreDraftBlobs`.
>
> Update `extractDraftKeys` to handle keys in the `${draftId}:img-N.ext` format.
>
> The old `nextImageKey(ext)` signature must remain working as a fallback
> for any code that hasn't been updated yet — add a backward-compatibility
> shim: if called with one argument, use `'legacy'` as the draftId.
>
> Write tests for all new functions. Run
> `npm test -- --run src/lib/draftDB.test.js` and report results.
> Do not modify any other files.

---

### Prompt M3 — `useDrafts.js`

> You are a senior software engineer replacing the single-draft `useDraft.js`
> hook with a multi-draft `useDrafts.js` hook in a React + Vite admin panel.
>
> Current state: `useDraft.js` supports exactly one draft per user stored
> in Supabase with a `unique(user_id)` constraint. That constraint has now
> been removed.
>
> Target state: `useDrafts.js` supports up to 5 drafts per user with full
> create, switch, delete, rename, and flush-save lifecycle management.
>
> Read `admin-spec-v2-multidraft.md` section "Multi-Draft Hook: useDrafts.js"
> in full. Then read `src/hooks/useDraft.js` and `src/lib/draftDB.js`.
>
> Create `src/hooks/useDrafts.js` implementing all functions described in
> the spec: `createDraft`, `switchDraft`, `deleteDraft`, `renameDraft`,
> `flushSave`, `clearActiveDraft`. Return `saveStatus` with the four states:
> `'unsaved'`, `'saving'`, `'saved'`, `'failed'`.
>
> The `saveStatus` must transition correctly:
> - Any content change → `'unsaved'`
> - Before Supabase upsert → `'saving'`
> - Upsert success → `'saved'`
> - Upsert error → `'failed'`
>
> Do not delete `useDraft.js` yet — it will be removed in a later prompt.
>
> Write tests in `src/hooks/useDrafts.test.js`. Run
> `npm test -- --run src/hooks/useDrafts.test.js` and report results.
> Do not modify any other files.

---

### Prompt M4 — Drafts tab in sidebar

> You are a senior software engineer adding a Drafts tab to the admin panel
> sidebar in a React + Vite admin panel. The sidebar currently shows
> "Files" and "Edit Files" tabs.
>
> Current state: two tabs, no draft management in the sidebar.
> Target state: three tabs — Files, Edit Files, Drafts. The Drafts tab shows
> up to 5 draft cards per user. The "New Subject" / "New Draft" button at the
> bottom changes label based on which tab is active.
>
> Read `admin-spec-v2-multidraft.md` section "Drafts Tab in Sidebar" in full.
> Then read `src/components/admin/DirectoryDrawer.jsx` and its CSS module.
>
> Add the Drafts tab to the existing tab bar. Implement:
> - Draft card component (name, module, relative timestamp, active dot,
>   context menu with Rename and Delete)
> - New Draft inline input flow (name prompt → Create/Cancel)
> - Rename inline input flow
> - Delete confirmation popover
> - Draft count indicator (`X of 5 drafts used`)
>
> The component receives these new props:
> ```js
> drafts,           // array from useDrafts
> activeDraftId,    // string from useDrafts
> onSwitchDraft,    // fn(draftId)
> onCreateDraft,    // fn(draftName)
> onDeleteDraft,    // fn(draftId)
> onRenameDraft,    // fn(draftId, newName)
> ```
>
> All colors from `src/constants/colors.js`.
> All icons from `@phosphor-icons/react`.
> Do not modify any other files.

---

### Prompt M5 — Wire everything into AdminEditor + DraftStatusIndicator

> You are a senior software engineer wiring a new multi-draft system into
> the admin editor shell of a React + Vite admin panel.
>
> Read `admin-spec-v2-multidraft.md` in full. Confirm these files exist:
> - `src/hooks/useDrafts.js`
> - `src/lib/draftDB.js` (with new draft-scoped functions)
> - `src/components/admin/DirectoryDrawer.jsx` (with Drafts tab)
>
> Make these changes:
>
> **`src/pages/admin/AdminEditor.jsx`:**
> Replace all usage of `useDraft` with `useDrafts`. Pass `activeDraftId`
> to `useEditorImages` so image keys are scoped correctly. Pass `flushSave`
> to `useEditorSave` to call before publishing. Pass `clearActiveDraft`
> to the publish flow to replace `clearDraft`. Pass all draft props to
> `DirectoryDrawer`.
>
> **`src/hooks/useEditorImages.js`:**
> Update `handleImageUpload` to accept `activeDraftId` and pass it to
> `nextImageKey(activeDraftId, ext)`. Update the mount restore to call
> `restoreDraftBlobs(activeDraftId)` instead of `getAllImageKeys`.
>
> **`src/components/admin/DraftStatusIndicator.jsx`:**
> Update to use the four `saveStatus` states from `useDrafts`:
> `unsaved` → `● Unsaved` in `colors.orange`
> `saving` → `↑ Saving...` in `colors.textMuted`
> `saved` → `✓ Draft saved` in `colors.success`
> `failed` → `⚠ Save failed` in `colors.error`
>
> After wiring, run the full test suite:
> `npm test -- --run`
> Report total pass/fail. Do not fix any new failures — report only.
