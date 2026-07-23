---
name: token-keeper
description: Enforces design system consistency when building UI components. Use when creating React/Vue/Svelte components, styling with Tailwind/CSS, or when the user mentions design tokens, component patterns, or UI consistency.
---

# Design System

Ensure consistent, accessible UI components that follow design system principles.

## Quick Start

Before writing any component:
1. Check for existing similar components in the codebase
2. Use design tokens (colors, spacing, typography) instead of hardcoded values
3. Follow the component patterns established in the project

## Design Tokens

Always use semantic naming over raw values:

```tsx
// Good - semantic tokens
className="text-primary bg-surface-elevated shadow-md"

// Bad - hardcoded values
className="text-blue-600 bg-white shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
```

## Component Patterns

### Props Interface
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
}
```

### Composition Pattern
```tsx
// Prefer composition over prop explosion
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

## Spacing Scale

Use consistent spacing based on a scale (typically 4px base):
- `gap-1` = 4px
- `gap-2` = 8px
- `gap-4` = 16px
- `gap-6` = 24px
- `gap-8` = 32px

## Typography Scale

Use semantic typography classes:
- `text-xs` - Caption, labels
- `text-sm` - Body small, secondary text
- `text-base` - Body default
- `text-lg` - Body large, emphasis
- `text-xl` to `text-4xl` - Headings

## Color Usage

| Purpose | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Primary action | `bg-blue-600` | `bg-blue-500` |
| Surface | `bg-white` | `bg-gray-900` |
| Elevated | `bg-gray-50` | `bg-gray-800` |
| Border | `border-gray-200` | `border-gray-700` |
| Text primary | `text-gray-900` | `text-white` |
| Text secondary | `text-gray-600` | `text-gray-400` |

## Component Checklist

Before completing a component, verify:
- [ ] Uses design tokens, not hardcoded values
- [ ] Supports dark mode via `dark:` variants
- [ ] Has consistent spacing with siblings
- [ ] Typography matches the established scale
- [ ] Interactive states (hover, focus, active, disabled)
- [ ] Follows existing naming conventions