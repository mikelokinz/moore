import React, { useState, useEffect, useRef } from 'react';
import { X, Wifi, Clock, Navigation, Search, Shield, Globe } from 'lucide-react';
import type { BuoyLocation } from '../../services/buoy/buoyTypes';
import { analyzeBuoyEEZ } from '../../utils/eezJurisdiction';

interface OnlineBuoysModalProps {
  isOpen: boolean;
  onClose: () => void;
  buoys: BuoyLocation[];
  selectedBuoyId: string | null;
  onSelectBuoy: (buoy: BuoyLocation) => void;
}

export function getBuoyBasin(buoy: { id?: string; longitude: number; latitude: number }): {
  basin: string;
  badgeBg: string;
  badgeColor: string;
} {
  const id = buoy.id || '';
  if (id.includes('BD12')) {
    return { basin: 'ANDAMAN SEA', badgeBg: 'rgba(56, 189, 248, 0.15)', badgeColor: '#38bdf8' };
  }
  if (id.includes('BD14')) {
    return { basin: 'EQUATORIAL BAY OF BENGAL', badgeBg: 'rgba(56, 189, 248, 0.15)', badgeColor: '#38bdf8' };
  }
  if (id.startsWith('OMNI-BD') || id.startsWith('BD') || buoy.longitude > 77.5) {
    return { basin: 'BAY OF BENGAL', badgeBg: 'rgba(56, 189, 248, 0.15)', badgeColor: '#38bdf8' };
  }
  if (id.startsWith('OMNI-AD') || id.startsWith('AD') || buoy.longitude <= 77.5) {
    return { basin: 'ARABIAN SEA', badgeBg: 'rgba(52, 211, 153, 0.15)', badgeColor: '#34d399' };
  }
  return { basin: 'INDIAN OCEAN', badgeBg: 'rgba(148, 163, 184, 0.15)', badgeColor: '#94a3b8' };
}

export function formatPullTime(buoy: BuoyLocation): {
  display: string;
  rawUtc: string;
  stateLabel: string;
  timeAgo: string;
} {
  let ageSec: number | null = null;
  if (buoy.freshness?.ageSeconds != null) {
    ageSec = buoy.freshness.ageSeconds;
  } else if (buoy.observationTimestamp) {
    ageSec = Math.max(0, (Date.now() - Date.parse(buoy.observationTimestamp)) / 1000);
  } else if (buoy.receivedAt) {
    ageSec = Math.max(0, (Date.now() - Date.parse(buoy.receivedAt)) / 1000);
  }

  const rawUtc = buoy.observationTimestamp
    ? new Date(buoy.observationTimestamp).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      }) + ' UTC'
    : '12:00 UTC';

  if (ageSec === null) return { display: 'N/A', rawUtc, stateLabel: 'SYNOPTIC', timeAgo: 'N/A' };

  const ageMins = Math.floor(ageSec / 60);
  let timeAgo = '';
  if (ageMins < 60) {
    timeAgo = ageMins <= 1 ? '1 min ago' : `${ageMins} mins ago`;
  } else {
    const hours = (ageMins / 60).toFixed(1);
    timeAgo = `${hours} hours ago`;
  }

  const state = buoy.freshness?.state;
  const stateLabel = state === 'FRESH' ? '3H SYNOPTIC' : state === 'LATEST_AVAILABLE' ? 'SYNOPTIC PASS' : 'TELEMETRY';

  return {
    display: `${rawUtc} (${timeAgo})`,
    rawUtc,
    stateLabel,
    timeAgo,
  };
}

