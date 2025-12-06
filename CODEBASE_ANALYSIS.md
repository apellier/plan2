# Room Planner CAD Web App - Comprehensive Codebase Analysis

**Date:** December 6, 2025
**Project:** neoplan-nextjs (Room Planner)
**Stack:** Next.js 16, React 19, Zustand, TypeScript, Tailwind CSS 4

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Codebase Structure](#codebase-structure)
3. [Completed Improvements](#completed-improvements)
4. [Remaining Items](#remaining-items)
5. [Feature Proposals](#feature-proposals)

---

## Architecture Overview

### Technology Stack
- **Framework:** Next.js 16.0.7 with App Router
- **UI Library:** React 19.2.0
- **State Management:** Zustand 5.0.9
- **Styling:** Tailwind CSS 4 with custom theme
- **Icons:** Lucide React
- **Utilities:** UUID v13 for ID generation

### Design Pattern
The application follows a **layered SVG rendering architecture**:
- **Canvas** acts as the main orchestrator
- **Layer components** (GridLayer, ZoneLayer, RoomLayer, MeasurementLayer, etc.) handle rendering
- **Renderer components** (RoomShapeRenderer, FurnitureRenderer, etc.) render individual items
- **Custom hooks** for interaction logic and keyboard shortcuts
- **Zustand store** provides global state management with history and settings

### Data Flow
```
User Input → Canvas → useCanvasInteraction hook → Zustand Store → Layer Components → Renderers
                ↓
         useKeyboardShortcuts hook (global shortcuts)
```

---

## Codebase Structure

```
src/
├── app/
│   ├── page.tsx          # Main page with Toolbar, Canvas, and dialogs
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles + Tailwind theme
├── components/
│   ├── Canvas.tsx        # Main canvas orchestrator (~520 lines)
│   ├── Toolbar.tsx       # Top toolbar with tools, undo/redo, clipboard, file ops
│   ├── PropertiesPanel.tsx    # Right-side properties editor
│   ├── FurnitureLibrary.tsx   # Furniture palette with categories & search
│   ├── SettingsPanel.tsx      # Unit system and grid settings (NEW)
│   ├── RoomTemplates.tsx      # Room template selector (NEW)
│   ├── ExportDialog.tsx       # PNG/SVG export dialog (NEW)
│   ├── RoomShape.tsx          # Room shape renderer
│   ├── ZoneRenderer.tsx       # Zone renderer
│   ├── FurnitureRenderer.tsx  # Furniture renderer
│   ├── WallItemRenderer.tsx   # Door/Window renderer
│   ├── TextRenderer.tsx       # Text annotation renderer
│   ├── FreehandRenderer.tsx   # Freehand drawing renderer
│   └── layers/
│       ├── GridLayer.tsx       # Scrollable grid layer
│       ├── ZoneLayer.tsx
│       ├── RoomLayer.tsx
│       ├── FurnitureLayer.tsx
│       ├── WallItemLayer.tsx
│       ├── AnnotationLayer.tsx
│       ├── MeasurementLayer.tsx  # Distance measurement rendering (NEW)
│       └── InteractionLayer.tsx
├── hooks/
│   ├── useCanvasInteraction.ts  # Centralized interaction logic with grid snapping
│   └── useKeyboardShortcuts.ts  # Global keyboard shortcuts
└── lib/
    ├── store.ts        # Zustand state with settings, measurements, clipboard
    ├── types.ts        # TypeScript type definitions (expanded)
    ├── geometry.ts     # Geometry utility functions
    ├── constants.ts    # Centralized constants, furniture catalog, room templates
    └── units.ts        # Unit conversion utilities (NEW)
```

---

## Completed Improvements

### Phase 1: Critical Bug Fixes

| Issue | Status | Description |
|-------|--------|-------------|
| Duplicate useEffect hooks | **FIXED** | Removed 3 duplicate useEffect blocks from Canvas.tsx |
| Pan tool broken | **FIXED** | Added proper `setDragAction('PANNING')` and pan logic |
| Update operations not undoable | **FIXED** | All update functions now call `saveToHistory()` |
| Grid not scrolling | **FIXED** | Grid now calculates bounds based on viewBox |
| Unused SelectionMenu.tsx | **FIXED** | Deleted unused component |
| Infinite loop in useKeyboardShortcuts | **FIXED** | Added `useShallow` wrapper to prevent re-render loop |

### Phase 2: Essential Features

| Feature | Status | Description |
|---------|--------|-------------|
| Keyboard shortcuts | **DONE** | Full shortcut support (V, R, Z, D, W, P, T, F, M, Space, Escape, Delete, Ctrl+Z/Y/C/V/D/A) |
| Zoom with scroll wheel | **DONE** | Mouse wheel zoom centered on cursor position |
| Copy/Paste/Duplicate | **DONE** | Ctrl+C/V/D with proper cloning and ID regeneration |
| Save/Load projects | **DONE** | Export to JSON file, import from JSON file |
| Undo/Redo buttons | **DONE** | Added to toolbar with proper enable/disable states |
| Auto-switch to SELECT | **DONE** | After creating room/zone/drawing, tool switches to SELECT |
| Constants file | **DONE** | Centralized constants for grid size, thresholds, defaults |
| TypeScript improvements | **DONE** | Removed `any` types from PropertiesPanel |
| Zoom indicator | **DONE** | Shows current zoom level in bottom-left corner |
| Clear all button | **DONE** | With confirmation dialog |

### Phase 3: New Features (Latest)

| Feature | Status | Description |
|---------|--------|-------------|
| Unit System | **DONE** | Choose between metric (mm, cm, m) and imperial (in, ft). Settings panel with unit selector. |
| Grid Snapping Toggle | **DONE** | Toggle in toolbar, configurable grid size, grid visibility toggle in settings |
| Room Templates | **DONE** | 5 preset shapes: Rectangle, Square, L-Shape, U-Shape, T-Shape. Quick creation from template dialog. |
| Furniture Catalog Expansion | **DONE** | 30+ furniture items in 7 categories (Bedroom, Living, Dining, Office, Bathroom, Kitchen, Outdoor). Search and collapsible categories. |
| Measurements Tool | **DONE** | New tool (M shortcut) to measure distances. Displays measurements in selected unit system. Persistent measurements on canvas. |
| Export as PNG/SVG | **DONE** | Export dialog with format selection, scale options (1x-4x for PNG), background color selection. |

### Code Quality Improvements

| Improvement | Status | Description |
|-------------|--------|-------------|
| Canvas.tsx refactored | **DONE** | Modular structure with measurement tool support |
| useKeyboardShortcuts hook | **DONE** | Extracted keyboard handling with M shortcut |
| useCanvasInteraction hook | **DONE** | Added grid snapping integration |
| constants.ts | **DONE** | Expanded with unit conversions, furniture catalog, room templates |
| units.ts | **DONE** | New utility file for unit conversions and formatting |
| store.ts | **DONE** | Added settings state, measurements, and new actions |

---

## Remaining Items

### Medium Priority Bugs

| Issue | Location | Description |
|-------|----------|-------------|
| Text selection box width | `TextRenderer.tsx:22` | Uses magic number (0.6) for font width estimate |
| Zone rotation not connected | `ZoneLayer.tsx` | `onRotate` prop not passed to ZoneRenderer |
| Wall item distance calculation | `WallItemRenderer.tsx:142` | Distance calculation may be incorrect for rotated items |

### UX Improvements Needed

| Issue | Description | Priority |
|-------|-------------|----------|
| Multi-selection properties | Properties panel only shows last selected | Medium |
| Dimension overlap | When shapes are close, dimension labels overlap | Low |

### Code Quality To-Do

| Task | Description | Priority |
|------|-------------|----------|
| Add React.memo to renderers | RoomShapeRenderer, FurnitureRenderer, etc. | Low |
| Throttle mouse move events | Performance optimization for large plans | Low |
| Add localStorage auto-save | Persist state automatically | Medium |
| Add proper error boundaries | Handle rendering errors gracefully | Low |

---

## Feature Proposals

### Future Features (Not Yet Implemented)

| Feature | Description | Complexity |
|---------|-------------|------------|
| Layers Panel | Show/hide, lock, reorder layers | Medium |
| 3D Preview | Simple WebGL extrusion view | High |
| Multi-floor support | Floor selector, copy floor | High |
| Collaboration | Real-time multi-user editing | Very High |
| Dark mode | Toggle dark/light theme | Low |
| Touch support | Gesture support for mobile | Medium |
| Measurement deletion | Click to delete individual measurements | Low |
| Custom furniture drawing | Draw custom furniture shapes | Medium |
| Room area calculation | Calculate and display room areas | Low |
| Dimension labels on walls | Auto-show wall lengths | Medium |

---

## Keyboard Shortcuts Reference

### Tool Selection
| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `Space` (hold) | Pan tool (releases to SELECT) |
| `R` | Room tool |
| `Z` | Zone tool |
| `F` | Furniture tool |
| `D` | Door tool |
| `W` | Window tool |
| `P` | Pencil/Draw tool |
| `T` | Text tool |
| `M` | Measure tool |

### Actions
| Shortcut | Action |
|----------|--------|
| `Escape` | Deselect / Cancel / Exit mode |
| `Delete` / `Backspace` | Delete selected |
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Y` / `Cmd+Shift+Z` | Redo |
| `Ctrl+C` / `Cmd+C` | Copy |
| `Ctrl+V` / `Cmd+V` | Paste |
| `Ctrl+D` / `Cmd+D` | Duplicate |
| `Ctrl+A` / `Cmd+A` | Select all |

### Mouse Controls
| Action | Control |
|--------|---------|
| Zoom | Mouse wheel |
| Pan | Space + drag, or Pan tool |
| Multi-select | Shift + click |
| Marquee select | Drag on empty canvas |

---

## Summary

### What Was Done (All Phases)

#### Phase 1
- Fixed all critical bugs (duplicate hooks, pan tool, history, grid, infinite loop)
- Implemented essential features (keyboard shortcuts, zoom, copy/paste, save/load)
- Improved code quality (constants file, hook extraction, type safety)
- Enhanced toolbar with all actions visible
- Added zoom indicator

#### Phase 2 (Latest)
- Implemented unit system with metric/imperial support
- Added grid snapping toggle with configurable grid size
- Created 5 room templates (Rectangle, Square, L-Shape, U-Shape, T-Shape)
- Expanded furniture catalog to 30+ items in 7 categories with search
- Implemented measurements tool with distance display in selected units
- Added PNG/SVG export with scale and background options
- Created Settings panel for unit and grid configuration

### Files Changed (Phase 2)
- `src/app/page.tsx` - Added state for dialogs and svgRef
- `src/components/Canvas.tsx` - Added measurement layer, settings integration
- `src/components/Toolbar.tsx` - Added new tool buttons and actions
- `src/components/FurnitureLibrary.tsx` - Complete rewrite with categories
- `src/components/SettingsPanel.tsx` - NEW
- `src/components/RoomTemplates.tsx` - NEW
- `src/components/ExportDialog.tsx` - NEW
- `src/components/layers/MeasurementLayer.tsx` - NEW
- `src/hooks/useCanvasInteraction.ts` - Added grid snapping
- `src/hooks/useKeyboardShortcuts.ts` - Added M shortcut
- `src/lib/store.ts` - Added settings and measurements state
- `src/lib/types.ts` - Added MEASURE tool, Measurement type
- `src/lib/constants.ts` - Added unit system, furniture catalog, templates
- `src/lib/units.ts` - NEW

### Build Status
Build passes successfully with no TypeScript errors.

---

*Last updated: December 6, 2025*
