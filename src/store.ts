import { create } from 'zustand';
import { 
  BusinessProfile, 
  Client, 
  Quotation, 
  Invoice, 
  ProfitEstimate, 
  AttendanceRecord, 
  Labour, 
  Transaction, 
  RecurringExpense, 
  InventoryItem,
  SubscriptionPlan
} from './types';

interface AppState {
  // State variables
  profile: BusinessProfile;
  clients: Client[];
  quotations: Quotation[];
  invoices: Invoice[];
  profitCalculations: ProfitEstimate[];
  labourList: Labour[];
  attendance: AttendanceRecord[];
  transactions: Transaction[];
  recurringExpenses: RecurringExpense[];
  inventory: InventoryItem[];
  subscription: SubscriptionPlan;
  profitPin: string;
  isProfitUnlocked: boolean;

  // Setters & Mutations
  updateProfile: (profile: Partial<BusinessProfile>) => void;
  
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  addQuotation: (quote: Omit<Quotation, 'id'>) => void;
  updateQuotation: (id: string, quote: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  convertQuoteToInvoice: (quoteId: string) => void;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'status'>) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  recordPayment: (invoiceId: string, amount: number) => void;

  addProfitCalculation: (calc: Omit<ProfitEstimate, 'id' | 'date'>) => void;
  deleteProfitCalculation: (id: string) => void;
  setProfitUnlocked: (unlocked: boolean) => void;
  updateProfitPin: (newPin: string) => void;

  addLabour: (labour: Omit<Labour, 'id'>) => void;
  updateLabour: (id: string, labour: Partial<Labour>) => void;
  deleteLabour: (id: string) => void;
  
  setAttendance: (labourId: string, date: string, status: 'Present' | 'HalfDay' | 'Absent') => void;
  
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  
  addRecurringExpense: (rec: Omit<RecurringExpense, 'id' | 'isPaidThisMonth'>) => void;
  toggleRecurringPaid: (id: string) => void;
  deleteRecurringExpense: (id: string) => void;

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateStock: (id: string, count: number) => void;
  deleteInventoryItem: (id: string) => void;

  setSubscription: (plan: SubscriptionPlan) => void;
}

const DEFAULT_PROFILE: BusinessProfile = {
  businessName: '',
  ownerName: '',
  phone: '',
  address: '',
  gstNumber: '',
  isRegisteredGST: false,
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  upiId: '',
  signatureText: '',
  language: (localStorage.getItem('billkaro_language') as any) || 'English'
};

const INITIAL_CLIENTS: Client[] = [];

const INITIAL_QUOTATIONS: Quotation[] = [];

const INITIAL_INVOICES: Invoice[] = [];

const INITIAL_PROP_CALCS: ProfitEstimate[] = [];

const INITIAL_LABOUR: Labour[] = [];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

const INITIAL_TX: Transaction[] = [];

const INITIAL_RECURRING: RecurringExpense[] = [];

const INITIAL_INVENTORY: InventoryItem[] = [];

