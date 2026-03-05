export interface PoolFactory<T> {
  create(): T;
  reset(value: T): void;
}

export class ObjectPool<T> {
  private readonly values: T[] = [];

  public constructor(private readonly factory: PoolFactory<T>) {}

  public acquire(): T {
    const value = this.values.pop();
    return value ?? this.factory.create();
  }

  public release(value: T): void {
    this.factory.reset(value);
    this.values.push(value);
  }

  public clear(): void {
    this.values.length = 0;
  }
}
