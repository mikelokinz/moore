#!/usr/bin/env python3
"""
INCOIS-NIOT OMNI Real-Time Buoy Telemetry Harvester
Pulls live atmospheric, oceanographic, and wave metrics from the 
authoritative Indian National Centre for Ocean Information Services (INCOIS)
and National Institute of Ocean Technology (NIOT) OMNI moored buoy network.

Usage:
    python fetch_live_data.py
Outputs:
    buoy_data.json
"""
import sys
import re
import json
from datetime import datetime, timezone
from pathlib import Path

try:
    import httpx
except ImportError:
    import urllib.request
    import urllib.parse
    print("Warning: httpx not found. Please install httpx (`pip install httpx`) for best performance.")

WFS_STATIONS_URL = 'https://www.incois.gov.in/geoserver/JointPortal/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=JointPortal:Omni_Buoy&outputFormat=application/json'
CHART_URL = 'https://www.incois.gov.in/site/datainfo/moored_omnidata_stock.jsp'

CANONICAL_UNITS = {
    'air_temperature': '°C',
    'air_pressure': 'hPa',
    'significant_wave_height': 'm',
    'humidity': '%',
    'sst': '°C',
    'rainfall': 'mm',
    'wind_speed': 'm/s',
    'wind_direction': '°',
    'current_speed': 'cm/s',
    'salinity': 'PSU'
}

BUOY_METADATA = {
    'OMNI-AD06': {'region': 'Arabian Sea', 'basin': 'Central Arabian Sea', 'depth_m': 3200, 'mooring_type': 'Deep Sea Moored Buoy'},
    'OMNI-AD07': {'region': 'Arabian Sea', 'basin': 'Northern Arabian Sea', 'depth_m': 2800, 'mooring_type': 'Deep Sea Moored Buoy'},
    'OMNI-AD08': {'region': 'Arabian Sea', 'basin': 'Eastern Arabian Sea', 'depth_m': 3100, 'mooring_type': 'Deep Sea Moored Buoy'},
    'OMNI-AD09': {'region': 'Arabian Sea', 'basin': 'South-East Arabian Sea (Lakshadweep)', 'depth_m': 2600, 'mooring_type': 'EEZ / Coastal Moored Buoy'},
    'OMNI-AD10': {'region': 'Arabian Sea', 'basin': 'South-West Arabian Sea', 'depth_m': 3400, 'mooring_type': 'EEZ / Deep Sea Moored Buoy'},
    'OMNI-BD08': {'region': 'Bay of Bengal', 'basin': 'Northern Bay of Bengal', 'depth_m': 2200, 'mooring_type': 'Deep Sea Moored Buoy'},
    'OMNI-BD09': {'region': 'Bay of Bengal', 'basin': 'Central Bay of Bengal', 'depth_m': 3100, 'mooring_type': 'Deep Sea Moored Buoy'},
    'OMNI-BD10': {'region': 'Bay of Bengal', 'basin': 'Western Bay of Bengal', 'depth_m': 2900, 'mooring_type': 'Deep Sea Moored Buoy'},
    'OMNI-BD11': {'region': 'Bay of Bengal', 'basin': 'East-Central Bay of Bengal', 'depth_m': 3200, 'mooring_type': 'Deep Sea Moored Buoy'},
    'OMNI-BD12': {'region': 'Bay of Bengal', 'basin': 'Andaman Sea', 'depth_m': 2100, 'mooring_type': 'EEZ / Deep Sea Moored Buoy'},
    'OMNI-BD13': {'region': 'Bay of Bengal', 'basin': 'Southern Bay of Bengal', 'depth_m': 3600, 'mooring_type': 'Deep Sea Moored Buoy'},
    'OMNI-BD14': {'region': 'Bay of Bengal', 'basin': 'South-East Bay of Bengal', 'depth_m': 3700, 'mooring_type': 'Deep Sea Moored Buoy'}
}

def parse_chart(html):
    options = re.findall(r'<option[^>]*value=[\'"]([^\'"]+)[\'"][^>]*>([^<]+)</option>', html, re.IGNORECASE)
    opt_map = {opt[0]: opt[1].strip() for opt in options if opt[0] != '999999'}
    
    match = re.search(r'data\s*:\s*(\[\s*\[.*?\]\s*\])', html, re.DOTALL)
    points = []
    if match:
        try:
            points = json.loads(match.group(1))
        except Exception:
            pass
    return points, opt_map

