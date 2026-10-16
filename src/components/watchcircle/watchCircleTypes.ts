import * as THREE from 'three';

export type WatchCircleDepthLevel = 0 | 10 | 50 | 100 | 500 | 1000 | 2500;
export type PhysicsEngineMode = 'rapier' | 'kinematic';

export interface EnvironmentalConditions {
  currentSpeed: number;     // 0 - 3 m/s
  currentDirection: number; // 0 - 360 degrees (FROM bearing)
  windSpeed: number;        // 0 - 30 m/s
  windDirection: number;    // 0 - 360 degrees (FROM bearing)
  waveHeight: number;       // 0 - 10 m (Hs)
  wavePeriod: number;       // 4 - 18 s (Tp)
  waveDirection: number;    // 0 - 360 degrees (FROM bearing)
}

export interface MooringConfig {
  waterDepth: number;          // Water depth in meters (e.g. 1000 - 3000m)
  watchCircleRadius: number;   // Watch circle radius in meters (e.g. 200 - 1200m)
  nominalLatitude: number;     // e.g. 16.3617
  nominalLongitude: number;    // e.g. 87.9903
  buoyId: string;              // e.g. "OMNI-BD10"
  scope: number;               // Line length to depth ratio (e.g. 1.22 reference)
  mbl_kN: number;              // Reference breaking load in kN (e.g. 250 kN)
}

export interface MooringSegmentData {
  index: number;
  id: string;
  name: string;
  material: string;
  length_m: number;
  diameter_mm: number;
  mass_per_m_kg: number;
  submerged_weight_N_m: number;
  breaking_strength_kN: number;
  localTension_kN: number;
  localAngle_deg: number;
  depthRange_m: [number, number];
  utilization_percent: number;
  provenance: {
    source: string;
    status: 'REFERENCE' | 'ASSUMPTION' | 'DERIVED' | 'AUTHORITATIVE';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    notes: string;
  };
  points3D: THREE.Vector3[];
}

export interface BuoyState {
  // Horizontal world offsets in visual meters from nominal (0,0)
  excursionX: number;
  excursionZ: number;
  excursionDistance: number; // sqrt(x^2 + z^2)
  excursionAngle: number;    // bearing in degrees
  heaveY: number;            // vertical heave displacement
  pitch: number;             // pitch angle in radians
  roll: number;              // roll angle in radians
  currentLat: number;
  currentLon: number;
  fairleadTension_kN: number;
  anchorTension_kN: number;
  safetyFactor: number;
  status: 'NORMAL' | 'WARNING' | 'BREACH';
  excursionPercent: number;  // (distance / radius) * 100
}

export interface GPSTrailPoint {
  x: number;
  z: number;
  time: number;
  breach: boolean;
}

export const PRESET_SCENARIOS: Record<string, { label: string; desc: string; env: EnvironmentalConditions }> = {
  calm: {
    label: 'Calm Sea State',
    desc: 'Light breeze and mild tidal drift. Minimal excursion well within safe watch boundary.',
    env: {
      currentSpeed: 0.25,
      currentDirection: 60,
      windSpeed: 4.0,
      windDirection: 45,
      waveHeight: 0.8,
      wavePeriod: 6.0,
      waveDirection: 50,
    },
  },
  monsoon: {
    label: 'Southwest Monsoon Gale',
    desc: 'Persistent strong monsoon currents and heavy swells pushing the buoy toward warning threshold.',
    env: {
      currentSpeed: 1.45,
      currentDirection: 215,
      windSpeed: 16.5,
      windDirection: 225,
      waveHeight: 3.8,
      wavePeriod: 9.5,
      waveDirection: 220,
    },
  },
  cyclone: {
    label: 'Tropical Cyclone Extreme',
    desc: 'Severe cyclonic storm forcing extreme line tension and watch-circle boundary breach.',
    env: {
      currentSpeed: 2.65,
      currentDirection: 130,
      windSpeed: 28.0,
      windDirection: 125,
      waveHeight: 7.5,
      wavePeriod: 14.0,
      waveDirection: 130,
    },
  },
  currentDrift: {
    label: 'Deep Ocean Jet Current',
    desc: 'High-speed subsurface current causing sustained lateral catenary displacement.',
    env: {
      currentSpeed: 2.8,
      currentDirection: 310,
      windSpeed: 6.0,
      windDirection: 270,
      waveHeight: 1.5,
      wavePeriod: 7.5,
      waveDirection: 290,
    },
  },
};

