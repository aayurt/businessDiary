import { describe, it, expect } from 'vitest';
import type { Vote, CreateVoteInput } from '../../types/contracts';

describe('Vote contract spec', () => {
  const validVote: Vote = {
    id: 'vote_abc123',
    value: 1,
    fileId: 'file_abc123',
    userId: 'usr_abc123',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  it('has all required fields', () => {
    const fields = Object.keys(validVote).sort();
    expect(fields).toEqual(
      ['id', 'value', 'fileId', 'userId', 'createdAt'].sort(),
    );
  });

  it('id is a non-empty string', () => {
    expect(validVote.id).toBeTruthy();
    expect(typeof validVote.id).toBe('string');
  });

  it('value is an integer', () => {
    expect(Number.isInteger(validVote.value)).toBe(true);
  });

  it('value is typically 1 or -1', () => {
    expect([1, -1]).toContain(validVote.value);
    const downvote: Vote = { ...validVote, value: -1 };
    expect(downvote.value).toBe(-1);
  });

  it('createdAt is an ISO date string', () => {
    expect(new Date(validVote.createdAt).toISOString()).toBe(validVote.createdAt);
  });

  it('has no updatedAt field', () => {
    const fields = Object.keys(validVote);
    expect(fields).not.toContain('updatedAt');
  });

  it('serializes correctly', () => {
    const serialized = JSON.parse(JSON.stringify(validVote));
    expect(Object.keys(serialized).sort()).toEqual(
      ['id', 'value', 'fileId', 'userId', 'createdAt'].sort(),
    );
  });
});

describe('CreateVoteInput contract spec', () => {
  it('requires value', () => {
    const input: CreateVoteInput = { value: 1 };
    expect(input.value).toBe(1);
  });

  it('accepts negative value', () => {
    const input: CreateVoteInput = { value: -1 };
    expect(input.value).toBe(-1);
  });

  it('serializes correctly', () => {
    const input: CreateVoteInput = { value: 1 };
    expect(JSON.parse(JSON.stringify(input))).toEqual({ value: 1 });
  });
});
