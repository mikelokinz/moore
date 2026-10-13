import type {
  EnvironmentalConditions,
  MooringConfig,
  BuoyState,
} from './watchCircleTypes';

export interface MaterialLoadCalculation {
  materialId: string;
  name: string;
  shortLabel: string;
  category: 'ALLOY STEEL' | 'ELECTROMECHANICAL' | 'SYNTHETIC POLYMER' | 'BUOYANCY FLOTATION' | 'SEABED TACKLE';
  specification: string;
  diameter_mm: number;
  length_m: number;
  depthRange_m: [number, number];
  mbl_kN: number;              // Minimum Breaking Load
  wll_kN: number;              // Working Load Limit (MBL / 3.0)
  workingTension_kN: number;   // Dynamic Working Load
  workingTension_kgf: number;  // Tension in kgf
  workingTension_lbf: number;  // Tension in lbf
  utilization_percent: number; // (T / MBL) * 100
  safetyFactor: number;        // MBL / T
  reserveMargin_kN: number;    // MBL - T
  dragLoad_kN: number;         // Hydrodynamic Drag Force
  submergedWeight_N_m: number; // Submerged weight per meter (negative = sinks, positive = buoyant)
  totalSubmergedWeight_kN: number;
  elasticModulus_GPa: number;  // Young's Modulus
  elasticStretch_m: number;    // Axial elongation (strain) in meters
  stretchPercent: number;      // (stretch / length) * 100
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  recommendation: string;
  standardsNote: string;
}

export const MATERIAL_SPECS: Record<
  string,
  {
    name: string;
    shortLabel: string;
    category: MaterialLoadCalculation['category'];
    specification: string;
    diameter_mm: number;
    length_m: number;
    depthRange_m: [number, number];
    mbl_kN: number;
    elasticModulus_GPa: number;
    submergedWeight_N_m: number;
    cd: number;
    loadMultiplier: number;
    standardsNote: string;
  }
