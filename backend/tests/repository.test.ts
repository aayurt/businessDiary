import { describe, it, expect, vi } from "vitest";
import { BaseRepository } from "../src/lib/repository.js";

function createMockModel() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  };
}

interface TestEntity {
  id: string;
  name: string;
}

describe("BaseRepository", () => {
  it("findAll delegates to model.findMany", async () => {
    const model = createMockModel();
    model.findMany.mockResolvedValue([{ id: "1", name: "Test" }]);
    const repo = new BaseRepository<TestEntity>(model);

    const results = await repo.findAll({ where: { name: "Test" } });

    expect(model.findMany).toHaveBeenCalledWith({
      where: { name: "Test" },
    });
    expect(results).toHaveLength(1);
  });

  it("findById delegates to model.findUnique", async () => {
    const model = createMockModel();
    model.findUnique.mockResolvedValue({ id: "1", name: "Test" });
    const repo = new BaseRepository<TestEntity>(model);

    const result = await repo.findById("1");

    expect(model.findUnique).toHaveBeenCalledWith({ where: { id: "1" } });
    expect(result).toEqual({ id: "1", name: "Test" });
  });

  it("findById returns null when not found", async () => {
    const model = createMockModel();
    model.findUnique.mockResolvedValue(null);
    const repo = new BaseRepository<TestEntity>(model);

    const result = await repo.findById("1");
    expect(result).toBeNull();
  });

  it("findOne delegates to model.findFirst", async () => {
    const model = createMockModel();
    model.findFirst.mockResolvedValue({ id: "1", name: "Test" });
    const repo = new BaseRepository<TestEntity>(model);

    const result = await repo.findOne({ where: { email: "test@test.com" } });

    expect(model.findFirst).toHaveBeenCalledWith({
      where: { email: "test@test.com" },
    });
    expect(result).toEqual({ id: "1", name: "Test" });
  });

  it("create delegates to model.create", async () => {
    const model = createMockModel();
    model.create.mockResolvedValue({ id: "1", name: "Created" });
    const repo = new BaseRepository<TestEntity, { name: string }>(model);

    const result = await repo.create({ data: { name: "Created" } });

    expect(model.create).toHaveBeenCalledWith({ data: { name: "Created" } });
    expect(result).toEqual({ id: "1", name: "Created" });
  });

  it("update delegates to model.update", async () => {
    const model = createMockModel();
    model.update.mockResolvedValue({ id: "1", name: "Updated" });
    const repo = new BaseRepository<TestEntity, { name: string }>(model);

    const result = await repo.update({
      where: { id: "1" },
      data: { name: "Updated" },
    });

    expect(model.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { name: "Updated" },
    });
    expect(result).toEqual({ id: "1", name: "Updated" });
  });

  it("delete delegates to model.delete", async () => {
    const model = createMockModel();
    model.delete.mockResolvedValue({ id: "1", name: "Deleted" });
    const repo = new BaseRepository<TestEntity>(model);

    const result = await repo.delete({ where: { id: "1" } });

    expect(model.delete).toHaveBeenCalledWith({ where: { id: "1" } });
    expect(result).toEqual({ id: "1", name: "Deleted" });
  });

  it("upsert delegates to model.upsert", async () => {
    const model = createMockModel();
    model.upsert.mockResolvedValue({ id: "1", name: "Upserted" });
    const repo = new BaseRepository<TestEntity, { name: string }>(model);

    const result = await repo.upsert({
      where: { id: "1" },
      create: { name: "Created" },
      update: { name: "Updated" },
    });

    expect(model.upsert).toHaveBeenCalledWith({
      where: { id: "1" },
      create: { name: "Created" },
      update: { name: "Updated" },
    });
    expect(result).toEqual({ id: "1", name: "Upserted" });
  });

  it("count delegates to model.count", async () => {
    const model = createMockModel();
    model.count.mockResolvedValue(42);
    const repo = new BaseRepository<TestEntity>(model);

    const result = await repo.count({ where: { active: true } });

    expect(model.count).toHaveBeenCalledWith({ where: { active: true } });
    expect(result).toBe(42);
  });
});
