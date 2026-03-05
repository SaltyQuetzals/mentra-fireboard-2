import type { Context } from "hono";
import { sessions } from "../manager/SessionManager";

/** GET /fireboard-api-key */
export async function getApiKey(c: Context) {
  const userId = c.req.query("userId");

  if (!userId) return c.json({ error: "userId is required" }, 400);

  const user = sessions.get(userId);
  if (!user?.appSession) {
    return c.json({ error: `No active session for user ${userId}` }, 404);
  }

  try {
    const apiKey = await user.storage.getApiKey();
    return c.json({ apiKey, userId });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}

/** POST /fireboard-api-key */
export async function setApiKey(c: Context) {
  const { userId, apiKey } = await c.req.json();

  if (!userId) return c.json({ error: "userId is required" }, 400);
  if (!apiKey || typeof apiKey !== "string") {
    return c.json({ error: "apiKey is required" }, 400);
  }

  const user = sessions.get(userId);
  if (!user?.appSession) {
    return c.json({ error: `No active session for user ${userId}` }, 404);
  }

  try {
    await user.storage.setApiKey(apiKey);
    return c.json({ success: true, apiKey, userId });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}
