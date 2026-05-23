import { Invoice, Quotation, InvoicePayment, Client, BusinessProfile } from '../types';
import toast from 'react-hot-toast';

/**
 * Sanitizes phone numbers to include 91 country prefix if missing
 */
function sanitizePhoneNumber(phone: string = ''): string {
  const clean = phone.replace(/\D/g, '');
  if (!clean) return '';
  if (clean.length === 10) {
    return `91${clean}`;
  }
  return clean;
}

/**
 * Shares a GST-compliant tax invoice details via WhatsApp Link
 */
export function shareInvoice(
  invoice: Invoice,
  businessName: string,
  client?: Client,
  profile?: BusinessProfile,
  pdfUrl?: string
): string {
  const clientName = client?.name || 'Customer';
  const clientPhone = sanitizePhoneNumber(client?.phone || '');
  const bizName = businessName || 'BillKaro Merchant';

  const whatsappMessage = 
`*Tax Invoice* 📄
*${bizName}*

Hello *${clientName}*! 👋
Your invoice details are provided below:

📋 *Invoice Number:* ${invoice.invoiceNumber}
📅 *Date:* ${invoice.date || ''}
⌛ *Due Date:* ${invoice.dueDate || ''}
${pdfUrl ? `\n📄 *Invoice PDF Link:* ${pdfUrl}` : ''}

-----------------------------------
`;

  const encodedText = encodeURIComponent(whatsappMessage);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${clientPhone}&text=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank');
  }
  return whatsappUrl;
}

/**
 * Shares a quotation details via WhatsApp
 */
export function shareQuotation(
  quotation: Quotation,
  client?: Client,
  profile?: BusinessProfile
): string {
  if (!quotation) {
    toast.error('Quotation data is unavailable!');
    return '';
  }

  const clientName = client?.name || 'Customer';
  const clientPhone = sanitizePhoneNumber(client?.phone || '');
  const bizName = profile?.businessName || 'BillKaro Merchant';

  const itemLinesStr = (quotation.items || []).map((it, idx) => 
    `🔸 ${idx + 1}. *${it.name}* (Qty: ${it.quantity} ${it.unit}) - ₹${((it.rate ?? 0) * (it.quantity ?? 0)).toLocaleString('en-IN')}`
  ).join('\n');

  const subtotal = (quotation.items || []).reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  const discount = quotation.discount || 0;
  const grandTotal = subtotal - discount;

  const whatsappMessage = 
`*Business Quotation* 📋
*${bizName}*

Hello *${clientName}*! 👋
Your estimated quotation is ready:

📋 *Quotation Number:* ${quotation.quoteNumber}
📅 *Date:* ${quotation.date || ''}
⌛ *Validity:* ${quotation.validityDays || 30} days

-----------------------------------
*Proposed Items:*
${itemLinesStr || 'No items'}

*Financial Summary:*
🔹 Subtotal: ₹${(subtotal ?? 0).toLocaleString('en-IN')}
🔹 Discount: ₹${(discount ?? 0).toLocaleString('en-IN')}
🌟 *Estimated Cost: ₹${(grandTotal ?? 0).toLocaleString('en-IN')}*

-----------------------------------
*Terms & Conditions:*
- Advance payment is required to commence work.
- This quotation is valid for ${quotation.validityDays || 30} days from the date of issue.

*We look forward to working with you!* ✨
💼 _${bizName}_
${profile?.phone ? `📞 Contact: ${profile.phone}` : ''}`;

  const encodedText = encodeURIComponent(whatsappMessage);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${clientPhone}&text=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank');
  }
  return whatsappUrl;
}

/**
 * Shares a receipt payment details via WhatsApp
 */
export function shareReceipt(
  payment: InvoicePayment,
  invoice?: Invoice,
  client?: Client,
  profile?: BusinessProfile
): string {
  if (!payment) {
    toast.error('Payment receipt data is unavailable!');
    return '';
  }

  const clientName = client?.name || 'Customer';
  const clientPhone = sanitizePhoneNumber(client?.phone || '');
  const bizName = profile?.businessName || 'BillKaro Merchant';
  const invNum = invoice?.invoiceNumber || 'INV-Reference';

  const whatsappMessage = 
`*Payment Receipt* 🧾
*${bizName}*

Hello *${clientName}*! 👋
We have successfully received your payment. Details are as follows:

🧾 *Receipt Number:* ${payment.receiptNumber}
📅 *Payment Date:* ${payment.date}
💳 *Payment Mode:* ${payment.mode}
📄 *Invoice Ref:* ${invNum}

💰 *Amount Received:* *₹${(payment.amount ?? 0).toLocaleString('en-IN')}*
${payment.notes ? `📝 *Notes:* ${payment.notes}` : ''}

Thank you for doing business with us! Wish you a successful journey ahead.

💼 _${bizName}_
${profile?.phone ? `📞 Contact: ${profile.phone}` : ''}`;

  const encodedText = encodeURIComponent(whatsappMessage);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${clientPhone}&text=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank');
  }
  return whatsappUrl;
}

/**
 * Shares the Digital Visiting Card
 */
export async function shareBusinessCard(
  imageBlob: Blob | string,
  profile?: BusinessProfile
): Promise<boolean> {
  const bizName = profile?.businessName || 'Business';
  const bizPhone = profile?.phone || '';
  const bizAddress = profile?.address || '';

  const fallbackText = 
`*Digital Business Card* 💳
*${bizName}*

Hello! Thank you for connecting with us. Here are our business contact details:

👤 *Owner:* ${profile?.ownerName || 'Merchant'}
📞 *Mobile Number:* ${bizPhone}
📍 *Business Address:* ${bizAddress}
💬 *Services:* We are committed to providing the best service and superior quality.

_Please save our contact details in your phone for future enquiries._ 🙏`;

  if (typeof window !== 'undefined' && navigator.share && imageBlob instanceof Blob) {
    try {
      const file = new File([imageBlob], 'business_card.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: bizName,
          text: fallbackText
        });
        toast.success('Business card shared successfully!');
        return true;
      }
    } catch (e) {
      console.warn('Navigator native file share rejected, carrying on with fallback messaging...', e);
    }
  }

  const clientPhone = sanitizePhoneNumber(bizPhone);
  const encodedText = encodeURIComponent(fallbackText);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank');
    toast.success('Digital business card details opened via WhatsApp share link!');
  }
  return true;
}
