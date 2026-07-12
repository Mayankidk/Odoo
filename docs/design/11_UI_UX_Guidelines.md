# AssetFlow — UI/UX Guidelines

## 1. Design Philosophy
The design must evoke a **premium, enterprise-grade feel** while remaining highly accessible and fast. We aim for a clean, data-dense layout that doesn't overwhelm the user.

- **Vibrant & Clean**: Using a tailored HSL palette, avoiding generic hex colors.
- **Micro-interactions**: Subtle hover states, smooth transitions (glassmorphism in modals, slight elevations on cards).
- **Clarity over cleverness**: Forms are single-column where possible, error states are explicit, and buttons clearly state their action.

## 2. Color Palette (Tailwind CSS Variables)

We use a modern, slightly desaturated primary color with crisp, high-contrast text to ensure readability on data-heavy tables.

| Role | HSL Variable | Hex Equivalent (Approx) | Usage |
|------|--------------|-------------------------|-------|
| **Primary** | `221 83% 53%` | `#1D4ED8` (Blue) | Primary buttons, active nav states, links |
| **Secondary** | `210 40% 96%` | `#F1F5F9` (Slate 100) | Secondary buttons, card backgrounds in light mode |
| **Background** | `0 0% 100%` | `#FFFFFF` | Main app background |
| **Surface** | `210 40% 98%` | `#F8FAFC` | Table headers, sidebars |
| **Text Primary**| `222 47% 11%` | `#0F172A` | Headings, primary body text |
| **Text Muted** | `215 16% 47%` | `#64748B` | Helper text, disabled states |
| **Success** | `142 71% 45%` | `#22C55E` | Badges (Available), success toasts |
| **Warning** | `38 92% 50%` | `#F59E0B` | Badges (Under Maintenance), pending states |
| **Destructive** | `348 83% 47%` | `#E11D48` | Delete actions, Badges (Lost/Overdue) |

## 3. Typography

**Primary Font**: `Inter` (Google Fonts) — chosen for its excellent legibility in data tables and dashboards.

- **H1 (Page Titles)**: 24px (1.5rem), Semibold, Text Primary
- **H2 (Section Titles)**: 18px (1.125rem), Semibold, Text Primary
- **Body Regular**: 14px (0.875rem), Normal, Text Primary (Standard for tables/forms)
- **Body Small**: 12px (0.75rem), Normal, Text Muted (Helper text, timestamps)

## 4. Components & States

### 4.1 Buttons
- **Primary**: Solid primary background, white text. Hover: slightly darker primary (`brightness-90`), subtle scale (`scale-105`).
- **Secondary**: Outline or soft background. Hover: subtle gray background.
- **Destructive**: Solid red background. Requires confirmation popover for destructive actions (e.g., Deactivate Department).
- **Disabled**: Opacity 50%, `cursor-not-allowed`. Never hide disabled buttons; show them so users know the action exists but isn't available.

### 4.2 Forms
- **Layout**: Labels above inputs. 16px vertical spacing between fields.
- **Inputs**: 1px solid border (gray-300). Focus state: 2px primary ring (`ring-2 ring-primary ring-offset-2`).
- **Validation**: Inline red text below the input. Input border turns red on error.
- **Required Fields**: Marked with a subtle red asterisk `*`.

### 4.3 Asset Status Badges
Consistent color coding is critical for scanability in lists/tables.
- **Available**: Solid Green
- **Allocated**: Solid Blue
- **Reserved** (Booking): Solid Teal
- **Under Maintenance**: Solid Amber/Orange
- **Lost/Disposed**: Solid Red
- **Overdue**: Pulsing Red border/text

### 4.4 Tables
- **Header**: Sticky header, light gray background, slightly bolder text.
- **Rows**: Alternating subtle zebra striping (optional) or bottom border. Hover state on rows (`bg-slate-50`) to help tracking across wide screens.
- **Pagination**: Always visible at the bottom right.

## 5. Responsive Guidelines

- **Mobile (< 768px)**:
  - Sidebar collapses into a hamburger menu.
  - Data tables convert to card lists (stacked layout).
  - Modals take up 95% of the screen width.
- **Tablet (768px - 1024px)**:
  - Sidebar can be icon-only to save space.
  - Dashboard KPIs stack 2x2 or 3x2.
- **Desktop (> 1024px)**:
  - Sidebar fixed left (240px width).
  - Dashboard KPIs in a single row.
  - Modals centered with a max-width of 600px.

## 6. Accessibility (A11y)
- **Contrast**: All text must meet WCAG AA standards (4.5:1 ratio).
- **Focus Management**: Modals must trap focus. Forms should auto-focus the first input.
- **ARIA**: Use `aria-label` for icon-only buttons (e.g., trash can icon for delete).
- **Keyboard**: Entire application must be navigable via Tab key.

## 7. Empty & Loading States
- **Loading**: Use skeleton loaders matching the shape of the expected content rather than generic spinners for main page loads. Buttons show a small inline spinner when submitting.
- **Empty States**: Never show a blank table. Use a friendly illustration/icon, a message ("No assets found"), and a clear Call-to-Action button ("Register your first asset").

---
*Cross-references: [03_UX_and_Use_Cases.md](./03_UX_and_Use_Cases.md)*
