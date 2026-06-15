import React from 'react';
import { useSchemaStore } from '../store/useSchemaStore';
import type { SchemaField, SchemaIndex } from '../types/schema.types';

const TYPE_COLORS: Record<string, string> = {
  ObjectId: '#10b981',
  String: '#60a5fa',
  Number: '#f59e0b',
  Boolean: '#a78bfa',
  Date: '#f472b6',
  Array: '#fb923c',
  Mixed: '#94a3b8',
};

function TypeBadge({ type }: { type: string }) {
  const color = TYPE_COLORS[type] || '#94a3b8';
  return (
    <span
      style={{
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        padding: '1px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'monospace',
        fontWeight: 600,
      }}
    >
      {type}
    </span>
  );
}

function FieldRow({ field }: { field: SchemaField }) {
  return (
    <tr style={{ borderBottom: '1px solid #1e293b' }}>
      <td style={{ padding: '8px 12px', color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace' }}>
        {field.name}
        {field.required && (
          <span style={{ color: '#ef4444', marginLeft: '4px', fontSize: '10px' }}>*</span>
        )}
      </td>
      <td style={{ padding: '8px 12px' }}>
        <TypeBadge type={field.isArray ? `${field.type}[]` : field.type} />
      </td>
      <td style={{ padding: '8px 12px', color: '#64748b', fontSize: '12px' }}>
        {field.ref ? (
          <span style={{ color: '#10b981' }}>→ {field.ref}</span>
        ) : null}
        {field.unique ? (
          <span style={{ color: '#f59e0b', marginLeft: '4px' }}>UNIQUE</span>
        ) : null}
      </td>
    </tr>
  );
}

function IndexRow({ index }: { index: SchemaIndex }) {
  const fieldsStr = Object.entries(index.fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid #1e3a5f',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '12px',
        fontFamily: 'monospace',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '6px',
      }}
    >
      <span style={{ fontSize: '14px' }}>{index.options?.unique ? '🔑' : '📇'}</span>
      <span style={{ color: '#60a5fa' }}>{'{'} {fieldsStr} {'}'}</span>
      {index.options?.unique && (
        <span style={{ color: '#f59e0b', fontSize: '10px', marginLeft: 'auto' }}>UNIQUE</span>
      )}
      {index.options?.sparse && (
        <span style={{ color: '#a78bfa', fontSize: '10px' }}>SPARSE</span>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { graph, selectedCollection, sidebarOpen, setSidebarOpen, setSelectedCollection } =
    useSchemaStore();

  const collection = graph.collections.find((c) => c.name === selectedCollection);

  if (!sidebarOpen || !collection) return null;

  const incomingRefs = graph.relations.filter((r) => r.to === collection.name);
  const outgoingRefs = graph.relations.filter((r) => r.from === collection.name);

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '340px',
        background: '#0f172a',
        borderLeft: '1px solid #1e293b',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          background: 'linear-gradient(90deg, #064e3b22, #0f172a)',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '20px' }}>📦</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#10b981', fontWeight: 700, fontSize: '16px' }}>
            {collection.name}
          </div>
          <div style={{ color: '#475569', fontSize: '11px' }}>{collection.fileName}</div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          style={{
            background: 'none',
            border: '1px solid #334155',
            color: '#94a3b8',
            cursor: 'pointer',
            borderRadius: '6px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
        {/* Fields Table */}
        <div style={{ padding: '12px 16px 4px', color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>
          FIELDS ({collection.fields.length})
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b' }}>
              <th style={{ padding: '6px 12px', color: '#475569', fontSize: '11px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '6px 12px', color: '#475569', fontSize: '11px', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '6px 12px', color: '#475569', fontSize: '11px', textAlign: 'left' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {collection.fields.map((f) => (
              <FieldRow key={f.name} field={f} />
            ))}
          </tbody>
        </table>

        {/* Indexes */}
        {collection.indexes.length > 0 && (
          <>
            <div style={{ padding: '12px 16px 4px', color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>
              INDEXES ({collection.indexes.length})
            </div>
            <div style={{ padding: '0 16px 8px' }}>
              {collection.indexes.map((idx, i) => (
                <IndexRow key={i} index={idx} />
              ))}
            </div>
          </>
        )}

        {/* Relations */}
        {(incomingRefs.length > 0 || outgoingRefs.length > 0) && (
          <>
            <div style={{ padding: '12px 16px 8px', color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>
              RELATIONS
            </div>
            <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {outgoingRefs.map((r, i) => (
                <div
                  key={i}
                  style={{
                    background: '#0d2438',
                    border: '1px solid #1e3a5f',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedCollection(r.to)}
                >
                  <span style={{ color: '#60a5fa' }}>{collection.name}</span>
                  <span style={{ color: '#475569', margin: '0 6px' }}>
                    .{r.field} →
                  </span>
                  <span style={{ color: '#10b981' }}>{r.to}</span>
                  <span
                    style={{
                      float: 'right',
                      background: '#0f172a',
                      color: '#94a3b8',
                      fontSize: '9px',
                      padding: '2px 5px',
                      borderRadius: '3px',
                    }}
                  >
                    {r.type}
                  </span>
                </div>
              ))}
              {incomingRefs.map((r, i) => (
                <div
                  key={i}
                  style={{
                    background: '#1a1025',
                    border: '1px solid #2d1b69',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedCollection(r.from)}
                >
                  <span style={{ color: '#a78bfa' }}>{r.from}</span>
                  <span style={{ color: '#475569', margin: '0 6px' }}>
                    .{r.field} →
                  </span>
                  <span style={{ color: '#60a5fa' }}>{collection.name}</span>
                  <span
                    style={{
                      float: 'right',
                      background: '#0f172a',
                      color: '#94a3b8',
                      fontSize: '9px',
                      padding: '2px 5px',
                      borderRadius: '3px',
                    }}
                  >
                    ← incoming
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
