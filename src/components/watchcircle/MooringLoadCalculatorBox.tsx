import React from 'react';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Zap,
  ArrowDownCircle,
  HelpCircle,
  Cpu,
  Layers,
  Sliders,
} from 'lucide-react';
import type {
  EnvironmentalConditions,
  MooringConfig,
  BuoyState,
  WatchCircleDepthLevel,
} from './watchCircleTypes';
import {
  calculateMaterialLoads,
  MATERIAL_SPECS,
  type MaterialLoadCalculation,
} from './mooringLoadCalculator';

interface MooringLoadCalculatorBoxProps {
  env: EnvironmentalConditions;
  config: MooringConfig;
  buoyState: BuoyState;
  selectedMaterialId: string;
  onSelectMaterial: (id: string) => void;
  onDepthChange?: (depth: WatchCircleDepthLevel) => void;
  isFloating?: boolean;
  onClose?: () => void;
}

const MATERIAL_ORDER = [
  'upper_chain',
  'inductive_cable',
  'nylon_rope',
  'trawl_float',
  'polypropylene_rope',
  'glass_spheres',
  'acoustic_release',
  'ground_chain',
  'bottom_weight',
];

const MATERIAL_DEPTH_MAP: Record<string, WatchCircleDepthLevel> = {
  upper_chain: 10,
  inductive_cable: 100,
  nylon_rope: 500,
  trawl_float: 500,
  polypropylene_rope: 1000,
  glass_spheres: 2500,
  acoustic_release: 2500,
  ground_chain: 2500,
  bottom_weight: 2500,
};

