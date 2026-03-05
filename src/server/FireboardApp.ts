/**
 * CameraApp — MentraOS AppServer for the Camera template.
 *
 * Handles the glasses lifecycle (onSession/onStop).
 * All per-user state is managed by the User class via SessionManager.
 */

import { AppServer, AppSession, ToolCall } from "@mentra/sdk";
import { sessions } from "./manager/SessionManager";
import {
  getCurrentTemperatures,
  getTemperatureBehaviorOverDuration,
  getTemperatureBehaviorBetween,
} from "./fireboard/tool_handlers";
import {
  ToolId,
  getCurrentTemperaturesSchema,
  getTemperatureBehaviorOverDurationSchema,
  getTemperatureBehaviorBetweenSchema,
} from "./fireboard/tools";

export interface FireboardAppConfig {
  packageName: string;
  apiKey: string;
  port: number;
  cookieSecret?: string;
}

export class FireboardApp extends AppServer {
  constructor(config: FireboardAppConfig) {
    super({
      packageName: config.packageName,
      apiKey: config.apiKey,
      port: config.port,
      cookieSecret: config.cookieSecret,
    });
  }

  /** Called when a user launches the app on their glasses */
  protected async onSession(
    session: AppSession,
    sessionId: string,
    userId: string,
  ): Promise<void> {
    console.log(`🔥 Fireboard session started for ${userId}`);
    const user = sessions.getOrCreate(userId);
    user.setAppSession(session);
  }

  /** Called when a user closes the app or disconnects */
  protected async onStop(
    sessionId: string,
    userId: string,
    reason: string,
  ): Promise<void> {
    console.log(`👋 Fireboard session ended for ${userId}: ${reason}`);
    try {
      sessions.remove(userId);
      console.log(`Cleaned up session for ${userId}`);
    } catch (err) {
      console.error(`Error during session cleanup for ${userId}:`, err);
    }
  }

  protected async onToolCall(toolCall: ToolCall): Promise<string | undefined> {
    const { toolId, toolParameters, userId } = toolCall;

    if (toolId === ToolId.GetCurrentTemperatures) {
      const parsed = getCurrentTemperaturesSchema.safeParse(toolParameters);
      if (!parsed.success) {
        return `Invalid parameters: ${parsed.error.issues.map((e) => e.message).join(", ")}`;
      }

      return getCurrentTemperatures(userId);
    }

    if (toolId === ToolId.GetTemperatureBehaviorOverDuration) {
      const parsed = getTemperatureBehaviorOverDurationSchema.safeParse(toolParameters);
      if (!parsed.success) {
        return `Invalid parameters: ${parsed.error.issues.map((e) => e.message).join(", ")}`;
      }

      const { duration } = parsed.data;
      return getTemperatureBehaviorOverDuration(userId, duration);
    }

    if (toolId === ToolId.GetTemperatureBehaviorBetween) {
      const parsed = getTemperatureBehaviorBetweenSchema.safeParse(toolParameters);
      if (!parsed.success) {
        return `Invalid parameters: ${parsed.error.issues.map((e) => e.message).join(", ")}`;
      }

      const { start, end } = parsed.data;
      return getTemperatureBehaviorBetween(userId, start, end);
    }

    return undefined;
  }
}
