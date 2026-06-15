import React from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';
import type { SchemaIndex } from '../../types/schema.types';

interface IndexEntry {
  collection: string;
  index: SchemaIndex;
  hasWarning: boolean;
  warningMessage?: string;
}

export default function IndexViewer() {
  const { graph } = useSchemaStore();

  // Build flat list of all indexes and check for warnings
  const entries: IndexEntry[] = [];

  // Collect all ref fields that ideally should have indexes
  const refFields: Map<string, Set<string>> = new Map(); // collName -> set of field names used in refs (as target)
  for (const col of graph.collections) {
    for (const field of col.fields) {
      if (field.ref) {
        // The field in col references another collection — it should ideally be indexed
        if (!refFields.has(col.name)) refFields.set(col.name, new Set());
        refFields.get(col.name)!.add(field.name);
      }
    }
  }

  for (const col of graph.collections) {
    if (col.indexes.length === 0) {
      // Check if this collection has ref fields that lack indexes
      const refs = refFields.get(col.name) || new Set();
      if (refs.size > 0) {
        for (const fieldName of refs) {
          entries.push({
            collection: col.name,
            index: { fields: { [fieldName]: 1 } },
            hasWarning: true,
            warningMessage: `Field "${fieldName}" is used as a reference but has no index`,
          });
        }
      }
      continue;
    }

    const indexedFields = new Set<string>();
    for (const idx of col.indexes) {
      for (const key of Object.keys(idx.fields)) {
        indexedFields.add(key);
      }
    }

    const refs = refFields.get(col.name) || new Set();
    const unindexedRefs = [...refs].filter((f) => !indexedFields.has(f));

    for (const idx of col.indexes) {
      entries.push({
        collection: col.name,
        index: idx,
        hasWarning: false,
      });
    }

    // Add warnings for unindexed ref fields
    for (const fieldName of unindexedRefs) {
      entries.push({
        collection: col.name,
        index: { fields: { [fieldName]: 1 } },
        hasWarning: true,
        warningMessage: `Field "${fieldName}" is used as a reference but has no index`,
      });
    }
  }

  const warnings = entries.filter((e) => e.hasWarning);
  const actual = entries.filter((e) => !e.hasWarning);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px' }}>
      <h1 style={{ color: '#e2e8f0', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>
        📇 Index Viewer
      </h1>
      <p style={{ color: '#475569', fontSize: '13px', margin: '0 0 24px' }}>
        All indexes across your Mongoose collections. Warnings appear for reference fields without indexes.
      </p>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Indexes', value: actual.length, color: '#10b981', icon: '📇' },
          { label: 'Warnings', value: warnings.length, color: '#f59e0b', icon: '⚠️' },
          {
            label: 'Unique Indexes',
            value: actual.filter((e) => e.index.options?.unique).length,
            color: '#60a5fa',
            icon: '🔑',
          },
          {
            label: 'Collections Indexed',
            value: new Set(actual.map((e) => e.collection)).size,
            color: '#a78bfa',
            icon: '📦',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: '#0f172a',
              border: `1px solid ${stat.color}30`,
              borderRadius: '10px',
              padding: '14px 20px',
              minWidth: '140px',
              flex: 1,
            }}
          >
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={{ color: stat.color, fontSize: '24px', fontWeight: 700 }}>
              {stat.value}
            </div>
            <div style={{ color: '#475569', fontSize: '12px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 12px' }}>
            ⚠️ INDEX WARNINGS ({warnings.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {warnings.map((entry, i) => (
              <div
                key={i}
                style={{
                  background: '#1c1100',
                  border: '1px solid #92400e',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <div>
                  <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: '13px' }}>
                    {entry.collection}
                  </div>
                  <div style={{ color: '#92400e', fontSize: '12px', marginTop: '2px' }}>
                    {entry.warningMessage}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <code
                    style={{
                      background: '#0f172a',
                      color: '#f59e0b',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}
                  >
                    {`{ ${Object.entries(entry.index.fields)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(', ')} }`}
                  </code>
                  <span style={{ color: '#92400e', marginLeft: '8px', fontSize: '10px' }}>
                    MISSING
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All indexes table */}
      <h2 style={{ color: '#64748b', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 12px' }}>
        ALL INDEXES ({actual.length})
      </h2>
      {actual.length === 0 ? (
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '32px',
            textAlign: 'center',
            color: '#334155',
          }}
        >
          No indexes found. Upload model files to analyze indexes.
        </div>
      ) : (
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', background: '#060f1e' }}>
                {['Collection', 'Fields', 'Options'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      color: '#334155',
                      fontSize: '11px',
                      textAlign: 'left',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actual.map((entry, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid #1e293b' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#1e293b40')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <td style={{ padding: '10px 16px', color: '#10b981', fontWeight: 600, fontSize: '13px' }}>
                    {entry.collection}
                  </td>
                  <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa' }}>
                    {'{ '}
                    {Object.entries(entry.index.fields)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(', ')}
                    {' }'}
                  </td>
                  <td style={{ padding: '10px 16px', display: 'flex', gap: '6px' }}>
                    {entry.index.options?.unique && (
                      <span
                        style={{
                          background: '#451a03',
                          color: '#fbbf24',
                          fontSize: '10px',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        🔑 UNIQUE
                      </span>
                    )}
                    {entry.index.options?.sparse && (
                      <span
                        style={{
                          background: '#1e1b4b',
                          color: '#a78bfa',
                          fontSize: '10px',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        SPARSE
                      </span>
                    )}
                    {!entry.index.options?.unique && !entry.index.options?.sparse && (
                      <span style={{ color: '#334155', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
