# Chat Feature Implementation

## Overview

A real-time chat system has been successfully implemented using Supabase for backend storage and real-time subscriptions. The chat panel slides in from the right side of the screen and displays messages with animated avatars.

## Architecture

### Components

```
src/components/chat/
├── ChatPanel/
│   ├── ChatPanel.jsx          ← Full chat UI overlay with backdrop
│   └── ChatPanel.module.css
├── ChatBubble/
│   ├── ChatBubble.jsx         ← Single message bubble with avatar
│   └── ChatBubble.module.css
├── ChatInput/
│   ├── ChatInput.jsx          ← Pill-style input with send button
│   └── ChatInput.module.css
├── ChatAvatar/
│   ├── ChatAvatar.jsx         ← Wrapper around AgentAvatar
│   └── ChatAvatar.module.css
└── index.js                   ← Clean exports
```

### Hooks

**`src/hooks/useChat.js`**
- Manages chat state using Supabase
- Fetches last 50 messages on mount
- Subscribes to real-time message inserts
- Exposes: `{ messages, sendMessage, isLoading }`

### AgentAvatar Component

**Location:** `src/components/smoothui/agent-avatar/index.jsx`

The AgentAvatar component generates unique, deterministic avatar patterns from a seed string (session_id). Features:
- Canvas-based rendering with 6x6 pixel grid
- Animated breathing, pulsing, and sparkle effects
- Respects `prefers-reduced-motion`
- No Tailwind dependencies (uses inline styles)

## Database Schema

### Required Supabase Table: `messages`

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Add index for performance
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

### Message Object Shape

```javascript
{
  id: 'uuid',
  session_id: 'string',
  content: 'string',
  created_at: 'timestamp'
}
```

## Integration

### 1. App.jsx

```javascript
import { ChatPanel } from './components/chat'

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  
  return (
    <>
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <Routes>
        <Route path="/tree" element={<TreePage onChatOpen={() => setIsChatOpen(true)} />} />
      </Routes>
    </>
  )
}
```

### 2. Navbar.jsx

```javascript
import { MessageCircle } from 'lucide-react'

function Navbar({ onChatClick }) {
  return (
    <nav>
      <button onClick={onChatClick}>
        <MessageCircle size={18} />
      </button>
    </nav>
  )
}
```

### 3. Page Components

```javascript
function TreePage({ onChatOpen }) {
  return <Navbar onChatClick={onChatOpen} />
}
```

## Features

### Real-time Messaging
- Messages appear instantly for all connected users
- Automatic scroll to bottom on new messages
- Loading state during message send

### User Experience
- Slide-in animation from right (spring physics)
- Backdrop overlay with click-to-close
- Distinct styling for user vs. agent messages
- Timestamps in local time format
- Empty state when no messages exist

### Accessibility
- ARIA labels on buttons
- Keyboard navigation support
- Reduced motion support in AgentAvatar

### Responsive Design
- Panel width: 400px (max 90vw on mobile)
- Scrollable message container
- Custom scrollbar styling

## Styling

### Color Tokens Used
- `--color-bg`: Panel background
- `--color-surface`: Header and input background
- `--color-border`: Borders and dividers
- `--color-accent`: User messages and buttons
- `--color-muted`: Inactive states and timestamps

### Chat Button
- 36px circular button
- Purple border matching accent color
- Hover scale effect
- Located in Navbar next to About/Disclaimer links

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Session Management

The chat uses `session_id` from localStorage to identify users:
```javascript
const sessionId = localStorage.getItem('session_id')
```

**Note:** Ensure session_id is set elsewhere in the app (e.g., in `usePresence` hook).

## Real-time Subscription

The `useChat` hook automatically:
1. Fetches initial messages on mount
2. Subscribes to new message inserts
3. Unsubscribes on unmount
4. Handles errors gracefully

```javascript
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    setMessages(prev => [...prev, payload.new])
  })
  .subscribe()
```

## Future Enhancements

### Potential Features
- [ ] Message editing and deletion
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Message reactions
- [ ] File attachments
- [ ] User presence indicators
- [ ] Message search
- [ ] Pagination for older messages
- [ ] Markdown support
- [ ] Code syntax highlighting

### Performance Optimizations
- [ ] Virtual scrolling for large message lists
- [ ] Message batching
- [ ] Optimistic UI updates
- [ ] Connection status indicator

## Testing

### Manual Testing Checklist
- [ ] Open chat panel from navbar
- [ ] Send a message
- [ ] Verify message appears in real-time
- [ ] Check avatar renders correctly
- [ ] Test close button and backdrop click
- [ ] Verify scroll behavior
- [ ] Test on mobile viewport
- [ ] Check reduced motion preference

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Troubleshooting

### Messages not appearing
1. Check Supabase connection in browser console
2. Verify `messages` table exists
3. Ensure real-time is enabled on table
4. Check `session_id` exists in localStorage

### Avatar not rendering
1. Verify `session_id` is a valid string
2. Check browser console for canvas errors
3. Ensure AgentAvatar component is imported correctly

### Build errors
1. Run `npm install` to ensure all dependencies are installed
2. Check for TypeScript/JSX syntax errors
3. Verify all imports are correct

## Dependencies

### New Dependencies
- None! Uses existing dependencies:
  - `@supabase/supabase-js` (already installed)
  - `lucide-react` (already installed)
  - `motion/react` (already installed)

### Component Library
- AgentAvatar from SmoothUI (installed via `npx smoothui-cli add agent-avatar`)

## File Changes Summary

### New Files Created
- `src/components/chat/ChatPanel/ChatPanel.jsx`
- `src/components/chat/ChatPanel/ChatPanel.module.css`
- `src/components/chat/ChatBubble/ChatBubble.jsx`
- `src/components/chat/ChatBubble/ChatBubble.module.css`
- `src/components/chat/ChatInput/ChatInput.jsx`
- `src/components/chat/ChatInput/ChatInput.module.css`
- `src/components/chat/ChatAvatar/ChatAvatar.jsx`
- `src/components/chat/ChatAvatar/ChatAvatar.module.css`
- `src/components/chat/index.js`
- `src/hooks/useChat.js`
- `src/lib/supabaseClient.js`
- `src/components/smoothui/agent-avatar/index.jsx`

### Modified Files
- `src/App.jsx` - Added ChatPanel and state management
- `src/components/Navbar/Navbar.jsx` - Added chat button
- `src/components/Navbar/Navbar.module.css` - Added chat button styles
- `src/pages/TreePage.jsx` - Added onChatOpen prop

## Design Compliance

This implementation follows all project rules from `RULES.md`:
- ✅ Component folder structure (ComponentName/ComponentName.jsx + .module.css)
- ✅ CSS Modules for all styling
- ✅ Proper prop naming (isOpen, onClose, onSend)
- ✅ Descriptive class names
- ✅ Motion/react for animations
- ✅ Accessibility considerations
- ✅ File header comments
- ✅ Consistent code organization

## Color Palette Compliance

From `design.md`:
- ✅ Uses `--color-accent` (#8B5CF6) for user messages and buttons
- ✅ Uses `--color-bg` (#000000) for panel background
- ✅ Uses `--color-surface` (#0f0f0f) for input/header
- ✅ Uses `--color-border` (#222222) for borders
- ✅ Uses `--color-muted` (#555555) for timestamps

## Conclusion

The chat feature is fully implemented and ready for use. It integrates seamlessly with the existing design system and follows all project coding standards. The real-time functionality provides a smooth user experience, and the animated avatars add a unique visual touch.
