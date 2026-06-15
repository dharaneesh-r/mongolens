import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { ParsedCollection } from '../types/schema.types';

const TYPE_COLORS: Record<string, string> = {
  ObjectId: '#10b981',
  String: '#60a5fa',
  Number: '#f59e0b',
  Boolean: '#a78bfa',
  Date: '#f472b6',
  Array: '#fb923c',
  Mixed: '#94a3b8',
  Buffer: '#6b7280',
  Map: '#34d399',
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || TYPE_COLORS['Mixed'];
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    ObjectId: '🔗',
    String: '📝',
    Number: '🔢',
    Boolean: '☑️',
    Date: '📅',
    Array: '📋',
    Mixed: '🎲',
  };
  return icons[type] || '•';
}

interface CollectionNodeData extends ParsedCollection {
  isSelected?: boolean;
  isDead?: boolean;
}

function CollectionCard({ data, selected }: NodeProps<CollectionNodeData>) {
  const visibleFields = data.fields.slice(0, 8);
  const hiddenCount = data.fields.length - visibleFields.length;

  const borderColor = data.isDead
    ? '#ef4444'
    : selected
    ? '#10b981'
    : '#334155';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f1f35 100%)',
        border: `2px solid ${borderColor}`,
        borderRadius: '12px',
        minWidth: '220px',
        maxWidth: '260px',
        boxShadow: selected
          ? '0 0 20px rgba(16, 185, 129, 0.3)'
          : '0 4px 24px rgba(0,0,0,0.4)',
        fontFamily: 'monospace',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: data.isDead
            ? 'linear-gradient(90deg, #450a0a, #1e293b)'
            : 'linear-gradient(90deg, #064e3b, #1e293b)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #334155',
        }}
      >
        <span style={{ fontSize: '16px' }}>{data.isDead ? '⚠️' : '📦'}</span>
        <div>
          <div
            style={{
              color: data.isDead ? '#fca5a5' : '#10b981',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.5px',
            }}
          >
            {data.name}
          </div>
          <div style={{ color: '#64748b', fontSize: '10px' }}>
            {data.fields.length} fields • {data.indexes.length} index
            {data.indexes.length !== 1 ? 'es' : ''}
          </div>
        </div>
        {data.isDead && (
          <span
            style={{
              marginLeft: 'auto',
              background: '#450a0a',
              color: '#fca5a5',
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #7f1d1d',
            }}
          >
            DEAD
          </span>
        )}
      </div>

      {/* Fields */}
      <div style={{ padding: '6px 0' }}>
        {visibleFields.map((field) => (
          <div
            key={field.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '3px 14px',
              gap: '8px',
            }}
          >
            <span style={{ color: '#cbd5e1', fontSize: '12px', flex: 1 }}>
              {field.name}
            </span>
            <span
              style={{
                color: getTypeColor(field.type),
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {getTypeIcon(field.type)}{' '}
              {field.isArray ? `${field.type}[]` : field.type}
              {field.ref ? ` → ${field.ref}` : ''}
            </span>
          </div>
        ))}
        {hiddenCount > 0 && (
          <div
            style={{
              padding: '3px 14px',
              color: '#475569',
              fontSize: '11px',
              textAlign: 'center',
            }}
          >
            +{hiddenCount} more fields
          </div>
        )}
      </div>

      {/* Indexes bar */}
      {data.indexes.length > 0 && (
        <div
          style={{
            borderTop: '1px solid #1e3a5f',
            padding: '6px 14px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
          }}
        >
          {data.indexes.map((idx, i) => (
            <span
              key={i}
              style={{
                background: '#0f2d4a',
                border: '1px solid #1e4a7a',
                color: '#60a5fa',
                fontSize: '9px',
                padding: '2px 5px',
                borderRadius: '3px',
              }}
            >
              {idx.options?.unique ? '🔑' : '📇'}{' '}
              {Object.keys(idx.fields).join(', ')}
            </span>
          ))}
        </div>
      )}

      <Handle type="target" position={Position.Left} style={{ background: '#10b981', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: '#10b981', width: 8, height: 8 }} />
      <Handle type="target" position={Position.Top} style={{ background: '#10b981', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#10b981', width: 8, height: 8 }} />
    </div>
  );
}

export default memo(CollectionCard);
