import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizePollutantValue,
  normalizePollutantReadings,
  calculateConfidenceScore,
} from "@/lib/aqi/normalizer";
import { RawPollutantReading } from "@/lib/aqi/types";

describe("AQI Normalizer & Data Pipeline", () => {
  describe("Unit Conversion & Normalization", () => {
    it("converts CO from ppm and µg/m³ to standard mg/m³", () => {
      // 1 ppm CO = 1.145 mg/m³
      const fromPpm = normalizePollutantValue("CO", 2.0, "ppm");
      assert.ok(fromPpm);
      assert.equal(fromPpm.unit, "mg/m³");
      assert.equal(Number(fromPpm.normalizedValue.toFixed(3)), 2.29);

      // 2500 µg/m³ CO = 2.5 mg/m³
      const fromUg = normalizePollutantValue("CO", 2500, "µg/m³");
      assert.ok(fromUg);
      assert.equal(fromUg.unit, "mg/m³");
      assert.equal(fromUg.normalizedValue, 2.5);

      // standard mg/m³ stays identical
      const standard = normalizePollutantValue("CO", 1.8, "mg/m³");
      assert.ok(standard);
      assert.equal(standard.normalizedValue, 1.8);
      assert.equal(standard.unit, "mg/m³");
    });

    it("converts particulate matter (PM2.5, PM10) from mg/m³ to standard µg/m³", () => {
      const pm25 = normalizePollutantValue("PM2.5", 0.15, "mg/m³");
      assert.ok(pm25);
      assert.equal(pm25.unit, "µg/m³");
      assert.equal(pm25.normalizedValue, 150);

      const pm10 = normalizePollutantValue("PM10", 250, "µg/m³");
      assert.ok(pm10);
      assert.equal(pm10.unit, "µg/m³");
      assert.equal(pm10.normalizedValue, 250);
    });

    it("converts NO2 and SO2 from ppm / ppb to µg/m³ at 25°C", () => {
      // 0.05 ppm NO2 = 0.05 * 1882 = 94.1 µg/m³
      const no2Ppm = normalizePollutantValue("NO2", 0.05, "ppm");
      assert.ok(no2Ppm);
      assert.equal(no2Ppm.unit, "µg/m³");
      assert.equal(Number(no2Ppm.normalizedValue.toFixed(1)), 94.1);

      // 50 ppb SO2 = 50 * 2.620 = 131 µg/m³
      const so2Ppb = normalizePollutantValue("SO2", 50, "ppb");
      assert.ok(so2Ppb);
      assert.equal(so2Ppb.unit, "µg/m³");
      assert.equal(Number(so2Ppb.normalizedValue.toFixed(1)), 131.0);
    });

    it("rejects negative values and non-finite inputs", () => {
      assert.equal(normalizePollutantValue("PM2.5", -10, "µg/m³"), null);
      assert.equal(normalizePollutantValue("PM10", NaN, "µg/m³"), null);
      assert.equal(normalizePollutantValue("CO", Infinity, "mg/m³"), null);
    });
  });

  describe("Batch Normalization & Data Quality Checks", () => {
    it("discards impossible extreme outliers (> 2500 µg/m³ sensor saturation)", () => {
      const raw: RawPollutantReading[] = [
        { pollutant: "PM2.5", value: 350, unit: "µg/m³", timestamp: new Date().toISOString() },
        { pollutant: "PM10", value: 9999, unit: "µg/m³", timestamp: new Date().toISOString() }, // Impossible anomaly
      ];

      const normalized = normalizePollutantReadings(raw);
      assert.ok(normalized["PM2.5"]);
      assert.equal(normalized["PM10"], undefined); // Outlier dropped
    });

    it("correctly enforces data sufficiency hours count (16 hrs for 24-hr standard)", () => {
      const raw: RawPollutantReading[] = [
        {
          pollutant: "PM2.5",
          value: 120,
          unit: "µg/m³",
          timestamp: new Date().toISOString(),
          averagingHours: 18, // Sufficient (>= 16)
        },
        {
          pollutant: "NO2",
          value: 45,
          unit: "µg/m³",
          timestamp: new Date().toISOString(),
          averagingHours: 8, // Insufficient (< 16)
        },
        {
          pollutant: "CO",
          value: 1.2,
          unit: "mg/m³",
          timestamp: new Date().toISOString(),
          averagingHours: 7, // Sufficient for CO 8-hr standard (>= 6)
        },
      ];

      const details = normalizePollutantReadings(raw);

      assert.equal(details["PM2.5"]?.isDataSufficient, true);
      assert.notEqual(details["PM2.5"]?.subIndex, null);

      assert.equal(details["NO2"]?.isDataSufficient, false);
      assert.equal(details["NO2"]?.subIndex, null); // Sub-index must not be assigned if insufficient

      assert.equal(details["CO"]?.isDataSufficient, true);
      assert.notEqual(details["CO"]?.subIndex, null);
    });
  });

  describe("Confidence Score Engine", () => {
    it("calculates maximum confidence for fresh local official station", () => {
      // 0 min fresh, 0 km distance, Official CAAQMS
      const score = calculateConfidenceScore(0, 0, "OFFICIAL_CAAQMS");
      assert.equal(score, 1.0);
    });

    it("penalizes high sensor distance and stale timestamps gracefully", () => {
      const freshClose = calculateConfidenceScore(15, 2, "OFFICIAL_CAAQMS");
      const staleFar = calculateConfidenceScore(150, 25, "SPATIAL_INTERPOLATION");

      assert.ok(freshClose > 0.85);
      assert.ok(staleFar < 0.5);
      assert.ok(staleFar >= 0.1); // Bounded lower limit
    });
  });
});
