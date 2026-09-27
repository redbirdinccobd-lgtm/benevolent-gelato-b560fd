import { Product } from '../types';

/**
 * Calculates the dynamic price of a product based on quantity and selected variant.
 * 
 * @param product The product object
 * @param quantity The quantity being ordered
 * @param variant The selected variant (e.g., color)
 * @returns The calculated unit price
 */
export function calculateDynamicPrice(product: Product, quantity: number, variants: string[] = []): number {
  let basePrice = product.price || 0;

  // 1. Apply variant adjustments
  if (variants.length > 0 && product.pricingRules?.variantAdjustments) {
    variants.forEach(variant => {
      const adjustment = product.pricingRules?.variantAdjustments?.[variant] || 0;
      basePrice += adjustment;
    });
  }

  // 2. Apply bulk discount
  let discountPercentage = 0;
  if (product.pricingRules?.bulkDiscounts) {
    // Sort discounts by minQty descending to find the highest applicable tier
    const sortedDiscounts = [...product.pricingRules.bulkDiscounts].sort((a, b) => b.minQty - a.minQty);
    
    for (const rule of sortedDiscounts) {
      if (quantity >= rule.minQty) {
        discountPercentage = rule.discountPercentage;
        break;
      }
    }
  }

  const finalPrice = basePrice * (1 - discountPercentage / 100);
  return Number(finalPrice.toFixed(2));
}
