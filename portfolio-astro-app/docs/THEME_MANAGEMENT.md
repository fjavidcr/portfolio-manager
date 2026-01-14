# Theme Management Guide

This document explains how color themes are managed in this project using Tailwind CSS 4.1 and daisyUI 5.5.

## Tech Stack

- **Tailwind CSS 4.1** - CSS-first configuration approach
- **daisyUI 5.5** - Component library with built-in theming
- **Astro + Vue** - Framework stack

## Architecture Overview

Our theming system uses a **three-layer CSS-first architecture** to ensure complete control over colors while maintaining compatibility with both Tailwind and daisyUI.

### Layer 1: Base Color Definitions

All theme colors are defined explicitly in `src/styles/global.css`:

```css
:root {
    /* Light Theme */
    --color-primary: #2b5ea7;
    --color-secondary: #555f71;
    --color-surface: #fbf8fd;
    /* ... more colors */
}

.dark, [data-theme="dark"] {
    /* Dark Theme */
    --color-primary: #448aff;
    --color-secondary: #bfc6dc;
    --color-surface: #121212;
    /* ... more colors */
}
```

### Layer 2: Tailwind Integration

Variables are mapped in the `@theme` block to generate Tailwind utilities:

```css
@theme {
    --color-primary: var(--color-primary);
    --color-secondary: var(--color-secondary);
}
```

This enables utilities like `text-primary`, `bg-secondary`, etc.

### Layer 3: Custom Color Classes

Domain-specific colors (like transaction types) are defined as custom classes:

```css
:root {
    --tx-rose-bg: color-mix(in oklab, var(--color-error), white 90%);
    --tx-rose-text: var(--color-error);
}

.tx-rose-bg {
    background-color: var(--tx-rose-bg);
}
```

## Theme Switching

Theme switching is implemented in `src/layouts/Layout.astro` and `src/shared/components/Sidebar.astro`:

```javascript
const applyTheme = () => {
    const isDark = /* your logic */;

    // CRITICAL: Set both for maximum compatibility
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
};
```

**Why both?**
- `.dark` class → Triggers our custom CSS variables
- `data-theme` attribute → Required for daisyUI components

## Precedence Chain

Understanding the order of precedence is crucial (highest to lowest):

1. **CSS Variables in `:root` / `.dark`** ⭐ **Our approach**
2. `@theme` block
3. `@plugin` defaults (daisyUI)
4. ~~`tailwind.config.js`~~ (deprecated for theming in v4)

## Why This Approach?

### Tailwind v4 Changes
- **Before v4**: JavaScript config was the source of truth
- **v4+**: CSS (`@theme`) is now the primary configuration method
- JS configs still work but have **lower priority**

### daisyUI Considerations
- DaisyUI injects default values (including pink/violet as primary)
- These defaults only override if you don't define the variables first
- By defining variables in `:root`, we **prevent** daisyUI defaults from appearing

### Benefits
✅ Complete control over color palette
✅ No surprise defaults from libraries
✅ Single source of truth (`global.css`)
✅ Compatible with both Tailwind v4 and daisyUI
✅ No need for external JS configuration

## Best Practices

### ✅ DO

- Define all colors explicitly in `:root` and `.dark` with hex values
- Use `color-mix()` for color variations (lighter/darker)
- Maintain consistent naming (`--color-*` for base, `--tx-*` for domain-specific)
- Map all used colors in `@theme` to enable Tailwind utilities
- Set both `.dark` class and `data-theme` attribute when switching themes

### ❌ AVOID

- Relying on `tailwind.config.mjs` for theme colors (poor support in v4)
- Using daisyUI color variables directly without overriding them
- Mixing nomenclature systems (stick to daisyUI's `--color-*` convention)
- Depending on library defaults

## Adding New Colors

To add a new theme color:

1. **Define in both themes:**
```css
:root {
    --color-new: #123456;
}

.dark {
    --color-new: #abcdef;
}
```

2. **Map in @theme:**
```css
@theme {
    --color-new: var(--color-new);
}
```

3. **Use via Tailwind utilities:**
```html
<div class="text-new bg-new">...</div>
```

Or via custom classes:
```css
.my-custom-class {
    color: var(--color-new);
}
```

## Color Naming Convention

We follow this naming structure:

- `--color-primary`, `--color-secondary` - Main brand colors
- `--color-surface`, `--color-on-surface` - Background/foreground pairs
- `--color-error`, `--color-success`, `--color-warning`, `--color-info` - Semantic colors
- `--tx-{name}-{property}` - Transaction-specific colors (domain logic)

## Troubleshooting

### "I see pink/violet colors instead of my theme"
This means daisyUI defaults are showing through. Ensure:
1. Your variables are defined in `:root` (before `@plugin "daisyui"` loads)
2. You're not using daisyUI color variables directly (like `--color-base-*`) without overriding them
3. The `@theme` block includes all colors you're using

### "Dark mode isn't working"
Check that:
1. Both `.dark` class AND `data-theme="dark"` are set on `<html>`
2. Your dark theme variables are defined in the `.dark, [data-theme="dark"]` selector
3. The theme toggle logic updates both attributes

### "Tailwind utilities don't work for my custom color"
Make sure:
1. The color is defined in `:root` / `.dark`
2. It's mapped in the `@theme` block
3. You're using the correct utility name (e.g., `text-primary` for `--color-primary`)

## File Structure

```
src/
  styles/
    global.css          # Main theme configuration
  layouts/
    Layout.astro        # Theme initialization & toggle (mobile)
  shared/
    components/
      Sidebar.astro     # Theme toggle (desktop)
```

## References

- [Tailwind CSS 4 - Adding Custom Styles](https://tailwindcss.com/docs/adding-custom-styles)
- [daisyUI Themes Documentation](https://daisyui.com/docs/themes/)
- Main configuration: `src/styles/global.css`

---

**Last Updated**: January 2026
**Tailwind Version**: 4.1.18
**daisyUI Version**: 5.5.14
