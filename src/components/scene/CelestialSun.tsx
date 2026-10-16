import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CelestialSunProps {
  /** 3D celestial coordinates of the Sun [x, y, z] in Three.js world space */
  position: [number, number, number];
  /** Directional sunlight intensity (default 2.4) */
  intensity?: number;
}

// ── 1. INNER CORONA & INCANDESCENT SOLAR CORE SHADER ──
const coronaVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const coronaFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vec2 p = (vUv - vec2(0.5)) * 2.0;
    float r = length(p);
    if (r > 1.0) discard;

    // Optical Gaussian-exponential white core (no hard circular edge)
    float coreGlow = exp(-r * 5.5) * 3.6;
    
    // Smooth golden-amber inner corona falloff
    float corona = pow(clamp(1.0 - r, 0.0, 1.0), 2.8);
    float outerHalo = pow(clamp(1.0 - r, 0.0, 1.0), 5.0);
    
    // Gentle natural solar pulsation
    float pulse = sin(uTime * 1.4) * 0.035 + 1.0;

    // Rich golden color gradient (Pic 2: White hot center -> Radiant Gold -> Warm Amber)
    vec3 whiteCore = vec3(1.0, 1.0, 1.0) * 3.5;
    vec3 brightGold = vec3(1.0, 0.88, 0.40) * 2.2;
    vec3 deepGold = vec3(1.0, 0.65, 0.14) * 1.6;
    vec3 amberHalo = vec3(0.85, 0.42, 0.06);

    vec3 col = mix(amberHalo, deepGold, outerHalo);
    col = mix(col, brightGold, corona);
    col += whiteCore * coreGlow;

    float alpha = (coreGlow * 0.95 + corona * 0.85 + outerHalo * 0.40) * pulse;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

// ── 2. DENSE MULTI-FREQUENCY GOD RAYS & DIAMOND STARBURST SHADER (Pic 2 Reference) ──
const godRaysFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;

  // Pseudo-random hash for organic crepuscular beam variation
  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  void main() {
    vec2 p = (vUv - vec2(0.5)) * 2.0;
    float r = length(p);
    if (r > 1.0) discard;

    float angle = atan(p.y, p.x);

    // ── PRIMARY DIAMOND STARBURST CROSS (Tilted ~32 degrees, from Pic 2) ──
    float tilt = 0.56; // ~32 degrees tilt matching Pic 2
    float spikeA = pow(abs(cos((angle - tilt) * 2.0)), 22.0);
    float spikeB = pow(abs(cos((angle - tilt + 1.5708) * 2.0)), 22.0);
    float starburst = max(spikeA, spikeB) * pow(clamp(1.0 - r * 0.65, 0.0, 1.0), 1.6) * 1.85;

    // ── DENSE MULTI-FREQUENCY 360° CREPUSCULAR GOD RAYS (Pic 2 sunbeams) ──
    float f1 = cos(angle * 12.0 + uTime * 0.03);
    float f2 = cos(angle * 26.0 - uTime * 0.02 + 0.85);
    float f3 = cos(angle * 44.0 + uTime * 0.015 + 2.1);
    float f4 = cos(angle * 64.0 - uTime * 0.025 + 3.7);
    float f5 = cos(angle * 88.0 + uTime * 0.035 + 5.2);

    // Modulate rays with pseudo-random organic beam distribution around 360 deg
    float beamAngleIndex = floor((angle + 3.14159) / 0.12);
    float beamVariance = hash(beamAngleIndex) * 0.35 + 0.82;

    float combinedRays = (f1 * 0.30 + f2 * 0.28 + f3 * 0.22 + f4 * 0.14 + f5 * 0.06);
    float godRays = pow(clamp(combinedRays * 0.5 + 0.5, 0.0, 1.0), 2.2) * beamVariance * 1.65;

    // Radial falloff: God rays expand smoothly across deep space
    float rayFalloff = pow(clamp(1.0 - r, 0.0, 1.0), 1.35);
    float rayIntensity = godRays * rayFalloff;

    // Broad ambient solar radiance filling the sky
    float broadRadiance = pow(clamp(1.0 - r, 0.0, 1.0), 2.8) * 0.75;

    // Composite total beam radiance
    float totalBeam = starburst * 0.78 + rayIntensity * 0.95 + broadRadiance * 0.45;

    // Color gradient matching Pic 2: White-gold at center -> brilliant gold -> deep warm amber at tips
    vec3 rootColor = vec3(1.0, 0.96, 0.82) * 2.4;
    vec3 midColor = vec3(1.0, 0.75, 0.22) * 1.8;
    vec3 tipColor = vec3(0.92, 0.48, 0.08) * 1.1;

    vec3 beamColor = mix(tipColor, midColor, pow(clamp(1.0 - r * 0.85, 0.0, 1.0), 1.7));
    beamColor = mix(beamColor, rootColor, pow(clamp(1.0 - r * 2.2, 0.0, 1.0), 2.0));

    gl_FragColor = vec4(beamColor * totalBeam, clamp(totalBeam * 0.85, 0.0, 1.0));
  }
