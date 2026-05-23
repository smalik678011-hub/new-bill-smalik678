import React, { useState } from 'react';
import useAppStore from '../store';
import { BillItem } from '../types';
import { 

  FileText, 
  Plus, 
  X, 
  Trash2, 
  TrendingUp, 
  Check, 
  Printer, 
  DollarSign, 
  Send, 
  Award, 
  CheckCircle,
  Building,
  CreditCard
} from 'lucide-react';

export default function InvoiceLedger() {

  const { 
    clients, 
    invoices, 
    addInvoice, 
    deleteInvoice, 
    recordPayment, 
    subscription, 
    profile 
  } = useAppStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  // Quick payment register dialog
  const [showPayBox, setShowPayBox] = useState(false);
  const [payAmount, setPayAmount] = useState('');

  // Form states
  const [clientId, setClientId] = useState('');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('Bahut dhanyawad hume mauka dene ke liye!');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15*24*60*60*1000).toISOString().split('T')[0]); // 15 days later
  const [isGstApplied, setIsGstApplied] = useState(profile.isRegisteredGST);
  const [paidAmount, setPaidAmount] = useState('0');

  // Items build state
  const [items, setItems] = useState<BillItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemRate, setItemRate] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemUnit, setItemUnit] = useState('Pcs');
  const [itemGstPercent, setItemGstPercent] = useState('18');

  // Helpers
  const handleAddItem = () => {
    if (!itemName.trim() || !itemRate) return;
    setItems([
      ...items,
      {
        name: itemName,
        quantity: parseFloat(itemQty) || 1,
        unit: itemUnit,
        rate: parseFloat(itemRate) || 0,
        gstPercent: isGstApplied ? parseFloat(itemGstPercent) : 0
      }
    ]);
    setItemName('');
    setItemQty('1');
    setItemRate('');
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const calculateSubtotal = (itemsList: BillItem[]) => {
    return itemsList.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  };

  const calculateTax = (itemsList: BillItem[]) => {
    if (!isGstApplied) return 0;
    return itemsList.reduce((sum, item) => {
      const lineCost = item.rate * item.quantity;
      return sum + (lineCost * item.gstPercent / 100);
    }, 0);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert("Hinglish: Pehle Grahak Select karein!");
      return;
    }
    if (items.length === 0) {
      alert("Hinglish: Bill me kam se kam ek item jodein!");
      return;
    }

    const sub = calculateSubtotal(items);
    const tax = calculateTax(items);
    const discVal = parseFloat(discount) || 0;
    const finalAmount = Math.max(0, sub + tax - discVal);
    const cashReceived = parseFloat(paidAmount) || 0;

    if (cashReceived > finalAmount) {
      alert("Hinglish: Received cash total amount se jyada nahi ho sakta!");
      return;
    }

    addInvoice({
      invoiceNumber: 'INV-' + (invoices.length + 101).toString(),
      clientId,
      date: new Date().toISOString().split('T')[0],
      dueDate,
      items,
      discount: discVal,
      notes,
      isGstApplied,
      totalAmount: Math.round(finalAmount),
      paidAmount: cashReceived
    });

    // Reset fields
    setClientId('');
    setItems([]);
    setDiscount('0');
    setPaidAmount('0');
    setNotes('Bahut dhanyawad hume mauka dene ke liye!');
    setShowAddForm(false);
    alert("Pakka Bill (Invoice) successfully record ho gaya hai!");
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;

    recordPayment(selectedInvoice.id, amt);

    // Refresh modal info
    const remainingDue = selectedInvoice.totalAmount - selectedInvoice.paidAmount - amt;
    setSelectedInvoice((prev: any) => ({
      ...prev,
      paidAmount: prev.paidAmount + amt,
      status: remainingDue <= 0 ? 'Paid' : 'Partial'
    }));

    setPayAmount('');
    setShowPayBox(false);
    alert("Payment jama ke entry ho gayi!");
  };

  return (
    <div className="space-y-4">
      {/* Visual Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-bold text-gray-100">पक्का बिल (Invoicing & Payment Register)</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-1.5 px-3 rounded text-xs flex items-center space-x-1 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>GST / Non-GST Bill Banao</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSaveInvoice} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center pb-2 border-b border-gray-800">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">नया बिल तैयार करें (Create Bill)</h3>
            <button type="button" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4 text-gray-400 hover:text-white" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">ग्राहक चुनें (Select Client) *</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                required
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Grahak Select Karein --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Payment Due Date</label>
              <input 
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#0B0F1A] p-2.5 rounded">
            <div>
              <span className="text-[11px] font-bold text-gray-100 block">क्या इस बिल पर GST लगाना है?</span>
              <span className="text-[9px] text-gray-400">CGST/SGST automatic calculate ke liye block</span>
            </div>
            <input 
              type="checkbox"
              checked={isGstApplied}
              onChange={e => {
                setIsGstApplied(e.target.checked);
                // Also update item calculation instantly
              }}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Core Item Adder Zone */}
          <div className="bg-[#161B29] p-4 rounded-2xl border border-gray-800 space-y-3">
            <h4 className="text-[10px] font-bold text-amber-500 uppercase">सामग्री / मजदूरी खर्च (Add Material/Labour Line)</h4>

            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Item or Work Description (e.g. Iron Beam raw, Lintel layout)"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />

              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                  <input 
                    type="number" 
                    placeholder="Rate (₹)"
                    value={itemRate}
                    onChange={e => setItemRate(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <input 
                    type="number" 
                    placeholder="Qty"
                    value={itemQty}
                    onChange={e => setItemQty(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <select
                    value={itemUnit}
                    onChange={e => setItemUnit(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 font-mono rounded p-2 text-xs text-white text-center"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Ft">Ft</option>
                    <option value="Job">Job</option>
                    <option value="LumpSum">Job</option>
                  </select>
                </div>
              </div>

              {isGstApplied && (
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-gray-400">GST Rate split:</span>
                  <select
                    value={itemGstPercent}
                    onChange={e => setItemGstPercent(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded p-1 text-[10px] text-white"
                  >
                    <option value="5">5% (CGST 2.5%, SGST 2.5%)</option>
                    <option value="12">12%</option>
                    <option value="18">18% Standard GST</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              )}

              <button 
                type="button" 
                onClick={handleAddItem}
                className="w-full bg-amber-500/10 hover:bg-amber-500 hover:text-black py-1.5 rounded-lg border border-amber-500/30 text-amber-500 font-bold text-[11px] transition"
              >
                + Add Item inside Bill
              </button>
            </div>

            {/* Render items inside draft bill */}
            {items.length > 0 && (
              <div className="border-t border-gray-800 pt-2 mt-2 space-y-1 max-h-[140px] overflow-y-auto">
                <span className="text-[9px] text-gray-500 uppercase block font-bold">Billing Items draft:</span>
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-gray-900 p-2 rounded-xl">
                    <div>
                      <span className="text-white block font-medium">{it.name}</span>
                      <span className="text-gray-400 text-[10px]">{it.quantity} {it.unit} @ ₹{it.rate} {isGstApplied ? `(${it.gstPercent}% GST)` : ''}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-gray-200">₹{it.rate * it.quantity}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">छूट डिस्काउंट (Discount ₹)</label>
              <input 
                type="number" 
                placeholder="₹ 0"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">आज ही प्राप्त रुपये (Cash Received today ₹)</label>
              <input 
                type="number" 
                placeholder="₹ 0"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-[#10B981] font-bold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">बिल रिमार्क्स / बैंक डिटेल्स (Invoice term text)</label>
            <input 
              type="text" 
              placeholder="e.g. Thank you for doing business with us! Settle via UPI"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2 px-4 rounded text-xs transition uppercase"
          >
            ✓ पक्का बिल जारी करें (Issue Invoice)
          </button>
        </form>
      )}

      {/* Invoice Filter List */}
      <div className="space-y-2">
        {invoices.map((inv) => {
          const client = clients.find(c => c.id === inv.clientId);
          
          let cardColor = 'border-red-500/20';
          let statusText = 'Unpaid (रुपये बाकी)';
          let statusColor = 'text-red-400 bg-red-400/10 border-red-500/20';

          if (inv.status === 'Paid') {
            cardColor = 'border-emerald-500/20';
            statusText = 'Paid (पूरा हिसाब)';
            statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          } else if (inv.status === 'Partial') {
            cardColor = 'border-amber-500/20';
            statusText = `Partial (बाकी: ₹${inv.totalAmount - inv.paidAmount})`;
            statusColor = 'text-amber-500 bg-amber-500/10 border-[#F59E0B]/20';
          }

          return (
            <div 
              key={inv.id}
              onClick={() => setSelectedInvoice({ ...inv, clientName: client?.name || 'Unknown Client', clientPhone: client?.phone })}
              className={`bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between`}
            >
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-mono text-gray-400 font-bold">{inv.invoiceNumber}</span>
                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded border ${statusColor} font-black uppercase font-mono`}>
                    {statusText}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gray-100">{client?.name || 'Client name'}</h4>
                <div className="flex items-center space-x-4 text-[9.5px] mt-1 text-gray-400 font-mono">
                  <span>Date: {inv.date}</span>
                  <span className="text-red-300">Due: {inv.dueDate}</span>
                </div>
              </div>

              <div className="text-right ml-4">
                <span className="text-xs font-black text-white">₹{(inv.totalAmount ?? 0).toLocaleString('en-IN')}</span>
                <span className="text-[8.5px] text-gray-500 block">Pay: ₹{inv.paidAmount}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice Details Layout printable / PDF Simulator modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-[#0B0F1A]/90 overflow-y-auto flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn bg-blend-darken">
          <div className="bg-white text-gray-900 w-full max-w-lg rounded-2xl shadow-2xl p-5 space-y-4 relative overflow-hidden">
            
            {/* Watermark of FREE subscription */}
            {subscription === 'FREE' && (
              <div className="absolute inset-0 flex items-center justify-center rotate-35 pointer-events-none select-none opacity-[0.06] font-extrabold text-5xl text-red-600 border-4 border-red-600 p-4">
                BILLKARO - FREE TRIAL WATERMARK
              </div>
            )}

            {/* Actions panel invisible on target print */}
            <div className="flex justify-between items-center bg-gray-900 text-white p-3.5 -mx-5 -mt-5 mb-3 rounded-t-2xl border-b border-gray-800">
              <div>
                <span className="text-[9px] uppercase text-amber-500 tracking-wider block font-mono">BillKaro Digital Invoice</span>
                <h3 className="text-xs font-bold font-mono">{selectedInvoice.invoiceNumber}</h3>
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => window.print()}
                  className="bg-amber-500 text-black px-2.5 py-1 rounded text-[10px] font-bold flex items-center space-x-0.5 hover:bg-amber-400 cursor-pointer"
                >
                  <Printer className="h-3 w-3" />
                  <span>प्रिन्ट / PDF Save</span>
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="bg-gray-800 p-1 rounded-full text-gray-300 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Bill Sheet Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-3">
              <div>
                <h1 className="text-sm font-black text-amber-600 uppercase tracking-tight">{profile.businessName || 'Aman Fabrication Works'}</h1>
                <p className="text-[10px] text-gray-500 whitespace-pre-line leading-relaxed max-w-[170px] mt-0.5">{profile.address}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 font-bold">📞 {profile.phone}</p>
                {profile.isRegisteredGST && profile.gstNumber && (
                  <p className="text-[9px] bg-amber-100 text-amber-800 font-mono py-0.5 px-1.5 rounded inline-block mt-1 font-bold">GSTIN: {profile.gstNumber}</p>
                )}
              </div>
              
              <div className="text-right">
                <h2 className="text-md font-extrabold text-gray-700 uppercase tracking-wider font-mono">INVOICE (बिल)</h2>
                <div className="text-[10.5px] text-gray-500 mt-1.5 space-y-0.5 font-mono">
                  <div>Bill No: <b className="text-gray-900">{selectedInvoice.invoiceNumber}</b></div>
                  <div>Date: <b className="text-gray-900">{selectedInvoice.date}</b></div>
                  <div>Payment Due: <b className="text-[#DC2626]">{selectedInvoice.dueDate}</b></div>
                </div>
              </div>
            </div>

            {/* Bill Grahak address info */}
            <div className="p-2.5 bg-gray-50 rounded-lg flex justify-between text-[11px] border border-gray-100">
              <div>
                <span className="text-gray-400 block uppercase text-[8px] font-black">BILLED TO (Grahak):</span>
                <span className="font-bold text-gray-900">{selectedInvoice.clientName}</span>
                <span className="text-gray-500 block text-[10px]/none mt-1">📞 {selectedInvoice.clientPhone || 'NA'}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block uppercase text-[8px] font-black">STATUS:</span>
                <span className={`font-black uppercase tracking-wider text-[11px] ${selectedInvoice.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {selectedInvoice.status === 'Paid' ? 'PAID (चुक्ता)' : 'UNPAID ACCOUNT'}
                </span>
              </div>
            </div>

            {/* Bill line items */}
            <div className="mt-3">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase font-mono text-[9px] border-b border-gray-200">
                    <th className="py-2 pl-2">विवरण (Description)</th>
                    <th className="py-2 text-center">Rate</th>
                    <th className="py-2 text-center">Qty</th>
                    {selectedInvoice.isGstApplied && <th className="py-2 text-center">GST%</th>}
                    <th className="py-2 text-right pr-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedInvoice.items.map((it: BillItem, index: number) => (
                    <tr key={index} className="text-gray-800">
                      <td className="py-2 pl-2 font-medium">{it.name}</td>
                      <td className="py-2 text-center font-mono">₹{it.rate}</td>
                      <td className="py-2 text-center font-mono">{it.quantity} {it.unit}</td>
                      {selectedInvoice.isGstApplied && <td className="py-2 text-center font-mono">{it.gstPercent}%</td>}
                      <td className="py-2 text-right pr-2 font-bold font-mono">₹{((it.rate ?? 0) * (it.quantity ?? 0)).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals table sheet */}
            <div className="flex border-t border-gray-200 pt-3">
              <div className="flex-1 text-[10px] text-gray-500 pr-4 space-y-1">
                <span className="font-bold text-gray-800 uppercase block tracking-wider text-[8px]">BANK & UPI DETAILS (भुगतान के लिए)</span>
                {profile.bankName && <div>Bank: <b>{profile.bankName}</b></div>}
                {profile.accountNumber && <div>A/C Number: <b className="font-mono text-gray-900">{profile.accountNumber}</b></div>}
                {profile.ifscCode && <div>IFSC Code: <b className="font-mono text-gray-900">{profile.ifscCode}</b></div>}
                {profile.upiId && <div className="text-amber-700">UPI Id: <b className="font-mono">{profile.upiId}</b></div>}
              </div>

              <div className="w-[180px] bg-gray-50 p-2.5 rounded text-[11px] space-y-1 text-right">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal:</span>
                  <span>₹{(calculateSubtotal(selectedInvoice.items) ?? 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoice.isGstApplied && (
                  <div className="flex justify-between text-gray-500">
                    <span>Tax (GST):</span>
                    <span>₹{(calculateTax(selectedInvoice.items) ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount:</span>
                    <span>- ₹{selectedInvoice.discount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-md text-gray-900">
                  <span>GRAND TOTAL:</span>
                  <span className="text-[#D97706]">₹{(selectedInvoice.totalAmount ?? 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[10px] pt-1 text-gray-500 border-t border-dashed border-gray-200">
                  <div>Paid: ₹{(selectedInvoice.paidAmount ?? 0).toLocaleString('en-IN')}</div>
                  <div className="font-bold text-red-600">Baqi Balance: ₹{((selectedInvoice.totalAmount ?? 0) - (selectedInvoice.paidAmount ?? 0)).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-gray-100 pt-4 text-[10px] text-gray-400">
              <div>
                {selectedInvoice.notes && <p className="italic">* Note: {selectedInvoice.notes}</p>}
                <p className="mt-1 font-bold">Issued via BillKaro App</p>
              </div>
              <div className="text-right">
                <div className="h-7 border-b border-gray-300 w-[110px] mb-1 font-mono italic text-[9px] text-gray-300 flex items-end justify-center">Signature Stamp</div>
                <span className="font-bold text-gray-700 text-[10px]">{profile.signatureText || profile.ownerName}</span>
              </div>
            </div>

            {/* Record payment widget inside active modal */}
            {selectedInvoice.totalAmount > selectedInvoice.paidAmount && (
              <div className="bg-gray-900 text-white p-4 -mx-5 -mb-5 mt-4 rounded-b-2xl border-t border-gray-800">
                {!showPayBox ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-500 font-bold font-mono">PAYMENT JOURNAL</span>
                      <p className="text-xs text-gray-300">Net balance due is ₹{selectedInvoice.totalAmount - selectedInvoice.paidAmount}. Reached payment?</p>
                    </div>
                    <button
                      onClick={() => setShowPayBox(true)}
                      className="bg-emerald-500 text-black px-3 py-1 rounded text-xs font-bold hover:bg-emerald-400 transition cursor-pointer"
                    >
                      रुपये जमा करें (Record Payment)
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePaySubmit} className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-emerald-400">Record cash payment received today</span>
                      <button type="button" onClick={() => setShowPayBox(false)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                    </div>
                    <div className="flex space-x-2">
                      <input 
                        type="number" 
                        required
                        placeholder="₹ Amount received"
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        className="flex-1 bg-[#010610] text-xs text-white p-2 rounded focus:outline-none focus:border-amber-500"
                        max={selectedInvoice.totalAmount - selectedInvoice.paidAmount}
                      />
                      <button
                        type="submit"
                        className="bg-emerald-500 text-black px-4 py-2 rounded text-xs font-extrabold hover:bg-emerald-400"
                      >
                        Settle Jama
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Deletion if fully paid or clean-up */}
            {selectedInvoice.status === 'Paid' && (
              <button
                onClick={() => {
                  if (confirm("Kya aap ye paid invoice remove karna chahte hain?")) {
                    deleteInvoice(selectedInvoice.id);
                    setSelectedInvoice(null);
                  }
                }}
                className="w-full bg-red-400/10 border border-red-400/20 text-red-500 hover:bg-red-500 hover:text-white py-1.5 rounded-xl text-[10px] font-bold mt-2"
              >
                Delete Bill (Record remove)
              </button>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
