import React, { useState } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';
import type { ParsedCollection, SchemaField } from '../../types/schema.types';

const TYPE_COLORS: Record<string, string> = {
  ObjectId: '#10b981',
  String: '#60a5fa',
  Number: '#f59e0b',
  Boolean: '#a78bfa',
  Date: '#f472b6',
  Mixed: '#94a3b8',
};

function getTypeColor(t: string) {
  return TYPE_COLORS[t] || '#94a3b8';
}

function FieldRow({ field }: { field: SchemaField }) {
  const color = getTypeColor(field.type);
  return (
    <tr
      style={{
        borderBottom: '1px solid #1e293b',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b40')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <td
        style={{
          padding: '9px 16px',
          fontFamily: 'monospace',
          color: '#e2e8f0',
          fontSize: '13px',
        }}
      >
        {field.name}
        {field.required && (
          <sup style={{ color: '#ef4444', fontSize: '10px', marginLeft: '3px' }}>req</sup>
        )}
      </td>
      <td style={{ padding: '9px 16px' }}>
        <span
          style={{
            color,
            background: `${color}18`,
            border: `1px solid ${color}40`,
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
        >
          {field.isArray ? `[${field.type}]` : field.type}
        </span>
      </td>
      <td style={{ padding: '9px 16px', color: '#64748b', fontSize: '12px' }}>
        {field.ref && <span style={{ color: '#10b981' }}>→ {field.ref}</span>}
        {field.unique && (
          <span
            style={{
              marginLeft: '8px',
              background: '#451a03',
              color: '#fbbf24',
              fontSize: '10px',
              padding: '1px 5px',
              borderRadius: '3px',
            }}
          >
            UNIQUE
          </span>
        )}
      </td>
    </tr>
  );
}

function CollectionPanel({ col }: { col: ParsedCollection }) {
  const { graph } = useSchemaStore();
  const inRef = graph.relations.filter((r) => r.to === col.name);
  const outRef = graph.relations.filter((r) => r.from === col.name);
  const isDead = graph.deadCollections.includes(col.name);

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(90deg, #064e3b22, transparent)',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>{isDead ? '⚠️' : '📦'}</span>
          <div>
            <h2
              style={{
                color: isDead ? '#fca5a5' : '#10b981',
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              {col.name}
            </h2>
            <p style={{ color: '#475569', margin: '2px 0 0', fontSize: '12px' }}>
              {col.fileName} • {col.variableName}
            </p>
          </div>
          {isDead && (
            <span
              style={{
                marginLeft: 'auto',
                background: '#450a0a',
                color: '#fca5a5',
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '20px',
                border: '1px solid #7f1d1d',
              }}
            >
              🔴 Dead Collection
            </span>
          )}
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '12px',
          }}
        >
          {[
            { label: 'Fields', value: col.fields.length, color: '#60a5fa' },
            { label: 'Indexes', value: col.indexes.length, color: '#10b981' },
            { label: 'Out Refs', value: outRef.length, color: '#a78bfa' },
            { label: 'In Refs', value: inRef.length, color: '#f472b6' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ color: s.color, fontWeight: 700, fontSize: '18px' }}>{s.value}</div>
              <div style={{ color: '#475569', fontSize: '11px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fields Table */}
      <div style={{ padding: '12px 20px 4px' }}>
        <h3 style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', margin: 0 }}>
          FIELDS
        </h3>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1e293b' }}>
            {['Name', 'Type', 'Notes'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '6px 16px',
                  color: '#334155',
                  fontSize: '11px',
                  textAlign: 'left',
                  fontWeight: 600,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {col.fields.map((f) => (
            <FieldRow key={f.name} field={f} />
          ))}
        </tbody>
      </table>

      {/* Indexes */}
      {col.indexes.length > 0 && (
        <div style={{ padding: '16px 20px' }}>
          <h3 style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 10px' }}>
            INDEXES
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {col.indexes.map((idx, i) => (
              <div
                key={i}
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e3a5f',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#60a5fa',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  {idx.options?.unique ? '🔑 ' : '📇 '}
                  {'{ '}
                  {Object.entries(idx.fields)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ')}
                  {' }'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {idx.options?.unique && (
                    <span style={{ color: '#f59e0b', fontSize: '10px' }}>UNIQUE</span>
                  )}
                  {idx.options?.sparse && (
                    <span style={{ color: '#a78bfa', fontSize: '10px' }}>SPARSE</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relations */}
      {(inRef.length > 0 || outRef.length > 0) && (
        <div style={{ padding: '0 20px 20px' }}>
          <h3 style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 10px' }}>
            RELATIONS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {outRef.map((r, i) => (
              <div
                key={i}
                style={{
                  background: '#0d2438',
                  border: '1px solid #1e3a5f',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#94a3b8' }}>→ outgoing</span>
                <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>.{r.field}</span>
                <span style={{ color: '#475569' }}>→</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>{r.to}</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    background: '#0f172a',
                    color: '#64748b',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                  }}
                >
                  {r.type}
                </span>
              </div>
            ))}
            {inRef.map((r, i) => (
              <div
                key={i}
                style={{
                  background: '#160d2a',
                  border: '1px solid #2d1b69',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#94a3b8' }}>← incoming</span>
                <span style={{ color: '#a78bfa', fontWeight: 600 }}>{r.from}</span>
                <span style={{ color: '#475569' }}>via</span>
                <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>.{r.field}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CollectionExplorer() {
  const { graph } = useSchemaStore();
  const [selected, setSelected] = useState<string>(
    graph.collections[0]?.name || ''
  );
  const [search, setSearch] = useState('');

  const filtered = graph.collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCol = graph.collections.find((c) => c.name === selected);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left list */}
      <div
        style={{
          width: '220px',
          borderRight: '1px solid #1e293b',
          background: '#060f1e',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '12px' }}>
          <input
            type="text"
            placeholder="🔍 Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#e2e8f0',
              borderRadius: '6px',
              padding: '7px 10px',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((col) => {
            const isDead = graph.deadCollections.includes(col.name);
            const isActive = col.name === selected;
            return (
              <button
                key={col.name}
                onClick={() => setSelected(col.name)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 16px',
                  background: isActive
                    ? 'linear-gradient(90deg, #064e3b40, #0f172a40)'
                    : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                  color: isActive ? '#10b981' : isDead ? '#fca5a5' : '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s',
                }}
              >
                <span>{isDead ? '⚠️' : '📦'}</span>
                <span style={{ fontWeight: isActive ? 600 : 400 }}>{col.name}</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    color: '#334155',
                    fontSize: '10px',
                  }}
                >
                  {col.fields.length}f
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right detail */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {selectedCol ? (
          <CollectionPanel col={selectedCol} />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#334155',
              fontSize: '14px',
            }}
          >
            Select a collection to view details
          </div>
        )}
      </div>
    </div>
  );
}
