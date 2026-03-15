# Demo Tour Mobile Drawer Auto-Close (Phase 2)

## Goal
When the phase 2 mobile tour advances to the chat-input step, automatically close any open drawer so the chat section and input are visible. The drawers must remain closed afterward.

## Scope
- Target: `frontend/ui/demo/DemoTour.tsx`
- Behavior: on mobile, phase 2, Joyride tooltip step index 1 (chat-input), close server, section, and profile drawers.

## Approach Options Considered
1. Close all drawers when the chat-input tooltip appears (recommended).
2. Close all drawers at the start of phase 2 on mobile.
3. Force drawers closed for the entire phase 2 mobile tour.

Chosen: Option 1 for minimal change and precise timing.

## Architecture
Keep logic inside `DemoTour.tsx` by calling drawer-close actions from the existing Joyride callback. No new props or context changes.

## Components & Interfaces
- Use `useLayoutContext()` in `DemoTour.tsx` to access:
  - `closeServerDrawer`
  - `closeSectionSidebar`
  - `closeProfileDrawer`

## Data Flow / Timing
- On Joyride callback:
  - If `tourState.phase === 2`, `isMobile === true`, `type === EVENTS.TOOLTIP`, and `index === 1`, call the three close functions.
- This ensures drawers are closed when the chat-input tooltip is displayed and remain closed afterward.

## Error Handling / Edge Cases
- Close functions are no-ops if already closed.
- No new error paths introduced.

## Testing
- Add or update a unit test for `DemoTour` on mobile phase 2 to assert that all three close functions are called when the chat-input tooltip appears (step index 1).
- If no existing `DemoTour` test harness exists, mock layout context and invoke the callback with a Joyride event payload.
