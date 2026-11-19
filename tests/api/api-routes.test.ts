import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as getLiveAQI } from "@/app/api/aqi/live/route";
import { GET as getStations } from "@/app/api/aqi/stations/route";
import { GET as getCorridors } from "@/app/api/commute/corridors/route";
import { POST as postRoute } from "@/app/api/commute/route/route";
import { POST as postExposure } from "@/app/api/commute/exposure/route";
import { POST as postSimulate } from "@/app/api/simulator/simulate/route";
import { POST as postCompare } from "@/app/api/simulator/compare/route";
import { GET as getRooms, POST as postRoom } from "@/app/api/simulator/rooms/route";
import { GET as getConversations } from "@/app/api/conversations/route";

describe("SaansAI Production API Routes Integration Suite", () => {
  describe("GET /api/aqi/live", () => {
    it("returns 200 with statutory NAQI and criteria pollutants for coordinates", async () => {
      const req = new NextRequest("http://localhost:3000/api/aqi/live?lat=28.6139&lon=77.2090");
      const res = await getLiveAQI(req);

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.station);
      assert.strictEqual(typeof data.cpcbNAQI, "number");
      assert.ok(data.pollutants);
      assert.ok(data.provenance);
    });

    it("returns 400 when coordinates query is invalid", async () => {
      const req = new NextRequest("http://localhost:3000/api/aqi/live?lat=invalid&lon=invalid");
      const res = await getLiveAQI(req);

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, "INVALID_COORDINATES_QUERY");
    });
  });

  describe("GET /api/aqi/stations", () => {
    it("returns 200 with verified CAAQMS stations list", async () => {
      const req = new NextRequest("http://localhost:3000/api/aqi/stations?lat=28.6139&lon=77.2090&radiusKm=50");
      const res = await getStations(req);

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.stations));
      assert.strictEqual(typeof data.count, "number");
      assert.ok(data.stations.length > 0);
    });
  });

  describe("GET /api/commute/corridors", () => {
    it("returns 200 with curated arterial transit corridors", async () => {
      const res = await getCorridors();

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.corridors));
      assert.ok(data.corridors.length >= 4);
    });
  });

  describe("POST /api/commute/route", () => {
    it("returns 200 with resolved route geometry and distance", async () => {
      const req = new NextRequest("http://localhost:3000/api/commute/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: "Anand Vihar, Delhi",
          destination: "Connaught Place, New Delhi",
          preferredMode: "metro_underground",
        }),
      });

      const res = await postRoute(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.data.route.distanceKm > 0);
    });

    it("returns 400 when required route fields are missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/commute/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: "",
          destination: "",
        }),
      });

      const res = await postRoute(req);
      assert.strictEqual(res.status, 400);
    });
  });

  describe("POST /api/commute/exposure", () => {
    it("returns 200 with multi-modal comparison matrix and dosimetry", async () => {
      const req = new NextRequest("http://localhost:3000/api/commute/exposure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: "Anand Vihar, Delhi",
          destination: "Connaught Place, New Delhi",
          departureHour: 9,
          maskType: "N95",
          objective: "lowest_exposure",
          ambientPM25: 250,
        }),
      });

      const res = await postExposure(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.data.matrix.modes.length >= 5);
      assert.ok(data.data.matrix.optimalMode);
    });
  });

  describe("POST /api/simulator/simulate", () => {
    it("returns 200 with physical decay simulation outputs", async () => {
      const req = new NextRequest("http://localhost:3000/api/simulator/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: {
            id: "room_test_api",
            name: "Test Room",
            roomType: "bedroom",
            dimensions: { lengthM: 4, widthM: 3.5, heightM: 3 },
            infiltrationLevel: "standard_indian_apartment",
            ventilationMode: "closed_windows",
            hasAirPurifier: true,
            purifierCADR: 350,
            purifierFanSpeed: "medium",
            indoorSource: "none",
            indoorSourceDurationMinutes: 0,
            indoorSourceStartMinute: 0,
          },
          outdoor: {
            pm25: 350,
            pm10: 450,
            isLive: true,
            isManualAssumption: false,
            sourceName: "API Test",
            confidenceScore: 0.95,
          },
          parameters: { durationHours: 4, timeStepMinutes: 5 },
        }),
      });

      const res = await postSimulate(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.simulation);
      assert.ok(data.simulation.timePoints.length > 0);
      assert.strictEqual(typeof data.simulation.metrics.averagePM25, "number");
      assert.strictEqual(typeof data.simulation.parameters.steadyStateConcentrationPM25, "number");
    });
  });

  describe("POST /api/simulator/compare", () => {
    it("returns 200 with multi-scenario comparison outputs", async () => {
      const req = new NextRequest("http://localhost:3000/api/simulator/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baselineRoom: {
            id: "room_baseline",
            name: "Baseline",
            roomType: "living_room",
            dimensions: { lengthM: 5, widthM: 4, heightM: 3 },
            infiltrationLevel: "standard_indian_apartment",
            ventilationMode: "closed_windows",
            hasAirPurifier: false,
            purifierCADR: 0,
            purifierFanSpeed: "low",
            indoorSource: "none",
            indoorSourceDurationMinutes: 0,
            indoorSourceStartMinute: 0,
          },
          outdoor: {
            pm25: 300,
            pm10: 400,
            isLive: true,
            isManualAssumption: false,
            sourceName: "API Test",
            confidenceScore: 0.9,
          },
          presetKey: "winter_smog_defense",
          parameters: { durationHours: 4, timeStepMinutes: 5 },
        }),
      });

      const res = await postCompare(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.comparison);
      assert.ok(data.comparison.scenarios.length >= 2);
    });
  });

  describe("GET & POST /api/simulator/rooms", () => {
    it("saves and retrieves user room configurations", async () => {
      const postReq = new NextRequest("http://localhost:3000/api/simulator/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_api_test",
          room: {
            id: "room_save_test",
            name: "Master Suite",
            roomType: "bedroom",
            dimensions: { lengthM: 5, widthM: 4, heightM: 2.8 },
            infiltrationLevel: "tight_seal",
            ventilationMode: "closed_windows",
            hasAirPurifier: true,
            purifierCADR: 400,
            purifierFanSpeed: "high",
            indoorSource: "none",
            indoorSourceDurationMinutes: 0,
            indoorSourceStartMinute: 0,
          },
        }),
      });

      const postRes = await postRoom(postReq);
      assert.strictEqual(postRes.status, 200);
      const postData = await postRes.json();
      assert.strictEqual(postData.success, true);

      const getReq = new NextRequest("http://localhost:3000/api/simulator/rooms?userId=user_api_test");
      const getRes = await getRooms(getReq);
      assert.strictEqual(getRes.status, 200);
      const getData = await getRes.json();
      assert.ok(Array.isArray(getData.rooms));
    });
  });

  describe("GET /api/conversations", () => {
    it("returns 200 with user conversation session list", async () => {
      const req = new NextRequest("http://localhost:3000/api/conversations?userId=user_api_test");
      const res = await getConversations(req);

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.conversations));
    });
  });
});
