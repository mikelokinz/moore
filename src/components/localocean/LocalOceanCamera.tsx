import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { DepthLevel } from '../../types/ocean';

interface LocalOceanCameraProps {
  depth: DepthLevel;
  handDeltaRef?: React.MutableRefObject<{ dx: number; dy: number }>;
  handZoomRef?: React.MutableRefObject<number>;
  numHands?: number;
  isHandEnabled?: boolean;
}

// ── Target camera positions and lookAt targets for each depth level aligned with physical mooring line ──
const DEPTH_CAMERA_TARGETS: Record<
  DepthLevel,
  { eye: [number, number, number]; target: [number, number, number] }
> = {
  0: {
    eye: [6, 3.5, 12],
    target: [0, 0.5, 0], // Surface view: OMNI buoy, mast, and rolling waves
  },
  10: {
    eye: [3.5, -1.0, 6],
    target: [0, -1.2, 0], // Photic shallows (10m): Keel counterweight & subsea bridle
  },
  50: {
    eye: [4.5, -3.2, 7],
    target: [0, -3.2, 0], // Thermocline transition (50m): ADCP current meter & upper cable
  },
  100: {
    eye: [5.5, -6.5, 8],
    target: [0, -6.6, 0], // Mesopelagic twilight (100m): Inductive CTD, S-loop & trawl float
  },
  500: {
    eye: [6.5, -11.5, 9],
    target: [0, -11.5, 0], // Bathypelagic midnight (500m): Compliant polypropylene catenary tether
  },
  1000: {
    eye: [5.5, -16.5, 7],
    target: [0, -17.2, 0], // Abyssal seafloor (1000m): Acoustic release, glass floats & seabed anchor
  },
};

export function LocalOceanCamera({
  depth,
  handDeltaRef,
  handZoomRef,
  numHands = 0,
  isHandEnabled = false,
}: LocalOceanCameraProps) {
  const orbitRef = useRef<OrbitControlsImpl>(null!);
  const targetEye = useRef(new THREE.Vector3(6, 3.5, 12));
  const targetLook = useRef(new THREE.Vector3(0, 0.5, 0));
  const isTransitioning = useRef(true);

  // Smooth depth translation when user selects a depth tab
  useEffect(() => {
    const config = DEPTH_CAMERA_TARGETS[depth] || DEPTH_CAMERA_TARGETS[0];
    targetEye.current.set(...config.eye);
    targetLook.current.set(...config.target);
    isTransitioning.current = true;
  }, [depth]);

  useFrame(() => {
    // Smooth cinematic glide to target depth zone
    if (isTransitioning.current && orbitRef.current) {
      const controls = orbitRef.current;
      const camera = controls.object as THREE.PerspectiveCamera;

      camera.position.lerp(targetEye.current, 0.065);
      controls.target.lerp(targetLook.current, 0.065);
      controls.update();

      if (
        camera.position.distanceTo(targetEye.current) < 0.08 &&
        controls.target.distanceTo(targetLook.current) < 0.08
      ) {
        isTransitioning.current = false;
      }
    }

    // Optional hand gesture navigation if enabled
    if (isHandEnabled && numHands === 2 && handDeltaRef?.current && orbitRef.current) {
      const delta = handDeltaRef.current;
      if (delta.dx !== 0 || delta.dy !== 0) {
        orbitRef.current.setAzimuthalAngle(orbitRef.current.getAzimuthalAngle() - delta.dx * 0.12);
        orbitRef.current.setPolarAngle(
          Math.max(0.05, Math.min(Math.PI - 0.05, orbitRef.current.getPolarAngle() - delta.dy * 0.12))
        );
        orbitRef.current.update();
        handDeltaRef.current = { dx: 0, dy: 0 };
      }

      if (handZoomRef?.current && handZoomRef.current !== 1.0) {
        const factor = handZoomRef.current;
        const cam = orbitRef.current.object as THREE.PerspectiveCamera;
        cam.position.sub(orbitRef.current.target).multiplyScalar(1 / factor).add(orbitRef.current.target);
        orbitRef.current.update();
        handZoomRef.current = 1.0;
      }
    }
  });

  return (
    <OrbitControls
      ref={orbitRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={1.8}
      maxDistance={350.0}
      dampingFactor={0.06}
      enableDamping={true}
      onStart={() => {
        // If user initiates manual interaction, immediately yield to user control
        isTransitioning.current = false;
      }}
    />
  );
}
