import { EventEmitter } from "node:events";
import { RealtimeProvider } from "../../ports/realtime.provider";

export class MemoryRealtimeProvider implements RealtimeProvider {
  private emitter = new EventEmitter();

  async publish(userId: string, event: string, payload: unknown): Promise<void> {
    this.emitter.emit(`user:${userId}`, { event, payload });
  }

  async subscribe(
    userId: string,
    onMessage: (event: string, payload: unknown) => void
  ): Promise<() => void> {
    const channel = `user:${userId}`;
    const listener = (data: { event: string; payload: unknown }) => {
      onMessage(data.event, data.payload);
    };
    this.emitter.on(channel, listener);
    return () => {
      this.emitter.off(channel, listener);
    };
  }
}
