import { FireboardClient } from "./fireboard_client";
import {
  retrieveRealtimeTemperatureOfDevice,
  retrieveSessionChartData,
} from "./api";
import type { ChartData } from "./api_types";

export async function getAuthenticatedClient(userId: string): Promise<FireboardClient | { error: string }> {
  const { sessions } = await import("../manager/SessionManager");
  const user = sessions.get(userId);
  if (!user) {
    return { error: "No active session. Please open the Fireboard app first." };
  }

  const apiKey = await user.storage.getApiKey();
  if (!apiKey) {
    return {
      error: "Fireboard API key is missing. Please set your API key in the app settings. The application does not work without it.",
    };
  }

  const client = new FireboardClient({ token: apiKey });
  try {
    await client.authenticate();
  } catch (err) {
    return {
      error: "Your Fireboard API key is not authenticating. Please check your API key and try again.",
    };
  }

  return client;
}

export async function getActiveSessionId(
  client: FireboardClient,
): Promise<{ sessionId: number; clamped?: boolean } | { error: string }> {
  const sessions = await client.listAllSessions();
  if (sessions.length === 0) {
    return { error: "No active smoking session. Please start a session on your Fireboard device first." };
  }

  const activeSessions = sessions.filter((s) => {
    const endTime = new Date(s.end_time);
    return endTime.getTime() > Date.now();
  });

  if (activeSessions.length === 0) {
    const sortedSessions = sessions.sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    );
    return {
      sessionId: sortedSessions[0].id,
      clamped: true,
    };
  }

  return { sessionId: activeSessions[0].id };
}

function describeTemperatureBehavior(chartData: ChartData[]): string {
  if (!chartData || chartData.length === 0) {
    return "No temperature data available for this time period.";
  }

  const descriptions: string[] = [];

  for (const channel of chartData) {
    if (!channel.enabled || channel.y.length === 0) continue;

    const temps = channel.y;
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    const first = temps[0];
    const last = temps[temps.length - 1];
    const change = last - first;

    let trend = "stable";
    if (change > 5) trend = "increasing";
    else if (change < -5) trend = "decreasing";

    descriptions.push(
      `${channel.label}: min ${min.toFixed(1)}°F, max ${max.toFixed(1)}°F, avg ${avg.toFixed(1)}°F, trend: ${trend} (${change > 0 ? "+" : ""}${change.toFixed(1)}°F from start)`,
    );
  }

  return descriptions.join("\n") || "No temperature data available.";
}

function parseISODuration(duration: string): number {
  const match = duration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) {
    return 0;
  }

  const days = parseInt(match[1] || "0", 10);
  const hours = parseInt(match[2] || "0", 10);
  const minutes = parseInt(match[3] || "0", 10);
  const seconds = parseInt(match[4] || "0", 10);

  return (
    days * 24 * 60 * 60 * 1000 +
    hours * 60 * 60 * 1000 +
    minutes * 60 * 1000 +
    seconds * 1000
  );
}

export async function getCurrentTemperatures(userId: string): Promise<string> {
  const clientResult = await getAuthenticatedClient(userId);
  if ("error" in clientResult) {
    return clientResult.error;
  }

  const sessionResult = await getActiveSessionId(clientResult);
  if ("error" in sessionResult) {
    return sessionResult.error;
  }

  const session = await clientResult.retrieveSpecificSession(sessionResult.sessionId);
  const temps: string[] = [];

  for (const device of session.devices) {
    for (const channel of device.channels) {
      if (channel.enabled && channel.sessionid === sessionResult.sessionId) {
        const realtimeData = await retrieveRealtimeTemperatureOfDevice(
          clientResult.token!,
          device.uuid,
        );
        const channelData = (realtimeData as any[]).filter(
          (d) => d.channel_id === channel.channel,
        );
        if (channelData.length > 0) {
          const latest = channelData[channelData.length - 1];
          temps.push(`${device.title} - ${channel.channel_label}: ${latest.temp}°F`);
        }
      }
    }
  }

  return temps.length > 0
    ? `Current temperatures:\n${temps.join("\n")}`
    : "No temperature data available for the current session.";
}

export async function getTemperatureBehaviorOverDuration(
  userId: string,
  duration: string,
): Promise<string> {
  const clientResult = await getAuthenticatedClient(userId);
  if ("error" in clientResult) {
    return clientResult.error;
  }

  const sessionResult = await getActiveSessionId(clientResult);
  if ("error" in sessionResult) {
    return sessionResult.error;
  }

  const session = await clientResult.retrieveSpecificSession(sessionResult.sessionId);
  const startTime = new Date(session.start_time);
  const now = new Date();
  const durationMs = parseISODuration(duration);
  const requestedStart = new Date(now.getTime() - durationMs);

  let clamped = false;
  if (requestedStart < startTime) {
    clamped = true;
  }

  const chartData = await retrieveSessionChartData(
    clientResult.token!,
    sessionResult.sessionId,
  );

  const description = describeTemperatureBehavior(chartData as ChartData[]);

  let response = `Temperature behavior over the last ${duration}:\n${description}`;
  if (clamped) {
    response += `\n\nNote: The requested duration exceeds the session start time, so the data was clamped to the session start (${startTime.toISOString()}).`;
  }

  return response;
}

export async function getTemperatureBehaviorBetween(
  userId: string,
  start: string,
  end: string,
): Promise<string> {
  const clientResult = await getAuthenticatedClient(userId);
  if ("error" in clientResult) {
    return clientResult.error;
  }

  const sessionResult = await getActiveSessionId(clientResult);
  if ("error" in sessionResult) {
    return sessionResult.error;
  }

  const session = await clientResult.retrieveSpecificSession(sessionResult.sessionId);
  const sessionStart = new Date(session.start_time);
  const sessionEnd = new Date(session.end_time);

  const parsedStart = new Date(start);
  const parsedEnd = new Date(end);

  let clamped = false;

  if (parsedStart < sessionStart) {
    clamped = true;
  }
  if (parsedEnd > sessionEnd) {
    clamped = true;
  }

  const chartData = await retrieveSessionChartData(
    clientResult.token!,
    sessionResult.sessionId,
  );

  const description = describeTemperatureBehavior(chartData as ChartData[]);

  let response = `Temperature behavior between ${start} and ${end}:\n${description}`;
  if (clamped) {
    response += `\n\nNote: The requested time range exceeds the session data limits, so the data was clamped to the session range (${sessionStart.toISOString()} to ${sessionEnd.toISOString()}).`;
  }

  return response;
}
