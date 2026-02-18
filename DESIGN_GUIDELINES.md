# DJ Request App - Design Guidelines

Comprehensive design system and UI conventions for the DJ song request application. All components should adhere to these guidelines to maintain visual consistency across the app.

---

## Color Palette

| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| **Background** | `#0f172a` | `bg-slate-900` | DJ pages background |
| **Background (Guest)** | Ghibli gradient | `.ghibli-bg` | Guest pages only |
| **Surface** | `#1e293b` | `bg-slate-800` | Cards, panels, containers |
| **Surface variant** | `#334155` | `bg-slate-700` | Inputs, secondary buttons, borders |
| **Primary** | `#9333ea` | `bg-purple-600` | Primary actions, active tabs, vote highlight |
| **Primary hover** | `#7e22ce` | `hover:bg-purple-700` | Hover state for primary actions |
| **Text primary** | `#ffffff` | `text-white` | Headings, primary content |
| **Text secondary** | `#94a3b8` | `text-slate-400` | Supporting text, descriptions |
| **Text tertiary** | `#64748b` | `text-slate-500` | Placeholders, less important info |
| **Text muted** | `#475569` | `text-slate-600` | Disabled text, decorative labels |
| **Success** | green-400 / green-600 | `text-green-400` / `bg-green-600` | Completed downloads, success toasts |
| **Error** | red-400 / red-500 | `text-red-400` / `bg-red-500` | Failures, delete actions |
| **Warning** | yellow-400 | `text-yellow-400` | Low quality indicators |
| **Link hover** | purple-300 | `hover:text-purple-300` | Clickable song titles |

---

## Typography

- **Font family**: System font stack (Tailwind default) -- no custom web fonts required.
- **Base text size**: `text-sm` (14px) for most body content.
- **Headings**:
  - Page titles: `text-2xl font-bold`
  - Section titles: `text-xl font-semibold`
  - Subsection titles: `text-lg font-semibold`
- **Small text**: `text-xs` for metadata, voter names, timestamps.
- **Monospace**: `font-mono` for rank numbers and DJ IDs.
- **Tabular numbers**: Apply the `tabular-nums` class on rank numbers to ensure consistent column alignment regardless of digit width.

---

## Component Patterns

### Cards

```
bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-700
```

- Use `rounded-xl` for larger containers (cards, modals, panels).
- Use `rounded-lg` for smaller nested elements (buttons, inputs, badges).

### Buttons

**Primary**
```
bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium
```

**Secondary**
```
bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg text-sm
```

**Danger (text-only)**
```
text-red-400 hover:text-red-300
```

**Disabled state**
```
disabled:opacity-50
```

**Mobile full-width**: Major action buttons should use `w-full sm:w-auto` so they span the full width on small screens and shrink to fit on larger ones.

### Inputs

```
bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500
```

- Placeholder text color: `placeholder-slate-400`
- iOS zoom prevention: all `<input>` and `<textarea>` elements must include `font-size: 16px !important` (via CSS) to prevent Safari from zooming on focus.

### Tabs

**Container**
```
bg-slate-800 rounded-lg p-1 overflow-x-auto
```

**Tab button**
```
flex-1 py-2 rounded-md text-xs sm:text-sm font-medium
```

**Active tab**
```
bg-purple-600 text-white
```

**Inactive tab**
```
text-slate-400 hover:text-white
```

### Toasts

- Slide-in animation from the right side of the viewport.
- Auto-dismiss after a configurable timeout.
- Three types with corresponding colors:
  - **success**: green accent
  - **error**: red accent
  - **info**: purple/blue accent

---

## Spacing

| Context | Value | Notes |
|---------|-------|-------|
| Page padding | `px-4 py-6` | Applied to the outermost content wrapper |
| Max content width (Guest) | `max-w-2xl` | Centered with `mx-auto` |
| Max content width (DJ) | `max-w-3xl` | Centered with `mx-auto` |
| Card list gap | `space-y-3` | Between stacked cards in a list |
| Section gap | `mb-6` or `mb-8` | Between major page sections |
| Inner card padding | `p-3 sm:p-4` | Tighter on mobile, roomier on desktop |