/**
 * Computes MoorSense engineering estimate of buoy excursion, multi-segment catenary, and watch circle status
 */
export function calculateMooringPhysics(
  env: EnvironmentalConditions,
  config: MooringConfig,
  time: number,
  liveOverride?: {
    steadyExcursionMeters?: number;
    forceResultantAngle?: number;
    fairleadTension_kN?: number;
    anchorTension_kN?: number;
    safetyFactor?: number;
  }
): {
  buoyState: BuoyState;
  catenaryPoints: THREE.Vector3[];
  segments: MooringSegmentData[];
} {
  // MoorSense Vector convention: meteorological FROM-bearing converts to force direction TOWARD (bearing + 180) % 360
  const forceDir = (deg: number) => (((deg + 180) % 360) * Math.PI) / 180;
  const currentForceRad = forceDir(env.currentDirection);
  const windForceRad = forceDir(env.windDirection);
  const waveForceRad = forceDir(env.waveDirection);

  // 1. Aerodynamic and Hydrodynamic Forcing Vectors (in Newtons)
  // Air density 1.225 kg/m³, Water density 1025 kg/m³
  const cdWind = 1.2;
  const cdCurrent = 1.0;
  const buoyProjArea = 3.8; // m² (mast + upper hull)
  const buoySubmergedArea = 4.2; // m² (discus keel)

  const fWindMag = 0.5 * 1.225 * cdWind * buoyProjArea * Math.pow(env.windSpeed, 2);
  const fCurrentMag = 0.5 * 1025.0 * cdCurrent * buoySubmergedArea * Math.pow(env.currentSpeed, 2);
  // Mean wave drift force (Morison screening formulation)
  const fWaveDrift = (1 / 16) * 1025.0 * 9.81 * Math.pow(env.waveHeight, 2) * 2.7;

  // Vector summation: East (X) and North (Z)
  const fx =
    fWindMag * Math.sin(windForceRad) +
    fCurrentMag * Math.sin(currentForceRad) +
    fWaveDrift * Math.sin(waveForceRad);
  const fz =
    fWindMag * Math.cos(windForceRad) +
    fCurrentMag * Math.cos(currentForceRad) +
    fWaveDrift * Math.cos(waveForceRad);

  const totalForce_N = Math.sqrt(fx * fx + fz * fz);
  const forceResultantAngle =
    liveOverride?.forceResultantAngle != null
      ? liveOverride.forceResultantAngle
      : Math.atan2(fx, fz);

  // 2. Quasi-static horizontal excursion from MoorSense inverse-catenary stiffness
  // Calibrated against ocean watch circle criteria:
  // - Calm (~1.5 kN force): ~14% excursion (well within safe boundary)
  // - Monsoon (~28 kN force): ~85% excursion (WARNING threshold approaching boundary)
  // - Tropical Cyclone Extreme (~112 kN force): 102% - 105% excursion (BREACH: pulls buoy to the end of the circle!)
  const refMonsoonForce = 28000.0;
  const normForce = Math.max(0, totalForce_N);
  let excursionRatio: number;
  if (normForce <= refMonsoonForce) {
    const u = normForce / refMonsoonForce;
    excursionRatio = 0.85 * Math.pow(u, 0.62);
  } else {
    const v = (normForce - refMonsoonForce) / (110000.0 - refMonsoonForce);
    excursionRatio = 0.85 + 0.185 * Math.min(1.25, Math.pow(Math.max(0, v), 0.70));
  }
  const steadyExcursionMeters =
    liveOverride?.steadyExcursionMeters != null
      ? liveOverride.steadyExcursionMeters
      : Math.min(
          config.watchCircleRadius * 1.25,
          config.watchCircleRadius * excursionRatio
        );

  // 3. Tether Mechanics & Organic Random Wander (Upper-half mooring compliance)
  // The upper-half mooring consists of synthetic lines (synthetic rope + compliant nylon)
  // allowing organic multi-harmonic pseudo-random wander from sub-mesoscale eddies and vortex shedding.
  const tWander = time * 0.08;
  const maxWanderRadius = Math.min(config.watchCircleRadius * 0.16, 45.0);
  const wanderX = maxWanderRadius * (
    Math.sin(tWander * 0.42 + 1.2) * 0.52 +
    Math.sin(tWander * 1.05 - 1.5) * 0.32 +
    Math.cos(tWander * 1.95 + 2.1) * 0.16
  );
  const wanderZ = maxWanderRadius * (
    Math.cos(tWander * 0.38 - 0.6) * 0.52 +
    Math.cos(tWander * 0.98 + 1.2) * 0.32 +
    Math.sin(tWander * 1.88 - 0.9) * 0.16
  );

  // Combine steady environmental drift with organic wander
  // Coordinate system: East = +X, North = -Z, West = -X, South = +Z
  const rawDriftX = steadyExcursionMeters * Math.sin(forceResultantAngle) + wanderX;
  const rawDriftZ = -steadyExcursionMeters * Math.cos(forceResultantAngle) + wanderZ;
  const rawDistance = Math.sqrt(rawDriftX * rawDriftX + rawDriftZ * rawDriftZ);
  const driftBearing = Math.atan2(rawDriftX, -rawDriftZ);

  // Non-linear catenary restoring tension:
  // Inside the inner yellow circle (r <= watchCircleRadius), the buoy floats and wanders freely.
  // As it approaches the perimeter, the upper compliant tether straightens, escalating restoring spring tension.
  const rInner = config.watchCircleRadius;
  const rOuter = config.watchCircleRadius * 1.30; // Outer red heavy-weather excursion limit
  let restrainedRadius: number;

  if (rawDistance <= rInner) {
    // Normal conditions: Tether mechanics provide progressive non-linear spring stiffness
    const tensionStiffness = Math.pow(rawDistance / rInner, 3.4) * 0.08;
    restrainedRadius = rawDistance * (1.0 - tensionStiffness);
  } else {
    // Heavy waves / extreme weather: hydrodynamic drag pulls past inner boundary toward outer red limit
    const excess = rawDistance - rInner;
    const maxExcess = rOuter - rInner;
    restrainedRadius = rInner + maxExcess * Math.tanh(excess / Math.max(1, maxExcess));
  }

  // 4. Dynamic Wave-Induced Orbital Motion (First-order heave, pitch, roll)
  const omega = (2 * Math.PI) / Math.max(4, env.wavePeriod);
  const waveAmp = env.waveHeight * 0.5;

  const dynamicX = waveAmp * 0.65 * Math.sin(waveForceRad) * Math.cos(omega * time);
  const dynamicZ = -waveAmp * 0.65 * Math.cos(waveForceRad) * Math.cos(omega * time);
  const heaveY = waveAmp * Math.sin(omega * time * 1.05);
  const pitch = THREE.MathUtils.clamp((waveAmp / 12) * Math.sin(omega * time), -0.22, 0.22);
  const roll = THREE.MathUtils.clamp((waveAmp / 15) * Math.cos(omega * time * 0.95), -0.18, 0.18);

  // Total Horizontal Excursion in Real Meters
  const totalExcursionX = restrainedRadius * Math.sin(driftBearing) + dynamicX;
  const totalExcursionZ = -restrainedRadius * Math.cos(driftBearing) + dynamicZ;
  const excursionDistance = Math.sqrt(totalExcursionX * totalExcursionX + totalExcursionZ * totalExcursionZ);
  // True North Bearing: North is -Z (0°), East is +X (90°), South is +Z (180°), West is -X (270°)
  const excursionAngle = ((Math.atan2(totalExcursionX, -totalExcursionZ) * 180) / Math.PI + 360) % 360;

  // Real Geodesic Latitude / Longitude (North = negative Z)
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos((config.nominalLatitude * Math.PI) / 180);
  const currentLat = config.nominalLatitude - totalExcursionZ / metersPerDegLat;
  const currentLon = config.nominalLongitude + totalExcursionX / metersPerDegLon;

  // Watch Circle Status Check:
  // Inner Circle (Yellow) = Primary perimeter (100% of watchCircleRadius)
  // Outer Circle (Red) = Max excursion / heavy weather boundary (130% of watchCircleRadius)
  const excursionPercent = Math.round((excursionDistance / config.watchCircleRadius) * 100);
  let status: 'NORMAL' | 'WARNING' | 'BREACH' = 'NORMAL';
  if (excursionPercent > 100) {
    status = 'BREACH'; // Outside Inner Yellow Circle, inside Outer Red Hazard Zone
  } else if (excursionPercent >= 80) {
    status = 'WARNING'; // Approaching Inner Yellow Perimeter
  }

  // 5. Mooring Line Tension & Structural Load Prediction
  // Fairlead pretension + hydrodynamic drag + wave heave inertial dynamic surging
  const pretension_N = 2453.0;
  const horizontalTension_N = totalForce_N;

  // Heavy wave conditions (Hs > 3.0m) induce non-linear peak heave dynamic tension
  const heavyWaveMultiplier = env.waveHeight > 3.0 ? 1.0 + (env.waveHeight - 3.0) * 0.35 : 1.0;
  const dynamicWaveTension_N = Math.pow(Math.max(0.5, env.waveHeight), 1.45) * 1850.0 * heavyWaveMultiplier;
  const verticalTension_N = pretension_N + (totalForce_N * 0.42) + dynamicWaveTension_N;
  const fairleadTension_N = Math.sqrt(horizontalTension_N * horizontalTension_N + verticalTension_N * verticalTension_N);
  const anchorTension_N = fairleadTension_N * 0.84;

  const fairleadTension_kN =
    liveOverride?.fairleadTension_kN != null
      ? liveOverride.fairleadTension_kN
      : Math.round((fairleadTension_N / 1000) * 10) / 10;
  const anchorTension_kN =
    liveOverride?.anchorTension_kN != null
      ? liveOverride.anchorTension_kN
      : Math.round((anchorTension_N / 1000) * 10) / 10;
  const safetyFactor =
    liveOverride?.safetyFactor != null
      ? liveOverride.safetyFactor
      : Math.max(1.05, Math.round((config.mbl_kN / Math.max(1, fairleadTension_kN)) * 100) / 100);

  // 5. 3D Coordinate Mapping (1 unit = 30m, Seabed at Y = -18)
  const M_TO_3D = 1 / 30;
  const buoy3D_X = totalExcursionX * M_TO_3D;
  const buoy3D_Z = totalExcursionZ * M_TO_3D;
  const buoy3D_Y = (heaveY * 0.4) * M_TO_3D;
  const seabedY = -18;
  const anchorY = seabedY + 0.85; // Top pad eye of the heavy cylindrical sinker clump

  const fairlead3D = new THREE.Vector3(buoy3D_X, buoy3D_Y - 1.95, buoy3D_Z);
  const anchor3D = new THREE.Vector3(0, anchorY, 0);

  // Dynamic tension ratio (relative to MBL) for physical compliance
  const tensionRatio = Math.min(1.0, fairleadTension_kN / config.mbl_kN);
  // In low tension/calm states, buoyant S-loop expands; in storm states, line pulls tauter
  const complianceFactor = 1.0 - 0.70 * tensionRatio;

  // Float horizontal offset direction in 3D (primarily in +X to clearly display profile bend)
  const floatOffsetDist = 1.40 * complianceFactor;
  const floatDirX = Math.cos(forceResultantAngle * 0.4) * floatOffsetDist;
  const floatDirZ = Math.sin(forceResultantAngle * 0.4) * floatOffsetDist * 0.35;

  // Physical Spline Control Points matching authoritative diagram (media_1791568214529.png):
  // 1. Upper Riser (Keel -> ADCP -> 500m Inductive Cable -> CTD): Hangs straight down
  const pFairlead = fairlead3D.clone();
  const pAdcp = new THREE.Vector3(buoy3D_X, buoy3D_Y - 2.85, buoy3D_Z);
  const pCableMid = new THREE.Vector3(buoy3D_X, buoy3D_Y - 4.75, buoy3D_Z);
  const pCtd = new THREE.Vector3(buoy3D_X, buoy3D_Y - 6.60, buoy3D_Z);
  const pCtdBase = new THREE.Vector3(buoy3D_X, buoy3D_Y - 6.85, buoy3D_Z);

  // 2. Compliant Nylon S-Loop: Dips DOWN below CTD, then loops UP to buoyant Trawl Float
  const pUDip = new THREE.Vector3(
    buoy3D_X + floatDirX * 0.55,
    buoy3D_Y - 7.75, // Dips 0.9m below the CTD sensor!
    buoy3D_Z + floatDirZ * 0.55
  );
  const pFloatApex = new THREE.Vector3(
    buoy3D_X + floatDirX,
    buoy3D_Y - 6.30, // Elevated apex held up by positive buoyancy (+1800N)
    buoy3D_Z + floatDirZ
  );

  // 3. Deep Polypropylene Tether down to Anchor Cluster
  const pPolyMid = new THREE.Vector3(
    floatDirX * 0.42,
    -11.2,
    floatDirZ * 0.42
  );
  const pGlassTop = new THREE.Vector3(0, -14.60, 0);
  const pRelease = new THREE.Vector3(0, -16.05, 0);
  const pAnchor = anchor3D.clone();

  const controlNodes = [
    pFairlead,
    pAdcp,
    pCableMid,
    pCtd,
    pCtdBase,
    pUDip,
    pFloatApex,
    pPolyMid,
    pGlassTop,
    pRelease,
    pAnchor,
  ];

  // In Tropical Cyclone Extreme / BREACH, line tension pulls the catenary completely straight
  const isExtremeBreach = status === 'BREACH' || excursionPercent >= 95 || env.windSpeed >= 24;
  const tautnessFactor = isExtremeBreach
    ? 1.0
    : status === 'WARNING'
    ? Math.min(0.40, Math.max(0.0, (excursionPercent - 60) / 40))
    : 0.0;

  if (tautnessFactor > 0) {
    for (let i = 0; i < controlNodes.length; i++) {
      const frac = i / (controlNodes.length - 1);
      const pStraight = new THREE.Vector3().lerpVectors(pFairlead, pAnchor, frac);
      controlNodes[i].lerp(pStraight, tautnessFactor);
    }
  }

  const fullSpline = new THREE.CatmullRomCurve3(controlNodes, false, 'centripetal', 0.5);
  const numPoints = 64;
  const catenaryPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= numPoints; i++) {
    catenaryPoints.push(fullSpline.getPointAt(i / numPoints));
  }

  // 6. MoorSense 3-Segment Model Breakdown (Matching Reference Diagram Sequence)
  const totalLineLength_m = config.waterDepth * config.scope;

  // Segment index partitions in the 64-point curve:
  // Seg 0: indices 0 to 22 (Upper Chain, ADCP, 500m Inductive Wire Rope w/ 9x CT & CTD Sensors)
  // Seg 1: indices 20 to 52 (Nylon S-Loop U-bend, Trawl Float in Net & Polypropylene Rope)
  // Seg 2: indices 50 to 65 (3x Glass Spheres, Acoustic Release & Heavy Ground Chain to Bottom Weight)
  const seg0_pts = catenaryPoints.slice(0, 23);
  const seg1_pts = catenaryPoints.slice(20, 53);
  const seg2_pts = catenaryPoints.slice(50, 65);

  // Local angles relative to vertical:
  const lineAngleFairlead = Math.round((Math.atan2(horizontalTension_N, verticalTension_N) * 180) / Math.PI);
  const lineAngleMid = Math.round(lineAngleFairlead * 0.65);
  const lineAngleAnchor = Math.max(4, Math.round(lineAngleFairlead * 0.28));

  const segments: MooringSegmentData[] = [
    {
      index: 0,
      id: 'upper_inductive_riser',
      name: 'Components 1-4: Upper Chain, ADCP, 500m Inductive Cable (9x CT) & CTD',
      material: 'Stud-Link Chain, Inline ADCP Frame, Armored Inductive Cable w/ 9 Clamped CT Sensors & CTD',
      length_m: Math.min(500, Math.round(totalLineLength_m * 0.16)),
      diameter_mm: 14,
      mass_per_m_kg: 0.85,
      submerged_weight_N_m: 6.2,
      breaking_strength_kN: 175,
      localTension_kN: fairleadTension_kN,
      localAngle_deg: lineAngleFairlead,
      depthRange_m: [2.0, Math.min(500, Math.round(config.waterDepth * 0.18))],
      utilization_percent: Math.round((fairleadTension_kN / 175) * 1000) / 10,
      provenance: {
        source: 'mooring_system_spec.md & Reference Schematic (media_1791568214529.png)',
        status: 'AUTHORITATIVE',
        confidence: 'HIGH',
        notes: 'Component 1 (Upper Chain below keel pad eye) -> Component 2 (Inline ADCP Cage Frame) -> Component 3 (500m Inductive Cable with 9x Clamped CT Sensors) -> Component 4 (CTD Sensor at inductive cable base). Provides electrical and inductive telemetry coupling from subsurface ocean layers to the surface buoy.',
      },
      points3D: seg0_pts,
    },
    {
      index: 1,
      id: 'compliant_s_tether',
      name: 'Components 5-7: Nylon S-Loop, Trawl Float in Net & Polypropylene Rope',
      material: 'Compliant Nylon Rope S-Loop, 5x Netted Trawl Floats (Buoyancy Cluster) & Polypropylene Rope',
      length_m: Math.round(totalLineLength_m * 0.72),
      diameter_mm: 28,
      mass_per_m_kg: 0.58,
      submerged_weight_N_m: 1.1,
      breaking_strength_kN: 240,
      localTension_kN: Math.round((fairleadTension_kN * 0.88) * 10) / 10,
      localAngle_deg: lineAngleMid,
      depthRange_m: [Math.min(500, Math.round(config.waterDepth * 0.18)), Math.round(config.waterDepth * 0.90)],
      utilization_percent: Math.round(((fairleadTension_kN * 0.88) / 240) * 1000) / 10,
      provenance: {
        source: 'mooring_system_spec.md & Reference Schematic (media_1791568214529.png)',
        status: 'AUTHORITATIVE',
        confidence: 'HIGH',
        notes: 'Component 5 (Nylon Rope S-Loop compliant belly) -> Component 6 (Trawl Float in Net subsurface buoyancy cluster providing +1800N upward lift) -> Component 7 (Polypropylene Rope deep synthetic tether). Decouples surface wave dynamics from seabed ground tackle.',
      },
      points3D: seg1_pts,
    },
    {
      index: 2,
      id: 'anchor_chain_assembly',
      name: 'Components 8-11: Glass Spheres (x3), Acoustic Release, Ground Chain & Bottom Weight',
      material: '3x Yellow Glass Spheres, Dual Acoustic Release Transponder, Heavy Ground Chain & 2,000 kg Segmented Dead Weight',
      length_m: Math.round(totalLineLength_m * 0.12),
      diameter_mm: 26,
      mass_per_m_kg: 15.2,
      submerged_weight_N_m: 128.0,
      breaking_strength_kN: 520,
      localTension_kN: anchorTension_kN,
      localAngle_deg: lineAngleAnchor,
      depthRange_m: [Math.round(config.waterDepth * 0.90), config.waterDepth],
      utilization_percent: Math.round((anchorTension_kN / 520) * 1000) / 10,
      provenance: {
        source: 'mooring_system_spec.md & Reference Schematic (media_1791568214529.png)',
        status: 'AUTHORITATIVE',
        confidence: 'HIGH',
        notes: 'Component 8 (3x Yellow Glass Spheres in hardhats) -> Component 9 (Dual Acoustic Release Transponder in purple housing) -> Component 10 (Heavy Stud-Link Ground Chain) -> Component 11 (2,000 kg Segmented Clump Dead Weight on seabed). Holds the deep acoustic transponder vertical and securely anchors the mooring.',
      },
      points3D: seg2_pts,
    },
  ];

  return {
    buoyState: {
      excursionX: totalExcursionX,
      excursionZ: totalExcursionZ,
      excursionDistance,
      excursionAngle,
      heaveY,
      pitch,
      roll,
      currentLat,
      currentLon,
      fairleadTension_kN,
      anchorTension_kN,
      safetyFactor,
      status,
      excursionPercent: Math.round(excursionPercent * 10) / 10,
    },
    catenaryPoints,
    segments,
  };
}
