import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { executeToolCall } from "@/lib/agent/tools/executor";
import { getAllRegisteredTools } from "@/lib/agent/tools/registry";
import { getUserPreferences, resetUserPreferences } from "@/lib/agent/user-store";
import { AgentContext } from "@/lib/agent/types";

describe("SaansAI Agent Tool Registry & Execution Engine", () => {
  const mockContext: AgentContext = {
    userId: "user_test_123",
    conversationId: "conv_test_123",
    scenario: "delhi-anand-vihar",
    lat: 28.6468,
    lon: 77.3160,
  };

  it("registers all 8 core environmental intelligence tools", () => {
    const tools = getAllRegisteredTools();
    assert.ok(tools.length >= 8);

    const toolNames = tools.map((t) => t.name);
    assert.ok(toolNames.includes("get_current_aqi"));
    assert.ok(toolNames.includes("get_pollutant_details"));
    assert.ok(toolNames.includes("get_weather"));
    assert.ok(toolNames.includes("get_air_quality_forecast"));
    assert.ok(toolNames.includes("get_daily_recommendations"));
    assert.ok(toolNames.includes("get_user_preferences"));
    assert.ok(toolNames.includes("update_user_preferences"));
    assert.ok(toolNames.includes("get_location_air_quality"));
  });

  describe("TOOL A: get_current_aqi", () => {
    it("executes get_current_aqi and returns validated statutory NAQI and HISI telemetry", async () => {
      const response = await executeToolCall(
        "get_current_aqi",
        "call_1",
        { scenario: "delhi-anand-vihar" },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as Record<string, unknown>;
      assert.equal(data.cpcbNAQI, 482);
      assert.equal(data.cpcbCategory, "Severe");
      assert.equal(data.dominantPollutant, "PM2.5");
      assert.equal(data.acuteSmogPeakHISI, 495);
      const inversion = data.atmosphericInversion as Record<string, unknown>;
      assert.ok(inversion.boundaryLayerHeightMeters);
      const provenance = data.provenance as Record<string, unknown>;
      assert.ok(provenance.source);
    });
  });

  describe("TOOL B: get_pollutant_details", () => {
    it("returns breakdown of all 8 criteria pollutants with CPCB benchmarks", async () => {
      const response = await executeToolCall(
        "get_pollutant_details",
        "call_2",
        { scenario: "delhi-anand-vihar" },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as { pollutants: Array<{ code: string; unit: string; category: string; standardBenchmark: unknown }> };
      assert.ok(Array.isArray(data.pollutants));
      assert.ok(data.pollutants.length >= 4);

      const pm25 = data.pollutants.find((p) => p.code === "PM2.5");
      assert.ok(pm25);
      assert.equal(pm25.unit, "µg/m³");
      assert.equal(pm25.category, "Severe");
      assert.ok(pm25.standardBenchmark);
    });
  });

  describe("TOOL C: get_weather", () => {
    it("retrieves real-time atmospheric boundary layer and wind vector", async () => {
      const response = await executeToolCall(
        "get_weather",
        "call_3",
        { latitude: 28.6468, longitude: 77.3160 },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as Record<string, unknown>;
      assert.ok(typeof data.temperatureC === "number");
      assert.ok(typeof data.relativeHumidityPercent === "number");
      assert.ok(typeof data.planetaryBoundaryLayerMeters === "number");
      assert.ok(data.provider);
    });
  });

  describe("TOOL D: get_air_quality_forecast", () => {
    it("returns diurnal boundary layer schedule and explicitly distinguishes forecast from live observations", async () => {
      const response = await executeToolCall(
        "get_air_quality_forecast",
        "call_4",
        { scenario: "delhi-anand-vihar" },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as { isForecast: boolean; diurnalSlots: unknown[]; multiDayForecastStatus: string };
      assert.equal(data.isForecast, true);
      assert.ok(Array.isArray(data.diurnalSlots));
      assert.equal(data.diurnalSlots.length, 5);
      assert.match(data.multiDayForecastStatus, /not currently connected/i);
    });
  });

  describe("TOOL E: get_daily_recommendations", () => {
    it("generates deterministic lifestyle recommendations grounded in CPCB NAQI guidelines", async () => {
      const response = await executeToolCall(
        "get_daily_recommendations",
        "call_5",
        { scenario: "delhi-anand-vihar" },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as { recommendations: Array<{ priority: string; sourceCitation: unknown }> };
      assert.ok(Array.isArray(data.recommendations));
      assert.ok(data.recommendations.length > 0);

      const criticalRec = data.recommendations.find((r) => r.priority === "critical");
      assert.ok(criticalRec);
      assert.ok(criticalRec.sourceCitation);
    });
  });

  describe("TOOL F & G: User Preferences & Confirmation Safety Gate", () => {
    it("retrieves preferences scoped to authenticated user context", async () => {
      resetUserPreferences("user_test_123");
      const response = await executeToolCall("get_user_preferences", "call_6", {}, mockContext);

      assert.equal(response.isError, false);
      const data = response.result as { userId: string; preferences: { preferredTime: string } };
      assert.equal(data.userId, "user_test_123");
      assert.equal(data.preferences.preferredTime, "morning");
    });

    it("SAFETY GATE: rejects unconfirmed preference modification (isConfirmed=false)", async () => {
      const response = await executeToolCall(
        "update_user_preferences",
        "call_7",
        { preferredTime: "midday", isConfirmed: false },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as Record<string, unknown>;
      assert.equal(data.status, "CONFIRMATION_REQUIRED");
      assert.ok(data.proposedUpdates);

      // Verify that database was NOT modified
      const current = getUserPreferences("user_test_123");
      assert.equal(current.preferredTime, "morning"); // Unchanged!
    });

    it("applies preference changes when explicitly confirmed by user (isConfirmed=true)", async () => {
      const response = await executeToolCall(
        "update_user_preferences",
        "call_8",
        { preferredTime: "midday", isConfirmed: true },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as Record<string, unknown>;
      assert.equal(data.status, "SUCCESSFULLY_UPDATED");

      // Verify that database was modified
      const current = getUserPreferences("user_test_123");
      assert.equal(current.preferredTime, "midday");
    });
  });

  describe("TOOL H: get_location_air_quality", () => {
    it("retrieves location air quality for named Indian metropolitan city", async () => {
      const response = await executeToolCall(
        "get_location_air_quality",
        "call_9",
        { cityName: "Mumbai" },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as { searchedLocation: string; activeStation: { name: string }; cpcbNAQI: number };
      assert.equal(data.searchedLocation, "Mumbai");
      assert.ok(data.activeStation.name);
      assert.ok(typeof data.cpcbNAQI === "number");
    });
  });

  describe("Tool Execution Error Handling & Schema Validation", () => {
    it("returns TOOL_NOT_FOUND error when calling unregistered tool", async () => {
      const response = await executeToolCall(
        "malicious_shell_execute",
        "call_err",
        { command: "rm -rf /" },
        mockContext
      );

      assert.equal(response.isError, true);
      assert.match((response.result as { error: string }).error, /TOOL_NOT_FOUND/);
    });

    it("returns INVALID_TOOL_ARGUMENTS error on schema validation failure", async () => {
      const response = await executeToolCall(
        "get_current_aqi",
        "call_err_schema",
        { latitude: 999 }, // Latitude > 90 violates Zod schema
        mockContext
      );

      assert.equal(response.isError, true);
      assert.equal((response.result as { error: string }).error, "INVALID_TOOL_ARGUMENTS");
    });
  });
});
