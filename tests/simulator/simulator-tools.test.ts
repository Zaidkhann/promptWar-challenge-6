import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { executeToolCall } from "@/lib/agent/tools/executor";
import { getAllRegisteredTools } from "@/lib/agent/tools/registry";
import { resetUserRooms, getUserRooms } from "@/lib/simulator/room-store";
import { AgentContext } from "@/lib/agent/types";

describe("SaansAI Simulator Agent Tools Registry & Execution", () => {
  const mockContext: AgentContext = {
    userId: "test_user_sim",
    conversationId: "conv_sim_123",
    lat: 28.6468,
    lon: 77.3160,
    scenario: "delhi-anand-vihar",
  };

  it("registers all 13 core agent tools including 5 simulator tools", () => {
    const tools = getAllRegisteredTools();
    assert.ok(tools.length >= 13);

    const names = tools.map((t) => t.name);
    assert.ok(names.includes("simulate_indoor_air_quality"));
    assert.ok(names.includes("compare_indoor_scenarios"));
    assert.ok(names.includes("explain_simulation_results"));
    assert.ok(names.includes("get_room_configuration"));
    assert.ok(names.includes("save_room_configuration"));
  });

  describe("TOOL: simulate_indoor_air_quality", () => {
    it("executes simulate_indoor_air_quality and returns deterministic simulation metrics", async () => {
      const response = await executeToolCall(
        "simulate_indoor_air_quality",
        "call_sim_1",
        {
          roomType: "bedroom",
          lengthMeters: 4.0,
          widthMeters: 3.5,
          heightMeters: 3.0,
          hasAirPurifier: true,
          purifierCADR: 280,
          durationHours: 3,
        },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as {
        roomVolumeM3: number;
        metrics: { initialPM25: number; finalPM25: number; peakPM25: number };
        outdoorContext: { pm25: number };
        recommendations: unknown[];
      };

      assert.equal(data.roomVolumeM3, 42);
      assert.ok(data.metrics.peakPM25 > 0);
      assert.ok(typeof data.metrics.finalPM25 === "number");
      assert.ok(Array.isArray(data.recommendations));
    });
  });

  describe("TOOL: compare_indoor_scenarios", () => {
    it("executes compare_indoor_scenarios and returns comparative multi-scenario outputs", async () => {
      const response = await executeToolCall(
        "compare_indoor_scenarios",
        "call_sim_2",
        {
          presetKey: "winter_smog_defense",
          roomType: "bedroom",
        },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as {
        presetTitle: string;
        keyTakeaway: string;
        scenarios: Array<{ label: string; peakPM25: number; finalPM25: number }>;
      };

      assert.match(data.presetTitle, /Winter Smog Defense/i);
      assert.ok(data.keyTakeaway.length > 0);
      assert.equal(data.scenarios.length, 4);
    });
  });

  describe("TOOL: explain_simulation_results", () => {
    it("returns plain-language explanation of indoor/outdoor ratio and governing mechanisms", async () => {
      const response = await executeToolCall(
        "explain_simulation_results",
        "call_sim_3",
        {
          initialPM25: 180,
          finalPM25: 22,
          outdoorPM25: 350,
          hasAirPurifier: true,
        },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as {
        indoorOutdoorRatio: number;
        protectionState: string;
        governingMechanisms: string[];
      };

      assert.ok(data.indoorOutdoorRatio < 0.1);
      assert.match(data.protectionState, /attenuates outdoor pollution/i);
      assert.ok(data.governingMechanisms.length >= 3);
    });
  });

  describe("TOOL: get_room_configuration & save_room_configuration Safety Gate", () => {
    it("retrieves room configurations scoped to authenticated user context", async () => {
      resetUserRooms("test_user_sim");
      const response = await executeToolCall(
        "get_room_configuration",
        "call_sim_4",
        {},
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as { userId: string; roomsCount: number; rooms: unknown[] };
      assert.equal(data.userId, "test_user_sim");
      assert.ok(data.roomsCount >= 3);
    });

    it("SAFETY GATE: rejects unconfirmed room save when isConfirmed=false", async () => {
      const initialRoomsCount = getUserRooms("test_user_sim").length;

      const response = await executeToolCall(
        "save_room_configuration",
        "call_sim_5",
        {
          isConfirmed: false,
          name: "Study Room",
          roomType: "office",
          lengthMeters: 5.0,
          widthMeters: 4.0,
        },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as { status: string; proposedConfig: unknown };
      assert.equal(data.status, "CONFIRMATION_REQUIRED");
      assert.ok(data.proposedConfig);

      // Verify database was NOT changed
      const currentRooms = getUserRooms("test_user_sim");
      assert.equal(currentRooms.length, initialRoomsCount);
    });

    it("commits room save to database when explicitly confirmed (isConfirmed=true)", async () => {
      const response = await executeToolCall(
        "save_room_configuration",
        "call_sim_6",
        {
          isConfirmed: true,
          name: "Study Room Verified",
          roomType: "office",
          lengthMeters: 5.0,
          widthMeters: 4.0,
          heightMeters: 3.0,
          hasAirPurifier: true,
          purifierCADR: 350,
        },
        mockContext
      );

      assert.equal(response.isError, false);
      const data = response.result as { status: string; room: { name: string; purifierCADR: number } };
      assert.equal(data.status, "SUCCESSFULLY_SAVED");
      assert.equal(data.room.name, "Study Room Verified");
      assert.equal(data.room.purifierCADR, 350);
    });
  });
});
