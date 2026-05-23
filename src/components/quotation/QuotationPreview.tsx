import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  ArrowRightLeft, 
  Briefcase, 
  MapPin, 
  Phone, 
  User 
} from 'lucide-react';
import { generateQuotationPDF } from '../../lib/pdf';
import { useAppStore } from '../../store';
import { Quotation } from '../../types';
import { toast } from 'react-hot-toast';

interface QuotationPreviewProps {
  quotation: Quotation;
  onConvert: () => void;
  onClose: () => void;
}

export default function QuotationPreview({ quotation, onConvert, onClose }: QuotationPreviewProps) {
  const { profile, clients } = useAppStore();
  const printRef = useRef<HTMLDivElement>(null);

  // Find linked Client
  const clientMatch = clients.find(c => c.id === quotation.clientId);
  const clientName = clientMatch?.name || 'Client Details Not Available';
  const clientPhone = clientMatch?.phone && clientMatch.phone !== 'NA' ? clientMatch.phone : 'N/A';
  const clientType = clientMatch?.clientType || 'Regular';

  // Core calculations
  const subtotal = quotation.items.reduce((sum, item) => sum + item.rate * item.quantity, 0);
  const discount = quotation.discount || 0;
  const grandTotal = Math.max(0, subtotal - discount);
  const advanceAmount = quotation.advanceAmount || 0;
  const balanceOutstanding = Math.max(0, grandTotal - advanceAmount);
  const notes = quotation.notes;

  // PDF Generator Callback
  const handleDownloadPDF = async () => {
    const loader = toast.loading('Preparing estimate PDF...');
    try {
      const doc = generateQuotationPDF({
        quotation,
        client: clientMatch,
        profile
      });

      doc.save(`ESTIMATE_${quotation.quoteNumber}_${clientName.replace(/\s+/g, '_')}.pdf`);
      toast.dismiss(loader);
      toast.success('Estimate PDF downloaded successfully!');
    } catch (err: any) {
      toast.dismiss(loader);
      console.error('Quotation PDF Error:', err);
      toast.error('Problem downloading PDF! Please use the Print button.');
    }
  };

  // Browser Direct Printing Handler
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Share Template
  const handleWhatsAppShare = () => {
    if (!clientMatch) {
      toast.error('Client details not available!');
      return;
    }

    const lineItemsStr = quotation.items.map((it, idx) => 
      `🔹 ${idx + 1}. *${it.name}* - ₹${(it.rate ?? 0).toLocaleString('en-IN')}`
    ).join('\n');

    const whatsappMessage = 
`*Hello, ${clientName}!* 👋

Please find your estimate details below:
📋 *Estimate Number:* ${quotation.quoteNumber}
📅 *Date:* ${quotation.date}
📂 *Category:* ${quotation.category || 'Custom Work'}

-----------------------------------
*Work Details:*
${lineItemsStr}

*Financial Summary:*
🔸 Subtotal: ₹${(subtotal ?? 0).toLocaleString('en-IN')}
🔸 Discount: ₹${(discount ?? 0).toLocaleString('en-IN')}
🌟 *Grand Total: ₹${(grandTotal ?? 0).toLocaleString('en-IN')}*

💸 *Advance Received:* ₹{(advanceAmount ?? 0).toLocaleString('en-IN')} (${quotation.advanceMode || 'Cash'})
⚠️ *Balance Due:* *₹{(balanceOutstanding ?? 0).toLocaleString('en-IN')}*

-----------------------------------
📝 *Terms & Conditions:*
${quotation.conditions && quotation.conditions.length > 0
  ? quotation.conditions.map((cond, i) => `📌 ${i + 1}. ${cond}`).join('\n')
  : '• Prices are valid according to mutually agreed scope.'}

*Thank you!* 🙏
💼 _${profile.businessName}_
📞 Contact: ${profile.phone}`;

    const encodedText = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=91${clientPhone.replace(/\D/g, '')}&text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp sharing window opened!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-4">
        
        {/* Header Action Tools */}
        <div className="bg-[#0D121F] px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
          
          {/* Title banner */}
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-500 rounded-xl">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-100 uppercase tracking-widest">
                Estimate Sheet Preview
              </h3>
              <p className="text-[10px] text-gray-550">Professional PDF & Print Generation Desk</p>
            </div>
          </div>

          {/* Action Tools Panel */}
          <div className="flex items-center space-x-2">
            
            {/* Download PDF button */}
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.8 bg-gray-950 hover:bg-gray-850 hover:text-white text-gray-300 border border-gray-800 rounded-xl transition flex items-center space-x-1.5 font-bold cursor-pointer"
            >
              <Download className="h-4 w-4 text-amber-500" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.8 bg-gray-950 hover:bg-gray-850 hover:text-white text-gray-300 border border-gray-800 rounded-xl transition flex items-center space-x-1.5 font-bold cursor-pointer"
            >
              <Printer className="h-4 w-4 text-sky-400" />
              <span className="hidden sm:inline">Print Estimate</span>
            </button>

            {/* WhatsApp share */}
            <button
              onClick={handleWhatsAppShare}
              className="px-3 py-1.8 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 rounded-xl transition flex items-center space-x-1.5 font-bold cursor-pointer"
            >
              <Share2 className="h-4 w-4 stroke-[2.5]" />
              <span>WhatsApp</span>
            </button>

            {/* Convert invoice button */}
            {!quotation.isConverted ? (
              <button
                onClick={onConvert}
                className="px-3 py-1.8 bg-amber-500 text-black rounded-xl hover:bg-amber-600 transition flex items-center space-x-1.5 font-black uppercase tracking-wide cursor-pointer text-[10.5px]"
              >
                <ArrowRightLeft className="h-4 w-4 stroke-[2.5]" />
                <span>Convert to Bill</span>
              </button>
            ) : (
              <div className="px-3 py-1.8 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 rounded-xl text-[10px] font-black uppercase flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Bill Generated</span>
              </div>
            )}

            {/* Close Cross button */}
            <button 
              onClick={onClose}
              className="p-1.5 bg-gray-950/60 hover:bg-gray-850 text-gray-400 hover:text-white rounded-full transition cursor-pointer ml-3"
            >
              <X className="h-4.5 w-4.5" />
            </button>

          </div>
        </div>

        {/* Printable Paper Area (Framed Beautifully) */}
        <div className="p-4 sm:p-8 bg-gray-950 overflow-y-auto flex-1 font-sans">
          
          <div 
            id="printable-estimate-card"
            ref={printRef}
            className="bg-white text-gray-900 mx-auto max-w-3xl border border-gray-200 shadow-xl p-6 sm:p-10 rounded-2xl relative leading-relaxed selection:bg-amber-200 selection:text-black [color-scheme:light]"
          >
            {/* Watermark style line */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-amber-500 to-amber-600" />

            {/* Section A: Header (Business Name & Logo mockup) */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-gray-150">
              <div className="space-y-2 max-w-md">
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 bg-amber-500 flex items-center justify-center rounded-xl text-black font-black text-lg shadow-sm">
                    {profile.businessName.charAt(0) || 'B'}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-950 uppercase tracking-tight">{profile.businessName}</h1>
                    <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">{profile.ownerName ? `Proprietor: ${profile.ownerName}` : 'Engineering Works & Fabrication'}</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-gray-655">
                  {profile.address && (
                    <div className="flex items-start">
                      <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0 mr-1.5 mt-0.5" />
                      <span>{profile.address}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center">
                      <Phone className="h-3.5 w-3.5 text-amber-600 mr-1.5 animate-pulse" />
                      <span>Phone: +91 {profile.phone}</span>
                    </div>
                  )}
                  {profile.gstNumber && profile.isRegisteredGST && (
                    <div className="inline-block bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold mt-1 text-gray-700">
                      GSTIN: {profile.gstNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Estimate Slip Metadata */}
              <div className="text-left sm:text-right space-y-1.5 self-stretch sm:self-auto flex flex-col justify-between sm:items-end">
                <div className="inline-block bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-500/20 text-right">
                  <span className="text-[9.5px] text-amber-700 block font-black uppercase tracking-wider font-mono">EST_PROPOSAL</span>
                  <span className="text-[13px] font-black text-amber-950 block select-all">ESTIMATE SLIP</span>
                </div>
                <div className="text-xs space-y-1 text-gray-600 font-mono">
                  <div><strong>Estimate No:</strong> #{quotation.quoteNumber}</div>
                  <div><strong>Date:</strong> {quotation.date}</div>
                  <div><strong>Validity:</strong> {quotation.validityDays} Days</div>
                  {quotation.category && (
                    <div><strong>Category:</strong> {quotation.category}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Section B: Client information */}
            <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider font-mono">Bill To Client</span>
                <div className="flex items-start space-x-2.5 mt-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 text-sm font-black shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-950 select-all">{clientName}</h4>
                    {(clientMatch as any)?.address && <p className="text-xs text-gray-500 mt-1">{(clientMatch as any).address}</p>}
                    <span className="inline-block bg-gray-200 text-[9px] font-bold px-2 py-0.5 mt-1 rounded text-gray-700">Type: {clientType}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end text-left md:text-right space-y-1 text-xs text-gray-600">
                {clientMatch?.phone && (
                  <div>
                    <span>Contact:</span>
                    <strong className="text-gray-900 ml-1.5 select-all">+91 {clientPhone}</strong>
                  </div>
                )}
                {quotation.category && (
                  <div>
                    <span>Work Type:</span>
                    <strong className="text-gray-900 ml-1.5 uppercase font-mono">{quotation.category} Section</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Section C: Item list / Service Table */}
            <div className="mt-8">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-900 bg-gray-50 text-gray-700 uppercase font-mono text-[10px] font-bold">
                    <th className="py-2.5 pl-2 text-gray-800">No</th>
                    <th className="py-2.5 pl-2 leading-tight text-gray-805">Item & Work Specifications</th>
                    <th className="py-2.5 text-center leading-tight text-gray-805">Qty</th>
                    <th className="py-2.5 text-right pr-4 leading-tight text-gray-805">Rate (Lumpsum)</th>
                    <th className="py-2.5 text-right pr-2 text-gray-805">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quotation.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/40">
                      <td className="py-3 pl-2.5 font-mono text-gray-400">{index + 1}</td>
                      <td className="py-3 pl-2">
                        <span className="font-extrabold text-[#0F172A] text-sm block">{item.name}</span>
                        <span className="text-[10.5px] text-gray-500 italic">Work category based lumpsum description</span>
                      </td>
                      <td className="py-3 text-center text-gray-700 font-mono font-medium">{item.quantity} {item.unit || 'Job'}</td>
                      <td className="py-3 text-right pr-4 text-gray-700 font-mono">₹{(item.rate ?? 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right pr-2 font-black text-gray-950 font-mono">
                        ₹{((item.rate ?? 0) * (item.quantity ?? 0)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations and Terms row split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-200">
              
              {/* Left Column: Conditions block */}
              <div className="space-y-3">
                <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider font-mono">Terms & Conditions</span>
                {quotation.conditions && quotation.conditions.length > 0 ? (
                  <div className="space-y-1.5">
                    {quotation.conditions.map((term, index) => (
                      <div key={index} className="flex items-start space-x-1.5 text-xs text-gray-750 leading-relaxed">
                        <span className="text-amber-600 font-extrabold font-mono text-[10px] shrink-0 mt-0.5">{index + 1}.</span>
                        <span>{term}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 italic leading-relaxed font-sans">
                    • Extra work outside agreed scope will be charged extra.<br />
                    • Work completion timeline subject to weather and site conditions.
                  </p>
                )}
              </div>

              {/* Right Column: Calculations card block */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4.5 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600 font-sans">
                  <span>Items Subtotal:</span>
                  <span className="font-bold text-gray-900 font-mono">₹{(subtotal ?? 0).toLocaleString('en-IN')}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-rose-650">
                    <span>Discount Amount:</span>
                    <strong className="font-mono text-rose-600">- ₹{(discount ?? 0).toLocaleString('en-IN')}</strong>
                  </div>
                )}
                
                <div className="flex justify-between border-t border-gray-200 pt-2 text-gray-950 font-extrabold text-[12.5px]">
                  <span>Grand Total:</span>
                  <span className="font-black text-gray-950 font-mono">₹{(grandTotal ?? 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-emerald-700 pt-1">
                  <span>Advance Received:</span>
                  <strong className="font-mono text-emerald-600">₹{(advanceAmount ?? 0).toLocaleString('en-IN')}</strong>
                </div>

                <div className="flex justify-between border-t-2 border-dashed border-gray-200 pt-2.5 font-black text-amber-800 text-[13.5px]">
                  <span className="uppercase">Due Balance:</span>
                  <span className="text-[15px] font-black font-mono">₹{(balanceOutstanding ?? 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Note text banner */}
            {notes && (
              <div className="mt-8 p-3 bg-amber-50/40 border border-amber-500/10 rounded-xl text-[10.5px] italic text-amber-900 leading-relaxed font-sans">
                ⚠️ <strong>Note / Notice:</strong> {notes}
              </div>
            )}

            {/* Signature authorization block */}
            <div className="flex justify-between items-end mt-12 pt-8 border-t border-gray-150">
              <div className="text-xs text-gray-500 leading-relaxed font-sans space-y-0.5">
                <p>• This document is a quote estimate sheet (Soft Proposal/Bill).</p>
                <p>• Subject to local jurisdiction and mutually agreed business regulations.</p>
              </div>
              
              <div className="text-right space-y-4">
                {profile.signatureText && (
                  <p className="font-mono italic text-[14px] text-amber-700 pr-2 select-none">
                    {profile.signatureText}
                  </p>
                )}
                <div className="border-t border-gray-900 pt-1 w-44 text-center">
                  <span className="text-[10px] text-gray-600 block uppercase font-bold tracking-widest leading-none font-sans">Authorized Signatory</span>
                  <span className="text-[8px] text-gray-400 block tracking-wider font-mono mt-1">Authorized Seal Signature</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
