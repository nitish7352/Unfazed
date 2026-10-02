# Unfazed Premium UI Redesign — Implementation Plan

## Current State Summary

### Project Setup
- **Framework**: React 19 + Vite 8 + React Router v7
- **CSS**: Tailwind CSS v4 (`@tailwindcss/vite` plugin, no `tailwind.config.js`). 
  In Tailwind v4, all configuration lives in CSS (`@theme`, `@layer`, `@custom-variant`). There is **no** `tailwind.config.js` to create or modify.
- **Other libs**: Recharts, TipTap, socket.io-client, react-hook-form, date-fns, react-big-calendar
- **Dev server**: port 5173, proxied to backend at 5000

### File-by-File Current State

| File | Current approach | Notes |
|------|-----------------|-------|
| `index.css` | Has `@import "tailwindcss"`, a handful of `:root` CSS variables, scrollbar styles, TipTap and react-big-calendar overrides | Variables use old names (`--color-primary`, no `--primary`) |
| `App.jsx` | Router + provider tree, no styling | **DO NOT TOUCH** (routes, providers) |
| `AppLayout.jsx` | `flex h-screen`, sidebar + main area, mobile overlay; `p-4 md:p-6` main padding | Needs deeper nav indigo background, better transitions |
| `Sidebar.jsx` | `w-64`/`w-16` collapsible; emoji icons; user footer with logout | Emoji icons need replacing with SVG icons; brand needs refinement |
| `Topbar.jsx` | `h-16 bg-white border-b`; notification bell dropdown; page title | Needs polish, subtle shadow, user avatar |
| `Button.jsx` | Variants: primary/secondary/danger/ghost/outline; sizes sm/md/lg | Needs `--primary` color token, `transition-all`, improved hover states |
| `Input.jsx` | Simple label + input + error; `focus:ring-indigo-500` | Needs `py-2.5`, consistent token reference, better focus style |
| `Badge.jsx` | `statusColor()` export + `Badge` component; rounded-full | Mostly fine; minor token alignment |
| `Modal.jsx` | Portal; backdrop-blur; rounded-xl; scroll body | Needs entrance animation, larger radius (20px), footer slot |
| `Avatar.jsx` | img with fallback to initials; `ring-2 ring-white` | Mostly fine; ensure indigo initials match design system |
| `Spinner.jsx` | Animated border spinner; sizes sm/md/lg | Needs border-color token reference |
| `Toast.jsx` | Provider with `addToast`; `animate-slide-up` (custom class not defined) | Needs `@keyframes` for slide-up defined in CSS; icon polish |
| `ErrorBoundary.jsx` | Class component; basic error UI | Needs visual upgrade to match design system |
| `ProtectedRoute.jsx` | Loading spinner fullscreen | Minor visual polish |
| `LoginPage.jsx` | `bg-gradient-to-br from-indigo-50` centered card | Add right-side decorative panel on desktop, improve spacing |
| `RegisterPage.jsx` | Same pattern as Login | Same changes |
| `DashboardPage.jsx` | `StatCard` inline component; upcoming sessions list | Add icons to StatCards, quick actions strip, better spacing |
| `ClientsPage.jsx` | Table with search/filter; modal for add/edit | Needs search bar upgrade, better table head, empty state icon |
| `ClientDetailPage.jsx` | `max-w-4xl` layout, info cards, breadcrumb | Already well-structured; add tab navigation for sessions/notes/invoices |
| `SessionsPage.jsx` | Table + modal | Same table upgrades as clients |
| `SessionDetailPage.jsx` | `max-w-3xl`; dl grid for metadata | Good structure; needs visual refinement |
| `CalendarPage.jsx` | react-big-calendar with legend | Calendar CSS override needs new color tokens |
| `NotesPage.jsx` | Card list with avatar | Mostly good; empty state needs icon |
| `NoteEditorPage.jsx` | SOAP/DAP/free/progress tabs; TipTap | MenuBar needs icon buttons; overall layout needs header refinement |
| `BillingPage.jsx` | Table + 2-card summary | Same table upgrades; summary cards need icons |
| `AnalyticsPage.jsx` | Grid + 3 Recharts; UpgradeCard inline | Color tokens for charts; stat cards need icons |
| `SettingsPage.jsx` | Tab UI: Profile/Security/Availability/Subscription | Tabs need active indicator refinement; forms already use Input/Button |
| `SubscriptionPage.jsx` | Plan grid; Razorpay logic | Visual upgrade of plan cards; **do not touch** Razorpay logic |
| `ChatPage.jsx` | Left sidebar (client list) + chat area | Needs responsive handling, polish chat bubbles, improved empty state |
| `SessionForm.jsx` | react-hook-form; select + Input | Minor styling on selects; consistent with Input component |
| `ClientForm.jsx` | react-hook-form; consistent Input use | Minor styling on selects |
| `InvoiceForm.jsx` | react-hook-form; line items; subtotal summary | Line item inputs need consistent styling |

---

## Critical Constraints (Immutable)

The following MUST NOT be changed under any circumstances:

- All function signatures and default exports in every file listed
- All imports (except adding/changing CSS classes — no new dependencies)
- `App.jsx` — routes, providers, imports
- `AuthContext.jsx`, `NotificationContext.jsx`, `axios.js` — DO NOT TOUCH
- Razorpay logic in `BillingPage.jsx` and `SubscriptionPage.jsx`
- Socket.IO logic in `ChatPage.jsx` and any hooks
- API call structure in all pages
- `react-hook-form` `register`, `handleSubmit`, `watch` wiring
- `Badge.statusColor` export — used by many pages
- `useToast` hook signature from `Toast.jsx`
- `ToastProvider` export from `Toast.jsx`

---

## Tailwind v4 Notes

Tailwind v4 uses `@tailwindcss/vite` (confirmed in `vite.config.js`). There is **no** `tailwind.config.js`. Configuration is done entirely inside CSS:

- Custom color tokens → `@theme { --color-*: value; }` block in `index.css`
- Custom animations → `@keyframes` in `index.css`
- Tailwind v4 supports `border-3` and fractional utilities natively
- CSS variables defined in `:root` are available in Tailwind classes as arbitrary values: `bg-[var(--primary)]`
- For Tailwind theme tokens (so `bg-primary` works without arbitrary syntax), use `@theme { --color-primary: #value; }` — this registers them as Tailwind color utilities

---

## Implementation Plan

---

### Phase 1 — Design System (`index.css`)

