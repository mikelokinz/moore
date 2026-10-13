import React from 'react';
import { Html } from '@react-three/drei';
import { MOORING_COMPONENTS, type MooringComponentInfo } from './mooringComponentData';
import { X, Cpu, ShieldCheck, Anchor, Activity } from 'lucide-react';
import type { EnvironmentalConditions, MooringConfig, BuoyState } from './watchCircleTypes';
import { calculateMaterialLoads } from './mooringLoadCalculator';

interface MooringPartCalloutProps {
  partId: string;
  position: [number, number, number];
  onClose: () => void;
  env?: EnvironmentalConditions;
  config?: MooringConfig;
  buoyState?: BuoyState;
  onSelectMaterial?: (id: string) => void;
}

const PART_TO_MATERIAL: Record<string, string> = {
  upper_chain: 'upper_chain',
  adcp: 'upper_chain',
  inductive_cable: 'inductive_cable',
  ct_sensor: 'inductive_cable',
  ctd_sensor: 'inductive_cable',
  nylon_rope: 'nylon_rope',
  trawl_float: 'trawl_float',
  polypropylene_rope: 'polypropylene_rope',
  glass_spheres: 'glass_spheres',
  acoustic_release: 'acoustic_release',
  ground_chain: 'ground_chain',
  bottom_weight: 'bottom_weight',
};