---

## Ghibli Background (Guest Pages Only)

The guest-facing pages use a CSS-only animated background applied via the `.ghibli-bg` class defined in `index.css`. No external images are loaded.

**Implementation details:**

- **Base layer**: Multiple layered radial gradients in purple, pink, and blue at low opacity to create a soft, dreamy wash.
- **`::before` pseudo-element**: A repeating dot pattern that simulates distant "stars" or particles.
- **`::after` pseudo-element**: Floating color orbs animated on a 20-second loop for subtle movement.
- **Child content**: All children of `.ghibli-bg` must have `position: relative; z-index: 1` so they render above the background effects.

**Important**: DJ pages do **not** use the Ghibli background. They remain on the plain `bg-slate-900` background.

---

## Mobile-First Rules

All layouts must function correctly at a minimum viewport width of **320px**.

| Technique | Example | Purpose |
|-----------|---------|---------|
| Responsive padding | `px-3 sm:px-5` | Tighter spacing on mobile |
| Responsive text | `text-xs sm:text-sm` | Smaller text on narrow screens |
| Responsive images | `w-12 h-9 sm:w-16 sm:h-12` | Thumbnails scale down on mobile |
| Scrollable tabs | `overflow-x-auto` on tab container | Prevents tab overflow at 320px |
| Full-width buttons | `w-full sm:w-auto` | Major actions span full width on mobile |
| Text truncation | `truncate` class | Prevents long song titles from wrapping and breaking layout |
| Safe area | `safe-bottom` class on guest pages | Adds padding for notched/home-bar phones |
| Breakpoint | `sm:` (640px) | The single breakpoint used for desktop enhancements |

---

## Accessibility Notes

- **Focus states**: All interactive elements (buttons, inputs, links, tabs) must have a visible focus indicator. Standard: `focus:ring-2 focus:ring-purple-500`.
- **External links**: All links opening in a new tab must include `rel="noopener noreferrer"` alongside `target="_blank"`.
- **Destructive actions**: Delete operations require a confirmation dialog before executing.
- **Multi-signal state**: Color must never be the sole indicator of state. Always combine color with at least one of: icon, text label, or shape change.
- **Decorative images**: Thumbnails and album art use `alt=""` since they are decorative and adjacent to text labels.
- **Icon-only buttons**: Must include a `title` attribute describing the action (e.g., `title="Remove request"`).

---

## Per-Page Validation Checklist

Use these checklists when building or reviewing each page to confirm all design guidelines are met.

### GuestEvent

- [ ] Ghibli background renders with animation
- [ ] Search bar placeholder shows "Smart song search (YouTube, SoundCloud)"
- [ ] Song titles link to source URL in new tab
- [ ] Thumbnails link to source URL in new tab
- [ ] Thumbs-up icon shows filled when voted
- [ ] X button appears only for sole-voter requests
- [ ] Delete confirmation works
- [ ] Rank numbers align with tabular-nums
- [ ] Footer text displays when set
- [ ] Safe-bottom padding present
- [ ] All content visible at 320px width

### EventManager

- [ ] 4 tabs fit on mobile (320px)
- [ ] Footer text input saves correctly
- [ ] Download folder browse button opens FolderBrowser
- [ ] Library scan browse button opens FolderBrowser
- [ ] Song titles/thumbnails are clickable links
- [ ] Messages tab loads contacts on first select
- [ ] Rank numbers use tabular-nums w-7

### EventClosed

- [ ] Ghibli background renders
- [ ] Contact form submits successfully
- [ ] Footer text displays when set

### DJDashboard

- [ ] Login/create flows work
- [ ] Event cards responsive at 320px
