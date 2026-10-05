---
name: Clarity Ledger
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-currency:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  display-currency-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  amount-metric:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is engineered for modern personal finance management, accounts payable ("contas a pagar"), and cashflow monitoring. The aesthetic balances executive-grade precision with immediate, friction-free readability. 

### Brand Personality & Tone
- **Authoritative & Trustworthy:** Conveys monetary safety and accounting accuracy without feeling bureaucratic or intimidating.
- **Vigilant & Proactive:** Uses high-signal visual cues to spotlight imminent deadlines, overdue obligations, and net liquidity changes instantly.
- **Calm & Uncluttered:** Mitigates cognitive fatigue around recurring personal debts through structured information density, predictable visual hierarchies, and generous structural whitespace.

### Design Movement
**Modern Functional Minimalism with Subtle Tactile Depth.** 
The style relies on crisp neutral planes, strict typographic rhythm, micro-borders for semantic delineation, and restrained, intentional status accents. Structural chrome recedes into the background so transactional data, amounts, and settlement states remain the primary visual focus.

## Colors

The palette establishes an immediate hierarchy between platform architecture, structural containers, and transactional status indicators.

### Key Roles & Semantic Application
- **Primary (`#0F172A` - Deep Slate Navy):** Used for foundational interface scaffolding, primary action buttons, dark mode balance containers, critical headings, and heavy numeric totals.
- **Secondary (`#10B981` - Vibrant Emerald Green):** Denotes paid bills, settled obligations, positive income, healthy account balances, and successful system confirmations.
- **Tertiary (`#F59E0B` - Warm Amber):** Flags pending transactions, upcoming due dates (within 48–72 hours), and cautionary cashflow thresholds.
- **Danger / Critical (`#EF4444` - Coral Red):** Reserved exclusively for overdue bills, negative cashflow balances, failed reconciliations, and destructive actions.
- **Neutral Canvas (`#F8FAFC` - Slate 50):** The base application canvas tone that ensures zero eye-strain contrast against pristine white surface cards.

### Surface Tiers & Borders
- **Surface Level 0 (Base Canvas):** `#F8FAFC`
- **Surface Level 1 (Card & Section Backgrounds):** `#FFFFFF`
- **Surface Level 2 (Nested List Items & Subtle Containers):** `#F1F5F9`
- **Border / Divider Rule:** `#E2E8F0` applied consistently at `1px` to enforce structure without adding visual noise.
- **Muted Label Tone:** `#64748B` for tertiary descriptors, metadata timestamps, and category captions.

## Typography

The typographic hierarchy pairs **Plus Jakarta Sans** for structural headlines, key balance indicators, and numerical financial displays with **Inter** for all standard content, lists, transactional details, and form interactions.

### Principles
- **Tabular Figures:** Always apply `font-variant-numeric: tabular-nums` or `tnum` to currency, account numbers, and settlement timestamps to guarantee vertical alignment in lists and financial summaries.
- **Currency Distinction:** Currency symbols (e.g., `R$`) should be styled one size step smaller or in a medium weight (`500`) relative to the primary integer amount to emphasize the magnitude of the number.
- **Scannability First:** Headings utilize tighter tracking (`-0.02em` to `-0.01em`) to maintain cohesiveness in dense, high-utility screen layouts.

## Layout & Spacing

The layout model is driven by a mobile-first, high-density fluid grid designed to display critical financial data efficiently within compact vertical viewports.

### Grid & Margins
- **Mobile (< 640px):** 4-column fluid layout with an outer canvas margin of `16px` (`margin`) and internal gutters of `12px` (`gutter-sm`). Cards and transaction rows span full width (all 4 columns). Summary metric cards span 2 columns each for side-by-side comparison.
- **Tablet (640px - 1024px):** 8-column layout with `24px` margins (`margin-tablet`) and `16px` gutters (`gutter`). Enables dual-pane views (e.g., monthly bill schedule on the left, breakdown details on the right).
- **Desktop (> 1024px):** 12-column fixed-max layout capped at `1200px` centered, utilizing `32px` margins (`margin-desktop`) and `24px` gutters.

### Mobile Touch Ergonomics
- Base layout containers prioritize the "thumb zone" for frequent actions: filter chips, period selectors, and the "Add Bill / Quick Pay" sticky action bar remain within the lower 40% of the screen.
- Minimum interactive touch area strictly adheres to `44x44px`, even when the visual container (such as an icon button or checkbox) occupies only `20px` or `24px`.

## Elevation & Depth

Visual hierarchy relies on crisp surface layering and razor-sharp borders rather than heavy, dramatic dropshadows. This keeps the interface crisp and avoids visual muddiness in data-heavy screens.

