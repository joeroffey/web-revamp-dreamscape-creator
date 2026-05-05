# Cohesive, Modern Admin Experience

Goal: make the admin area feel like one app — a single shell, consistent page chrome, and quick paths between related screens (e.g. open a booking from the dashboard's Recent Bookings).

## What's wrong today

- The top nav crams 12 items into a horizontal bar that wraps awkwardly on smaller laptop widths (current viewport 1062px).
- Two competing dashboards exist (`pages/admin/Dashboard.tsx` is live; `components/admin/ModernDashboard.tsx` is unused mock data) — visual language is inconsistent.
- Recent Bookings on the dashboard are plain rows with no click-through to the actual booking.
- Page headers vary: some pages use `AdminPageHeader`, others render their own gradient title block (e.g. `ModernBookingManagement`, `ModernCustomerManagement`).
- No breadcrumbs / "where am I" cues; no global search.

## Changes

### 1. New admin shell with collapsible sidebar
Replace the horizontal `AdminNavigation` with a shadcn `Sidebar` (`collapsible="icon"`, persists in localStorage). The shell lives in `AdminLayout` and wraps all admin routes.

Layout:

```text
┌────────────────────────────────────────────────────┐
│ ☰  Revitalise Admin   [search…]      🔔  ⚙  Logout │  ← top bar
├──────────┬─────────────────────────────────────────┤
│ Dashboard│  Breadcrumb: Admin / Bookings           │
│ Schedule │ ┌─────────────────────────────────────┐ │
│ Bookings▸│ │  Page content                       │ │
│ Customers│ │                                     │ │
│ Gift Crd │ └─────────────────────────────────────┘ │
│ Members  │                                         │
│ ─────    │                                         │
│ Content ▾│                                         │
│  Blog    │                                         │
│  Events  │                                         │
│  Partners│                                         │
│ Messages●│  (red dot = unread badge)               │
│ Reports  │                                         │
│ Settings │                                         │
└──────────┴─────────────────────────────────────────┘
```

- Groups: **Operations** (Dashboard, Schedule, Bookings, Customers), **Sales** (Gift Cards, Memberships, Partner Codes), **Content** (Blog, Events, Messages), **Insights** (Reports, Settings).
- Active route highlighted via `NavLink` + `isActive`.
- Unread-messages badge moves onto the Messages sidebar item (keeps existing 30s polling query).
- Mobile: sidebar becomes an off-canvas sheet triggered from the top bar; the existing `MobileAdminNav` is removed in favour of this single component.

### 2. Unified page chrome
- Every admin page renders inside the new shell and uses `AdminPageHeader` (title, description, optional right-side actions). Remove bespoke gradient headers from `ModernBookingManagement`, `ModernCustomerManagement`, `ModernGiftCardManagement`, `ModernScheduleManagement`, `ModernMessageManagement`, `ModernReports`, `ModernBlogManagement`.
- Add a lightweight breadcrumb component above the header (Admin / Section / Subsection).
- Standardise on shadcn `Card`/`Badge` styling (no per-page gradient palettes); rely on the project's existing brand tokens.

### 3. Dashboard: clickable Recent Bookings + better quick actions
- Each Recent Bookings row becomes clickable and opens the existing `BookingDetailsDialog` directly on the dashboard (same component used in `ModernBookingManagement`).
- Row gets a chevron, hover state, and a small "View all bookings →" link in the card header that routes to `/admin/bookings`.
- Stat cards keep navigation but get a subtle "→" affordance and trend line text only where we actually compute it (remove "Tap to manage" copy on the revenue card which has no action).
- Add a second column on the dashboard: **Today's Schedule** (next 5 paid bookings for today) and **Recent Activity** (last 5 memberships / gift cards) — both with click-through to their dialogs/pages.
- Delete the unused `components/admin/ModernDashboard.tsx` to avoid drift.

### 4. Cross-page deep links (consistency)
- Customer name in any booking row links to that customer's profile in `/admin/customers`.
- Membership rows link to the owning customer.
- Booking detail dialog already supports edit/refund — make sure the same dialog is reachable from: Dashboard recent bookings, Schedule day cells, Customer detail bookings tab.

### 5. Small polish
- Persist sidebar collapsed state in localStorage.
- Add `cmd/ctrl+K` shortcut to focus the top-bar search (search bookings by customer name/email — reuses `useCustomerSearch`).
- Replace the per-page background gradients with the global `bg-background` so the brand palette stays cohesive.

## Technical notes

- New files:
  - `src/components/admin/AdminSidebar.tsx` — shadcn Sidebar with grouped `NavLink` items + unread badge query.
  - `src/components/admin/AdminBreadcrumbs.tsx` — derives crumbs from `useLocation`.
  - `src/components/admin/AdminTopBar.tsx` — `SidebarTrigger`, search input, logout.
- Edit `src/components/AdminLayout.tsx` to wrap children in `SidebarProvider` + sidebar + top bar; ensures `min-h-screen flex w-full`.
- Edit `src/pages/admin/Dashboard.tsx`:
  - Add `selectedBooking` state and `<BookingDetailsDialog>` import.
  - Replace recent-booking rows with a `<button>` row that calls `setSelectedBooking(booking)`.
  - Add "View all" link, today's schedule section.
- Remove `src/components/MobileAdminNav.tsx` and `src/components/AdminNavigation.tsx` (or shrink `AdminNavigation` to just re-export the new top bar to avoid breakage).
- Strip custom header JSX from each `Modern*Management` component and rely on `AdminPageHeader`.
- Delete `src/components/admin/ModernDashboard.tsx` (unused).
- No DB / edge function changes required.

## Out of scope

- No changes to booking/payment business logic.
- No new analytics widgets beyond what the dashboard already queries (plus today's-schedule slice from the same `bookings` table).
- Public-site styling untouched.
