# Markdown Notes Setup

## Overview

The application now supports beautifully rendered markdown notes with full support for:
- **LaTeX formulas** (inline and display mode) using KaTeX
- **Tables** with GitHub Flavored Markdown
- **Code blocks** with syntax highlighting
- **Headers, lists, blockquotes**, and all standard markdown features

## File Structure

Markdown notes are stored in `src/content/notes/` organized by module:

```
src/content/notes/
├── math/
│   └── math.md
├── operating-system/
│   └── c-programming.md
└── database/
    └── getting-started.md
```

**Note:** Filenames should use kebab-case (lowercase with hyphens) to avoid URL encoding issues.

## How It Works

### 1. MarkdownRenderer Component

Located at `src/components/markdown/MarkdownRenderer.jsx`, this component:
- Uses `react-markdown` for parsing
- Applies `remark-math` and `remark-gfm` plugins for math and tables
- Uses `rehype-katex` to render LaTeX formulas
- Provides custom styling for all markdown elements

### 2. NotesPage Component

Located at `src/pages/notes/NotesPage.jsx`:
- Dynamically loads markdown files based on URL parameters
- Routes follow the pattern: `/notes/:section/:file`
- Example: `/notes/math/math.md`

### 3. Sidebar Configuration

In `src/components/layout/Sidebar/modules.js`, modules can include notes:

```javascript
{
  id: 'math',
  label: 'Math',
  Icon: FunctionIcon,
  notes: [
    { filename: 'math.md', label: 'Matrix Notes.md' },
  ],
}
```

## Adding New Notes

1. **Create the markdown file** in the appropriate module folder:
   ```
   src/content/notes/<module-id>/<filename>.md
   ```

2. **Update the sidebar configuration** in `src/components/layout/Sidebar/modules.js`:
   ```javascript
   {
     id: 'module-id',
     label: 'Module Name',
     Icon: SomeIcon,
     notes: [
       { filename: 'your-file.md', label: 'Display Name.md' },
     ],
   }
   ```

3. The note will automatically appear in the sidebar under that module.

## Styling

The markdown renderer uses a custom CSS module (`MarkdownRenderer.module.css`) that provides:
- **Centered layout** with max-width of 800px
- **Dark theme** optimized for readability
- **Obsidian-inspired** styling
- **Responsive design** for mobile devices
- **Syntax-highlighted code blocks**
- **Properly formatted tables** with hover effects
- **Beautiful LaTeX rendering** with KaTeX

## LaTeX Support

Both inline and display math are supported:

**Inline math:** `$x^2 + y^2 = z^2$` renders as $x^2 + y^2 = z^2$

**Display math:**
```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

## Tables

Tables are automatically styled with borders and hover effects:

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

## Code Blocks

Code blocks support syntax highlighting:

````markdown
```c
#include <stdio.h>

int main() {
    printf("Hello, World!\n");
    return 0;
}
```
````

## Current Notes

- **Math Module**: `math.md` - Comprehensive matrix algebra notes with LaTeX formulas
- **Operating Systems Module**: `c-programming.md` - Complete C programming lab guide with code examples
- **Database Module**: `getting-started.md` - Database getting started guide

## Technical Details

### Dependencies

- `react-markdown`: Markdown parser and renderer
- `remark-math`: Plugin for math syntax
- `remark-gfm`: GitHub Flavored Markdown (tables, strikethrough, etc.)
- `rehype-katex`: LaTeX rendering
- `rehype-raw`: HTML support in markdown
- `katex`: Math typesetting library

All dependencies are already installed in the project.

### Performance

- Markdown files are loaded dynamically using Vite's `import.meta.glob`
- Files are only loaded when accessed
- Build output shows proper code splitting for each note file
