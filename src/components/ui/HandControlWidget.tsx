import React, { useState } from 'react';
import {
  Hand,
  Power,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Video,
  VideoOff,
  Sparkles,
} from 'lucide-react';
import type { GestureType, TrackingStatus } from '../../hooks/useHandGesture';

interface HandControlWidgetProps {
  isEnabled: boolean;
  onToggle: () => void;
  onTurnOff?: () => void;
  status: TrackingStatus;
  gesture: GestureType;
  confidence: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function HandControlWidget({
  isEnabled,
  onToggle,
  onTurnOff,
  status,
  gesture,
  confidence,
  videoRef,
  canvasRef,
}: HandControlWidgetProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleTurnOff = () => {
    if (onTurnOff) {
      onTurnOff();
    } else {
      onToggle();
    }
  };

  // Status badge config
  const getStatusBadge = () => {
    if (!isEnabled) {
      return { label: 'OFFLINE', color: '#94a3b8', bg: 'rgba(100, 116, 139, 0.2)', border: 'rgba(100, 116, 139, 0.35)', dot: '○' };
    }
    switch (status) {
      case 'loading':
        return { label: 'INITIALIZING', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)', dot: '◌' };
      case 'ready':
      case 'tracking':
        return { label: 'AI TRACKING', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.45)', dot: '●' };
      case 'permission_denied':
        return { label: 'CAMERA DENIED', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.2)', border: 'rgba(244, 63, 94, 0.45)', dot: '✕' };
      case 'unavailable':
      default:
        return { label: 'UNAVAILABLE', color: '#94a3b8', bg: 'rgba(100, 116, 139, 0.2)', border: 'rgba(100, 116, 139, 0.35)', dot: '○' };
    }
  };

  const badge = getStatusBadge();

  // Gesture label with icon
  const getGestureInfo = () => {
    switch (gesture) {
      case 'drag':
        return { label: 'ROTATING GLOBE', icon: '🖐', active: true };
      case 'pinch':
        return { label: 'ZOOMING GLOBE', icon: '🤏', active: true };
      case 'pan':
        return { label: 'PANNING CAMERA', icon: '✋', active: true };
      case 'fist':
        return { label: 'INTERACTION PAUSED', icon: '✊', active: false };
      case 'palm':
        return { label: 'PALM DETECTED', icon: '🖐', active: true };
      default:
        return { label: 'MOVE HAND TO ORBIT', icon: '🖐', active: false };
    }
  };

  const gestureInfo = getGestureInfo();

  // When disabled, do not render any pill outside the menu (gesture toggled from Menu)
  if (!isEnabled) {
    return null;
  }

  // ── Expanded Gesture Control Box (Liquid Glass) ───────────────────────────
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        zIndex: 35,
        width: '240px',
        background: 'linear-gradient(145deg, rgba(6, 32, 28, 0.9) 0%, rgba(3, 20, 24, 0.95) 100%)',
        backdropFilter: 'blur(30px) saturate(220%)',
        WebkitBackdropFilter: 'blur(30px) saturate(220%)',
        border: '1px solid rgba(34, 211, 238, 0.45)',
        borderTop: '1px solid rgba(255, 255, 255, 0.75)',
        borderRadius: '16px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), inset 0 1.5px 2px rgba(255, 255, 255, 0.4), 0 0 35px rgba(34, 211, 238, 0.25)',
        color: '#f8fafc',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        animation: 'slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Header Row: Icon, Title, Status & Turn Off Switch/Close ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Hand size={14} color="#22c55e" />
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#ffffff',
                lineHeight: 1.1,
              }}
            >
              GESTURE CONTROL
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '8px',
                fontFamily: 'monospace',
                color: badge.color,
                fontWeight: 600,
                marginTop: '1px',
              }}
            >
              <span>{badge.dot}</span>
              <span>{badge.label}</span>
            </div>
          </div>
        </div>

        {/* Turn Off Options: Toggle Switch & Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* iOS-Style Toggle Switch */}
          <button
            onClick={handleTurnOff}
            style={{
              width: '36px',
              height: '18px',
              borderRadius: '12px',
              background: isEnabled ? '#10b981' : '#475569',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isEnabled ? 'flex-end' : 'flex-start',
              boxShadow: isEnabled ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
            title="Click to turn off gesture control"
          >
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.2s ease',
              }}
            />
          </button>

          {/* Dedicated Close Button */}
          <button
            onClick={handleTurnOff}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#94a3b8';
            }}
            title="Turn off gesture control"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* ── Webcam / Gesture Canvas Box ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '128px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#020617',
          border: '1px solid rgba(34, 211, 238, 0.25)',
          boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Hidden video element for MediaPipe stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ display: 'none' }}
        />

        {/* Real-time Skeleton Canvas */}
        <canvas
          ref={canvasRef}
          width={240}
          height={140}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* Loading Overlay */}
        {status === 'loading' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'rgba(2, 6, 23, 0.92)',
              fontSize: '8.5px',
              color: '#38bdf8',
              letterSpacing: '0.14em',
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            <Sparkles size={16} color="#38bdf8" />
            <span>INITIALIZING AI TRACKER...</span>
          </div>
        )}

        {/* Permission Denied Overlay */}
        {status === 'permission_denied' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '12px',
              textAlign: 'center',
              background: 'rgba(2, 6, 23, 0.95)',
              fontSize: '8.5px',
              color: '#f87171',
              fontFamily: 'monospace',
            }}
          >
            <VideoOff size={16} color="#f87171" />
            <span style={{ fontWeight: 700 }}>CAMERA ACCESS DENIED</span>
            <span style={{ color: '#94a3b8', fontSize: '7.5px' }}>
              Please allow webcam in browser settings. Mouse &amp; touch remain active.
            </span>
          </div>
        )}

        {/* Bottom Status Ribbon Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: 5,
            right: 5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(6, 12, 24, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '4px',
            padding: '3px 7px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '10px' }}>{gestureInfo.icon}</span>
            <span
              style={{
                fontSize: '8px',
                color: gestureInfo.active ? '#34d399' : '#38bdf8',
                letterSpacing: '0.08em',
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              {gestureInfo.label}
            </span>
          </div>

          {confidence > 0 && (
            <span
              style={{
                fontSize: '8px',
                color: '#94a3b8',
                fontFamily: 'monospace',
                fontWeight: 600,
              }}
            >
              {confidence}%
            </span>
          )}
        </div>
      </div>

      {/* ── Collapsible Gesture Instructions Accordion ── */}
      <div>
        <button
          onClick={() => setShowGuide((prev) => !prev)}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#94a3b8',
            fontSize: '9px',
            fontFamily: 'monospace',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#e2e8f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <HelpCircle size={11} color="#38bdf8" />
            <span>HOW TO USE GESTURES</span>
          </div>
          {showGuide ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {showGuide && (
          <div
            style={{
              marginTop: '6px',
              padding: '8px 10px',
              background: 'rgba(2, 6, 23, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '6px',
              fontSize: '8.5px',
              color: '#cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              lineHeight: 1.4,
            }}
          >
            <div>
              <strong style={{ color: '#38bdf8' }}>🖐 Move Hand:</strong> Orbit &amp; rotate Earth
            </div>
            <div>
              <strong style={{ color: '#38bdf8' }}>🤏 Pinch / 2 Hands:</strong> Zoom in &amp; out
            </div>
            <div>
              <strong style={{ color: '#38bdf8' }}>✌ Air-Quote:</strong> Aim &amp; inspect marker
            </div>
            <div>
              <strong style={{ color: '#38bdf8' }}>✊ Fist:</strong> Pause gesture tracking
            </div>
            <div style={{ color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '4px' }}>
              🖱 Mouse &amp; touch controls always available
            </div>
          </div>
        )}
      </div>

      {/* ── Direct "Turn Off Gesture Control" Button ── */}
      <button
        onClick={handleTurnOff}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '8px',
          padding: '6px 10px',
          color: '#fca5a5',
          fontSize: '9.5px',
          fontWeight: 700,
          fontFamily: 'monospace',
          letterSpacing: '0.08em',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
          e.currentTarget.style.borderColor = '#ef4444';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          e.currentTarget.style.color = '#fca5a5';
        }}
        title="Stop camera and turn off gesture control"
      >
        <Power size={11} color="#f87171" />
        <span>TURN OFF GESTURE CONTROL</span>
      </button>
    </div>
  );
}
