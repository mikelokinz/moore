import React, { useState } from 'react';
import {
  Activity,
  Zap,
  ShieldCheck,
  AlertTriangle,
  ArrowDownCircle,
  Compass,
  Layers,
  Sliders,
  TrendingUp,
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
  // Mode switcher: TENSION TELEMETRY vs STRUCTURAL LOAD ANALYSIS
  const [calcMode, setCalcMode] = useState<'tension' | 'load'>('tension');

  // MoorDyn v2 Dynamic Solver State
  const [moordynLoading, setMoordynLoading] = useState(false);
  const [moordynResult, setMoordynResult] = useState<{
    solver: string;
    fairlead_tension_kN: number;
    max_tension_kN: number;
    anchor_tension_kN: number;
    dynamic_amplification_factor: number;
    safety_factor: number;
    status: string;
    nodes_count: number;
  } | null>(null);

  const runMoordynSimulation = async () => {
    setMoordynLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/physics/moordyn/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          water_depth: config.waterDepth || 1000,
          scope_ratio: config.scope || 1.25,
          excursion_x: buoyState.excursionX,
          excursion_z: buoyState.excursionZ,
          wave_height: env.waveHeight || 2.0,
          wave_period: env.wavePeriod || 8.0,
          current_speed: env.currentSpeed || 0.8,
          material_type: selectedMaterialId,
          mbl_kN: config.mbl_kN || 450,
        }),
      });
      const data = await res.json();
      setMoordynResult(data);
    } catch (err) {
      console.error('MoorDyn simulate failed:', err);
    } finally {
      setMoordynLoading(false);
    }
  };

  const allLoads = React.useMemo(() => {
    return calculateMaterialLoads(env, config, buoyState);
  }, [env, config, buoyState]);

  const activeLoad: MaterialLoadCalculation =
    allLoads[selectedMaterialId] || allLoads['nylon_rope'] || Object.values(allLoads)[0];

  const statusColor =
    activeLoad.tensionState === 'CRITICAL_TAUT' || activeLoad.status === 'CRITICAL'
      ? '#ef4444'
      : activeLoad.tensionState === 'ELEVATED' || activeLoad.status === 'WARNING'
      ? '#f59e0b'
      : activeLoad.tensionState === 'SLACK'
      ? '#94a3b8'
      : '#22d3ee';

  const statusBg =
    activeLoad.tensionState === 'CRITICAL_TAUT' || activeLoad.status === 'CRITICAL'
      ? 'rgba(239, 68, 68, 0.15)'
      : activeLoad.tensionState === 'ELEVATED' || activeLoad.status === 'WARNING'
      ? 'rgba(245, 158, 11, 0.15)'
      : 'rgba(34, 211, 238, 0.12)';

  const cardStyle: React.CSSProperties = isFloating
    ? {
        position: 'absolute',
        top: '72px',
        right: '24px',
        width: '390px',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, rgba(2, 8, 23, 0.96) 0%, rgba(15, 23, 42, 0.94) 100%)',
        border: '1px solid rgba(34, 211, 238, 0.35)',
        borderRadius: '8px',
        padding: '14px',
        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.85), 0 0 20px rgba(34, 211, 238, 0.15)',
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
      {/* ── Box Header with Mode Toggle ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {calcMode === 'tension' ? (
            <Zap size={16} color="#22d3ee" className="animate-pulse" />
          ) : (
            <Activity size={16} color="#22d3ee" />
          )}
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
              {calcMode === 'tension' ? 'MOORING TENSION CALCULATOR' : 'MATERIAL LOAD CALCULATOR'}
            </div>
            <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {calcMode === 'tension'
                ? 'DYNAMIC AXIAL TENSION, CATENARY ANGLE & WAVE HEAVE'
                : 'MBL STRENGTH, DRAG RESISTANCE & ELASTIC STRAIN'}
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

      {/* ── Top View Switcher Tabs: TENSION TELEMETRY vs LOAD ANALYSIS ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '3px',
          borderRadius: '5px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          onClick={() => setCalcMode('tension')}
          style={{
            background: calcMode === 'tension' ? 'rgba(34, 211, 238, 0.25)' : 'transparent',
            border: calcMode === 'tension' ? '1px solid #22d3ee' : '1px solid transparent',
            color: calcMode === 'tension' ? '#ffffff' : '#94a3b8',
            fontSize: '9px',
            fontWeight: calcMode === 'tension' ? 800 : 500,
            fontFamily: 'monospace',
            padding: '5px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
          }}
        >
          <Zap size={11} color={calcMode === 'tension' ? '#22d3ee' : '#94a3b8'} /> TENSION TELEMETRY
        </button>

        <button
          onClick={() => setCalcMode('load')}
          style={{
            background: calcMode === 'load' ? 'rgba(34, 211, 238, 0.25)' : 'transparent',
            border: calcMode === 'load' ? '1px solid #22d3ee' : '1px solid transparent',
            color: calcMode === 'load' ? '#ffffff' : '#94a3b8',
            fontSize: '9px',
            fontWeight: calcMode === 'load' ? 800 : 500,
            fontFamily: 'monospace',
            padding: '5px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
          }}
        >
          <Activity size={11} color={calcMode === 'load' ? '#22d3ee' : '#94a3b8'} /> LOAD ANALYSIS
        </button>
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
          const isWarning =
            loadItem && (loadItem.status !== 'SAFE' || loadItem.tensionState === 'CRITICAL_TAUT');

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
          background: 'rgba(15, 23, 42, 0.75)',
          border: `1px solid ${statusColor}45`,
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
            {calcMode === 'tension' ? activeLoad.tensionState : activeLoad.status}
          </span>
        </div>

        {/* ── Dynamic Hero Metric Readout ── */}
        {calcMode === 'tension' ? (
          /* TENSION HERO */
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                CURRENT DYNAMIC LINE TENSION
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: statusColor, fontFamily: 'monospace', lineHeight: 1.1 }}>
                {activeLoad.workingTension_kN}{' '}
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>kN</span>
              </div>
              <div style={{ fontSize: '7.5px', color: '#64748b', fontFamily: 'monospace' }}>
                ≈ {activeLoad.workingTension_kgf.toLocaleString()} kgf · {activeLoad.workingTension_lbf.toLocaleString()} lbf
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
                WAVE SWELL OSCILLATION
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                ±{activeLoad.dynamicWaveTension_kN} kN
              </div>
              <div style={{ fontSize: '7.5px', color: '#64748b', fontFamily: 'monospace' }}>
                DAF {activeLoad.dynamicAmplificationFactor}x · Peak {activeLoad.peakSnapTension_kN} kN
              </div>
            </div>
          </div>
        ) : (
          /* LOAD HERO */
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                TOTAL WORKING TENSILE LOAD
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: statusColor, fontFamily: 'monospace', lineHeight: 1.1 }}>
                {activeLoad.workingTension_kN}{' '}
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>kN</span>
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
        )}

        {/* Dynamic Capacity / Strength Progress Bar */}
        <div style={{ marginTop: '7px', width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, activeLoad.utilization_percent)}%`,
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

      {/* ── VIEW MODE CONTENT ── */}
      {calcMode === 'tension' ? (
        /* ═══════════════ TENSION TELEMETRY MODE ═══════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* 3D Tension Vector Decomposition Grid */}
          <div
            style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: '6px',
              padding: '8px 10px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
            }}
          >
            <div>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
                CATENARY ANGLE (θ)
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                {activeLoad.catenaryAngle_deg}°
              </div>
              <div style={{ fontSize: '7px', color: '#64748b', fontFamily: 'monospace' }}>
                from vertical
              </div>
            </div>

            <div>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
                HORIZ. PULL (H)
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                {activeLoad.horizontalTension_kN} kN
              </div>
              <div style={{ fontSize: '7px', color: '#64748b', fontFamily: 'monospace' }}>
                lateral excursion
              </div>
            </div>

            <div>
              <div style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: 'monospace' }}>
                VERT. LIFT (V)
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                {activeLoad.verticalTension_kN} kN
              </div>
              <div style={{ fontSize: '7px', color: '#64748b', fontFamily: 'monospace' }}>
                gravity / uplift
              </div>
            </div>
          </div>

          {/* 4-Box Deep Tension Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div style={statBoxStyle}>
              <span style={statLabelStyle}>STATIC PRE-TENSION</span>
              <span style={statValueStyle}>{activeLoad.staticPretension_kN} kN</span>
              <span style={{ fontSize: '7px', color: '#64748b', fontFamily: 'monospace' }}>
                Hydrostatic balance
              </span>
            </div>

            <div style={statBoxStyle}>
              <span style={statLabelStyle}>DYNAMIC WAVE SURGE</span>
              <span style={{ ...statValueStyle, color: '#38bdf8' }}>
                ±{activeLoad.dynamicWaveTension_kN} kN
              </span>
              <span style={{ fontSize: '7px', color: '#64748b', fontFamily: 'monospace' }}>
                Orbital heave excitation
              </span>
            </div>

            <div style={statBoxStyle}>
              <span style={statLabelStyle}>PEAK SNAP TENSION</span>
              <span style={{ ...statValueStyle, color: activeLoad.peakSnapTension_kN > activeLoad.wll_kN ? '#ef4444' : '#ffffff' }}>
                {activeLoad.peakSnapTension_kN} kN
              </span>
              <span style={{ fontSize: '7px', color: '#64748b', fontFamily: 'monospace' }}>
                DAF {activeLoad.dynamicAmplificationFactor}x transient
              </span>
            </div>

            <div style={statBoxStyle}>
              <span style={statLabelStyle}>SLACK / MIN TROUGH</span>
              <span style={{ ...statValueStyle, color: activeLoad.minCycleTension_kN < 1.0 ? '#f59e0b' : '#34d399' }}>
                {activeLoad.minCycleTension_kN} kN
              </span>
              <span style={{ fontSize: '7px', color: '#64748b', fontFamily: 'monospace' }}>
                {activeLoad.minCycleTension_kN < 1.0 ? 'Risk of slack shock' : 'Anti-snap buffer OK'}
              </span>
            </div>
          </div>

          {/* Tension Limits & Safety Envelope */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '8px 10px',
              borderRadius: '5px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              fontSize: '8.5px',
              fontFamily: 'monospace',
            }}
          >
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '7.5px' }}>SAFE WORKING LIMIT (WLL)</span>
              <strong style={{ color: '#ffffff', fontSize: '11px' }}>{activeLoad.wll_kN} kN</strong>
              <div style={{ color: '#94a3b8', fontSize: '7.5px' }}>
                Utilized: {activeLoad.wllUtilization_percent}% of WLL
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '7.5px' }}>TENSION SAFETY FACTOR</span>
              <strong style={{ color: activeLoad.safetyFactor < 2.0 ? '#ef4444' : '#22d3ee', fontSize: '11px' }}>
                SF ≥ {activeLoad.safetyFactor}x
              </strong>
              <div style={{ color: '#94a3b8', fontSize: '7.5px' }}>
                Reserve: +{activeLoad.reserveMargin_kN} kN
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ═══════════════ LOAD ANALYSIS MODE ═══════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* 6-Grid Quantitative Physical Load Breakdown */}
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

          {/* Dimensional & Physical Profile */}
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
        </div>
      )}

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

      {/* ── MoorDyn v2 Dynamic Lumped-Mass Solver (NREL) Section ── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '5px',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Zap size={11} color="#f59e0b" />
            <span style={{ fontSize: '8px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
              MOORDYN v2 DYNAMIC SOLVER (NREL)
            </span>
          </div>
          <button
            onClick={runMoordynSimulation}
            disabled={moordynLoading}
            style={{
              background: moordynLoading ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.2)',
              border: '1px solid #f59e0b',
              borderRadius: '4px',
              padding: '3px 8px',
              color: '#fbbf24',
              fontSize: '8px',
              fontWeight: 700,
              cursor: moordynLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'monospace',
            }}
          >
            {moordynLoading ? 'SOLVING...' : 'RUN SOLVER'}
          </button>
        </div>

        {moordynResult && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '4px',
              fontSize: '7.5px',
              fontFamily: 'monospace',
              background: 'rgba(2, 6, 23, 0.6)',
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>FAIRLEAD TENSION</span>
              <strong style={{ color: '#ffffff', fontSize: '9.5px' }}>{moordynResult.fairlead_tension_kN} kN</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>MAX DYNAMIC T</span>
              <strong style={{ color: '#38bdf8', fontSize: '9.5px' }}>{moordynResult.max_tension_kN} kN</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>SAFETY FACTOR</span>
              <strong style={{ color: moordynResult.safety_factor >= 2.0 ? '#34d399' : '#ef4444', fontSize: '9.5px' }}>
                {moordynResult.safety_factor}x ({moordynResult.status})
              </strong>
            </div>
          </div>
        )}
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
          <ArrowDownCircle size={12} color="#22d3ee" /> DIVE CAMERA TO THIS LINK ({MATERIAL_DEPTH_MAP[selectedMaterialId] ?? 0}m)
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
