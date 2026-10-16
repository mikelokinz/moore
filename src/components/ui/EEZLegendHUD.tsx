import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Shield, ChevronDown, ChevronUp, X, Tag, Compass, CheckCircle2, Globe, ExternalLink } from 'lucide-react';
import type { BuoyLocation } from '../../services/buoy/buoyTypes';
import { getFleetEEZAnalysis, OMNI_STATION_EEZ_REGISTRY } from '../../utils/eezJurisdiction';

interface EEZLegendHUDProps {
  visible: boolean;
  onClose: () => void;
  showLabels?: boolean;
  onToggleLabels?: () => void;
  buoys?: BuoyLocation[];
  onSelectBuoy?: (buoyId: string) => void;
}

export const EEZLegendHUD: React.FC<EEZLegendHUDProps> = ({
  visible,
  onClose,
  showLabels = true,
  onToggleLabels,
  buoys,
  onSelectBuoy,
}) => {
  const hudRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');

  // Close on Outside Click or Escape key
  useEffect(() => {
    if (!visible) return;

    const handleOutsideClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (hudRef.current && hudRef.current.contains(target)) {
        return;
      }
      if (
        target.closest('[data-eez-trigger="true"]') ||
        target.closest('[data-menu-trigger="true"]') ||
        target.closest('[data-menu-popover="true"]')
      ) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handleOutsideClick, { capture: true });
      window.addEventListener('mousedown', handleOutsideClick, { capture: true });
    }, 40);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleOutsideClick, { capture: true });
      window.removeEventListener('mousedown', handleOutsideClick, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  // Compute fleet jurisdiction analysis
  const fleetAnalysis = useMemo(() => {
    // If buoys are provided, use them; otherwise use authoritative OMNI catalog
    const stationList = buoys && buoys.length > 0
      ? buoys.map((b) => ({ id: b.id, name: b.name, latitude: b.latitude, longitude: b.longitude }))
      : Object.values(OMNI_STATION_EEZ_REGISTRY).map((s) => ({
          id: s.name,
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
        }));
    return getFleetEEZAnalysis(stationList);
  }, [buoys]);

  if (!visible) return null;

  return (
    <div
      ref={hudRef}
      data-eez-hud="true"
      style={{
        position: 'absolute',
        top: '175px',
        left: '24px',
        width: collapsed ? '300px' : '390px',
        maxHeight: 'calc(100vh - 200px)',
        background: 'linear-gradient(145deg, rgba(6, 32, 22, 0.90) 0%, rgba(4, 20, 16, 0.96) 100%)',
        backdropFilter: 'blur(30px) saturate(220%)',
        WebkitBackdropFilter: 'blur(30px) saturate(220%)',
        border: '1px solid rgba(52, 211, 153, 0.45)',
        borderTop: '1px solid rgba(167, 243, 208, 0.65)',
        borderRadius: '16px',
        boxShadow:
          '0 20px 50px rgba(0, 0, 0, 0.85), inset 0 1.5px 2px rgba(255, 255, 255, 0.3), 0 0 35px rgba(16, 185, 129, 0.25)',
        color: '#f8fafc',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        zIndex: 40,
        overflowY: 'auto',
        animation: 'slideInFromLeft 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
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
          borderBottom: '1px solid rgba(52, 211, 153, 0.25)',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(15, 23, 42, 0) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.35)',
            }}
          >
            <Shield size={13} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#ffffff' }}>
              INDIAN OCEAN EEZ
            </div>
            <div style={{ fontSize: '8.5px', color: '#6ee7b7', letterSpacing: '0.04em' }}>
              UNCLOS Maritime Sovereignty & Fleet Audit
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
                background: showLabels ? 'rgba(52, 211, 153, 0.18)' : 'rgba(100, 116, 139, 0.2)',
                border: `1px solid ${showLabels ? 'rgba(52, 211, 153, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                borderRadius: '4px',
                padding: '3px 7px',
                color: showLabels ? '#6ee7b7' : '#94a3b8',
                fontSize: '8px',
                fontFamily: 'monospace',
                fontWeight: 600,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title={showLabels ? 'Click to hide territory name tags on the globe' : 'Click to show territory name tags on the globe'}
            >
              <Tag size={10} color={showLabels ? '#6ee7b7' : '#94a3b8'} />
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
          {/* ── Sub Navigation Tabs: Boundaries vs Fleet Jurisdiction Audit ── */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.28)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid rgba(52, 211, 153, 0.2)',
            }}
          >
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'overview' ? 'rgba(16, 185, 129, 0.28)' : 'transparent',
                color: activeTab === 'overview' ? '#6ee7b7' : '#94a3b8',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              EEZ BOUNDARIES
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'audit' ? 'rgba(16, 185, 129, 0.28)' : 'transparent',
                color: activeTab === 'audit' ? '#6ee7b7' : '#94a3b8',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Compass size={11} color={activeTab === 'audit' ? '#6ee7b7' : '#94a3b8'} />
              <span>BUOY AUDIT ({fleetAnalysis.totalBuoys})</span>
            </button>
          </div>

          {activeTab === 'overview' ? (
            <>
              {/* ── Total Sovereign Area Banner ── */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 28, 20, 0.5) 100%)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#6ee7b7', letterSpacing: '0.06em' }}>
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
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 6px #10b981',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#ffffff' }}>Mainland & Lakshadweep</div>
                      <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>Arabian Sea & Bay of Bengal • 200 NM</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#6ee7b7', fontWeight: 700 }}>
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
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 6px #10b981',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#ffffff' }}>Andaman & Nicobar Is.</div>
                      <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>Port Blair to Indira Point (6°45'N)</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#6ee7b7', fontWeight: 700 }}>
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
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                        boxShadow: '0 0 6px #38bdf8',
                      }}
                    />
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
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                        boxShadow: '0 0 6px #38bdf8',
                      }}
                    />
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '8.5px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>
                  BOUNDARY SYMBOLOGY
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '8.5px', color: '#cbd5e1' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '3.5px',
                      background: '#10b981',
                      borderRadius: '2px',
                      boxShadow: '0 0 8px #10b981',
                    }}
                  />
                  <span>Solid Green Tube — India Sovereign 200 NM Outer Limit</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '8.5px', color: '#cbd5e1' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '3px',
                      background: '#38bdf8',
                      borderRadius: '2px',
                      boxShadow: '0 0 6px #38bdf8',
                    }}
                  />
                  <span>Solid Blue Tube — Neighboring Sovereign Outer Limit</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '8.5px', color: '#cbd5e1' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '3px',
                      borderTop: '3px dashed #60a5fa',
                      boxShadow: '0 0 6px rgba(96, 165, 250, 0.6)',
                    }}
                  />
                  <span>Dashed Blue Line — Bilateral Treaty Demarcation (7 Treaties)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '8.5px', color: '#cbd5e1' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '10px',
                      background: 'rgba(16, 185, 129, 0.25)',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      borderRadius: '2px',
                    }}
                  />
                  <span>Translucent Green Wash — Sovereign 200 NM Maritime Waters</span>
                </div>
              </div>
            </>
          ) : (
            /* ── BUOY EEZ JURISDICTION AUDIT TAB ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Summary KPIs */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    borderRadius: '6px',
                    padding: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
                    {fleetAnalysis.inEEZCount}
                  </div>
                  <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#6ee7b7', letterSpacing: '0.04em' }}>
                    IN INDIA EEZ
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.45)',
                    borderRadius: '6px',
                    padding: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                    {fleetAnalysis.highSeasCount}
                  </div>
                  <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.04em' }}>
                    HIGH SEAS BASIN
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    padding: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                    {fleetAnalysis.totalBuoys}
                  </div>
                  <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
                    TOTAL FLEET
                  </div>
                </div>
              </div>

              {/* Explanatory Note */}
              <div
                style={{
                  background: 'rgba(6, 40, 28, 0.5)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '8px',
                  lineHeight: 1.4,
                  color: '#cbd5e1',
                }}
              >
                <div style={{ fontWeight: 700, color: '#6ee7b7', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={11} color="#6ee7b7" />
                  <span>DEEP OCEAN SENTINEL STRATEGY</span>
                </div>
                NIOT & INCOIS station deep-sea buoys both inside sovereign waters (Lakshadweep & Andaman) and in upstream international high-seas deep basins to detect approaching cyclonic storms, monsoon surges & tsunami waves prior to entering territorial borders.
              </div>

              {/* Station Listing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '220px', overflowY: 'auto' }}>
                <div style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>
                  FLEET AUDIT BREAKDOWN
                </div>

                {fleetAnalysis.inEEZBuoys.map((b) => (
                  <div
                    key={b.buoyId}
                    onClick={() => onSelectBuoy && onSelectBuoy(b.buoyId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '5px',
                      cursor: onSelectBuoy ? 'pointer' : 'default',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                          {b.buoyId}
                        </span>
                        <span
                          style={{
                            fontSize: '7px',
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            background: b.badgeBg,
                            color: b.badgeColor,
                            border: `1px solid ${b.badgeBorder}`,
                          }}
                        >
                          {b.statusBadge}
                        </span>
                      </div>
                      <div style={{ fontSize: '7.5px', color: '#94a3b8', marginTop: '1px' }}>
                        {b.subSector} • {Math.abs(b.latitude).toFixed(2)}°N, {Math.abs(b.longitude).toFixed(2)}°E
                      </div>
                    </div>
                    {onSelectBuoy && <ExternalLink size={10} color="#10b981" />}
                  </div>
                ))}

                {fleetAnalysis.highSeasBuoys.map((b) => (
                  <div
                    key={b.buoyId}
                    onClick={() => onSelectBuoy && onSelectBuoy(b.buoyId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      background: 'rgba(56, 189, 248, 0.06)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '5px',
                      cursor: onSelectBuoy ? 'pointer' : 'default',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                          {b.buoyId}
                        </span>
                        <span
                          style={{
                            fontSize: '7px',
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            background: b.badgeBg,
                            color: b.badgeColor,
                            border: `1px solid ${b.badgeBorder}`,
                          }}
                        >
                          {b.statusBadge} ({b.distanceToEEZBoundaryNM > 0 ? `${b.distanceToEEZBoundaryNM.toFixed(1)} NM off EEZ` : 'Deep Basin'})
                        </span>
                      </div>
                      <div style={{ fontSize: '7.5px', color: '#94a3b8', marginTop: '1px' }}>
                        {b.subSector} • {Math.abs(b.latitude).toFixed(2)}°N, {Math.abs(b.longitude).toFixed(2)}°E
                      </div>
                    </div>
                    {onSelectBuoy && <ExternalLink size={10} color="#38bdf8" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
