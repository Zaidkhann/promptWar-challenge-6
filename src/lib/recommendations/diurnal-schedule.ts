import { NormalizedAirQualityReport } from "../aqi/types";
import { DiurnalScheduleSlot, UserPreferences } from "./types";

/**
 * Computes deterministic 5-slot diurnal lifestyle schedule based on atmospheric inversion physics.
 * 
 * Traceable Sources:
 * - Indian Meteorological Department (IMD) Planetary Boundary Layer Climatology.
 * - CPCB Continuous Ambient Air Quality Data Interpretation Guide.
 */
export function generateDiurnalSchedule(
  report: NormalizedAirQualityReport,
  preferences: UserPreferences
): DiurnalScheduleSlot[] {
  const isSevere = report.cpcbCategory === "Severe" || (report.cpcbNAQI ?? 0) > 400;
  const isPoorOrVeryPoor = report.cpcbCategory === "Very Poor" || report.cpcbCategory === "Poor";
  const isClean = report.cpcbCategory === "Good" || report.cpcbCategory === "Satisfactory";

  const isActiveCommuter = preferences.commuteMode === "cycling" || preferences.commuteMode === "walking";

  return [
    {
      timeRange: "06:00 – 09:30 IST",
      label: "Early Morning Nocturnal Inversion Peak",
      status: isSevere ? "hazardous" : isPoorOrVeryPoor ? "caution" : "acceptable",
      headlineAction: isSevere
        ? "Cancel Outdoor Exercise; Seal Windows"
        : isPoorOrVeryPoor
        ? "Light Walking Only; Avoid Strenuous Cardio"
        : "Standard Morning Walking & Exercise Permitted",
      atmosphericPhysicsNote:
        "Nocturnal radiative cooling condenses the mixing layer below 200m, trapping ground-level exhaust with high morning humidity.",
      recommendedActivity: isClean
        ? "Brisk walk or outdoor jog permitted."
        : "Indoor mobility stretches or indoor treadmill with air filtration.",
      indoorAlternative: "Indoor core workout & light yoga in closed room.",
      isOptimalWindow: false,
      isInversionTrapped: true,
    },
    {
      timeRange: "09:30 – 12:00 IST",
      label: "Morning Commute & Transition Window",
      status: isSevere ? "hazardous" : isPoorOrVeryPoor ? "caution" : "acceptable",
      headlineAction: isSevere
        ? "Mandatory Sealed Transit / Metro + N95"
        : isPoorOrVeryPoor
        ? "Wear Particulate Mask during Congestion"
        : "Standard Transit Routine",
      atmosphericPhysicsNote:
        "Early morning traffic emissions combine with slow solar surface heating; atmospheric boundary layer begins gradual upward expansion.",
      recommendedActivity: isActiveCommuter && isSevere
        ? "Shift roadside walk/cycling to underground metro or sealed vehicle."
        : "Transit via closed metro rail or vehicle with AC recirculation.",
      indoorAlternative: "Work/study in filtered indoor spaces.",
      isOptimalWindow: false,
      isInversionTrapped: !isClean,
    },
    {
      timeRange: "12:00 – 15:30 IST",
      label: "Peak Solar Window (Maximum Boundary Layer Mixing)",
      status: isSevere ? "caution" : isClean ? "optimal" : "acceptable",
      headlineAction: isClean
        ? "Optimal Window: Outdoor Sports & Unrestricted Fresh Air"
        : isSevere
        ? "Best Window of the Day: Essential Outdoor Errands & 20-min Purge"
        : "Recommended Window for Outdoor Walks & Natural Ventilation",
      atmosphericPhysicsNote:
        "Peak solar radiation drives convective ground warming, lifting the boundary mixing depth to 400m–1200m and diluting surface particulate density.",
      recommendedActivity: isSevere
        ? "Complete essential outdoor errands and grocery runs during this window."
        : preferences.activityType === "outdoor_exercise"
        ? "Safest period for outdoor workouts and outdoor cardio steps."
        : "Outdoor walks, school sports, and essential outdoor errands.",
      indoorAlternative: "Open windows for brief 20-minute cross-ventilation purge.",
      isOptimalWindow: true,
      isInversionTrapped: false,
    },
    {
      timeRange: "15:30 – 19:30 IST",
      label: "Evening Rush Hour & Ground Re-cooling Inversion",
      status: isSevere ? "hazardous" : isPoorOrVeryPoor ? "caution" : "acceptable",
      headlineAction: isSevere
        ? "Close Windows by 16:30 IST; Shift Commute Earlier"
        : isPoorOrVeryPoor
        ? "Avoid Prolonged Street Exposure; Close Windows"
        : "Standard Evening Commute & Activity",
      atmosphericPhysicsNote:
        "Solar heating ceases, the ground cools rapidly, and evening vehicular exhaust becomes pinned under a re-forming nocturnal inversion layer.",
      recommendedActivity: "Indoor hobbies, library, gym, or sealed public transit.",
      indoorAlternative: "Indoor bodyweight training or reading with closed windows.",
      isOptimalWindow: false,
      isInversionTrapped: true,
    },
    {
      timeRange: "19:30 – 06:00 IST",
      label: "Nighttime Rest & Bedroom Sanctuary",
      status: isSevere ? "caution" : isClean ? "optimal" : "acceptable",
      headlineAction: isSevere
        ? "Activate Bedroom Air Purifier on Continuous Mode"
        : isPoorOrVeryPoor
        ? "Keep Bedroom Windows Closed Overnight"
        : "Normal Bedroom Ventilation",
      atmosphericPhysicsNote:
        "Deep nocturnal radiation inversion creates calm surface winds (< 2 km/h), allowing fine particles to linger at street and ground floor level.",
      recommendedActivity: "Sleep in a sealed room with active HEPA or DIY air filtration.",
      indoorAlternative: "Bedroom air purification running 45 minutes prior to sleep.",
      isOptimalWindow: false,
      isInversionTrapped: true,
    },
  ];
}
