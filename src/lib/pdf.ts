import { jsPDF } from 'jspdf';
import { Invoice, Quotation, InvoicePayment, Client, BusinessProfile, Transaction } from '../types';


interface InvoicePDFData {
  invoice: Invoice;
  client?: Client;
  profile?: BusinessProfile;
}

interface QuotationPDFData {
  quotation: Quotation;
  client?: Client;
  profile?: BusinessProfile;
}

interface ReceiptPDFData {
  payment: InvoicePayment;
  invoice?: Invoice;
  client?: Client;
  profile?: BusinessProfile;
}

interface MonthlyReportPDFData {
  monthName: string;
  year: number;
  transactions: Transaction[];
  profile?: BusinessProfile;
}

/**
 * Format helper for Currency standard Indian numbering format
 */
function formatRupees(amount: number = 0): string {
  return 'Rs. ' + (amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Helper to split text safely and sanitize for jsPDF standard fonts
 */
function sanitize(text: string): string {
  if (!text) return '';
  // Remove non-ASCII characters to prevent jsPDF crashes with standard fonts
  return text.replace(/[^\x00-\x7F]/g, '');
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(sanitize(text), maxWidth);
}

/**
 * Draw A4 Border outlines and Header frame
 */
function drawOuterGrid(doc: jsPDF, pageTitle: string, brandName: string) {
  // Thin border guide
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.3);
  doc.rect(10, 10, 190, 277);

  // Bottom Footer block
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 145, 150);
  doc.text(`Generated securely by BillKaro Ledger Engine • ${brandName}`, 15, 282);
  doc.text('Page 1 of 1', 195, 282, { align: 'right' });
}

/**
 * 1. Generates a GST-Compliant A4 Tax Invoice PDF
 */
