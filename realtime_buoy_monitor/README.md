# Real-Time OMNI Buoy Telemetry Monitor

Real-time meteorological and oceanographic data pulled directly from the **Ocean Moored Buoy Network in the Northern Indian Ocean (OMNI)** operated jointly by the **National Institute of Ocean Technology (NIOT)** and the **Indian National Centre for Ocean Information Services (INCOIS)**, Ministry of Earth Sciences (MoES), Government of India.

---

## 📁 Folder Structure

```
d:\ocean\moore\realtime_buoy_monitor\
├── index.html           # Live interactive glassmorphism dashboard (Open directly in any browser)
├── buoy_data.json       # Structured JSON of all 12 buoys, latest readings, and 24-epoch history
├── fetch_live_data.py   # Standalone Python script to pull fresh live data from INCOIS anytime
└── README.md            # Complete data dictionary, methodology, and station guide
```

---

## ⏱️ Harvest & Telemetry Timestamps

- **Last Telemetry Harvest Time**: `2026-10-15 08:00:13 UTC` (13:30:13 IST)
- **Active Transmitting Stations Today**: **9 out of 12 buoys**
- **Latest Physical Observation Epoch**: `2026-10-15T06:00:00+00:00` (11:30 AM IST today)
  - Stations reporting today (`2026-10-15`): `OMNI-BD08`, `OMNI-BD10`, `OMNI-BD11`, `OMNI-BD12`, `OMNI-BD13`, `OMNI-BD14`, `OMNI-AD08`, `OMNI-AD09`, `OMNI-AD10`.
  - Station `OMNI-AD07`: `2026-10-13T09:00:00+00:00` (Recent, 48h).
  - Station `OMNI-AD06`: `2026-06-06T21:00:00+00:00` (Seasonal maintenance/delayed).
  - Station `OMNI-BD09`: `2025-07-24T00:00:00+00:00` (Historical baseline/offline).

---

## 📊 The Actual Data Being Pulled: What Are They?

Each moored buoy is a deep-sea oceanographic platform equipped with a surface mast, hull electronics, and an underwater mooring line with inductive sensors down to thousands of meters:

| Parameter Key | Parameter Name | Canonical Unit | Sensor Elevation / Depth | Oceanographic & Meteorological Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `air_temperature` | **Ambient Air Temperature** | `°C` | +3.0 m mast | Measures dry-bulb marine air temperature using an aspirated PRT (Platinum Resistance Thermometer). Used to calculate air-sea temperature gradients and sensible heat flux. |
| `air_pressure` | **Barometric Atmospheric Pressure** | `hPa` (mbar) | Inside hull (+1.5 m) | Reduced to mean sea level. High-accuracy silicon resonance sensor. Critical early-warning indicator for tropical depressions, monsoonal troughs, and cyclones. |
| `hm0` / `significant_wave_height` | **Significant Wave Height** | `m` | Hull waterline | Mean height of the highest third of ocean waves, computed from 3-axis motion accelerometers ($H_{m0} \approx 4\sqrt{m_0}$). Tracks sea state roughness and navigation hazards. |
| `humidity` | **Relative Humidity** | `%` | +3.0 m mast | Capacitive thin-film polymer sensor in solar radiation shield. Combined with air temperature to compute marine boundary layer dew point and latent heat flux. |
| `sst` | **Sea Surface Temperature** | `°C` | -1.0 m bridle | Water temperature just below surface skin. Key driver of ocean heat content (OHC), monsoon convection, and tropical cyclogenesis. |
| `wind_speed` / `wind_direction` | **Surface Wind Velocity** | `m/s`, `°` | +3.0 m mast | Ultrasonic or mechanical anemometer. On certain EEZ stations (e.g. AD09, AD10, BD12), INCOIS public portal classifies wind downloads as `RESTRICTED`. |
| `rainfall` | **Accumulated Precipitation** | `mm` | +3.0 m mast | Optical or siphon rain gauge tracking marine precipitation events. |
| `salinity` | **Surface Salinity** | `PSU` | -1.0 m to -5.0 m | Practical Salinity Units derived from electrical conductivity ($S/m$). |
| `profiles` | **Subsurface Depth Profiles** | `°C`, `PSU` | Down to 500m+ | 10 to 12 CTD (Conductivity, Temperature, Depth) sensors along the taut mooring cable tracking ocean thermocline and internal waves. |

