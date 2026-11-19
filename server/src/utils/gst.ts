import Decimal from "decimal.js";

import type {
  IInvoiceItem
} from "../../../shared/types/index.js";

Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP
});

const D = (value: number | string) =>
  new Decimal(value);

const round2 = (value: Decimal): number =>
  value
    .toDecimalPlaces(
      2,
      Decimal.ROUND_HALF_UP
    )
    .toNumber();

export interface GstCalculationInput {
  quantity: number;
  unitPrice: number;
  discount: number;
  gstRate: number;
  pricingMode: "exclusive" | "inclusive";
}

export interface GstCalculationResult {
  taxableAmount: number;
  gstAmount: number;
  lineTotal: number;
}

export interface InvoiceTotalInput {
  items: IInvoiceItem[];
  discountAmount: number;
  otherCharges: number;
}

export interface InvoiceTotalResult {
  items: IInvoiceItem[];

  subtotal: number;
  taxableValue: number;

  cgst: number;
  sgst: number;
  igst: number;

  totalTax: number;

  roundingAdjustment: number;
  finalTotal: number;
}

/**
 * STATE NORMALIZATION
 *
 * Business settings may store the state as "Kerala", "KERALA",
 * "KL", "32", "32-Kerala", "Kerala (32)" etc.
 * All of these must be treated as the same state.
 */
const STATE_BY_CODE: Record<string, string> = {
  "01": "jammu and kashmir",
  "02": "himachal pradesh",
  "03": "punjab",
  "04": "chandigarh",
  "05": "uttarakhand",
  "06": "haryana",
  "07": "delhi",
  "08": "rajasthan",
  "09": "uttar pradesh",
  "10": "bihar",
  "11": "sikkim",
  "12": "arunachal pradesh",
  "13": "nagaland",
  "14": "manipur",
  "15": "mizoram",
  "16": "tripura",
  "17": "meghalaya",
  "18": "assam",
  "19": "west bengal",
  "20": "jharkhand",
  "21": "odisha",
  "22": "chhattisgarh",
  "23": "madhya pradesh",
  "24": "gujarat",
  "26": "dadra and nagar haveli and daman and diu",
  "27": "maharashtra",
  "29": "karnataka",
  "30": "goa",
  "31": "lakshadweep",
  "32": "kerala",
  "33": "tamil nadu",
  "34": "puducherry",
  "35": "andaman and nicobar islands",
  "36": "telangana",
  "37": "andhra pradesh",
  "38": "ladakh"
};

const STATE_ALIASES: Record<string, string> = {
  kl: "kerala",
  ka: "karnataka",
  tn: "tamil nadu",
  mh: "maharashtra",
  dl: "delhi",
  ap: "andhra pradesh",
  ts: "telangana",
  tg: "telangana",
  gj: "gujarat",
  rj: "rajasthan",
  up: "uttar pradesh",
  mp: "madhya pradesh",
  wb: "west bengal",
  pb: "punjab",
  hr: "haryana",
  br: "bihar",
  od: "odisha",
  or: "odisha",
  orissa: "odisha",
  pondicherry: "puducherry",
  py: "puducherry",
  ga: "goa"
};

export function normalizeState(
  value?: string | null
): string {

  if (!value) {
    return "";
  }

  const raw = String(value)
    .trim()
    .toLowerCase();

  if (!raw) {
    return "";
  }

  /* GST state code anywhere in the text, e.g. "32", "32-Kerala" */
  const codeMatch = raw.match(/\b(\d{2})\b/);

  if (codeMatch && STATE_BY_CODE[codeMatch[1]]) {
    return STATE_BY_CODE[codeMatch[1]];
  }

  /* Remove digits and punctuation, keep letters */
  const text = raw
    .replace(/&/g, " and ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (STATE_ALIASES[text]) {
    return STATE_ALIASES[text];
  }

  /* Match any known state name contained in the text */
  for (const name of Object.values(STATE_BY_CODE)) {
    if (text === name || text.includes(name)) {
      return name;
    }
  }

  return text;
}

