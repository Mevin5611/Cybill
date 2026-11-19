import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { Readable } from "stream";

import type {
  IInvoice,
  IBusinessSettings
} from "../../../shared/types/index.js";

import {
  amountInWords
} from "./gst.js";

type PDFDoc = PDFKit.PDFDocument;

/* A4 PORTRAIT */
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const LEFT = 25;
const RIGHT = PAGE_WIDTH - 25;
const WIDTH = RIGHT - LEFT;

const BLACK = "#111111";
const LIGHT = "#F1F1F1";

/* Height of bank details + QR block */
const BANK_SECTION_HEIGHT = 110;

/* DUMMY BANK DETAILS - replace with real values later */

function money(value: number): string {
  return Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}

function drawText(
  doc: PDFDoc,
  value: string | number,
  x: number,
  y: number,
  width: number,
  options: {
    size?: number;
    bold?: boolean;
    align?: "left" | "right" | "center";
    wrap?: boolean;
  } = {}
) {
  doc
    .font(
      options.bold
        ? "Helvetica-Bold"
        : "Helvetica"
    )
    .fontSize(options.size || 8)
    .fillColor(BLACK)
    .text(
      String(value),
      x,
      y,
      {
        width,
        align:
          options.align || "left",
        lineBreak: options.wrap === true,
        ellipsis: options.wrap ? false : true
      }
    );
}

function line(
  doc: PDFDoc,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  doc
    .strokeColor(BLACK)
    .lineWidth(0.5)
    .moveTo(x1, y1)
    .lineTo(x2, y2)
    .stroke();
}

function box(
  doc: PDFDoc,
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc
    .strokeColor(BLACK)
    .lineWidth(0.5)
    .rect(x, y, width, height)
    .stroke();
}

/**
 * BUSINESS HEADER
 */
function drawHeader(
  doc: PDFDoc,
  settings: IBusinessSettings
): number {

  let y = 24;

  drawText(
    doc,
    settings.businessName.toUpperCase(),
    LEFT,
    y,
    WIDTH,
    {
      size: 17,
      bold: true,
      align: "center"
    }
  );

  y += 26;

  drawText(
    doc,
    settings.businessAddress || "",
    LEFT,
    y,
    WIDTH,
    {
      size: 9,
      align: "center"
    }
  );

  y += 15;

  const contact = [
    settings.businessPhone
      ? `MOB: ${settings.businessPhone}`
      : "",
    settings.businessEmail
      ? `Email: ${settings.businessEmail}`
      : ""
  ]
    .filter(Boolean)
    .join(" | ");

  drawText(
    doc,
    contact,
    LEFT,
    y,
    WIDTH,
    {
      size: 8.5,
      align: "center"
    }
  );

  y += 20;

  line(
    doc,
    LEFT,
    y,
    RIGHT,
    y
  );

  return y;
}

/**
 * INVOICE INFORMATION
 */
function drawInvoiceInfo(
  doc: PDFDoc,
  invoice: IInvoice,
  settings: IBusinessSettings,
  y: number
): number {

  const height = 43;

  box(
    doc,
    LEFT,
    y,
    WIDTH,
    height
  );

  const x1 = LEFT + 190;
  const x2 = LEFT + 355;

  line(doc, x1, y, x1, y + height);
  line(doc, x2, y, x2, y + height);

  drawText(
    doc,
    `GSTIN: ${settings.gstin}`,
    LEFT + 8,
    y + 9,
    178,
    {
      size: 8.5,
      bold: true
    }
  );

  drawText(
    doc,
    `STATE: ${settings.state}`,
    LEFT + 8,
    y + 25,
    178,
    {
      size: 8
    }
  );

  drawText(
    doc,
    "TAX INVOICE",
    x1,
    y + 15,
    x2 - x1,
    {
      size: 13,
      bold: true,
      align: "center"
    }
  );

  const date = new Date(
    invoice.invoiceDate
  ).toLocaleDateString("en-IN");

  drawText(
    doc,
    `DATE: ${date}`,
    x2 + 8,
    y + 9,
    RIGHT - x2 - 16,
    {
      size: 8.5,
      bold: true
    }
  );

  drawText(
    doc,
    `INVOICE NO: ${invoice.invoiceNumber}`,
    x2 + 8,
    y + 25,
    RIGHT - x2 - 16,
    {
      size: 8.5,
      bold: true
    }
  );

  return y + height;
}

