import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  X, 
  Calendar, 
  DollarSign, 
  PlusCircle, 
  Percent, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  QrCode, 
  ArrowRight,
  User,
  Hash,
  Briefcase
} from 'lucide-react';
import { useAppStore } from '../../store';
import { BillItem, Invoice, InvoicePayment } from '../../types';
import { toast } from 'react-hot-toast';

interface InvoiceBuilderProps {
  onSave: (invoiceData: Omit<Invoice, 'id'>) => void;
  onCancel: () => void;
  initialData?: Invoice;
  preselectedQuotationId?: string; // If converting from a quotation directly
}

export default function InvoiceBuilder({ onSave, onCancel, initialData, preselectedQuotationId }: InvoiceBuilderProps) {

  const { clients, quotations, invoices } = useAppStore();

  // Selected state for importing from Quotation
  const [importQuoteId, setImportQuoteId] = useState(preselectedQuotationId || '');

  // Basic Invoice Information
  const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || '');
  
  // Format invoice number dynamically (INV-2026-### format)
  const getNextInvoiceNumber = () => {
    // Financial year 2026
    const prefix = 'INV-2026-';
    const targetInvoices = invoices.filter(inv => inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix));
    if (targetInvoices.length === 0) {
      return `${prefix}001`; 
    }
    
    // Find the highest sequence number
    let maxSeq = 0;
    targetInvoices.forEach(inv => {
      const parts = inv.invoiceNumber.split('-');
      const seqStr = parts[parts.length - 1];
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    });

    const nextSeq = maxSeq + 1;
    // Pad with leading zeros
    return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
  };

  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || getNextInvoiceNumber());
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(initialData?.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.notes || 'Thank you for your business!');
  const [status, setStatus] = useState<'Draft' | 'Sent' | 'Unpaid' | 'Overdue' | 'Paid' | 'Partial'>(
    initialData?.status || 'Draft'
  );

  // GST Specifications
  const [isGstApplied, setIsGstApplied] = useState(initialData?.isGstApplied ?? true);
  const [gstType, setGstType] = useState<'CGST_SGST' | 'IGST'>(initialData?.gstType || 'CGST_SGST');

  // Discount
  const [discount, setDiscount] = useState(initialData?.discount?.toString() || '0');

  // Items table
  const [items, setItems] = useState<BillItem[]>(initialData?.items || []);
  
  // Single Item Input fields
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemUnit, setItemUnit] = useState('Pcs');
  const [itemRate, setItemRate] = useState('');
  const [itemGstPercent, setItemGstPercent] = useState('18');
  const [itemHsn, setItemHsn] = useState('');

  // Initial payment details (Only for new invoices, payments are tracked via Payments array otherwise)
  const [initialPaidAmount, setInitialPaidAmount] = useState('0');
  const [initialPaymentMode, setInitialPaymentMode] = useState<'Cash' | 'Online' | 'Cheque'>('Cash');

// Define key
const STORAGE_KEY = 'billkaro_invoice_draft';

// Effect to load on mount if new invoice
useEffect(() => {
  if (!initialData) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (window.confirm('क्या आप अपनी पिछली अधूरी इनवॉइस को बहाल (restore) करना चाहते हैं?')) {
          setSelectedClientId(parsed.selectedClientId || '');
          setInvoiceNumber(parsed.invoiceNumber || getNextInvoiceNumber());
          setDate(parsed.date || '');
          setDueDate(parsed.dueDate || '');
          setNotes(parsed.notes || '');
          setStatus(parsed.status || 'Draft');
          setIsGstApplied(parsed.isGstApplied ?? true);
          setGstType(parsed.gstType || 'CGST_SGST');
          setDiscount(parsed.discount || '0');
          setItems(parsed.items || []);
          setInitialPaidAmount(parsed.initialPaidAmount || '0');
          setInitialPaymentMode(parsed.initialPaymentMode || 'Cash');
          toast.success('ड्राफ्ट बहाल कर दिया गया!');
        }
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
  }
}, [initialData]);