/**
 * Interstate only when both states are known and different.
 * Missing state on either side is treated as intrastate.
 */
export function isInterStateSupply(
  businessState?: string | null,
  customerState?: string | null
): boolean {

  const business =
    normalizeState(businessState);

  const customer =
    normalizeState(customerState);

  if (!business || !customer) {
    return false;
  }

  return business !== customer;
}

/**
 * Calculate basic taxable amount for one item.
 */
export function calculateLineItemGst(
  input: GstCalculationInput
): GstCalculationResult {

  const {
    quantity,
    unitPrice,
    discount,
    gstRate,
    pricingMode
  } = input;

  if (
    !Number.isFinite(quantity) ||
    !Number.isFinite(unitPrice) ||
    !Number.isFinite(discount) ||
    !Number.isFinite(gstRate)
  ) {
    throw new Error("Invalid item values");
  }

  if (
    quantity <= 0 ||
    unitPrice < 0 ||
    discount < 0 ||
    gstRate < 0
  ) {
    throw new Error("Invalid item values");
  }

  const gross = D(quantity).mul(unitPrice);

  if (D(discount).gt(gross)) {
    throw new Error(
      "Discount cannot exceed item amount"
    );
  }

  const afterDiscount =
    gross.minus(discount);

  let taxable: Decimal;

  if (pricingMode === "inclusive") {

    taxable = afterDiscount
      .mul(100)
      .div(D(100).plus(gstRate));

  } else {

    taxable = afterDiscount;
  }

  const taxableAmount = round2(taxable);

  const gstAmount = round2(
    D(taxableAmount)
      .mul(gstRate)
      .div(100)
  );

  return {
    taxableAmount,
    gstAmount,
    lineTotal: round2(
      D(taxableAmount).plus(gstAmount)
    )
  };
}

/**
 * Calculate complete invoice with item-wise GST.
 */
export function calculateInvoiceTotal(
  input: InvoiceTotalInput,
  businessState: string,
  customerState?: string
): InvoiceTotalResult {

  const {
    items,
    discountAmount,
    otherCharges
  } = input;

  if (!items.length) {
    throw new Error(
      "At least one item is required"
    );
  }

  if (
    !Number.isFinite(discountAmount) ||
    !Number.isFinite(otherCharges) ||
    discountAmount < 0 ||
    otherCharges < 0
  ) {
    throw new Error(
      "Invalid discount or charges"
    );
  }

  const subtotal = items.reduce(
    (sum, item) =>
      sum.plus(item.taxableAmount),
    D(0)
  );

  const discount = D(discountAmount);

  if (discount.gt(subtotal)) {
    throw new Error(
      "Invoice discount exceeds subtotal"
    );
  }

  const isInterState = isInterStateSupply(
    businessState,
    customerState
  );

  let remainingDiscount = discount;

  const processedItems: IInvoiceItem[] = [];

  items.forEach((item, index) => {

    const originalTaxable =
      D(item.taxableAmount);

    let discountShare = D(0);

    /*
     * Distribute invoice discount proportionately.
     */
    if (!subtotal.isZero()) {

      if (index === items.length - 1) {

        discountShare = remainingDiscount;

      } else {

        discountShare = discount
          .mul(originalTaxable)
          .div(subtotal)
          .toDecimalPlaces(
            2,
            Decimal.ROUND_HALF_UP
          );

        remainingDiscount =
          remainingDiscount.minus(discountShare);
      }
    }

    const taxable = originalTaxable
      .minus(discountShare);

    if (taxable.isNegative()) {
      throw new Error(
        "Invalid discount distribution"
      );
    }

    const taxableAmount =
      round2(taxable);

    /*
     * Total GST for the line, calculated once.
     */
    const gstAmount = round2(
      D(taxableAmount)
        .mul(item.gstRate)
        .div(100)
    );

    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState) {

      /*
       * Interstate: IGST
       */
      igstRate = item.gstRate;
      igstAmount = gstAmount;

    } else {

      /*
       * Intrastate: CGST + SGST
       * Split the same GST amount so CGST + SGST always
       * equals the line GST.
       */
      cgstRate = item.gstRate / 2;
      sgstRate = item.gstRate / 2;

      cgstAmount = round2(
        D(gstAmount).div(2)
      );

      sgstAmount = round2(
        D(gstAmount).minus(cgstAmount)
      );
    }

    const lineTotal = round2(
      D(taxableAmount).plus(gstAmount)
    );

    processedItems.push({
      ...item,

      taxableAmount,

      cgstRate,
      sgstRate,
      igstRate,

      cgstAmount,
      sgstAmount,
      igstAmount,

      gstAmount,
      lineTotal
    });
  });

  /*
   * Sum item-wise GST.
   */
  const cgst = processedItems.reduce(
    (sum, item) =>
      sum.plus(item.cgstAmount),
    D(0)
  );

  const sgst = processedItems.reduce(
    (sum, item) =>
      sum.plus(item.sgstAmount),
    D(0)
  );

  const igst = processedItems.reduce(
    (sum, item) =>
      sum.plus(item.igstAmount),
    D(0)
  );

  const totalTax = cgst
    .plus(sgst)
    .plus(igst);

  const taxableValue = processedItems.reduce(
    (sum, item) =>
      sum.plus(item.taxableAmount),
    D(0)
  );

  /*
   * Other charges are treated as non-taxable.
   */
  const beforeRounding = taxableValue
    .plus(totalTax)
    .plus(otherCharges);

  const finalTotal = beforeRounding
    .toDecimalPlaces(
      0,
      Decimal.ROUND_HALF_UP
    );

  const roundingAdjustment =
    finalTotal.minus(beforeRounding);

  return {
    items: processedItems,

    subtotal: round2(subtotal),
    taxableValue: round2(taxableValue),

    cgst: round2(cgst),
    sgst: round2(sgst),
    igst: round2(igst),

    totalTax: round2(totalTax),

    roundingAdjustment:
      round2(roundingAdjustment),

    finalTotal: round2(finalTotal)
  };
}

