import { CalculatedRoute } from "../types";

export const CURATED_COMMUTE_CORRIDORS: Record<string, CalculatedRoute> = {
  "delhi_anand_vihar_to_cp": {
    id: "delhi_anand_vihar_to_cp",
    name: "Anand Vihar to Connaught Place",
    summary: "via Vikas Marg & ITO Expressway",
    origin: {
      lat: 28.6468,
      lon: 77.3160,
      name: "Anand Vihar ISBT",
    },
    destination: {
      lat: 28.6315,
      lon: 77.2167,
      name: "Connaught Place",
    },
    distanceKm: 12.8,
    durationMinutes: 34,
    mode: "driving",
    geometry: [
      [28.6468, 77.3160],
      [28.6445, 77.3052],
      [28.6412, 77.2915],
      [28.6385, 77.2798], // Nirman Vihar
      [28.6358, 77.2680], // Preet Vihar / Shakarpur
      [28.6322, 77.2515], // Laxmi Nagar Vikas Marg
      [28.6300, 77.2450], // ITO Yamuna Bridge
      [28.6292, 77.2395], // ITO Intersection / DPCC
      [28.6305, 77.2285], // Deen Dayal Upadhyay Marg
      [28.6315, 77.2167], // Connaught Place Inner Circle
    ],
    segments: [
      {
        index: 0,
        start: { lat: 28.6468, lon: 77.3160, name: "Anand Vihar ISBT" },
        end: { lat: 28.6385, lon: 77.2798, name: "Nirman Vihar" },
        distanceMeters: 3800,
        durationSeconds: 600,
        roadName: "Vikas Marg East",
        instruction: "Head west on Vikas Marg past Anand Vihar flyover.",
      },
      {
        index: 1,
        start: { lat: 28.6385, lon: 77.2798, name: "Nirman Vihar" },
        end: { lat: 28.6300, lon: 77.2450, name: "ITO Bridge" },
        distanceMeters: 4200,
        durationSeconds: 720,
        roadName: "Vikas Marg Arterial",
        instruction: "Continue over Yamuna River crossing into Central Delhi.",
      },
      {
        index: 2,
        start: { lat: 28.6300, lon: 77.2450, name: "ITO Bridge" },
        end: { lat: 28.6315, lon: 77.2167, name: "Connaught Place" },
        distanceMeters: 4800,
        durationSeconds: 720,
        roadName: "DDU Marg & Outer Circle",
        instruction: "Proceed straight along DDU Marg to Connaught Place.",
      },
    ],
    provider: "Curated_Corridor",
    isEstimated: false,
    trafficAware: false,
  },

  "indirapuram_to_noida_sec62": {
    id: "indirapuram_to_noida_sec62",
    name: "Indirapuram to Noida Sector 62",
    summary: "via NH-24 Expressway & CISF Road",
    origin: {
      lat: 28.6415,
      lon: 77.3712,
      name: "Indirapuram, Ghaziabad",
    },
    destination: {
      lat: 28.6258,
      lon: 77.3628,
      name: "Noida Sector 62",
    },
    distanceKm: 5.6,
    durationMinutes: 16,
    mode: "driving",
    geometry: [
      [28.6415, 77.3712],
      [28.6385, 77.3700],
      [28.6342, 77.3675],
      [28.6310, 77.3650], // NH-24 underpass
      [28.6285, 77.3640], // Fortis Hospital cut
      [28.6258, 77.3628], // Electronic City Sec 62
    ],
    segments: [
      {
        index: 0,
        start: { lat: 28.6415, lon: 77.3712, name: "Indirapuram" },
        end: { lat: 28.6310, lon: 77.3650, name: "NH-24 Flyover" },
        distanceMeters: 2800,
        durationSeconds: 480,
        roadName: "Kala Patthar / CISF Road",
        instruction: "Depart south towards Delhi-Meerut Expressway.",
      },
      {
        index: 1,
        start: { lat: 28.6310, lon: 77.3650, name: "NH-24 Flyover" },
        end: { lat: 28.6258, lon: 77.3628, name: "Noida Sector 62" },
        distanceMeters: 2800,
        durationSeconds: 480,
        roadName: "Noida Sector 62 Main Road",
        instruction: "Cross expressway into Noida Institutional Area.",
      },
    ],
    provider: "Curated_Corridor",
    isEstimated: false,
    trafficAware: false,
  },

  "gurgaon_cyber_city_to_south_delhi": {
    id: "gurgaon_cyber_city_to_south_delhi",
    name: "Gurgaon Cyber City to Hauz Khas / IIT",
    summary: "via MG Road & Mehrauli Arterial",
    origin: {
      lat: 28.4952,
      lon: 77.0895,
      name: "DLF Cyber City, Gurgaon",
    },
    destination: {
      lat: 28.5494,
      lon: 77.1994,
      name: "Hauz Khas / IIT Delhi",
    },
    distanceKm: 17.5,
    durationMinutes: 42,
    mode: "driving",
    geometry: [
      [28.4952, 77.0895], // Cyber City
      [28.4875, 77.0980], // Sikanderpur Metro
      [28.4820, 77.1190], // Guru Dronacharya
      [28.4910, 77.1350], // Arjan Garh Border
      [28.5120, 77.1650], // Chhatarpur Metro
      [28.5280, 77.1820], // Qutub Minar
      [28.5420, 77.1940], // Aurobindo Marg
      [28.5494, 77.1994], // IIT Delhi Flyover
    ],
    segments: [
      {
        index: 0,
        start: { lat: 28.4952, lon: 77.0895, name: "Cyber City" },
        end: { lat: 28.4910, lon: 77.1350, name: "Delhi Border" },
        distanceMeters: 6500,
        durationSeconds: 900,
        roadName: "MG Road Gurgaon",
        instruction: "Take MG Road eastbound through Haryana-Delhi checkpost.",
      },
      {
        index: 1,
        start: { lat: 28.4910, lon: 77.1350, name: "Delhi Border" },
        end: { lat: 28.5494, lon: 77.1994, name: "Hauz Khas IIT" },
        distanceMeters: 11000,
        durationSeconds: 1620,
        roadName: "Aurobindo Marg South",
        instruction: "Follow Aurobindo Marg past Qutub Minar to IIT Flyover.",
      },
    ],
    provider: "Curated_Corridor",
    isEstimated: false,
    trafficAware: false,
  },

  "mumbai_bandra_to_nariman_point": {
    id: "mumbai_bandra_to_nariman_point",
    name: "Bandra West to Nariman Point",
    summary: "via Bandra-Worli Sea Link & Marine Drive",
    origin: {
      lat: 19.0596,
      lon: 72.8295,
      name: "Bandra West, Mumbai",
    },
    destination: {
      lat: 18.9256,
      lon: 72.8242,
      name: "Nariman Point, Mumbai",
    },
    distanceKm: 18.4,
    durationMinutes: 38,
    mode: "driving",
    geometry: [
      [19.0596, 72.8295], // Bandra Bandstand
      [19.0380, 72.8250], // Sea Link Entry
      [19.0150, 72.8160], // Sea Link Cable-Stayed Section
      [18.9950, 72.8120], // Worli Seaface
      [18.9780, 72.8090], // Haji Ali
      [18.9550, 72.8060], // Breach Candy / Coastal Road
      [18.9380, 72.8200], // Marine Drive Promenade
      [18.9256, 72.8242], // Nariman Point
    ],
    segments: [
      {
        index: 0,
        start: { lat: 19.0596, lon: 72.8295, name: "Bandra" },
        end: { lat: 18.9950, lon: 72.8120, name: "Worli" },
        distanceMeters: 7800,
        durationSeconds: 660,
        roadName: "Bandra-Worli Sea Link",
        instruction: "Cross Mahim Bay via Bandra-Worli Sea Link.",
      },
      {
        index: 1,
        start: { lat: 18.9950, lon: 72.8120, name: "Worli" },
        end: { lat: 18.9256, lon: 72.8242, name: "Nariman Point" },
        distanceMeters: 10600,
        durationSeconds: 1620,
        roadName: "Marine Drive Coastal Corridor",
        instruction: "Follow western shoreline south to Nariman Point.",
      },
    ],
    provider: "Curated_Corridor",
    isEstimated: false,
    trafficAware: false,
  },
};