> = {
  upper_chain: {
    name: 'Upper Stud-Link Chain & Swivel Bridle',
    shortLabel: 'Upper Chain',
    category: 'ALLOY STEEL',
    specification: 'Grade 3 Forged Alloy Steel, Hot-Dip Galvanized, 22mm Bar Diameter',
    diameter_mm: 22,
    length_m: 2.5,
    depthRange_m: [1.7, 2.5],
    mbl_kN: 420.0,
    elasticModulus_GPa: 190.0,
    submergedWeight_N_m: -145.0,
    cd: 1.8,
    loadMultiplier: 1.0,
    standardsNote: 'API RP 2SK / DNV-OS-E301 Class 1 Splash Zone',
  },
  inductive_cable: {
    name: '500m Armored Inductive Riser Wire Rope',
    shortLabel: 'Inductive Cable',
    category: 'ELECTROMECHANICAL',
    specification: 'Torque-Balanced 3x19 Galvanized Steel Core with HDPE Insulation Jacket',
    diameter_mm: 14,
    length_m: 500.0,
    depthRange_m: [2.5, 502.5],
    mbl_kN: 165.0,
    elasticModulus_GPa: 110.0,
    submergedWeight_N_m: -6.2,
    cd: 1.2,
    loadMultiplier: 0.94,
    standardsNote: 'Sea-Bird Scientific Inductive Modem Protocol / NIOT Spec',
  },
  nylon_rope: {
    name: 'Compliant High-Tenacity Nylon S-Loop Tether',
    shortLabel: 'Nylon Rope',
    category: 'SYNTHETIC POLYMER',
    specification: '8-Strand Plaited High-Tenacity Polyamide (Nylon 6.6), 32mm Diameter',
    diameter_mm: 32,
    length_m: 650.0,
    depthRange_m: [502.5, 1152.5],
    mbl_kN: 250.0,
    elasticModulus_GPa: 2.5,
    submergedWeight_N_m: -2.0,
    cd: 1.15,
    loadMultiplier: 0.85,
    standardsNote: 'ISO 10554 Mooring Lines / High Dynamic Compliance',
  },
  trawl_float: {
    name: 'Mid-Water Buoyancy Cluster (Netted Trawl Floats)',
    shortLabel: 'Trawl Floats',
    category: 'BUOYANCY FLOTATION',
    specification: '6x 250mm High-Impact Copolymer Polypropylene Hollow Spheres in Net',
    diameter_mm: 250,
    length_m: 1.4,
    depthRange_m: [600, 601.4],
    mbl_kN: 180.0,
    elasticModulus_GPa: 18.0,
    submergedWeight_N_m: 1250.0, // Positive upward lift!
    cd: 0.45,
    loadMultiplier: 0.76,
    standardsNote: 'Euro-Float Deep Sea Flotation / +1,750 N Net Lift',
  },
  polypropylene_rope: {
    name: 'Deep Ocean Positively Buoyant Synthetic Tether',
    shortLabel: 'Polypropylene',
    category: 'SYNTHETIC POLYMER',
    specification: '8-Strand Plaited Polypropylene / Polyolefin Copolymer, 30mm Diameter',
    diameter_mm: 30,
    length_m: 1800.0,
    depthRange_m: [1152.5, 2590.0],
    mbl_kN: 220.0,
    elasticModulus_GPa: 4.2,
    submergedWeight_N_m: 0.15, // Positively buoyant!
    cd: 1.15,
    loadMultiplier: 0.62,
    standardsNote: 'WHOI Deep-Sea Mooring Standards / Anti-Seafloor Abrasion',
  },
  glass_spheres: {
    name: 'Subsea Benthos Borosilicate Glass Flotation Spheres',
    shortLabel: 'Glass Spheres',
    category: 'BUOYANCY FLOTATION',
    specification: '3x 17" Low-Expansion Borosilicate Glass Spheres in HDPE Yellow Hardhats',
    diameter_mm: 432,
    length_m: 1.8,
    depthRange_m: [2550, 2552],
    mbl_kN: 120.0,
    elasticModulus_GPa: 64.0,
    submergedWeight_N_m: 416.0, // Positive upward lift!
    cd: 0.42,
    loadMultiplier: 0.28,
    standardsNote: 'Teledyne Benthos 6,700m Hydrostatic Rating / +750 N Net Lift',
  },
  acoustic_release: {
    name: 'Dual Acoustic Release Transponder Link',
    shortLabel: 'Acoustic Release',
    category: 'SEABED TACKLE',
    specification: 'Hard-Anodized 7075-T6 Titanium/Aluminum Solenoid Drop-Hook Canister',
    diameter_mm: 170,
    length_m: 0.85,
    depthRange_m: [2590, 2591],
    mbl_kN: 52.0,
    elasticModulus_GPa: 72.0,
    submergedWeight_N_m: -242.0,
    cd: 0.82,
    loadMultiplier: 0.18,
    standardsNote: 'EdgeTech 8242XS Encrypted FSK Acoustic Trigger',
  },
  ground_chain: {
    name: 'Seabed Heavy Cast Steel Ground Chain',
    shortLabel: 'Ground Chain',
    category: 'ALLOY STEEL',
    specification: 'Grade 3 Forged Stud-Link Anchor Chain, 26mm Bar Diameter, HDG Coated',
    diameter_mm: 26,
    length_m: 30.0,
    depthRange_m: [2597, 2627],
    mbl_kN: 490.0,
    elasticModulus_GPa: 190.0,
    submergedWeight_N_m: -84.0,
    cd: 1.8,
    loadMultiplier: 0.12,
    standardsNote: 'Benthic Boundary Layer Scour & Abrasion Resistance',
  },
  bottom_weight: {
    name: '2,000 kg Cast Iron Sinker Clump Deadweight',
    shortLabel: 'Clump Anchor',
    category: 'SEABED TACKLE',
    specification: 'Grade G25 Cast Iron Segmented Sinker Plates with High-Tensile Tie-Rods',
    diameter_mm: 1550,
    length_m: 0.75,
    depthRange_m: [2627, 2628],
    mbl_kN: 35.0, // Horizontal shear holding resistance before drag
    elasticModulus_GPa: 120.0,
    submergedWeight_N_m: -22760.0, // Submerged holding force = 17.07 kN
    cd: 1.05,
    loadMultiplier: 0.10,
    standardsNote: 'Gravity Sinker Clump / Soil Friction Coeff µ=0.60',
  },
};

/**
 * Calculates complete load metrics for all mooring materials based on live or simulated forcing.
 */
