import { describe, it, expect } from 'vitest';
import type {
  ApiResponse,
  ApiError,
  PaginationMeta,
  PaginationParams,
} from '../../types/contracts';

describe('ApiResponse contract spec', () => {
  it('success response has success=true, data, and no error', () => {
    const res: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: 'abc' },
    };

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.error).toBeUndefined();

    const serialized = JSON.parse(JSON.stringify(res));
    expect(Object.keys(serialized).sort()).toEqual(['data', 'success']);
  });

  it('error response has success=false, error, and no data', () => {
    const res: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    };

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.data).toBeUndefined();

    const serialized = JSON.parse(JSON.stringify(res));
    expect(Object.keys(serialized).sort()).toEqual(['error', 'success']);
  });

  it('success response with pagination meta', () => {
    const res: ApiResponse<string[]> = {
      success: true,
      data: ['a', 'b'],
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
    };

    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(2);
    expect(res.meta).toBeDefined();
    expect(res.error).toBeUndefined();

    const serialized = JSON.parse(JSON.stringify(res));
    expect(serialized).toHaveProperty('meta');
    expect(serialized).not.toHaveProperty('error');
  });

  it('success and error are mutually exclusive at runtime', () => {
    const successRes: ApiResponse = { success: true, data: { value: 1 } };
    const errorRes: ApiResponse = {
      success: false,
      error: { code: 'ERR', message: 'error' },
    };

    expect(successRes.error).toBeUndefined();
    expect(errorRes.data).toBeUndefined();
  });

  it('handles void/empty data type', () => {
    const res: ApiResponse = { success: true };
    expect(res.success).toBe(true);
    expect(res.data).toBeUndefined();
    expect(res.error).toBeUndefined();
  });

  it('handles array data type', () => {
    const res: ApiResponse<number[]> = { success: true, data: [1, 2, 3] };
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(3);
  });

  it('handles nested object data', () => {
    const res: ApiResponse<{ user: { name: string }; tags: string[] }> = {
      success: true,
      data: { user: { name: 'Alice' }, tags: ['a', 'b'] },
    };

    expect(res.data?.user.name).toBe('Alice');
    expect(res.data?.tags).toContain('b');
  });

  it('serializes only present fields', () => {
    const res: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: 'x' },
      meta: { page: 1, limit: 20, total: 100, totalPages: 5 },
    };

    const serialized = JSON.parse(JSON.stringify(res));
    expect(serialized).toHaveProperty('success');
    expect(serialized).toHaveProperty('data');
    expect(serialized).toHaveProperty('meta');
    expect(serialized).not.toHaveProperty('error');
  });
});

describe('ApiError contract spec', () => {
  it('creates error with all optional fields', () => {
    const error: ApiError = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: {
        email: ['Must be a valid email'],
        password: ['Must be at least 8 characters'],
      },
    };

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
    expect(error.details?.email).toEqual(['Must be a valid email']);
    expect(error.details?.password).toHaveLength(1);
  });

  it('creates error without details', () => {
    const error: ApiError = { code: 'NOT_FOUND', message: 'User not found' };
    expect(error.details).toBeUndefined();
  });

  it('serializes correctly', () => {
    const error: ApiError = {
      code: 'CONFLICT',
      message: 'Already exists',
      details: { field: ['value'] },
    };

    expect(JSON.parse(JSON.stringify(error))).toEqual({
      code: 'CONFLICT',
      message: 'Already exists',
      details: { field: ['value'] },
    });
  });

  it('handles empty details', () => {
    const error: ApiError = {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
      details: {},
    };

    expect(error.details).toEqual({});
  });

  it('supports multiple error paths in details', () => {
    const error: ApiError = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: {
        email: ['Required'],
        password: ['Too short', 'Missing number'],
        name: ['Must be a string'],
      },
    };

    expect(Object.keys(error.details as Record<string, unknown>)).toHaveLength(3);
    expect((error.details as Record<string, string[]>).password).toHaveLength(2);
  });
});

describe('PaginationMeta contract spec', () => {
  it('calculates totalPages correctly', () => {
    const meta: PaginationMeta = { page: 1, limit: 10, total: 25, totalPages: 3 };
    expect(meta.totalPages).toBe(Math.ceil(meta.total / meta.limit));
  });

  it('handles zero total', () => {
    const meta: PaginationMeta = { page: 1, limit: 10, total: 0, totalPages: 0 };
    expect(meta.totalPages).toBe(0);
  });

  it('handles single page', () => {
    const meta: PaginationMeta = { page: 1, limit: 10, total: 5, totalPages: 1 };
    expect(meta.totalPages).toBe(1);
  });

  it('handles exact division', () => {
    const meta: PaginationMeta = { page: 2, limit: 10, total: 20, totalPages: 2 };
    expect(meta.totalPages).toBe(2);
  });

  it('page never exceeds totalPages', () => {
    const meta: PaginationMeta = { page: 3, limit: 10, total: 25, totalPages: 3 };
    expect(meta.page).toBeLessThanOrEqual(meta.totalPages);
  });

  it('all values are non-negative integers', () => {
    const meta: PaginationMeta = { page: 0, limit: 0, total: 0, totalPages: 0 };
    expect(Number.isInteger(meta.page)).toBe(true);
    expect(Number.isInteger(meta.limit)).toBe(true);
    expect(Number.isInteger(meta.total)).toBe(true);
    expect(Number.isInteger(meta.totalPages)).toBe(true);
  });
});

describe('PaginationParams contract spec', () => {
  it('defaults all fields to undefined', () => {
    const params: PaginationParams = {};
    expect(params.page).toBeUndefined();
    expect(params.limit).toBeUndefined();
    expect(params.sortBy).toBeUndefined();
    expect(params.sortOrder).toBeUndefined();
  });

  it('accepts asc sortOrder', () => {
    const params: PaginationParams = { sortOrder: 'asc' };
    expect(params.sortOrder).toBe('asc');
  });

  it('accepts desc sortOrder', () => {
    const params: PaginationParams = { sortOrder: 'desc' };
    expect(params.sortOrder).toBe('desc');
  });

  it('sortOrder is always asc or desc when present', () => {
    const params: PaginationParams = { sortOrder: 'asc' };
    if (params.sortOrder) {
      expect(['asc', 'desc']).toContain(params.sortOrder);
    }
  });

  it('accepts all fields populated', () => {
    const params: PaginationParams = {
      page: 2,
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    expect(params.page).toBe(2);
    expect(params.limit).toBe(50);
    expect(params.sortBy).toBe('createdAt');
    expect(params.sortOrder).toBe('desc');
  });

  it('accepts zero and negative values for page', () => {
    const zero: PaginationParams = { page: 0 };
    const negative: PaginationParams = { page: -1 };
    expect(zero.page).toBe(0);
    expect(negative.page).toBe(-1);
  });
});
