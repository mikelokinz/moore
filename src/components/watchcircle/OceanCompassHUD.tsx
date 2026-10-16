import React, { useRef, useEffect, useCallback } from 'react';
import { Compass, Navigation } from 'lucide-react';
import { compassBus } from './compassBus';

interface OceanCompassHUDProps {
  heading?: number;             // Optional initial camera heading (degrees)
  currentDirection?: number;    // Ocean current flow direction aligned with buoy movement (degrees)
  currentSpeed?: number;        // Current velocity (m/s)
  waveDirection?: number;       // Wave propagation direction (degrees)
  waveHeight?: number;          // Significant wave height (m)
  onResetNorth?: () => void;
}

function getCardinalDirection(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const cardinals = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return cardinals[index];
}

export const OceanCompassHUD: React.FC<OceanCompassHUDProps> = ({
  heading: propHeading = 0,
  currentDirection = 45,
  onResetNorth,
}) => {
  const normPropHeading = ((propHeading % 360) + 360) % 360;

  const dialRef = useRef<SVGSVGElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const hdgTextRef = useRef<HTMLSpanElement>(null);
  const cardTextRef = useRef<HTMLSpanElement>(null);
  const flowTextRef = useRef<HTMLSpanElement>(null);

  // Unwrapped continuous rotation angle tracking
  // Completely eliminates 0°/360° wrapping discontinuity and micro-stepping
  const unwrappedHdgRef = useRef<number>(normPropHeading);
  const lastRawHdgRef = useRef<number>(normPropHeading);
  const hasInitHdgRef = useRef<boolean>(false);

  const unwrappedFlowRef = useRef<number>(currentDirection);
  const lastRawFlowRef = useRef<number>(currentDirection);

  const lastDisplayedHdgRef = useRef<number>(-1);
  const lastDisplayedFlowRef = useRef<number>(-1);

  // High-performance direct renderer invoked synchronously from Three.js render frame
  const handleHeadingUpdate = useCallback((rawHdg: number) => {
    if (!hasInitHdgRef.current) {
      unwrappedHdgRef.current = rawHdg;
      lastRawHdgRef.current = rawHdg;
      hasInitHdgRef.current = true;
    } else {
      let diff = (rawHdg - lastRawHdgRef.current) % 360;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      unwrappedHdgRef.current += diff;
      lastRawHdgRef.current = rawHdg;
    }

    const currentUnwrappedHdg = unwrappedHdgRef.current;

    // Direct GPU Compositor transform update (Zero React re-renders, silky 60/120fps)
    if (dialRef.current) {
      dialRef.current.style.transform = `rotate(${-currentUnwrappedHdg}deg)`;
    }

    // Dynamic ocean flow chevron relative to camera heading
    if (flowRef.current) {
      const flowRel = unwrappedFlowRef.current - currentUnwrappedHdg;
      flowRef.current.style.transform = `rotate(${flowRel}deg)`;
    }

    // Throttle DOM text content mutations strictly to integer degree transitions
    const normHdg = ((Math.round(rawHdg) % 360) + 360) % 360;
    if (normHdg !== lastDisplayedHdgRef.current) {
      lastDisplayedHdgRef.current = normHdg;
      if (hdgTextRef.current) {
        hdgTextRef.current.textContent = `${normHdg.toString().padStart(3, '0')}°`;
      }
      if (cardTextRef.current) {
        cardTextRef.current.textContent = getCardinalDirection(normHdg);
      }
    }
  }, []);

  // Subscribe to synchronous, zero-allocation camera heading bus
  useEffect(() => {
    const unsubscribe = compassBus.subscribe(handleHeadingUpdate);

    // Fallback listener for window events
    const handleWindowEvent = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === 'number') {
        handleHeadingUpdate(customEvent.detail);
      }
    };
    window.addEventListener('moore-compass-heading', handleWindowEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('moore-compass-heading', handleWindowEvent);
    };
  }, [handleHeadingUpdate]);

  // Synchronize ocean current flow direction when buoy drift changes
  useEffect(() => {
    let diff = (currentDirection - lastRawFlowRef.current) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    unwrappedFlowRef.current += diff;
    lastRawFlowRef.current = currentDirection;

    if (flowRef.current) {
      const flowRel = unwrappedFlowRef.current - unwrappedHdgRef.current;
      flowRef.current.style.transform = `rotate(${flowRel}deg)`;
    }

    const normFlow = ((Math.round(currentDirection) % 360) + 360) % 360;
    if (normFlow !== lastDisplayedFlowRef.current) {
      lastDisplayedFlowRef.current = normFlow;
      if (flowTextRef.current) {
        flowTextRef.current.textContent = `FLOW ${normFlow}°`;
      }
    }
  }, [currentDirection]);

  const initialCardinal = getCardinalDirection(normPropHeading);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
        userSelect: 'none',
      }}
    >
      {/* ── Minimalist Glass Compass Dial (76px) ── */}
      <div
        onClick={onResetNorth}
        style={{
          position: 'relative',
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.94) 0%, rgba(8, 14, 28, 0.98) 75%, rgba(2, 6, 23, 1.0) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.55), inset 0 0 10px rgba(2, 6, 23, 0.8)',
          backdropFilter: 'blur(16px)',
          cursor: onResetNorth ? 'pointer' : 'default',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (onResetNorth) {
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.7)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(56, 189, 248, 0.3), inset 0 0 12px rgba(56, 189, 248, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (onResetNorth) {
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.55), inset 0 0 10px rgba(2, 6, 23, 0.8)';
          }
        }}
        title={onResetNorth ? 'Click to align camera to True North (Top-Down View)' : 'Camera Compass Heading'}
      >
        {/* Subtle Outer Guide Ring */}
        <div
          style={{
            position: 'absolute',
            inset: '6px',
            borderRadius: '50%',
            border: '1px solid rgba(56, 189, 248, 0.10)',
            pointerEvents: 'none',
          }}
        />

        {/* Fixed Top Camera Viewing Index Notch */}
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '2px',
            height: '5px',
            background: '#38bdf8',
            borderRadius: '1px',
            boxShadow: '0 0 5px #38bdf8',
            zIndex: 10,
          }}
        />

        {/* ── Rotating Compass Needle & Cardinal Markers SVG (Hardware Accelerated) ── */}
        <svg
          ref={dialRef}
          viewBox="0 0 100 100"
          style={{
            width: '100%',
            height: '100%',
            transform: `rotate(${-normPropHeading}deg)`,
            transformOrigin: '50% 50%',
            willChange: 'transform',
            transition: 'none',
          }}
        >
          {/* Cardinal Markers */}
          <text x="50" y="16" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="900" fontFamily="monospace">N</text>
          <text x="86" y="53.5" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="700" fontFamily="monospace">E</text>
          <text x="50" y="90" textAnchor="middle" fill="#64748b" fontSize="7.5" fontWeight="700" fontFamily="monospace">S</text>
          <text x="14" y="53.5" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="700" fontFamily="monospace">W</text>

          {/* Cardinal Ticks */}
          <line x1="50" y1="5" x2="50" y2="8.5" stroke="#fbbf24" strokeWidth="1.6" />
          <line x1="95" y1="50" x2="91.5" y2="50" stroke="#94a3b8" strokeWidth="1.2" />
          <line x1="50" y1="95" x2="50" y2="91.5" stroke="#64748b" strokeWidth="1.2" />
          <line x1="5" y1="50" x2="8.5" y2="50" stroke="#94a3b8" strokeWidth="1.2" />

          {/* ── True North Pointer (Gold / Amber with Subtle Glow) ── */}
          <polygon
            points="50,21 47,47 50,44.5"
            fill="#d97706"
          />
          <polygon
            points="50,21 53,47 50,44.5"
            fill="#f59e0b"
            filter="drop-shadow(0 0 3px rgba(245, 158, 11, 0.7))"
          />

          {/* ── South Pointer (Cyan / Slate) ── */}
          <polygon
            points="50,79 47,53 50,55.5"
            fill="#0284c7"
          />
          <polygon
            points="50,79 53,53 50,55.5"
            fill="#38bdf8"
            opacity="0.85"
          />

          {/* Center Pivot Jewel */}
          <circle cx="50" cy="50" r="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="1.5" fill="#38bdf8" />
        </svg>

        {/* ── Ocean Flow Chevron on Outer Bezel Rim ── */}
        <div
          ref={flowRef}
          style={{
            position: 'absolute',
            inset: 0,
            transform: `rotate(${currentDirection - normPropHeading}deg)`,
            transformOrigin: '50% 50%',
            pointerEvents: 'none',
            willChange: 'transform',
            transition: 'none',
          }}
        >
          {/* Arrowhead pointing in ocean flow direction */}
          <div
            style={{
              position: 'absolute',
              top: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '3px solid transparent',
              borderRight: '3px solid transparent',
              borderBottom: '5.5px solid #10b981',
              filter: 'drop-shadow(0 0 3px #10b981)',
            }}
          />
        </div>
      </div>

      {/* ── Minimalist Compact Readout Pill ── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '5px',
          padding: '3px 8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Compass size={10} color="#38bdf8" />
          <span
            ref={hdgTextRef}
            style={{
              fontFamily: 'monospace',
              fontSize: '9px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.06em',
            }}
          >
            {Math.round(normPropHeading).toString().padStart(3, '0')}°
          </span>
          <span
            ref={cardTextRef}
            style={{
              fontFamily: 'monospace',
              fontSize: '8px',
              fontWeight: 800,
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.15)',
              padding: '0 3px',
              borderRadius: '2px',
            }}
          >
            {initialCardinal}
          </span>
        </div>

        <div style={{ width: '1px', height: '10px', background: 'rgba(255, 255, 255, 0.15)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Navigation size={8} color="#10b981" />
          <span
            ref={flowTextRef}
            style={{ fontFamily: 'monospace', fontSize: '8px', color: '#10b981', fontWeight: 700 }}
          >
            FLOW {Math.round(currentDirection)}°
          </span>
        </div>
      </div>
    </div>
  );
};
