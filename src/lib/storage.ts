import { supabase } from './supabase';

export async function uploadInvoicePDF(
  pdfBlob: Blob,
  invoiceNumber: string,
  businessName: string
): Promise<string | null> {
  try {
    const fileName = `${businessName.replace(/\s+/g, '_')}/${invoiceNumber}_${Date.now()}.pdf`;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Error in uploadInvoicePDF:', err);
    return null;
  }
}