export function OnlineBuoysModal({
  isOpen,
  onClose,
  buoys,
  selectedBuoyId,
  onSelectBuoy,
}: OnlineBuoysModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eezFilter, setEezFilter] = useState<'ALL' | 'IN_EEZ' | 'HIGH_SEAS'>('ALL');

  // Close on Outside Click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (modalRef.current && modalRef.current.contains(target)) {
        return;
      }
      if (target.closest('[data-buoy-trigger="online"]')) {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const inEEZCount = buoys.filter((b) => analyzeBuoyEEZ(b).inEEZ).length;
  const highSeasCount = buoys.length - inEEZCount;

  const filteredBuoys = buoys.filter((b) => {
    const term = searchTerm.toLowerCase();
    const id = b.id.toLowerCase();
    const name = (b.name || '').toLowerCase();
    const region = getBuoyBasin(b).basin.toLowerCase();
    const matchesSearch = id.includes(term) || name.includes(term) || region.includes(term);
    if (!matchesSearch) return false;

    if (eezFilter === 'IN_EEZ') {
      return analyzeBuoyEEZ(b).inEEZ;
    }
    if (eezFilter === 'HIGH_SEAS') {
      return !analyzeBuoyEEZ(b).inEEZ;
    }
    return true;
  });

  return (
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        top: '20px',
        left: '260px',
        width: '490px',
        maxWidth: 'calc(100vw - 290px)',
        maxHeight: 'calc(100vh - 40px)',
        background: 'linear-gradient(145deg, rgba(6, 32, 22, 0.88) 0%, rgba(4, 20, 16, 0.94) 100%)',
        backdropFilter: 'blur(30px) saturate(220%)',
        WebkitBackdropFilter: 'blur(30px) saturate(220%)',
        border: '1px solid rgba(52, 211, 153, 0.45)',
        borderTop: '1px solid rgba(255, 255, 255, 0.7)',
        borderRadius: '18px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), inset 0 1.5px 2px rgba(255, 255, 255, 0.4), 0 0 35px rgba(16, 185, 129, 0.25)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        animation: 'slideInFromLeft 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, transparent 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Wifi size={15} color="#10b981" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: '#ffffff',
                }}
              >
                ONLINE BUOYS
              </span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.25)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  color: '#34d399',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: '12px',
                  fontFamily: 'monospace',
                }}
              >
                {buoys.length} LIVE
              </span>
            </div>
            <div
              style={{
                fontSize: '9.5px',
                color: 'rgba(148, 163, 184, 0.85)',
                fontFamily: 'monospace',
                marginTop: '2px',
              }}
            >
              ACTIVE DEEP-SEA METOCEAN TELEMETRY STATIONS
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          }}
          title="Close Online Buoys"
        >
          <X size={15} />
        </button>
      </div>

      {/* Search Bar */}
      <div
        style={{
          padding: '10px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(2, 6, 23, 0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(34, 211, 238, 0.2)',
            borderRadius: '6px',
            padding: '6px 10px',
          }}
        >
          <Search size={13} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by station name or basin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '11px',
              fontFamily: 'monospace',
              width: '100%',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* EEZ Jurisdiction Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '8px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(2, 6, 23, 0.25)',
        }}
      >
        <button
          onClick={() => setEezFilter('ALL')}
          style={{
            padding: '3px 8px',
            borderRadius: '4px',
            border: eezFilter === 'ALL' ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
            background: eezFilter === 'ALL' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
            color: eezFilter === 'ALL' ? '#6ee7b7' : '#94a3b8',
            fontSize: '8.5px',
            fontWeight: 700,
            fontFamily: 'monospace',
            letterSpacing: '0.04em',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          ALL ({buoys.length})
        </button>
        <button
          onClick={() => setEezFilter('IN_EEZ')}
          style={{
            padding: '3px 8px',
            borderRadius: '4px',
            border: eezFilter === 'IN_EEZ' ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
            background: eezFilter === 'IN_EEZ' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
            color: eezFilter === 'IN_EEZ' ? '#10b981' : '#94a3b8',
            fontSize: '8.5px',
            fontWeight: 700,
            fontFamily: 'monospace',
            letterSpacing: '0.04em',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          ● IN INDIA EEZ ({inEEZCount})
        </button>
        <button
          onClick={() => setEezFilter('HIGH_SEAS')}
          style={{
            padding: '3px 8px',
            borderRadius: '4px',
            border: eezFilter === 'HIGH_SEAS' ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
            background: eezFilter === 'HIGH_SEAS' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)',
            color: eezFilter === 'HIGH_SEAS' ? '#38bdf8' : '#94a3b8',
            fontSize: '8.5px',
            fontWeight: 700,
            fontFamily: 'monospace',
            letterSpacing: '0.04em',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          🌐 HIGH SEAS ({highSeasCount})
        </button>
      </div>

      {/* Live Telemetry Provenance Notice */}
      <div
        style={{
          margin: '0 16px 4px 16px',
          padding: '8px 12px',
          background: 'rgba(4, 32, 22, 0.75)',
          border: '1px solid rgba(16, 185, 129, 0.28)',
          borderRadius: '8px',
          fontSize: '9.5px',
          fontFamily: 'monospace',
          color: '#a7f3d0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <span style={{ color: '#ffffff', fontWeight: 700 }}>INCOIS SYNOPTIC SATELLITE STREAM</span>
        </div>
        <div style={{ color: '#6ee7b7', fontSize: '9px' }}>
          3-Hr Cadence (00, 03, 06, 09, 12, 15, 18, 21 UTC)
        </div>
      </div>

      {/* Buoys List */}
      <div
        style={{
          padding: '8px 16px 12px 16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: 'calc(100vh - 250px)',
        }}
      >
        {filteredBuoys.length === 0 ? (
          <div
            style={{
              padding: '30px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          >
            No online buoys found matching "{searchTerm}"
          </div>
        ) : (
          filteredBuoys.map((buoy) => {
            const isSelected = buoy.id === selectedBuoyId;
            const pullTime = formatPullTime(buoy);
            const { basin, badgeBg: basinBadgeBg, badgeColor: basinBadgeColor } = getBuoyBasin(buoy);
            const latStr = `${Math.abs(buoy.latitude).toFixed(4)}° ${buoy.latitude >= 0 ? 'N' : 'S'}`;
            const lonStr = `${Math.abs(buoy.longitude).toFixed(4)}° ${buoy.longitude >= 0 ? 'E' : 'W'}`;

            return (
              <div
                key={buoy.id}
                onClick={() => {
                  onSelectBuoy(buoy);
                }}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 78, 59, 0.4) 100%)'
                    : 'rgba(15, 23, 42, 0.55)',
                  border: isSelected
                    ? '1px solid rgba(16, 185, 129, 0.7)'
                    : '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? '0 0 16px rgba(16, 185, 129, 0.2)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.55)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                {/* Row 1: Name, Region, Live Pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 8px #10b981',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#ffffff',
                        fontFamily: 'monospace',
                      }}
                    >
                      {buoy.name || buoy.id}
                    </span>
                    <span
                      style={{
                        fontSize: '8.5px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: basinBadgeBg,
                        color: basinBadgeColor,
                        fontFamily: 'monospace',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {basin}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#34d399',
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.28)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{ color: '#10b981' }}>●</span>
                    <span>{pullTime.stateLabel}</span>
                    <Navigation size={10} style={{ transform: 'rotate(45deg)' }} />
                  </div>
                </div>

                {/* Row 2: Coordinates & Pull Time */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '2px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: '#94a3b8',
                  }}
                >
                  {/* Latitude and Longitude */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#64748b' }}>POS:</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                      {latStr}, {lonStr}
                    </span>
                  </div>

                  {/* Observation Timestamp & Synoptic Age */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(6, 182, 212, 0.10)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '5px',
                      color: '#22d3ee',
                    }}
                    title={`Authoritative INCOIS 3-hourly synoptic observation epoch: ${pullTime.rawUtc}`}
                  >
                    <Clock size={10} color="#22d3ee" />
                    <span style={{ fontWeight: 600 }}>{pullTime.display}</span>
                  </div>
                </div>

                {/* Row 3: EEZ Jurisdiction Analysis Badge */}
                {(() => {
                  const eezInfo = analyzeBuoyEEZ(buoy);
                  return (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '3px',
                        paddingTop: '4px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '8px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: eezInfo.badgeBg,
                            color: eezInfo.badgeColor,
                            border: `1px solid ${eezInfo.badgeBorder}`,
                            fontFamily: 'monospace',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {eezInfo.inEEZ ? '● IN INDIA EEZ' : '🌐 HIGH SEAS'}
                          {!eezInfo.inEEZ && eezInfo.distanceToEEZBoundaryNM > 0 && ` · ${eezInfo.distanceToEEZBoundaryNM.toFixed(1)} NM off EEZ`}
                        </span>
                        <span
                          style={{
                            fontSize: '8.5px',
                            color: '#94a3b8',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '240px',
                          }}
                        >
                          {eezInfo.subSector}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div
        style={{
          padding: '10px 18px',
          background: 'rgba(2, 6, 23, 0.65)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: '#64748b',
          fontFamily: 'monospace',
        }}
      >
        <span>CLICK ANY BUOY TO FOCUS CAMERA & INSPECT</span>
        <span style={{ color: '#38bdf8' }}>INCOIS REALTIME TELEMETRY</span>
      </div>
    </div>
  );
}
