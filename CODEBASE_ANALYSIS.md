# Room Planner CAD Web App - Comprehensive Codebase Analysis

**Date:** December 5, 2025
**Project:** neoplan-nextjs (Room Planner)
**Stack:** Next.js 16, React 19, Zustand, TypeScript, Tailwind CSS 4

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Codebase Structure](#codebase-structure)
3. [Bugs and Code Issues](#bugs-and-code-issues)
4. [UX/UI Flaws](#uxui-flaws)
5. [Areas of Improvement](#areas-of-improvement)
6. [Feature Proposals](#feature-proposals)

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
- **Layer components** (GridLayer, ZoneLayer, RoomLayer, etc.) handle rendering
- **Renderer components** (RoomShapeRenderer, FurnitureRenderer, etc.) render individual items
- **useCanvasInteraction hook** centralizes mouse/interaction logic
- **Zustand store** provides global state management

### Data Flow
```
User Input → Canvas → useCanvasInteraction hook → Zustand Store → Layer Components → Renderers
```

---

## Codebase Structure

```
src/
├── app/
│   ├── page.tsx          # Main page (minimal, just Toolbar + Canvas)
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles + Tailwind theme
├── components/
│   ├── Canvas.tsx        # Main canvas orchestrator (~560 lines)
│   ├── Toolbar.tsx       # Top toolbar with tools
│   ├── PropertiesPanel.tsx    # Right-side properties editor
│   ├── FurnitureLibrary.tsx   # Furniture palette
│   ├── SelectionMenu.tsx      # Legacy/unused selection menu
│   ├── RoomShape.tsx          # Room shape renderer
│   ├── ZoneRenderer.tsx       # Zone renderer
│   ├── FurnitureRenderer.tsx  # Furniture renderer
│   ├── WallItemRenderer.tsx   # Door/Window renderer
│   ├── TextRenderer.tsx       # Text annotation renderer
│   ├── FreehandRenderer.tsx   # Freehand drawing renderer
│   └── layers/
│       ├── GridLayer.tsx
│       ├── ZoneLayer.tsx
│       ├── RoomLayer.tsx
│       ├── FurnitureLayer.tsx
│       ├── WallItemLayer.tsx
│       ├── AnnotationLayer.tsx
│       └── InteractionLayer.tsx
├── hooks/
│   └── useCanvasInteraction.ts  # Centralized interaction logic (~450 lines)
└── lib/
    ├── store.ts        # Zustand state store
    ├── types.ts        # TypeScript type definitions
    └── geometry.ts     # Geometry utility functions
```

---

## Bugs and Code Issues

### Critical Bugs

#### 1. **Duplicate useEffect Hooks in Canvas.tsx** (`src/components/Canvas.tsx:135-148` and `390-403`)
The `handleKeyDown` event listener for delete functionality is registered twice with identical code:
```typescript
// Lines 135-148 AND 390-403 - DUPLICATED
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteSelected();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [deleteSelected]);
```
**Impact:** Delete events fire twice.

#### 2. **Duplicate viewBox resize useEffect** (`src/components/Canvas.tsx:151-165` and `406-420`)
The window resize handler is registered twice, causing unnecessary re-renders.

#### 3. **Duplicate tool state useEffect** (`src/components/Canvas.tsx:168-170` and `423-425`)
```typescript
useEffect(() => {
  setShowFurnitureLibrary(tool === Tool.FURNITURE);
}, [tool]);
```
This appears twice in the component.

#### 4. **Missing History Save on Update Operations** (`src/lib/store.ts:135-152`)
The `updateShape`, `updateFurniture`, `updateZone`, etc. functions do NOT save to history:
```typescript
updateShape: (id, updates) => set((state) => ({
    shapes: state.shapes.map(s => s.id === id ? { ...s, ...updates } : s)
})),
// No saveToHistory() call!
```
**Impact:** Property changes via the Properties Panel are not undoable.

#### 5. **Grid Pattern Not Using ViewBox** (`src/components/layers/GridLayer.tsx`)
The grid uses `width="100%"` which doesn't account for pan/zoom:
```typescript
<rect width="100%" height="100%" fill="url(#grid)" />
```
**Impact:** Grid doesn't scroll with viewport when panning.

#### 6. **Rotation Handle Missing for Zones** (`src/components/ZoneRenderer.tsx:91-100`)
The rotation handle is rendered but `onRotate` is never called because it's undefined:
```typescript
onRotate?: () => void; // Optional prop
// ...
onMouseDown={(e) => { e.stopPropagation(); onRotate && onRotate(); }}
```
But the `ZoneLayer` never passes this prop.

#### 7. **Text Selection Box Width Calculation Incorrect** (`src/components/TextRenderer.tsx:22`)
```typescript
width={(item.text.length * item.fontSize * 0.6) + 8}
```
Uses a magic number (0.6) which doesn't account for actual font metrics or variable-width fonts.

#### 8. **Unused Import in Canvas.tsx**
`snapPoint` is imported from geometry but a local state `activeSnapPoint` shadows it:
```typescript
import { snapPoint, ... } from '@/lib/geometry'; // Unused
const { snapPoint: activeSnapPoint, ... } = useCanvasInteraction(...);
```

### Medium Priority Issues

#### 9. **SelectionMenu Component is Unused**
`src/components/SelectionMenu.tsx` is defined but never used anywhere. It's been replaced by `PropertiesPanel`.

#### 10. **TypeScript `any` Types** (`src/components/PropertiesPanel.tsx:9`)
```typescript
onUpdate: (field: string, value: any) => void;
```
Should use a proper union type.

#### 11. **Inconsistent Fillet Type Handling** (`src/lib/types.ts:29`)
```typescript
export type VertexType = 'CORNER' | 'FILLET'; // Chamfer removed
```
Comment suggests chamfer was removed but code may still reference it.

#### 12. **PAN Tool Doesn't Work** (`src/hooks/useCanvasInteraction.ts:217`)
The PAN tool only sets `dragStart` but never sets `dragAction` to `'PANNING'`:
```typescript
if (tool === Tool.PAN) { setDragStart(point); return; }
// Missing: setDragAction('PANNING');
```
**Impact:** Pan tool is completely broken.

#### 13. **Wall Item Distance Calculation Incorrect** (`src/components/WallItemRenderer.tsx:142-143`)
```typescript
const distStart = distance({ x, y }, wallEnds.start) - width / 2;
```
This assumes wall direction but doesn't actually check which end is which in local space.

#### 14. **No Null Check for Furniture Vertices** (`src/components/FurnitureRenderer.tsx:39-48`)
Custom furniture path generation doesn't check if vertices exist properly:
```typescript
if (type === 'CUSTOM' && vertices) { ... }
```
But vertices could be an empty array.

#### 15. **Memory Leak: Missing Cleanup for movingChildrenIds Ref**
`movingChildrenIdsRef.current` is set on drag start but never cleared on component unmount.

---

## UX/UI Flaws

### Navigation & Tooling

#### 1. **No Keyboard Shortcuts Working**
The toolbar shows hints like "Select & Edit (V)" but these shortcuts are not implemented.

#### 2. **No Zoom Control**
There's a `scale` property in viewBox but no UI to control it (no scroll wheel zoom, no zoom buttons).

#### 3. **Pan Tool Broken**
As noted above, the Pan tool doesn't function.

#### 4. **No Escape Key to Cancel Operations**
When drawing a room or zone, pressing Escape should cancel the operation.

#### 5. **Tool Doesn't Auto-Switch to Select After Creation**
After creating a room, zone, or furniture, the tool should switch back to SELECT for immediate editing.

### Selection & Editing

#### 6. **No Visual Feedback When Nothing is Selected**
Clicking empty canvas deselects but gives no feedback.

#### 7. **Multi-Selection Properties Not Shown**
When multiple items are selected, the Properties Panel only shows the last selected item.

#### 8. **No Copy/Paste/Duplicate**
Essential CAD operations are missing.

#### 9. **Double-Click Needed for Vertex Edit**
Users must double-click to enter vertex edit mode; should be discoverable.

#### 10. **No Exit from Vertex Edit Mode**
Once in vertex edit mode, there's no clear way to exit (clicking away works but isn't obvious).

### Properties Panel

#### 11. **Width/Height Editing Disabled for Rooms**
The Properties Panel shows W/H for rooms but changes have no effect because the update logic for width/height is missing.

#### 12. **No Unit Display**
Dimensions show raw pixel values (e.g., "400") instead of real-world units (4m, 400cm).

#### 13. **Color Picker Too Small**
The color input is 24x24 pixels, difficult to click on mobile/touch.

#### 14. **Z-Index Controls Confusing**
Both numeric input AND arrange buttons exist; pick one paradigm.

### Visual Design

#### 15. **Label Overlaps Content**
Room labels at top-left can overlap dimensions or other UI elements.

#### 16. **Dimension Labels Can Overlap**
When rooms are close together, dimension labels overlap and become unreadable.

#### 17. **No Contrast on Light Backgrounds**
The beige background (#fdf6e3) with gray text can have accessibility issues.

#### 18. **Furniture Icons Inconsistent**
Some furniture items use Lucide icons, others use custom JSX shapes.

---

## Areas of Improvement

### Code Quality

#### 1. **Split Canvas.tsx into Smaller Components**
At 560+ lines, Canvas.tsx is doing too much. Extract:
- Keyboard shortcut handling to a custom hook
- Property update logic to a separate hook
- Event handlers to the interaction hook

#### 2. **Consolidate Duplicate useEffects**
Remove the 3 duplicate useEffect blocks in Canvas.tsx.

#### 3. **Create a Constants File**
Magic numbers scattered throughout:
- Grid size (40px)
- Snap threshold (15px, 30px)
- Default furniture sizes
- Default colors

#### 4. **Add TypeScript Strict Mode**
Many `any` types and unsafe casts exist. Enable strict mode and fix type errors.

#### 5. **Use React.memo Consistently**
Layer components use memo but renderer components don't.

#### 6. **Extract Geometry Calculations**
RoomShapeRenderer has complex geometry logic that could be in geometry.ts.

### Architecture

#### 7. **Implement Command Pattern for Undo/Redo**
Current history stores full snapshots. Command pattern would be more efficient:
```typescript
interface Command {
  execute(): void;
  undo(): void;
}
```

#### 8. **Use Immer for Immutable Updates**
Complex state updates with nested objects would benefit from Immer.

#### 9. **Virtualization for Large Plans**
With many objects, rendering performance will degrade. Consider:
- SVG viewport culling
- React-window for lists

#### 10. **Separate View State from Data State**
ViewBox, selectedIds, tool, mode should be in a separate store slice.

### Performance

#### 11. **Throttle/Debounce Mouse Move**
Mouse move events fire very rapidly; throttle to 60fps.

#### 12. **Use CSS Transforms Instead of SVG Transforms**
CSS transforms are GPU-accelerated.

#### 13. **Batch State Updates**
Multiple `set()` calls in drag handlers could be batched.

#### 14. **Lazy Load Furniture Library**
The furniture library loads even when not visible.

---

## Feature Proposals

### Essential Features (High Priority)

#### 1. **Zoom & Pan**
- Mouse wheel zoom (centered on cursor)
- Middle-click pan
- Touch pinch-to-zoom
- Zoom controls (fit all, 100%, zoom in/out buttons)
- Mini-map for navigation

#### 2. **Keyboard Shortcuts**
- `V` - Select tool
- `R` - Room tool
- `Z` - Zone tool
- `D` - Door tool
- `W` - Window tool
- `P` - Pencil tool
- `T` - Text tool
- `Space` - Pan (hold)
- `Escape` - Cancel/Deselect
- `Delete/Backspace` - Delete selected
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Y` / `Cmd+Shift+Z` - Redo
- `Ctrl+C` / `Cmd+C` - Copy
- `Ctrl+V` / `Cmd+V` - Paste
- `Ctrl+D` / `Cmd+D` - Duplicate
- `Ctrl+A` - Select all
- `Arrow keys` - Nudge selected

#### 3. **Copy, Paste, Duplicate**
- Copy to clipboard (internal format)
- Paste at cursor position
- Duplicate in place with offset

#### 4. **Grid Snapping**
- Snap to grid toggle
- Configurable grid size
- Grid visibility toggle

#### 5. **Save/Load Projects**
- Export to JSON
- Import from JSON
- Auto-save to localStorage
- Named projects

#### 6. **Export Options**
- Export as PNG
- Export as SVG
- Export as PDF
- Print-ready scaling with real units

### Important Features (Medium Priority)

#### 7. **Unit System**
- Choose between metric (m, cm) and imperial (ft, in)
- Scale setting (1px = X cm)
- Display dimensions in chosen units

#### 8. **Layers Panel**
- Show/hide layers
- Lock layers
- Reorder layers
- Layer grouping

#### 9. **Snap to Objects**
- Snap to center
- Snap to edges
- Snap to corners
- Smart guides (alignment with other objects)

#### 10. **Room Templates**
- Preset room shapes (L-shaped, U-shaped)
- Quick room creation wizard

#### 11. **Furniture Catalog Expansion**
- More furniture types (desk, wardrobe, bathtub, toilet, sink, stove, fridge)
- Category organization
- Search/filter
- Custom furniture save

#### 12. **Wall Thickness**
- Visual wall thickness (currently implemented but partially)
- Wall material/pattern

#### 13. **Multi-Floor Support**
- Floor selector
- Copy floor
- Stair placement

#### 14. **Measurements Tool**
- Measure distance between two points
- Measure angle
- Dimension annotations

### Nice-to-Have Features (Lower Priority)

#### 15. **Collaboration**
- Real-time multi-user editing
- Comments/annotations
- Share link

#### 16. **3D Preview**
- Simple 3D extrusion view
- WebGL renderer
- Walkthrough mode

#### 17. **AI Suggestions**
- Auto-arrange furniture
- Room layout suggestions
- Feng shui hints

#### 18. **Material/Texture Library**
- Floor textures (wood, tile, carpet)
- Wall colors/patterns
- Furniture textures

#### 19. **Electrical & Plumbing**
- Outlet placement
- Switch placement
- Pipe routing

#### 20. **Area Calculation**
- Auto-calculate room areas
- Total floor area summary
- Cost estimation (price per sqm)

#### 21. **Touch/Mobile Support**
- Touch-friendly controls
- Gesture support
- Mobile-responsive layout

#### 22. **Dark Mode**
- Toggle dark/light theme
- Respect system preference

#### 23. **Accessibility**
- Screen reader support
- High contrast mode
- Keyboard-only navigation

#### 24. **History Panel**
- Visual undo/redo history
- Named snapshots
- Restore to any point

---

## Summary

### Critical Issues to Fix First
1. Remove duplicate useEffect hooks in Canvas.tsx
2. Fix Pan tool (set dragAction to 'PANNING')
3. Add history save for update operations
4. Implement keyboard shortcuts
5. Fix grid scrolling with viewport

### Quick Wins
1. Delete unused SelectionMenu.tsx
2. Remove unused imports
3. Add Escape key handling
4. Auto-switch to SELECT after creation
5. Add zoom via scroll wheel

### Recommended Roadmap
1. **Phase 1:** Bug fixes (1-2 days)
2. **Phase 2:** Essential features - zoom, shortcuts, copy/paste (1 week)
3. **Phase 3:** Save/Load, Export (3-4 days)
4. **Phase 4:** Polish - units, layers, templates (1-2 weeks)
5. **Phase 5:** Advanced - collaboration, 3D preview (future)

---

*This analysis was generated from a thorough review of the entire codebase. All line references are accurate as of the analysis date.*