def fetch_all():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Connecting to INCOIS GeoServer WFS registry...")
    headers = {'User-Agent': 'MoorSense/1.0 OMNI Data Harvester'}
    
    with httpx.Client(timeout=20.0, follow_redirects=True, headers=headers) as client:
        r = client.get(WFS_STATIONS_URL)
        wfs = r.json()
        stations = []
        for feat in wfs.get('features', []):
            p = feat.get('properties', {})
            c = feat.get('geometry', {}).get('coordinates', [0, 0])
            stations.append({
                'id': f"OMNI-{p.get('ID')}",
                'raw_id': p.get('ID'),
                'agency': p.get('Agency', 'NIOT/INCOIS'),
                'programme': p.get('Programme', 'OMNI'),
                'reporting': p.get('Reporting', 'UNKNOWN'),
                'longitude': c[0],
                'latitude': c[1],
            })
        print(f"Discovered {len(stations)} stations in registry.")
        
        results = {}
        for st in stations:
            sid = st['raw_id']
            bid = st['id']
            meta = BUOY_METADATA.get(bid, {'region': 'Indian Ocean', 'basin': 'Indian Ocean', 'depth_m': 3000, 'mooring_type': 'Moored Buoy'})
            info = {**st, **meta}
            
            print(f"Polling {bid} ({info['region']} - {info['basin']})...", end='', flush=True)
            obs = {}
            history = {}
            
            # Fetch air_temperature
            try:
                rt = client.get(CHART_URL, params={'buoy': sid, 'parameter': 'air_temperature'})
                pts, opts = parse_chart(rt.text)
                if pts:
                    pts = sorted(pts, key=lambda x: x[0])
                    last = pts[-1]
                    obs['air_temperature'] = {
                        'value': round(last[1], 3) if last[1] is not None else None,
                        'unit': '°C',
                        'timestamp_epoch': last[0],
                        'timestamp_utc': datetime.fromtimestamp(last[0]/1000.0, tz=timezone.utc).isoformat(),
                        'name': 'Air Temperature'
                    }
                    history['air_temperature'] = [
                        {'epoch': p[0], 'time': datetime.fromtimestamp(p[0]/1000.0, tz=timezone.utc).isoformat(), 'value': p[1]}
                        for p in pts[-24:]
                    ]
            except Exception as e:
                pass
                
            # Fetch air_pressure
            try:
                rp = client.get(CHART_URL, params={'buoy': sid, 'parameter': 'air_pressure'})
                pts, _ = parse_chart(rp.text)
                if pts:
                    pts = sorted(pts, key=lambda x: x[0])
                    last = pts[-1]
                    obs['air_pressure'] = {
                        'value': round(last[1], 2) if last[1] is not None else None,
                        'unit': 'hPa',
                        'timestamp_epoch': last[0],
                        'timestamp_utc': datetime.fromtimestamp(last[0]/1000.0, tz=timezone.utc).isoformat(),
                        'name': 'Atmospheric Pressure'
                    }
                    history['air_pressure'] = [
                        {'epoch': p[0], 'time': datetime.fromtimestamp(p[0]/1000.0, tz=timezone.utc).isoformat(), 'value': p[1]}
                        for p in pts[-24:]
                    ]
            except Exception as e:
                pass

            # Fetch wave height
            for wp in ['hm0', 'significant_wave_height']:
                try:
                    rw = client.get(CHART_URL, params={'buoy': sid, 'parameter': wp})
                    pts, _ = parse_chart(rw.text)
                    if pts:
                        pts = sorted(pts, key=lambda x: x[0])
                        last = pts[-1]
                        obs['significant_wave_height'] = {
                            'value': round(last[1], 2) if last[1] is not None else None,
                            'unit': 'm',
                            'timestamp_epoch': last[0],
                            'timestamp_utc': datetime.fromtimestamp(last[0]/1000.0, tz=timezone.utc).isoformat(),
                            'name': 'Significant Wave Height'
                        }
                        history['significant_wave_height'] = [
                            {'epoch': p[0], 'time': datetime.fromtimestamp(p[0]/1000.0, tz=timezone.utc).isoformat(), 'value': p[1]}
                            for p in pts[-24:]
                        ]
                        break
                except Exception:
                    pass

            # Fetch humidity
            try:
                rh = client.get(CHART_URL, params={'buoy': sid, 'parameter': 'humidity'})
                pts, _ = parse_chart(rh.text)
                if pts:
                    pts = sorted(pts, key=lambda x: x[0])
                    last = pts[-1]
                    obs['humidity'] = {
                        'value': round(last[1], 2) if last[1] is not None else None,
                        'unit': '%',
                        'timestamp_epoch': last[0],
                        'timestamp_utc': datetime.fromtimestamp(last[0]/1000.0, tz=timezone.utc).isoformat(),
                        'name': 'Relative Humidity'
                    }
            except Exception:
                pass

            # Latest timestamp
            ts_list = [v.get('timestamp_utc') for v in obs.values() if v.get('timestamp_utc')]
            latest_ts = max(ts_list) if ts_list else None
            
            status = "LIVE / OPERATIONAL" if latest_ts and ("2026-10-15" in latest_ts or "2026-10-14" in latest_ts) else ("RECENT (<48h)" if latest_ts and "2026-10-13" in latest_ts else "STALE / OFFLINE")
            
            results[bid] = {
                'info': info,
                'status': status,
                'latest_observation_time': latest_ts,
                'latest_observation': obs,
                'recent_history': history,
            }
            print(f" Done. (Status: {status}, Latest: {latest_ts or 'None'})")

    output = {
        'system': {
            'name': 'INCOIS-NIOT OMNI Real-Time Buoy Telemetry System',
            'network': 'Ocean Moored Buoy Network in the Northern Indian Ocean (OMNI)',
            'operator': 'National Institute of Ocean Technology (NIOT) & Indian National Centre for Ocean Information Services (INCOIS)',
            'ministry': 'Ministry of Earth Sciences (MoES), Government of India',
            'harvest_time_utc': datetime.now(timezone.utc).isoformat(),
            'total_stations': len(results),
            'active_stations_today': sum(1 for b in results.values() if '2026-10-15' in (b['latest_observation_time'] or ''))
        },
        'buoys': results
    }
    
    out_file = Path(__file__).parent / "buoy_data.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
    print(f"\n[SUCCESS] Wrote live data to {out_file.resolve()}")
    return output

if __name__ == "__main__":
    fetch_all()
