import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  saveUserRoom,
  getRoomById,
  deleteUserRoom,
  resetUserRooms,
} from "@/lib/simulator/room-store";
import { RoomConfigurationSchema } from "@/lib/simulator/types";

describe("SaansAI Simulator Security, Isolation & Validation", () => {
  const userAlice = "user_alice_sim";
  const userBob = "user_bob_sim";

  it("strictly enforces cross-user room isolation", () => {
    resetUserRooms(userAlice);
    resetUserRooms(userBob);

    // Alice saves a private room
    const aliceRoom = saveUserRoom(userAlice, {
      name: "Alice Private Sanctuary",
      roomType: "bedroom",
      dimensions: { lengthM: 4.5, widthM: 4.0, heightM: 3.0 },
    });

    // Bob attempts to query Alice's room
    const bobAttempt = getRoomById(userBob, aliceRoom.id);
    assert.equal(bobAttempt, null, "User Bob must NOT be able to access User Alice's room");

    // Bob attempts to delete Alice's room
    const bobDeleteAttempt = deleteUserRoom(userBob, aliceRoom.id);
    assert.equal(bobDeleteAttempt, false, "User Bob must NOT be able to delete User Alice's room");

    // Verify Alice's room still exists intact
    const aliceCheck = getRoomById(userAlice, aliceRoom.id);
    assert.ok(aliceCheck);
    assert.equal(aliceCheck.config.name, "Alice Private Sanctuary");
  });

  it("validates room dimensions and rejects out-of-bounds parameters", () => {
    // Negative length
    const invalidNegative = RoomConfigurationSchema.safeParse({
      name: "Invalid Room",
      dimensions: { lengthM: -5, widthM: 4.0, heightM: 3.0 },
    });
    assert.equal(invalidNegative.success, false);

    // Unrealistic length (>30 meters)
    const invalidTooLong = RoomConfigurationSchema.safeParse({
      name: "Invalid Room",
      dimensions: { lengthM: 100, widthM: 4.0, heightM: 3.0 },
    });
    assert.equal(invalidTooLong.success, false);

    // Unrealistic height (<2 meters or >6 meters)
    const invalidLowCeiling = RoomConfigurationSchema.safeParse({
      name: "Invalid Room",
      dimensions: { lengthM: 4.0, widthM: 4.0, heightM: 1.2 },
    });
    assert.equal(invalidLowCeiling.success, false);
  });
});