export function generateInvoicePDF(data: InvoicePDFData): jsPDF {
  const { invoice, client, profile } = data;
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const bizName = profile?.businessName || 'BillKaro Merchant';
  const clientName = client?.name || 'Valued Customer';

  // Draw aesthetics
  drawOuterGrid(doc, 'TAX INVOICE', bizName);

  // Header Title banner
  doc.setFillColor(15, 23, 42); // deep charcoal background
  doc.rect(10, 10, 190, 15, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('GST TAX INVOICE', 15, 20);
  doc.setFontSize(9);
  doc.text(sanitize(invoice.invoiceNumber), 195, 20, { align: 'right' });

  // 1. Seller Information (Left) AND Invoice Meta (Right)
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Billed From:', 15, 38);
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(sanitize(bizName), 15, 44);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 85, 90);
  
  // Wrap seller address
  const sellerAddrLine = wrapText(doc, profile?.address || 'Shop Workshop address, GT Road', 80);
  let addrY = 49;
  sellerAddrLine.forEach(line => {
    doc.text(line, 15, addrY);
    addrY += 4.5;
  });

  doc.text(`Owner: ${sanitize(profile?.ownerName || 'Proprietor')}`, 15, addrY);
  doc.text(`Phone: ${sanitize(profile?.phone || 'N/A')}`, 15, addrY + 4.5);
  if (profile?.isRegisteredGST && profile.gstNumber) {
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`GSTIN No: ${sanitize(profile.gstNumber)}`, 15, addrY + 9);
  }

  // Invoice Metadata (Right block)
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Invoice Details:', 120, 38);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 85, 90);
  doc.text(`Invoce Ref No:  ${sanitize(invoice.invoiceNumber)}`, 120, 44);
  doc.text(`Issue Date:       ${sanitize(invoice.date)}`, 120, 48.5);
  doc.text(`Due Date:         ${sanitize(invoice.dueDate)}`, 120, 53);
  
  const statusColor = invoice.status === 'Paid' ? 'PAID' : invoice.status === 'Partial' ? 'PARTIAL' : 'UNPAID';
  doc.setFont('Helvetica', 'bold');
  doc.text(`Status Level:      ${statusColor}`, 120, 58.5);

  // 2. Client / Billed To Info (Left half)
  doc.setDrawColor(220, 225, 230);
  doc.line(10, 75, 200, 75); // partition line

  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Billed To:', 15, 82);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(sanitize(clientName), 15, 88);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 85, 90);
  doc.text(`Phone No:  ${sanitize(client?.phone || 'N/A')}`, 15, 93);
  doc.text(`Type:          ${sanitize(client?.clientType || 'Regular customer')}`, 15, 97.5);

  // 3. Billing Items Table Header
  const tableY = 110;
  doc.setFillColor(243, 244, 246);
  doc.rect(10, tableY, 190, 8, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('S.N.', 12, tableY + 5.5);
  doc.text('Item Description', 22, tableY + 5.5);
  doc.text('HSN', 88, tableY + 5.5);
  doc.text('Qty', 106, tableY + 5.5);
  doc.text('Rate', 123, tableY + 5.5);
  if (invoice.isGstApplied) {
    doc.text('GST %', 145, tableY + 5.5);
  }
  doc.text('Total Amount', 172, tableY + 5.5);

  // Table Body Items Loop
  let currentY = tableY + 8;
  const items = invoice.items || [];
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);

  let subtotal = 0;
  let totalGstVal = 0;

  items.forEach((item, index) => {
    const itemTotal = item.rate * item.quantity;
    subtotal += itemTotal;
    
    let itemGst = 0;
    if (invoice.isGstApplied) {
      itemGst = itemTotal * (item.gstPercent || 0) / 100;
      totalGstVal += itemGst;
    }

    doc.setTextColor(15, 23, 42);
    doc.text((index + 1).toString(), 14, currentY + 5);
    
    // Wrap item description text
    const descLines = wrapText(doc, item.name, 62);
    let descY = currentY + 5;
    descLines.forEach((descLine, i) => {
      doc.text(descLine, 22, descY + (i * 4));
    });

    const linesOffset = (descLines.length - 1) * 4;

    doc.text(sanitize(item.hsn || '-'), 88, currentY + 5);
    doc.text(`${sanitize(item.quantity.toString())} ${sanitize(item.unit || 'Kg')}`, 106, currentY + 5);
    doc.text((item.rate ?? 0).toLocaleString('en-IN'), 123, currentY + 5);

    if (invoice.isGstApplied) {
      doc.text(`${item.gstPercent || 0}%`, 147, currentY + 5);
    }
    
    const finalRowTotal = itemTotal + itemGst;
    doc.text((finalRowTotal ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 1 }), 172, currentY + 5);

    // separator lines
    currentY += 8 + linesOffset;
    doc.setDrawColor(240, 242, 245);
    doc.line(10, currentY, 200, currentY);
  });

  // Calculate totals
  const discountVal = invoice.discount || 0;
  const totalBillCost = subtotal + totalGstVal - discountVal;

  // 4. Summaries block
  let summaryY = currentY + 5;
  if (summaryY > 210) {
    // Add new page if content overflow is detected
    doc.addPage();
    summaryY = 25;
    drawOuterGrid(doc, 'TAX INVOICE', bizName);
  }

  // Draw bank information details (Bottom Left)
  doc.setFillColor(250, 250, 251);
  doc.rect(13, summaryY, 95, 42, 'F');
  doc.setDrawColor(220, 225, 230);
  doc.rect(13, summaryY, 95, 42);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('PAYMENT BANK SETTINGS:', 17, summaryY + 5.5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 85, 90);
  doc.text(`Bank Name:    ${sanitize(profile?.bankName || 'Not configured')}`, 17, summaryY + 11.5);
  doc.text(`Account No:   ${sanitize(profile?.accountNumber || 'N/A')}`, 17, summaryY + 17);
  doc.text(`IFSC Code:    ${sanitize(profile?.ifscCode || 'N/A')}`, 17, summaryY + 22.5);
  doc.text(`UPI payment Address: ${sanitize(profile?.upiId || 'N/A')}`, 17, summaryY + 28);
  doc.setFont('Helvetica', 'bold');
  doc.text('Instruction: Please pay within due period and safe.', 17, summaryY + 35);

  // Financial calculations grid (Bottom Right)
  const calcX = 125;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 105, 110);

  doc.text('Subtotal Value:', calcX, summaryY + 5);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupees(subtotal), 195, summaryY + 5, { align: 'right' });

  if (invoice.isGstApplied) {
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 105, 110);
    doc.text('Total GST Tax:', calcX, summaryY + 11);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatRupees(totalGstVal), 195, summaryY + 11, { align: 'right' });
  }

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 105, 110);
  doc.text('Special Discount:', calcX, summaryY + 17);
  doc.text(`-${formatRupees(discountVal)}`, 195, summaryY + 17, { align: 'right' });

  // Draw Grand Total banner
  doc.setFillColor(15, 23, 42);
  doc.rect(123, summaryY + 22, 72, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Grand Total:', calcX, summaryY + 27.5);
  doc.text(formatRupees(totalClassified(invoice.totalAmount, totalBillCost)), 195, summaryY + 27.5, { align: 'right' });

  // Paid, Bal details
  doc.setFontSize(8.5);
  doc.setTextColor(80, 85, 90);
  doc.text('Paid Paid Amount:', calcX, summaryY + 36);
  doc.text(formatRupees(invoice.paidAmount), 195, summaryY + 36, { align: 'right' });

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(190, 24, 74); // Rose 600
  doc.text('Outstanding Due:', calcX, summaryY + 41.5);
  const dueOutstanding = Math.max(0, (invoice.totalAmount || totalBillCost) - invoice.paidAmount);
  doc.text(formatRupees(dueOutstanding), 195, summaryY + 41.5, { align: 'right' });

  // Bottom Remarks line
  doc.setDrawColor(220, 225, 230);
  doc.line(10, summaryY + 48, 200, summaryY + 48);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 125, 130);
  doc.text(`Terms Remarks: ${sanitize(profile?.signatureText || 'Goods once sold will not be taken back. Thank you.')}`, 15, summaryY + 54);

  // Sign / Auth
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Authorized Signatory', 195, summaryY + 54, { align: 'right' });

  return doc;
}