- [ ] **1. Rewrite `index.css` with full design token set and global styles.**

  **What to do:**
  - Replace existing `:root` variables with the full Unfazed design token set (see exact values below).
  - Add `@theme {}` block so Tailwind v4 resolves tokens as utility classes.
  - Add Google Fonts import for Inter (or use system font stack with Inter first).
  - Add `@keyframes slide-up` and `@keyframes fade-in` for Toast and Modal animations.
  - Add `animate-slide-up` and `animate-fade-in` via `@layer utilities` or `@theme`.
  - Update TipTap editor styles to use new token colors.
  - Update react-big-calendar overrides to use new token colors.
  - Add global `::selection` style for brand color.
  - Add smooth transition for focus-visible outlines.

  **Exact CSS token values to set:**
  ```css
  :root {
    /* Brand */
    --primary:       #4F46E5;   /* Soft Indigo — main interactive color */
    --primary-dark:  #3730A3;   /* Deeper indigo for hover */
    --primary-light: #EEF2FF;   /* Indigo-50 for backgrounds */
    --accent:        #0F766E;   /* Calm Teal */
    --accent-light:  #F0FDFA;   /* Teal-50 */

    /* Backgrounds */
    --bg:            #F8FAFC;   /* Very light warm gray — app background */
    --surface:       #FFFFFF;   /* Cards, modals, panels */
    --surface-2:     #F1F5F9;   /* Subtle secondary surface */

    /* Text */
    --text-primary:  #0F172A;   /* Near-black — headings, body */
    --text-secondary:#64748B;   /* Slate-500 — subtext */
    --text-muted:    #94A3B8;   /* Slate-400 — placeholders, timestamps */

    /* Borders */
    --border:        #E2E8F0;   /* Slate-200 — default border */
    --border-focus:  #4F46E5;   /* Indigo — focus ring */

    /* Status */
    --success:       #059669;   /* Emerald-600 */
    --success-light: #D1FAE5;   /* Emerald-100 */
    --warning:       #D97706;   /* Amber-600 */
    --warning-light: #FEF3C7;   /* Amber-100 */
    --error:         #DC2626;   /* Red-600 */
    --error-light:   #FEE2E2;   /* Red-100 */

    /* Radius */
    --radius-sm:     0.5rem;    /* 8px — small elements, badges */
    --radius:        0.75rem;   /* 12px — inputs, buttons */
    --radius-lg:     1rem;      /* 16px — cards */
    --radius-xl:     1.25rem;   /* 20px — large cards, modals */

    /* Shadows */
    --shadow-sm:     0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow:        0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md:     0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    --shadow-lg:     0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.05);

    /* Sidebar */
    --sidebar-width:      16rem;   /* 256px */
    --sidebar-collapsed:  4.5rem;  /* 72px */
    --topbar-height:      4rem;    /* 64px */
  }
  ```

  **`@theme` block** (so Tailwind v4 resolves these as utility classes):
  ```css
  @theme {
    --color-primary:       #4F46E5;
    --color-primary-dark:  #3730A3;
    --color-primary-light: #EEF2FF;
    --color-accent:        #0F766E;
    --color-accent-light:  #F0FDFA;
    --color-surface:       #FFFFFF;
    --color-bg:            #F8FAFC;
    --color-text-primary:  #0F172A;
    --color-text-secondary:#64748B;
    --color-text-muted:    #94A3B8;
    --color-border:        #E2E8F0;
    --color-success:       #059669;
    --color-warning:       #D97706;
    --color-error:         #DC2626;
  }
  ```

  **Keyframes to add:**
  ```css
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scale-in {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
  }
  ```

  **Utility classes to add in `@layer utilities`:**
  ```css
  .animate-slide-up  { animation: slide-up  0.2s ease-out; }
  .animate-fade-in   { animation: fade-in   0.15s ease-out; }
  .animate-scale-in  { animation: scale-in  0.15s ease-out; }
  ```

  **TipTap updates:**
  - `blockquote`: change `border-left: 3px solid #6366f1` → `border-left: 3px solid var(--primary)`
  - `min-height: 200px` → `min-height: 240px`

  **react-big-calendar overrides:**
  - `.rbc-event`: `background-color: var(--primary) !important`
  - `.rbc-today`: `background-color: var(--primary-light) !important`
  - `.rbc-toolbar button:hover`: `background-color: var(--primary-light) !important; color: var(--primary) !important`
  - `.rbc-toolbar button.rbc-active`: `background-color: var(--primary) !important; color: white !important`
  - `.rbc-header`: `font-size: 12px; font-weight: 600; color: var(--text-secondary);`

  **Body/html:**
  - `font-family: 'Inter', system-ui, -apple-system, sans-serif;` (unchanged)
  - `background-color: var(--bg);` (unchanged key, value stays same)
  - `color: var(--text-primary);`
  - Add: `line-height: 1.6;`

  **Files:** `src/index.css`

  **Verify:** `npm run build` — build completes without errors. Dev server shows app with new colors.

---

### Phase 2 — Common Components

- [ ] **2. Redesign `Button.jsx`**

  **What to do (styling only — keep all props/logic unchanged):**
  - Update `variants` map:
    - `primary`: `bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white shadow-sm hover:shadow-md active:scale-[0.98]`
    - `secondary`: `bg-slate-100 hover:bg-slate-200 text-slate-700`
    - `danger`: `bg-red-600 hover:bg-red-700 text-white shadow-sm`
    - `ghost`: `bg-transparent hover:bg-slate-100 text-slate-700`
    - `outline`: `border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-slate-700 bg-white`
  - Update base classes: add `transition-all duration-150` and change `rounded-lg` to `rounded-[var(--radius)]`
  - Focus ring: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]` (replace `focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1`)
  - Size `md`: change to `px-4 py-2.5` for better height
  - Size `lg`: change to `px-6 py-3`

  **Do NOT change:** Props interface (`children`, `variant`, `size`, `loading`, `disabled`, `className`, `...props`), Spinner import, disabled logic.

  **Files:** `src/components/common/Button.jsx`

  **Verify:** `npm run build` — no type errors. Visual check: button has rounded corners, smooth hover.

---

- [ ] **3. Redesign `Input.jsx`**

  **What to do (styling only — keep all props/logic unchanged):**
  - Label: change to `text-sm font-medium text-[var(--text-primary)]`
  - Input base: `w-full px-3.5 py-2.5 rounded-[var(--radius)] border text-sm transition-all duration-150 bg-white`
  - Border: `border-[var(--border)]`
  - Hover: `hover:border-slate-400`
  - Focus: `focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]`
  - Error state: `border-[var(--error)] bg-red-50 focus:ring-[var(--error)]/20 focus:border-[var(--error)]`
  - Error text: `text-xs text-[var(--error)]`
  - Required star: `text-[var(--error)]`

  **Do NOT change:** Props interface, `aria-invalid`, `aria-describedby`, error id pattern.

  **Files:** `src/components/common/Input.jsx`

  **Verify:** `npm run build` — no errors. Focus state visible, error state renders red border.

---

- [ ] **4. Redesign `Badge.jsx`**

  **What to do (styling only — keep `statusColor` export and `Badge` component):**
  - Update `colorMap` to be slightly more refined (use `bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200` pattern for all colors — ring gives subtle border without adding border utility):
    - `green`:  `bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200`
    - `red`:    `bg-red-50 text-red-700 ring-1 ring-inset ring-red-200`
    - `yellow`: `bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200`
    - `blue`:   `bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200`
    - `purple`: `bg-[var(--primary-light)] text-[var(--primary)] ring-1 ring-inset ring-indigo-200`
    - `gray`:   `bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200`
    - `orange`: `bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200`
  - Badge span base: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`

  **Do NOT change:** `statusColor` export function, `colorMap` key names, `color` prop, `label` prop, `className` prop.

  **Files:** `src/components/common/Badge.jsx`

  **Verify:** `npm run build`. Badges render with subtler ring border.

