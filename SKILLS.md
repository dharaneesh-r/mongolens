# MongoLens — Skills & Technology Reference

> A deep-dive into every technology, pattern, and technique used in this project.
> Useful as a learning reference or onboarding guide for new contributors.

---

## Table of Contents

1. [Chrome Extension (Manifest V3)](#1-chrome-extension-manifest-v3)
2. [React 18](#2-react-18)
3. [TypeScript 6](#3-typescript-6)
4. [Vite 8](#4-vite-8)
5. [React Flow 11](#5-react-flow-11)
6. [Dagre Auto-Layout](#6-dagre-auto-layout)
7. [Zustand State Management](#7-zustand-state-management)
8. [Custom Parser Engine](#8-custom-parser-engine)
9. [CSS Architecture](#9-css-architecture)
10. [Project Patterns](#10-project-patterns)

---

## 1. Chrome Extension (Manifest V3)

### What it is
A Chrome Extension adds functionality to the Chrome browser. **Manifest V3** is the current (2023+) extension platform with improved security and performance over V2.

### How MongoLens uses it

```json
// manifest.json
{
  "manifest_version": 3,
  "devtools_page": "devtools.html"   // ← registers our DevTools panel
}
```

### Key concepts used

| Concept | File | Description |
|---------|------|-------------|
| `devtools_page` | `devtools.html` | A background HTML page that runs when DevTools opens |
| `chrome.devtools.panels.create()` | `devtools.ts` | API call that adds a new tab to Chrome DevTools |
| `web_accessible_resources` | `manifest.json` | Allows `panel.html` to be loaded inside the DevTools panel |

### DevTools Panel lifecycle

```
Chrome opens DevTools
  → loads devtools.html (background page)
    → runs devtools.ts
      → calls chrome.devtools.panels.create("MongoLens", icon, "panel.html")
        → Chrome adds a "MongoLens" tab in DevTools
          → When tab is clicked: renders panel.html (our React app)
```

### Skills learned
- Manifest V3 structure and permission model
- The difference between `background`, `content_script`, `devtools_page`, and `panel`
- Multi-entry Vite builds for extensions (separate JS bundles per entry point)

---

## 2. React 18

### What it is
React is a JavaScript library for building UIs using a **component tree** with a virtual DOM diffing system.

### How MongoLens uses it

Every visual element is a React component. The app uses:

#### Hooks used

| Hook | Where | Why |
|------|-------|-----|
| `useState` | `CollectionExplorer`, `App` | Local UI state (selected collection, active tab) |
| `useCallback` | `GraphCanvas`, `SchemaGraph` | Memoize event handlers to avoid re-renders |
| `useEffect` | `GraphCanvas` | Re-run layout when `graph` prop changes |
| `useMemo` | `GraphCanvas` | Compute initial node/edge layout once |
| `useRef` | `SchemaGraph` | Reference the `<input type="file">` DOM element |
| `memo` | `CollectionCard` | Prevent React Flow node re-renders on pan/zoom |

#### Key patterns

```tsx
// Memoized node to prevent React Flow from re-rendering on every pan
const CollectionCard = memo(function CollectionCard({ data }: NodeProps) {
  return <div>...</div>;
});

// useCallback prevents new function references on every render
const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
  setSelectedCollection(node.id);
}, [setSelectedCollection]);
```

#### React Flow integration
React Flow requires nodes and edges as controlled state arrays, managed via `useNodesState` / `useEdgesState`:

```tsx
const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
```

### Skills learned
- Controlled vs uncontrolled components
- When to use `memo`, `useCallback`, `useMemo` for performance
- Integrating third-party imperative libraries (React Flow) into React's declarative model

---

## 3. TypeScript 6

### What it is
TypeScript adds static types to JavaScript, catching errors at compile time and enabling IDE autocomplete.

### How MongoLens uses it

#### Core type definitions

```typescript
// src/types/schema.types.ts
export interface SchemaField {
  name: string;
  type: string;
  ref?: string;         // optional — only ObjectId refs have this
  required?: boolean;
  isArray?: boolean;
}

export interface SchemaRelation {
  from: string;
  to: string;
  field: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'; // union literal type
}
```

#### `verbatimModuleSyntax` (TS 5+)
This project uses `verbatimModuleSyntax: true`, which requires all type-only imports to use `import type`:

```typescript
// ✅ Correct with verbatimModuleSyntax
import type { SchemaGraph } from '../types/schema.types';
import { buildSchemaGraph } from '../parser/relationExtractor'; // runtime value

// ❌ Would fail
import { SchemaGraph } from '../types/schema.types'; // type used as value
```

#### Generic Zustand store typing

```typescript
interface SchemaStore {
  graph: SchemaGraph;
  selectedCollection: string | null;
  setGraph: (collections: ParsedCollection[]) => void;
}

const useSchemaStore = create<SchemaStore>((set) => ({ ... }));
```

#### `Record<string, 1 | -1>` for MongoDB index fields
```typescript
export interface SchemaIndex {
  fields: Record<string, 1 | -1>;  // e.g. { email: 1, createdAt: -1 }
}
```

### Skills learned
- Interface vs type alias
- Union types for discriminated variants
- `import type` with `verbatimModuleSyntax`
- Typing third-party APIs (`NodeProps<T>` from React Flow)
- `Record<K, V>` utility type

---

## 4. Vite 8

### What it is
Vite is a modern build tool that uses native ES modules for instant dev server startup and Rollup for optimized production builds.

### How MongoLens uses it

#### Multi-entry build
Chrome Extensions need multiple HTML entry points. Vite handles this via Rollup's `input`:

```typescript
// vite.config.ts
rollupOptions: {
  input: {
    panel: resolve(__dirname, 'index.html'),          // → dist/panel.js
    devtools: resolve(__dirname, 'src/devtools/devtools.html'), // → dist/devtools.js
  },
}
```

#### Custom Vite plugin for post-build file organization
```typescript
{
  name: 'chrome-extension-manifest',
  closeBundle() {
    // Runs AFTER the build bundle is written
    copyFileSync('manifest.json', 'dist/manifest.json');
    copyFileSync('dist/src/devtools/devtools.html', 'dist/devtools.html');
    copyFileSync('dist/index.html', 'dist/panel.html');
  }
}
```

#### Path aliases
```typescript
resolve: {
  alias: { '@': resolve(__dirname, 'src') }
}
// Usage: import { foo } from '@/components/Foo'
```

### Skills learned
- Multi-entry Rollup builds
- Writing custom Vite plugins with `closeBundle` hook
- The difference between `dev` (HMR + native ESM) and `build` (Rollup bundle)
- Using `resolve.alias` for clean imports

---

## 5. React Flow 11

### What it is
React Flow is a React library for building node-based UIs: flow diagrams, node editors, ER diagrams, etc.

### How MongoLens uses it

#### Core concepts

| Concept | Description |
|---------|-------------|
| `Node` | A draggable card on the canvas. Has `id`, `type`, `data`, `position` |
| `Edge` | A connecting line between two nodes. Has `source`, `target`, `label` |
| `NodeTypes` | Map of string → React component. Lets you render custom nodes |
| `useNodesState` | React state array for nodes with built-in change handlers |
| `useEdgesState` | React state array for edges |
| `Handle` | Connection point on a node (left/right/top/bottom) |

#### Custom node type

```tsx
// Register custom node type
const nodeTypes: NodeTypes = {
  collectionCard: CollectionCard,
};

// Use in ReactFlow
<ReactFlow nodeTypes={nodeTypes} ... />

// CollectionCard receives data via NodeProps<T>
function CollectionCard({ data, selected }: NodeProps<CollectionNodeData>) {
  return <div style={{ border: selected ? '2px solid #10b981' : '...' }}>
    ...
  </div>;
}
```

#### Marker (arrowhead) on edges
```typescript
markerEnd: {
  type: MarkerType.ArrowClosed,
  color: '#10b981',
}
```

#### `fitView` for initial camera
```tsx
<ReactFlow fitView fitViewOptions={{ padding: 0.2 }} />
```

### Skills learned
- Building custom node components with `Handle` connection points
- Rendering dynamic labels on edges
- Integrating React Flow with external layout engines
- Using `useNodesState`/`useEdgesState` for controlled graph state

---

## 6. Dagre Auto-Layout

### What it is
Dagre is a JavaScript graph layout library. It computes `x, y` coordinates for nodes in a directed graph, so you don't have to position them manually.

### How MongoLens uses it

```typescript
import dagre from '@dagrejs/dagre';

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', ranksep: 100, nodesep: 60 }); // left-to-right

  // Register each node's dimensions
  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Register edges
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Run the layout algorithm
  dagre.layout(g);

  // Apply computed positions back to React Flow nodes
  return nodes.map((node) => {
    const { x, y } = g.node(node.id);
    return { ...node, position: { x: x - NODE_WIDTH/2, y: y - NODE_HEIGHT/2 } };
  });
}
```

### `rankdir` options
| Value | Layout Direction |
|-------|----------------|
| `'LR'` | Left → Right (used in MongoLens) |
| `'TB'` | Top → Bottom |
| `'RL'` | Right → Left |
| `'BT'` | Bottom → Top |

### Skills learned
- Graph theory basics (nodes, edges, directed acyclic graphs)
- Integrating a layout engine with a rendering library
- Center-offset calculation: dagre returns center positions, React Flow uses top-left

---

## 7. Zustand State Management

### What it is
Zustand is a minimal, fast React state management library — simpler than Redux, with no Provider/Context boilerplate.

### How MongoLens uses it

```typescript
// src/store/useSchemaStore.ts
const useSchemaStore = create<SchemaStore>((set) => ({
  // Initial state
  graph: DEMO_GRAPH,
  selectedCollection: null,
  isDemo: true,
  sidebarOpen: false,

  // Actions (mutations)
  setGraph: (collections) => {
    const graph = buildSchemaGraph(collections);
    set({ graph, isDemo: false });
  },
  setSelectedCollection: (name) =>
    set({ selectedCollection: name, sidebarOpen: name !== null }),
}));
```

#### Usage in components
```tsx
// Subscribe to only the slice you need (prevents unnecessary re-renders)
const { graph, isDemo } = useSchemaStore();
const setSelectedCollection = useSchemaStore(s => s.setSelectedCollection);
```

#### Why Zustand over Context/Redux?
- No `Provider` wrapper needed — store is global and accessed anywhere
- Selectors are built-in — components only re-render when their selected slice changes
- Actions live inside the store — no separate action creators / reducers

### Skills learned
- Global state without Context/Provider
- Collocating actions with state in Zustand
- Slice pattern for performance (only subscribe to what you use)

---

## 8. Custom Parser Engine

### What it is
MongoLens includes a hand-written Mongoose schema parser that runs entirely in the browser — no Node.js, no backend, no filesystem access.

### Parsing strategy: Regex + Brace Counting

Rather than loading a full AST parser (which would be too heavy for browser use), MongoLens uses:

1. **Regex** to find `new Schema(...)` and `mongoose.model(...)` call sites
2. **Brace counting** to extract the exact body of each schema definition
3. **Token-by-token parsing** to identify field name → definition pairs

```typescript
// Step 1: Find schema start positions
const schemaStartRegex = /(?:const|let|var)\s+(\w+)\s*=\s*new\s+(?:mongoose\.)?Schema\s*\(/g;

// Step 2: Count parens to find matching close
let depth = 1;
while (i < content.length && depth > 0) {
  if (ch === '(') depth++;
  else if (ch === ')') depth--;
  i++;
}
// content.slice(openParen + 1, i - 1) = full Schema() arguments

// Step 3: Parse field body token by token
// Track { } [ ] depth to correctly split comma-separated fields
```

### Why not use `@babel/parser` in the browser?
- Bundle size: `@babel/parser` adds ~600KB
- Mongoose schemas are predictable enough for regex + brace-counting
- No need to handle arbitrary JS — just the Schema({}) call shape

### Normalization
All ObjectId variants are normalized to the canonical `"ObjectId"` type:
```typescript
function normalizeType(raw: string): string {
  if (raw === 'mongoose.Schema.Types.ObjectId') return 'ObjectId';
  if (raw === 'Schema.Types.ObjectId') return 'ObjectId';
  if (raw === 'ObjectId') return 'ObjectId';
  // ...
}
```

### Skills learned
- Parsing techniques: regex, recursive descent, brace counting
- Tradeoffs: AST parser vs custom lightweight parser
- String normalization and canonical representation
- Handling both CommonJS (`module.exports`) and ESM (`export default`) syntax

---

## 9. CSS Architecture

### Approach
MongoLens uses **inline styles** (style objects) exclusively in component JSX. This approach was chosen because:

1. **No class name collisions** — critical for a DevTools extension running alongside host page styles
2. **Dynamic styles** — colors, borders, and effects change based on props without CSS variables or class toggling
3. **Colocated with logic** — style decisions sit next to the component data they depend on

```tsx
// Dynamic border color based on collection state
<div style={{
  border: `2px solid ${data.isDead ? '#ef4444' : selected ? '#10b981' : '#334155'}`,
  boxShadow: selected ? '0 0 20px rgba(16, 185, 129, 0.3)' : '...',
}}>
```

### Global CSS (`src/panel/index.css`)
Only true global styles live in CSS:
- CSS reset (`box-sizing`, `margin`, `padding`)
- Scrollbar customization (`::-webkit-scrollbar`)
- React Flow control overrides (target library-generated class names)

### Design tokens (as constants)
```typescript
const TYPE_COLORS: Record<string, string> = {
  ObjectId: '#10b981',   // emerald green
  String:   '#60a5fa',   // blue
  Number:   '#f59e0b',   // amber
  Boolean:  '#a78bfa',   // violet
  Date:     '#f472b6',   // pink
};
```

### Skills learned
- Inline style objects vs CSS classes — tradeoffs
- Injecting dynamic values into styles via template literals
- Overriding third-party library CSS in a scoped way

---

## 10. Project Patterns

### Component composition pattern
```
Page (SchemaGraph)
  ↓ renders
GraphCanvas          ← pure visualization, accepts graph prop
  ↓ renders
CollectionCard × N   ← memoized, receives data from React Flow
Sidebar              ← reads from store directly, no prop drilling
```

### Separation of concerns
| Layer | Responsibility |
|-------|---------------|
| `src/types/` | Data shape — no logic |
| `src/parser/` | Pure functions — input text, output data |
| `src/store/` | Global state — connects parser output to React |
| `src/components/` | Reusable UI primitives |
| `src/panel/pages/` | Page-level composition |

### Pure parser functions
The parser has **zero side effects** — it takes strings and returns typed objects:
```typescript
parseMongooseFile(content: string, fileName: string): ParsedCollection[]
buildSchemaGraph(collections: ParsedCollection[]): SchemaGraph
```

This makes the parser trivially unit-testable and reusable.

### Demo-first design
The store initializes with `DEMO_GRAPH` so the extension is immediately useful without any user action. This follows the "time to value" UX principle.

### Skills learned
- Separation of parsing, state, and rendering concerns
- Pure function design for testability
- "Demo-first" UX strategy
- Prop drilling avoidance via global store

---

## Quick Reference Card

```
npm run dev     → http://localhost:5174/ (hot reload)
npm run build   → dist/ (load in Chrome)
npm run lint    → ESLint check

Key files:
  src/types/schema.types.ts      ← start here to understand data shapes
  src/parser/schemaParser.ts     ← core parsing logic
  src/store/useSchemaStore.ts    ← global state + demo data
  src/components/GraphCanvas.tsx ← React Flow + dagre integration
  manifest.json                  ← Chrome Extension config
  vite.config.ts                 ← build config + post-build plugin
```
