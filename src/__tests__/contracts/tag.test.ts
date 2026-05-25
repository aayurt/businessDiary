import { describe, it, expect } from 'vitest';
import type { Tag, CreateTagInput, UpdateTagInput } from '../../types/contracts';

describe('Tag contract spec', () => {
  const validTag: Tag = {
    id: 'tag_abc123',
    name: 'JavaScript',
    slug: 'javascript',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  };

  it('has all required fields', () => {
    const fields = Object.keys(validTag).sort();
    expect(fields).toEqual(
      ['id', 'name', 'slug', 'createdAt', 'updatedAt'].sort(),
    );
  });

  it('id is a non-empty string', () => {
    expect(validTag.id).toBeTruthy();
    expect(typeof validTag.id).toBe('string');
  });

  it('name is a non-empty string', () => {
    expect(validTag.name).toBeTruthy();
    expect(typeof validTag.name).toBe('string');
  });

  it('slug is URL-safe', () => {
    expect(validTag.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('createdAt and updatedAt are ISO dates', () => {
    expect(new Date(validTag.createdAt).toISOString()).toBe(validTag.createdAt);
    expect(new Date(validTag.updatedAt).toISOString()).toBe(validTag.updatedAt);
  });

  it('serializes without extra fields', () => {
    const serialized = JSON.parse(JSON.stringify(validTag));
    expect(Object.keys(serialized).sort()).toEqual(
      ['id', 'name', 'slug', 'createdAt', 'updatedAt'].sort(),
    );
  });

  it('name can handle special characters', () => {
    const tag: Tag = { ...validTag, name: 'C++' };
    expect(tag.name).toBe('C++');
  });
});

describe('CreateTagInput contract spec', () => {
  it('requires name and slug', () => {
    const input: CreateTagInput = { name: 'React', slug: 'react' };
    expect(input.name).toBe('React');
    expect(input.slug).toBe('react');
  });

  it('serializes correctly', () => {
    const input: CreateTagInput = { name: 'Node.js', slug: 'nodejs' };
    const serialized = JSON.parse(JSON.stringify(input));
    expect(serialized).toEqual({ name: 'Node.js', slug: 'nodejs' });
  });
});

describe('UpdateTagInput contract spec', () => {
  it('all fields are optional', () => {
    const empty: UpdateTagInput = {};
    expect(Object.keys(empty)).toHaveLength(0);
  });

  it('accepts partial updates', () => {
    const justName: UpdateTagInput = { name: 'Updated' };
    const justSlug: UpdateTagInput = { slug: 'updated' };
    expect(justName.name).toBe('Updated');
    expect(justSlug.slug).toBe('updated');
  });
});