---

- [ ] **5. Redesign `Modal.jsx`**

  **What to do (styling only — keep all logic, portal, keyboard handler, scroll lock unchanged):**
  - Backdrop: add `animate-fade-in` to the overlay div
  - Modal panel: change `rounded-xl` to `rounded-[var(--radius-xl)]`; add `animate-scale-in`; change `shadow-xl` to `shadow-[var(--shadow-lg)]`
  - Header: `px-6 py-5 border-b border-[var(--border)]`
  - Title: `text-lg font-semibold text-[var(--text-primary)]`
  - Close button: `rounded-[var(--radius-sm)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-100 transition-colors`
  - Body: `px-6 py-5`
  - Add a **footer** div at the bottom of the panel (optional slot via `footer` prop — default `null`). If `footer` is passed, render `<div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">{footer}</div>`. This is additive — existing code passing no `footer` prop is unaffected.

  **Do NOT change:** `isOpen`, `onClose`, `title`, `children`, `size` props; portal logic; `useEffect` hooks; `sizes` map keys.

  **Files:** `src/components/common/Modal.jsx`

  **Verify:** `npm run build`. Modal opens with scale animation, has rounded-xl corners.

---

- [ ] **6. Redesign `Avatar.jsx`**

  **What to do (styling only — keep all logic):**
  - Fallback initials div: change `bg-indigo-100 text-indigo-700` → `bg-[var(--primary-light)] text-[var(--primary)]`
  - Keep `ring-2 ring-white` — provides contrast separation on any background
  - Sizes unchanged

  **Files:** `src/components/common/Avatar.jsx`

  **Verify:** `npm run build`.

---

- [ ] **7. Redesign `Spinner.jsx`**

  **What to do:**
  - Change `border-indigo-500` → `border-[var(--primary)]`
  - No other changes

  **Files:** `src/components/common/Spinner.jsx`

  **Verify:** `npm run build`.

---

- [ ] **8. Redesign `Toast.jsx`**

  **What to do (styling only — keep all logic, `ToastProvider`, `useToast` exports, `addToast`, `removeToast` unchanged):**
  - Update `colors` map:
    - `success`: `bg-[var(--surface)] border-l-4 border-[var(--success)] text-[var(--text-primary)] shadow-[var(--shadow-md)]`
    - `error`:   `bg-[var(--surface)] border-l-4 border-[var(--error)] text-[var(--text-primary)] shadow-[var(--shadow-md)]`
    - `info`:    `bg-[var(--surface)] border-l-4 border-[var(--primary)] text-[var(--text-primary)] shadow-[var(--shadow-md)]`
    - `warning`: `bg-[var(--surface)] border-l-4 border-[var(--warning)] text-[var(--text-primary)] shadow-[var(--shadow-md)]`
  - Update `icons` to use colored spans instead of plain text:
    - Wrap icon in `<span className="w-5 h-5 flex-shrink-0 mt-0.5 font-bold text-sm">`
    - success → `<span style={{color:'var(--success)'}}>✓</span>`
    - error → `<span style={{color:'var(--error)'}}>✕</span>`
    - info → `<span style={{color:'var(--primary)'}}>ℹ</span>`
    - warning → `<span style={{color:'var(--warning)'}}>⚠</span>`
  - Toast div: add `animate-slide-up rounded-[var(--radius)] border border-[var(--border)]`; remove the old color class pattern that set bg/border/text as one string
  - Container: `fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-[360px] w-full`
  - Dismiss button: `flex-shrink-0 ml-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors`

  **Files:** `src/components/common/Toast.jsx`

  **Verify:** `npm run build`. Toast shows with left-colored border, white background, slides up.

---

- [ ] **9. Redesign `ErrorBoundary.jsx`**

  **What to do (styling only — keep class component structure, `getDerivedStateFromError`, `componentDidCatch` unchanged):**
  - Container: `min-h-screen flex items-center justify-center bg-[var(--bg)] p-6`
  - Card: `bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] max-w-md w-full p-8 text-center`
  - Replace `text-5xl mb-4` emoji with an SVG icon (a warning triangle in `text-[var(--warning)]`)
  - Heading: `text-xl font-bold text-[var(--text-primary)] mb-2`
  - Paragraph: `text-[var(--text-secondary)] text-sm mb-6`
  - Reload button: use `Button` component — `<Button onClick={...}>Reload page</Button>` (import Button)

  **Files:** `src/components/common/ErrorBoundary.jsx`

  **Verify:** `npm run build`.

---

- [ ] **10. Redesign `ProtectedRoute.jsx`**

  **What to do (styling only — keep Navigate/Outlet logic):**
  - Loading container: `min-h-screen flex items-center justify-center bg-[var(--bg)]`
  - Inner: `flex flex-col items-center gap-3`
  - Spinner: use `<Spinner size="lg" />` component (import it)
  - Text: `text-[var(--text-secondary)] text-sm`

  **Files:** `src/components/common/ProtectedRoute.jsx`

  **Verify:** `npm run build`.

---

### Phase 3 — Layout (AppLayout, Sidebar, Topbar)

