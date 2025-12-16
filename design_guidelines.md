# Design Guidelines: WhatsApp Bot QR Authentication Tool

## Design Approach
**Selected Approach:** Design System - Material Design  
**Justification:** This is a technical utility tool requiring clarity, immediate functionality, and clear status feedback. Material Design's elevation system and feedback patterns are ideal for conveying system states (disconnected, connecting, connected).

## Core Design Principles
1. **Functional Clarity:** Every element serves a clear technical purpose
2. **Status Transparency:** Connection state should be immediately visible
3. **Centered Focus:** Single-purpose interface, minimal distractions
4. **RTL Support:** Proper Arabic text direction throughout

## Layout System

**Container Strategy:**
- Single-page centered layout: `max-w-md mx-auto` for main content
- Vertical stacking: All elements flow top-to-bottom
- Consistent padding: `p-4` mobile, `p-8` desktop
- Vertical spacing: Use `gap-6` for element separation

**Spacing Scale:**
Primary units: `2, 4, 6, 8` (e.g., `p-4`, `gap-6`, `mt-8`)

## Typography

**Font Family:**
- Primary: 'Cairo' from Google Fonts (excellent Arabic support)
- Fallback: system-ui

**Hierarchy:**
- Page Title: `text-2xl font-bold` - "WhatsApp Bot Authentication"
- Status Messages: `text-base font-medium`
- Helper Text: `text-sm`
- Technical Details: `text-xs font-mono` (for session info)

## Component Library

### Primary Action Button
- Large, prominent CTA: `px-8 py-4 text-lg font-semibold rounded-lg`
- Full width on mobile: `w-full sm:w-auto`
- Icon + Text combination
- Disabled state when connection active

### QR Code Display Area
- Container: `border-2 rounded-xl p-8 bg-white`
- Centered content: `flex items-center justify-center`
- Fixed aspect ratio: `aspect-square max-w-sm mx-auto`
- Elevation: `shadow-lg` when QR is displayed
- Empty state: Dashed border with placeholder text

### Status Indicator
- Compact badge at top: `inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm`
- Icon (dot) + Status text
- States: Disconnected, Generating QR, Waiting for Scan, Connected
- Positioned: `mb-6` above main content

### Connection Info Card (when connected)
- Success message card: `border rounded-lg p-4`
- Small icon + confirmation text
- Session details in monospace font
- Disconnect button: Secondary style `px-4 py-2 text-sm`

### Loading States
- Spinner during QR generation: Material Design circular progress
- Pulse animation on QR code while waiting for scan
- Skeleton placeholder for QR area

## Page Structure

**Single-Page Layout:**
```
1. Header (minimal)
   - App title centered
   - Status indicator badge

2. Main Content Area (centered card)
   - Status-dependent content:
     * Initial: Button to generate QR
     * Loading: Spinner + "Generating QR..."
     * QR Ready: Display QR + instruction text
     * Connected: Success message + session info
   
3. Footer (minimal)
   - Technical note about Baileys library
   - Version/status info if needed
```

**Responsive Behavior:**
- Mobile (base): Single column, full-width button, padding `p-4`
- Desktop (sm+): Constrained width `max-w-md`, centered, padding `p-8`

## Interaction Patterns

**Primary Flow:**
1. User clicks "إضافة رقم" button
2. Button becomes disabled, shows loading state
3. QR code appears with instruction text: "امسح الرمز باستخدام WhatsApp"
4. QR pulses subtly while waiting
5. On successful scan: QR disappears, success message appears
6. Show session info + disconnect option

**Error Handling:**
- Error messages: `border rounded-lg p-4` with alert icon
- Retry button: Secondary style
- Clear error description in Arabic

## Animations

**Minimal Animation Strategy:**
- QR code fade-in: 300ms ease-in
- Status transitions: 200ms
- Button loading spinner only
- NO scroll animations, NO parallax, NO complex transitions

## Accessibility

- RTL layout support for Arabic interface
- Clear focus states on all interactive elements
- ARIA labels for status changes
- Keyboard navigation support
- Screen reader announcements for connection state changes

## Technical Considerations

**Real-time Updates:**
- WebSocket connection status indicator
- Live QR code updates if regenerated
- Session persistence indicator

**Visual Feedback:**
- Clear differentiation between states
- No ambiguity about connection status
- Immediate response to user actions

This is a single-purpose utility - every design decision prioritizes clarity and functionality over decoration.