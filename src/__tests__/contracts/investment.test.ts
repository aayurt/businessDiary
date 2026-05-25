import { describe, it, expect } from 'vitest';
import type { InvestmentInterest, CreateInvestmentInterestInput } from '../../types/contracts';

describe('InvestmentInterest contract spec', () => {
  const validInterest: InvestmentInterest = {
    id: 'inv_abc123',
    fileId: 'file_abc123',
    userId: 'usr_abc123',
    amount: 50000,
    message: 'Interested in this project',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  it('has all required fields', () => {
    const fields = Object.keys(validInterest).sort();
    expect(fields).toEqual(
      ['id', 'fileId', 'userId', 'amount', 'message', 'createdAt'].sort(),
    );
  });

  it('id is a non-empty string', () => {
    expect(validInterest.id).toBeTruthy();
    expect(typeof validInterest.id).toBe('string');
  });

  it('amount can be null', () => {
    const interest: InvestmentInterest = { ...validInterest, amount: null };
    expect(interest.amount).toBeNull();
  });

  it('amount is a positive number when present', () => {
    if (validInterest.amount !== null) {
      expect(typeof validInterest.amount).toBe('number');
      expect(validInterest.amount).toBeGreaterThan(0);
    }
  });

  it('message can be null', () => {
    const interest: InvestmentInterest = { ...validInterest, message: null };
    expect(interest.message).toBeNull();
  });

  it('createdAt is an ISO date string', () => {
    expect(new Date(validInterest.createdAt).toISOString()).toBe(validInterest.createdAt);
  });

  it('has no updatedAt field', () => {
    const fields = Object.keys(validInterest);
    expect(fields).not.toContain('updatedAt');
  });

  it('serializes correctly', () => {
    const serialized = JSON.parse(JSON.stringify(validInterest));
    expect(serialized.amount).toBe(50000);
    expect(serialized.message).toBe('Interested in this project');
  });

  it('handles large amounts', () => {
    const large: InvestmentInterest = {
      ...validInterest,
      amount: 10_000_000,
    };
    expect(large.amount).toBe(10_000_000);
  });
});

describe('CreateInvestmentInterestInput contract spec', () => {
  it('all fields are optional', () => {
    const input: CreateInvestmentInterestInput = {};
    expect(Object.keys(input)).toHaveLength(0);
  });

  it('accepts amount and message', () => {
    const input: CreateInvestmentInterestInput = {
      amount: 25000,
      message: 'Serious inquiry',
    };
    expect(input.amount).toBe(25000);
    expect(input.message).toBe('Serious inquiry');
  });

  it('serializes correctly', () => {
    const input: CreateInvestmentInterestInput = { amount: 1000 };
    const serialized = JSON.parse(JSON.stringify(input));
    expect(serialized).toEqual({ amount: 1000 });
    expect(serialized).not.toHaveProperty('message');
  });
});
