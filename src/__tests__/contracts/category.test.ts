import { describe, it, expect } from 'vitest';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../types/contracts';

describe('Category contract spec', () => {
  const validCategory: Category = {
    id: 'cat_abc123',
    name: 'Technology',
    slug: 'technology',
    description: 'Technology-related articles',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  };

  it('has all required fields', () => {
    const fields = Object.keys(validCategory).sort();
    expect(fields).toEqual(
      ['id', 'name', 'slug', 'description', 'createdAt', 'updatedAt'].sort(),
    );
  });

  it('id is a non-empty string', () => {
    expect(validCategory.id).toBeTruthy();
    expect(typeof validCategory.id).toBe('string');
  });

  it('name is a non-empty string', () => {
    expect(validCategory.name).toBeTruthy();
    expect(typeof validCategory.name).toBe('string');
  });

  it('slug is URL-safe', () => {
    expect(validCategory.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('description can be null', () => {
    const cat: Category = { ...validCategory, description: null };
    expect(cat.description).toBeNull();
  });

  it('createdAt and updatedAt are ISO dates', () => {
    expect(new Date(validCategory.createdAt).toISOString()).toBe(validCategory.createdAt);
    expect(new Date(validCategory.updatedAt).toISOString()).toBe(validCategory.updatedAt);
  });

  it('serializes without extra fields', () => {
    const serialized = JSON.parse(JSON.stringify(validCategory));
    expect(Object.keys(serialized).sort()).toEqual(
      ['id', 'name', 'slug', 'description', 'createdAt', 'updatedAt'].sort(),
    );
  });
});

describe('CreateCategoryInput contract spec', () => {
  it('requires name and slug', () => {
    const input: CreateCategoryInput = { name: 'Tech', slug: 'tech' };
    expect(input.name).toBe('Tech');
    expect(input.slug).toBe('tech');
  });

  it('description is optional', () => {
    const withDesc: CreateCategoryInput = {
      name: 'Tech',
      slug: 'tech',
      description: 'Tech articles',
    };
    const withoutDesc: CreateCategoryInput = { name: 'Tech', slug: 'tech' };
    expect(withDesc.description).toBe('Tech articles');
    expect(withoutDesc.description).toBeUndefined();
  });
});

describe('UpdateCategoryInput contract spec', () => {
  it('all fields are optional', () => {
    const empty: UpdateCategoryInput = {};
    expect(Object.keys(empty)).toHaveLength(0);
  });

  it('accepts partial updates', () => {
    const justName: UpdateCategoryInput = { name: 'New Name' };
    const justSlug: UpdateCategoryInput = { slug: 'new-slug' };
    expect(justName.name).toBe('New Name');
    expect(justSlug.slug).toBe('new-slug');
  });

  it('allows setting description to null', () => {
    const input: UpdateCategoryInput = { description: null };
    expect(input.description).toBeNull();
  });
});
