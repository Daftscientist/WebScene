export type EventHandler<TPayload> = (payload: TPayload) => void;

export class EventEmitter<TEvents extends object> {
  private readonly listeners = new Map<keyof TEvents, Set<EventHandler<unknown>>>();

  public on<TName extends keyof TEvents>(name: TName, handler: EventHandler<TEvents[TName]>): () => void {
    let handlers = this.listeners.get(name);
    if (!handlers) {
      handlers = new Set<EventHandler<unknown>>();
      this.listeners.set(name, handlers);
    }
    handlers.add(handler as EventHandler<unknown>);

    return () => {
      handlers?.delete(handler as EventHandler<unknown>);
      if (handlers?.size === 0) {
        this.listeners.delete(name);
      }
    };
  }

  public emit<TName extends keyof TEvents>(name: TName, payload: TEvents[TName]): void {
    const handlers = this.listeners.get(name);
    if (!handlers || handlers.size === 0) {
      return;
    }

    for (const handler of handlers) {
      (handler as EventHandler<TEvents[TName]>)(payload);
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}
