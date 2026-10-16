import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CelestialMoonProps {
  sunPosition?: [number, number, number];
  radius?: number;
}

/**
 * CelestialMoon:
 * Photorealistic 3D Moon in space with NASA LRO color & crater topography maps.
 * Positioned opposite to the Sun with an 18° orbital inclination so it remains visible
 * and casts soft cool-silver moonlight onto the night side of Earth at 00:00:00 IST.
 */
export function CelestialMoon({
  sunPosition = [12, 5, 8],
  radius = 0.58,
}: CelestialMoonProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const haloRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.DirectionalLight>(null!);
  const { gl } = useThree();
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

  // Load NASA Lunar Reconnaissance Orbiter textures with 16x Anisotropic Filtering
  const { moonMap, moonBump, moonNormal } = useMemo(() => {
    const map = textureLoader.load('/textures/moon_map.jpg');
    const bump = textureLoader.load('/textures/moon_bump.jpg');
    const normal = textureLoader.load('/textures/moon_normal.jpg');

    map.colorSpace = THREE.SRGBColorSpace;
    const maxAniso = gl.capabilities.getMaxAnisotropy() || 16;

    [map, bump, normal].forEach((t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = maxAniso;
    });

    return { moonMap: map, moonBump: bump, moonNormal: normal };
  }, [textureLoader, gl]);

  // Compute Moon's position in space opposite to the Sun with 18° orbital inclination
  useFrame(() => {
    if (!meshRef.current) return;
    const sunDir = new THREE.Vector3(...sunPosition).normalize();
    const oppSun = sunDir.clone().negate();

    // Perpendicular inclination axis
    const upAxis = Math.abs(oppSun.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const inclinationAxis = new THREE.Vector3().crossVectors(oppSun, upAxis).normalize();

    // 18-degree (~0.314 rad) lunar orbital inclination offset so Moon is never trapped in umbra
    const moonDistance = 24.0;
    const moonDir = oppSun.clone().applyAxisAngle(inclinationAxis, 0.314).normalize();
    const moonPos = moonDir.clone().multiplyScalar(moonDistance);

    meshRef.current.position.copy(moonPos);
    // Keep Moon tidally locked / facing Earth at (0, 0, 0)
    meshRef.current.lookAt(0, 0, 0);

    if (haloRef.current) {
      haloRef.current.position.copy(moonPos);
    }
    if (lightRef.current) {
      lightRef.current.position.copy(moonPos);
    }
  });

  return (
    <group name="CelestialMoonGroup">
      {/* 1. 3D Lunar Mesh with 64x64 SphereGeometry, NASA textures & crater relief */}
      <mesh
        ref={meshRef}
        frustumCulled={false}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={moonMap}
          bumpMap={moonBump}
          bumpScale={0.025}
          normalMap={moonNormal}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          roughness={0.92}
          metalness={0.0}
        />
      </mesh>

      {/* 2. Subtle cool-silver lunar aura / glow in space */}
      <mesh ref={haloRef} frustumCulled={false}>
        <sphereGeometry args={[radius * 1.04, 32, 32]} />
        <meshBasicMaterial
          color="#c8d6e5"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Subtle cool-silver moonlight illuminating the night side of Earth */}
      <directionalLight
        ref={lightRef}
        color="#88a4c8"
        intensity={0.22}
        castShadow={false}
      />
    </group>
  );
}
