import React, { useCallback, useRef } from 'react';
import { useSchemaStore } from '../../store/useSchemaStore';
import GraphCanvas from '../../components/GraphCanvas';
import Sidebar from '../../components/Sidebar';
import { parseFiles } from '../../parser/schemaParser';
import { toPng } from 'html-to-image';

export default function SchemaGraph() {
  const { graph, isDemo, setGraph, resetToDemo } = useSchemaStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const parsed = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          content: await file.text(),
        }))
      );

      const collections = parseFiles(parsed);
      if (collections.length > 0) {
        setGraph(collections);
      } else {
        alert('No Mongoose schemas found in the selected files. Make sure to select .js or .ts model files.');
      }
      // Reset input so same files can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [setGraph]
  );

  const handleDownloadImage = useCallback(() => {
    const el = document.querySelector('.react-flow') as HTMLElement;
    if (!el) return;

    toPng(el, {
      backgroundColor: '#060f1e',
      pixelRatio: 2,
    })
      .then((dataUrl) => {
        const a = document.createElement('a');
        a.setAttribute('download', 'mongolens-schema.png');
        a.setAttribute('href', dataUrl);
        a.click();
      })
      .catch((err) => {
        console.error('Failed to export image', err);
        alert('Failed to export image.');
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '10px 16px',
          background: '#0a1628',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 700 }}>
          🔍 Schema Graph
        </span>

        {isDemo && (
          <span
            style={{
              background: '#064e3b',
              color: '#6ee7b7',
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '20px',
              border: '1px solid #10b981',
              fontWeight: 600,
            }}
          >
            DEMO MODE
          </span>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Stats */}
          <div style={{ color: '#475569', fontSize: '12px', fontFamily: 'monospace' }}>
            <span style={{ color: '#60a5fa' }}>{graph.collections.length}</span> collections •{' '}
            <span style={{ color: '#10b981' }}>{graph.relations.length}</span> relations
            {graph.deadCollections.length > 0 && (
              <>
                {' '}•{' '}
                <span style={{ color: '#ef4444' }}>{graph.deadCollections.length}</span> dead
              </>
            )}
          </div>

          {!isDemo && (
            <button
              onClick={resetToDemo}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: '#94a3b8',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ↩ Reset Demo
            </button>
          )}

          <button
            onClick={handleDownloadImage}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#e2e8f0',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📸 Download PNG
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".js,.ts,.jsx,.tsx"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            id="file-upload-input"
          />
          <label
            htmlFor="file-upload-input"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              padding: '7px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 12px rgba(16,185,129,0.3)',
            }}
          >
            📁 Upload Model Files
          </label>
        </div>
      </div>

      {/* Graph area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <GraphCanvas graph={graph} />
        <Sidebar />
      </div>

      {/* Legend */}
      <div
        style={{
          padding: '6px 16px',
          background: '#060f1e',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#334155', fontSize: '11px' }}>LEGEND</span>
        <LegendItem color="#10b981" label="one-to-one" />
        <LegendItem color="#60a5fa" label="one-to-many" dashed />
        <LegendItem color="#a78bfa" label="many-to-many" animated />
        <LegendItem color="#ef4444" label="dead collection" isNode />
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  dashed,
  animated,
  isNode,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  animated?: boolean;
  isNode?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {isNode ? (
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            border: `2px solid ${color}`,
          }}
        />
      ) : (
        <div
          style={{
            width: '24px',
            height: '2px',
            background: dashed || animated ? 'none' : color,
            borderTop: dashed ? `2px dashed ${color}` : animated ? `2px dashed ${color}` : 'none',
            borderColor: color,
          }}
        />
      )}
      <span style={{ color: '#475569', fontSize: '11px' }}>{label}</span>
    </div>
  );
}
