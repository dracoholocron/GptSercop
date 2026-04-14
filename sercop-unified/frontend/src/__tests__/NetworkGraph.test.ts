/**
 * Unit tests for NetworkGraph helper functions.
 * Uses Vitest (runs via `npx vitest`).
 */
import { describe, it, expect } from 'vitest';
import { riskColor, communityColor, nodeRadius } from '../components/analytics/NetworkGraph';

describe('riskColor', () => {
  it('returns red for high risk', () => {
    expect(riskColor('high')).toBe('#E53E3E');
  });

  it('returns orange for medium risk', () => {
    expect(riskColor('medium')).toBe('#ED8936');
  });

  it('returns green for low risk', () => {
    expect(riskColor('low')).toBe('#48BB78');
  });

  it('returns gray for null', () => {
    expect(riskColor(null)).toBe('#A0AEC0');
  });

  it('returns gray for unknown string', () => {
    expect(riskColor('unknown')).toBe('#A0AEC0');
  });
});

describe('communityColor', () => {
  it('returns gray for negative community ID', () => {
    expect(communityColor(-1)).toBe('#A0AEC0');
  });

  it('returns a palette color for community 0', () => {
    const color = communityColor(0);
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(color).not.toBe('#A0AEC0');
  });

  it('cycles through palette for large community IDs', () => {
    const c0 = communityColor(0);
    const c15 = communityColor(15);
    expect(c0).toBe(c15); // palette length is 15
  });
});

describe('nodeRadius', () => {
  it('returns minimum 4 for degree 0', () => {
    expect(nodeRadius(0)).toBe(4);
  });

  it('returns maximum 20 for very high degree', () => {
    expect(nodeRadius(10000)).toBe(20);
  });

  it('scales between 4 and 20 for moderate degree', () => {
    const r = nodeRadius(10);
    expect(r).toBeGreaterThan(4);
    expect(r).toBeLessThan(20);
  });

  it('increases monotonically with degree', () => {
    expect(nodeRadius(5)).toBeLessThanOrEqual(nodeRadius(10));
    expect(nodeRadius(10)).toBeLessThanOrEqual(nodeRadius(50));
    expect(nodeRadius(50)).toBeLessThanOrEqual(nodeRadius(100));
  });
});
