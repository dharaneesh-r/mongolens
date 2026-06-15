import React, { useState } from 'react';
import SchemaGraph from './pages/SchemaGraph';
import CollectionExplorer from './pages/CollectionExplorer';
import IndexViewer from './pages/IndexViewer';
import DeadCollections from './pages/DeadCollections';
import CodeGenerator from './pages/CodeGenerator';
import { useSchemaStore } from '../store/useSchemaStore';

type Tab = 'graph' | 'explorer' | 'indexes' | 'dead' | 'generate';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'graph', label: 'Schema Graph', icon: '🕸️' },
  { id: 'explorer', label: 'Collections', icon: '📦' },
  { id: 'indexes', label: 'Indexes', icon: '📇' },
  { id: 'dead', label: 'Dead', icon: '🔴' },
  { id: 'generate', label: 'Generate', icon: '⚡' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('graph');
  const { graph, isDemo } = useSchemaStore();

  const deadCount = graph.deadCollections.length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#060f1e',
        color: '#e2e8f0',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          background: '#0a1628',
          borderBottom: '1px solid #1e293b',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          flexShrink: 0,
          height: '44px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '20px',
            paddingRight: '20px',
            borderRight: '1px solid #1e293b',
          }}
        >
          <span style={{ fontSize: '18px' }}>🔬</span>
          <span
            style={{
              color: '#10b981',
              fontWeight: 800,
              fontSize: '15px',
              letterSpacing: '-0.5px',
            }}
          >
            Mongo<span style={{ color: '#60a5fa' }}>Lens</span>
          </span>
        </div>

        {/* Tabs */}
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const badge = tab.id === 'dead' && deadCount > 0 ? deadCount : null;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent',
                color: isActive ? '#10b981' : '#64748b',
                padding: '0 14px',
                height: '100%',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                }
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {badge && (
                <span
                  style={{
                    background: '#450a0a',
                    color: '#fca5a5',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Right side: demo badge + version */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isDemo && (
            <span
              style={{
                color: '#475569',
                fontSize: '11px',
                fontStyle: 'italic',
              }}
            >
              Demo data — upload your models to analyze
            </span>
          )}
          <span style={{ color: '#1e293b', fontSize: '11px' }}>v1.0.0</span>
        </div>
      </div>

      {/* Page Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'graph' && <SchemaGraph />}
        {activeTab === 'explorer' && <CollectionExplorer />}
        {activeTab === 'indexes' && <IndexViewer />}
        {activeTab === 'dead' && <DeadCollections />}
        {activeTab === 'generate' && <CodeGenerator />}
      </div>
    </div>
  );
}
