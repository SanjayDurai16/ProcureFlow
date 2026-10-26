import { describe, it, expect } from 'vitest';
import { PricingEngine } from '../../src/modules/quotations/pricing-engine.js';
import { AppError } from '../../src/middleware/error.middleware.js';

describe('PricingEngine Unit Tests', () => {
  const sampleSlabs = [
    { min_qty: 1, max_qty: 99, unit_price: 100 },
    { min_qty: 100, max_qty: 499, unit_price: 85 },
    { min_qty: 500, max_qty: null, unit_price: 70 },
  ];

  it('correctly resolves price for quantity in first tier (e.g. 50 units)', () => {
    const result = PricingEngine.calculatePrice(50, sampleSlabs);
    expect(result.unitPrice).toBe(100);
    expect(result.totalPrice).toBe(5000);
    expect(result.matchedSlab.min_qty).toBe(1);
  });

  it('correctly resolves price for exact lower boundary of second tier (100 units)', () => {
    const result = PricingEngine.calculatePrice(100, sampleSlabs);
    expect(result.unitPrice).toBe(85);
    expect(result.totalPrice).toBe(8500);
  });

  it('correctly resolves price for exact upper boundary of second tier (499 units)', () => {
    const result = PricingEngine.calculatePrice(499, sampleSlabs);
    expect(result.unitPrice).toBe(85);
    expect(result.totalPrice).toBe(42415);
  });

  it('correctly resolves price for high volume in open upper bound tier (600 units)', () => {
    const result = PricingEngine.calculatePrice(600, sampleSlabs);
    expect(result.unitPrice).toBe(70);
    expect(result.totalPrice).toBe(42000);
    expect(result.matchedSlab.max_qty).toBeNull();
  });

  it('accurately calculates decimal unit prices avoiding floating point inaccuracies', () => {
    const decimalSlabs = [
      { min_qty: 1, max_qty: null, unit_price: 12.35 },
    ];
    const result = PricingEngine.calculatePrice(17, decimalSlabs);
    expect(result.unitPrice).toBe(12.35);
    expect(result.totalPrice).toBe(209.95);
  });

  it('throws an error if quantity is below the lowest slab minimum', () => {
    const highMinSlabs = [
      { min_qty: 50, max_qty: 100, unit_price: 200 },
      { min_qty: 101, max_qty: null, unit_price: 180 },
    ];

    expect(() => PricingEngine.calculatePrice(10, highMinSlabs)).toThrow(AppError);
    try {
      PricingEngine.calculatePrice(10, highMinSlabs);
    } catch (err) {
      expect(err.code).toBe('QUANTITY_OUT_OF_SLAB_RANGE');
    }
  });

  it('throws an error if quantity falls in an unserved gap between slabs', () => {
    const gappedSlabs = [
      { min_qty: 1, max_qty: 99, unit_price: 100 },
      { min_qty: 200, max_qty: null, unit_price: 80 },
    ];

    expect(() => PricingEngine.calculatePrice(150, gappedSlabs)).toThrow(AppError);
    try {
      PricingEngine.calculatePrice(150, gappedSlabs);
    } catch (err) {
      expect(err.code).toBe('QUANTITY_OUT_OF_SLAB_RANGE');
    }
  });

  it('rejects overlapping slabs', () => {
    const overlapping = [
      { min_qty: 1, max_qty: 100, unit_price: 100 },
      { min_qty: 90, max_qty: 200, unit_price: 80 },
    ];

    expect(() => PricingEngine.validateSlabs(overlapping)).toThrow(AppError);
    try {
      PricingEngine.validateSlabs(overlapping);
    } catch (err) {
      expect(err.code).toBe('SLABS_OVERLAP');
    }
  });

  it('rejects inverted pricing where higher volume has higher unit cost', () => {
    const inverted = [
      { min_qty: 1, max_qty: 99, unit_price: 50 },
      { min_qty: 100, max_qty: null, unit_price: 80 },
    ];

    expect(() => PricingEngine.validateSlabs(inverted)).toThrow(AppError);
    try {
      PricingEngine.validateSlabs(inverted);
    } catch (err) {
      expect(err.code).toBe('INVERTED_SLAB_PRICE');
    }
  });

  it('rejects negative or zero unit prices', () => {
    const zeroPrice = [{ min_qty: 1, max_qty: null, unit_price: 0 }];
    const negPrice = [{ min_qty: 1, max_qty: null, unit_price: -25 }];

    expect(() => PricingEngine.validateSlabs(zeroPrice)).toThrow(AppError);
    expect(() => PricingEngine.validateSlabs(negPrice)).toThrow(AppError);
  });

  it('rejects non-terminal slabs with null max_qty', () => {
    const invalidOpenSlab = [
      { min_qty: 1, max_qty: null, unit_price: 100 },
      { min_qty: 100, max_qty: null, unit_price: 80 },
    ];

    expect(() => PricingEngine.validateSlabs(invalidOpenSlab)).toThrow(AppError);
  });
});
