import { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OceanSurface } from './OceanSurface';
import { OceanSkyDome } from './OceanSkyDome';
import { SeabedEnvironment } from './SeabedEnvironment';
import { MooringBuoy3D } from './MooringBuoy3D';
import { MooringLine3D } from './MooringLine3D';
import { WatchCircleOverlay } from './WatchCircleOverlay';
import { MooringPartCallout } from './MooringPartCallout';
import { UnderwaterEnvironment } from '../localocean/UnderwaterEnvironment';
import { DynamicLighting } from '../localocean/LocalOceanScene';
import { computeWaveParams } from '../../utils/waveMath';
import type {
  EnvironmentalConditions,
  MooringConfig,
  BuoyState,
  GPSTrailPoint,
  WatchCircleDepthLevel,
  MooringSegmentData,
} from './watchCircleTypes';

interface WatchCircleSceneProps {
  env: EnvironmentalConditions;
  config: MooringConfig;
  buoyState: BuoyState;
  catenaryPoints: THREE.Vector3[];
  segments?: MooringSegmentData[];
  selectedSegmentIndex?: number | null;
  onSelectSegment?: (index: number | null) => void;
  selectedMaterialId?: string;
  onSelectMaterial?: (id: string) => void;
  gpsTrail: GPSTrailPoint[];
  showBoundary: boolean;
  showTrail: boolean;
  showExcursionVector: boolean;
  showUnderwater: boolean;
  cameraPreset: 'top' | 'surface' | 'profile' | 'anchor' | null;
  onCameraPresetHandled: () => void;
  currentDepth: WatchCircleDepthLevel;
  onDepthChange?: (depth: WatchCircleDepthLevel) => void;
}

// ── Target camera positions and lookAt targets for each depth level ──
const DEPTH_CAMERA_TARGETS: Record<
  WatchCircleDepthLevel,
  { eye: [number, number, number]; target: [number, number, number] }
> = {
  0: {
    eye: [6, 3.5, 12],
    target: [0, 0.5, 0], // Surface discus buoy and watch circle
  },
  10: {
    eye: [3.5, -0.8, 6],
    target: [0, -1.2, 0], // Upper synthetic rope & fairlead
  },
  50: {
    eye: [4.5, -3.0, 7],
    target: [0, -3.5, 0], // Compliant nylon line & subsurface buoyancy floats
  },
  100: {
    eye: [5.5, -6.0, 8],
    target: [0, -6.5, 0], // Mesopelagic twilight zone
  },
  500: {
    eye: [6.5, -10.5, 9],
    target: [0, -11.0, 0], // Bathypelagic midnight zone & catenary belly
  },
  1000: {
    eye: [6.5, -14.0, 8.5],
    target: [0, -14.5, 0], // Abyssal deep ocean zone
  },
  2500: {
    eye: [5, -16.0, 7],
    target: [0, -17.5, 0], // Seabed ground anchor chain & sinker assembly
  },
};

function WatchCircleCameraManager({
  preset,
  onPresetHandled,
  currentDepth,
  orbitRef,
}: {
  preset: 'top' | 'surface' | 'profile' | 'anchor' | null;
  onPresetHandled: () => void;
  currentDepth: WatchCircleDepthLevel;
  orbitRef: React.RefObject<OrbitControlsImpl>;
}) {
  const targetEye = useRef(new THREE.Vector3(6, 3.5, 12));
  const targetLook = useRef(new THREE.Vector3(0, 0.5, 0));
  const isTransitioning = useRef(false);

  // Depth change triggers smooth camera translation
  useEffect(() => {
    const config = DEPTH_CAMERA_TARGETS[currentDepth] || DEPTH_CAMERA_TARGETS[0];
    targetEye.current.set(...config.eye);
    targetLook.current.set(...config.target);
    isTransitioning.current = true;
  }, [currentDepth]);

  // Preset viewpoint override
  useEffect(() => {
    if (!preset || !orbitRef.current) return;

    if (preset === 'top') {
      targetEye.current.set(0, 22, 0.01);
      targetLook.current.set(0, 0, 0);
    } else if (preset === 'surface') {
      targetEye.current.set(4, 3.5, 10);
      targetLook.current.set(0, 0.5, 0);
    } else if (preset === 'profile') {
      targetEye.current.set(24, -8, 16);
      targetLook.current.set(0, -9, 0);
    } else if (preset === 'anchor') {
      targetEye.current.set(6, -15, 8);
      targetLook.current.set(0, -17.5, 0);
    }

    isTransitioning.current = true;
    onPresetHandled();
  }, [preset, onPresetHandled, orbitRef]);

  useFrame(() => {
    if (!isTransitioning.current || !orbitRef.current) return;

    const controls = orbitRef.current;
    const camera = controls.object as THREE.PerspectiveCamera;

    camera.position.lerp(targetEye.current, 0.07);
    controls.target.lerp(targetLook.current, 0.07);
    controls.update();

    if (
      camera.position.distanceTo(targetEye.current) < 0.08 &&
      controls.target.distanceTo(targetLook.current) < 0.08
    ) {
      isTransitioning.current = false;
    }
  });

  return null;
}

