export interface RealtimeProvider {
  publish(userId: string, event: string, payload: unknown): Promise<void>;
  subscribe(
    userId: string,
    onMessage: (event: string, payload: unknown) => void
  ): Promise<() => void>;
}
