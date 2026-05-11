# Tailwind CSS v4 Migration Fix

## Problem
Getting PostCSS error: "It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin"

## Root Cause
Tailwind CSS v4 changed both:
1. **PostCSS plugin package**: Moved from `tailwindcss` to `@tailwindcss/postcss`
2. **CSS import syntax**: Changed from `@tailwind` directives to `@import` with layers

## Solution Applied

### 1. PostCSS Configuration (`postcss.config.js`)
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},  // ← New v4 plugin
    autoprefixer: {},
  },
}
```

### 2. CSS Import Syntax (`src/styles/global.css`)
**Old (v3):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**New (v4):**
```css
@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/preflight" layer(base);
@import "tailwindcss/utilities" layer(utilities);
```

### 3. Package Dependencies
```json
{
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.4",
    "tailwindcss": "^4.2.4"
  }
}
```

## How to Apply
1. Stop dev server (Ctrl+C)
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Restart dev server: `npm run dev`

## Verification
- ✅ Build works: `npm run build` (4.13s, no errors)
- ✅ Dev server works without PostCSS errors
- ✅ All Tailwind utilities available

## References
- Tailwind CSS v4 Beta: https://tailwindcss.com/docs/v4-beta
- PostCSS Plugin: https://github.com/tailwindlabs/tailwindcss-postcss