// Effect to save on change
useEffect(() => {
  if (!initialData) {
    const draft = {
      selectedClientId,
      invoiceNumber,
      date,
      dueDate,
      notes,
      status,
      isGstApplied,
      gstType,
      discount,
      items,
      initialPaidAmount,
      initialPaymentMode
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }
}, [selectedClientId, invoiceNumber, date, dueDate, notes, status, isGstApplied, gstType, discount, items, initialPaidAmount, initialPaymentMode, initialData]);

  // Handle Quotation Conversion populate
  useEffect(() => {
    if (importQuoteId) {
      const quote = quotations.find(q => q.id === importQuoteId);
      if (quote) {
        setSelectedClientId(quote.clientId);
        setItems(quote.items.map(item => ({
          ...item,
          hsn: item.hsn || '', // default empty HSN
        })));
        setDiscount(quote.discount.toString());
        setNotes(quote.notes || `Converted from Estimate #${quote.quoteNumber}`);
        setIsGstApplied(quote.items.some(i => i.gstPercent > 0));
        toast.success(`कोटेशन #${quote.quoteNumber} से डेटा आयात किया गया!`);
      }
    }
  }, [importQuoteId, quotations]);

  // Adjust status based on initial paid amount
  const triggerStatusSuggestion = (paid: number, total: number) => {
    if (paid >= total) return 'Paid';
    if (paid > 0) return 'Partial';
    return 'Unpaid';
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error('सामग्री / कार्य का विवरण भरें!');
      return;
    }
    const qtyVal = parseFloat(itemQty) || 0;
    const rateVal = parseFloat(itemRate) || 0;
    if (qtyVal <= 0) {
      toast.error('कृपया सही मात्रा भरें!');
      return;
    }
    if (rateVal <= 0) {
      toast.error('कृपया सही दर भरें!');
      return;
    }

    const newItem: BillItem = {
      name: itemName.trim(),
      quantity: qtyVal,
      unit: itemUnit,
      rate: rateVal,
      gstPercent: isGstApplied ? (parseInt(itemGstPercent) || 0) : 0,
      hsn: itemHsn.trim() || undefined
    };

    setItems([...items, newItem]);
    setItemName('');
    setItemQty('1');
    setItemRate('');
    setItemHsn('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Live Ledger Calculations
  const subtotal = items.reduce((sum, item) => sum + item.rate * item.quantity, 0);
  
  // Calculating individual GST breakdowns
  const gstBreakdowns = items.reduce((acc, item) => {
    const itemTotal = item.rate * item.quantity;
    const percent = isGstApplied ? item.gstPercent : 0;
    const gstAmt = (itemTotal * percent) / 100;
    if (percent > 0) {
      acc[percent] = (acc[percent] || 0) + gstAmt;
    }
    return acc;
  }, {} as Record<number, number>);

  const totalGst = (Object.values(gstBreakdowns) as number[]).reduce((sum, val) => sum + val, 0);
  const discountVal = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal + totalGst - discountVal);

  const initialPaidVal = parseFloat(initialPaidAmount) || 0;
  const balanceOutstanding = Math.max(0, grandTotal - (initialData?.paidAmount || initialPaidVal));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error('कृपया ग्राहक का चयन करें!');
      return;
    }
    if (items.length === 0) {
      toast.error('बिल तालिका में कम से कम एक आइटम आवश्यक है!');
      return;
    }

    // Determine target payments list
    let paymentsList: InvoicePayment[] = initialData?.payments || [];
    let cumulativePaid = initialData?.paidAmount || 0;

    if (!initialData && initialPaidVal > 0) {
      // Create primary payment receipt
      const firstPayment: InvoicePayment = {
        id: 'pay_' + Date.now().toString(),
        amount: initialPaidVal,
        date: date,
        mode: initialPaymentMode,
        receiptNumber: 'REC-2026-' + Math.floor(1000 + Math.random() * 9000),
        notes: 'Initial invoice collection'
      };
      paymentsList = [firstPayment];
      cumulativePaid = initialPaidVal;
    }

    // Formulate final status
    let finalStatus = status;
    if (cumulativePaid >= grandTotal && grandTotal > 0) {
      finalStatus = 'Paid';
    } else if (cumulativePaid > 0 && finalStatus === 'Draft') {
      finalStatus = 'Partial';
    } else if (cumulativePaid > 0 && finalStatus === 'Unpaid') {
      finalStatus = 'Partial';
    }

    const payload = {
      invoiceNumber,
      clientId: selectedClientId,
      date,
      dueDate,
      items,
      discount: discountVal,
      notes,
      isGstApplied,
      gstType: isGstApplied ? gstType : undefined,
      totalAmount: Math.round(grandTotal),
      paidAmount: Math.round(cumulativePaid),
      status: finalStatus,
      payments: paymentsList
    };

    localStorage.removeItem(STORAGE_KEY);
    onSave(payload);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
      
      {/* Top row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-gray-800/80 gap-3">
        <div>
          <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest font-mono">
            {initialData ? 'एडिट पक्का बिल / टैक्स इनवॉइस' : 'नया जीएसटी इनवॉइस / पक्का बिल बनाएँ'}
          </h3>
          <p className="text-[10px] text-gray-550 uppercase tracking-wider">Premium Indian GST Billing Module</p>
        </div>
        
        {/* Quick import panel for new invoices */}

        {!initialData && (
          <div className="flex items-center space-x-2 bg-gray-950 p-2 rounded-xl border border-gray-850">
            <span className="text-[10px] text-gray-400 uppercase font-mono font-bold pl-1">कोटेशन आयात करें:</span>
            <select
              value={importQuoteId}
              onChange={e => setImportQuoteId(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-[11px] text-amber-400 focus:outline-none"
            >
              <option value="">-- चुनें (Select Estimate) --</option>
              {quotations.filter(q => !q.isConverted).map(q => (
                <option key={q.id} value={q.id}>{q.quoteNumber} (₹{(q.items?.reduce((s, i) => s + (i.rate ?? 0), 0) ?? 0).toLocaleString('en-IN')})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Client & Invoice Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Client Selector */}
          <div className="md:col-span-1">
            <label className="text-[10px] text-gray-400 block mb-1.5 font-bold uppercase tracking-wider">
              ग्राहक का चयन करें (Client) *
            </label>
            <div className="relative">
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                required
                className="w-full bg-[#0B0F1A] border border-gray-850 hover:border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="">-- ग्राहक चुनें (Choose Client) --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone !== 'NA' ? c.phone : 'No Mobile'})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Invoice Number */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1.5 font-bold uppercase tracking-wider">
              इनवॉइस संख्या (Invoice No.)
            </label>
            <div className="relative">
              <input 
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                required
                placeholder="INV-2026-001"
                className="w-full bg-[#0B0F1A] border border-gray-855 hover:border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Issue Date */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1.5 font-bold uppercase tracking-wider">
              बिलिंग तिथि (Invoice Date)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-550" />
              <input 
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-[#0B0F1A] border border-gray-855 hover:border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1.5 font-bold uppercase tracking-wider">
              भुगतान अंतिम तिथि (Due Date)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-550" />
              <input 
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
                className="w-full bg-[#0B0F1A] border border-gray-855 hover:border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-secondary-white focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>
          </div>

        </div>

        {/* GST Control Switcher Panel */}
        <div className="bg-[#0B0F1A]/90 border border-gray-850 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <input 
              type="checkbox"
              id="gst_applied_cb"
              checked={isGstApplied}
              onChange={e => setIsGstApplied(e.target.checked)}
              className="h-4.5 w-4.5 rounded text-amber-500 bg-gray-950 border-gray-800 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="gst_applied_cb" className="text-xs font-black text-gray-200 cursor-pointer select-none">
              जीएसटी टैक्स लागू करें (Apply GST Taxes on items)
            </label>
          </div>

          {isGstApplied && (
            <div className="flex bg-gray-950 border border-gray-850/80 p-1 rounded-xl space-x-1.5">
              <button
                type="button"
                onClick={() => setGstType('CGST_SGST')}
                className={`py-1 px-3.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                  gstType === 'CGST_SGST' 
                    ? 'bg-amber-500 text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Intrastate (CGST + SGST - यूपी के भीतर)
              </button>
              <button
                type="button"
                onClick={() => setGstType('IGST')}
                className={`py-1 px-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  gstType === 'IGST' 
                    ? 'bg-amber-500 text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Interstate (IGST - अन्य राज्य)
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Custom Line Items Entry */}
        <div className="bg-[#0B0F1A]/80 border border-gray-850 rounded-2xl p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-850/60 pb-2">
            <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest font-mono">
              आइटम एवं सामग्री विवरण तालिका (Invoice Items & Rates)
            </h4>
            <span className="text-[10px] text-gray-500 font-mono">Total: {items.length} goods/services</span>
          </div>

          {/* Grid Panel for line item input wrapper */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            
            {/* Description */}
            <div className="sm:col-span-4">
              <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold tracking-wider">विवरण (Description) *</label>
              <input 
                type="text"
                placeholder="उदा. Iron Safety Grills"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* HSN Code Optional */}
            <div className="sm:col-span-2">
              <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold tracking-wider">HSN/SAC कोड</label>
              <input 
                type="text"
                placeholder="उदा. 7308"
                value={itemHsn}
                onChange={e => setItemHsn(e.target.value)}
                className="w-full bg-gray-950 border border-gray-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Quantity */}
            <div className="sm:col-span-1">
              <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold tracking-wider">मात्रा (Qty)</label>
              <input 
                type="number"
                placeholder="1"
                value={itemQty}
                onChange={e => setItemQty(e.target.value)}
                className="w-full bg-gray-950 border border-gray-850 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500 text-center font-mono"
              />
            </div>

            {/* Unit Code */}
            <div className="sm:col-span-1.5">
              <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold tracking-wider">इकाई (Unit)</label>
              <select
                value={itemUnit}
                onChange={e => setItemUnit(e.target.value)}
                className="w-full bg-gray-950 border border-gray-850 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
              >
                <option value="Pcs">Pcs (नग)</option>
                <option value="Kg">Kg (किलो)</option>
                <option value="Feet">Feet (फीट)</option>
                <option value="SqFt">SqFt (वर्गफीट)</option>
                <option value="Job">Job (कार्य)</option>
                <option value="Day">Day (दिन)</option>
                <option value="LumpSum">LumpSum</option>
              </select>
            </div>

            {/* Rate per item */}
            <div className="sm:col-span-1.5">
              <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold tracking-wider">दर (Rate ₹)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-gray-500 text-xs font-bold">₹</span>
                <input 
                  type="number"
                  placeholder="0"
                  value={itemRate}
                  onChange={e => setItemRate(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-5.5 pr-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* GST Rate Trigger */}
            {isGstApplied && (
              <div className="sm:col-span-1.5">
                <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold tracking-wider">GST दर (%)</label>
                <select
                  value={itemGstPercent}
                  onChange={e => setItemGstPercent(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value="0">0% GST</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST</option>
                  <option value="28">28% GST</option>
                </select>
              </div>
            )}

            {/* Add Action button */}
            <div className="sm:col-span-0.5 self-end">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black p-2 rounded-xl transition flex items-center justify-center cursor-pointer"
                title="सामग्री जोड़ें"
              >
                <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            </div>

          </div>

          {/* Render Table Listings */}
          {items.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-850 rounded-2xl text-gray-500 text-[11px] font-sans">
              तालिका खाली है। कृपया ऊपर आइटम विवरण, दर, और टैक्स प्रतिशत चुनकर '+' पर टैप करें।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead>
                  <tr className="border-b border-gray-850/40 text-gray-500 text-[10px] uppercase font-mono">
                    <th className="py-2.5 pl-2">सं (SNo)</th>
                    <th className="py-2.5">सामग्री विवरण / HSN</th>
                    <th className="py-2.5 text-center">मात्रा (Qty)</th>
                    <th className="py-2.5 text-right font-mono">दर (Rate)</th>
                    {isGstApplied && <th className="py-2.5 text-center font-mono">टैक्स (GST)</th>}
                    <th className="py-2.5 text-right pr-3 font-mono">कुल योग (Amount)</th>
                    <th className="py-2.5 text-center">हटाएँ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-855/35">
                  {items.map((item, idx) => {
                    const baseAmt = item.rate * item.quantity;
                    const taxVal = isGstApplied ? (baseAmt * item.gstPercent / 100) : 0;
                    const netAmt = baseAmt + taxVal;

                    return (
                      <tr key={idx} className="hover:bg-gray-900/30 transition-colors">
                        <td className="py-2.5 pl-2 font-mono text-gray-550 text-[10px]">{idx + 1}</td>
                        <td className="py-2.5">
                          <span className="font-extrabold text-white text-[12px] block">{item.name}</span>
                          {item.hsn && (
                            <span className="text-[10px] text-amber-500 font-mono">HSN: {item.hsn}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center font-mono text-gray-350">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2.5 text-right font-mono text-gray-350">
                          ₹{(item.rate ?? 0).toLocaleString('en-IN')}
                        </td>
                        {isGstApplied && (
                          <td className="py-2.5 text-center font-mono">
                            <span className="bg-gray-950 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-850 text-gray-400">
                              {item.gstPercent}% (₹{(taxVal ?? 0).toLocaleString('en-IN')})
                            </span>
                          </td>
                        )}
                        <td className="py-2.5 text-right font-black font-mono text-gray-100 pr-3">
                          ₹{(netAmt ?? 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 text-center">
                          <button 
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 hover:bg-red-500/10 text-rose-500 rounded transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dynamic Payment & Invoice Config Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Payment tracking initial input (only shown when creating fresh) */}
          {!initialData ? (
            <div className="bg-[#0B0F1A]/80 border border-gray-850 rounded-2xl p-4 space-y-3">
              <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest font-mono border-b border-gray-850/60 pb-2">
                पेमेंट प्रविष्टि (Record Initial Payment)
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-gray-450 block mb-1 font-bold uppercase tracking-wider">
                    भुगतान राशि (Paid Amount ₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-550 text-xs font-bold">₹</span>
                    <input 
                      type="number"
                      placeholder="उदा. 10000"
                      value={initialPaidAmount}
                      onChange={e => setInitialPaidAmount(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-6 pr-3 py-1.8 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-gray-450 block mb-1 font-bold uppercase tracking-wider">
                    पेमेंट तरीका (Payment Mode)
                  </label>
                  <select
                    value={initialPaymentMode}
                    onChange={e => setInitialPaymentMode(e.target.value as any)}
                    className="w-full bg-gray-950 border border-gray-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Cash">Cash (नकद)</option>
                    <option value="Online">Online (यूपीआई)</option>
                    <option value="Cheque">Cheque (चेक)</option>
                  </select>
                </div>
              </div>
              
              <p className="text-[9.5px] text-gray-550 italic leading-snug">
                * यदि पेंडिंग पेमेंट बाद में प्राप्त होती है, तो आप 'पेमेंट एंट्री' पैनल से जोड़ सकते हैं।
              </p>
            </div>
          ) : (
            <div className="bg-[#0B0F1A]/80 border border-gray-850 p-4 rounded-2xl space-y-2">
              <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest font-mono border-b border-gray-850/60 pb-2">
                भुगतान इतिहास (Payment Status History)
              </h4>
              <div className="text-xs text-gray-400 space-y-1 pt-1 font-sans">
                <div>कुल देय: <span className="font-bold text-white">₹{(initialData?.totalAmount ?? 0).toLocaleString('en-IN')}</span></div>
                <div>जमा राशि: <span className="font-bold text-emerald-400">₹{(initialData?.paidAmount ?? 0).toLocaleString('en-IN')}</span></div>
                <div>बकाया राशि: <span className="font-bold text-amber-400">₹{((initialData?.totalAmount ?? 0) - (initialData?.paidAmount ?? 0)).toLocaleString('en-IN')}</span></div>
                <div className="pt-1.5 text-[10px] text-amber-500 uppercase tracking-widest font-bold">
                  * पेमेंट एडिट करने के लिए बिल सूची पर 'जमा करें (Payment)' बटन का प्रयोग करें।
                </div>
              </div>
            </div>
          )}

          {/* Discount & Invoice Status Draft/Sent/Overdue choice */}
          <div className="bg-[#0B0F1A]/80 border border-gray-850 rounded-2xl p-4 space-y-4">
            <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest font-mono border-b border-gray-850/60 pb-2">
              छूट एवं बिल स्थिति (Taxes discount & state)
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-gray-450 block mb-1 font-bold uppercase tracking-wider">
                  डिस्काउंट / छूट (Discount ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-550 text-xs font-bold">₹</span>
                  <input 
                    type="number"
                    placeholder="0"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-6 pr-3 py-1.8 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] text-gray-450 block mb-1 font-bold uppercase tracking-wider">
                  बिल स्थिति (Invoice State)
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Draft">Draft (कच्चा ड्राफ्ट)</option>
                  <option value="Sent">Sent (ग्राहक को भेजा गया)</option>
                  <option value="Unpaid">Unpaid (भुगतान पेंडिंग)</option>
                  <option value="Overdue">Overdue (समय सीमा समाप्त)</option>
                  <option value="Paid">Paid (पूर्ण भुगतान)</option>
                  <option value="Partial">Partial (आंशिक भुगतान)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Notes/Terms block */}
        <div className="bg-[#0B0F1A]/80 border border-gray-850 p-4 rounded-2xl space-y-2">
          <label className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">
            टिप्पणी एवं शर्तें (Payment Terms & Remarks)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="उदा. बिल भुगतान की अवधि 15 दिनों की है। बैंक ब्याज 2% अतिरिक्त चार्ज किया जाएगा यदि विलंब हुआ..."
            className="w-full bg-gray-950 border border-gray-850 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
          />
        </div>

        {/* Live Calculation Sheet summary */}
        <div className="bg-[#1C160C] border border-amber-500/20 p-5 rounded-3xl space-y-2.5">
          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest font-mono flex items-center justify-between">
            <span>लेज़र बिलिंग कैलकुलेटर (Indian GST Compliant Tax Summary)</span>
            <span className="text-gray-500 italic lowercase font-normal font-sans">rates auto-verified</span>
          </h4>
          
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs font-sans mt-2">
            
            {/* Subtotal */}
            <div className="p-3 bg-gray-950/40 rounded-xl border border-gray-850">
              <span className="text-gray-500 text-[10px] block uppercase font-mono">कुल माल/सेवा शुल्क (Subtotal)</span>
              <span className="text-sm font-extrabold text-white mt-1 block">
                ₹{(subtotal ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Total TAX GST */}
            <div className="p-3 bg-gray-950/40 rounded-xl border border-gray-850">
              <span className="text-gray-500 text-[10px] block uppercase font-mono">
                {isGstApplied ? `${gstType === 'CGST_SGST' ? 'CGST+SGST (टैक्स)' : 'IGST (टैक्स)'}` : 'जीएसटी टैक्स'}
              </span>
              <span className="text-sm font-extrabold text-amber-400 mt-1 block">
                ₹{(totalGst ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Discount */}
            <div className="p-3 bg-gray-950/40 rounded-xl border border-gray-850">
              <span className="text-gray-500 text-[10px] block uppercase font-mono">छूट (Discount)</span>
              <span className="text-sm font-extrabold text-rose-400 mt-1 block">
                - ₹{(discountVal ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Paid Amount */}
            <div className="p-3 bg-gray-950/40 rounded-xl border border-gray-850">
              <span className="text-gray-500 text-[10px] block uppercase font-mono">सुरक्षित जमा (Paid Amount)</span>
              <span className="text-sm font-extrabold text-emerald-400 mt-1 block">
                ₹{((initialData?.paidAmount || initialPaidVal) ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Balance Due */}
            <div className="p-3 bg-[#241E15] rounded-xl border border-amber-500/30 col-span-2 lg:col-span-1">
              <span className="text-amber-500 text-[10.5px] block uppercase font-mono font-black">बकाया बैलेंस (Due Balance)</span>
              <span className="text-[15px] font-black text-amber-400 mt-0.5 block font-mono">
                ₹{(balanceOutstanding ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

          </div>
        </div>

        {/* Action button triggers */}
        <div className="pt-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-950 hover:bg-gray-850 border border-gray-850 text-gray-400 font-extrabold py-3.5 rounded-2xl text-xs uppercase cursor-pointer transition text-center"
          >
            वापस जाएँ (Cancel)
          </button>
          
          <button
            type="submit"
            className="flex-2 bg-amber-500 hover:bg-amber-600 text-black font-black py-3.5 rounded-2xl text-xs uppercase cursor-pointer transition flex items-center justify-center space-x-2 shadow-md"
          >
            <CheckCircle className="h-5 w-5 stroke-[2.5]" />
            <span>इनवॉइस सहेजें और प्रीव्यू सहेजें (Save & Preview)</span>
          </button>
        </div>

      </form>
    </div>
  );
}
