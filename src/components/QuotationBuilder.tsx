import React, { useState } from 'react';
import useAppStore from '../store';
import { BillItem } from '../types';
import { 

  Plus, 
  Trash2, 
  X, 
  Check, 
  FileText, 
  Calendar, 
  ChevronRight, 
  RefreshCcw, 
  Share2, 
  DollarSign, 
  ArrowRightLeft,
  Briefcase
} from 'lucide-react';

export default function QuotationBuilder() {

  const { clients, quotations, addQuotation, deleteQuotation, convertQuoteToInvoice } = useAppStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<any>(null);

  // Form states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [validity, setValidity] = useState('15');

  // Multi-item builder states
  const [items, setItems] = useState<BillItem[]>([]);
  const [currItemName, setCurrItemName] = useState('');
  const [currQty, setCurrQty] = useState('1');
  const [currUnit, setCurrUnit] = useState('Pcs');
  const [currRate, setCurrRate] = useState('');
  const [currGst, setCurrGst] = useState('18');

  const handleAddItem = () => {
    if (!currItemName.trim() || !currRate) return;
    const itemValue: BillItem = {
      name: currItemName,
      quantity: parseFloat(currQty) || 1,
      unit: currUnit,
      rate: parseFloat(currRate) || 0,
      gstPercent: parseFloat(currGst) || 0
    };
    setItems([...items, itemValue]);

    // reset fields
    setCurrItemName('');
    setCurrQty('1');
    setCurrRate('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const calculateQuoteSubtotal = (itemsList: BillItem[]) => {
    return itemsList.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  };

  const calculateQuoteGst = (itemsList: BillItem[]) => {
    return itemsList.reduce((sum, item) => {
      const lineCost = item.rate * item.quantity;
      return sum + (lineCost * item.gstPercent / 100);
    }, 0);
  };

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert("Hinglish: Pehle Grahak select karein!");
      return;
    }
    if (items.length === 0) {
      alert("Hinglish: Kam se kam ek item list me jodein!");
      return;
    }

    addQuotation({
      quoteNumber: 'EST-' + (quotations.length + 101).toString(),
      clientId: selectedClientId,
      date: new Date().toISOString().split('T')[0],
      items: items,
      discount: parseFloat(discount) || 0,
      notes: notes,
      isConverted: false,
      validityDays: parseInt(validity) || 15
    });

    // Reset Form
    setSelectedClientId('');
    setItems([]);
    setDiscount('0');
    setNotes('');
    setValidity('15');
    setShowAddForm(false);
    alert("Quotation / Estimate safely save ho gaya!");
  };

  const handleConvert = (quoteId: string) => {
    convertQuoteToInvoice(quoteId);
    alert("Kachha Bill (Quotation) successfully Pakka Bill (Invoice) me convert ho gaya hai!");
    setSelectedQuoteDetail(null);
  };

  return (
    <div className="space-y-4">
      {/* Visual Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <div className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-bold text-gray-100">Kachha Bill (Quotation/Estimate Maker)</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-1.5 px-3 rounded text-xs flex items-center space-x-1 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Estimate Banayein</span>
        </button>
      </div>

      {/* Add Estimate Form */}
      {showAddForm && (
        <form onSubmit={handleSaveQuotation} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center pb-2 border-b border-gray-800">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">नया कोटेशन / एस्टीमेट</h3>
            <button type="button" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Client select */}
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">ग्राहक चुनें (Select Client) *</label>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              required
              className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Grahak Select Karein --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>

          {/* Item Adder zone */}
          <div className="bg-[#161B29] p-4 rounded-2xl border border-gray-800 space-y-3">
            <h4 className="text-[10px] font-bold text-amber-500 uppercase">सामग्री / काम जोड़ें (Add Items to Bid)</h4>
            
            <div className="space-y-2">
              <div>
                <input 
                  type="text" 
                  placeholder="सामग्री का नाम"
                  value={currItemName}
                  onChange={e => setCurrItemName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                  <input 
                    type="number" 
                    placeholder="Rate (₹)"
                    value={currRate}
                    onChange={e => setCurrRate(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <input 
                    type="number" 
                    placeholder="Qnty"
                    value={currQty}
                    onChange={e => setCurrQty(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <select
                    value={currUnit}
                    onChange={e => setCurrUnit(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 font-mono rounded p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Ft">Ft</option>
                    <option value="Box">Box</option>
                    <option value="Job">Job</option>
                    <option value="Day">Day</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-gray-400">GST Percent:</span>
                  <select
                    value={currGst}
                    onChange={e => setCurrGst(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded text-[10px] p-1 text-white"
                  >
                    <option value="0">0% (GST Free)</option>
                    <option value="5">5% SGST/CGST</option>
                    <option value="12">12%</option>
                    <option value="18">18% Standard</option>
                    <option value="28">28% Premium</option>
                  </select>
                </div>

                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold px-3 py-1 rounded text-[10.5px] hover:bg-amber-500 hover:text-black transition"
                >
                  + Add Item
                </button>
              </div>
            </div>

            {/* List of current items */}
            {items.length > 0 && (
              <div className="border-t border-gray-800 pt-2 mt-2 space-y-1 max-h-[140px] overflow-y-auto">
                <span className="text-[9px] text-gray-500 uppercase block font-bold">शामिल चीजे (Added Items Detail)</span>
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-xs bg-gray-900 p-2 rounded-xl">
                    <div>
                      <span className="text-white font-medium block">{item.name}</span>
                      <span className="text-[10px] text-gray-400">{item.quantity} {item.unit} @ ₹{item.rate} ({item.gstPercent}% GST)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-200">₹{item.rate * item.quantity}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(index)}
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
              <label className="text-[10px] text-gray-400 block mb-1">छूट डिस्काउंट (Discount Amount ₹)</label>
              <input 
                type="number" 
                placeholder="0"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">मान्यता काल (Validity in Days)</label>
              <select
                value={validity}
                onChange={e => setValidity(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white"
              >
                <option value="15">15 Din (Days)</option>
                <option value="30">30 Din (Days)</option>
                <option value="7">7 Din (Days)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">कोटेशन की शर्तें (Estimates Terms/Notes)</label>
            <input 
              type="text" 
              placeholder="e.g. Rate invalid after 15 days of writing estimate"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Totals Preview inside add form */}
          <div className="bg-[#161B29] p-3 rounded-xl border border-gray-800 text-right text-xs text-gray-300">
            <div>Subtotal: ₹{calculateQuoteSubtotal(items)}</div>
            <div>Est. GST: ₹{calculateQuoteGst(items)}</div>
            <div className="font-bold text-amber-500 mt-1">Net Estimate Total: ₹{Math.max(0, calculateQuoteSubtotal(items) + calculateQuoteGst(items) - (parseFloat(discount) || 0))}</div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-white font-extrabold py-2 px-4 rounded text-xs transition block uppercase tracking-wider"
          >
            एस्टीमेट सहेजें (Save Quotation)
          </button>
        </form>
      )}

      {/* List of existing Quotations */}
      <div className="space-y-2">
        {quotations.map((quote) => {
          const client = clients.find(c => c.id === quote.clientId);
          const baseSum = calculateQuoteSubtotal(quote.items);
          const gstSum = calculateQuoteGst(quote.items);
          const finalSum = Math.max(0, baseSum + gstSum - quote.discount);

          return (
            <div 
              key={quote.id}
              onClick={() => setSelectedQuoteDetail({ ...quote, clientName: client?.name || 'Unknown Client', finalSum })}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-amber-500 font-bold">{quote.quoteNumber}</span>
                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase font-mono ${quote.isConverted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
                    {quote.isConverted ? 'CONVERTED TO BILL' : 'PENDING ESTIMATE'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gray-100">{client?.name || 'Undeclared Client'}</h4>
                <div className="flex items-center space-x-3 text-[9.5px] text-gray-400 mt-1">
                  <span>Items: {quote.items.length}</span>
                  <span className="font-mono text-gray-500">Validity: {quote.validityDays} Days</span>
                </div>
              </div>

              <div className="text-right ml-4">
                <span className="text-xs font-extrabold text-white">₹{(finalSum ?? 0).toLocaleString('en-IN')}</span>
                <ChevronRight className="h-4 w-4 text-gray-500 block ml-auto mt-0.5" />
              </div>
            </div>
          );
        })}

        {quotations.length === 0 && (
          <div className="text-center py-6 text-xs text-gray-500">
            Abhi tak koi quotation estimate nahi banaya hai. Right side "Estimate Banayein" par click karein.
          </div>
        )}
      </div>

      {/* Quotation Detail Slip Modal */}
      {selectedQuoteDetail && (
        <div className="fixed inset-0 bg-[#0B0F1A]/90 overflow-y-auto flex items-center justify-center p-3 z-50 animate-fadeIn">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-4">
            
            {/* Modal actions close & header */}
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <div>
                <h3 className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider">KACHHA BILL / ESTIMATE SLIP</h3>
                <span className="text-white font-bold text-xs">{selectedQuoteDetail.quoteNumber}</span>
              </div>
              <button onClick={() => setSelectedQuoteDetail(null)} className="p-1 text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Bill Info Card */}
            <div className="bg-[#161B29] border border-gray-800 p-3 rounded-xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Grahak (Client):</span>
                <span className="font-bold text-gray-100">{selectedQuoteDetail.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date:</span>
                <span className="text-gray-200">{selectedQuoteDetail.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Validity period:</span>
                <span className="text-gray-200 font-mono">{selectedQuoteDetail.validityDays} Days</span>
              </div>
            </div>

            {/* Item lists */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Item Details</span>
              {selectedQuoteDetail.items.map((it: BillItem, index: number) => (
                <div key={index} className="bg-[#161B29]/60 p-2.5 rounded-xl border border-gray-800/40 text-xs flex justify-between">
                  <div>
                    <span className="text-white block font-medium">{it.name}</span>
                    <span className="text-gray-500 text-[10px]">{it.quantity} {it.unit} @ ₹{it.rate} ({it.gstPercent}% GST)</span>
                  </div>
                  <span className="font-bold text-[#F3F4F6] mt-1">₹{it.rate * it.quantity}</span>
                </div>
              ))}
            </div>

            {/* Total calculation panel */}
            <div className="bg-[#161B29] p-4 rounded-xl border border-gray-800 text-xs space-y-1">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal (कच्चा योग):</span>
                <span>₹{(calculateQuoteSubtotal(selectedQuoteDetail.items) ?? 0).toLocaleString('en-IN')}</span>
              </div>
              {calculateQuoteGst(selectedQuoteDetail.items) > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Estimated GST:</span>
                  <span>₹{(calculateQuoteGst(selectedQuoteDetail.items) ?? 0).toLocaleString('en-IN')}</span>
                </div>
              )}
              {selectedQuoteDetail.discount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>छूट डिस्काउंट:</span>
                  <span>- ₹{selectedQuoteDetail.discount}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-800 pt-1.5 font-extrabold text-amber-500">
                <span>ESTIMATE TOTAL:</span>
                <span className="text-sm">₹{(selectedQuoteDetail.finalSum ?? 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Notes info text */}
            {selectedQuoteDetail.notes && (
              <p className="text-[10px] text-gray-400 italic bg-[#161B29] p-2 rounded-xl border border-gray-800/30">
                * Note: {selectedQuoteDetail.notes}
              </p>
            )}

            {/* Conversion controller & Deletion */}
            <div className="space-y-2 pt-2">
              {!selectedQuoteDetail.isConverted ? (
                <button
                  type="button"
                  onClick={() => handleConvert(selectedQuoteDetail.id)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0B0F1A] font-bold py-2 rounded text-xs flex items-center justify-center space-x-1 transition cursor-pointer font-black"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span>पक्के बिल में बदलें (Convert to Pakka Bill)</span>
                </button>
              ) : (
                <div className="text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-1.5 px-3 rounded-xl text-[10.5px] font-bold">
                  ✓ Ek bar already pakka bill convert ho chuka hai!
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const txt = `Estimate ${selectedQuoteDetail.quoteNumber} for *${selectedQuoteDetail.clientName}* of Total: *₹${selectedQuoteDetail.finalSum}* is ready. Terms: ${selectedQuoteDetail.notes}`;
                    navigator.clipboard.writeText(txt);
                    alert("WhatsApp format copied to clipboard! (व्हाट्सएप डिटेल कॉपी हो गयी)");
                  }}
                  className="flex-1 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>WhatsApp Share details</span>
                </button>

                <button 
                  onClick={() => {
                    const ok = confirm("Kya aap ye quotation nikalna chahte hain?");
                    if (ok) {
                      deleteQuotation(selectedQuoteDetail.id);
                      setSelectedQuoteDetail(null);
                    }
                  }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-red-500 hover:text-white transition cursor-pointer"
                >
                  Fekey (Delete)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
