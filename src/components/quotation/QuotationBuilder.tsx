import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  X, 
  Calendar, 
  DollarSign, 
  PlusCircle, 
  Zap, 
  Droplet, 
  Hammer, 
  Paintbrush, 
  Home, 
  Sliders, 
  Percent, 
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useAppStore } from '../../store';
import { BillItem, Quotation } from '../../types';
import { toast } from 'react-hot-toast';


interface QuotationBuilderProps {
  onSave: (quoteData: Omit<Quotation, 'id' | 'isConverted'> & { advanceAmount?: number; advanceMode?: 'Cash' | 'Online'; category?: string; conditions?: string[] }) => void;
  onCancel: () => void;
  initialData?: Quotation;
}

export default function QuotationBuilder({ onSave, onCancel, initialData }: QuotationBuilderProps) {

  const { clients, quotations } = useAppStore();

  // Basic Details
  const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || '');
  const [category, setCategory] = useState(initialData?.category || 'Custom');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [validityDays, setValidityDays] = useState(initialData?.validityDays?.toString() || '15');
  const [discount, setDiscount] = useState(initialData?.discount?.toString() || '0');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Items table (description + amount)
  const [items, setItems] = useState<BillItem[]>(initialData?.items || []);
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');

  // Advance Amount + Payment Mode
  const [advanceAmount, setAdvanceAmount] = useState(initialData?.advanceAmount?.toString() || '0');
  const [advanceMode, setAdvanceMode] = useState<'Cash' | 'Online'>(initialData?.advanceMode || 'Cash');

  // Terms & Conditions (editable list)
  const [conditions, setConditions] = useState<string[]>(
    initialData?.conditions || []
  );
  const [newCondition, setNewCondition] = useState('');

  // Categories list with Icons
  const categoriesList = [
    { name: 'Electrical', label: 'Electrical (बिजली काम)', icon: Zap, color: 'text-amber-400 bg-amber-450/10 border-amber-500/25' },
    { name: 'Plumbing', label: 'Plumbing (नलसाजी)', icon: Droplet, color: 'text-sky-400 bg-sky-450/10 border-sky-500/25' },
    { name: 'Construction', label: 'Construction (निर्माण)', icon: Hammer, color: 'text-red-400 bg-red-400/10 border-red-500/25' },
    { name: 'Painting', label: 'Painting (पुताई)', icon: Paintbrush, color: 'text-purple-400 bg-purple-400/10 border-purple-500/25' },
    { name: 'Interior', label: 'Interior (सजावट)', icon: Home, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/25' },
    { name: 'Custom', label: 'Custom (सामान्य)', icon: Sliders, color: 'text-gray-400 bg-gray-400/10 border-gray-500/25' }
  ];

  // Quick select handling
  const handleAddCondition = () => {
    if (!newCondition.trim()) return;
    setConditions([...conditions, newCondition.trim()]);
    setNewCondition('');
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, idx) => idx !== index));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error('कृपया सामग्री विवरण भरें!');
      return;
    }
    const rateVal = parseFloat(itemAmount) || 0;
    if (rateVal <= 0) {
      toast.error('कृपया सही दाम भरें!');
      return;
    }

    const newItem: BillItem = {
      name: itemName.trim(),
      quantity: 1,
      unit: 'Job',
      rate: rateVal,
      gstPercent: 0
    };

    setItems([...items, newItem]);
    setItemName('');
    setItemAmount('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.rate * item.quantity, 0);
  const discountVal = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountVal);
  const advanceVal = parseFloat(advanceAmount) || 0;
  const balanceOutstanding = Math.max(0, grandTotal - advanceVal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error('कृपया ग्राहक चुनें!');
      return;
    }
    if (items.length === 0) {
      toast.error('कम से कम एक सामग्री / सेवा विवरण टेबल में जोड़ें!');
      return;
    }

    // Auto-generate invoice/estimate number if new
    const fallbackNum = 'EST-' + Math.floor(10000 + Math.random() * 90000);
    const quoteNumber = initialData?.quoteNumber || fallbackNum;

    onSave({
      quoteNumber,
      clientId: selectedClientId,
      date,
      items,
      discount: discountVal,
      notes,
      validityDays: parseInt(validityDays) || 15,
      category,
      advanceAmount: advanceVal,
      advanceMode,
      conditions
    });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
      
      {/* Visual top row */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-800/80">
        <div>
          <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest font-mono">
            {initialData ? 'एडिट कोटासन बही' : 'नया एस्टीमेट / कोटेशन बनाएँ'}
          </h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Premium Estimates Creator Module</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-1.5 bg-gray-950/60 hover:bg-gray-850 text-gray-400 hover:text-white rounded-full transition cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Base Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Client selector dropdown */}
          <div className="md:col-span-1">
            <label className="text-[10px] text-gray-400 block mb-1.5 font-bold uppercase tracking-wider">
              ग्राहक का चयन करें (Client) *
            </label>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              required
              className="w-full bg-[#0B0F1A] border border-gray-850 hover:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-550 transition-colors"
            >
              <option value="">-- ग्राहक चुनें / Choose Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1.5 font-bold uppercase tracking-wider">
              आज की तारीख (Estimate Date)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-gray-550" />
              <input 
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-[#0B0F1A] border border-gray-855 hover:border-gray-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Validity selector */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1.5 font-bold uppercase tracking-wider">
              एस्टीमेट की वैधता (Validity Period)
            </label>
            <select
              value={validityDays}
              onChange={e => setValidityDays(e.target.value)}
              className="w-full bg-[#0B0F1A] border border-gray-855 hover:border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="7">7 दिन (7 Days Valid)</option>
              <option value="15">15 दिन (15 Days Valid)</option>
              <option value="30">30 दिन (1 Month Valid)</option>
              <option value="60">60 दिन (2 Months Valid)</option>
            </select>
          </div>
        </div>

        {/* Step 2: Category Selector */}
        <div>
          <label className="text-[10px] text-gray-400 block mb-2 font-bold uppercase tracking-wider">
            काम के प्रकार चुनें (Work Category Selector)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {categoriesList.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = category === cat.name;
              return (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  className={`flex items-center space-x-2 py-2 px-3 border rounded-xl text-center cursor-pointer transition text-xs font-bold leading-tight ${
                    isSelected 
                      ? 'bg-amber-500 border-amber-500 text-black' 
                      : 'bg-gray-950 border-gray-850 hover:bg-gray-850 text-gray-300'
                  }`}
                >
                  <IconComp className={`h-4 w-4 ${isSelected ? 'text-black' : cat.color.split(' ')[0]}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Dynamic Items Table input form */}
        <div className="bg-[#0B0F1A]/80 border border-gray-850 rounded-2xl p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-850/60 pb-2">
            <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest font-mono">
              सामग्री एवं कार्य तालिका (Quote Line Items)
            </h4>
            <span className="text-[10px] text-gray-500 font-mono">Total Added: {items.length} items</span>
          </div>

          {/* Table Header and Input Add Row */}
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className="sm:col-span-4">
              <input 
                type="text"
                placeholder="काम/सामग्री का विवरण"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-550 placeholder-gray-600"
              />
            </div>
            <div className="sm:col-span-1.5 relative">
              <span className="absolute left-3 top-2 text-gray-500 text-xs font-bold">₹</span>
              <input 
                type="number"
                placeholder="दाम / Amount"
                value={itemAmount}
                onChange={e => setItemAmount(e.target.value)}
                className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-6 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-gray-600"
              />
            </div>
            <div className="sm:col-span-0.5">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full bg-amber-500/10 hover:bg-amber-550 hover:text-black border border-amber-500/25 text-amber-500 p-2 rounded-xl transition flex items-center justify-center cursor-pointer"
                title="तालिका में जोड़ें"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Items rendering table */}
          {items.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-gray-850 rounded-xl text-gray-550 text-[11px]">
              कोई आइटम नहीं जोड़ा गया है। कृपया ऊपर विवरण और दाम भरकर जोड़ने के लिये '+' आइकॉन पर टैप करें।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead>
                  <tr className="border-b border-gray-850/40 text-gray-500 text-[10px] uppercase font-mono">
                    <th className="py-2.5 font-bold">क्रसं (SNo)</th>
                    <th className="py-2.5 font-bold pl-2">काम/विवरण (Description of Work)</th>
                    <th className="py-2.5 font-bold text-right pr-4">कुल राशि (Amount)</th>
                    <th className="py-2.5 text-center font-bold">हटाएँ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-855/35">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-900/30 transition-colors">
                      <td className="py-2 pl-0.5 font-mono text-gray-550 text-[10px]">{index + 1}</td>
                      <td className="py-2 pl-2">
                        <span className="font-extrabold text-white text-[11px] block">{item.name}</span>
                        <span className="text-[10px] text-gray-500">Service Estimate @ Lumpsum Rate</span>
                      </td>
                      <td className="py-2 text-right pr-4 font-black font-mono text-gray-200">
                        ₹{(item.rate ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 text-center">
                        <button 
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 hover:bg-red-500/10 text-rose-500 rounded transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Step 4: Advance Setup & Discount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0B0F1A]/80 border border-gray-850 rounded-2xl p-4 space-y-4">
            <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest font-mono border-b border-gray-850/60 pb-2">
              एडवांस भुगतान प्रविष्टि (Advance Details)
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-gray-450 block mb-1 font-bold uppercase tracking-wider">
                  एडवांस राशि (Advance Paid ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-550 text-xs font-bold">₹</span>
                  <input 
                    type="number"
                    placeholder="उदा. 5000"
                    value={advanceAmount}
                    onChange={e => setAdvanceAmount(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-6 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] text-gray-450 block mb-1 font-bold uppercase tracking-wider">
                  भुगतान माध्यम (Payment Mode)
                </label>
                <select
                  value={advanceMode}
                  onChange={e => setAdvanceMode(e.target.value as any)}
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Cash">Cash (नकद भुगतान)</option>
                  <option value="Online">Online (यूपीआई/बैंक ट्रांसफर)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[#0B0F1A]/80 border border-gray-850 rounded-2xl p-4 space-y-3">
            <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-widest font-mono border-b border-gray-850/60 pb-2">
              छूट / एडिशनल डिटेल्स (Discount & Memo)
            </h4>
            <div>
              <label className="text-[9px] text-gray-450 block mb-1 font-bold uppercase tracking-wider">
                ग्राहक को दी गई छूट (Discount Amount ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-550 text-xs font-bold">₹</span>
                <input 
                  type="number"
                  placeholder="0"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-6 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Terms & Conditions List */}
        <div className="bg-[#0B0F1A]/80 border border-gray-850 rounded-2xl p-4 space-y-4">
          <div className="border-b border-gray-850/60 pb-2 flex justify-between items-center">
            <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest font-mono">
              एस्टीमेट की शर्तें (Terms & Conditions)
            </h4>
            <span className="text-[9.5px] text-gray-500">शर्ते एडिट या डिलीट कर सकते हैं</span>
          </div>

          {/* Condition addition block */}
          <div className="flex space-x-2">
            <input 
              type="text"
              placeholder="नई शर्त जोड़ें (e.g., डिलीवरी काम पूरा होने के 7 दिन के अंदर भुगतान अनिवार्य)"
              value={newCondition}
              onChange={e => setNewCondition(e.target.value)}
              className="flex-1 bg-gray-950 border border-gray-855 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-550 placeholder-gray-650"
            />
            <button
              type="button"
              onClick={handleAddCondition}
              className="bg-amber-500 text-black px-3.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>जोड़ें</span>
            </button>
          </div>

          {/* Render list of conditions */}
          <div className="space-y-1.5 pt-1">
            {conditions.map((cond, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-900/60 border border-gray-855/35 px-3 py-2 rounded-xl hover:border-gray-800 transition">
                <div className="flex items-start space-x-2">
                  <span className="text-[10px] text-amber-550 font-black mt-0.5">{idx + 1}.</span>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans">{cond}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCondition(idx)}
                  className="text-gray-550 hover:text-rose-400 p-0.5 transition cursor-pointer shrink-0 ml-3"
                  title="शर्त सूची से हटाएं"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Step 6: Live Billing Summary calculations */}
        <div className="bg-[#1C160C] border border-amber-500/20 p-5 rounded-3xl space-y-2.5">
          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest font-mono flex items-center justify-between">
            <span>सटीक वित्तीय योग (Ledger Calculator)</span>
            <span className="text-gray-500 italic lowercase font-normal font-sans">rates are subject to conditions</span>
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans mt-2">
            
            {/* Subtotal */}
            <div className="p-3 bg-gray-950/40 rounded-xl border border-gray-850">
              <span className="text-gray-500 text-[10px] block uppercase font-mono">कुल योग (Subtotal)</span>
              <span className="text-sm font-extrabold text-white mt-1 block">
                ₹{(subtotal ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Discount */}
            <div className="p-3 bg-gray-950/40 rounded-xl border border-gray-850">
              <span className="text-gray-500 text-[10px] block uppercase font-mono">छूट (Discount)</span>
              <span className="text-sm font-extrabold text-rose-400 mt-1 block">
                - ₹{(discountVal ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Advance amount paid */}
            <div className="p-3 bg-gray-950/40 rounded-xl border border-gray-850">
              <span className="text-gray-500 text-[10px] block uppercase font-mono">सुरक्षित एडवांस ({advanceMode})</span>
              <span className="text-sm font-extrabold text-emerald-400 mt-1 block">
                ₹{(advanceVal ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Final Balance Outstanding */}
            <div className="p-3 bg-[#241E15] rounded-xl border border-amber-500/30">
              <span className="text-amber-500 text-[10.5px] block uppercase font-mono font-black">अंतिम देय राशि (Balance)</span>
              <span className="text-[15px] font-black text-amber-400 mt-0.5 block font-mono">
                ₹{(balanceOutstanding ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="pt-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-950 hover:bg-gray-850 border border-gray-850 text-gray-400 font-black py-3 rounded-2xl text-xs uppercase cursor-pointer transition text-center"
          >
            वापस जाएँ (Cancel)
          </button>
          
          <button
            type="submit"
            className="flex-2 bg-amber-500 hover:bg-amber-600 text-black font-black py-3 rounded-2xl text-xs uppercase cursor-pointer transition flex items-center justify-center space-x-2"
          >
            <FileText className="h-4.5 w-4.5 stroke-[2.5]" />
            <span>एस्टीमेट सहेजें और प्रीव्यू देखें (Save & Preview)</span>
          </button>
        </div>

      </form>
    </div>
  );
}
