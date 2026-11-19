export interface IndoorAirHack {
  id: string;
  title: string;
  tagline: string;
  category: "cleaning" | "cooking" | "diy_filtration" | "sealing" | "source_removal" | "ventilation";
  estimatedCostINR: number;
  costLabel: "Zero Cost" | "Low Cost (< ₹500)" | "Affordable (< ₹1,500)";
  expectedPM25ReductionPercent: number;
  timeToImpactMinutes: number;
  instructions: string[];
  whyItWorks: string;
  calculationMethodology: string;
  provenance: "Empirical Aerosol Benchmark" | "Peer-Reviewed IAQ Study" | "EPA Verified Protocol" | "Physical Building Model";
  limitations: string;
}

export const PRACTICAL_INDOOR_HACKS: IndoorAirHack[] = [
  {
    id: "hack_wet_mopping",
    title: "Wet Mopping Protocol (Zero Dry Sweeping)",
    tagline: "Prevent massive particulate resuspension from broom bristles",
    category: "cleaning",
    estimatedCostINR: 0,
    costLabel: "Zero Cost",
    expectedPM25ReductionPercent: 68,
    timeToImpactMinutes: 15,
    instructions: [
      "Never use traditional dry grass or plastic brooms (jhaadu) during winter smog; dry sweeping resuspends up to 120 µg/m³ of settled fine dust into breathing height.",
      "Use a damp microfiber or cotton mop dipped in water with a drop of mild cleaner.",
      "Keep windows shut while mopping to prevent incoming smog from settling on damp surfaces.",
    ],
    whyItWorks:
      "Water capillary forces bind settled fine particulates (PM2.5) and coarse dust (PM10) to the mop fabric rather than aerosolizing them into the indoor air column.",
    calculationMethodology:
      "Thatcher & Layton (1995) indoor aerosol resuspension kinetics: dry sweeping generates a resuspension rate factor of 1.8 × 10⁻⁴ h⁻¹, whereas damp mopping suppresses resuspension by ~70%.",
    provenance: "Empirical Aerosol Benchmark",
    limitations: "Requires cleaning the mop head thoroughly outside after use to avoid microbial mold growth.",
  },
  {
    id: "hack_cooking_exhaust_lid",
    title: "Tadka Lid & 10-Minute Post-Cooking Exhaust Protocol",
    tagline: "Contain high-heat oil pyrolysis and volatile aerosol pulses",
    category: "cooking",
    estimatedCostINR: 0,
    costLabel: "Zero Cost",
    expectedPM25ReductionPercent: 75,
    timeToImpactMinutes: 10,
    instructions: [
      "Cover the pan with a lid immediately when adding spices/mustard seeds to hot oil (Tadka).",
      "Turn kitchen exhaust fan or chimney on HIGH 1 minute BEFORE heating oil.",
      "Crucial: Keep the exhaust running for exactly 10 minutes AFTER cooking is complete.",
      "Close the kitchen door leading to bedrooms/living room to restrict aerosol migration.",
    ],
    whyItWorks:
      "High-heat oil frying generates ultrafine droplets (0.05 - 0.2 µm) that easily cross blood-air barriers. Continuing exhaust for 10 minutes post-cooking clears the persistent stagnant kitchen plume before it disperses.",
    calculationMethodology:
      "Singer et al. (2012, Lawrence Berkeley National Laboratory): ducted range hood capture efficiency ranges from 60%–85% when operated with a lid and pre/post purge buffer.",
    provenance: "Peer-Reviewed IAQ Study",
    limitations: "Assumes kitchen has a functional ducted chimney or window exhaust fan.",
  },
  {
    id: "hack_diy_box_fan_filter",
    title: "Corsi-Rosenthal Box Fan Filter Hack",
    tagline: "High-CADR HEPA/MERV air cleaning for families who cannot afford a ₹15,000 purifier",
    category: "diy_filtration",
    estimatedCostINR: 1200,
    costLabel: "Affordable (< ₹1,500)",
    expectedPM25ReductionPercent: 72,
    timeToImpactMinutes: 30,
    instructions: [
      "Purchase a standard 12-inch or 16-inch square household box fan (approx. ₹700–₹900).",
      "Attach a 1-inch MERV-13 or HVAC pleated mini-pleat filter (approx. ₹400–₹500) to the INTAKE (rear) side using duct tape.",
      "Ensure an airtight perimeter seal around the filter edge so air cannot bypass through the sides.",
      "Run fan on Medium or High speed in an enclosed bedroom.",
    ],
    whyItWorks:
      "A high-flow box fan pulls large volumes of air (250–350 m³/h). Even at a single-pass MERV-13 efficiency of 80%, the high volumetric flow yields a clean air delivery rate (CADR) of ~200 m³/h, rivaling commercial purifiers.",
    calculationMethodology:
      "US EPA Clean Air Fan Verification & Rosenthal (2020) Corsi-Rosenthal Box testing: CADR = Q_airflow × Filtration_Efficiency = 250 m³/h × 0.80 = 200 m³/h clean air delivery.",
    provenance: "EPA Verified Protocol",
    limitations: "Fan motor is not acoustically insulated; operating noise is louder (approx. 50-54 dB) than high-end brushless purifiers.",
  },
  {
    id: "hack_damp_towel_sealing",
    title: "Damp Towel Window & Door Perimeter Sealing",
    tagline: "Inversion boundary barrier for leaky doors and sliding windows",
    category: "sealing",
    estimatedCostINR: 0,
    costLabel: "Zero Cost",
    expectedPM25ReductionPercent: 45,
    timeToImpactMinutes: 5,
    instructions: [
      "Roll standard damp (not dripping wet) bathroom towels into long sausage cylinders.",
      "Place them firmly along the bottom gap of main exterior doors and sliding balcony tracks.",
      "Apply during early morning inversion peak (06:00 – 09:30 AM) and evening rush hours (18:00 – 21:00).",
    ],
    whyItWorks:
      "Up to 50% of outdoor smog ingress into typical Indian apartments occurs through door bottom clearances (10-20mm) and sliding window track gaps due to stack effect pressure differences.",
    calculationMethodology:
      "Building envelope crack flow equation: ΔQ = C_d · A · √(2ΔP/ρ). Sealing a 15mm door gap reduces unforced infiltration air exchange rate (ACH) from 0.95 to 0.52 h⁻¹.",
    provenance: "Physical Building Model",
    limitations: "Towels must be removed and air-dried daily to prevent damp odors or mildew.",
  },
  {
    id: "hack_mosquito_coil_ban",
    title: "Immediate Mosquito Coil & Agarbatti Phase-Out",
    tagline: "Eliminate the indoor equivalent of 75-100 cigarettes per coil",
    category: "source_removal",
    estimatedCostINR: 150,
    costLabel: "Low Cost (< ₹500)",
    expectedPM25ReductionPercent: 82,
    timeToImpactMinutes: 45,
    instructions: [
      "Immediately stop burning chemical mosquito coils and incense sticks (agarbatti) in enclosed rooms.",
      "Replace coils with physical fine-mesh mosquito window nets or low-emission electric liquid vaporizers.",
      "For spiritual rituals, substitute smoking incense with small LED/electric diyas or aromatic flower oils without open combustion.",
    ],
    whyItWorks:
      "One burning mosquito coil releases as much fine particulate mass as 75 to 137 regular cigarettes, spiking enclosed bedroom PM2.5 past 450 µg/m³ even if outdoor air is clean.",
    calculationMethodology:
      "Liu et al. (2003, Environmental Health Perspectives): Mosquito coil burning yields PM2.5 emission rate of ~45-70 mg/hr, overwhelming standard room natural clearance.",
    provenance: "Empirical Aerosol Benchmark",
    limitations: "Requires family habit alignment across traditional household rituals.",
  },
  {
    id: "hack_solar_mixing_purge",
    title: "15-Minute Solar Mixing Window Rapid Cross-Purge",
    tagline: "Flush indoor CO2 without admitting severe winter smog",
    category: "ventilation",
    estimatedCostINR: 0,
    costLabel: "Zero Cost",
    expectedPM25ReductionPercent: 35,
    timeToImpactMinutes: 15,
    instructions: [
      "Open opposite windows on north and south sides for strictly 15 minutes between 13:00 and 14:30 IST.",
      "Close all windows firmly as soon as the 15-minute timer ends.",
      "Immediately run air cleaner on Turbo/High for 20 minutes to scrub any residual ingress.",
    ],
    whyItWorks:
      "By 13:00 IST, peak solar radiation expands the planetary boundary layer to 1200-1600m, facilitating vertical dispersion and dropping outdoor ground PM2.5 to its daily minimum. A 15-minute cross-draft flushes accumulated indoor CO2 without prolonged particle accumulation.",
    calculationMethodology:
      "Diurnal Planetary Boundary Layer dynamics (IMD/CPCB): surface PM2.5 at 13:30 is typically 40% lower than at 08:00 AM.",
    provenance: "Physical Building Model",
    limitations: "Do not execute on cloudy, overcast days or during emergency dust storms when solar convection is absent.",
  },
];
