import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { MooringBuoy3D } from '../watchcircle/MooringBuoy3D';
import { MooringLine3D } from '../watchcircle/MooringLine3D';
import { SeabedEnvironment } from '../watchcircle/SeabedEnvironment';
import {
  calculateMooringPhysics,
  type EnvironmentalConditions,
  type MooringConfig,
} from '../watchcircle/watchCircleTypes';
import type { Station } from '../../types/ocean';
import type { WaveParams } from '../../utils/waveMath';

interface ArgoBuoyMarkerProps {
  station: Station;
  isDifference?: boolean;
  waveParams?: WaveParams;
}

const DEPTH_MARKER_CONFIG = [
  { depth: 10, yPos: -1.2, label: '10 M · UPPER BRIDLE' },
  { depth: 50, yPos: -3.2, label: '50 M · ADCP CURRENT METER' },
  { depth: 100, yPos: -6.6, label: '100 M · INDUCTIVE CTD & TRAWL FLOAT' },
  { depth: 500, yPos: -11.5, label: '500 M · COMPLIANT POLY TETHER' },
  { depth: 1000, yPos: -17.2, label: '1000 M · ACOUSTIC RELEASE & SEABED ANCHOR' },
];

function DepthMarker({ depth, yPos, label }: { depth: number; yPos: number; label?: string }) {
  const htmlRef = useRef<HTMLDivElement>(null!);

  useFrame(({ camera }) => {
    if (htmlRef.current) {
      const distY = Math.abs(camera.position.y - yPos);
      if (distY > 18) {
        htmlRef.current.style.opacity = '0';
        htmlRef.current.style.display = 'none';
      } else {
        htmlRef.current.style.opacity = '1';
        htmlRef.current.style.display = 'block';
      }
    }
  });

  return (
    <group position={[0, yPos, 0]}>
      {/* Sensor Ring Collar */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.16, 24]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Sensor Capsule Node */}
      <mesh position={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
      </mesh>
      <Html position={[0.22, 0, 0]} center={false}>
        <div
          ref={htmlRef}
          style={{
            pointerEvents: 'none',
            color: '#38bdf8',
            fontSize: '9px',
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '0.12em',
            background: 'rgba(2, 8, 23, 0.75)',
            padding: '2px 6px',
            borderRadius: '3px',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.25s',
          }}
        >
          {label || `${depth} M · INDUCTIVE CTD`}
        </div>
      </Html>
    </group>
  );
}