/**
 * CUSTOMER DETAILS
 */
/**
 * CUSTOMER DETAILS
 */
function drawCustomer(
  doc: PDFDoc,
  invoice: IInvoice,
  y: number
): number {

  const height = 108;

  box(
    doc,
    LEFT,
    y,
    WIDTH,
    height
  );

  drawText(
    doc,
    "DETAILS OF RECEIVER (BILL TO)",
    LEFT + 8,
    y + 6,
    WIDTH - 16,
    {
      size: 9,
      bold: true
    }
  );

  line(
    doc,
    LEFT,
    y + 23,
    RIGHT,
    y + 23
  );

  const rows = [
    y + 30,
    y + 49,
    y + 68,
    y + 87
  ];

  const leftData: Array<[string, string]> = [
    ["NAME", invoice.customerName],
    ["ADDRESS", invoice.billingAddress || "-"],
    ["GSTIN", invoice.customerGstin || "-"]
  ];

  const rightData: Array<[string, string]> = [
    ["PHONE", invoice.customerPhone || "-"],
    ["STATE", invoice.customerState || "-"],
    ["PLACE OF SUPPLY", invoice.customerState || "-"],
    ["MOTOR VEHICLE NO", invoice.vehicleNumber || "-"]
  ];

  leftData.forEach(
    ([label, value], index) => {

      drawText(
        doc,
        label,
        LEFT + 10,
        rows[index],
        65,
        {
          size: 8,
          bold: true
        }
      );

      drawText(
        doc,
        value,
        LEFT + 75,
        rows[index],
        270,
        {
          size: 8
        }
      );
    }
  );

  rightData.forEach(
    ([label, value], index) => {

      drawText(
        doc,
        label,
        LEFT + 355,
        rows[index],
        85,
        {
          size: 8,
          bold: true
        }
      );

      drawText(
        doc,
        value,
        LEFT + 442,
        rows[index],
        WIDTH - 442 - 6,
        {
          size: 8
        }
      );
    }
  );

  return y + height + 5;
}

interface Column {
  title: string;
  width: number;
  align: "left" | "right" | "center";
}

/**
 * TABLE COLUMNS
 *
 * The last column ("Total") takes whatever width remains,
 * so the table always fits the page exactly.
 */
function getColumns(
  interState: boolean
): Column[] {

  const columns: Column[] = interState
    ? [
        { title: "Sl", width: 22, align: "center" },
        { title: "Commodity / Item", width: 160, align: "left" },
        { title: "Qty", width: 36, align: "right" },
        { title: "Unit Price", width: 66, align: "right" },
        { title: "Net Value", width: 76, align: "right" },
        { title: "IGST %", width: 40, align: "right" },
        { title: "IGST", width: 72, align: "right" }
      ]
    : [
        { title: "Sl", width: 22, align: "center" },
        { title: "Commodity / Item", width: 130, align: "left" },
        { title: "Qty", width: 34, align: "right" },
        { title: "Unit Price", width: 58, align: "right" },
        { title: "Net Value", width: 66, align: "right" },
        { title: "CGST", width: 86, align: "right" },
        { title: "SGST", width: 86, align: "right" }
      ];

  const used = columns.reduce(
    (sum, column) => sum + column.width,
    0
  );

  columns.push({
    title: "Total",
    width: WIDTH - used,
    align: "right"
  });

  return columns;
}

/**
 * TABLE HEADER
 */
function drawTableHeader(
  doc: PDFDoc,
  columns: Column[],
  y: number
): number {

  const height = 28;

  doc
    .fillColor(LIGHT)
    .rect(
      LEFT,
      y,
      WIDTH,
      height
    )
    .fill();

  box(
    doc,
    LEFT,
    y,
    WIDTH,
    height
  );

  let x = LEFT;

  columns.forEach(
    (column, index) => {

      if (index > 0) {
        line(
          doc,
          x,
          y,
          x,
          y + height
        );
      }

      drawText(
        doc,
        column.title,
        x + 4,
        y + 10,
        column.width - 8,
        {
          size: 8,
          bold: true,
          align: column.align
        }
      );

      x += column.width;
    }
  );

  return y + height;
}

