import { create } from 'zustand';
import type { SchemaGraph, ParsedCollection } from '../types/schema.types';
import { buildSchemaGraph } from '../parser/relationExtractor';

export const DEMO_GRAPH: SchemaGraph = {
  collections: [
    {
      name: 'User',
      variableName: 'UserSchema',
      fileName: 'models/User.js',
      fields: [
        { name: '_id', type: 'ObjectId' },
        { name: 'name', type: 'String', required: true },
        { name: 'email', type: 'String', required: true, unique: true },
        { name: 'password', type: 'String', required: true },
        { name: 'role', type: 'String' },
        { name: 'posts', type: 'ObjectId', ref: 'Post', isArray: true },
        { name: 'createdAt', type: 'Date' },
      ],
      indexes: [
        { fields: { email: 1 }, options: { unique: true } },
        { fields: { createdAt: -1 } },
      ],
    },
    {
      name: 'Post',
      variableName: 'PostSchema',
      fileName: 'models/Post.js',
      fields: [
        { name: '_id', type: 'ObjectId' },
        { name: 'title', type: 'String', required: true },
        { name: 'body', type: 'String' },
        { name: 'author', type: 'ObjectId', ref: 'User' },
        { name: 'tags', type: 'String', isArray: true },
        { name: 'comments', type: 'ObjectId', ref: 'Comment', isArray: true },
        { name: 'publishedAt', type: 'Date' },
      ],
      indexes: [{ fields: { publishedAt: -1 } }],
    },
    {
      name: 'Comment',
      variableName: 'CommentSchema',
      fileName: 'models/Comment.js',
      fields: [
        { name: '_id', type: 'ObjectId' },
        { name: 'body', type: 'String', required: true },
        { name: 'author', type: 'ObjectId', ref: 'User' },
        { name: 'post', type: 'ObjectId', ref: 'Post' },
        { name: 'likes', type: 'Number' },
        { name: 'createdAt', type: 'Date' },
      ],
      indexes: [],
    },
    {
      name: 'Tag',
      variableName: 'TagSchema',
      fileName: 'models/Tag.js',
      fields: [
        { name: '_id', type: 'ObjectId' },
        { name: 'label', type: 'String', required: true, unique: true },
        { name: 'color', type: 'String' },
      ],
      indexes: [{ fields: { label: 1 }, options: { unique: true } }],
    },
  ],
  relations: [
    { from: 'User', to: 'Post', field: 'posts', type: 'one-to-many' },
    { from: 'Post', to: 'User', field: 'author', type: 'one-to-one' },
    { from: 'Post', to: 'Comment', field: 'comments', type: 'one-to-many' },
    { from: 'Comment', to: 'User', field: 'author', type: 'one-to-one' },
    { from: 'Comment', to: 'Post', field: 'post', type: 'one-to-one' },
  ],
  deadCollections: ['Tag'],
};

interface SchemaStore {
  graph: SchemaGraph;
  selectedCollection: string | null;
  isDemo: boolean;
  sidebarOpen: boolean;
  setGraph: (collections: ParsedCollection[]) => void;
  setSelectedCollection: (name: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  resetToDemo: () => void;
}

export const useSchemaStore = create<SchemaStore>((set) => ({
  graph: DEMO_GRAPH,
  selectedCollection: null,
  isDemo: true,
  sidebarOpen: false,

  setGraph: (collections) => {
    const graph = buildSchemaGraph(collections);
    set({ graph, isDemo: false, selectedCollection: null });
  },

  setSelectedCollection: (name) =>
    set({ selectedCollection: name, sidebarOpen: name !== null }),

  setSidebarOpen: (open) =>
    set({ sidebarOpen: open, selectedCollection: open ? undefined : null }),

  resetToDemo: () =>
    set({ graph: DEMO_GRAPH, isDemo: true, selectedCollection: null, sidebarOpen: false }),
}));
