import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { DepthLevel } from '../../types/ocean';

interface RealisticEarthProps {
  depth?: DepthLevel;
  /** 3D celestial coordinates of the Sun [x, y, z] in world space */
  sunPosition?: [number, number, number];
}

// Vertex shader: Strictly WORLD-SPACE coordinates for accurate sun alignment & lighting
const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    // Outward surface unit normal in world coordinates
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

// Fragment shader: Photorealistic Satellite Earth (GEBCO Bathymetry, Water Normals, Sun Glint, 3D Night Mode)
const earthFragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform sampler2D specularTexture;
  uniform sampler2D normalTexture;
  uniform sampler2D waterNormalTexture;
  uniform sampler2D cloudTexture;
  uniform vec3 sunDirection;
  uniform vec3 moonDirection;
  uniform float depthOpacity;
  uniform float depthLevel;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    // Pure geometric planetary unit normal in WORLD SPACE
    vec3 Ngeo = normalize(vWorldNormal);

    // Sun & View vectors in WORLD SPACE
    vec3 L = normalize(sunDirection);
    vec3 V = normalize(cameraPosition - vWorldPosition);

    // Planetary solar dot normal & day factor
    float dotNLgeo = dot(Ngeo, L);
    float dayFactor = smoothstep(-0.04, 0.22, dotNLgeo);

    // Sample high-resolution 4K textures
    vec4 dayTex = texture2D(dayTexture, vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);
    float isOcean = texture2D(specularTexture, vUv).r;
    float oceanMask = smoothstep(0.40, 0.75, isOcean);

    // Coordinate basis for normal mapping on the sphere surface
    vec3 normMap = texture2D(normalTexture, vUv).rgb * 2.0 - 1.0;
    vec3 up = abs(Ngeo.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
    vec3 T = normalize(cross(up, Ngeo));
    vec3 B = cross(Ngeo, T);

    // ── 1. HIGH-RESOLUTION OCEAN SURFACE NORMAL & MICRO-RIPPLES ──
    // Multi-octave animated ocean surface normal across the planetary sphere
    vec2 waveUv1 = vUv * vec2(320.0, 160.0) + vec2(uTime * 0.0025, uTime * 0.0014);
    vec2 waveUv2 = vUv * vec2(680.0, 340.0) - vec2(uTime * 0.0018, -uTime * 0.0020);
    vec2 waveUv3 = vUv * vec2(1360.0, 680.0) + vec2(-uTime * 0.0012, uTime * 0.0026);
    vec3 wNorm1 = texture2D(waterNormalTexture, waveUv1).rgb * 2.0 - 1.0;
    vec3 wNorm2 = texture2D(waterNormalTexture, waveUv2).rgb * 2.0 - 1.0;
    vec3 wNorm3 = texture2D(waterNormalTexture, waveUv3).rgb * 2.0 - 1.0;

    // Procedural micro-ripple perturbation in world coordinates to prevent UV repetition
    vec3 worldCoord = vWorldPosition * 30.0;
    vec2 worldWave = vec2(
      sin(worldCoord.x * 2.0 + worldCoord.z * 1.5 + uTime * 0.35) * 0.5 +
      cos(worldCoord.y * 2.8 - worldCoord.x * 1.2 + uTime * 0.28) * 0.5,
      cos(worldCoord.z * 2.2 - worldCoord.y * 1.7 + uTime * 0.32) * 0.5 +
      sin(worldCoord.x * 1.6 + worldCoord.z * 2.6 + uTime * 0.25) * 0.5
    );

    vec2 waveCombined = (wNorm1.xy * 0.45 + wNorm2.xy * 0.35 + wNorm3.xy * 0.20) + worldWave * 0.20;
    vec3 waterNormalPerturb = normalize(vec3(waveCombined, 1.0));

    // Water ripples strictly active in daylight where sun is shining
    // Completely turned OFF on the night side (dotNLgeo <= 0) so the ocean becomes a smooth, calm, dark surface
    float rippleWeight = smoothstep(0.0, 0.30, dotNLgeo);
    vec3 N_water = normalize(Ngeo + (T * waterNormalPerturb.x + B * waterNormalPerturb.y) * (0.12 * rippleWeight));

    // Land surface normal with 3D mountain relief (bumpScale: 0.035 for Himalayas & Western Ghats)
    vec3 N_land = normalize(Ngeo + (T * normMap.x + B * normMap.y) * 0.035);
    // Blended normal for diffuse & solar lighting
    vec3 N = mix(N_land, N_water, oceanMask);

    // Planetary solar dot normal
    float dotNL = dot(N, L);

    // ── 2. COASTAL SHELF BATHYMETRY & DYNAMIC DEPTH GRADIENT ──
    vec3 satOcean = dayTex.rgb;
    // Derive bathymetric elevation depth continuously from GEBCO satellite channels
    float rawBathy = clamp(satOcean.b * 1.45 + satOcean.g * 1.05, 0.0, 1.0);

    // Continuous dynamic depth transitions
    float abyssalToMid = smoothstep(0.12, 0.32, rawBathy);
    float midToShelf   = smoothstep(0.30, 0.58, rawBathy);
    float sedimentSilt = smoothstep(0.52, 0.82, rawBathy);

    // Distinct bathymetric color palette:
    // Deep abyssal Indian Ocean: rich, dark navy-slate (#040e1a)
    vec3 deepAbyssalNavy = vec3(0.0157, 0.0549, 0.1020); // #040e1a
    // Mid-depth oceanic basin: deep sapphire navy (#071830)
    vec3 midBasinNavy    = vec3(0.0275, 0.0941, 0.1882); // #071830
    // Shallow coastal shelves (Gulf of Kutch, Palk Strait, Mumbai shelf): natural, muted marine teal-turquoise (#0b4453)
    vec3 coastalTeal     = vec3(0.0431, 0.2667, 0.3255); // #0b4453
    // River sediment / silt deltas (Sundarbans / Ganges delta, Gulf of Khambhat): natural silt turquoise (#135c66)
    vec3 sedimentTurq    = vec3(0.0745, 0.3608, 0.4000); // #135c66

    // Seamless depth progression
    vec3 oceanGrad = mix(deepAbyssalNavy, midBasinNavy, abyssalToMid);
    oceanGrad = mix(oceanGrad, coastalTeal, midToShelf);
    oceanGrad = mix(oceanGrad, sedimentTurq, sedimentSilt);

    // Blend seamlessly with authentic satellite bathymetry (showing underwater ridges and banks)
    vec3 oceanAlbedo = mix(oceanGrad, satOcean * 1.15, 0.42);

    // 100% Cloud-Free Satellite Land Albedo (Himalayas snow, lush greens, Thar desert)
    vec3 landAlbedo = dayTex.rgb * 1.25;
    vec3 dayAlbedo = mix(landAlbedo, oceanAlbedo, oceanMask);

    // Direct high-intensity sunlight diffuse across sunlit hemisphere
    float diffuse = clamp(dot(N, L), 0.0, 1.0);
    float wrapDiffuse = clamp((dot(N, L) + 0.15) / 1.15, 0.0, 1.0);
    vec3 directSunColor = vec3(1.0, 0.985, 0.94) * 1.35;
    vec3 dayLitSurface = dayAlbedo * directSunColor * (diffuse * 0.82 + wrapDiffuse * 0.18);

    // ── 3. DYNAMIC WATER SPECULAR SUN GLINT (Subtle Natural Metallic Sheen) ──
    // True Blinn-Phong & reflection highlight: dot(reflect(-L, N_water), V)
    vec3 R_sun = reflect(-L, N_water);
    float RdotV = clamp(dot(R_sun, V), 0.0, 1.0);
    vec3 H_sun = normalize(L + V);
    float NdotH = clamp(dot(N_water, H_sun), 0.0, 1.0);

    // Variable ocean roughness (0.20 in deep water -> 0.45 in coastal shelves)
    float oceanRoughness = mix(0.20, 0.45, midToShelf);

    // Softened shininess exponents so reflection spreads out broadly as a gentle metallic sheen
    // rather than concentrating into an unnatural solid white spotlight
    float specShininess = mix(24.0, 10.0, oceanRoughness);
    float sheenShininess = mix(12.0, 6.0, oceanRoughness);

    // Heavily attenuated specular highlight (reduced by ~80% from previous 5.0 intensity down to < 0.32)
    float coreGlint = pow(RdotV, specShininess) * 0.30;
    float broadSheen = pow(NdotH, sheenShininess) * 0.12;
    float totalSunGlint = clamp(coreGlint + broadSheen, 0.0, 0.30);

    // Water Fresnel: gentle rise towards glancing angles, strictly non-blinding
    float cosTheta = clamp(dot(N_water, V), 0.0, 1.0);
    float waterFresnel = 0.15 + 0.35 * pow(1.0 - cosTheta, 3.0);

    // Direct sun-facing factor: strictly zero when facing away from Sun
    float sunFacing = clamp(dotNLgeo, 0.0, 1.0);

    // Subtle natural metallic solar sheen color (never saturated white)
    vec3 glintSheenColor = vec3(0.68, 0.84, 0.98) * totalSunGlint * waterFresnel;

    // Multiply strictly by day/sunlight factor and sun-facing clamp so it COMPLETELY disappears on the night side
    vec3 sunGlint = glintSheenColor * (dayFactor * sunFacing) * oceanMask;

    // STRICTLY MASKED TO WATER: Landmasses are 100% matte (roughness 1.0, zero metallic)
    dayLitSurface += sunGlint;

    // Moving cloud shadows on surface
    vec2 cloudShadowUv = vUv - L.xy * 0.0035 + vec2(uTime * 0.0005, 0.0);
    float cloudShadowCover = texture2D(cloudTexture, cloudShadowUv).a;
    float cloudShadow = smoothstep(0.20, 0.80, cloudShadowCover) * 0.30 * dayFactor;
    dayLitSurface *= (1.0 - cloudShadow);

    // ── 4. REALISTIC SATELLITE 3D NIGHT MODE ──
    // Directional moonlight vector in world space towards 3D Moon for matte terrain
    vec3 moonDir = normalize(moonDirection);
    float moonDiff = clamp(dot(N_land, moonDir), 0.0, 1.0);
    float moonWrap = clamp((dot(N_land, moonDir) + 0.35) / 1.35, 0.0, 1.0);
    float moonlitBumpLighting = moonDiff * 0.65 + moonWrap * 0.35;

    // 3D Moonlit Land: Dim natural ambient midnight glow (moonlight / atmospheric earthlight)
    // Softly reveals mountain ranges (Himalayas, Zagros, Western Ghats) and coastlines in deep dark-indigo & navy tones
    vec3 moonlitLand = dayTex.rgb * vec3(0.105, 0.125, 0.175) * (0.75 + moonlitBumpLighting * 0.75);

    // NIGHT OCEAN: Very dark navy blue with subtle visibility (#040c1e to #08162e)
    vec3 nightAbyssalNavy = vec3(0.014, 0.034, 0.082);
    vec3 nightShelfNavy   = vec3(0.024, 0.062, 0.120);
    vec3 nightOcean = mix(nightAbyssalNavy, nightShelfNavy, midToShelf * 0.45);

    // Zero ripples, zero wave noise, zero bright specular on night water
    // Ocean is a calm, smooth dark navy surface with subtle atmospheric visibility
    vec3 nightBase = mix(moonlitLand, nightOcean, oceanMask);

    // Razor-sharp city lights strictly on land (amber/gold)
    vec3 nightCityRaw = pow(nightColor.rgb, vec3(1.35));
    vec2 cityGrid = vUv * 3600.0;
    float microNoise = fract(sin(dot(floor(cityGrid * 0.65), vec2(12.9898, 78.233))) * 43758.5453);
    float cityPinpointMask = 0.75 + 0.25 * step(0.35, microNoise);
    vec3 amberBase = vec3(1.0, 0.62, 0.24);
    vec3 goldCore  = vec3(1.0, 0.82, 0.50);
    float cityLum = dot(nightCityRaw, vec3(0.299, 0.587, 0.114));
    float toneMappedLum = cityLum / (1.0 + cityLum * 0.75);
    vec3 cityColorGraded = mix(amberBase, goldCore, smoothstep(0.15, 0.75, toneMappedLum)) * toneMappedLum * 2.85;
    vec3 cityLights = cityColorGraded * cityPinpointMask * (1.0 - oceanMask);

    float cityFade = smoothstep(0.08, -0.08, dotNLgeo);
    vec3 nightLitSurface = nightBase + cityLights * cityFade;

    vec3 finalColor = mix(nightLitSurface, dayLitSurface, dayFactor);

    // Digital twin graticule: only on daylit surface, COMPLETELY OFF on the night side
    float latGrid = abs(fract(vUv.y * 18.0) - 0.5) / max(fwidth(vUv.y * 18.0), 0.0001);
    float lonGrid = abs(fract(vUv.x * 36.0) - 0.5) / max(fwidth(vUv.x * 36.0), 0.0001);
    float graticuleLine = clamp(1.0 - min(latGrid, lonGrid) * 0.7, 0.0, 1.0);
    vec3 graticuleCyan = vec3(0.06, 0.72, 0.98);
    float graticuleAlpha = graticuleLine * 0.025 * smoothstep(0.05, 0.30, dotNLgeo) * (0.35 + 0.65 * oceanMask);
    finalColor += graticuleCyan * graticuleAlpha;

    // Subsurface depth attenuation for digital twin underwater diving
    if (depthLevel > 0.0) {
      float depthDim = clamp(depthLevel / 1000.0, 0.0, 0.65);
      finalColor = mix(finalColor, vec3(0.01, 0.05, 0.14), depthDim * 0.5);
    }

    gl_FragColor = vec4(finalColor, depthOpacity);
  }
