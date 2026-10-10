---
name: Glacial Frost
colors:
  surface: '#f8f9ff'
  surface-dim: '#c9dcf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e4efff'
  surface-container-high: '#dae9ff'
  surface-container-highest: '#d1e4fe'
  on-surface: '#091d2f'
  on-surface-variant: '#3f4850'
  inverse-surface: '#203245'
  inverse-on-surface: '#e9f1ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#006686'
  on-secondary: '#ffffff'
  secondary-container: '#7ed4fd'
  on-secondary-container: '#005b78'
  tertiary: '#783eb2'
  on-tertiary: '#ffffff'
  tertiary-container: '#9358cd'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#c0e8ff'
  secondary-fixed-dim: '#7bd1fa'
  on-secondary-fixed: '#001e2b'
  on-secondary-fixed-variant: '#004d66'
  tertiary-fixed: '#f0dbff'
  tertiary-fixed-dim: '#ddb8ff'
  on-tertiary-fixed: '#2c0051'
  on-tertiary-fixed-variant: '#62259b'
  background: '#f8f9ff'
  on-background: '#091d2f'
  surface-variant: '#d1e4fe'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 2rem
  space-xl: 3rem
---

## Brand & Style

This design system channels an ethereal, crystalline aesthetic grounded in precision science and Arctic landscape cartography. It combines advanced glassmorphism with high visual clarity, delivering an interface that feels carved from translucent ice sheets, cold meltwater, and polar mist.

### Core Philosophy & Personality
- **Luminous & Subzero:** Visual layers feel atmospheric and chilled, using backdrop refraction, pristine light refraction, and subtle frosty glows.
- **Scientific Precision:** Despite the organic curves and translucent depths, typographic structure, tabular data arrangements, and micro-metrics maintain high analytical rigour.
- **Weightless & Fluid:** Interaction states evoke liquid glass—smooth optical shifts, glowing inner rims, and effortless gliding surfaces.

### Aesthetic Movement
Glassmorphism elevated through tactile subzero optics:
- Extensive layered frosted glass planes (`backdrop-filter: blur(16px - 28px)`).
- Subdued spectral rim lighting (crisp, semi-translucent polar white and chilled sky hairline boundaries).
- Deep polar navy contrast ensuring crisp readability across optical refractions.

## Colors

The palette reproduces the optical dispersion of sunlight through deep glacier crevasses and arctic pack ice. Every tone is cold-cast to prevent muddy neutrals or warm off-whites.

### Color Tiers & Specifications

- **Canvas & Backgrounds:**
  - Base Background: `#f4f8fb` (pure glacial snow melt).
  - Secondary Underlay: `#edf4f9` (crystalline pale wash).
  - Ambient Horizon Glows: Subtle radial gradients blending `#e0f2fe` and `#f8fafc`.

- **Surfaces & Glass Containers:**
  - Standard Frost Plate: `rgba(255, 255, 255, 0.72)` paired with `backdrop-filter: blur(20px) saturate(180%)`.
  - Elevated Frost Tier: `rgba(255, 255, 255, 0.88)` with `backdrop-filter: blur(32px)`.
  - Sunken / Recessed Wells: `rgba(237, 244, 249, 0.60)`.

- **Typography & Content:**
  - Primary Text: `#0d1d2d` (Polar Navy—sharp, high-contrast, deep tonal weight).
  - Secondary Text: `#576f84` (Glacial Mist Slate).
  - Tertiary / Disabled Text: `#8fa4b8` (Frozen Vapor).

- **Accents & States:**
  - Primary Accent (`#0284c7`): Glacial Azure. Used for primary interactive highlights, callouts, and key data nodes.
  - Secondary Accent (`#7dd3fc`): Shimmering Arctic Cyan. Used for glow effects, toggles, badges, and active indicator halos.
  - Tertiary Accent (`#c084fc`): Auroral Periwinkle. Used for exploratory tags, special states, and secondary telemetry indicators.

- **Borders & Micro-Edges:**
  - Primary Specular Rim: `rgba(255, 255, 255, 0.85)` (top and left light incidence).
  - Secondary Cold Border: `rgba(180, 205, 225, 0.40)` (bottom and right shadow boundary).

## Typography

Typography pairs technical geometric calculation with welcoming modern ergonomics.

- **Headlines & Metric Readouts (Space Grotesk):** Gives data visualization, KPIs, headers, and section flags a cutting-edge scientific field-instrument demeanor.
- **Body & Continuous Reading (Plus Jakarta Sans):** Its rounded humanist features echo the curvy curvature of frosted panels, ensuring effortless legibility through subtle frosted backdrops.
- **Labels & Micro-Data (Space Grotesk):** Styled with slight uppercase transformation and wide tracking (`0.06em` to `0.08em`) to mirror lab instrument readouts and polar telemetry panels.

## Layout & Spacing

The layout philosophy uses a **fluid 12-column grid** anchored by generous outer negative space that lets translucent panels breathe without visually crashing into one another.

### Layout Principles
- **Atmospheric Margins:** Broad padding allows the light-refracting background layers to frame panels cleanly.
- **Layered Spatial Tiers:** Visual clusters exist within unified frosted enclosures rather than cramped independent cells, minimizing border clutter.
- **Breakpoints:**
  - `Mobile` (< 640px): 4-column layout; gutter `1rem`; canvas margin `1.25rem`. Cards stretch edge-to-edge with continuous glass sheets.
  - `Tablet` (640px - 1024px): 8-column layout; gutter `1.25rem`; canvas margin `2rem`.
  - `Desktop` (> 1024px): 12-column layout; gutter `1.5rem`; canvas margin `3rem`; maximum content containment width `1440px`.

