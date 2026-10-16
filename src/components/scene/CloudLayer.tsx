import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { DepthLevel } from '../../types/ocean';

interface CloudLayerProps {
  depth?: DepthLevel;
  sunPosition?: [number, number, number];
}

const cloudVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    // Outward surface normal in WORLD SPACE
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const cloudFragmentShader = `
  uniform sampler2D cloudTexture;
  uniform vec3 sunDirection;
  uniform float cloudOpacity;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec4 cloudTex = texture2D(cloudTexture, vUv);
    float density = cloudTex.a;

    // Normal in WORLD SPACE
    vec3 N = normalize(vWorldNormal);
    // Sun vector in WORLD SPACE
    vec3 L = normalize(sunDirection);
    // View vector in WORLD SPACE
    vec3 V = normalize(cameraPosition - vWorldPosition);

    float dotNL = dot(N, L);
    float dotNV = max(dot(N, V), 0.0);

    // Daylight modulation matching the smooth planetary terminator transition
    float sunFactor = smoothstep(-0.08, 0.28, dotNL);

    // Brilliant, sunlit daytime cloud tops
    vec3 cloudLit = vec3(1.0, 1.0, 1.0) * 1.30;

    // Forward Mie scattering silver lining when looking toward the Sun
    float forwardScatter = pow(max(dot(V, -L), 0.0), 5.0) * sunFactor;
    cloudLit += vec3(0.18, 0.16, 0.14) * forwardScatter;

    // Night side clouds (faint ethereal moonlit silver wisps that don't obscure continents)
    vec3 cloudNight = vec3(0.035, 0.045, 0.065);

    vec3 color = mix(cloudNight, cloudLit, sunFactor);

    // Continuous smooth alpha without hard discard boundaries
    float fresnel = pow(1.0 - dotNV, 3.2);
    float cloudAlpha = smoothstep(0.08, 0.85, density) * cloudOpacity * (0.85 + fresnel * 0.25);
    // Softly attenuate night clouds to preserve crisp continental visibility
    cloudAlpha *= mix(0.10, 1.0, sunFactor);

    if (cloudAlpha < 0.005) {
      discard;
    }

    gl_FragColor = vec4(color, clamp(cloudAlpha, 0.0, 0.72));
  }
`;

export function CloudLayer({
  depth = 0,
  sunPosition = [12, 5, 8],
}: CloudLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

  const sunDir = useMemo(() => new THREE.Vector3(...sunPosition).normalize(), [sunPosition]);

  const cloudTex = useMemo(() => {
    const tex = textureLoader.load('/textures/earth_clouds.png');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  }, [textureLoader]);

  const uniforms = useMemo(
    () => ({
      cloudTexture: { value: cloudTex },
      sunDirection: { value: sunDir.clone() },
      cloudOpacity: { value: 0.68 },
      uTime: { value: 0.0 },
    }),
    [cloudTex, sunDir]
  );

  useEffect(() => {
    const dir = new THREE.Vector3(...sunPosition).normalize();
    uniforms.sunDirection.value.copy(dir);
  }, [sunPosition, uniforms]);

  useFrame((state) => {
    if (!meshRef.current) return;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.sunDirection.value.set(sunPosition[0], sunPosition[1], sunPosition[2]).normalize();
  });

  return (
    <mesh ref={meshRef} raycast={() => null}>
      {/* Elevated 3D Cloud Shell at radius 2.008 */}
      <sphereGeometry args={[2.008, 96, 96]} />
      <shaderMaterial
        vertexShader={cloudVertexShader}
        fragmentShader={cloudFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
