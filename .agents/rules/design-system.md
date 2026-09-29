# Cirkkl Design System — Mandatory Style Guide

Every new page or component MUST follow this design system exactly. Never deviate from these tokens, patterns, or conventions. This was derived directly from the existing home page and components.

---

## 1. Typography

**Font**: `Inter` (loaded via Google Fonts, weights 300–800)
**Logo / Brand name**: use class `font-geist` (`var(--font-geist)`)

| Role | Tailwind / Style |
|---|---|
| Page H1 | `text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.06] tracking-tight` |
| Section H2 | `text-4xl sm:text-5xl font-bold tracking-tight` |
| Card H3 | `font-bold text-[17px] leading-snug` |
| Section overline | `text-xs font-semibold uppercase tracking-widest` colored `#cfe467` |
| Body / description | `text-lg leading-relaxed` or `text-sm leading-relaxed`, colored `#6E6E73` |
| Small meta label | `text-[12px] font-medium text-[#6E6E73]` |
| Small meta value | `text-[13px] font-medium text-[#111111]` |
| Micro uppercase label | `text-[10px] font-bold uppercase tracking-wider text-[#6E6E73]` |
| Footer headings | `text-xs font-semibold text-[#111111] uppercase tracking-widest` |

---

## 2. Color Palette

Use these exact hex values. **Do not** substitute Tailwind generic colors (blue-500, gray-400, etc.).

| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `#111111` | All primary text, headings |
| `--text-secondary` | `#6E6E73` | Subtitles, meta, secondary text |
| `--accent` | `#cfe467` | Accent / CTA / brand highlight (lime-yellow) |
| `--bg` | `#F7F7F8` | Page background |
| `--card` | `#FFFFFF` | Card / panel backgrounds |
| `--border` | `#E5E5EA` | All borders |
| `--border-subtle` | `#F0F0F0` | Subtle card borders |
| `--border-hover` | `#D1D1D6` | Border on hover |
| `--surface-muted` | `#F5F5F7` | Muted surface (secondary button bg) |
| `--surface-hover` | `#E5E5EA` | Hover state for muted surfaces |

### Accent Usage Rules
- Primary CTA button background: `#cfe467`, text: `#111111`
- Accent shadow: `0 4px 20px rgba(207,228,103,0.35)`
- Overline labels: `color: #cfe467`
- Left accent border on cards: `bg-[#cfe467]`
- Hover highlight on nav links: `hover:bg-[#cfe467]/40`
- Social icon hover: `hover:text-[#cfe467] hover:border-[#cfe467]`
- Free badge: `bg-[#cfe467]`, text `#111111`
- Paid badge: `bg-[#7B61FF]`, text `white`

### Category Color Map (use across ALL event displays)
```ts
const CATEGORY_COLORS = {
  Hackathons:   { bg: "#F3F0FF", text: "#7B61FF" },
  Cultural:     { bg: "#FFF0F5", text: "#FF3B7A" },
  Workshops:    { bg: "#FFF3EE", text: "#FF6B35" },
  Technical:    { bg: "#EBF5FF", text: "#cfe467" },
  Sports:       { bg: "#F0FFF4", text: "#34C759" },
  Seminars:     { bg: "#FFF8EE", text: "#FF9500" },
  Competitions: { bg: "#F8F0FF", text: "#AF52DE" },
  Music:        { bg: "#FFF0F3", text: "#FF2D55" },
};
```

---

## 3. Spacing & Layout

| Concept | Value |
|---|---|
| Max content width | `max-w-7xl mx-auto` |
| Section horizontal padding | `px-6` |
| Section vertical padding | `pb-24 pt-0` or `py-24` depending on context |
| Section heading block bottom margin | `mb-14` |
| Card internal padding | `p-5` |
| Card gap (flex column) | `gap-6` |
| Card meta row gap | `gap-4` |
| Meta icon + text gap | `gap-3` |
| CTA button padding | `px-7 py-3.5` |
| Secondary button padding | `px-5 py-2.5` |
| Nav height | `64px` (fixed) |

