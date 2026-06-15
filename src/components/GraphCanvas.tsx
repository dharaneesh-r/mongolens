import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
} from 'reactflow';
import type { Node, Edge, NodeTypes } from 'reactflow';
import dagre from '@dagrejs/dagre';
import 'reactflow/dist/style.css';
import type { SchemaGraph, SchemaRelation } from '../types/schema.types';
import CollectionCard from './CollectionCard';
import { useSchemaStore } from '../store/useSchemaStore';

const nodeTypes: NodeTypes = {
  collectionCard: CollectionCard,
};

const NODE_WIDTH = 260;
const NODE_HEIGHT = 220;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', ranksep: 100, nodesep: 60 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function getEdgeStyle(type: SchemaRelation['type']) {
  switch (type) {
    case 'many-to-many':
      return { stroke: '#a78bfa', strokeWidth: 2 };
    case 'one-to-many':
      return { stroke: '#60a5fa', strokeWidth: 2 };
    default:
      return { stroke: '#10b981', strokeWidth: 1.5 };
  }
}

function buildGraphElements(graph: SchemaGraph) {
  const deadSet = new Set(graph.deadCollections);

  const nodes: Node[] = graph.collections.map((col) => ({
    id: col.name,
    type: 'collectionCard',
    data: {
      ...col,
      isDead: deadSet.has(col.name),
    },
    position: { x: 0, y: 0 },
  }));

  const edges: Edge[] = graph.relations.map((rel, idx) => ({
    id: `edge-${idx}`,
    source: rel.from,
    target: rel.to,
    label: `${rel.field}${rel.type === 'one-to-many' ? '[]' : ''}`,
    labelStyle: { fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
    labelBgPadding: [4, 6] as [number, number],
    labelBgBorderRadius: 4,
    style: getEdgeStyle(rel.type),
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: getEdgeStyle(rel.type).stroke,
    },
    animated: rel.type === 'many-to-many',
  }));

  return getLayoutedElements(nodes, edges);
}

interface GraphCanvasProps {
  graph: SchemaGraph;
}

export default function GraphCanvas({ graph }: GraphCanvasProps) {
  const { setSelectedCollection } = useSchemaStore();

  const initial = useMemo(() => buildGraphElements(graph), [graph]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = buildGraphElements(graph);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [graph, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedCollection(node.id);
    },
    [setSelectedCollection]
  );

  const onPaneClick = useCallback(() => {
    setSelectedCollection(null);
  }, [setSelectedCollection]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={2}
      style={{ background: '#060f1e' }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="#1e293b"
      />
      <Controls
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
        }}
      />
      <MiniMap
        style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '8px',
        }}
        nodeColor="#10b981"
        maskColor="rgba(0,0,0,0.7)"
      />
    </ReactFlow>
  );
}
