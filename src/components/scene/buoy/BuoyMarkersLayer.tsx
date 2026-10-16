/**
 * BuoyMarkersLayer:
 * Renders the operational array of OMNI buoy points on the 3D Earth.
 * Features:
 * - High-visibility orbital telemetry beacons
 * - Smart spatial decluttering & spiderfy separation for nearby colliding buoys (e.g. BD08 & BD09)
 * - Ground anchor datum pips and tether links to true GPS coordinates
 * - Non-overlapping directional HUD station badges
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { BuoyMarker } from './BuoyMarker';
import type { BuoyLocation } from '../../../services/buoy/buoyTypes';
import { latLonToXYZ } from '../../../utils/oceanCalc';

interface BuoyMarkersLayerProps {
  buoys: BuoyLocation[];
  selectedBuoyId: string | null;
  onSelectBuoy: (buoy: BuoyLocation) => void;
  onHoverBuoy?: (buoy: BuoyLocation | null) => void;
  visible?: boolean;
}

export interface DeclutteredBuoyItem {
  buoy: BuoyLocation;
  truePosition: THREE.Vector3;
  offsetPosition: THREE.Vector3;
  isClustered: boolean;
  labelDirection: 'left' | 'right' | 'top' | 'bottom' | 'top-right' | 'bottom-left';
  index: number;
}

export function BuoyMarkersLayer({
  buoys,
  selectedBuoyId,
  onSelectBuoy,
  onHoverBuoy,
  visible = true,
}: BuoyMarkersLayerProps) {
  // ── Smart Spatial Decluttering & Spiderfy Collision Resolution ───────────────
  // Computes pairwise distances on Earth sphere (radius 2.006).
  // Buoys closer than collisionThreshold (e.g. BD08 & BD09 at ~0.35°) are smoothly
  // separated along their tangent plane so they never overlap or hide each other.
  const declutteredBuoys = useMemo<DeclutteredBuoyItem[]>(() => {
    const radius = 2.006;
    const items: DeclutteredBuoyItem[] = buoys.map((b, i) => {
      const [x, y, z] = latLonToXYZ(b.latitude, b.longitude, radius);
      const pos = new THREE.Vector3(x, y, z);
      return {
        buoy: b,
        truePosition: pos.clone(),
        offsetPosition: pos.clone(),
        isClustered: false,
        labelDirection: 'top-right',
        index: i,
      };
    });

    const collisionThreshold = 0.048; // ~1.37° on Earth radius 2.006
    const targetSeparation = 0.054;   // ~1.54° target separation distance

    // Disjoint-set union to find connected collision clusters
    const n = items.length;
    const parent = Array.from({ length: n }, (_, i) => i);
    function find(i: number): number {
      if (parent[i] === i) return i;
      parent[i] = find(parent[i]);
      return parent[i];
    }
    function union(i: number, j: number) {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) parent[rootI] = rootJ;
    }

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dist = items[i].truePosition.distanceTo(items[j].truePosition);
        if (dist < collisionThreshold) {
          union(i, j);
        }
      }
    }

    const clusters = new Map<number, number[]>();
    for (let i = 0; i < n; i++) {
      const root = find(i);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root)!.push(i);
    }

    // Process clusters with multiple buoys
    for (const indices of clusters.values()) {
      if (indices.length < 2) continue;

      const centroid = new THREE.Vector3();
      indices.forEach((idx) => centroid.add(items[idx].truePosition));
      centroid.divideScalar(indices.length);
      const normal = centroid.clone().normalize();

      if (indices.length === 2) {
        const i1 = indices[0];
        const i2 = indices[1];
        items[i1].isClustered = true;
        items[i2].isClustered = true;

        const p1 = items[i1].truePosition;
        const p2 = items[i2].truePosition;
        const curDist = p1.distanceTo(p2);

        // Vector between the pair projected onto tangent plane
        const v = p1.clone().sub(p2);
        const tangent = v.clone().sub(normal.clone().multiplyScalar(v.dot(normal)));
        if (tangent.lengthSq() < 0.00001) {
          const arbitrary = new THREE.Vector3(0, 1, 0);
          if (Math.abs(arbitrary.dot(normal)) > 0.9) arbitrary.set(1, 0, 0);
          tangent.crossVectors(normal, arbitrary);
        }
        tangent.normalize();

        const separationNeeded = Math.max(0.016, (targetSeparation - curDist) * 0.5);

        // Displace along tangent plane and re-project precisely onto Earth sphere surface
        const off1 = p1.clone().add(tangent.clone().multiplyScalar(separationNeeded));
        off1.normalize().multiplyScalar(radius);
        items[i1].offsetPosition = off1;
        items[i1].labelDirection = 'top-right';

        const off2 = p2.clone().sub(tangent.clone().multiplyScalar(separationNeeded));
        off2.normalize().multiplyScalar(radius);
        items[i2].offsetPosition = off2;
        items[i2].labelDirection = 'bottom-left';
      } else {
        // Multi-buoy spiderfy fan
        const spiderRadius = targetSeparation * 0.72;
        let u = new THREE.Vector3(0, 1, 0).cross(normal);
        if (u.lengthSq() < 0.001) u = new THREE.Vector3(1, 0, 0).cross(normal);
        u.normalize();
        const v = new THREE.Vector3().crossVectors(normal, u).normalize();

        const directions: ('top-right' | 'bottom-left' | 'right' | 'left' | 'top' | 'bottom')[] = [
          'top-right', 'bottom-left', 'right', 'left', 'top', 'bottom',
        ];

        indices.forEach((idx, k) => {
          items[idx].isClustered = true;
          const angle = (2 * Math.PI * k) / indices.length;
          const offsetVec = u.clone().multiplyScalar(Math.cos(angle) * spiderRadius)
            .add(v.clone().multiplyScalar(Math.sin(angle) * spiderRadius));
          const offPos = centroid.clone().add(offsetVec).normalize().multiplyScalar(radius);
          items[idx].offsetPosition = offPos;
          items[idx].labelDirection = directions[k % directions.length];
        });
      }
    }

    return items;
  }, [buoys]);

  if (!visible) return null;

  return (
    <group name="BuoyMarkersLayer">
      {declutteredBuoys.map((item) => (
        <BuoyMarker
          key={item.buoy.id}
          buoy={item.buoy}
          isSelected={selectedBuoyId === item.buoy.id}
          onSelect={onSelectBuoy}
          onHover={onHoverBuoy}
          truePosition={item.truePosition}
          offsetPosition={item.offsetPosition}
          isClustered={item.isClustered}
          labelDirection={item.labelDirection}
          index={item.index}
        />
      ))}
    </group>
  );
}
