import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, X, MapPin, Anchor, Globe, Tag } from 'lucide-react';

interface EEZLegendHUDProps {
  visible: boolean;
  onClose: () => void;
  showLabels?: boolean;
  onToggleLabels?: () => void;
}

export const EEZLegendHUD: React.FC<EEZLegendHUDProps> = ({
  visible,
  onClose,
  showLabels = true,
  onToggleLabels,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '76px',
        left: '24px',
        width: collapsed ? '300px' : '360px',
        maxHeight: 'calc(100vh - 170px)',
        background: 'rgba(10, 16, 28, 0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(239, 68, 68, 0.45)',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65), 0 0 20px rgba(239, 68, 68, 0.15)',
        color: '#f8fafc',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        zIndex: 40,
        overflowY: 'auto',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Top Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={13} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#ffffff' }}>
              INDIAN OCEAN EEZ
            </div>
            <div style={{ fontSize: '8.5px', color: '#94a3b8', letterSpacing: '0.04em' }}>
              UNCLOS Maritime Boundaries
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onToggleLabels && (
            <button
              onClick={onToggleLabels}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: showLabels ? 'rgba(34, 211, 238, 0.18)' : 'rgba(100, 116, 139, 0.2)',
                border: `1px solid ${showLabels ? 'rgba(34, 211, 238, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                borderRadius: '4px',
                padding: '3px 7px',
                color: showLabels ? '#22d3ee' : '#94a3b8',
                fontSize: '8px',
                fontFamily: 'monospace',
                fontWeight: 600,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title={showLabels ? 'Click to hide territory name tags on the globe' : 'Click to show territory name tags on the globe'}
            >
              <Tag size={10} color={showLabels ? '#22d3ee' : '#94a3b8'} />
              <span>TAGS: {showLabels ? 'ON' : 'OFF'}</span>
            </button>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title={collapsed ? 'Expand details' : 'Collapse details'}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Close legend"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* ── Total Sovereign Area Banner ── */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.4) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              padding: '8px 10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#fca5a5', letterSpacing: '0.06em' }}>
                INDIA TOTAL EEZ DOMAIN
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                2,323,948 km²
              </span>
            </div>
            <div style={{ fontSize: '8px', color: '#cbd5e1', marginTop: '3px', lineHeight: 1.3 }}>
              Full sovereign rights covering 200 nautical miles of mainland & island oceanic waters.
            </div>
          </div>

          {/* ── Island Archipelagos Breakdown ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>
              TERRITORY COVERAGE
            </div>

            {/* Lakshadweep */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '4px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#ffffff' }}>Mainland & Lakshadweep</div>
                  <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>Arabian Sea & Bay of Bengal • 200 NM</div>
                </div>
              </div>
              <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#fca5a5', fontWeight: 700 }}>
                1,659,500 km²
              </span>
            </div>

            {/* Andaman & Nicobar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '4px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#ffffff' }}>Andaman & Nicobar Is.</div>
                  <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>Port Blair to Indira Point (6°45'N)</div>
                </div>
              </div>
              <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#fca5a5', fontWeight: 700 }}>
                664,448 km²
              </span>
            </div>

            {/* Maldives */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '4px',
                border: '1px solid rgba(14, 165, 233, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9' }} />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#ffffff' }}>Maldives</div>
                  <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>Eight Degree Channel Demarcation</div>
                </div>
              </div>
              <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                923,833 km²
              </span>
            </div>

            {/* Sri Lanka */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '4px',
                border: '1px solid rgba(14, 165, 233, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9' }} />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#ffffff' }}>Sri Lanka</div>
                  <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>Palk Strait & Gulf of Mannar</div>
                </div>
              </div>
              <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                533,559 km²
              </span>
            </div>
          </div>

          {/* ── Cartographic Symbology Legend ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>
              BOUNDARY SYMBOLOGY
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '8.5px', color: '#cbd5e1' }}>
              <div style={{ width: '22px', height: '3px', background: '#ef4444', borderRadius: '2px', boxShadow: '0 0 6px #ef4444' }} />
              <span>Solid Red Tube — India Sovereign 200 NM Outer Limit</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '8.5px', color: '#cbd5e1' }}>
              <div style={{ width: '22px', height: '3px', background: '#0ea5e9', borderRadius: '2px', boxShadow: '0 0 6px #0ea5e9' }} />
              <span>Solid Cyan Tube — Neighboring Sovereign Outer Limit</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '8.5px', color: '#cbd5e1' }}>
              <div
                style={{
                  width: '22px',
                  height: '3px',
                  borderTop: '3px dashed #fde047',
                  boxShadow: '0 0 6px rgba(253, 224, 71, 0.6)',
                }}
              />
              <span>Dashed Gold Line — Bilateral Treaty Demarcation (7 Treaties)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '8.5px', color: '#cbd5e1' }}>
              <div style={{ width: '22px', height: '10px', background: 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '2px' }} />
              <span>Translucent Wash — Sovereign 200 NM Maritime Waters</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