---

## 4. Border Radius

Use these specific values — do not use generic Tailwind radius classes.

| Usage | Value |
|---|---|
| Cards / articles | `rounded-xl` (12px) |
| Navbar / dropdown panels | `rounded-2xl` (16px) |
| Category pill cards | `rounded-[24px]` |
| Category icon boxes | `rounded-[16px]` |
| Meta icon squares | `rounded-[10px]` |
| Buttons (primary/secondary) | `rounded-lg` |
| Free/Paid badge | `rounded-[6px]` |
| Accent left border strip | `rounded-full` (the `w-1` bar) |

---

## 5. Shadows

```
--shadow-sm:    0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
--shadow-md:    0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)
--shadow-lg:    0 12px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.05)
--shadow-hover: 0 20px 60px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06)
```

Cards use `border border-[#F0F0F0]` (no shadow by default). On hover: `hover:border-[#D1D1D6]`.
Elevated panels (navbar, overlays) use `border-[0.5px] border-[#E5E5EA]`.

---

## 6. Buttons

### Primary CTA
```tsx
className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold text-[#111111] transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
style={{ background: "#cfe467", boxShadow: "0 4px 20px rgba(207,228,103,0.35)" }}
```

### Secondary / Ghost
```tsx
className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
style={{ color: "#111111", background: "white", border: "1px solid #E5E5EA", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
```

### Muted / Tertiary (e.g. "View all")
```tsx
className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#F5F5F7] text-[#111111] hover:bg-[#E5E5EA] transition-colors"
```

---

## 6.1. Form Fields and Inputs

All text inputs, selects, and textareas must use the exact styling from the login/signup pages. Do not use generic green outlines or default focus rings. Use the `shadcn/ui` `<Input>` component where possible.

### Text Input / Password
```tsx
<Input
  className="h-12 px-4 rounded-xl border-[#E5E5EA] shadow-none focus-visible:ring-0 focus-visible:border-[#9E9EA7]"
/>
```

### Select Dropdown
```tsx
<select
  className="h-12 px-4 rounded-xl border border-[#E5E5EA] bg-transparent text-sm text-[#111111] focus:outline-none focus:border-[#9E9EA7] transition-colors appearance-none"
/>
```

### Textarea
```tsx
<textarea
  className="px-4 py-3 rounded-xl border border-[#E5E5EA] bg-transparent text-sm text-[#111111] placeholder:text-muted-foreground focus:outline-none focus:border-[#9E9EA7] transition-colors resize-none"
/>
```

---

## 7. Card Pattern (Event Card)

```tsx
<article className="relative rounded-xl bg-white overflow-hidden transition-colors duration-300 border border-[#F0F0F0] hover:border-[#D1D1D6]">
  {/* Image at 16:9 aspect ratio */}
  <div className="relative aspect-[16/9] overflow-hidden">
    <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
    {/* Badge top-right */}
    <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-[6px] bg-[#cfe467]">
      <span className="text-[12px] font-bold leading-none text-[#111111]">Free</span>
    </div>
  </div>

  <div className="p-5 flex flex-col gap-6">
    {/* Title block with accent left border */}
    <div className="relative pl-4 flex flex-col justify-center min-h-[48px]">
      <div className="absolute left-0 top-1 bottom-1 w-1 bg-[#cfe467] rounded-full" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6E73] mb-0.5">{organizer}</span>
      <h3 className="font-bold text-[17px] leading-snug text-[#111111] truncate">{title}</h3>
    </div>

    {/* Meta rows */}
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] border border-[#E5E5EA] bg-white flex items-center justify-center shrink-0">
          <Icon size={16} className="text-[#111111]" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col justify-center min-h-[40px]">
          <span className="text-[12px] font-medium text-[#6E6E73] mb-0.5">Label</span>
          <span className="text-[13px] font-medium text-[#111111]">Value</span>
        </div>
      </div>
    </div>
  </div>
</article>
```

