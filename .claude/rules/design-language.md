# Design language

The template ships a calm, warm aesthetic. Don't drift unless the fork genuinely needs a different feel.

## Palette

Light theme:
- Background `#F6F1E8` (warm off-white)
- Foreground `#3A3A36` (soft charcoal)
- Muted `rgba(58,58,54,0.55)`
- Subtle `rgba(58,58,54,0.35)`

Dark theme:
- Background `#1F1E1A`
- Foreground `#E9E4D7`
- Muted `rgba(233,228,215,0.55)`
- Subtle `rgba(233,228,215,0.35)`

Accent palette (user-selectable, pick one as fork default):
- Sage `#B8C4A9`
- Blue `#A9B6C4`
- Lavender `#C9BFD3`
- Beige `#D4C9B5`

## Typography

- Font: **Geist** (Google Fonts, weights 300 / 400 / 500 / 600). Falls back to `system-ui`.
- Body: 14–15px
- Titles: 26–28px, weight 400, tight letter-spacing (`-0.6` to `-1.5`)
- Labels (uppercase, tracked): 11px, letter-spacing 2, muted color
- Monospace (`ui-monospace, SFMono-Regular, Menlo`): only for commit hashes, user-agent strings, storage value previews

## Spacing

- Card radius: 16px
- Card padding: 13–16px vertical, 18–20px horizontal per row
- Between cards: 20–24px margin-bottom
- Screen side-padding: 20–28px
- Top padding on screens: 62px (safe-area + visual rhythm)

## Motion

- Transitions 200–600ms, ease curves (`cubic-bezier(0.2, 0.6, 0.2, 1)` or `ease`)
- No springs, no bounces
- Splash fade: 700ms
- Theme swap: 400ms
- Orb / radial tint: 600ms on accent change

## Controls

- Buttons are **pill-shaped** (`border-radius: 999`)
- Primary action: dark bg in light mode, light bg in dark mode
- Danger: muted reddish (`#8A3A3A` on light, `#C9A9A9` on dark)
- Toggle: 44×26 pill with 20×20 circle, 200ms slide
- Segmented control: inline-flex on a soft-background track, 999 radius
- Dropdowns: native `<select>` with `-webkit-appearance: none` + soft background

## Cards + Rows

Reuse this mental model for Settings and Dev panel:

```
<Card title="Section">
  <Row label="Label">{value or control}</Row>
  <Row label="Label" stack>{long value wraps below label}</Row>
  <Row label="Label" last>{...}</Row>
</Card>
```

Rows inside a card separated by 0.5px border. Last row in a card has no separator.

## Icons

Flat-color SVG tiles. **No logos** (invariant #9). Simple geometric shapes if anything — a filled rect is fine for the PWA icon.
