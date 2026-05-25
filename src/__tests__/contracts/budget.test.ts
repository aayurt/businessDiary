import { describe, it, expect } from 'vitest';
import type {
  BudgetEstimate,
  CreateBudgetEstimateInput,
  UpdateBudgetEstimateInput,
} from '../../types/contracts';

describe('BudgetEstimate contract spec', () => {
  const validBudget: BudgetEstimate = {
    id: 'budget_abc123',
    fileId: 'file_abc123',
    amount: 15000.5,
    currency: 'USD',
    description: 'Server infrastructure costs',
    createdById: 'usr_abc123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  };

  it('has all required fields', () => {
    const fields = Object.keys(validBudget).sort();
    expect(fields).toEqual(
      [
        'id',
        'fileId',
        'amount',
        'currency',
        'description',
        'createdById',
        'createdAt',
        'updatedAt',
      ].sort(),
    );
  });

  it('id is a non-empty string', () => {
    expect(validBudget.id).toBeTruthy();
    expect(typeof validBudget.id).toBe('string');
  });

  it('amount is a positive number', () => {
    expect(typeof validBudget.amount).toBe('number');
    expect(validBudget.amount).toBeGreaterThan(0);
  });

  it('currency is a 3-letter code by default', () => {
    expect(validBudget.currency).toMatch(/^[A-Z]{3}$/);
  });

  it('supports various currencies', () => {
    const eur: BudgetEstimate = { ...validBudget, currency: 'EUR' };
    const gbp: BudgetEstimate = { ...validBudget, currency: 'GBP' };
    expect(eur.currency).toBe('EUR');
    expect(gbp.currency).toBe('GBP');
  });

  it('description can be null', () => {
    const budget: BudgetEstimate = { ...validBudget, description: null };
    expect(budget.description).toBeNull();
  });

  it('amount can be zero', () => {
    const budget: BudgetEstimate = { ...validBudget, amount: 0 };
    expect(budget.amount).toBe(0);
  });

  it('createdAt and updatedAt are ISO dates', () => {
    expect(new Date(validBudget.createdAt).toISOString()).toBe(validBudget.createdAt);
    expect(new Date(validBudget.updatedAt).toISOString()).toBe(validBudget.updatedAt);
  });

  it('serializes correctly', () => {
    const serialized = JSON.parse(JSON.stringify(validBudget));
    expect(serialized.amount).toBe(15000.5);
    expect(serialized.currency).toBe('USD');
  });
});

describe('CreateBudgetEstimateInput contract spec', () => {
  it('requires amount', () => {
    const input: CreateBudgetEstimateInput = { amount: 5000 };
    expect(input.amount).toBe(5000);
  });

  it('currency defaults to undefined', () => {
    const input: CreateBudgetEstimateInput = { amount: 100 };
    expect(input.currency).toBeUndefined();
  });

  it('accepts all fields', () => {
    const input: CreateBudgetEstimateInput = {
      amount: 25000,
      currency: 'EUR',
      description: 'Q1 budget',
    };
    expect(input.currency).toBe('EUR');
    expect(input.description).toBe('Q1 budget');
  });
});

describe('UpdateBudgetEstimateInput contract spec', () => {
  it('all fields are optional', () => {
    const empty: UpdateBudgetEstimateInput = {};
    expect(Object.keys(empty)).toHaveLength(0);
  });

  it('allows setting description to null', () => {
    const input: UpdateBudgetEstimateInput = { description: null };
    expect(input.description).toBeNull();
  });
});
