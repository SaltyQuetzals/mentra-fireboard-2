import { AppSession } from "@mentra/sdk";
import { StorageManager } from "../manager/StorageManager";
import { InputManager } from "../manager/InputManager";

/**
 * User — per-user state container.
 *
 * Composes all managers and holds the glasses AppSession.
 * Created when a user connects (glasses or webview) and
 * destroyed when the session is cleaned up.
 */
export class User {
  /** Active glasses connection, null when webview-only */
  appSession: AppSession | null = null;

  /** User preferences via MentraOS Simple Storage */
  storage: StorageManager;

  /** Button presses and touchpad gestures */
  input: InputManager;

  constructor(public readonly userId: string) {
    this.storage = new StorageManager(this);
    this.input = new InputManager(this);
  }

  /** Wire up a glasses connection — sets up all event listeners */
  setAppSession(session: AppSession): void {
    this.appSession = session;
    this.input.setup(session);
    console.log(`📱 Session ready for ${this.userId}`);
  }

  /** Disconnect glasses but keep user alive */
  clearAppSession(): void {
    this.appSession = null;
  }

  /** Nuke everything — call on full disconnect */
  cleanup(): void {
    this.appSession = null;
  }
}