/**
 * ITEM ROW
 *
 * Uses saved GST values.
 */
function drawItemRow(
  doc: PDFDoc,
  item: IInvoice["items"][number],
  index: number,
  columns: Column[],
  y: number,
  interState: boolean
): number {

  const height = 26;

  let values: string[];

  if (interState) {

    values = [
      String(index + 1),
      item.description,
      String(item.quantity),
      money(item.unitPrice),
      money(item.taxableAmount),
      `${item.igstRate}%`,
      money(item.igstAmount),
      money(item.lineTotal)
    ];

  } else {

    values = [
      String(index + 1),
      item.description,
      String(item.quantity),
      money(item.unitPrice),
      money(item.taxableAmount),

      `${money(item.cgstAmount)} (${item.cgstRate}%)`,

      `${money(item.sgstAmount)} (${item.sgstRate}%)`,

      money(item.lineTotal)
    ];
  }

  box(
    doc,
    LEFT,
    y,
    WIDTH,
    height
  );

  let x = LEFT;

  columns.forEach(
    (column, columnIndex) => {

      if (columnIndex > 0) {
        line(
          doc,
          x,
          y,
          x,
          y + height
        );
      }

      drawText(
        doc,
        values[columnIndex],
        x + 4,
        y + 9,
        column.width - 8,
        {
          size: 8,
          align: column.align
        }
      );

      x += column.width;
    }
  );

  return y + height;
}

/**
 * TOTALS
 */
function drawTotals(
  doc: PDFDoc,
  invoice: IInvoice,
  y: number,
  interState: boolean
): number {

  const totalQty = invoice.items.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  const rows: Array<{
    label: string;
    value: string;
    bold?: boolean;
  }> = [
    {
      label: "TOTAL QUANTITY",
      value: String(totalQty)
    },
    {
      label: "SUBTOTAL",
      value: money(invoice.subtotal)
    }
  ];

  if (invoice.discountAmount > 0) {
    rows.push({
      label: "DISCOUNT",
      value:
        `-${money(invoice.discountAmount)}`
    });
  }

  rows.push({
    label: "TAXABLE VALUE",
    value:
      money(invoice.taxableValue)
  });

  if (interState) {

    rows.push({
      label: "IGST",
      value:
        money(invoice.taxBreakdown.igst)
    });

  } else {

    rows.push({
      label: "CGST",
      value:
        money(invoice.taxBreakdown.cgst)
    });

    rows.push({
      label: "SGST",
      value:
        money(invoice.taxBreakdown.sgst)
    });
  }

  if (invoice.otherCharges > 0) {
    rows.push({
      label: "OTHER CHARGES",
      value:
        money(invoice.otherCharges)
    });
  }

  rows.push({
    label: "ROUND OFF",
    value:
      money(invoice.roundingAdjustment)
  });

  rows.push({
    label: "NET AMOUNT",
    value:
      money(invoice.finalTotal),
    bold: true
  });

  const rowHeight = 19;

  rows.forEach((row, index) => {

    const currentY =
      y + index * rowHeight;

    if (row.bold) {
      doc
        .fillColor(LIGHT)
        .rect(
          LEFT,
          currentY,
          WIDTH,
          rowHeight
        )
        .fill();
    }

    box(
      doc,
      LEFT,
      currentY,
      WIDTH,
      rowHeight
    );

    drawText(
      doc,
      row.label,
      LEFT + 300,
      currentY + 5,
      130,
      {
        size: row.bold ? 10 : 8,
        bold: row.bold
      }
    );

    drawText(
      doc,
      row.value,
      LEFT + 435,
      currentY + 5,
      WIDTH - 435 - 10,
      {
        size: row.bold ? 10 : 8,
        bold: row.bold,
        align: "right"
      }
    );
  });

  return y + rows.length * rowHeight;
}