/**
 * Convert amount into Indian currency words.
 */
export function amountInWords(
  amount: number
): string {

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen"
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety"
  ];

  function belowHundred(
    number: number
  ): string {

    if (number < 20) {
      return ones[number];
    }

    return [
      tens[Math.floor(number / 10)],
      ones[number % 10]
    ].filter(Boolean).join(" ");
  }

  function belowThousand(
    number: number
  ): string {

    if (number < 100) {
      return belowHundred(number);
    }

    const hundreds =
      Math.floor(number / 100);

    const remainder =
      number % 100;

    return [
      `${ones[hundreds]} Hundred`,
      remainder
        ? belowHundred(remainder)
        : ""
    ].filter(Boolean).join(" ");
  }

  function convert(
    number: number
  ): string {

    if (number === 0) {
      return "Zero";
    }

    const parts: string[] = [];

    const crore =
      Math.floor(number / 10000000);

    number %= 10000000;

    const lakh =
      Math.floor(number / 100000);

    number %= 100000;

    const thousand =
      Math.floor(number / 1000);

    number %= 1000;

    if (crore) {
      parts.push(
        `${convert(crore)} Crore`
      );
    }

    if (lakh) {
      parts.push(
        `${belowThousand(lakh)} Lakh`
      );
    }

    if (thousand) {
      parts.push(
        `${belowThousand(thousand)} Thousand`
      );
    }

    if (number) {
      parts.push(
        belowThousand(number)
      );
    }

    return parts.join(" ");
  }

  const totalPaise = D(amount)
    .mul(100)
    .toDecimalPlaces(
      0,
      Decimal.ROUND_HALF_UP
    );

  const rupees = totalPaise
    .div(100)
    .floor()
    .toNumber();

  const paise = totalPaise
    .mod(100)
    .toNumber();

  let result =
    `${convert(rupees)} Rupees`;

  if (paise > 0) {
    result +=
      ` And ${convert(paise)} Paise`;
  }

  return `${result} Only`;
}