- [ ] **11. Redesign `Sidebar.jsx`**

  **What to do:**
  - Replace all emoji icons with proper SVG icons inline (no new icon library — inline SVGs keep zero-dependency).
  - Update `navItems` array to include `icon` as a JSX SVG element per item (20×20, `fill="none"`, `stroke="currentColor"`, `strokeWidth={1.75}`). Use standard Heroicons-style paths for:
    - Dashboard → grid/squares icon
    - Clients → users/people icon
    - Sessions → calendar-check icon
    - Calendar → calendar icon
    - Notes → document-text icon
    - Chat → chat-bubble icon
    - Billing → credit-card icon
    - Analytics → chart-bar icon
    - Settings → cog/gear icon
  - Brand area:
    - Replace emoji `U` div with a styled logo mark: `<div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--primary)] flex items-center justify-center flex-shrink-0">` with white `U` text
    - Brand name: `font-bold text-lg text-[var(--text-primary)] tracking-tight` (not indigo — app name in dark color)
    - Add subtitle below name when expanded: `<span className="text-[10px] text-[var(--text-muted)] leading-tight">Therapy management</span>`
  - Sidebar `aside`:
    - Keep `flex flex-col h-full transition-all duration-200 overflow-hidden`
    - Change `bg-white border-r border-slate-200` → `bg-[var(--surface)] border-r border-[var(--border)]`
    - Keep `${collapsed ? "w-[var(--sidebar-collapsed)]" : "w-[var(--sidebar-width)]"}` (use CSS vars)
  - Nav items — active state:
    - Active: `bg-[var(--primary-light)] text-[var(--primary)] font-semibold`
    - Inactive: `text-[var(--text-secondary)] hover:bg-slate-50 hover:text-[var(--text-primary)]`
    - Icon wrapper: `flex-shrink-0 w-5 h-5`
    - Add `rounded-[var(--radius)]` to each nav link
    - Add `px-3 py-2.5` padding (unchanged from current)
  - User footer:
    - `border-t border-[var(--border)] px-3 py-3`
    - User name: `text-sm font-medium text-[var(--text-primary)]`
    - User email: `text-xs text-[var(--text-muted)]`
    - Logout button hover: `hover:text-[var(--error)] hover:bg-red-50`

  **Do NOT change:** `collapsed` prop, `useAuth`, `logout`, `NavLink` `end` prop, `aria-label` attributes.

  **Files:** `src/components/layout/Sidebar.jsx`

  **Verify:** `npm run build`. Sidebar shows SVG icons, active link has indigo background.

---

- [ ] **12. Redesign `Topbar.jsx`**

  **What to do:**
  - Header: `h-16 bg-[var(--surface)] border-b border-[var(--border)] flex items-center px-4 gap-4 shadow-[var(--shadow-sm)]`
  - Toggle button: `p-2 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-100 transition-colors`
  - Title: `flex-1 text-base font-semibold text-[var(--text-primary)]`
  - Notification bell button: `relative p-2 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-100 transition-colors`
  - Badge on bell: `absolute top-1.5 right-1.5 w-4 h-4 bg-[var(--error)] text-white rounded-full text-[10px] flex items-center justify-center font-bold`
  - Dropdown panel: `rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-lg)] animate-scale-in bg-[var(--surface)]`
  - Unread notification item: `bg-[var(--primary-light)]`
  - "Mark all read" button: `text-xs text-[var(--primary)] hover:underline`
  - Notification title: `text-sm font-medium text-[var(--text-primary)]`
  - Notification message: `text-xs text-[var(--text-secondary)]`
  - Timestamp: `text-xs text-[var(--text-muted)]`
  - Add a **user avatar** to the right of the notification bell: import `Avatar` and `useAuth`; render `<Avatar src={user?.avatar} name={...} size="sm" className="cursor-pointer" />`. This is display-only.

  **Do NOT change:** `onToggleSidebar`, `title` props, notification context usage, `markRead`, `markAllRead`, `format` usage, `showNotifs` toggle logic.

  **Files:** `src/components/layout/Topbar.jsx`

  **Verify:** `npm run build`. Header has subtle shadow, notifications dropdown animates in.

---

- [ ] **13. Redesign `AppLayout.jsx`**

  **What to do:**
  - Outer wrapper: change `bg-slate-50` → `bg-[var(--bg)]`
  - Mobile overlay backdrop: keep `bg-black/50` but add `backdrop-blur-sm`
  - Sidebar transition: `duration-200` → `duration-300`
  - Main area: `flex flex-col flex-1 overflow-hidden min-w-0`
  - `<main>`: change padding to `p-5 md:p-6 lg:p-8`

  **Do NOT change:** State logic (`sidebarOpen`, `sidebarCollapsed`), `useEffect` hooks, `Escape` key handler, `pageTitles` map, `Outlet`.

  **Files:** `src/components/layout/AppLayout.jsx`

  **Verify:** `npm run build`. Layout renders with proper spacing, sidebar transitions smoothly.

---

### Phase 4 — Auth Pages

- [ ] **14. Redesign `LoginPage.jsx`**

  **What to do (styling only — keep ALL form logic, `useAuth`, `useForm`, `navigate`, `toast`):**

  **Layout change:** Split-panel on desktop, single panel on mobile.
  - Outer: `min-h-screen flex bg-[var(--bg)]`
  - Left decorative panel (hidden on mobile, `hidden lg:flex`): `lg:w-1/2 bg-[var(--primary)] flex flex-col items-center justify-center p-12 text-white`
    - Inside: large Unfazed logo mark (80px), tagline "Calm. Professional. Present.", 3 bullet points about the app
    - Bottom: subtle decorative circles with low-opacity white fills
  - Right panel (full on mobile, half on desktop): `flex-1 flex items-center justify-center p-6 lg:p-12`
  - Form card: `bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] w-full max-w-[400px] p-8 lg:p-10`
  - Logo area: keep structure, update to use `rounded-[var(--radius-sm)]` on the icon div
  - Heading `h2`: `text-2xl font-bold text-[var(--text-primary)] mb-1`
  - Subtitle: `text-sm text-[var(--text-secondary)] mb-7`
  - Session expired banner: `px-4 py-3 rounded-[var(--radius)] bg-[var(--warning-light)] border border-amber-300 text-sm text-amber-800`
  - Form `space-y-5` (increase from 4)
  - Submit button: add `mt-2` (via className on Button)
  - Footer link: `text-[var(--primary)] font-medium hover:underline`

  **Files:** `src/pages/auth/LoginPage.jsx`

  **Verify:** `npm run build`. Login page shows split panel on wide screen, full card on mobile.

---

- [ ] **15. Redesign `RegisterPage.jsx`**

  **What to do:** Same split-panel pattern as LoginPage.
  - Left panel same decorative treatment as Login
  - Right form card same classes
  - Form: `space-y-4` (unchanged since there are more fields)
  - Register button: full width, primary variant

  **Do NOT change:** Form registration logic, `watch` for password confirm, `registerUser` call.

  **Files:** `src/pages/auth/RegisterPage.jsx`

  **Verify:** `npm run build`.

---

### Phase 5 — Dashboard

