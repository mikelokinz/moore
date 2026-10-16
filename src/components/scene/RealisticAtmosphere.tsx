import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

interface RealisticAtmosphereProps {
  sunPosition?: [number, number, number];
}

// ── LAYER 1: Surface Fresnel Atmospheric Glow (Crisp inner limb on globe surface) ──
const innerAtmosphereVertexShader = `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const innerAtmosphereFragmentShader = `
  uniform vec3 sunDirection;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    vec3 L = normalize(sunDirection);

    // Tight grazing Fresnel along the planetary horizon
    float dotNV = max(dot(N, V), 0.0);
    float fresnel = pow(1.0 - dotNV, 4.0);

    // Solar illumination modulation across planetary terminator
    float dotNL = dot(N, L);
    float sunScattering = smoothstep(-0.10, 0.30, dotNL);

    // Vibrant cyan-blue in daylight, luminous electric navy-blue at night
    vec3 dayAtmo = vec3(0.14, 0.66, 1.0) * (1.0 + sunScattering * 0.45);
    vec3 nightAtmo = vec3(0.045, 0.18, 0.45);

    // Forward scatter sunrise/sunset golden-cyan edge
    float forwardScatter = pow(max(dot(V, -L), 0.0), 7.0) * fresnel * sunScattering;
    vec3 sunriseGlow = vec3(0.9, 0.98, 1.0) * forwardScatter * 1.1;

    vec3 atmoColor = mix(nightAtmo, dayAtmo, sunScattering) + sunriseGlow;
    float alpha = fresnel * (sunScattering * 0.65) + forwardScatter * 0.35;
    alpha = clamp(alpha, 0.0, 0.85);

    gl_FragColor = vec4(atmoColor, alpha);
  }
`;

// ── LAYER 2: Outer Atmosphere Mesh (scale: 1.025, THREE.BackSide, Additive Blending) ──
const outerAtmosphereVertexShader = `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const outerAtmosphereFragmentShader = `
  uniform vec3 sunDirection;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    vec3 L = normalize(sunDirection);

    // Back-side viewing: dot(N, V) peaks near the outer rim of the sphere
    float rim = max(dot(N, V), 0.0);
    float outerGlow = pow(rim, 3.0);

    // Day vs Night hemisphere modulation
    float dotNL = dot(N, L);
    float sunScattering = smoothstep(-0.18, 0.32, dotNL);

    // Glowing vibrant cyan-blue in daylight and deep electric-blue at night (Target: image_14.png & image_15.png)
    vec3 dayGlow = vec3(0.12, 0.65, 1.0) * 1.5;
    vec3 nightGlow = vec3(0.045, 0.22, 0.65) * 1.35;

    vec3 atmoColor = mix(nightGlow, dayGlow, sunScattering);

    // Forward solar backlight rim burst
    float sunBacklight = pow(max(dot(V, -L), 0.0), 5.0) * sunScattering;
    atmoColor += vec3(0.25, 0.80, 1.0) * sunBacklight * 0.65;

    float alpha = outerGlow * (sunScattering * 0.45 + 0.32) + sunBacklight * 0.25;
    alpha = clamp(alpha, 0.0, 0.85);

    gl_FragColor = vec4(atmoColor, alpha);
  }
`;

export function RealisticAtmosphere({ sunPosition = [12, 5, 8] }: RealisticAtmosphereProps) {
  const sunDir = useMemo(() => new THREE.Vector3(...sunPosition).normalize(), [sunPosition]);

  const innerUniforms = useMemo(
    () => ({
      sunDirection: { value: sunDir.clone() },
    }),
    [sunDir]
  );

  const outerUniforms = useMemo(
    () => ({
      sunDirection: { value: sunDir.clone() },
    }),
    [sunDir]
  );

  useEffect(() => {
    const dir = new THREE.Vector3(...sunPosition).normalize();
    innerUniforms.sunDirection.value.copy(dir);
    outerUniforms.sunDirection.value.copy(dir);
  }, [sunPosition, innerUniforms, outerUniforms]);

  return (
    <group name="DualLayerAtmosphere">
      {/* Layer 1: Crisp surface Fresnel atmospheric glow */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[2.012, 96, 96]} />
        <shaderMaterial
          vertexShader={innerAtmosphereVertexShader}
          fragmentShader={innerAtmosphereFragmentShader}
          uniforms={innerUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Layer 2: Slightly larger outer atmosphere mesh (scale 1.025, BackSide, Additive Blending) */}
      <mesh scale={[1.025, 1.025, 1.025]} raycast={() => null}>
        <sphereGeometry args={[2.0, 96, 96]} />
        <shaderMaterial
          vertexShader={outerAtmosphereVertexShader}
          fragmentShader={outerAtmosphereFragmentShader}
          uniforms={outerUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