function totalClassified(main: number, fallback: number): number {
  return main > 0 ? main : fallback;
}

/**
 * 2. Generates an Elegant Quotation PDF document (A4 size)
 */
export function generateQuotationPDF(data: QuotationPDFData): jsPDF {
  const { quotation, client, profile } = data;
  const doc = new jsPDF('p', 'mm', 'a4');

  const bizName = profile?.businessName || 'BillKaro Merchant';
  const clientName = client?.name || 'Valued Customer';

  // Outside Border
  drawOuterGrid(doc, 'QUOTATION', bizName);

  // Blue Theme Header Title banner for Quote
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(10, 10, 190, 15, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('ESTIMATE & BUSINESS QUOTATION', 15, 20);
  doc.setFontSize(9);
  doc.text(sanitize(quotation.quoteNumber), 195, 20, { align: 'right' });

  // Seller info
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('From Merchant Info:', 15, 38);

  doc.setFontSize(11);
  doc.text(sanitize(bizName), 15, 44);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 85, 90);

  const sellerAddrLine = wrapText(doc, profile?.address || 'Workshop details, GT Road', 80);
  let addrY = 49;
  sellerAddrLine.forEach(line => {
    doc.text(line, 15, addrY);
    addrY += 4.5;
  });

  doc.text(`Contact Phone: ${sanitize(profile?.phone || 'N/A')}`, 15, addrY);

  // Quotation particulars info
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Estimates Details:', 120, 38);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 85, 90);
  doc.text(`Quote Ref No:   ${sanitize(quotation.quoteNumber)}`, 120, 44);
  doc.text(`Date of Quote:  ${sanitize(quotation.date)}`, 120, 48.5);
  doc.text(`Validity Period: ${sanitize((quotation.validityDays || 30).toString())} Days`, 120, 53);

  // Client Details panel
  doc.setDrawColor(220, 225, 230);
  doc.line(10, 75, 200, 75);

  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.text('Proposed For:', 15, 82);

  doc.setFontSize(11);
  doc.text(sanitize(clientName), 15, 88);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 85, 90);
  doc.text(`Phone No:  ${sanitize(client?.phone || 'N/A')}`, 15, 93);
  doc.text(`Project Mode: ${sanitize(quotation.category || 'General Work')}`, 15, 97.5);

  // Items List Header
  const tableY = 110;
  doc.setFillColor(243, 244, 246);
  doc.rect(10, tableY, 190, 8, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('S.N.', 12, tableY + 5.5);
  doc.text('Item / Work Particular', 22, tableY + 5.5);
  doc.text('Quantity', 105, tableY + 5.5);
  doc.text('Unit Rate', 140, tableY + 5.5);
  doc.text('Sub Total Amount', 170, tableY + 5.5);

  // Items iterator
  let currentY = tableY + 8;
  const items = quotation.items || [];
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);

  let subtotal = 0;

  items.forEach((item, index) => {
    const itemTotal = item.rate * item.quantity;
    subtotal += itemTotal;

    doc.setTextColor(15, 23, 42);
    doc.text((index + 1).toString(), 14, currentY + 5);

    const descLines = wrapText(doc, item.name, 75);
    let descY = currentY + 5;
    descLines.forEach((descLine, i) => {
      doc.text(descLine, 22, descY + (i * 4));
    });

    const linesOffset = (descLines.length - 1) * 4;

    doc.text(`${sanitize(item.quantity.toString())} ${sanitize(item.unit || 'Kg')}`, 105, currentY + 5);
    doc.text(formatRupees(item.rate), 140, currentY + 5);
    doc.text(formatRupees(itemTotal), 170, currentY + 5);

    currentY += 8 + linesOffset;
    doc.setDrawColor(240, 242, 245);
    doc.line(10, currentY, 200, currentY);
  });

  const discountVal = quotation.discount || 0;
  const finalCost = subtotal - discountVal;

  let summaryY = currentY + 5;
  if (summaryY > 210) {
    doc.addPage();
    summaryY = 25;
    drawOuterGrid(doc, 'QUOTATION', bizName);
  }

  // Draw terms box
  doc.setFillColor(250, 250, 251);
  doc.rect(13, summaryY, 95, 38, 'F');
  doc.setDrawColor(220, 225, 230);
  doc.rect(13, summaryY, 95, 38);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('PROPOSED TERMS & CONDITIONS:', 17, summaryY + 5.5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 85, 90);
  
  const conditions = quotation.conditions || [
    '1. Prices are estimated on current material rates.',
    '2. Advance of 40% mandatory to initiate construction.',
    '3. Validity of document is limit to 30 days.'
  ];
  
  let condY = summaryY + 11.5;
  conditions.slice(0, 4).forEach(cond => {
    doc.text(cond, 17, condY);
    condY += 5.5;
  });

  // Calculate costs summary
  const calcX = 125;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 105, 110);

  doc.text('Sum Total:', calcX, summaryY + 5);
  doc.text(formatRupees(subtotal), 195, summaryY + 5, { align: 'right' });

  doc.text('Special Discount Offer:', calcX, summaryY + 11);
  doc.text(`-${formatRupees(discountVal)}`, 195, summaryY + 11, { align: 'right' });

  // Banner Grand Total
  doc.setFillColor(30, 41, 59);
  doc.rect(123, summaryY + 16, 72, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Estimated Total:', calcX, summaryY + 21.5);
  doc.text(formatRupees(finalCost), 195, summaryY + 21.5, { align: 'right' });

  if (quotation.advanceAmount) {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 85, 90);
    doc.text('Proposed Advance Required:', calcX, summaryY + 29.5);
    doc.text(formatRupees(quotation.advanceAmount), 195, summaryY + 29.5, { align: 'right' });
  }

  doc.setDrawColor(220, 225, 230);
  doc.line(10, summaryY + 44, 200, summaryY + 44);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 125, 130);
  doc.text(`Estimator Notes: ${sanitize(quotation.notes || 'Please connect if you require custom sizing or updates.')}`, 15, summaryY + 49);

  return doc;
}