- [ ] **16. Redesign `DashboardPage.jsx`**

  **What to do:**

  **Greeting section:**
  - Remove the `👋` emoji, replace greeting area with:
    ```
    <div className="flex items-start justify-between flex-wrap gap-4">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          {greeting()}, {user?.firstName}
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>
      <Link to="/sessions">
        <Button>+ Schedule session</Button>
      </Link>
    </div>
    ```

  **`StatCard` component (inline):**  Replace with:
  - Card: `bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-5 flex items-start gap-4 hover:shadow-[var(--shadow-md)] transition-shadow`
  - Icon container: `w-11 h-11 rounded-[var(--radius)] flex items-center justify-center flex-shrink-0` + color-specific background
  - Icon inside: SVG 20px, color-matched
  - Right side: label + large number + sub
  - `value`: `text-2xl font-bold text-[var(--text-primary)] mt-0.5`
  - `label`: `text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide`
  - `sub`: `text-xs text-[var(--text-muted)] mt-1`
  - Add 4 icons: people (clients), calendar (sessions), currency (revenue), clock (upcoming)
  - Color map for icon background:
    - indigo: `bg-[var(--primary-light)]` + `text-[var(--primary)]`
    - green: `bg-emerald-50` + `text-emerald-600`
    - amber: `bg-amber-50` + `text-amber-600`
    - blue: `bg-blue-50` + `text-blue-600`

  **Upcoming sessions panel:**
  - Card: `bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)]`
  - Header: `flex items-center justify-between px-6 py-4 border-b border-[var(--border)]`
  - Title: `font-semibold text-[var(--text-primary)]`
  - "View all" link: `text-sm text-[var(--primary)] hover:underline`
  - Empty state: Add a calendar SVG icon (40px, `text-[var(--text-muted)]`), message, and a `<Button>` link
  - Session list items: `flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors`

  **Add a "Quick actions" section** below the stats grid (before upcoming sessions):
  ```jsx
  <div className="flex flex-wrap gap-3">
    <Link to="/clients"><Button variant="outline" size="sm">Add client</Button></Link>
    <Link to="/sessions"><Button variant="outline" size="sm">Schedule session</Button></Link>
    <Link to="/billing"><Button variant="outline" size="sm">Create invoice</Button></Link>
    <Link to="/analytics"><Button variant="outline" size="sm">View analytics</Button></Link>
  </div>
  ```

  **Do NOT change:** `getSummaryAPI`, `getUpcomingSessionsAPI`, `useAuth`, loading state, `format`, `Badge`, `Avatar` usage.

  **Files:** `src/pages/dashboard/DashboardPage.jsx`

  **Verify:** `npm run build`. Dashboard shows stat cards with icons, quick actions row.

---

### Phase 6 — Clients Pages + ClientForm

- [ ] **17. Redesign `ClientsPage.jsx`**

  **What to do:**

  **Header section:**
  - `<div className="flex items-center justify-between flex-wrap gap-4">`
  - Heading: `text-2xl font-bold text-[var(--text-primary)]`
  - Count: `text-sm text-[var(--text-secondary)]`

  **Filters bar:**
  - Wrap in `<div className="flex items-center gap-3 flex-wrap p-4 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)]">`
  - Search input: `px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] w-64 bg-white`; add a magnifying-glass SVG as `absolute left-3` inside a relative wrapper
  - Status select: same styling as search input, `w-44`

  **Table card:**
  - `bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden`
  - `thead`: `bg-slate-50 border-b border-[var(--border)]`
  - `th`: `px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider`
  - `tbody tr`: `hover:bg-slate-50 transition-colors border-b border-[var(--border)] last:border-0`
  - `td`: `px-6 py-4`

  **Empty state:**
  - Replace plain text with:
    ```
    <div className="flex flex-col items-center justify-center py-16 text-center">
      [SVG users icon 48px text-[var(--text-muted)]]
      <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">No clients yet</h3>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Add your first client to get started.</p>
      <Button className="mt-5" onClick={() => setShowForm(true)}>Add client</Button>
    </div>
    ```

  **Do NOT change:** API calls, state, modal logic, `Badge`, `Avatar`, `ClientForm` usage.

  **Files:** `src/pages/clients/ClientsPage.jsx`

  **Verify:** `npm run build`. Client table renders with styled header, empty state shows icon.

---

- [ ] **18. Redesign `ClientDetailPage.jsx`**

  **What to do:**

  **Breadcrumb:** `text-sm text-[var(--text-secondary)]`; link `hover:text-[var(--primary)]`

  **Profile header card:**
  - `bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6`
  - Avatar: `size="xl"`
  - Name: `text-2xl font-bold text-[var(--text-primary)]`
  - Contact line: change emoji icons (✉ 📞) to inline SVGs

  **Info cards:**
  - `bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-5`
  - Section heading: `text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide`
  - `InfoRow` label: `text-sm text-[var(--text-muted)] w-40`
  - `InfoRow` value: `text-sm text-[var(--text-primary)]`

  **Internal notes panel:**
  - Change `bg-amber-50 border-amber-200` → `bg-[var(--warning-light)] border-amber-200`

  **Quick actions:**
  - Wrap in `<div className="flex gap-3 flex-wrap pt-2">`
  - All buttons: `variant="outline" size="sm"`

  **Do NOT change:** `getClientAPI`, `useParams`, modal/form wiring, `ClientForm` usage.

  **Files:** `src/pages/clients/ClientDetailPage.jsx`

  **Verify:** `npm run build`.

---

- [ ] **19. Restyle `ClientForm.jsx`**

  **What to do:**
  - All `<select>` elements: add `bg-white` and change to consistent classes:
    `w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white`
  - Textarea: same border/focus treatment as inputs
  - Form footer buttons: already using Button component — no changes needed
  - Labels: `text-sm font-medium text-[var(--text-primary)]`

  **Do NOT change:** `useForm`, `register`, `reset`, `handleSubmit`, API calls, onSuccess/onCancel.

  **Files:** `src/components/clients/ClientForm.jsx`

  **Verify:** `npm run build`.

---

### Phase 7 — Sessions Pages + SessionForm + CalendarPage

- [ ] **20. Redesign `SessionsPage.jsx`**

  **What to do:**
  - Same header/table/empty-state pattern as ClientsPage (Phase 6).
  - Empty state icon: calendar SVG 48px
  - Empty state message: "No sessions scheduled yet"
  - Status badge column: already uses `Badge` — no change
  - Type column: capitalize display
  - Table: add `tracking-wider` to header cells

  **Do NOT change:** API calls, cancel handler (`window.prompt` — do not change), modal, `SessionForm` usage.

  **Files:** `src/pages/sessions/SessionsPage.jsx`

  **Verify:** `npm run build`.

---

- [ ] **21. Redesign `SessionDetailPage.jsx`**

  **What to do:**
  - Card: `bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6`
  - `dl` grid: each item's `dt`: `text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider`; `dd`: `text-sm font-semibold text-[var(--text-primary)] mt-0.5 capitalize`
  - Add subtle divider line between the profile area and the `dl` grid: `<hr className="border-[var(--border)] my-5">`
  - "Start session" button: add `🎥` is fine but change to SVG video camera icon instead
  - Session notes card: `bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-5`

  **Do NOT change:** `getSessionAPI`, `cancelSessionAPI`, `completeSessionAPI`, `window.prompt`, navigate to room.

  **Files:** `src/pages/sessions/SessionDetailPage.jsx`

  **Verify:** `npm run build`.

