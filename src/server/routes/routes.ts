/**
 * API Route Definitions
 *
 * Maps HTTP methods + paths to handler functions.
 * Each handler lives in its own file under api/.
 */

import { Hono } from "hono";
import { getHealth } from "../api/health";
import { getApiKey, setApiKey } from "../api/storage";

export const api = new Hono();

// Health
api.get("/health", getHealth);

// Storage / preferences
api.get("/fireboard-api-key", getApiKey);
api.post("/fireboard-api-key", setApiKey);