`;

// ── 3. ANAMORPHIC LENS FLARE GHOST ORBS & FLOATING DUST MOTES (Pic 2 Reference) ──
const lensFlareFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 p = (vUv - vec2(0.5)) * 2.0;
    
    // Lens flare optical axis along lower-left diagonal (~32 degrees, matching Pic 2)
    vec2 flareDir = normalize(vec2(-0.85, -0.62));

    // Ghost Orb 1 (Warm circular reflection at dist 0.42, matching Pic 2 lower-left)
    vec2 ghostPos1 = p - flareDir * 0.42;
    float d1 = length(ghostPos1);
    float ghostOrb1 = smoothstep(0.18, 0.10, d1) * 0.32;
    float ghostRing1 = smoothstep(0.20, 0.18, d1) * smoothstep(0.15, 0.18, d1) * 0.45;

    // Ghost Orb 2 (Secondary delicate circle at dist 0.70)
    vec2 ghostPos2 = p - flareDir * 0.70;
    float d2 = length(ghostPos2);
    float ghostOrb2 = smoothstep(0.24, 0.16, d2) * 0.22;
    float ghostRing2 = smoothstep(0.25, 0.23, d2) * smoothstep(0.21, 0.23, d2) * 0.35;

    // Ghost Orb 3 (Sharp highlight near root at dist 0.22)
    vec2 ghostPos3 = p - flareDir * 0.22;
    float d3 = length(ghostPos3);
    float ghostOrb3 = smoothstep(0.08, 0.02, d3) * 0.40;

    // Tiny sparkling motes caught in the sunlight beams (Pic 2 reference)
    vec2 gridUv = p * 16.0;
    vec2 gridId = floor(gridUv);
    vec2 gridSub = fract(gridUv) - 0.5;
    float rnd = hash21(gridId);
    float mote = 0.0;
    if (rnd > 0.86) {
      vec2 moteOffset = vec2(hash21(gridId + 1.3), hash21(gridId + 2.7)) - 0.5;
      float distToMote = length(gridSub - moteOffset * 0.6);
      float moteTwinkle = sin(uTime * 2.2 + rnd * 6.28) * 0.35 + 0.65;
      float inBeam = pow(clamp(1.0 - length(p) * 0.7, 0.0, 1.0), 1.5);
      mote = smoothstep(0.12, 0.01, distToMote) * rnd * moteTwinkle * inBeam * 0.60;
    }

    // Warm golden ghost colors with soft chromatic shift
    vec3 ghostCol1 = vec3(1.0, 0.76, 0.36) * (ghostOrb1 + ghostRing1);
    vec3 ghostCol2 = vec3(0.96, 0.64, 0.42) * (ghostOrb2 + ghostRing2);
    vec3 ghostCol3 = vec3(1.0, 0.92, 0.62) * ghostOrb3;
    vec3 moteCol = vec3(1.0, 0.94, 0.72) * mote;

    vec3 totalGhost = ghostCol1 + ghostCol2 + ghostCol3 + moteCol;
    float totalAlpha = clamp(ghostOrb1 + ghostRing1 + ghostOrb2 + ghostRing2 + ghostOrb3 + mote, 0.0, 1.0);

    if (totalAlpha < 0.005) discard;

    gl_FragColor = vec4(totalGhost, totalAlpha);
  }
`;

/**
 * CelestialSun:
 * Photorealistic 3D Sun engineered from the user's reference photograph (Pic 2).
 * Features:
 *  1. Blinding incandescent white-hot core disc.
 *  2. Brilliant golden corona and expansive warm halo.
 *  3. Dense multi-frequency 360° crepuscular radial god rays and diamond starburst spikes.
 *  4. Anamorphic lens flare ghost orbs and sparkling floating motes.
 *  5. Directional sunlight illuminating Earth, clouds, atmosphere, buoys, and ocean.
 */