---

## 8. Section Heading Pattern

Every section MUST follow this two-level heading structure:

```tsx
{/* Overline */}
<p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#cfe467" }}>
  Category Label
</p>
{/* Heading */}
<h2 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: "#111111" }}>
  Section Title
</h2>
{/* Optional description */}
<p className="mt-3 text-[#6E6E73]">
  Supporting description text.
</p>
```

---

## 9. Navbar

- Fixed, pill-shaped, centered, `top-4`, height `64px`
- Background: `bg-white`, border: `border-[0.5px] border-[#E5E5EA]`, `rounded-2xl`
- Collapses width on scroll past 25% of viewport
- Nav links: `px-4 py-2 rounded-lg text-sm font-medium text-[#6E6E73] hover:bg-[#cfe467]/40 hover:text-[#111111]`
- Always wrap content with `ServerNavbar` (server component that fetches user then renders `<Navbar>`)

---

## 10. Animations & Transitions

Use these CSS classes defined in `globals.css`:

| Class | Effect |
|---|---|
| `animate-fade-up` | Entry animation: fade + translateY(24px to 0) over 0.6s |
| `animate-fade-in` | Entry animation: fade only over 0.5s |
| `float-animation` | Continuous floating bob 6s ease-in-out |
| `card-hover` | Smooth lift + shadow transition on hover |
| `glass` | Glassmorphism: white/72% + blur(20px) + saturation |
| `text-gradient` | #111111 to #cfe467 gradient clip text |
| `scrollbar-hide` | Hide scrollbars (for horizontal scroll strips) |

**Transition conventions**:
- Buttons: `transition-all duration-200`
- Cards: `transition-colors duration-300`
- Image zoom: `transition-transform duration-700`
- Nav collapse: `transition-all duration-500 ease-in-out`

**Easing**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` for all lift/slide transforms

---

## 11. Background Patterns

### Hero-style radial gradient
```tsx
style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,122,255,0.08) 0%, transparent 70%), #F7F7F8" }}
```

### Dot field overlay
Use the `DotField` component from `@/components/ui/DotField`:
```tsx
<DotField color="#cfe467" dotSize={4.5} dotSpacing={32} />
```

### Bottom fade-out (section transition)
```tsx
<div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
```

---

## 12. Page Structure

Every public-facing page MUST use:

```tsx
<>
  <ServerNavbar />
  <main>
    {/* page sections */}
  </main>
  <Footer />
</>
```

Dashboard / authenticated pages use `DashboardTopBar` + `Sidebar` from `components/dashboard/`.

---

## 13. Icons

Use **Lucide React** exclusively. Conventions:
- Meta icons in cards: `size={16}` with `strokeWidth={1.5}`
- UI/action icons: `size={20}` with default strokeWidth
- Hero/decorative: `size={24}` with `strokeWidth={2}`

---

## 14. Glass / Overlay Utility

```css
.glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(229, 229, 234, 0.6);
}
```

---

## 15. Dark Mode Variables

CSS variables auto-switch at `@media (prefers-color-scheme: dark)`:
- `--bg`: `#111111`
- `--card`: `#1C1C1E`
- `--text-primary`: `#F7F7F8`
- `--text-secondary`: `#E5E5EA`
- `--border`: `#38383A`

---

## Quick Reference: Don'ts

- Do NOT use plain Tailwind color classes (`text-gray-500`, `bg-blue-600`) — always use the hex values above
- Do NOT use a different font family
- Do NOT use `rounded-full` on cards/buttons (only on small accent strips)
- Do NOT add box-shadow to cards — use border changes for hover state instead
- Do NOT skip the overline `<p>` before section `<h2>` headings
- Do NOT use a section without `max-w-7xl mx-auto` inner wrapper and `px-6` padding
- Do NOT wrap public pages without `<ServerNavbar />` and `<Footer />`
