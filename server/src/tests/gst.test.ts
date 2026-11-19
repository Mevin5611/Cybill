import { describe, it, expect } from 'vitest';
import { calculateLineItemGst, calculateInvoiceTotal, amountInWords } from '../utils/gst.js';

describe('GST Calculations', () => {
  describe('GST-exclusive pricing', () => {
    it('should calculate 18% GST on exclusive price', () => {
      const result = calculateLineItemGst({
        quantity: 1,
        unitPrice: 100,
        discount: 0,
        gstRate: 18,
        pricingMode: 'exclusive'
      });

      expect(result.taxableAmount).toBe(100);
      expect(result.gstAmount).toBe(18);
      expect(result.lineTotal).toBe(118);
    });

    it('should handle discounts on exclusive pricing', () => {
      const result = calculateLineItemGst({
        quantity: 2,
        unitPrice: 100,
        discount: 20,
        gstRate: 18,
        pricingMode: 'exclusive'
      });

      expect(result.taxableAmount).toBe(180); // (2 * 100) - 20
      expect(result.gstAmount).toBe(32.4);
      expect(result.lineTotal).toBe(212.4);
    });

    it('should handle 5% GST', () => {
      const result = calculateLineItemGst({
        quantity: 1,
        unitPrice: 1000,
        discount: 0,
        gstRate: 5,
        pricingMode: 'exclusive'
      });

      expect(result.taxableAmount).toBe(1000);
      expect(result.gstAmount).toBe(50);
      expect(result.lineTotal).toBe(1050);
    });
  });

  describe('GST-inclusive pricing', () => {
    it('should calculate taxable value from inclusive price', () => {
      const result = calculateLineItemGst({
        quantity: 1,
        unitPrice: 118,
        discount: 0,
        gstRate: 18,
        pricingMode: 'inclusive'
      });

      expect(result.taxableAmount).toBeCloseTo(100, 2);
      expect(result.gstAmount).toBeCloseTo(18, 2);
      expect(result.lineTotal).toBe(118);
    });

    it('should handle discounts on inclusive pricing', () => {
      const result = calculateLineItemGst({
        quantity: 1,
        unitPrice: 236,
        discount: 50,
        gstRate: 18,
        pricingMode: 'inclusive'
      });

      // (236 - 50) / 1.18 = 157.63 (taxable)
      // 186 - 157.63 = 28.37 (gst)
      expect(result.lineTotal).toBe(186);
    });
  });

  describe('Invoice totals', () => {
    it('should calculate intra-state GST (CGST + SGST)', () => {
      const items = [
        calculateLineItemGst({
          quantity: 1,
          unitPrice: 1000,
          discount: 0,
          gstRate: 18,
          pricingMode: 'exclusive'
        })
      ];

      const totals = calculateInvoiceTotal(
        { items, discountAmount: 0, otherCharges: 0 },
        'MH',
        'MH',
        [18]
      );

      expect(totals.taxableValue).toBe(1000);
      expect(totals.cgst).toBeCloseTo(90, 1); // 50% of GST
      expect(totals.sgst).toBeCloseTo(90, 1);
      expect(totals.igst).toBe(0);
      expect(totals.finalTotal).toBe(1180);
    });

    it('should calculate inter-state GST (IGST)', () => {
      const items = [
        calculateLineItemGst({
          quantity: 1,
          unitPrice: 1000,
          discount: 0,
          gstRate: 18,
          pricingMode: 'exclusive'
        })
      ];

      const totals = calculateInvoiceTotal(
        { items, discountAmount: 0, otherCharges: 0 },
        'MH',
        'KA',
        [18]
      );

      expect(totals.cgst).toBe(0);
      expect(totals.sgst).toBe(0);
      expect(totals.igst).toBe(180);
      expect(totals.finalTotal).toBe(1180);
    });

    it('should handle multiple items with different GST rates', () => {
      const items = [
        calculateLineItemGst({
          quantity: 1,
          unitPrice: 1000,
          discount: 0,
          gstRate: 18,
          pricingMode: 'exclusive'
        }),
        calculateLineItemGst({
          quantity: 1,
          unitPrice: 500,
          discount: 0,
          gstRate: 5,
          pricingMode: 'exclusive'
        })
      ];

      const totals = calculateInvoiceTotal(
        { items, discountAmount: 0, otherCharges: 0 },
        'MH',
        'MH',
        [18, 5]
      );

      expect(totals.taxableValue).toBe(1500);
      // 18% on 1000 = 180, split into 90+90
      // 5% on 500 = 25, split into 12.5+12.5
      expect(totals.cgst).toBeCloseTo(102.5, 1);
      expect(totals.sgst).toBeCloseTo(102.5, 1);
      expect(totals.finalTotal).toBeCloseTo(1705, 0);
    });
  });

  describe('Amount in words', () => {
    it('should convert amount to words', () => {
      expect(amountInWords(100)).toContain('one hundred');
      expect(amountInWords(1000)).toContain('one thousand');
      expect(amountInWords(100000)).toContain('one lakh');
    });
  });
});