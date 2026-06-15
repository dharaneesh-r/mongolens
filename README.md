<div align="center">

<img src="public/icons/icon128.png" alt="MongoLens Logo" width="96" height="96" />

# 🔬 MongoLens

### MongoDB Schema Visualizer — Chrome DevTools Extension

[![Build Status](https://img.shields.io/badge/build-passing-10b981?style=flat-square&logo=vite)](https://vitejs.dev)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-60a5fa?style=flat-square&logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![React Flow](https://img.shields.io/badge/React%20Flow-11-ff6b6b?style=flat-square)](https://reactflow.dev)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-a78bfa?style=flat-square)]()

> **Instantly visualize your Mongoose schemas as interactive ER diagrams — right inside Chrome DevTools.**

[Features](#features) · [Installation](#installation) · [Usage](#usage) · [Architecture](#architecture) · [Parser Patterns](#supported-mongoose-patterns) · [Contributing](#contributing)

</div>

---

## What is MongoLens?

MongoLens is a **Chrome DevTools Extension** for Node.js/Mongoose developers. Upload your model files and instantly see:

- 🕸️ **Interactive ER-style schema graph** with auto-layout
- 🔗 **Relationship arrows** between collections (one-to-one, one-to-many, many-to-many)
- 📋 **Field types** with ObjectId references resolved
- 📇 **Index analysis** with warnings for missing indexes on ref fields  
- 🔴 **Dead collection detection** — find orphaned/unused models

No backend required. All parsing happens **client-side in the browser**.

---

## Screenshot

> The Schema Graph tab with the built-in demo data (User → Post → Comment → Tag)

```
┌──────────────────────┐        ┌──────────────────────┐
│ 📦 User              │        │ 📦 Post              │
├──────────────────────┤        ├──────────────────────┤
│ _id       ObjectId   │──────▶ │ _id       ObjectId   │
│ name      String     │        │ title     String     │
│ email     String     │ ◀───── │ author  → User       │
│ posts →   Post[]     │        │ comments→ Comment[]  │
└──────────────────────┘        └──────────────────────┘
```

---

## Features

### 🕸️ Schema Graph
- Full-screen **React Flow** canvas with pan, zoom, and minimap
- **Dagre auto-layout** positions nodes intelligently (left-to-right flow)
- **Color-coded edges**: green (1:1), blue (1:many), purple animated (many:many)
- **Click any node** → slide-in sidebar with full field table + index list
- **Upload model files** — drag `.js`/`.ts` files and the graph rebuilds live
- Built-in **demo mode** (User → Post → Comment → Tag) loads on first open

### 📦 Collection Explorer
- Searchable left sidebar of all collections
- Per-collection view: field table, indexes, incoming refs, outgoing refs
- Dead collections highlighted in red with ⚠️ warning icon

### 📇 Index Viewer
- Tabulated view of **all indexes** across every collection
- ⚠️ **Warning cards** for ref fields that have no corresponding index
- Summary stats: total indexes, warnings, unique indexes, collections indexed

### 🔴 Dead Collections
- Collections never referenced by any other schema's `ref` field
- Detailed cards with: possible causes, field snapshot, outgoing refs, and recommendations
- Green "all clear" state when no dead collections are found

---

## Installation

### From Source (Developer Mode)

**Prerequisites:** Node.js 18+, npm 9+

```bash
# 1. Clone the repository
git clone https://github.com/dharaneesh-r/mongolens.git
cd mongolens

# 2. Install dependencies
npm install

# 3. Build the extension
npm run build

# The production extension files will be generated in the `dist/` directory.
```

**Load in Chrome:**

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder inside the project directory
5. Open any webpage → press **F12** → click the **MongoLens** tab

## Build Environment Requirements

- Operating System: Windows, macOS, or Linux
- Node.js: 18.0.0 or later
- npm: 9.0.0 or later

Verify installation:

```bash
node -v
npm -v
```

---

## Usage

### Analyzing Your Mongoose Project

1. Open any page in Chrome and press **F12** to open DevTools
2. Click the **MongoLens** tab (at the end of the DevTools panel tabs)
3. Click **📁 Upload Model Files** in the toolbar
4. Select all your Mongoose model `.js` or `.ts` files (multi-select supported)
5. MongoLens parses them client-side and renders the schema graph instantly

### Reading the Graph

| Visual Element | Meaning |
|---------------|---------|
| 📦 Green-bordered card | Active collection |
| ⚠️ Red-bordered card | Dead/unreferenced collection |
| 🔑 Gold badge | Unique index |
| 📇 Blue badge | Regular index |
| Green arrow `→` | one-to-one reference |
| Blue arrow `→` | one-to-many reference |
| Purple animated `→` | many-to-many reference |

### Navigating

- **Click a node** → opens sidebar with field details
- **Click relation in sidebar** → jumps to that collection's detail
- **Scroll/pinch** → zoom the graph
- **Drag canvas** → pan the graph
- **Reset Demo** → reloads the built-in demo data

---

## Architecture

```
mongolens/
├── manifest.json                    ← Chrome Extension Manifest V3
├── index.html                       ← Panel HTML entry point
├── vite.config.ts                   ← Multi-entry build (panel + devtools)
│
├── src/
│   ├── types/
│   │   └── schema.types.ts          ← Core TypeScript interfaces
│   │
│   ├── parser/
│   │   ├── schemaParser.ts          ← Mongoose file → ParsedCollection
│   │   └── relationExtractor.ts     ← Collections → SchemaGraph (with relations)
│   │
│   ├── store/
│   │   └── useSchemaStore.ts        ← Zustand global state + demo data
│   │
│   ├── components/
│   │   ├── GraphCanvas.tsx          ← React Flow canvas + dagre layout
│   │   ├── CollectionCard.tsx       ← Custom React Flow node component
│   │   └── Sidebar.tsx              ← Slide-in detail panel
│   │
│   ├── panel/
│   │   ├── main.tsx                 ← React entry point
│   │   ├── App.tsx                  ← Tab navigation shell
│   │   ├── index.css                ← Global dark theme styles
│   │   └── pages/
│   │       ├── SchemaGraph.tsx      ← Graph page (file upload + canvas)
│   │       ├── CollectionExplorer.tsx
│   │       ├── IndexViewer.tsx
│   │       └── DeadCollections.tsx
│   │
│   └── devtools/
│       ├── devtools.ts              ← Registers MongoLens panel in DevTools
│       └── devtools.html            ← DevTools page entry
│
└── dist/                            ← Built extension (load this in Chrome)
    ├── manifest.json
    ├── panel.html
    ├── devtools.html
    ├── panel.js
    ├── devtools.js
    ├── icons/
    └── assets/
```

---

## Supported Mongoose Patterns

MongoLens's parser handles all standard Mongoose schema definition patterns:

```javascript
// Pattern 1 — Simple shorthand
name: String

// Pattern 2 — Options object
email: { type: String, required: true, unique: true }

// Pattern 3 — All ObjectId ref forms
author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
author: { type: Schema.Types.ObjectId, ref: "User" }
author: { type: ObjectId, ref: "User" }

// Pattern 4 — Array of ObjectId refs
tags: [{ type: ObjectId, ref: "Tag" }]
comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }]

// Pattern 5 — Nested sub-objects
address: { street: String, city: String }

// Pattern 6 — Schema.index() calls
UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ createdAt: -1 })

// Pattern 7 — All model registration forms
const User = mongoose.model("User", UserSchema)
module.exports = mongoose.model("Post", PostSchema)
export default model("Comment", CommentSchema)
```

**Supports both CommonJS and ES Module syntax.**

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18 | UI framework |
| **TypeScript** | 6 | Type safety |
| **Vite** | 8 | Build tool + dev server |
| **React Flow** | 11 | Graph rendering engine |
| **Dagre** | 1 | Automatic graph layout |
| **Zustand** | 4 | Client state management |
| **@types/chrome** | latest | Chrome Extension API types |

---

## Development

```bash
# Start dev server (hot reload at http://localhost:5174)
npm run dev

# Production build (outputs to dist/)
npm run build

# Lint
npm run lint
```

### Dev vs Extension Mode

In **dev mode** (`npm run dev`), the panel runs as a standalone web app in your browser — no DevTools required. This is the fastest way to work on UI changes.

In **extension mode** (`npm run build` → Load unpacked), the panel renders inside Chrome DevTools as a proper panel tab.

---

## Data Flow

```
User uploads .js/.ts files
        ↓
  FileReader reads raw text
        ↓
  schemaParser.ts
  ┌─ findSchemaDefinitions()  → locate new Schema({...}) blocks
  ├─ parseSchemaBody()        → extract field name + type pairs
  ├─ extractIndexes()         → find .index() calls
  └─ findModelRegistrations() → map schemaVar → modelName
        ↓
  ParsedCollection[]
        ↓
  relationExtractor.ts
  ┌─ extractRelations()       → detect ref fields → SchemaRelation[]
  └─ findDeadCollections()    → collections not in any ref → string[]
        ↓
  SchemaGraph { collections, relations, deadCollections }
        ↓
  Zustand store (useSchemaStore)
        ↓
  React Flow renders nodes + edges
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push and open a Pull Request

### Ideas for Contributions
- [ ] Export graph as PNG / SVG
- [ ] AI-powered schema documentation generator
- [ ] Populate chain visualizer (multi-hop refs)
- [ ] `.env` / connection string support for live DB introspection
- [ ] Dark/light theme toggle
- [ ] Export schema as JSON / Markdown

---

## License

All Rights Reserved © 2026 Dharaneesh R

Unauthorized copying, modification, distribution, or use of this software is prohibited without explicit permission from the author.

---

<div align="center">
  Built with ❤️ for the MongoDB/Mongoose community
</div>
