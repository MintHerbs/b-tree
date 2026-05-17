# Visual Guide: How Your Notes Look Now

## Before vs After

### Before
- Plain text in monospace font
- No formatting
- No LaTeX rendering
- No table styling
- No code highlighting

### After
- **Beautiful typography** with proper font hierarchy
- **Rendered LaTeX formulas** with KaTeX
- **Styled tables** with borders and hover effects
- **Syntax-highlighted code blocks**
- **Centered, Obsidian-like layout**

## What Students Will See

### 1. Math Notes (Matrix Algebra)

**Headers:**
```
# MATRIX                    ← Large, bold, with bottom border
## Determinant              ← Medium, bold, with subtle border
### Example of Minors       ← Smaller, bold
```

**LaTeX Formulas:**

Inline math like `$a_{ij}$` renders as: aᵢⱼ

Display math like:
```
$$
\text{matrix } \mathbf{A} = \begin{bmatrix} a & b \\ c & d \end{bmatrix}
$$
```

Renders as a beautifully formatted matrix with proper spacing and alignment.

**Tables:**
```markdown
| Specifier | Type |
|-----------|------|
| `%d`      | int  |
| `%f`      | float|
```

Renders with:
- Dark background
- Bordered cells
- Header row highlighted
- Hover effect on rows

**Blockquotes:**
```markdown
> **Note:** The determinant is unique
```

Renders with:
- Blue left border
- Light blue background
- Italic text
- Bold emphasis for "Note:"

### 2. C Programming Notes

**Code Blocks:**
```c
#include <stdio.h>

int main() {
    printf("Hello, World!\n");
    return 0;
}
```

Renders with:
- Dark background (rgba(0, 0, 0, 0.4))
- Monospace font (Fira Code, Consolas, Monaco)
- Proper indentation preserved
- Scrollable if too wide
- Rounded corners

**Inline Code:**
Text like `scanf("%d", &age)` renders with:
- Light background
- Monospace font
- Salmon color (#ffa07a)
- Slightly smaller font size

## Layout Specifications

### Desktop View
- **Max width**: 800px
- **Centered**: Content is horizontally centered
- **Padding**: 2rem on all sides
- **Font size**: 16px base
- **Line height**: 1.7 for readability

### Mobile View (< 768px)
- **Padding**: 1rem (reduced)
- **Font size**: 15px (slightly smaller)
- **Headers**: Scaled down proportionally
- **Tables**: Horizontally scrollable
- **Code blocks**: Horizontally scrollable

## Color Scheme

### Text Colors
- **Main text**: #d0d0d0 (light gray)
- **Headers**: #ffffff (white)
- **Emphasis**: #f0f0f0 (bright gray)
- **Strong**: #ffffff (white, bold)
- **Links**: #6495ed (cornflower blue)
- **Inline code**: #ffa07a (light salmon)

### Background Colors
- **Code blocks**: rgba(0, 0, 0, 0.4)
- **Inline code**: rgba(255, 255, 255, 0.1)
- **Tables**: rgba(0, 0, 0, 0.3)
- **Table headers**: rgba(255, 255, 255, 0.05)
- **Blockquotes**: rgba(100, 150, 255, 0.05)

### Borders
- **H1**: 2px solid rgba(255, 255, 255, 0.1)
- **H2**: 1px solid rgba(255, 255, 255, 0.08)
- **Tables**: 1px solid rgba(255, 255, 255, 0.1)
- **Blockquotes**: 4px left border rgba(100, 150, 255, 0.5)

## Typography

### Font Families
- **Body text**: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', etc.
- **Code**: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace
- **Math**: KaTeX fonts (automatically loaded)

### Font Sizes
- **H1**: 2.5rem (40px)
- **H2**: 2rem (32px)
- **H3**: 1.5rem (24px)
- **Body**: 16px
- **Code**: 14px
- **Inline code**: 0.9em

### Font Weights
- **H1**: 700 (bold)
- **H2**: 600 (semi-bold)
- **H3**: 600 (semi-bold)
- **Strong**: 600 (semi-bold)
- **Body**: 400 (normal)

## Interactive Elements

### Hover Effects
- **Table rows**: Background changes to rgba(255, 255, 255, 0.03)
- **Links**: Bottom border appears
- **Scrollbars**: Thumb color lightens

### Scrollbars (Custom Styled)
- **Height**: 8px
- **Track**: rgba(0, 0, 0, 0.2)
- **Thumb**: rgba(255, 255, 255, 0.2)
- **Thumb hover**: rgba(255, 255, 255, 0.3)

## Accessibility

✅ **High contrast** between text and background
✅ **Readable font sizes** (minimum 14px for code)
✅ **Proper heading hierarchy** (H1 → H2 → H3)
✅ **Semantic HTML** (tables, lists, blockquotes)
✅ **Keyboard navigation** supported
✅ **Screen reader friendly** (proper alt text, semantic markup)

## Performance

- **Lazy loading**: Notes only load when accessed
- **Code splitting**: Each note is a separate chunk
- **Optimized fonts**: KaTeX fonts are cached
- **Minimal re-renders**: React.memo optimizations

## Browser Support

✅ Chrome/Edge (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Example Rendering

### Matrix Formula
```
$$
\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}
$$
```
Renders as a perfectly aligned 2×2 matrix with proper spacing.

### C Code
```c
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}
```
Renders with proper indentation, monospace font, and dark background.

### Table
```markdown
| Function | Description |
|----------|-------------|
| malloc() | Allocate memory |
| free()   | Release memory |
```
Renders with borders, header styling, and hover effects.

---

**Result**: Your notes now look professional, are easy to read, and properly display all mathematical formulas, code examples, and tables - just like in Obsidian! 🎉