---

- [ ] **22. Redesign `CalendarPage.jsx`**

  **What to do:**
  - Legend dots: use CSS variable colors (already inline style — keep as is)
  - Calendar wrapper: `bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-4`
  - The `isSessionExpired` import is referenced in CalendarPage but never imported in the existing file — it's already in the codebase. Do NOT add a new import; instead, notice the existing code calls `isSessionExpired` without importing — leave a `// TODO` comment only; do not change the catch block.
  - Update `eventStyle` map to use new token colors:
    - `scheduled`: `bg: '#4F46E5', border: '#3730A3'`
    - `confirmed`: `bg: '#2563EB', border: '#1D4ED8'`
    - `completed`: `bg: '#059669', border: '#047857'`
    - `cancelled`: `bg: '#DC2626', border: '#B91C1C'`
    - `no_show`: `bg: '#D97706', border: '#B45309'`
    - `in_progress`: `bg: '#7C3AED', border: '#6D28D9'`
  - Session detail popover in the modal: replace emoji icons (📅 🕐 📋 💰) with short text labels (`Date:`, `Time:`, `Type:`, `Rate:`)

  **Do NOT change:** `react-big-calendar` props (`onSelectSlot`, `onSelectEvent`, `selectable`, `popup`, `views`, `defaultView`), `fetchSessions` logic, `dateFnsLocalizer`, Modal wiring.

  **Files:** `src/pages/sessions/CalendarPage.jsx`

  **Verify:** `npm run build`. Calendar events use new color scheme.

---

- [ ] **23. Restyle `SessionForm.jsx`**

  **What to do:**
  - All `<select>` elements: `w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white`
  - Labels on selects: `text-sm font-medium text-[var(--text-primary)]`
  - Error paragraph below select: `text-xs text-[var(--error)]`

  **Do NOT change:** `useForm`, `register`, `handleSubmit`, `createSessionAPI`, `getClientsAPI`, onSuccess/onCancel/defaultClientId/defaultStartTime.

  **Files:** `src/components/sessions/SessionForm.jsx`

  **Verify:** `npm run build`.

---

### Phase 8 — Notes Pages

- [ ] **24. Redesign `NotesPage.jsx`**

  **What to do:**
  - Search bar: same styling as ClientsPage search
  - Note cards: `bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-5 hover:shadow-[var(--shadow-md)] hover:border-[var(--primary)]/30 transition-all`
  - Mood indicator: `text-lg font-bold text-[var(--primary)]`
  - Empty state:
    ```
    [SVG document-text icon 48px text-[var(--text-muted)]]
    <h3>No session notes yet</h3>
    <p>Notes are created from within a session.</p>
    <Link to="/sessions"><Button variant="outline" size="sm">Go to sessions</Button></Link>
    ```

  **Do NOT change:** `getNotesAPI`, search/filter logic, dangerouslySetInnerHTML on note content.

  **Files:** `src/pages/notes/NotesPage.jsx`

  **Verify:** `npm run build`.

---

- [ ] **25. Redesign `NoteEditorPage.jsx`**

  **What to do:**
  - Main card: `bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 space-y-5`
  - `MenuBar` component (inline):
    - Container: `flex flex-wrap gap-1 p-2 border-b border-[var(--border)] bg-slate-50 rounded-t-[var(--radius)]`
    - Buttons: `px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)] hover:shadow-sm transition-all`
    - Active state: `bg-white text-[var(--text-primary)] shadow-sm`
  - Format selector buttons: `px-3.5 py-1.5 rounded-[var(--radius)] text-xs font-semibold uppercase tracking-wide transition-all`
    - Active: `bg-[var(--primary)] text-white`
    - Inactive: `bg-slate-100 text-[var(--text-secondary)] hover:bg-slate-200`
  - TipTap editor border: `border border-[var(--border)] rounded-[var(--radius)] overflow-hidden`
  - SOAP textareas: same border/focus as Input component — `px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] resize-none disabled:bg-slate-50 disabled:text-[var(--text-muted)]`
  - Signed badge: `bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-medium`
  - Locked badge: `bg-slate-100 text-[var(--text-muted)] text-xs px-2.5 py-0.5 rounded-full font-medium`
  - Risk level select: same as SessionForm select styling

  **Do NOT change:** `useEditor`, `EditorContent`, `StarterKit`, save/sign/toggle logic, API calls, `format_` state, `fields` state, `getNoteBySessionAPI`/`getNoteAPI`/`updateNoteAPI`/`signNoteAPI`/`toggleVisibilityAPI`.

  **Files:** `src/pages/notes/NoteEditorPage.jsx`

  **Verify:** `npm run build`. Note editor renders with styled toolbar.

---

### Phase 9 — Billing Page + InvoiceForm

- [ ] **26. Redesign `BillingPage.jsx`**

  **What to do:**
  - Summary cards: add icons
    - Total received: green money icon on `bg-emerald-50` background
    - Pending: amber clock icon on `bg-amber-50` background
    - Card: `bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-5 flex items-center gap-4`
  - Filter row: same select styling as SessionForm
  - Table: same pattern as ClientsPage — `bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden`
  - Invoice number column: `text-sm font-mono font-medium text-[var(--primary)]`
  - "Pay now" button: already `variant="primary"` — just ensure it uses new token colors (flows from Button.jsx)
  - Empty state: receipt/invoice SVG icon + "No invoices yet" message

  **Do NOT change:** `handleRazorpayPayment`, `loadRazorpay`, `createRazorpayOrderAPI`, `verifyPaymentAPI`, the entire Razorpay `new window.Razorpay({...})` block.

  **Files:** `src/pages/billing/BillingPage.jsx`

  **Verify:** `npm run build`. Invoice table renders properly with styled header.

---

- [ ] **27. Restyle `InvoiceForm.jsx`**

  **What to do:**
  - `<select>` for client: same styling as SessionForm
  - Line item inputs: `px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white`
  - Remove line button `✕`: `text-[var(--text-muted)] hover:text-[var(--error)] transition-colors`
  - Summary block: `bg-slate-50 rounded-[var(--radius)] p-4 text-sm space-y-1.5`; total row: `font-bold text-[var(--text-primary)] border-t border-[var(--border)] pt-2 mt-1`
  - Notes textarea: same as other textareas
  - "Add line" button: `variant="ghost" size="sm"` (already is)

  **Do NOT change:** `useFieldArray`, `watch`, `control`, `createInvoiceAPI`, `getClientsAPI`, `onSuccess`/`onCancel`.

  **Files:** `src/components/billing/InvoiceForm.jsx`

  **Verify:** `npm run build`.

