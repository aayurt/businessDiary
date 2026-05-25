export type PrismaModel = {
  findUnique: (args: unknown) => Promise<unknown>;
  findFirst: (args: unknown) => Promise<unknown>;
  findMany: (args: unknown) => Promise<unknown[]>;
  count: (args: unknown) => Promise<number>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
  upsert: (args: unknown) => Promise<unknown>;
};

export interface FindAllParams {
  where?: Record<string, unknown>;
  orderBy?: Record<string, "asc" | "desc">;
  skip?: number;
  take?: number;
  include?: Record<string, unknown>;
  select?: Record<string, boolean>;
}

export interface FindOneParams {
  where: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, boolean>;
}

export interface CreateParams {
  data: Record<string, unknown>;
  select?: Record<string, boolean>;
}

export interface UpdateParams {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
  select?: Record<string, boolean>;
}

export interface DeleteParams {
  where: Record<string, unknown>;
}

export interface UpsertParams {
  where: Record<string, unknown>;
  create: Record<string, unknown>;
  update: Record<string, unknown>;
}

export class BaseRepository<T> {
  protected readonly model: PrismaModel;

  constructor(model: PrismaModel) {
    this.model = model;
  }

  async findAll(params?: FindAllParams): Promise<T[]> {
    return (await this.model.findMany({
      ...params,
    })) as T[];
  }

  async findById(id: string): Promise<T | null> {
    return (await this.model.findUnique({
      where: { id },
    })) as T | null;
  }

  async findOne(params: FindOneParams): Promise<T | null> {
    return (await this.model.findFirst(params)) as T | null;
  }

  async create(params: CreateParams): Promise<T> {
    return (await this.model.create(params)) as T;
  }

  async update(params: UpdateParams): Promise<T> {
    return (await this.model.update(params)) as T;
  }

  async delete(params: DeleteParams): Promise<T> {
    return (await this.model.delete(params)) as T;
  }

  async upsert(params: UpsertParams): Promise<T> {
    return (await this.model.upsert(params)) as T;
  }

  async count(params?: { where?: Record<string, unknown> }): Promise<number> {
    return this.model.count(params ?? {});
  }
}
