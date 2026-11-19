import {
  RoomConfiguration,
  OutdoorConditions,
  SimulationParameters,
  ScenarioDefinition,
  ScenarioResultComparison,
  MultiScenarioComparisonOutput,
} from "./types";
import { runIndoorSimulation } from "./engine";

export interface CompareScenariosOptions {
  baselineRoom: RoomConfiguration;
  outdoor: OutdoorConditions;
  alternativeScenarios: ScenarioDefinition[];
  parameters?: Partial<SimulationParameters>;
}

export const PRESET_SCENARIO_COMPARISONS: Record<
  string,
  {
    title: string;
    description: string;
    generateScenarios: (base: RoomConfiguration) => ScenarioDefinition[];
  }
> = {
  winter_smog_defense: {
    title: "Winter Smog Defense: Purifier Filtration Impact",
    description:
      "Evaluates indoor protection during severe outdoor inversion smog across three operating modes: no filtration, medium HEPA filtration, and maximum turbo filtration.",
    generateScenarios: (base) => [
      {
        id: "baseline_unfiltered",
        label: "Baseline: Windows Closed, No Air Purifier",
        description: "Passive infiltration through building envelope with no mechanical filtration.",
        roomOverrides: {
          hasAirPurifier: false,
          purifierFanSpeed: "off",
          ventilationMode: "closed_windows",
        },
      },
      {
        id: "purifier_medium",
        label: "Intervention A: HEPA Purifier (Medium Speed)",
        description: "Continuous whisper-quiet filtration delivering ~70% rated CADR.",
        roomOverrides: {
          hasAirPurifier: true,
          purifierCADR: base.purifierCADR > 0 ? base.purifierCADR : 280,
          purifierFanSpeed: "medium",
          ventilationMode: "closed_windows",
        },
      },
      {
        id: "purifier_turbo",
        label: "Intervention B: HEPA Purifier (Turbo Speed)",
        description: "Maximum continuous clean air delivery rate (125% CADR) for rapid particle clearing.",
        roomOverrides: {
          hasAirPurifier: true,
          purifierCADR: base.purifierCADR > 0 ? base.purifierCADR : 280,
          purifierFanSpeed: "turbo",
          ventilationMode: "closed_windows",
        },
      },
    ],
  },

  ventilation_dilemma: {
    title: "The Winter Ventilation Dilemma: Windows Closed vs. Open",
    description:
      "Contrasts indoor PM2.5 levels when keeping windows sealed versus opening windows during high outdoor pollution.",
    generateScenarios: () => [
      {
        id: "windows_closed",
        label: "Windows Firmly Sealed",
        description: "Building envelope partially attenuates fine particulate ingress (P = 0.70, λ = 0.95 ACH).",
        roomOverrides: {
          ventilationMode: "closed_windows",
          windowOpeningFraction: 0,
        },
      },
      {
        id: "window_ajar",
        label: "Window Ajar (Crack Opening)",
        description: "Moderate fresh air ventilation allowing higher outdoor particulate flux (λ = 2.8 ACH).",
        roomOverrides: {
          ventilationMode: "window_ajar",
          windowOpeningFraction: 0.25,
        },
      },
      {
        id: "windows_wide_open",
        label: "Windows Wide Open",
        description: "Direct ambient outdoor air exchange rapidly equilibrating indoor air with outdoor smog.",
        roomOverrides: {
          ventilationMode: "windows_open",
          windowOpeningFraction: 1.0,
        },
      },
    ],
  },

  indoor_cooking_surge: {
    title: "Kitchen Tadka Surge: Containment & Clean-Up",
    description:
      "Simulates an intense 30-minute Indian cooking emission (1,500 µg/min PM2.5) with and without air purifier remediation.",
    generateScenarios: (base) => [
      {
        id: "cooking_unmitigated",
        label: "Cooking Without Purifier",
        description: "Intense aerosol spike without mechanical particle extraction.",
        roomOverrides: {
          indoorSource: "cooking_tadka",
          indoorSourceStartMinute: 15,
          indoorSourceDurationMinutes: 30,
          hasAirPurifier: false,
          purifierFanSpeed: "off",
        },
      },
      {
        id: "cooking_with_purifier_medium",
        label: "Cooking + HEPA Purifier (Medium)",
        description: "Air purifier actively scrubbing cooking aerosols at standard operating speed.",
        roomOverrides: {
          indoorSource: "cooking_tadka",
          indoorSourceStartMinute: 15,
          indoorSourceDurationMinutes: 30,
          hasAirPurifier: true,
          purifierCADR: base.purifierCADR > 0 ? base.purifierCADR : 300,
          purifierFanSpeed: "medium",
        },
      },
      {
        id: "cooking_with_purifier_turbo",
        label: "Cooking + HEPA Purifier (Turbo)",
        description: "Maximum fan speed initiated at the onset of cooking to cap peak exposure.",
        roomOverrides: {
          indoorSource: "cooking_tadka",
          indoorSourceStartMinute: 15,
          indoorSourceDurationMinutes: 30,
          hasAirPurifier: true,
          purifierCADR: base.purifierCADR > 0 ? base.purifierCADR : 300,
          purifierFanSpeed: "turbo",
        },
      },
    ],
  },
};

