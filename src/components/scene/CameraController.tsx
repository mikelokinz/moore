import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { CameraStage } from '../../types/ocean';
import { easeInOutCubic, latLonToXYZ } from '../../utils/oceanCalc';
import { CinematicCameraControllerLogic } from '../../camera/CinematicCameraController';
import type { CinematicTransitionConfig } from '../../camera/cameraTransitions';

// Camera position presets focused on India, Bay of Bengal, and Indian Ocean
// Exact camera coordinate centered on India (20°N, 78°E) at comfortable orbital distance 4.8
const INDIA_POS = new THREE.Vector3(0.94, 1.64, -4.41);

const CAMERA_PRESETS: Record<CameraStage, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  intro:       { pos: INDIA_POS.clone(), target: new THREE.Vector3(0, 0, 0) },
  space:       { pos: INDIA_POS.clone(), target: new THREE.Vector3(0, 0, 0) },
  earth:       { pos: INDIA_POS.clone(), target: new THREE.Vector3(0, 0, 0) },
  indianOcean: { pos: INDIA_POS.clone(), target: new THREE.Vector3(0, 0, 0) },
  bayOfBengal: { pos: INDIA_POS.clone(), target: new THREE.Vector3(0, 0, 0) },
  exploration: { pos: INDIA_POS.clone(), target: new THREE.Vector3(0, 0, 0) },
};


interface CameraControllerProps {
  stage: CameraStage;
  onStageComplete?: (stage: CameraStage) => void;
  targetStation?: { latitude: number; longitude: number } | null;
  isExploring: boolean;
  handDelta?: React.MutableRefObject<{ dx: number; dy: number }>;
  handZoom?: React.MutableRefObject<number>;
  isFist?: React.MutableRefObject<boolean>;
  cinematicController?: CinematicCameraControllerLogic | null;
  currentTargetRef?: React.MutableRefObject<THREE.Vector3>;
  orbitControlsRef?: React.RefObject<any>; // using any to avoid importing OrbitControlsImpl type if not needed
}

