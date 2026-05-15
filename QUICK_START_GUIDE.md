# 🚀 Quick Start Guide - New Social UI Components

## 📦 What's Available

You now have 4 new reusable components + 1 custom hook:

1. **Alert** - For errors, warnings, success messages
2. **Callout** - For tips, highlights, important info
3. **Toast** - For temporary notifications
4. **Badge** - For counts, status indicators
5. **useToast** - Hook for managing toasts

---

## ⚡ Quick Examples

### 1. Show an Error Alert

```jsx
import Alert from '@/components/social/Alert/Alert'

<Alert 
  type="error" 
  title="Oops!"
  message="Something went wrong. Please try again."
  onClose={() => setError(null)}
/>
```

**Variants:** `error`, `success`, `info`, `warning`

---

### 2. Add a Helpful Tip

```jsx
import Callout from '@/components/social/Callout/Callout'

<Callout variant="tip" title="Pro Tip">
  Use polls to get quick feedback from your classmates!
</Callout>
```

**Variants:** `tip`, `highlight`, `important`, `note`

---

### 3. Show Toast Notifications

```jsx
import { ToastContainer } from '@/components/social/Toast/Toast'
import { useToast } from '@/hooks/useToast'

function MyComponent() {
  const { toasts, success, error, info, warning, removeToast } = useToast()

  const handleAction = async () => {
    try {
      await doSomething()
      success('Action completed!')
    } catch (err) {
      error('Action failed!')
    }
  }

  return (
    <>
      <button onClick={handleAction}>Do Something</button>
      <ToastContainer 
        toasts={toasts} 
        onRemove={removeToast}
        position="top-right"
      />
    </>
  )
}
```

**Positions:** `top-right`, `top-left`, `bottom-right`, `bottom-left`, `top-center`, `bottom-center`

---

### 4. Add Badges

```jsx
import Badge, { DotBadge } from '@/components/social/Badge/Badge'

// Count badge
<Badge variant="primary" pulse>5</Badge>

// Status badge
<Badge variant="success" size="sm">New</Badge>

// Dot indicator
<DotBadge variant="error" pulse />
```

**Variants:** `default`, `primary`, `success`, `error`, `warning`, `info`, `purple`  
**Sizes:** `sm`, `md`, `lg`

---

## 🎨 Color Guide

| Variant | When to Use |
|---------|-------------|
| **success** | ✅ Confirmations, completed actions |
| **error** | ❌ Failures, validation errors |
| **warning** | ⚠️ Cautions, important notices |
| **info** | ℹ️ General information, tips |
| **primary** | 🎯 Brand actions, CTAs |
| **purple** | ✨ Special features, highlights |

---

## 🎯 Common Patterns

### Form Validation
```jsx
const [error, setError] = useState(null)

{error && (
  <Alert 
    type="error"
    message={error}
    onClose={() => setError(null)}
  />
)}
```

### Success Feedback
```jsx
const { success } = useToast()

const handleSubmit = async () => {
  await saveData()
  success('Saved successfully!')
}
```

### Important Information
```jsx
<Callout variant="important" title="Attention">
  This action cannot be undone.
</Callout>
```

### Status Indicators
```jsx
<Badge variant="success" size="sm">Active</Badge>
<Badge variant="error" size="sm">Offline</Badge>
```

---

## 📱 All Component Props

### Alert
```typescript
type: 'error' | 'success' | 'info' | 'warning'
title?: string
message: string
onClose?: () => void
className?: string
```

### Callout
```typescript
variant: 'tip' | 'highlight' | 'important' | 'note'
title?: string
children: ReactNode
icon?: LucideIcon
className?: string
```

### Toast
```typescript
type: 'success' | 'error' | 'info' | 'warning'
message: string
onClose?: () => void
duration?: number  // milliseconds, 0 = no auto-dismiss
position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
```

### Badge
```typescript
children: ReactNode
variant?: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' | 'purple'
size?: 'sm' | 'md' | 'lg'
pulse?: boolean
className?: string
```

### useToast Hook
```typescript
const {
  toasts,           // Array of active toasts
  addToast,         // (message, type, duration) => id
  removeToast,      // (id) => void
  success,          // (message, duration?) => id
  error,            // (message, duration?) => id
  info,             // (message, duration?) => id
  warning,          // (message, duration?) => id
} = useToast()
```

---

## 🎬 Animation Features

All components include:
- ✨ Smooth entrance animations
- 🎯 Hover effects
- 💫 Exit animations
- 🎨 Color transitions
- ⚡ Spring physics

---

## 💡 Tips

1. **Toasts** are best for temporary, non-critical notifications
2. **Alerts** are best for important, persistent messages
3. **Callouts** are best for educational content and tips
4. **Badges** are best for counts and status indicators

5. Use `pulse` prop on badges for attention-grabbing indicators
6. Toast duration of `0` means it won't auto-dismiss
7. All components support custom `className` for styling
8. Components are fully responsive and mobile-friendly

---

## 📚 Full Documentation

For complete documentation, see:
- **Component Details**: `src/components/social/README.md`
- **UI Improvements**: `docs/social-ui-improvements.md`
- **Full Summary**: `SOCIAL_UI_UPGRADE_SUMMARY.md`

---

## 🎉 That's It!

You're ready to use the new components. They're already integrated into the social feed, so you can see them in action there.

**Happy coding! 🚀**