/**
 * Runs a multi-scenario simulation comparison from a unified starting baseline.
 */
export function compareIndoorScenarios(options: CompareScenariosOptions): MultiScenarioComparisonOutput {
  const { baselineRoom, outdoor, alternativeScenarios, parameters } = options;

  // 1. Run Baseline Simulation
  const baselineOutput = runIndoorSimulation({
    room: baselineRoom,
    outdoor,
    parameters,
  });

  const baselineAUC = baselineOutput.metrics.areaUnderCurveExposureUgHrM3;
  const baselinePeak = baselineOutput.metrics.peakPM25;
  const baselineFinal = baselineOutput.metrics.finalPM25;

  const comparisonResults: ScenarioResultComparison[] = [];

  // Add baseline entry
  comparisonResults.push({
    scenarioId: "baseline",
    label: "Baseline (Current Configuration)",
    description: "Your configured starting parameters.",
    output: baselineOutput,
    peakPM25: baselinePeak,
    finalPM25: baselineFinal,
    averagePM25: baselineOutput.metrics.averagePM25,
    deltaPeakPM25VsBaseline: 0,
    deltaFinalPM25VsBaseline: 0,
    percentExposureReductionVsBaseline: 0,
    timeToReachTargetMinutes: baselineOutput.metrics.hoursToCleanToGoodCategory
      ? Math.round(baselineOutput.metrics.hoursToCleanToGoodCategory * 60)
      : null,
  });

  // 2. Run Each Alternative Scenario
  for (const alt of alternativeScenarios) {
    const mergedRoom: RoomConfiguration = {
      ...baselineRoom,
      ...alt.roomOverrides,
      // Ensure initial starting concentration matches baseline initial
      initialIndoorPM25: baselineOutput.timePoints[0]?.indoorPM25,
      initialIndoorPM10: baselineOutput.timePoints[0]?.indoorPM10,
    };

    const altOutput = runIndoorSimulation({
      room: mergedRoom,
      outdoor,
      parameters,
    });

    const altAUC = altOutput.metrics.areaUnderCurveExposureUgHrM3;
    const deltaPeak = Math.round((altOutput.metrics.peakPM25 - baselinePeak) * 10) / 10;
    const deltaFinal = Math.round((altOutput.metrics.finalPM25 - baselineFinal) * 10) / 10;

    const exposureReductionPercent =
      baselineAUC > 0 ? Math.round(((baselineAUC - altAUC) / baselineAUC) * 1000) / 10 : 0;

    comparisonResults.push({
      scenarioId: alt.id,
      label: alt.label,
      description: alt.description,
      output: altOutput,
      peakPM25: altOutput.metrics.peakPM25,
      finalPM25: altOutput.metrics.finalPM25,
      averagePM25: altOutput.metrics.averagePM25,
      deltaPeakPM25VsBaseline: deltaPeak,
      deltaFinalPM25VsBaseline: deltaFinal,
      percentExposureReductionVsBaseline: exposureReductionPercent,
      timeToReachTargetMinutes: altOutput.metrics.hoursToCleanToGoodCategory
        ? Math.round(altOutput.metrics.hoursToCleanToGoodCategory * 60)
        : null,
    });
  }

  // 3. Synthesize Takeaway
  const bestIntervention = [...comparisonResults]
    .filter((c) => c.scenarioId !== "baseline")
    .sort((a, b) => b.percentExposureReductionVsBaseline - a.percentExposureReductionVsBaseline)[0];

  let keyTakeaway = "All compared scenarios demonstrate consistent mass-balance behavior.";
  if (bestIntervention && bestIntervention.percentExposureReductionVsBaseline > 0) {
    keyTakeaway = `${bestIntervention.label} achieves the highest exposure reduction of ${bestIntervention.percentExposureReductionVsBaseline}% relative to baseline, lowering final PM2.5 by ${Math.abs(bestIntervention.deltaFinalPM25VsBaseline)} µg/m³.`;
  } else if (bestIntervention && bestIntervention.percentExposureReductionVsBaseline < 0) {
    keyTakeaway = `Opening windows or disabling filtration increases cumulative particle exposure by ${Math.abs(bestIntervention.percentExposureReductionVsBaseline)}% due to accelerated infiltration of outdoor smog.`;
  }

  return {
    id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    calculatedAt: new Date().toISOString(),
    baselineScenarioId: "baseline",
    scenarios: comparisonResults,
    keyTakeaway,
    scientificCaveats: [
      "Comparisons assume identical starting initial indoor particulate concentrations across all runs.",
      "CADR values represent clean room test bench ratings; real-world furniture obstruction may reduce effective mixing.",
      "Outdoor concentration is held steady over the simulation interval for controlled side-by-side comparison.",
    ],
  };
}
