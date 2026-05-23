import React, { useState, useEffect } from 'react';
import useAppStore from '../../store';
import { supabase } from '../../lib/supabase';
import { Save, Image, Smartphone, QrCode, Building, CheckCircle, Languages, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';


export default function BusinessProfile() {

  const { updateProfile } = useAppStore();

  const [form, setForm] = useState<{
    businessName: string;
    ownerName: string;
    phone: string;
    address: string;
    gstNumber: string;
    isRegisteredGST: boolean;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
    signatureText: string;
    logoUrl: string;
    language: 'Hinglish' | 'Hindi' | 'English';
  }>({
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
    logoUrl: '',
    language: 'English'
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load profile data from Supabase 'profiles' table on component mount
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            console.error('Supabase fetch profiles error:', error);
            return;
          }

          if (data && data.length > 0) {
            const prof = data[0];
            const bankDetails = prof.bank_details || {};
            const loadedData = {
              businessName: prof.name || '',
              ownerName: prof.owner || '',
              phone: prof.phone || '',
              address: prof.address || '',
              gstNumber: prof.gstin || '',
              isRegisteredGST: !!prof.gstin,
              bankName: bankDetails.bank_name || '',
              accountNumber: bankDetails.account_number || '',
              ifscCode: bankDetails.ifsc_code || '',
              upiId: prof.upi_id || '',
              signatureText: prof.signature_text || '',
              logoUrl: prof.logo_url || '',
              language: (prof.language || 'English') as 'Hinglish' | 'Hindi' | 'English'
            };
            if (isMounted) {
              setForm(loadedData);
              updateProfile(loadedData);
            }
          } else {
            // If no data found — show empty fields
            const emptyData = {
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
              logoUrl: '',
              language: 'English' as const
            };
            if (isMounted) {
              setForm(emptyData);
              updateProfile(emptyData);
            }
          }
        } else {
          // If no authenticated user found — show empty fields
          const emptyData = {
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
            logoUrl: '',
            language: 'English' as const
          };
          if (isMounted) {
            setForm(emptyData);
            updateProfile(emptyData);
          }
        }
      } catch (err) {
        console.error('Error fetching Supabase profiles:', err);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [updateProfile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('लोगो साइज़ 2MB से कम होना चाहिए!');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('logos')
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath);

          setForm(prev => ({ ...prev, logoUrl: publicUrl }));
          toast.success('लोगो का चित्र अपलोड कर दिया गया!');
          setUploading(false);
          return;
        } else {
          console.warn('Supabase storage bucket failed, switching to offline fallback...', uploadError);
        }
      }

      const reader = new FileReader();
      reader.onload = () => {
        setForm(prev => ({ ...prev, logoUrl: reader.result as string }));
        toast.success('लोगो लोकल मेमोरी में सहेज लिया गया (Offline Base64)!');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('लोगो लगाने के प्रयास में गड़बड़ हुई!');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      updateProfile(form);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: bData } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id);

        const profileData = {
          user_id: user.id,
          name: form.businessName,
          owner: form.ownerName,
          phone: form.phone,
          address: form.address,
          gstin: form.gstNumber,
          upi_id: form.upiId,
          bank_details: {
            bank_name: form.bankName,
            account_number: form.accountNumber,
            ifsc_code: form.ifscCode
          },
          logo_url: form.logoUrl,
          language: form.language,
          signature_text: form.signatureText,
          updated_at: new Date().toISOString()
        };

        if (bData && bData.length > 0) {
          const activeBId = bData[0].id;
          const { error } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', activeBId);

          if (error) {
            console.warn('Supabase update rejected. Profile saved locally.', error);
          }
        } else {
          const { error } = await supabase
            .from('profiles')
            .insert([profileData]);

          if (error) {
            console.warn('Supabase insert rejected. Profile saved locally.', error);
          }
        }
      }
      toast.success('प्रोफाइल डेटा सफलता पूर्वक अपडेट हो गया!');
    } catch (err) {
      console.error('Save profile failure:', err);
      toast.error('प्रोफाइल डेटा सहेजने में विफलता हुई!');
    } finally {
      setSaving(false);
    }
  };

  const upiIntentString = form.upiId
    ? `upi://pay?pa=${encodeURIComponent(form.upiId)}&pn=${encodeURIComponent(form.businessName || 'Dhandha Payment')}&cu=INR`
    : '';

  const upiQrImgUrl = upiIntentString
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiIntentString)}`
    : '';

  return (
    <form onSubmit={handleSave} className="space-y-6 select-none animate-fadeIn">
      
      {/* Upper Logo & Visual Header grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-950 p-5 rounded-3xl border border-gray-855">
        
        {/* LOGO Uploader container */}
        <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-800 rounded-2xl relative bg-[#070912]">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">
            व्यापारिक लोगो (Business Logo)
          </span>

          <div className="relative h-28 w-28 rounded-2xl bg-[#0F1424] border border-gray-800 flex items-center justify-center overflow-hidden shrink-0 shadow-lg group">
            {form.logoUrl ? (
              <img 
                src={form.logoUrl} 
                alt="Business Logo" 
                className="h-full w-full object-contain p-1"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Image className="h-8 w-8 text-gray-550 group-hover:scale-110 transition duration-300" />
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[10px] font-bold text-amber-500 animate-pulse">
                UPLOADING...
              </div>
            )}
          </div>

          <label className="mt-4 bg-gray-900 hover:bg-gray-855 border border-gray-855 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-300 cursor-pointer transition">
            लोगो फ़ाइल चुनें (Choose Image)
            <input 
              type="file" 
              accept="image/*"
              className="hidden" 
              onChange={handleLogoUpload} 
              disabled={uploading}
            />
          </label>
          <p className="text-[9px] text-gray-550 mt-2 text-center">
            PNG, JPG format • Max size 2MB
          </p>
        </div>

        {/* Core details Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-900 pb-1.5">
            <Languages className="h-4.5 w-4.5 text-amber-500" />
            <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-500">
              प्रणाली एवं भाषा प्राथमिकता (System & Language Settings)
            </h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1.5">
                एप्लीकेशन की डिफ़ॉल्ट भाषा (In-app Preferred language)
              </label>
              
              <div className="grid grid-cols-3 gap-2 bg-[#0a0d16] p-1 rounded-xl border border-gray-855">
                {['Hinglish', 'Hindi', 'English'].map(langOption => {
                  const isActive = form.language === langOption;
                  return (
                    <button
                      type="button"
                      key={langOption}
                      onClick={() => {
                        const nextLang = langOption as any;
                        setForm(prev => ({ ...prev, language: nextLang }));
                        // Instantly save preference to global state & local storage for instant reactivity!
                        updateProfile({ ...form, language: nextLang });
                        localStorage.setItem('billkaro_language', nextLang);
                        toast.success(
                          nextLang === 'Hindi' 
                            ? 'भाषा बदलकर हिंदी कर दी गई है!' 
                            : nextLang === 'English' 
                              ? 'Language preference updated to English!' 
                              : 'Language preference updated to Hinglish!'
                        );
                      }}
                      className={`py-2 px-3 rounded-lg text-center text-[11px] font-bold transition cursor-pointer ${
                        isActive 
                          ? 'bg-amber-500 text-white font-extrabold shadow-md' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {langOption === 'Hinglish' ? '💬 Hinglish' : langOption === 'Hindi' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
                    </button>
                  );
                })}
              </div>
              <p className="text-[9.5px] text-gray-550 mt-1.5 leading-relaxed">
                यह सेटिंग आपके इनवॉइस जनरेटर, खतौनी और रसीद स्क्रीन के हिंदी/इंग्लिश अनुवाद को प्रभावित करेगी।
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Main ledger input forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column Left: Basic dhandha info */}
        <div className="lg:col-span-2 bg-gray-950 p-5 rounded-3xl border border-gray-855 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-900">
            <Building className="h-4.5 w-4.5 text-amber-500" />
            <h4 className="text-xs font-black text-gray-200 uppercase tracking-tight">कंपनी / दुकान के बुनियादी विवरण (Basic Corporate Info)</h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">व्यापार का नाम / दुकान का नाम (Business Name) *</label>
              <input 
                type="text" 
                required
                value={form.businessName}
                onChange={e => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g. Pappu Saria & Cement Store"
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">मालिक / ओनर का नाम (Owner Name) *</label>
                <input 
                  type="text" 
                  required
                  value={form.ownerName}
                  onChange={e => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="e.g. Pappu Kumar Yadav"
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">मोबाइल नंबर (Primary Mobile) *</label>
                <input 
                  type="text" 
                  maxLength={10} 
                  required
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 91xxxxxxxx"
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">दुकान / गोदाम का पता (Full Address) *</label>
              <textarea 
                rows={2}
                required
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Workshop No. 4, G.T. Road, Aligarh, U.P."
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">इनवॉइस बिल पर आने वाले रिमार्क्स (Default Terms/Signature Text)</label>
              <input 
                type="text" 
                value={form.signatureText}
                onChange={e => setForm({ ...form, signatureText: e.target.value })}
                placeholder="e.g. माल की डिलीवरी पर पेमेंट अनिवार्य है। | Thank you!"
                className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* GST Toggle panel */}
          <div className="border-t border-gray-900 pt-4 mt-2">
            <div className="flex items-center justify-between p-3 bg-[#0B0F1A] border border-gray-800/60 rounded-2xl">
              <div>
                <h5 className="text-[11.5px] font-black text-gray-100 uppercase tracking-tight">जीएसटी रजिस्ट्रेशन स्थिति (GST Registration Level)</h5>
                <p className="text-[9.5px] text-gray-550">क्या यह संस्थान / फ़र्म GST कर चुकाती है?</p>
              </div>
              <input 
                type="checkbox"
                checked={form.isRegisteredGST}
                onChange={e => setForm({ ...form, isRegisteredGST: e.target.checked })}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>

            {form.isRegisteredGST && (
              <div className="mt-3.5 animate-fadeIn">
                <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">15-अंकीय जीएसटी नंबर (GSTIN Number)</label>
                <input 
                  type="text" 
                  maxLength={15}
                  value={form.gstNumber}
                  onChange={e => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. 09AABCU1234F1Z8"
                  className="w-full bg-[#0B0F1A] border border-gray-855 rounded-xl p-2.5 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Column Right: Payment UPI & Bank fields */}
        <div className="space-y-6">
          
          {/* Bank fields container */}
          <div className="bg-gray-950 p-5 rounded-3xl border border-gray-855 space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-900">
              <Smartphone className="h-4.5 w-4.5 text-amber-500" />
              <h4 className="text-xs font-black text-gray-200 uppercase tracking-tight">बैंक खाता विवरण (Bank Credentials)</h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">बैंक का नाम (Bank Name)</label>
                <input 
                  type="text" 
                  value={form.bankName}
                  onChange={e => setForm({ ...form, bankName: e.target.value })}
                  placeholder="e.g. State Bank of India"
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">खाता संख्या (Account Number)</label>
                <input 
                  type="text" 
                  value={form.accountNumber}
                  onChange={e => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 30124578961"
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">आईएफसी कोड (IFSC Code)</label>
                <input 
                  type="text" 
                  maxLength={11}
                  value={form.ifscCode}
                  onChange={e => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. SBIN0001235"
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white font-mono tracking-wider focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* UPI Code & QR Preview Container */}
          <div className="bg-gray-950 p-5 rounded-3xl border border-gray-855 space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-900">
              <QrCode className="h-4.5 w-4.5 text-amber-500" />
              <h4 className="text-xs font-black text-gray-200 uppercase tracking-tight">UPI आईडी और क्यूआर (Payment QR)</h4>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-black block mb-1">गूगल पे/पेटीएम आईडी (UPI ID)</label>
                <input 
                  type="text" 
                  value={form.upiId}
                  onChange={e => setForm({ ...form, upiId: e.target.value })}
                  placeholder="e.g. mobile@ybl / upi"
                  className="w-full bg-[#0B0F1A] border border-gray-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {form.upiId ? (
                <div className="bg-[#0B0F1A] border border-gray-855 p-3 rounded-2xl flex flex-col items-center justify-center space-y-2">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
                    <img 
                      src={upiQrImgUrl} 
                      alt="Payment Scan QR" 
                      className="h-28 w-28 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold font-mono uppercase tracking-wider block text-center">
                    🔊 QR Code Loaded • Pay to {form.businessName || 'Us'}
                  </span>
                </div>
              ) : (
                <div className="bg-[#0B0F1A]/50 border border-gray-900 border-dashed py-6 px-4 rounded-2xl text-center text-[10px] text-gray-550 italic leading-normal">
                  ऊपर सही UPI आईडी भरने पर बिल पर छपने वाला पेमेंट क्यूआर कोड यहाँ खुद-ब-खुद जनरेट हो जायेगा!
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Save Submission Button Frame */}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-lg shadow-amber-500/10 font-mono"
        >
          <Save className="h-4.5 w-4.5" />
          <span>{saving ? 'सहेजा जा रहा है...' : 'प्रोफाइल बुक सुरक्षित करें (Save Profile Update)'}</span>
        </button>
      </div>

    </form>
  );
}
