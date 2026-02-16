// Base repository interface following Repository Pattern
export interface IDataRepository<T, TFilter = any> {
  getAll(filter?: TFilter): Promise<T[]>;
  getById(id: number): Promise<T>;
  create(data: Partial<T>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}

// HTTP-specific repository interface
export interface IHttpRepository<T, TFilter = any> extends IDataRepository<T, TFilter> {
  readonly baseUrl: string;
}
