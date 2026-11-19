import "server-only";
import { RoomConfiguration, RoomConfigurationSchema, StoredRoom } from "./types";
import { DEFAULT_ROOM_PROFILES } from "./constants";

export type { StoredRoom };

// In-memory persistent room store partitioned by userId
const userRoomMap = new Map<string, Map<string, StoredRoom>>();

/**
 * Initializes default rooms for a user if they have none.
 */
function ensureUserRooms(userId: string): Map<string, StoredRoom> {
  let rooms = userRoomMap.get(userId);
  if (!rooms) {
    rooms = new Map<string, StoredRoom>();
    const now = new Date().toISOString();

    for (const [key, config] of Object.entries(DEFAULT_ROOM_PROFILES)) {
      rooms.set(key, {
        id: key,
        userId,
        createdAt: now,
        updatedAt: now,
        config: { ...config, id: key },
      });
    }
    userRoomMap.set(userId, rooms);
  }
  return rooms;
}

export function getUserRooms(userId: string): StoredRoom[] {
  const rooms = ensureUserRooms(userId);
  return Array.from(rooms.values());
}

export function getRoomById(userId: string, roomId: string): StoredRoom | null {
  const rooms = ensureUserRooms(userId);
  const found = rooms.get(roomId);
  if (!found || found.userId !== userId) {
    return null;
  }
  return found;
}

export function saveUserRoom(userId: string, config: Partial<RoomConfiguration>): StoredRoom {
  const rooms = ensureUserRooms(userId);
  const roomId = config.id || `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // Validate configuration against Zod
  const existing = rooms.get(roomId);
  const mergedConfig = {
    ...(existing?.config || DEFAULT_ROOM_PROFILES.default_bedroom),
    ...config,
    id: roomId,
  };

  const validatedConfig = RoomConfigurationSchema.parse(mergedConfig);

  const storedRoom: StoredRoom = {
    id: roomId,
    userId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    config: validatedConfig,
  };

  rooms.set(roomId, storedRoom);
  return storedRoom;
}

export function deleteUserRoom(userId: string, roomId: string): boolean {
  const rooms = userRoomMap.get(userId);
  if (!rooms) return false;

  const room = rooms.get(roomId);
  if (!room || room.userId !== userId) {
    return false;
  }

  return rooms.delete(roomId);
}

export function resetUserRooms(userId: string): void {
  userRoomMap.delete(userId);
}
