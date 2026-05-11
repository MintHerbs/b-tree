# Chat Architecture Diagram

## Component Hierarchy

```
App.jsx
├── [isChatOpen state]
└── ChatPanel (isOpen, onClose)
    ├── Backdrop (click to close)
    ├── Panel Container
    │   ├── Header
    │   │   ├── Title ("Chat")
    │   │   └── Close Button (X icon)
    │   ├── Messages Container (scrollable)
    │   │   ├── Empty State (if no messages)
    │   │   └── ChatBubble[] (for each message)
    │   │       ├── ChatAvatar (if agent message)
    │   │       │   └── AgentAvatar (seed: session_id)
    │   │       ├── Bubble
    │   │       │   ├── Content
    │   │       │   └── Timestamp
    │   │       └── User Avatar (if user message)
    │   └── ChatInput
    │       ├── Input Field
    │       └── Send Button (Send icon)
    └── useChat Hook
        ├── Fetch messages on mount
        ├── Subscribe to real-time inserts
        └── sendMessage function
```

## Data Flow

```
User Action → Component → Hook → Supabase → Real-time → All Clients

1. User types message
   ↓
2. ChatInput.onSend(content)
   ↓
3. useChat.sendMessage(content)
   ↓
4. Supabase INSERT into messages table
   ↓
5. Real-time subscription triggers
   ↓
6. All connected clients receive new message
   ↓
7. ChatBubble renders with message + avatar
```

## State Management

```
App.jsx
├── isChatOpen: boolean
│   └── Controls ChatPanel visibility
│
ChatPanel.jsx
├── Uses useChat hook
│   ├── messages: Message[]
│   ├── isLoading: boolean
│   └── sendMessage: (content: string) => void
│
└── messagesEndRef: RefObject
    └── Auto-scroll to bottom
```

## Message Object Structure

```typescript
interface Message {
  id: string              // UUID from Supabase
  session_id: string      // User identifier
  content: string         // Message text
  created_at: string      // ISO timestamp
}
```

## Real-time Subscription Flow

```
Component Mount
    ↓
useChat hook initializes
    ↓
Fetch last 50 messages
    ↓
Create Supabase channel
    ↓
Subscribe to INSERT events on 'messages' table
    ↓
[Real-time connection established]
    ↓
New message inserted anywhere
    ↓
Supabase broadcasts to all subscribers
    ↓
useChat receives payload.new
    ↓
setMessages(prev => [...prev, payload.new])
    ↓
ChatPanel re-renders with new message
    ↓
Auto-scroll to bottom
```

## Component Communication

```
TreePage.jsx
    ↓ (onChatOpen prop)
Navbar.jsx
    ↓ (onChatClick callback)
App.jsx
    ↓ (setIsChatOpen(true))
ChatPanel.jsx
    ↓ (isOpen prop)
[Panel slides in]
```

## Avatar Generation Flow

```
Message received with session_id
    ↓
ChatBubble determines if user or agent
    ↓
If agent message:
    ↓
ChatAvatar component
    ↓
AgentAvatar component
    ↓
hashSeed(session_id) → deterministic hash
    ↓
generatePalette(hash) → 3 HSL colors
    ↓
generateGrid(hash) → 6x6 cell metadata
    ↓
Canvas rendering with animations
    ↓
Unique animated avatar displayed
```

## Animation Timeline

```
Chat Button Click
    ↓
setIsChatOpen(true)
    ↓
<AnimatePresence> detects change
    ↓
Backdrop: opacity 0 → 1 (fade in)
Panel: x: 100% → 0 (slide in from right)
    ↓
Spring animation (stiffness: 300, damping: 30)
    ↓
[Chat panel fully visible]
    ↓
User clicks close or backdrop
    ↓
setIsChatOpen(false)
    ↓
Backdrop: opacity 1 → 0 (fade out)
Panel: x: 0 → 100% (slide out to right)
    ↓
<AnimatePresence> removes from DOM
```

## CSS Module Scoping

```
ChatPanel.module.css
├── .backdrop (fixed overlay)
├── .panel (slide-in container)
├── .header (title + close button)
├── .messagesContainer (scrollable area)
└── .emptyState (no messages)

ChatBubble.module.css
├── .bubbleContainer (flex layout)
├── .bubble (message box)
├── .content (message text)
├── .timestamp (time display)
└── .userAvatar (initials circle)

ChatInput.module.css
├── .inputForm (flex container)
├── .input (text field)
└── .sendButton (circular button)

ChatAvatar.module.css
└── .avatarWrapper (inline-block container)
```

## Supabase Integration

```
src/lib/supabaseClient.js
    ↓
Export centralized client
    ↓
src/hooks/useChat.js
    ↓
Import supabase client
    ↓
Use for queries and subscriptions
    ↓
    ├── supabase.from('messages').select()
    ├── supabase.from('messages').insert()
    └── supabase.channel('messages').on(...)
```

## Error Handling

```
useChat.sendMessage()
    ↓
try {
    Insert message
} catch (err) {
    console.error()
    ↓
    User sees loading state end
    ↓
    Message not sent
}
    ↓
finally {
    setIsLoading(false)
}
```

## Performance Optimizations

### Current
- Lazy loading of route components
- CSS Modules for scoped styles
- Real-time subscriptions (no polling)
- Auto-cleanup on unmount
- Limit to 50 messages on initial fetch

### Future Considerations
- Virtual scrolling for 1000+ messages
- Message pagination
- Debounced typing indicators
- Optimistic UI updates
- Connection status monitoring

## Browser Compatibility

```
Feature                 Support
─────────────────────────────────
Canvas API              ✅ All modern browsers
Framer Motion           ✅ All modern browsers
CSS Modules             ✅ All modern browsers
Supabase Realtime       ✅ WebSocket support required
localStorage            ✅ All modern browsers
prefers-reduced-motion  ✅ Modern browsers (graceful fallback)
```

## Security Considerations

### Current Implementation
- Uses Supabase anon key (safe for frontend)
- No authentication required
- Messages visible to all users
- session_id from localStorage (not secure)

### Production Recommendations
- Implement Row Level Security (RLS) in Supabase
- Add user authentication
- Validate session_id on backend
- Sanitize message content
- Rate limiting on message sends
- Content moderation

## Deployment Checklist

- [ ] Create `messages` table in Supabase
- [ ] Enable real-time on `messages` table
- [ ] Add indexes for performance
- [ ] Set up Row Level Security policies
- [ ] Configure CORS if needed
- [ ] Test real-time subscriptions
- [ ] Verify environment variables
- [ ] Test on production domain
- [ ] Monitor Supabase usage/quotas

## Monitoring & Debugging

### Browser Console
```javascript
// Check Supabase connection
console.log(supabase)

// Check session_id
console.log(localStorage.getItem('session_id'))

// Monitor real-time events
// (automatically logged by Supabase client)
```

### Supabase Dashboard
- Table Editor: View messages
- Realtime Inspector: Monitor subscriptions
- Logs: Check for errors
- API: Test queries manually

## Conclusion

This architecture provides:
- ✅ Clean separation of concerns
- ✅ Reusable components
- ✅ Scalable real-time infrastructure
- ✅ Maintainable code structure
- ✅ Excellent user experience
- ✅ Production-ready foundation