---

## 🗺️ Moored Buoy Stations Directory

### Arabian Sea Basin (5 Stations)
- **`OMNI-AD06`**: Lat 18.50°N, Lon 67.45°E | Central Arabian Sea | Mooring Depth: ~3,200m
- **`OMNI-AD07`**: Lat 15.00°N, Lon 69.00°E | Northern Arabian Sea | Mooring Depth: ~2,800m
- **`OMNI-AD08`**: Lat 12.00°N, Lon 68.50°E | Eastern Arabian Sea | Mooring Depth: ~3,100m
- **`OMNI-AD09`**: Lat 8.25°N, Lon 73.25°E | South-East Arabian Sea (Lakshadweep) | Mooring Depth: ~2,600m
- **`OMNI-AD10`**: Lat 10.33°N, Lon 72.58°E | South-West Arabian Sea | Mooring Depth: ~3,400m

### Bay of Bengal & Andaman Sea (7 Stations)
- **`OMNI-BD08`**: Lat 17.82°N, Lon 89.24°E | Northern Bay of Bengal | Mooring Depth: ~2,200m
- **`OMNI-BD09`**: Lat 17.50°N, Lon 89.13°E | Central Bay of Bengal | Mooring Depth: ~3,100m
- **`OMNI-BD10`**: Lat 16.33°N, Lon 88.00°E | Western Bay of Bengal | Mooring Depth: ~2,900m
- **`OMNI-BD11`**: Lat 14.00°N, Lon 83.00°E | East-Central Bay of Bengal | Mooring Depth: ~3,200m
- **`OMNI-BD12`**: Lat 11.50°N, Lon 92.50°E | Andaman Sea (Port Blair EEZ) | Mooring Depth: ~2,100m
- **`OMNI-BD13`**: Lat 11.00°N, Lon 86.50°E | Southern Bay of Bengal | Mooring Depth: ~3,600m
- **`OMNI-BD14`**: Lat 6.72°N, Lon 88.33°E | South-East Bay of Bengal | Mooring Depth: ~3,700m

---

## 🚀 How to View and Run

### 1. View the Dashboard
Simply double-click or open [index.html](file:///d:/ocean/moore/realtime_buoy_monitor/index.html) in any modern browser (Chrome, Edge, Firefox, Brave). 
- All live data is pre-embedded, so **no web server or internet connection is required** for instant local viewing.
- Features include:
  - Interactive buoy switching
  - Multi-parameter live telemetry cards
  - Dynamic 24-epoch SVG/Canvas trend charts with hover tooltips
  - Interactive Northern Indian Ocean geospatial map with clickable buoy coordinates
  - Comprehensive comparison matrix
  - Raw JSON inspection drawer

### 2. Pull Fresh Updates Live from INCOIS
To re-query INCOIS GeoServer and refresh the data at any time:
```bash
python fetch_live_data.py
```
This updates `buoy_data.json` directly from the live endpoints.

---

## 🛰️ Authoritative Data Provenance
- **Registry Endpoint**: `https://www.incois.gov.in/geoserver/JointPortal/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=JointPortal:Omni_Buoy&outputFormat=application/json`
- **Moored Buoy Data Stock JSP**: `https://www.incois.gov.in/site/datainfo/moored_omnidata_stock.jsp`
- **Data Owner**: INCOIS (Indian National Centre for Ocean Information Services), MoES, Hyderabad, India.
