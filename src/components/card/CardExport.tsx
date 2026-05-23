import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { CardData, BoldTemplate, MinimalTemplate, ClassicTemplate, ColorfulTemplate, ProfessionalTemplate, DesiTemplate } from './CardTemplates';
import useAppStore from '../../store';
import { Download, Share2, Eye, EyeOff, Sparkles, CheckCircle2, Crown, BadgePercent } from 'lucide-react';
import { toast } from 'react-hot-toast';


interface CardExportProps {
  data: CardData;
  templateId: 'bold' | 'minimal' | 'classic' | 'colorful' | 'professional' | 'desi';
}

export default function CardExport({ data, templateId }: CardExportProps) {

  const { subscription, setSubscription } = useAppStore();
  const [exportSize, setExportSize] = useState<'whatsapp' | 'instagram' | 'facebook'>('whatsapp');
  const [downloading, setDownloading] = useState(false);
  const hiddenRenderRef = useRef<HTMLDivElement>(null);

  // Determine export sizes configurations
  const sizeConfig = {
    whatsapp: { label: 'WhatsApp Status / Story (High-Res 9:16)', width: 1080, height: 1920, ratio: '9/16', text: 'WhatsApp Status (1080 × 1920)' },
    instagram: { label: 'Instagram Square Feed Post (1:1)', width: 1080, height: 1080, ratio: '1/1', text: 'Instagram Square (1080 × 1080)' },
    facebook: { label: 'Facebook Timeline Cover (Wide Banner)', width: 820, height: 312, ratio: '820/312', text: 'Facebook Cover (820 × 312)' }
  };

  const activeConf = sizeConfig[exportSize];

  // Render the selected template inside the export container
  const renderSelectedTemplate = (props: { data: CardData; size: 'whatsapp' | 'instagram' | 'facebook'; showWatermark: boolean }) => {
    switch (templateId) {
      case 'bold':
        return <BoldTemplate {...props} />;
      case 'minimal':
        return <MinimalTemplate {...props} />;
      case 'classic':
        return <ClassicTemplate {...props} />;
      case 'colorful':
        return <ColorfulTemplate {...props} />;
      case 'professional':
        return <ProfessionalTemplate {...props} />;
      case 'desi':
        return <DesiTemplate {...props} />;
      default:
        return <BoldTemplate {...props} />;
    }
  };

  const triggerDownloadPNG = async () => {
    if (!hiddenRenderRef.current) return;
    setDownloading(true);
    const toastId = toast.loading(`${activeConf.text} Image बन रही है, कृपया प्रतीक्षा करें...`);

    try {
      // Small timeout to allow styles/fonts to paint correctly
      await new Promise(resolve => setTimeout(resolve, 350));

      const canvas = await html2canvas(hiddenRenderRef.current, {
        width: activeConf.width,
        height: activeConf.height,
        scale: 1, // Exact target physical size
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${data.businessName.replace(/\s+/g, '_')}_VisitingCard_${exportSize}.png`;
      link.href = imgData;
      link.click();

      toast.success('🎉 कार्ड सफलतापूर्वक डाउनलोड हो गया है! अब आप इसे गैलरी से WhatsApp या Instagram पर शेयर कर सकते हैं।', {
        id: toastId,
        duration: 5000
      });
    } catch (err: any) {
      console.error('html2canvas generate failed:', err);
      toast.error(`तस्वीर डाउनलोड करने में विफलता: ${err.message || 'Unknown code issue'}`, { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsAppShareTextOnly = () => {
    const boldText = `*${data.businessName}* 
_"${data.tagline}"_

👤 *मालिक:* ${data.ownerName}
📞 *मोबाइल:* ${data.phone}
📍 *पत्ता:* ${data.address}

*हमारी उत्कृष्ट सेवाएं:*
${data.specialties.map((s, idx) => `✅ ${idx + 1}. ${s}`).join('\n')}

${data.upiId ? `💳 *UPI Payments:* ${data.upiId}` : ''}

_Created via BillKaro Studio_`;

    const encodedText = encodeURIComponent(boldText);
    const url = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(url, '_blank');
    toast.success('WhatsApp शेयर टेक्स्ट फॉर्मेट क्लिपबोर्ड & सेंड के लिए तैयार!');
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl space-y-5 shadow-xl">
      <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
        <Download className="h-4.5 w-4.5 text-amber-500" />
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">
          डाउनलोड और शेयर (Exporter Studio)
        </h3>
      </div>

      {/* Subscription Watermark Toggle Area */}
      <div className="bg-gray-950 rounded-2xl p-4 border border-gray-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[9px] font-mono tracking-widest font-black uppercase text-gray-500 block">BILLKARO SECURE BRAND</span>
          <div className="flex items-center space-x-1.5 mt-1">
            {subscription === 'PRO' ? (
              <>
                <Crown className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                <span className="text-xs font-black text-amber-400 uppercase">PRO VIP Plan: NO Watermark ACTIVATED!</span>
              </>
            ) : (
              <>
                <BadgePercent className="h-4.5 w-4.5 text-emerald-500 shrink-0 animate-bounce" />
                <span className="text-xs font-black text-gray-300 uppercase">FREE Plan: Watermark "Made with BillKaro" Added</span>
              </>
            )}
          </div>
        </div>

        {subscription === 'FREE' ? (
          <button
            onClick={() => {
              setSubscription('PRO');
              toast.success('👑 Mubarak Ho! Pro Mode Active details upgraded. Watermark removed successfully!');
            }}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
          >
            Go PRO (Remove Watermark)
          </button>
        ) : (
          <button
            onClick={() => {
              setSubscription('FREE');
              toast.success('Plan demoted to FREE tier. Watermark restored.');
            }}
            className="text-gray-500 hover:text-white border border-gray-800 hover:border-gray-700 px-3 py-1 rounded-xl text-[9px] font-serif transition"
          >
            Downgrada Plan
          </button>
        )}
      </div>

      {/* Select layout export sizes */}
      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 block font-black uppercase tracking-wider font-mono">
          कार्ड शेयरिंग फॉर्मेट साइज चुनें (Select Target Platform Size)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['whatsapp', 'instagram', 'facebook'] as const).map((sizeKey) => {
            const active = exportSize === sizeKey;
            return (
              <button
                key={sizeKey}
                type="button"
                onClick={() => setExportSize(sizeKey)}
                className={`py-3 px-1.5 rounded-2xl text-center border text-[10.5px] font-black uppercase tracking-wider transition cursor-pointer select-none ${
                  active 
                    ? 'border-amber-500 bg-amber-500/5 text-amber-400 font-black' 
                    : 'border-slate-800 bg-[#0B0F1A] text-gray-400 hover:bg-slate-900'
                }`}
              >
                {sizeKey === 'whatsapp' ? '🟢 WhatsApp' : sizeKey === 'instagram' ? '📸 Instagram' : '🔵 Facebook'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action triggers */}
      <div className="space-y-3.5 pt-2">
        <button
          onClick={triggerDownloadPNG}
          disabled={downloading}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition shadow flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>{downloading ? 'Genereting PNG...' : 'Download Card Image (PNG में सेव करें)'}</span>
        </button>

        <button
          onClick={handleWhatsAppShareTextOnly}
          className="w-full bg-[#121625] hover:bg-slate-800 text-gray-300 font-extrabold border border-gray-800 py-3 rounded-2xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Share2 className="h-4 w-4 text-emerald-500" />
          <span>WhatsApp Text + Invite Share (WhatsApp सेंड)</span>
        </button>
      </div>

      {/* HIDDEN OFF-SCREEN CANVAS FOR HIGH-RES EXPORTING */}
      <div className="overflow-hidden h-0 w-0 absolute pointer-events-none z-[-9999]">
        <div
          ref={hiddenRenderRef}
          style={{
            width: `${activeConf.width}px`,
            height: `${activeConf.height}px`,
            minWidth: `${activeConf.width}px`,
            minHeight: `${activeConf.height}px`,
            maxHeight: `${activeConf.height}px`,
            maxWidth: `${activeConf.width}px`,
            fontSize: '44px', // base scale helper
          }}
          className="absolute left-0 top-0 overflow-hidden transform-none"
        >
          {renderSelectedTemplate({
            data,
            size: exportSize,
            showWatermark: subscription === 'FREE'
          })}
        </div>
      </div>
    </div>
  );
}
