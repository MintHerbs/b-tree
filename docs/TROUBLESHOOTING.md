# Troubleshooting Guide

## Common Issues and Solutions

### Issue: Note Not Loading (Shows "Note not found")

**Symptoms:**
- Clicking on a note in the sidebar shows "Note not found"
- The URL looks correct but content doesn't load

**Causes & Solutions:**

#### 1. Filename has spaces or special characters
**Problem:** Filenames with spaces can cause URL encoding issues.

**Solution:** Use kebab-case (lowercase with hyphens) for filenames.

❌ Bad: `C Programming.md`, `My Notes.md`, `Lab_1.md`
✅ Good: `c-programming.md`, `my-notes.md`, `lab-1.md`

**How to fix:**
```bash
# Rename the file
Rename-Item "src\content\notes\module\Old Name.md" "new-name.md"

# Update sidebar configuration in src/components/layout/Sidebar/modules.js
{
  id: 'module-id',
  notes: [
    { filename: 'new-name.md', label: 'Display Name.md' },
  ],
}
```

#### 2. File path doesn't match sidebar configuration
**Problem:** The filename in the sidebar config doesn't match the actual file.

**Solution:** Ensure the filename in `modules.js` exactly matches the file in the folder.

**Check:**
1. Look at the actual file: `src/content/notes/module-id/filename.md`
2. Check sidebar config: `{ filename: 'filename.md', ... }`
3. Make sure they match exactly (case-sensitive!)

#### 3. Module ID mismatch
**Problem:** The folder name doesn't match the module ID.

**Solution:** Ensure folder name matches the module `id` in `modules.js`.

**Example:**
```javascript
// In modules.js
{
  id: 'operating-system',  // ← This must match folder name
  notes: [
    { filename: 'c-programming.md', ... }
  ]
}
```

**Folder structure:**
```
src/content/notes/
└── operating-system/     ← Must match the id above
    └── c-programming.md
```

---

### Issue: LaTeX Formulas Not Rendering

**Symptoms:**
- Math formulas show as raw LaTeX code
- Dollar signs visible: `$x^2$` instead of x²

**Solutions:**

#### 1. Check KaTeX CSS is loaded
The `katex.min.css` should be imported in `MarkdownRenderer.jsx`:

```javascript
import 'katex/dist/katex.min.css'
```

#### 2. Verify remark-math and rehype-katex are configured
In `MarkdownRenderer.jsx`:

```javascript
<ReactMarkdown
  remarkPlugins={[remarkMath, remarkGfm]}
  rehypePlugins={[rehypeKatex, rehypeRaw]}
>
```

#### 3. Check LaTeX syntax
- Inline math: `$x^2 + y^2$`
- Display math: `$$\int x dx$$`
- Make sure to escape backslashes in JavaScript strings if needed

---

### Issue: Tables Not Styled Properly

**Symptoms:**
- Tables appear as plain text
- No borders or styling

**Solutions:**

#### 1. Ensure remark-gfm is installed and configured
```javascript
import remarkGfm from 'remark-gfm'

<ReactMarkdown
  remarkPlugins={[remarkMath, remarkGfm]}  // ← remarkGfm must be here
>
```

#### 2. Check table syntax
Tables must have proper markdown syntax:

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

**Common mistakes:**
- Missing header separator row (`|----------|----------|`)
- Inconsistent number of columns
- Missing pipes at start/end of rows

---

### Issue: Code Blocks Not Formatted

**Symptoms:**
- Code appears as plain text
- No monospace font or background

**Solutions:**

#### 1. Check code block syntax
Use triple backticks with optional language:

````markdown
```c
#include <stdio.h>
int main() {
    return 0;
}
```
````

#### 2. Verify custom code component
In `MarkdownRenderer.jsx`, ensure the `code` component is defined:

```javascript
components={{
  code({ node, inline, className, children, ...props }) {
    return !inline ? (
      <pre className={styles.codeBlock}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    ) : (
      <code className={styles.inlineCode} {...props}>
        {children}
      </code>
    )
  },
}}
```

---

### Issue: Content Not Centered

**Symptoms:**
- Content spans full width of screen
- Doesn't look like Obsidian

**Solutions:**

#### 1. Check CSS max-width
In `MarkdownRenderer.module.css`:

```css
.markdownContainer {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;  /* Centers the container */
}
```

#### 2. Verify parent container
The parent `<div>` in `NotesPage.jsx` should have:

```javascript
style={{
  display: 'flex',
  justifyContent: 'center',
}}
```

---

### Issue: Build Errors

**Symptoms:**
- `npm run build` fails
- Import errors or module not found

**Solutions:**

#### 1. Clear cache and rebuild
```bash
# Delete node_modules and dist
Remove-Item -Recurse -Force node_modules, dist

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

#### 2. Check all imports
Ensure all imports in `MarkdownRenderer.jsx` are correct:

```javascript
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
```

#### 3. Verify dependencies in package.json
All these should be present:
- `react-markdown`
- `remark-math`
- `remark-gfm`
- `rehype-katex`
- `rehype-raw`
- `katex`

---

### Issue: Sidebar Doesn't Show Note

**Symptoms:**
- Note file exists but doesn't appear in sidebar
- Module shows but note is missing

**Solutions:**

#### 1. Check module configuration
In `src/components/layout/Sidebar/modules.js`:

```javascript
{
  id: 'module-id',
  label: 'Module Name',
  Icon: SomeIcon,
  notes: [  // ← Make sure this array exists
    { filename: 'your-note.md', label: 'Display Name.md' },
  ],
}
```

#### 2. Verify module has content
The `hasContent()` function checks if a module has tools or notes:

```javascript
export function hasContent(module) {
  return (module.tools?.length ?? 0) + (module.notes?.length ?? 0) > 0
}
```

If a module has no tools and no notes, it won't be expandable.

#### 3. Restart dev server
After changing `modules.js`, restart the dev server:

```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

---

### Issue: Slow Loading or Performance

**Symptoms:**
- Notes take a long time to load
- Page feels sluggish

**Solutions:**

#### 1. Check file size
Very large markdown files (>1MB) can be slow to parse.

**Solution:** Split large files into smaller sections.

#### 2. Optimize images
If your markdown includes images, ensure they're optimized.

#### 3. Check browser console
Open DevTools (F12) and check for errors or warnings.

---

## Getting Help

If you encounter an issue not covered here:

1. **Check the browser console** (F12 → Console tab)
2. **Check the terminal** where `npm run dev` is running
3. **Verify file paths** are correct and case-sensitive
4. **Check the build output** with `npm run build`
5. **Review the documentation** in `docs/markdown-notes-setup.md`

## Quick Diagnostic Checklist

- [ ] File exists in correct location: `src/content/notes/<module-id>/<filename>.md`
- [ ] Filename uses kebab-case (no spaces or special characters)
- [ ] Module ID in `modules.js` matches folder name
- [ ] Filename in `modules.js` matches actual file
- [ ] `npm run build` completes without errors
- [ ] Browser console shows no errors
- [ ] Dev server restarted after config changes

## Common File Naming Conventions

✅ **Good filenames:**
- `getting-started.md`
- `c-programming.md`
- `math.md`
- `lab-1.md`
- `chapter-01.md`

❌ **Bad filenames:**
- `Getting Started.md` (spaces)
- `C Programming.md` (spaces)
- `Lab_1.md` (underscores can work but hyphens are preferred)
- `Chapter#1.md` (special characters)
- `MATH.md` (all caps - use lowercase)

---

**Last Updated:** After fixing the C Programming note loading issue by renaming to `c-programming.md`
