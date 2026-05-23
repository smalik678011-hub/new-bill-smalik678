import React, { useState, useEffect } from 'react';
import useAppStore from '../store';
import { CardData, BoldTemplate, MinimalTemplate, ClassicTemplate, ColorfulTemplate, ProfessionalTemplate, DesiTemplate } from '../components/card/CardTemplates';
import CardEditor from '../components/card/CardEditor';
import CardExport from '../components/card/CardExport';
import { CreditCard, Palette, Layout, Sparkles, CheckCircle, Info, RefreshCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';


export default function BusinessCard() {

  const { profile, subscription } = useAppStore();

  // Create active customizable state initially populated with details from owner profile
  const [cardData, setCardData] = useState<CardData>({
    businessName: '',
    ownerName: '',
    phone: '',
    address: '',
    tagline: 'मजबूत काम, सही दाम और भरोसा!',
    specialties: [
      'Iron Gate, Grill & Railings Designer',
      'Specialist Steel Shed and Roof fitting',
      'Laser iron sheet Cutting and CNC design'
    ],
    upiId: ''
  });

  const [selectedTemplate, setSelectedTemplate] = useState<'bold' | 'minimal' | 'classic' | 'colorful' | 'professional' | 'desi'>('bold');
  const [previewSize, setPreviewSize] = useState<'whatsapp' | 'instagram' | 'facebook'>('whatsapp');

  // Trigger auto-fill on mount & store changes
  const fillFromProfile = () => {
    setCardData({
      businessName: profile.businessName || 'Mera Karobar',
      ownerName: profile.ownerName || 'Aman Sharma',
      phone: profile.phone || '9876543210',
      address: profile.address || 'Aligarh, India',
      tagline: 'मजबूत काम, सही दाम और भरोसा!',
      specialties: [
        'Iron Gate, Grill & Railings Designer',
        'Specialist Steel Shed and Roof fitting',
        'Laser iron sheet Cutting and CNC design'
      ],
      upiId: profile.upiId || ''
    });
    toast.success('प्रोफाइल डेटा से लाइव ऑटो-फिल हो गया है!');
  };

  useEffect(() => {
    fillFromProfile();
  }, [profile]);

  // Handle template renderer matching
  const renderLiveTemplate = () => {
    const props = {
      data: cardData,
      size: previewSize,
      showWatermark: subscription === 'FREE'
    };

    switch (selectedTemplate) {
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

  const templatesList = [
    { id: 'bold', name: 'Bold (Orange)', color: 'border-orange-500 bg-gray-950 text-orange-500' },
    { id: 'minimal', name: 'Minimal (White)', color: 'border-black bg-white text-black' },
    { id: 'classic', name: 'Classic (Gold/Navy)', color: 'border-[#e5c158] bg-[#0b1b3d] text-[#e5c158]' },
    { id: 'colorful', name: 'Colorful (Sunset)', color: 'border-pink-500 bg-gradient-to-r from-purple-800 to-amber-500 text-white' },
    { id: 'professional', name: 'Corporate (Blue)', color: 'border-blue-500 bg-slate-900 text-blue-400' },
    { id: 'desi', name: 'Desi (Saffron/Green)', color: 'border-orange-500 bg-[#fffdf6] text-emerald-800' }
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
              <CreditCard className="h-5 w-5 animate-pulse" />
            </div>
            <h2 className="text-base font-black text-gray-100 font-sans tracking-wide uppercase">
              प्रीमियम विज़िटिंग कार्ड स्टूडियो (Premium Visiting Card Maker)
            </h2>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            अपने व्यापार के लिए आधुनिक डिजिटल विज़िटिंग कार्ड डिज़ाइन करें। अलग-अलग सोशल मीडिया साइज में उच्च गुणवत्ता (PNG) डाउनलोड करें।
          </p>
        </div>

        <button
          onClick={fillFromProfile}
          className="bg-gray-900 border border-gray-800 text-gray-400 hover:text-white py-1.5 px-3.5 rounded-xl text-xs flex items-center space-x-1.5 transition select-none cursor-pointer self-start md:self-auto"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          <span>Reload Profile Data</span>
        </button>
      </div>

      {/* Main Grid: Customizer Sidebar + Preview Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls & Presets */}
        <div className="space-y-6">
          {/* Template Choice presets */}
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl space-y-3.5 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-gray-850 pb-2">
              <Palette className="h-4.5 w-4.5 text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-305">
                डिज़ाइन थीम चुनें (Select Template Preset)
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {templatesList.map(t => {
                const active = selectedTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t.id);
                      toast.success(`${t.name} थीम चुनी गयी!`);
                    }}
                    className={`p-3.5 rounded-2xl border text-center transition tracking-tight select-none cursor-pointer relative flex flex-col items-center justify-center space-y-1.5 ${
                      active ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-500/5' : 'border-gray-800 bg-[#0B0F1A]'
                    }`}
                  >
                    <div className={`h-6 w-12 rounded-lg border-2 ${t.color}`} />
                    <span className="text-[11px] font-black text-gray-200 mt-1">{t.name}</span>
                    {active && (
                      <div className="absolute top-1 right-2.5">
                        <span className="text-[9px] bg-amber-500 text-black px-1.5 rounded-full font-serif font-bold">Active</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Editor */}
          <CardEditor 
            data={cardData} 
            onChange={setCardData} 
            onReset={fillFromProfile}
          />

          {/* Export Panel */}
          <CardExport 
            data={cardData} 
            templateId={selectedTemplate}
          />
        </div>

        {/* RIGHT COLUMN: Realtime Live Mockup Canvas */}
        <div className="space-y-5 sticky top-6 lg:ml-2">
          
          <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <Layout className="h-4.5 w-4.5 text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-300">
                लाइव कार्ड मॉकअप (Mockup Preview)
              </h3>
            </div>

            {/* Sizes toggler purely for visual interactive previewing layout */}
            <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-850">
              {(['whatsapp', 'instagram', 'facebook'] as const).map(pk => (
                <button
                  key={pk}
                  onClick={() => setPreviewSize(pk)}
                  className={`px-3 py-1 rounded-lg text-[9.5px] font-black uppercase transition select-none cursor-pointer ${
                    previewSize === pk 
                      ? 'bg-amber-500 text-black font-extrabold shadow-sm' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {pk === 'whatsapp' ? 'Vertical 9:16' : pk === 'instagram' ? 'Square 1:1' : 'Facebook Banner'}
                </button>
              ))}
            </div>
          </div>

          {/* Scaled Preview Frame */}
          <div className="bg-[#0e1321]/60 border border-gray-850 p-[5%] rounded-3xl flex justify-center items-center shadow-inner relative overflow-hidden min-h-[350px] md:min-h-[480px]">
            <div className="absolute top-2 left-3 flex items-center space-x-1.5 opacity-60">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">Live Responsive Mockup Layout</span>
            </div>

            {/* Aspect frame wrapper to mimic the phone story, post or banner */}
            <div
              style={{
                width: '100%',
                maxWidth: previewSize === 'whatsapp' ? '280px' : previewSize === 'instagram' ? '380px' : '440px',
                aspectRatio: previewSize === 'whatsapp' ? '9/16' : previewSize === 'instagram' ? '1/1' : '820/312',
                fontSize: previewSize === 'facebook' ? '12px' : '15px' // proportional scale assist on preview text sizing
              }}
              className="rounded-2xl overflow-hidden shadow-2xl border border-white/5 animate-scaleUp text-[13px]"
            >
              {renderLiveTemplate()}
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-2xl flex items-center space-x-2.5 text-amber-500/90 text-center">
            <Info className="h-4.5 w-4.5 shrink-0" />
            <span className="text-[10.5px] leading-tight text-left">
              💡 <b>Tip:</b> डिज़ाइनिंग करने के बाद नीचे दिए गए बटन पर क्लिक करके high-quality PNG तस्वीर अपने फोन की गैलरी में सेव करें और WhatsApp Status पर लगाएं।
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