### Elevation Levels
- **Level 0 (Recessed/Canvas):** Color `#F8FAFC`, no shadow. Structural backdrop.
- **Level 1 (Card/Container Surfaces):** Solid `#FFFFFF`, bordered by `1px solid #E2E8F0`, enhanced with a micro ambient shadow: `0px 1px 2px rgba(15, 23, 42, 0.04)`.
- **Level 2 (Interactive Cards & Popovers):** Solid `#FFFFFF`, border `1px solid #E2E8F0`, elevated with `0px 4px 12px -2px rgba(15, 23, 42, 0.08)`. Used for active transaction expansion drawers, bottom sheets, and dropdown selectors.
- **Level 3 (Floating Action & Modals):** Applied to floating bottom action bars and sticky confirmation modals: `0px 10px 25px -4px rgba(15, 23, 42, 0.12)`, bordered by `1px solid rgba(226, 232, 240, 0.8)`.

### Tonal Accents for Financial Urgency
Critical alerts and overdue statuses employ a soft semantic fill (`#FEF2F2` for critical danger, `#FEF3C7` for warning) combined with an inner border tone (`#FCA5A5` and `#FCD34D`) rather than elevated drop shadows, keeping urgency immediate and flat.

## Shapes

The interface adopts a balanced **Rounded (`roundedness: 2`)** geometry. This strikes a modern, refined balance between friendly consumer mobile apps and clean analytical tooling.

### Component-Specific Corner Radii
- **Base Elements (`0.5rem` / `8px`):** Input fields, form select menus, action buttons, table cell selections, and checkbox indicators.
- **Containers & Cards (`1rem` / `16px`):** Transaction summary cards, grouped account cards, bottom navigation containers, and modal dialogs.
- **Floating Modals & Sheets (`1.5rem` / `24px`):** Top corners of mobile slide-up sheets and major metric highlight panels.
- **Pill Badges (`9999px`):** Status indicators (Paid, Pending, Overdue), filter tags, and quick-filter category chips.

## Components

### Buttons
- **Primary Action:** Solid `#0F172A` background, `#FFFFFF` text, `8px` radius. Height of `48px` on mobile for optimal tap reliability. Active state scales to `98%` with background shifting to `#1E293B`.
- **Secondary / Settlement Button:** Border `1px solid #E2E8F0`, `#0F172A` text, hover/pressed state fills `#F1F5F9`.
- **Success / Quick Pay Button:** `#10B981` background, `#FFFFFF` text, used specifically for settling pending items in one tap.

### Status Chips & Badges
- **General Structure:** Compact height of `24px`, padding `0 10px`, `9999px` radius, typography set to `label-sm` in uppercase with subtle letter-spacing.
- **Paid / Settled:** Background `#ECFDF5`, text `#065F46`, paired with an optional checkmark micro-icon.
- **Pending / Upcoming:** Background `#FFFBEB`, text `#92400E`.
- **Overdue / Critical:** Background `#FEF2F2`, text `#991B1B`.

### Bill & Transaction List Items
- Designed for high scannability. Minimum row height `64px`.
- Left-aligned: Category circular icon badge (`40x40px`, background `#F1F5F9`), biller name (`body-md` bold `#0F172A`), and due date with remaining days subtitle (`body-sm` `#64748B`).
- Right-aligned: Amount in tabular numerals (`amount-metric`), directly stacked above the status pill badge.
- Swipe interactions reveal a quick "Mark as Paid" action (green) or "Snooze/Reschedule" (slate).

### Financial Metric Summary Cards
- Compact 2-column or 3-column horizontally scrollable containers.
- Enclosed with `1px solid #E2E8F0` on `#FFFFFF` base. 
- Top row displays a small descriptive label (`label-sm` in `#64748B`), bottom row displays aggregated values in `display-currency-mobile`. Include a subtle vertical color indicator strip on the left edge (`#10B981` for Net Balance/Received, `#EF4444` for Total to Pay).

### Input Fields & Controls
- **Inputs:** `44px` height, `8px` radius, background `#FFFFFF`, border `1px solid #CBD5E1`. On focus: border shifts to `#0F172A` with a crisp `2px` focus ring in `rgba(15, 23, 42, 0.1)`. No float-label ambiguity; standard top-aligned persistent micro-labels (`label-md`).
- **Checkboxes:** `20x20px` square with `4px` radius. Unchecked has a `1.5px` border in `#94A3B8`. Checked has a solid `#0F172A` or `#10B981` fill with an inverted white checkmark.