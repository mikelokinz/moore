import { Suspense } from 'react';
import { RealisticEarth } from './RealisticEarth';
import { CloudLayer } from './CloudLayer';
import { RealisticAtmosphere } from './RealisticAtmosphere';
import { IndiaEEZ } from './IndiaEEZ';
import type { DepthLevel } from '../../types/ocean';
import type { CloudMetadata } from '../../services/cloudService';

export interface MoorSenseEarthProps {
  depth?: DepthLevel;
  sunPosition?: [number, number, number];
  showClouds?: boolean;
  onCloudMetadataUpdate?: (meta: CloudMetadata) => void;
  showEEZ?: boolean;
  showEEZLabels?: boolean;
  children?: React.ReactNode;
}

/**
 * MoorSenseEarth:
 * Direct preservation of the Ocean Sentry Earth experience.
 * Encapsulates the high-fidelity Earth, cloud layer, wind streams, and atmospheric scattering
 * into a single reusable base layer for the MoorSense Mooring Integrity Digital Twin System.
 */
export function MoorSenseEarth({
  depth = 0,
  sunPosition = [12, 5, 8],
  showClouds = true,
  onCloudMetadataUpdate,
  showEEZ = false,
  showEEZLabels = true,
  children,
}: MoorSenseEarthProps) {
  return (
    <group name="MoorSenseEarthBaseLayer">
      <Suspense fallback={null}>
        <RealisticEarth depth={depth} sunPosition={sunPosition} />
        {showClouds && (
          <CloudLayer
            depth={depth}
            sunPosition={sunPosition}
          />
        )}
        <RealisticAtmosphere sunPosition={sunPosition} />

        {/* Maritime Exclusive Economic Zone (EEZ) Boundary Overlay */}
        <IndiaEEZ visible={showEEZ} showLabels={showEEZLabels} />
      </Suspense>
      {/* Reusable extension slot for operational OMNI buoy markers */}
      {children}
    </group>
  );
}
