import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return await res.json();
}

/**
 * Radial distance point simplification to reduce 6000+ points to ~70-120 smooth points
 */
function simplifyRing(pts, tolSq = 0.04) {
  if (pts.length <= 3) return pts;
  const result = [pts[0]];
  let last = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const cur = pts[i];
    const dx = cur[0] - last[0];
    const dy = cur[1] - last[1];
    if (dx * dx + dy * dy >= tolSq) {
      result.push(cur);
      last = cur;
    }
  }
  result.push(pts[pts.length - 1]);
  return result;
}

async function main() {
  console.log('Fetching official VLIZ / MarineRegions UNCLOS Maritime Boundaries...');

  // 1. Fetch Official EEZ Polygons
  const polyUrl = 'https://geo.vliz.be/geoserver/MarineRegions/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=eez&outputFormat=application/json&cql_filter=mrgid+IN+(8480,8333,8345,8346,62589)';
  const polyData = await fetchJSON(polyUrl);

  // 2. Fetch Official Boundary Lines (Treaties and 200 NM outer limits)
  const lineIds = [
    // 200 NM Outer Limits facing high seas
    3675, // India 200 NM (Arabian Sea & Bay of Bengal)
    3671, // Andaman and Nicobar 200 NM
    3654, // Maldives 200 NM
    3655, // Sri Lanka 200 NM
    4510, // Chagos 200 NM
    // Bilateral Treaties
    1388, // Maldives - India
    1307, 1306, 1310, 1311, // Sri Lanka - India
    1299, 1300, 1301, 1313, // Indonesia - Andaman & Nicobar
    1308, 1309, // Myanmar - Andaman & Nicobar
    1312, 1314, // Thailand - Andaman & Nicobar
    1700, // Bangladesh - India (ITLOS)
    4611  // Chagos - Maldives (ITLOS)
  ];

  const lineUrl = `https://geo.vliz.be/geoserver/MarineRegions/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=eez_boundaries&outputFormat=application/json&cql_filter=line_id+IN+(${lineIds.join(',')})`;
  const lineData = await fetchJSON(lineUrl);

  const features = [];

  // Process EEZ Polygons
  polyData.features.forEach((f) => {
    const props = f.properties;
    const geom = f.geometry;
    let coords = geom.coordinates;
    let isIndia = false;
    let name = props.geoname;
    let id = `EEZ-${props.mrgid}`;

    if (props.mrgid === 8480) {
      isIndia = true;
      id = 'EEZ-IND-MAINLAND';
      name = 'India (Mainland & Lakshadweep) EEZ';
    } else if (props.mrgid === 8333) {
      isIndia = true;
      id = 'EEZ-IND-ANDAMAN';
      name = 'India (Andaman & Nicobar Islands) EEZ';
    } else if (props.mrgid === 8345) {
      id = 'EEZ-MDV';
      name = 'Maldives EEZ';
    } else if (props.mrgid === 8346) {
      id = 'EEZ-LKA';
      name = 'Sri Lanka EEZ';
    } else if (props.mrgid === 62589) {
      id = 'EEZ-IOT';
      name = 'British Indian Ocean Territory (BIOT) EEZ';
    }

    // Simplify outer polygon ring
    let simplifiedCoords = [];
    if (geom.type === 'Polygon') {
      simplifiedCoords = [simplifyRing(coords[0], 0.03)];
    } else if (geom.type === 'MultiPolygon') {
      // Find largest polygon ring
      let maxLen = 0;
      let largestRing = coords[0][0];
      coords.forEach((poly) => {
        if (poly[0] && poly[0].length > maxLen) {
          maxLen = poly[0].length;
          largestRing = poly[0];
        }
      });
      simplifiedCoords = [simplifyRing(largestRing, 0.03)];
    }

    features.push({
      type: 'Feature',
      properties: {
        id,
        mrgid: props.mrgid,
        name,
        country: isIndia ? 'India' : (props.sovereign1 || 'Territory'),
        category: 'eez_polygon',
        area_km2: props.area_km2,
        color: isIndia ? '#ef4444' : (props.mrgid === 62589 ? '#6366f1' : '#0ea5e9'),
      },
      geometry: {
        type: 'Polygon',
        coordinates: simplifiedCoords,
      },
    });
  });

  // Process Boundary Lines
  lineData.features.forEach((f) => {
    const props = f.properties;
    const geom = f.geometry;
    const lineType = props.line_type;
    const isTreaty = lineType === 'Treaty' || lineType === 'Court ruling' || lineType === 'Median line';
    const isOuter = lineType === '200 NM';

    let rawSegments = [];
    if (geom.type === 'LineString') {
      rawSegments = [geom.coordinates];
    } else if (geom.type === 'MultiLineString') {
      rawSegments = geom.coordinates;
    }

    rawSegments.forEach((rawPts, sIdx) => {
      // Downsample to clean ~80-120 points
      const tol = isOuter ? 0.06 : 0.03;
      const pts = simplifyRing(rawPts, tol);

      const isIndiaLine = props.sovereign1 === 'India' || props.sovereign2 === 'India' || props.line_name.includes('India');

      features.push({
        type: 'Feature',
        properties: {
          id: `LINE-${props.line_id}-${sIdx}`,
          line_id: props.line_id,
          name: props.line_name,
          category: isTreaty ? 'demarcation_line' : (isOuter ? 'outer_limit' : 'demarcation_line'),
          sovereign: isIndiaLine ? 'India' : props.sovereign1,
          treaty: props.line_type,
          color: isTreaty ? '#fef08a' : (isIndiaLine ? '#ef4444' : '#0ea5e9'),
        },
        geometry: {
          type: 'LineString',
          coordinates: pts,
        },
      });
    });
  });

  // Precise Island Territory Hubs
  const islandHubs = [
    {
      id: 'ISLAND-LAKSHADWEEP-MAIN',
      name: 'Lakshadweep (India)',
      group: 'Lakshadweep',
      country: 'India',
      category: 'island_hub',
      coordinates: [72.64, 10.57], // Kavaratti
      color: '#ef4444',
    },
    {
      id: 'ISLAND-ANDAMAN-NORTH',
      name: 'Andaman Is. (India)',
      group: 'Andaman',
      country: 'India',
      category: 'island_hub',
      coordinates: [92.73, 11.62], // Port Blair
      color: '#ef4444',
    },
    {
      id: 'ISLAND-NICOBAR',
      name: 'Nicobar Is. (India)',
      group: 'Nicobar',
      country: 'India',
      category: 'island_hub',
      coordinates: [93.85, 7.00], // Campbell Bay / Great Nicobar
      color: '#ef4444',
    },
    {
      id: 'ISLAND-MALDIVES',
      name: 'Maldives',
      group: 'Maldives',
      country: 'Maldives',
      category: 'island_hub',
      coordinates: [73.51, 4.17], // Malé
      color: '#0ea5e9',
    },
    {
      id: 'ISLAND-SRILANKA',
      name: 'Sri Lanka',
      group: 'Sri Lanka',
      country: 'Sri Lanka',
      category: 'island_hub',
      coordinates: [80.77, 7.87], // Central Sri Lanka
      color: '#0ea5e9',
    },
    {
      id: 'ISLAND-BIOT',
      name: 'British Indian Ocean Terr. (UK)',
      group: 'BIOT',
      country: 'UK',
      category: 'island_hub',
      coordinates: [72.40, -7.30], // Diego Garcia
      color: '#6366f1',
    },
  ];

  islandHubs.forEach((hub) => {
    features.push({
      type: 'Feature',
      properties: {
        id: hub.id,
        name: hub.name,
        group: hub.group,
        country: hub.country,
        category: hub.category,
        color: hub.color,
      },
      geometry: {
        type: 'Point',
        coordinates: hub.coordinates,
      },
    });
  });

  // Individual Island Dots for archipelago density
  const islandDots = [
    { name: 'Minicoy', lon: 73.05, lat: 8.28, group: 'Lakshadweep', country: 'India' },
    { name: 'Agatti', lon: 72.19, lat: 10.85, group: 'Lakshadweep', country: 'India' },
    { name: 'Amini', lon: 72.44, lat: 11.12, group: 'Lakshadweep', country: 'India' },
    { name: 'Andrott', lon: 73.68, lat: 10.83, group: 'Lakshadweep', country: 'India' },
    { name: 'Kalpeni', lon: 73.65, lat: 10.08, group: 'Lakshadweep', country: 'India' },
    { name: 'Chetlat', lon: 72.70, lat: 11.70, group: 'Lakshadweep', country: 'India' },
    { name: 'Bitra', lon: 72.18, lat: 11.60, group: 'Lakshadweep', country: 'India' },
    { name: 'Diglipur', lon: 93.00, lat: 13.25, group: 'Andaman', country: 'India' },
    { name: 'Middle Andaman', lon: 92.90, lat: 12.50, group: 'Andaman', country: 'India' },
    { name: 'Little Andaman', lon: 92.50, lat: 10.65, group: 'Andaman', country: 'India' },
    { name: 'Car Nicobar', lon: 92.78, lat: 9.17, group: 'Nicobar', country: 'India' },
    { name: 'Nancowry', lon: 93.55, lat: 8.03, group: 'Nicobar', country: 'India' },
    { name: 'Indira Point', lon: 93.83, lat: 6.75, group: 'Nicobar', country: 'India' },
    { name: 'Ihavandhippolhu', lon: 72.95, lat: 7.05, group: 'Maldives', country: 'Maldives' },
    { name: 'Ari Atoll', lon: 72.85, lat: 3.85, group: 'Maldives', country: 'Maldives' },
    { name: 'Huvadhoo', lon: 73.15, lat: 0.50, group: 'Maldives', country: 'Maldives' },
    { name: 'Addu Atoll', lon: 73.15, lat: -0.65, group: 'Maldives', country: 'Maldives' },
    { name: 'Jaffna', lon: 80.00, lat: 9.66, group: 'Sri Lanka', country: 'Sri Lanka' },
    { name: 'Trincomalee', lon: 81.23, lat: 8.57, group: 'Sri Lanka', country: 'Sri Lanka' },
  ];

  islandDots.forEach((dot, idx) => {
    features.push({
      type: 'Feature',
      properties: {
        id: `DOT-${dot.group}-${idx}`,
        name: dot.name,
        group: dot.group,
        country: dot.country,
        category: 'island_dot',
        color: dot.country === 'India' ? '#fef08a' : '#38bdf8',
      },
      geometry: {
        type: 'Point',
        coordinates: [dot.lon, dot.lat],
      },
    });
  });

  const outputGeoJSON = {
    type: 'FeatureCollection',
    name: 'Authoritative_Indian_Ocean_Exclusive_Economic_Zones',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
    },
    features,
  };

  const outputPath = path.join(__dirname, '../public/data/india_eez.geojson');
  fs.writeFileSync(outputPath, JSON.stringify(outputGeoJSON, null, 2), 'utf-8');
  console.log(`Successfully compiled ${features.length} authoritative features to: ${outputPath}`);
}

main().catch(console.error);
