import { z } from "zod";

export enum ToolId {
  GetCurrentTemperatures = "get_current_temperatures",
  GetTemperatureBehaviorOverDuration = "get_temperature_behavior_over_duration",
  GetTemperatureBehaviorBetween = "get_temperature_behavior_between",
}

export const getCurrentTemperaturesSchema = z.object({});

export const getTemperatureBehaviorOverDurationSchema = z.object({
  duration: z.iso.duration().describe("ISO-8601 duration (e.g., 'PT1H' for 1 hour, 'P1D' for 1 day)"),
});

export const getTemperatureBehaviorBetweenSchema = z.object({
  start: z.iso.datetime().describe("ISO-8601 timestamp for the start time"),
  end: z.iso.datetime().describe("ISO-8601 timestamp for the end time"),
});

export type GetCurrentTemperaturesParams = z.infer<typeof getCurrentTemperaturesSchema>;
export type GetTemperatureBehaviorOverDurationParams = z.infer<typeof getTemperatureBehaviorOverDurationSchema>;
export type GetTemperatureBehaviorBetweenParams = z.infer<typeof getTemperatureBehaviorBetweenSchema>;
