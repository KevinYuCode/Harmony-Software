---
name: shadcn-ui
description: Use when building UI features, adding components, or creating new pages. Ensures we use existing shadcn/ui components before building custom ones. TRIGGER when creating or modifying UI, adding features with visual elements, or when the user asks about components.
allowed-tools: Read, Grep, Glob, Bash(npx shadcn@latest *)
---

# shadcn/ui Component Library

When building any UI feature, **always check for existing shadcn/ui components first** before writing custom components.

## Project Setup

- **Component location**: `packages/ui/src/components/`
- **Import alias**: `@harmony/ui/components`
- **Utils alias**: `@harmony/ui/lib/utils`
- **Hooks alias**: `@harmony/ui/hooks`
- **Config**: `packages/ui/components.json`
- **Style**: `radix-nova` with CSS variables, Tailwind, and `lucide` icons

## Already Installed Components

Check which components are already installed:

!`ls /Users/kevinyu/git/harmony-software/packages/ui/src/components/ 2>/dev/null | sed 's/\.tsx$//'`

## Available shadcn/ui Components (Full Catalog)

Reference: https://ui.shadcn.com/docs/components

| Component | Use When |
|-----------|----------|
| Accordion | Collapsible content sections |
| Alert | Status messages, warnings, info banners |
| Alert Dialog | Destructive/important confirmations |
| Aspect Ratio | Consistent media ratios |
| Avatar | User profile images/initials |
| Badge | Status indicators, labels, tags |
| Breadcrumb | Navigation path display |
| Button | Actions, form submissions |
| Button Group | Related button sets |
| Calendar | Date display/selection |
| Card | Content containers with header/footer |
| Carousel | Scrollable content galleries |
| Chart | Data visualization |
| Checkbox | Boolean/multi-select inputs |
| Collapsible | Expandable content areas |
| Combobox | Searchable select dropdown |
| Command | Command palette / searchable lists |
| Context Menu | Right-click menus |
| Data Table | Complex table with sorting/filtering/pagination |
| Date Picker | Date input fields |
| Dialog | Modal overlays |
| Drawer | Slide-in panels (mobile-friendly) |
| Dropdown Menu | Action menus on click |
| Empty | Empty state placeholders |
| Field | Form field wrapper with label/description/error |
| Hover Card | Preview content on hover |
| Input | Text input fields |
| Input Group | Grouped inputs with addons |
| Input OTP | One-time password entry |
| Kbd | Keyboard shortcut display |
| Label | Form input labels |
| Menubar | Application menu bars |
| Native Select | Browser-native select dropdowns |
| Navigation Menu | Site navigation with submenus |
| Pagination | Page navigation controls |
| Popover | Floating content panels |
| Progress | Progress bars |
| Radio Group | Single-select from options |
| Resizable | Resizable panel layouts |
| Scroll Area | Custom scrollable containers |
| Select | Styled select dropdowns |
| Separator | Visual dividers |
| Sheet | Side panel overlays |
| Sidebar | Application sidebar navigation |
| Skeleton | Loading placeholders |
| Slider | Range value selection |
| Sonner | Toast notifications |
| Spinner | Loading indicators |
| Switch | Toggle on/off |
| Table | Data display in rows/columns |
| Tabs | Tabbed content sections |
| Textarea | Multi-line text input |
| Toast | Temporary notifications |
| Toggle | Pressable on/off buttons |
| Toggle Group | Groups of toggles |
| Tooltip | Hover hints |
| Typography | Styled text elements |

## Workflow

### 1. Identify Needed Components

Before writing ANY UI code, map the feature requirements to shadcn/ui components:

- **Forms?** → Input, Label, Field, Select, Checkbox, Radio Group, Switch, Textarea, Button
- **Data display?** → Table, Data Table, Card, Badge, Avatar
- **Navigation?** → Sidebar, Tabs, Breadcrumb, Navigation Menu, Pagination
- **Feedback?** → Alert, Sonner (toast), Dialog, Progress, Skeleton, Spinner
- **Overlays?** → Dialog, Sheet, Drawer, Popover, Dropdown Menu, Tooltip
- **Layout?** → Card, Separator, Scroll Area, Resizable, Accordion, Collapsible

### 2. Install Missing Components

If a needed component is not yet installed, add it to the shared UI package:

```bash
cd packages/ui && npx shadcn@latest add <component-name>
```

For multiple components:
```bash
cd packages/ui && npx shadcn@latest add <component1> <component2> <component3>
```

### 3. Import in App Code

```tsx
import { Button } from "@harmony/ui/components/button"
import { Card, CardHeader, CardTitle, CardContent } from "@harmony/ui/components/card"
```

### 4. Compose for Complex Features

Build complex UI by **composing** shadcn/ui primitives. Only create custom components when:

- The UI is truly unique and no combination of existing components works
- You need a reusable composition of multiple shadcn/ui components (in which case, build it as a composition in the consuming app, not in the shared UI package)

## Rules

1. **NEVER** re-implement what shadcn/ui already provides (buttons, inputs, dialogs, etc.)
2. **ALWAYS** check the installed components list before installing new ones
3. **ALWAYS** install to `packages/ui` — never install shadcn components directly in app directories
4. **PREFER** composition of existing components over custom implementations
5. When in doubt, check https://ui.shadcn.com/docs/components for the component's API and examples
