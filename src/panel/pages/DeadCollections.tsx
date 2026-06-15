import React from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';

export default function DeadCollections() {
  const { graph } = useSchemaStore();

  const deadCollections = graph.collections.filter((c) =>
    graph.deadCollections.includes(c.name)
  );

  const totalCollections = graph.collections.length;
  const deadPct =
    totalCollections > 0
      ? Math.round((deadCollections.length / totalCollections) * 100)
      : 0;

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px' }}>
      <h1 style={{ color: '#e2e8f0', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>
        🔴 Dead Collections
      </h1>
      <p style={{ color: '#475569', fontSize: '13px', margin: '0 0 24px' }}>
        Collections that are never referenced by any other schema. These may be unused, deprecated,
        or orphaned models.
      </p>

      {/* Overview */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[
          {
            label: 'Total Collections',
            value: totalCollections,
            color: '#60a5fa',
            icon: '📦',
          },
          {
            label: 'Dead Collections',
            value: deadCollections.length,
            color: '#ef4444',
            icon: '🔴',
          },
          {
            label: 'Active Collections',
            value: totalCollections - deadCollections.length,
            color: '#10b981',
            icon: '✅',
          },
          {
            label: 'Dead %',
            value: `${deadPct}%`,
            color: deadPct > 20 ? '#ef4444' : deadPct > 0 ? '#f59e0b' : '#10b981',
            icon: '📊',
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

      {deadCollections.length === 0 ? (
        <div
          style={{
            background: '#022c22',
            border: '1px solid #064e3b',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
          <h2 style={{ color: '#10b981', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>
            No dead collections!
          </h2>
          <p style={{ color: '#4ade80', fontSize: '14px', margin: 0 }}>
            All collections are referenced by at least one other schema. Your schema graph is well-connected.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: '#1c0a0a',
              border: '1px solid #450a0a',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '13px',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '18px' }}>💡</span>
            <span>
              A collection is considered "dead" if no other collection references it via a{' '}
              <code
                style={{
                  background: '#0f172a',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                }}
              >
                ref
              </code>{' '}
              field. This doesn't mean the model is unused in application code.
            </span>
          </div>

          {deadCollections.map((col) => {
            const outgoingRefs = graph.relations.filter((r) => r.from === col.name);
            const fieldsWithRef = col.fields.filter((f) => f.ref);

            return (
              <div
                key={col.name}
                style={{
                  background: '#0f172a',
                  border: '2px solid #450a0a',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '14px 20px',
                    background: 'linear-gradient(90deg, #450a0a30, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: '1px solid #1e293b',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>⚠️</span>
                  <div>
                    <h2 style={{ color: '#fca5a5', margin: 0, fontSize: '16px', fontWeight: 700 }}>
                      {col.name}
                    </h2>
                    <p style={{ color: '#7f1d1d', margin: '2px 0 0', fontSize: '12px' }}>
                      {col.fileName} • {col.fields.length} fields • {col.indexes.length} indexes
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <span
                      style={{
                        background: '#450a0a',
                        color: '#fca5a5',
                        fontSize: '11px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        border: '1px solid #7f1d1d',
                        fontWeight: 600,
                      }}
                    >
                      🔴 UNREFERENCED
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div style={{ padding: '16px 20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {/* Possible causes */}
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h3 style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 10px' }}>
                      POSSIBLE CAUSES
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { icon: '🗑️', text: 'Deprecated model no longer in use' },
                        { icon: '🔗', text: 'Referenced only via string queries, not ref fields' },
                        { icon: '📦', text: 'Standalone collection used as a lookup table' },
                        { icon: '🧪', text: 'Test or seed data collection' },
                      ].map((item) => (
                        <div key={item.text} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#64748b', alignItems: 'flex-start' }}>
                          <span>{item.icon}</span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fields snapshot */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 10px' }}>
                      FIELDS SNAPSHOT
                    </h3>
                    <div
                      style={{
                        background: '#060f1e',
                        borderRadius: '6px',
                        padding: '10px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: '#475569',
                      }}
                    >
                      {col.fields.slice(0, 6).map((f) => (
                        <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#94a3b8' }}>{f.name}</span>
                          <span style={{ color: '#334155' }}>{f.type}</span>
                        </div>
                      ))}
                      {col.fields.length > 6 && (
                        <div style={{ color: '#334155', textAlign: 'center', marginTop: '4px' }}>
                          +{col.fields.length - 6} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Outgoing refs */}
                  {outgoingRefs.length > 0 && (
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h3 style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 10px' }}>
                        REFERENCES TO
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {outgoingRefs.map((r, i) => (
                          <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>.{r.field}</span>
                            <span style={{ color: '#334155' }}>→</span>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>{r.to}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommendation */}
                <div
                  style={{
                    margin: '0 20px 16px',
                    background: '#0f0a00',
                    border: '1px solid #451a03',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    color: '#92400e',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <span>💬</span>
                  <span>
                    <strong style={{ color: '#fbbf24' }}>Recommendation:</strong> Review whether{' '}
                    <code
                      style={{
                        background: '#1c0a00',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        color: '#fbbf24',
                      }}
                    >
                      {col.name}
                    </code>{' '}
                    is still actively used in your application. If not, consider removing the model file
                    and its MongoDB collection to reduce schema complexity.
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