export const MooringLoadCalculatorBox: React.FC<MooringLoadCalculatorBoxProps> = ({
  env,
  config,
  buoyState,
  selectedMaterialId,
  onSelectMaterial,
  onDepthChange,
  isFloating = false,
  onClose,
}) => {
  const allLoads = React.useMemo(() => {
    return calculateMaterialLoads(env, config, buoyState);
  }, [env, config, buoyState]);

  const activeLoad: MaterialLoadCalculation =
    allLoads[selectedMaterialId] || allLoads['nylon_rope'] || Object.values(allLoads)[0];

  const statusColor =
    activeLoad.status === 'CRITICAL'
      ? '#ef4444'
      : activeLoad.status === 'WARNING'
      ? '#f59e0b'
      : '#22d3ee';

  const statusBg =
    activeLoad.status === 'CRITICAL'
      ? 'rgba(239, 68, 68, 0.15)'
      : activeLoad.status === 'WARNING'
      ? 'rgba(245, 158, 11, 0.15)'
      : 'rgba(34, 211, 238, 0.12)';

  const cardStyle: React.CSSProperties = isFloating
    ? {
        position: 'absolute',
        top: '72px',
        right: '24px',
        width: '380px',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, rgba(2, 8, 23, 0.94) 0%, rgba(15, 23, 42, 0.92) 100%)',
        border: '1px solid rgba(34, 211, 238, 0.35)',
        borderRadius: '8px',
        padding: '14px',
        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.8), 0 0 20px rgba(34, 211, 238, 0.15)',
        backdropFilter: 'blur(20px)',
        zIndex: 55,
        pointerEvents: 'auto',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'auto',
      };

  return (
    <div style={cardStyle}>
      {/* ── Box Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={15} color="#22d3ee" />
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: '#ffffff',
                fontFamily: 'monospace',
              }}
            >
              MATERIAL LOAD CALCULATOR
            </div>
            <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
              STRUCTURAL TENSION, DRAG & STRAIN BREAKDOWN
            </div>
          </div>
        </div>

        {isFloating && onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Material Selector Chips ── */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}
      >
        {MATERIAL_ORDER.map((matId) => {
          const spec = MATERIAL_SPECS[matId];
          const isSelected = selectedMaterialId === matId;
          const loadItem = allLoads[matId];
          const isWarning = loadItem && loadItem.status !== 'SAFE';

          return (
            <button
              key={matId}
              onClick={() => onSelectMaterial(matId)}
              style={{
                background: isSelected
                  ? 'rgba(34, 211, 238, 0.22)'
                  : 'rgba(15, 23, 42, 0.75)',
                border: `1px solid ${
                  isSelected
                    ? '#22d3ee'
                    : isWarning
                    ? 'rgba(245, 158, 11, 0.4)'
                    : 'rgba(255, 255, 255, 0.08)'
                }`,
                borderRadius: '4px',
                padding: '4px 8px',
                color: isSelected ? '#ffffff' : '#94a3b8',
                fontSize: '8.5px',
                fontWeight: isSelected ? 700 : 500,
                fontFamily: 'monospace',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              {isWarning && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: loadItem.status === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                  }}
                />
              )}
              {spec?.shortLabel || matId}
            </button>
          );
        })}
      </div>

      {/* ── Active Material Profile Banner ── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: `1px solid ${statusColor}40`,
          borderRadius: '6px',
          padding: '10px 12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {activeLoad.name}
            </div>
            <div style={{ fontSize: '8px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
              {activeLoad.specification}
            </div>
          </div>
          <span
            style={{
              fontSize: '7.5px',
              fontFamily: 'monospace',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '3px',
              background: statusBg,
              border: `1px solid ${statusColor}`,
              color: statusColor,
            }}
          >
            {activeLoad.status}
          </span>
        </div>

        {/* Hero Load Metric: Working Tension */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              CURRENT WORKING TENSILE LOAD
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: statusColor, fontFamily: 'monospace', lineHeight: 1.1 }}>
              {activeLoad.workingTension_kN}{' '}
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>kN</span>
            </div>
            <div style={{ fontSize: '7.5px', color: '#64748b', fontFamily: 'monospace' }}>
              ≈ {activeLoad.workingTension_kgf.toLocaleString()} kgf · {activeLoad.workingTension_lbf.toLocaleString()} lbf
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
              MBL CAPACITY UTILIZATION
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {activeLoad.utilization_percent}%
            </div>
          </div>
        </div>

        {/* Dynamic Utilization Progress Bar */}
        <div style={{ marginTop: '6px', width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${activeLoad.utilization_percent}%`,
              height: '100%',
              background:
                activeLoad.utilization_percent > 75
                  ? '#ef4444'
                  : activeLoad.utilization_percent > 40
                  ? '#f59e0b'
                  : 'linear-gradient(90deg, #06b6d4 0%, #22d3ee 100%)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* ── 6-Grid Quantitative Physical Load Breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <div style={statBoxStyle}>
          <span style={statLabelStyle}>MIN. BREAKING LOAD (MBL)</span>
          <span style={statValueStyle}>{activeLoad.mbl_kN} kN</span>
        </div>

        <div style={statBoxStyle}>
          <span style={statLabelStyle}>WORKING LOAD LIMIT (WLL)</span>
          <span style={statValueStyle}>{activeLoad.wll_kN} kN</span>
        </div>

        <div style={statBoxStyle}>
          <span style={statLabelStyle}>SAFETY FACTOR (SF)</span>
          <span style={{ ...statValueStyle, color: activeLoad.safetyFactor < 2.0 ? '#ef4444' : '#22d3ee' }}>
            {activeLoad.safetyFactor}x
          </span>
        </div>

        <div style={statBoxStyle}>
          <span style={statLabelStyle}>RESERVE MARGIN</span>
          <span style={{ ...statValueStyle, color: '#34d399' }}>
            +{activeLoad.reserveMargin_kN} kN
          </span>
        </div>

        <div style={statBoxStyle}>
          <span style={statLabelStyle}>HYDRODYNAMIC DRAG</span>
          <span style={statValueStyle}>{activeLoad.dragLoad_kN} kN</span>
        </div>

        <div style={statBoxStyle}>
          <span style={statLabelStyle}>AXIAL ELASTIC STRETCH (ΔL)</span>
          <span style={statValueStyle}>
            +{activeLoad.elasticStretch_m} m{' '}
            <span style={{ fontSize: '7.5px', color: '#94a3b8' }}>({activeLoad.stretchPercent}%)</span>
          </span>
        </div>
      </div>

      {/* ── Dimensional & Physical Profile ── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.55)',
          padding: '8px 10px',
          borderRadius: '5px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          fontSize: '8px',
          fontFamily: 'monospace',
          color: '#94a3b8',
        }}
      >
        <div>Diameter: <strong style={{ color: '#cbd5e1' }}>{activeLoad.diameter_mm} mm</strong></div>
        <div>Length: <strong style={{ color: '#cbd5e1' }}>{activeLoad.length_m} m</strong></div>
        <div>Depth Span: <strong style={{ color: '#cbd5e1' }}>{activeLoad.depthRange_m[0]}m – {activeLoad.depthRange_m[1]}m</strong></div>
        <div>
          Submerged Wt:{' '}
          <strong style={{ color: activeLoad.submergedWeight_N_m > 0 ? '#34d399' : '#cbd5e1' }}>
            {activeLoad.submergedWeight_N_m > 0 ? `+${activeLoad.submergedWeight_N_m} N/m (Lift)` : `${activeLoad.submergedWeight_N_m} N/m`}
          </strong>
        </div>
      </div>

      {/* ── Engineering Recommendation & Standards Note ── */}
      <div
        style={{
          fontSize: '7.5px',
          color: '#94a3b8',
          fontFamily: 'monospace',
          lineHeight: 1.35,
          background: 'rgba(15, 23, 42, 0.65)',
          padding: '6px 8px',
          borderRadius: '4px',
          borderLeft: `3px solid ${statusColor}`,
        }}
      >
        <div><strong>ASSESSMENT:</strong> {activeLoad.recommendation}</div>
        <div style={{ color: '#64748b', marginTop: '2px' }}>{activeLoad.standardsNote}</div>
      </div>

      {/* ── Camera Focus Action Button ── */}
      {onDepthChange && (
        <button
          onClick={() => {
            const targetDepth = MATERIAL_DEPTH_MAP[selectedMaterialId] ?? 0;
            onDepthChange(targetDepth);
          }}
          style={{
            background: 'rgba(34, 211, 238, 0.18)',
            border: '1px solid #22d3ee',
            borderRadius: '5px',
            padding: '7px 10px',
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: 700,
            fontFamily: 'monospace',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowDownCircle size={12} color="#22d3ee" /> DIVE CAMERA TO THIS MATERIAL ({MATERIAL_DEPTH_MAP[selectedMaterialId] ?? 0}m)
        </button>
      )}
    </div>
  );
};

const statBoxStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.65)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '5px',
  padding: '6px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '7px',
  color: '#64748b',
  fontFamily: 'monospace',
  letterSpacing: '0.06em',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '10.5px',
  fontWeight: 700,
  color: '#ffffff',
  fontFamily: 'monospace',
};
