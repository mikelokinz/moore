import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { BuoyLocation, BuoyStatus } from '../../../services/buoy/buoyTypes';
import { latLonToXYZ } from '../../../utils/oceanCalc';

interface BuoyMarkerProps {
  buoy: BuoyLocation;
  isSelected: boolean;
  isHandHovered?: boolean;
  onSelect: (buoy: BuoyLocation) => void;
  onHover?: (buoy: BuoyLocation | null) => void;
}

/**
 * Buoy state color mapping matching maritime telemetry standard:
 * - Green → SAFE
 * - Yellow/amber → WARNING
 * - Red → CRITICAL / ADRIFT
 * - Dim slate → OFFLINE
 * - Electric cyan → ACTIVE / IN-SERVICE
 */
export function getBuoyColor(status?: BuoyStatus | string): string {
  switch (status) {
    case 'SAFE':
      return '#10b981'; // Luminous emerald
    case 'WARNING':
      return '#f59e0b'; // Amber
    case 'CRITICAL':
    case 'ADRIFT':
      return '#ef4444'; // Red
    case 'OFFLINE':
      return '#64748b'; // Dim slate
    default:
      // Active in-situ OMNI stations default to high-tech telemetry cyan
      return '#22d3ee';
  }
}

/**
 * High-Fidelity Mini 3D Oceanographic Buoy:
 * Replaces generic spherical dots with a realistic miniature OMNI surface buoy.
 *
 * Modeled features:
 * - High-visibility marine safety yellow discus flotation hull
 * - International maritime red collar band
 * - White/galvanized instrument tripod mast tower
 * - Dual met-ocean solar power wings
 * - Dark telemetry instrument capsule & weather sensor disc
 * - Top flashing high-intensity navigational LED beacon
 * - Waterline surface contact wake & radar pulse ring
 */
