import { useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { latLonToXYZ } from '../../utils/oceanCalc';

interface IndiaEEZProps {
  visible: boolean;
  showLabels?: boolean;
}

interface IslandHubData {
  id: string;
  position: [number, number, number];
  name: string;
  group: string;
  country: string;
  subtext?: string;
  color: string;
}

interface IslandDotData {
  id: string;
  position: [number, number, number];
  name: string;
  color: string;
}

interface OuterLineData {
  id: string;
  coreTubeGeo: THREE.TubeGeometry;
  haloTubeGeo: THREE.TubeGeometry;
  color: string;
  haloColor: string;
  name: string;
}

interface DemarcationLineData {
  id: string;
  dashTubes: THREE.TubeGeometry[];
  color: string;
  name: string;
  treaty?: string;
}

/**
 * High-precision 3D Island Cartographic Badge with directional collision-free offsets
 */
function IslandHubBadge({ hub }: { hub: IslandHubData }) {
  const [isVisible, setIsVisible] = useState(true);
  const posVec = useMemo(() => new THREE.Vector3(...hub.position), [hub.position]);

  useFrame(({ camera }) => {
    // Only show badge when island is on the visible hemisphere facing the camera
    const camDir = camera.position.clone().normalize();
    const dot = posVec.clone().normalize().dot(camDir);
    const visibleOnGlobe = dot > 0.22;
    if (visibleOnGlobe !== isVisible) {
      setIsVisible(visibleOnGlobe);
    }
  });

  if (!isVisible) return null;

  const isIndia = hub.country === 'India';

  // Distinct directional placement to guarantee zero label collisions:
  // - Lakshadweep & Maldives float to the WEST (left of pip)
  // - Sri Lanka, Andaman & Nicobar float to the EAST (right of pip)
  // - BIOT floats to the SOUTH (below pip)
  let placementStyle: React.CSSProperties = {
    position: 'absolute',
    left: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
  };

  const idUpper = hub.id.toUpperCase();
  if (idUpper.includes('LAKSHADWEEP')) {
    placementStyle = {
      position: 'absolute',
      right: '6px',
      top: '50%',
      transform: 'translateY(-50%)',
    };
  } else if (idUpper.includes('MALDIVES')) {
    placementStyle = {
      position: 'absolute',
      right: '6px',
      top: '50%',
      transform: 'translateY(-50%)',
    };
  } else if (idUpper.includes('SRILANKA')) {
    placementStyle = {
      position: 'absolute',
      left: '6px',
      top: '50%',
      transform: 'translateY(-50%)',
    };
  } else if (idUpper.includes('ANDAMAN')) {
    placementStyle = {
      position: 'absolute',
      left: '6px',
      top: '50%',
      transform: 'translateY(-50%)',
    };
  } else if (idUpper.includes('NICOBAR')) {
    placementStyle = {
      position: 'absolute',
      left: '6px',
      top: '50%',
      transform: 'translateY(-50%)',
    };
  } else if (idUpper.includes('BIOT')) {
    placementStyle = {
      position: 'absolute',
      left: '50%',
      top: '6px',
      transform: 'translateX(-50%)',
    };
  }

  const badgeBorder = isIndia ? 'rgba(255, 77, 109, 0.75)' : 'rgba(56, 189, 248, 0.75)';
  const badgeBg = isIndia ? 'rgba(20, 6, 12, 0.88)' : 'rgba(4, 18, 32, 0.88)';
  const badgeDot = isIndia ? '#ff4d6d' : '#38bdf8';
  const badgeGlow = isIndia ? 'rgba(255, 77, 109, 0.35)' : 'rgba(56, 189, 248, 0.35)';

  return (
    <Html
      position={hub.position}
      center={false}
      distanceFactor={3.2}
      zIndexRange={[100, 0]}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'opacity 0.2s ease',
      }}
    >
      <div style={{ position: 'relative', width: 0, height: 0 }}>
        <div style={placementStyle}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: badgeBg,
              border: `1px solid ${badgeBorder}`,
              borderRadius: '4px',
              padding: '2px 6px',
              boxShadow: `0 2px 10px rgba(0, 0, 0, 0.75), 0 0 10px ${badgeGlow}`,
              backdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: badgeDot,
                boxShadow: `0 0 6px ${badgeDot}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontSize: '8px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.9)',
              }}
            >
              {hub.name}
            </span>
          </div>
        </div>
      </div>
    </Html>
  );
}

/**
 * Compact illuminated beacon pip for Island Hubs
 */
function IslandBeaconPip({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* Central Solid Pip */}
      <mesh>
        <sphereGeometry args={[0.0028, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Luminous Halo Sphere */}
      <mesh>
        <sphereGeometry args={[0.006, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export function IndiaEEZ({ visible, showLabels = true }: IndiaEEZProps) {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch('/data/india_eez.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Failed to load India EEZ GeoJSON:', err));
  }, []);

  const { outerLines, demarcationLines, islandHubs, islandDots } = useMemo(() => {
    if (!geoData || !geoData.features) {
      return {
        outerLines: [] as OuterLineData[],
        demarcationLines: [] as DemarcationLineData[],
        islandHubs: [] as IslandHubData[],
        islandDots: [] as IslandDotData[],
      };
    }

    const outerList: OuterLineData[] = [];
    const demarcationList: DemarcationLineData[] = [];
    const hubList: IslandHubData[] = [];
    const dotList: IslandDotData[] = [];

    geoData.features.forEach((feature: any) => {
      const geom = feature.geometry;
      const props = feature.properties || {};
      if (!geom) return;

      // ── 1. SOLID OUTER 200 NM LIMITS FACING HIGH SEAS ─────────────────────
      if (geom.type === 'LineString' && props.category === 'outer_limit') {
        const coords = geom.coordinates;
        if (coords.length > 1) {
          const pts = coords.map(([lon, lat]: [number, number]) => {
            const [x, y, z] = latLonToXYZ(lat, lon, 2.012);
            return new THREE.Vector3(x, y, z);
          });

          const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
          const isIndia = props.sovereign === 'India' || props.id.includes('3675') || props.id.includes('3671');

          // Refined cartographic ribbon widths
          const coreRadius = isIndia ? 0.0016 : 0.0013;
          const haloRadius = isIndia ? 0.0048 : 0.0036;
          const coreSegments = Math.max(64, pts.length * 4);

          const coreTubeGeo = new THREE.TubeGeometry(curve, coreSegments, coreRadius, 6, false);
          const haloTubeGeo = new THREE.TubeGeometry(curve, Math.max(48, pts.length * 3), haloRadius, 6, false);

          outerList.push({
            id: props.id,
            coreTubeGeo,
            haloTubeGeo,
            color: isIndia ? '#ff4d6d' : '#38bdf8',
            haloColor: isIndia ? '#ff1744' : '#0284c7',
            name: props.name,
          });
        }
      }

      // ── 2. BILATERAL DEMARCATION LINES (DASHED TREATY BORDERS) ─────────────
      else if (geom.type === 'LineString' && props.category === 'demarcation_line') {
        const coords = geom.coordinates;
        if (coords.length > 1) {
          const pts = coords.map(([lon, lat]: [number, number]) => {
            const [x, y, z] = latLonToXYZ(lat, lon, 2.013);
            return new THREE.Vector3(x, y, z);
          });

          const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');

          // Segmented dashed 3D tubes along bilateral treaty borders
          const length = curve.getLength();
          const totalDashes = Math.max(10, Math.round(length * 75));
          const dashTubes: THREE.TubeGeometry[] = [];

          for (let i = 0; i < totalDashes; i++) {
            if (i % 2 === 0) {
              const tStart = i / totalDashes;
              const tEnd = (i + 0.65) / totalDashes;
              const subPts: THREE.Vector3[] = [];
              const subSteps = 4;
              for (let s = 0; s <= subSteps; s++) {
                const t = tStart + (tEnd - tStart) * (s / subSteps);
                subPts.push(curve.getPoint(t));
              }
              const subCurve = new THREE.CatmullRomCurve3(subPts, false, 'centripetal');
              dashTubes.push(new THREE.TubeGeometry(subCurve, 4, 0.0016, 5, false));
            }
          }

          demarcationList.push({
            id: props.id,
            dashTubes,
            color: props.color || '#fbbf24',
            name: props.name,
            treaty: props.treaty,
          });
        }
      }

      // ── 3. ISLAND HUBS & PINS ─────────────────────────────────────────────
      else if (geom.type === 'Point' && props.category === 'island_hub') {
        const [lon, lat] = geom.coordinates;
        const [x, y, z] = latLonToXYZ(lat, lon, 2.015);
        const isIndia = props.country === 'India';
        hubList.push({
          id: props.id,
          position: [x, y, z],
          name: props.name,
          group: props.group,
          country: props.country,
          subtext: props.subtext,
          color: isIndia ? '#ff4d6d' : '#38bdf8',
        });
      }

      // ── 4. INDIVIDUAL ARCHIPELAGO ISLAND DOTS ─────────────────────────────
      else if (geom.type === 'Point' && props.category === 'island_dot') {
        const [lon, lat] = geom.coordinates;
        const [x, y, z] = latLonToXYZ(lat, lon, 2.008);
        dotList.push({
          id: props.id,
          position: [x, y, z],
          name: props.name,
          color: '#fbbf24',
        });
      }
    });

    return {
      outerLines: outerList,
      demarcationLines: demarcationList,
      islandHubs: hubList,
      islandDots: dotList,
    };
  }, [geoData]);

  if (!visible) return null;

  return (
    <group name="MaritimeEconomicZones">
      {/* ── 1. Solid Outer 200 NM Boundaries Facing High Seas ── */}
      {outerLines.map((outer) => (
        <group key={`eez-outer-${outer.id}`}>
          {/* Luminous Core Tube */}
          <mesh geometry={outer.coreTubeGeo}>
            <meshBasicMaterial
              color={outer.color}
              transparent
              opacity={0.96}
              depthWrite={false}
            />
          </mesh>

          {/* Glowing Ambient Atmospheric Halo Ribbon */}
          <mesh geometry={outer.haloTubeGeo}>
            <meshBasicMaterial
              color={outer.haloColor}
              transparent
              opacity={0.32}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}

      {/* ── 2. Dashed Bilateral Treaty Demarcation Lines ── */}
      {demarcationLines.map((demarc) => (
        <group key={`eez-demarc-${demarc.id}`}>
          {demarc.dashTubes.map((dashGeo, dIdx) => (
            <mesh key={`dash-${demarc.id}-${dIdx}`} geometry={dashGeo}>
              <meshBasicMaterial
                color={demarc.color}
                transparent
                opacity={0.95}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── 3. Archipelago Island Jewel Dots (Lakshadweep, Andaman, Nicobar) ── */}
      {islandDots.map((dot) => (
        <group key={`dot-${dot.id}`} position={dot.position}>
          <mesh>
            <sphereGeometry args={[0.0018, 12, 12]} />
            <meshBasicMaterial color={dot.color} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.0036, 12, 12]} />
            <meshBasicMaterial
              color={dot.color}
              transparent
              opacity={0.35}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}

      {/* ── 4. Island Territory Hub Pips & Dynamic HUD Badges ── */}
      {islandHubs.map((hub) => (
        <group key={`hub-${hub.id}`}>
          <IslandBeaconPip position={hub.position} color={hub.color} />
          {showLabels && <IslandHubBadge hub={hub} />}
        </group>
      ))}
    </group>
  );
}
