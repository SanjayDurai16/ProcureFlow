import { AppError } from '../../middleware/error.middleware.js';

export class PricingEngine {
  /**
   * Validates pricing slabs structure, ordering, and economics.
   */
  static validateSlabs(slabs) {
    if (!Array.isArray(slabs) || slabs.length === 0) {
      throw new AppError('At least one pricing slab is required', 400, 'INVALID_SLABS');
    }

    // Sort slabs strictly by min_qty
    const sorted = [...slabs].sort((a, b) => a.min_qty - b.min_qty);

    for (let i = 0; i < sorted.length; i++) {
      const slab = sorted[i];

      if (!Number.isFinite(slab.min_qty) || slab.min_qty < 1) {
        throw new AppError(`Slab ${i + 1}: min_qty must be a positive number >= 1`, 400, 'INVALID_SLAB_QTY');
      }

      if (!Number.isFinite(slab.unit_price) || slab.unit_price <= 0) {
        throw new AppError(`Slab ${i + 1}: unit_price must be greater than 0`, 400, 'INVALID_SLAB_PRICE');
      }

      if (slab.max_qty !== null && slab.max_qty !== undefined) {
        if (!Number.isFinite(slab.max_qty) || slab.max_qty < slab.min_qty) {
          throw new AppError(`Slab ${i + 1}: max_qty must be greater than or equal to min_qty`, 400, 'INVALID_SLAB_RANGE');
        }
      }

      // Check boundary constraints with adjacent slab
      if (i < sorted.length - 1) {
        const next = sorted[i + 1];

        // Non-terminal slab cannot have null/open max_qty
        if (slab.max_qty === null || slab.max_qty === undefined) {
          throw new AppError('Only the final pricing slab can have an open upper bound (max_qty = null)', 400, 'INVALID_OPEN_SLAB');
        }

        // Overlap detection
        if (slab.max_qty >= next.min_qty) {
          throw new AppError(
            `Pricing slabs overlap: slab [${slab.min_qty} - ${slab.max_qty}] overlaps with [${next.min_qty} - ${next.max_qty ?? '∞'}]`,
            400,
            'SLABS_OVERLAP'
          );
        }

        // Economic volume tier check: unit price must not increase for higher volume brackets
        if (next.unit_price > slab.unit_price) {
          throw new AppError(
            `Economical inconsistency: Higher volume slab (${next.min_qty}+) has unit price ₹${next.unit_price}, which exceeds lower volume price ₹${slab.unit_price}`,
            400,
            'INVERTED_SLAB_PRICE'
          );
        }
      }
    }

    return sorted;
  }

  /**
   * Resolves the applicable unit price and calculates total spend for requested quantity.
   * Employs decimal-safe float rounding with Number.EPSILON to prevent binary rounding inaccuracies.
   */
  static calculatePrice(quantity, slabs) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new AppError('Requested quantity must be a positive number greater than 0', 400, 'INVALID_QUANTITY');
    }

    const validatedSlabs = this.validateSlabs(slabs);

    const matchedSlab = validatedSlabs.find((slab) => {
      const minOk = quantity >= slab.min_qty;
      const maxOk = slab.max_qty === null || slab.max_qty === undefined || quantity <= slab.max_qty;
      return minOk && maxOk;
    });

    if (!matchedSlab) {
      const minSupported = validatedSlabs[0].min_qty;
      const lastSlab = validatedSlabs[validatedSlabs.length - 1];
      const maxSupported = lastSlab.max_qty ?? '∞';

      throw new AppError(
        `Requested quantity (${quantity}) does not match vendor's pricing slabs [${minSupported} to ${maxSupported}].`,
        400,
        'QUANTITY_OUT_OF_SLAB_RANGE',
        { requestedQuantity: quantity, supportedRange: `${minSupported} - ${maxSupported}` }
      );
    }

    const unitPrice = Math.round((matchedSlab.unit_price + Number.EPSILON) * 100) / 100;
    const totalPrice = Math.round((quantity * unitPrice + Number.EPSILON) * 100) / 100;

    return {
      quantity,
      unitPrice,
      totalPrice,
      matchedSlab,
    };
  }
}