export function BuoyMarker({
  buoy,
  isSelected,
  isHandHovered = false,
  onSelect,
  onHover,
}: BuoyMarkerProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const modelGroupRef = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const beaconMeshRef = useRef<THREE.Mesh>(null!);
  const pulseRef = useRef<number>(0);
  const { gl } = useThree();

  // Altitude radius resting precisely on ocean surface
  const markerRadius = 2.006;

  // Lat/Lon → 3D Cartesian Vector3
  const targetPosition = useMemo(() => {
    const [x, y, z] = latLonToXYZ(buoy.latitude, buoy.longitude, markerRadius);
    return new THREE.Vector3(x, y, z);
  }, [buoy.latitude, buoy.longitude, markerRadius]);

  // Current interpolated position for smooth telemetry movement
  const currentPosition = useRef(targetPosition.clone());

  const color = useMemo(() => getBuoyColor(buoy.status), [buoy.status]);

  // Radar pulse ring active for warning, critical, selected, or active tracking
  const showPulse = isSelected || buoy.status === 'WARNING' || buoy.status === 'CRITICAL' || buoy.status === 'ADRIFT';

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth position interpolation
    currentPosition.current.lerp(targetPosition, Math.min(1.0, delta * 4.0));
    groupRef.current.position.copy(currentPosition.current);

    // Orient buoy tangent to Earth's curvature (+Z points away from Earth radially)
    const normal = currentPosition.current.clone().normalize();
    groupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

    pulseRef.current += delta * 2.5;

    // Flashing navigational beacon light pulsation
    if (beaconMeshRef.current) {
      const flash = 0.75 + Math.sin(state.clock.elapsedTime * 6.0) * 0.25;
      beaconMeshRef.current.scale.setScalar(flash);
    }

    // Subtle gentle sea bobbing animation for the mini buoy
    if (modelGroupRef.current) {
      const bob = Math.sin(state.clock.elapsedTime * 2.2 + buoy.latitude) * 0.0006;
      modelGroupRef.current.position.z = bob;
    }

    // Expanding radar wake animation
    if (ringRef.current && showPulse) {
      const scale = 1 + (pulseRef.current % 1.5) * 1.8;
      ringRef.current.scale.setScalar(scale);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, 0.7 - (scale - 1) * 0.4);
      }
    }
  });

  const scale = isSelected ? 1.35 : isHandHovered ? 1.2 : 1.0;

  return (
    <group ref={groupRef} name={`mini-buoy-${buoy.id}`}>
      {/* Generous invisible hit box for effortless cursor/gesture interaction */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(buoy);
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          gl.domElement.style.cursor = 'pointer';
          onHover?.(buoy);
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          gl.domElement.style.cursor = 'default';
          onHover?.(null);
        }}
      >
        <sphereGeometry args={[0.038, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Surface radar sonar pulse ring on ocean */}
      {showPulse && (
        <mesh ref={ringRef} position={[0, 0, 0.0008]}>
          <ringGeometry args={[0.012, 0.018, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* ── 3D Mini Buoy Model (Rotated so Y points radially UP along +Z) ── */}
      <group
        ref={modelGroupRef}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[scale, scale, scale]}
      >
        {/* 1. Waterline Ocean Contact Ripple Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0005, 0]}>
          <ringGeometry args={[0.0075, 0.013, 24]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* 2. Lower Discus Flotation Hull Chamfer */}
        <mesh position={[0, 0.0014, 0]}>
          <cylinderGeometry args={[0.0068, 0.0042, 0.0022, 16]} />
          <meshStandardMaterial
            color="#facc15"
            roughness={0.35}
            metalness={0.1}
          />
        </mesh>

        {/* 3. Main Upper Discus Float (Marine High-Visibility Yellow) */}
        <mesh position={[0, 0.0032, 0]}>
          <cylinderGeometry args={[0.0062, 0.0068, 0.0018, 16]} />
          <meshStandardMaterial
            color="#eab308"
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>

        {/* 4. Maritime Safety Red Collar Stripe */}
        <mesh position={[0, 0.0044, 0]}>
          <cylinderGeometry args={[0.0064, 0.0064, 0.0008, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>

        {/* 5. Central Deck Hub */}
        <mesh position={[0, 0.0052, 0]}>
          <cylinderGeometry args={[0.0038, 0.0038, 0.0008, 12]} />
          <meshStandardMaterial
            color="#334155"
            roughness={0.4}
            metalness={0.4}
          />
        </mesh>

        {/* 6. Tapered Instrument Mast Tower (Galvanized Steel / Marine White) */}
        <mesh position={[0, 0.0092, 0]}>
          <cylinderGeometry args={[0.0016, 0.0034, 0.0075, 8]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.25}
            metalness={0.45}
          />
        </mesh>

        {/* 7. Solar Power Wings / Met-Ocean Cross-Arms */}
        <mesh position={[0, 0.0125, 0]}>
          <boxGeometry args={[0.0075, 0.0007, 0.0028]} />
          <meshStandardMaterial
            color="#0284c7"
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>

        {/* 8. Top Sensor Capsule & Radar Reflector Housing */}
        <mesh position={[0, 0.0142, 0]}>
          <cylinderGeometry args={[0.0028, 0.0028, 0.0014, 12]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.35}
            metalness={0.7}
          />
        </mesh>

        {/* 9. High-Intensity Flashing Navigational Beacon LED */}
        <mesh ref={beaconMeshRef} position={[0, 0.0165, 0]}>
          <sphereGeometry args={[0.0022, 14, 14]} />
          <meshBasicMaterial color={color} />
        </mesh>

        {/* 10. Luminous Beacon Glow Corona Aura */}
        <mesh position={[0, 0.0165, 0]}>
          <sphereGeometry args={[0.0055, 14, 14]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.48}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* ── Selection Concentric Radar Rings ── */}
      {isSelected && (
        <group position={[0, 0, 0.0015]}>
          <mesh>
            <ringGeometry args={[0.014, 0.016, 32]} />
            <meshBasicMaterial
              color="#22d3ee"
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[0.022, 0.0235, 32]} />
            <meshBasicMaterial
              color="#22d3ee"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[0.030, 0.0315, 32]} />
            <meshBasicMaterial
              color="#22d3ee"
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