export function WatchCircleScene({
  env,
  config,
  buoyState,
  catenaryPoints,
  segments,
  selectedSegmentIndex = null,
  onSelectSegment,
  selectedMaterialId,
  onSelectMaterial,
  gpsTrail,
  showBoundary,
  showTrail,
  showExcursionVector,
  showUnderwater,
  cameraPreset,
  onCameraPresetHandled,
  currentDepth,
}: WatchCircleSceneProps) {
  const orbitRef = useRef<OrbitControlsImpl>(null!);

  // Currently inspected component info callout state
  const [inspectedPart, setInspectedPart] = useState<{
    id: string;
    worldPos: [number, number, number];
  } | null>(null);

  // Shared live dynamic motion ref linking buoy kinematics with the mooring line connection
  const liveMotionRef = useRef<{
    position: THREE.Vector3;
    rotation: THREE.Euler;
    keelPosition: THREE.Vector3;
  }>({
    position: new THREE.Vector3(buoyState.excursionX / 30, 0, buoyState.excursionZ / 30),
    rotation: new THREE.Euler(0, 0, 0),
    keelPosition: new THREE.Vector3(buoyState.excursionX / 30, -1.95, buoyState.excursionZ / 30),
  });

  // Physically calibrated wave parameters matching Explore Ocean
  const waveParams = useMemo(() => {
    return computeWaveParams(
      env.waveHeight || 1.5,
      env.waveHeight || 1.5,
      env.currentSpeed || 0.4,
      28.0
    );
  }, [env.waveHeight, env.currentSpeed]);

  return (
    <Canvas
      camera={{ position: [6, 3.5, 12], fov: 42, near: 0.1, far: 3000 }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.32,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', background: '#051b36' }}
    >
      {/* ── Seamless 360° Infinite Ocean Sky Dome & Atmospheric Horizon ── */}
      <OceanSkyDome sunDirection={[100, 32, -80]} />

      {/* ── Dynamic Lighting System with Enhanced Deep Penetration ── */}
      <DynamicLighting maxDepthY={18} />

      {/* ── Deep Ocean Supplemental Fill & Inspection Lights ── */}
      {/* Mid-water column inspection light (illuminating CTD, S-loop U-bend & Trawl Float) */}
      <pointLight position={[1.2, -6.5, 0.5]} color="#ffffff" intensity={1.8} distance={32} decay={1} />
      {/* Seabed tackle inspection light (illuminating glass spheres, release, chain & bottom weight) */}
      <pointLight position={[0, -15.8, 0]} color="#ffffff" intensity={2.0} distance={32} decay={1} />
      {/* Upward subsea bounce fill light for illuminated undersides */}
      <directionalLight position={[-30, -35, 30]} intensity={1.4} color="#38bdf8" />

      {/* ── 3D Scene Objects with Suspense for Assets ── */}
      <Suspense fallback={null}>
        <group>
        {/* Ocean Wave Surface (Identical to Explore Ocean) */}
        <OceanSurface
          waveHeight={env.waveHeight}
          wavePeriod={env.wavePeriod}
          currentSpeed={env.currentSpeed}
          temperature={28.0}
          depth={currentDepth === 2500 ? 1000 : currentDepth}
          showUnderwater={showUnderwater}
        />

        {/* ── Depth-Based Underwater Atmosphere & Floating Plankton Particles ── */}
        <UnderwaterEnvironment
          depth={currentDepth === 2500 ? 1000 : currentDepth}
          visible={showUnderwater}
          maxDepthY={18}
        />

        {/* ── Watch Circle Overlay & GPS Track ── */}
        <WatchCircleOverlay
          radiusMeters={config.watchCircleRadius}
          buoyState={buoyState}
          gpsTrail={gpsTrail}
          showBoundary={showBoundary}
          showTrail={showTrail}
          showExcursionVector={showExcursionVector}
        />

        {/* ── 3D Mooring Buoy with smooth continuous wave heave, pitch & roll ── */}
        <MooringBuoy3D
          buoyState={buoyState}
          buoyId={config.buoyId}
          waveHeight={env.waveHeight}
          wavePeriod={env.wavePeriod}
          windSpeed={env.windSpeed}
          currentSpeed={env.currentSpeed}
          liveMotionRef={liveMotionRef}
          waveParams={waveParams}
          onInspectPart={(partId, worldPos) => {
            setInspectedPart({ id: partId, worldPos });
          }}
        />

        {/* ── 3D Multi-Segment Mooring Line with Interactive Inspection & Live Tracking ── */}
        <MooringLine3D
          catenaryPoints={catenaryPoints}
          buoyState={buoyState}
          segments={segments}
          selectedSegmentIndex={selectedSegmentIndex}
          onSelectSegment={onSelectSegment}
          selectedMaterialId={selectedMaterialId}
          onSelectMaterial={onSelectMaterial}
          liveMotionRef={liveMotionRef}
          onInspectPart={(partId, worldPos) => {
            setInspectedPart({ id: partId, worldPos });
          }}
        />

        {/* ── Seabed Bathymetry, Cast Anchor Sinker & Depth Scale Ruler ── */}
        <SeabedEnvironment waterDepth={config.waterDepth} seabedY={-18} />

        {/* ── Interactive 3D Component Inspection Callout (Camera-correlated DOM HUD) ── */}
        {inspectedPart && (
          <MooringPartCallout
            partId={inspectedPart.id}
            position={inspectedPart.worldPos}
            env={env}
            config={config}
            buoyState={buoyState}
            onSelectMaterial={onSelectMaterial}
            onClose={() => setInspectedPart(null)}
          />
        )}
      </group>
    </Suspense>

      {/* ── Surface-to-Seabed Camera Transition Manager ── */}
      <WatchCircleCameraManager
        preset={cameraPreset}
        onPresetHandled={onCameraPresetHandled}
        currentDepth={currentDepth}
        orbitRef={orbitRef}
      />

      {/* ── OrbitControls for 360° Orbit, Pan, and Zoom at Any Depth ── */}
      <OrbitControls
        ref={orbitRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2.5}
        maxDistance={350.0}
        maxPolarAngle={Math.PI / 2 + 0.4}
        dampingFactor={0.06}
        enableDamping
      />
    </Canvas>
  );
}
