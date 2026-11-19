export interface PollutantDetail {
  code: string;
  name: string;
  value: number;
  unit: string;
  subIndex: number;
  category: "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";
  averagingPeriod: string;
  standardBenchmark: string;
}

export interface ScenarioData {
  id: "delhi-anand-vihar" | "mumbai-bandra";
  locationName: string;
  city: string;
  stationName: string;
  stationId: string;
  aqi: number;
  category: "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";
  dominantPollutant: string;
  hisi: number; // Hourly Instantaneous Smog Indicator
  weather: {
    tempC: number;
    humidity: number;
    windSpeedKmh: number;
    windDirection: string;
    boundaryLayerMeters: number;
    inversionActive: boolean;
  };
  provenance: {
    badgeText: string;
    source: string;
    freshness: string;
    confidenceScore: number;
  };
  pollutants: PollutantDetail[];
  diurnalCurve: { hour: string; aqi: number; inversionRisk: "Low" | "Medium" | "High" }[];
  routineRecommendation: {
    safeOutdoorWindow: string;
    peakStagnationWindow: string;
    commuteAdvice: string;
    pediatricAdvice: string;
    geriatricAdvice: string;
  };
}

export const MOCK_SCENARIOS: Record<string, ScenarioData> = {
  "delhi-anand-vihar": {
    id: "delhi-anand-vihar",
    locationName: "Anand Vihar, East Delhi",
    city: "New Delhi",
    stationName: "Anand Vihar CAAQMS (DPCC)",
    stationId: "DL001_ANAND_VIHAR",
    aqi: 482,
    category: "Severe",
    dominantPollutant: "PM2.5",
    hisi: 495,
    weather: {
      tempC: 14.5,
      humidity: 88,
      windSpeedKmh: 2.4,
      windDirection: "NW",
      boundaryLayerMeters: 180,
      inversionActive: true,
    },
    provenance: {
      badgeText: "DEMO SCENARIO: Severe Winter Smog Simulation",
      source: "CPCB / DPCC Calibrated Reference Data",
      freshness: "Simulated 07:30 IST Snapshot",
      confidenceScore: 0.95,
    },
    pollutants: [
      {
        code: "PM2.5",
        name: "Fine Particulate Matter",
        value: 388.4,
        unit: "µg/m³",
        subIndex: 482,
        category: "Severe",
        averagingPeriod: "24-hr valid (18 hrs recorded)",
        standardBenchmark: "CPCB: 60 µg/m³",
      },
      {
        code: "PM10",
        name: "Coarse Particulate Matter",
        value: 512.0,
        unit: "µg/m³",
        subIndex: 468,
        category: "Severe",
        averagingPeriod: "24-hr valid (19 hrs recorded)",
        standardBenchmark: "CPCB: 100 µg/m³",
      },
      {
        code: "NO2",
        name: "Nitrogen Dioxide",
        value: 142.6,
        unit: "µg/m³",
        subIndex: 178,
        category: "Moderate",
        averagingPeriod: "24-hr valid",
        standardBenchmark: "CPCB: 80 µg/m³",
      },
      {
        code: "SO2",
        name: "Sulphur Dioxide",
        value: 28.2,
        unit: "µg/m³",
        subIndex: 35,
        category: "Good",
        averagingPeriod: "24-hr valid",
        standardBenchmark: "CPCB: 80 µg/m³",
      },
      {
        code: "CO",
        name: "Carbon Monoxide",
        value: 4.8,
        unit: "mg/m³",
        subIndex: 148,
        category: "Moderate",
        averagingPeriod: "8-hr valid",
        standardBenchmark: "CPCB: 2.0 mg/m³",
      },
      {
        code: "O3",
        name: "Ozone",
        value: 32.1,
        unit: "µg/m³",
        subIndex: 32,
        category: "Good",
        averagingPeriod: "8-hr valid",
        standardBenchmark: "CPCB: 100 µg/m³",
      },
    ],
    diurnalCurve: [
      { hour: "04:00", aqi: 440, inversionRisk: "High" },
      { hour: "06:00", aqi: 475, inversionRisk: "High" },
      { hour: "08:00", aqi: 495, inversionRisk: "High" },
      { hour: "10:00", aqi: 460, inversionRisk: "High" },
      { hour: "12:00", aqi: 390, inversionRisk: "Medium" },
      { hour: "14:00", aqi: 310, inversionRisk: "Low" },
      { hour: "16:00", aqi: 340, inversionRisk: "Medium" },
      { hour: "18:00", aqi: 420, inversionRisk: "High" },
      { hour: "20:00", aqi: 465, inversionRisk: "High" },
      { hour: "22:00", aqi: 450, inversionRisk: "High" },
    ],
    routineRecommendation: {
      safeOutdoorWindow: "13:30 – 15:30 IST (Solar thermal mixing breaks inversion boundary)",
      peakStagnationWindow: "06:00 – 09:30 IST (Severe low-altitude inversion trapping pollutants)",
      commuteAdvice: "Use underground Delhi Metro with certified N95 mask. Avoid open auto-rickshaws.",
      pediatricAdvice: "Schools advised to cancel outdoor morning assemblies; keep windows sealed.",
      geriatricAdvice: "Postpone morning walks to afternoon; monitor resting pulse oximetry.",
    },
  },
  "mumbai-bandra": {
    id: "mumbai-bandra",
    locationName: "Bandra Kurla Complex (BKC)",
    city: "Mumbai",
    stationName: "BKC CAAQMS (MPCB)",
    stationId: "MH004_BKC_MUMBAI",
    aqi: 154,
    category: "Moderate",
    dominantPollutant: "PM10",
    hisi: 162,
    weather: {
      tempC: 28.0,
      humidity: 64,
      windSpeedKmh: 12.8,
      windDirection: "WSW (Sea Breeze)",
      boundaryLayerMeters: 850,
      inversionActive: false,
    },
    provenance: {
      badgeText: "DEMO SCENARIO: Moderate Coastal Urban Air",
      source: "CPCB / MPCB Calibrated Reference Data",
      freshness: "Simulated 14:00 IST Snapshot",
      confidenceScore: 0.92,
    },
    pollutants: [
      {
        code: "PM2.5",
        name: "Fine Particulate Matter",
        value: 54.2,
        unit: "µg/m³",
        subIndex: 90,
        category: "Satisfactory",
        averagingPeriod: "24-hr valid",
        standardBenchmark: "CPCB: 60 µg/m³",
      },
      {
        code: "PM10",
        name: "Coarse Particulate Matter",
        value: 136.0,
        unit: "µg/m³",
        subIndex: 154,
        category: "Moderate",
        averagingPeriod: "24-hr valid",
        standardBenchmark: "CPCB: 100 µg/m³",
      },
      {
        code: "NO2",
        name: "Nitrogen Dioxide",
        value: 48.0,
        unit: "µg/m³",
        subIndex: 60,
        category: "Satisfactory",
        averagingPeriod: "24-hr valid",
        standardBenchmark: "CPCB: 80 µg/m³",
      },
      {
        code: "SO2",
        name: "Sulphur Dioxide",
        value: 14.5,
        unit: "µg/m³",
        subIndex: 18,
        category: "Good",
        averagingPeriod: "24-hr valid",
        standardBenchmark: "CPCB: 80 µg/m³",
      },
      {
        code: "CO",
        name: "Carbon Monoxide",
        value: 1.2,
        unit: "mg/m³",
        subIndex: 60,
        category: "Satisfactory",
        averagingPeriod: "8-hr valid",
        standardBenchmark: "CPCB: 2.0 mg/m³",
      },
      {
        code: "O3",
        name: "Ozone",
        value: 42.0,
        unit: "µg/m³",
        subIndex: 42,
        category: "Good",
        averagingPeriod: "8-hr valid",
        standardBenchmark: "CPCB: 100 µg/m³",
      },
    ],
    diurnalCurve: [
      { hour: "04:00", aqi: 135, inversionRisk: "Low" },
      { hour: "06:00", aqi: 145, inversionRisk: "Low" },
      { hour: "08:00", aqi: 170, inversionRisk: "Medium" },
      { hour: "10:00", aqi: 165, inversionRisk: "Low" },
      { hour: "12:00", aqi: 155, inversionRisk: "Low" },
      { hour: "14:00", aqi: 154, inversionRisk: "Low" },
      { hour: "16:00", aqi: 148, inversionRisk: "Low" },
      { hour: "18:00", aqi: 168, inversionRisk: "Low" },
      { hour: "20:00", aqi: 160, inversionRisk: "Low" },
      { hour: "22:00", aqi: 140, inversionRisk: "Low" },
    ],
    routineRecommendation: {
      safeOutdoorWindow: "Regular daytime outdoor hours acceptable; sea breeze aids dispersion.",
      peakStagnationWindow: "08:00 – 10:00 IST (Rush-hour vehicular congestion along Western Express)",
      commuteAdvice: "Suburban local rail or BEST Electric Bus recommended to minimize vehicle exhaust.",
      pediatricAdvice: "Normal school activities permitted; limit intense exertion on roadside courts.",
      geriatricAdvice: "Standard walking routines safe; stay hydrated in coastal humidity.",
    },
  },
};