---

### Phase 10 — Analytics

- [ ] **28. Redesign `AnalyticsPage.jsx`**

  **What to do:**
  - `StatCard` (inline component): update to match DashboardPage stat card pattern with icon container
  - `UpgradeCard` (inline component): `bg-amber-50 border border-amber-200 rounded-[var(--radius-lg)] p-4`; title `text-sm font-semibold text-amber-900`; body `text-xs text-amber-700`
  - All chart cards: `bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-5 md:p-6`
  - Chart card headers: `font-semibold text-[var(--text-primary)]`
  - Revenue chart gradient: update `stopColor` to `var(--primary)` hex `#4F46E5`
  - Revenue `<Area stroke>`: `#4F46E5`
  - No-show `<Line stroke>`: `#DC2626` (matches `var(--error)`)
  - Bar chart `fill`: `#4F46E5`
  - All `CartesianGrid stroke`: `#F1F5F9`
  - Recharts empty state paragraphs: `text-[var(--text-muted)] text-sm text-center py-10`
  - Upgrade plan link: `bg-[var(--primary)] text-white rounded-[var(--radius)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--primary-dark)] transition-colors`

  **Do NOT change:** All API calls, `revenueBlocked` 403 handling, `upgradePrompts` data, chart data mapping.

  **Files:** `src/pages/analytics/AnalyticsPage.jsx`

  **Verify:** `npm run build`. Charts render with new color scheme.

---

### Phase 11 — Settings + Subscription

- [ ] **29. Redesign `SettingsPage.jsx`**

  **What to do:**
  - Page heading: `text-2xl font-bold text-[var(--text-primary)]`
  - Tabs container: `flex gap-0 border-b border-[var(--border)] -mx-1 overflow-x-auto`
  - Tab button active: `border-b-2 border-[var(--primary)] text-[var(--primary)] font-semibold`
  - Tab button inactive: `border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-300`
  - All section cards: `bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6`
  - Section headings inside cards: `text-base font-semibold text-[var(--text-primary)] mb-4`
  - All `<select>` (timezone): same select styling
  - All `<textarea>` (bio): same textarea styling
  - Bio textarea: `rows={4}`
  - Availability toggle switch: keep existing logic; update colors:
    - `enabled` bg: `bg-[var(--primary)]`
    - `disabled` bg: `bg-slate-300`
  - Availability day label enabled: `text-[var(--text-primary)]`
  - Availability day label disabled: `text-[var(--text-muted)]`
  - Subscription tab inner box: `bg-[var(--primary-light)] rounded-[var(--radius)] p-4 text-sm text-[var(--primary)]`
  - Avatar upload button: same as outline Button styling
  - File info text: `text-xs text-[var(--text-muted)]`

  **Do NOT change:** `useForm`, `register`, `handleSubmit`, `reset`, `getProfileAPI`, `updateProfileAPI`, `updateAvatarAPI`, `updatePasswordAPI`, `getAvailabilityAPI`, `updateAvailabilityAPI`, `refreshUser`, tab array, `DAYS` array.

  **Files:** `src/pages/settings/SettingsPage.jsx`

  **Verify:** `npm run build`. Settings page with styled tabs, toggle switches use primary color.

---

- [ ] **30. Redesign `SubscriptionPage.jsx`**

  **What to do:**

  **Page header:** `text-2xl font-bold text-[var(--text-primary)]`; subtitle `text-sm text-[var(--text-secondary)]`

  **Checkout banner:**
  - `bg-[var(--primary-light)] border border-indigo-200 rounded-[var(--radius-lg)] px-4 py-3.5 flex items-center gap-3 text-sm text-[var(--primary)]`

  **Current plan card:**
  - `bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6`
  - Plan name: `text-2xl font-bold capitalize` + color from `PLAN_DETAILS`
  - Status badge: keep existing conditional color logic but use ring pattern from Badge

  **Plan cards grid:**
  - Each card: `bg-[var(--surface)] rounded-[var(--radius-xl)] border-2 p-6 flex flex-col transition-all duration-200`
  - Current plan card: `border-[var(--primary)] shadow-[var(--shadow-md)]`
  - Non-current: `border-[var(--border)] hover:border-indigo-300 hover:shadow-[var(--shadow-sm)]`
  - Plan label badge: use `PLAN_DETAILS[planKey].bg + color` (already has these)
  - Price: `text-3xl font-bold text-[var(--text-primary)]`; `/mo` `text-sm text-[var(--text-muted)]`
  - Feature list checkmark: `text-[var(--success)]`
  - Feature text: `text-sm text-[var(--text-secondary)]`
  - "Current plan" indicator: `text-center text-sm font-semibold text-[var(--primary)] py-2 bg-[var(--primary-light)] rounded-[var(--radius-sm)]`
  - Upgrade button: use Button component (already does)
  - Cancel button: `variant="ghost" className="text-[var(--error)]"`

  **Do NOT change:** `handleUpgrade`, `handleCancel`, `createSubscriptionOrderAPI`, `verifySubscriptionAPI`, `cancelSubscriptionAPI`, `new window.Razorpay({...})`, `rzpRef`, `loadingPlan`, `checkoutOpen`, `PLAN_DETAILS` object (keys/values).

  **Files:** `src/pages/settings/SubscriptionPage.jsx`

  **Verify:** `npm run build`. Plan cards have premium look; current plan highlighted.

---

### Phase 12 — Chat

