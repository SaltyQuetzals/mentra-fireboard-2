import type { User } from "../session/User";

/**
 * StorageManager — read/write user preferences via MentraOS Simple Storage.
 */
export class StorageManager {
  constructor(private user: User) {}

  /** Get the user's Fireboard API key, defaults to empty string */
  async getApiKey(): Promise<string> {
    const session = this.user.appSession;
    if (!session) return "";

    try {
      const apiKey = await session.simpleStorage.get("fireboardApiKey");
      if (typeof apiKey === "string") return apiKey;
      return "";
    } catch {
      return "";
    }
  }

  /** Save the user's Fireboard API key */
  async setApiKey(apiKey: string): Promise<void> {
    const session = this.user.appSession;
    if (!session) throw new Error("No active glasses session");
    await session.simpleStorage.set("fireboardApiKey", apiKey);
  }
}