// Helper to load state safely or use default seed data
const getStoredState = <T>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(`billkaro_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const saveStoredState = (key: string, data: any) => {
  try {
    localStorage.setItem(`billkaro_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  // Loaded state
  profile: (() => {
    const prof = getStoredState('profile', DEFAULT_PROFILE);
    if (!prof.language) {
      prof.language = (localStorage.getItem('billkaro_language') as any) || 'English';
    }
    return prof;
  })(),
  clients: getStoredState('clients', INITIAL_CLIENTS),
  quotations: getStoredState('quotations', INITIAL_QUOTATIONS),
  invoices: getStoredState('invoices', INITIAL_INVOICES),
  profitCalculations: getStoredState('profitCalculations', INITIAL_PROP_CALCS),
  labourList: getStoredState('labourList', INITIAL_LABOUR),
  attendance: getStoredState('attendance', INITIAL_ATTENDANCE),
  transactions: getStoredState('transactions', INITIAL_TX),
  recurringExpenses: getStoredState('recurringExpenses', INITIAL_RECURRING),
  inventory: getStoredState('inventory', INITIAL_INVENTORY),
  subscription: getStoredState('subscription', 'FREE' as SubscriptionPlan),
  profitPin: getStoredState('profitPin', '1234'),
  isProfitUnlocked: false,

  updateProfile: (profileUpdates) => set((state) => {
    const next = { ...state.profile, ...profileUpdates };
    if (next.language) {
      localStorage.setItem('billkaro_language', next.language);
    }
    saveStoredState('profile', next);
    return { profile: next };
  }),

  addClient: (clientData) => set((state) => {
    const newClient: Client = {
      ...clientData,
      id: 'c_' + Date.now().toString(),
    };
    const next = [...state.clients, newClient];
    saveStoredState('clients', next);
    return { clients: next };
  }),

  updateClient: (id, clientUpdates) => set((state) => {
    const next = state.clients.map(c => c.id === id ? { ...c, ...clientUpdates } : c);
    saveStoredState('clients', next);
    return { clients: next };
  }),

  deleteClient: (id) => set((state) => {
    const next = state.clients.filter(c => c.id !== id);
    saveStoredState('clients', next);
    return { clients: next };
  }),

  addQuotation: (quoteData) => set((state) => {
    const newQuote: Quotation = {
      ...quoteData,
      id: 'q_' + Date.now().toString(),
    };
    const next = [...state.quotations, newQuote];
    saveStoredState('quotations', next);
    return { quotations: next };
  }),

  updateQuotation: (id, quoteUpdates) => set((state) => {
    const next = state.quotations.map(q => q.id === id ? { ...q, ...quoteUpdates } : q);
    saveStoredState('quotations', next);
    return { quotations: next };
  }),

  deleteQuotation: (id) => set((state) => {
    const next = state.quotations.filter(q => q.id !== id);
    saveStoredState('quotations', next);
    return { quotations: next };
  }),

  convertQuoteToInvoice: (quoteId) => set((state) => {
    const quote = state.quotations.find(q => q.id === quoteId);
    if (!quote) return {};

    // Calculate total amount based on items in quotation
    let baseSum = quote.items.reduce((total, item) => {
      const itemSum = item.rate * item.quantity;
      const gst = item.gstPercent > 0 ? (itemSum * item.gstPercent / 100) : 0;
      return total + itemSum + gst;
    }, 0);
    const finalAmount = Math.max(0, baseSum - quote.discount);

    const newInvoice: Invoice = {
      id: 'i_' + Date.now().toString(),
      invoiceNumber: 'INV-' + (state.invoices.length + 101).toString(),
      clientId: quote.clientId,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days later
      items: quote.items,
      discount: quote.discount,
      notes: quote.notes || 'Converted from Estimate ' + quote.quoteNumber,
      isGstApplied: quote.items.some(i => i.gstPercent > 0),
      totalAmount: Math.round(finalAmount),
      paidAmount: 0,
      status: 'Unpaid'
    };

    // Mark quotation as converted
    const nextQuotes = state.quotations.map(q => q.id === quoteId ? { ...q, isConverted: true } : q);
    const nextInvoices = [...state.invoices, newInvoice];
    
    // Auto-update Client total due "Lena baqi"
    const nextClients = state.clients.map(c => 
      c.id === quote.clientId ? { ...c, totalDue: c.totalDue + Math.round(finalAmount) } : c
    );

    // Auto-write Income transaction or logs could go here, but only when actually paid.
    
    saveStoredState('quotations', nextQuotes);
    saveStoredState('invoices', nextInvoices);
    saveStoredState('clients', nextClients);

    return { 
      quotations: nextQuotes, 
      invoices: nextInvoices,
      clients: nextClients
    };
  }),

  addInvoice: (invoiceData) => set((state) => {
    // Calculate total layout
    const baseSum = invoiceData.items.reduce((total, item) => {
      const itemSum = item.rate * item.quantity;
      const gst = invoiceData.isGstApplied && item.gstPercent > 0 ? (itemSum * item.gstPercent / 100) : 0;
      return total + itemSum + gst;
    }, 0);
    const finalVal = Math.round(Math.max(0, baseSum - invoiceData.discount));

    const statusValue = invoiceData.paidAmount >= finalVal 
      ? 'Paid' 
      : (invoiceData.paidAmount > 0 ? 'Partial' : 'Unpaid');

    const newInvoice: Invoice = {
      ...invoiceData,
      id: 'i_' + Date.now().toString(),
      totalAmount: finalVal,
      status: statusValue
    };

    const nextInvoices = [...state.invoices, newInvoice];
    saveStoredState('invoices', nextInvoices);

    // Update client due (totalAmount - paidAmount)
    const pendingAmount = finalVal - invoiceData.paidAmount;
    const nextClients = state.clients.map(c => 
      c.id === invoiceData.clientId ? { ...c, totalDue: c.totalDue + pendingAmount, totalPaid: c.totalPaid + invoiceData.paidAmount } : c
    );
    saveStoredState('clients', nextClients);

    // If paidAmount > 0, make an income ledger entry
    let nextTx = [...state.transactions];
    if (invoiceData.paidAmount > 0) {
      const targetClient = state.clients.find(c => c.id === invoiceData.clientId);
      nextTx.push({
        id: 'tx_pay_' + Date.now().toString(),
        type: 'Income',
        category: 'Invoicing Pay',
        amount: invoiceData.paidAmount,
        date: invoiceData.date,
        notes: `Initial payment of Invoice ${newInvoice.invoiceNumber} by ${targetClient?.name || 'Client'}`
      });
      saveStoredState('transactions', nextTx);
    }

    return { 
      invoices: nextInvoices, 
      clients: nextClients,
      transactions: nextTx 
    };
  }),

  updateInvoice: (id, invoiceUpdates) => set((state) => {
    const next = state.invoices.map(inv => {
      if (inv.id !== id) return inv;
      const nextInv = { ...inv, ...invoiceUpdates };
      
      // recalculate status
      nextInv.status = nextInv.paidAmount >= nextInv.totalAmount 
        ? 'Paid' 
        : (nextInv.paidAmount > 0 ? 'Partial' : 'Unpaid');
      
      return nextInv;
    });

    saveStoredState('invoices', next);
    return { invoices: next };
  }),

  deleteInvoice: (id) => set((state) => {
    // Reverse client balance
    const targetInvoice = state.invoices.find(inv => inv.id === id);
    let nextClients = state.clients;
    if (targetInvoice) {
      const netChange = targetInvoice.totalAmount - targetInvoice.paidAmount;
      nextClients = state.clients.map(c => 
        c.id === targetInvoice.clientId 
          ? { ...c, totalDue: Math.max(0, c.totalDue - netChange), totalPaid: Math.max(0, c.totalPaid - targetInvoice.paidAmount) } 
          : c
      );
      saveStoredState('clients', nextClients);
    }

    const nextInvoices = state.invoices.filter(inv => inv.id !== id);
    saveStoredState('invoices', nextInvoices);
    return { invoices: nextInvoices, clients: nextClients };
  }),

  recordPayment: (invoiceId, amount) => set((state) => {
    const invoice = state.invoices.find(i => i.id === invoiceId);
    if (!invoice) return {};

    const maxAcc = invoice.totalAmount - invoice.paidAmount;
    const realAmount = Math.min(amount, maxAcc);
    if (realAmount <= 0) return {};

    const nextPaid = invoice.paidAmount + realAmount;
    const nextStatus = nextPaid >= invoice.totalAmount ? 'Paid' : 'Partial';

    const nextInvoices = state.invoices.map(i => 
      i.id === invoiceId 
        ? { ...i, paidAmount: nextPaid, status: nextStatus as any } 
        : i
    );

    // Update Client metrics
    const nextClients = state.clients.map(c => 
      c.id === invoice.clientId 
        ? { ...c, totalDue: Math.max(0, c.totalDue - realAmount), totalPaid: c.totalPaid + realAmount } 
        : c
    );

    // Write payment transaction
    const targetClient = state.clients.find(c => c.id === invoice.clientId);
    const nextTx = [
      {
        id: 'tx_pay_' + Date.now().toString(),
        type: 'Income' as const,
        category: 'Client Payment',
        amount: realAmount,
        date: new Date().toISOString().split('T')[0],
        notes: `Kaat ke jama kiya for Invoice ${invoice.invoiceNumber} - ${targetClient?.name || 'Grahak'}`
      },
      ...state.transactions
    ];

    saveStoredState('invoices', nextInvoices);
    saveStoredState('clients', nextClients);
    saveStoredState('transactions', nextTx);

    return { 
      invoices: nextInvoices, 
      clients: nextClients,
      transactions: nextTx 
    };
  }),

  addProfitCalculation: (calcData) => set((state) => {
    const newCalc: ProfitEstimate = {
      ...calcData,
      id: 'p_' + Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
    };
    const next = [newCalc, ...state.profitCalculations];
    saveStoredState('profitCalculations', next);
    return { profitCalculations: next };
  }),

  deleteProfitCalculation: (id) => set((state) => {
    const next = state.profitCalculations.filter(p => p.id !== id);
    saveStoredState('profitCalculations', next);
    return { profitCalculations: next };
  }),

  setProfitUnlocked: (unlocked) => set({ isProfitUnlocked: unlocked }),
  
  updateProfitPin: (newPin) => set((state) => {
    saveStoredState('profitPin', newPin);
    return { profitPin: newPin };
  }),

  addLabour: (labourData) => set((state) => {
    const newLabour: Labour = {
      ...labourData,
      id: 'l_' + Date.now().toString()
    };
    const next = [...state.labourList, newLabour];
    saveStoredState('labourList', next);
    return { labourList: next };
  }),

  updateLabour: (id, labourUpdates) => set((state) => {
    const next = state.labourList.map(l => l.id === id ? { ...l, ...labourUpdates } : l);
    saveStoredState('labourList', next);
    return { labourList: next };
  }),

  deleteLabour: (id) => set((state) => {
    const next = state.labourList.filter(l => l.id !== id);
    const nextAttendance = state.attendance.filter(att => att.labourId !== id);
    saveStoredState('labourList', next);
    saveStoredState('attendance', nextAttendance);
    return { labourList: next, attendance: nextAttendance };
  }),

  setAttendance: (labourId, date, status) => set((state) => {
    // Check if record for this helper on this day already exists
    const existingIdx = state.attendance.findIndex(att => att.labourId === labourId && att.date === date);
    let next: AttendanceRecord[];

    if (existingIdx > -1) {
      next = state.attendance.map((att, idx) => 
        idx === existingIdx ? { ...att, status } : att
      );
    } else {
      next = [
        ...state.attendance, 
        {
          id: 'att_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
          labourId,
          date,
          status
        }
      ];
    }

    saveStoredState('attendance', next);
    return { attendance: next };
  }),

  addTransaction: (txData) => set((state) => {
    const newTx: Transaction = {
      ...txData,
      id: 'tx_' + Date.now().toString()
    };
    const next = [newTx, ...state.transactions];
    saveStoredState('transactions', next);
    return { transactions: next };
  }),

  deleteTransaction: (id) => set((state) => {
    const next = state.transactions.filter(t => t.id !== id);
    saveStoredState('transactions', next);
    return { transactions: next };
  }),

  addRecurringExpense: (recData) => set((state) => {
    const newRec: RecurringExpense = {
      ...recData,
      id: 're_' + Date.now().toString(),
      isPaidThisMonth: false
    };
    const next = [...state.recurringExpenses, newRec];
    saveStoredState('recurringExpenses', next);
    return { recurringExpenses: next };
  }),

  toggleRecurringPaid: (id) => set((state) => {
    const next = state.recurringExpenses.map(item => {
      if (item.id !== id) return item;
      const nextPaidState = !item.isPaidThisMonth;
      
      // Auto-add expense transaction if marked paid, or seek it!
      let subTxList = [...state.transactions];
      if (nextPaidState) {
        subTxList.unshift({
          id: 'tx_rec_' + Date.now().toString(),
          type: 'Expense',
          category: item.category,
          amount: item.amount,
          date: new Date().toISOString().split('T')[0],
          notes: `Paid: ${item.name}`
        });
      }
      
      return { ...item, isPaidThisMonth: nextPaidState };
    });

    saveStoredState('recurringExpenses', next);
    return { 
      recurringExpenses: next,
      // If we added transaction, update transactions or let it stay handled
    };
  }),

  deleteRecurringExpense: (id) => set((state) => {
    const next = state.recurringExpenses.filter(r => r.id !== id);
    saveStoredState('recurringExpenses', next);
    return { recurringExpenses: next };
  }),

  addInventoryItem: (itemData) => set((state) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: 'inv_' + Date.now().toString()
    };
    const next = [...state.inventory, newItem];
    saveStoredState('inventory', next);
    return { inventory: next };
  }),

  updateStock: (id, count) => set((state) => {
    const next = state.inventory.map(item => 
      item.id === id ? { ...item, stockCount: count } : item
    );
    saveStoredState('inventory', next);
    return { inventory: next };
  }),

  deleteInventoryItem: (id) => set((state) => {
    const next = state.inventory.filter(i => i.id !== id);
    saveStoredState('inventory', next);
    return { inventory: next };
  }),

  setSubscription: (plan) => set({ subscription: plan })
}));
export default useAppStore;
