# Social Components Library

A collection of beautifully animated, reusable UI components for the social feed feature.

## 🎨 Components

### Alert
Animated alert/notification component for displaying important messages.

**Props:**
- `type`: 'error' | 'success' | 'info' | 'warning' (default: 'info')
- `title`: string (optional)
- `message`: string
- `onClose`: function (optional)
- `className`: string (optional)

**Example:**
```jsx
import Alert from '@/components/social/Alert/Alert'

<Alert 
  type="error" 
  title="Post Failed"
  message="Unable to create post. Please try again."
  onClose={() => setError(null)}
/>
```

---

### Callout
Eye-catching callout component for highlighting important information.

**Props:**
- `variant`: 'tip' | 'highlight' | 'important' | 'note' (default: 'tip')
- `title`: string (optional)
- `children`: ReactNode
- `icon`: LucideIcon (optional, overrides default)
- `className`: string (optional)

**Example:**
```jsx
import Callout from '@/components/social/Callout/Callout'
import { Lightbulb } from 'lucide-react'

<Callout variant="tip" title="Pro Tip" icon={Lightbulb}>
  Use code attachments to share snippets with syntax highlighting!
</Callout>
```

---

### Toast
Temporary notification that appears and auto-dismisses.

**Props:**
- `type`: 'success' | 'error' | 'info' | 'warning' (default: 'info')
- `message`: string
- `onClose`: function (optional)
- `duration`: number in ms (default: 5000, 0 = no auto-dismiss)
- `position`: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

**Example:**
```jsx
import { ToastContainer } from '@/components/social/Toast/Toast'
import { useToast } from '@/hooks/useToast'

function MyComponent() {
  const { toasts, success, error, removeToast } = useToast()

  const handleSuccess = () => {
    success('Post created successfully!')
  }

  return (
    <>
      <button onClick={handleSuccess}>Create Post</button>
      <ToastContainer 
        toasts={toasts} 
        onRemove={removeToast}
        position="top-right"
      />
    </>
  )
}
```

---

### Badge
Small label for counts, status, or categories.

**Props:**
- `children`: ReactNode
- `variant`: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' | 'purple'
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `pulse`: boolean (default: false)
- `className`: string (optional)

**Example:**
```jsx
import Badge, { DotBadge } from '@/components/social/Badge/Badge'

<Badge variant="success" size="sm">New</Badge>
<Badge variant="primary" pulse>3</Badge>
<DotBadge variant="error" pulse />
```

---

## 🎯 Animation Patterns

### Entrance Animations
All components use consistent entrance animations:
- **Fade + Slide**: Opacity 0→1 with vertical movement
- **Scale**: Scale 0.95→1.0 for subtle pop-in
- **Spring**: Natural, bouncy motion using spring physics

### Interaction Animations
- **Hover Scale**: 1.0→1.05 for buttons and interactive elements
- **Tap Scale**: 1.0→0.95 for press feedback
- **Ripple**: Material Design-style ripple effect on primary actions
- **Color Transitions**: Smooth color changes for state feedback

### Exit Animations
- **Fade Out**: Opacity 1→0
- **Scale Down**: Scale 1.0→0.9
- **Slide Out**: Movement in exit direction

---

## 🎨 Color System

### Variants
- **Primary**: Orange (#EA6C0A, #fb923c)
- **Success**: Green (#22c55e, #86efac)
- **Error**: Red (#ef4444, #fca5a5)
- **Warning**: Orange (#fb923c, #fdba74)
- **Info**: Blue (#3b82f6, #93c5fd)
- **Purple**: Purple (#8b5cf6, #c4b5fd)

### Usage Guidelines
- **Success**: Confirmations, completed actions
- **Error**: Failures, validation errors
- **Warning**: Cautions, important notices
- **Info**: General information, tips
- **Primary**: Brand actions, CTAs
- **Purple**: Special features, highlights

---

## 🚀 Performance

All components are optimized for performance:
- **GPU Acceleration**: Transform and opacity animations
- **Layout Animations**: Automatic with Framer Motion
- **Lazy Rendering**: AnimatePresence for conditional content
- **Minimal Re-renders**: Memoized callbacks and values

---

## 📱 Responsive Design

Components are fully responsive:
- **Mobile-First**: Touch-friendly tap targets
- **Breakpoints**: Adaptive sizing for different screens
- **Flexible Layouts**: Flexbox-based responsive layouts

---

## ♿ Accessibility

Components follow accessibility best practices:
- **Semantic HTML**: Proper element usage
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard support
- **Focus States**: Clear focus indicators
- **Color Contrast**: WCAG AA compliant

**Note**: Add `prefers-reduced-motion` support for users who prefer reduced animations.

---

## 🎓 Best Practices

### When to Use Each Component

**Alert**
- Form validation errors
- Action confirmations
- Important warnings
- Persistent notifications

**Callout**
- Tips and hints
- Feature highlights
- Important information blocks
- Educational content

**Toast**
- Success confirmations
- Temporary notifications
- Background process updates
- Non-critical alerts

**Badge**
- Counts (unread, new items)
- Status indicators
- Category labels
- Small metadata

---

## 🔧 Customization

All components support custom styling via `className` prop:

```jsx
<Alert 
  type="error"
  message="Custom styled alert"
  className="my-custom-class"
/>
```

CSS Modules are used for styling, making it easy to override:

```css
/* MyComponent.module.css */
.customAlert {
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
```

---

## 📦 Dependencies

- **motion/react**: Animation library
- **lucide-react**: Icon library
- **React**: 18+

---

## 🎉 Examples

### Complete Toast System
```jsx
import { ToastContainer } from '@/components/social/Toast/Toast'
import { useToast } from '@/hooks/useToast'

function App() {
  const { toasts, success, error, info, warning, removeToast } = useToast()

  const handleAction = async () => {
    try {
      info('Processing...')
      await someAsyncAction()
      success('Action completed!')
    } catch (err) {
      error('Action failed: ' + err.message)
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

### Alert with Auto-Dismiss
```jsx
import { useState, useEffect } from 'react'
import Alert from '@/components/social/Alert/Alert'

function FormWithAlert() {
  const [error, setError] = useState(null)

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <>
      {error && (
        <Alert 
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      <form onSubmit={handleSubmit}>
        {/* form fields */}
      </form>
    </>
  )
}
```

### Callout Variations
```jsx
import Callout from '@/components/social/Callout/Callout'
import { Lightbulb, Sparkles, Zap, Heart } from 'lucide-react'

<Callout variant="tip" icon={Lightbulb}>
  This is a helpful tip for users!
</Callout>

<Callout variant="highlight" icon={Sparkles}>
  Check out this amazing new feature!
</Callout>

<Callout variant="important" icon={Zap}>
  This requires your immediate attention.
</Callout>

<Callout variant="note" icon={Heart}>
  A friendly note from the team.
</Callout>
```

---

## 🐛 Troubleshooting

### Animations Not Working
- Ensure `motion/react` is installed
- Check that parent components don't have `overflow: hidden`
- Verify AnimatePresence is used for conditional rendering

### Styling Issues
- Check CSS Module imports
- Verify className prop is passed correctly
- Inspect browser DevTools for style conflicts

### Performance Issues
- Limit number of simultaneous toasts (max 3-5)
- Use `will-change` sparingly
- Consider reducing animation duration for slower devices

---

## 📚 Further Reading

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [CSS Modules](https://github.com/css-modules/css-modules)
- [React Animation Best Practices](https://www.framer.com/motion/animation/)