/**
 * 3. Generates a beautiful payment and receipt acknowledgement letter (A5 size)
 */
export function generateReceiptPDF(data: ReceiptPDFData): jsPDF {
  const { payment, invoice, client, profile } = data;
  
  // Clean receipts fit beautifully on standard landscape A5 format or structured mini A5 sheet
  const doc = new jsPDF('p', 'mm', 'a5'); // Standard A5 portrait - elegant mini voucher
  const bizName = profile?.businessName || 'BillKaro Merchant';
  const clientName = client?.name || 'Valued Customer';

  // Soft background card outline
  doc.setDrawColor(200, 205, 210);
  doc.setLineWidth(0.3);
  doc.rect(5, 5, 138, 200);

  // Deep green badge header for accounting receipt
  doc.setFillColor(6, 95, 70); // emerald-800
  doc.rect(5, 5, 138, 12, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('PAYMENT RECEIPT', 10, 13);
  doc.setFontSize(8);
  doc.text(sanitize(payment.receiptNumber), 133, 13, { align: 'right' });

  // From Business
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Issued By:', 10, 26);
  
  doc.setFontSize(10);
  doc.text(sanitize(bizName), 10, 31);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 105, 110);
  doc.text(`Phone No: ${sanitize(profile?.phone || 'N/A')}`, 10, 36);
  doc.text(`Owner: ${sanitize(profile?.ownerName || '')}`, 10, 40);

  // Right block Meta
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Receipt Details:', 90, 26);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 105, 110);
  doc.text(`Receipt ID:    ${sanitize(payment.receiptNumber)}`, 90, 31);
  doc.text(`Received Date: ${sanitize(payment.date)}`, 90, 35.5);
  doc.text(`Payment Mode:  ${sanitize(payment.mode || 'Cash')}`, 90, 40);

  // Line break
  doc.setDrawColor(220, 225, 230);
  doc.line(5, 47, 143, 47);

  // Client Info (Payer)
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Payer:', 10, 54);

  doc.setFontSize(10.5);
  doc.text(sanitize(clientName), 10, 60);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 105, 110);
  doc.text(`Payer Phone: ${sanitize(client?.phone || 'N/A')}`, 10, 65);
  if (invoice) {
    doc.text(`Invoice Ref No: #${sanitize(invoice.invoiceNumber)}`, 10, 69.5);
  }

  // Grid box showing amount received
  doc.setFillColor(243, 244, 246);
  doc.rect(10, 77, 128, 22, 'F');
  doc.rect(10, 77, 128, 22);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(6, 95, 70);
  doc.text('AMOUNT RECEIVED:', 15, 83.5);

  doc.setFontSize(15);
  doc.text(formatRupees(payment.amount), 15, 93);

  // Bank Info details
  let textY = 110;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 85, 90);
  doc.text(`Remarks / Notes: ${sanitize(payment.notes || 'Acknowledged with thanks.')}`, 10, textY);
  
  if (invoice) {
    doc.text(`Previous Outstanding: ${formatRupees(invoice.totalAmount)}`, 10, textY + 6);
    doc.text(`Total Paid So Far:     ${formatRupees(invoice.paidAmount)}`, 10, textY + 11);
    
    // Balance
    const balanceDue = Math.max(0, invoice.totalAmount - invoice.paidAmount);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(190, 24, 74);
    doc.text(`Remaining Balance Due: ${formatRupees(balanceDue)}`, 10, textY + 16);
  }

  // Divider line
  doc.setDrawColor(220, 225, 230);
  doc.line(5, 160, 143, 160);

  // Bottom Greetings
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Thank you for your business!', 10, 172);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 145, 150);
  doc.text('Electronic receipt copy. Authorized signature not mandatorily required.', 10, 178);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Accounts Manager', 133, 172, { align: 'right' });

  return doc;
}

