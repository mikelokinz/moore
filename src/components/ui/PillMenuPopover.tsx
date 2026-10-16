import { useEffect, useState, useRef } from 'react';
import {
  X,
  Hand,
  Shield,
  Tag,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Bell,
  CheckCircle2,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface PillMenuPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  isHandEnabled: boolean;
  onToggleHand: () => void;
  showEEZ: boolean;
  onToggleEEZ: () => void;
  showEEZLabels: boolean;
  onToggleEEZLabels: () => void;
  onRecenter?: () => void;
}

export function PillMenuPopover({
  isOpen,
  onClose,
  isHandEnabled,
  onToggleHand,
  showEEZ,
  onToggleEEZ,
  showEEZLabels,
  onToggleEEZLabels,
}: PillMenuPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [alertsExpanded, setAlertsExpanded] = useState(true);

  // Close on Outside Click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (popoverRef.current && popoverRef.current.contains(target)) {
        return;
      }
      if (target.closest('[data-menu-trigger="true"]')) {
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

  return (
    <div
      ref={popoverRef}
      data-menu-popover="true"
      style={{
        position: 'absolute',
        top: '12px',
        right: '0',
        width: '380px',
        maxWidth: 'calc(100vw - 48px)',
        background: 'linear-gradient(145deg, rgba(6, 22, 38, 0.9) 0%, rgba(3, 14, 26, 0.95) 100%)',
        backdropFilter: 'blur(30px) saturate(220%)',
        WebkitBackdropFilter: 'blur(30px) saturate(220%)',
        border: '1px solid rgba(56, 189, 248, 0.45)',
        borderTop: '1px solid rgba(255, 255, 255, 0.7)',
        borderRadius: '18px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), inset 0 1.5px 2px rgba(255, 255, 255, 0.4), 0 0 35px rgba(14, 165, 233, 0.25)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        animation: 'slideInFromRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(34, 211, 238, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(34, 211, 238, 0.1) 0%, transparent 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22d3ee',
              boxShadow: '0 0 10px #22d3ee',
            }}
          />
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#ffffff',
            }}
          >
            SYSTEM MENU
          </span>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
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
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#94a3b8';
          }}
          title="Close menu"
        >
          <X size={14} />
        </button>
      </div>

      {/* Menu Options Body */}
      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
        }}
      >
        {/* ─── OPTION 1: GESTURE ─── */}
        <div
          onClick={onToggleHand}
          style={{
            background: isHandEnabled
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(15, 23, 42, 0.7) 100%)'
              : 'rgba(15, 23, 42, 0.6)',
            border: isHandEnabled
              ? '1px solid rgba(34, 197, 94, 0.6)'
              : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: isHandEnabled ? '0 0 16px rgba(34, 197, 94, 0.2)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (!isHandEnabled) {
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
              e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.35)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isHandEnabled) {
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isHandEnabled ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: isHandEnabled ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Hand size={16} color={isHandEnabled ? '#22c55e' : '#94a3b8'} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                GESTURE CONTROL
              </div>
              <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                Webcam AI spatial interaction
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '9.5px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontFamily: 'monospace',
              background: isHandEnabled ? 'rgba(34, 197, 94, 0.25)' : 'rgba(100, 116, 139, 0.2)',
              border: isHandEnabled ? '1px solid rgba(34, 197, 94, 0.7)' : '1px solid rgba(100, 116, 139, 0.3)',
              color: isHandEnabled ? '#86efac' : '#94a3b8',
              boxShadow: isHandEnabled ? '0 0 10px rgba(34, 197, 94, 0.3)' : 'none',
            }}
          >
            {isHandEnabled ? '● ACTIVE' : '○ OFFLINE'}
          </div>
        </div>

        {/* ─── OPTION 2: ECONOMIC ZONE ─── */}
        <div
          data-eez-trigger="true"
          style={{
            background: showEEZ
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(6, 28, 20, 0.7) 100%)'
              : 'rgba(15, 23, 42, 0.6)',
            border: showEEZ
              ? '1px solid rgba(52, 211, 153, 0.6)'
              : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px 14px',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: showEEZ ? '0 0 16px rgba(16, 185, 129, 0.2)' : 'none',
          }}
        >
          <div
            onClick={onToggleEEZ}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: showEEZ ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: showEEZ ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={16} color={showEEZ ? '#10b981' : '#94a3b8'} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                  ECONOMIC ZONE (EEZ)
                </div>
                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                  200nm Indian Maritime Boundaries
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '9.5px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                fontFamily: 'monospace',
                background: showEEZ ? 'rgba(16, 185, 129, 0.25)' : 'rgba(100, 116, 139, 0.2)',
                border: showEEZ ? '1px solid rgba(16, 185, 129, 0.7)' : '1px solid rgba(100, 116, 139, 0.3)',
                color: showEEZ ? '#6ee7b7' : '#94a3b8',
                boxShadow: showEEZ ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none',
              }}
            >
              {showEEZ ? '[ ON ]' : '[ OFF ]'}
            </div>
          </div>

          {/* Sub-toggle: Name Tags (only shown when EEZ is active) */}
          {showEEZ && (
            <div
              onClick={onToggleEEZLabels}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                cursor: 'pointer',
                marginTop: '2px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={13} color="#38bdf8" />
                <span style={{ fontSize: '10.5px', color: '#e2e8f0', fontFamily: 'monospace' }}>
                  EEZ Territory Labels
                </span>
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: showEEZLabels ? '#38bdf8' : '#64748b',
                }}
              >
                {showEEZLabels ? '[ LABELS ON ]' : '[ LABELS OFF ]'}
              </span>
            </div>
          )}
        </div>

        {/* ─── OPTION 3: ALERTS ─── */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            onClick={() => setAlertsExpanded((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(234, 179, 8, 0.2)',
                  border: '1px solid rgba(234, 179, 8, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={16} color="#eab308" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                    ALERTS
                  </span>
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontFamily: 'monospace',
                    }}
                  >
                    3 ACTIVE
                  </span>
                </div>
                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                  Mooring tension &amp; station advisories
                </div>
              </div>
            </div>

            <ChevronDown
              size={15}
              color="#94a3b8"
              style={{
                transform: alertsExpanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </div>

          {/* Expanded Alerts Feed */}
          {alertsExpanded && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginTop: '4px',
              }}
            >
              {/* Alert 1: Critical (AD06) */}
              <div
                style={{
                  background: 'rgba(225, 29, 72, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldAlert size={12} color="#f43f5e" />
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#fda4af', fontFamily: 'monospace' }}>
                      OMNI-AD06 · CRITICAL
                    </span>
                  </div>
                  <span style={{ fontSize: '8px', color: '#f43f5e', fontFamily: 'monospace', fontWeight: 700 }}>
                    LOST AT SEA
                  </span>
                </div>
                <div style={{ fontSize: '9.5px', color: '#e2e8f0', lineHeight: 1.35 }}>
                  Mooring line parted during monsoon cyclone. Transmitter ceased. Navigation hazard notice active.
                </div>
              </div>

              {/* Alert 2: Purposeful Removal (AD07) */}
              <div
                style={{
                  background: 'rgba(234, 179, 8, 0.12)',
                  border: '1px solid rgba(234, 179, 8, 0.35)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Info size={12} color="#eab308" />
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#fef08a', fontFamily: 'monospace' }}>
                      OMNI-AD07 · NOTICE
                    </span>
                  </div>
                  <span style={{ fontSize: '8px', color: '#eab308', fontFamily: 'monospace', fontWeight: 700 }}>
                    PURPOSEFULLY REMOVED
                  </span>
                </div>
                <div style={{ fontSize: '9.5px', color: '#e2e8f0', lineHeight: 1.35 }}>
                  Retrieved by ORV Sagar Nidhi for scheduled biennial drydock sensor calibration and hull overhaul.
                </div>
              </div>

              {/* Alert 3: Wave Surge Warning (BD11) */}
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertTriangle size={12} color="#38bdf8" />
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#7dd3fc', fontFamily: 'monospace' }}>
                      OMNI-BD11 · METOCEAN
                    </span>
                  </div>
                  <span style={{ fontSize: '8px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>
                    ELEVATED SWELL
                  </span>
                </div>
                <div style={{ fontSize: '9.5px', color: '#e2e8f0', lineHeight: 1.35 }}>
                  High significant wave height recorded (2.8m, 11.2s period). Fairlead line tension elevated but within safety envelope.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