- [ ] **31. Redesign `ChatPage.jsx`**

  **What to do:**

  **Outer wrapper:**
  - `flex h-[calc(100vh-5rem)] rounded-[var(--radius-xl)] overflow-hidden border border-[var(--border)] shadow-[var(--shadow-sm)]`
  - Keep `bg-[var(--bg)]`

  **`ClientSidebar` component (inline):**
  - `aside`: `w-64 flex-shrink-0 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full`
  - Header: `px-4 py-3.5 border-b border-[var(--border)]`; title `text-sm font-semibold text-[var(--text-primary)]`
  - Client item active: `bg-[var(--primary-light)] border-r-2 border-[var(--primary)]`
  - Client item hover: `hover:bg-slate-50`
  - Client name: `text-sm font-medium text-[var(--text-primary)]`
  - Client status: `text-xs text-[var(--text-muted)] capitalize`
  - Unread badge: `bg-[var(--primary)] text-white`
  - Empty state: `text-xs text-[var(--text-muted)] text-center py-8 px-4 leading-relaxed`

  **`Bubble` component (inline):**
  - Mine: `bg-[var(--primary)] text-white rounded-br-sm`
  - Theirs: `bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm shadow-[var(--shadow-sm)]`
  - Mine timestamp: `text-[var(--primary-light)] opacity-80`
  - Theirs timestamp: `text-[var(--text-muted)]`
  - Max width: `max-w-[72%]`

  **Chat area header:**
  - `bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3` (keep flex items-center gap-3)
  - Client name: `font-semibold text-[var(--text-primary)] text-sm`
  - Connected indicator: `text-xs`; connected `text-[var(--success)]`; disconnected `text-[var(--text-muted)]`
  - "View profile →" link: `text-xs text-[var(--primary)] hover:underline`

  **Messages area:**
  - `bg-[var(--bg)] flex-1 overflow-y-auto px-5 py-4`

  **No client selected empty state:**
  - Replace `text-4xl mb-3 💬` emoji with a chat bubble SVG icon (48px, `text-[var(--text-muted)]`)
  - `text-[var(--text-secondary)] font-medium`; sub `text-[var(--text-muted)] text-sm`

  **No messages empty state:**
  - Replace `text-3xl mb-2 👋` with a wave SVG or keep emoji (less important here)
  - `text-[var(--text-secondary)] font-medium text-sm`

  **Typing indicator:**
  - `bg-[var(--surface)] border border-[var(--border)]` with shadow

  **Input area:**
  - `bg-[var(--surface)] border-t border-[var(--border)] px-4 py-3`
  - Textarea: `rounded-[var(--radius)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]`
  - Send button: `rounded-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] transition-colors` (keep existing disabled logic)

  **Responsive note:** On mobile (`< lg`), hide `ClientSidebar` when `clientId` is set. Add `{!clientId || 'lg'}` logic — specifically: wrap `<ClientSidebar>` in `<div className={clientId ? "hidden lg:flex" : "flex"}>`. This is a pure CSS/class change, no business logic change.

  **Do NOT change:** `useChat` hook, `getChatHistoryAPI`, `markRoomReadAPI`, `getClientsAPI`, Socket.IO `sendMessage`, `sendTypingStart`, `sendTypingStop`, `markRead`, `connected`, `typingUser`, `messages`, scroll-to-bottom logic, read-marking logic.

  **Files:** `src/pages/chat/ChatPage.jsx`

  **Verify:** `npm run build`. Chat shows styled sidebar and message bubbles.

---

## Implementation Notes for Coder

### Tailwind v4 token usage patterns

Since there is no `tailwind.config.js`, use one of these approaches for tokens:
1. **Arbitrary values**: `bg-[var(--primary)]`, `text-[var(--text-secondary)]`, `border-[var(--border)]` — always works
2. **Theme utilities** (after adding `@theme` block in Step 1): `bg-primary`, `text-text-primary` — cleaner but requires Phase 1 to complete first

**Recommendation**: Use arbitrary value syntax `bg-[var(--primary)]` throughout — it is guaranteed to work in Tailwind v4 regardless of `@theme` configuration and avoids potential naming conflicts.

### Select element styling consistency

Every `<select>` across all forms must use this exact class string:
```
w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm
focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]
bg-white text-[var(--text-primary)] appearance-none
```

### Textarea styling consistency

Every `<textarea>`:
```
w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm
focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]
resize-none disabled:bg-slate-50 disabled:text-[var(--text-muted)] bg-white
```

### Table pattern (used in Clients, Sessions, Billing)

```
<div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead className="bg-slate-50 border-b border-[var(--border)]">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">...</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--border)]">
        <tr className="hover:bg-slate-50 transition-colors">...</tr>
      </tbody>
    </table>
  </div>
</div>
```

### Empty state pattern

```jsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-12 h-12 text-[var(--text-muted)] mb-4">
    {/* SVG icon here */}
  </div>
  <h3 className="text-base font-semibold text-[var(--text-primary)]">Title</h3>
  <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-xs">Description</p>
  <Button className="mt-5" onClick={...}>Primary action</Button>
</div>
```

### Imports/exports that MUST NOT change

| File | Must-keep exports/names |
|------|------------------------|
| `Toast.jsx` | `ToastProvider` (named), `useToast` (named) |
| `Badge.jsx` | `statusColor` (named), `Badge` (default) |
| `Button.jsx` | `Button` (default) |
| `Input.jsx` | `Input` (default) |
| `Modal.jsx` | `Modal` (default) |
| `Avatar.jsx` | `Avatar` (default) |
| `Spinner.jsx` | `Spinner` (default) |
| `AppLayout.jsx` | `AppLayout` (default) |
| `Sidebar.jsx` | `Sidebar` (default) |
| `Topbar.jsx` | `Topbar` (default) |
| All pages | Default export function name unchanged |
| `ClientForm.jsx` | `client`, `onSuccess`, `onCancel` props interface |
| `SessionForm.jsx` | `onSuccess`, `onCancel`, `defaultClientId`, `defaultStartTime` props interface |
| `InvoiceForm.jsx` | `defaultClientId`, `onSuccess`, `onCancel` props interface |

### Build and verification

The project has no test suite. Verification for each phase is:
```
npm run build
```
Run from `unfazed-frontend/` directory. A clean exit with no errors is the pass condition.

For visual verification: `npm run dev` and check the UI in browser at `http://localhost:5173`.

### Git strategy

After all phases are complete:
```bash
cd "c:\Users\Adarsh\OneDrive\Desktop\Major Project"
git checkout -b feat/premium-ui-redesign
git add unfazed-frontend/src/
git commit -m "feat: premium UI redesign — design system, components, all pages"
```

Do NOT push directly to main/master. Create the branch and commit, then create a PR.

---

## Phase Order Summary

| Phase | Files | Dependency |
|-------|-------|------------|
| 1 — Design system | `index.css` | None — must be first |
| 2 — Common components | Button, Input, Badge, Modal, Avatar, Spinner, Toast, ErrorBoundary, ProtectedRoute | Needs Phase 1 tokens |
| 3 — Layout | AppLayout, Sidebar, Topbar | Needs Phase 2 (Avatar in Topbar, Button in Sidebar) |
| 4 — Auth pages | LoginPage, RegisterPage | Needs Phase 2 (Button, Input) |
| 5 — Dashboard | DashboardPage | Needs Phase 2-3 |
| 6 — Clients | ClientsPage, ClientDetailPage, ClientForm | Needs Phase 2-3 |
| 7 — Sessions | SessionsPage, SessionDetailPage, CalendarPage, SessionForm | Needs Phase 2-3 |
| 8 — Notes | NotesPage, NoteEditorPage | Needs Phase 2-3 |
| 9 — Billing | BillingPage, InvoiceForm | Needs Phase 2-3 |
| 10 — Analytics | AnalyticsPage | Needs Phase 2-3 |
| 11 — Settings | SettingsPage, SubscriptionPage | Needs Phase 2-3 |
| 12 — Chat | ChatPage | Needs Phase 2-3 |

Phases 4-12 are independent of each other and can be implemented in any order after Phase 3 is complete.