## Elevation & Depth

Visual hierarchy does not use murky grey drop shadows; it relies on **glass translucency, refractive blur gradients, and sky-tinted ambient dispersion**.

### Depth Layers

1. **Base Terrain (Z-0):** The cold tinted canvas (`#f4f8fb`) featuring soft ambient dispersion spheres (`#e0f2fe` at 40% opacity with 120px blur).
2. **Resting Glass Panel (Z-1):** 
   - Surface: `rgba(255, 255, 255, 0.70)`
   - Backdrop Filter: `blur(20px) saturate(160%)`
   - Border: `1px solid rgba(255, 255, 255, 0.85)`
   - Shadow: `0 8px 32px -8px rgba(13, 29, 45, 0.05), 0 2px 12px rgba(2, 132, 199, 0.03)`
3. **Hovered / Interactive Surface (Z-2):**
   - Surface: `rgba(255, 255, 255, 0.84)`
   - Backdrop Filter: `blur(28px) saturate(180%)`
   - Border: `1px solid rgba(255, 255, 255, 0.95)`
   - Shadow: `0 16px 40px -12px rgba(2, 132, 199, 0.12), 0 4px 16px -2px rgba(13, 29, 45, 0.04)`
   - Rim Light: `inset 0 1px 1px 0 rgba(255, 255, 255, 0.90)`
4. **Floating Overlays & Modals (Z-3):**
   - Surface: `rgba(255, 255, 255, 0.92)`
   - Backdrop Filter: `blur(40px) saturate(200%)`
   - Border: `1px solid rgba(255, 255, 255, 1.0)`
   - Shadow: `0 24px 64px -16px rgba(2, 132, 199, 0.18), 0 8px 24px -4px rgba(13, 29, 45, 0.08)`

## Shapes

The design system embraces high-radius curvature reminiscent of natural ice melt, polished sea glass, and aerodynamic observation pods.

- **Base Radius Architecture:**
  - Micro-interactives (Tags, Badges, Standard Buttons): Fully pill-shaped (`border-radius: 9999px`).
  - Small Form Controls (Inputs, Dropdown triggers): Pill or curved capsule (`20px` to `24px`).
  - Medium Modules & Nested Cards: `24px` radius.
  - Large Primary Panels & Floating Windows: Generous `32px` corner radius.
- **Geometric Softness:** Hard 90-degree corners are strictly forbidden. Internal content containers inherit concentric curvature (e.g., outer card `32px`, nested element `20px` with `12px` gap) to preserve optical resonance.

## Components

### Buttons
- **Primary Action:** Solid Glacial Azure (`#0284c7`) with subtle linear gradient transition to `#0ea5e9`. Pill-shaped (`rounded-full`), text in pure white (`#ffffff`). Internal specular highlight `inset 0 1px 0 rgba(255, 255, 255, 0.35)`. Soft cyan hover bloom: `box-shadow: 0 8px 20px -4px rgba(2, 132, 199, 0.35)`.
- **Frosted Secondary:** Translucent glass fill `rgba(255, 255, 255, 0.65)`, backdrop blur `12px`. Hairline border `rgba(255, 255, 255, 0.90)`. Text in Polar Navy (`#0d1d2d`).
- **Ghost Action:** Pure transparent background; text in Polar Navy; acquires `rgba(224, 242, 254, 0.5)` background tint on hover.

### Chips & Badges
- Pill-shaped capsule (`rounded-full`) with uppercase Space Grotesk tracking (`label-sm`).
- Background: `rgba(255, 255, 255, 0.70)` with a subtle double border illusion (`box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8), 0 0 0 2px rgba(180, 205, 225, 0.25)`).
- Active chips feature an icy cyan dot indicator (`#0ea5e9`) with an ambient pulse glow.

### Cards & Panels
- Constructed from `24px` or `32px` rounded glass slabs.
- Edge refinement: Top border highlighted with `rgba(255, 255, 255, 0.95)`, transitioning to `rgba(180, 205, 225, 0.35)` on the bottom boundary.
- Content padding set generously at `space-lg` (`2rem`) to prevent textual elements from colliding with the pronounced corner radii.

### Input Fields
- Capsule profile (`rounded-full` or `24px` radius).
- Fill: `rgba(255, 255, 255, 0.60)` with `backdrop-filter: blur(12px)`.
- Resting border: `1px solid rgba(190, 215, 235, 0.50)`.
- Focus state: Surface turns pure white (`rgba(255, 255, 255, 0.95)`), border becomes `#0284c7`, with a soft ring shadow `0 0 0 4px rgba(125, 211, 252, 0.35)`. Placeholder text in Glacial Mist Slate (`#576f84`).

### Checkboxes & Radio Controls
- Radio controls are fully circular (`rounded-full`); checkboxes feature soft squircle contours (`rounded-md`, 8px).
- Resting state: `rgba(255, 255, 255, 0.8)` with ice-blue border.
- Selected state: Filled with Glacial Azure (`#0284c7`) featuring an embossed white glyph and micro aqua shadow ring.

### Floating Status Glass Bars
- Detached navigation strips and bottom toolbars hover above canvas margins.
- Rendered with `32px` or `rounded-full` curvature, heavy `backdrop-filter: blur(28px)`, and polar-white specular highlight lines (`rgba(255, 255, 255, 0.9)`).