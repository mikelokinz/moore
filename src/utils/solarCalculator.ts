/**
 * Astronomical Solar Position Calculator for MoorSense 3D Digital Twin.
 *
 * Implements high-precision NOAA Spencer Solar Ephemeris to compute the exact
 * celestial subsolar position (declination & Greenwich hour angle) for any given
 * real-time or simulated UTC timestamp.
 *
 * Provides exact 3D Cartesian celestial positioning that aligns with the
 * Three.js sphere UV mapping of Earth, enabling real-time day/night terminators,
 * photorealistic solar glare, and accurate nocturnal city illumination.
 */

import { latLngToVector3 } from './geoCoordinates';

export interface SolarEphemeris {
  /** 3D world position vector for the Sun [x, y, z] */
  position: [number, number, number];
  /** Subsolar point latitude in decimal degrees [-23.44, +23.44] */
  latitude: number;
  /** Subsolar point longitude in decimal degrees [-180, +180] */
  longitude: number;
  /** Solar elevation angle at central India (degrees, >0 = day, <0 = night) */
  indiaSolarElevation: number;
  /** Lighting regime for the Indian subcontinent */
  indiaLightingState: 'daylight' | 'twilight' | 'night';
  /** Formatted UTC time string (e.g. "11:05:30 UTC") */
  utcTimeStr: string;
  /** Formatted Indian Standard Time string (e.g. "16:35:30 IST") */
  istTimeStr: string;
  /** Formatted subsolar location string (e.g. "08° 32' S, 010° 15' E") */
  subsolarStr: string;
}

// Geographic reference for Central India
const INDIA_REF_LAT = 20.5937;
const INDIA_REF_LON = 78.9629;

/** Default distance of the celestial Sun in Three.js world units */
export const CELESTIAL_SUN_DISTANCE = 38.0;

/**
 * Computes the solar ephemeris and subsolar coordinate for a given Date.
 *
 * @param date Target date object (defaults to current real-time)
 * @param distance Distance of the 3D Sun object from Earth center
 */
export function calculateSolarEphemeris(
  date: Date = new Date(),
  distance: number = CELESTIAL_SUN_DISTANCE
): SolarEphemeris {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const ms = date.getUTCMilliseconds();

  // Day of the year (1 - 366)
  const startOfYear = Date.UTC(year, 0, 1);
  const currentDayUTC = Date.UTC(year, month, day);
  const dayOfYear = Math.floor((currentDayUTC - startOfYear) / 86400000) + 1;

  // Fractional UTC hour
  const utcHoursFraction = hours + minutes / 60 + seconds / 3600 + ms / 3600000;

  // Fractional year in radians (gamma)
  const gamma = ((2 * Math.PI) / 365.2425) * (dayOfYear - 1 + (utcHoursFraction - 12) / 24);

  // NOAA Spencer Solar Declination formula (in radians)
  const declinationRad =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const declinationDeg = (declinationRad * 180) / Math.PI;

  // Equation of Time (EoT) in minutes
  const eotMinutes =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Subsolar longitude in degrees [-180, +180]
  // Greenwich solar noon is at 12:00:00 UTC - EoT
  let subsolarLon = -(utcHoursFraction - 12 + eotMinutes / 60) * 15;
  // Normalize to [-180, +180]
  subsolarLon = ((((subsolarLon + 180) % 360) + 360) % 360) - 180;

  // 3D Cartesian celestial position matching Three.js Earth UV orientation
  const sunVec3 = latLngToVector3(declinationDeg, subsolarLon, distance);
  const position: [number, number, number] = [sunVec3.x, sunVec3.y, sunVec3.z];

  // Calculate solar elevation angle in Central India
  const lat1Rad = (INDIA_REF_LAT * Math.PI) / 180;
  const lon1Rad = (INDIA_REF_LON * Math.PI) / 180;
  const lon2Rad = (subsolarLon * Math.PI) / 180;

  const sinElevation =
    Math.sin(lat1Rad) * Math.sin(declinationRad) +
    Math.cos(lat1Rad) * Math.cos(declinationRad) * Math.cos(lon1Rad - lon2Rad);

  const elevationRad = Math.asin(Math.max(-1, Math.min(1, sinElevation)));
  const indiaSolarElevation = (elevationRad * 180) / Math.PI;

  let indiaLightingState: 'daylight' | 'twilight' | 'night' = 'night';
  if (indiaSolarElevation > 0) {
    indiaLightingState = 'daylight';
  } else if (indiaSolarElevation >= -6) {
    indiaLightingState = 'twilight';
  } else {
    indiaLightingState = 'night';
  }

  // Format strings
  const pad = (n: number) => n.toString().padStart(2, '0');
  const utcTimeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} UTC`;

  // IST = UTC + 5:30
  const istDate = new Date(date.getTime() + 5.5 * 3600000);
  const istHours = istDate.getUTCHours();
  const istMinutes = istDate.getUTCMinutes();
  const istSeconds = istDate.getUTCSeconds();
  const istTimeStr = `${pad(istHours)}:${pad(istMinutes)}:${pad(istSeconds)} IST`;

  const latHem = declinationDeg >= 0 ? 'N' : 'S';
  const lonHem = subsolarLon >= 0 ? 'E' : 'W';
  const subsolarStr = `${Math.abs(declinationDeg).toFixed(1)}°${latHem}, ${Math.abs(subsolarLon).toFixed(1)}°${lonHem}`;

  return {
    position,
    latitude: declinationDeg,
    longitude: subsolarLon,
    indiaSolarElevation,
    indiaLightingState,
    utcTimeStr,
    istTimeStr,
    subsolarStr,
  };
}
