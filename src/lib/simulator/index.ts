/**
 * SaansAI Indoor Air Quality Simulator Module.
 * Exports mass-balance physical ODE solvers, scenario comparisons, room stores, and practical hacks.
 */

export * from "./types";
export * from "./constants";
export { runIndoorSimulation } from "./engine";
export { compareIndoorScenarios, PRESET_SCENARIO_COMPARISONS } from "./scenarios";
export { generateIndoorRecommendations } from "./recommendations";
export { PRACTICAL_INDOOR_HACKS } from "./indoor-hacks";
export { getUserRooms, getRoomById, saveUserRoom, deleteUserRoom } from "./room-store";
export { getOutdoorConditionsForSimulation } from "./data-adapter";
