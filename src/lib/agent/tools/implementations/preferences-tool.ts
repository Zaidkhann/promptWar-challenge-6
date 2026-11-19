import "server-only";
import { z } from "zod";
import { AgentTool } from "../types";
import { getUserPreferences, updateUserPreferences } from "../../user-store";

// Tool F: get_user_preferences
export const getUserPreferencesTool: AgentTool = {
  name: "get_user_preferences",
  description:
    "Retrieve the current authenticated user's lifestyle and routine preferences (preferred activity time, location type, commute mode, and sensitivity). Strictly scoped to the authenticated user.",
  parameters: {
    type: "object",
    properties: {},
  },
  argumentSchema: z.object({}),
  execute: async (_args, context) => {
    const userId = context.userId;
    if (!userId) {
      throw new Error("UNAUTHORIZED_ACCESS: Missing user authentication context.");
    }

    const prefs = getUserPreferences(userId);
    return {
      userId,
      preferences: prefs,
      description: {
        preferredTime: `Preferred slot: ${prefs.preferredTime}`,
        locationType: `Environment preference: ${prefs.locationType}`,
        commuteMode: `Transit mode: ${prefs.commuteMode}`,
        activityType: `Primary activity: ${prefs.activityType}`,
        sensitivity: `Sensitivity setting: ${prefs.sensitivity}`,
      },
    };
  },
};

// Tool G: update_user_preferences
export const updateUserPreferencesTool: AgentTool = {
  name: "update_user_preferences",
  description:
    "Update the authenticated user's lifestyle preferences. REQUIRES EXPLICIT USER CONFIRMATION before applying changes. If user has not explicitly confirmed, pass isConfirmed=false to generate a proposal for confirmation.",
  parameters: {
    type: "object",
    properties: {
      preferredTime: {
        type: "string",
        description: "Activity time of day",
        enum: ["morning", "midday", "evening", "night"],
      },
      locationType: {
        type: "string",
        description: "Environment preference",
        enum: ["outdoor_preferred", "indoor_preferred", "balanced"],
      },
      commuteMode: {
        type: "string",
        description: "Commute transit mode",
        enum: ["walking", "cycling", "public_transit", "two_wheeler", "car_cab"],
      },
      activityType: {
        type: "string",
        description: "Primary daily activity focus",
        enum: ["walking", "studying_deskwork", "outdoor_exercise", "commuting", "general_errands"],
      },
      sensitivity: {
        type: "string",
        description: "Physiological sensitivity setting",
        enum: ["standard", "respiratory_sensitivity", "vulnerable_household"],
      },
      isConfirmed: {
        type: "boolean",
        description: "MUST BE TRUE only if the user has explicitly confirmed the requested change in the conversation.",
      },
    },
    required: ["isConfirmed"],
  },
  argumentSchema: z.object({
    preferredTime: z.enum(["morning", "midday", "evening", "night"]).optional(),
    locationType: z.enum(["outdoor_preferred", "indoor_preferred", "balanced"]).optional(),
    commuteMode: z.enum(["walking", "cycling", "public_transit", "two_wheeler", "car_cab"]).optional(),
    activityType: z.enum(["walking", "studying_deskwork", "outdoor_exercise", "commuting", "general_errands"]).optional(),
    sensitivity: z.enum(["standard", "respiratory_sensitivity", "vulnerable_household"]).optional(),
    isConfirmed: z.boolean(),
  }),
  execute: async (args, context) => {
    const userId = context.userId;
    if (!userId) {
      throw new Error("UNAUTHORIZED_ACCESS: Missing user authentication context.");
    }

    const { isConfirmed, ...preferenceUpdates } = args;

    // Safety Gate: Require explicit user confirmation
    if (!isConfirmed) {
      const current = getUserPreferences(userId);
      return {
        status: "CONFIRMATION_REQUIRED",
        message: "Preference update proposed but not yet saved. You must ask the user for confirmation.",
        proposedUpdates: preferenceUpdates,
        currentPreferences: current,
        instruction:
          "Show the user the exact proposed changes and ask: 'Would you like me to save these changes to your profile?'",
      };
    }

    const result = updateUserPreferences(userId, preferenceUpdates);
    if (!result.success) {
      return {
        status: "VALIDATION_FAILED",
        error: result.error,
      };
    }

    return {
      status: "SUCCESSFULLY_UPDATED",
      message: "User preferences updated and saved successfully.",
      updatedPreferences: result.preferences,
    };
  },
};
