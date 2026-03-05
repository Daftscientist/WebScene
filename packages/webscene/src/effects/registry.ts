import type { EffectHandler } from './types';

export class EffectRegistry {
  private readonly handlers = new Map<string, EffectHandler>();

  public register(handler: EffectHandler): void {
    this.handlers.set(handler.type, handler);
  }

  public get(type: string): EffectHandler | undefined {
    return this.handlers.get(type);
  }
}
