import "server-only";
import { MonitoringStation, RawPollutantReading } from "../types";

/**
 * TECHNICAL INVESTIGATION NOTE — CPCB DATA ACCESSIBILITY:
 * 
 * 1. Direct Public Portal (app.cpcbccr.com / airquality.cpcb.gov.in):
 *    Operated by the Central Pollution Control Board (CPCB), Ministry of Environment,
 *    Forest and Climate Change, Government of India. As of late 2024 / 2026, CPCB does NOT
 *    provide an open, public, documented, CORS-enabled REST API for third-party client
 *    applications. Endpoints are protected by dynamic CSRF tokens, periodic server
 *    downtime during peak smog, and CAPTCHA-gated portal requests.
 * 
 * 2. Official Open Government Data Platform (data.gov.in):
 *    CPCB publishes the "Real time Air Quality Index" catalog on data.gov.in requiring
 *    an individual API key. However, API feeds suffer from 1 to 4 hour publishing delays
 *    and frequent upstream pipe maintenance.
 * 
 * 3. Institutional Ingestion:
 *    Global open repositories (such as OpenAQ v3) ingest official CPCB CAAQMS stations
 *    via authorized backend pipelines.
 * 
 * ARCHITECTURAL RULE:
 * SaansAI never invents endpoints or fabricates live CPCB telemetry. If a direct CPCB
 * connection is unavailable, this adapter cleanly documents the constraint and yields
 * to the verified OpenAQ pipeline or calibrated baseline, preserving explicit data provenance.
 */

// Registry of Verified Official CPCB Continuous Ambient Air Quality Monitoring Stations (CAAQMS)
export const VERIFIED_CPCB_STATIONS: MonitoringStation[] = [
  // Delhi-NCR
  {
    id: "DL001_ANAND_VIHAR",
    name: "Anand Vihar, Delhi - DPCC",
    city: "New Delhi",
    state: "Delhi",
    country: "IN",
    latitude: 28.6468,
    longitude: 77.3160,
    sourceProvider: "CPCB",
  },
  {
    id: "DL004_MANDIR_MARG",
    name: "Mandir Marg, Delhi - DPCC",
    city: "New Delhi",
    state: "Delhi",
    country: "IN",
    latitude: 28.6365,
    longitude: 77.1997,
    sourceProvider: "CPCB",
  },
  {
    id: "DL007_RK_PURAM",
    name: "R K Puram, Delhi - DPCC",
    city: "New Delhi",
    state: "Delhi",
    country: "IN",
    latitude: 28.5633,
    longitude: 77.1869,
    sourceProvider: "CPCB",
  },
  {
    id: "DL012_PUNJABI_BAGH",
    name: "Punjabi Bagh, Delhi - DPCC",
    city: "New Delhi",
    state: "Delhi",
    country: "IN",
    latitude: 28.6740,
    longitude: 77.1310,
    sourceProvider: "CPCB",
  },
  {
    id: "DL018_DWARKA_SEC8",
    name: "Dwarka-Sector 8, Delhi - DPCC",
    city: "New Delhi",
    state: "Delhi",
    country: "IN",
    latitude: 28.5710,
    longitude: 77.0719,
    sourceProvider: "CPCB",
  },
  // Mumbai
  {
    id: "MH004_BKC_MUMBAI",
    name: "Bandra Kurla Complex, Mumbai - MPCB",
    city: "Mumbai",
    state: "Maharashtra",
    country: "IN",
    latitude: 19.0657,
    longitude: 72.8687,
    sourceProvider: "CPCB",
  },
  {
    id: "MH001_WORLI",
    name: "Worli, Mumbai - MPCB",
    city: "Mumbai",
    state: "Maharashtra",
    country: "IN",
    latitude: 19.0178,
    longitude: 72.8183,
    sourceProvider: "CPCB",
  },
  {
    id: "MH003_COLABA",
    name: "Colaba, Mumbai - MPCB",
    city: "Mumbai",
    state: "Maharashtra",
    country: "IN",
    latitude: 18.9067,
    longitude: 72.8147,
    sourceProvider: "CPCB",
  },
  // Bengaluru
  {
    id: "KA001_BTM_LAYOUT",
    name: "BTM Layout, Bengaluru - KSPCB",
    city: "Bengaluru",
    state: "Karnataka",
    country: "IN",
    latitude: 12.9135,
    longitude: 77.6101,
    sourceProvider: "CPCB",
  },
  // Kolkata
  {
    id: "WB001_VICTORIA",
    name: "Victoria Memorial, Kolkata - WBPCB",
    city: "Kolkata",
    state: "West Bengal",
    country: "IN",
    latitude: 22.5448,
    longitude: 88.3426,
    sourceProvider: "CPCB",
  },
  // Pune
  {
    id: "MH010_SHIVAJI_NAGAR",
    name: "Shivaji Nagar, Pune - MPCB",
    city: "Pune",
    state: "Maharashtra",
    country: "IN",
    latitude: 18.5314,
    longitude: 73.8446,
    sourceProvider: "CPCB",
  },
  // Lucknow
  {
    id: "UP001_LALBAGH",
    name: "Lalbagh, Lucknow - UPPCB",
    city: "Lucknow",
    state: "Uttar Pradesh",
    country: "IN",
    latitude: 26.8467,
    longitude: 80.9462,
    sourceProvider: "CPCB",
  },
];

/**
 * Calculates Great-Circle distance using Haversine formula (km).
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Finds nearby certified CPCB CAAQMS stations sorted by proximity.
 * If no coordinates are passed, returns all verified stations.
 */
export function getNearbyCPCBStations(
  latitude?: number,
  longitude?: number,
  radiusKm: number = 50
): MonitoringStation[] {
  if (latitude === undefined || longitude === undefined) {
    return VERIFIED_CPCB_STATIONS;
  }

  return VERIFIED_CPCB_STATIONS.map((station) => ({
    ...station,
    distanceKm: calculateHaversineDistanceKm(latitude, longitude, station.latitude, station.longitude),
  }))
    .filter((station) => (station.distanceKm ?? 999) <= radiusKm)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

/**
 * CPCB Direct Ingestion Adapter.
 * Currently documents absence of direct CORS REST API.
 * Returns null to safely allow pipeline to use OpenAQ or calibrated regional dataset.
 */
export async function fetchDirectCPCBData(
  stationId: string
): Promise<{
  station: MonitoringStation;
  readings: RawPollutantReading[];
} | null> {
  // Check if station exists in verified registry
  const station = VERIFIED_CPCB_STATIONS.find(
    (s) => s.id.toLowerCase() === stationId.toLowerCase()
  );

  if (!station) {
    return null;
  }

  // Direct CPCB CAAQMS API access is restricted/undocumented.
  // Return null so caller utilizes OpenAQ v3 or calibrated fallback without faking data.
  return null;
}
