import { describe, it, expect } from 'vitest';
import type { Comment, CreateCommentInput, UpdateCommentInput } from '../../types/contracts';

describe('Comment contract spec', () => {
  const validComment: Comment = {
    id: 'cmt_abc123',
    content: 'Great article! Thanks for sharing.',
    fileId: 'file_abc123',
    authorId: 'usr_abc123',
    parentId: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  };

  it('has all required fields', () => {
    const fields = Object.keys(validComment).sort();
    expect(fields).toEqual(
      ['id', 'content', 'fileId', 'authorId', 'parentId', 'createdAt', 'updatedAt'].sort(),
    );
  });

  it('id is a non-empty string', () => {
    expect(validComment.id).toBeTruthy();
    expect(typeof validComment.id).toBe('string');
  });

  it('content is a non-empty string', () => {
    expect(validComment.content).toBeTruthy();
    expect(typeof validComment.content).toBe('string');
    expect(validComment.content.length).toBeGreaterThan(0);
  });

  it('parentId can be null for top-level comments', () => {
    expect(validComment.parentId).toBeNull();
  });

  it('parentId can be a string for replies', () => {
    const reply: Comment = { ...validComment, parentId: 'cmt_parent' };
    expect(reply.parentId).toBe('cmt_parent');
  });

  it('createdAt and updatedAt are ISO dates', () => {
    expect(new Date(validComment.createdAt).toISOString()).toBe(validComment.createdAt);
    expect(new Date(validComment.updatedAt).toISOString()).toBe(validComment.updatedAt);
  });

  it('content can be very long', () => {
    const longContent = 'A'.repeat(10000);
    const comment: Comment = { ...validComment, content: longContent };
    expect(comment.content.length).toBe(10000);
  });

  it('serializes correctly', () => {
    const serialized = JSON.parse(JSON.stringify(validComment));
    expect(serialized.parentId).toBeNull();
    expect(serialized).not.toHaveProperty('author');
  });
});

describe('CreateCommentInput contract spec', () => {
  it('requires content and fileId', () => {
    const input: CreateCommentInput = {
      content: 'Nice post!',
      fileId: 'file_abc',
    };
    expect(input.content).toBeTruthy();
    expect(input.fileId).toBeTruthy();
  });

  it('parentId is optional', () => {
    const withParent: CreateCommentInput = {
      content: 'Reply',
      fileId: 'file_abc',
      parentId: 'cmt_parent',
    };
    const without: CreateCommentInput = {
      content: 'Top-level',
      fileId: 'file_abc',
    };
    expect(withParent.parentId).toBe('cmt_parent');
    expect(without.parentId).toBeUndefined();
  });
});

describe('UpdateCommentInput contract spec', () => {
  it('all fields are optional', () => {
    const empty: UpdateCommentInput = {};
    expect(Object.keys(empty)).toHaveLength(0);
  });

  it('accepts content update', () => {
    const input: UpdateCommentInput = { content: 'Updated comment' };
    expect(input.content).toBe('Updated comment');
  });
});
