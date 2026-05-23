import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  FileText, 
  Briefcase, 
  Building, 
  Phone, 
  MapPin, 
  User, 
  Calendar,
  AlertTriangle,
  Clock,
  QrCode,
  DollarSign
} from 'lucide-react';
import { useAppStore } from '../../store';
import { Invoice, BillItem } from '../../types';
import { toast } from 'react-hot-toast';
import { generateInvoicePDF } from '../../lib/pdf';
import { uploadInvoicePDF } from '../../lib/storage';
import { shareInvoice } from '../../lib/whatsapp';


interface InvoicePreviewProps {
  invoice: Invoice;
  onClose: () => void;
}

export default function InvoicePreview({ invoice, onClose }: InvoicePreviewProps) {

  const { profile, clients } = useAppStore();
  const printRef = useRef<HTMLDivElement>(null);

  // Match Linked Client
  const clientMatch = clients.find(c => c.id === invoice.clientId);
  const clientName = clientMatch?.name || 'अज्ञात ग्राहक (Unknown Client)';
  const clientPhone = clientMatch?.phone && clientMatch.phone !== 'NA' ? clientMatch.phone : 'N/A';
  const clientType = clientMatch?.clientType || 'Regular';

  // Subtotal (Sum of rate * qty)
  const subtotal = invoice.items.reduce((sum, item) => sum + item.rate * item.quantity, 0);
  const discount = invoice.discount || 0;

  // Live Tax Calculation splits (CGST @ half + SGST @ half OR IGST @ full)
  const taxDetails = invoice.items.reduce((acc, item) => {
    const itemTotal = item.rate * item.quantity;
    const rate = invoice.isGstApplied ? (item.gstPercent || 0) : 0;
    const gstAmt = (itemTotal * rate) / 100;
    if (rate > 0) {
      if (!acc[rate]) {
        acc[rate] = { base: 0, tax: 0 };
      }
      acc[rate].base += itemTotal;
      acc[rate].tax += gstAmt;
    }
    return acc;
  }, {} as Record<number, { base: number; tax: number }>);

  const totalGst = Object.values(taxDetails).reduce((sum, val) => sum + val.tax, 0);
  const grandTotal = invoice.totalAmount;
  const balanceOutstanding = Math.max(0, grandTotal - invoice.paidAmount);

  // Generate UPI QR Code URL
  // upi://pay?pa=PAYEE_ADDRESS&pn=PAYEE_NAME&am=AMOUNT&cu=INR
  const upiIdClean = profile.upiId || 'payment@upi';
  const upiNameClean = profile.businessName || 'Business Owner';
  const balanceToScan = balanceOutstanding > 0 ? balanceOutstanding : grandTotal;
  const upiPayload = `upi://pay?pa=${encodeURIComponent(upiIdClean)}&pn=${encodeURIComponent(upiNameClean)}&am=${balanceToScan}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayload)}&color=000000`;

  // PDF Compilation Download
  const handleDownloadPDF = async () => {
    const loader = toast.loading('जीएसटी इनवॉइस पीडीएफ तैयार किया जा रहा है...');
    try {
      const doc = generateInvoicePDF({
        invoice,
        client: clientMatch,
        profile,
      });

      doc.save(`INVOICE_${invoice.invoiceNumber}_${clientName.replace(/\s+/g, '_')}.pdf`);
      toast.dismiss(loader);
      toast.success('पक्का इनवॉइस पीडीएफ सफलतापूर्वक सहेजा गया!');
    } catch (err: any) {
      toast.dismiss(loader);
      console.error(err);
      toast.error('पीडीएफ रेंडर करने में समस्या आई!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Share layout compile to client directly
  const handleWhatsAppShare = async () => {
    if (!clientMatch) {
      toast.error('ग्राहक विवरण उपलब्ध नहीं है!');
      return;
    }

    const loader = toast.loading('व्हाट्सएप के लिए रिपोर्ट तैयार की जा रही है...');
    try {
      // 1. Generate PDF Blob
      const doc = generateInvoicePDF({
        invoice,
        client: clientMatch,
        profile,
      });
      const pdfBlob = doc.output('blob');

      // 2. Upload to Supabase Storage
      const pdfUrl = await uploadInvoicePDF(
        pdfBlob,
        invoice.invoiceNumber,
        profile.businessName
      );

      const itemLinesStr = invoice.items.map((it, idx) => 
        `🔹 ${idx + 1}. *${it.name}* (Qty: ${it.quantity} ${it.unit}) ${it.hsn ? `[HSN ${it.hsn}]` : ''} - ₹${((it.rate ?? 0) * (it.quantity ?? 0)).toLocaleString('en-IN')}`
      ).join('\n');

      const whatsappMessage = 
`*कर एवं पक्का बिल (Tax Invoice)* 📄
*${profile.businessName}*

नमस्ते, *${clientName}*! 👋
आपके पक्के बिल का विवरण नीचे दिया गया है:

📋 *इनवॉइस संख्या:* ${invoice.invoiceNumber}
📅 *दिनांक (Date):* ${invoice.date}
⌛ *अंतिम भुगतान तिथि:* ${invoice.dueDate}
${pdfUrl ? `\n📄 *इनवॉइस पीडीएफ लिंक:* ${pdfUrl}` : ''}

-----------------------------------
*सामग्री / कार्य विवरण (Items):*
${itemLinesStr}

*वित्तीय विवरणी (Financial Summary):*
🔸 कच्छा योग (Subtotal): ₹${(subtotal ?? 0).toLocaleString('en-IN')}
${invoice.isGstApplied ? `🔸 जीएसटी टैक्स (GST): ₹${(totalGst ?? 0).toLocaleString('en-IN')}` : ''}
🔸 छूट (Discount): ₹${(discount ?? 0).toLocaleString('en-IN')}
🌟 *कुल देय राशि (Grand Total): ₹${(grandTotal ?? 0).toLocaleString('en-IN')}*

💸 *कुल प्राप्त जमा (Paid amount):* ₹${(invoice.paidAmount ?? 0).toLocaleString('en-IN')}
⚠️ *बकाया शेष मूल्य (Due Balance):* *₹${(balanceOutstanding ?? 0).toLocaleString('en-IN')}*

-----------------------------------
🏦 *बैंक विवरण भुगतान के लिए (Bank Ledger):*
🔹 बैंक का नाम: ${profile.bankName}
🔹 खाता नंबर: ${profile.accountNumber}
🔹 IFSC कोड: ${profile.ifscCode}
🔹 UPI आईडी: ${profile.upiId}

_आप दिए गए UPI आईडी पर सीधे PhonePe / GooglePay से भुगतान कर सकते हैं।_

*धन्यवाद, आपके काम के लिए!* 🙏
💼 _${profile.businessName}_
📞 संपर्क दूरभाष: ${profile.phone}`;

      const encodedText = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=91${clientPhone.replace(/\D/g, '')}&text=${encodedText}`;
      
      window.open(whatsappUrl, '_blank');
      toast.dismiss(loader);
      toast.success('व्हाट्सएप विवरण शेयर लिंक खोली गई! (पीडीएफ लिंक के साथ)');
    } catch (err) {
      toast.dismiss(loader);
      console.error(err);
      toast.error('व्हाट्सएप शेयर करने में समस्या आई!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-4">
        
        {/* Header Action Desk */}
        <div className="bg-[#0D121F] px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Title banner */}
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-100 uppercase tracking-widest font-sans">
                टैक्स इनवॉइस डेस्क (Tax Invoice)
              </h3>
              <p className="text-[10px] text-gray-500">GST-Compliant Corporate Sales Portal</p>
            </div>
          </div>

          {/* Action tools panel */}
          <div className="flex items-center space-x-2">
            
            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.8 bg-gray-950 hover:bg-gray-850 hover:text-white text-gray-300 border border-gray-800 rounded-xl transition flex items-center space-x-1.5 font-bold cursor-pointer"
            >
              <Download className="h-4 w-4 text-emerald-500" />
              <span className="hidden sm:inline">डाउनलोड PDF</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.8 bg-gray-950 hover:bg-gray-850 hover:text-white text-gray-300 border border-gray-800 rounded-xl transition flex items-center space-x-1.5 font-bold cursor-pointer"
            >
              <Printer className="h-4 w-4 text-sky-450" />
              <span className="hidden sm:inline">प्रिंट करें</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="px-3 py-1.8 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 rounded-xl transition flex items-center space-x-1.5 font-bold cursor-pointer"
            >
              <Share2 className="h-4 w-4 stroke-[2.5]" />
              <span>WhatsApp</span>
            </button>

            {/* Close button */}
            <button 
              onClick={onClose}
              className="p-1.5 bg-gray-950/60 hover:bg-gray-850 text-gray-400 hover:text-white rounded-full transition cursor-pointer ml-3"
            >
              <X className="h-4.5 w-4.5" />
            </button>

          </div>
        </div>

        {/* Paper Container Canvas (Corporate style) */}
        <div className="p-4 sm:p-8 bg-gray-950 overflow-y-auto flex-1">
          
          <div 
            id="printable-tax-invoice-card"
            ref={printRef}
            className="bg-white text-gray-900 mx-auto max-w-3xl border border-gray-200 shadow-xl p-6 sm:p-10 rounded-2xl relative font-sans leading-relaxed selection:bg-emerald-200 selection:text-black [color-scheme:light]"
          >
            {/* Emerald Corporate top header bar line */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-600 to-teal-500" />

            {/* Section A: Header Details */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-gray-150">
              
              {/* Business specs */}
              <div className="space-y-2 max-w-md">
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 bg-emerald-600 flex items-center justify-center rounded-xl text-white font-black text-lg shadow-sm">
                    {profile.businessName.charAt(0) || 'B'}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-950 uppercase tracking-tight leading-none">{profile.businessName}</h1>
                    <p className="text-[9.5px] text-gray-550 font-extrabold uppercase tracking-widest mt-1">
                      {profile.ownerName ? `Prop: ${profile.ownerName}` : 'Engineering Fabrications'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-gray-600 font-sans">
                  {profile.address && (
                    <div className="flex items-start">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mr-1.5 mt-0.5" />
                      <span>{profile.address}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center">
                      <Phone className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                      <span>Phone: +91 {profile.phone}</span>
                    </div>
                  )}
                  {profile.gstNumber && profile.isRegisteredGST && (
                    <div className="inline-block bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold text-emerald-800 mt-1">
                      GSTIN: {profile.gstNumber} (State: Uttar Pradesh, Code: 09)
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice specific specs */}
              <div className="text-left sm:text-right space-y-2 self-stretch sm:self-auto flex flex-col justify-between sm:items-end">
                <div className="inline-block bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-500/10 text-right">
                  <span className="text-[9.5px] text-emerald-700 block font-black uppercase tracking-wider font-mono">कर बीजक</span>
                  <span className="text-[13px] font-black text-emerald-950 block select-all">TAX INVOICE</span>
                </div>
                
                <div className="text-xs space-y-1 text-gray-600 font-mono">
                  <div><strong className="text-gray-900 font-sans">इनवॉइस संख्या:</strong> #{invoice.invoiceNumber}</div>
                  <div><strong className="text-gray-900 font-sans">दिनांक (Date):</strong> {invoice.date}</div>
                  <div><strong className="text-gray-900 font-sans">देय तिथि (Due Date):</strong> {invoice.dueDate}</div>
                  {invoice.isGstApplied && invoice.gstType && (
                    <div>
                      <strong className="text-gray-900 font-sans">टैक्स प्रकार:</strong> 
                      <span className="bg-gray-100 border px-1.5 py-0.2 rounded font-black text-[9.5px]">
                        {invoice.gstType === 'CGST_SGST' ? 'Intrastate CGST+SGST' : 'Interstate IGST'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Section B: Client information */}
            <div className="bg-gray-50 border border-gray-150 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              
              <div>
                <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider font-mono">क्रेता विवरण (Bill To Purchaser)</span>
                <div className="flex items-start space-x-2.5 mt-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-sm font-black shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-950 select-all">{clientName}</h4>
                    {(clientMatch as any)?.address && <p className="text-xs text-gray-550 mt-1">{(clientMatch as any).address}</p>}
                    <span className="inline-block bg-gray-200/50 text-[9px] font-bold px-2 py-0.5 mt-1 rounded text-gray-700">Type: {clientType}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end text-left md:text-right space-y-1 text-xs">
                {clientMatch?.phone && (
                  <div>
                    <span className="text-gray-500">दूरभाष (Mobile):</span>
                    <strong className="text-gray-900 ml-1.5 select-all">+91 {clientPhone}</strong>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">आपूर्ति का राज्य (Place of Supply):</span>
                  <strong className="text-gray-950 ml-1.5 font-bold font-mono">
                    {invoice.gstType === 'IGST' ? 'OUT OF STATE (IGST)' : 'UTTAR PRADESH (09)'}
                  </strong>
                </div>
              </div>

            </div>

            {/* Section C: Item list / Service Table */}
            <div className="mt-8">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-950 bg-gray-50 text-gray-700 uppercase font-mono text-[9px] font-bold">
                    <th className="py-2.5 pl-2">क्रसं</th>
                    <th className="py-2.5 pl-2 leading-tight">विवरण आइटम/सेवा (Item Details)</th>
                    <th className="py-2.5 text-center leading-tight">HSN Code</th>
                    <th className="py-2.5 text-center leading-tight">मात्रा (Qty)</th>
                    <th className="py-2.5 text-right pr-3 leading-tight">दर (Rate)</th>
                    {invoice.isGstApplied && (
                      <th className="py-2.5 text-center leading-tight">जीएसटी दर (GST Rate)</th>
                    )}
                    <th className="py-2.5 text-right pr-2">कुल योग (Total)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items.map((item, index) => {
                    const itemBase = item.rate * item.quantity;
                    const itemGst = invoice.isGstApplied ? (itemBase * (item.gstPercent || 0)) / 100 : 0;
                    const itemTotalAmt = itemBase + itemGst;

                    return (
                      <tr key={index} className="hover:bg-gray-50/40">
                        <td className="py-3 pl-2 font-mono text-gray-550">{index + 1}</td>
                        <td className="py-3 pl-2">
                          <span className="font-extrabold text-[#0F172A] text-sm block">{item.name}</span>
                          <span className="text-[10px] text-gray-500 italic">Central sales compliant business item billing</span>
                        </td>
                        <td className="py-3 text-center text-gray-700 font-mono font-medium">
                          {item.hsn || '7308'}
                        </td>
                        <td className="py-3 text-center text-gray-700 font-mono font-medium">
                          {item.quantity} {item.unit || 'Pcs'}
                        </td>
                        <td className="py-3 text-right pr-3 text-gray-700 font-mono">
                          ₹{(item.rate ?? 0).toLocaleString('en-IN')}
                        </td>
                        
                        {/* GST Display Column */}
                        {invoice.isGstApplied && (
                          <td className="py-3 text-center font-mono">
                            <span className="text-gray-800 font-bold block">{item.gstPercent}%</span>
                            <span className="text-[9.5px] text-gray-550 block">₹{(itemGst ?? 0).toLocaleString('en-IN')}</span>
                          </td>
                        )}

                        <td className="py-3 text-right pr-2 font-black text-gray-950 font-mono">
                          ₹{(itemTotalAmt ?? 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations and Terms row split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-200">
              
              {/* Left Column: Bank specs and Conditions */}
              <div className="space-y-4">
                
                {/* Bank Details Panel */}
                <div className="bg-gray-50/80 border border-gray-150 p-3.5 rounded-xl text-[10.5px] space-y-1.5">
                  <h5 className="font-black text-gray-800 uppercase tracking-widest text-[9px] font-mono border-b border-gray-150/60 pb-1 flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mr-1" />
                    <span>बैंक खाता विवरण (Bank Details)</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-gray-650">
                    <div>बैंक का नाम (Bank):</div>
                    <strong className="text-gray-900 text-right">{profile.bankName}</strong>

                    <div>खाता संख्या (A/C No):</div>
                    <strong className="text-gray-900 font-mono text-right select-all">{profile.accountNumber}</strong>

                    <div>IFSC कोड:</div>
                    <strong className="text-gray-900 font-mono text-right select-all">{profile.ifscCode}</strong>

                    {profile.upiId && (
                      <>
                        <div>UPI आईडी:</div>
                        <strong className="text-emerald-700 font-mono text-right select-all truncate">{profile.upiId}</strong>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Conditions */}
                <div className="space-y-1 text-[10.5px] text-gray-500 font-sans leading-relaxed">
                  <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider font-mono">नोट्स एवं निबंधन (Terms & Instructions)</span>
                  <p>1. सभी बिलों का भुगतान नियत तिथि के भीतर होना अनिवार्य है।</p>
                  <p>2. वारंटी सीधे विनिर्माता के नियमों सर्तों के अनुसार लागू होगी।</p>
                  <p className="italic text-gray-650 mt-1 select-all font-serif">"{invoice.notes}"</p>
                </div>

              </div>

              {/* Right Column: Financial Calculation sheet */}
              <div className="space-y-4">
                
                {/* Detailed financial spreadsheet card */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4.5 space-y-2 text-xs">
                  
                  {/* Base charge subtotal before tax */}
                  <div className="flex justify-between text-gray-600">
                    <span>कच्चा मूल्य योग (Subtotal):</span>
                    <span className="font-bold text-gray-900 font-mono">₹{(subtotal ?? 0).toLocaleString('en-IN')}</span>
                  </div>

                  {/* GST SPLIT CGST+SGST or IGST */}
                  {invoice.isGstApplied && (
                    <div className="border-t border-gray-150/40 pt-1.5 space-y-1 bg-gray-100/30 p-2 rounded-lg">
                      {invoice.gstType === 'IGST' ? (
                        <div className="flex justify-between text-[11px] text-teal-800">
                          <span>एकीकृत जीएसटी (IGST @ 100%):</span>
                          <span className="font-mono font-bold">₹{(totalGst ?? 0).toLocaleString('en-IN')}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-[10.5px] text-teal-800">
                            <span>केंद्रीय जीएसटी (CGST @ 50%):</span>
                            <span className="font-mono font-semibold">₹{((totalGst ?? 0) / 2).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-[10.5px] text-teal-800">
                            <span>राज्य जीएसटी (SGST @ 50%):</span>
                            <span className="font-mono font-semibold">₹{((totalGst ?? 0) / 2).toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {discount > 0 && (
                    <div className="flex justify-between text-rose-650">
                      <span>छूट डिस्काउंट (Discount Amt):</span>
                      <strong className="font-mono text-rose-650">- ₹{(discount ?? 0).toLocaleString('en-IN')}</strong>
                    </div>
                  )}

                  {/* Invoiced aggregate amount */}
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-gray-950 font-black text-[13px]">
                    <span className="uppercase">कुल कर-युक्त देय (Grand Total):</span>
                    <span className="font-black text-gray-950 font-mono text-[14px]">₹{(grandTotal ?? 0).toLocaleString('en-IN')}</span>
                  </div>

                  {/* Amount paid */}
                  <div className="flex justify-between text-emerald-800 border-t border-dashed border-gray-200 pt-2 font-semibold">
                    <span>प्राप्त जमा राशि (Paid Amount):</span>
                    <strong className="font-mono text-emerald-700">₹{(invoice.paidAmount ?? 0).toLocaleString('en-IN')}</strong>
                  </div>

                  {/* Outstanding balance */}
                  <div className="flex justify-between border-t-2 border-solid border-gray-300 pt-2 text-amber-900 font-extrabold text-[13.5px]">
                    <span className="uppercase tracking-wide font-mono">शेष बकाया (Outstanding):</span>
                    <span className="text-[15.5px] font-black font-mono">₹{(balanceOutstanding ?? 0).toLocaleString('en-IN')}</span>
                  </div>

                </div>

                {/* Real-time UPI QR Code Generator display */}
                {profile.upiId && balanceOutstanding > 0 && (
                  <div className="bg-[#FAF9F5] border border-amber-500/10 rounded-2xl p-3 flex items-center space-x-3">
                    <div className="bg-white p-1 rounded-xl border border-gray-150 shrink-0">
                      <img 
                        src={qrCodeUrl} 
                        alt="Scan to Pay QR"
                        width={68}
                        height={68}
                        className="object-contain"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest font-mono block">UPI SCAN TO PAY</span>
                      <p className="text-[9px] text-gray-550 mt-0.5 leading-snug">
                        इस इनवॉइस की बकाया देय राशि <strong className="text-gray-900">₹{(balanceOutstanding ?? 0).toLocaleString('en-IN')}</strong> को तुरंत PhonePe या GPay से चुकाने के लिए यहाँ स्कैन करें।
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Signature Block */}
            <div className="flex justify-between items-end mt-12 pt-8 border-t border-gray-150">
              <div className="text-[9px] text-gray-400 leading-relaxed max-w-sm">
                <p>• यह एक विधिमान्य कम्प्यूटरीकृत जीएसटी बीजक (Tax Invoice) है।</p>
                <p>• सामान की डिलेवरी आपूर्ति के नियम क्रेता के रिस्क पर होंगे।</p>
                <p>• सभी न्यायक्षेत्र Aligarh स्थानीय न्यायालय के अधीन होंगे।</p>
              </div>
              
              <div className="text-right space-y-4 shrink-0">
                {profile.signatureText && (
                  <p className="font-mono italic text-[14px] text-emerald-700 pr-2 select-none">
                    {profile.signatureText}
                  </p>
                )}
                <div className="border-t border-gray-900 pt-1 w-44 text-center">
                  <span className="text-[9.5px] text-gray-700 block uppercase font-bold tracking-widest leading-none">अधिकृत हस्ताक्षर</span>
                  <span className="text-[7.5px] text-gray-400 block tracking-wider font-mono mt-1">Authorized Seal Signature</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
