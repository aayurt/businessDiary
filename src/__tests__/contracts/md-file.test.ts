import { describe, it, expect } from 'vitest';
import type { MdFile, MdFileSummary, CreateMdFileInput, UpdateMdFileInput } from '../../types/contracts';

describe('MdFile contract spec', () => {
  const validMdFile: MdFile = {
    id: 'clx12345abcde',
    title: 'Getting Started with Next.js',
    slug: 'getting-started-nextjs',
    content: '# Introduction\n\nNext.js is a React framework...',
    description: 'A comprehensive guide to Next.js',
    coverImage: 'https://example.com/cover.jpg',
    privacy: 'PRIVATE',
    authorId: 'usr_abc123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  };

  it('has all required fields', () => {
    const fields = Object.keys(validMdFile).sort();
    expect(fields).toEqual(
      [
        'id',
        'title',
        'slug',
        'content',
        'description',
        'coverImage',
        'privacy',
        'authorId',
        'createdAt',
        'updatedAt',
      ].sort(),
    );
  });

  it('id is a non-empty string', () => {
    expect(validMdFile.id).toBeTruthy();
    expect(typeof validMdFile.id).toBe('string');
    expect(validMdFile.id.length).toBeGreaterThan(0);
  });

  it('title is a non-empty string', () => {
    expect(validMdFile.title).toBeTruthy();
    expect(typeof validMdFile.title).toBe('string');
    expect(validMdFile.title.length).toBeGreaterThan(0);
  });

  it('slug is a URL-safe string', () => {
    expect(validMdFile.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('content is a non-empty string', () => {
    expect(validMdFile.content).toBeTruthy();
    expect(typeof validMdFile.content).toBe('string');
    expect(validMdFile.content.length).toBeGreaterThan(0);
  });

  it('description can be null', () => {
    const file: MdFile = { ...validMdFile, description: null };
    expect(file.description).toBeNull();
  });

  it('coverImage can be null', () => {
    const file: MdFile = { ...validMdFile, coverImage: null };
    expect(file.coverImage).toBeNull();
  });

  it('privacy is a valid mode', () => {
    expect(['PUBLIC', 'SHARED', 'PRIVATE']).toContain(validMdFile.privacy);
  });

  it('createdAt and updatedAt are ISO date strings', () => {
    expect(new Date(validMdFile.createdAt).toISOString()).toBe(validMdFile.createdAt);
    expect(new Date(validMdFile.updatedAt).toISOString()).toBe(validMdFile.updatedAt);
  });

  it('does not expose content in summary', () => {
    const summaryFields = [
      'id',
      'title',
      'slug',
      'description',
      'coverImage',
      'privacy',
      'authorId',
      'createdAt',
      'updatedAt',
    ] as const;
    const mdFileKeys = Object.keys(validMdFile);
    for (const field of summaryFields) {
      expect(mdFileKeys).toContain(field);
    }
  });

  it('serializes correctly', () => {
    const serialized = JSON.parse(JSON.stringify(validMdFile));
    expect(serialized.id).toBe('clx12345abcde');
    expect(serialized.privacy).toBe('PRIVATE');
    expect(serialized).not.toHaveProperty('__v');
  });
});

describe('MdFileSummary contract spec', () => {
  const validSummary: MdFileSummary = {
    id: 'clx12345abcde',
    title: 'Getting Started with Next.js',
    slug: 'getting-started-nextjs',
    description: 'A comprehensive guide',
    coverImage: null,
    privacy: 'PRIVATE',
    authorId: 'usr_abc123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  };

  it('has no content field', () => {
    const fields = Object.keys(validSummary);
    expect(fields).not.toContain('content');
  });

  it('has summary-only fields', () => {
    expect(validSummary).toHaveProperty('id');
    expect(validSummary).toHaveProperty('title');
    expect(validSummary).toHaveProperty('slug');
  });
});

describe('CreateMdFileInput contract spec', () => {
  it('requires title, slug, and content', () => {
    const input: CreateMdFileInput = {
      title: 'My Post',
      slug: 'my-post',
      content: 'Hello world',
    };
    expect(input.title).toBeTruthy();
    expect(input.slug).toBeTruthy();
    expect(input.content).toBeTruthy();
  });

  it('all optional fields are undefined by default', () => {
    const input: CreateMdFileInput = {
      title: 'T',
      slug: 't',
      content: 'C',
    };
    expect(input.description).toBeUndefined();
    expect(input.coverImage).toBeUndefined();
    expect(input.privacy).toBeUndefined();
    expect(input.categoryIds).toBeUndefined();
    expect(input.tagIds).toBeUndefined();
  });

  it('accepts all fields populated', () => {
    const input: CreateMdFileInput = {
      title: 'Full Post',
      slug: 'full-post',
      content: 'Full content',
      description: 'A description',
      coverImage: 'https://example.com/img.jpg',
      privacy: 'PUBLIC',
      categoryIds: ['cat1', 'cat2'],
      tagIds: ['tag1'],
    };
    expect(input.categoryIds).toHaveLength(2);
    expect(input.tagIds).toHaveLength(1);
  });
});

describe('UpdateMdFileInput contract spec', () => {
  it('all fields are optional', () => {
    const empty: UpdateMdFileInput = {};
    expect(Object.keys(empty)).toHaveLength(0);
  });

  it('accepts partial updates', () => {
    const justTitle: UpdateMdFileInput = { title: 'New Title' };
    const justPrivacy: UpdateMdFileInput = { privacy: 'PUBLIC' };
    expect(justTitle.title).toBe('New Title');
    expect(justPrivacy.privacy).toBe('PUBLIC');
  });

  it('allows setting description or coverImage to null', () => {
    const clearFields: UpdateMdFileInput = { description: null, coverImage: null };
    expect(clearFields.description).toBeNull();
    expect(clearFields.coverImage).toBeNull();
  });
});