export function CelestialSun({ position, intensity = 2.4 }: CelestialSunProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const coronaMatRef = useRef<THREE.ShaderMaterial>(null!);
  const godRaysMatRef = useRef<THREE.ShaderMaterial>(null!);
  const lensFlareMatRef = useRef<THREE.ShaderMaterial>(null!);

  const coronaUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
    }),
    []
  );

  const godRaysUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
    }),
    []
  );

  const lensFlareUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
    }),
    []
  );

  // Keep billboard planes facing the active camera and ensure Sun is ALWAYS active in deep space
  useFrame(({ camera, clock }) => {
    if (groupRef.current) {
      // Keep Sun always active and positioned along sunPosition vector
      groupRef.current.visible = true;
      groupRef.current.position.set(position[0], position[1], position[2]);
      groupRef.current.quaternion.copy(camera.quaternion);

      // Smoothly modulate lens flare ghost reflections so they only appear when camera faces unoccluded Sun
      if (lensFlareMatRef.current) {
        const sunPos = new THREE.Vector3(position[0], position[1], position[2]);
        const toSun = sunPos.clone().sub(camera.position);
        const cameraForward = new THREE.Vector3();
        camera.getWorldDirection(cameraForward);
        const inFront = toSun.dot(cameraForward) > 0.05;

        const distToSun = toSun.length();
        const sunDir = toSun.clone().normalize();
        const t = -camera.position.dot(sunDir);
        const occludedByEarth = t > 0 && t < distToSun && camera.position.clone().add(sunDir.clone().multiplyScalar(t)).length() < 2.05;

        lensFlareMatRef.current.opacity = (inFront && !occludedByEarth) ? 1.0 : 0.0;
      }
    }

    const t = clock.getElapsedTime();
    if (coronaMatRef.current) {
      coronaMatRef.current.uniforms.uTime.value = t;
    }
    if (godRaysMatRef.current) {
      godRaysMatRef.current.uniforms.uTime.value = t;
    }
    if (lensFlareMatRef.current) {
      lensFlareMatRef.current.uniforms.uTime.value = t;
    }
  });

  return (
    <>
      {/* Primary Directional Sunlight targeting Earth at (0, 0, 0) */}
      <directionalLight
        position={position}
        intensity={intensity}
        color="#fffbf0"
        castShadow={false}
      />

      {/* Photorealistic Radiant Sun in Celestial Space (Always active, never frustum culled) */}
      <group ref={groupRef} position={position} visible={true}>
        {/* 1. Incandescent White-Gold Solar Core Sphere */}
        <mesh frustumCulled={false} position={[0, 0, 0]}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshBasicMaterial
            color="#fffef2"
            depthWrite={true}
            depthTest={true}
          />
        </mesh>

        {/* 2. Soft Volumetric Golden Corona Glow Billboard */}
        <mesh frustumCulled={false} position={[0, 0, 0.01]}>
          <planeGeometry args={[9.5, 9.5]} />
          <shaderMaterial
            ref={coronaMatRef}
            vertexShader={coronaVertexShader}
            fragmentShader={coronaFragmentShader}
            uniforms={coronaUniforms}
            transparent
            depthWrite={false}
            depthTest={true}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 3. Dense 360° Crepuscular God Rays & Diamond Starburst Spikes */}
        <mesh frustumCulled={false} position={[0, 0, 0.02]}>
          <planeGeometry args={[22.0, 22.0]} />
          <shaderMaterial
            ref={godRaysMatRef}
            vertexShader={coronaVertexShader}
            fragmentShader={godRaysFragmentShader}
            uniforms={godRaysUniforms}
            transparent
            depthWrite={false}
            depthTest={true}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 4. Anamorphic Lens Flare Ghost Orbs (Screen space reflections) */}
        <mesh frustumCulled={false} position={[0, 0, 0.03]}>
          <planeGeometry args={[16.0, 16.0]} />
          <shaderMaterial
            ref={lensFlareMatRef}
            vertexShader={coronaVertexShader}
            fragmentShader={lensFlareFragmentShader}
            uniforms={lensFlareUniforms}
            transparent
            depthWrite={false}
            depthTest={true}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </>
  );
}
