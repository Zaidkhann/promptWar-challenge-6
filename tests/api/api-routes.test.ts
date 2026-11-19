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
import { GET as getRoomById, PUT as putRoomById, DELETE as deleteRoomById } from "@/app/api/simulator/rooms/[id]/route";
import { GET as getConversations, POST as postConversation } from "@/app/api/conversations/route";
import { GET as getConversationById, PUT as putConversationById, DELETE as deleteConversationById } from "@/app/api/conversations/[id]/route";
import { POST as postChat } from "@/app/api/chat/route";

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

  describe("GET & POST & DELETE /api/simulator/rooms/[id]", () => {
    it("handles single room CRUD lifecycle", async () => {
      // 1. Create a room first
      const createReq = new NextRequest("http://localhost:3000/api/simulator/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_crud_test",
          room: {
            name: "Study Room",
            roomType: "office",
            dimensions: { lengthM: 3, widthM: 3, heightM: 2.8 },
            infiltrationLevel: "standard_indian_apartment",
            ventilationMode: "closed_windows",
            hasAirPurifier: true,
            purifierCADR: 200,
            purifierFanSpeed: "medium",
            indoorSource: "none",
            indoorSourceDurationMinutes: 0,
            indoorSourceStartMinute: 0,
          },
        }),
      });
      const createRes = await postRoom(createReq);
      assert.strictEqual(createRes.status, 200);
      const createData = await createRes.json();
      const roomId = createData.room.id;

      // 2. GET by ID
      const getReq = new NextRequest(`http://localhost:3000/api/simulator/rooms/${roomId}?userId=user_crud_test`);
      const getRes = await getRoomById(getReq, { params: Promise.resolve({ id: roomId }) });
      assert.strictEqual(getRes.status, 200);
      const getData = await getRes.json();
      assert.strictEqual(getData.room.id, roomId);

      // 3. PUT by ID
      const putReq = new NextRequest(`http://localhost:3000/api/simulator/rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_crud_test",
          room: { name: "Updated Study Room" },
        }),
      });
      const putRes = await putRoomById(putReq, { params: Promise.resolve({ id: roomId }) });
      assert.strictEqual(putRes.status, 200);

      // 4. DELETE by ID
      const delReq = new NextRequest(`http://localhost:3000/api/simulator/rooms/${roomId}?userId=user_crud_test`, {
        method: "DELETE",
      });
      const delRes = await deleteRoomById(delReq, { params: Promise.resolve({ id: roomId }) });
      assert.strictEqual(delRes.status, 200);
    });
  });

  describe("Conversations API Suite", () => {
    it("creates, retrieves, and clears conversation sessions", async () => {
      // 1. POST create conversation
      const postReq = new NextRequest("http://localhost:3000/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_conv_test",
          title: "Winter Smog Defense Query",
        }),
      });
      const postRes = await postConversation(postReq);
      assert.strictEqual(postRes.status, 201);
      const postData = await postRes.json();
      const convId = postData.conversation.id;

      // 2. GET by ID
      const getReq = new NextRequest(`http://localhost:3000/api/conversations/${convId}?userId=user_conv_test`);
      const getRes = await getConversationById(getReq, { params: Promise.resolve({ id: convId }) });
      assert.strictEqual(getRes.status, 200);

      // 3. PUT clear messages
      const putReq = new NextRequest(`http://localhost:3000/api/conversations/${convId}?userId=user_conv_test`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user_conv_test" }),
      });
      const putRes = await putConversationById(putReq, { params: Promise.resolve({ id: convId }) });
      assert.strictEqual(putRes.status, 200);

      // 4. DELETE conversation
      const delReq = new NextRequest(`http://localhost:3000/api/conversations/${convId}?userId=user_conv_test`, {
        method: "DELETE",
      });
      const delRes = await deleteConversationById(delReq, { params: Promise.resolve({ id: convId }) });
      assert.strictEqual(delRes.status, 200);

      // 5. GET all user conversations
      const listReq = new NextRequest("http://localhost:3000/api/conversations?userId=user_conv_test");
      const listRes = await getConversations(listReq);
      assert.strictEqual(listRes.status, 200);
      const listData = await listRes.json();
      assert.ok(Array.isArray(listData.conversations));
    });
  });

  describe("POST /api/chat", () => {
    it("returns 400 when chat request payload is empty or invalid", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await postChat(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, "INVALID_CHAT_REQUEST");
    });

    it("returns 200 SSE stream for a valid conversational query", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "What is the current AQI in Delhi?",
          userId: "user_chat_test",
          scenario: "delhi-anand-vihar",
        }),
      });

      const res = await postChat(req);
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers.get("content-type")?.includes("text/event-stream"));
      assert.ok(res.body);
    });
  });
});
