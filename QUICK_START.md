# Quick Start Guide: Markdown Notes

## 🚀 Getting Started (30 seconds)

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Access Your Notes
- Open your browser to the app
- Click on **"Math"** or **"Operating Systems"** in the sidebar
- Click on the note you want to view
- Enjoy beautifully rendered notes! 🎉

---

## 📍 Where Are My Notes?

```
src/content/notes/
├── math/
│   └── math.md                    ← Matrix algebra notes
├── operating-system/
│   └── c-programming.md           ← C programming labs
└── database/
    └── getting-started.md         ← Database guide
```

---

## 🔗 Direct URLs

- **Math Notes:** `/notes/math/math.md`
- **C Programming:** `/notes/operating-system/c-programming.md`
- **Database:** `/notes/database/getting-started.md`

---

## ✨ What Works

✅ **LaTeX Formulas**
```markdown
Inline: $x^2 + y^2 = z^2$
Display: $$\int_{a}^{b} f(x) dx$$
```

✅ **Tables** (Obsidian-style with clear rows and columns)
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

✅ **Code Blocks** (with full syntax highlighting)
````markdown
```c
#include <stdio.h>
int main() {
    return 0;  // Keywords, strings, and comments are colored!
}
```
````

✅ **Headers, Lists, Blockquotes, Links, etc.**

---

## 📝 Adding a New Note (2 minutes)

### Step 1: Create the File
```bash
# Create in the appropriate module folder
# Use kebab-case (lowercase-with-hyphens)
src/content/notes/module-id/my-new-note.md
```

### Step 2: Update Sidebar
Edit `src/components/layout/Sidebar/modules.js`:

```javascript
{
  id: 'module-id',
  label: 'Module Name',
  Icon: SomeIcon,
  notes: [
    { filename: 'my-new-note.md', label: 'My New Note.md' },
  ],
}
```

### Step 3: Restart
```bash
# Stop server (Ctrl+C), then:
npm run dev
```

Done! Your note appears in the sidebar.

---

## 🐛 Troubleshooting

### Note Not Loading?
1. Check filename has no spaces (use `my-note.md` not `My Note.md`)
2. Verify filename in sidebar matches actual file
3. Restart dev server

### LaTeX Not Rendering?
- Check syntax: `$...$` for inline, `$$...$$` for display
- Ensure no typos in LaTeX commands

### Table Not Styled?
- Verify you have the separator row: `|----------|----------|`
- Check all rows have same number of columns

### Code Not Formatted?
- Use triple backticks: ` ```language `
- Close with triple backticks: ` ``` `

---

## 📚 Full Documentation

- **Setup Guide:** `docs/markdown-notes-setup.md`
- **Visual Guide:** `docs/NOTES_VISUAL_GUIDE.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING.md`
- **Full Status:** `FINAL_STATUS_REPORT.md`

---

## ✅ Current Status

**Everything is working!**
- ✅ Math notes load correctly
- ✅ C Programming notes load correctly
- ✅ LaTeX formulas render
- ✅ Tables display properly
- ✅ Code blocks format correctly
- ✅ Content is centered
- ✅ Responsive design works

**Ready to use!** 🎉

---

## 🎯 File Naming Rules

✅ **Good:**
- `my-note.md`
- `chapter-1.md`
- `lab-guide.md`

❌ **Bad:**
- `My Note.md` (spaces)
- `Chapter#1.md` (special chars)
- `LAB_GUIDE.md` (all caps, underscore)

**Rule:** Use lowercase letters, numbers, and hyphens only.

---

## 💡 Tips

1. **Write in Obsidian** - Your notes will look similar in the app
2. **Use LaTeX** - Full KaTeX support for math
3. **Add tables** - They render beautifully
4. **Include code** - Syntax is preserved
5. **Keep filenames simple** - Use kebab-case

---

## 🆘 Need Help?

1. Check browser console (F12)
2. Check terminal where `npm run dev` is running
3. Read `docs/TROUBLESHOOTING.md`
4. Verify file paths are correct

---

**That's it! You're ready to go!** 🚀