/**
 * AMOUNT IN WORDS
 */
function drawAmountWords(
  doc: PDFDoc,
  invoice: IInvoice,
  y: number
): number {

  const height = 34;

  box(
    doc,
    LEFT,
    y,
    WIDTH,
    height
  );

  drawText(
    doc,
    amountInWords(
      invoice.finalTotal
    ).toUpperCase(),
    LEFT + 10,
    y + 7,
    WIDTH - 20,
    {
      size: 8.5,
      bold: true,
      align: "center",
      wrap: true
    }
  );

  return y + height;
}

/**
 * Generates a UPI payment QR code (PNG buffer)
 * containing the invoice amount.
 */

/**
 * BANK DETAILS + QR CODE
 */
async function buildPaymentQr(
  invoice: IInvoice,
  settings: IBusinessSettings
): Promise<Buffer> {

  const { upiId, accountName } = settings.bankDetails;
  const payeeName = accountName || settings.businessName;

  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(payeeName)}` +
    `&am=${Number(invoice.finalTotal || 0).toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}`;

  return QRCode.toBuffer(upiUrl, {
    type: "png",
    width: 240,
    margin: 1,
    errorCorrectionLevel: "M"
  });
}

/**
 * BANK DETAILS (+ optional QR code)
 * The QR sits inside the bank block. Without a QR, the details use full width.
 */
function drawBankAndQr(
  doc: PDFDoc,
  settings: IBusinessSettings,
  qrBuffer: Buffer | null,
  y: number
): number {

  const bank = settings.bankDetails;
  const height = BANK_SECTION_HEIGHT;
  const detailsRight = qrBuffer ? RIGHT - 120 : RIGHT;

  const v = (value?: string) => value || "-";

  box(doc, LEFT, y, WIDTH, height);

  if (qrBuffer) {
    line(doc, detailsRight, y, detailsRight, y + height);
  }

  drawText(
    doc,
    "BANK DETAILS",
    LEFT + 8,
    y + 6,
    detailsRight - LEFT - 16,
    { size: 9, bold: true }
  );

  line(doc, LEFT, y + 22, detailsRight, y + 22);

  const rows: Array<[string, string]> = [
    ["BANK NAME", v(bank.bankName)],
    ["A/C NAME", v(bank.accountName)],
    ["A/C NUMBER", v(bank.accountNumber)],
    ["IFSC", v(bank.ifsc)],
    ["BRANCH", v(bank.branch)],
    ["UPI ID", v(bank.upiId)]
  ];

  rows.forEach(([label, value], index) => {
    const rowY = y + 28 + index * 13;

    drawText(doc, label, LEFT + 8, rowY, 80, {
      size: 8,
      bold: true
    });

    drawText(doc, value, LEFT + 92, rowY, detailsRight - LEFT - 100, {
      size: 8
    });
  });

  if (qrBuffer) {
    doc.image(qrBuffer, detailsRight + 20, y + 6, {
      width: 80,
      height: 80
    });

    drawText(
      doc,
      "SCAN TO PAY",
      detailsRight,
      y + height - 14,
      120,
      {
        size: 7.5,
        bold: true,
        align: "center"
      }
    );
  }

  return y + height;
}

/**
 * FOOTER
 */
function drawFooter(
  doc: PDFDoc,
  settings: IBusinessSettings,
  y: number
) {

  const height = 76;

  box(
    doc,
    LEFT,
    y,
    WIDTH,
    height
  );

  drawText(
    doc,
    "THANK YOU",
    LEFT + 10,
    y + 12,
    200,
    {
      size: 10,
      bold: true
    }
  );

  drawText(
    doc,
    "PLEASE VISIT AGAIN",
    LEFT + 10,
    y + 31,
    200,
    {
      size: 8
    }
  );

  drawText(
    doc,
    `FOR: ${settings.businessName.toUpperCase()}`,
    RIGHT - 260,
    y + 12,
    250,
    {
      size: 10,
      bold: true,
      align: "center"
    }
  );

  drawText(
    doc,
    "Authorized Signatory",
    RIGHT - 260,
    y + 55,
    250,
    {
      size: 9,
      align: "center"
    }
  );
}

/**
 * GENERATE PDF
 */

export interface InvoicePdfOptions {
  showBankDetails: boolean;
  showPaymentQr: boolean;
}

export async function generateInvoicePdf(
  invoice: IInvoice,
  settings: IBusinessSettings,
  options: InvoicePdfOptions = {
    showBankDetails: false,
    showPaymentQr: false
  }
): Promise<Readable> {

  const showBank = options.showBankDetails;

  // QR lives inside the bank block, so it requires the block to be shown
  const qrBuffer =
    showBank &&
    options.showPaymentQr &&
    settings.bankDetails.upiId
      ? await buildPaymentQr(invoice, settings)
      : null;

  return new Promise(
    (resolve, reject) => {

      try {

        const doc = new PDFDocument({
          size: "A4",
          layout: "portrait",
          margins: {
            top: 25,
            bottom: 25,
            left: LEFT,
            right: LEFT
          }
        });

        const chunks: Buffer[] = [];

        doc.on(
          "data",
          (chunk: Buffer) => {
            chunks.push(chunk);
          }
        );

        doc.on("end", () => {
          resolve(
            Readable.from(
              Buffer.concat(chunks)
            )
          );
        });

        doc.on("error", reject);

        /*
         * Determine tax type using stored tax amounts.
         */
        const hasCgstSgst =
          invoice.taxBreakdown.cgst > 0 ||
          invoice.taxBreakdown.sgst > 0 ||
          invoice.items.some(
            item =>
              item.cgstAmount > 0 ||
              item.sgstAmount > 0
          );

        /*
         * CGST/SGST takes priority. IGST is used only when
         * no CGST/SGST was saved and IGST was charged.
         */
        const interState =
          !hasCgstSgst &&
          (
            invoice.taxBreakdown.igst > 0 ||
            invoice.items.some(
              item =>
                item.igstAmount > 0 ||
                item.igstRate > 0
            )
          );

        const columns =
          getColumns(interState);

        let y = drawHeader(
          doc,
          settings
        );

        y = drawInvoiceInfo(
          doc,
          invoice,
          settings,
          y
        );

        y = drawCustomer(
          doc,
          invoice,
          y
        );

        y = drawTableHeader(
          doc,
          columns,
          y
        );

        invoice.items.forEach(
          (item, index) => {

            if (
              y + 26 >
              PAGE_HEIGHT - 30
            ) {

              doc.addPage();

              y = 30;

              drawText(
                doc,
                settings.businessName.toUpperCase(),
                LEFT,
                y,
                WIDTH,
                {
                  size: 13,
                  bold: true,
                  align: "center"
                }
              );

              y += 25;

              drawText(
                doc,
                `INVOICE: ${invoice.invoiceNumber} (Continued)`,
                LEFT,
                y,
                WIDTH,
                {
                  size: 9,
                  align: "center"
                }
              );

              y += 25;

              y = drawTableHeader(
                doc,
                columns,
                y
              );
            }

            y = drawItemRow(
              doc,
              item,
              index,
              columns,
              y,
              interState
            );
          }
        );

       const bankHeight = showBank ? BANK_SECTION_HEIGHT : 0;

        const totalRows =
          2 +
          (invoice.discountAmount > 0 ? 1 : 0) +
          1 +
          (interState ? 1 : 2) +
          (invoice.otherCharges > 0 ? 1 : 0) +
          2;

        /* totals + amount in words + bank/QR + footer */
        const requiredHeight =
          totalRows * 19 +
          34 +
          bankHeight +
          76;

        if (y + requiredHeight > PAGE_HEIGHT - 25) {
          doc.addPage();
          y = 30;
        }

        y = drawTotals(doc, invoice, y, interState);

        y = drawAmountWords(doc, invoice, y);

        if (showBank) {
          y = drawBankAndQr(doc, settings, qrBuffer, y);
        }

        drawFooter(doc, settings, y);

        doc.end();

      } catch (error) {
        reject(error);
      }
    }
  );
}