`;

export function RealisticEarth({ depth = 0, sunPosition = [12, 5, 8] }: RealisticEarthProps) {
  const earthMeshRef = useRef<THREE.Mesh>(null!);
  const { gl } = useThree();
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

  // Sun direction vector in Three.js world coordinates
  const sunDir = useMemo(() => {
    return new THREE.Vector3(...sunPosition).normalize();
  }, [sunPosition]);

  // Load 4K seamless textures with 16x Anisotropic Filtering and Mipmapping
  const { dayTex, nightTex, specTex, normalTex, cloudTex, waterNormTex } = useMemo(() => {
    const day = textureLoader.load('/textures/earth_day.jpg');
    const norm = textureLoader.load('/textures/earth_normal.jpg');
    const night = textureLoader.load('/textures/earth_night.png');
    const spec = textureLoader.load('/textures/earth_specular.jpg');
    const cloud = textureLoader.load('/textures/earth_clouds.png');
    const waterNorm = textureLoader.load('/textures/waternormals.jpg');

    day.colorSpace = THREE.SRGBColorSpace;
    night.colorSpace = THREE.SRGBColorSpace;

    // Apply 16x Anisotropy and Linear Mipmapping for maximum sharpness when zoomed into India
    const maxAniso = gl.capabilities.getMaxAnisotropy() || 16;
    [day, night, spec, norm, cloud].forEach((t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = maxAniso;
    });

    // Water normal MUST repeat in both S and T directions for multi-octave sphere wave mapping
    waterNorm.wrapS = THREE.RepeatWrapping;
    waterNorm.wrapT = THREE.RepeatWrapping;
    waterNorm.minFilter = THREE.LinearMipmapLinearFilter;
    waterNorm.magFilter = THREE.LinearFilter;
    waterNorm.generateMipmaps = true;
    waterNorm.anisotropy = maxAniso;

    return {
      dayTex: day,
      nightTex: night,
      specTex: spec,
      normalTex: norm,
      cloudTex: cloud,
      waterNormTex: waterNorm,
    };
  }, [textureLoader, gl]);

  // Shader uniforms
  const uniforms = useMemo(
    () => ({
      dayTexture: { value: dayTex },
      nightTexture: { value: nightTex },
      specularTexture: { value: specTex },
      normalTexture: { value: normalTex },
      waterNormalTexture: { value: waterNormTex },
      cloudTexture: { value: cloudTex },
      sunDirection: { value: sunDir.clone() },
      moonDirection: { value: new THREE.Vector3(0, 1, 0) },
      depthOpacity: { value: 1.0 },
      depthLevel: { value: depth as number },
      uTime: { value: 0.0 },
    }),
    [dayTex, nightTex, specTex, normalTex, waterNormTex, cloudTex, sunDir, depth]
  );

  // Sync sun & moon positions dynamically on changes
  useEffect(() => {
    if (uniforms.sunDirection) {
      uniforms.sunDirection.value.set(sunPosition[0], sunPosition[1], sunPosition[2]).normalize();
    }
  }, [sunPosition, uniforms]);

  useFrame((state) => {
    if (!earthMeshRef.current) return;
    uniforms.uTime.value = state.clock.elapsedTime;
    const sunDirVec = new THREE.Vector3(...sunPosition).normalize();
    uniforms.sunDirection.value.copy(sunDirVec);

    // Compute dynamic world-space moon direction opposite sun with 18-deg orbital inclination
    const oppSun = sunDirVec.clone().negate();
    const upAxis = Math.abs(oppSun.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const inclinationAxis = new THREE.Vector3().crossVectors(oppSun, upAxis).normalize();
    const moonDirVec = oppSun.applyAxisAngle(inclinationAxis, 0.314).normalize();
    uniforms.moonDirection.value.copy(moonDirVec);

    uniforms.depthLevel.value = THREE.MathUtils.lerp(uniforms.depthLevel.value, depth, 0.08);
    uniforms.depthOpacity.value = THREE.MathUtils.lerp(
      uniforms.depthOpacity.value,
      depth > 100 ? 0.75 : 1.0,
      0.08
    );
  });

  return (
    <group>
      {/* High-fidelity Earth sphere with 128x128 tessellation */}
      <mesh ref={earthMeshRef} receiveShadow castShadow>
        <sphereGeometry args={[2, 128, 128]} />
        <shaderMaterial
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          uniforms={uniforms}
          transparent={depth > 0}
          depthWrite={true}
        />
      </mesh>

      {/* Subsurface depth shell indicator when depth > 0 */}
      {depth > 0 && (
        <mesh>
          <sphereGeometry args={[2 - (depth / 1000) * 0.04, 48, 48]} />
          <meshBasicMaterial
            color="#06b6d4"
            transparent
            opacity={Math.min(0.25, 0.08 + (depth / 1000) * 0.2)}
            wireframe
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
