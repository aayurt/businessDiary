import { describe, it, expect } from 'vitest';
import type { Location, CreateLocationInput } from '../../types/contracts';

describe('Location contract spec', () => {
  const validLocation: Location = {
    id: 'loc_abc123',
    fileId: 'file_abc123',
    name: 'Central Park',
    address: 'New York, NY 10024',
    latitude: 40.785091,
    longitude: -73.968285,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  it('has all required fields', () => {
    const fields = Object.keys(validLocation).sort();
    expect(fields).toEqual(
      ['id', 'fileId', 'name', 'address', 'latitude', 'longitude', 'createdAt'].sort(),
    );
  });

  it('id is a non-empty string', () => {
    expect(validLocation.id).toBeTruthy();
    expect(typeof validLocation.id).toBe('string');
  });

  it('name is a non-empty string', () => {
    expect(validLocation.name).toBeTruthy();
    expect(typeof validLocation.name).toBe('string');
  });

  it('address can be null', () => {
    const loc: Location = { ...validLocation, address: null };
    expect(loc.address).toBeNull();
  });

  it('latitude and longitude can be null', () => {
    const loc: Location = {
      ...validLocation,
      latitude: null,
      longitude: null,
    };
    expect(loc.latitude).toBeNull();
    expect(loc.longitude).toBeNull();
  });

  it('latitude is in valid range', () => {
    expect(validLocation.latitude).toBeGreaterThanOrEqual(-90);
    expect(validLocation.latitude).toBeLessThanOrEqual(90);
  });

  it('longitude is in valid range', () => {
    expect(validLocation.longitude).toBeGreaterThanOrEqual(-180);
    expect(validLocation.longitude).toBeLessThanOrEqual(180);
  });

  it('createdAt is an ISO date string', () => {
    expect(new Date(validLocation.createdAt).toISOString()).toBe(validLocation.createdAt);
  });

  it('has no updatedAt field', () => {
    const fields = Object.keys(validLocation);
    expect(fields).not.toContain('updatedAt');
  });

  it('serializes correctly', () => {
    const serialized = JSON.parse(JSON.stringify(validLocation));
    expect(serialized.latitude).toBe(40.785091);
    expect(serialized.longitude).toBe(-73.968285);
  });
});

describe('CreateLocationInput contract spec', () => {
  it('requires name', () => {
    const input: CreateLocationInput = { name: 'My Location' };
    expect(input.name).toBe('My Location');
  });

  it('accepts address and coordinates', () => {
    const input: CreateLocationInput = {
      name: 'Office',
      address: '123 Main St',
      latitude: 40.7128,
      longitude: -74.006,
    };
    expect(input.address).toBe('123 Main St');
    expect(input.latitude).toBe(40.7128);
    expect(input.longitude).toBe(-74.006);
  });

  it('serializes without undefined fields', () => {
    const input: CreateLocationInput = { name: 'Place' };
    const serialized = JSON.parse(JSON.stringify(input));
    expect(serialized).toEqual({ name: 'Place' });
    expect(serialized).not.toHaveProperty('address');
  });
});
