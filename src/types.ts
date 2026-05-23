export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  gstNumber: string;
  isRegisteredGST: boolean;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  signatureText: string;
  logoUrl?: string;
  language?: 'Hinglish' | 'Hindi' | 'English';
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  clientType: 'Contractor' | 'Regular' | 'Supplier' | 'Individual';
  totalDue: number; // Lena baqi
  totalPaid: number;
}

export interface BillItem {
  name: string;
  quantity: number;
  unit: string; // e.g., 'Kg', 'Feet', 'Pcs', 'Day'
  rate: number;
  gstPercent: number; // e.g., 0, 5, 12, 18, 28
  hsn?: string; // HSN/SAC code
}

export interface InvoicePayment {
  id: string;
  amount: number;
  date: string;
  mode: 'Cash' | 'Online' | 'Cheque';
  receiptNumber: string;
  notes?: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  clientId: string;
  date: string;
  items: BillItem[];
  discount: number;
  notes: string;
  isConverted: boolean;
  validityDays: number;
  category?: string;
  advanceAmount?: number;
  advanceMode?: 'Cash' | 'Online';
  conditions?: string[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  date: string;
  dueDate: string;
  items: BillItem[];
  discount: number;
  notes: string;
  isGstApplied: boolean;
  totalAmount: number;
  paidAmount: number;
  status: 'Unpaid' | 'Partial' | 'Paid' | 'Draft' | 'Sent' | 'Overdue';
  gstType?: 'CGST_SGST' | 'IGST';
  payments?: InvoicePayment[];
}

export interface ProfitEstimate {
  id: string;
  projectName: string;
  materialCost: number;
  labourCost: number;
  overheadCost: number;
  offeredPrice: number;
  date: string;
}

export interface VisitingCard {
  theme: 'amber' | 'slate' | 'emerald' | 'crimson' | 'indigo';
  logoPlaceholder: string;
  services: string[];
  primaryTagline: string;
}

export interface AttendanceRecord {
  id: string;
  labourId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'HalfDay' | 'Absent';
}

export interface Labour {
  id: string;
  name: string;
  dailyRate: number; // Dihaadi (daily wage)
  phone: string;
}

export interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  category: string; // e.g. Tea, Rent, Cement, Adv Payment
  amount: number;
  date: string;
  notes: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // e.g., "5th of every month"
  category: 'Rent' | 'Electricity' | 'EMI' | 'Salary' | 'Other';
  isPaidThisMonth: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stockCount: number;
  unit: string;
  minimumRequired: number;
  purchasePrice: number;
}

export type SubscriptionPlan = 'FREE' | 'PRO' | 'YEARLY';
