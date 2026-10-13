export interface MooringComponentInfo {
  id: string;
  diagramLabel: string;
  actualName: string;
  equipmentModel: string;
  material: string;
  depthRating: string;
  dimensionsOrMass: string;
  mblOrAccuracy: string;
  purpose: string;
  specSource: string;
  color: string;
  badge: string;
}

export const MOORING_COMPONENTS: Record<string, MooringComponentInfo> = {
  keel_weight: {
    id: 'keel_weight',
    diagramLabel: 'Keelweight',
    actualName: 'Deep-Sea Keel Ballast Counterweight & Stability Hub',
    equipmentModel: 'NIOT OMNI Keel Counterweight Assembly (192mm x 540mm)',
    material: 'Cast Iron (Grade G25) encased in Hot-Dip Galvanized Marine Steel (EN ISO 1461) with Anti-Corrosion Polyurethane Sealant',
    depthRating: 'Subsurface Metacentric Ballast (1.3m to 1.9m depth)',
    dimensionsOrMass: '450 kg (air weight) / ~385 kg (submerged); 540mm OD collar, 192mm height',
    mblOrAccuracy: 'Hydrostatic Righting Moment GM > 1.25 m (Self-Righting in Sea State 7)',
    purpose: 'Lowers the buoy overall Center of Gravity (KG = -1.32m), producing a positive metacentric righting arm that prevents wind/wave overturning and keeps surface meteorological antennas and satellite transceivers aligned with the sky.',
    specSource: 'NIOT OMNI Operational Mooring (Venkatesan et al., 2016; Kaliyaperumal et al., 2019)',
    color: '#16a34a',
    badge: 'BALLAST & STABILITY',
  },

  upper_chain: {
    id: 'upper_chain',
    diagramLabel: 'Chain',
    actualName: 'Upper Mooring Stud-Link Steel Chain & Swivel Assembly',
    equipmentModel: 'Grade 2/3 Forged Stud-Link Mooring Chain with G.I. Safety Bow Shackle & Ball-Bearing Swivel',
    material: 'Grade 2 / Grade 3 High-Tensile Forged Alloy Steel, Hot-Dip Galvanized (HDG, min 85µm zinc coating)',
    depthRating: 'Surface Splash Zone (1.7m to 2.2m depth)',
    dimensionsOrMass: '19 mm – 26 mm bar diameter, link pitch ~150 mm; ~14.8 kg/m',
    mblOrAccuracy: 'Minimum Breaking Load (MBL) = 380 – 520 kN',
    purpose: 'Directly couples the buoy keel pad eye to the inline ADCP frame; withstands severe high-frequency cyclic bend fatigue and hydrodynamic surge forces under breaking waves while the mechanical swivel prevents torsional line twist.',
    specSource: 'Indian Journal of Geo-Marine Sciences (OMNI Buoy Design Standards)',
    color: '#cbd5e1',
    badge: 'TENSION & FATIGUE RESISTANCE',
  },

  adcp: {
    id: 'adcp',
    diagramLabel: 'ADCP',
    actualName: 'Acoustic Doppler Current Profiler in Inline Tension Load Cage',
    equipmentModel: 'Teledyne RD Instruments 75 kHz / 300 kHz Workhorse Long Ranger ADCP',
    material: 'AISI 316L Marine Stainless Steel / Grade 5 Titanium Load Cage with Neoprene Vibration Gaskets & Polyurethane Transducer Face',
    depthRating: '20m – 30m Deployment Depth (Rated to 1,500m hydrostatic pressure)',
    dimensionsOrMass: 'Cage: 1.25m height, 0.45m width; Canister: 0.18m diameter; ~65 kg in air',
    mblOrAccuracy: 'Current Speed Accuracy: ±0.5% ±0.5 cm/s; Direction Accuracy: ±2°',
    purpose: 'Measures continuous vertical profiles of ocean current speed and direction (u, v, w velocity vectors) throughout the upper 500m water column using 4-beam Janus acoustic Doppler frequency shifts. The structural load cage isolates the delicate pressure housing from mooring tension.',
    specSource: 'Teledyne Marine / NIOT Ocean Observation Network Technical Manual',
    color: '#0284c7',
    badge: 'ACOUSTIC CURRENT PROFILING',
  },

  inductive_cable: {
    id: 'inductive_cable',
    diagramLabel: 'Inductive cable (500m)',
    actualName: '500m Armored Electromechanical Inductive Mooring Wire Rope',
    equipmentModel: 'Torque-Balanced 3x19 Jacketed Oceanographic Inductive Wire Rope',
    material: 'Torque-Balanced 3x19 Galvanized Improved Plow Steel (IPS) Wire Rope Jacketed in High-Density Polyethylene (HDPE)',
    depthRating: '0 to 500m Continuous Upper Mooring Riser',
    dimensionsOrMass: '11.0 mm steel core OD, 14.0 mm jacketed OD; 500 meters continuous; ~0.82 kg/m',
    mblOrAccuracy: 'Minimum Breaking Load (MBL) = 165 kN; Fish-bite resistant jacket',
    purpose: 'Serves dual purpose as primary mechanical tension riser and underwater single-conductor inductive telemetry transmission line. Sea-Bird Inductive Modem System (SIM) couples 4800-baud FSK digital telemetry along the insulated steel core, using seawater as ground return.',
    specSource: 'Sea-Bird Scientific Inductive Modem Protocol / NIOT Venkatesan et al., 2016',
    color: '#38bdf8',
    badge: 'INDUCTIVE TELEMETRY & TENSION',
  },

  ct_sensor: {
    id: 'ct_sensor',
    diagramLabel: 'CT Sensors (x9)',
    actualName: 'Clamped Inductive Oceanographic CT Sensor Pods (MicroCATs)',
    equipmentModel: 'Sea-Bird Scientific SBE 37-IM / SBE 39-IM MicroCAT Inductive Recorders (9 Units)',
    material: 'Grade 2 Titanium Pressure Housing (7,000m rating) with Delrin Split Clamping Brackets & Toroidal Ferrite Induction Core',
    depthRating: 'Clamped at 5m, 10m, 15m, 20m, 30m, 50m, 75m, 100m, and 200m depth',
    dimensionsOrMass: 'Length 400 mm, OD 48 mm; Weight ~3.2 kg (air) / 2.0 kg (water)',
    mblOrAccuracy: 'Conductivity: ±0.0003 S/m; Temperature: ±0.002 °C; Stability: 0.0002 °C/month',
    purpose: 'Records high-precision ocean temperature and salinity stratifications throughout the upper sunlit mixed layer. Clamped inductively onto the cable without puncturing the insulation jacket, transmitting real-time hydrographic data to the surface buoy for monsoon and cyclone forecasting.',
    specSource: 'Sea-Bird Scientific SBE 37-IM / Simi Mathew et al., 2016 Validation Study',
    color: '#38bdf8',
    badge: 'CTD TIME-SERIES SAMPLING',
  },

  ctd_sensor: {
    id: 'ctd_sensor',
    diagramLabel: 'CTD Sensor',
    actualName: 'Deep Inductive CTD Unit with Integral Pressure Sensor',
    equipmentModel: 'Sea-Bird Scientific SBE 37-IMP MicroCAT CTD with Internal Strain Gauge Pressure Sensor',
    material: 'Grade 2 Titanium Pressure Canister, Hastelloy-C Pressure Diaphragm, Platinum Resistance Thermometer (RTD)',
    depthRating: '500m Nominal Deployment Base (Canister rated to 7,000 dbar / 7,000m)',
    dimensionsOrMass: 'Length 480 mm, OD 48 mm; Weight ~4.1 kg (air) / 2.6 kg (water)',
    mblOrAccuracy: 'Conductivity: ±0.0003 S/m; Temperature: ±0.002 °C; Pressure: ±0.1% full scale',
    purpose: 'Terminates the bottom of the 500m inductive cable array; records benchmark hydrostatic pressure, conductivity, and temperature at the 500m pycnocline boundary layer before the mooring transitions into the compliant synthetic rope loop.',
    specSource: 'Indian Journal of Geo-Marine Sciences (Mathew, Venkatesan et al., 2016)',
    color: '#06b6d4',
    badge: 'REFERENCE HYDROSTATIC CTD',
  },

  nylon_rope: {
    id: 'nylon_rope',
    diagramLabel: 'Nylon rope',
    actualName: 'Compliant Elastic Nylon Mooring S-Tether',
    equipmentModel: '8-Strand Plaited High-Tenacity Polyamide (Nylon 6.6) Oceanographic Rope',
    material: '100% Virgin High-Tenacity Polyamide (Nylon 6.6) Multi-Filament Fiber',
    depthRating: 'Mid-Water Water Column (500m to 1,200m depth)',
    dimensionsOrMass: '24 mm – 28 mm diameter, specific gravity 1.14 (sinks in seawater); ~0.42 kg/m',
    mblOrAccuracy: 'Breaking Strength: 140 – 175 kN; Elongation: 25% – 30% at break',
    purpose: 'Forms the compliant sagging U-bend of the inverse-catenary S-loop. Its high dynamic elasticity acts as a hydraulic spring that absorbs buoy wave heave, preventing peak shock loads from dislodging the bottom anchor in violent monsoon seas.',
    specSource: 'NIOT Deep-Sea Mooring Deployment Specification (Kaliyaperumal et al., 2019)',
    color: '#0ea5e9',
    badge: 'DYNAMIC COMPLIANCE & S-LOOP',
  },

  trawl_float: {
    id: 'trawl_float',
    diagramLabel: 'Trawlfloat in net',
    actualName: 'Subsurface Buoyancy Cluster (Netted Trawl Floats)',
    equipmentModel: 'Euro-Float / JFC Deep-Water Plastic Trawl Floats in Knotted Net Sleeve (6x Cluster)',
    material: 'High-Impact Copolymer Polypropylene / Polycarbonate Hollow Spheres in UV-Stabilized Diamond Polyamide Netting',
    depthRating: 'Mid-Water Column Apex (Nominal 600m depth; rated to 1,500m)',
    dimensionsOrMass: '6x 250mm diameter spheres; Stack length ~1.35m; Weight ~18 kg in air',
    mblOrAccuracy: 'Net Positive Buoyancy Lift = +150 to +180 kg (+1,470 N to +1,765 N)',
    purpose: 'Provides continuous net positive upward buoyancy at the apex junction between the sinking Nylon rope and the floating Polypropylene rope. Maintains the upward crest of the inverse-catenary S-curve so the line never collapses or chafes during slack-water current reversals.',
    specSource: 'NIOT OMNI Mooring Architecture / Schematic Diagram of OMNI Buoy',
    color: '#f43f5e',
    badge: 'INVERSE-CATENARY BUOYANCY',
  },

  polypropylene_rope: {
    id: 'polypropylene_rope',
    diagramLabel: 'Polypropylene rope',
    actualName: 'Deep Positively Buoyant Synthetic Mooring Tether',
    equipmentModel: '8-Strand Plaited Polypropylene (PP) / Polyolefin Copolymer Rope',
    material: '100% Virgin Polypropylene / Polyolefin Copolymer Synthetic Fiber',
    depthRating: 'Deep Abyssal Water Column (600m to 2,800m depth)',
    dimensionsOrMass: '26 mm – 30 mm diameter, specific gravity ~0.91 (positively buoyant in seawater); ~0.38 kg/m',
    mblOrAccuracy: 'Breaking Strength: 185 – 220 kN; Low creep, rot-proof',
    purpose: 'Positively buoyant deep tether rises toward the surface, keeping thousands of meters of synthetic line permanently suspended in the water column so it can never touch, drag, or abrade against jagged benthic seafloor rocks and sediments.',
    specSource: 'WHOI Mooring Design Guidelines & NIOT Deep-Sea Standards',
    color: '#0284c7',
    badge: 'POSITIVE BUOYANCY TETHER',
  },

  glass_spheres: {
    id: 'glass_spheres',
    diagramLabel: 'Glass spheres',
    actualName: 'Subsurface Borosilicate Glass Buoyancy Spheres',
    equipmentModel: 'Benthos / Nautilus 17-Inch Deep-Sea Glass Flotation Spheres (3x Cluster)',
    material: 'Low-Expansion Borosilicate Glass (12.7mm wall thickness) housed in High-Density Polyethylene (HDPE) Ribbed Yellow Hardhats',
    depthRating: 'Deep Sea / Abyssal Plain (Rated to 6,700m hydrostatic pressure / 67 MPa)',
    dimensionsOrMass: '17" (432 mm) outer diameter per sphere; ~17.5 kg air weight each',
    mblOrAccuracy: 'Net Positive Buoyancy = +25.5 kg per sphere (+76.5 kg total cluster lift)',
    purpose: 'Provides vital recovery flotation directly above the acoustic release. When the release drop hook disconnects from the clump anchor during recovery operations, these glass spheres swiftly haul the entire mooring line and instrumentation array to the surface for shipboard retrieval.',
    specSource: 'Teledyne Benthos Deep-Sea Glass Flotation Specifications',
    color: '#eab308',
    badge: 'RECOVERY BUOYANCY FLOTATION',
  },

  acoustic_release: {
    id: 'acoustic_release',
    diagramLabel: 'Acoustic release',
    actualName: 'Dual Deep-Water Acoustic Release Transponder',
    equipmentModel: 'EdgeTech 8242XS / Benthos 866-A Dual Acoustic Release Transponder',
    material: 'Hard-Anodized 7075-T6 Aluminum / Grade 5 Titanium Alloy Pressure Canister with Solenoid-Activated Drop Hook & Zinc Anodes',
    depthRating: 'Seabed Deployment (Rated to 6,000m depth / 60 MPa)',
    dimensionsOrMass: 'Length 0.85m, OD 0.17m; Weight ~32 kg (air) / 21 kg (water)',
    mblOrAccuracy: 'Release Load Rating: 25 kN release load; 52 kN through-tension rating; 2-year battery life',
    purpose: 'Secures the entire mooring to the seabed clump anchor. Upon receiving encrypted, frequency-shift-keyed (FSK) acoustic commands from the oceanographic research vessel overhead, the internal solenoid triggers the release drop hook, releasing the anchor and allowing the buoy line to float to the surface.',
    specSource: 'EdgeTech Underwater Acoustic Release Specifications / NIOT Manual',
    color: '#7c3aed',
    badge: 'ACOUSTIC RECOVERY TRIGGER',
  },

  ground_chain: {
    id: 'ground_chain',
    diagramLabel: 'Chain',
    actualName: 'Heavy Forged Alloy Steel Ground Chain',
    equipmentModel: 'Grade 2 / Grade 3 Stud-Link Alloy Anchor Chain with Heavy Forged Safety Shackles',
    material: 'Grade 2 / Grade 3 Forged Alloy Steel, Hot-Dip Galvanized (HDG, min 85µm zinc coating)',
    depthRating: 'Benthic Boundary Layer (Seabed Floor to -17m depth)',
    dimensionsOrMass: '26 mm – 32 mm bar diameter; Submerged weight ~125 N/m; Length 10m – 30m',
    mblOrAccuracy: 'Minimum Breaking Load (MBL) = 520 kN',
    purpose: 'Directly connects the acoustic release drop link to the seabed clump dead weight. Its heavy dead weight keeps the acoustic release transducer pointed vertically toward the ocean surface and provides extreme mechanical abrasion resistance against seafloor scour and shifting sediments.',
    specSource: 'NIOT Deep-Sea Deployment Specification (Kaliyaperumal et al., 2019)',
    color: '#64748b',
    badge: 'BENTHIC ABRASION RESISTANCE',
  },

  bottom_weight: {
    id: 'bottom_weight',
    diagramLabel: 'Bottom weight',
    actualName: '2,000 kg (2-Tonne) Segmented Clump Anchor Dead Weight',
    equipmentModel: 'NIOT 2,000 kg Cast-Iron Sinker Clump Anchor Block with Clamping Bands & Tie-Rods',
    material: 'Cast-Iron Ballast Plates (Grade G25) / Cast Steel Sinker Disks bound with Structural Steel Clamping Bands & High-Tensile Tie-Rods',
    depthRating: 'Benthic Substrate / Abyssal Seabed (2,500m to 4,000m depth)',
    dimensionsOrMass: '2,000 kg total air weight (~1,740 kg submerged anchor holding force); 1.55m diameter, 0.75m height',
    mblOrAccuracy: 'Holding Capacity: > 35 kN horizontal holding resistance without drag in storm sea states',
    purpose: 'Permanent gravity deadweight anchor resting on the ocean floor. Provides high negative buoyancy and friction against benthic sediment, permanently holding the ocean data buoy on station within its calculated watch circle radius against strong monsoonal surface currents and 10m+ rogue waves.',
    specSource: 'NIOT OMNI Deep-Sea Mooring Deployment Specification (WA0005.jpg / WA0007.jpg)',
    color: '#9a3412',
    badge: 'SEABED DEADWEIGHT ANCHOR',
  },
};