export function calculateMaterialLoads(
  env: EnvironmentalConditions,
  config: MooringConfig,
  buoyState: BuoyState
): Record<string, MaterialLoadCalculation> {
  const fairleadTension_kN = Math.max(1.0, buoyState.fairleadTension_kN);
  const anchorTension_kN = Math.max(0.5, buoyState.anchorTension_kN);
  const currentSpeed = Math.max(0.05, env.currentSpeed);

  const results: Record<string, MaterialLoadCalculation> = {};

  Object.entries(MATERIAL_SPECS).forEach(([id, spec]) => {
    // 1. Working Tension Calculation:
    // Blend fairlead tension and anchor tension based on segment depth profile
    let workingTension_kN: number;
    if (id === 'upper_chain') {
      workingTension_kN = fairleadTension_kN;
    } else if (id === 'inductive_cable') {
      workingTension_kN = Math.max(1.5, fairleadTension_kN * spec.loadMultiplier + (env.waveHeight * 0.45));
    } else if (id === 'nylon_rope') {
      workingTension_kN = Math.max(1.5, fairleadTension_kN * spec.loadMultiplier + (env.waveHeight * 0.35));
    } else if (id === 'polypropylene_rope') {
      workingTension_kN = Math.max(1.2, fairleadTension_kN * spec.loadMultiplier + (anchorTension_kN * 0.3));
    } else if (id === 'ground_chain') {
      workingTension_kN = Math.max(0.8, anchorTension_kN * 1.08);
    } else if (id === 'bottom_weight') {
      // Horizontal shear load attempting to drag the sinker
      workingTension_kN = Math.max(0.4, anchorTension_kN * 0.65);
    } else {
      workingTension_kN = Math.max(1.0, fairleadTension_kN * spec.loadMultiplier);
    }

    // 2. Hydrodynamic Drag on this Segment:
    // F_drag = 0.5 * rho * Cd * A_proj * v^2
    const projArea_m2 = (spec.diameter_mm / 1000) * spec.length_m;
    const dragForce_N = 0.5 * 1025.0 * spec.cd * projArea_m2 * Math.pow(currentSpeed, 2);
    const dragLoad_kN = Math.round((dragForce_N / 1000) * 100) / 100;

    // Add inline drag to working tension
    const totalWorkingTension_kN = Math.round((workingTension_kN + dragLoad_kN * 0.5) * 10) / 10;
    const workingTension_kgf = Math.round(totalWorkingTension_kN * 101.97);
    const workingTension_lbf = Math.round(totalWorkingTension_kN * 224.81);

    // 3. Safety Factor & Utilization:
    const utilization_percent = Math.min(
      100,
      Math.round(((totalWorkingTension_kN / spec.mbl_kN) * 100) * 10) / 10
    );
    const safetyFactor =
      Math.round((spec.mbl_kN / Math.max(0.1, totalWorkingTension_kN)) * 10) / 10;
    const reserveMargin_kN = Math.round((spec.mbl_kN - totalWorkingTension_kN) * 10) / 10;
    const wll_kN = Math.round((spec.mbl_kN / 3.0) * 10) / 10;

    // 4. Elastic Strain / Axial Stretch:
    // Delta_L = (T * L) / (E * A)
    const area_m2 = Math.PI * Math.pow(spec.diameter_mm / 2000, 2);
    const tension_N = totalWorkingTension_kN * 1000;
    const e_Pa = spec.elasticModulus_GPa * 1e9;
    const rawStretch_m = (tension_N * spec.length_m) / (e_Pa * area_m2);
    const elasticStretch_m = Math.round(rawStretch_m * 100) / 100;
    const stretchPercent =
      Math.round(((elasticStretch_m / spec.length_m) * 100) * 100) / 100;

    // 5. Total Submerged Deadweight / Lift:
    const totalSubmergedWeight_kN =
      Math.round(((spec.submergedWeight_N_m * spec.length_m) / 1000) * 10) / 10;

    // 6. Status and Recommendations:
    let status: MaterialLoadCalculation['status'] = 'SAFE';
    let recommendation = 'Nominal tensile stress within DNV-OS-E301 allowable envelope.';

    if (utilization_percent >= 75 || safetyFactor < 2.0) {
      status = 'CRITICAL';
      recommendation = 'EXTREME OVERLOAD: Cyclic fatigue threshold breached. Inspect termination hardware.';
    } else if (utilization_percent >= 40 || safetyFactor < 3.0) {
      status = 'WARNING';
      recommendation = 'ELEVATED LOADING: Approaching Working Load Limit (WLL). Monitor monsoon swell harmonics.';
    }

    results[id] = {
      materialId: id,
      name: spec.name,
      shortLabel: spec.shortLabel,
      category: spec.category,
      specification: spec.specification,
      diameter_mm: spec.diameter_mm,
      length_m: spec.length_m,
      depthRange_m: spec.depthRange_m,
      mbl_kN: spec.mbl_kN,
      wll_kN,
      workingTension_kN: totalWorkingTension_kN,
      workingTension_kgf,
      workingTension_lbf,
      utilization_percent,
      safetyFactor,
      reserveMargin_kN,
      dragLoad_kN,
      submergedWeight_N_m: spec.submergedWeight_N_m,
      totalSubmergedWeight_kN,
      elasticModulus_GPa: spec.elasticModulus_GPa,
      elasticStretch_m,
      stretchPercent,
      status,
      recommendation,
      standardsNote: spec.standardsNote,
    };
  });

  return results;
}
