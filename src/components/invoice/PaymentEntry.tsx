import React, { useState, useRef } from 'react';
import { 
  X, 
  Coins, 
  Plus, 
  Calendar, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  Printer, 
  Download, 
  Share2, 
  ChevronRight, 
  DollarSign, 
  User, 
  MapPin, 
  Phone 
} from 'lucide-react';
import { useAppStore } from '../../store';
import { Invoice, InvoicePayment } from '../../types';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateInvoicePDF, generateReceiptPDF } from '../../lib/pdf';
import { supabase } from '../../lib/supabase';


interface PaymentEntryProps {
  invoice: Invoice;
  onClose: () => void;
}

export default function PaymentEntry({ invoice, onClose }: PaymentEntryProps) {

  const { profile, clients, updateInvoice, updateClient, addTransaction } = useAppStore();
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  // Client matching
  const clientObj = clients.find(c => c.id === invoice.clientId);
  const clientName = clientObj?.name || 'Client';

  // Calculations
  const pendingAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);

  // Form states to record a new payment
  const [payAmount, setPayAmount] = useState(pendingAmount.toString());
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMode, setPayMode] = useState<'Cash' | 'Online' | 'Cheque'>('Cash');
  const [payNotes, setPayNotes] = useState('');

  // Selected single receipt for display modal
  const [selectedReceipt, setSelectedReceipt] = useState<InvoicePayment | null>(null);

  // Handle Payment entry submission
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(payAmount) || 0;
    if (amountVal <= 0) {
      toast.error('Please enter a valid payment amount!');
      return;
    }
    if (amountVal > pendingAmount) {
      toast.error(`Payment cannot exceed the pending balance of ₹${pendingAmount}!`);
      return;
    }

    try {
      // Dynamic receipt number format
      const recNumber = 'REC-2026-' + Math.floor(10000 + Math.random() * 90000);
      
      const newPayment: InvoicePayment = {
        id: 'pay_' + Date.now().toString(),
        amount: amountVal,
        date: payDate,
        mode: payMode,
        receiptNumber: recNumber,
        notes: payNotes.trim() || undefined
      };

      const updatedPayments = [...(invoice.payments || []), newPayment];
      const updatedPaidAmount = invoice.paidAmount + amountVal;
      
      // Determine next status
      let nextStatus = invoice.status;
      if (updatedPaidAmount >= invoice.totalAmount) {
        nextStatus = 'Paid';
      } else if (updatedPaidAmount > 0) {
        nextStatus = 'Partial';
      }

      // 1. Update invoice in store
      updateInvoice(invoice.id, {
        payments: updatedPayments,
        paidAmount: updatedPaidAmount,
        status: nextStatus as any
      });

      // 2. Adjust Client balance (totalDue - amount, totalPaid + amount)
      if (clientObj) {
        updateClient(clientObj.id, {
          totalDue: Math.max(0, clientObj.totalDue - amountVal),
          totalPaid: clientObj.totalPaid + amountVal
        });
      }

      // 3. Document in General Income Transaction Ledger
      addTransaction({
        type: 'Income',
        category: 'Client Payment',
        amount: amountVal,
        date: payDate,
        notes: `Kaat ke jama (Payment) for Invoice #${invoice.invoiceNumber}. Receipt No: ${recNumber} by ${clientName}`
      });

      // Try to sync to Supabase if logged in
      const syncPaymentToSupabase = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // A. Update invoice row
          await supabase
            .from('invoices')
            .update({
              payments: updatedPayments,
              status: nextStatus
            })
            .eq('id', invoice.id);

          // B. Add expense transaction (as incoming income)
          const { data: businesses } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id);
          
          if (businesses && businesses.length > 0) {
            const bId = businesses[0].id;
            await supabase
              .from('expenses')
              .insert({
                business_id: bId,
                category: 'Client Payment',
                amount: amountVal,
                date: payDate,
                note: `Kaat ke jama (Payment) for Invoice #${invoice.invoiceNumber}. Receipt No: ${recNumber} by ${clientName}`,
                type: 'Income'
              });
          }
        }
      };

      syncPaymentToSupabase().catch((err) => console.warn('Supabase offline or background sync failed', err));

      toast.success(`भुगतान ₹${(amountVal ?? 0).toLocaleString('en-IN')} सफलतापूर्वक दर्ज हुआ!`);
      
      // Set to view receipt instantly
      setSelectedReceipt(newPayment);

      // Reset form
      setPayAmount(Math.max(0, pendingAmount - amountVal).toString());
      setPayNotes('');
    } catch (err: any) {
      toast.error('Error recording payment. Please try again.');
      console.error(err);
    }
  };

  // Convert number to words roughly (English/Hindi display)
  const formatAmountInWords = (num: number) => {
    return `${(num ?? 0).toLocaleString('en-IN')} Rupees Only`;
  };

  // PDF Generator for Receipt
  const handleDownloadReceiptPDF = async (receipt: InvoicePayment) => {
    const loader = toast.loading('रसीद डाउनलोड की जा रही है...');
    try {
      const doc = generateReceiptPDF({
        payment: receipt,
        invoice,
        client: clientObj,
        profile
      });

      doc.save(`RECEIPT_${receipt.receiptNumber}_${clientName.replace(/\s+/g, '_')}.pdf`);
      
      toast.dismiss(loader);
      toast.success('Payment receipt downloaded!');
    } catch (e: any) {
      toast.dismiss(loader);
      console.error('Receipt PDF Error:', e);
      // Fallback to html2canvas if programmatic fails for some reason (unlikely)
      toast.error('Problem downloading PDF! Please use Print or take a screenshot.');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      
      {/* Outer Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row max-h-[92vh] overflow-hidden my-4">
        
        {/* Left Side: Form to add payments and History */}
        <div className="flex-1 p-5 sm:p-7 overflow-y-auto space-y-6 border-b md:border-b-0 md:border-r border-gray-800">
          
          {/* Header block */}
          <div className="flex justify-between items-center pb-2 border-b border-gray-800/60">
            <div>
              <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest font-mono">
                भुगतान प्रविष्टि (PAYMENT LEDGER)
              </span>
              <h3 className="text-base font-black text-white">
                इनवॉइस #{invoice.invoiceNumber}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-full transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Balance widget */}
          <div className="grid grid-cols-3 gap-2.5 bg-gray-950 p-4 rounded-2xl border border-gray-850 text-center">
            <div>
              <span className="text-[9px] text-gray-500 block uppercase font-mono">कुल बिल राशि</span>
              <span className="text-[13px] font-black text-white">₹{(invoice.totalAmount ?? 0).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-[9px] text-gray-500 block uppercase font-mono">प्राप्त जमा</span>
              <span className="text-[13px] font-black text-emerald-400">₹{(invoice.paidAmount ?? 0).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-[9px] text-amber-500 block uppercase font-mono font-bold">शेष बकाया</span>
              <span className="text-[13px] font-black text-amber-400">₹{(pendingAmount ?? 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Form (Only show if pending amount is positive) */}
          {pendingAmount > 0 ? (
            <form onSubmit={handleSubmitPayment} className="space-y-4 bg-[#0B0F1A]/80 border border-gray-850/60 p-4 rounded-2xl">
              <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest font-mono">
                नया भुगतान जोड़ें (Add Cash/UPI)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Amount to collect */}
                <div>
                  <label className="text-[9px] text-gray-450 block mb-1 font-bold uppercase tracking-wider">भुगतान राशि (Amount ₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-550 text-xs font-bold">₹</span>
                    <input 
                      type="number"
                      max={pendingAmount}
                      min={1}
                      required
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-6 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-[9px] text-gray-455 block mb-1 font-bold uppercase tracking-wider">तारीख (Payment Date) *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-550" />
                    <input 
                      type="date"
                      required
                      value={payDate}
                      onChange={e => setPayDate(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Pay Mode dropdown */}
                <div>
                  <label className="text-[9px] text-gray-450 block mb-1 font-bold uppercase tracking-wider">भुगतान माध्यम (Mode)</label>
                  <select
                    value={payMode}
                    onChange={e => setPayMode(e.target.value as any)}
                    className="w-full bg-gray-950 border border-gray-850 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Cash">Cash (नकद भुगतान)</option>
                    <option value="Online">Online (यूपीआई/बैंक ट्रांसफर)</option>
                    <option value="Cheque">Cheque (बैंक चेक)</option>
                  </select>
                </div>

                {/* Pay Notes */}
                <div>
                  <label className="text-[9px] text-gray-400 block mb-1 font-bold uppercase tracking-wider">टिप्पणी (Notes/Memo)</label>
                  <input 
                    type="text"
                    placeholder="उदा. बकाया राशि का आधा भुगतान"
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-98 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>भुगतान जमा करें (Record Payment)</span>
              </button>

            </form>
          ) : (
            <div className="bg-emerald-555/5 border border-emerald-500/20 p-4 rounded-2xl flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <div className="text-xs">
                <strong className="block font-black">खाता पूर्ण भुगतान हो चुका है!</strong>
                इस इनवॉइस पर कोई बकाया देय राशि शेष नहीं है।
              </div>
            </div>
          )}

          {/* Payments List timeline */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest font-mono">
              प्राप्त भुगतानों का इतिहास (Payment History Timeline)
            </h4>

            {!invoice.payments || invoice.payments.length === 0 ? (
              <div className="p-6 border border-dashed border-gray-850 rounded-2xl text-center text-gray-550 text-[10.5px]">
                इस बिल पर कोई भुगतान इतिहास दर्ज नहीं है।
              </div>
            ) : (
              <div className="space-y-2">
                {invoice.payments.map((p) => (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedReceipt(p)}
                    className="bg-gray-950 border border-gray-850 hover:border-amber-500/30 p-3 rounded-xl flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                        <Coins className="h-4 w-4" />
                      </div>
                      <div className="text-xs">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-white">₹{(p.amount ?? 0).toLocaleString('en-IN')}</span>
                          <span className="bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded text-[9px] font-mono text-indigo-400 uppercase">{p.mode}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                          Receipt: #{p.receiptNumber} • {p.date}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-amber-500 font-bold flex items-center space-x-0.5 group">
                      <span>रसीद (Slip)</span>
                      <ChevronRight className="h-3 w-3 transform group-hover:translate-x-0.5 transition" />
                    </span>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Interactive Receipt Slip display */}
        <div className="flex-1 bg-gray-950 p-5 sm:p-7 flex flex-col justify-between overflow-y-auto">
          
          {selectedReceipt ? (
            <div className="space-y-4 h-full flex flex-col justify-between">
              
              {/* Receipt controller banner bar */}
              <div className="flex items-center justify-between bg-gray-900/50 p-2.5 rounded-xl border border-gray-800/60 text-xs">
                <span className="font-bold text-gray-300">रसीद सं: {selectedReceipt.receiptNumber}</span>
                <div className="flex items-center space-x-1.5">
                  
                  {/* Download Receipt PDF */}
                  <button 
                    onClick={() => handleDownloadReceiptPDF(selectedReceipt)}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition cursor-pointer shadow-lg shadow-indigo-600/10"
                    title="PDF"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>

                  {/* Print Receipt */}
                  <button 
                    onClick={handlePrintReceipt}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition cursor-pointer shadow-lg shadow-indigo-600/10"
                    title="Print"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Graphical Printable Paper receipt slip card starting */}
              <div className="flex-1 overflow-y-auto py-2">
                <div 
                  ref={receiptPrintRef}
                  id="payment-receipt-slip-paper"
                  className="bg-white text-gray-900 border border-gray-200 rounded-2xl p-5 shadow-inner max-w-sm mx-auto relative font-sans leading-relaxed text-xs [color-scheme:light]"
                >
                  {/* Watermark gradient line top */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 rounded-t-2xl" />

                  {/* Corporate small header */}
                  <div className="text-center pb-3 border-b border-gray-150 space-y-1">
                    <h5 className="font-black text-gray-950 text-sm uppercase tracking-tight leading-none">{profile.businessName}</h5>
                    <p className="text-[9px] text-gray-550 uppercase leading-none">{profile.ownerName ? `Proprieter: ${profile.ownerName}` : 'Engineering Works Aligarh'}</p>
                    <p className="text-[8px] text-gray-500 font-mono leading-none">{profile.address}</p>
                    {profile.phone && <p className="text-[8.5px] text-gray-500 leading-none">Ph: +91 {profile.phone}</p>}
                  </div>

                  {/* Receipt description banner */}
                  <div className="my-3 text-center">
                    <span className="bg-emerald-50 border border-emerald-500/20 text-emerald-800 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest font-mono">
                      भुगतान रसीद / RECEIPT
                    </span>
                  </div>

                  {/* Detail listing grids */}
                  <div className="space-y-2 text-[10.5px] pb-4 border-b border-gray-150/80">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-sans">रसीद संख्या (Receipt No):</span>
                      <strong className="text-gray-900 font-mono">#{selectedReceipt.receiptNumber}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">दिनांक (Date):</span>
                      <strong className="text-gray-900 font-mono">{selectedReceipt.date}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">इनवॉइस संदर्भ (Invoice Ref):</span>
                      <strong className="text-gray-900 font-mono">#{invoice.invoiceNumber}</strong>
                    </div>

                    <div className="flex justify-between border-t border-gray-100 pt-1.5">
                      <span className="text-gray-500">प्राप्तकर्ता (Received From):</span>
                      <strong className="text-gray-950 font-sans text-[11.5px]">{clientName}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">भुगतान माध्यम (Paid Mode):</span>
                      <strong className="text-gray-900 font-mono uppercase bg-gray-100 px-1.5 py-0.2 rounded text-[9.5px] border border-gray-150">{selectedReceipt.mode}</strong>
                    </div>
                  </div>

                  {/* Cash collected central callout block */}
                  <div className="my-4 bg-emerald-50/50 border border-emerald-500/10 rounded-xl p-3.5 text-center">
                    <span className="text-[9px] text-emerald-800 block uppercase font-mono tracking-wider font-extrabold">प्राप्त भुगतान (Amount Paid)</span>
                    <span className="text-xl font-black text-emerald-700 block font-mono mt-0.5">₹{(selectedReceipt.amount ?? 0).toLocaleString('en-IN')}</span>
                    <span className="text-[9px] text-gray-550 font-sans mt-1 block italic">{formatAmountInWords(selectedReceipt.amount)}</span>
                  </div>

                  {/* Outstanding tracker info footer */}
                  <div className="space-y-1.5 text-[9.5px] text-gray-650 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono">
                    <div className="flex justify-between">
                      <span>कुल इनवॉइस योग:</span>
                      <span>₹{(invoice.totalAmount ?? 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200/40 pt-1 font-bold text-gray-900">
                      <span>बकाया शेष (Outstanding):</span>
                      <span className="text-amber-800">₹{((invoice.totalAmount ?? 0) - ((selectedReceipt.amount ?? 0) + (invoice.payments?.filter(p => p.id !== selectedReceipt.id).reduce((s, p) => s + (p.amount ?? 0), 0) || 0))).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Signature seals footer */}
                  <div className="mt-6 flex justify-between items-end">
                    <div className="text-[7.5px] text-gray-400 font-mono">
                      * System generated receipt *<br />
                      Valid subject to realization.
                    </div>
                    <div className="text-right border-t border-gray-800 pt-1 w-24">
                      <span className="text-[8px] text-gray-500 font-bold block leading-none">अधिकृत</span>
                      <span className="text-[6.5px] text-gray-400 block font-mono mt-0.5">Seal/Sign</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Close Button back triggers */}
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-full bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-600/20 text-indigo-400 hover:text-white py-2.5 rounded-xl text-[10.5px] uppercase font-black tracking-widest transition cursor-pointer"
              >
                रसीद विवरण बंद करें
              </button>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10">
              <Coins className="h-10 w-10 text-amber-500 animate-bounce" />
              <h5 className="text-xs font-black text-amber-500 uppercase tracking-widest font-mono">रसीद डेस्क (Receipt Desk)</h5>
              <p className="text-[10.5px] text-gray-600 max-w-xs leading-relaxed">
                बाईं ओर की भुगतान तालिका इतिहास से किसी भी भुगतान एंट्री रसीद पर क्लिक करके, उस विशेष जमा की रसीद रसीदपर्ची (Receipt Slip) देखें, प्रिंट करें और डाउनलोड करें।
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
