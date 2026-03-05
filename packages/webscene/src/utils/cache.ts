export class LruCache<TKey, TValue> {
  private readonly map = new Map<TKey, TValue>();

  public constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error('LruCache capacity must be a positive integer');
    }
  }

  public get(key: TKey): TValue | undefined {
    const value = this.map.get(key);
    if (value === undefined) {
      return undefined;
    }

    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  public set(key: TKey, value: TValue): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, value);

    if (this.map.size > this.capacity) {
      const first = this.map.keys().next().value;
      if (first !== undefined) {
        this.map.delete(first);
      }
    }
  }

  public clear(): void {
    this.map.clear();
  }
}
