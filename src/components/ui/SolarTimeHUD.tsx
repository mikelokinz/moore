import React, { useState, useRef, useEffect } from 'react';
import type { SolarEphemeris } from '../../utils/solarCalculator';

interface SolarTimeHUDProps {
  ephemeris: SolarEphemeris;
  isLiveTime: boolean;
  onToggleLive: () => void;
  onHourChange: (hourFraction: number) => void;
  currentSimulatedHour: number;
}

/**
 * SolarTimeHUD:
 * High-precision liquid glass astronomical telemetry widget.
 * Displays real-time Solar coordinates, India lighting regime (Daylight vs Night City Lights),
 * and provides interactive 24-hour time scrubbing to observe solar progression.
 */
export function SolarTimeHUD({
  ephemeris,
  isLiveTime,
  onToggleLive,
  onHourChange,
  currentSimulatedHour,
}: SolarTimeHUDProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside container
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick, { capture: true });
    return () => window.removeEventListener('mousedown', handleOutsideClick, { capture: true });
  }, [isOpen]);

  const isDay = ephemeris.indiaLightingState === 'daylight';
  const isTwilight = ephemeris.indiaLightingState === 'twilight';

  const statusBadgeColor = isDay
    ? 'rgba(234, 179, 8, 0.22)'
    : isTwilight
    ? 'rgba(249, 115, 22, 0.22)'
    : 'rgba(99, 102, 241, 0.22)';

  const statusTextColor = isDay ? '#fef08a' : isTwilight ? '#fdba74' : '#c7d2fe';
  const statusBorderColor = isDay
    ? 'rgba(250, 204, 21, 0.45)'
    : isTwilight
    ? 'rgba(251, 146, 60, 0.45)'
    : 'rgba(129, 140, 248, 0.45)';

  const statusLabel = isDay
    ? 'INDIA: DAYLIGHT ☀️'
    : isTwilight
    ? 'INDIA: TWILIGHT 🌅'
    : 'INDIA: NIGHT (CITY LIGHTS) 🌃';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        pointerEvents: 'auto',
        fontFamily: "'Space Grotesk', -apple-system, sans-serif",
      }}
    >
      {/* ── Main Compact Liquid Glass Pill ── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title="Astronomical Solar Position & Lighting Control"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          background: 'rgba(8, 15, 28, 0.35)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${statusBorderColor}`,
          borderRadius: '9999px',
          color: '#ffffff',
          cursor: 'pointer',
          boxShadow: isDay
            ? '0 6px 24px rgba(234, 179, 8, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : '0 6px 24px rgba(99, 102, 241, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Pulsing Solar / Lunar Indicator */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isDay ? '#facc15' : isTwilight ? '#fb923c' : '#818cf8',
            boxShadow: isDay
              ? '0 0 10px #facc15, 0 0 18px #eab308'
              : '0 0 10px #818cf8, 0 0 18px #6366f1',
          }}
        />

        {/* Time display */}
        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em' }}>
          {ephemeris.istTimeStr}
        </span>

        {/* Status Badge */}
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '12px',
            background: statusBadgeColor,
            color: statusTextColor,
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.08em',
          }}
        >
          {statusLabel}
        </span>

        {/* Dropdown Chevron */}
        <span
          style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.6)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          ▼
        </span>
      </button>

      {/* ── Expandable Liquid Glass Inspector Drawer ── */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '320px',
            padding: '16px',
            background: 'rgba(6, 12, 24, 0.72)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '18px',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
            zIndex: 60,
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: '#94a3b8',
                textTransform: 'uppercase',
              }}
            >
              Astronomical Solar Engine
            </span>
            <button
              onClick={onToggleLive}
              style={{
                padding: '3px 10px',
                borderRadius: '9999px',
                border: isLiveTime
                  ? '1px solid rgba(34, 197, 94, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                background: isLiveTime ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: isLiveTime ? '#4ade80' : '#94a3b8',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.06em',
              }}
            >
              {isLiveTime ? '● LIVE SYNC' : 'MANUAL SCRUB'}
            </button>
          </div>

          {/* Ephemeris Telemetry Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '11px',
            }}
          >
            <div>
              <div style={{ color: '#64748b', fontSize: '9px', fontWeight: 700 }}>SUBSOLAR POINT</div>
              <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{ephemeris.subsolarStr}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '9px', fontWeight: 700 }}>INDIA ELEVATION</div>
              <div style={{ color: statusTextColor, fontWeight: 700 }}>
                {ephemeris.indiaSolarElevation >= 0 ? '+' : ''}
                {ephemeris.indiaSolarElevation.toFixed(1)}°
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '9px', fontWeight: 700 }}>GREENWICH UTC</div>
              <div style={{ color: '#cbd5e1', fontWeight: 600 }}>{ephemeris.utcTimeStr}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '9px', fontWeight: 700 }}>INDIA TIME (IST)</div>
              <div style={{ color: '#facc15', fontWeight: 700 }}>{ephemeris.istTimeStr}</div>
            </div>
          </div>

          {/* 24-Hour Time Scrubber */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
              <span>00:00 UTC</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                Scrub: {Math.floor(currentSimulatedHour).toString().padStart(2, '0')}:
                {Math.floor((currentSimulatedHour % 1) * 60)
                  .toString()
                  .padStart(2, '0')}{' '}
                UTC
              </span>
              <span>24:00 UTC</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.1"
              value={currentSimulatedHour}
              onChange={(e) => {
                onHourChange(parseFloat(e.target.value));
              }}
              style={{
                width: '100%',
                accentColor: '#38bdf8',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Quick-Preset Jumps */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => {
                // 12:00 IST is approx 06:30 UTC -> Sun overhead India
                onHourChange(6.5);
              }}
              style={{
                flex: 1,
                padding: '6px 4px',
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.35)',
                borderRadius: '8px',
                color: '#fef08a',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ☀️ India Noon
            </button>
            <button
              onClick={() => {
                // 18:00 IST is approx 12:30 UTC -> Sunset / Twilight
                onHourChange(12.5);
              }}
              style={{
                flex: 1,
                padding: '6px 4px',
                background: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.35)',
                borderRadius: '8px',
                color: '#fdba74',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🌅 Sunset
            </button>
            <button
              onClick={() => {
                // 00:00 IST is approx 18:30 UTC -> Deep Night in India, City lights bright!
                onHourChange(18.5);
              }}
              style={{
                flex: 1,
                padding: '6px 4px',
                background: 'rgba(99, 102, 241, 0.18)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '8px',
                color: '#c7d2fe',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🌃 India Night
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
