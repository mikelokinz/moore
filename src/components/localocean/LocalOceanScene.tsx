import { Suspense, useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WaveSurface } from './WaveSurface';
import { ArgoBuoyMarker } from './ArgoBuoyMarker';
import { UnderwaterEnvironment } from './UnderwaterEnvironment';
import { MarineEcosystemManager } from './MarineEcosystem/MarineEcosystemManager';
import { LocalOceanCamera } from './LocalOceanCamera';
import { LocalOceanHUD } from './LocalOceanHUD';
import { OceanSkyDome } from '../watchcircle/OceanSkyDome';
import { computeWaveParams } from '../../utils/waveMath';

import type { Station, OceanParameter, DepthLevel, OceanLayer } from '../../types/ocean';


// ── Dynamic Lighting ────────────────────────────────────────────────────────
export function DynamicLighting({ maxDepthY = 100 }: { maxDepthY?: number }) {
  const { camera } = useThree();
  const ambientRef = useRef<THREE.AmbientLight>(null!);
  const dirRef = useRef<THREE.DirectionalLight>(null!);
  const subseaBounceRef = useRef<THREE.DirectionalLight>(null!);
  const camLightRef = useRef<THREE.PointLight>(null!);

  useFrame(() => {
    const camDepth = Math.max(0, -camera.position.y);
    const depthT = Math.min(1, camDepth / maxDepthY);

    if (ambientRef.current) {
      // Keep ambient light bright and crisp (0.80 -> 1.05) with vivid oceanic azure tint
      ambientRef.current.intensity = THREE.MathUtils.lerp(0.80, 1.05, depthT);
      const color = new THREE.Color('#93c5fd').lerp(new THREE.Color('#38bdf8'), depthT);
      ambientRef.current.color = color;
    }

    if (dirRef.current) {
      // Directional overhead sun penetrates deep into the water column with high clarity
      dirRef.current.intensity = THREE.MathUtils.lerp(2.8, 2.2, depthT);
    }

    if (subseaBounceRef.current) {
      // Subsea upward bounce light illuminates undersides of mooring line components
      subseaBounceRef.current.intensity = THREE.MathUtils.lerp(0.8, 1.5, depthT);
    }

    if (camLightRef.current) {
      // High-power submersible inspection floodlight follows the camera with wide throw
      camLightRef.current.position.copy(camera.position);
      camLightRef.current.intensity = THREE.MathUtils.lerp(1.0, 2.8, depthT);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.80} color="#93c5fd" />
      <directionalLight ref={dirRef} position={[80, 60, -50]} intensity={2.8} color="#f8fafc" castShadow />
      <directionalLight ref={subseaBounceRef} position={[-60, -50, 60]} intensity={1.2} color="#0284c7" />
      <hemisphereLight args={['#bae6fd', '#0369a1', 0.9]} />
      <pointLight ref={camLightRef} color="#ffffff" distance={150} decay={1} intensity={1.5} />
    </>
  );
}

interface LocalOceanSceneProps {
  station: Station;
  parameter?: OceanParameter;
  layer?: OceanLayer;
  onExit?: () => void;
  // Hand tracking refs (reused from existing hook)
  handDelta?: React.MutableRefObject<{ dx: number; dy: number }>;
  handDeltaRef?: React.MutableRefObject<{ dx: number; dy: number }>;
  handZoom?: React.MutableRefObject<number>;
  handZoomRef?: React.MutableRefObject<number>;
  numHands?: number;
  isHandEnabled?: boolean;
}

export function LocalOcean3D({
  station,
  depth,
  layer,
  parameter,
  handDelta,
  handDeltaRef,
  handZoom,
  handZoomRef,
  numHands = 0,
  isHandEnabled = false,
}: LocalOceanSceneProps & { depth: DepthLevel }) {
  const activeHandDelta = handDeltaRef || handDelta;
  const activeHandZoom = handZoomRef || handZoom;
  const isDifference = layer === 'difference';

  const waveParams = useMemo(() => {
    return computeWaveParams(
      station.waveHeight || 1.5,
      station.modelWaveHeight || 1.5,
      station.currentSpeed || 0.4,
      station.temperature || 28.0
    );
  }, [station.waveHeight, station.modelWaveHeight, station.currentSpeed, station.temperature]);

  return (
    <group>
      {/* Lighting is now fully dynamic based on camera Y */}
      <DynamicLighting maxDepthY={20} />

      {/* Deep Ocean Twilight Sky Dome (Always active with Rayleigh atmospheric gradient) */}
      <OceanSkyDome sunDirection={[100, 32, -80]} />

      <Suspense fallback={null}>
        {/* Wave Surface */}
        <WaveSurface
          waveHeight={station.waveHeight}
          modelWaveHeight={station.modelWaveHeight}
          currentSpeed={station.currentSpeed}
          temperature={station.temperature}
          depth={depth}
          isDifference={isDifference}
        />

        {/* 3D OMNI Mooring Buoy & Physics Catenary Line */}
        <ArgoBuoyMarker station={station} isDifference={isDifference} waveParams={waveParams} />

        {/* Underwater Environment */}
        <UnderwaterEnvironment depth={depth} visible={true} maxDepthY={20} />

        {/* Dynamic Depth-Based Marine Ecosystem */}
        <MarineEcosystemManager depth={depth} />
      </Suspense>

      {/* Camera Controller */}
      <LocalOceanCamera
        depth={depth}
        handDeltaRef={activeHandDelta}
        handZoomRef={activeHandZoom}
        numHands={numHands}
        isHandEnabled={isHandEnabled}
      />
    </group>
  );
}

export function LocalOceanUI({
  station,
  parameter,
  onExit,
  depth,
  onDepthChange,
}: {
  station: Station;
  parameter: OceanParameter;
  onExit: () => void;
  depth: DepthLevel;
  onDepthChange: (d: DepthLevel) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
        backgroundColor: 'transparent',
      }}
    >
      {/* Cinematic Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at center, transparent 40%, rgba(1, 4, 9, 0.6) 100%)',
          zIndex: 1,
        }}
      />

      {/* HUD Overlay */}
      <div style={{ pointerEvents: 'auto' }}>
        <LocalOceanHUD
          station={station}
          depth={depth}
          onDepthChange={onDepthChange}
          onExit={onExit}
        />
      </div>
    </div>
  );
}
