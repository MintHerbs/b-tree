// Single source of truth for all color tokens used across the app
export const colors = {
  // Brand
  accent:        '#8B5CF6',   // primary purple
  orange:        '#EA6C0A',   // secondary orange
  bg:            '#000000',
  surface:       '#0f0f0f',
  card:          '#0a0a0a',
  panel:         '#1a1a2e',
  border:        '#222222',
  text:          '#ffffff',
  textMuted:     'rgba(255,255,255,0.6)',
  error:         '#ef4444',
  warning:       '#facc15',
  success:       '#22c55e',

  // Sidebar icon states
  iconOff:       'rgba(255,255,255,0.38)',  // inactive — subtle on black
  iconHover:     'rgba(255,255,255,0.75)',  // hover — visible but not full
  iconActive:    '#8B5CF6',                 // active — accent purple
  iconActiveAlt: '#EA6C0A',                 // active alt — orange for external tools
}