export function CameraController({
  stage,
  onStageComplete,
  targetStation,
  isExploring,
  handDelta,
  handZoom,
  isFist,
  cinematicController,
  currentTargetRef: externalTargetRef,
  orbitControlsRef,
}: CameraControllerProps) {
  const { camera } = useThree();
  const progress = useRef(1); // Set to 1 initially to prevent any unwanted idle zoom/lerp
  const lastStage = useRef<CameraStage>(stage);
  const fromPos = useRef(INDIA_POS.clone());
  const fromTarget = useRef(new THREE.Vector3(0, 0, 0));
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const orbitTarget = useRef(new THREE.Vector3(0, 0, 0));

  // Sync external target ref if provided
  useEffect(() => {
    if (externalTargetRef) {
      externalTargetRef.current = currentTarget.current;
    }
  }, [externalTargetRef]);

  // Capture transition start on stage change
  useEffect(() => {
    if (stage !== lastStage.current) {
      fromPos.current.copy(camera.position);
      fromTarget.current.copy(orbitTarget.current);
      progress.current = 0;
      lastStage.current = stage;
    }
  }, [stage, camera]);

  // Capture transition on station target (both selection and return to global)
  const lastTargetStation = useRef(targetStation);
  useEffect(() => {
    if (isExploring && targetStation !== lastTargetStation.current) {
      fromPos.current.copy(camera.position);
      fromTarget.current.copy(orbitTarget.current);
      progress.current = 0;
      lastTargetStation.current = targetStation;
    }
  }, [targetStation, isExploring, camera]);

  const getDesiredPos = useCallback((): THREE.Vector3 => {
    if (targetStation && isExploring) {
      const [x, y, z] = latLonToXYZ(
        targetStation.latitude,
        targetStation.longitude,
        4.4
      );
      return new THREE.Vector3(x, y, z);
    }
    return CAMERA_PRESETS[stage].pos;
  }, [stage, targetStation, isExploring]);

  const getDesiredTarget = useCallback((): THREE.Vector3 => {
    if (targetStation && isExploring) {
      const [x, y, z] = latLonToXYZ(
        targetStation.latitude,
        targetStation.longitude,
        1.2
      );
      return new THREE.Vector3(x, y, z);
    }
    return CAMERA_PRESETS[stage].target;
  }, [stage, targetStation, isExploring]);

  // Snappy start rotation state (~0.9s brisk orbital spin into India view)
  const isSnappyRotating = useRef(true);
  const snappyProgress = useRef(0);

  useFrame((_, delta) => {
    // 0. Snappy Start Rotation: Pure constant-radius horizontal rotation into India
    if (isSnappyRotating.current) {
      snappyProgress.current = Math.min(1.0, snappyProgress.current + delta * 1.15);
      // Snappy cubic ease-out curve (brisk start, smooth cushioned landing)
      const t = 1 - Math.pow(1 - snappyProgress.current, 3);

      const targetSph = new THREE.Spherical().setFromVector3(INDIA_POS);
      // Exact constant radius (4.8) and elevation (phi) — pure rotation around the globe
      const startTheta = targetSph.theta - 1.20;

      const curTheta = THREE.MathUtils.lerp(startTheta, targetSph.theta, t);
      const curSph = new THREE.Spherical(targetSph.radius, targetSph.phi, curTheta);

      camera.position.setFromSpherical(curSph);
      camera.lookAt(0, 0, 0);
      currentTarget.current.set(0, 0, 0);
      orbitTarget.current.set(0, 0, 0);

      if (orbitControlsRef?.current) {
        orbitControlsRef.current.target.set(0, 0, 0);
        orbitControlsRef.current.update();
      }

      if (externalTargetRef) {
        externalTargetRef.current.set(0, 0, 0);
      }

      if (snappyProgress.current >= 1.0) {
        isSnappyRotating.current = false;
        camera.position.copy(INDIA_POS);
        camera.lookAt(0, 0, 0);
        fromPos.current.copy(INDIA_POS);
        fromTarget.current.set(0, 0, 0);
        progress.current = 1; // Locked at 1 so no idle transitions ever trigger!
        onStageComplete?.('exploration');
      }
      return;
    }

    // If cinematic transition is active, let it drive the camera
    if (cinematicController?.isActive) {
      cinematicController.update(camera, currentTarget.current, performance.now());
      camera.lookAt(currentTarget.current);
      orbitTarget.current.copy(currentTarget.current);
      if (externalTargetRef) {
        externalTargetRef.current.copy(currentTarget.current);
      }
      return;
    }

    let didUpdateCamera = false;

    // 1. Stage transition lerp
    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta * 0.45);
      const t = easeInOutCubic(progress.current);
      camera.position.lerpVectors(fromPos.current, getDesiredPos(), t);
      currentTarget.current.lerpVectors(fromTarget.current, getDesiredTarget(), t);

      if (progress.current >= 1 && onStageComplete) {
        onStageComplete(stage);
      }
      didUpdateCamera = true;
    } else if (stage === 'exploration') {
      // 2. Hand Gesture control in exploration mode
      const hDelta = handDelta?.current;
      const hZoom = handZoom?.current ?? 1.0;

      if (hDelta && (hDelta.dx !== 0 || hDelta.dy !== 0 || Math.abs(hZoom - 1.0) > 0.001)) {
        // Spherical rotation around current target
        const offset = new THREE.Vector3().subVectors(camera.position, currentTarget.current);
        const spherical = new THREE.Spherical().setFromVector3(offset);

        // Apply hand rotation with smoothing
        spherical.theta -= hDelta.dx * 0.04;
        spherical.phi = THREE.MathUtils.clamp(
          spherical.phi - hDelta.dy * 0.04,
          0.1,
          Math.PI - 0.1
        );

        // Apply hand pinch zoom
        if (Math.abs(hZoom - 1.0) > 0.001) {
          spherical.radius = THREE.MathUtils.clamp(
            spherical.radius * hZoom,
            2.8,
            12.0
          );
        }

        offset.setFromSpherical(spherical);
        camera.position.copy(currentTarget.current).add(offset);
        didUpdateCamera = true;
      }
    }

    if (didUpdateCamera) {
      camera.lookAt(currentTarget.current);
      if (orbitControlsRef?.current) {
        orbitControlsRef.current.target.copy(currentTarget.current);
        orbitControlsRef.current.update();
      }
    } else {
      // If we are not forcing the camera, let OrbitControls drive!
      // We just sync our internal target to what OrbitControls is looking at
      if (orbitControlsRef?.current && stage === 'exploration') {
        currentTarget.current.copy(orbitControlsRef.current.target);
      }
    }

    orbitTarget.current.copy(currentTarget.current);
    if (externalTargetRef) {
      externalTargetRef.current.copy(currentTarget.current);
    }
  });

  return null;
}