export const MooringPartCallout: React.FC<MooringPartCalloutProps> = ({
  partId,
  position,
  onClose,
  env,
  config,
  buoyState,
  onSelectMaterial,
}) => {
  const data: MooringComponentInfo | undefined = MOORING_COMPONENTS[partId];

  const materialId = PART_TO_MATERIAL[partId] || 'nylon_rope';
  const loadCalc = React.useMemo(() => {
    if (!env || !config || !buoyState) return null;
    const all = calculateMaterialLoads(env, config, buoyState);
    return all[materialId];
  }, [env, config, buoyState, materialId]);

  if (!data) return null;

  return (
    <Html
      position={position}
      center={false}
      zIndexRange={[1000, 500]}
      style={{
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      <div style={{ position: 'relative', width: 0, height: 0 }}>
        {/* ── 1. Precise 3D Anchor Spot (Target Pip with Pulsing Ring) ── */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        >
          {/* Outer Pulsing Wave Ring */}
          <div
            style={{
              position: 'absolute',
              left: '-14px',
              top: '-14px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '2px solid rgba(56, 189, 248, 0.75)',
              animation: 'ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
          {/* Inner Solid Target Reticle Dot */}
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: data.color || '#38bdf8',
              boxShadow: `0 0 14px ${data.color || '#38bdf8'}, 0 0 4px #ffffff`,
              border: '2px solid #ffffff',
            }}
          />
        </div>

        {/* ── 2. SVG Leader Line from Target Pip to Info Box ── */}
        <svg
          style={{
            position: 'absolute',
            left: 0,
            top: '-50px',
            width: '65px',
            height: '55px',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <path
            d="M 0 50 L 32 16 L 60 16"
            fill="none"
            stroke={data.color || '#38bdf8'}
            strokeWidth="2.5"
            strokeDasharray="4 2"
            opacity="0.95"
          />
          <circle cx="60" cy="16" r="3.5" fill={data.color || '#38bdf8'} />
        </svg>

        {/* ── 3. High-Tech Glassmorphic HUD Info Box (Directly Facing Camera) ── */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: '60px',
            top: '-110px',
            width: '360px',
            maxWidth: 'calc(100vw - 80px)',
            background: 'linear-gradient(135deg, rgba(2, 8, 23, 0.97) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.55)',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.90), 0 0 25px rgba(56, 189, 248, 0.20)',
            borderRadius: '10px',
            padding: '14px 16px',
            backdropFilter: 'blur(20px)',
            color: '#f8fafc',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            zIndex: 99999,
          }}
        >
          {/* Top Bar: Diagram Reference Tag + Badge + Close Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  color: '#38bdf8',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}
              >
                DIAGRAM: {data.diagramLabel}
              </span>
              <span
                style={{
                  fontSize: '8.5px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: '#94a3b8',
                  letterSpacing: '0.05em',
                }}
              >
                [{data.badge}]
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '4px',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
              title="Close details"
            >
              <X size={14} />
            </button>
          </div>

          {/* Component Actual Engineering Title */}
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.3,
              marginBottom: '4px',
              letterSpacing: '-0.01em',
            }}
          >
            {data.actualName}
          </div>

          {/* Equipment Model / Identification */}
          <div
            style={{
              fontSize: '10.5px',
              fontFamily: 'monospace',
              color: '#38bdf8',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Cpu size={11} /> {data.equipmentModel}
          </div>

          {/* ── Official Material Box (Internet & NIOT Research Grounding) ── */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(34, 211, 238, 0.35)',
              borderLeft: `3px solid ${data.color || '#38bdf8'}`,
              borderRadius: '6px',
              padding: '8px 10px',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color: '#67e8f9',
                letterSpacing: '0.08em',
                marginBottom: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShieldCheck size={11} /> ACTUAL MATERIAL SPECIFICATION:
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#f1f5f9',
                lineHeight: 1.35,
              }}
            >
              {data.material}
            </div>
          </div>

          {/* Key Engineering Specifications Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              marginBottom: '10px',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '10px',
            }}
          >
            <div>
              <span style={{ color: '#94a3b8', fontSize: '8.5px', display: 'block', fontWeight: 600 }}>
                DEPTH / ZONE:
              </span>
              <span style={{ color: '#e2e8f0', fontWeight: 500, lineHeight: 1.2 }}>{data.depthRating}</span>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '8.5px', display: 'block', fontWeight: 600 }}>
                DIMENSIONS / MASS:
              </span>
              <span style={{ color: '#e2e8f0', fontWeight: 500, lineHeight: 1.2 }}>{data.dimensionsOrMass}</span>
            </div>
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px' }}>
              <span style={{ color: '#94a3b8', fontSize: '8.5px', display: 'block', fontWeight: 600 }}>
                STRENGTH / RATING:
              </span>
              <span style={{ color: '#38bdf8', fontWeight: 500, lineHeight: 1.2 }}>{data.mblOrAccuracy}</span>
            </div>
          </div>

          {/* Operational Purpose in OMNI Mooring */}
          <div
            style={{
              fontSize: '10.5px',
              color: '#cbd5e1',
              lineHeight: 1.45,
              marginBottom: '8px',
            }}
          >
            <strong style={{ color: '#f8fafc' }}>Function: </strong>
            {data.purpose}
          </div>

          {/* Live Dynamic Load Readout */}
          {loadCalc && (
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(34, 211, 238, 0.35)',
                borderRadius: '6px',
                padding: '8px 10px',
                marginBottom: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#22d3ee', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={11} /> LIVE LOAD TELEMETRY
                </span>
                <span
                  style={{
                    fontSize: '8px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background:
                      loadCalc.status === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' :
                      loadCalc.status === 'WARNING' ? 'rgba(245, 158, 11, 0.2)' :
                      'rgba(34, 211, 238, 0.2)',
                    color:
                      loadCalc.status === 'CRITICAL' ? '#ef4444' :
                      loadCalc.status === 'WARNING' ? '#f59e0b' :
                      '#22d3ee',
                  }}
                >
                  SF ≥ {loadCalc.safetyFactor} ({loadCalc.status})
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '9px', fontFamily: 'monospace' }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '8px' }}>WORKING LOAD:</span>
                  <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '11px' }}>
                    {loadCalc.workingTension_kN} kN
                  </div>
                  <div style={{ color: '#64748b', fontSize: '7.5px' }}>
                    {loadCalc.workingTension_kgf.toLocaleString()} kgf
                  </div>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '8px' }}>MBL STRENGTH:</span>
                  <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '11px' }}>
                    {loadCalc.mbl_kN} kN
                  </div>
                  <div style={{ color: '#64748b', fontSize: '7.5px' }}>
                    Utilized: {loadCalc.utilization_percent}%
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMaterial?.(materialId);
                }}
                style={{
                  background: 'rgba(34, 211, 238, 0.2)',
                  border: '1px solid #22d3ee',
                  borderRadius: '4px',
                  padding: '5px',
                  color: '#ffffff',
                  fontSize: '8.5px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: '2px',
                }}
              >
                <Activity size={10} /> VIEW IN LOAD CALCULATOR BOX →
              </button>
            </div>
          )}

          {/* Provenance & Citation Tag */}
          <div
            style={{
              fontSize: '8px',
              fontFamily: 'monospace',
              color: '#64748b',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Anchor size={9} /> {data.specSource}
          </div>
        </div>
      </div>
    </Html>
  );
};
