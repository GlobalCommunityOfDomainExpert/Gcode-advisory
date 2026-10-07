# Components

Four layers. A component only imports from its own layer or the ones above it in this list.

| Layer | What goes here | Examples |
|---|---|---|
| `atoms/` | One job, no knowledge of GCODE. Native element + styling. | `Button`, `Input`, `Badge`, `Avatar`, `Switch` |
| `molecules/` | Atoms combined into a generic working unit. No product data. | `FormField`, `Tabs`, `Modal`, `Banner`, `Table`, `StepIndicator` |
| `layout/` | Page chrome and shells: navigation, headers, frames. | `Navbar`, `Sidebar`, `AuthedShell`, `GuestShell`, `PageHeader`, `Toast` |
| `domain/` | Advisory-specific pieces. They take plain view-model props, never raw API data. | `DirCard`, `BookingRow`, `BookingDialog`, `CalendarPicker`, `ProfileSection` |

Each folder has an `index.ts` barrel. Import from the barrel (`@/components/atoms`) or the file (`@/components/atoms/button`).

## Conventions

- **Props:** variants are named props with a closed union (`variant`, `tone`, `size`). A prop exists only if a state in Storybook uses it.
- **Customising:** every leaf component forwards `className` (merged with `cn`) and native props. Don't override a variant's colours with `className`; add a variant instead.
- **State:** components that hold a choice (`Tabs`, `ToggleGroup`) accept `value` + `onChange` (controlled) or `defaultValue` (uncontrolled). Dismissable menus use `useDismiss` (outside click and Escape).
- **Dialogs:** build on `Modal` (portal, Escape, scroll lock, focus return). `inline` renders in place for previews.
- **Shared recipes:** focus rings live in `@/lib/ui`, class joining in `@/lib/cn`, initials in `@/lib/initials`.
- **Shells:** `AuthedShell` = every signed-in page (navbar + collapsible sidebar, hidden on `/call` and `/checkout`). `GuestShell` = signed-out pages. `AppShell` is the bare frame both use.

## Stories

`.storybook/stories/components/<layer>/<name>.stories.tsx`. Each component has a `States` story laid out like the wireframe components page (`wireframe/index.html#components`); keep it in sync when a state changes.