function StationLabel({
  station,
  liveMotionRef,
}: {
  station: Station;
  liveMotionRef: React.MutableRefObject<{ position: THREE.Vector3 }>;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const htmlRef = useRef<HTMLDivElement>(null!);

  useFrame(({ camera }) => {
    if (groupRef.current && liveMotionRef.current) {
      // Follow buoy's wave heave
      groupRef.current.position.y = liveMotionRef.current.position.y;
    }

    if (htmlRef.current) {
      const distY = Math.abs(camera.position.y - 1.5);
      if (distY > 28) {
        htmlRef.current.style.opacity = '0';
        htmlRef.current.style.display = 'none';
      } else {
        htmlRef.current.style.opacity = '1';
        htmlRef.current.style.display = 'flex';
      }
    }
  });

  return (
    <group ref={groupRef} position={[1.8, 1.8, 0]}>
      <Html
        center={false}
        style={{
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          ref={htmlRef}
          style={{
            background: 'rgba(2, 8, 18, 0.88)',
            border: '1px solid rgba(34, 211, 238, 0.35)',
            borderRadius: '6px',
            padding: '8px 12px',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            transition: 'opacity 0.25s',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontFamily: 'monospace',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background:
                  station.status === 'critical'
                    ? '#ef4444'
                    : station.status === 'warning'
                    ? '#f59e0b'
                    : '#10b981',
                boxShadow: `0 0 8px ${
                  station.status === 'critical'
                    ? '#ef4444'
                    : station.status === 'warning'
                    ? '#f59e0b'
                    : '#10b981'
                }`,
              }}
            />
            {station.id}
          </div>
          <div
            style={{
              fontSize: '8.5px',
              color: '#38bdf8',
              letterSpacing: '0.12em',
              fontWeight: 600,
            }}
          >
            {(station.region || 'Indian Ocean').toUpperCase()}
          </div>
          <div
            style={{
              fontSize: '8px',
              color: '#94a3b8',
              fontFamily: 'monospace',
            }}
          >
            {(station.latitude || 0).toFixed(4)}° N, {(station.longitude || 0).toFixed(4)}° E
          </div>
        </div>
      </Html>
    </group>
  );
}

export function ArgoBuoyMarker({ station, isDifference, waveParams }: ArgoBuoyMarkerProps) {
  // Dynamic shared motion tracking linking buoy kinematics to the mooring line
  const liveMotionRef = useRef<{
    position: THREE.Vector3;
    rotation: THREE.Euler;
    keelPosition: THREE.Vector3;
  }>({
    position: new THREE.Vector3(0, 0.26, 0),
    rotation: new THREE.Euler(0, 0, 0),
    keelPosition: new THREE.Vector3(0, -1.95, 0),
  });

  // Environmental forcing matching station telemetry
  const env: EnvironmentalConditions = useMemo(
    () => ({
      currentSpeed: station.currentSpeed || 0.4,
      currentDirection: 215,
      windSpeed: (station.waveHeight || 1.5) * 3.8,
      windDirection: 225,
      waveHeight: station.waveHeight || 1.5,
      wavePeriod: 8.0,
      waveDirection: 220,
    }),
    [station.currentSpeed, station.waveHeight]
  );

  // Authoritative Mooring Configuration for deep ocean deployment
  const config: MooringConfig = useMemo(
    () => ({
      waterDepth: 2500,
      watchCircleRadius: 750,
      nominalLatitude: station.latitude || 16.36,
      nominalLongitude: station.longitude || 87.99,
      buoyId: station.id,
      scope: 1.25,
      mbl_kN: 250,
    }),
    [station.latitude, station.longitude, station.id]
  );

  // Multi-segment catenary physics calculation obeying oceanographic MoorSense mechanics
  // Anchored at localized inspection origin (0, 0)
  const physicsData = useMemo(() => {
    return calculateMooringPhysics(env, config, 0, {
      steadyExcursionMeters: 0,
      forceResultantAngle: 0,
    });
  }, [env, config]);

  return (
    <group>
      {/* ── Authentic 3D OMNI Mooring Buoy Riding Waves (Directly coupled to WaveSurface) ── */}
      <MooringBuoy3D
        buoyState={physicsData.buoyState}
        buoyId={station.id}
        waveHeight={station.waveHeight || 1.5}
        wavePeriod={8.0}
        windSpeed={station.waveHeight ? station.waveHeight * 3.8 : 6.0}
        currentSpeed={station.currentSpeed || 0.4}
        liveMotionRef={liveMotionRef}
        waveParams={waveParams}
      />

      {/* ── Dynamic Physics Catenary Mooring Line (Elastic S-Loop, Trawl Float & Tackle) ── */}
      <MooringLine3D
        catenaryPoints={physicsData.catenaryPoints}
        buoyState={physicsData.buoyState}
        segments={physicsData.segments}
        liveMotionRef={liveMotionRef}
      />

      {/* ── Bathymetric Seabed Environment & Clump Weight Anchor Foundation ── */}
      <SeabedEnvironment waterDepth={config.waterDepth} seabedY={-18} />

      {/* ── Underwater Depth Markers & Profiling Sensors (10m, 50m, 100m, 500m, 1000m) ── */}
      {DEPTH_MARKER_CONFIG.map((dm) => (
        <DepthMarker key={dm.depth} depth={dm.depth} yPos={dm.yPos} label={dm.label} />
      ))}

      {/* ── Floating Station Identity Label ── */}
      <StationLabel station={station} liveMotionRef={liveMotionRef} />

      {/* ── Optional Holographic Model Prediction Marker (Difference Mode) ── */}
      {isDifference && (
        <group position={[0.8, 0.26, 0.8]}>
          <mesh>
            <cylinderGeometry args={[1.35, 1.25, 0.55, 24, 1, true]} />
            <meshBasicMaterial
              color="#f59e0b"
              wireframe
              transparent
              opacity={0.65}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <Html position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
            <div
              style={{
                color: '#f59e0b',
                fontSize: '8.5px',
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
                background: 'rgba(245, 158, 11, 0.12)',
                padding: '2px 6px',
                borderRadius: '3px',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                textShadow: '0 0 6px #f59e0b',
                whiteSpace: 'nowrap',
              }}
            >
              NUMERICAL MODEL PREDICTION
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
