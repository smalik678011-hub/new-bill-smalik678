import { Invoice } from '../types';

/**
 * Generates a dynamic, financial year-aware invoice number in INV-YYYY-SEQ format.
 * Defaults to current year (e.g., 2026) based on system date parameters.
 * 
 * In India, the Financial Year (FY) starts on April 1st and ends on March 31st of the next year.
 * For example, a document on May 20, 2026 belongs to FY 2026-27 (we can use "2026" or "202627").
 * Let's format as "INV-YYYY-SEQ" where YYYY matches the starting year of the financial year.
 * 
 * @param existingInvoices Array of current invoices to scan for sequence numbering
 * @param dateStr Optional specific date string to calculate the financial year
 * @returns Fully formatted sequence number, e.g., INV-2026-001
 */
export function generateInvoiceNumber(existingInvoices: Invoice[] = [], dateStr?: string): string {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  
  // Calculate Indian Financial Year (starts April 1)
  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth(); // 0-indexed (0 is Jan, 3 is April)
  
  const financialYearStart = currentMonth >= 3 ? currentYear : currentYear - 1;
  const prefix = `INV-${financialYearStart}-`;

  // Filter existing invoices that start with our exact financial year prefix
  const matchingInvoices = existingInvoices.filter(inv => 
    inv && inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)
  );

  if (matchingInvoices.length === 0) {
    // Return first sequence in A++ padded format
    return `${prefix}001`;
  }

  // Determine highest sequence number
  let maxSeq = 0;
  matchingInvoices.forEach(inv => {
    const parts = inv.invoiceNumber.split('-');
    const seqStr = parts[parts.length - 1];
    const seqNum = parseInt(seqStr, 10);
    if (!isNaN(seqNum) && seqNum > maxSeq) {
      maxSeq = seqNum;
    }
  });

  const nextSeq = maxSeq + 1;
  const paddedSeq = nextSeq.toString().padStart(3, '0');
  
  return `${prefix}${paddedSeq}`;
}

export default generateInvoiceNumber;