/**
 * 4. Generates a corporate Monthly GST & Tax ledger overview report (A4 size)
 */
export function generateMonthlyReportPDF(data: MonthlyReportPDFData): jsPDF {
  const { monthName, year, transactions, profile } = data;
  const doc = new jsPDF('p', 'mm', 'a4');

  const bizName = profile?.businessName || 'BillKaro Merchant';

  // Thin outer boundary
  drawOuterGrid(doc, 'MONTHLY REPORT', bizName);

  // Corporate theme Header banner
  doc.setFillColor(30, 41, 59); // deep navy corporate
  doc.rect(10, 10, 190, 15, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`MONTHLY BUSINESS STATEMENT (${monthName.toUpperCase()} - ${year})`, 15, 20);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, 195, 20, { align: 'right' });

  // Business Metadata Info
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(bizName, 15, 36);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 105, 110);
  doc.text(`Owner:       ${profile?.ownerName || 'Ledger Owner'}`, 15, 41.5);
  doc.text(`Contact:     ${profile?.phone || 'N/A Address'}`, 15, 46);
  doc.text(`GST Status:  ${profile?.isRegisteredGST ? `Registered (${profile.gstNumber})` : 'Unregistered regular'}`, 15, 50.5);

  doc.setDrawColor(220, 225, 230);
  doc.line(10, 56, 200, 56);

  // Compute Revenue / Expense Statistics
  const incomeTrans = transactions.filter(t => t.type === 'Income');
  const expenseTrans = transactions.filter(t => t.type === 'Expense');

  const totalIncome = incomeTrans.reduce((sum, val) => sum + val.amount, 0);
  const totalExpense = expenseTrans.reduce((sum, val) => sum + val.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Visual Statistics Cards Grid
  doc.setFillColor(243, 244, 246);
  doc.rect(12, 63, 56, 16, 'F');
  doc.rect(12, 63, 56, 16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TOTAL REVENUE:', 15, 68);
  doc.setFontSize(9.5);
  doc.setTextColor(16, 124, 65); // green
  doc.text(formatRupees(totalIncome), 15, 74);

  doc.setFillColor(243, 244, 246);
  doc.rect(73, 63, 56, 16, 'F');
  doc.rect(73, 63, 56, 16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TOTAL EXPENSE:', 76, 68);
  doc.setFontSize(9.5);
  doc.setTextColor(190, 24, 74); // rose
  doc.text(formatRupees(totalExpense), 76, 74);

  doc.setFillColor(243, 244, 246);
  doc.rect(134, 63, 56, 16, 'F');
  doc.rect(134, 63, 56, 16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('NET REVENUE MARGIN:', 137, 68);
  doc.setFontSize(9.5);
  doc.setTextColor(netProfit >= 0 ? 16 : 190, netProfit >= 0 ? 124 : 24, netProfit >= 0 ? 65 : 74);
  doc.text(formatRupees(netProfit), 137, 74);

  // Table header of transactions
  const listY = 90;
  doc.setFillColor(243, 244, 246);
  doc.rect(10, listY, 190, 8, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Date', 15, listY + 5.5);
  doc.text('Type', 40, listY + 5.5);
  doc.text('Project / Description', 65, listY + 5.5);
  doc.text('Income', 135, listY + 5.5);
  doc.text('Expense', 170, listY + 5.5);

  let currentY = listY + 8;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);

  const limitedList = transactions.slice(0, 18); // limit top items to fit neatly on 1 page

  limitedList.forEach((trans) => {
    doc.setTextColor(80, 85, 90);
    doc.text(sanitize(trans.date), 15, currentY + 5.5);
    
    // Type coloring
    doc.setFont('Helvetica', 'bold');
    if (trans.type === 'Income') {
      doc.setTextColor(16, 124, 65);
      doc.text('INCOME', 40, currentY + 5.5);
    } else {
      doc.setTextColor(190, 24, 74);
      doc.text('EXPENSE', 40, currentY + 5.5);
    }
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    
    // Wrap description
    const descText = `[${trans.category}] ${trans.notes || ''}`;
    const descLines = wrapText(doc, descText, 62);
    let dY = currentY + 5.5;
    descLines.forEach((l, idx) => {
      doc.text(l, 65, dY + (idx * 4));
    });

    const linesOffset = (descLines.length - 1) * 4;

    if (trans.type === 'Income') {
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(16, 124, 65);
      doc.text(formatRupees(trans.amount), 135, currentY + 5.5);
      doc.text('-', 170, currentY + 5.5);
    } else {
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text('-', 135, currentY + 5.5);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(190, 24, 74);
      doc.text(formatRupees(trans.amount), 170, currentY + 5.5);
    }

    currentY += 8 + linesOffset;
    doc.setDrawColor(240, 242, 245);
    doc.line(10, currentY, 200, currentY);
  });

  if (transactions.length > 18) {
    doc.setFont('Helvetica', 'bolditalic');
    doc.setTextColor(120, 125, 130);
    doc.setFontSize(7.5);
    doc.text(`* Showing top 18 transactions of ${transactions.length} total entries inside selected month.`, 15, currentY + 6);
  }

  // Divider lines
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text('Accounts Auditor Verification Summary', 15, 260);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 125, 130);
  doc.text('Compiled and authorized as legal audit documentation for the selected accounting block.', 15, 265);

  doc.setFont('Helvetica', 'bold');
  doc.text('Ledger Accountant Sign', 195, 260, { align: 'right' });

  return doc;
}

/**
 * Generate PDF for Pending Payments (Lena Baqi) Report
 */
export function generatePendingPaymentsPDF(data: {
  clients: Client[];
  invoices: Invoice[];
  profile: any;
}): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const { clients, invoices, profile } = data;
  const bizName = profile?.businessName || 'BillKaro Merchant';

  // Total Calculation
  const pendingInvoices = invoices.filter(inv => inv.status !== 'Paid');
  const totalPendingAmount = pendingInvoices.reduce((sum, inv) => sum + (inv.totalAmount - (inv.paidAmount || 0)), 0);

  // Header Background
  doc.setFillColor(245, 158, 11); // Amber-500
  doc.rect(0, 0, 210, 35, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('PENDING PAYMENTS REPORT', 15, 20);
  
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 195, 20, { align: 'right' });
  doc.text(sanitize(bizName), 195, 26, { align: 'right' });

  // Summary Box
  doc.setFillColor(255, 251, 235); // Amber-50
  doc.setDrawColor(252, 211, 77); // Amber-200
  doc.roundedRect(15, 45, 180, 25, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Outstanding Amount:', 25, 57);
  
  doc.setFontSize(16);
  doc.setTextColor(180, 83, 9); // Amber-800
  doc.text(formatRupees(totalPendingAmount), 110, 58);

  // Table Header
  const tableY = 85;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, tableY, 180, 10, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Client Name', 18, tableY + 6.5);
  doc.text('Phone', 85, tableY + 6.5);
  doc.text('Last Activity', 125, tableY + 6.5);
  doc.text('Pending Amount', 165, tableY + 6.5);

  let currentY = tableY + 14;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  // Group by client and list totals
  const clientPendingMap = new Map<string, number>();
  pendingInvoices.forEach(inv => {
    const amount = inv.totalAmount - (inv.paidAmount || 0);
    if (amount > 0) {
      clientPendingMap.set(inv.clientId, (clientPendingMap.get(inv.clientId) || 0) + amount);
    }
  });

  Array.from(clientPendingMap.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by highest pending
    .forEach(([clientId, amount]) => {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      const latestInvoice = invoices
        .filter(inv => inv.clientId === clientId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (currentY > 270) {
        doc.addPage();
        doc.setFillColor(241, 245, 249);
        doc.rect(15, 10, 180, 10, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.text('Client Name', 18, 16.5);
        doc.text('Phone', 85, 16.5);
        doc.text('Last Activity', 125, 16.5);
        doc.text('Pending Amount', 165, 16.5);
        currentY = 25;
      }

      doc.setFont('Helvetica', 'normal');
      doc.text(sanitize(client.name), 18, currentY);
      doc.text(sanitize(client.phone || '-'), 85, currentY);
      doc.text(sanitize(latestInvoice?.date || '-'), 125, currentY);
      
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(190, 24, 74); // Rose-600
      doc.text(formatRupees(amount), 165, currentY);
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(15, currentY + 3, 195, currentY + 3);
      currentY += 10;
    });

  // Section 2: Detailed Unpaid Invoices
  if (currentY > 240) {
    doc.addPage();
    currentY = 25;
  } else {
    currentY += 15;
  }

  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(15, currentY, 180, 8, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('DETAILED UNPAID INVOICES LIST', 18, currentY + 5.5);

  currentY += 15;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, currentY, 180, 8, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.text('Inv #', 18, currentY + 5.5);
  doc.text('Customer', 45, currentY + 5.5);
  doc.text('Date', 105, currentY + 5.5);
  doc.text('Grand Total', 135, currentY + 5.5);
  doc.text('Balance Due', 165, currentY + 5.5);

  currentY += 12;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  pendingInvoices
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach(inv => {
      if (currentY > 275) {
        doc.addPage();
        currentY = 25;
      }

      const client = clients.find(c => c.id === inv.clientId);
      doc.text(sanitize(inv.invoiceNumber), 18, currentY);
      doc.text(sanitize(client?.name || 'Unknown'), 45, currentY);
      doc.text(sanitize(inv.date), 105, currentY);
      doc.text(formatRupees(inv.totalAmount), 135, currentY);
      
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(190, 24, 74);
      doc.text(formatRupees(inv.totalAmount - (inv.paidAmount || 0)), 165, currentY);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      doc.setDrawColor(248, 250, 252);
      doc.line(15, currentY + 2.5, 195, currentY + 2.5);
      currentY += 7;
    });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated by BillKaro • System Report • Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
  }

  return doc;
}
